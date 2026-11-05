"""What the small history charts show: rain over a day, a week or a month, wind and pressure over six hours to a week, and a word on what is happening now."""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Literal, NamedTuple, Sequence
from zoneinfo import ZoneInfo

from .local import LocalWeather
from .i18n import t
from .station import WEEKDAYS, RainDay, counter_increase, midnight
from .trends import Change, Direction
from .units import Kind, measurement

SPAN, STEP = 6 * 3600, 600
BRIEF_OUTAGE = 15 * 60
"""A sensor unavailable for less than this (Home Assistant restarting) is not a gap: the curve goes on, as in Home Assistant's history."""
# A point needs readings over at least half of its step: five minutes of a ten-minute point.
PERIODS: dict[str, tuple[int, int]] = {"6h": (SPAN, STEP), "1d": (86400, 3600), "2d": (2 * 86400, 3600), "7d": (7 * 86400, 3 * 3600)}
"""The wind and pressure charts' periods, as chosen in the card: span and step, in seconds. Past six hours, one point an hour or every three hours."""
WEEK = PERIODS["7d"][0]
RAIN_PERIODS = ("24h", "30d")
"""The rain bars besides the seven days: one an hour over a day, one a day over thirty days."""
RAIN_DAYS = 30


def week_key(entity_id: str) -> str:
    """A week of a measure, kept apart from the six hours of detailed history."""
    return f"{entity_id}#week"


def rain_sum_key(entity_id: str) -> str:
    """The rain counter's hourly running sum from the statistics: it never resets, unlike a daily counter."""
    return f"{entity_id}#sum"


def rain_state_key(entity_id: str) -> str:
    """The counter's own reading at the end of the last hour of statistics: what the current hour's rain starts from."""
    return f"{entity_id}#last"


def rain_bars(sums: Sequence[Change], now: datetime, zone: ZoneInfo, period: str) -> tuple[RainDay, ...]:
    """Rain per hour over the last 24 hours, or per day over the last 30 days, from the running sum; the last bar is the one under way."""
    points = [(c.time, finite_number(c.state)) for c in sums]
    if not points:
        return ()
    end = now.timestamp()
    if period == "24h":
        hour = end - end % 3600
        bounds = [(hour - (23 - i) * 3600, hour - (22 - i) * 3600) for i in range(24)]
        labels = [f"{datetime.fromtimestamp(a, zone).hour} h" for a, _ in bounds]
    else:
        today = now.astimezone(zone).date()
        days = [today - timedelta(days=RAIN_DAYS - 1 - i) for i in range(RAIN_DAYS)]
        bounds = [(midnight(d, zone), midnight(d + timedelta(days=1), zone)) for d in days]
        labels = [str(d.day) for d in days]
    bars = []
    for (a, b), label in zip(bounds, labels):
        total = counter_increase(points, a, min(b, end))
        bars.append(RainDay(datetime.fromtimestamp(a, zone).isoformat(timespec="minutes"), label, total.value, total.partial))
    return tuple(bars)


def finite_number(state: str) -> float | None:
    try:
        value = float(state)
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


def hourly_changes(rows: Sequence[tuple[float, float, float | None]]) -> list[Change]:
    """Hourly values of the long-term statistics (means or maxima) as changes: each holds for its hour, a missing hour is a gap."""
    out: list[Change] = []
    for i, (start, end, mean) in enumerate(rows):
        out.append(Change(start, "unavailable" if mean is None else str(mean)))
        if i + 1 == len(rows) or rows[i + 1][0] > end:
            out.append(Change(end, "unavailable"))
    return out


def joined(week: Sequence[Change], recent: Sequence[Change]) -> list[Change]:
    """The week's hours up to where the detailed history starts, then the detailed history."""
    if not recent:
        return list(week)
    start = min(c.time for c in recent)
    return [*(c for c in week if c.time < start), *recent]


def weather_history_key(entity_id: str, attribute: str) -> str:
    """Separate the weather entity's numeric attribute histories from its text state."""
    return f"{entity_id}#{attribute}"


def weather_history(entity_id: str, rows: Sequence[Any]) -> dict[str, list[Change]]:
    """Recorded bulletin values, in engine units. Missing attributes remain gaps.

    Use each historical row's unit, never the current unit or a forecast. Weather
    state text (sunny/cloudy) cannot be used as a numeric wind or pressure value.
    """
    result = {}
    for attribute, unit, kind in (("wind_speed", "wind_speed_unit", Kind.WIND),
                                  ("wind_gust_speed", "wind_speed_unit", Kind.WIND),
                                  ("pressure", "pressure_unit", Kind.PRESSURE)):
        changes = []
        for row in rows:
            if not hasattr(row, "last_updated"):
                continue
            attrs = row.attributes
            value = measurement(attrs.get(attribute), attrs.get(unit), kind) if row.state not in ("unknown", "unavailable") else None
            changes.append(Change(row.last_updated.timestamp(), str(value) if value is not None and value >= 0 else "unavailable"))
        result[weather_history_key(entity_id, attribute)] = changes
    return result


class Point(NamedTuple):
    time: float
    """Seconds since 1970."""
    value: float | None
    """None where the station did not report: a gap, never joined across."""


def _points(rows: Sequence[Change], unit: str | None, kind: Kind, now: float) -> list[Point]:
    return sorted((p for c in rows if 0 < (p := Point(c.time, measurement(c.state, unit, kind))).time <= now), key=lambda p: p.time)


def rain_days(rows: Sequence[Change], unit: str | None, now: datetime, zone: ZoneInfo) -> tuple[RainDay, ...]:
    """Daily maxima of a daily rain sensor, never differences of rolling 24 h, weekly or monthly totals."""
    series = [(p, datetime.fromtimestamp(p.time, zone).date()) for p in _points(rows, unit, Kind.RAIN, now.timestamp())]
    today = now.astimezone(zone).date()
    days = []
    for i in range(7):
        key: date = today - timedelta(days=6 - i)
        daily = [p for p, day in series if day == key]
        previous = next((p for p, day in reversed(series) if day < key), None)
        values = [p.value for p in daily if p.value is not None and p.value >= 0]
        # A daily counter keeps accumulating through a short outage (e.g. `unknown` at the midnight reset),
        # so readings after it still give the right maximum. Only an outage still running at the end of the day can hide rain.
        ends_in_outage = bool(daily) and (daily[-1].value is None or daily[-1].value < 0)
        # A zero that persists is a dry day; an old nonzero total must never be carried into a new day.
        highest = max(values) if values else 0 if not daily and previous is not None and previous.value == 0 else None
        # "At least 0 mm" says nothing: a dry reading followed by an unfinished outage stays unknown.
        value = None if ends_in_outage and highest == 0 else highest
        reset_inside = any(values[j] < values[j - 1] for j in range(1, len(values)))
        partial = value is not None and (reset_inside or ends_in_outage or (previous is None and bool(daily)))
        days.append(RainDay(key.isoformat(), t("Auj.") if i == 6 else t(WEEKDAYS[key.weekday()]), value, partial))
    return tuple(days)


def wind_chart_series(rows: Sequence[Change], unit: str | None, now: datetime, current: float | None, mode: Literal["mean", "peak"],
                      period: str = "6h") -> tuple[Point, ...]:
    """Time-weighted means or gust peaks, every ten minutes over six hours; a long outage remains a gap, a restart does not."""
    span, step = PERIODS[period]
    return _chart_series(rows, unit, now, current, mode, Kind.WIND, span, step)


def pressure_chart_series(rows: Sequence[Change], unit: str | None, now: datetime, current: float | None = None,
                          period: str = "6h") -> tuple[Point, ...]:
    span, step = PERIODS[period]
    return _chart_series(rows, unit, now, current, "mean", Kind.PRESSURE, span, step)


@dataclass
class _Bucket:
    sum: float = 0
    duration: float = 0
    peak: float = 0
    missing: bool = False


def _chart_series(rows: Sequence[Change], unit: str | None, now: datetime, current: float | None, mode: str, kind: Kind,
                  span: int = SPAN, step: int = STEP) -> tuple[Point, ...]:
    end = now.timestamp()
    start = end - span
    buckets_count, known = span // step, step / 2
    events = [Point(p.time, p.value if p.value is not None and p.value >= 0 else None) for p in _points(rows, unit, kind, end)]
    if not events:
        return ()
    buckets = [_Bucket() for _ in range(buckets_count)]
    for i, event in enumerate(events):
        a, b = max(start, event.time), min(end, events[i + 1].time if i + 1 < len(events) else end)
        if event.value is None and (events[i + 1].time if i + 1 < len(events) else end) - event.time < BRIEF_OUTAGE:
            continue
        j = max(0, math.floor((a - start) / step))
        while b > a and j < buckets_count and start + j * step < b:
            bucket, duration = buckets[j], min(b, start + (j + 1) * step) - max(a, start + j * step)
            if event.value is None:
                bucket.missing = True
            else:
                bucket.sum += event.value * duration
                bucket.duration += duration
                bucket.peak = max(bucket.peak, event.value)
            j += 1
    full = [not b.missing and b.duration >= known for b in buckets]
    return (*(Point(start + (i + 0.5) * step, (b.sum / b.duration if mode == "mean" else b.peak) if full[i] else None) for i, b in enumerate(buckets)),
            Point(end, current))


@dataclass(frozen=True)
class ColumnStatus:
    """One-word reminders of what is happening now, echoing the synthesis in the matching column."""

    rain: str | None = None
    wind: str | None = None
    pressure: str | None = None


def column_status(w: LocalWeather | None) -> ColumnStatus:
    if w is None:
        return ColumnStatus()
    rate, change, direction = w.rain.rate, w.wind.trend.change, w.pressure_trend.direction
    return ColumnStatus(
        rain=None if rate is None or rate < 0.3 else t("Forte pluie en cours") if rate >= 4 else t("Pluie en cours"),
        # Over one hour: a few km/h is noise, 8 km/h is felt.
        wind=None if change is None else t("Le vent s’intensifie") if change >= 8 else t("Le vent faiblit") if change <= -8 else None,
        pressure=t("La pression baisse") if direction is Direction.FALLING else t("La pression monte") if direction is Direction.RISING else None,
    )
