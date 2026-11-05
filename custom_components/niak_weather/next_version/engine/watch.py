"""Alerts over time: when each one starts, changes level and ends, for the yes/no sensors and the `hestia_weather_alerte` event.

An alert ends only after it has been absent for a while, so a gust hovering around 40 km/h does not send ten notifications.
An unknown value (station or forecast unavailable, a restart) never ends an alert: only a real « no » does.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Mapping

from .catalogue import ALERTS, Item

HOLD = timedelta(minutes=15)
HOLDS = {"vigilance": timedelta(0)}
"""The official vigilance is published, not measured: it ends as soon as Météo-France lifts it."""
END_TEXTS = {"vigilance": "Vigilance levée", "orage": "L’orage est passé", "vent_fort": "Le vent est retombé",
             "pluie_forte": "La forte pluie est passée", "gel": "Plus de gel prévu", "canicule": "La chaleur retombe",
             "uv_fort": "Les UV redeviennent modérés"}


@dataclass(frozen=True)
class AlertState:
    """An alert in progress."""

    level: int
    text: str
    source: str | None
    since: float
    """When it started, in seconds since 1970."""


@dataclass(frozen=True)
class AlertEvent:
    type: str
    phase: str
    """« debut », « change » or « fin »."""
    level: int
    source: str | None
    text: str


@dataclass
class _Active:
    level: int
    text: str
    source: str | None
    since: float
    seen: float
    """The last time the alert was observed."""
    level_seen: float
    """The last time its current level was observed: a lower level replaces it only after the hold."""


def status(key: str, item: Item | None) -> tuple[bool | None, int]:
    """Whether the alert is there (None when unknown) and its level."""
    if item is None or item.value is None:
        return None, 0
    if key == "vigilance":
        return item.level > 0, item.level
    return bool(item.value), max(1, item.level) if item.value else 0


class AlertWatch:
    def __init__(self, stored: Mapping[str, Any] | None = None) -> None:
        self._active: dict[str, _Active] = {}
        for key, data in (stored or {}).items():
            try:
                if key in ALERTS:
                    self._active[key] = _Active(int(data["level"]), str(data["text"]), data.get("source"), float(data["since"]),
                                                float(data["seen"]), float(data.get("level_seen", data["seen"])))
            except (KeyError, TypeError, ValueError):
                continue

    def update(self, catalogue: Mapping[str, Item], now: datetime) -> list[AlertEvent]:
        """Compares the catalogue with the alerts in progress; returns what started, changed or ended."""
        t = now.timestamp()
        events: list[AlertEvent] = []
        for key in ALERTS:
            item = catalogue.get(key)
            present, level = status(key, item)
            hold = HOLDS.get(key, HOLD).total_seconds()
            current = self._active.get(key)
            if present and item is not None:
                if current is None:
                    self._active[key] = _Active(level, item.reason, item.source, t, t, t)
                    events.append(AlertEvent(key, "debut", level, item.source, item.reason))
                    continue
                native_change = key == "vigilance" and item.extra.get("fournisseur") == "MétéoSuisse" and item.reason != current.text
                current.seen, current.text, current.source = t, item.reason, item.source
                if native_change or level > current.level or (level < current.level and t - current.level_seen >= hold):
                    current.level, current.level_seen = level, t
                    events.append(AlertEvent(key, "change", level, item.source, item.reason))
                elif level == current.level:
                    current.level_seen = t
            elif present is False and current is not None and t - current.seen >= hold:
                del self._active[key]
                events.append(AlertEvent(key, "fin", current.level, current.source, END_TEXTS[key]))
        return events

    def states(self) -> dict[str, AlertState]:
        return {k: AlertState(a.level, a.text, a.source, a.since) for k, a in self._active.items()}

    def as_dict(self) -> dict[str, Any]:
        """What survives a restart."""
        return {k: {"level": a.level, "text": a.text, "source": a.source, "since": a.since, "seen": a.seen, "level_seen": a.level_seen}
                for k, a in self._active.items()}
