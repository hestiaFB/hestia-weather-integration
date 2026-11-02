"""The view the card receives (ported from the card's view-model tests, plus the JSON contract)."""
import json
import re
from dataclasses import dataclass, field, replace
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from engine.brief import build_brief
from engine.forecast import parse_days
from engine.local import build_local
from engine.settings import Settings
from engine.station import Derived, Total
from engine.trends import Direction, Trend
from engine.view import build_view, place_name, to_json

PARIS = ZoneInfo("Europe/Paris")
# Gardanne, Thursday 8 October 2026 at 17:40, the visual bench's frozen time.
NOW = datetime.fromisoformat("2026-10-08T17:40:00+02:00")


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)


WEATHER = State("partlycloudy", {"friendly_name": "Gardanne", "temperature": 22.4, "temperature_unit": "°C", "humidity": 74, "pressure": 1013,
                                 "wind_speed": 8, "wind_bearing": 200, "attribution": "Météo-France", "wind_speed_unit": "km/h"})


def sensor(state: Any, unit: str = "", **attributes: Any) -> State:
    return State(str(state), {"unit_of_measurement": unit, **attributes})


def view(options: dict[str, Any], states: dict[str, State], derived: Derived | None = None, days=(), adjust=None, history=None):
    every = {"weather.home": WEATHER, "sun.sun": State("above_horizon", {"elevation": 20}), **states}
    settings = Settings.from_options({"weather_entity": "weather.home", "location": "Gardanne", **options})
    w = build_local(every.get, settings, [], history or {}, NOW, PARIS)
    if adjust:
        w = adjust(w)
    brief = build_brief(w, settings, every.get, [], list(days), NOW, PARIS)
    return build_view(every.get, settings, w, brief, [], list(days), history or {}, {}, derived, NOW, PARIS, 43.45)


def test_weather_only_charts_use_recorded_attributes_and_keep_the_provider_label():
    from engine.trends import Change
    from engine.series import weather_history_key
    history = {weather_history_key("weather.home", field): [Change(NOW.timestamp() - 6 * 3600, str(value))]
               for field, value in (("wind_speed", 12), ("wind_gust_speed", 20), ("pressure", 1010))}
    v = view({}, {"weather.home": State(WEATHER.state, {**WEATHER.attributes, "wind_gust_speed": 18})}, history=history)
    assert v.wind.source == v.pressure.source == "Météo-France"
    assert len([p for p in v.wind.mean if p.value is not None]) > 2
    assert v.wind.mean[0].value == 12 and v.wind.gust[0].value == 20
    assert v.pressure.series[0].value == 1010
    assert v.pressure.description == "Pression du bulletin"  # not a local measurement
    assert v.pressure.trend is None  # station-derived sensors retain their own meaning


def test_weather_history_never_replaces_a_station_chart_or_invents_an_absent_history():
    from engine.trends import Change
    from engine.series import weather_history_key
    start = NOW.timestamp() - 6 * 3600
    history = {weather_history_key("weather.home", "wind_speed"): [Change(start, "99")],
               weather_history_key("weather.home", "pressure"): [Change(start, "900")],
               "sensor.wind": [Change(start, "4")], "sensor.pressure": [Change(start, "1013")]}
    v = view({"wind_speed_entity": "sensor.wind", "pressure_entity": "sensor.pressure"},
             {"sensor.wind": sensor(4, "km/h"), "sensor.pressure": sensor(1013, "hPa")}, history=history)
    assert v.wind.mean[0].value == 4 and v.pressure.series[0].value == 1013
    empty = view({}, {})
    assert empty.wind.mean == empty.pressure.series == ()
    assert "service météo" in empty.wind.empty and "Home Assistant" in empty.pressure.empty
    assert "facultatif" in empty.rain.empty


def test_keeps_the_town_of_a_meteo_france_entity_and_short_names_as_they_are() -> None:
    assert place_name("Météo-France forecast for city Auriol - Provence-Alpes-Côte d'Azur (13) - FR Auriol") == "Auriol"
    assert place_name("Gardanne") == "Gardanne"
    assert place_name("Maison") == "Maison"


def test_hides_station_measurements_not_configured_but_keeps_an_unavailable_configured_sensor() -> None:
    bare = view({}, {})
    assert bare.rain is not None  # the bulletin still says whether it rains
    assert bare.wind.source == "Météo-France"
    broken = view({"wind_speed_entity": "sensor.wind"}, {"sensor.wind": sensor("unavailable", "km/h")})
    assert (broken.wind.value, broken.wind.source) == (8, "Météo-France · repli")
    assert view({"pressure_entity": "sensor.pressure"}, {"sensor.pressure": sensor("unavailable", "hPa")}).pressure.source == "Météo-France · repli"


def test_shows_the_vigilance_and_the_rain_measured_at_home_together_without_repeating_them() -> None:
    options = {"vigilance_entity": "sensor.vigilance", "rain_rate_entity": "sensor.rain", "temperature_entity": "sensor.t", "humidity_entity": "sensor.h"}
    v = view(options, {"sensor.vigilance": sensor("Jaune", attribution="Data provided by Météo-France", Orages="Jaune"),
                       "sensor.rain": sensor(8.2, "mm/h"), "sensor.t": sensor(22.4, "°C"), "sensor.h": sensor(78, "%")})
    assert [a.label for a in v.alerts] == ["Vigilance jaune", "Maintenant"]
    assert "8,2 mm/h" in v.alerts[1].text
    assert not {a.text for a in v.alerts} & {p.text for p in v.points}
    # A downpour keeps its text white on the dark sky.
    assert (v.now.condition, v.now.dark_sky) == ("pouring", True)


def test_explains_the_feel_with_its_causes_and_today_s_calculation() -> None:
    v = view({"temperature_entity": "sensor.t", "humidity_entity": "sensor.h", "wind_speed_entity": "sensor.wind"},
             {"sensor.t": sensor(25, "°C"), "sensor.h": sensor(85, "%"), "sensor.wind": sensor(20, "km/h")})
    assert v.comfort.source == "Station locale"
    assert "humidité" in [f.label for f in v.comfort.factors]
    assert re.match(r"^[\d,]+ °C \(humidex\).* = [\d,]+ °C ressentis$", v.comfort.example)
    assert v.comfort.gap > 0


def test_marks_partial_totals_with_at_least_and_keeps_labels_short() -> None:
    derived = Derived(day=Total(None, False), recent=Total(2, True), week=Total(12.4, True), month=Total(40, False), year=Total(None, False),
                      days=(), temperature_trend=None, gust_max=Total(43, True))
    v = view({"rain_total_entity": "sensor.total", "wind_gust_entity": "sensor.gust"},
             {"sensor.total": sensor(500, "mm"), "sensor.gust": sensor(20, "km/h")}, derived)
    assert [(s.label, s.value, s.entity) for s in v.rain.stats] == [("Semaine", "≥ 12,4 mm", "sensor.total"), ("Mois", "40 mm", "sensor.total")]
    assert v.rain.label == "Ces dernières 24 h · cumul partiel"
    assert next(s.value for s in v.wind.stats if s.label == "Max. du jour") == "≥ 43 km/h"


def test_keeps_an_atmo_sub_index_visible_when_worse_than_the_global_index_today_and_tomorrow() -> None:
    def atmo(value: int) -> State:
        return sensor(value, **{"Nom de la zone": "Gardanne"})

    v = view({"atmo_air_entity": "sensor.air", "atmo_o3_entity": "sensor.o3", "atmo_air_tomorrow_entity": "sensor.air_j1", "pollen_source": "none"},
             {"sensor.air": atmo(2), "sensor.o3": atmo(4), "sensor.air_j1": atmo(3)})
    assert len(v.air.today) == 1
    today = v.air.today[0]
    assert (today.kind, today.zone, today.primary.value, today.worse.label, today.worse.reading.value) == ("air", "Gardanne", 2, "O₃", 4)
    assert (v.air.tomorrow[0].tomorrow, v.air.tomorrow[0].primary.value) == (True, 3)


def test_names_the_days_of_the_week_today_first() -> None:
    days = parse_days({"datetime": (NOW + timedelta(days=i)).isoformat(), "condition": "rainy", "temperature": 20 + i, "templow": 12, "precipitation": 3}
                      for i in range(3))
    v = view({}, {}, days=days)
    assert [d.label for d in v.days] == ["Auj.", "Ven", "Sam"]
    d = v.days[0]
    assert (d.today, d.icon, d.high, d.low, d.rain) == (True, "mdi:weather-rainy", 20, 12, 3)


def test_places_each_forecast_hour_on_the_timeline() -> None:
    from engine.forecast import Hour
    from engine.view import forecast_slots
    hours = [Hour(time=NOW + timedelta(hours=i), temperature=15, condition="sunny") for i in range(1, 4)]
    assert [(s.hour, s.time) for s in forecast_slots(hours, NOW, PARIS)] == [(18 + i, (NOW + timedelta(hours=i + 1)).timestamp()) for i in range(3)]



def test_passes_the_forecast_pressure_on_in_hpa_when_the_provider_gives_it() -> None:
    from engine.forecast import Units, parse_hours
    from engine.view import forecast_slots, to_json
    rows = [{"datetime": (NOW + timedelta(hours=i)).isoformat(), "condition": "sunny", **({"pressure": 29.9} if i == 1 else {})} for i in (1, 2)]
    slots = forecast_slots(parse_hours(rows, Units(pressure="inHg")), NOW, PARIS)
    assert [s.pressure for s in slots] == [1012.5, None]
    # Unknown values are left out of the card's view.
    assert [("pressure" in to_json(s)) for s in slots] == [True, False]

def test_says_the_pressure_is_stable_rather_than_zero() -> None:
    v = view({"pressure_entity": "sensor.pressure"}, {"sensor.pressure": sensor(1014, "hPa")},
             adjust=lambda w: replace(w, pressure_trend=Trend(0, 180, Direction.STEADY, "temps installé")))
    assert (v.pressure.trend.label, v.pressure.trend.value) == ("stable sur 3 h", None)


def test_dates_the_day_in_french_with_a_capital() -> None:
    assert view({}, {}).date_label == "Jeudi 8 octobre"


def test_sends_plain_json_with_camel_case_keys_and_no_unknown_values() -> None:
    v = view({"wind_speed_entity": "sensor.wind", "pressure_entity": "sensor.pressure"},
             {"sensor.wind": sensor(12, "km/h"), "sensor.pressure": sensor(1014, "hPa")})
    data = json.loads(json.dumps(to_json(v), allow_nan=False))
    assert {"location", "dateLabel", "forecastSource", "now", "season", "alerts", "points", "extras", "hours", "days", "air"} <= set(data)
    assert data["now"]["temperatureSource"] == "Météo-France" and "conditionEntity" in data["now"]
    assert (data["weatherEntity"], data["station"]) == ("weather.home", False)
    assert data["season"]["info"]["season"] == "autumn" and data["season"]["tip"].startswith("Automne")
    # Unknown values are left out, so the card reads them as undefined, never as null.
    assert "trend" not in data["now"] and "rateEntity" not in data["rain"]
    assert all(value is not None for value in data["now"].values())
    # Chart points travel as [seconds, value].
    assert data["pressure"]["series"] == [] or isinstance(data["pressure"]["series"][0], list)
