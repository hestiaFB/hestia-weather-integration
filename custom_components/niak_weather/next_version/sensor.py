"""What Hestia Weather computes, as sensors for automations (heating, shutters, watering…)."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.const import PERCENTAGE, UnitOfPrecipitationDepth, UnitOfPressure, UnitOfSpeed, UnitOfTemperature, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import slugify

from .engine import legacy
from .const import DOMAIN
from .coordinator import HestiaWeatherConfigEntry, HestiaWeatherCoordinator, Snapshot
from .engine import families, water
from .engine.catalogue import CONDITIONS, DRYING, VIGILANCE, Item
from .engine.feel import Alert
from .engine.moisture import humidex

ALERTS = ["none", *(a.value for a in Alert)]
# Entity ids that say what they are, the same in every home: sensor.hestia_weather_ressenti, sensor.hestia_weather_pluie_24h…
# (homes set up under the former name keep their ids: legacy.ENTITY_ROOT)
OBJECT_IDS = {"feels_like": "ressenti", "dew_point": "point_de_rosee", "frost_point": "point_de_givre", "humidex": "humidex", "alert": "alerte",
              "brief": "en_bref", "bulletin": "bulletin_du_jour", "next_rain": "pluie_dans", "pressure_trend": "tendance_pression", "rain_24h": "pluie_24h",
              "max_gust_today": "rafale_max_jour", "temperature_trend": "tendance_temperature"}


def _bulletin(s: Snapshot) -> dict[str, Any]:
    return s.view.get("bulletin") or {}


def _feels(s: Snapshot) -> float | None:
    return s.local.feel.value if s.local.available else None


def _humidex(s: Snapshot) -> float | None:
    # The engine keeps the humidex only when it raises the feel; the sensor always gives it, like Thermal Comfort.
    w = s.local
    return round(humidex(w.temperature, w.dew_point), 1) if w.temperature is not None and w.dew_point is not None else None


def _rain_24h(s: Snapshot) -> float | None:
    if s.local.rain.last_24h is not None:
        return s.local.rain.last_24h
    return s.derived.recent.value if s.derived else None


def _max_gust(s: Snapshot) -> float | None:
    if s.local.wind.max_today is not None:
        return s.local.wind.max_today
    return s.derived.gust_max.value if s.derived and s.derived.gust_max else None


def _next_rain_hours(s: Snapshot) -> float | None:
    # Hours to the tenth: to the minute from Météo-France's radar, from the hour's start in the hourly forecast.
    minutes = s.rain_ahead.get("minutes")
    return round(minutes / 60, 1) if minutes is not None else None


def _next_rain_attributes(s: Snapshot) -> dict[str, Any]:
    ahead = s.rain_ahead
    return {"amount": ahead.get("amount"), "minutes": ahead.get("minutes"), "precision": ahead.get("precision"),
            "source": ahead.get("source"), "dry_until": ahead.get("dry_until")}


def _temperature_trend(s: Snapshot) -> float | None:
    if s.local.temperature_trend is not None:
        return s.local.temperature_trend
    return s.derived.temperature_trend if s.derived else None


@dataclass(frozen=True, kw_only=True)
class HestiaSensorDescription(SensorEntityDescription):
    value: Callable[[Snapshot], Any]
    attributes: Callable[[Snapshot], dict[str, Any]] | None = None


SENSORS: tuple[HestiaSensorDescription, ...] = (
    HestiaSensorDescription(
        key="feels_like", translation_key="feels_like", device_class=SensorDeviceClass.TEMPERATURE, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS, suggested_display_precision=1, value=_feels,
        attributes=lambda s: {"base": s.local.feel.base, "word": s.local.feel.word, "phrase": s.local.feel.phrase,
                              "wind_effect": s.local.feel.effects.wind, "sun_effect": s.local.feel.effects.sun,
                              "rain_effect": s.local.feel.effects.rain, "clear_night_effect": s.local.feel.effects.night}),
    HestiaSensorDescription(
        key="dew_point", translation_key="dew_point", device_class=SensorDeviceClass.TEMPERATURE, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS, suggested_display_precision=1, value=lambda s: s.local.dew_point),
    HestiaSensorDescription(
        key="frost_point", translation_key="frost_point", device_class=SensorDeviceClass.TEMPERATURE, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS, suggested_display_precision=1, value=lambda s: s.local.frost_point),
    HestiaSensorDescription(
        key="humidex", translation_key="humidex", state_class=SensorStateClass.MEASUREMENT, suggested_display_precision=1,
        value=lambda s: _humidex(s)),
    HestiaSensorDescription(
        key="alert", translation_key="alert", device_class=SensorDeviceClass.ENUM, options=ALERTS,
        value=lambda s: s.local.alert.value if s.local.alert else "none", attributes=lambda s: {"level": s.local.level.value}),
    HestiaSensorDescription(
        key="brief", translation_key="brief", value=lambda s: s.brief.title[:255],
        attributes=lambda s: {"level": s.brief.label, "severity": s.brief.severity, "summary": s.brief.summary,
                              "points": [{"key": p.key, "group": p.group, "severity": p.severity, "text": p.text} for p in s.brief.signals],
                              # The day's bulletin, as the card writes it: « Ce soir et cette nuit, pluie jusqu’à 20 h (3 mm)… »
                              "bulletin": (s.view.get("bulletin") or {}).get("summary")}),
    # The day's bulletin on its own, to read aloud or send: the state stops at 255 characters, the attribute keeps it whole.
    HestiaSensorDescription(
        key="bulletin", translation_key="bulletin", value=lambda s: (_bulletin(s).get("summary") or "")[:255] or None,
        attributes=lambda s: {"text": _bulletin(s).get("summary"),
                              "periods": [{"label": p.get("label"), "text": p.get("text")} for p in _bulletin(s).get("periods", ())]}),
    HestiaSensorDescription(
        key="next_rain", translation_key="next_rain", device_class=SensorDeviceClass.DURATION, native_unit_of_measurement=UnitOfTime.HOURS,
        value=_next_rain_hours, attributes=_next_rain_attributes),
    HestiaSensorDescription(
        key="pressure_trend", translation_key="pressure_trend", device_class=SensorDeviceClass.PRESSURE, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPressure.HPA, suggested_display_precision=1, value=lambda s: s.local.pressure_trend.change,
        attributes=lambda s: {"direction": s.local.pressure_trend.direction.value if s.local.pressure_trend.direction else None,
                              "text": s.local.pressure_trend.text, "minutes": s.local.pressure_trend.minutes}),
    HestiaSensorDescription(
        key="rain_24h", translation_key="rain_24h", device_class=SensorDeviceClass.PRECIPITATION, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPrecipitationDepth.MILLIMETERS, suggested_display_precision=1, value=_rain_24h,
        attributes=lambda s: {"partial": _rain_24h(s) is not None and s.local.rain.last_24h is None and bool(s.derived) and s.derived.recent.partial}),
    HestiaSensorDescription(
        key="max_gust_today", translation_key="max_gust_today", device_class=SensorDeviceClass.WIND_SPEED, state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR, suggested_display_precision=0, value=_max_gust,
        attributes=lambda s: {"partial": s.local.wind.max_today is None and bool(s.derived and s.derived.gust_max) and s.derived.gust_max.partial}),
    HestiaSensorDescription(
        key="temperature_trend", translation_key="temperature_trend", state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement="°C/h", suggested_display_precision=1, value=_temperature_trend),
)


def item_attributes(item: Item) -> dict[str, Any]:
    """The same attributes on every entity of the catalogue: why, from where, when, and whether data was missing."""
    attributes: dict[str, Any] = {"raison": item.reason, "source": item.source}
    if item.start:
        attributes["debut"] = item.start.isoformat()
    if item.end:
        attributes["fin"] = item.end.isoformat()
    return {**attributes, "partiel": item.partial, **item.extra}


@dataclass(frozen=True, kw_only=True)
class CatalogueSensorDescription(SensorEntityDescription):
    """An entry of the catalogue whose value is a number or a word. The key is also its entity id: sensor.hestia_weather_<key>."""


_MM = {"device_class": SensorDeviceClass.PRECIPITATION, "native_unit_of_measurement": UnitOfPrecipitationDepth.MILLIMETERS,
       "suggested_display_precision": 1, "state_class": SensorStateClass.MEASUREMENT}
_CELSIUS = {"device_class": SensorDeviceClass.TEMPERATURE, "native_unit_of_measurement": UnitOfTemperature.CELSIUS, "suggested_display_precision": 0,
            "state_class": SensorStateClass.MEASUREMENT}
_INDEX = {"state_class": SensorStateClass.MEASUREMENT, "suggested_display_precision": 0}
_DEGREE_DAYS = {"native_unit_of_measurement": "DJU", "state_class": SensorStateClass.MEASUREMENT, "suggested_display_precision": 1}

# Grouped as in the documentation: Maintenant, Alertes, Prochaines heures, Jardin, Bâtiment, Énergie, Vie pratique.
CATALOGUE_SENSORS: tuple[CatalogueSensorDescription, ...] = (
    CatalogueSensorDescription(key="temps_observe", translation_key="temps_observe", device_class=SensorDeviceClass.ENUM, options=list(CONDITIONS)),
    CatalogueSensorDescription(key="vigilance", translation_key="vigilance", device_class=SensorDeviceClass.ENUM, options=list(VIGILANCE)),
    CatalogueSensorDescription(key="pluie_heure", translation_key="pluie_heure", **_MM),
    CatalogueSensorDescription(key="pluie_6h", translation_key="pluie_6h", **_MM),
    CatalogueSensorDescription(key="pluie_24h_prevue", translation_key="pluie_24h_prevue", **_MM),
    CatalogueSensorDescription(key="minimale_nuit", translation_key="minimale_nuit", **_CELSIUS),
    CatalogueSensorDescription(key="maximale_demain", translation_key="maximale_demain", **_CELSIUS),
    CatalogueSensorDescription(key="rafales_6h", translation_key="rafales_6h", device_class=SensorDeviceClass.WIND_SPEED, state_class=SensorStateClass.MEASUREMENT,
                               native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR, suggested_display_precision=0, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="pluie_7j", translation_key="pluie_7j", **_MM, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="restrictions_eau", translation_key="restrictions_eau", device_class=SensorDeviceClass.ENUM,
                               options=list(water.LEVELS), entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="degres_jours_chauffe", translation_key="degres_jours_chauffe", **_DEGREE_DAYS, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="degres_jours_clim", translation_key="degres_jours_clim", **_DEGREE_DAYS, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="ensoleillement_demain", translation_key="ensoleillement_demain", native_unit_of_measurement=PERCENTAGE,
                               state_class=SensorStateClass.MEASUREMENT, suggested_display_precision=0, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="sechage_linge", translation_key="sechage_linge", device_class=SensorDeviceClass.ENUM, options=list(DRYING),
                               entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="qualite_air", translation_key="qualite_air", **_INDEX, entity_registry_enabled_default=False),
    CatalogueSensorDescription(key="pollens", translation_key="pollens", **_INDEX, entity_registry_enabled_default=False),
)


ID_ROOT = "hestia_weather"


def _has_legacy_ids(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> bool:
    """A home set up under the former name already has its ids (legacy.ENTITY_ROOT): they stay, or automations and dashboards would break."""
    registry = er.async_get(hass)
    return any(e.entity_id.split(".", 1)[1].startswith(legacy.ENTITY_ROOT) for e in er.async_entries_for_config_entry(registry, entry.entry_id))


def prefix(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> str:
    """« hestia_weather » for the first place of a new home (the former root when the home already has those ids);
    the next places add their name: « hestia_weather_marseille »."""
    root = legacy.ENTITY_ROOT if _has_legacy_ids(hass, entry) else ID_ROOT
    earlier = [e for e in hass.config_entries.async_entries(DOMAIN) if e.entry_id != entry.entry_id and e.created_at < entry.created_at]
    return f"{root}_{slugify(entry.title)}" if earlier else root


def device_name(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> str:
    return "Hestia Weather" if prefix(hass, entry) in (legacy.ENTITY_ROOT, ID_ROOT) else f"Hestia Weather {entry.title}"


def rename_place_ids(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> None:
    """Sensors created by the betas were named after the place (sensor.gardanne_pluie_sur_24_h): they take their Hestia Weather id.
    An id the user chose (one that does not start with the place) is kept."""
    registry, place = er.async_get(hass), f"sensor.{slugify(entry.title)}_"
    for description in SENSORS:
        entity_id = registry.async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_{description.key}")
        wanted = f"sensor.{prefix(hass, entry)}_{OBJECT_IDS[description.key]}"
        if entity_id and entity_id.startswith(place) and entity_id != wanted and not registry.async_get(wanted):
            registry.async_update_entity(entity_id, new_entity_id=wanted)


async def async_setup_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    rename_place_ids(hass, entry)
    place, device = prefix(hass, entry), device_name(hass, entry)
    async_add_entities([*(HestiaWeatherSensor(entry.runtime_data, description, place, device) for description in SENSORS),
                        *(CatalogueSensor(entry.runtime_data, description, place, device) for description in CATALOGUE_SENSORS)])


def first_enabled(coordinator: HestiaWeatherCoordinator, key: str, default: bool) -> bool:
    """Enabled at first: the families chosen at setup decide, when they were chosen; otherwise the entity's own default."""
    return families.enabled_at_first(key, coordinator.config_entry.options.get("families"), default, coordinator.settings)


def device_info(coordinator: HestiaWeatherCoordinator, device: str) -> DeviceInfo:
    return DeviceInfo(identifiers={(DOMAIN, coordinator.config_entry.entry_id)}, name=device, manufacturer="hestiaFB", model="Hestia Weather", configuration_url="homeassistant://hestia/meteo",
                      entry_type=DeviceEntryType.SERVICE)


class HestiaWeatherSensor(CoordinatorEntity[HestiaWeatherCoordinator], SensorEntity):
    _attr_has_entity_name = True
    # The brief's long texts are for automations and dashboards, not for the Recorder.
    _unrecorded_attributes = frozenset({"summary", "points", "phrase", "bulletin", "text", "periods"})
    entity_description: HestiaSensorDescription

    def __init__(self, coordinator: HestiaWeatherCoordinator, description: HestiaSensorDescription, prefix: str, device: str) -> None:
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        # Only a suggestion: Home Assistant keeps an id the user changed.
        self.entity_id = f"sensor.{prefix}_{OBJECT_IDS[description.key]}"
        self._attr_device_info = device_info(coordinator, device)
        self._attr_entity_registry_enabled_default = first_enabled(coordinator, description.key, description.entity_registry_enabled_default)

    @property
    def native_value(self) -> Any:
        return self.entity_description.value(self.coordinator.data) if self.coordinator.data else None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        describe = self.entity_description.attributes
        return describe(self.coordinator.data) if describe and self.coordinator.data else None

    @property
    def icon(self) -> str | None:
        # The brief takes the icon of its most important point.
        if self.entity_description.key == "brief" and self.coordinator.data:
            return self.coordinator.data.brief.icon
        return super().icon


class CatalogueSensor(CoordinatorEntity[HestiaWeatherCoordinator], SensorEntity):
    _attr_has_entity_name = True
    # The reason is for notifications and dashboards; its history is not worth the Recorder's space.
    _unrecorded_attributes = frozenset({"raison", "usages", "arrete"})
    entity_description: CatalogueSensorDescription

    def __init__(self, coordinator: HestiaWeatherCoordinator, description: CatalogueSensorDescription, prefix: str, device: str) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{description.key}"
        self.entity_id = f"sensor.{prefix}_{description.key}"
        self._attr_device_info = device_info(coordinator, device)
        self._attr_entity_registry_enabled_default = first_enabled(coordinator, description.key, description.entity_registry_enabled_default)

    @property
    def _item(self) -> Item | None:
        return self.coordinator.data.catalogue.get(self.entity_description.key) if self.coordinator.data else None

    @property
    def native_value(self) -> Any:
        item = self._item
        return item.value if item else None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        item = self._item
        return item_attributes(item) if item else None
