"""Pirate Weather (issue #35): recognised as a weather service, its hourly forecast read with its chance of rain and UV index.

The data is the reporter's own: weather.pirateweather's state and the first twelve hours of its weather.get_forecasts (15 November 2026).
"""
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from engine.compute import compute
from engine.current import weather_source_label
from engine.detection import detect_sources
from engine.forecast import Hour, Units, current_hour, engine_rows, parse_hours
from engine.nowcast import forecast_chance, rain_ahead
from engine.settings import Settings

DATA = json.loads((Path(__file__).parent / "fixtures" / "pirateweather-2026-11-15.json").read_text(encoding="utf-8"))
UNITS = Units(DATA["attributes"]["temperature_unit"], DATA["attributes"]["precipitation_unit"], DATA["attributes"]["wind_speed_unit"],
              DATA["attributes"]["pressure_unit"])
HOURS = parse_hours(DATA["hourly"], UNITS)
UTC = ZoneInfo("UTC")


@dataclass
class State:
    entity_id: str
    state: str = "partlycloudy"
    attributes: dict[str, Any] = field(default_factory=dict)


PIRATE = State("weather.pirateweather", DATA["state"], DATA["attributes"])
MET_NO = State("weather.forecast_home", "cloudy", {"attribution": "Weather forecast from met.no, delivered by the Norwegian Meteorological Institute."})
MF = State("weather.paris", "cloudy", {"attribution": "Data provided by Météo-France"})
REGISTRY = {"weather.pirateweather": {"platform": "pirateweather"}, "weather.forecast_home": {"platform": "met"},
            "weather.paris": {"platform": "meteo_france"}}


def at(hour: int, minute: int = 0) -> datetime:
    return datetime(2026, 11, 15, hour, minute, tzinfo=timezone.utc)


# ── Detection ────────────────────────────────────────────────────────────────

def test_pirate_weather_is_chosen_over_the_default_met_no() -> None:
    # Outside France, beside the met.no service Home Assistant installs by default: Pirate Weather was added on purpose.
    assert detect_sources([MET_NO, PIRATE], REGISTRY, {})["weather_entity"] == "weather.pirateweather"


def test_meteo_france_stays_first() -> None:
    assert detect_sources([MET_NO, PIRATE, MF], REGISTRY, {})["weather_entity"] == "weather.paris"


def test_two_pirate_weather_places_are_left_to_the_user() -> None:
    other = State("weather.pirateweather_2", "rainy", DATA["attributes"])
    found = detect_sources([MET_NO, PIRATE, other], {**REGISTRY, "weather.pirateweather_2": {"platform": "pirateweather"}}, {})
    assert "weather_entity" not in found


def test_recognised_by_its_attribution_when_recopied_from_another_home_assistant() -> None:
    assert detect_sources([MET_NO, PIRATE], {"weather.forecast_home": {"platform": "met"}}, {})["weather_entity"] == "weather.pirateweather"


def test_a_saved_choice_is_never_replaced() -> None:
    assert "weather_entity" not in detect_sources([MET_NO, PIRATE], REGISTRY, {"weather_entity": "weather.forecast_home"})


def test_the_source_is_named_pirate_weather() -> None:
    settings = Settings.from_options({"weather_entity": "weather.pirateweather"})
    assert weather_source_label({"weather.pirateweather": PIRATE}.get, settings) == "Pirate Weather"


# ── Hourly forecast ──────────────────────────────────────────────────────────

def test_the_hourly_forecast_is_read_with_its_chance_of_rain_and_uv() -> None:
    first = HOURS[0]
    assert first.time == at(11)
    assert (first.temperature, first.precipitation, first.condition) == (6.5, 0, "partlycloudy")
    assert (first.wind_speed, first.wind_gust, first.wind_bearing) == (5.54, 9.25, 234)
    assert (first.humidity, first.cloud_coverage, first.pressure) == (95, 87, 1015.6)
    assert (first.precipitation_probability, first.uv_index) == (37, 1.19)
    assert [h.precipitation_probability for h in HOURS[8:12]] == [23, 47, 70, 80]


def test_the_forecast_passed_on_keeps_the_felt_temperature_and_dew_point() -> None:
    rows = engine_rows(DATA["hourly"], UNITS)
    assert (rows[0]["apparent_temperature"], rows[0]["dew_point"], rows[0]["uv_index"], rows[0]["precipitation_probability"]) == (5.1, 5.8, 1.19, 37)


def test_a_chance_that_is_no_percentage_is_left_out() -> None:
    hours = parse_hours([{"datetime": "2026-11-15T11:00:00+00:00", "precipitation_probability": -1, "uv_index": -3},
                         {"datetime": "2026-11-15T12:00:00+00:00", "precipitation_probability": 250}])
    assert [(h.precipitation_probability, h.uv_index) for h in hours] == [(None, None), (None, None)]


def test_the_hour_now_falls_in() -> None:
    assert current_hour(HOURS, at(13, 59)) is HOURS[2]
    assert current_hour(HOURS, at(10, 59)) is None


# ── Rain to come ─────────────────────────────────────────────────────────────

def test_the_next_rain_and_its_chance_come_from_the_hourly_forecast() -> None:
    # 18 h 30: the fog drizzles (0,2 mm) at 19 h, the rain starts at 20 h (0,4 mm); 23, 47 and 70 % over the next three hours.
    ahead = rain_ahead(None, HOURS, at(18, 30))
    assert ahead == {"minutes": 90, "precision": "hour", "source": "forecast", "amount": 0.4, "dry_until": None, "intensity": None,
                     "chance": 70}


def test_a_dry_morning_still_says_its_chance() -> None:
    ahead = rain_ahead(None, HOURS, at(11, 30))
    assert ahead["chance"] == 37 and ahead["minutes"] == 510


def test_meteo_france_chance_comes_first() -> None:
    assert rain_ahead(None, HOURS, at(18, 30), chance=20.0)["chance"] == 20


def test_no_chance_without_one_in_the_forecast() -> None:
    hours = [Hour(time=at(12), precipitation=1.0)]
    assert forecast_chance(hours, at(12, 10)) is None
    assert rain_ahead(None, hours, at(12, 10))["chance"] is None


def test_hours_gone_by_do_not_count() -> None:
    assert forecast_chance(HOURS, at(22, 30)) == 80
    assert forecast_chance(HOURS, at(23, 30)) is None


# ── What Hestia Weather says with it ─────────────────────────────────────────

def _catalogue(now: datetime, hours: list[Hour]):
    states = {"weather.pirateweather": PIRATE, "sun.sun": State("sun.sun", "above_horizon", {"elevation": 15})}
    settings = Settings.from_options({"weather_entity": "weather.pirateweather", "location": "Maison"})
    return compute(states.get, settings, hours, [], {}, {}, [], None, now, UTC).catalogue


def test_the_uv_index_of_the_hour_stands_in_for_the_missing_one() -> None:
    # Pirate Weather's state carries no uv_index: this hour's forecast says it.
    c = _catalogue(at(13, 20), HOURS)
    assert c["uv_fort"].value is False and c["uv_fort"].source == "prevision" and c["uv_fort"].reason == "Indice UV sous 6"
    assert _catalogue(at(13, 20), [])["uv_fort"].reason == "Pas de capteur UV ni d’indice prévu"


def test_the_coming_rain_is_counted() -> None:
    c = _catalogue(at(18, 30), HOURS)
    assert c["pluie_6h"].value is not None and c["pluie_6h"].value > 0
    assert c["pluie_6h"].start == at(20)
