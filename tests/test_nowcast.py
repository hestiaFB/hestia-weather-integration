"""Next rain to the minute: Météo-France's radar hour first, the hourly forecast after it."""
from datetime import datetime, timedelta, timezone

from engine.forecast import Hour
from engine.nowcast import rain_ahead

NOW = datetime(2026, 10, 20, 11, 51, tzinfo=timezone.utc)
REF = datetime(2026, 10, 20, 11, 55, tzinfo=timezone.utc)
OFFSETS = ("0 min", "5 min", "10 min", "15 min", "20 min", "25 min", "35 min", "45 min", "55 min")


def radar(rainy_from=None, ref=REF):
    table = {k: ("Pluie faible" if rainy_from is not None and int(k.split()[0]) >= rainy_from else "Temps sec") for k in OFFSETS}
    return {"forecast_time_ref": ref.isoformat(), "1_hour_forecast": table}


def hour(h, mm):
    return Hour(time=datetime(2026, 10, 20, h, tzinfo=timezone.utc), precipitation=mm)


HOURS = [hour(11, 0), hour(12, 1.3), hour(13, 4.0)]


def test_hourly_forecast_alone_gives_the_start_of_the_rainy_hour_not_an_index():
    ahead = rain_ahead(None, HOURS, NOW)
    assert ahead == {"minutes": 9, "precision": "hour", "source": "forecast", "amount": 1.3, "dry_until": None,
                     "intensity": None, "chance": None}


def test_a_dry_radar_hour_pushes_the_rain_past_its_end():
    # 20 October, 13 h 51: the hourly forecast had rain from 14 h, the radar saw a dry hour until 14 h 55.
    ahead = rain_ahead(radar(), HOURS, NOW)
    assert ahead["minutes"] == 64 and ahead["precision"] == "hour" and ahead["dry_until"] == "2026-10-20T12:55:00+00:00"


def test_rain_seen_by_the_radar_is_given_to_the_minute():
    ahead = rain_ahead(radar(rainy_from=25), HOURS, NOW)
    assert ahead == {"minutes": 29, "precision": "minute", "source": "radar", "amount": None, "dry_until": None,
                     "intensity": 1, "chance": None}


def test_rain_already_falling_on_the_radar_is_due_now():
    assert rain_ahead(radar(rainy_from=0), [], NOW + timedelta(minutes=6))["minutes"] == 0


def test_a_stale_radar_is_ignored():
    stale = radar(rainy_from=0, ref=NOW - timedelta(minutes=40))
    assert rain_ahead(stale, HOURS, NOW)["source"] == "forecast"


def test_unreadable_radar_and_no_rain_at_all_stay_unknown():
    assert rain_ahead({"forecast_time_ref": "garbage", "1_hour_forecast": {}}, [hour(12, 0.1)], NOW)["minutes"] is None
    assert rain_ahead(radar(), [], NOW)["minutes"] is None


def test_the_radar_says_how_hard_it_rains_and_the_chance_is_passed_on():
    # 8 and 9 November: « Pluie faible » two minutes away, then nothing — said as light rain, with Météo-France's chance.
    table = {k: "Temps sec" for k in OFFSETS}
    table["10 min"], table["15 min"], table["20 min"] = "Pluie faible", "Pluie modérée", "Pluie faible"
    ahead = rain_ahead({"forecast_time_ref": REF.isoformat(), "1_hour_forecast": table}, HOURS, NOW, chance=70.0)
    assert (ahead["minutes"], ahead["intensity"], ahead["chance"]) == (14, 2, 70)
    table["15 min"] = "Pluie forte"
    assert rain_ahead({"forecast_time_ref": REF.isoformat(), "1_hour_forecast": table}, HOURS, NOW)["intensity"] == 3
