"""The `hestia_weather.prevision` action: the weather of a window, ready for a notification or a condition."""
from __future__ import annotations

from typing import Any
from zoneinfo import ZoneInfo

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import HestiaWeatherConfigEntry
from .engine.prevision import NoForecast, forecast_window, window

SCHEMA = vol.Schema({vol.Required("debut"): vol.Any(cv.time, cv.datetime), vol.Required("fin"): vol.Any(cv.time, cv.datetime),
                     vol.Optional("lieu"): cv.string})


def async_setup_services(hass: HomeAssistant) -> None:
    async def prevision(call: ServiceCall) -> ServiceResponse:
        entries: list[HestiaWeatherConfigEntry] = [e for e in hass.config_entries.async_entries(DOMAIN) if e.state is ConfigEntryState.LOADED]
        wanted = call.data.get("lieu")
        entry = next((e for e in entries if wanted in (e.entry_id, e.title)), None) if wanted else entries[0] if len(entries) == 1 else None
        if entry is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="unknown_place" if wanted or not entries else "choose_place")
        zone = ZoneInfo(hass.config.time_zone)
        start, end = window(call.data["debut"], call.data["fin"], dt_util.now(), zone)
        if end <= start:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="end_before_start")
        coordinator = entry.runtime_data
        try:
            answer: dict[str, Any] = forecast_window(coordinator.hours, coordinator.days, start, end, zone)
        except NoForecast as err:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="no_forecast") from err
        return {"lieu": entry.title, **answer}

    hass.services.async_register(DOMAIN, "prevision", prevision, schema=SCHEMA, supports_response=SupportsResponse.ONLY)
