"""Moisture computed without Thermal Comfort, and tonight's frost and fog (ported from the card's humidity tests)."""
from dataclasses import replace
from datetime import timedelta

import pytest

from engine.brief import build_brief
from engine.forecast import Hour
from engine.local import build_local
from engine.moisture import comfort_word, dew_point, frost_point, heat_index, humidex, humidex_feel, humidity_feel, relative_humidity
from engine.settings import Settings
from test_brief import NOW, ZONE, State, weather


def test_reproduces_the_thermal_comfort_sensors_of_a_real_gw2000a_reading() -> None:
    # 07/10/2026, Gardanne: 19.2 °C and 82 % gave dew point 16.068 °C and frost point 13.507 °C in Thermal Comfort.
    dew = dew_point(19.2, 82)
    assert dew == pytest.approx(16.068, abs=5e-4)
    assert frost_point(19.2, dew) == pytest.approx(13.507, abs=5e-4)
    assert humidex(30, 22) == pytest.approx(39.3, abs=0.05)
    assert dew_point(20, 0) is None


def test_names_the_feel_on_the_utci_grid_and_the_moisture_only_when_it_matters() -> None:
    assert [comfort_word(t) for t in (-20, -5, 5, 20, 28, 35, 40, 50)] == [
        "Froid intense", "Froid", "Frais", "Agréable", "Chaud", "Très chaud", "Chaleur intense", "Chaleur extrême"]
    assert humidity_feel(22, 70, 30) == "air très lourd"
    assert humidity_feel(16.5, 80, 15) == ""
    assert humidity_feel(5, 25, 24) == "air sec"
    assert humidex_feel(36) == "inconfort évident"


def local(states: dict[str, State], **options: str):
    return build_local(states.get, Settings.from_options({"weather_entity": "weather.city", **options}), [], {}, NOW, ZONE)


def test_heat_index_matches_the_weather_service_tables() -> None:
    # NWS table: 90 °F at 70 % → 106 °F; 80 °F at 40 % → 80 °F; below 26 °C the humidity adds next to nothing.
    assert heat_index(32.2, 70) == pytest.approx(41.1, abs=0.3)
    assert heat_index(26.7, 40) == pytest.approx(26.7, abs=0.3)
    assert heat_index(20.6, 74) == pytest.approx(20.6, abs=0.15)
    assert heat_index(20, 0) is None
    assert relative_humidity(20, dew_point(20, 74)) == pytest.approx(74, abs=0.3)


def test_a_mild_humid_day_does_not_feel_five_degrees_warmer() -> None:
    # Gardanne, 11/11/2026: 20,6 °C and 74 % gave 25,7 °C « ressentis » through the humidex (+4,5 °C of humidity alone).
    w = local({"weather.city": State("cloudy"), "sensor.t": State("20.6"), "sensor.h": State("74")}, temperature_entity="sensor.t", humidity_entity="sensor.h")
    assert w.feel.value is not None and w.feel.value - 20.6 < 0.3
    assert w.feel.phrase == "Ressenti égal au thermomètre"


def test_computes_heat_index_from_the_station_then_the_bulletin_never_over_a_configured_sensor() -> None:
    city = State("cloudy", {"temperature": 18, "humidity": 90})
    station = local({"weather.city": city, "sensor.t": State("30"), "sensor.h": State("60")}, temperature_entity="sensor.t", humidity_entity="sensor.h")
    assert (station.humidity_source, station.feel.base, station.feel.word) == ("station", "heat_index", "Très chaud")
    assert station.heat_index == pytest.approx(heat_index(30, 60), abs=0.05)
    bulletin = local({"weather.city": city})
    assert (bulletin.humidity_source, bulletin.feel.base, bulletin.humidity) == ("bulletin", "heat_index", 90)
    assert bulletin.dew_point == pytest.approx(dew_point(18, 90), abs=0.05)
    broken = local({"weather.city": city, "sensor.h": State("unavailable")}, humidity_entity="sensor.h")
    assert (broken.feel.base, broken.heat_index) == ("thermometer", None)
    assert broken.feel.phrase == "Humidité inconnue : non prise en compte"


def test_does_not_call_the_bulletin_humidity_a_fog_observed_by_the_station() -> None:
    w = local({"weather.city": State("cloudy", {"temperature": 8, "humidity": 100})})
    assert not w.observed and not w.observed_fog


def test_announced_rain_wins_over_a_saturated_station_without_a_gauge() -> None:
    # Issue #3: 99 % at the station all night, rain in the bulletin, no rain gauge: it rains, it is not fog.
    station = {"sensor.t": State("11.2"), "sensor.h": State("99")}
    options = {"temperature_entity": "sensor.t", "humidity_entity": "sensor.h"}
    for wet in ("rainy", "pouring", "snowy"):
        w = local({"weather.city": State(wet, {"temperature": 11}), **station}, **options)
        assert (w.condition, w.observed, w.observed_fog) == (wet, False, False)
    # A dry bulletin keeps the fog seen by the station.
    w = local({"weather.city": State("cloudy", {"temperature": 11}), **station}, **options)
    assert (w.condition, w.observed, w.observed_fog) == ("fog", True, True)
    # A gauge measuring nothing contradicts the bulletin's rain: the fog stays.
    w = local({"weather.city": State("rainy", {"temperature": 11}), **station, "sensor.r": State("0")}, **options, rain_rate_entity="sensor.r")
    assert (w.condition, w.observed_fog) == ("fog", True)


# ── Tonight in the brief ─────────────────────────────────────────────────────

def night(low: float, precipitation: float | None = None, wind: float | None = None, humidity: float | None = None) -> list[Hour]:
    # NOW + 18 h = 06:00 in Paris.
    return [Hour(time=NOW + timedelta(hours=4), temperature=9),
            Hour(time=NOW + timedelta(hours=18), temperature=low, precipitation=precipitation, wind_speed=wind, humidity=humidity)]


def signals(hours: list[Hour], frost: float | None = None, dew: float | None = None, wind: float = 3):
    w = replace(weather(temperature=10, feels=10, wind=wind), frost_point=frost, dew_point=dew)
    return {s.key: s for s in build_brief(w, Settings.from_options({"weather_entity": "weather.city"}), {}.get, hours, [], NOW, ZONE).signals}


def test_warns_of_frost_on_the_ground_from_3_degrees_and_white_frost_when_humid_enough() -> None:
    frost = signals(night(2), frost=1)["frost-night"]
    assert (frost.severity, frost.text) == (1, "Gelée blanche possible vers 6 h : 2 °C prévus")
    assert signals(night(2), frost=-8)["frost-night"].text == "Gel au sol possible vers 6 h : 2 °C prévus"
    assert signals(night(-1), frost=-2)["frost-night"].text == "Gel vers 6 h : -1 °C prévus"
    assert "frost-night" not in signals(night(6), frost=1)


def test_announces_fog_only_when_the_air_will_saturate_on_a_calm_dry_night() -> None:
    assert signals(night(8), dew=9)["fog-later"].text == "Brouillard possible vers 6 h"
    assert "fog-later" not in signals(night(8), dew=9, wind=15)
    assert "fog-later" not in signals(night(8, precipitation=2), dew=9)
    assert "fog-later" not in signals(night(8), dew=5)


def test_judges_the_night_on_its_own_forecast_so_the_line_does_not_blink_with_the_afternoon_wind() -> None:
    # Gardanne, 9 October: 7 °C forecast at the coldest hour, 95 % humidity, wind 3.6 km/h; at 14 h the station wind swings between 0 and 18 km/h.
    tonight = night(7, wind=3.6, humidity=95)
    for wind in (2, 9, 15):
        assert "fog-later" in signals(tonight, dew=9, wind=wind)
    for dew in (6.3, 9.5):
        assert "fog-later" in signals(tonight, dew=dew)
    # A windy or less humid night: no fog, whatever the afternoon says.
    assert "fog-later" not in signals(night(7, wind=14, humidity=95), dew=9, wind=2)
    assert "fog-later" not in signals(night(7, wind=3.6, humidity=85), dew=9, wind=2)
