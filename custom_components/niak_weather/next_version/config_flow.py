"""Setting up a place: the weather service, the station and the air quality. Every field comes pre-filled from what Home Assistant
already has, or from an existing Hestia Weather card; a field left empty is a deliberate choice that detection never overrides."""
from __future__ import annotations

import json
from collections.abc import Iterator
from dataclasses import fields
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, State, callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (BooleanSelector, EntitySelector, EntitySelectorConfig, SelectOptionDict, SelectSelector,
                                            SelectSelectorConfig, SelectSelectorMode, TextSelector)

from .const import CARD_TYPE, DOMAIN, LOGGER
from .domain_migration import async_resume
from .engine import atmo, detection, families, polleninfo, waqi
from .engine.i18n import t
from .engine.settings import ATMO_KEYS, WAQI_KEYS, Settings, atmo_key
from .engine.view import place_name

SETTING_KEYS = frozenset({f.name for f in fields(Settings)} - {"atmo", "waqi"}) | frozenset(ATMO_KEYS) | frozenset(WAQI_KEYS) | {"families"}
# Air and pollen sensors have independent zones and can each be left out.
AIR_KEYS = frozenset(atmo_key(m, later) for later in (False, True) for m in ("air", *atmo.POLLUTANT_METRICS))
POLLEN_KEYS = frozenset(ATMO_KEYS) - AIR_KEYS
NONE = "none"


def _context(hass: HomeAssistant) -> tuple[list[State], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    """States, entity registry and device registry, in the plain form the detection reads."""
    registry = {e.entity_id: {"platform": e.platform, "device_id": e.device_id, "disabled_by": e.disabled_by, "config_entry_id": e.config_entry_id,
                              "unique_id": e.unique_id, "translation_key": e.translation_key, "original_name": e.original_name}
                for e in er.async_get(hass).entities.values()}
    device_registry = dr.async_get(hass)
    # Recent Home Assistant iterates the devices themselves, older versions their ids.
    entries = (device_registry.async_get(d) if isinstance(d, str) else d for d in device_registry.devices)
    devices = {d.id: {"name": d.name, "name_by_user": d.name_by_user, "manufacturer": d.manufacturer, "model": d.model, "via_device_id": d.via_device_id}
               for d in entries if d is not None}
    return hass.states.async_all(), registry, devices


def _sensor(choices: list[str], current: str = "") -> EntitySelector:
    """A sensor picker limited to what fits, keeping the current choice even when it does not."""
    allowed = sorted(set(choices) | ({current} if current else set()))
    return EntitySelector(EntitySelectorConfig(domain="sensor", include_entities=allowed) if allowed else EntitySelectorConfig(domain="sensor"))


def _clean(sources: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in sources.items() if k in SETTING_KEYS and v is not None}


def _cards(node: Any) -> Iterator[dict[str, Any]]:
    if isinstance(node, dict):
        if node.get("type") == CARD_TYPE:
            yield node
        for value in node.values():
            yield from _cards(value)
    elif isinstance(node, list):
        for item in node:
            yield from _cards(item)


async def find_cards(hass: HomeAssistant) -> list[dict[str, Any]]:
    """The source settings of the Hestia Weather cards already on the dashboards, each set once."""
    data = hass.data.get("lovelace")
    dashboards = getattr(data, "dashboards", None)
    if dashboards is None and isinstance(data, dict):
        dashboards = data.get("dashboards")
    found: list[dict[str, Any]] = []
    seen: set[str] = set()
    for url, dashboard in (dashboards or {}).items():
        try:
            config = await dashboard.async_load(False)
        except Exception as err:  # noqa: BLE001 - an empty or broken dashboard is simply skipped
            LOGGER.debug("Dashboard %s not read: %s", url, err)
            continue
        name = (config.get("title") if isinstance(config, dict) else None) or url or "Aperçu"
        for card in _cards(config):
            sources = {k: v for k, v in card.items() if k in SETTING_KEYS}
            key = json.dumps(sources, sort_keys=True, default=str)
            if not sources.get("weather_entity") or key in seen:
                continue
            seen.add(key)
            found.append({"label": f"{sources.get('location') or sources['weather_entity']} · {name}", "sources": sources})
    return found


class _SourceSteps:
    """The steps shared by the first setup and later changes."""

    hass: HomeAssistant
    sources: dict[str, Any]
    skip_empty = False
    """At the first setup, a step with nothing to choose is skipped; later, it shows, so that nothing changes without being seen."""

    def _read(self) -> tuple[list[State], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
        """States and registries, read afresh: each screen of the assistant sees what was just installed."""
        return _context(self.hass)

    async def _done(self, step: str) -> ConfigFlowResult:
        raise NotImplementedError

    async def async_step_weather(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        states, registry, devices = self._read()
        own = sorted(i for i, e in registry.items() if i.startswith("weather.") and e.get("platform") == DOMAIN)
        if not any(s.entity_id.startswith("weather.") and s.entity_id not in own for s in states):
            return self.async_abort(reason="no_weather")  # type: ignore[attr-defined]
        if user_input is not None:
            advanced = user_input.get("advanced") or {}
            for key in ("weather_entity", "location", "vigilance_entity", "season_entity", "water_restriction_entity", "lightning_entity"):
                self.sources[key] = user_input.get(key, "")
            for key in ("sun_entity", "sun_elevation_entity", "forecast_source"):
                self.sources[key] = advanced.get(key, "")
            return await self._done("weather")
        filled = detection.fill(states, registry, devices, self.sources, "weather")
        weather = self.hass.states.get(filled.get("weather_entity") or "")
        location = filled.get("location") or (place_name(str(weather.attributes.get("friendly_name") or "")) if weather else "")
        schema = vol.Schema({
            vol.Required("weather_entity"): EntitySelector(EntitySelectorConfig(domain="weather", exclude_entities=own)),
            vol.Optional("location"): TextSelector(),
            vol.Optional("vigilance_entity"): _sensor(detection.vigilance_candidates(states, registry), filled.get("vigilance_entity") or ""),
            vol.Optional("season_entity"): _sensor(detection.season_candidates(states, registry), filled.get("season_entity") or ""),
            vol.Optional("water_restriction_entity"): _sensor(detection.water_candidates(states, registry), filled.get("water_restriction_entity") or ""),
            vol.Optional("lightning_entity"): _sensor(detection.lightning_candidates(states, registry), filled.get("lightning_entity") or ""),
            vol.Required("advanced"): section(vol.Schema({
                vol.Optional("sun_entity"): EntitySelector(EntitySelectorConfig(domain="sun")),
                vol.Optional("sun_elevation_entity"): EntitySelector(EntitySelectorConfig(domain="sensor")),
                vol.Optional("forecast_source"): TextSelector(),
            }), {"collapsed": True}),
        })
        suggested: dict[str, Any] = {k: v for k, v in {**filled, "location": location}.items() if v}
        suggested["advanced"] = {k: suggested[k] for k in ("sun_entity", "sun_elevation_entity", "forecast_source") if k in suggested}
        return self.async_show_form(step_id="weather", data_schema=self.add_suggested_values_to_schema(schema, suggested))  # type: ignore[attr-defined]

    async def async_step_station(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        states, registry, devices = self._read()
        if user_input is not None:
            model, device = user_input["station_model"], user_input.get("station_device_id", NONE)
            self.sources["station_model"] = "" if model == NONE else model
            self.sources["station_device_id"] = "" if device == NONE else device
            self.sources["station_history"] = user_input.get("station_history", True)
            if model == NONE:
                for field in detection.STATION_FIELDS:
                    self.sources[field] = ""
                return await self._done("station_sensors")
            return await self.async_step_station_sensors()
        filled = detection.fill(states, registry, devices, self.sources, "station")
        # « No station » chosen before: every station field was emptied on purpose.
        declined = self.sources.get("station_model") == "" and all(self.sources.get(f) == "" for f in detection.STATION_FIELDS)
        if declined or not any(filled.get(f) for f in detection.STATION_FIELDS):
            model = self.sources.get("station_model") or NONE
        else:
            model = detection.selected_station_model(filled)
        choices = [SelectOptionDict(value=NONE, label="Aucun appareil — capteurs séparés"),
                   *(SelectOptionDict(value=d["value"], label=d["label"]) for d in detection.source_devices(states, registry, devices))]
        schema = vol.Schema({
            vol.Required("station_model"): SelectSelector(SelectSelectorConfig(options=["gw2000a", "ws90", detection.NETATMO, "manual", NONE], translation_key="station_model",
                                                                               mode=SelectSelectorMode.LIST)),
            vol.Required("station_device_id"): SelectSelector(SelectSelectorConfig(options=choices, mode=SelectSelectorMode.DROPDOWN)),
            vol.Required("station_history"): BooleanSelector(),
        })
        suggested = {"station_model": model, "station_device_id": filled.get("station_device_id") or NONE,
                     "station_history": self.sources.get("station_history", True)}
        report = detection.station_report(states, registry, devices, filled)
        return self.async_show_form(step_id="station", data_schema=self.add_suggested_values_to_schema(schema, suggested),  # type: ignore[attr-defined]
                                    description_placeholders={"profile": report["profile"], "recognized": str(report["recognized"])})

    async def async_step_station_sensors(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        states, registry, devices = self._read()
        groups = detection.station_groups(self.sources.get("station_model") or "manual")
        if user_input is not None:
            shown: set[str] = set()
            for name, _, group in groups:
                values = user_input.get(name) or {}
                for field in group:
                    self.sources[field] = values.get(field, "")
                    shown.add(field)
            # A field the station model does not have is left unset, not refused: another model may use it later.
            for field in detection.STATION_FIELDS:
                if field not in shown:
                    self.sources.pop(field, None)
            return await self._done("station_sensors")
        filled = detection.fill(states, registry, devices, self.sources, "station")
        schema: dict[Any, Any] = {}
        suggested: dict[str, dict[str, str]] = {}
        for name, _, group in groups:
            inner = {}
            for field in group:
                current = filled.get(field) or ""
                inner[vol.Optional(field)] = _sensor(detection.manual_candidates(states, field, registry, filled, devices), current)
                if current:
                    suggested.setdefault(name, {})[field] = current
            schema[vol.Required(name)] = section(vol.Schema(inner), {"collapsed": False})
        return self.async_show_form(step_id="station_sensors",  # type: ignore[attr-defined]
                                    data_schema=self.add_suggested_values_to_schema(vol.Schema(schema), suggested))  # type: ignore[attr-defined]

    def _areas(self) -> list[dict[str, str]]:
        states, registry, devices = self._read()
        return atmo.areas(states, registry, devices)

    def _stations(self) -> list[dict[str, str]]:
        _, registry, devices = self._read()
        return waqi.stations(registry, devices)

    def _apply_atmo(self) -> None:
        """The Atmo sensors of the zone, only those wanted: the air's when Atmo gives the air, the pollens' when Atmo gives the pollens.
        With WAQI, the sensors of its station instead of Atmo's air."""
        states, registry, devices = self._read()
        for key in (*ATMO_KEYS, *WAQI_KEYS, "waqi_place"):
            self.sources.pop(key, None)
        if self.sources.get("atmo_area") or self.sources.get("atmo_pollen_area"):
            self.sources = detection.fill(states, registry, devices, self.sources, "atmo")
        for key in (*(AIR_KEYS if self.sources.get("air_source") in ("none", "waqi") else ()), *(POLLEN_KEYS if self.sources.get("pollen_source") != "atmo" else ())):
            self.sources.pop(key, None)
        if self.sources.get("air_source") == "waqi" and self.sources.get("waqi_station"):
            self.sources.update(waqi.detect(registry, devices, self.sources["waqi_station"]))
        else:
            self.sources.pop("waqi_station", None)

    def _set_air(self, choice: str) -> None:
        """« none », an Atmo France zone, or « waqi:<station> »."""
        # Freeze the previous shared choice before changing only the air zone.
        self.sources.setdefault("atmo_pollen_area", self.sources.get("atmo_area"))
        if choice.startswith("waqi:"):
            self.sources["air_source"], self.sources["waqi_station"] = "waqi", choice.removeprefix("waqi:")
        else:
            self.sources["air_source"] = "none" if choice == NONE else "atmo"
        if self.sources["air_source"] == "atmo":
            self.sources["atmo_area"] = choice
        elif self.sources.get("pollen_source") != "atmo":
            self.sources["atmo_area"] = ""
        self._apply_atmo()

    async def async_step_air_quality(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The air: an Atmo France zone, a WAQI station, or none."""
        areas, stations = self._areas(), self._stations()
        if user_input is None and not areas and not stations and self.skip_empty:
            self.sources["air_source"] = "none"
            return await self._done("air")
        if user_input is not None:
            self._set_air(user_input.get("atmo_area", NONE))
            return await self._done("air")
        states, registry, devices = self._read()
        filled = detection.fill(states, registry, devices, self.sources, "atmo")
        source = self.sources.get("air_source")
        current = (NONE if source == "none" else f"waqi:{self.sources.get('waqi_station')}" if source == "waqi" and self.sources.get("waqi_station")
                   else filled.get("atmo_area") or NONE)
        schema = vol.Schema({vol.Required("atmo_area"): SelectSelector(SelectSelectorConfig(
            options=[SelectOptionDict(value=NONE, label="Aucune"), *(SelectOptionDict(value=a["value"], label=f"Atmo France · {a['label']}") for a in areas),
                     *(SelectOptionDict(value=f"waqi:{s['value']}", label=f"WAQI · {s['label']} (mesure ; demain : Open-Meteo)") for s in stations)],
            mode=SelectSelectorMode.DROPDOWN))})
        hint = "" if areas else "\n\nAtmo France n’est pas encore installée : [installer l’intégration Atmo France](https://github.com/sebcaps/atmofrance), puis revenez ici."
        return self.async_show_form(step_id="air_quality", data_schema=self.add_suggested_values_to_schema(schema, {"atmo_area": current}),  # type: ignore[attr-defined]
                                    description_placeholders={"hint": hint})

    async def async_step_pollen(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The pollens: from Atmo France, Polleninformation or IRM KMI, or none. Every source is always offered; one not installed says so.
        Polleninformation and IRM KMI both give one sensor per species: stored as the « legacy » source, told apart by pollen_provider."""
        states, registry, _ = self._read()
        areas = self._areas()
        found = {p: bool(polleninfo.candidates(states, registry, p)[0]) for p in polleninfo.PROVIDERS}
        if user_input is None and not areas and not any(found.values()) and self.skip_empty:
            self.sources["pollen_source"] = NONE
            self._apply_atmo()
            return await self._done("pollen")
        errors: dict[str, str] = {}
        if user_input is not None:
            source = user_input.get("pollen_source", NONE)
            if source == "atmo" and not areas:
                errors["base"] = "atmo_missing"
            elif source in found and not found[source]:
                errors["base"] = f"{source}_missing"
            else:
                if source in found:
                    if source != polleninfo.provider(Settings.from_options(_clean(self.sources))):
                        # Another integration: its own sensors are proposed, not the other one's.
                        self.sources.pop("pollens", None)
                        self.sources.pop("pollen_risk_entity", None)
                        self.sources.pop("pollen_station", None)
                    self.sources["pollen_provider"] = source
                    source = "legacy"
                self.sources["pollen_source"] = source
                if source == "atmo":
                    return await self.async_step_pollen_area()
                self._apply_atmo()
                if source == "legacy":
                    if self.sources.get("pollen_provider") in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX) and len(
                            polleninfo.stations(states, registry, self.sources["pollen_provider"])) > 1:
                        return await self.async_step_pollen_station()
                    return await self.async_step_pollen_sensors()
                return await self._done("pollen")
        missing = " — pas encore installée"
        options = [SelectOptionDict(value="atmo", label=polleninfo.source_label("atmo") + ("" if areas else missing)),
                   *(SelectOptionDict(value=p, label=polleninfo.source_label(p) + ("" if found[p] else missing)) for p in polleninfo.PROVIDERS),
                   SelectOptionDict(value=NONE, label="Pas de pollens")]
        stored = self.sources.get("pollen_source")
        current = ((user_input or {}).get("pollen_source")
                   or (polleninfo.provider(Settings.from_options(_clean(self.sources))) if stored == "legacy" else stored)
                   or ("atmo" if areas else next((p for p, ok in found.items() if ok), NONE)))
        schema = vol.Schema({vol.Required("pollen_source"): SelectSelector(SelectSelectorConfig(options=options, mode=SelectSelectorMode.LIST))})
        return self.async_show_form(step_id="pollen", data_schema=self.add_suggested_values_to_schema(schema, {"pollen_source": current}),  # type: ignore[attr-defined]
                                    errors=errors)

    async def async_step_pollen_area(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The pollen zone, independent of the air zone."""
        areas = self._areas()
        if user_input is not None:
            self.sources["atmo_pollen_area"] = user_input["atmo_area"]
            self._apply_atmo()
            return await self._done("pollen")
        schema = vol.Schema({vol.Required("atmo_area"): SelectSelector(SelectSelectorConfig(
            options=[SelectOptionDict(value=a["value"], label=a["label"]) for a in areas], mode=SelectSelectorMode.DROPDOWN))})
        return self.async_show_form(step_id="pollen_area", data_schema=self.add_suggested_values_to_schema(
            schema, {"atmo_area": self.sources.get("atmo_pollen_area", self.sources.get("atmo_area"))}))  # type: ignore[attr-defined]

    async def async_step_pollen_sensors(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Polleninformation or IRM KMI: its species sensors (and Polleninformation's overall allergy risk), proposed, to check or change."""
        states, registry, _ = self._read()
        provider = polleninfo.provider(Settings.from_options(_clean(self.sources)))
        species, risks = polleninfo.candidates(states, registry, provider)
        if provider in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX):
            places = polleninfo.stations(states, registry, provider)
            if self.sources.get("pollen_station") not in places:
                if len(places) == 1:
                    self.sources["pollen_station"] = places[0]
                    self.sources.pop("pollens", None)
                else:
                    return await self.async_step_pollen_station()
            species = [i for i in species if polleninfo.place_of_source(i, registry, provider) == self.sources["pollen_station"]]
        if user_input is not None:
            by_id = {s.entity_id: s for s in states}
            self.sources["pollens"] = [polleninfo.pollen_option(i, by_id.get(i), registry) for i in user_input.get("pollens") or []]
            self.sources["pollen_risk_entity"] = user_input.get("pollen_risk_entity") or ""
            return await self._done("pollen")
        chosen = [p.get("id") for p in self.sources.get("pollens") or [] if isinstance(p, dict)]
        if "pollens" not in self.sources:
            # First time with this source: all its species, as found.
            chosen = species
        fields: dict[Any, Any] = {
            vol.Optional("pollens"): EntitySelector(EntitySelectorConfig(domain="sensor", multiple=True, include_entities=sorted(set(species) | set(chosen))))}
        # IRM KMI has no overall risk: Hestia keeps the highest species.
        if provider == polleninfo.POLLENINFORMATION:
            fields[vol.Optional("pollen_risk_entity")] = EntitySelector(EntitySelectorConfig(domain="sensor", include_entities=sorted(set(risks) | (
                {self.sources["pollen_risk_entity"]} if self.sources.get("pollen_risk_entity") else set()))))
        suggested = {"pollens": chosen, **({"pollen_risk_entity": self.sources["pollen_risk_entity"]} if self.sources.get("pollen_risk_entity") else {})}
        return self.async_show_form(step_id="pollen_sensors", data_schema=self.add_suggested_values_to_schema(vol.Schema(fields), suggested),  # type: ignore[attr-defined]
                                    description_placeholders={"source": polleninfo.PROVIDERS[provider]})

    async def async_step_pollen_station(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        states, registry, devices = self._read()
        provider = polleninfo.provider(Settings.from_options(_clean(self.sources)))
        choices = polleninfo.places(states, registry, provider, devices)
        places = [p["value"] for p in choices]
        errors = {}
        if user_input is not None:
            if user_input.get("pollen_station") in places:
                self.sources["pollen_station"] = user_input["pollen_station"]
                self.sources.pop("pollens", None)
                return await self.async_step_pollen_sensors()
            errors["base"] = "swiss_station_missing"
        schema = vol.Schema({vol.Required("pollen_station"): SelectSelector(SelectSelectorConfig(
            options=[SelectOptionDict(value=p["value"], label=p["label"]) for p in choices], mode=SelectSelectorMode.DROPDOWN))})
        return self.async_show_form(step_id="pollen_station", data_schema=self.add_suggested_values_to_schema(  # type: ignore[attr-defined]
            schema, {"pollen_station": self.sources.get("pollen_station")}), errors=errors)

    def _summary(self) -> dict[str, str]:
        """One line per part, for the menu and the last step: what is set, in a few words."""
        s, get = self.sources, self.hass.states.get
        weather = get(s.get("weather_entity") or "")
        station = [f for f in detection.STATION_FIELDS if s.get(f)]
        model = {"gw2000a": "GW2000A", "ws90": "WS90", "netatmo": "Netatmo", "manual": "Station"}.get(s.get("station_model") or "", "")
        count = len(s.get("pollens") or [])
        area = next((a["label"] for a in self._areas() if a["value"] == s.get("atmo_area")), s.get("atmo_area") or "")
        pollen_zone = s.get("atmo_pollen_area", s.get("atmo_area")) or ""
        pollen_area = next((a["label"] for a in self._areas() if a["value"] == pollen_zone), pollen_zone)
        provider = polleninfo.PROVIDERS[polleninfo.provider(Settings.from_options(_clean(s)))]
        species = t("{n} espèces", n=count) if count > 1 else t("{n} espèce", n=count)
        pollens = {"atmo": f"Atmo France · {pollen_area}", "legacy": f"{provider} · {species}"}.get(s.get("pollen_source") or "", t("aucune source"))
        return {
            "weather": (str(weather.attributes.get("friendly_name") or s.get("weather_entity")) if weather else t("à choisir"))
                       + (" · " + t("vigilance") if s.get("vigilance_entity") else ""),
            "station": f"{model + ' · ' if model else ''}" + (t("{n} capteurs", n=len(station)) if len(station) > 1 else t("{n} capteur", n=len(station)))
                       if station else t("pas de station"),
            "air": (f"WAQI · {s.get('waqi_place') or s.get('waqi_station')}" if s.get("air_source") == "waqi"
                    else f"Atmo France · {area}" if area and s.get("air_source") != "none" else t("aucune")),
            "pollen": pollens,
        }

    def _title(self) -> str:
        weather = self.hass.states.get(self.sources.get("weather_entity") or "")
        return self.sources.get("location") or (place_name(str(weather.attributes.get("friendly_name") or "")) if weather else "") or "Hestia Weather"


class HestiaWeatherConfigFlow(_SourceSteps, ConfigFlow, domain=DOMAIN):
    VERSION = 1
    skip_empty = True

    def __init__(self) -> None:
        self.sources = {}
        self._cards: list[dict[str, Any]] = []

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> HestiaWeatherOptionsFlow:
        return HestiaWeatherOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Welcome: what Hestia Weather does and the four steps; an existing card's settings can be the starting point.
        A home installed under the former name is resumed instead (domain_migration.async_resume): nothing is set up twice."""
        if await async_resume(self.hass):
            return self.async_abort(reason="migrated")
        self._cards = await find_cards(self.hass)
        return self.async_show_menu(step_id="user", menu_options=["import_card", "weather"] if self._cards else ["weather"])

    async def async_step_panel(self, user_input: dict[str, Any]) -> ConfigFlowResult:
        """A place set up in the « Météo » tab of the Hestia panel (draft.py), which went through the same steps."""
        return self.async_create_entry(title=user_input["title"], data={}, options=_clean(user_input["options"]))

    async def async_step_import_card(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Start from a card's settings: each step then shows them, to check before saving."""
        if user_input is not None:
            self.sources = dict(self._cards[int(user_input["card"])]["sources"])
            return await self.async_step_weather()
        choices = [SelectOptionDict(value=str(i), label=card["label"]) for i, card in enumerate(self._cards)]
        return self.async_show_form(step_id="import_card", data_schema=vol.Schema({
            vol.Required("card"): SelectSelector(SelectSelectorConfig(options=choices, mode=SelectSelectorMode.LIST))}))

    async def _done(self, step: str) -> ConfigFlowResult:
        if step == "weather":
            return await self.async_step_station()
        if step == "station_sensors":
            return await self.async_step_air_quality()
        if step == "air":
            return await self.async_step_pollen()
        return await self.async_step_families()

    async def async_step_families(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Step 4: which families of entities to start with; each can be changed later, entity by entity."""
        if user_input is not None:
            self.sources["families"] = list(user_input.get("families") or [])
            return await self.async_step_summary()
        schema = vol.Schema({vol.Optional("families"): SelectSelector(SelectSelectorConfig(
            options=[f for f, _ in families.FAMILIES], multiple=True, mode=SelectSelectorMode.LIST, translation_key="family"))})
        return self.async_show_form(step_id="families", data_schema=self.add_suggested_values_to_schema(  # type: ignore[attr-defined]
            schema, {"families": self.sources.get("families", list(families.DEFAULT_FAMILIES))}))

    async def async_step_summary(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The last look before creating: what was found, and what some entities still need."""
        if user_input is not None:
            return self.async_create_entry(title=self._title(), data={}, options=_clean(self.sources))
        settings = Settings.from_options(_clean(self.sources))
        chosen = set(self.sources.get("families") or [])
        missing = [f"{key_name(k)} : il faut {text}" for k, text in families.needs(settings).items() if families.family_of(k) in chosen]
        return self.async_show_form(step_id="summary", data_schema=vol.Schema({}), description_placeholders={  # type: ignore[attr-defined]
            **self._summary(), "families": ", ".join(FAMILY_NAMES[f] for f, _ in families.FAMILIES if f in chosen) or "aucune", "missing": "\n".join(f"- {m}" for m in missing) or "- Rien : tout ce qui est choisi a sa source."})


class HestiaWeatherOptionsFlow(OptionsFlow):
    """The settings live in the « Météo » tab of the Hestia panel: this screen only leads there."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=dict(self.config_entry.options))
        return self.async_show_form(step_id="init", data_schema=vol.Schema({}), description_placeholders={"link": "/hestia/meteo"})



def key_name(key: str) -> str:
    """An entity's French name, for the notes of the settings."""
    return KEY_NAMES.get(key, key)


FAMILY_NAMES = {"maintenant": "Maintenant", "alertes": "Alertes", "prochaines_heures": "Prochaines heures", "jardin": "Jardin",
                "batiment": "Bâtiment", "energie": "Énergie", "vie_pratique": "Vie pratique", "meteo": "Entité météo"}
KEY_NAMES = {"vigilance": "Vigilance", "uv_fort": "UV forts", "pluie_7j": "Pluie des 7 jours", "rain_24h": "Pluie sur 24 h",
             "pressure_trend": "Tendance de la pression", "max_gust_today": "Rafale maximale du jour", "temperature_trend": "Tendance de la température",
             "qualite_air": "Qualité de l’air", "pollens": "Pollens"}
