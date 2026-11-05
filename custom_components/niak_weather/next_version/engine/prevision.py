"""The answer to « what weather between 16 h 15 and 17 h? »: for a school run, a trip, a calendar event."""
from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Any, Sequence
from zoneinfo import ZoneInfo

from .brief import number
from .catalogue import HOUR, rain_between
from .feel import Measures, normalise_condition, verdict
from .forecast import Day, Hour
from .local import CONDITION_TITLES
from .moisture import dew_point, humidex

# From the condition that matters most to the one that matters least: a window gets the most important sky it contains.
SEVERITY = ("hail", "lightning-rainy", "lightning", "pouring", "snowy-rainy", "snowy", "rainy", "fog", "exceptional", "windy-variant", "windy",
            "cloudy", "partlycloudy", "sunny", "clear-night")


def window(start: time | datetime, end: time | datetime, now: datetime, zone: ZoneInfo) -> tuple[datetime, datetime]:
    """Two moments from what the user wrote. A time alone is today, or tomorrow when the whole window is over; an end before
    its start is the next day (22:00 → 02:00)."""
    today = now.astimezone(zone).date()

    def moment(value: time | datetime) -> datetime:
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=zone)
        return datetime.combine(today, value, zone)

    first, last = moment(start), moment(end)
    if isinstance(end, time) and last <= first:
        last += timedelta(days=1)
    if isinstance(start, time) and isinstance(end, time) and last <= now:
        first, last = first + timedelta(days=1), last + timedelta(days=1)
    return first, last


class NoForecast(ValueError):
    """No forecast covers the window."""


def _worst(conditions: Sequence[str]) -> str | None:
    known = [c for c in (normalise_condition(c) for c in conditions) if c in SEVERITY]
    return min(known, key=SEVERITY.index) if known else None


def _feel(h: Hour) -> float | None:
    if h.temperature is None:
        return None
    dew = dew_point(h.temperature, h.humidity) if h.humidity is not None else None
    hot = humidex(h.temperature, dew) if dew is not None else None
    return verdict(Measures(temperature=h.temperature, humidity=h.humidity, humidex=hot if hot is not None and hot > h.temperature else None,
                            wind_speed=h.wind_speed, wind_gust=h.wind_gust, rain_rate=h.precipitation), h.condition).feels


def _range(values: Sequence[float | None]) -> tuple[float | None, float | None]:
    known = [v for v in values if v is not None]
    return (round(min(known), 1), round(max(known), 1)) if known else (None, None)


def forecast_window(hours: Sequence[Hour], days: Sequence[Day], start: datetime, end: datetime, zone: ZoneInfo) -> dict[str, Any]:
    """The weather between two moments, from the hourly forecast; from the daily forecast (partial) beyond it."""
    slots = [h for h in hours if h.time is not None and h.time < end and h.time + HOUR > start]
    answer: dict[str, Any] = {"debut": start.isoformat(), "fin": end.isoformat()}
    if slots:
        rain, partial = rain_between(slots, start, end)
        condition = _worst([h.condition for h in slots])
        t_min, t_max = _range([h.temperature for h in slots])
        f_min, f_max = _range([_feel(h) for h in slots])
        winds = [h.wind_speed for h in slots if h.wind_speed is not None]
        gusts = [h.wind_gust for h in slots if h.wind_gust is not None]
        answer |= {"pluie": rain, "condition": condition, "ciel": CONDITION_TITLES.get(condition or "", None), "temperature_min": t_min,
                   "temperature_max": t_max, "ressenti_min": f_min, "ressenti_max": f_max, "vent_max": round(max(winds)) if winds else None,
                   "rafales_max": round(max(gusts)) if gusts else None, "partiel": partial}
    else:
        covered = [d for d in days if start.astimezone(zone).date() <= d.time.astimezone(zone).date() <= end.astimezone(zone).date()]
        if not covered:
            raise NoForecast("Aucune prévision ne couvre ce créneau")
        condition = _worst([d.condition for d in covered])
        rains = [d.precipitation for d in covered if d.precipitation is not None]
        t_min, _ = _range([d.low for d in covered])
        _, t_max = _range([d.high for d in covered])
        # The day's rain, not the window's: said as partial.
        answer |= {"pluie": round(sum(rains), 1) if rains else None, "condition": condition, "ciel": CONDITION_TITLES.get(condition or "", None),
                   "temperature_min": t_min, "temperature_max": t_max, "ressenti_min": None, "ressenti_max": None, "vent_max": None,
                   "rafales_max": None, "partiel": True}
    parts = [answer["ciel"] or "Ciel inconnu"]
    if answer["pluie"] is not None and answer["pluie"] >= 0.1:
        parts.append(f"{number(answer['pluie'])} mm de pluie" + (" sur la journée" if not slots else ""))
    if answer["rafales_max"] is not None and answer["rafales_max"] >= 40:
        parts.append(f"rafales à {answer['rafales_max']} km/h")
    if t_min is not None and t_max is not None:
        parts.append(f"{number(t_min, 0)} °C" if round(t_min) == round(t_max) else f"{number(t_min, 0)} à {number(t_max, 0)} °C")
    answer["texte"] = ", ".join(parts)
    return answer
