"""The station's own shade, learned each night from its long-term statistics and Open-Meteo's sun of the same hours
(engine/station_shade.py), kept across restarts and shared with the other bricks (api.py `station_shade`).

The home's position leaves Home Assistant rounded to a tenth of a degree, once a night, and only when a sun sensor is chosen."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

import aiohttp
from homeassistant.components.recorder import get_instance, statistics
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from ..const import DOMAIN, LOGGER
from ..engine import station_shade
from .shared import _seconds

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from ..engine.settings import Settings

# Open-Meteo's sun of the past days, by the hour, at the home's position rounded to about ten kilometres.
PAST_SUN = "https://api.open-meteo.com/v1/forecast"
# Learned again each night between 3 and 5 h, or at once when never learned or two nights were missed.
NIGHT, EVERY, LATE = (3, 5), timedelta(hours=20), timedelta(hours=36)


def due(learned_at: datetime | None, now: datetime) -> bool:
    if learned_at is None or now - learned_at >= LATE:
        return True
    return now - learned_at >= EVERY and NIGHT[0] <= dt_util.as_local(now).hour < NIGHT[1]


def shade_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    return Store(hass, 1, f"{DOMAIN}.ombre.{entry_id}")


class ShadeMixin:
    """Part of HestiaWeatherCoordinator: its methods use the coordinator's own state (self)."""

    hass: HomeAssistant
    settings: Settings
    config_entry: ConfigEntry
    shade: dict[str, float]
    shade_learned_at: datetime | None
    shade_hours: int
    _shade_store: Store[dict[str, Any]] | None
    _shade_cells: frozenset[str] | None

    async def _load_shade(self) -> None:
        """The shade kept, then learned again when the last night is a day old. No sun sensor, nothing to learn."""
        if self._shade_store is None:
            self._shade_store = shade_store(self.hass, self.config_entry.entry_id)
            kept = await self._shade_store.async_load() or {}
            self.shade = {k: float(v) for k, v in (kept.get("cells") or {}).items()}
            self.shade_learned_at = dt_util.parse_datetime(kept["learned_at"]) if kept.get("learned_at") else None
            self.shade_hours = int(kept.get("hours") or 0)
        now = dt_util.utcnow()
        if not self.settings.solar_radiation_entity or not due(self.shade_learned_at, now):
            return
        try:
            await self._learn_shade(now)
        except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
            LOGGER.warning("Station shade not learned this time: %s", err)

    async def _learn_shade(self, now: datetime) -> None:
        entity = self.settings.solar_radiation_entity
        end = now.replace(minute=0, second=0, microsecond=0)
        start = end - timedelta(days=station_shade.DAYS)

        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, end, {entity}, "hour", None, {"mean"})
            return list(rows.get(entity, []))

        rows = await get_instance(self.hass).async_add_executor_job(during)
        measured = {int(_seconds(r["start"])): r["mean"] for r in rows if r.get("mean") is not None}
        if not measured:
            # A sensor without statistics (no state class): nothing to learn from; the declared shade still serves.
            self.shade_learned_at = now
            return
        days = min(station_shade.DAYS, (end - dt_util.utc_from_timestamp(min(measured))).days + 1)
        hass = self.hass
        params = {"latitude": f"{hass.config.latitude:.1f}", "longitude": f"{hass.config.longitude:.1f}",
                  "hourly": "shortwave_radiation,direct_radiation,diffuse_radiation,cloud_cover",
                  "past_days": str(days), "forecast_days": "1", "timeformat": "unixtime", "timezone": "GMT"}
        async with asyncio.timeout(60), async_get_clientsession(hass).get(PAST_SUN, params=params) as response:
            response.raise_for_status()
            hourly = (await response.json())["hourly"]
        # Each Open-Meteo value is the mean of the hour that ends at its time.
        hours = [(dt_util.utc_from_timestamp(at - 3600), sun, beam, diffuse, clouds, measured.get(at - 3600))
                 for at, sun, beam, diffuse, clouds in zip(hourly["time"], hourly["shortwave_radiation"], hourly["direct_radiation"],
                                                           hourly["diffuse_radiation"], hourly["cloud_cover"])
                 if at - 3600 in measured]
        self.shade = await hass.async_add_executor_job(station_shade.learn, hours, hass.config.latitude, hass.config.longitude, self.shade)
        self.shade_learned_at, self.shade_hours = now, len(hours)
        if self._shade_store is not None:
            await self._shade_store.async_save({"cells": self.shade, "learned_at": now.isoformat(), "hours": len(hours)})

    def shade_cells(self) -> frozenset[str]:
        """The cells the sun crosses here over a year, computed once."""
        if self._shade_cells is None:
            self._shade_cells = station_shade.reachable(self.hass.config.latitude, self.hass.config.longitude)
        return self._shade_cells

    def shade_view(self) -> dict[str, Any]:
        """What the other bricks read (api.py `station_shade`)."""
        cells = self.shade_cells()
        learned = {k: v for k, v in self.shade.items() if k in cells}
        return {"sensor": self.settings.solar_radiation_entity, "declared": self.settings.station_shade,
                "cells": station_shade.filled(learned, cells, self.settings.station_shade),
                "learned": len(learned), "reachable": len(cells), "hours": self.shade_hours,
                "learned_at": self.shade_learned_at.isoformat() if self.shade_learned_at else None,
                "steps": [station_shade.AZIMUTH_STEP, station_shade.ELEVATION_STEP]}
