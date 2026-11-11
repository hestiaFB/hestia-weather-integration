"""The Python engine against the 96 weather situations computed independently by the original Jinja template.

The fixtures keep the original attribute names (t_ext, ressenti…): this file is the only place that still knows them.
"""
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from engine.feel import Alert, Level
from engine.forecast import Hour
from engine.local import LocalWeather, build_local, rain_narrative
from engine.settings import Settings
from engine.trends import Change, trend
from engine.units import Kind, measurement

FIXTURES = json.loads((Path(__file__).parent / "fixtures" / "model-fixtures.json").read_text())
# Original attribute → setting naming the sensor that gave it.
LEGACY_SOURCES = {"t_ext": "temperature_entity", "hr_ext": "humidity_entity", "vent": "wind_speed_entity", "rafales": "wind_gust_entity",
                  "vent_dir": "wind_bearing_entity", "pluie_taux": "rain_rate_entity", "pluie_jour": "daily_rain_entity",
                  "pluie_24h": "rain_24h_entity", "pluie_semaine": "weekly_rain_entity", "pluie_mois": "monthly_rain_entity",
                  "pluie_an": "yearly_rain_entity", "pluie_evenement": "event_rain_entity", "pression": "pressure_entity",
                  "solaire": "solar_radiation_entity", "rosee": "dew_point_entity", "uv": "uv_index_entity", "lux": "illuminance_entity",
                  "rafale_max_jour": "max_daily_gust_entity", "tend_temp": "temperature_trend_entity", "elevation": "sun_elevation_entity"}
ALERTS = {Alert.THUNDERSTORM: "orage", Alert.DOWNPOUR: "averse", Alert.GUSTS: "rafales", Alert.HEATWAVE: "canicule",
          Alert.FROST: "gel", Alert.HEAT: "chaleur", Alert.COLD: "froid", Alert.UV: "uv"}


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)


def legacy(w: LocalWeather) -> dict[str, Any]:
    """The typed result written with the original attribute names, to compare with the template."""
    def missing(value: Any) -> Any:
        return -999 if value is None else value
    return {
        "ressenti": missing(w.feel.value), "base": "humidex" if w.feel.base == "heat_index" else "thermometre",
        "effet_vent": w.feel.effects.wind, "effet_soleil": w.feel.effects.sun, "effet_pluie": w.feel.effects.rain, "effet_nuit": w.feel.effects.night,
        "ecart_thermometre": missing(w.feel.gap), "condition": w.condition, "cond_source": "station" if w.observed else "prevision",
        "titre": w.title, "niveau": "optimise" if w.level is Level.OPTIMIZED else str(w.level), "alerte": ALERTS.get(w.alert, ""),
        "sous_titre": w.subtitle, "phrase_ressenti": w.feel.phrase, "vent_deg": -1 if w.wind.bearing is None else w.wind.bearing,
        "vent_rose": w.wind.rose, "vent_secteur": w.wind.sector, "vent_nom": w.wind.from_name,
        "beaufort": -1 if w.wind.beaufort is None else w.wind.beaufort, "beaufort_tx": w.wind.beaufort_text,
        "pluie_dans": w.rain.next_hours if w.rain.next_hours is not None else (-1 if w.forecast_available else -2),
        "pluie_mm": w.rain.next_amount or 0, "pluie_recit": w.rain.narrative, "uv_tx": w.uv_text,
    }


def plain_feel(old: str) -> str:
    """The feel sentence was rewritten in plain French; the cause the engine picks must still match the template's."""
    old = old.replace("le ressenti colle au thermomètre", "Ressenti égal au thermomètre")
    old = old.replace("humidité indisponible — elle n’est pas comptée", "Humidité inconnue : non prise en compte")
    for pattern, cause in ((r" — le vent en emporte [\d,]+ °C$", ", à cause du vent"), (r" — l’averse en emporte [\d,]+ °C$", ", à cause de la pluie"),
                           (r" — le ciel dégagé en emporte [\d,]+ °C$", ", à cause du ciel dégagé"), (r" — le soleil y est pour [\d,]+ °C$", ", à cause du soleil")):
        old = re.sub(pattern, cause, old)
    return old.replace(" — même le vent réchauffe, il n’apporte plus rien", ", à cause du vent chaud").replace(" — c’est l’humidité qui pèse", ", à cause de l’humidité")


@pytest.mark.parametrize("index", range(len(FIXTURES)))
def test_matches_the_original_template(index: int) -> None:
    fixture = FIXTURES[index]
    states: dict[str, State] = {"weather.test": State(fixture["condition"], {"cloud_coverage": fixture["cloud"]})}
    options: dict[str, Any] = {"weather_entity": "weather.test"}
    for key, setting in LEGACY_SOURCES.items():
        options[setting] = f"sensor.{key}"
        value = fixture["values"].get(key)
        states[f"sensor.{key}"] = State("unknown" if value is None else str(value))
    hours = [Hour(temperature=p["t"], precipitation=p["p"], condition=p["c"]) for p in fixture["hours"]]
    # The original template started the feel from Thermal Comfort's humidex; the engine now starts from the heat index.
    # The fixture's humidex is handed over as that base, so the rest of the calculation is still compared to the template.
    weather = build_local(states.get, Settings.from_options(options), hours, {}, datetime(2026, 10, 4, 10, tzinfo=timezone.utc),
                          ZoneInfo("UTC"), heat_index_given=fixture["values"].get("humidex"))
    result, expected = legacy(weather), fixture["expected"]
    for key, value in result.items():
        if key == "phrase_ressenti":
            # Deliberate change: without Thermal Comfort the template said « humidex indisponible »; the engine now knows the humidity.
            humidex = fixture["values"].get("humidex")
            if humidex is None or humidex <= -900:
                continue
            assert value == plain_feel(str(expected[key])), f"case {index}: {key}"
        else:
            assert value == expected[key], f"case {index}: {key}"


def test_converts_non_metric_stations_to_engine_units() -> None:
    assert measurement(68, "°F", Kind.TEMPERATURE) == 20
    assert measurement(5, "m/s", Kind.WIND) == 18
    assert measurement(1, "in", Kind.RAIN) == 25.4
    assert measurement(100100, "Pa", Kind.PRESSURE) == 1001
    assert measurement("unavailable") is None


def test_does_not_invent_a_barometer_trend_before_20_minutes() -> None:
    assert trend([Change(1000, "1000")], 1005, 1500, Kind.PRESSURE).change is None
    t = trend([Change(1000, "1000")], 1005, 11800, Kind.PRESSURE)
    assert (t.change, t.minutes, t.text) == (5, 180, "amélioration")


def test_keeps_the_pressure_reference_at_the_three_hour_boundary() -> None:
    history = [Change(1000, "1000"), Change(2000, "1000.2")]
    for now in (11800, 11801, 11860):
        t = trend(history, 1001.1, now, Kind.PRESSURE)
        assert (t.change, t.minutes, str(t.direction)) == (1.1, 180, "hausse")
    t = trend(history, 1001.1, 12801, Kind.PRESSURE)
    assert (t.change, str(t.direction)) == (0.9, "stable")


def test_does_not_bridge_an_unavailable_pressure_reference() -> None:
    assert trend([Change(500, "1000"), Change(1000, "unavailable"), Change(11800, "1001")], 1001.1, 11801, Kind.PRESSURE).change is None


def test_keeps_cumulative_counters_nested() -> None:
    assert rain_narrative(1, 1, 1) == "tout ce qui est tombé ce mois-ci est tombé aujourd’hui"


def test_measured_rain_wins_over_the_area_forecast() -> None:
    from engine.feel import Measures, verdict

    v = verdict(Measures(temperature=18, rain_rate=5), "cloudy")
    assert (v.condition, v.observed) == ("pouring", True)


def test_finds_the_first_notable_rain_and_tells_a_shower_from_a_downpour() -> None:
    from engine.feel import Alert, Measures, verdict
    from engine.forecast import Hour

    v = verdict(Measures(), "partlycloudy", [Hour(precipitation=0), Hour(precipitation=0.4)])
    assert (v.next_rain_hours, v.next_rain_amount) == (1, 0.4)
    assert verdict(Measures(rain_rate=1), "cloudy").alert is None
    assert verdict(Measures(rain_rate=12), "cloudy").alert is Alert.DOWNPOUR


def test_reads_numbers_without_turning_invalid_values_into_zero() -> None:
    from engine.units import finite

    assert finite("12.4") == 12.4
    assert finite("unknown") is None and finite(None) is None and finite("") is None
