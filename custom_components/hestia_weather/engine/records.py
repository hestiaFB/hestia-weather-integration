"""Records (issue #16): the hottest and coldest days, the strongest gust, the wettest day, and the days of frost, of heat and the tropical nights.

Two sources, never mixed: the station (what was measured at home, from Home Assistant's long-term statistics) and the place since 1940
(Open-Meteo's archive, available from the first day but smoothed over about ten kilometres). Each is kept as one summary per month,
so that a refresh only reads the last months again; the records of all time, of the year and of the month come from those summaries.

The days in Météo-France's heatwave vigilance are counted apart, from the day Hestia Weather started counting them."""
from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field, replace
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from .units import finite

FROST, HOT, TROPICAL = 0.0, 30.0, 20.0
"""Météo-France's definitions: a frost day has a low at or below 0 °C, a hot day a high at or above 30 °C, a tropical night a low at or above 20 °C."""
MARKS = ("chaleur", "froid", "rafale", "pluie")
COUNTS = ("jours_gel", "jours_chauds", "nuits_tropicales")
# What a reading can be: anything else is a broken sensor, not a record.
BOUNDS = {"high": (-60.0, 60.0), "low": (-60.0, 60.0), "gust": (0.0, 400.0), "rain": (0.0, 1000.0)}


@dataclass(frozen=True)
class DayValues:
    """One local day: its high and low (°C), its strongest gust (km/h), its rain (mm). None when not measured."""

    day: date
    high: float | None = None
    low: float | None = None
    gust: float | None = None
    rain: float | None = None


@dataclass(frozen=True)
class Mark:
    """A record and the day it was set."""

    value: float
    day: date


@dataclass(frozen=True)
class Month:
    """One month's summary: its records, its counts, and how many days had a high and a low."""

    first: date
    """The first day with any measure."""
    chaleur: Mark | None = None
    froid: Mark | None = None
    rafale: Mark | None = None
    pluie: Mark | None = None
    jours_gel: int = 0
    jours_chauds: int = 0
    nuits_tropicales: int = 0
    measured: int = 0
    """Days with both a high and a low: the counts are only as complete as these."""
    firsts: Mapping[str, date] = field(default_factory=dict)
    """The first day each record was measured (a dry day counts for the rain): a rain gauge may come years after the thermometer."""

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {"first": self.first.isoformat(), "measured": self.measured, "firsts": {k: d.isoformat() for k, d in self.firsts.items()}}
        for key in MARKS:
            mark = getattr(self, key)
            if mark is not None:
                out[key] = [mark.value, mark.day.isoformat()]
        for key in COUNTS:
            out[key] = getattr(self, key)
        return out

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> Month:
        marks = {}
        for key in MARKS:
            raw = data.get(key)
            if isinstance(raw, (list, tuple)) and len(raw) == 2 and finite(raw[0]) is not None:
                marks[key] = Mark(float(raw[0]), date.fromisoformat(str(raw[1])))
        firsts = data.get("firsts") if isinstance(data.get("firsts"), Mapping) else {}
        return cls(date.fromisoformat(str(data["first"])), **marks, **{key: int(data.get(key) or 0) for key in COUNTS},
                   measured=int(data.get("measured") or 0), firsts={k: date.fromisoformat(str(v)) for k, v in firsts.items() if k in MARKS})


def month_key(day: date) -> str:
    return f"{day.year:04d}-{day.month:02d}"


def load_months(data: Any) -> dict[str, Month]:
    """Months kept by an earlier version: one that cannot be read is dropped and read again, never an error."""
    out = {}
    for key, value in (data or {}).items() if isinstance(data, Mapping) else ():
        try:
            out[str(key)] = Month.from_dict(value)
        except (AttributeError, KeyError, TypeError, ValueError):
            continue
    # Months kept before each record had its first day (a month always has one): everything is read again.
    return {} if any(not m.firsts for m in out.values()) else out


def _value(value: Any, kind: str) -> float | None:
    """A reading to the tenth, as the sensors show it; None when it cannot be one."""
    number = finite(value)
    low, high = BOUNDS[kind]
    return round(number, 1) if number is not None and low <= number <= high else None


def _higher(mark: Mark | None, value: float | None, day: date) -> Mark | None:
    # A tie keeps the first day: a record belongs to who set it.
    return Mark(value, day) if value is not None and (mark is None or value > mark.value) else mark


def _lower(mark: Mark | None, value: float | None, day: date) -> Mark | None:
    return Mark(value, day) if value is not None and (mark is None or value < mark.value) else mark


def summarise(days: Iterable[DayValues]) -> dict[str, Month]:
    """The days gathered by month. A day without any measure does not count."""
    months: dict[str, Month] = {}
    for d in sorted(days, key=lambda d: d.day):
        high, low, gust, rain = _value(d.high, "high"), _value(d.low, "low"), _value(d.gust, "gust"), _value(d.rain, "rain")
        if high is not None and low is not None and low > high:
            high, low = None, None
        if high is None and low is None and gust is None and rain is None:
            continue
        key = month_key(d.day)
        m = months.get(key) or Month(d.day)
        read = {"chaleur": high, "froid": low, "rafale": gust, "pluie": rain}
        firsts = {**{k: d.day for k, v in read.items() if v is not None}, **m.firsts}
        months[key] = replace(
            m, chaleur=_higher(m.chaleur, high, d.day), froid=_lower(m.froid, low, d.day), rafale=_higher(m.rafale, gust, d.day),
            # A dry day is no record of rain.
            pluie=_higher(m.pluie, rain if rain else None, d.day),
            jours_gel=m.jours_gel + (low is not None and low <= FROST), jours_chauds=m.jours_chauds + (high is not None and high >= HOT),
            nuits_tropicales=m.nuits_tropicales + (low is not None and low >= TROPICAL), measured=m.measured + (high is not None and low is not None),
            firsts=firsts)
    return months


def merge(kept: Mapping[str, Month], fresh: Mapping[str, Month], since: date) -> dict[str, Month]:
    """The months read again from `since` (the first of a month) replace the kept ones; the older ones stay as they were."""
    start = month_key(since)
    return {**{k: m for k, m in kept.items() if k < start}, **fresh}


def first_of_previous_month(today: date) -> date:
    """Where a refresh starts reading again: the last days of the month before may still change (statistics an hour late, the archive days late)."""
    first = today.replace(day=1)
    return (first - timedelta(days=1)).replace(day=1)


@dataclass(frozen=True)
class Record:
    """A record over all the time known, this year and this month."""

    ever: Mark | None
    year: Mark | None
    month: Mark | None
    since: date | None


@dataclass(frozen=True)
class Count:
    """Days counted this year and this month, the mean of the full years known, and whether some days were not measured."""

    year: int | None
    month: int | None
    mean: float | None
    since: date | None
    partial: bool
    best: tuple[int, int] | None = None
    """The most days counted in one year, and that year (the first one on a tie); None before any day counted."""


def best_year(by_year: Mapping[int, int]) -> tuple[int, int] | None:
    """The year with the most days, the first one on a tie; None when no day was counted."""
    best = None
    for year in sorted(by_year):
        if by_year[year] > 0 and (best is None or by_year[year] > best[0]):
            best = (by_year[year], year)
    return best


@dataclass(frozen=True)
class Records:
    marks: Mapping[str, Record]
    counts: Mapping[str, Count]
    since: date | None


EMPTY = Records({key: Record(None, None, None, None) for key in MARKS}, {key: Count(None, None, None, None, False) for key in COUNTS}, None)


def _best(marks: Iterable[Mark | None], lowest: bool) -> Mark | None:
    best: Mark | None = None
    for mark in sorted((m for m in marks if m is not None), key=lambda m: m.day):
        if best is None or (mark.value < best.value if lowest else mark.value > best.value):
            best = mark
    return best


def compute(months: Mapping[str, Month], today: date) -> Records:
    """The records and counts on `today`: all time, this year, this month."""
    if not months:
        return EMPTY
    since = min(m.first for m in months.values())

    def first(key: str) -> date | None:
        return min((m.firsts[key] for m in months.values() if key in m.firsts), default=None)

    year = [m for k, m in months.items() if k.startswith(f"{today.year:04d}-")]
    current = months.get(month_key(today))
    marks = {key: Record(_best((getattr(m, key) for m in months.values()), key == "froid"), _best((getattr(m, key) for m in year), key == "froid"),
                         getattr(current, key) if current else None, first(key)) for key in MARKS}
    # The counts are those of the thermometer.
    thermometer = min((d for d in (first("chaleur"), first("froid")) if d is not None), default=since)
    # The days of this year that could have been measured, up to yesterday (today is not over): those missing make the counts partial.
    start = max(date(today.year, 1, 1), thermometer)
    expected = (today - start).days
    measured = sum(m.measured for m in year)
    # The mean only counts the full years before this one: 360 days measured at least.
    by_year: dict[int, list[Month]] = {}
    for k, m in months.items():
        by_year.setdefault(int(k[:4]), []).append(m)
    complete = [ms for y, ms in by_year.items() if y < today.year and sum(m.measured for m in ms) >= 360]
    counts = {}
    for key in COUNTS:
        mean = round(sum(sum(getattr(m, key) for m in ms) for ms in complete) / len(complete), 1) if complete else None
        counts[key] = Count(sum(getattr(m, key) for m in year) if year else 0, getattr(current, key) if current else 0, mean, thermometer,
                            measured < expected, best_year({y: sum(getattr(m, key) for m in ms) for y, ms in by_year.items()}))
    return Records(marks, counts, since)


# ---- The station: Home Assistant's long-term statistics, by local day ----

def local_day(seconds: float, zone: ZoneInfo) -> date:
    return datetime.fromtimestamp(seconds, zone).date()


def station_days(temperature: Sequence[tuple[float, float | None, float | None]], gusts: Sequence[tuple[float, float | None]],
                 rain: Sequence[tuple[float, float]], zone: ZoneInfo) -> list[DayValues]:
    """The station's days from its statistics: (start of the day, min, max) of the temperature, (start of the day, max) of the gusts,
    and the rain as (end of the hour, millimetres) of each hour, added up by the local day the hour belongs to."""
    days: dict[date, dict[str, float | None]] = {}
    for start, low, high in temperature:
        row = days.setdefault(local_day(start, zone), {})
        row["low"], row["high"] = low, high
    for start, gust in gusts:
        days.setdefault(local_day(start, zone), {})["gust"] = gust
    for end, mm in rain:
        # An hour ending at midnight belongs to the day before.
        row = days.setdefault(local_day(end - 1, zone), {})
        row["rain"] = (row.get("rain") or 0.0) + max(0.0, mm)
    return [DayValues(day, row.get("high"), row.get("low"), row.get("gust"), row.get("rain")) for day, row in days.items()]


def hour_of(rows: Sequence[tuple[float, float | None]], lowest: bool, zone: ZoneInfo) -> int | None:
    """The local hour of a day's highest (or lowest) hourly statistic, (start of the hour, value): when the record was set, to the hour.
    The first hour on a tie; None without any value."""
    best: tuple[float, float] | None = None
    for start, value in sorted(rows):
        number = finite(value)
        if number is not None and (best is None or (number < best[1] if lowest else number > best[1])):
            best = (start, number)
    return datetime.fromtimestamp(best[0], zone).hour if best else None


HOURLY = {"chaleur": "max", "froid": "min", "rafale": "max"}
"""The station's records whose hour is looked up, and the hourly statistic that sets it. The rain is a day's total: it has no hour."""


def hourly_rain(sums: Sequence[tuple[float, float | None]]) -> list[tuple[float, float]]:
    """Each hour's rain from a running sum (end of the hour, sum): the difference with the hour before."""
    out = []
    for (_, before), (end, after) in zip(sums, sums[1:]):
        if before is not None and after is not None:
            out.append((end, after - before))
    return out


# ---- The place since 1940: Open-Meteo's archive ----

NAME = "Open-Meteo"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
RECENT_URL = "https://api.open-meteo.com/v1/forecast"
FIRST_DAY = date(1940, 1, 1)
RECENT_DAYS = 10
"""The archive comes a few days late: the last days come from the weather models' own past."""
DAILY = {"high": "temperature_2m_max", "low": "temperature_2m_min", "gust": "wind_gusts_10m_max", "rain": "precipitation_sum"}
REFRESH = timedelta(hours=6)
RETRY = timedelta(minutes=30)


def position(latitude: float, longitude: float) -> str:
    """The home's position rounded to about a hundred metres: the archive is asked again when it moves."""
    return f"{latitude:.3f},{longitude:.3f}"


def archive_params(latitude: float, longitude: float, zone: ZoneInfo, start: date, end: date) -> dict[str, str]:
    return {"latitude": f"{latitude:.3f}", "longitude": f"{longitude:.3f}", "start_date": start.isoformat(), "end_date": end.isoformat(),
            "daily": ",".join(DAILY.values()), "timezone": zone.key, "wind_speed_unit": "kmh", "precipitation_unit": "mm"}


def recent_params(latitude: float, longitude: float, zone: ZoneInfo) -> dict[str, str]:
    return {"latitude": f"{latitude:.3f}", "longitude": f"{longitude:.3f}", "daily": ",".join(DAILY.values()), "timezone": zone.key,
            "past_days": str(RECENT_DAYS), "forecast_days": "1", "wind_speed_unit": "kmh", "precipitation_unit": "mm"}


def parse_daily(payload: Mapping[str, Any], before: date) -> list[DayValues]:
    """Open-Meteo's daily answer, the days before `before` only (today is not over). Raises ValueError when there is nothing to read."""
    daily = payload.get("daily")
    if not isinstance(daily, Mapping) or not isinstance(daily.get("time"), list):
        raise ValueError("Open-Meteo: no daily data")
    columns = {kind: daily.get(column) if isinstance(daily.get(column), list) else [] for kind, column in DAILY.items()}
    out = []
    for i, stamp in enumerate(daily["time"]):
        try:
            day = date.fromisoformat(str(stamp))
        except ValueError:
            continue
        if day >= before:
            continue
        values = {kind: finite(column[i]) if i < len(column) else None for kind, column in columns.items()}
        if any(v is not None for v in values.values()):
            out.append(DayValues(day, **values))
    return out


def fill(archive: Sequence[DayValues], recent: Sequence[DayValues]) -> list[DayValues]:
    """The archive's days, the recent ones filling the days it does not have yet."""
    known = {d.day for d in archive if d.high is not None or d.low is not None}
    return [*(d for d in archive if d.day in known), *(d for d in recent if d.day not in known)]


def due(fetched: datetime | None, tried: datetime | None, now: datetime) -> bool:
    """Ask again: nothing yet or six hours old, and the last try at least half an hour ago."""
    return (fetched is None or now - fetched >= REFRESH) and (tried is None or now - tried >= RETRY)


# ---- Days in Météo-France's heatwave vigilance ----

@dataclass(frozen=True)
class Heatwave:
    """The days in orange or red heatwave vigilance, counted from `since`."""

    days: frozenset[date]
    since: date | None

    def add(self, day: date) -> Heatwave:
        return Heatwave(self.days | {day}, self.since or day)

    def started(self, day: date) -> Heatwave:
        return self if self.since else Heatwave(self.days, day)

    def count(self, today: date) -> Count:
        year = [d for d in self.days if d.year == today.year]
        by_year: dict[int, int] = {}
        for d in self.days:
            by_year[d.year] = by_year.get(d.year, 0) + 1
        return Count(len(year), sum(1 for d in year if d.month == today.month), None, self.since, False, best_year(by_year))

    def as_dict(self) -> dict[str, Any]:
        return {"days": sorted(d.isoformat() for d in self.days), "since": self.since.isoformat() if self.since else None}

    @classmethod
    def from_dict(cls, data: Any) -> Heatwave:
        data = data if isinstance(data, Mapping) else {}
        try:
            since = data.get("since")
            return cls(frozenset(date.fromisoformat(str(d)) for d in data.get("days") or ()), date.fromisoformat(str(since)) if since else None)
        except (TypeError, ValueError):
            return cls(frozenset(), None)


# ---- What the Records card receives (issue #17) ----

def card_source(found: Records, hours: Mapping[tuple[str, date], int] | None = None, heatwave: Count | None = None) -> dict[str, Any] | None:
    """One source for the card: each record of all time, of the year and of the month as [value, day, hour or None], each count with
    its year, month, mean of the full years and best year. None while nothing is known."""
    if found.since is None:
        return None
    hours = hours or {}

    def mark(key: str, m: Mark | None) -> list[Any] | None:
        return None if m is None else [m.value, m.day.isoformat(), hours.get((key, m.day))]

    def count(c: Count) -> dict[str, Any]:
        return {"year": c.year, "month": c.month, "mean": c.mean, "best": list(c.best) if c.best else None, "partial": c.partial,
                "since": c.since.isoformat() if c.since else None}

    counts = {key: count(c) for key, c in found.counts.items()}
    if heatwave is not None and heatwave.since is not None:
        counts["jours_canicule"] = count(heatwave)
    return {"since": found.since.isoformat(),
            "marks": {key: {"ever": mark(key, r.ever), "year": mark(key, r.year), "month": mark(key, r.month)} for key, r in found.marks.items()},
            "counts": counts}
