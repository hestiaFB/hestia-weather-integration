"""Pollens given one sensor per species, each on a scale from 0 (none) to 4 (very high). Said as it is, never converted to Atmo's scale of 1 to 6.

- Polleninformation EU (krissen/polleninformation): words or numbers, an overall allergy risk, today and tomorrow.
- IRM KMI (jdejaegh/irm-kmi-ha, Belgium): a colour per species, green to purple, today only; no overall risk.
- Swiss Pollen: current levels, guarded by station diagnostics.
- Kleenex/Scottex: levels 1 to 4 by group or species, with dated forecasts and freshness diagnostics."""
from __future__ import annotations

import re
from dataclasses import replace
from datetime import datetime, timedelta
from typing import Any, Callable, Mapping, Sequence
from zoneinfo import ZoneInfo

from . import atmo, kleenex
from .i18n import N_, t
from .settings import LegacyPollen, Settings
from .units import finite

SCALE = 4
POLLENINFORMATION, IRM_KMI, SWISS_POLLEN = "polleninformation", "irm_kmi", "swiss_pollen"
KLEENEX = kleenex.DOMAIN
PROVIDERS = {POLLENINFORMATION: "Polleninformation", IRM_KMI: "IRM KMI", SWISS_POLLEN: "Swiss Pollen", KLEENEX: "Kleenex / Scottex"}
COUNTRIES = {"atmo": N_("France"), POLLENINFORMATION: N_("Europe, selon les zones"), IRM_KMI: N_("Belgique"), SWISS_POLLEN: N_("Suisse"),
             KLEENEX: N_("France, Italie, Pays-Bas, Royaume-Uni, Irlande, États-Unis")}


def source_label(source: str) -> str:
    return f"{PROVIDERS.get(source, 'Atmo France')} ({t(COUNTRIES[source])})"
WORDS = (N_("Aucun"), N_("Faible"), N_("Modéré"), N_("Élevé"), N_("Très élevé"))
COLORS = atmo.COLORS[1:6]
# The sensor's word, in any of the languages it writes (French words are feminine: « élevée », « très élevée »).
_WORDS = {"none": 0, "aucun": 0, "aucune": 0, "low": 1, "faible": 1, "moderate": 2, "modere": 2, "moderee": 2, "high": 3, "eleve": 3, "elevee": 3,
          "fort": 3, "forte": 3, "very high": 4, "very_high": 4, "tres eleve": 4, "tres elevee": 4,
          # IRM KMI's colours (green: present but no risk; « none »: out of season).
          "green": 0, "yellow": 1, "orange": 2, "red": 3, "purple": 4,
          "medium": 2, "strong": 3, "very_strong": 4}
SPECIES = {"grasses": ("Graminées", "mdi:grass"), "ragweed": ("Ambroisie", "mdi:flower-pollen"), "mugwort": ("Armoise", "mdi:flower-pollen"),
           "olive": ("Olivier", "mdi:leaf-circle"), "birch": ("Bouleau", "mdi:tree-outline"), "alder": ("Aulne", "mdi:tree-outline"),
           "hazel": ("Noisetier", "mdi:tree-outline"), "ash": ("Frêne", "mdi:tree-outline"), "plane": ("Platane", "mdi:tree-outline"),
           "cypress": ("Cyprès", "mdi:pine-tree"), "oak": ("Chêne", "mdi:tree-outline"), "poplar": ("Peuplier", "mdi:tree-outline"),
           "beech": ("Hêtre", "mdi:tree-outline")}
_RISK = re.compile(r"_allergy_risk$")
_IRM = re.compile(r"-pollen-([a-z]+)$")


def provider(settings: Settings) -> str:
    """The integration the species sensors come from."""
    return settings.pollen_provider if settings.pollen_provider in PROVIDERS else POLLENINFORMATION


def swiss_identity(entity_id: str, registry: Mapping[str, Mapping[str, Any]]) -> tuple[str, str] | None:
    """A Swiss level sensor's station and species, independent of its translated or renamed entity id."""
    entry = registry.get(entity_id) or {}
    if not entity_id.startswith("sensor.") or entry.get("platform") != SWISS_POLLEN or entry.get("disabled_by"):
        return None
    match = re.fullmatch(r"([^.]+)\.([^.]+)\.level", str(entry.get("unique_id") or ""))
    return (match[1], match[2]) if match else None


def stations(states: Sequence[Any], registry: Mapping[str, Mapping[str, Any]], source: str = SWISS_POLLEN) -> list[str]:
    identify = kleenex.identity if source == KLEENEX else swiss_identity
    return sorted({identity[0] for s in states if (identity := identify(s.entity_id, registry))})


def place_of_source(entity_id: str, registry: Mapping[str, Mapping[str, Any]], source: str) -> str:
    identity = kleenex.identity(entity_id, registry) if source == KLEENEX else swiss_identity(entity_id, registry)
    return identity[0] if identity else ""


def places(states: Sequence[Any], registry: Mapping[str, Mapping[str, Any]], source: str,
           devices: Mapping[str, Mapping[str, Any]]) -> list[dict[str, str]]:
    result = []
    for place in stations(states, registry, source):
        entity = next(s.entity_id for s in states if place_of_source(s.entity_id, registry, source) == place)
        device = devices.get((registry.get(entity) or {}).get("device_id") or "") or {}
        label = str(device.get("name_by_user") or device.get("name") or place) if source == KLEENEX else place
        result.append({"value": place, "label": label})
    return result


def usable_level(get: Callable[[str], Any], settings: Settings, pollen: LegacyPollen, tomorrow: bool = False,
                 now: datetime | None = None, zone: ZoneInfo | None = None) -> int | None:
    """Swiss station diagnostics take precedence over a retained level, including an off-season zero."""
    if provider(settings) == KLEENEX:
        r = kleenex.reading(get, pollen, tomorrow, now, zone) if now is not None and zone is not None else None
        return r.value if r else None
    if provider(settings) == SWISS_POLLEN:
        health = get(pollen.station_state_entity) if pollen.station_state_entity else None
        if tomorrow or health is None or health.state != "online":
            return None
    return level(get(pollen.entity_id), tomorrow)


def provider_name(settings: Settings) -> str:
    return PROVIDERS[provider(settings)]


def level(state: Any, tomorrow: bool = False) -> int | None:
    """The level from 0 to 4: the sensor's number first, its word otherwise; None when unknown."""
    if state is None or state.state in ("unavailable", "unknown"):
        return None
    attributes: Mapping[str, Any] = state.attributes
    number = finite(attributes.get("tomorrow_numeric_state" if tomorrow else "numeric_state"))
    if number is None and not tomorrow:
        word = atmo.normal(state.state).strip()
        number = _WORDS.get(word, finite(state.state))
    return None if number is None else max(0, min(SCALE, int(round(number))))


def name(pollen: LegacyPollen, state: Any) -> str:
    """« Graminées »: the name chosen, else the species, else the sensor's own name without « Polleninformation (Lieu) »."""
    if pollen.name:
        return pollen.name
    slug = str(state.attributes.get("allergen_slug") or "") if state is not None else ""
    if slug in SPECIES:
        return SPECIES[slug][0]
    friendly = str(state.attributes.get("friendly_name") or "") if state is not None else ""
    return re.sub(r"^Polleninformation\s*(\([^)]*\))?\s*", "", friendly) or pollen.entity_id


def reading(state: Any, entity_id: str, tomorrow: bool, now: datetime, zone: ZoneInfo, label_name: str = "") -> atmo.Reading | None:
    """A Polleninformation sensor in the same shape as an Atmo reading, on the scale of 0 to 4."""
    if state is None:
        return None
    value = level(state, tomorrow)
    stamp = state.attributes.get("last_updated")
    published: datetime | None = None
    if isinstance(stamp, str):
        try:
            published = datetime.fromisoformat(stamp)
        except ValueError:
            published = None
    return atmo.Reading(entity_id=entity_id, label=label_name or (t(WORDS[value]) if value is not None else t("Indisponible")), value=value,
                        color=COLORS[value] if value is not None else atmo.COLORS[0], zone=str(state.attributes.get("location_title") or ""),
                        updated=published.astimezone(zone).strftime("%d/%m %H:%M") if published and published.tzinfo else "", unit=None,
                        stale=published is not None and published.tzinfo is not None and now - published > timedelta(hours=48))


def readings(get: Callable[[str], Any], settings: Settings, tomorrow: bool, now: datetime, zone: ZoneInfo
             ) -> tuple[atmo.Reading | None, list[tuple[str, atmo.Reading]]]:
    """The overall risk (or None), and each species with its name."""
    risk = reading(get(settings.pollen_risk_entity), settings.pollen_risk_entity, tomorrow, now, zone) if settings.pollen_risk_entity else None
    species = []
    for pollen in settings.pollens:
        state = get(pollen.entity_id)
        r = kleenex.reading(get, pollen, tomorrow, now, zone) if provider(settings) == KLEENEX else reading(state, pollen.entity_id, tomorrow, now, zone)
        if provider(settings) == SWISS_POLLEN:
            if tomorrow:
                continue
            value = usable_level(get, settings, pollen)
            r = replace(r, value=value, label=t(WORDS[value]) if value is not None else t("Indisponible"),
                        color=COLORS[value] if value is not None else atmo.COLORS[0], zone=pollen.station) if r is not None else None
        if r is not None:
            species.append((name(pollen, state), r))
    return risk, species


def worst(risk: atmo.Reading | None, species: Sequence[tuple[str, atmo.Reading]]) -> tuple[int | None, str | None]:
    """The day's level (the overall risk when there is one, else the worst species) and the species that weighs most."""
    known = [(n, r) for n, r in species if r.value is not None and not r.stale]
    top = max(known, key=lambda x: x[1].value or 0) if known else None
    if risk is not None and risk.value is not None and not risk.stale:
        return int(risk.value), top[0] if top and top[1].value else None
    return (int(top[1].value or 0), top[0] if top[1].value else None) if top else (None, None)


# ---- Detection, for the configuration form ----

def candidates(states: Sequence[Any], registry: Mapping[str, Mapping[str, Any]], source: str = POLLENINFORMATION) -> tuple[list[str], list[str]]:
    """The species sensors and the allergy-risk sensors of a source, by their integration (or, for Polleninformation, their name)."""
    if source == IRM_KMI:
        return sorted(state.entity_id for state in states if _irm_species(state.entity_id, registry)), []
    if source == SWISS_POLLEN:
        return sorted(s.entity_id for s in states if swiss_identity(s.entity_id, registry)), []
    if source == KLEENEX:
        return sorted(s.entity_id for s in states if kleenex.identity(s.entity_id, registry)), []
    species, risks = [], []
    for state in states:
        entity_id = state.entity_id
        if not entity_id.startswith("sensor."):
            continue
        entry = registry.get(entity_id) or {}
        ours = entry.get("platform") == "polleninformation" or entity_id.startswith("sensor.polleninformation_")
        if not ours or entry.get("disabled_by"):
            continue
        if _RISK.search(entity_id):
            risks.append(entity_id)
        elif state.attributes.get("allergen_slug") or state.attributes.get("type") == "pollen" or re.search(r"_(" + "|".join(SPECIES) + ")$", entity_id):
            species.append(entity_id)
    return sorted(species), sorted(risks)


def _irm_species(entity_id: str, registry: Mapping[str, Mapping[str, Any]]) -> str:
    """The species of an IRM KMI pollen sensor (its unique id ends with « -pollen-birch »), else ""."""
    entry = registry.get(entity_id) or {}
    if not entity_id.startswith("sensor.") or entry.get("platform") != IRM_KMI or entry.get("disabled_by"):
        return ""
    match = _IRM.search(str(entry.get("unique_id") or ""))
    return match.group(1) if match else ""


def place_of(entity_id: str, state: Any) -> str:
    slug = state.attributes.get("location_slug") if state is not None else None
    if slug:
        return str(slug)
    match = re.match(r"^sensor\.polleninformation_(.+?)_[a-z_]+$", entity_id)
    return match.group(1) if match else ""


def detect(states: Sequence[Any], registry: Mapping[str, Mapping[str, Any]], source: str = POLLENINFORMATION) -> dict[str, Any]:
    """The species and the risk of the only place, when there is just one: with several, the user chooses."""
    species, risks = candidates(states, registry, source)
    by_id = {s.entity_id: s for s in states}
    if source in (SWISS_POLLEN, KLEENEX):
        places = stations(states, registry, source)
        return {"pollens": [pollen_option(i, by_id.get(i), registry) for i in species], "pollen_station": places[0]} if len(places) == 1 else {}
    if source == IRM_KMI:
        places = {(registry.get(i) or {}).get("config_entry_id") for i in species}
        return {"pollens": [pollen_option(i, by_id.get(i), registry) for i in species]} if len(places) == 1 else {}
    places = {place_of(i, by_id.get(i)) for i in (*species, *risks)}
    if len(places) != 1:
        return {}
    found: dict[str, Any] = {"pollens": [pollen_option(i, by_id.get(i)) for i in species]}
    if risks:
        found["pollen_risk_entity"] = risks[0]
    return found


def pollen_option(entity_id: str, state: Any, registry: Mapping[str, Mapping[str, Any]] | None = None) -> dict[str, str]:
    """A species as the settings store it."""
    if kleenex.identity(entity_id, registry or {}):
        return kleenex.option(entity_id, registry or {})
    identity = swiss_identity(entity_id, registry or {})
    slug = (identity[1].lower() if identity else "") or _irm_species(entity_id, registry or {}) or (str(state.attributes.get("allergen_slug") or "") if state is not None else "")
    if slug == "grass":
        slug = "grasses"
    if not slug:
        match = re.search(r"_([a-z]+)$", entity_id)
        slug = match.group(1) if match else ""
    label, icon = SPECIES.get(slug, ("", "mdi:flower-pollen"))
    option = {"id": entity_id, "nom": label, "ico": icon}
    if identity:
        station, plant = identity
        diagnostic = next((i for i, e in (registry or {}).items() if e.get("platform") == SWISS_POLLEN
                           and e.get("unique_id") == f"{station}.{plant}.station_state" and not e.get("disabled_by")), "")
        option.update(station=station, station_state_entity=diagnostic)
    return option
