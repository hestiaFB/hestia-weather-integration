"""The settings of a place in the « Météo » tab of the Hestia panel: a draft changed step by step, then saved at once.

It follows the assistant of Paramètres (config_flow.py) step for step and reuses its detection, so that both give the same
settings; that assistant stays available while the panel takes over. Nothing is saved before `save`.
"""
from __future__ import annotations

import json
from functools import cache
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .api import API_KEY
from .config_flow import NONE, _clean, _context, _SourceSteps
from .const import DOMAIN
from .engine import detection, ecosystem, families, polleninfo
from .extensions import inventory, official
from .engine.settings import Settings
from .engine.i18n import N_, language, t

AIR_SOURCES = ("atmo", "waqi", NONE)
POLLEN_SOURCES = ("atmo", *polleninfo.PROVIDERS, NONE)
SIMPLE = frozenset({"weather_entity", "location", "vigilance_entity", "season_entity", "sun_entity", "sun_elevation_entity",
                    "water_restriction_entity", "lightning_entity",
                    "forecast_source", "station_history", "open_meteo_pressure", "pollen_risk_entity", *detection.STATION_FIELDS})
RECOMMENDED = frozenset({"temperature_entity", "humidity_entity", "rain_rate_entity", "wind_gust_entity", "wind_bearing_entity"})
HELP = {
    "weather_entity": N_("Les prévisions heure par heure et jour par jour, par exemple Météo-France ou MétéoSuisse. Une station facultative ajoute les mesures chez vous."),
    "vigilance_entity": N_("Les alertes officielles de Météo-France ou de MétéoSuisse s’ajoutent à celles que calcule Hestia."),
    "season_entity": N_("Sans capteur, la saison suit la date."),
    "water_restriction_entity": N_("Les restrictions d’eau de votre commune, avec l’intégration Vigieau (HACS). Choisissez la zone de l’eau du robinet (AEP)."),
    "lightning_entity": N_("Les éclairs détectés autour de chez vous, avec l’intégration Blitzortung (HACS). À moins de 30 km, le capteur Orage s’allume."),
    "temperature_entity": N_("La température dehors, à l’ombre."),
    "rain_rate_entity": N_("Dit s’il pleut maintenant (mm/h). Un cumul de la journée ne le dit pas."),
    "wind_gust_entity": N_("Les pointes de vent : elles déclenchent l’alerte de vent fort."),
    "wind_bearing_entity": N_("D’où vient le vent, en degrés."),
    "station_history": N_("Cumuls de pluie, tendance de la température et rafale du jour, quand la station ne les donne pas."),
}
MODELS = (("gw2000a", "Ecowitt GW2000A", N_("Passerelle Ecowitt et ses capteurs")),
          ("ws90", "Ecowitt WS90", N_("Capteur tout-en-un, souvent via Zigbee2MQTT")),
          (detection.NETATMO, "Netatmo", N_("Station Netatmo et ses modules : extérieur, pluviomètre, anémomètre")),
          ("manual", N_("Une autre station"), N_("Vous choisissez chaque capteur")),
          (NONE, N_("Pas de station"), N_("Hestia Weather s’appuie sur le service météo seul")))


# The languages of translations/: the engine's dictionaries and French.
LANGUAGES = ("fr", "en", "de")


@cache
def _read(lang: str) -> dict[str, Any]:
    return json.loads((Path(__file__).parent / "translations" / f"{lang}.json").read_text(encoding="utf-8"))


def _translations() -> dict[str, Any]:
    """Home Assistant's own words for the fields, entities and families, in the panel's language (English when it has none)."""
    return _read(language() if language() in LANGUAGES else "en")


async def async_load_labels(hass: HomeAssistant) -> None:
    """Reads the labels once, outside the event loop: the tab's commands then find them in the cache."""
    for lang in LANGUAGES:
        await hass.async_add_executor_job(_read, lang)


def _label(text: str) -> tuple[str, str]:
    """« Ressenti — la température ressentie » → its name and its hint."""
    name, _, hint = text.partition(" — ")
    return name, hint


def field_label(field: str) -> str:
    for section in _translations()["options"]["step"]["station_sensors"]["sections"].values():
        if field in section["data"]:
            return str(section["data"][field])
    return field


def entity_label(key: str) -> tuple[str, str]:
    return _label(_translations()["selector"]["entity"]["options"].get(key, key))


def family_label(family: str) -> tuple[str, str]:
    return _label(_translations()["selector"]["family"]["options"].get(family, family))


def needs_text(key: str, text: str) -> str:
    return t("{name} : il faut {need}", name=entity_label(key)[0], need=t(text))


def _settings(sources: dict[str, Any]) -> Settings:
    # A draft may not have its weather service yet: what the entities need does not depend on it.
    return Settings.from_options(_clean({**sources, "weather_entity": sources.get("weather_entity") or "-"}))


class Draft(_SourceSteps):
    """The sources of one place being changed. The step methods of the assistant are not used: only its helpers."""

    def __init__(self, hass: HomeAssistant, sources: dict[str, Any], entry: ConfigEntry | None = None) -> None:
        self.hass, self.sources, self.entry = hass, dict(sources), entry
        self._seen: tuple[list[Any], dict[str, dict[str, Any]], dict[str, dict[str, Any]]] | None = None

    def _read(self) -> tuple[list[Any], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
        """States and registries, read once per command of the panel: a draft lives for one command only."""
        if self._seen is None:
            self._seen = _context(self.hass)
        return self._seen

    @classmethod
    def start(cls, hass: HomeAssistant, entry: ConfigEntry | None) -> Draft:
        """The saved settings with what the assistant would propose on each screen; for a new place, everything detected."""
        draft = cls(hass, dict(entry.options) if entry else {}, entry)
        draft._fill("weather")
        draft._fill("station")
        if entry is None:
            areas, stations = draft._areas(), draft._stations()
            draft.sources["air_source"] = "atmo" if areas else "waqi" if stations else "none"
            if areas:
                draft._fill("atmo")
                draft.sources.setdefault("atmo_area", areas[0]["value"])
            elif stations:
                draft.sources["waqi_station"] = stations[0]["value"]
            draft._apply_atmo()
            found = draft._pollen_found()
            draft.change({"op": "pollen", "value": "atmo" if areas else next((p for p, ok in found.items() if ok), NONE)})
            draft.sources["families"] = list(families.DEFAULT_FAMILIES)
        return draft

    def _fill(self, category: str, fill_empty: bool = False) -> None:
        states, registry, devices = self._read()
        self.sources = detection.fill(states, registry, devices, self.sources, category, fill_empty)

    def _pollen_found(self) -> dict[str, bool]:
        states, registry, _ = self._read()
        return {p: bool(polleninfo.candidates(states, registry, p)[0]) for p in polleninfo.PROVIDERS}

    def pollen_choice(self) -> str:
        source = self.sources.get("pollen_source")
        if source == "legacy":
            return polleninfo.provider(_settings(self.sources))
        return source if source in ("atmo", NONE) else NONE

    # ---- Changes, one per action of the tab; each returns an error message, or "" ----

    def change(self, change: dict[str, Any]) -> str:
        op, value, s = change.get("op"), change.get("value"), self.sources
        if op == "set" and change.get("key") in SIMPLE:
            s[change["key"]] = bool(value) if change["key"] in ("station_history", "open_meteo_pressure") else (value or "")
        elif op == "station":
            if value == NONE:
                s["station_model"], s["station_device_id"] = "", ""
                for field in detection.STATION_FIELDS:
                    s[field] = ""
            elif value in detection.STATION_MODELS:
                s["station_model"] = value
                if s.get("station_device_id") == "":
                    s.pop("station_device_id")
                shown = {f for _, _, group in detection.station_groups(value) for f in group}
                for field in detection.STATION_FIELDS:
                    # A field this model does not have is left unset; one emptied by « no station » is proposed again.
                    if field not in shown or s.get(field) == "":
                        s.pop(field, None)
                self._fill("station")
            else:
                return t("Modèle de station inconnu.")
        elif op == "device":
            s["station_device_id"] = "" if value in (None, NONE) else value
            for field in detection.STATION_FIELDS:
                s.pop(field, None)
            self._fill("station")
        elif op == "redetect":
            self._fill("weather" if value == "weather" else "station", fill_empty=True)
        elif op == "air":
            return self._air_source(value, change.get("area"))
        elif op == "pollen":
            return self._pollen(value, change.get("area"))
        elif op == "pollen_station" and self.pollen_choice() in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX):
            states, registry, _ = self._read()
            if value not in polleninfo.stations(states, registry, self.pollen_choice()):
                return t("Choisissez un lieu de mesure disponible pour cette source de pollens.")
            s["pollen_station"] = value
            s["pollens"] = [polleninfo.pollen_option(st.entity_id, st, registry) for st in states
                            if polleninfo.place_of_source(st.entity_id, registry, self.pollen_choice()) == value]
        elif op == "pollens":
            states, registry, _ = self._read()
            by_id = {st.entity_id: st for st in states}
            if self.pollen_choice() in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX) and any(
                    polleninfo.place_of_source(i, registry, self.pollen_choice()) != s.get("pollen_station") for i in value or []):
                return t("Choisissez les espèces de la station ou du lieu sélectionné.")
            s["pollens"] = [polleninfo.pollen_option(i, by_id.get(i), registry) for i in value or []]
        elif op == "families" and self.entry is None:
            s["families"] = [f for f, _ in families.FAMILIES if f in (value or [])]
        else:
            return t("Changement inconnu.")
        return ""

    def _air_source(self, source: Any, area: str | None) -> str:
        areas, s = self._areas(), self.sources
        if source not in AIR_SOURCES:
            return t("Source de qualité de l’air inconnue.")
        if source == "atmo" and not areas:
            return t("Atmo France n’est pas installée.")
        if source == "waqi":
            stations = [x["value"] for x in self._stations()]
            if not stations:
                return t("WAQI n’est pas installée.")
            if area and area not in stations:
                return t("Choisissez une station WAQI disponible.")
            self._set_air(f"waqi:{area or (s.get('waqi_station') if s.get('waqi_station') in stations else stations[0])}")
            return ""
        if source == "atmo":
            self._set_air(area or (s.get("atmo_area") if s.get("atmo_area") else areas[0]["value"]))
        else:
            self._set_air(NONE)
        return ""

    def _pollen(self, source: Any, area: str | None) -> str:
        areas, found, s = self._areas(), self._pollen_found(), self.sources
        if source not in POLLEN_SOURCES:
            return t("Source de pollens inconnue.")
        if source == "atmo" and not areas:
            return t("Atmo France n’est pas installée.")
        if source in found and not found[source]:
            return t("{name} n’est pas installée.", name=polleninfo.PROVIDERS[source])
        if source in found:
            if source != self.pollen_choice():
                # Another integration: its own sensors are proposed, not the other one's.
                s.pop("pollens", None)
                s.pop("pollen_risk_entity", None)
                s.pop("pollen_station", None)
            s["pollen_provider"], s["pollen_source"] = source, "legacy"
            if "pollens" not in s:
                # First time with this source: all its species, and the overall risk of its only place.
                states, registry, _ = self._read()
                by_id = {st.entity_id: st for st in states}
                detected = polleninfo.detect(states, registry, source)
                s["pollens"] = (detected.get("pollens") or []) if source in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX) else (
                    detected.get("pollens") or [polleninfo.pollen_option(i, by_id.get(i), registry)
                                              for i in polleninfo.candidates(states, registry, source)[0]])
                if detected.get("pollen_station"):
                    s["pollen_station"] = detected["pollen_station"]
                if detected.get("pollen_risk_entity"):
                    s["pollen_risk_entity"] = detected["pollen_risk_entity"]
        else:
            s["pollen_source"] = source
            if source == "atmo" and (area or not s.get("atmo_pollen_area", s.get("atmo_area"))):
                s["atmo_pollen_area"] = area or areas[0]["value"]
        self._apply_atmo()
        return ""

    # ---- What the tab shows ----

    def _entity(self, entity_id: str | None) -> dict[str, Any] | None:
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None:
            return {"id": entity_id, "name": entity_id, "state": "", "available": False, "missing": True}
        available = state.state not in ("unavailable", "unknown")
        unit = state.attributes.get("unit_of_measurement")
        value = state.state if available else "indisponible"
        return {"id": entity_id, "name": str(state.attributes.get("friendly_name") or entity_id),
                "state": f"{value} {unit}" if unit and available else value, "available": available, "missing": False}

    def _field(self, key: str, label: str, ids: list[str], *, required: bool = False, warning: str = "",
               better: str = "", recognized: list[str] | None = None) -> dict[str, Any]:
        value = self.sources.get(key) or ""
        entity = self._entity(value)
        if not warning and entity:
            warning = (t("Ce capteur n’existe plus dans Home Assistant.") if entity["missing"]
                       else t("Ce capteur ne répond pas pour l’instant.") if not entity["available"] else "")
        allowed = sorted(set(ids) | ({value} if value else set()))
        return {"key": key, "label": label, "help": t(HELP[key]) if key in HELP else "", "value": value, "entity": entity,
                "need": t("Obligatoire") if required else t("Conseillé") if key in RECOMMENDED else t("Facultatif"),
                "options": [e for e in map(self._entity, allowed) if e], "warning": warning,
                # Recognised by their name and measure: listed first, the others after.
                "recognized": [i for i in recognized or [] if i in allowed],
                "better": self._entity(better) if better else None}

    def view(self) -> dict[str, Any]:
        # Each station field reads the same sensors: worked out once for the whole tab (detection.batch).
        with detection.batch():
            return self._view()

    def _view(self) -> dict[str, Any]:
        return {"title": self._title(), "extensions": inventory(self.hass, self.entry.options if self.entry else {}),
                # The same, as this draft would save them: the « Extensions » step's switches follow it.
                "in_draft": inventory(self.hass, self.sources),
                "official": official(self.hass, self.entry.entry_id if self.entry else None), "prevision": self._prevision(), "station": self._station(), "air": self._air(),
                "pollen": self._pollens(), "entities": self.entities(), "summary": self._summary(), "needs": self.needs()}

    def _prevision(self) -> dict[str, Any]:
        states, registry, _ = self._read()
        s = self.sources
        own = {i for i, e in registry.items() if i.startswith("weather.") and e.get("platform") == DOMAIN}
        vigilance = detection.vigilance_candidates(states, registry)
        return {
            "fields": [
                self._field("weather_entity", t("Service météo"), [st.entity_id for st in states if st.entity_id.startswith("weather.") and st.entity_id not in own],
                            required=True, warning="" if s.get("weather_entity") else t("Choisissez le service qui donne les prévisions.")),
                self._field("vigilance_entity", t("Vigilance officielle"), vigilance,
                            warning="" if vigilance or s.get("vigilance_entity") else
                            t("Aucun capteur de vigilance trouvé : installez Météo-France ou MeteoSwiss pour votre région, puis « Actualiser la détection ».")),
                self._field("season_entity", t("Saison"), detection.season_candidates(states, registry)),
                self._field("water_restriction_entity", t("Restrictions d’eau (Vigieau)"), detection.water_candidates(states, registry)),
                self._field("lightning_entity", t("Éclairs (Blitzortung)"), detection.lightning_candidates(states, registry)),
            ],
            "location": s.get("location") or "", "location_placeholder": self._title(),
            "advanced": [
                self._field("sun_entity", t("Soleil"), [st.entity_id for st in states if st.entity_id.startswith("sun.")]),
                self._field("sun_elevation_entity", t("Hauteur du soleil"),
                            [st.entity_id for st in states if st.entity_id.startswith("sensor.") and detection.measurement_matches(st, "sun_elevation_entity")]),
            ],
            "forecast_source": s.get("forecast_source") or "",
        }

    def station_model(self) -> str:
        s = self.sources
        if not s.get("station_model") and not any(s.get(f) for f in detection.STATION_FIELDS):
            return NONE
        return detection.selected_station_model(s)

    def _station(self) -> dict[str, Any]:
        states, registry, devices = self._read()
        s, model, groups = self.sources, self.station_model(), []
        netatmo = model == detection.NETATMO
        disabled = detection.netatmo_disabled(registry, devices, s) if netatmo else {}
        for name, title, group in detection.station_groups(model) if model != NONE else ():
            fields = []
            for field in group:
                value, found = s.get(field) or "", detection.candidates(states, field, registry, s, devices)
                warning, better = "", ""
                state = self.hass.states.get(value) if value else None
                if state is not None and not detection.function_matches(state, field, registry.get(value)):
                    warning = t("Ce capteur ne semble pas donner : {what}.", what=field_label(field).lower())
                    better = found[0] if len(found) == 1 and found[0] != value else ""
                elif s.get(field) is None and len(found) > 1:
                    warning = t("Plusieurs capteurs possibles : choisissez le bon.")
                elif field in disabled:
                    module = devices.get((registry.get(disabled[field]) or {}).get("device_id") or "") or {}
                    warning = t("Home Assistant livre ce capteur Netatmo désactivé : activez {entity} (appareil « {device} »), puis « Rechercher à nouveau les capteurs ».",
                                entity=disabled[field], device=module.get('name_by_user') or module.get('name') or 'Netatmo')
                fields.append(self._field(field, field_label(field), detection.manual_candidates(states, field, registry, s, devices),
                                          warning=warning, better=better, recognized=found))
            groups.append({"name": name, "title": t(title), "fields": fields})
        return {"model": model, "models": [{"value": v, "label": t(label), "hint": t(hint)} for v, label, hint in MODELS],
                "device": s.get("station_device_id") or NONE,
                "devices": [{"value": NONE, "label": t("Aucun appareil — capteurs séparés")},
                            *(self._netatmo_devices(devices) if netatmo else detection.source_devices(states, registry, devices))],
                "profile": t(detection.station_profile(states, registry, devices, s.get("station_device_id"))),
                "history": bool(s.get("station_history", True)), "history_help": t(HELP["station_history"]), "groups": groups}

    @staticmethod
    def _netatmo_devices(devices: dict[str, dict[str, Any]]) -> list[dict[str, str]]:
        """A Netatmo station is chosen as a whole, by its main module: its other modules come with it."""
        return [{"value": i, "label": str(devices[i].get("name_by_user") or devices[i].get("name") or i)} for i in detection.netatmo_stations(devices)]

    def _air(self) -> dict[str, Any]:
        """Like the pollens: the integration that gives the air first, then its zone."""
        s, areas = self.sources, self._areas()
        stations = self._stations()
        sources = [{"value": "atmo", "label": "Atmo France", "hint": t("La prévision de votre commune : indice de 1 à 6 et ses polluants"),
                    "available": bool(areas)},
                   {"value": "waqi", "label": "WAQI", "hint": t("La mesure d’une station près de chez vous ; demain : prévision Open-Meteo"),
                    "available": bool(stations)},
                   {"value": NONE, "label": t("Pas de qualité de l’air"), "hint": "", "available": True}]
        value = "waqi" if s.get("air_source") == "waqi" else "atmo" if s.get("air_source") != "none" and s.get("atmo_area") else NONE
        return {"value": value, "sources": sources, "area": s.get("atmo_area") or "", "areas": areas,
                "station": s.get("waqi_station") or "", "stations": stations}

    def _pollens(self) -> dict[str, Any]:
        states, registry, devices = self._read()
        areas, found, choice = self._areas(), self._pollen_found(), self.pollen_choice()
        sources = [{"value": "atmo", "label": polleninfo.source_label("atmo"), "hint": t("Un indice de 1 à 6 par espèce, pour une zone Atmo France"),
                    "available": bool(areas)},
                   *({"value": p, "label": polleninfo.source_label(p),
                      "hint": t("Groupes et espèces, niveaux de 1 à 4 ; aujourd’hui et demain" if p == polleninfo.KLEENEX else "Un capteur par espèce, niveaux de 0 à 4"), "available": found[p]} for p in polleninfo.PROVIDERS),
                   {"value": NONE, "label": t("Pas de pollens"), "hint": "", "available": True}]
        result: dict[str, Any] = {"value": choice, "sources": sources, "area": self.sources.get("atmo_pollen_area", self.sources.get("atmo_area")) or "", "areas": areas,
                                  "species": [], "risk": None, "station": self.sources.get("pollen_station") or "",
                                  "stations": polleninfo.places(states, registry, choice, devices) if choice in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX) else []}
        if choice in polleninfo.PROVIDERS:
            species, risks = polleninfo.candidates(states, registry, choice)
            if choice in (polleninfo.SWISS_POLLEN, polleninfo.KLEENEX):
                species = [i for i in species if polleninfo.place_of_source(i, registry, choice) == result["station"]]
            chosen = [p.get("id") for p in self.sources.get("pollens") or [] if isinstance(p, dict)]
            for entity_id in sorted(set(species) | set(chosen)):
                entity = self._entity(entity_id) or {}
                option = polleninfo.pollen_option(entity_id, self.hass.states.get(entity_id), registry)
                if choice == polleninfo.SWISS_POLLEN:
                    health = self.hass.states.get(option.get("station_state_entity", ""))
                    entity["available"] = entity.get("available", False) and health is not None and health.state == "online"
                    if not entity["available"]:
                        entity["state"] = t("station indisponible")
                elif choice == polleninfo.KLEENEX:
                    settings = _settings({**self.sources, "pollens": [option]})
                    level = polleninfo.usable_level(self.hass.states.get, settings, settings.pollens[0],
                                                   now=dt_util.utcnow(), zone=ZoneInfo(self.hass.config.time_zone))
                    entity["available"] = level is not None
                    entity["state"] = t(polleninfo.WORDS[level]) if level is not None else t("données indisponibles ou trop anciennes")
                result["species"].append({**entity, "label": option["nom"] or entity.get("name"), "chosen": entity_id in chosen})
            if choice == polleninfo.POLLENINFORMATION:
                result["risk"] = self._field("pollen_risk_entity", t("Risque allergique global"), risks)
        return result

    def entities(self) -> dict[str, Any]:
        """Existing place: its entities by family, ticked when enabled. New place: the families to start with."""
        if self.entry is None:
            chosen = set(self.sources.get("families") or [])
            return {"new": True, "families": [{"key": f, "name": family_label(f)[0], "hint": family_label(f)[1], "chosen": f in chosen}
                                              for f, _ in families.FAMILIES]}
        needs, present = families.needs(_settings(self.sources)), entity_keys(self.hass, self.entry)
        return {"new": False, "families": [
            {"key": f, "name": family_label(f)[0], "entities": [
                {"key": k, "name": entity_label(k)[0], "hint": entity_label(k)[1], "enabled": present[k],
                 "need": (t("Source facultative : {need}.", need=t(needs[k])) if k in families.STATION_DEPENDENT else t("Il faut {need}.", need=t(needs[k]))) if k in needs else "",
                 "optional": k in families.STATION_DEPENDENT} for k in keys if k in present]}
            for f, keys in families.FAMILIES if any(k in present for k in keys)]}

    def needs(self) -> list[str]:
        """What the enabled (or, for a new place, chosen) entities still miss."""
        needs = {k: text for k, text in families.needs(_settings(self.sources)).items() if k not in families.STATION_DEPENDENT}
        if self.entry is None:
            chosen = set(self.sources.get("families") or [])
            return [needs_text(k, text) for k, text in needs.items() if families.family_of(k) in chosen]
        present = entity_keys(self.hass, self.entry)
        return [needs_text(k, text) for k, text in needs.items() if present.get(k)]

    # ---- Saving ----

    async def save(self, enabled: list[str] | None) -> str:
        """Saves the place (a new one through the assistant, as Paramètres would) and its entities switched on or off."""
        sources = _clean(self.sources)
        if not sources.get("weather_entity") or self.hass.states.get(sources["weather_entity"]) is None:
            raise ValueError(t("Choisissez le service météo (étape Prévisions)."))
        if self.entry is None:
            result = await self.hass.config_entries.flow.async_init(DOMAIN, context={"source": "panel"},
                                                                    data={"title": self._title(), "options": sources})
            entry = result.get("result")
            return entry.entry_id if entry else ""
        entry = self.entry
        if enabled is not None:
            registry, prefix, changed = er.async_get(self.hass), f"{entry.entry_id}_", False
            for item in er.async_entries_for_config_entry(registry, entry.entry_id):
                if not item.unique_id.startswith(prefix):
                    continue
                key = item.unique_id.removeprefix(prefix)
                if key in enabled and item.disabled_by is not None:
                    registry.async_update_entity(item.entity_id, disabled_by=None)
                    changed = True
                elif key not in enabled and item.disabled_by is None:
                    registry.async_update_entity(item.entity_id, disabled_by=er.RegistryEntryDisabler.USER)
                    changed = True
            if changed and sources == dict(entry.options):
                # Enabled entities appear once the place restarts, even when no setting changed.
                self.hass.config_entries.async_schedule_reload(entry.entry_id)
        self.hass.config_entries.async_update_entry(entry, title=self._title(), options=sources)
        return entry.entry_id


def entity_keys(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, bool]:
    """This place's entities by key, and whether each is enabled."""
    prefix = f"{entry.entry_id}_"
    return {e.unique_id.removeprefix(prefix): e.disabled_by is None
            for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id) if e.unique_id.startswith(prefix)}


def linked(hass: HomeAssistant, entry_id: str) -> dict[str, int]:
    api = hass.data.get(API_KEY)
    return api.linked(entry_id) if api is not None else {}


def ecosystem_of(hass: HomeAssistant, entry_id: str) -> list[dict[str, str]]:
    installed = {e.domain for e in hass.config_entries.async_entries() if e.domain.startswith("hestia_")}
    return ecosystem.states(linked(hass, entry_id), installed)
