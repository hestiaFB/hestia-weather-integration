"""The integration's settings: where every reading comes from.

The keys are the same as in the card's YAML, so the settings of an existing card can be imported as they are.
Display settings (format, sections, animations…) stay in the card.
"""
from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any, Mapping

ATMO_METRICS = ("air", "pm25", "pm10", "no2", "o3", "so2", "pollen", "grass", "ragweed", "mugwort", "alder", "birch", "olive",
                "grass_concentration", "ragweed_concentration", "mugwort_concentration", "alder_concentration", "birch_concentration",
                "olive_concentration")


def atmo_key(metric: str, tomorrow: bool = False) -> str:
    """The setting naming an Atmo France sensor: atmo_pm25_entity, atmo_pm25_tomorrow_entity…"""
    return f"atmo_{metric}{'_tomorrow' if tomorrow else ''}_entity"


ATMO_KEYS = tuple(atmo_key(m, t) for t in (False, True) for m in ATMO_METRICS)

WAQI_METRICS = ("air", "pm25", "pm10", "no2", "o3", "so2", "dominant")


def waqi_key(metric: str) -> str:
    """The setting naming a WAQI sensor of the chosen station: waqi_pm25_entity…"""
    return f"waqi_{metric}_entity"


WAQI_KEYS = tuple(waqi_key(m) for m in WAQI_METRICS)


@dataclass(frozen=True)
class LegacyPollen:
    """A species or group from a pollen provider, with optional availability diagnostics."""

    entity_id: str
    name: str = ""
    icon: str = ""
    station_state_entity: str = ""
    station: str = ""
    updated_entity: str = ""
    data_date_entity: str = ""
    error_entity: str = ""


@dataclass(frozen=True)
class Settings:
    weather_entity: str
    location: str | None = None
    forecast_source: str | None = None
    vigilance_entity: str | None = None
    sun_entity: str | None = None
    sun_elevation_entity: str | None = None
    season_entity: str | None = None
    water_restriction_entity: str | None = None
    """Vigieau's alert level sensor: the drought restrictions of the commune."""
    lightning_entity: str | None = None
    """Blitzortung's distance sensor: each of its changes is a strike."""
    fire_entity: str | None = None
    """PyroVeille's « Alerte incendie proche » binary sensor: the fires reported around the home."""
    river_entity: str | None = None
    """CrueVeille's « Alerte inondation » binary sensor: the river measured at the nearest Vigicrues station (beta)."""
    open_meteo_pressure: bool = True
    """Ask Open-Meteo for the pressure to come when the weather service gives none (Météo-France): the home's position, rounded, leaves Home Assistant."""
    # Station
    station_model: str | None = None
    station_device_id: str | None = None
    station_history: bool = True
    """Compute rain totals and the day's strongest gust from the Recorder when the station has no sensor for them."""
    temperature_entity: str | None = None
    humidity_entity: str | None = None
    dew_point_entity: str | None = None
    temperature_trend_entity: str | None = None
    wind_speed_entity: str | None = None
    wind_gust_entity: str | None = None
    wind_bearing_entity: str | None = None
    max_daily_gust_entity: str | None = None
    rain_rate_entity: str | None = None
    rain_total_entity: str | None = None
    daily_rain_entity: str | None = None
    rain_24h_entity: str | None = None
    weekly_rain_entity: str | None = None
    monthly_rain_entity: str | None = None
    yearly_rain_entity: str | None = None
    event_rain_entity: str | None = None
    pressure_entity: str | None = None
    solar_radiation_entity: str | None = None
    station_shade: str | None = None
    """When the station is in the shade, as the household says (« never », « morning », « afternoon », « always »): the start
    of its shade, until the nights have learned it (engine/station_shade.py)."""
    # Where the station stands (docs/STATION-EMPLACEMENT.md, engine/station_place.py): unset is « Je ne sais pas ».
    station_side: str | None = None
    """The side of the house (« n »… « nw »), « roof » or « open » (in the garden, away from the house)."""
    station_wall: str | None = None
    """« against » (under 1 m), « near » (1 to 3 m) or « far » from the wall of its side."""
    station_height: str | None = None
    """« low » (under 1.5 m), « standard » (1.5 to 2 m) or « high »."""
    station_ground: str | None = None
    """« grass », « gravel » or « paving » under the station."""
    rain_gauge_shelter: str | None = None
    """« open », « tree » or « eave » (near a wall or under the eaves)."""
    wind_shelter: tuple[str, ...] | None = None
    """The sides the wind is hindered from (« w »…); () clear on every side."""
    station_notes: Mapping[str, Any] = field(default_factory=dict)
    """Set by engine/station_place.overlay, never saved: why the temperature or the wind read now is not the station's own."""
    uv_index_entity: str | None = None
    illuminance_entity: str | None = None
    # Air and pollens
    air_source: str | None = None
    """« atmo », « waqi » (the station's measure today, Open-Meteo's forecast tomorrow) or « none »; unset means Atmo when configured."""
    waqi_station: str | None = None
    waqi_place: str | None = None
    """The WAQI station's name, as its device is called."""
    waqi: Mapping[str, str] = field(default_factory=dict)
    """WAQI sensors of the station, by setting key (waqi_pm25_entity…)."""
    atmo_area: str | None = None
    atmo_pollen_area: str | None = None
    """Pollen zone; older settings fall back to atmo_area."""
    pollen_source: str | None = None
    """« atmo », « legacy » (one sensor per species) or « none »; unset means Atmo when an Atmo sensor is configured."""
    pollen_risk_entity: str | None = None
    """Polleninformation's overall allergy risk, next to its species (pollens)."""
    pollen_provider: str | None = None
    """Species source: « polleninformation » (unset), « irm_kmi », « swiss_pollen » or « kleenex_pollenradar »."""
    atmo: Mapping[str, str] = field(default_factory=dict)
    """Atmo France sensors, by setting key (atmo_pm25_entity…)."""
    pollens: tuple[LegacyPollen, ...] = ()
    pollen_station: str | None = None
    """Swiss Pollen station code or Kleenex config entry id, shared by the selected species."""

    @classmethod
    def from_options(cls, options: Mapping[str, Any]) -> Settings:
        """Settings from the integration's options (or a card's YAML): empty values count as unset, unknown keys are ignored."""
        known = {f.name for f in fields(cls)} - {"atmo", "waqi", "pollens", "station_notes"}
        values: dict[str, Any] = {}
        for key in known:
            value = options.get(key)
            if value not in (None, ""):
                values[key] = value
        if "wind_shelter" in values:
            shelter = values["wind_shelter"]
            values["wind_shelter"] = tuple(str(s) for s in shelter) if isinstance(shelter, (list, tuple)) else None
        values["atmo"] = {k: options[k] for k in ATMO_KEYS if options.get(k)}
        values["waqi"] = {k: options[k] for k in WAQI_KEYS if options.get(k)} if options.get("air_source") == "waqi" else {}
        values["pollens"] = tuple(LegacyPollen(str(p.get("id")), str(p.get("nom") or p.get("name") or ""), str(p.get("ico") or p.get("icon") or ""),
                                              str(p.get("station_state_entity") or ""), str(p.get("station") or ""),
                                              str(p.get("updated_entity") or ""), str(p.get("data_date_entity") or ""), str(p.get("error_entity") or ""))
                                  for p in options.get("pollens") or () if isinstance(p, Mapping) and p.get("id"))
        if "weather_entity" not in values:
            raise ValueError("weather_entity is required")
        return cls(**values)

    def entity_ids(self) -> set[str]:
        """Every sensor the engine reads: a change of one of them means a new calculation."""
        ids = {getattr(self, f.name) for f in fields(self) if f.name.endswith("_entity") and getattr(self, f.name)}
        ids |= set(self.atmo.values()) | set(self.waqi.values()) | {p.entity_id for p in self.pollens}
        ids |= {p.station_state_entity for p in self.pollens if p.station_state_entity}
        ids |= {entity for p in self.pollens for entity in (p.updated_entity, p.data_date_entity, p.error_entity) if entity}
        ids.add(self.sun_entity or "sun.sun")
        return ids

    @property
    def atmo_pollens(self) -> bool:
        """Atmo France gives the pollens: the Polleninformation sensors are then left out."""
        return self.pollen_source == "atmo" or (self.pollen_source is None and bool(self.atmo))
