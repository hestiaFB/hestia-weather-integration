"""The interface for a Hestia Confort still under its former name (1.7), while Hestia Weather already has its new one.

Hestia Weather 3 can be updated before Hestia Confort 2. Hestia Confort 1.7 looks for Hestia Weather under the former
key (legacy.API_KEY) and keeps the former ids of its places, which the carrying over changed (domain_migration's shared
table). This view of the same interface answers it: the same methods, with the place ids it knows (the former ones, turned
into the new ones when it asks): its settings keep matching the places it is offered.
It goes when Hestia Confort 1.7 is no longer supported, with legacy.py.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback

from .api import API_VERSION, HestiaWeatherApi
from .domain_migration import DONE_EVENT, async_entry_ids
from .engine import legacy

# The methods of the interface whose first argument is a place id.
BY_PLACE = ("station", "hourly", "air", "season", "rain", "add_listener")


class FormerApi:
    """Hestia Weather's interface as Hestia Confort 1.7 reads it."""

    version = API_VERSION

    def __init__(self, api: HestiaWeatherApi) -> None:
        self._api = api
        # Former place id → new one.
        self.ids: dict[str, str] = {}

    def places(self) -> list[dict[str, str]]:
        """The places, each under the id Hestia Confort 1.7 knows it by: the former one when it had one."""
        former = {new: old for old, new in self.ids.items()}
        return [{**p, "entry_id": former.get(p["entry_id"], p["entry_id"])} for p in self._api.places()]

    def place(self, entry_id: str | None) -> str | None:
        """The new id of a place given by its former id; any other id as it is."""
        return self.ids.get(entry_id, entry_id) if entry_id else entry_id

    def __getattr__(self, name: str) -> Any:
        method = getattr(self._api, name)
        if name not in BY_PLACE:
            return method

        def by_place(entry_id: str | None = None, *args: Any, **kwargs: Any) -> Any:
            return method(self.place(entry_id), *args, **kwargs)

        return by_place


async def async_setup_former_api(hass: HomeAssistant, api: HestiaWeatherApi) -> Callable[[], None] | None:
    """Offers the interface under its former key, when Hestia Confort is still under its former name."""
    if not hass.config_entries.async_entries(legacy.COMFORT_DOMAIN):
        return None
    former = FormerApi(api)
    former.ids = await async_entry_ids(hass)

    @callback
    def carried_over(event: Event) -> None:
        former.ids.update(event.data.get("entries") or {})

    hass.data[legacy.API_KEY] = former
    return hass.bus.async_listen(DONE_EVENT, carried_over)
