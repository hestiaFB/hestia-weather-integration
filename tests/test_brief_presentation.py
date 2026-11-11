"""What the brief puts forward, and only what is relevant (ported from the card's brief-preview and brief-relevance tests)."""
from dataclasses import replace
from datetime import datetime, timedelta, timezone

import pytest

from engine.alerts import present, secondary
from engine.brief import Brief, Signal, build_brief
from engine.forecast import Day, Hour, parse_days
from engine.settings import Settings
from test_brief import ZONE, weather

NOW = datetime(2026, 10, 6, 8, tzinfo=timezone.utc)


def signal(key: str, group: str, severity: int, text: str | None = None, icon: str = "mdi:weather-sunny") -> Signal:
    return Signal(key, group, severity, text or key, key, icon)


def brief(*signals: Signal, title: str = "", available: bool = True) -> Brief:
    return Brief(title=title, label="", color="", icon="", summary="", signals=tuple(signals), caveats=(), available=available)


def keys(signals) -> list[str]:
    return [s.key for s in signals]


# ── Presentation ─────────────────────────────────────────────────────────────

def test_lists_the_secondary_lines_as_vigilance_then_now_then_what_is_coming() -> None:
    # 07/10/2026 at Gardanne: heavy rain headline, storm in 6 h, yellow vigilance, comfort gap.
    b = brief(signal("rain-soon", "future", 2), signal("storm-later", "future", 1), signal("vigilance", "official", 1), signal("comfort-gap", "now", 0))
    assert [s.group for s in secondary(b, present(b))] == ["official", "now", "future"]


def test_shows_a_meaningful_pressure_alongside_pollution_not_an_empty_outlook() -> None:
    def lines(*signals: Signal) -> list[str]:
        b = brief(*signals)
        return keys(secondary(b, present(b)))

    assert lines(signal("air", "environment", 2), signal("pressure", "now", 0)) == ["pressure"]
    assert lines() == []
    assert lines(signal("pressure", "now", 0)) == []
    assert lines(signal("air", "environment", 2), signal("temperature-future", "future", 0)) == []


def test_keeps_the_highest_attention_and_the_coming_event_within_three() -> None:
    b = brief(signal("official", "official", 3), signal("wind", "now", 2), signal("storm", "future", 2), signal("air", "environment", 2),
              signal("pollen", "environment", 1))
    selected = present(b).selected
    assert keys(selected) == ["official", "storm", "wind"]
    assert sum(1 for s in b.signals if s.severity > 0) - len(selected) == 2


def test_does_not_promote_information_into_attention() -> None:
    assert present(brief(signal("pressure", "now", 0), signal("indoor", "environment", 0))).selected == ()


def test_keeps_pollution_when_it_is_the_highest_attention() -> None:
    b = brief(signal("air", "environment", 2), signal("rain", "future", 1), signal("wind", "now", 1))
    assert keys(present(b).selected) == ["air", "rain", "wind"]


def test_does_not_repeat_a_single_point() -> None:
    s = signal("wind", "now", 2)
    assert present(brief(s)).selected == (s,)


@pytest.mark.parametrize("key", ["rain-now", "pressure"])
def test_uses_measured_rain_or_a_meaningful_pressure_trend_without_raising_the_level(key: str) -> None:
    p = present(brief(signal(key, "now", 0), signal("temperature-future", "future", 0)))
    assert (p.headline, p.context.key, p.outlook, p.selected) == (key, key, None, ())


def test_says_nothing_of_a_soft_wind() -> None:
    assert present(brief(signal("wind-soft", "now", 0))).headline is None


def test_uses_a_forecast_outlook_without_raising_its_level() -> None:
    b = brief(signal("wind-soft", "now", 0), signal("temperature-future", "future", 0, "Fraîcheur annoncée dans 5 h", "mdi:thermometer"))
    p = present(b)
    assert (p.headline, p.outlook.key, p.outlook.icon, p.selected) == ("Fraîcheur annoncée dans 5 h", "temperature-future", "mdi:thermometer", ())
    assert all(s.severity == 0 for s in b.signals)


def test_stays_empty_when_nothing_useful_stands_out() -> None:
    assert present(brief()).headline is None
    assert present(brief(available=False)).headline is None


def test_keeps_the_priority_even_with_a_mild_outlook() -> None:
    p = present(brief(signal("official", "official", 2), signal("temperature-future", "future", 0), title="Vigilance orange · orages"))
    assert (p.headline, p.outlook) == ("Vigilance orange · orages", None)


# ── Relevance ────────────────────────────────────────────────────────────────

SETTINGS = Settings.from_options({"weather_entity": "weather.test", "temperature_entity": "sensor.outdoor"})


def built(feels: float = 20, wind: float | None = None, rain: float | None = None, hours: dict[float, float] | None = None, days: list[Day] | None = None,
          precipitation: float | None = None) -> Brief:
    w = replace(weather(temperature=20, feels=feels, heat_index=20, wind=wind, rain=rain))
    points = [Hour(time=NOW + timedelta(hours=h), temperature=t, precipitation=precipitation) for h, t in (hours or {}).items()]
    return build_brief(w, SETTINGS, {}.get, points, days or [], NOW, ZONE)


def test_leaves_an_ordinary_situation_blank() -> None:
    assert present(built(wind=12, rain=0, hours={1: 21}, precipitation=0)).headline is None


def test_uses_the_real_maximum_not_the_last_point() -> None:
    b = built(hours={1: 21, 3: 25, 6: 23})
    assert next(s.text for s in b.signals if s.key == "temperature-future") == "Montée jusqu’à 25 °C dans les 6 h"


@pytest.mark.parametrize(("feels", "exists"), [(24, False), (24.1, True), (15.9, True)])
def test_only_explains_a_comfort_gap_strictly_above_4_degrees(feels: float, exists: bool) -> None:
    gap = next((s for s in built(feels=feels).signals if s.key == "comfort-gap"), None)
    assert (gap is not None) == exists
    if gap:
        assert ("de plus qu’au thermomètre" if feels > 20 else "de moins qu’au thermomètre") in gap.text


def test_keeps_an_ordinary_temperature_outlook_out_when_something_matters_now() -> None:
    b = built(wind=40, hours={5: 25})
    assert "temperature-future" not in keys(secondary(b, present(b)))


def test_prefers_notable_rain_tomorrow_to_a_mild_warming() -> None:
    b = built(hours={5: 25}, days=[Day(time=datetime(2026, 10, 7, 10, tzinfo=timezone.utc), precipitation=72)])
    assert present(b).headline == "Forte pluie demain : 72 mm"
    assert next(s.severity for s in b.signals if s.key == "rain-tomorrow") == 0


def test_does_not_present_today_s_or_small_rain_as_notable_tomorrow() -> None:
    for day in (Day(time=datetime(2026, 10, 6, 10, tzinfo=timezone.utc), precipitation=72), Day(time=datetime(2026, 10, 7, 10, tzinfo=timezone.utc), precipitation=19.9)):
        assert "rain-tomorrow" not in keys(built(days=[day]).signals)
    assert parse_days([{"datetime": "invalid", "precipitation": 72}]) == []
