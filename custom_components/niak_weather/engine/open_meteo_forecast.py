"""The forecast pressure from Open-Meteo, no key, for weather services that do not forecast it (Météo-France among them).

The home's position is rounded to about a hundred metres. Only the sea-level pressure of the next two days is asked;
it fills the hours the weather service left without one, never replaces what it gives."""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from typing import Any, Mapping, Sequence

from .forecast import Hour
from .units import finite

NAME = "Open-Meteo"
URL = "https://api.open-meteo.com/v1/forecast"
REFRESH = timedelta(hours=1)
RETRY = timedelta(minutes=10)
HOUR = 3600


def params(latitude: float, longitude: float) -> dict[str, str]:
    """Two days of sea-level pressure by the hour, timed in seconds since 1970."""
    return {"latitude": f"{latitude:.3f}", "longitude": f"{longitude:.3f}", "hourly": "pressure_msl", "forecast_days": "2",
            "timeformat": "unixtime", "timezone": "GMT"}


@dataclass(frozen=True)
class Data:
    """The pressure in hPa by hour (seconds since 1970, on the hour), and when it was fetched."""

    pressure: Mapping[int, float]
    fetched: datetime


def parse(payload: Mapping[str, Any], fetched: datetime) -> Data:
    """Raises ValueError when there is nothing to read."""
    hourly = payload.get("hourly")
    if not isinstance(hourly, Mapping) or not isinstance(hourly.get("time"), list) or not isinstance(hourly.get("pressure_msl"), list):
        raise ValueError("Open-Meteo: no hourly pressure")
    values = hourly["pressure_msl"]
    pressure: dict[int, float] = {}
    for stamp, value in zip(hourly["time"], values):
        seconds, hpa = finite(stamp), finite(value)
        # Sea-level pressure stays between 870 and 1090 hPa: anything else is not a reading.
        if seconds is not None and hpa is not None and 850 <= hpa <= 1100:
            pressure[int(seconds) // HOUR * HOUR] = hpa
    if not pressure:
        raise ValueError("Open-Meteo: empty answer")
    return Data(pressure, fetched)


def needed(enabled: bool, hours: Sequence[Hour]) -> bool:
    """Asked only when the place allows it and its weather service gives hours without any pressure."""
    return enabled and bool(hours) and all(h.pressure is None for h in hours)


def fill(hours: Sequence[Hour], data: Data | None) -> list[Hour]:
    """The weather service's hours, those without a pressure taking Open-Meteo's for the same hour."""
    if data is None:
        return list(hours)
    out = []
    for h in hours:
        if h.pressure is None and h.time is not None:
            value = data.pressure.get(int(h.time.timestamp()) // HOUR * HOUR)
            if value is not None:
                h = replace(h, pressure=value)
        out.append(h)
    return out


def due(data: Data | None, tried: datetime | None, now: datetime) -> bool:
    """Ask again: no forecast or one an hour old, and the last try at least ten minutes ago."""
    return (data is None or now - data.fetched >= REFRESH) and (tried is None or now - tried >= RETRY)
