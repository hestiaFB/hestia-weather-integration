"""The station's own shade by the sun's position: clear hours first, the direct sun as a fallback, the last hours winning
little by little, the neighbours and the household's declaration for the cells never seen."""
from datetime import datetime, timedelta, timezone

from engine.station_shade import (CELL_HOURS, SHADED, SUNNY, cell, declared_share, filled, learn, reachable)

UTC = timezone.utc
LAT, LON = 43.45, 5.47


def days_at(hour: int, n: int, first: str = "2026-10-01"):
    start = datetime.fromisoformat(first).replace(tzinfo=UTC) + timedelta(hours=hour)
    return [start + timedelta(days=d) for d in range(n)]


def clear(at, measured, sun=600.0):
    return (at, sun, sun * 0.85, sun * 0.15, 5.0, measured)


def test_a_cell_is_learned_from_four_clear_hours():
    hours = [clear(at, 240.0) for at in days_at(11, CELL_HOURS)]
    where = cell(hours[0][0], LAT, LON)
    assert {cell(h[0], LAT, LON) for h in hours} == {where}
    assert learn(hours, LAT, LON) == {where: 0.4}
    assert learn(hours[:-1], LAT, LON) == {}


def test_cloudy_hours_alone_teach_by_the_direct_sun():
    # 50 % of clouds: never a clear hour. The station gets the diffuse light and a third of the direct sun.
    hours = [(at, 400.0, 300.0, 100.0, 50.0, 100.0 + 300.0 / 3) for at in days_at(11, CELL_HOURS)]
    share = learn(hours, LAT, LON)[cell(hours[0][0], LAT, LON)]
    assert 0.4 < share < 0.6


def test_clear_hours_win_over_the_direct_sun():
    at = days_at(11, CELL_HOURS * 2)
    hours = [clear(a, 600.0) for a in at[:CELL_HOURS]] + [(a, 400.0, 300.0, 100.0, 50.0, 100.0) for a in at[CELL_HOURS:]]
    assert learn(hours, LAT, LON)[cell(at[0], LAT, LON)] == 1.0


def test_a_known_cell_moves_halfway_and_an_unseen_one_is_kept():
    hours = [clear(at, 600.0) for at in days_at(11, CELL_HOURS)]
    where = cell(hours[0][0], LAT, LON)
    learned = learn(hours, LAT, LON, {where: 0.2, "90/5": 0.7})
    assert learned == {where: 0.6, "90/5": 0.7}


def test_the_last_hours_decide_a_station_moved_into_the_sun():
    at = days_at(11, 20)
    hours = [clear(a, 120.0) for a in at[:8]] + [clear(a, 600.0) for a in at[8:]]
    assert learn(hours, LAT, LON)[cell(at[0], LAT, LON)] == 1.0


def test_declared_shade_by_the_side_of_the_sun():
    assert declared_share(None, "100/20") is None
    assert declared_share("never", "100/20") == SUNNY
    assert declared_share("morning", "100/20") == SHADED and declared_share("morning", "250/20") == SUNNY
    assert declared_share("afternoon", "250/20") == SHADED and declared_share("afternoon", "100/20") == SUNNY


def test_unknown_cells_take_the_neighbours_then_the_declaration():
    cells = ["170/25", "180/25", "200/25", "100/10"]
    out = filled({"170/25": 0.4}, cells, "afternoon")
    assert out["170/25"] == 0.4                     # learned
    assert out["180/25"] == 0.4                     # its neighbour
    assert out["200/25"] == SHADED                  # declared before a neighbour two cells away
    assert out["100/10"] == SUNNY
    assert filled({"170/25": 0.4}, ["190/25", "100/10"]) == {"190/25": 0.4}


def test_the_sun_crosses_a_bounded_set_of_cells():
    cells = reachable(LAT, LON)
    assert 100 < len(cells) < 300
    assert all(int(c.split("/")[1]) >= 5 for c in cells)
    # Gardanne: never above about 70°.
    assert max(int(c.split("/")[1]) for c in cells) <= 70
