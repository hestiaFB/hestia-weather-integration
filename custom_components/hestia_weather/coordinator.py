"""Gathers what the engine needs from Home Assistant, runs it, and shares the result with the sensors and the cards.

Sensor changes recompute everything within a couple of seconds; forecasts, history and rain statistics are fetched on their
own rhythm, in the background, and never block a recomputation."""
from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, STATE_UNAVAILABLE
from homeassistant.core import CoreState, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from zoneinfo import ZoneInfo
from .engine import legacy
from .const import AIR_INTERVAL, DEBOUNCE_SECONDS, DOMAIN, FORECAST_INTERVAL, HISTORY_INTERVAL, LOGGER, RAIN_INTERVAL, TICK, WEEK_INTERVAL
from .engine import lightning, open_meteo, open_meteo_forecast, station_place, waqi
from .engine.i18n import DICTIONARIES, localized
from .engine.brief import Brief
from .engine.catalogue import Item
from .engine.compute import compute
from .engine.forecast import Day, Hour
from .engine.local import LocalWeather
from .engine.nowcast import rain_ahead
from .engine.settings import Settings
from .engine.station import Derived, Statistic
from .engine.trends import Change
from .engine.view import to_json
from .engine.watch import AlertState, AlertWatch
from .place.shared import FORECAST_KINDS, RAIN_UNITS, _ready, _seconds, blitzortung_counter  # noqa: F401 - also read by the tests
from .place.recorder import RecorderMixin
from .place.forecasts import ForecastsMixin
from .place.shade import ShadeMixin

ALERT_EVENT = f"{DOMAIN}_alerte"

"""Forecast types and their bit in the weather entity's supported features."""


def original_condition(registry: er.EntityRegistry, weather_entity: str) -> str | None:
    """Météo-France's sensor of its own description (« Bruine », « Brouillard givrant »…), beside the weather entity.
    Home Assistant creates it disabled: it counts only once the user has enabled it. The daily one is left aside."""
    weather = registry.async_get(weather_entity)
    if weather is None or weather.platform != "meteo_france" or not weather.config_entry_id:
        return None
    for entry in er.async_entries_for_config_entry(registry, weather.config_entry_id):
        unique_id = str(entry.unique_id)
        if (entry.domain == "sensor" and not entry.disabled_by and unique_id.endswith("_original_condition")
                and not unique_id.endswith("_daily_original_condition")):
            return entry.entity_id
    return None


def radar_rain(registry: er.EntityRegistry, weather_entity: str) -> str | None:
    """Météo-France's « rain within the hour » sensor (radar, five minutes at a time), beside the weather entity."""
    weather = registry.async_get(weather_entity)
    if weather is None or weather.platform != "meteo_france" or not weather.config_entry_id:
        return None
    return next((entry.entity_id for entry in er.async_entries_for_config_entry(registry, weather.config_entry_id)
                 if entry.domain == "sensor" and not entry.disabled_by and str(entry.unique_id).endswith("_next_rain")), None)


@dataclass(frozen=True)
class Snapshot:
    """Everything known at one moment: the typed results for the sensors, and the view the cards draw."""

    local: LocalWeather
    brief: Brief
    derived: Derived | None
    view: dict[str, Any]
    catalogue: dict[str, Item]
    alerts: dict[str, AlertState]
    """The alerts in progress, held a little after they stop being observed."""
    computed: datetime = field(compare=False)
    rain_ahead: dict[str, Any] = field(default_factory=dict)
    """When the next rain starts, to the minute from Météo-France's radar when it is there."""


type HestiaWeatherConfigEntry = ConfigEntry[HestiaWeatherCoordinator]


def alert_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    """The alerts in progress of one place, kept across restarts so that a restart neither repeats nor forgets them."""
    return Store(hass, 1, f"{DOMAIN}.alertes.{entry_id}")




class HestiaWeatherCoordinator(RecorderMixin, ForecastsMixin, ShadeMixin, DataUpdateCoordinator[Snapshot]):
    config_entry: HestiaWeatherConfigEntry

    def __init__(self, hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> None:
        super().__init__(hass, LOGGER, config_entry=entry, name=f"{DOMAIN} {entry.title}", update_interval=TICK, always_update=False,
                         request_refresh_debouncer=Debouncer(hass, LOGGER, cooldown=DEBOUNCE_SECONDS, immediate=True))
        self.settings = Settings.from_options(entry.options)
        self.hours: list[Hour] = []
        self.days: list[Day] = []
        self.forecast_rows: dict[str, list[dict[str, Any]]] = {"hourly": [], "daily": []}
        """The provider's forecasts in the engine's units, passed on by the Hestia Weather weather entity."""
        self.forecast_version = 0
        self.forecast_at: datetime | None = None
        """When the hourly forecast last arrived, for the Hestia-FB panel."""
        self.watch = AlertWatch()
        self._store = alert_store(hass, entry.entry_id)
        self.history: dict[str, list[Change]] = {}
        self.rain_history: dict[str, list[Change]] = {}
        self.statistics: list[Statistic] = []
        self.statistics_unit: str | None = None
        self.platforms: dict[str, str] = {}
        self.air_forecast: open_meteo.Data | None = None
        """Tomorrow's air from Open-Meteo, only when WAQI gives the air: WAQI has no forecast."""
        self._air_tried: datetime | None = None
        self.pressure_forecast: open_meteo_forecast.Data | None = None
        """The forecast pressure from Open-Meteo, only when the weather service gives none (Météo-France)."""
        self._pressure_tried: datetime | None = None
        self.strikes: list[lightning.Strike] = []
        """Blitzortung's strikes of the last hour: its sensor only keeps the last one."""
        self.lightning_month: int | None = None
        """Strikes Blitzortung counted since the first of the month, when its counter keeps statistics."""
        self._cancel_retry: Callable[[], None] | None = None
        self._stop_listeners: set[Callable[[], None]] = set()
        self._retries = 0
        self._unlisten_started: Callable[[], None] | None = None
        self._localized_views: dict[str, tuple[datetime, dict[str, Any]]] = {}
        self._statistics_warned = False
        self.shade: dict[str, float] = {}
        """The station's shade by the sun's position, learned at night (place/shade.py)."""
        self.shade_learned_at: datetime | None = None
        self.shade_hours = 0
        self._shade_store = None
        self._shade_cells: frozenset[str] | None = None
        self.place_learned: dict[str, Any] = {}
        """How far the station's temperature, wind and rain can be trusted, learned at night (engine/station_place.py)."""
        self._place_store = None
        self.retained: dict[str, dict[str, Any]] = {}
        """What was retained at the last calculation when it is not the station's own reading (api.py `station_trust`)."""

    async def async_start(self) -> None:
        """First fetches, then listen to the sensors and keep each source fresh."""
        registry = er.async_get(self.hass)
        ids = self.settings.entity_ids()
        self.platforms = {e.entity_id: e.platform for e in registry.entities.values() if e.entity_id in ids}
        entry = self.config_entry
        self.watch = AlertWatch(await self._store.async_load())
        # Listen first: a weather service that starts while the first fetches run is caught at once.
        entry.async_on_unload(async_track_state_change_event(self.hass, sorted(ids), self._on_state_change))
        await asyncio.gather(self._load_forecasts(), self._load_history(), self._load_rain(), self._load_week(), self._load_air_forecast(),
                             self._load_strikes(), self._load_lightning_month())
        for interval, load in ((FORECAST_INTERVAL, self._load_forecasts), (HISTORY_INTERVAL, self._load_history), (RAIN_INTERVAL, self._load_rain),
                               (WEEK_INTERVAL, self._load_week), (AIR_INTERVAL, self._load_air_forecast), (AIR_INTERVAL, self._load_pressure_forecast), (RAIN_INTERVAL, self._load_lightning_month),
                               (WEEK_INTERVAL, self._load_shade)):
            entry.async_on_unload(async_track_time_interval(self.hass, self._in_background(load), interval))
        # The station's shade: what was kept now, learned again in the background (92 days of statistics, Open-Meteo).
        self._in_background(self._load_shade)(dt_util.utcnow())
        entry.async_on_unload(self._cancel_forecast_retry)
        entry.async_on_unload(self._stopped)
        if self.hass.state is not CoreState.running:
            # Many weather services only compute their forecast once Home Assistant has started: ask again then.
            self._unlisten_started = self.hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, self._on_started)
            entry.async_on_unload(self._stop_listening_started)
        await self.async_config_entry_first_refresh()

    @callback
    def _on_started(self, _: Event) -> None:
        self._unlisten_started = None
        self._cancel_forecast_retry()
        self._in_background(self._load_forecasts)(dt_util.utcnow())

    @callback
    def _stop_listening_started(self) -> None:
        # A listener that already fired is gone: removing it again would log an error.
        if self._unlisten_started:
            self._unlisten_started()
            self._unlisten_started = None

    @callback
    def async_add_stop_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        """Called when this place stops (new settings, removal): a card can then subscribe again."""
        self._stop_listeners.add(listener)
        return lambda: self._stop_listeners.discard(listener)

    @callback
    def _stopped(self) -> None:
        for listener in list(self._stop_listeners):
            listener()
        self._stop_listeners.clear()

    @callback
    def _on_state_change(self, event: Event[EventStateChangedData]) -> None:
        data = event.data
        if data["entity_id"] == self.settings.lightning_entity and data["new_state"] is not None:
            # Each new distance is a strike; « unknown » after a quiet spell is not one.
            new = data["new_state"]
            strike = lightning.strike_of(new, new.last_updated.timestamp(), self.hass.config.latitude, self.hass.config.longitude)
            if strike is not None:
                self.strikes = lightning.keep([*self.strikes, strike], dt_util.utcnow().timestamp())
        if data["entity_id"] == self.settings.weather_entity and _ready(data["new_state"]) and not _ready(data["old_state"]):
            # The weather service has just started (or is back): its forecast is fetched now, not at the next retry.
            self._cancel_forecast_retry()
            self.config_entry.async_create_background_task(self.hass, self._load_then_refresh(self._load_forecasts), f"{DOMAIN} forecasts")
        if self.data is not None:
            self.config_entry.async_create_task(self.hass, self.async_request_refresh())

    def _in_background(self, load: Callable[[], Coroutine[Any, Any, None]]) -> Callable[[datetime], None]:
        @callback
        def run(_: datetime) -> None:
            self.config_entry.async_create_background_task(self.hass, self._load_then_refresh(load), f"{DOMAIN} {load.__name__}")
        return run

    async def _load_then_refresh(self, load: Callable[[], Coroutine[Any, Any, None]]) -> None:
        await load()
        await self.async_request_refresh()

    async def _async_update_data(self) -> Snapshot:
        return self._compute()

    def _compute(self) -> Snapshot:
        hass = self.hass
        now = dt_util.now()
        zone = ZoneInfo(hass.config.time_zone)
        # WAQI's station today and Open-Meteo tomorrow stand where Atmo France's air sensors would be.
        settings, get = self._station_overlay(*waqi.overlay(self.settings, hass.states.get, self.air_forecast, now, zone), now, zone)
        self.retained = self._retained(settings, get)
        strikes = None
        if settings.lightning_entity:
            sensor = hass.states.get(settings.lightning_entity)
            self.strikes = lightning.keep(self.strikes, now.timestamp())
            strikes = lightning.read(self.strikes, now.timestamp(), sensor is not None and sensor.state != STATE_UNAVAILABLE, self.lightning_month)
        # Sensors and events keep their established French values. A card is
        # rendered separately in its dashboard user's language by view_for().
        with localized("fr"):
            result = compute(get, settings, open_meteo_forecast.fill(self.hours, self.pressure_forecast), self.days, self.history, self.rain_history, self.statistics, self.statistics_unit,
                             now, zone, hass.config.latitude, hass.config.elevation or 0, self.platforms,
                             original_condition(er.async_get(hass), settings.weather_entity), strikes)
        self._localized_views.clear()
        events = self.watch.update(result.catalogue, now)
        if events:
            self._store.async_delay_save(self.watch.as_dict, 10)
        for event in events:
            payload = {"lieu": self.config_entry.title, "entry_id": self.config_entry.entry_id, "type": event.type,
                       "etat": event.phase, "niveau": event.level, "source": event.source, "texte": event.text}
            hass.bus.async_fire(ALERT_EVENT, payload)
            # The former name keeps firing, so that an automation written by hand keeps working.
            hass.bus.async_fire(legacy.ALERT_EVENT, payload)
        radar = hass.states.get(radar_rain(er.async_get(hass), settings.weather_entity) or "")
        ahead = rain_ahead(radar.attributes if radar else None, self.hours, now)
        return Snapshot(result.local, result.brief, result.derived, to_json(result.view), result.catalogue, self.watch.states(), now, ahead)

    def _station_overlay(self, settings: Settings, get: Callable[[str], Any], now: datetime, zone: ZoneInfo) -> tuple[Settings, Callable[[str], Any]]:
        """The station's temperature and wind where they cannot be trusted now (docs/STATION-EMPLACEMENT.md)."""
        if not (settings.temperature_entity or settings.wind_speed_entity or settings.wind_gust_entity):
            return settings, get
        config = self.hass.config
        # The shade only matters to a station declared against a wall or on the roof, before the nights have learned it.
        shade = self.shade_now() if settings.station_side else {}
        return station_place.overlay(settings, get, self.place_learned, self.hours, now, zone, config.latitude, config.longitude, shade)

    @staticmethod
    def _retained(settings: Settings, get: Callable[[str], Any]) -> dict[str, dict[str, Any]]:
        out: dict[str, dict[str, Any]] = {}
        for key, entity_id in (("temperature", settings.temperature_entity), ("wind", settings.wind_gust_entity or settings.wind_speed_entity)):
            note = settings.station_notes.get(key)
            state = get(entity_id) if entity_id and note is not None else None
            if note is not None:
                out[key] = {"now": note.how, "why": note.text(), "value": station_place.finite(state.state) if state is not None else None}
        return out

    def view_for(self, language: str | None) -> dict[str, Any] | None:
        """Return the current card view in one dashboard user's language.

        The coordinator is shared by every dashboard user, but each browser may
        have its own language. This recomputes only the display projection; it
        never changes alerts, sensors, stored state, or automation values.
        """
        snapshot = self.data
        if snapshot is None:
            return None
        code = (language or "").lower().replace("_", "-").split("-")[0] or "fr"
        # Only the languages Hestia Weather speaks, English for any other: a client cannot fill the cache with others.
        if code != "fr" and code not in DICTIONARIES:
            code = "en"
        # French is the view computed with the sensors: nothing to compute again.
        if code == "fr":
            return snapshot.view
        cached = self._localized_views.get(code)
        if cached is not None and cached[0] == snapshot.computed:
            return cached[1]
        zone = ZoneInfo(self.hass.config.time_zone)
        settings, get = self._station_overlay(*waqi.overlay(self.settings, self.hass.states.get, self.air_forecast, snapshot.computed, zone),
                                              snapshot.computed, zone)
        strikes = None
        if settings.lightning_entity:
            sensor = self.hass.states.get(settings.lightning_entity)
            strikes = lightning.read(self.strikes, snapshot.computed.timestamp(), sensor is not None and sensor.state != STATE_UNAVAILABLE,
                                     self.lightning_month)
        with localized(code):
            result = compute(get, settings, open_meteo_forecast.fill(self.hours, self.pressure_forecast), self.days, self.history, self.rain_history, self.statistics, self.statistics_unit,
                             snapshot.computed, zone, self.hass.config.latitude, self.hass.config.elevation or 0, self.platforms,
                             original_condition(er.async_get(self.hass), settings.weather_entity), strikes)
            view = to_json(result.view)
        self._localized_views[code] = (snapshot.computed, view)
        return view

    # ---- Sources ----




















