"""MeteoSwiss warning attributes exposed by izacus/hass-swissweather.

Keep native degrees alongside Hestia's presentation severity (0-3). No network access.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from .i18n import N_

TYPES = {"wind": N_("Vent"), "thunderstorms": N_("Orages"), "rain": N_("Pluie"), "snow": N_("Neige"),
         "slippery roads": N_("Verglas"), "frost": N_("Gel"), "thaw": N_("Dégel"), "heat waves": N_("Canicule"),
         "avalanches": N_("Avalanches"), "earthquakes": N_("Séismes"), "forest fires": N_("Feux de forêt"),
         "flood": N_("Crues"), "drought": N_("Sécheresse"), "unknown": N_("Danger non précisé")}
DEGREES = (N_("Aucun danger"), N_("Danger nul ou faible"), N_("Danger limité"), N_("Danger marqué"), N_("Fort danger"), N_("Très fort danger"))
SEVERITIES = (0, 0, 1, 2, 3, 3)


@dataclass(frozen=True)
class Warning:
    name: str
    degree: int
    start: str | None
    end: str | None
    text: str


def _date(value: Any) -> datetime | None:
    if value is None:
        return None
    parsed = value if isinstance(value, datetime) else datetime.fromisoformat(str(value))
    if parsed.tzinfo is None:
        raise ValueError("Warning dates must include a timezone")
    return parsed


def read(state: Any, now: datetime) -> tuple[Warning, ...] | None:
    """Read all published warnings, including upcoming ones; discard expired warnings.

    An incomplete list is unknown, never a green status. Upstream can expose state 0
    while its warning data is missing, so the aggregate count alone is insufficient.
    """
    if state.state in ("unknown", "unavailable"):
        return None
    attrs = state.attributes
    names, degrees = attrs.get("warning_types"), attrs.get("warning_levels_numeric")
    if not isinstance(names, (list, tuple)) or not isinstance(degrees, (list, tuple)):
        return None
    try:
        count = int(state.state)
        if count < 0 or len(names) != count or len(degrees) != count:
            return None
        starts, ends = attrs.get("warning_valid_from"), attrs.get("warning_valid_to")
        texts = attrs.get("warning_texts")
        if count and any(not isinstance(v, (list, tuple)) or len(v) != count for v in (starts, ends, texts)):
            return None
        warnings = []
        for i, name in enumerate(names):
            degree = degrees[i]
            if isinstance(degree, bool) or not isinstance(degree, int) or degree not in range(6):
                return None
            start, end = _date(starts[i]), _date(ends[i])
            if end is None or (start is not None and start >= end):
                return None
            if end <= now or degree < 2:
                continue
            label = TYPES.get(str(name).lower().replace("_", " "), str(name))
            warnings.append(Warning(label, degree, start.isoformat() if start else None, end.isoformat(), str(texts[i] or "")))
        return tuple(sorted(warnings, key=lambda w: -w.degree))
    except (TypeError, ValueError, OverflowError):
        return None
