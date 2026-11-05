"""The repairs Hestia Weather can carry out itself, from « Paramètres › Réparations »."""
from __future__ import annotations

from typing import Any

from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult

from . import marketplace_link


class TrackAgainFlow(RepairsFlow):
    """The Marketplace downloads Hestia Weather again, to follow it under its new folder."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        return await self.async_step_confirm()

    async def async_step_confirm(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        if user_input is None:
            version = (marketplace_link.offered(self.hass) or "").lstrip("v")
            return self.async_show_form(step_id="confirm", description_placeholders={"version": version})
        if await marketplace_link.async_track_again(self.hass):
            return self.async_create_entry(data={})
        return self.async_abort(reason="download_failed")


async def async_create_fix_flow(hass: HomeAssistant, issue_id: str, data: dict[str, Any] | None) -> RepairsFlow:
    return TrackAgainFlow()
