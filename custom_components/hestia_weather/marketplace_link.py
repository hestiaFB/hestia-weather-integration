"""After the change of technical name, a repair says how to get Hestia Weather's updates from the Marketplace again.

The Marketplace (Home Assistant 2026.11, formerly HACS) knows an integration by the folder it installed it in. A home
updated through the bridge (2.9.9) runs from custom_components/hestia_weather, a folder the Marketplace did not write:
once the carrying over has removed the former folder, the Marketplace may take Hestia Weather as no longer installed and
offer no update any more. Downloading Hestia Weather again in « Paramètres › Marketplace » mends it.

Only what Hestia Weather knows itself is used: the carrying over has just removed the former folder (domain_migration's
DONE_EVENT, `folder`). The Marketplace is neither read nor driven from here: the repair is a message, which the user may
dismiss once done, and which goes by itself at the next update of Hestia Weather (updates come again).
"""
from __future__ import annotations

from typing import Any

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN
from .domain_migration import DONE_EVENT

ISSUE = "marketplace_download_again"


@callback
def async_setup_marketplace_link(hass: HomeAssistant, version: str) -> None:
    """Before the carrying over starts (async_setup_migration), so that its end is heard."""
    issue = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE)
    if issue is not None and (issue.data or {}).get("version") != version:
        # Another version is installed since the message: the updates came again.
        ir.async_delete_issue(hass, DOMAIN, ISSUE)

    @callback
    def carried_over(event: Event[dict[str, Any]]) -> None:
        if event.data.get("domain") == DOMAIN and event.data.get("folder"):
            ir.async_create_issue(hass, DOMAIN, ISSUE, is_fixable=False, is_persistent=True, severity=ir.IssueSeverity.WARNING,
                                  translation_key=ISSUE, data={"version": version})

    hass.bus.async_listen(DONE_EVENT, carried_over)
