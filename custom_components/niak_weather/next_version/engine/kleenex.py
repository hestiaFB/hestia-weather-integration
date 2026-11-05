"""Read Kleenex/Scottex's existing HA entities, without fetching its service."""
from datetime import date, datetime, timedelta
import re
from typing import Any, Callable, Mapping
from zoneinfo import ZoneInfo

from .atmo import COLORS, Reading
from .i18n import N_, t
from .settings import LegacyPollen

DOMAIN = "kleenex_pollenradar"
NAME = "Kleenex Pollen Radar"
LEVELS = {"low": 1, "moderate": 2, "high": 3, "very-high": 4}
WORDS = (N_("Aucun"), N_("Faible"), N_("Modéré"), N_("Élevé"), N_("Très élevé"))
GROUPS = {"trees": ("Arbres", "mdi:tree-outline"), "grass": ("Graminées", "mdi:grass"), "weeds": ("Herbacées", "mdi:flower-pollen")}


def identity(entity_id: str, registry: Mapping[str, Mapping[str, Any]]) -> tuple[str, str] | None:
    entry = registry.get(entity_id) or {}
    if not entity_id.startswith("sensor.") or entry.get("platform") != DOMAIN or entry.get("disabled_by"):
        return None
    match = re.fullmatch(r"(.+)-Kleenex Pollen Radar(trees|grass|weeds|(?:trees|grass|weeds)_details-.+-level)", str(entry.get("unique_id") or ""))
    return (match[1], match[2]) if match else None


def option(entity_id: str, registry: Mapping[str, Mapping[str, Any]]) -> dict[str, str]:
    place, key = identity(entity_id, registry)
    if key in GROUPS:
        label, icon = GROUPS[key]
    else:
        group, detail = key.split("_details-", 1)
        label, icon = detail.removesuffix("-level"), GROUPS[group][1]
    result = {"id": entity_id, "nom": label, "ico": icon, "station": place}
    for key, field in (("date", "data_date_entity"), ("last_updated", "updated_entity"), ("error", "error_entity")):
        result[field] = next((i for i, e in registry.items() if e.get("platform") == DOMAIN and not e.get("disabled_by")
                              and e.get("unique_id") == f"{place}-{NAME}{key}"), "")
    return result


def _day(value: Any) -> date | None:
    try:
        return value.date() if isinstance(value, datetime) else date.fromisoformat(str(value))
    except ValueError:
        return None


def reading(get: Callable[[str], Any], pollen: LegacyPollen, tomorrow: bool, now: datetime, zone: ZoneInfo) -> Reading | None:
    state = get(pollen.entity_id)
    updated = get(pollen.updated_entity) if pollen.updated_entity else None
    day = get(pollen.data_date_entity) if pollen.data_date_entity else None
    error = get(pollen.error_entity) if pollen.error_entity else None
    if state is None or state.state in ("unknown", "unavailable") or updated is None or day is None:
        return None
    if error is not None and error.state not in ("", "None", "none"):
        return None
    try:
        stamp = datetime.fromisoformat(updated.state)
    except (TypeError, ValueError):
        return None
    if stamp.tzinfo is None or not timedelta(0) <= now - stamp <= timedelta(hours=48):
        return None
    today = now.astimezone(zone).date()
    if _day(day.state) != today:
        return None
    if tomorrow:
        forecast = state.attributes.get("forecast")
        if not isinstance(forecast, (list, tuple)):
            return None
        item = next((item for item in forecast if isinstance(item, Mapping) and _day(item.get("date")) == today + timedelta(days=1)), {})
        word = item.get("level")
    else:
        # Aggregate sensors are concentrations; only their explicit level is meaningful here.
        word = state.attributes.get("level", state.state)
    level = LEVELS.get(str(word))
    if level is None:
        return None
    return Reading(entity_id=pollen.entity_id, label=t(WORDS[level]), value=level, color=COLORS[level + 1],
                   zone="", updated=stamp.astimezone(zone).strftime("%d/%m %H:%M"), unit=None, stale=False)
