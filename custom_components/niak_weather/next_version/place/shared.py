"""What a place's coordinator and its parts share."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.helpers import entity_registry as er


RAIN_UNITS = ("mm", "in", "inch")

FORECAST_KINDS = (("daily", 1), ("hourly", 2))

def blitzortung_counter(registry: er.EntityRegistry, distance_id: str | None) -> str | None:
    """Blitzortung's strike counter, beside its distance sensor: their unique ids differ only by their last word."""
    entry = registry.async_get(distance_id) if distance_id else None
    if entry is None or entry.platform != "blitzortung" or not (entry.unique_id or "").endswith("-distance"):
        return None
    return registry.async_get_entity_id("sensor", "blitzortung", f"{entry.unique_id.removesuffix('-distance')}-counter")

def _ready(state: Any) -> bool:
    return state is not None and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)

def _seconds(value: Any) -> float:
    return value.timestamp() if isinstance(value, datetime) else float(value)
