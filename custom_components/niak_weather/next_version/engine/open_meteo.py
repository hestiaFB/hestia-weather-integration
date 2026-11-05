"""Tomorrow's air from Open-Meteo (European model Copernicus CAMS), no key: WAQI measures the air of the moment but gives no forecast.

Said on Atmo France's scale, 1 to 6, so that the same panels read it: each measure becomes a virtual Atmo sensor
(hestia_weather.open_meteo_pm25_tomorrow…) that only the engine sees. The European air quality index is cut every 20 points,
like the ATMO index since 2021; the day's level is the highest of its hours, like Atmo's daily index."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Mapping
from zoneinfo import ZoneInfo

from . import atmo
from .units import finite

NAME = "Open-Meteo"
ZONE = "prévision Copernicus"
URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
PREFIX = "hestia_weather.open_meteo_"
REFRESH = timedelta(hours=1)
RETRY = timedelta(minutes=10)

COLUMNS = {"air": "european_aqi", "pm25": "european_aqi_pm2_5", "pm10": "european_aqi_pm10", "no2": "european_aqi_nitrogen_dioxide",
           "o3": "european_aqi_ozone", "so2": "european_aqi_sulphur_dioxide"}
STEPS = (20, 40, 60, 80, 100)
"""Bon up to 20, Moyen up to 40… Extrêmement mauvais above 100."""


def params(latitude: float, longitude: float, zone: ZoneInfo) -> dict[str, str]:
    """Two days by the hour, in the place's time zone; the home's position rounded to about a hundred metres."""
    return {"latitude": f"{latitude:.3f}", "longitude": f"{longitude:.3f}", "hourly": ",".join(COLUMNS.values()),
            "forecast_days": "2", "timezone": zone.key, "domains": "cams_europe"}


def level(aqi: float) -> int:
    return 1 + sum(aqi > step for step in STEPS)


@dataclass(frozen=True)
class Data:
    """Each day's highest index per measure (None: the model gave nothing), and when it was fetched."""

    days: Mapping[date, Mapping[str, float | None]]
    fetched: datetime


def parse(payload: Mapping[str, Any], fetched: datetime) -> Data:
    """The hourly answer gathered by local day. Raises ValueError when there is nothing to read."""
    hourly = payload.get("hourly")
    if not isinstance(hourly, Mapping) or not isinstance(hourly.get("time"), list):
        raise ValueError("Open-Meteo: no hourly data")
    days: dict[date, dict[str, float | None]] = {}
    for i, stamp in enumerate(hourly["time"]):
        try:
            day = datetime.fromisoformat(str(stamp)).date()
        except ValueError:
            continue
        row = days.setdefault(day, dict.fromkeys(COLUMNS))
        for metric, column in COLUMNS.items():
            values = hourly.get(column)
            value = finite(values[i]) if isinstance(values, list) and i < len(values) else None
            if value is not None and value >= 0:
                before = row[metric]
                row[metric] = value if before is None else max(before, value)
    if not days:
        raise ValueError("Open-Meteo: empty answer")
    return Data(days, fetched)


@dataclass(frozen=True)
class State:
    """A virtual sensor in the shape of an Atmo France one."""

    entity_id: str
    state: str
    attributes: Mapping[str, Any]


def entity_id(metric: str) -> str:
    return f"{PREFIX}{metric}_tomorrow"


def is_virtual(entity: str | None) -> bool:
    return bool(entity) and str(entity).startswith(PREFIX)


def tomorrow(data: Data | None, now: datetime, zone: ZoneInfo) -> dict[str, State]:
    """Tomorrow's levels as Atmo sensors; nothing when the model has not given tomorrow."""
    row = data.days.get(now.astimezone(zone).date() + timedelta(days=1)) if data is not None else None
    if row is None or data is None:
        return {}
    stamp = data.fetched.astimezone(timezone.utc).isoformat()
    out = {}
    for metric in COLUMNS:
        aqi = row.get(metric)
        if aqi is not None:
            value = level(aqi)
            out[entity_id(metric)] = State(entity_id(metric), str(value), {"Nom de la zone": ZONE, "Date de mise à jour": stamp,
                                                                         "Libellé": atmo.AIR_LABELS[value]})
    return out


def due(data: Data | None, tried: datetime | None, now: datetime) -> bool:
    """Ask again: no forecast or one an hour old, and the last try at least ten minutes ago."""
    return (data is None or now - data.fetched >= REFRESH) and (tried is None or now - tried >= RETRY)
