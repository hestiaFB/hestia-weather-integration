"""Gathers what the engine needs from Home Assistant, runs it, and shares the result with the sensors and the cards.

Sensor changes recompute everything within a couple of seconds; forecasts, history and rain statistics are fetched on their
own rhythm, in the background, and never block a recomputation."""
from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field, replace
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
from .engine.compute import Result, compute
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
from .place.records import RecordsMixin

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
    views: dict[str, dict[str, Any]] = field(default_factory=dict)
    """The card's view in the other languages its cards are shown in (English, German), computed with the French one."""


def language_code(language: str | None) -> str:
    """Only the languages Hestia Weather speaks, English for any other: a client cannot ask for others."""
    code = (language or "").lower().replace("_", "-").split("-")[0] or "fr"
    return code if code == "fr" or code in DICTIONARIES else "en"


@dataclass(frozen=True)
class Inputs:
    """What one calculation reads, gathered on the event loop: the calculation itself then runs in a worker thread
    (docs/PLAN-OPTIMISATION.md, point 6), never touching the coordinator nor Home Assistant's registries."""

    states: dict[str, Any]
    """The configured sensors' states at the start; any other one is read from the state machine."""
    read: Callable[[str], Any]
    settings: Settings
    hours: list[Hour]
    days: list[Day]
    history: dict[str, list[Change]]
    rain_history: dict[str, list[Change]]
    statistics: list[Statistic]
    statistics_unit: str | None
    now: datetime
    zone: ZoneInfo
    latitude: float
    longitude: float
    elevation: float
    platforms: dict[str, str]
    original_condition: str | None
    radar_entity: str | None
    strikes: lightning.Lightning | None
    air_forecast: open_meteo.Data | None
    pressure_forecast: open_meteo_forecast.Data | None
    place_learned: dict[str, Any]
    shade: dict[str, float]

    def get(self, entity_id: str) -> Any:
        state = self.states.get(entity_id)
        return state if state is not None else self.read(entity_id)


@dataclass(frozen=True)
class Calculation:
    result: Result
    view: dict[str, Any]
    retained: dict[str, dict[str, Any]]
    rain_ahead: dict[str, Any]


def station_overlay(i: Inputs, settings: Settings, get: Callable[[str], Any]) -> tuple[Settings, Callable[[str], Any]]:
    """The station's temperature and wind where they cannot be trusted now (docs/STATION-EMPLACEMENT.md)."""
    if not (settings.temperature_entity or settings.wind_speed_entity or settings.wind_gust_entity):
        return settings, get
    return station_place.overlay(settings, get, i.place_learned, i.hours, i.now, i.zone, i.latitude, i.longitude, i.shade)


def retained_now(settings: Settings, get: Callable[[str], Any]) -> dict[str, dict[str, Any]]:
    """What is retained when it is not the station's own reading (api.py `station_trust`)."""
    out: dict[str, dict[str, Any]] = {}
    for key, entity_id in (("temperature", settings.temperature_entity), ("wind", settings.wind_gust_entity or settings.wind_speed_entity)):
        note = settings.station_notes.get(key)
        state = get(entity_id) if entity_id and note is not None else None
        if note is not None:
            out[key] = {"now": note.how, "why": note.text(), "value": station_place.finite(state.state) if state is not None else None}
    return out


def calculate(i: Inputs, language: str) -> Calculation:
    """One calculation in one language, from the inputs alone: the only way a view is computed. Runs in a worker thread;
    its language belongs to the thread (engine/i18n.py), so a calculation in English never lends its words to another."""
    with localized(language):
        # WAQI's station today and Open-Meteo tomorrow stand where Atmo France's air sensors would be.
        settings, get = station_overlay(i, *waqi.overlay(i.settings, i.get, i.air_forecast, i.now, i.zone))
        result = compute(get, settings, open_meteo_forecast.fill(i.hours, i.pressure_forecast), i.days, i.history, i.rain_history,
                         i.statistics, i.statistics_unit, i.now, i.zone, i.latitude, i.elevation, i.platforms, i.original_condition, i.strikes)
        view = to_json(result.view)
        retained = retained_now(settings, get)
    radar = i.get(i.radar_entity) if i.radar_entity else None
    return Calculation(result, view, retained, rain_ahead(radar.attributes if radar else None, i.hours, i.now))


def calculate_all(i: Inputs, languages: list[str]) -> tuple[Calculation, dict[str, dict[str, Any]]]:
    """The French calculation (sensors, events, French cards), then the view in each other language a card is shown in."""
    french = calculate(i, "fr")
    return french, {code: calculate(i, code).view for code in languages if code != "fr"}


type HestiaWeatherConfigEntry = ConfigEntry[HestiaWeatherCoordinator]


def alert_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    """The alerts in progress of one place, kept across restarts so that a restart neither repeats nor forgets them."""
    return Store(hass, 1, f"{DOMAIN}.alertes.{entry_id}")




class HestiaWeatherCoordinator(RecorderMixin, ForecastsMixin, ShadeMixin, RecordsMixin, DataUpdateCoordinator[Snapshot]):
    config_entry: HestiaWeatherConfigEntry

    def __init__(self, hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> None:
        super().__init__(hass, LOGGER, config_entry=entry, name=f"{DOMAIN} {entry.title}", update_interval=TICK, always_update=False,
                         # A station sends its sensors one after another: the calculation waits for the whole batch and runs once
                         # (docs/PLAN-OPTIMISATION.md, point 3), instead of once for the first sensor and again for the others.
                         request_refresh_debouncer=Debouncer(hass, LOGGER, cooldown=DEBOUNCE_SECONDS, immediate=False))
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
        self._languages: dict[str, int] = {}
        """How many cards follow this place in each language other than French (websocket.py)."""
        self._inputs: Inputs | None = None
        self._meteo_france: tuple[str | None, str | None] | None = None
        """Météo-France's description and radar sensors beside the weather entity, looked up once per registry change."""
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
        self._records_init()

    async def async_start(self) -> None:
        """First fetches, then listen to the sensors and keep each source fresh."""
        registry = er.async_get(self.hass)
        ids = self.settings.entity_ids()
        self.platforms = {e.entity_id: e.platform for e in registry.entities.values() if e.entity_id in ids}
        entry = self.config_entry
        self.watch = AlertWatch(await self._store.async_load())
        await self._load_records_store()
        # Listen first: a weather service that starts while the first fetches run is caught at once.
        entry.async_on_unload(async_track_state_change_event(self.hass, sorted(ids), self._on_state_change))
        entry.async_on_unload(self.hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, self._registry_changed))
        # Beside them, in a worker thread: where the sun can be over a year here (8 784 positions), which the station's shade
        # reads; computed on the event loop at the first calculation, it held Home Assistant up at start (point 5 of the plan).
        await asyncio.gather(self._load_forecasts(), self._load_history(), self._load_rain(), self._load_week(), self._load_air_forecast(),
                             self._load_strikes(), self._load_lightning_month(), self._load_records(), self.hass.async_add_executor_job(self.shade_cells))
        for interval, load in ((FORECAST_INTERVAL, self._load_forecasts), (HISTORY_INTERVAL, self._load_history), (RAIN_INTERVAL, self._load_rain),
                               (WEEK_INTERVAL, self._load_week), (AIR_INTERVAL, self._load_air_forecast), (AIR_INTERVAL, self._load_pressure_forecast), (RAIN_INTERVAL, self._load_lightning_month),
                               (WEEK_INTERVAL, self._load_shade), (WEEK_INTERVAL, self._load_records)):
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
        inputs = self._gather()
        languages = sorted(code for code, count in self._languages.items() if count > 0)
        # The calculation leaves the event loop: Home Assistant answers on while it runs (point 6 of the plan).
        french, views = await self.hass.async_add_executor_job(calculate_all, inputs, languages)
        return self._publish(inputs, french, views)

    def _gather(self) -> Inputs:
        """What the calculation reads, taken now on the event loop."""
        hass = self.hass
        now = dt_util.now()
        settings = self.settings
        strikes = None
        if settings.lightning_entity:
            sensor = hass.states.get(settings.lightning_entity)
            self.strikes = lightning.keep(self.strikes, now.timestamp())
            strikes = lightning.read(self.strikes, now.timestamp(), sensor is not None and sensor.state != STATE_UNAVAILABLE, self.lightning_month)
        description, radar = self._meteo_france_sensors()
        states = {entity_id: hass.states.get(entity_id) for entity_id in (*settings.entity_ids(), description, radar) if entity_id}
        config = hass.config
        self._inputs = Inputs(
            states=states, read=hass.states.get, settings=settings, hours=self.hours, days=self.days, history=self.history,
            rain_history=self.rain_history, statistics=self.statistics, statistics_unit=self.statistics_unit, now=now,
            zone=ZoneInfo(config.time_zone), latitude=config.latitude, longitude=config.longitude, elevation=config.elevation or 0,
            platforms=self.platforms, original_condition=description, radar_entity=radar, strikes=strikes,
            air_forecast=self.air_forecast, pressure_forecast=self.pressure_forecast, place_learned=self.place_learned,
            # The shade only matters to a station declared against a wall or on the roof, before the nights have learned it.
            shade=self.shade_now() if settings.station_side else {})
        return self._inputs

    def _publish(self, inputs: Inputs, french: Calculation, views: dict[str, dict[str, Any]]) -> Snapshot:
        """Back on the event loop: the alerts' events, then the snapshot the sensors and the cards read."""
        hass, now = self.hass, inputs.now
        self.retained = french.retained
        events = self.watch.update(french.result.catalogue, now)
        if events:
            self._store.async_delay_save(self.watch.as_dict, 10)
        for event in events:
            payload = {"lieu": self.config_entry.title, "entry_id": self.config_entry.entry_id, "type": event.type,
                       "etat": event.phase, "niveau": event.level, "source": event.source, "texte": event.text}
            hass.bus.async_fire(ALERT_EVENT, payload)
            # The former name keeps firing, so that an automation written by hand keeps working.
            hass.bus.async_fire(legacy.ALERT_EVENT, payload)
        result = french.result
        # The days in Météo-France's heatwave vigilance, for the records.
        self._count_heatwave(result.catalogue.get("canicule"), now.astimezone(inputs.zone).date())
        return Snapshot(result.local, result.brief, result.derived, french.view, result.catalogue, self.watch.states(), now,
                        french.rain_ahead, views)

    def _meteo_france_sensors(self) -> tuple[str | None, str | None]:
        if self._meteo_france is None:
            registry, weather = er.async_get(self.hass), self.settings.weather_entity
            self._meteo_france = (original_condition(registry, weather), radar_rain(registry, weather))
        return self._meteo_france

    @callback
    def _registry_changed(self, _: Event) -> None:
        # A sensor enabled or removed beside the weather entity: looked up again at the next calculation.
        self._meteo_france = None

    @callback
    def async_want_language(self, language: str | None) -> Callable[[], None]:
        """A card follows this place in `language`: its view is computed with each calculation while the card is there.
        Returns what to call when the card leaves."""
        code = language_code(language)
        if code == "fr":
            return lambda: None
        self._languages[code] = self._languages.get(code, 0) + 1
        if self.data is not None and code not in self.data.views and self._inputs is not None:
            # The first card in this language: its view now, without waiting for the next calculation.
            self.config_entry.async_create_background_task(self.hass, self._add_language(code, self._inputs), f"{DOMAIN} {code}")

        def leave() -> None:
            self._languages[code] = max(0, self._languages.get(code, 0) - 1)
        return leave

    async def _add_language(self, code: str, inputs: Inputs) -> None:
        view = (await self.hass.async_add_executor_job(calculate, inputs, code)).view
        snapshot = self.data
        # A calculation that came in between already has it, from newer inputs.
        if snapshot is not None and inputs is self._inputs and code not in snapshot.views:
            self.data = replace(snapshot, views={**snapshot.views, code: view})
            self.async_update_listeners()

    def view_for(self, language: str | None) -> dict[str, Any] | None:
        """The current card view in one dashboard user's language, or None while it is being computed (async_want_language).
        Each language is computed with the French one, in the worker thread: never here, on the event loop."""
        snapshot = self.data
        if snapshot is None:
            return None
        code = language_code(language)
        return snapshot.view if code == "fr" else snapshot.views.get(code)

    # ---- Sources ----




















