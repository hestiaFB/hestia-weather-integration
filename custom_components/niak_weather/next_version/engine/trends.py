"""How pressure and wind have changed, from the Recorder history of the station's sensors."""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import NamedTuple, Sequence

from .i18n import N_, t
from .units import Kind, measurement


class Change(NamedTuple):
    """A recorded state change: when (seconds since 1970) and the state as Home Assistant wrote it."""

    time: float
    state: str


class Direction(StrEnum):
    RISING = "hausse"
    FALLING = "baisse"
    STEADY = "stable"


@dataclass(frozen=True)
class Trend:
    change: float | None
    """Difference with the reference reading, None while the history is too short."""
    minutes: float
    """How long ago the reference reading was (at most the window)."""
    direction: Direction | None
    text: str


def trend(history: Sequence[Change], value: float | None, now: float, kind: Kind, unit: str = "") -> Trend:
    """Change over 3 h for the pressure, over 1 h for the wind."""
    pressure = kind is Kind.PRESSURE
    window, minimum, limit = (10800, 20, 1) if pressure else (3600, 15, 3)
    points = sorted(((c.time, measurement(c.state, unit, kind)) for c in history if c.time <= now), key=lambda p: p[0])
    # Recorder records changes, not regular samples: the state just before the window stays
    # the reference until the next change (unless it was unavailable).
    boundary = next((p for p in reversed(points) if p[0] <= now - window), None)
    first = boundary if boundary is not None and boundary[1] is not None else next(
        (p for p in points if p[0] >= now - window and p[1] is not None), None)
    minutes = round(min(window, now - first[0]) / 60, 0) if first else 0
    change = round(value - first[1], 1) if first and value is not None and minutes >= minimum else None
    if change is None:
        return Trend(None, minutes, None, "")
    direction = Direction.RISING if change >= limit else Direction.FALLING if change <= -limit else Direction.STEADY
    size = abs(change)
    if not pressure:
        text = t({"hausse": N_("le vent se lève"), "baisse": N_("le vent faiblit")}.get(direction, N_("vent régulier")))
    elif size < 1:
        text = t("temps installé")
    elif direction is Direction.FALLING:
        text = t("chute rapide") if size >= 6 else t("le temps se gâte") if size >= 3 else t("légère baisse")
    else:
        text = t("ça se dégage") if size >= 6 else t("amélioration") if size >= 3 else t("légère hausse")
    return Trend(change, minutes, direction, text)
