"""The station's own shade, by the sun's position: what share of the forecast sun its sensor receives under a clear sky.

A house or a tree hides the low sun from the station, so its measure cannot be read as the sky's. Other bricks (Hestia
Comfort) use this shade to tell the clouds the forecast missed from the shade of the station. It is learned each night from
the station's long-term hourly statistics against Open-Meteo's sun of the same hours (92 days at most), so that a station
with a history knows its shade from the first night (CAHIER-MOTEUR.md § 7.4).

- Clear hours first: the measure over the forecast sun, the most reliable (bench of 4 November 2026, 56 days of the
  house's GW2000A: same cells, same verdicts as the year-long bench of 31 October).
- Where a cell has too few clear hours (cloudy regions, a new station), the direct sun is read instead under a sky up to
  60 % cloudy: the measure minus the forecast diffuse light, over the forecast direct sun. Only as a fallback: at the
  house it found 3 cells more, and agreed with the clear hours on 24 of 25.
- A cell keeps its last hours only, and moves halfway to what they say each night: a station moved, a tree in leaf show
  within days without one odd night erasing what was known. A cell not seen again is kept (winter's low sun in spring).
- Cells never seen take their learned neighbours, then what the household declared (« Pour aller plus loin »).

Kept free of Home Assistant imports so that it can be tested like the rest of the engine.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Iterable, Mapping

# The sun's position in cells of this many degrees of azimuth and of elevation.
AZIMUTH_STEP, ELEVATION_STEP = 10, 5
# Under this elevation the sun is too low to be read (°).
LOW = 5.0
# A clear hour: the forecast sun above this (W/m²) and its cloud cover under that (%).
CLEAR_SUN, CLEAR_CLOUDS = 100.0, 20.0
# The fallback: an hour with this much direct sun forecast (W/m²) under a sky less cloudy than that (%).
DIRECT_SUN, DIRECT_CLOUDS = 100.0, 60.0
# A cell is learned from this many hours, its last ones only; its share is a high quantile of them (clear moments).
CELL_HOURS, RECENT_HOURS, QUANTILE = 4, 12, 0.8
# Each night a known cell moves this far towards what its last hours say.
BLEND = 0.5
# The share of a clear sky's sun that is diffuse light, when the hours do not tell it.
DIFFUSE = 0.15
# What a declared shade gives: the station in its shade, or seeing the sun.
SHADED, SUNNY = 0.3, 1.0
DECLARED = ("never", "morning", "afternoon")
MOST = 1.2
# How many days of statistics the night reads (Open-Meteo gives 92 past days at most).
DAYS = 92


def sun_position(when: datetime, latitude: float, longitude: float) -> tuple[float, float]:
    """Elevation and azimuth of the sun in degrees (NOAA's simplified formulas, within a degree)."""
    when = when.astimezone(timezone.utc)
    day = when.timetuple().tm_yday
    hour = when.hour + when.minute / 60 + when.second / 3600
    gamma = 2 * math.pi / 365 * (day - 1 + (hour - 12) / 24)
    equation = 229.18 * (0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma) - 0.014615 * math.cos(2 * gamma)
                         - 0.040849 * math.sin(2 * gamma))
    declination = (0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma) - 0.006758 * math.cos(2 * gamma)
                   + 0.000907 * math.sin(2 * gamma) - 0.002697 * math.cos(3 * gamma) + 0.00148 * math.sin(3 * gamma))
    angle = math.radians((hour * 60 + equation + 4 * longitude) / 4 - 180)
    lat = math.radians(latitude)
    cos_zenith = math.sin(lat) * math.sin(declination) + math.cos(lat) * math.cos(declination) * math.cos(angle)
    zenith = math.acos(max(-1.0, min(1.0, cos_zenith)))
    azimuth = math.degrees(math.atan2(math.sin(angle), math.cos(angle) * math.sin(lat) - math.tan(declination) * math.cos(lat))) + 180
    return 90 - math.degrees(zenith), azimuth % 360


def cell(when: datetime, latitude: float, longitude: float) -> str | None:
    """The sun's cell in the middle of the hour that starts at `when` (« 170/25 »), None when it is too low."""
    elevation, azimuth = sun_position(when + timedelta(minutes=30), latitude, longitude)
    if elevation < LOW:
        return None
    return f"{int(azimuth // AZIMUTH_STEP) * AZIMUTH_STEP}/{int(elevation // ELEVATION_STEP) * ELEVATION_STEP}"


def reachable(latitude: float, longitude: float, year: int = 2026) -> frozenset[str]:
    """Every cell the sun crosses over a year at this place: what « 40 positions sur 120 » counts against."""
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    return frozenset(c for h in range(0, 366 * 24) if (c := cell(start + timedelta(hours=h), latitude, longitude)))


def _quantile(values: list[float]) -> float:
    values = sorted(values)
    return values[min(len(values) - 1, int(QUANTILE * len(values)))]


def learn(hours: Iterable[tuple[datetime, float | None, float | None, float | None, float | None, float | None]],
          latitude: float, longitude: float, known: Mapping[str, float] | None = None) -> dict[str, float]:
    """The station's share of a clear sky's sun, by cell: {"170/25": 0.38, …}.

    `hours`: (start of the hour, forecast global sun, forecast direct sun, forecast diffuse light, cloud cover %, measured
    mean), oldest first; any of them may be None. `known`: the cells learned before, kept when not seen again."""
    clear: dict[str, list[float]] = {}
    direct: dict[str, list[tuple[float, float]]] = {}
    for start, sun, beam, diffuse, clouds, measured in hours:
        if measured is None or sun is None:
            continue
        where = cell(start, latitude, longitude)
        if where is None:
            continue
        if sun >= CLEAR_SUN and clouds is not None and clouds < CLEAR_CLOUDS:
            clear.setdefault(where, []).append(measured / sun)
        if beam is not None and diffuse is not None and beam >= DIRECT_SUN and (clouds is None or clouds < DIRECT_CLOUDS):
            direct.setdefault(where, []).append((max(0.0, min(1.3, (measured - diffuse) / beam)), diffuse / sun if sun > 0 else DIFFUSE))
    out = dict(known or {})
    for where in set(clear) | set(direct):
        last = clear.get(where, [])[-RECENT_HOURS:]
        if len(last) >= CELL_HOURS:
            share = _quantile(last)
        else:
            seen = direct.get(where, [])[-RECENT_HOURS:]
            if len(seen) < CELL_HOURS:
                continue
            # The direct share seen, given back as a share of a clear sky's sun: its diffuse light reaches the station anyway.
            part = sorted(d for _, d in seen)[len(seen) // 4]
            share = part + (1 - part) * _quantile([s for s, _ in seen])
        share = min(MOST, share)
        before = out.get(where)
        out[where] = round(share if before is None else before + (share - before) * BLEND, 2)
    return out


def declared_share(choice: str | None, where: str) -> float | None:
    """What the household declared for that cell: « never » in the shade, in the shade « morning » (sun in the east) or
    « afternoon » (sun in the west); None when nothing was declared."""
    if choice not in DECLARED:
        return None
    if choice == "never":
        return SUNNY
    azimuth = int(where.split("/")[0])
    east = azimuth < 180
    return SHADED if (choice == "morning") == east else SUNNY


def _near(learned: Mapping[str, float], where: str, steps: int) -> float | None:
    azimuth, elevation = (int(v) for v in where.split("/"))
    near = [learned[k] for da in range(-steps, steps + 1) for de in range(-steps, steps + 1)
            if max(abs(da), abs(de)) == steps and (k := f"{azimuth + da * AZIMUTH_STEP}/{elevation + de * ELEVATION_STEP}") in learned]
    return round(sum(near) / len(near), 2) if near else None


def filled(learned: Mapping[str, float], cells: Iterable[str], choice: str | None = None) -> dict[str, float]:
    """Every cell the sun crosses, with its share: learned, else its learned neighbours, else the household's
    declaration, else the neighbours two cells away. A cell still unknown is left out: the forecast sun is then kept."""
    out: dict[str, float] = {}
    for where in cells:
        value = learned.get(where)
        if value is None:
            value = _near(learned, where, 1)
        if value is None:
            value = declared_share(choice, where)
        if value is None:
            value = _near(learned, where, 2)
        if value is not None:
            out[where] = value
    return out
