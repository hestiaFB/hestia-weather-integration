"""The brief, case by case (ported from the card's weather-brief tests)."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from engine.brief import build_brief
from engine.feel import Effects, Level
from engine.forecast import Day, Hour
from engine.local import Feel, LocalWeather, Rain, Wind
from engine.settings import Settings
from engine.trends import Trend

NOW = datetime(2026, 10, 4, 10, tzinfo=timezone.utc)
ZONE = ZoneInfo("Europe/Paris")
NO_TREND = Trend(None, 0, None, "")


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)
    last_updated: datetime | None = None


def weather(temperature: float | None = 20, feels: float | None = 20, humidex: float | None = 20, wind: float | None = None,
            gust: float | None = None, rain: float | None = None, uv: float | None = None, wind_effect: float = 0,
            humidity_source: str | None = None, condition: str = "sunny", observed: bool = False) -> LocalWeather:
    return LocalWeather(
        temperature=temperature, humidity=None, humidity_source=humidity_source, dew_point=None, frost_point=None, humidex=humidex,
        feel=Feel(feels, "humidex" if humidex is not None else "thermometer", Effects(wind=wind_effect), None if feels is None or temperature is None else feels - temperature,
                  "", "", "", ""),
        wind=Wind(wind, gust, None, None, None, None, "", "", "", "", NO_TREND),
        rain=Rain(rain, 0, None, None, None, None, None, None, "", None, None), pressure=None, pressure_trend=NO_TREND, temperature_trend=None,
        solar=None, sunshine=False, uv=uv, uv_text="", lux=None, sun_elevation=30, sunrise=6.5, sunset=21, condition=condition, observed=observed,
        observed_fog=False, forecast_condition=condition, title="", subtitle="", alert=None, level=Level.OPTIMIZED, forecast_available=True)


def hours(*points: dict[str, Any]) -> list[Hour]:
    return [Hour(time=None if p.get("hours") is None else NOW + timedelta(hours=p["hours"]), temperature=p.get("temperature"),
                 precipitation=p.get("precipitation"), condition=p.get("condition", ""), wind_speed=p.get("wind"), wind_gust=p.get("gust"),
                 pressure=p.get("pressure")) for p in points]


def brief(w: LocalWeather | None = None, points: list[Hour] | None = None, options: dict[str, Any] | None = None,
          states: dict[str, State] | None = None, days: list[Day] | None = None):
    settings = Settings.from_options({"weather_entity": "weather.test", **(options or {})})
    return build_brief(w or weather(), settings, (states or {}).get, points or [], days or [], NOW, ZONE)


def keys(b) -> list[str]:
    return [s.key for s in b.signals]


def test_explains_the_feel_without_inventing_reassuring_forecasts() -> None:
    b = brief(weather(feels=17, wind_effect=-3))
    assert "3 °C de moins" in b.summary and "Le vent accentue" in b.summary
    assert "prévisions indisponibles" in b.summary and "tout va bien" not in b.summary


def test_explains_humidex_heat_and_flags_missing_humidity() -> None:
    assert "L’humidité accentue" in brief(weather(feels=23, humidex=23)).summary
    assert "Humidité inconnue" in " ".join(brief(weather(humidex=None)).caveats)


def test_does_not_count_missing_sensors_as_calm_or_comfortable() -> None:
    b = brief(weather(temperature=None, feels=None, humidex=None))
    assert not b.available and b.color == "150,150,150" and "Ressenti indisponible" in b.summary


@pytest.mark.parametrize(("wind", "gust", "exists"), [(29, 39, False), (30, 39, True), (0, 40, True)])
def test_wind_boundaries(wind: float, gust: float, exists: bool) -> None:
    assert ("wind" in keys(brief(weather(wind=wind, gust=gust)))) is exists


def test_combines_strong_wind_forecast_rain_pollution_and_pollen() -> None:
    b = brief(weather(wind=45, gust=75), hours({"hours": 2, "precipitation": 6}),
              {"pollen_source": "atmo", "atmo_air_entity": "sensor.air", "atmo_grass_entity": "sensor.grass"},
              {"sensor.air": State("4"), "sensor.grass": State("5")})
    assert b.label == "Attention renforcée"
    for word in ("rafales à 75", "Fortes pluies", "Air extérieur", "Pollens"):
        assert word in b.summary


def test_filters_past_rain_and_uses_times_not_positions() -> None:
    b = brief(points=hours({"hours": -1, "precipitation": 80}, {"hours": 4, "precipitation": 6}, {"hours": 8, "precipitation": 100}))
    assert "environ 4 h" in b.summary and "6 mm" in b.summary and "186" not in b.summary


def test_does_not_invent_zero_rain_when_quantities_are_missing() -> None:
    b = brief(points=hours({"hours": 1}, {"hours": 2, "precipitation": 5}))
    assert "le total peut être plus élevé" in " ".join(b.caveats)


def test_sums_the_rain_of_the_six_hour_window() -> None:
    b = brief(points=hours(*({"hours": i + 1, "precipitation": 4} for i in range(6))))
    assert next(s for s in b.signals if s.key == "rain-future").severity == 2 and "24 mm" in b.summary


def test_storms_and_frost_without_claiming_local_detection() -> None:
    b = brief(points=hours({"hours": 2, "condition": "lightning-rainy", "temperature": -1}))
    assert "storm" in keys(b) and "frost-night" in keys(b) and "freeze-future" not in keys(b)
    assert "fournisseur météo" in next(s for s in b.signals if s.key == "storm").explanation


def test_dates_each_forecast_point_for_the_banner_timeline() -> None:
    # NOW is 12 h in Paris: rain in 2 h falls at 14 h, the storm in 4 h at 16 h.
    b = brief(points=hours({"hours": 2, "precipitation": 3, "condition": "rainy"}, {"hours": 4, "condition": "lightning-rainy"}))
    rain, storm = (next(s for s in b.signals if s.key == k) for k in ("rain-future", "storm"))
    assert (rain.at, rain.clock) == ((NOW + timedelta(hours=2)).timestamp(), "14 h")
    assert (storm.at, storm.clock) == ((NOW + timedelta(hours=4)).timestamp(), "16 h")
    # On the timeline the label gives the time: the sentence leaves it out.
    assert (rain.short, storm.short) == ("Pluie : au moins 3 mm prévus", "Orage ou grêle")
    assert all(s.at is None for s in b.signals if s.group == "now")


def test_writes_noon_midnight_and_days_beyond_tomorrow() -> None:
    from engine.brief import clock
    assert [clock(NOW + timedelta(hours=h), NOW, ZONE) for h in (0, 12, 30, 60)] == ["midi", "minuit", "demain", "mercredi"]


def test_ignores_undated_or_out_of_window_points() -> None:
    assert brief(points=hours({"hours": None, "precipitation": 50}, {"hours": 7, "condition": "hail"})).signals == ()


def test_uses_the_worst_pollutant_not_an_average() -> None:
    b = brief(options={"atmo_air_entity": "sensor.air", "atmo_pm25_entity": "sensor.pm"}, states={"sensor.air": State("1"), "sensor.pm": State("5")})
    assert "PM2.5" in next(s for s in b.signals if s.key == "air-false").text and b.label == "Attention renforcée"


def test_does_not_use_atmo_zero_concentrations_or_stale_levels() -> None:
    b = brief(options={"atmo_air_entity": "sensor.air", "atmo_pm25_entity": "sensor.pm", "atmo_grass_entity": "sensor.grass"},
              states={"sensor.air": State("0"), "sensor.pm": State("5", {"Date de mise à jour": "2026-09-01"}),
                      "sensor.grass": State("5", {"unit_of_measurement": "µg/m³"})})
    assert b.signals == () and "données trop anciennes" in " ".join(b.caveats)


def test_atmo_code_7_is_an_event_not_the_highest_severity() -> None:
    b = brief(options={"atmo_air_entity": "sensor.air"}, states={"sensor.air": State("7")})
    assert b.label == "À surveiller" and "Événement" in b.summary


def test_ignores_a_few_drops() -> None:
    # met.no at Gardanne, 08/10/2026: 0.3 mm at 21 h only.
    assert "rain-future" not in keys(brief(points=hours({"hours": 5, "precipitation": 0.3, "condition": "rainy"})))
    b = brief(points=hours({"hours": 2, "precipitation": 0.6}, {"hours": 3, "precipitation": 0.6}))
    assert next(s for s in b.signals if s.key == "rain-future").text == "Pluie dans environ 2 h : 1,2 mm prévus"


def test_distinguishes_tomorrow_from_today() -> None:
    def text(key: str) -> str:
        return next(s for s in brief(options={key: "sensor.air"}, states={"sensor.air": State("5")}).signals if s.group == "environment").text
    assert text("atmo_air_tomorrow_entity") == "Air extérieur : très mauvais demain"
    assert text("atmo_air_entity") == "Air extérieur : très mauvais aujourd’hui"


def test_respects_pollen_source_without_duplicate_legacy_pollen() -> None:
    options = {"pollen_source": "none", "atmo_grass_entity": "sensor.grass", "pollens": [{"id": "sensor.old", "nom": "Armoise"}]}
    states = {"sensor.grass": State("6"), "sensor.old": State("high")}
    assert brief(options=options, states=states).signals == ()
    assert not any(k.startswith("legacy") for k in keys(brief(options={**options, "pollen_source": None}, states=states)))
    assert "Armoise" in brief(options={**options, "pollen_source": "legacy"}, states=states).signals[0].text


@pytest.mark.parametrize("color", ["orange", "rouge", "yellow"])
def test_recognises_official_vigilance_without_masking_other_issues(color: str) -> None:
    b = brief(weather(gust=80), options={"vigilance_entity": "sensor.vig"}, states={"sensor.vig": State(color, {"attribution": "Météo-France", "Orages": color})})
    assert "official" in keys(b) and "rafales" in b.summary
    if color == "rouge":
        assert b.label == "Vigilance rouge officielle"


def test_writes_the_vigilance_level_then_phenomena() -> None:
    # Gardanne, 08/10/2026: yellow strong wind, then orange storms with yellow wind.
    def text(state: str, attributes: dict[str, str]) -> str | None:
        b = brief(options={"vigilance_entity": "sensor.vig"}, states={"sensor.vig": State(state, {"attribution": "Météo-France", **attributes})})
        return next((s.text for s in b.signals if s.key == "official"), None)
    assert text("Jaune", {"Vent violent": "Jaune"}) == "Vigilance jaune · vent violent"
    assert text("Orange", {"Vent violent": "Jaune", "Orages": "Orange"}) == "Vigilance orange · orages, vent violent (jaune)"
    assert text("Jaune", {}) == "Vigilance jaune"
    b = brief(options={"vigilance_entity": "sensor.vig"}, states={"sensor.vig": State("Jaune", {"attribution": "Météo-France", "Vent violent": "Jaune"})})
    assert b.title == "Vigilance jaune · vent violent"


def test_green_vigilance_does_not_lower_pollution() -> None:
    b = brief(options={"vigilance_entity": "sensor.vig", "atmo_air_entity": "sensor.air"},
              states={"sensor.vig": State("Vert", {"attribution": "Météo-France"}), "sensor.air": State("6")})
    assert b.label == "Attention renforcée"


def test_arbitrary_red_values_are_not_official() -> None:
    assert brief(options={"vigilance_entity": "sensor.vig"}, states={"sensor.vig": State("red")}).signals == ()


def test_an_old_vigilance_is_not_current() -> None:
    b = brief(options={"vigilance_entity": "sensor.vig"},
              states={"sensor.vig": State("Rouge", {"attribution": "Météo-France"}, datetime(2026, 9, 1, tzinfo=timezone.utc))})
    assert b.signals == () and "ancienne" in " ".join(b.caveats)


def test_never_red_from_calculated_values() -> None:
    assert brief(weather(feels=45, wind=120, gust=180, rain=80)).label == "Attention renforcée"


def test_wind_and_rain_together() -> None:
    s = next(s for s in brief(weather(wind=35, rain=1)).signals if s.key == "wind-rain")
    assert (s.severity, s.group) == (2, "now")


def test_pollution_orange_headlines_over_yellow_vigilance() -> None:
    b = brief(options={"vigilance_entity": "sensor.vig", "atmo_air_entity": "sensor.air"},
              states={"sensor.vig": State("Jaune", {"attribution": "Météo-France"}), "sensor.air": State("5")})
    assert "Air extérieur" in b.title and "Vigilance jaune" in b.summary


def test_normalises_underscore_conditions() -> None:
    assert "storm" in keys(brief(points=hours({"hours": 1, "condition": "lightning_rainy"})))


def test_heavy_rain_tomorrow_from_the_daily_forecast() -> None:
    b = brief(days=[Day(time=NOW + timedelta(days=1), condition="pouring", precipitation=72)])
    assert next(s for s in b.signals if s.key == "rain-tomorrow").text == "Forte pluie demain : 72 mm"


@pytest.mark.parametrize(("wind", "gust", "exists"), [(29, 39, False), (30, None, True), (10, 40, True)])
def test_strong_wind_forecast_boundaries(wind: float, gust: float | None, exists: bool) -> None:
    assert ("wind-future" in keys(brief(points=hours({"hours": 3, "wind": wind, "gust": gust})))) is exists


def test_strong_wind_forecast_is_dated_and_says_its_gusts() -> None:
    # NOW is 12 h in Paris: the first strong hour, in 2 h, is 14 h.
    b = brief(points=hours({"hours": 1, "wind": 10, "gust": 20}, {"hours": 2, "wind": 35, "gust": 50}, {"hours": 4, "wind": 40, "gust": 65}))
    s = next(s for s in b.signals if s.key == "wind-future")
    assert (s.text, s.short, s.clock, s.severity) == ("Vent très fort dans environ 2 h : rafales à 65 km/h", "Vent très fort : rafales à 65 km/h", "14 h", 2)


def test_strong_wind_forecast_is_left_out_while_it_already_blows_or_beyond_six_hours() -> None:
    assert "wind-future" not in keys(brief(weather(wind=45), hours({"hours": 2, "wind": 45})))
    assert "wind-future" not in keys(brief(points=hours({"hours": 8, "wind": 45}, {"hours": -1, "wind": 45})))


def test_pressure_forecast_only_from_a_change_of_4_hpa() -> None:
    assert "pressure-future" not in keys(brief(points=hours({"hours": 0, "pressure": 1015}, {"hours": 6, "pressure": 1011.5})))
    # Météo-France gives no pressure: nothing is said.
    assert "pressure-future" not in keys(brief(points=hours({"hours": 0}, {"hours": 6})))
    b = brief(points=hours({"hours": 0, "pressure": 1015}, {"hours": 3, "pressure": 1012}, {"hours": 6, "pressure": 1008}))
    s = next(s for s in b.signals if s.key == "pressure-future")
    assert (s.text, s.short, s.severity, s.clock) == ("La pression va baisser : −7 hPa en 6 h", "Pression : −7 hPa prévus", 1, "18 h")
    rise = next(s for s in brief(points=hours({"hours": 1, "pressure": 1000}, {"hours": 5, "pressure": 1005})).signals if s.key == "pressure-future")
    assert (rise.text, rise.severity) == ("La pression va monter : +5 hPa en 4 h", 0)
