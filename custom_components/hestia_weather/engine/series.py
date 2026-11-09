"""What the small history charts show: rain over a day, a week or a month, wind and pressure over six hours to a week, and a word on what is happening now."""
from __future__ import annotations

import math
from bisect import bisect_right
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


_bars: dict[tuple[Any, ...], tuple[Sequence[Change], tuple[RainDay, ...]]] = {}


def rain_bars(sums: Sequence[Change], now: datetime, zone: ZoneInfo, period: str, live: Change | None = None) -> tuple[RainDay, ...]:
    """Rain per hour over the last 24 hours, or per day over the last 30 days, from the running sum; the last bar is the one
    under way, carried on to `live` (the counter's reading now) when it is given. The bars already over only change with
    the statistics or the hour: kept until then (docs/PLAN-OPTIMISATION.md, point 5)."""
    if not sums:
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

    def bar(points: list[tuple[float, float | None]], a: float, b: float, label: str) -> RainDay:
        total = counter_increase(points, a, min(b, end))
        return RainDay(datetime.fromtimestamp(a, zone).isoformat(timespec="minutes"), label, total.value, total.partial)

    key = (id(sums), period, bounds[0][0], str(zone))
    hit = _bars.get(key)
    if hit is not None and hit[0] is sums:
        over = hit[1]
    else:
        points = [(c.time, finite_number(c.state)) for c in sums]
        # A bar over ends before now: neither now nor the reading under way changes it.
        over = tuple(bar(points, a, b, label) for (a, b), label in zip(bounds[:-1], labels[:-1]))
        _keep(_bars, key, (sums, over))
    points = [(c.time, finite_number(c.state)) for c in (*sums, *((live,) if live is not None else ()))]
    # The reading under way belongs to every bar that ends at or after it: the last one, and the one before when now falls
    # right on the hour (or on midnight).
    kept = sum(1 for a, b in bounds[:-1] if live is None or b < live.time)
    return (*over[:kept], *(bar(points, a, b, label) for (a, b), label in zip(bounds[kept:], labels[kept:])))


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


# The history only changes when it is read again from the Recorder (every 5 minutes to every hour), while a calculation runs
# every minute: what is drawn from one history is kept with it, by identity, and never computed twice
# (docs/PLAN-OPTIMISATION.md, points 5 and 14). Each entry holds its source, so an identity is never reused while kept.
_KEPT = 32
_joined: dict[tuple[int, int], tuple[Sequence[Change], Sequence[Change], list[Change]]] = {}
_converted: dict[tuple[int, str | None, Kind], tuple[Sequence[Change], list[Point], list[float]]] = {}


def _keep(cache: dict[Any, Any], key: Any, value: Any) -> None:
    if len(cache) >= _KEPT:
        cache.clear()
    cache[key] = value


def joined(week: Sequence[Change], recent: Sequence[Change]) -> list[Change]:
    """The week's hours up to where the detailed history starts, then the detailed history. The same list for the same
    two histories: never changed by its readers."""
    hit = _joined.get((id(week), id(recent)))
    if hit is not None and hit[0] is week and hit[1] is recent:
        return hit[2]
    if not recent:
        rows = list(week)
    else:
        start = min(c.time for c in recent)
        rows = [*(c for c in week if c.time < start), *recent]
    _keep(_joined, (id(week), id(recent)), (week, recent, rows))
    return rows


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
                                  ("pressure", "pressure_unit", Kind.PRESSURE),
                                  ("temperature", "temperature_unit", Kind.TEMPERATURE),
                                  ("humidity", "", Kind.PLAIN)):
        changes = []
        for row in rows:
            if not hasattr(row, "last_updated"):
                continue
            attrs = row.attributes
            value = measurement(attrs.get(attribute), attrs.get(unit) if unit else "", kind) if row.state not in ("unknown", "unavailable") else None
            # Only a temperature may be below zero.
            usable = value is not None and (value >= 0 or kind is Kind.TEMPERATURE)
            changes.append(Change(row.last_updated.timestamp(), str(value) if usable else "unavailable"))
        result[weather_history_key(entity_id, attribute)] = changes
    return result


class Point(NamedTuple):
    time: float
    """Seconds since 1970."""
    value: float | None
    """None where the station did not report: a gap, never joined across."""


def _all_points(rows: Sequence[Change], unit: str | None, kind: Kind) -> tuple[list[Point], list[float]]:
    """Every reading of a history in the engine's unit, by time, and their times: converted once per history."""
    key = (id(rows), unit, kind)
    hit = _converted.get(key)
    if hit is not None and hit[0] is rows:
        return hit[1], hit[2]
    points = sorted((p for c in rows if 0 < (p := Point(c.time, measurement(c.state, unit, kind))).time), key=lambda p: p.time)
    times = [p.time for p in points]
    _keep(_converted, key, (rows, points, times))
    return points, times


def _points(rows: Sequence[Change], unit: str | None, kind: Kind, now: float, since: float | None = None, keep: bool = True) -> list[Point]:
    """The readings up to `now`; from the one under way at `since` when it is given. `keep=False` for a list made for one
    calculation only: nothing to keep it for, and it would only push the histories out."""
    if not keep:
        return sorted((p for c in rows if 0 < (p := Point(c.time, measurement(c.state, unit, kind))).time <= now), key=lambda p: p.time)
    points, times = _all_points(rows, unit, kind)
    first = max(0, bisect_right(times, since) - 1) if since is not None else 0
    return points[first:bisect_right(times, now)]


def rain_days(rows: Sequence[Change], unit: str | None, now: datetime, zone: ZoneInfo) -> tuple[RainDay, ...]:
    """Daily maxima of a daily rain sensor, never differences of rolling 24 h, weekly or monthly totals."""
    series = [(p, datetime.fromtimestamp(p.time, zone).date()) for p in _points(rows, unit, Kind.RAIN, now.timestamp(), keep=False)]
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
    return measure_chart_series(rows, unit, now, current, Kind.PRESSURE, period)


def measure_chart_series(rows: Sequence[Change], unit: str | None, now: datetime, current: float | None, kind: Kind,
                         period: str = "6h") -> tuple[Point, ...]:
    """A measure's means over one of the card's periods (pressure, temperature, humidity)."""
    span, step = PERIODS[period]
    return _chart_series(rows, unit, now, current, "mean", kind, span, step)


class _Buckets(NamedTuple):
    sums: list[float]
    durations: list[float]
    peaks: list[float]
    missing: list[bool]

    def add(self, start: float, step: int, at: float, until: float, value: float | None, gap: float) -> None:
        """One reading, held from `at` until `until` (the next reading, or now), spread over the buckets it covers."""
        # A sensor unavailable for a moment (Home Assistant restarting) is no gap.
        if value is None and gap < BRIEF_OUTAGE:
            return
        a, count = max(start, at), len(self.sums)
        j = max(0, math.floor((a - start) / step))
        while until > a and j < count and start + j * step < until:
            duration = min(until, start + (j + 1) * step) - max(a, start + j * step)
            if value is None:
                self.missing[j] = True
            else:
                self.sums[j] += value * duration
                self.durations[j] += duration
                self.peaks[j] = max(self.peaks[j], value)
            j += 1


def _plain(value: float | None, kind: Kind = Kind.PLAIN) -> float | None:
    """A reading the chart can use: below zero is a broken sensor, but for a temperature."""
    return value if value is not None and (value >= 0 or kind is Kind.TEMPERATURE) else None


_held: dict[tuple[Any, ...], tuple[Sequence[Change], _Buckets]] = {}


def _held_buckets(rows: Sequence[Change], unit: str | None, kind: Kind, start: float, step: int, count: int,
                  window: list[Point], first: int, last: int) -> _Buckets:
    """Every reading of the window but the last, which runs until now: they never change while the history stays the
    same, so they are spread once per history and grid step, not each minute (docs/PLAN-OPTIMISATION.md, point 5)."""
    key = (id(rows), unit, kind, start, step, count, first, last)
    hit = _held.get(key)
    if hit is not None and hit[0] is rows:
        return hit[1]
    buckets = _Buckets([0.0] * count, [0.0] * count, [0.0] * count, [False] * count)
    for event, after in zip(window, window[1:]):
        buckets.add(start, step, event.time, after.time, _plain(event.value, kind), after.time - event.time)
    _keep(_held, key, (rows, buckets))
    return buckets


def _rounded(value: float | None) -> float | None:
    """A tenth is all a small chart shows: the view stays light, and the same readings give the same view."""
    return None if value is None else round(value, 1)


def _chart_series(rows: Sequence[Change], unit: str | None, now: datetime, current: float | None, mode: str, kind: Kind,
                  span: int = SPAN, step: int = STEP) -> tuple[Point, ...]:
    """Buckets on a fixed grid (every ten minutes, hour or three hours of the clock), the last one under way: a bucket
    already over never changes again, so a calculation that brings no new reading brings no new curve."""
    end = now.timestamp()
    # One bucket more than the span holds: the window rarely starts on the grid. Only the middles inside it are drawn.
    buckets_count, known = span // step + 1, step / 2
    start = math.floor((end - span) / step) * step
    # Only the readings of the window, and the one under way at its start.
    points, times = _all_points(rows, unit, kind)
    last = bisect_right(times, end)
    first = max(0, bisect_right(times, start) - 1)
    window = points[first:last]
    if not window:
        return ()
    held = _held_buckets(rows, unit, kind, start, step, buckets_count, window, first, last)
    buckets = _Buckets(list(held.sums), list(held.durations), list(held.peaks), list(held.missing))
    # The last reading runs until now.
    tail = window[-1]
    buckets.add(start, step, tail.time, end, _plain(tail.value, kind), end - tail.time)
    out = []
    for i in range(buckets_count):
        middle = start + i * step + step // 2
        if middle < end - span:
            continue
        # The bucket under way counts once half of it is known, which is never before its middle.
        if middle >= end:
            break
        full = not buckets.missing[i] and buckets.durations[i] >= known
        out.append(Point(middle, _rounded((buckets.sums[i] / buckets.durations[i] if mode == "mean" else buckets.peaks[i]) if full else None)))
    return (*out, Point(round(end), _rounded(current)))


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
