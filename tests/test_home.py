"""What the « Hestia-FB » panel's home page says about Hestia Weather: blue when every place is followed, orange with what to do."""
from engine.home import Place, status


def test_no_place_is_an_action():
    result = status([])
    assert result["level"] == "action" and "Aucun lieu" in result["summary"]


def test_a_place_with_its_station_answering_is_blue():
    result = status([Place("Maison", station=9, links=["Hestia Confort"])])
    assert result["level"] == "ok"
    assert result["summary"] == "1 lieu suivi avec sa station, rien à régler."
    assert result["links"] == ["Relié à Hestia Confort · Maison"]
    assert result["details"] == []


def test_a_station_that_does_not_answer_is_orange():
    whole = status([Place("Maison", station=2, silent=["Température", "Rafales"])])
    assert whole["level"] == "action" and whole["details"] == ["La station ne répond pas"]
    part = status([Place("Maison", station=5, silent=["Rafales"])])
    assert part["details"] == ["Ne répond pas : Rafales"]


def test_each_thing_to_do_is_counted_and_said():
    result = status([Place("Maison", station=3, forecast=False, needs=["Vigilance : il faut la vigilance Météo-France"])])
    assert result["level"] == "action" and result["summary"] == "1 lieu suivi avec sa station, 2 points à régler."
    assert result["details"] == ["Prévisions pas encore reçues du service météo", "Vigilance : il faut la vigilance Météo-France"]


def test_several_places_name_the_one_concerned():
    result = status([Place("Maison", station=3), Place("Chalet", loaded=False)])
    assert result["summary"] == "2 lieux suivis, 1 point à régler."
    assert result["details"] == ["Calcul arrêté : Chalet"]


def test_the_card_installed_twice_is_an_action():
    assert status([Place("Maison", station=3)])["level"] == "ok"
    result = status([Place("Maison", station=3)], card_twice=True)
    assert result["level"] == "action" and result["summary"] == "1 lieu suivi avec sa station, 1 point à régler."
    assert result["details"] == ["Carte installée deux fois : retirez la carte Hestia Weather de HACS"]


def test_a_silent_air_source_is_orange():
    result = status([Place("Maison", station=3, down=["Atmo France ne répond pas : qualité de l’air et pollens"])])
    assert result["level"] == "action" and result["summary"] == "1 lieu suivi avec sa station, 1 point à régler."
    assert result["details"] == ["Atmo France ne répond pas : qualité de l’air et pollens"]
