from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from engine import open_meteo_forecast as om
from engine.forecast import Hour

NOW = datetime(2026, 11, 2, 10, tzinfo=timezone.utc)
T0 = int(NOW.timestamp())


def test_asks_two_days_of_sea_level_pressure_with_the_position_rounded() -> None:
    p = om.params(43.456789, 5.468123)
    assert (p["latitude"], p["longitude"], p["hourly"], p["forecast_days"], p["timeformat"]) == ("43.457", "5.468", "pressure_msl", "2", "unixtime")


def test_reads_the_pressure_by_hour_and_leaves_out_what_is_not_a_reading() -> None:
    data = om.parse({"hourly": {"time": [T0, T0 + 3600, T0 + 7200, T0 + 10800], "pressure_msl": [1015.2, None, 5, 1012.4]}}, NOW)
    assert data.pressure == {T0: 1015.2, T0 + 10800: 1012.4}
    for payload in ({}, {"hourly": {"time": [T0]}}, {"hourly": {"time": [T0], "pressure_msl": [None]}}):
        with pytest.raises(ValueError):
            om.parse(payload, NOW)


def test_fills_only_the_hours_without_a_pressure_at_the_same_hour() -> None:
    data = om.parse({"hourly": {"time": [T0, T0 + 3600], "pressure_msl": [1015, 1013]}}, NOW)
    hours = [Hour(time=NOW), Hour(time=NOW + timedelta(minutes=60), pressure=1020), Hour(time=NOW + timedelta(hours=5)), Hour()]
    assert [h.pressure for h in om.fill(hours, data)] == [1015, 1020, None, None]
    assert om.fill(hours, None) == hours


def test_is_asked_only_when_allowed_and_the_weather_service_gives_no_pressure() -> None:
    meteo_france = [Hour(time=NOW), Hour(time=NOW + timedelta(hours=1))]
    assert om.needed(True, meteo_france) and not om.needed(False, meteo_france)
    assert not om.needed(True, [Hour(time=NOW, pressure=1015), Hour(time=NOW)]) and not om.needed(True, [])


def test_asks_again_after_an_hour_and_retries_ten_minutes_after_a_failure() -> None:
    data = om.Data({T0: 1015}, NOW)
    assert om.due(None, None, NOW) and not om.due(None, NOW, NOW + timedelta(minutes=5))
    assert not om.due(data, NOW, NOW + timedelta(minutes=59)) and om.due(data, NOW, NOW + timedelta(hours=1))
