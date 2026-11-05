"""The season, when it began, and how long the day is."""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Callable
from zoneinfo import ZoneInfo

from .i18n import N_, t

ORDER = ("spring", "summer", "autumn", "winter")
NAMES = {"spring": N_("Printemps"), "summer": N_("Été"), "autumn": N_("Automne"), "winter": N_("Hiver")}
ICONS = {"spring": "mdi:flower", "summer": "mdi:white-balance-sunny", "autumn": "mdi:leaf-maple", "winter": "mdi:snowflake"}
NEWS = {"spring": N_("C’est le printemps"), "summer": N_("C’est l’été"), "autumn": N_("C’est l’automne"), "winter": N_("C’est l’hiver")}
# States of the Season integration, plus French spellings of renamed or template sensors.
ALIASES = {"spring": "spring", "printemps": "spring", "summer": "summer", "ete": "summer", "été": "summer",
           "autumn": "autumn", "fall": "autumn", "automne": "autumn", "winter": "winter", "hiver": "winter"}
ASTRONOMICAL = ((3, 20, "spring"), (6, 21, "summer"), (9, 22, "autumn"), (12, 21, "winter"))
METEOROLOGICAL = ((3, 1, "spring"), (6, 1, "summer"), (9, 1, "autumn"), (12, 1, "winter"))
MONTHS = (N_("janvier"), N_("février"), N_("mars"), N_("avril"), N_("mai"), N_("juin"), N_("juillet"), N_("août"), N_("septembre"), N_("octobre"), N_("novembre"), N_("décembre"))


@dataclass(frozen=True)
class Season:
    season: str
    from_sensor: bool
    label: str
    icon: str
    days_in: int | None = None
    """Days since the season began (0 on its first day), when its start can be dated."""
    start: tuple[int, int] | None = None
    """(month, day) of its start."""
    day_length: float | None = None
    """Hours of daylight today."""
    day_change: float | None = None
    """Minutes gained (or lost) tomorrow."""

    @property
    def news(self) -> str | None:
        """Said only during the first week of a new season; then the sky alone carries it."""
        return t(NEWS[self.season]) if self.days_in is not None and self.days_in < 7 else None

    @property
    def tip(self) -> str:
        since = t(" depuis le {day} {month}", day=self.start[1], month=t(MONTHS[self.start[0] - 1])) if self.start else ""
        daylight = daylight_text(self)
        return f"{self.label}{since}{' · ' + daylight if daylight else ''}"


def _flip(season: str, south: bool) -> str:
    return ORDER[(ORDER.index(season) + 2) % 4] if south else season


def season_from_date(today: date, latitude: float = 45) -> str:
    """Astronomical season from the local date (equinoxes and solstices to the day), flipped south of the equator."""
    md = today.month * 100 + today.day
    north = "winter" if md >= 1221 or md < 320 else "spring" if md < 621 else "summer" if md < 922 else "autumn"
    return _flip(north, latitude < 0)


def _start_of(season: str, calendar: tuple, today: date, south: bool) -> tuple[int, int, int] | None:
    """Most recent start of `season` on or before today, on one calendar, if the season is still running on it."""
    starts = sorted((date(y, m, d) for y in (today.year - 1, today.year) for m, d, s in calendar if _flip(s, south) == season and date(y, m, d) <= today),
                    reverse=True)
    if not starts:
        return None
    latest = starts[0]
    upcoming = sorted(t for y in (today.year, today.year + 1) for m, d, _ in calendar if (t := date(y, m, d)) > latest)
    return (latest.month, latest.day, (today - latest).days) if upcoming and today < upcoming[0] else None


def day_length(day: date, latitude: float, elevation: float = 0) -> float:
    """Hours of daylight (sunrise to sunset, with refraction); like Home Assistant, the horizon dips with the home's elevation."""
    rad = math.pi / 180
    d = (datetime(day.year, day.month, day.day, 12) - datetime(2000, 1, 1, 12)).total_seconds() / 86400
    g = (357.529 + 0.98560028 * d) * rad
    ecliptic = (280.459 + 0.98564736 * d + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g)) * rad
    declination, phi = math.asin(math.sin(23.439 * rad) * math.sin(ecliptic)), latitude * rad
    horizon = -0.833 - 2.076 * math.sqrt(max(0, elevation)) / 60
    cos = (math.sin(horizon * rad) - math.sin(phi) * math.sin(declination)) / (math.cos(phi) * math.cos(declination))
    return 24 if cos <= -1 else 0 if cos >= 1 else 2 * math.acos(cos) / rad / 15


def current_season(get: Callable[[str], Any], season_entity: str | None, now: datetime, zone: ZoneInfo,
                   latitude: float | None, elevation: float = 0) -> Season:
    """The configured Season sensor wins when it reports a known season; otherwise the date decides."""
    state = get(season_entity) if season_entity else None
    from_sensor = ALIASES.get(str(state.state if state else "").lower().strip())
    today = now.astimezone(zone).date()
    season = from_sensor or season_from_date(today, latitude if latitude is not None else 45)
    south = latitude is not None and latitude < 0
    # A Season sensor may follow astronomical (21 March…) or meteorological (1 March…) seasons: date the start on the calendar that matches.
    start = _start_of(season, ASTRONOMICAL, today, south) or (_start_of(season, METEOROLOGICAL, today, south) if from_sensor else None)
    length = change = None
    if latitude is not None:
        length = day_length(today, latitude, elevation)
        change = (day_length(today + timedelta(days=1), latitude, elevation) - length) * 60
    return Season(season, bool(from_sensor), t(NAMES[season]), ICONS[season], start[2] if start else None, (start[0], start[1]) if start else None, length, change)


def daylight_text(info: Season) -> str:
    """« 11 h 26 de jour · les jours raccourcissent de 2 min par jour »."""
    if info.day_length is None or info.day_change is None:
        return ""
    hours = math.floor(info.day_length)
    minutes = int(math.floor((info.day_length - hours) * 60 + 0.5))
    length = t("{hours} h {minutes} de jour", hours=hours + 1 if minutes == 60 else hours, minutes=f"{0 if minutes == 60 else minutes:02d}")
    change = abs(info.day_change)
    if change < 0.5:
        return t("{length} · durée du jour stable", length=length)
    minutes = int(math.floor(change + 0.5))
    return (t("{length} · les jours rallongent de {minutes} min par jour", length=length, minutes=minutes) if info.day_change > 0
            else t("{length} · les jours raccourcissent de {minutes} min par jour", length=length, minutes=minutes))
