"""Forecasts from Home Assistant's weather.get_forecasts, in engine units and in the local time of the installation."""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Iterable, Mapping, Sequence
from zoneinfo import ZoneInfo

from .units import Kind, finite, measurement


@dataclass(frozen=True)
class Hour:
    """One hour of forecast."""

    time: datetime | None = None
    temperature: float | None = None
    precipitation: float | None = None
    condition: str = ""
    wind_speed: float | None = None
    wind_gust: float | None = None
    wind_bearing: float | None = None
    humidity: float | None = None
    cloud_coverage: float | None = None
    pressure: float | None = None
    """Sea-level pressure in hPa, when the provider gives it (Météo-France does not)."""


@dataclass(frozen=True)
class Day:
    """One day of forecast."""

    time: datetime
    condition: str = ""
    high: float | None = None
    low: float | None = None
    precipitation: float | None = None


@dataclass(frozen=True)
class Units:
    """The units the weather entity publishes its forecasts in."""

    temperature: str = "°C"
    precipitation: str = "mm"
    wind: str = "km/h"
    pressure: str = "hPa"


# Forecast fields carrying a measure, converted to the engine's units when Hestia Weather passes a forecast on.
_ROW_KINDS = {"temperature": Kind.TEMPERATURE, "templow": Kind.TEMPERATURE, "apparent_temperature": Kind.TEMPERATURE, "dew_point": Kind.TEMPERATURE,
              "precipitation": Kind.RAIN, "wind_speed": Kind.WIND, "wind_gust_speed": Kind.WIND, "pressure": Kind.PRESSURE}


def engine_rows(rows: Iterable[Mapping[str, Any]], units: Units) -> list[dict[str, Any]]:
    """The provider's forecast as it came, its measures in °C, mm, km/h and hPa; a measure that cannot be read is left out."""
    unit = {Kind.TEMPERATURE: units.temperature, Kind.RAIN: units.precipitation, Kind.WIND: units.wind, Kind.PRESSURE: units.pressure}
    out = []
    for row in rows:
        converted = dict(row)
        for key, kind in _ROW_KINDS.items():
            if key in converted:
                value = measurement(converted[key], unit[kind], kind)
                if value is None:
                    del converted[key]
                else:
                    converted[key] = round(value, 2)
        out.append(converted)
    return out


def parse_time(value: Any) -> datetime | None:
    try:
        moment = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=ZoneInfo("UTC"))


def _condition(value: Any) -> str:
    return str(value or "").replace("_", "-")


def parse_hours(rows: Iterable[Mapping[str, Any]], units: Units = Units()) -> list[Hour]:
    return [Hour(time=parse_time(r.get("datetime")), temperature=measurement(r.get("temperature"), units.temperature, Kind.TEMPERATURE),
                 precipitation=measurement(r.get("precipitation"), units.precipitation, Kind.RAIN), condition=_condition(r.get("condition")),
                 wind_speed=measurement(r.get("wind_speed"), units.wind, Kind.WIND), wind_gust=measurement(r.get("wind_gust_speed"), units.wind, Kind.WIND),
                 wind_bearing=finite(r.get("wind_bearing")), humidity=finite(r.get("humidity")), cloud_coverage=finite(r.get("cloud_coverage")),
                 pressure=measurement(r.get("pressure"), units.pressure, Kind.PRESSURE))
            for r in rows]


def parse_days(rows: Iterable[Mapping[str, Any]], units: Units = Units()) -> list[Day]:
    days = []
    for r in rows:
        moment = parse_time(r.get("datetime"))
        if moment is None:
            continue
        days.append(Day(time=moment, condition=_condition(r.get("condition")),
                        high=measurement(r.get("temperature"), units.temperature, Kind.TEMPERATURE),
                        low=measurement(r.get("templow"), units.temperature, Kind.TEMPERATURE),
                        precipitation=measurement(r.get("precipitation"), units.precipitation, Kind.RAIN)))
    return days


def local_day(moment: datetime, zone: ZoneInfo) -> date:
    return moment.astimezone(zone).date()


def day_offset(moment: datetime, now: datetime, zone: ZoneInfo) -> int:
    """0 today, 1 tomorrow… in the installation's time zone, midnight included."""
    return (local_day(moment, zone) - local_day(now, zone)).days


@dataclass(frozen=True)
class DayWind:
    speed: float
    gust: float | None
    bearing: float | None
    """Where the wind comes from, in degrees, weighted by its speed."""


def daily_wind(hours: Sequence[Hour], now: datetime, zone: ZoneInfo) -> dict[int, DayWind]:
    """The strongest wind and the prevailing direction of each local day, from the hourly forecast (daily forecasts carry no wind)."""
    totals: dict[int, dict[str, float]] = {}
    for h in hours:
        if h.time is None or h.wind_speed is None or h.time < now - timedelta(hours=1):
            continue
        day = day_offset(h.time, now, zone)
        cur = totals.setdefault(day, {"v": 0.0, "x": 0.0, "y": 0.0, "n": 0})
        cur["v"] = max(cur["v"], h.wind_speed)
        cur["n"] += 1
        if h.wind_gust is not None and h.wind_gust > 0:
            cur["g"] = max(cur.get("g", 0.0), h.wind_gust)
        if h.wind_bearing is not None:
            weight = max(h.wind_speed, 0.1)
            cur["x"] += math.sin(math.radians(h.wind_bearing)) * weight
            cur["y"] += math.cos(math.radians(h.wind_bearing)) * weight
    # A day needs a few hours of forecast for a meaningful maximum (today counts from now on).
    return {day: DayWind(speed=round(w["v"], 0), gust=round(w["g"], 0) if "g" in w else None,
                         bearing=round((math.degrees(math.atan2(w["x"], w["y"])) + 360) % 360, 0) if w["x"] or w["y"] else None)
            for day, w in totals.items() if w["n"] >= (1 if day == 0 else 6)}
