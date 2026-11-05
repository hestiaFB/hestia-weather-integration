"""The technical state shown on the « Météo » tab: orange only for what stops working, tips for what could be better."""
from engine.health import Facts, Sensor, ago, report

ENTITIES = (("feels_like", "Ressenti", "Maintenant", True, True), ("vigilance", "Vigilance officielle", "Alertes", True, False),
            ("pluie_7j", "Pluie des 7 derniers jours", "Jardin", False, False))


def place(**changes):
    base = dict(title="Gardanne", weather="Gardanne", forecast_age=12, vigilance="Gardanne 13 Weather alert", station="GW2000A",
                sensors=[Sensor("Température extérieure", "GW2000A Outdoor Temperature", "ok", 1)], air="Atmo France · Gardanne",
                pollen="Atmo France · Gardanne", entities=ENTITIES[:1] + ENTITIES[2:], integration="2.3.0b1",
                links=["Hestia Confort"], season="Saison", atmo_installed=True)
    return Facts(**{**base, **changes})


def test_everything_answering_is_blue_and_says_so():
    r = report(place())
    assert r["level"] == "ok" and r["summary"] == "Tout est suivi" and r["todo"] == []
    assert [s["level"] for s in r["sources"]] == ["ok"] * 6
    assert r["sources"][0]["text"] == "Gardanne · reçues il y a 12 min"
    assert r["sources"][2]["text"] == "GW2000A · 1 capteur, tous répondent"
    assert r["versions"][1] == {"level": "ok", "text": "Carte 2.3.0b1", "why": "fournie par l’intégration"}


def test_silent_sensors_are_to_fix_with_since_when():
    r = report(place(sensors=[Sensor("Température extérieure", "T", "ok", 1), Sensor("Rafales", "G", "silent", 180),
                              Sensor("Direction du vent", "D", "silent", 175)]))
    assert r["level"] == "action" and r["summary"] == "1 point à régler"
    assert r["todo"][0]["text"] == "2 capteurs de la station ne répondent pas"
    assert r["todo"][0]["why"] == "Rafales, Direction du vent · depuis 3 h." and r["todo"][0]["stage"] == 1
    assert [s["label"] for s in r["sensors"]][:2] == ["Rafales", "Direction du vent"]  # those that do not answer first
    assert r["sensors"][0]["text"] == "ne répond pas · 3 h"
    assert r["sources"][2] == {"key": "station", "label": "Station", "level": "bad", "text": "GW2000A · 1 capteur sur 3 répond"}


def test_a_whole_silent_station_is_one_line():
    r = report(place(sensors=[Sensor("A", "a", "silent", 30), Sensor("B", "b", "missing")]))
    assert [t["text"] for t in r["todo"]] == ["La station ne répond pas"]


def test_an_enabled_entity_without_its_source_is_to_fix_at_the_right_step():
    r = report(place(vigilance="", entities=ENTITIES, needs={"vigilance": "la vigilance officielle"}))
    assert r["todo"][0] == {"level": "bad", "text": "Vigilance officielle : active sans source",
                            "why": "Il faut la vigilance officielle : elle reste vide.", "stage": 0}
    assert r["sources"][1]["level"] == "bad"
    assert not any("vigilance" in t["text"].lower() for t in r["tips"])  # already said once


def test_without_a_station_a_station_is_the_first_tip_not_an_error():
    r = report(place(station="", sensors=[]))
    assert r["level"] == "ok" and r["tips"][0]["text"] == "Ajouter une station météo"
    assert r["sources"][2] == {"key": "station", "label": "Station", "level": "none", "text": "pas de station"}


def test_removing_a_station_does_not_turn_its_enabled_enrichments_into_errors():
    from engine.families import STATION_DEPENDENT, needs
    from engine.settings import Settings
    entities = tuple((key, key, "Maintenant", True, False) for key in STATION_DEPENDENT)
    r = report(place(station="", sensors=[], entities=entities, needs=needs(Settings(weather_entity="weather.home"))))
    assert r["level"] == "ok" and r["todo"] == []
    assert r["tips"][0]["text"] == "Ajouter une station météo"
    assert "Facultative" in r["tips"][0]["why"]
    assert all(e["level"] != "bad" for e in r["entities"])


def test_a_partial_station_does_not_require_every_optional_sensor():
    entities = (("uv_fort", "UV forts", "Alertes", True, False),)
    r = report(place(entities=entities, needs={"uv_fort": "un capteur UV"}))
    assert r["level"] == "ok" and r["todo"] == []
    assert r["tips"][0]["text"] == "Compléter : UV forts"


def test_tips_name_what_home_assistant_already_has():
    r = report(place(unused=[("pressure_entity", "Pression", "GW2000A Relative Pressure")], vigilance="", vigilance_found="Gardanne 13 Weather alert",
                     air="", atmo_installed=False, pollen="", pollen_available=True, ready_families=["Jardin"], history=False))
    texts = [t["text"] for t in r["tips"]]
    assert texts == ["Ajouter : pression", "Calculer depuis l’historique", "Choisir la vigilance officielle", "Ajouter la qualité de l’air",
                     "Suivre les pollens", "Entités Hestia Weather à activer : Jardin"]
    assert "« GW2000A Relative Pressure »" in r["tips"][0]["why"] and r["tips_summary"] == "6 réglages à améliorer"
    assert all(t["level"] == "tip" for t in r["tips"])


def test_forecast_missing_old_or_service_down():
    assert report(place(forecast_age=None))["todo"][0]["text"] == "Prévisions pas encore reçues"
    assert report(place(forecast_age=None, restarting=True))["todo"] == []
    assert report(place(forecast_age=200))["todo"][0]["text"] == "Prévisions anciennes"
    assert report(place(weather_ok=False))["todo"][0]["text"] == "Le service météo ne répond pas"


def test_entities_versions_and_links():
    r = report(place(entities=ENTITIES, links=[]))
    assert [e["text"] for e in r["entities"]] == ["2 actives sur 3", "1 active sans valeur", "1 désactivée"]
    assert r["entities"][2]["why"] == "Jardin"
    assert r["versions"][1] == {"level": "ok", "text": "Carte 2.3.0b1", "why": "fournie par l’intégration"}
    assert r["versions"][-1]["text"] == "Aucune brique Hestia-FB reliée"
    twice = report(place(card_twice=True))
    assert twice["level"] == "action" and twice["versions"][1]["level"] == "bad"
    assert [t["text"] for t in twice["todo"]] == ["Carte installée deux fois"]


def test_ages_read_naturally():
    assert [ago(0.5), ago(12), ago(180), ago(3 * 1440)] == ["à l’instant", "il y a 12 min", "il y a 3 h", "il y a 3 j"]


def test_a_silent_air_or_pollen_source_is_to_fix_once_per_provider():
    r = report(place(air_ok=False, pollen_ok=False))
    assert r["level"] == "action" and [t["text"] for t in r["todo"]] == ["Atmo France ne répond pas : qualité de l’air et pollens"]
    assert r["todo"][0]["stage"] == 2
    r = report(place(pollen="Polleninformation · 3 espèces", pollen_ok=False))
    assert [t["text"] for t in r["todo"]] == ["Polleninformation ne répond pas : pollens"]
    assert report(place(air_ok=False, restarting=True))["todo"] == []  # Home Assistant starting: sources come back by themselves


def test_vigieau_and_blitzortung_show_once_chosen():
    assert not any(s["label"] in ("Restrictions d’eau", "Éclairs") for s in report(place())["sources"])
    sources = {s["label"]: s for s in report(place(water="Gardanne Alert level", lightning="Blitzortung distance", lightning_ok=False))["sources"]}
    assert sources["Restrictions d’eau"]["level"] == "ok" and sources["Éclairs"] == {"key": "lightning", "label": "Éclairs", "level": "bad",
                                                                                      "text": "Blitzortung distance · ne répond pas"}


def test_technical_overview_counts_only_selected_station_sensors_and_active_entities():
    r = report(place(sensors=[Sensor('Température', 'T', 'ok', 0), Sensor('Rafales', 'G', 'silent', 20)],
                     entities=(('a', 'A', 'Maintenant', True, True), ('b', 'B', 'Jardin', True, False),
                               ('c', 'C', 'Énergie', False, True)), forecast_hours=24, forecast_days=6,
                     computation_age=0.2, history_sources=2))
    assert r['technical']['station'] == {'name': 'GW2000A', 'responding': 1, 'configured': 2, 'history': True, 'history_sources': 2}
    assert r['technical']['entities'] == {'active': 2, 'with_value': 1, 'total': 3}
    assert r['technical']['forecast'] == {'hours': 24, 'days': 6, 'received': 'il y a 12 min'}
    assert r['technical']['computation'] == 'à l’instant'
    assert r['technical']['links'] == ['Hestia Confort']


def test_technical_overview_keeps_absent_forecasts_and_history_unknown():
    r = report(Facts(title='Chalet', restarting=True, forecast_age=None))
    assert r['technical']['forecast'] == {'hours': None, 'days': None, 'received': None}
    assert r['technical']['computation'] is None
    assert r['technical']['station']['history_sources'] is None
    assert r['technical']['station']['configured'] == 0
    assert r['technical']['entities'] == {'active': 0, 'with_value': 0, 'total': 0}
