"""A place's forecasts from its weather service, retried while it starts, and from Open-Meteo tomorrow's air and the pressure to come."""
from __future__ import annotations

from datetime import timedelta
import aiohttp
import asyncio
from typing import TYPE_CHECKING, Any, cast

from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_call_later
from homeassistant.util import dt as dt_util

from ..const import FORECAST_RETRY, LOGGER
from ..engine import open_meteo, open_meteo_forecast
from ..engine.forecast import Units, engine_rows, parse_days, parse_hours
from zoneinfo import ZoneInfo
from .shared import FORECAST_KINDS, _ready

if TYPE_CHECKING:
    from collections.abc import Callable, Coroutine
    from datetime import datetime

    from homeassistant.core import HomeAssistant

    from ..engine.forecast import Day, Hour
    from ..engine.settings import Settings


class ForecastsMixin:
    """Part of HestiaWeatherCoordinator: its methods use the coordinator's own state (self)."""

    # The coordinator's state these methods read and write (set in coordinator.py).
    hass: HomeAssistant
    config_entry: Any
    settings: Settings
    hours: list[Hour]
    days: list[Day]
    forecast_rows: dict[str, list[dict[str, Any]]]
    forecast_version: int
    forecast_at: datetime | None
    air_forecast: open_meteo.Data | None
    _air_tried: datetime | None
    pressure_forecast: open_meteo_forecast.Data | None
    _pressure_tried: datetime | None
    _cancel_retry: Callable[[], None] | None
    _retries: int
    if TYPE_CHECKING:
        def _in_background(self, load: Callable[[], Coroutine[Any, Any, None]]) -> Callable[[datetime], None]: ...

    async def _load_forecasts(self) -> None:
        """Hourly and daily forecasts, in the weather entity's units. A failure is retried a minute later, never shown as « no rain »."""
        entity_id = self.settings.weather_entity
        state = self.hass.states.get(entity_id)
        if state is None or not _ready(state):
            # The weather service has not started yet: Home Assistant may show a placeholder that answers with an empty forecast.
            self._schedule_forecast_retry()
            return
        features = int(state.attributes.get("supported_features") or 0)
        failed = False

        async def fetch(kind: str, bit: int) -> list[dict[str, Any]]:
            nonlocal failed
            if not features & bit:
                return []
            try:
                response = await self.hass.services.async_call("weather", "get_forecasts", {"type": kind}, blocking=True,
                                                               target={"entity_id": entity_id}, return_response=True)
            except HomeAssistantError as err:
                LOGGER.debug("No %s forecast from %s: %s", kind, entity_id, err)
                failed = True
                return []
            # The service's answer: {entity_id: {"forecast": [rows]}}.
            answer = cast(dict[str, Any], response or {})
            rows = list((answer.get(entity_id) or {}).get("forecast") or [])
            # A service offering this forecast that answers with nothing is not ready yet: ask again shortly.
            failed = failed or not rows
            return rows

        daily, hourly = await asyncio.gather(*(fetch(kind, bit) for kind, bit in FORECAST_KINDS))
        attributes = state.attributes
        units = Units(attributes.get("temperature_unit") or "°C", attributes.get("precipitation_unit") or "mm", attributes.get("wind_speed_unit") or "km/h",
                      attributes.get("pressure_unit") or "hPa")
        # A failed request keeps the previous forecast rather than replacing it with nothing.
        if hourly or not failed:
            self.hours = parse_hours(hourly, units)
            self.forecast_rows["hourly"] = engine_rows(hourly, units)
        if hourly:
            self.forecast_at = dt_util.utcnow()
        if daily or not failed:
            self.days = parse_days(daily, units)
            self.forecast_rows["daily"] = engine_rows(daily, units)
        self.forecast_version += 1
        self._cancel_forecast_retry()
        if failed:
            self._schedule_forecast_retry()
        else:
            self._retries = 0
        await self._load_pressure_forecast()

    async def _load_air_forecast(self) -> None:
        """Tomorrow's air from Open-Meteo, at the home's position, each hour; a failure keeps the previous forecast and is retried ten minutes later."""
        now = dt_util.utcnow()
        if self.settings.air_source != "waqi" or not open_meteo.due(self.air_forecast, self._air_tried, now):
            return
        self._air_tried = now
        hass = self.hass
        try:
            params = open_meteo.params(hass.config.latitude, hass.config.longitude, ZoneInfo(hass.config.time_zone))
            async with asyncio.timeout(30), async_get_clientsession(hass).get(open_meteo.URL, params=params) as response:
                response.raise_for_status()
                payload = await response.json()
            self.air_forecast = open_meteo.parse(payload, now)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            LOGGER.warning("Open-Meteo air forecast unavailable: %s", err)

    async def _load_pressure_forecast(self) -> None:
        """The pressure to come from Open-Meteo, when the weather service gives none and the place allows it; refreshed each hour,
        a failure keeps the previous forecast and is retried ten minutes later."""
        now = dt_util.utcnow()
        if not open_meteo_forecast.needed(self.settings.open_meteo_pressure, self.hours):
            self.pressure_forecast = None
            return
        if not open_meteo_forecast.due(self.pressure_forecast, self._pressure_tried, now):
            return
        self._pressure_tried = now
        hass = self.hass
        try:
            params = open_meteo_forecast.params(hass.config.latitude, hass.config.longitude)
            async with asyncio.timeout(30), async_get_clientsession(hass).get(open_meteo_forecast.URL, params=params) as response:
                response.raise_for_status()
                payload = await response.json()
            self.pressure_forecast = open_meteo_forecast.parse(payload, now)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            LOGGER.warning("Open-Meteo pressure forecast unavailable: %s", err)

    @callback
    def _schedule_forecast_retry(self) -> None:
        # Soon after a start (10 s, 20 s, 40 s), then every minute while the service stays silent.
        delay = min(FORECAST_RETRY, timedelta(seconds=10 * 2 ** self._retries))
        self._retries += 1
        self._cancel_forecast_retry()
        self._cancel_retry = async_call_later(self.hass, delay, self._in_background(self._retry_forecasts))

    async def _retry_forecasts(self) -> None:
        self._cancel_retry = None
        await self._load_forecasts()

    @callback
    def _cancel_forecast_retry(self) -> None:
        if self._cancel_retry:
            self._cancel_retry()
            self._cancel_retry = None
