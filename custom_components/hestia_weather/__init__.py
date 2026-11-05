"""Hestia Weather: the brain of the weather at home. It reads the station, the forecast and the air quality, computes what
they mean, exposes the results as sensors and sends the Hestia Weather card everything it shows."""
from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .api import API_KEY, HestiaWeatherApi
from .const import DOMAIN
from .coordinator import HestiaWeatherConfigEntry, HestiaWeatherCoordinator, alert_store
from .domain_migration import async_setup_migration
from .draft import async_load_labels
from .former_api import async_setup_former_api
from .marketplace_link import async_setup_marketplace_link
from .panel import CARD_URL, async_setup_panel
from .socle import async_remove_card
from .services import async_setup_services
from .websocket import async_setup_websocket

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR, Platform.WEATHER]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    # A home installed under the former technical name is carried over: its files now, the rest once Home Assistant has started.
    await async_setup_migration(hass)
    # The card compares it with the version it needs, to say when the integration was not updated with it.
    version = str((await async_get_integration(hass, DOMAIN)).version or "")
    async_setup_websocket(hass, version)
    async_setup_services(hass)
    # The contract for the other Hestia-FB bricks (Hestia Confort, future Hestia Chauffage…).
    hass.data[API_KEY] = api = HestiaWeatherApi(hass)
    # The same, for a Hestia Confort not updated yet (still under its former name).
    await async_setup_former_api(hass, api)
    # After the change of name, the Marketplace may no longer follow Hestia Weather: a repair says so and mends it.
    async_setup_marketplace_link(hass)
    # The « Météo » tab of the shared « Hestia-FB » panel, and Hestia Weather's line on its home page.
    await async_load_labels(hass)
    await async_setup_panel(hass, version)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> bool:
    coordinator = HestiaWeatherCoordinator(hass, entry)
    await coordinator.async_start()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> None:
    """The place is removed: its alerts in progress go with it; with the last place, the card's dashboard resource."""
    await alert_store(hass, entry.entry_id).async_remove()
    if not [e for e in hass.config_entries.async_entries(DOMAIN) if e.entry_id != entry.entry_id]:
        await async_remove_card(hass, CARD_URL)


async def _async_reload(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> None:
    """New settings: start again from them."""
    await hass.config_entries.async_reload(entry.entry_id)
