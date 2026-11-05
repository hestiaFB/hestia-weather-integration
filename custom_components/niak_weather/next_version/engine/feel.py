"""The feel and the observed condition: the rules first developed for the original Hestia dashboard.

Each effect is rounded on its own before being added, like the original template did.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Sequence

from .forecast import Hour


class Alert(StrEnum):
    """The station's own alert, from measurements and the next hours of forecast."""

    THUNDERSTORM = "thunderstorm"
    DOWNPOUR = "downpour"
    GUSTS = "gusts"
    HEATWAVE = "heatwave"
    FROST = "frost"
    HEAT = "heat"
    COLD = "cold"
    UV = "uv"


class Level(StrEnum):
    OPTIMIZED = "optimized"
    ACTION = "action"
    URGENT = "urgent"


@dataclass(frozen=True)
class Effects:
    """What each cause adds to the thermometer (°C, negative when it cools)."""

    wind: float = 0
    sun: float = 0
    rain: float = 0
    night: float = 0


@dataclass(frozen=True)
class Measures:
    """The local readings the rules work from (engine units)."""

    temperature: float | None = None
    humidity: float | None = None
    humidex: float | None = None
    wind_speed: float | None = None
    wind_gust: float | None = None
    solar_radiation: float | None = None
    sun_elevation: float | None = None
    rain_rate: float | None = None
    dew_point: float | None = None
    uv_index: float | None = None
    cloud_coverage: float | None = None


@dataclass(frozen=True)
class Verdict:
    feels: float | None
    effects: Effects
    condition: str
    observed: bool
    """The condition comes from the station (rain, fog, sunshine measured here), not from the forecast."""
    rain_level: int
    next_rain_hours: int | None
    next_rain_amount: float | None
    alert: Alert | None
    level: Level
    effective_wind: float | None = field(default=None)


def _clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def normalise_condition(condition: str | None) -> str:
    return (condition or "unknown").replace("_", "-", 1)


STORMY = ("lightning", "lightning-rainy", "hail")
# Falling rain or snow saturates the air: 99 % humidity then says nothing about fog.
WET = ("rainy", "pouring", "lightning-rainy", "snowy", "snowy-rainy", "hail")


def verdict(m: Measures, forecast_condition: str | None, hours: Sequence[Hour] = ()) -> Verdict:
    """The feel, its causes, the condition seen at home and the alert, from the station and the forecast."""
    base = m.humidex if m.humidex is not None else m.temperature
    wind, gust, solar, elevation = m.wind_speed, m.wind_gust, m.solar_radiation, m.sun_elevation
    forecast = normalise_condition(forecast_condition)

    effective = None if wind is None or wind < 0 else round(max(wind * 0.75 + max(wind, gust if gust is not None else wind) * 0.25 - 3, 0), 1)
    wind_effect = 0.0
    if effective is not None and base is not None:
        coefficient = -0.15 if base > 27 else -0.25
        if m.temperature is not None and m.temperature > 32:
            # Above 32 °C a dry wind heats like a furnace; a humid one still cools a little.
            wetness = _clamp(((m.humidity if m.humidity is not None else 50) - 25) / 25, 0, 1)
            furnace = -0.08 * (1 - wetness) + 0.06 * wetness
            transition = _clamp((m.temperature - 32) / 3, 0, 1)
            coefficient = coefficient * (1 - transition) + furnace * transition
        wind_effect = round(_clamp(coefficient * effective, -6, 1.5), 1)
    sun_effect = min(round(solar / 300, 1), 3.5) if elevation is not None and elevation > 5 and solar is not None and solar > 50 else 0
    rain_effect = (round(-1.5 * min(m.rain_rate / 2, 1) * (1 + min(effective or 0, 30) / 60), 1)
                   if m.rain_rate is not None and m.rain_rate >= 0.3 else 0)
    night_effect = (round(-1 * (1 - m.cloud_coverage / 40), 1)
                    if elevation is not None and elevation <= -3 and m.cloud_coverage is not None and m.cloud_coverage < 40 else 0)
    feels = None if base is None else round(base + wind_effect + sun_effect + rain_effect + night_effect, 1)

    rate = m.rain_rate
    rain_level = 0 if rate is None or rate < 0.3 else 1 if rate < 1 else 2 if rate < 4 else 3 if rate < 12 else 4
    fog = (m.humidity is not None and m.humidity >= 97 and m.temperature is not None and m.dew_point is not None
           and m.temperature - m.dew_point <= 0.4 and rain_level == 0
           # Without a gauge reading, the bulletin's rain wins: only a gauge measuring nothing can contradict it.
           and not (rate is None and forecast in WET))
    sunshine = solar is not None and solar >= 350
    observed = ""
    if not forecast.startswith("snow"):
        observed = "pouring" if rain_level >= 3 else "rainy" if rain_level >= 1 else ""
    if not observed and fog:
        observed = "fog"
    if not observed and sunshine and forecast in ("cloudy", "fog", "rainy", "pouring", "lightning", "lightning-rainy"):
        observed = "partlycloudy"

    rain_index = next((i for i, h in enumerate(hours) if (h.precipitation or 0) >= 0.3), None)
    storm = any(normalise_condition(h.condition) in STORMY for h in hours[:6])

    alert: Alert | None = None
    if storm:
        alert = Alert.THUNDERSTORM
    elif rain_level == 4:
        alert = Alert.DOWNPOUR
    elif gust is not None and gust >= 80:
        alert = Alert.GUSTS
    elif feels is not None and feels >= 38:
        alert = Alert.HEATWAVE
    elif feels is not None and feels <= -3:
        alert = Alert.FROST
    elif gust is not None and gust >= 60:
        alert = Alert.GUSTS
    elif feels is not None and feels >= 34:
        alert = Alert.HEAT
    elif feels is not None and feels <= 2:
        alert = Alert.COLD
    elif m.uv_index is not None and m.uv_index >= 8:
        alert = Alert.UV
    urgent = alert in (Alert.THUNDERSTORM, Alert.HEATWAVE, Alert.FROST) or (alert is Alert.GUSTS and (gust or 0) >= 80)
    level = Level.URGENT if urgent else Level.ACTION if alert else Level.OPTIMIZED

    return Verdict(feels=feels, effects=Effects(wind_effect, sun_effect, rain_effect, night_effect),
                   condition=observed or forecast, observed=bool(observed), rain_level=rain_level,
                   next_rain_hours=rain_index, next_rain_amount=None if rain_index is None else hours[rain_index].precipitation,
                   alert=alert, level=level, effective_wind=effective)
