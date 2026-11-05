"""When the next rain starts, to the minute when Météo-France's « rain within the hour » is there.

The hourly forecast only says that some rain falls during an hour: its first rainy slot is not a time.
Météo-France's radar forecast (its `next_rain` sensor) says, five minutes at a time, whether it rains in
the coming hour; when it is fresh, it has the last word on that hour, and the hourly forecast takes over
after it.
"""
from __future__ import annotations
from collections.abc import Mapping, Sequence
from datetime import datetime, timedelta
import re
from typing import Any

from .forecast import Hour

# Same threshold as the « next rain » of the hourly forecast: below it, a slot is dry.
RAIN_MM = 0.3
DRY = "temps sec"
# A radar forecast older than this no longer describes the coming hour.
MAX_AGE = timedelta(minutes=20)
SLOT = timedelta(minutes=5)
HORIZON = timedelta(hours=1)
_OFFSET = re.compile(r"^\s*(\d+)\s*min")


def _radar(attributes: Mapping[str, Any] | None, now: datetime) -> tuple[datetime, list[tuple[datetime, bool]]] | None:
    """The radar slots still to come, with the end of what it covers; None when absent, stale or unreadable."""
    if not attributes:
        return None
    try:
        reference = datetime.fromisoformat(str(attributes.get("forecast_time_ref")))
    except ValueError:
        return None
    table = attributes.get("1_hour_forecast")
    if reference.tzinfo is None or not isinstance(table, Mapping) or not table or now - reference > MAX_AGE:
        return None
    slots = []
    for key, label in table.items():
        match = _OFFSET.match(str(key))
        if match and isinstance(label, str):
            slots.append((reference + timedelta(minutes=int(match.group(1))), label.strip().casefold() != DRY))
    if not slots:
        return None
    slots.sort()
    # The last offset (« 55 min ») runs to the end of the hour.
    return reference + HORIZON, [(start, rainy) for start, rainy in slots if start + SLOT > now]


def rain_ahead(radar: Mapping[str, Any] | None, hours: Sequence[Hour], now: datetime) -> dict[str, Any]:
    """`minutes` before the next rain (0: it is due now), with `precision` « minute » (radar) or « hour » (hourly forecast).

    `dry_until` is the end of the radar's dry hour, when it saw no rain. Nothing known stays None."""
    result: dict[str, Any] = {"minutes": None, "precision": None, "source": None, "amount": None, "dry_until": None}
    seen = _radar(radar, now)
    after = now
    if seen is not None:
        end, slots = seen
        rainy = next((start for start, wet in slots if wet), None)
        if rainy is not None:
            return {**result, "minutes": max(0, round((rainy - now).total_seconds() / 60)), "precision": "minute", "source": "radar"}
        if slots:
            after = max(now, end)
            result["dry_until"] = end.isoformat()
    for hour in hours:
        if hour.time is None or (hour.precipitation or 0) < RAIN_MM or hour.time + HORIZON <= after:
            continue
        start = max(hour.time, after)
        return {**result, "minutes": max(0, round((start - now).total_seconds() / 60)), "precision": "hour",
                "source": "forecast", "amount": hour.precipitation}
    return result
