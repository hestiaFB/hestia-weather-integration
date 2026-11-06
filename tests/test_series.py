"""History charts and column status (ported from the card's history-series tests)."""
import json
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from engine.series import ColumnStatus, column_status, pressure_chart_series, rain_days, wind_chart_series
from engine.trends import Change, Direction, Trend
from test_brief import weather

PARIS = ZoneInfo("Europe/Paris")
NOW = datetime(2026, 10, 5, 16, tzinfo=timezone.utc)
FIXTURE = Path(__file__).parent / "fixtures" / "gw2000a-daily-rain-2026-10-07.json"


def p(moment: str, state: str) -> Change:
    return Change(datetime.fromisoformat(moment.replace("Z", "+00:00")).timestamp(), state)


def values(days) -> list[float | None]:
    return [d.value for d in days]


def test_keeps_every_day_of_a_real_gw2000a_week_whose_station_drops_out_for_a_few_seconds() -> None:
    # Recorder export of sensor.gw2000a_daily_rain, 29/09 → 07/10/2026. The station goes `unavailable` almost every day;
    # the monthly counter (40.6 mm on 07/10) confirms the October values.
    at = datetime(2026, 10, 7, 13, 20, tzinfo=timezone.utc)
    rows = [Change(r["lu"], r["s"]) for r in json.loads(FIXTURE.read_text())] + [Change(at.timestamp(), "19.3")]
    days = rain_days(rows, "mm", at, PARIS)
    assert values(days) == [19.5, 0.3, 1, 0, 0, 0.5, 19.3]
    assert [d.label for d in days] == ["jeu.", "ven.", "sam.", "dim.", "lun.", "mar.", "Auj."]


def test_keeps_absent_history_absent_instead_of_fabricating_zero_bars() -> None:
    assert all(d.value is None for d in rain_days([], "mm", NOW, PARIS))


def test_takes_daily_maxima_without_subtracting_or_accumulating_across_midnight_resets() -> None:
    days = rain_days([p("2026-09-28T22:00:00Z", "0"), p("2026-09-29T14:00:00Z", "3"), p("2026-09-29T22:00:00Z", "0"),
                      p("2026-09-30T16:00:00Z", "5"), p("2026-09-30T22:00:00Z", "0")], "mm", NOW, PARIS)
    assert (days[0].date, days[0].value) == ("2026-09-29", 3)
    assert (days[1].date, days[1].value, days[1].partial) == ("2026-09-30", 5, False)
    assert days[2].value == 0


def test_never_carries_an_old_nonzero_daily_counter_into_a_day_with_no_records() -> None:
    days = rain_days([p("2026-09-29T12:00:00Z", "5")], "mm", NOW, PARIS)
    assert (days[0].value, days[0].partial) == (5, True)
    assert days[1].value is None


def test_keeps_a_day_whose_counter_recovers_after_an_outage_and_marks_mid_day_resets_partial() -> None:
    days = rain_days([p("2026-09-28T22:00:00Z", "0"), p("2026-09-29T12:00:00Z", "unavailable"), p("2026-09-29T14:00:00Z", "3"),
                      p("2026-09-29T22:00:00Z", "0"), p("2026-09-30T10:00:00Z", "4"), p("2026-09-30T12:00:00Z", "0")], "mm", NOW, PARIS)
    assert days[0].value == 3
    assert (days[1].value, days[1].partial) == (4, True)


def test_does_not_erase_days_whose_counter_is_briefly_unknown_at_the_midnight_reset() -> None:
    rows = []
    for i, day in enumerate(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"]):
        midnight = datetime.fromisoformat(f"{day}T00:00:00+02:00").timestamp()
        rows += [Change(midnight, "unknown"), Change(midnight + 2, "0"), *([Change(midnight + 36000, str(i * 3))] if i % 2 else [])]
    days = rain_days(rows, "mm", NOW, PARIS)
    assert values(days) == [0, 3, 0, 9, 0, 15, 0]
    assert not any(d.partial for d in days[1:])  # The first day has no earlier reading.


def test_marks_a_day_partial_when_an_outage_is_still_running_at_midnight() -> None:
    days = rain_days([p("2026-09-28T22:00:00Z", "0"), p("2026-09-29T08:00:00Z", "2"), p("2026-09-29T18:00:00Z", "unavailable"),
                      p("2026-09-30T06:00:00Z", "0")], "mm", NOW, PARIS)
    assert (days[0].value, days[0].partial) == (2, True)
    assert (days[1].value, days[1].partial) == (0, False)


def test_leaves_a_day_missing_when_the_counter_is_unavailable_all_day() -> None:
    days = rain_days([p("2026-09-28T22:00:00Z", "0"), p("2026-09-29T08:00:00Z", "unavailable"), p("2026-09-30T06:00:00Z", "0")], "mm", NOW, PARIS)
    assert days[0].value is None


def test_converts_inches_and_follows_the_local_date_rather_than_utc() -> None:
    days = rain_days([p("2026-10-04T23:00:00Z", "1")], "in", NOW, PARIS)
    assert (days[6].date, days[6].value) == ("2026-10-05", pytest.approx(25.4))
    assert days[5].value is None


def test_keeps_calendar_days_aligned_over_a_daylight_saving_transition() -> None:
    days = rain_days([], "mm", datetime(2026, 10, 26, 0, 30, tzinfo=timezone.utc), PARIS)
    assert [d.date for d in days] == [f"2026-10-{d}" for d in range(20, 27)]


def test_converts_recorded_pressure_and_preserves_gaps_without_fabricating_history() -> None:
    rows = [p("2026-10-05T10:00:00Z", "100000"), p("2026-10-05T12:00:00Z", "unavailable"), p("2026-10-05T13:00:00Z", "99600")]
    result = pressure_chart_series(rows, "Pa", NOW, 996)
    assert (result[0].value, result[12].value, result[18].value) == (1000, None, 996)
    assert pressure_chart_series([], "hPa", NOW, 996) == ()


def test_aggregates_time_weighted_wind_separately_from_gust_peaks() -> None:
    rows = [p("2026-10-05T10:00:00Z", "10"), p("2026-10-05T10:09:00Z", "30")]
    assert wind_chart_series(rows, "km/h", NOW, 14, "mean")[0].value == 12
    assert wind_chart_series(rows, "km/h", NOW, 14, "peak")[0].value == 30
    assert len(wind_chart_series(rows, "km/h", NOW, 14, "mean")) == 37
    assert wind_chart_series([], "km/h", NOW, 14, "mean") == ()


def test_bridges_a_restart_but_keeps_a_long_outage_as_a_gap_with_unit_conversion() -> None:
    # Home Assistant restarting: the station is `unavailable` for five minutes. Its history draws on; so does the card.
    rows = [p("2026-10-05T10:05:00Z", "2"), p("2026-10-05T10:25:00Z", "unavailable"), p("2026-10-05T10:30:00Z", "5")]
    series = wind_chart_series(rows, "m/s", NOW, None, "mean")
    assert [series[i].value for i in range(4)] == [pytest.approx(7.2), pytest.approx(7.2), pytest.approx(7.2), 18]
    assert series[-1].value is None
    # The station off for half an hour: a gap, never a made-up line.
    rows = [p("2026-10-05T10:00:00Z", "2"), p("2026-10-05T10:20:00Z", "unavailable"), p("2026-10-05T10:50:00Z", "5")]
    series = wind_chart_series(rows, "m/s", NOW, None, "mean")
    assert [series[i].value is None for i in range(6)] == [False, False, True, True, True, False]


def test_keeps_brief_gust_peaks_while_bounding_dense_history_to_37_points() -> None:
    end = NOW.timestamp()
    rows = [Change(end - 21600 + i, "150" if i == 5000 else "10") for i in range(21600)]
    result = wind_chart_series(rows, "km/h", NOW, 14, "peak")
    assert len(result) == 37 and max(p.value or 0 for p in result) == 150


def trend(change: float | None, direction: Direction | None = None) -> Trend:
    return Trend(change, 60, direction, "")


def status(rate: float | None, wind_change: float | None, pressure: Direction | None) -> ColumnStatus:
    w = weather()
    return column_status(replace(w, rain=replace(w.rain, rate=rate), wind=replace(w.wind, trend=trend(wind_change)), pressure_trend=trend(-1.4, pressure)))


def test_echoes_current_rain_notable_wind_changes_and_pressure_trends() -> None:
    assert status(1.2, 9, Direction.FALLING) == ColumnStatus("Pluie en cours", "Le vent s’intensifie", "La pression baisse")
    assert status(5, -10, Direction.RISING) == ColumnStatus("Forte pluie en cours", "Le vent faiblit", "La pression monte")


def test_stays_silent_when_nothing_notable_happens_or_data_is_missing() -> None:
    assert status(0, 4, Direction.STEADY) == ColumnStatus()
    assert status(None, None, None) == ColumnStatus()
    assert column_status(None) == ColumnStatus()


def test_recorded_weather_attributes_convert_each_rows_units_and_preserve_outages():
    from types import SimpleNamespace
    from engine.series import weather_history, weather_history_key
    def row(offset, state='sunny', **attrs):
        return SimpleNamespace(state=state, last_updated=datetime.fromtimestamp(NOW.timestamp() + offset, timezone.utc), attributes=attrs)
    history = weather_history('weather.home', [
        row(-3600, wind_speed=10, wind_gust_speed=20, wind_speed_unit='m/s', pressure=101000, pressure_unit='Pa'),
        row(-1800, wind_speed=10, wind_speed_unit='km/h', pressure=1011, pressure_unit='hPa'),
        row(-1200, state='unavailable', wind_speed=999, pressure=999),
        row(-600, wind_speed=12, pressure=1012),
    ])
    def readings(attribute):
        return [c.state for c in history[weather_history_key('weather.home', attribute)]]
    assert readings('wind_speed') == ['36.0', '10.0', 'unavailable', '12.0']
    assert readings('wind_gust_speed') == ['72.0', 'unavailable', 'unavailable', 'unavailable']
    assert readings('pressure') == ['1010.0', '1011.0', 'unavailable', '1012.0']


def test_draws_a_week_of_pressure_from_hourly_means_then_the_detailed_six_hours() -> None:
    from engine.series import hourly_changes, joined
    end = NOW.timestamp()
    hours = [(end - (168 - i) * 3600, end - (167 - i) * 3600, 1000 + i / 10) for i in range(162)]
    recent = [Change(end - 6 * 3600, "1020"), Change(end - 3600, "1021")]
    rows = joined(hourly_changes(hours), recent)
    week = pressure_chart_series(rows, "hPa", NOW, 1021, "7d")
    assert len(week) == 57 and week[-1].value == 1021
    # The first three hours sit on the clock's grid (15-18 h UTC): two of them are known, 1000.0 and 1000.1.
    assert week[0].value == pytest.approx(1000.05, abs=0.06)
    assert all(p.value is not None for p in week)
    # The hours under the detailed history are left out: no double reading at the join.
    assert max(c.time for c in rows if c.state != "1020" and c.state != "1021") < end - 6 * 3600


def test_keeps_a_missing_hour_of_statistics_as_a_gap() -> None:
    from engine.series import hourly_changes
    end = NOW.timestamp()
    hours = [(end - 10 * 3600, end - 9 * 3600, 1010.0), (end - 5 * 3600, end - 4 * 3600, 1012.0)]
    series = pressure_chart_series(hourly_changes(hours), "hPa", NOW, None, "1d")
    assert len(series) == 25
    assert series[-11].value == 1010 and series[-10].value is None and series[-6].value == 1012 and series[-5].value is None


def test_keeps_the_six_hour_pressure_chart_by_default() -> None:
    rows = [Change(NOW.timestamp() - 7 * 3600, "1012")]
    assert len(pressure_chart_series(rows, "hPa", NOW, 1012)) == len(pressure_chart_series(rows, "hPa", NOW, 1012, "6h")) == 37


def test_gives_hourly_and_daily_rain_bars_from_the_running_sum() -> None:
    from engine.series import rain_bars
    end = NOW.timestamp()  # 16:00 UTC, 18:00 in Paris
    hour = end - end % 3600
    sums = [Change(hour - h * 3600, str(10 + (2 if h <= 3 else 0) + (1 if h <= 1 else 0))) for h in range(40, -1, -1)]
    day = rain_bars(sums, NOW, PARIS, "24h")
    assert len(day) == 24 and day[-1].label == "18 h"
    # 2 mm between 4 and 3 hours ago, 1 mm between 2 hours and 1 hour ago.
    assert [d.value for d in day[-5:]] == [2, 0, 1, 0, 0]
    assert sum(d.value or 0 for d in day) == 3
    month = rain_bars(sums, NOW, PARIS, "30d")
    assert len(month) == 30 and month[-1].label == "5" and month[-1].value == 3
    assert month[0].value is None


def test_follows_a_wind_week_of_hourly_maxima_for_the_gusts() -> None:
    from engine.series import hourly_changes
    end = NOW.timestamp()
    rows = [(end - (168 - i) * 3600, end - (167 - i) * 3600, 30.0 if i == 100 else 10.0) for i in range(168)]
    peaks = wind_chart_series(hourly_changes(rows), "km/h", NOW, None, "peak", "7d")
    assert max(p.value or 0 for p in peaks) == 30 and len(peaks) == 57


def test_carries_the_rain_bars_to_now_across_a_daily_counter_reset() -> None:
    from engine.series import rain_state_key, rain_sum_key
    from engine.view import _rain_periods
    end = NOW.timestamp() - 3600  # the last hour of statistics ended at 17:00 in Paris
    history = {rain_sum_key("sensor.daily"): [Change(end - 3600, "40"), Change(end, "41")], rain_state_key("sensor.daily"): [Change(end, "6")]}
    # The daily counter read 6 mm, then was reset: it now reads 0.5 mm.
    day = dict((p.period, p) for p in _rain_periods(history, (None, "sensor.daily"), lambda _: 0.5, NOW, PARIS))["24h"]
    # 1 mm in the 16 h statistics, then the half millimetre read since the reset, in the 17 h bar.
    assert day.total == 1.5 and [d.value for d in day.days[-3:-1]] == [1, 0.5]
    assert _rain_periods({}, (None, "sensor.daily"), lambda _: 0.5, NOW, PARIS) == ()


def test_a_minute_later_without_new_readings_the_curve_is_the_same() -> None:
    # Buckets on the clock's grid: the view only changes when a reading does (docs/PLAN-OPTIMISATION.md, point 2).
    from datetime import timedelta
    rows = [p("2026-10-05T10:00:00Z", "10.04"), p("2026-10-05T12:00:00Z", "20.06"), p("2026-10-05T15:30:00Z", "14")]
    for period in ("6h", "1d", "2d", "7d"):
        at = NOW + timedelta(minutes=7)
        a = wind_chart_series(rows, "km/h", at, 14, "mean", period)
        b = wind_chart_series(rows, "km/h", at + timedelta(minutes=1), 14, "mean", period)
        assert a[:-1] == b[:-1], period
        span = {"6h": 6, "1d": 24, "2d": 48, "7d": 168}[period] * 3600
        assert all(isinstance(q.time, int) and at.timestamp() - span <= q.time <= at.timestamp() for q in a), period
        assert all(q.value is None or q.value == round(q.value, 1) for q in a), period


def test_a_history_is_converted_once_whatever_the_number_of_calculations(monkeypatch) -> None:
    # Guard against a slower engine (docs/PLAN-OPTIMISATION.md, point 17): a calculation every minute draws twelve curves
    # from the same histories, which only change every few minutes. Each reading is converted once.
    from engine import series
    from engine.series import joined
    calls = 0
    convert = series.measurement

    def counting(*args, **kwargs):
        nonlocal calls
        calls += 1
        return convert(*args, **kwargs)
    monkeypatch.setattr(series, "measurement", counting)
    end = NOW.timestamp()
    week = [Change(end - 7 * 86400 + i * 3600, "10") for i in range(7 * 24 - 6)]
    recent = [Change(end - 6 * 3600 + i * 60, "12") for i in range(360)]
    for minute in range(3):
        at = NOW.replace(minute=minute)
        rows = joined(week, recent)
        for period in ("6h", "1d", "2d", "7d"):
            wind_chart_series(recent if period == "6h" else rows, "km/h", at, 14, "mean", period)
            wind_chart_series(recent if period == "6h" else rows, "km/h", at, 30, "peak", period)
    assert calls == len(recent) + len(rows)


def test_what_is_kept_between_calculations_never_changes_a_curve() -> None:
    # The buckets already over are kept with their history (docs/PLAN-OPTIMISATION.md, point 5): the curves drawn from them
    # minutes later must be those drawn from scratch, gaps, restarts and readings dated ahead included.
    import random
    from datetime import timedelta
    from engine.series import PERIODS
    random.seed(7)
    for _ in range(300):
        at = NOW + timedelta(seconds=random.randint(0, 86400))
        times = sorted(at.timestamp() - random.uniform(-600, 8 * 86400) for _ in range(random.randint(0, 200)))
        rows = [Change(t, random.choice(["unavailable", "-1", str(round(random.uniform(0, 60), 2))])) for t in times]
        period, mode = random.choice(list(PERIODS)), random.choice(["mean", "peak"])
        for later in (0, 60, 600, 4000):
            moment = at + timedelta(seconds=later)
            assert wind_chart_series(rows, "km/h", moment, 3, mode, period) == wind_chart_series(list(rows), "km/h", moment, 3, mode, period)


def test_kept_rain_bars_are_the_bars_computed_from_scratch() -> None:
    # The bars already over are kept until the hour changes (docs/PLAN-OPTIMISATION.md, point 5): with the counter's
    # reading carried to now, on the hour or not, across resets, they must be the bars drawn from scratch.
    import random
    from datetime import timedelta
    from engine.series import rain_bars
    random.seed(11)
    for _ in range(60):
        top = NOW.timestamp() - NOW.timestamp() % 3600
        level, sums = 0.0, []
        for h in range(random.randint(1, 32 * 24), 0, -1):
            level = 0.0 if random.random() < 0.02 else level + random.choice([0, 0, 0, 0.2, 1.4])
            sums.append(Change(top - h * 3600, str(round(level, 1))))
        for minutes in (0, 0, 7, 60, 61):
            at = NOW + timedelta(minutes=minutes)
            live = Change(at.timestamp(), str(round(level + random.uniform(0, 3), 1))) if random.random() < 0.8 else None
            for period in ("24h", "30d"):
                assert rain_bars(sums, at, PARIS, period, live) == rain_bars([*sums, *([live] if live else [])], at, PARIS, period)
