from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from engine import records as r
from engine.records import DayValues, Mark

PARIS = ZoneInfo("Europe/Paris")


def test_a_month_keeps_its_records_with_their_day_and_counts_the_days() -> None:
    months = r.summarise([DayValues(date(2026, 7, 1), high=31, low=21, gust=40, rain=0),
                          DayValues(date(2026, 7, 2), high=35.1, low=18, gust=72, rain=12.4),
                          DayValues(date(2026, 7, 3), high=35.1, low=14.2, rain=3)])
    july = months["2026-07"]
    # A tie keeps the first day.
    assert (july.chaleur, july.froid, july.rafale, july.pluie) == (Mark(35.1, date(2026, 7, 2)), Mark(14.2, date(2026, 7, 3)),
                                                                   Mark(72, date(2026, 7, 2)), Mark(12.4, date(2026, 7, 2)))
    assert (july.jours_chauds, july.nuits_tropicales, july.jours_gel, july.measured) == (3, 1, 0, 3)


def test_frost_is_at_or_below_zero_and_what_cannot_be_a_reading_is_left_out() -> None:
    months = r.summarise([DayValues(date(2026, 1, 1), high=4, low=0), DayValues(date(2026, 1, 2), high=3, low=0.1),
                          DayValues(date(2026, 1, 3), high=99, low=-80, gust=-3), DayValues(date(2026, 1, 4), high=2, low=5),
                          DayValues(date(2026, 1, 5), rain=0)])
    january = months["2026-01"]
    assert (january.jours_gel, january.measured, january.chaleur, january.rafale) == (1, 2, Mark(4, date(2026, 1, 1)), None)
    # A dry day is no record of rain.
    assert january.pluie is None


def test_records_of_all_time_of_the_year_and_of_the_month() -> None:
    months = r.summarise([DayValues(date(2003, 8, 12), high=38.2, low=24), DayValues(date(2026, 7, 14), high=35.1, low=19),
                          DayValues(date(2026, 11, 3), high=18.4, low=-1.5), DayValues(date(2012, 2, 9), high=-2, low=-12.6)])
    out = r.compute(months, date(2026, 11, 8))
    heat, cold = out.marks["chaleur"], out.marks["froid"]
    assert (heat.ever, heat.year, heat.month) == (Mark(38.2, date(2003, 8, 12)), Mark(35.1, date(2026, 7, 14)), Mark(18.4, date(2026, 11, 3)))
    assert (cold.ever, cold.year, cold.month) == (Mark(-12.6, date(2012, 2, 9)), Mark(-1.5, date(2026, 11, 3)), Mark(-1.5, date(2026, 11, 3)))
    assert out.since == date(2003, 8, 12)
    assert out.counts["jours_gel"].year == 1 and out.counts["jours_gel"].month == 1


def test_counts_say_when_days_are_missing_and_the_mean_takes_only_full_years() -> None:
    days = [DayValues(date(2025, 1, 1) + timedelta(days=i), high=31 if i < 20 else 15, low=10) for i in range(365)]
    days += [DayValues(date(2026, 1, 1), high=32, low=12), DayValues(date(2026, 1, 3), high=10, low=-2)]
    out = r.compute(r.summarise(days), date(2026, 1, 4))
    hot = out.counts["jours_chauds"]
    assert (hot.year, hot.month, hot.mean, hot.partial) == (1, 1, 20.0, True)
    full = r.compute(r.summarise(days + [DayValues(date(2026, 1, 2), high=5, low=1)]), date(2026, 1, 4))
    assert full.counts["jours_chauds"].partial is False


def test_each_record_says_since_when_it_is_measured_and_readings_keep_a_tenth() -> None:
    months = r.summarise([DayValues(date(2025, 12, 16), high=12, low=3), DayValues(date(2026, 10, 31), high=18, low=9, rain=0),
                          DayValues(date(2026, 11, 4), high=17, low=10, rain=18.799999999999955, gust=62.61)])
    out = r.compute(months, date(2026, 11, 8))
    assert out.marks["pluie"].since == date(2026, 10, 31) and out.marks["chaleur"].since == date(2025, 12, 16)
    assert out.marks["pluie"].ever == Mark(18.8, date(2026, 11, 4)) and out.marks["rafale"].ever.value == 62.6
    assert out.counts["jours_gel"].since == date(2025, 12, 16)
    assert r.load_months({k: m.as_dict() for k, m in months.items()}) == months


def test_nothing_known_gives_no_record() -> None:
    out = r.compute({}, date(2026, 11, 8))
    assert out.marks["chaleur"].ever is None and out.counts["jours_gel"].year is None and out.since is None


def test_a_refresh_replaces_only_the_months_read_again_and_the_store_round_trips() -> None:
    kept = r.summarise([DayValues(date(2026, 9, 5), high=28, low=12), DayValues(date(2026, 10, 2), high=25, low=9)])
    fresh = r.summarise([DayValues(date(2026, 10, 30), high=21, low=8), DayValues(date(2026, 11, 1), high=19, low=7)])
    since = r.first_of_previous_month(date(2026, 11, 8))
    assert since == date(2026, 10, 1)
    merged = r.merge(kept, fresh, since)
    assert sorted(merged) == ["2026-09", "2026-10", "2026-11"] and merged["2026-10"].chaleur == Mark(21, date(2026, 10, 30))
    stored = {k: m.as_dict() for k, m in merged.items()}
    assert r.load_months(stored) == merged
    assert r.load_months({"2026-01": {"oops": 1}, "x": None}) == {} and r.load_months(None) == {}
    assert r.load_months({"2026-10": {"first": "2026-10-01", "chaleur": [21, "2026-10-30"]}}) == {}


def test_station_days_add_up_the_hours_of_rain_of_each_local_day() -> None:
    def at(*args: int) -> float:
        return datetime(*args, tzinfo=PARIS).timestamp()

    sums = [(at(2026, 11, 1, 22), 10.0), (at(2026, 11, 1, 23), 11.0), (at(2026, 11, 2, 0), 13.5), (at(2026, 11, 2, 1), 14.0), (at(2026, 11, 2, 2), None)]
    rain = r.hourly_rain(sums)
    assert rain == [(at(2026, 11, 1, 23), 1.0), (at(2026, 11, 2, 0), 2.5), (at(2026, 11, 2, 1), 0.5)]
    days = {d.day: d for d in r.station_days([(at(2026, 11, 1), 4.0, 12.5)], [(at(2026, 11, 2), 55.0)], rain, PARIS)}
    # The hour ending at midnight is the evening's rain.
    assert days[date(2026, 11, 1)] == DayValues(date(2026, 11, 1), high=12.5, low=4.0, rain=3.5)
    assert days[date(2026, 11, 2)] == DayValues(date(2026, 11, 2), gust=55.0, rain=0.5)


def test_asks_open_meteo_by_day_with_the_position_rounded() -> None:
    p = r.archive_params(43.456789, 5.468123, PARIS, r.FIRST_DAY, date(2026, 11, 8))
    assert (p["latitude"], p["longitude"], p["start_date"], p["end_date"], p["timezone"]) == ("43.457", "5.468", "1940-01-01", "2026-11-08", "Europe/Paris")
    assert p["daily"] == "temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,precipitation_sum"
    assert r.recent_params(43.4, 5.4, PARIS)["past_days"] == "10"


def test_reads_the_archive_before_today_and_the_recent_days_fill_its_delay() -> None:
    payload = {"daily": {"time": ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-08"], "temperature_2m_max": [18.2, None, None, 20],
                         "temperature_2m_min": [9.1, None, None, 11], "wind_gusts_10m_max": [41, None, None, 30], "precipitation_sum": [0.4, None, None, 0]}}
    archive = r.parse_daily(payload, date(2026, 11, 8))
    assert archive == [DayValues(date(2026, 11, 1), 18.2, 9.1, 41, 0.4)]
    recent = r.parse_daily({"daily": {"time": ["2026-11-01", "2026-11-02"], "temperature_2m_max": [18, 17], "temperature_2m_min": [9, 8],
                                      "wind_gusts_10m_max": [40, 35], "precipitation_sum": [0, 2]}}, date(2026, 11, 8))
    assert [d.day for d in r.fill(archive, recent)] == [date(2026, 11, 1), date(2026, 11, 2)]
    assert r.fill(archive, recent)[0].high == 18.2
    for bad in ({}, {"daily": {}}):
        with pytest.raises(ValueError):
            r.parse_daily(bad, date(2026, 11, 8))


def test_heatwave_days_are_counted_from_the_first_day_hestia_counted() -> None:
    h = r.Heatwave.from_dict(None).started(date(2026, 6, 1))
    for day in (date(2026, 7, 20), date(2026, 7, 21), date(2026, 8, 11), date(2026, 7, 20)):
        h = h.add(day)
    count = h.count(date(2026, 7, 25))
    assert (count.year, count.month, count.since) == (3, 2, date(2026, 6, 1))
    assert r.Heatwave.from_dict(h.as_dict()) == h
    assert r.Heatwave.from_dict({"days": ["pas une date"]}) == r.Heatwave(frozenset(), None)
