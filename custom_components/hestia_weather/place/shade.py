"""The station's own shade, learned each night from its long-term statistics and Open-Meteo's sun of the same hours
(engine/station_shade.py), kept across restarts and shared with the other bricks (api.py `station_shade`). The same night,
the same call learns how far the station's temperature, wind and rain can be trusted (engine/station_place.py).

The home's position leaves Home Assistant rounded to a tenth of a degree, once a night, and only when the station has one of
those sensors."""
from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any
from zoneinfo import ZoneInfo

import aiohttp
from homeassistant.components.recorder import get_instance, statistics
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from ..const import DOMAIN, LOGGER
from ..engine import station_place, station_shade
from ..engine.station import Statistic, steady_sums
from ..engine.units import Kind, measurement
from .shared import RAIN_UNITS, _seconds

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from ..engine.settings import Settings

# Open-Meteo's sun of the past days, by the hour, at the home's position rounded to about ten kilometres.
PAST_SUN = "https://api.open-meteo.com/v1/forecast"
# Learned again each night between 3 and 5 h, or at once when never learned or two nights were missed.
NIGHT, EVERY, LATE = (3, 5), timedelta(hours=20), timedelta(hours=36)
# A day of the gauge counts when its hours are almost all there.
DAY_HOURS = 20


def due(learned_at: datetime | None, now: datetime) -> bool:
    if learned_at is None or now - learned_at >= LATE:
        return True
    return now - learned_at >= EVERY and NIGHT[0] <= dt_util.as_local(now).hour < NIGHT[1]


def shade_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    return Store(hass, 1, f"{DOMAIN}.ombre.{entry_id}")


def place_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    """What the nights learned of the station's temperature, wind and rain (engine/station_place.py)."""
    return Store(hass, 1, f"{DOMAIN}.station.{entry_id}")


def rain_days(sums: list[Statistic], forecast: dict[int, float | None], zone: ZoneInfo, today: date, unit: str | None) -> list[tuple[float | None, float | None]]:
    """(forecast mm, measured mm) of each whole day before today: the gauge's hourly rises, Open-Meteo's hourly rain."""
    measured: dict[date, list[float]] = defaultdict(list)
    for before, row in zip(sums, sums[1:]):
        if before.sum is None or row.sum is None:
            continue
        rise = measurement(max(0.0, row.sum - before.sum), unit, Kind.RAIN)
        if rise is not None:
            measured[dt_util.utc_from_timestamp(row.start).astimezone(zone).date()].append(rise)
    predicted: dict[date, float] = defaultdict(float)
    for start, value in forecast.items():
        if value is not None:
            predicted[dt_util.utc_from_timestamp(start).astimezone(zone).date()] += value
    return [(round(predicted[day], 1), round(sum(rises), 1)) for day, rises in sorted(measured.items())
            if day < today and len(rises) >= DAY_HOURS and day in predicted]


class ShadeMixin:
    """Part of HestiaWeatherCoordinator: its methods use the coordinator's own state (self)."""

    hass: HomeAssistant
    settings: Settings
    config_entry: ConfigEntry
    shade: dict[str, float]
    shade_learned_at: datetime | None
    shade_hours: int
    place_learned: dict[str, Any]
    _shade_store: Store[dict[str, Any]] | None
    _place_store: Store[dict[str, Any]] | None
    _shade_cells: frozenset[str] | None

    def _learns(self) -> bool:
        s = self.settings
        return bool(s.solar_radiation_entity or s.temperature_entity or s.wind_speed_entity or s.rain_total_entity or s.daily_rain_entity)

    async def _load_shade(self) -> None:
        """The shade and the station's trust kept, then learned again when the last night is a day old. Nothing to learn
        from without a sensor."""
        if self._shade_store is None:
            self._shade_store = shade_store(self.hass, self.config_entry.entry_id)
            kept = await self._shade_store.async_load() or {}
            self.shade = {k: float(v) for k, v in (kept.get("cells") or {}).items()}
            self.shade_learned_at = dt_util.parse_datetime(kept["learned_at"]) if kept.get("learned_at") else None
            self.shade_hours = int(kept.get("hours") or 0)
            self._place_store = place_store(self.hass, self.config_entry.entry_id)
            self.place_learned = await self._place_store.async_load() or {}
        now = dt_util.utcnow()
        # The night's learning is dated with the station's trust, which came after its shade (5 November 2026): a station
        # that never learned its trust learns it at once.
        learned_at = dt_util.parse_datetime(self.place_learned["learned_at"]) if self.place_learned.get("learned_at") else None
        if not self._learns() or not due(learned_at, now):
            return
        try:
            await self._learn_shade(now)
        except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
            LOGGER.warning("Station shade not learned this time: %s", err)

    async def _means(self, entity: str | None, start: datetime, end: datetime, units: dict[str, str] | None) -> dict[int, float]:
        """The hourly means of one sensor's long-term statistics, by the start of the hour (seconds)."""
        if not entity:
            return {}

        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, end, {entity}, "hour", units, {"mean"})
            return list(rows.get(entity, []))
        try:
            rows = await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - one sensor without statistics must not stop the others
            LOGGER.debug("No statistics for %s: %s", entity, err)
            return {}
        return {int(_seconds(r["start"])): r["mean"] for r in rows if r.get("mean") is not None}

    async def _gauge(self, start: datetime, end: datetime) -> tuple[list[Statistic], str | None]:
        """The rain counter's hourly running sums: the total counter first, else the daily one."""
        s = self.settings
        for entity in (s.rain_total_entity, s.daily_rain_entity):
            if not entity:
                continue
            unit = await self._sum_unit(entity)  # type: ignore[attr-defined]
            if unit not in RAIN_UNITS:
                continue

            def during(entity: str = entity) -> list[Any]:
                rows = statistics.statistics_during_period(self.hass, start, end, {entity}, "hour", None, {"sum", "state"})
                return list(rows.get(entity, []))
            try:
                rows = await get_instance(self.hass).async_add_executor_job(during)
            except Exception as err:  # noqa: BLE001 - the rain is optional
                LOGGER.debug("No rain statistics for %s: %s", entity, err)
                continue
            sums = steady_sums([Statistic(_seconds(r["start"]), _seconds(r["end"]), r["sum"], r.get("state")) for r in rows if r.get("sum") is not None])
            if sums:
                return sums, unit
        return [], None

    async def _learn_shade(self, now: datetime) -> None:
        s = self.settings
        end = now.replace(minute=0, second=0, microsecond=0)
        start = end - timedelta(days=station_shade.DAYS)
        sun = await self._means(s.solar_radiation_entity, start, end, None)
        temperature = await self._means(s.temperature_entity, start, end, {"temperature": "°C"})
        wind = await self._means(s.wind_speed_entity, start, end, {"speed": "km/h"})
        gauge, unit = await self._gauge(start, end)
        firsts = [min(m) for m in (sun, temperature, wind) if m] + ([int(gauge[0].start)] if gauge else [])
        if not firsts:
            # Sensors without statistics (no state class): nothing to learn from; what was declared still serves.
            self.shade_learned_at = now
            self.place_learned = {**(self.place_learned or {}), "learned_at": now.isoformat()}
            return
        days = min(station_shade.DAYS, (end - dt_util.utc_from_timestamp(min(firsts))).days + 1)
        hass = self.hass
        params = {"latitude": f"{hass.config.latitude:.1f}", "longitude": f"{hass.config.longitude:.1f}",
                  "hourly": "shortwave_radiation,direct_radiation,diffuse_radiation,cloud_cover,temperature_2m,wind_speed_10m,wind_direction_10m,precipitation",
                  "past_days": str(days), "forecast_days": "1", "timeformat": "unixtime", "timezone": "GMT"}
        async with asyncio.timeout(60), async_get_clientsession(hass).get(PAST_SUN, params=params) as response:
            response.raise_for_status()
            hourly = (await response.json())["hourly"]
        # Each Open-Meteo value is the mean of the hour that ends at its time.
        times = [at - 3600 for at in hourly["time"]]

        def column(name: str) -> list[Any]:
            return hourly.get(name) or [None] * len(times)
        clouds = dict(zip(times, column("cloud_cover")))
        latitude, longitude = hass.config.latitude, hass.config.longitude
        if sun:
            hours = [(dt_util.utc_from_timestamp(at), g, b, d, clouds.get(at), sun[at])
                     for at, g, b, d in zip(times, column("shortwave_radiation"), column("direct_radiation"), column("diffuse_radiation")) if at in sun]
            self.shade = await hass.async_add_executor_job(station_shade.learn, hours, latitude, longitude, self.shade)
            self.shade_hours = len(hours)
        learned = dict(self.place_learned or {})
        if temperature:
            rows = [(dt_util.utc_from_timestamp(at), f, clouds.get(at), temperature[at]) for at, f in zip(times, column("temperature_2m")) if at in temperature]
            learned["temperature"] = await hass.async_add_executor_job(station_place.learn_temperature, rows, latitude, longitude, learned.get("temperature"))
        if wind:
            rows = [(f, d, wind[at]) for at, f, d in zip(times, column("wind_speed_10m"), column("wind_direction_10m")) if at in wind]
            learned["wind"] = station_place.learn_wind(rows, learned.get("wind"))
        if gauge:
            zone = ZoneInfo(hass.config.time_zone)
            pairs = rain_days(gauge, dict(zip(times, column("precipitation"))), zone, dt_util.now(zone).date(), unit)
            learned["rain"] = station_place.learn_rain(pairs, learned.get("rain"))
        learned.update({"days": days, "learned_at": now.isoformat()})
        self.place_learned = learned
        self.shade_learned_at = now
        if self._shade_store is not None:
            await self._shade_store.async_save({"cells": self.shade, "learned_at": now.isoformat(), "hours": self.shade_hours})
        if self._place_store is not None:
            await self._place_store.async_save(learned)

    def shade_cells(self) -> frozenset[str]:
        """The cells the sun crosses here over a year, computed once."""
        if self._shade_cells is None:
            self._shade_cells = station_shade.reachable(self.hass.config.latitude, self.hass.config.longitude)
        return self._shade_cells

    def shade_now(self) -> dict[str, float]:
        """The station's shade by cell, learned or declared: what the trust of its temperature reads (engine/station_place.py)."""
        cells = self.shade_cells()
        return station_shade.filled({k: v for k, v in self.shade.items() if k in cells}, cells, self.settings.station_shade)

    def shade_view(self) -> dict[str, Any]:
        """What the other bricks read (api.py `station_shade`)."""
        cells = self.shade_cells()
        learned = {k: v for k, v in self.shade.items() if k in cells}
        return {"sensor": self.settings.solar_radiation_entity, "declared": self.settings.station_shade,
                "cells": station_shade.filled(learned, cells, self.settings.station_shade),
                "learned": len(learned), "reachable": len(cells), "hours": self.shade_hours,
                "learned_at": self.shade_learned_at.isoformat() if self.shade_learned_at else None,
                "steps": [station_shade.AZIMUTH_STEP, station_shade.ELEVATION_STEP]}

    def trust_view(self) -> dict[str, Any]:
        """How far each of the station's measures can be trusted, and what is retained now (api.py `station_trust`)."""
        hass = self.hass
        zone = ZoneInfo(hass.config.time_zone)
        now = dt_util.now(zone)
        shade = self.shade_view() if self.settings.solar_radiation_entity else None
        out: dict[str, Any] = station_place.describe(self.settings, self.place_learned or {}, shade, now, zone,
                                                     hass.config.latitude, hass.config.longitude)
        retained = getattr(self, "retained", {}) or {}
        for key, row in out.items():
            row.update(retained.get(key) or {"now": "station"})
        return out
