"""Where the station stands (docs/STATION-EMPLACEMENT.md): be wary first, correct only what is learned."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from engine import station_place as sp
from engine import station_shade
from engine.current import current_metrics, current_weather
from engine.local import build_local
from engine.settings import Settings

PARIS = ZoneInfo("Europe/Paris")
LAT, LON = 46.0, 4.0
# 5 November 2026, 15 h in Paris: the sun on a south-west wall.
AFTERNOON = datetime(2026, 11, 5, 15, tzinfo=PARIS)


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)


def settings(**kw: Any) -> Settings:
    return Settings.from_options({"weather_entity": "weather.home", "temperature_entity": "sensor.t", "humidity_entity": "sensor.h",
                                  "wind_speed_entity": "sensor.v", "wind_gust_entity": "sensor.g", **kw})


def states(temperature: float = 19.4, forecast: float = 16.0, clouds: float = 10.0, wind: float = 6.0, gust: float = 9.0,
           bearing: float = 265.0, forecast_wind: float = 28.0) -> dict[str, State]:
    return {"weather.home": State("sunny", {"temperature": forecast, "temperature_unit": "°C", "cloud_coverage": clouds, "wind_speed": forecast_wind,
                                            "wind_gust_speed": forecast_wind + 15, "wind_speed_unit": "km/h", "wind_bearing": bearing}),
            "sensor.t": State(str(temperature), {"unit_of_measurement": "°C"}), "sensor.h": State("40", {"unit_of_measurement": "%"}),
            "sensor.v": State(str(wind), {"unit_of_measurement": "km/h"}), "sensor.g": State(str(gust), {"unit_of_measurement": "km/h"})}


def test_the_sun_faces_a_south_west_wall_from_half_past_noon_until_sunset_in_november():
    start, end = sp.wall_window("sw", AFTERNOON.date(), PARIS, LAT, LON)
    assert (start.strftime("%H:%M"), end.strftime("%H:%M")) == ("12:30", "17:20")
    # A north wall never sees the November sun.
    assert sp.wall_window("n", AFTERNOON.date(), PARIS, LAT, LON) is None


def test_against_a_sunny_wall_the_forecast_stands_in_until_the_gap_is_learned():
    s = settings(station_side="sw", station_wall="against")
    value, note = sp.retained_temperature(s, {}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {})
    assert (value, note.how) == (16.0, "forecast")
    # Within a degree of the forecast, the station is believed.
    assert sp.retained_temperature(s, {}, 16.8, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {}) == (16.8, None)
    # Under clouds, or in the morning, the wall is not in the sun.
    assert sp.retained_temperature(s, {}, 19.4, 16.0, 75.0, AFTERNOON, PARIS, LAT, LON, {})[1] is None
    assert sp.retained_temperature(s, {}, 19.4, 16.0, 10.0, AFTERNOON.replace(hour=10), PARIS, LAT, LON, {})[1] is None
    # 1 to 3 m from the wall, or nothing said: only watched.
    assert sp.retained_temperature(settings(station_side="sw", station_wall="near"), {}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {})[1] is None
    assert sp.retained_temperature(settings(), {}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {})[1] is None


def test_a_station_in_the_shade_is_not_heated_by_its_wall():
    s = settings(station_side="sw", station_wall="against")
    where = station_shade.cell(AFTERNOON - timedelta(minutes=30), LAT, LON)
    assert sp.retained_temperature(s, {}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {where: 0.3})[1] is None


def test_once_learned_only_the_learned_excess_is_taken_off():
    s = settings(station_side="sw", station_wall="against")
    key = sp.temperature_key(AFTERNOON, LAT, LON, 10.0)
    value, note = sp.retained_temperature(s, {"temperature": {"cells": {key: [2.1, 30]}}}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {})
    assert (value, note.how, note.text()) == (17.3, "corrected", "le mur au soleil ajoute 2,1 °C")
    # Learned without excess: the declared wariness falls.
    assert sp.retained_temperature(s, {"temperature": {"cells": {key: [0.4, 30]}}}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {}) == (19.4, None)
    # Too few hours: not learned yet.
    assert sp.retained_temperature(s, {"temperature": {"cells": {key: [2.1, 5]}}}, 19.4, 16.0, 10.0, AFTERNOON, PARIS, LAT, LON, {})[1].how == "forecast"


def test_the_nights_learn_the_excess_of_sunny_hours_over_the_overcast_gap():
    start = datetime(2026, 9, 1, tzinfo=timezone.utc)
    hours = []
    for day in range(40):
        for hour in range(24):
            moment = start + timedelta(days=day, hours=hour)
            overcast = day % 2 == 0
            elevation, azimuth = station_shade.sun_position(moment + timedelta(minutes=30), LAT, LON)
            # A place 0.5 °C colder than the forecast; its wall adds 2.5 °C in the afternoon sun.
            gap = -0.5 + (2.5 if not overcast and elevation > 5 and 200 <= azimuth < 260 else 0)
            hours.append((moment, 15.0, 90.0 if overcast else 5.0, 15.0 + gap))
    learned = sp.learn_temperature(hours, LAT, LON)
    assert learned["background"]["day"] == -0.5
    hot = {k: v for k, v in learned["cells"].items() if v[0] >= sp.GAP}
    assert hot and all(k.endswith("/clear") and 180 <= int(k.split("/")[0]) < 270 for k in hot)
    assert max(v[0] for v in hot.values()) == 2.5
    # The morning sun is learned without excess.
    assert all(v[0] < sp.GAP for k, v in learned["cells"].items() if k.startswith("120/"))


def test_a_side_whose_wind_is_far_weaker_is_sheltered():
    rows = [(20.0, bearing, 20.0 * share) for bearing, share in ((0, 0.6), (90, 0.55), (180, 0.6), (270, 0.2)) for _ in range(20)]
    learned = {"wind": sp.learn_wind(rows)}
    assert sp.sheltered_sides(settings(), learned) == {"w"}
    # A declared side the wind shows open is given back to the station.
    assert sp.sheltered_sides(settings(wind_shelter=["e"]), learned) == {"w"}
    # Before the nights: what was declared.
    assert sp.sheltered_sides(settings(wind_shelter=["e"]), {}) == {"e"}


def test_from_a_sheltered_side_the_stronger_of_station_and_forecast():
    s = settings(wind_shelter=["w"])
    speed, gust, note = sp.retained_wind(s, {}, 6.0, 9.0, 28.0, 43.0, 265.0)
    assert (speed, gust, note.text()) == (28.0, 43.0, "station abritée de l’ouest")
    assert sp.retained_wind(s, {}, 6.0, 9.0, 28.0, 43.0, 90.0)[2] is None


def test_the_gauge_share_is_learned_from_enough_days_of_rain():
    assert sp.learn_rain([(10.0, 5.0)] * 10) == {}
    assert sp.learn_rain([(10.0, 5.0)] * 16 + [(0.2, 0.0)] * 30) == {"share": 0.5, "days": 16}


def test_the_overlay_keeps_the_water_in_the_air_and_says_why():
    s = settings(station_side="sw", station_wall="against", wind_shelter=["w"])
    get = states().get
    over, read = sp.overlay(s, get, {}, [], AFTERNOON, PARIS, LAT, LON, {})
    assert read("sensor.t").state == "16.0" and read("sensor.v").state == "28.0"
    # The same water in cooler air: a higher relative humidity.
    assert float(read("sensor.h").state) > 40
    assert set(over.station_notes) == {"temperature", "wind"}
    w = build_local(read, over, [], {}, AFTERNOON, PARIS)
    metrics = {m.key: m for m in current_metrics(read, over, w)}
    assert (metrics["temperature"].value, metrics["temperature"].source) == (16.0, "Prévision")
    assert metrics["temperature"].description == "La station est au soleil contre le mur"
    assert metrics["wind"].description == "Station abritée de l’ouest"
    assert current_weather(read, over, w).temperature_source == "Prévision"
    # Nothing said, nothing learned: untouched.
    assert sp.overlay(settings(), get, {}, [], AFTERNOON, PARIS, LAT, LON, {})[0].station_notes == {}


def test_a_sheltered_gauge_does_not_deny_the_bulletin_rain():
    get = {"weather.home": State("rainy", {}), "sensor.r": State("0", {"unit_of_measurement": "mm/h"})}.get
    open_gauge = Settings.from_options({"weather_entity": "weather.home", "rain_rate_entity": "sensor.r"})
    tree = Settings.from_options({"weather_entity": "weather.home", "rain_rate_entity": "sensor.r", "rain_gauge_shelter": "tree"})
    assert current_weather(get, open_gauge, build_local(get, open_gauge, [], {}, AFTERNOON, PARIS)).condition == "cloudy"
    assert current_weather(get, tree, build_local(get, tree, [], {}, AFTERNOON, PARIS)).condition == "rainy"


def test_each_measure_says_how_far_it_can_be_trusted():
    s = settings(station_side="sw", station_wall="against", wind_shelter=["w"], solar_radiation_entity="sensor.sun",
                 rain_rate_entity="sensor.r", rain_gauge_shelter="tree")
    trust = sp.describe(s, {}, {"cells": {"200/20": 0.3}, "learned": 40, "reachable": 120}, AFTERNOON, PARIS, LAT, LON)
    assert {k: v["level"] for k, v in trust.items()} == {"temperature": "handled", "wind": "handled", "rain": "handled", "sun": "handled"}
    assert trust["temperature"]["line"] == "De 12 h 30 à 17 h 20 en ce moment, Hestia prend la prévision."
    assert trust["wind"]["line"] == "Dégagée : N, NE, E, SE, S, SO, NO."
    plain = sp.describe(settings(), {}, None, AFTERNOON, PARIS, LAT, LON)
    assert {k: v["level"] for k, v in plain.items()} == {"temperature": "watch", "wind": "watch"}


def test_the_questions_asked_follow_the_station():
    s = settings(solar_radiation_entity="sensor.sun")
    assert sp.asked(s, {}) == ["station_side", "station_height", "station_ground", "station_shade", "wind_shelter"]
    assert sp.asked(s, {"station_side": "sw"})[:2] == ["station_side", "station_wall"]
    assert "station_height" not in sp.asked(s, {"station_side": "roof"})
    # « Je ne sais pas » is an answer.
    assert sp.questions_left(s, {"station_side": "", "station_height": "standard"}) == 3


def test_the_wind_shelter_setting_keeps_an_empty_list():
    assert settings(wind_shelter=[]).wind_shelter == ()
    assert settings(wind_shelter=["w", "n"]).wind_shelter == ("w", "n")
    assert settings().wind_shelter is None
