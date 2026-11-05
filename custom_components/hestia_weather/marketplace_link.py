"""Hestia Weather followed again by Home Assistant's Marketplace, after the change of technical name.

The Marketplace (Home Assistant 2026.11, formerly HACS) knows an integration by the folder it installed it in, and refuses
an update that would install it in another one. A home updated through the bridge (2.9.9) runs from
custom_components/hestia_weather, a folder the Marketplace did not write: once the former folder is gone, it takes Hestia
Weather as no longer installed and offers no update any more. A repair offers to download the same version again: the
Marketplace then follows the new folder, and the updates come back.

The same when the former folder was downloaded again by hand while the bridge was the newest version: nothing runs
from it (its places were carried over), but the Marketplace follows it and refuses the new name; the repair removes it
first. It is only offered when the version the Marketplace offers is under the new name (3 or later): downloading a former
one would bring the former folder back. The Marketplace's insides are read with care: if they change, nothing is shown, and
« Paramètres › Marketplace › Hestia Weather › Télécharger » does the same by hand.
"""
from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.start import async_at_started

from .const import DOMAIN
from .engine import legacy

LOGGER = logging.getLogger(__name__)
REPOSITORY = "hestiaFB/hestia-weather-integration"
MARKETPLACE = "marketplace"
ISSUE = "marketplace_untracked"
# The first version under the new name: an older one offered by the Marketplace must not be downloaded.
FIRST_MAJOR = 3
EVERY = timedelta(hours=6)


def _repository(hass: HomeAssistant) -> Any | None:
    """This repository as the Marketplace keeps it, or None (no Marketplace, not listed, or insides changed)."""
    try:
        entries = hass.config_entries.async_entries(MARKETPLACE)
        manager = getattr(entries[0], "runtime_data", None) if entries else None
        return manager.repositories.get_by_full_name(REPOSITORY) if manager is not None else None
    except Exception:  # noqa: BLE001 - the Marketplace's insides may change: then nothing is offered
        LOGGER.debug("Marketplace not read", exc_info=True)
        return None


def _major(version: str) -> int:
    try:
        return int(version.lstrip("v").split(".")[0])
    except ValueError:
        return 0


def offered(hass: HomeAssistant) -> str | None:
    """The version to download again when the Marketplace no longer follows Hestia Weather; None when all is well."""
    repository = _repository(hass)
    if repository is None:
        return None
    try:
        installed, domain = repository.data.installed, repository.data.domain
        version = str(repository.data.last_version or "")
    except Exception:  # noqa: BLE001
        return None
    if _major(version) < FIRST_MAJOR:
        return None
    if not installed:
        return version
    # The former folder downloaded again by hand, with nothing left to run (its places were carried over).
    if domain == legacy.DOMAIN and not hass.config_entries.async_entries(legacy.DOMAIN):
        return version
    return None


def async_check(hass: HomeAssistant) -> None:
    """Shows the repair while the Marketplace does not follow Hestia Weather, removes it once it does."""
    if (version := offered(hass)) is None:
        ir.async_delete_issue(hass, DOMAIN, ISSUE)
        return
    ir.async_create_issue(hass, DOMAIN, ISSUE, is_fixable=True, is_persistent=False, severity=ir.IssueSeverity.WARNING,
                          translation_key=ISSUE, translation_placeholders={"version": version.lstrip("v")})


async def async_track_again(hass: HomeAssistant) -> bool:
    """The Marketplace downloads the offered version again; True when it follows Hestia Weather again."""
    if offered(hass) is None:
        return True
    repository = _repository(hass)
    try:
        if repository.data.installed:
            await repository.uninstall()  # the former folder, empty of places: removed first
        await repository.async_install_repository()
        installed = bool(repository.data.installed)
    except Exception:  # noqa: BLE001 - the repair then says how to do it by hand
        LOGGER.warning("The Marketplace could not download Hestia Weather again", exc_info=True)
        return False
    async_check(hass)
    return installed


def async_setup_marketplace_link(hass: HomeAssistant) -> None:
    """Checked once Home Assistant has started (the Marketplace has read its list), then every 6 hours."""
    @callback
    def check(_: Any) -> None:
        async_check(hass)

    async_at_started(hass, check)
    async_track_time_interval(hass, check, EVERY, cancel_on_shutdown=True)
