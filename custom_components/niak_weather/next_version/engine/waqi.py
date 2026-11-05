"""Air measured by a station, from Home Assistant's World Air Quality Index integration (waqi), with tomorrow from Open-Meteo.

WAQI gives each pollutant as a sub-index on the American scale (0 to 500), not as a concentration. It is turned back into a
concentration with the American breakpoints, then cut at the ATMO index's thresholds (2021), so that the panels read
1 to 6 as with Atmo France. An approximation: the American index uses other averaging periods, ozone over eight hours.
The air index is the worst of the station's pollutants; a station without them falls back on its overall index and the
pollutant WAQI says dominates. Today is the measure of the moment; WAQI gives no forecast, tomorrow is Open-Meteo's."""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from typing import Any, Callable, Mapping
from zoneinfo import ZoneInfo

from . import atmo, open_meteo
from .settings import WAQI_KEYS, Settings, atmo_key, waqi_key
from .units import finite

DOMAIN = "waqi"
NAME = "WAQI"
POLLUTANTS = ("pm25", "pm10", "no2", "o3", "so2")
KEYS = {"air": "air_quality", "pm25": "pm25", "pm10": "pm10", "no2": "nitrogen_dioxide", "o3": "ozone", "so2": "sulphur_dioxide",
        "dominant": "dominant_pollutant"}
"""Our measure → the WAQI sensor's key, the end of its unique id « <station>_<key> »."""

# American index → concentration (µg/m³ for particles, ppb for gases), by straight lines between breakpoints.
_INDEX = (0, 50, 100, 150, 200, 300, 500)
_US = {"pm25": (0, 12, 35.4, 55.4, 150.4, 250.4, 500.4), "pm10": (0, 54, 154, 254, 354, 424, 604),
       "o3": (0, 54, 70, 85, 105, 200, 404), "no2": (0, 53, 100, 360, 649, 1249, 2049), "so2": (0, 35, 75, 185, 304, 604, 1004)}
_PPB = {"o3": 2.0, "no2": 1.91, "so2": 2.66}
"""ppb → µg/m³ at 20 °C."""
ATMO_STEPS = {"pm25": (10, 20, 25, 50, 75), "pm10": (20, 40, 50, 100, 150), "no2": (40, 90, 120, 230, 340),
              "o3": (50, 100, 130, 240, 380), "so2": (100, 200, 350, 500, 750)}
"""Upper bound of levels 1 to 5 of the ATMO index, in µg/m³."""


def concentration(pollutant: str, index: float) -> float:
    """The concentration (µg/m³) behind an American sub-index; above 500, the last line goes on."""
    points, index = _US[pollutant], max(0.0, index)
    i = next((i for i in range(1, len(_INDEX)) if index <= _INDEX[i]), len(_INDEX) - 1)
    low, high = _INDEX[i - 1], _INDEX[i]
    value = points[i - 1] + (index - low) * (points[i] - points[i - 1]) / (high - low)
    return value * _PPB.get(pollutant, 1)


def level(pollutant: str, index: float) -> int:
    """An American sub-index on the ATMO scale, 1 (Bon) to 6 (Extrêmement mauvais)."""
    value = concentration(pollutant, index)
    return 1 + sum(value > step for step in ATMO_STEPS[pollutant])


# ---- Detection, for the settings ----

def identity(entity_id: str, registry: Mapping[str, Mapping[str, Any]]) -> tuple[str, str] | None:
    """A WAQI sensor's station and measure (« pm25 », « air »…), from its unique id, whatever its name."""
    entry = registry.get(entity_id) or {}
    if not entity_id.startswith("sensor.") or entry.get("platform") != DOMAIN or entry.get("disabled_by"):
        return None
    unique = str(entry.get("unique_id") or "")
    for metric, key in KEYS.items():
        if unique.endswith(f"_{key}"):
            return unique[:-len(key) - 1], metric
    return None


def stations(registry: Mapping[str, Mapping[str, Any]], devices: Mapping[str, Mapping[str, Any]]) -> list[dict[str, str]]:
    """The WAQI stations added in Home Assistant, by the name of their device."""
    found: dict[str, str] = {}
    for entity_id, entry in registry.items():
        ident = identity(entity_id, registry)
        if ident:
            device = devices.get(entry.get("device_id") or "") or {}
            found.setdefault(ident[0], str(device.get("name_by_user") or device.get("name") or f"Station {ident[0]}"))
    return sorted(({"value": k, "label": v} for k, v in found.items()), key=lambda s: s["label"])


def detect(registry: Mapping[str, Mapping[str, Any]], devices: Mapping[str, Mapping[str, Any]], station: str) -> dict[str, str]:
    """The settings of one station: its name and each of its sensors (empty when the station does not measure it)."""
    found = dict.fromkeys(WAQI_KEYS, "")
    for entity_id in sorted(registry):
        ident = identity(entity_id, registry)
        if ident and ident[0] == station:
            found[waqi_key(ident[1])] = entity_id
    label = next((s["label"] for s in stations(registry, devices) if s["value"] == station), "")
    return {**found, "waqi_station": station, "waqi_place": label}


# ---- Reading, as Atmo France sensors ----

def _number(state: Any) -> float | None:
    if state is None or state.state in ("unavailable", "unknown"):
        return None
    return finite(state.state)


def _stamp(state: Any) -> str:
    when = getattr(state, "last_reported", None) or getattr(state, "last_updated", None)
    return when.astimezone(timezone.utc).isoformat() if isinstance(when, datetime) and when.tzinfo else ""


def today(get: Callable[[str], Any], settings: Settings) -> dict[str, open_meteo.State]:
    """The station's levels, each under the WAQI sensor's own id (a tap opens it); « unavailable » when it gives nothing."""
    out: dict[str, open_meteo.State] = {}
    zone = f"station {settings.waqi_place}" if settings.waqi_place else "station WAQI"
    levels = []

    def put(entity_id: str, value: int | None, state: Any) -> None:
        attributes = {"Nom de la zone": zone, "Date de mise à jour": _stamp(state)}
        if value is None:
            out[entity_id] = open_meteo.State(entity_id, "unavailable", attributes)
        else:
            out[entity_id] = open_meteo.State(entity_id, str(value), {**attributes, "Libellé": atmo.AIR_LABELS[value]})

    for pollutant in POLLUTANTS:
        entity_id = settings.waqi.get(waqi_key(pollutant))
        if not entity_id:
            continue
        state = get(entity_id)
        index = _number(state)
        value = level(pollutant, index) if index is not None else None
        if value is not None:
            levels.append(value)
        put(entity_id, value, state)
    entity_id = settings.waqi.get(waqi_key("air"))
    if entity_id:
        state = get(entity_id)
        overall = _number(state)
        dominant = get(settings.waqi.get(waqi_key("dominant")) or "")
        main = dominant.state if dominant is not None and dominant.state in POLLUTANTS else "pm25"
        put(entity_id, None if overall is None else max(levels) if levels else level(main, overall), state)
    return out


def overlay(settings: Settings, get: Callable[[str], Any], forecast: open_meteo.Data | None, now: datetime, zone: ZoneInfo
            ) -> tuple[Settings, Callable[[str], Any]]:
    """With WAQI as the air source: the settings and the reader the engine uses, the station today and Open-Meteo tomorrow
    standing where Atmo France's air sensors would be. Any other source is left as it is."""
    if settings.air_source != "waqi":
        return settings, get
    air = {atmo_key(m, t) for m in ("air", *POLLUTANTS) for t in (False, True)}
    sensors = {k: v for k, v in settings.atmo.items() if k not in air}
    for metric in ("air", *POLLUTANTS):
        if settings.waqi.get(waqi_key(metric)):
            sensors[atmo_key(metric)] = settings.waqi[waqi_key(metric)]
        sensors[atmo_key(metric, True)] = open_meteo.entity_id(metric)
    virtual = {**today(get, settings), **open_meteo.tomorrow(forecast, now, zone)}

    def read(entity_id: str) -> Any:
        if entity_id in virtual:
            return virtual[entity_id]
        return None if open_meteo.is_virtual(entity_id) else get(entity_id)
    return replace(settings, atmo=sensors), read


def source(settings: Settings, entity_id: str | None) -> str | None:
    """Who gives an air reading, when it is not Atmo France."""
    if open_meteo.is_virtual(entity_id):
        return open_meteo.NAME
    if settings.air_source == "waqi" and entity_id and entity_id in settings.waqi.values():
        return NAME
    return None
