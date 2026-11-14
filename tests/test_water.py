"""Vigieau's drought restrictions: the « Restrictions d'eau » sensor (Jardin), the brief from « Alerte » on, and finding the right zone."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from engine import water
from engine.compute import compute
from engine.detection import detect_sources, tap_water, water_candidates
from engine.families import family_of, needs
from engine.forecast import Hour
from engine.settings import Settings

PARIS = ZoneInfo("Europe/Paris")
NOW = datetime(2026, 8, 12, 10, 0, tzinfo=PARIS)
USES = ("Arrosage des pelouses, massifs fleuris et espaces verts, Remplissage et vidange de piscines privées, "
        "Lavage de véhicules par des particuliers")


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)
    entity_id: str = ""


def run(level: str | None, uses: str = USES):
    states = {"weather.home": State("sunny", {"temperature": 30, "temperature_unit": "°C", "attribution": "Météo-France"}),
              "sun.sun": State("above_horizon", {"elevation": 40})}
    if level is not None:
        states["sensor.vigieau_gardanne"] = State(level, {"current_restrictions": uses, "source": "https://example.org/arrete.pdf"})
    settings = Settings.from_options({"weather_entity": "weather.home", "water_restriction_entity": "sensor.vigieau_gardanne"})
    hours = [Hour(time=NOW + timedelta(hours=i), temperature=30, precipitation=0, condition="sunny", wind_speed=5, wind_gust=10) for i in range(8)]
    return compute(states.get, settings, hours, [], {}, {}, [], None, NOW, PARIS)


def test_levels_as_vigieau_writes_them():
    assert [water.level_of(s) for s in ("Pas de restriction", "Vigilance", "Alerte", "Alerte renforcée", "Crise", "3", "inconnu")] == [0, 1, 2, 3, 4, 3, None]


def test_uses_split_even_when_a_name_holds_a_comma():
    assert water.usages(USES) == ("Arrosage des pelouses, massifs fleuris et espaces verts", "Remplissage et vidange de piscines privées",
                                  "Lavage de véhicules par des particuliers")
    assert water.usages("") == ()


def test_reinforced_alert_says_how_many_uses_and_watering():
    item = run("Alerte renforcée").catalogue["restrictions_eau"]
    assert item.value == "alerte_renforcee" and item.source == "vigieau"
    assert item.reason == "Alerte renforcée · 3 usages restreints, dont l’arrosage"
    assert item.extra["niveau"] == 3 and item.extra["arrosage_restreint"] is True and item.extra["arrete"] == "https://example.org/arrete.pdf"


def test_the_brief_tells_restrictions_from_alert_on():
    signal = next(s for s in run("Alerte").brief.signals if s.key == "water")
    assert signal.text == "Restrictions d’eau : alerte, arrosage restreint" and signal.severity == 1 and signal.group == "now"
    assert next(s for s in run("Crise").brief.signals if s.key == "water").severity == 2


def test_vigilance_and_no_restriction_stay_quiet():
    for level, value in (("Vigilance", "vigilance"), ("Pas de restriction", "aucune")):
        result = run(level)
        assert result.catalogue["restrictions_eau"].value == value
        assert not any(s.key == "water" for s in result.brief.signals)
    assert run("Vigilance").catalogue["restrictions_eau"].extra["usages"] == []


def test_a_silent_vigieau_is_unknown_never_no_restriction():
    assert run(None).catalogue["restrictions_eau"].value is None
    assert run("unavailable").catalogue["restrictions_eau"].value is None


def test_the_sensor_lives_in_the_garden_and_needs_vigieau():
    assert family_of("restrictions_eau") == "jardin"
    assert needs(Settings(weather_entity="weather.home"))["restrictions_eau"] == "l’intégration Vigieau"
    assert "restrictions_eau" not in needs(Settings(weather_entity="weather.home", water_restriction_entity="sensor.vigieau"))


# ── Finding Vigieau ─────────────────────────────────────────────────────────

STATES = [State("Alerte", entity_id="sensor.alert_level_gardanne"), State("2", entity_id="sensor.alert_level_gardanne_numeric"),
          State("Interdit", entity_id="sensor.lawn_restrictions"), State("Vigilance", entity_id="sensor.alert_level_gardanne_sou")]
REGISTRY = {
    "sensor.alert_level_gardanne": {"platform": "vigieau", "unique_id": "sensor-vigieau-alert-e1", "translation_key": "alert_level", "device_id": "d1"},
    "sensor.alert_level_gardanne_numeric": {"platform": "vigieau", "unique_id": "sensor-vigieau-alert-e1-numeric",
                                            "translation_key": "alert_level_numeric", "device_id": "d1"},
    "sensor.lawn_restrictions": {"platform": "vigieau", "unique_id": "sensor-vigieau-lawn-13041", "translation_key": "lawn_restrictions",
                                 "device_id": "d1"},
    "sensor.alert_level_gardanne_sou": {"platform": "vigieau", "unique_id": "sensor-vigieau-alert-e2", "translation_key": "alert_level",
                                        "device_id": "d2"},
}
DEVICES = {"d1": {"name": "Vigieau Gardanne AEP"}, "d2": {"name": "Vigieau Gardanne SOU"}}


def test_only_the_alert_levels_are_candidates():
    assert water_candidates(STATES, REGISTRY) == ["sensor.alert_level_gardanne", "sensor.alert_level_gardanne_sou"]


def test_among_several_zones_the_drinking_water_is_proposed():
    assert tap_water(water_candidates(STATES, REGISTRY), REGISTRY, DEVICES) == "sensor.alert_level_gardanne"
    assert detect_sources(STATES, REGISTRY, {}, DEVICES)["water_restriction_entity"] == "sensor.alert_level_gardanne"
    # Two zones and none for drinking water: the user chooses.
    assert "water_restriction_entity" not in detect_sources(STATES, REGISTRY, {}, {"d1": {"name": "Vigieau Gardanne SUP"}, "d2": DEVICES["d2"]})


def test_the_water_card_lists_the_restricted_uses():
    """Issue #25: the level, the uses one by one, watering and the order."""
    view = run("Alerte renforcée").view
    assert view.water is not None and view.water.source == "Vigieau" and view.water.entity == "sensor.vigieau_gardanne"
    assert view.water.level == 3 and view.water.label == "Alerte renforcée" and view.water.watering
    assert view.water.usages[0] == "Arrosage des pelouses, massifs fleuris et espaces verts" and len(view.water.usages) == 3
    assert view.water.order == "https://example.org/arrete.pdf"
    quiet = run("Vigilance").view.water
    assert quiet.level == 1 and quiet.usages == () and not quiet.watering
    assert run(None).view.water is None
