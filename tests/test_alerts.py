"""Bubbles and alerts (ported from the card's alerts tests)."""
from engine.alerts import alert_points, theme_of, ticker_points, vigilance_parts
from engine.brief import Brief, Signal


def signal(key: str, group: str, severity: int, text: str | None = None, icon: str = "mdi:weather-sunny") -> Signal:
    return Signal(key, group, severity, text or key, key, icon)


def brief(*signals: Signal) -> Brief:
    return Brief("", "", "", "", "", tuple(signals), (), True)


def sig(key: str, group: str, severity: int, text: str | None = None) -> Signal:
    return Signal(key, group, severity, text or key, key, "mdi:x")


def dated(key: str, group: str, severity: int, text: str, at: float, clock: str, short: str) -> Signal:
    return Signal(key, group, severity, text, key, "mdi:x", None, at, clock, short)


def atmo(key: str, severity: int, index: float, at: float | None = None, clock: str | None = None) -> Signal:
    return Signal(key, "environment", severity, key, key, "mdi:x", None, at, clock, None, index)


def test_scrolls_the_points_most_important_first_without_the_official_warning() -> None:
    # Yellow storm vigilance at Gardanne, storm tonight, 72 mm tomorrow, a 5 °C feel gap.
    points = ticker_points(brief(signal("official", "official", 1, "Vigilance jaune · orages"), signal("storm", "future", 2),
                                 signal("rain-future", "future", 1), signal("comfort-gap", "now", 0)))
    assert [p.text for p in points] == ["storm", "rain-future", "comfort-gap"]
    assert [p.label for p in points] == ["À venir", "À venir", "Maintenant"]
    assert [p.level for p in points] == [2, 1, 0]


def test_labels_air_and_pollens_and_keeps_at_most_four_points() -> None:
    points = ticker_points(brief(signal("air-false", "environment", 2), signal("pollen-true", "environment", 1), signal("wind", "now", 1),
                                 signal("storm", "future", 1), signal("pressure", "now", 0)))
    assert len(points) <= 4
    assert next(p for p in points if p.text == "air-false").label == "Air"
    assert ticker_points(brief(signal("pollen-true", "environment", 1)))[0].label == "Pollens"


def test_shows_a_quiet_context_and_nothing_without_a_brief() -> None:
    assert [p.text for p in ticker_points(brief(signal("comfort-gap", "now", 0)))] == ["comfort-gap"]
    assert ticker_points(None) == []


def test_puts_the_vigilance_level_above_its_phenomena() -> None:
    [a] = alert_points(brief(signal("official", "official", 2, "Vigilance orange · orages, vent violent (jaune)")))
    assert (a.level, a.label, a.text, a.official) == (2, "Vigilance orange", "Orages, vent violent (jaune)", True)


def test_without_vigilance_shows_the_point_needing_attention() -> None:
    # 8,2 mm/h measured at Gardanne, no official vigilance.
    alerts = alert_points(brief(signal("comfort-gap", "now", 0), signal("rain-now", "now", 2, "Pluie forte (8,2 mm/h)")))
    assert [(a.level, a.label, a.text, a.official) for a in alerts] == [(2, "Maintenant", "Pluie forte (8,2 mm/h)", False)]
    assert alert_points(brief(signal("comfort-gap", "now", 0))) == []


def test_shows_the_vigilance_and_the_measured_alert_together() -> None:
    alerts = alert_points(brief(signal("rain-now", "now", 2, "Forte pluie : 8,2 mm/h"), signal("official", "official", 1, "Vigilance jaune · orages")))
    assert [a.label for a in alerts] == ["Vigilance jaune", "Maintenant"] and [a.official for a in alerts] == [True, False]


def test_gives_each_point_the_colour_of_its_theme() -> None:
    assert theme_of(signal("rain-now", "now", 1)) == "rain"
    assert theme_of(signal("wind-soft", "now", 0)) == "wind"
    assert theme_of(signal("comfort-gap", "now", 0, icon="mdi:thermometer-low")) == "cold"
    assert theme_of(signal("comfort-gap", "now", 0, icon="mdi:thermometer-high")) == "heat"
    assert theme_of(signal("air-false", "environment", 1)) == "calm"


def test_vigilance_parts() -> None:
    assert vigilance_parts("Vigilance jaune · vent violent") == ("Vigilance jaune", "Vent violent")
    assert vigilance_parts("Vigilance jaune") == (None, "Vigilance jaune")
    assert vigilance_parts("Vent soutenu, rafales à 43,9 km/h") == (None, "Vent soutenu, rafales à 43,9 km/h")


def test_gives_the_vigilance_the_icon_of_its_first_phenomenon() -> None:
    from engine.alerts import phenomenon_icon
    assert [phenomenon_icon(d) for d in ("Orages, vent violent (jaune)", "Neige-verglas", "Vagues-submersion", "Inconnu")] == [
        "mdi:weather-lightning", "mdi:snowflake", "mdi:waves", "mdi:alert-outline"]


def test_puts_every_point_of_the_coming_hours_on_the_timeline_each_at_its_time() -> None:
    from engine.alerts import timeline_points
    at = lambda h: 1_800_000_000 + h * 3600
    b = brief(
        dated("rain-future", "future", 2, "Fortes pluies dans environ 2 h : 12 mm prévus", at(2), "17 h", "Fortes pluies : 12 mm prévus"),
        dated("storm", "future", 2, "Orage ou grêle dans environ 4 h", at(4), "19 h", "Orage ou grêle"),
        dated("frost-night", "future", 1, "Gelée blanche possible vers 4 h : 2 °C prévus", at(13), "4 h", "Gelée blanche possible : 2 °C prévus"),
        dated("temperature-future", "future", 0, "Baisse jusqu’à 10 °C dans les 6 h", at(6), "21 h", "Baisse jusqu’à 10 °C"),
        dated("rain-tomorrow", "future", 0, "Forte pluie demain : 24 mm", at(30), "demain", "Forte pluie : 24 mm"),
        sig("official", "official", 1), sig("pressure", "now", 0, "La pression monte"), sig("wind-soft", "now", 0, "Vent faible"),
        sig("air-false", "environment", 0, "Air extérieur : moyen aujourd’hui"))
    points = timeline_points(b)
    # The vigilance has its own pill; « vent faible » and an air index under 3 are left out; the time is on the label, not in the text.
    assert [(p.clock, p.text, p.alert) for p in points] == [
        (None, "La pression monte", False), ("17 h", "Fortes pluies : 12 mm prévus", True), ("19 h", "Orage ou grêle", False),
        ("21 h", "Baisse jusqu’à 10 °C", False), ("4 h", "Gelée blanche possible : 2 °C prévus", False), ("demain", "Forte pluie : 24 mm", False)]


def test_shows_air_and_pollens_on_the_timeline_from_3_out_of_6() -> None:
    from engine.alerts import timeline_points
    b = brief(atmo("pollen-false", 0, 3), atmo("air-false", 0, 2), atmo("pollen-true", 1, 4, 1_800_100_000, "demain"))
    assert [(p.text, p.clock) for p in timeline_points(b)] == [("pollen-false", None), ("pollen-true", "demain")]


def test_keeps_the_eight_most_important_forecast_points_in_time_order() -> None:
    from engine.alerts import timeline_points
    at = lambda h: 1_800_000_000 + h * 3600
    # Ten forecast points: the two least important (information, the latest) are left out.
    b = brief(*(dated(f"point-{h}", "future", 1 if h < 8 else 0, f"Point {h}", at(h), f"{h} h", f"Point {h}") for h in range(10)))
    assert [p.text for p in timeline_points(b)] == [f"Point {h}" for h in range(8)]
    assert [p.text for p in timeline_points(brief(*(dated(f"p{h}", "future", 0 if h < 2 else 1, f"P{h}", at(h), "x", f"P{h}") for h in range(10))))] == [
        f"P{h}" for h in range(2, 10)]


def test_each_alert_and_point_says_which_signal_it_is() -> None:
    """Issue #22: the cards leave out the kinds of alerts they are set not to show (Vigieau, pollens…)."""
    b = brief(signal("official", "official", 1, "Vigilance jaune · orages"), signal("water", "now", 2), signal("storm", "future", 1))
    assert [a.key for a in alert_points(b)] == ["official", "water"]
    assert [p.key for p in ticker_points(b)] == ["water", "storm"]
