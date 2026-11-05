"""Compact reads of the recorder: what the learning needs from ten days of history, never all of it in memory at once.

A sensor reporting every ten seconds leaves ~86 000 rows in ten days. They are read one entity and one day at a time,
and only what the analyses use is kept: every change of a contact or a state, for a thermostat the moments its
`hvac_action` changes, and for a measure every real move (1 % or more) but its small jitter once a minute at most.
A CO₂ sensor reporting in bursts while a window is open keeps its whole fall: that is what the airing model reads.
Runs in the recorder's executor (blocking database calls).

Copied unchanged into each brick from hestia-ecosysteme/socle/ (copier.sh), like socle.py.
"""
from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timedelta
from typing import Any, NamedTuple


class Row(NamedTuple):
    """One recorded state kept: when it changed, when it was written, its value, the one attribute asked for."""
    last_changed: datetime
    last_updated: datetime
    state: str
    attributes: dict[str, Any]


# One query covers at most this long: the rows of one day of one entity are the most held at a time.
SLICE = timedelta(days=1)
# A numeric value closer than this to the last one kept, and within JITTER of it, is dropped.
RESOLUTION = timedelta(seconds=60)
JITTER = 0.01


def _number(state: Any) -> float | None:
    try:
        return float(state)
    except (TypeError, ValueError):
        return None


def compact(states: Iterable[Any], attribute: str | None = None, previous: Row | None = None) -> list[Row]:
    """The rows worth keeping from recorder states, in order; `previous` is the last row kept before them."""
    kept: list[Row] = []
    tail: Row | None = None
    for state in states:
        attributes = {attribute: state.attributes.get(attribute)} if attribute else {}
        row = Row(state.last_changed, state.last_updated, state.state, attributes)
        last = kept[-1] if kept else previous
        if attribute:
            keep = last is None or last.attributes != attributes or last.state != row.state
        elif (value := _number(row.state)) is not None:
            before = _number(last.state) if last is not None else None
            keep = (last is None or before is None or row.last_changed - last.last_changed >= RESOLUTION
                    or abs(value - before) >= max(abs(before) * JITTER, 1e-9))
        else:
            keep = last is None or last.state != row.state
        if keep:
            kept.append(row)
            tail = None
        else:
            tail = row
    # The last value read stays: a series holds it until the end of the window.
    if tail is not None:
        kept.append(tail)
    return kept


def read(hass: Any, start: datetime, end: datetime, entity_ids: Iterable[str], attribute: str | None = None) -> dict[str, list[Row]]:
    """{entity_id: [Row]} between `start` and `end`, read and compacted entity by entity, day by day."""
    from homeassistant.components.recorder import history

    out: dict[str, list[Row]] = {}
    for entity_id in entity_ids:
        rows: list[Row] = []
        begin = start
        while begin < end:
            stop = min(begin + SLICE, end)
            # The state at `start` opens the window; later slices only add what changed within them.
            states = history.get_significant_states(
                hass, begin, stop, [entity_id], None, begin == start, False, False, attribute is None)
            rows.extend(compact(states.get(entity_id, []), attribute, rows[-1] if rows else None))
            del states
            begin = stop
        out[entity_id] = rows
    return out
