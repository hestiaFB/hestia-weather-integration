"""One calculation, from what Home Assistant knows to the view the card draws. The integration and the card's test bench
both go through here, so what the bench shows is what Home Assistant computes."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Mapping, Sequence
from zoneinfo import ZoneInfo

from .brief import Brief, build_brief
from .catalogue import Item, build_catalogue
from .forecast import Day, Hour
from .lightning import Lightning
from .local import LocalWeather, build_local
from .settings import Settings
from .station import Derived, Statistic, derive_station
from .trends import Change
from .view import WeatherView, build_view


@dataclass(frozen=True)
class Result:
    local: LocalWeather
    brief: Brief
    derived: Derived | None
    view: WeatherView
    catalogue: dict[str, Item]


def compute(get: Callable[[str], Any], settings: Settings, hours: Sequence[Hour], days: Sequence[Day], history: Mapping[str, Sequence[Change]],
            rain_history: Mapping[str, Sequence[Change]], statistics: Sequence[Statistic], statistics_unit: str | None, now: datetime, zone: ZoneInfo,
            latitude: float | None = None, elevation: float = 0, platforms: Mapping[str, str] | None = None,
            original_condition: str | None = None, lightning: Lightning | None = None) -> Result:
    """`hours` and `days` are the whole forecasts; `history` covers six hours (and today for gusts), `rain_history` eight days;
    `lightning` what Blitzortung's strikes say, when it is chosen."""
    # The engine reads the next hours, first one first: an hour already over is no longer « next ».
    upcoming = [h for h in hours if h.time is None or h.time.timestamp() > now.timestamp() - 3600][:18]
    local = build_local(get, settings, upcoming, history, now, zone)
    derived = derive_station(get, settings, statistics, statistics_unit, {**history, **rain_history}, now, zone) if settings.station_history else None
    brief = build_brief(local, settings, get, hours, days, now, zone, platforms, lightning)
    view = build_view(get, settings, local, brief, hours, days, history, rain_history, derived, now, zone, latitude, elevation,
                      original_condition, lightning)
    catalogue = build_catalogue(local, brief, derived, settings, get, hours, days, now, zone, platforms, lightning)
    return Result(local, brief, derived, view, catalogue)
