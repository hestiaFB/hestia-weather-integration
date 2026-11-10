"""CrueVeille's river (beta): the « Rivière » sensor (Alertes), the brief from its warning threshold on, and finding CrueVeille's sensor."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from engine import river
from engine.compute import compute
from engine.detection import detect_sources, river_candidates
from engine.families import family_of, needs
from engine.forecast import Hour
from engine.settings import Settings

PARIS = ZoneInfo("Europe/Paris")
NOW = datetime(2026, 11, 12, 10, 0, tzinfo=PARIS)


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)
    entity_id: str = ""


def run(risk: str | None, state: str = "off", height: float = 2.1, rise: float = 8):
    states = {"weather.home": State("rainy", {"temperature": 9, "temperature_unit": "°C", "attribution": "Météo-France"}),
              "sun.sun": State("above_horizon", {"elevation": 20})}
    if risk is not None:
        states["binary_sensor.alerte_inondation"] = State(state, {
            "risk_level": risk, "alert_reason": "hauteur de vigilance atteinte", "station_code": "K4350010", "station_name": "La Loire à Orléans",
            "height_observed_at": "2026-11-12T08:50:00+00:00", "water_level_m": height, "rise_cm_h": rise, "forecast_height_m": 2.34})
    settings = Settings.from_options({"weather_entity": "weather.home", "river_entity": "binary_sensor.alerte_inondation"})
    hours = [Hour(time=NOW + timedelta(hours=i), temperature=9, precipitation=1, condition="rainy", wind_speed=10, wind_gust=20) for i in range(8)]
    return compute(states.get, settings, hours, [], {}, {}, [], None, NOW, PARIS)


def test_levels_as_crueveille_writes_them():
    assert [river.level_of(r) for r in ("clear", "watch", "warning", "critical", "Critical", "other", None)] == [0, 1, 2, 3, 3, None, None]


def test_the_sensor_gives_the_height_and_the_rise():
    item = run("warning", "on").catalogue["riviere"]
    assert item.value == "vigilance" and item.source == "crueveille" and item.level == 2
    assert item.reason == "Seuil de vigilance · La Loire à Orléans : 2,10 m, +8 cm/h"
    assert item.extra["hauteur_m"] == 2.1 and item.extra["montee_cm_h"] == 8 and item.extra["hauteur_projetee_m"] == 2.34
    assert item.extra["station"] == "La Loire à Orléans" and item.extra["raison_crueveille"] == "hauteur de vigilance atteinte"


def test_the_brief_tells_the_river_from_the_warning_threshold_on():
    signal = next(s for s in run("warning", "on").brief.signals if s.key == "river")
    assert signal.text == "Rivière au seuil de vigilance : La Loire à Orléans, 2,10 m, +8 cm/h" and signal.severity == 1
    assert "pas la vigilance crues officielle" in signal.explanation and "bêta" in signal.explanation
    critical = next(s for s in run("critical", "on").brief.signals if s.key == "river")
    assert critical.severity == 2 and critical.text.startswith("Rivière au seuil critique")


def test_a_calm_or_rising_river_stays_quiet():
    for risk, value in (("clear", "calme"), ("watch", "a_surveiller")):
        result = run(risk)
        assert result.catalogue["riviere"].value == value
        assert not any(s.key == "river" for s in result.brief.signals)
    # A river going down, or barely moving, says no rise.
    assert run("clear", rise=-3).catalogue["riviere"].reason == "Rien à signaler · La Loire à Orléans : 2,10 m, −3 cm/h"
    assert run("clear", rise=0.2).catalogue["riviere"].reason == "Rien à signaler · La Loire à Orléans : 2,10 m"


def test_a_silent_crueveille_is_unknown_never_calm():
    assert run(None).catalogue["riviere"].value is None
    assert run("warning", state="unavailable").catalogue["riviere"].value is None


def test_the_sensor_is_an_alert_and_needs_crueveille():
    assert family_of("riviere") == "alertes"
    assert needs(Settings(weather_entity="weather.home"))["riviere"] == "l’intégration CrueVeille"
    assert "riviere" not in needs(Settings(weather_entity="weather.home", river_entity="binary_sensor.alerte_inondation"))


# ── Finding CrueVeille ──────────────────────────────────────────────────────

STATES = [State("off", entity_id="binary_sensor.alerte_inondation"), State("2.1", entity_id="sensor.hauteur_d_eau"),
          State("clear", entity_id="sensor.risque_local")]
REGISTRY = {
    "binary_sensor.alerte_inondation": {"platform": "vigicrues_alert", "unique_id": "e1_flood_alert", "translation_key": "flood_alert"},
    "sensor.hauteur_d_eau": {"platform": "vigicrues_alert", "unique_id": "e1_water_level", "translation_key": "water_level"},
    "sensor.risque_local": {"platform": "vigicrues_alert", "unique_id": "e1_risk_level", "translation_key": "risk_level"},
}


def test_only_the_flood_alert_is_a_candidate_and_is_proposed():
    assert river_candidates(STATES, REGISTRY) == ["binary_sensor.alerte_inondation"]
    assert detect_sources(STATES, REGISTRY, {})["river_entity"] == "binary_sensor.alerte_inondation"
    two = [*STATES, State("off", entity_id="binary_sensor.alerte_inondation_2")]
    registry = {**REGISTRY, "binary_sensor.alerte_inondation_2": {"platform": "vigicrues_alert", "unique_id": "e2_flood_alert"}}
    assert "river_entity" not in detect_sources(two, registry, {})
