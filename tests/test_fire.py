"""PyroVeille's nearby fires: the « Incendie proche » sensor (Alertes), the brief when a fire burns in the radius, the smoke when the wind
blows from the fire's side, and finding PyroVeille's sensor."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from engine import fire
from engine.compute import compute
from engine.detection import detect_sources, fire_candidates
from engine.families import family_of, needs
from engine.forecast import Hour
from engine.settings import Settings

PARIS = ZoneInfo("Europe/Paris")
NOW = datetime(2026, 8, 12, 15, 0, tzinfo=PARIS)
HOME = (43.61, 3.88)
# South-west of the home, 4.6 km away; north-east, 25 km away.
SOUTH_WEST = {"id": "1", "title": "Incendie Gignac", "commune": "Gignac", "department": "34", "url": "https://feuxdeforet.fr/1",
              "active": True, "status": "active", "latitude": 43.58, "longitude": 3.84, "distance_km": 4.62}
NORTH_EAST = {"id": "2", "title": "Feu signalé", "commune": "Lunel", "department": "34", "active": True, "status": "reported",
              "latitude": 43.77, "longitude": 4.08, "distance_km": 25.3}
OUT = {"id": "3", "title": "Incendie", "commune": "Lattes", "department": "34", "active": False, "status": "inactive",
       "latitude": 43.57, "longitude": 3.90, "distance_km": 4.4}


@dataclass
class State:
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)
    entity_id: str = ""


def run(alerts: list[dict[str, Any]] | None, wind_from: float | None = None, state: str | None = None):
    weather = {"temperature": 31, "temperature_unit": "°C", "attribution": "Météo-France", "wind_speed": 20 if wind_from is not None else 0,
               "wind_speed_unit": "km/h"}
    if wind_from is not None:
        weather["wind_bearing"] = wind_from
    states = {"weather.home": State("sunny", weather), "sun.sun": State("above_horizon", {"elevation": 40})}
    if alerts is not None:
        states["binary_sensor.alerte_incendie_proche"] = State(state or ("on" if alerts else "off"),
                                                               {"count": len(alerts), "radius_km": 30, "alerts": alerts})
    settings = Settings.from_options({"weather_entity": "weather.home", "fire_entity": "binary_sensor.alerte_incendie_proche"})
    hours = [Hour(time=NOW + timedelta(hours=i), temperature=31, precipitation=0, condition="sunny", wind_speed=20, wind_gust=30) for i in range(8)]
    return compute(states.get, settings, hours, [], {}, {}, [], None, NOW, PARIS, latitude=HOME[0], longitude=HOME[1])


def test_an_active_fire_close_by_needs_attention():
    result = run([NORTH_EAST, SOUTH_WEST])
    item = result.catalogue["incendie_proche"]
    assert item.value == "actif" and item.source == "pyroveille" and item.level == 2
    assert item.reason == "Feu actif à 4,6 km au sud-ouest (Gignac 34) · 1 autre feu dans le secteur"
    assert item.extra["distance_km"] == 4.6 and item.extra["direction"] == "au sud-ouest" and item.extra["feux_actifs"] == 2
    assert item.extra["lien"] == "https://feuxdeforet.fr/1" and item.extra["rayon_km"] == 30
    signal = next(s for s in result.brief.signals if s.key == "fire")
    assert signal.severity == 2 and signal.group == "now" and signal.entity == "binary_sensor.alerte_incendie_proche"
    assert "pas une vigilance officielle" in signal.explanation


def test_a_fire_reported_far_away_is_to_watch():
    result = run([NORTH_EAST])
    assert result.catalogue["incendie_proche"].value == "signale"
    assert next(s for s in result.brief.signals if s.key == "fire").severity == 1


def test_the_smoke_comes_when_the_wind_blows_from_the_fire():
    far_active = {**NORTH_EAST, "status": "active"}
    downwind = run([far_active], wind_from=45)
    assert downwind.catalogue["incendie_proche"].extra["fumee_vers_maison"] is True
    assert downwind.catalogue["incendie_proche"].reason.endswith(", fumée possible vers la maison")
    # Smoke on its way makes a far active fire serious.
    assert next(s for s in downwind.brief.signals if s.key == "fire").severity == 2
    upwind = run([far_active], wind_from=225)
    assert upwind.catalogue["incendie_proche"].extra["fumee_vers_maison"] is False
    assert next(s for s in upwind.brief.signals if s.key == "fire").severity == 1


def test_an_extinguished_fire_and_no_fire_stay_quiet():
    out = run([OUT])
    assert out.catalogue["incendie_proche"].value == "eteint" and out.catalogue["incendie_proche"].level == 0
    assert not any(s.key == "fire" for s in out.brief.signals)
    none = run([])
    assert none.catalogue["incendie_proche"].value == "aucun"
    assert none.catalogue["incendie_proche"].reason == "Aucun feu signalé dans le secteur"


def test_a_silent_pyroveille_is_unknown_never_no_fire():
    assert run(None).catalogue["incendie_proche"].value is None
    assert run([], state="unavailable").catalogue["incendie_proche"].value is None


def test_wind_side():
    assert fire.downwind(200, 225) and fire.downwind(350, 10) and not fire.downwind(45, 225) and not fire.downwind(None, 225)


def test_without_a_wind_vane_the_weather_service_gives_the_wind():
    assert fire.wind_from(180, {"wind_speed": 20, "wind_bearing": 90}, []) == 180
    assert fire.wind_from(None, {"wind_speed": 5, "wind_speed_unit": "m/s", "wind_bearing": 370}, []) == 10
    assert fire.wind_from(None, {"wind_speed": 2, "wind_bearing": 90}, []) is None
    assert fire.wind_from(None, {}, [Hour(time=NOW, wind_speed=12, wind_bearing=90)]) == 90
    assert fire.wind_from(None, {}, [Hour(time=NOW, wind_speed=3, wind_bearing=90)]) is None


def test_the_sensor_is_an_alert_and_needs_pyroveille():
    assert family_of("incendie_proche") == "alertes"
    assert needs(Settings(weather_entity="weather.home"))["incendie_proche"] == "l’intégration PyroVeille"
    assert "incendie_proche" not in needs(Settings(weather_entity="weather.home", fire_entity="binary_sensor.alerte_incendie_proche"))


# ── Finding PyroVeille ──────────────────────────────────────────────────────

STATES = [State("on", entity_id="binary_sensor.alerte_incendie_proche"), State("2", entity_id="sensor.incendies_proches"),
          State("4.6", entity_id="sensor.distance_incendie_le_plus_proche")]
REGISTRY = {
    "binary_sensor.alerte_incendie_proche": {"platform": "pyroveille", "unique_id": "e1_nearby_fire"},
    "sensor.incendies_proches": {"platform": "pyroveille", "unique_id": "e1_nearby_fire_count"},
    "sensor.distance_incendie_le_plus_proche": {"platform": "pyroveille", "unique_id": "e1_nearest_fire_distance"},
}


def test_only_the_alert_is_a_candidate_and_is_proposed():
    assert fire_candidates(STATES, REGISTRY) == ["binary_sensor.alerte_incendie_proche"]
    assert detect_sources(STATES, REGISTRY, {})["fire_entity"] == "binary_sensor.alerte_incendie_proche"
    # A deliberate opt-out stays.
    assert "fire_entity" not in detect_sources(STATES, REGISTRY, {"fire_entity": ""})


def test_the_fire_card_gets_every_fire_placed_around_the_home():
    """Issue #23: the card's radar, nearest first, with the wind and the smoke."""
    view = run([NORTH_EAST, OUT, SOUTH_WEST], wind_from=225).view
    assert view.fire is not None and view.fire.entity == "binary_sensor.alerte_incendie_proche" and view.fire.source == "PyroVeille"
    assert view.fire.level == 2 and view.fire.state == fire.ACTIVE and view.fire.smoke and view.fire.wind_from == 225 and view.fire.radius == 30
    assert [(f.place, f.status) for f in view.fire.fires] == [("Lattes 34", fire.INACTIVE), ("Gignac 34", fire.ACTIVE), ("Lunel 34", fire.REPORTED)]
    gignac = view.fire.fires[1]
    assert gignac.distance == 4.6 and 200 < gignac.azimuth < 250 and gignac.url == "https://feuxdeforet.fr/1"
    assert view.fire.headline.startswith("Feu actif à 4,6 km au sud-ouest (Gignac 34)")


def test_no_fire_card_without_pyroveille():
    assert run(None).view.fire is None
    assert run([]).view.fire.fires == () and run([]).view.fire.headline == "Aucun feu signalé dans le secteur"
