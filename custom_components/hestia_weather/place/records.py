"""What a place reads for its records (issue #16, engine/records.py): the station's long-term statistics, Open-Meteo's archive since 1940,
and the days in Météo-France's heatwave vigilance. Each source is read only while one of its entities is enabled."""
from __future__ import annotations

import asyncio
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any, Literal, cast

import aiohttp
from homeassistant.components.recorder import get_instance, statistics
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.core import callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from zoneinfo import ZoneInfo

from ..const import DOMAIN, LOGGER
from ..engine import records
from ..engine.catalogue import Item
from ..engine.station import Statistic, steady_sums
from ..engine.units import Kind, measurement
from .shared import RAIN_UNITS, _seconds

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from ..engine.settings import Settings

FIRST_STATISTICS = date(2000, 1, 1)
"""Long-term statistics start with the sensor: reading from 2000 reads all of them."""
STATION_KEYS = tuple(f"record_{k}" for k in records.MARKS) + records.COUNTS
PLACE_KEYS = tuple(f"{k}_lieu" for k in STATION_KEYS)
HEATWAVE_KEY = "jours_canicule"
KEYS = (*STATION_KEYS, *PLACE_KEYS, HEATWAVE_KEY)
SOURCES = ("station", "lieu")


def records_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    return Store(hass, 1, f"{DOMAIN}.records.{entry_id}")


class RecordsMixin:
    """Part of HestiaWeatherCoordinator: its methods use the coordinator's own state (self)."""

    hass: HomeAssistant
    settings: Settings
    config_entry: ConfigEntry
    _statistics_failed: Any
    _sum_unit: Any

    def _records_init(self) -> None:
        self.station_months: dict[str, records.Month] = {}
        self._station_sensors: list[str | None] = []
        self.place_months: dict[str, records.Month] = {}
        self._place_position: str | None = None
        self._place_fetched: datetime | None = None
        self._place_tried: datetime | None = None
        self.heatwave = records.Heatwave(frozenset(), None)
        self._records_store: Store[dict[str, Any]] | None = None
        self._records_cache: dict[str, tuple[date, records.Records]] = {}
        # The Records card (issue #17): the sources a card follows are read even with their entities disabled.
        self._records_cards: dict[str, int] = {}
        self._records_listeners: list[Callable[[], None]] = []
        self.records_loading: set[str] = set()
        # The local hour of the station's records, by (record, day): looked up in the hourly statistics of that day only.
        self.record_hours: dict[tuple[str, date], int] = {}
        self._hours_sensors: list[str | None] = []

    async def _load_records_store(self) -> None:
        self._records_store = records_store(self.hass, self.config_entry.entry_id)
        kept = await self._records_store.async_load() or {}
        station, place = kept.get("station") or {}, kept.get("lieu") or {}
        self.station_months = records.load_months(station.get("months"))
        self._station_sensors = list(station.get("sensors") or [])
        self.place_months = records.load_months(place.get("months"))
        self._place_position = place.get("position")
        try:
            self._place_fetched = datetime.fromisoformat(place["fetched"]) if place.get("fetched") else None
        except (TypeError, ValueError):
            self._place_fetched = None
        self.heatwave = records.Heatwave.from_dict(kept.get("canicule"))

    def _records_data(self) -> dict[str, Any]:
        return {"station": {"months": {k: m.as_dict() for k, m in self.station_months.items()}, "sensors": self._station_sensors},
                "lieu": {"months": {k: m.as_dict() for k, m in self.place_months.items()}, "position": self._place_position,
                         "fetched": self._place_fetched.isoformat() if self._place_fetched else None},
                "canicule": self.heatwave.as_dict()}

    def _save_records(self) -> None:
        if self._records_store is not None:
            self._records_store.async_delay_save(self._records_data, 10)

    def _wanted(self, keys: tuple[str, ...]) -> bool:
        """At least one of these entities is enabled, or a Records card follows the source: the source is worth reading."""
        source = "station" if keys == STATION_KEYS else "lieu" if keys == PLACE_KEYS else None
        if source and self._records_cards.get(source, 0) > 0:
            return True
        entry_id = self.config_entry.entry_id
        wanted = {f"{entry_id}_{key}" for key in keys}
        return any(e.unique_id in wanted and e.disabled_by is None
                   for e in er.async_entries_for_config_entry(er.async_get(self.hass), entry_id))

    def _today(self) -> date:
        return dt_util.now().date()

    def records_of(self, source: Literal["station", "lieu"]) -> records.Records:
        """The records of one source today, computed once per day and again when its months are read."""
        months = self.station_months if source == "station" else self.place_months
        today = self._today()
        cached = self._records_cache.get(source)
        if cached is not None and cached[0] == today:
            return cached[1]
        result = records.compute(months, today)
        self._records_cache[source] = (today, result)
        return result

    async def _load_records(self) -> None:
        await asyncio.gather(self._load_station_records(), self._load_place_records())

    # ---- The Records card ----

    @callback
    def async_follow_records(self, sources: list[str], changed: Callable[[], None]) -> Callable[[], None]:
        """A Records card follows these sources: they are read even with their entities disabled, at once when nothing is known yet,
        and `changed` is called each time they are read again. Returns what to call when the card leaves."""
        wanted = [s for s in sources if s in SOURCES]
        for source in wanted:
            self._records_cards[source] = self._records_cards.get(source, 0) + 1
        self._records_listeners.append(changed)
        missing = [s for s in wanted if not (self.station_months if s == "station" else self.place_months) and s not in self.records_loading]
        if missing:
            self.records_loading.update(missing)
            loads = [self._load_station_records() if s == "station" else self._load_place_records() for s in missing]

            async def first() -> None:
                try:
                    await asyncio.gather(*loads)
                finally:
                    self.records_loading.difference_update(missing)
                    self._records_changed()
            self.config_entry.async_create_background_task(self.hass, first(), f"{DOMAIN} records")

        @callback
        def leave() -> None:
            for source in wanted:
                self._records_cards[source] = max(0, self._records_cards.get(source, 0) - 1)
            if changed in self._records_listeners:
                self._records_listeners.remove(changed)
        return leave

    @callback
    def _records_changed(self) -> None:
        for listener in list(self._records_listeners):
            listener()

    def records_for_card(self) -> dict[str, Any]:
        """What the Records card shows: both sources (None while unknown), and those still being read for the first time."""
        today = self._today()
        return {"station": records.card_source(self.records_of("station"), self.record_hours, self.heatwave.count(today)),
                "lieu": records.card_source(self.records_of("lieu")), "loading": sorted(self.records_loading)}

    # ---- The station ----

    async def _load_station_records(self) -> None:
        """The station's days from its long-term statistics: all of them the first time, then the last two months."""
        s = self.settings
        if not self._wanted(STATION_KEYS):
            return
        rain_id = s.rain_total_entity if s.station_history and s.rain_total_entity else s.daily_rain_entity
        sensors = [s.temperature_entity, s.wind_gust_entity, rain_id]
        if not any(sensors):
            self.station_months = {}
            self._records_cache.pop("station", None)
            return
        zone = ZoneInfo(self.hass.config.time_zone)
        now, today = dt_util.utcnow(), self._today()
        # Other sensors than those read before: everything is read again.
        full = not self.station_months or sensors != self._station_sensors
        since = FIRST_STATISTICS if full else records.first_of_previous_month(today)
        start = datetime(since.year, since.month, since.day, tzinfo=zone)
        temperature = await self._daily(s.temperature_entity, start, now, {"temperature": "°C"}, ("min", "max")) if s.temperature_entity else []
        gusts = await self._daily(s.wind_gust_entity, start, now, {"speed": "km/h"}, ("max",)) if s.wind_gust_entity else []
        rain = await self._hourly_rain(rain_id, start, now) if rain_id else []
        if temperature is None or gusts is None or rain is None:
            # The Recorder did not answer: what was kept stays until the next try.
            return
        days = records.station_days([(_seconds(r["start"]), r.get("min"), r.get("max")) for r in temperature],
                                    [(_seconds(r["start"]), r.get("max")) for r in gusts], rain, zone)
        # Today is not over: its high, its low and its rain count tomorrow.
        fresh = records.summarise(d for d in days if d.day < today)
        self.station_months = fresh if full else records.merge(self.station_months, fresh, since)
        self._station_sensors = sensors
        self._records_cache.pop("station", None)
        self._save_records()
        await self._find_record_hours()
        self._records_changed()

    async def _find_record_hours(self) -> None:
        """The hour of each station record of all time, of the year and of the month: one day of hourly statistics for each record not
        known yet (a few small reads, the first time; then only when a record is beaten)."""
        s = self.settings
        sensors = {"chaleur": s.temperature_entity, "froid": s.temperature_entity, "rafale": s.wind_gust_entity}
        if [s.temperature_entity, s.wind_gust_entity] != self._hours_sensors:
            self.record_hours, self._hours_sensors = {}, [s.temperature_entity, s.wind_gust_entity]
        found, zone = self.records_of("station"), ZoneInfo(self.hass.config.time_zone)
        units = {"chaleur": {"temperature": "°C"}, "froid": {"temperature": "°C"}, "rafale": {"speed": "km/h"}}
        for key, kind in records.HOURLY.items():
            entity_id = sensors[key]
            if not entity_id:
                continue
            record = found.marks[key]
            for day in {m.day for m in (record.ever, record.year, record.month) if m is not None}:
                if (key, day) in self.record_hours:
                    continue
                start = datetime(day.year, day.month, day.day, tzinfo=zone)
                end = datetime.combine(day + timedelta(days=1), datetime.min.time(), zone)

                def during(entity_id: str = entity_id, start: datetime = start, end: datetime = end, key: str = key, kind: str = kind) -> list[Any]:
                    rows = statistics.statistics_during_period(self.hass, start, end, {entity_id}, "hour", units[key], cast(Any, {kind}))
                    return list(rows.get(entity_id, []))

                try:
                    rows = await get_instance(self.hass).async_add_executor_job(during)
                except Exception as err:  # noqa: BLE001 - the hour is a detail: the record shows without it
                    self._statistics_failed("Statistics unavailable for the hour of a record of %s: %s", entity_id, err)
                    return
                hour = records.hour_of([(_seconds(r["start"]), r.get(kind)) for r in rows], key == "froid", zone)
                if hour is not None:
                    self.record_hours[(key, day)] = hour

    async def _daily(self, entity_id: str, start: datetime, now: datetime, units: dict[str, str], kinds: tuple[str, ...]) -> list[Any] | None:
        """A sensor's daily statistics (local days), or None when the Recorder does not answer; empty without statistics."""
        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, now, {entity_id}, "day", units, cast(Any, set(kinds)))
            return list(rows.get(entity_id, []))

        try:
            return await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - records are optional: the weather goes on without them
            self._statistics_failed("Statistics unavailable for the records of %s: %s", entity_id, err)
            return None

    async def _hourly_rain(self, entity_id: str, start: datetime, now: datetime) -> list[tuple[float, float]] | None:
        """Each hour's rain (end of the hour, mm) from a rain counter's running sum, without the false rain of a counter that drops and comes back."""
        unit = await self._sum_unit(entity_id)
        if unit not in RAIN_UNITS:
            return []

        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, now, {entity_id}, "hour", None, {"sum", "state"})
            return list(rows.get(entity_id, []))

        try:
            rows = await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - records are optional
            self._statistics_failed("Rain statistics unavailable for the records of %s: %s", entity_id, err)
            return None
        sums = steady_sums([Statistic(_seconds(r["start"]), _seconds(r["end"]), r["sum"], r.get("state")) for r in rows if r.get("sum") is not None])
        return records.hourly_rain([(r.end, measurement(r.sum, unit, Kind.RAIN)) for r in sums])

    # ---- The place since 1940 ----

    async def _load_place_records(self) -> None:
        """Open-Meteo's archive at the home's position: since 1940 the first time (about 1 MB), then the last two months, every six hours."""
        if not self._wanted(PLACE_KEYS):
            return
        now = dt_util.utcnow()
        config = self.hass.config
        here = records.position(config.latitude, config.longitude)
        moved = here != self._place_position
        # Nothing kept (a first time, months of an older version): asked now, whenever it was last fetched.
        if not records.due(None if moved or not self.place_months else self._place_fetched, self._place_tried, now):
            return
        self._place_tried = now
        zone, today = ZoneInfo(config.time_zone), self._today()
        full = moved or not self.place_months
        since = records.FIRST_DAY if full else records.first_of_previous_month(today)
        session = async_get_clientsession(self.hass)
        try:
            params = records.archive_params(config.latitude, config.longitude, zone, since, today - timedelta(days=1))
            async with asyncio.timeout(120), session.get(records.ARCHIVE_URL, params=params) as response:
                response.raise_for_status()
                archive = records.parse_daily(await response.json(), today)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            LOGGER.warning("Open-Meteo archive unavailable for the records: %s", err)
            return
        recent: list[records.DayValues] = []
        last = max((d.day for d in archive if d.high is not None), default=None)
        if last is None or last < today - timedelta(days=1):
            # The archive is late here: the weather models' own past fills its last days.
            try:
                async with asyncio.timeout(30), session.get(records.RECENT_URL, params=records.recent_params(config.latitude, config.longitude, zone)) as response:
                    response.raise_for_status()
                    recent = [d for d in records.parse_daily(await response.json(), today) if d.day >= since]
            except (aiohttp.ClientError, TimeoutError, ValueError) as err:
                LOGGER.debug("Open-Meteo recent days unavailable for the records: %s", err)
        fresh = records.summarise(records.fill(archive, recent))
        self.place_months = fresh if full else records.merge(self.place_months, fresh, since)
        self._place_position, self._place_fetched = here, now
        self._records_cache.pop("lieu", None)
        self._save_records()
        self._records_changed()

    # ---- Days in heatwave vigilance ----

    def _count_heatwave(self, canicule: Item | None, today: date) -> None:
        """Météo-France's heatwave vigilance (orange or red) counts the day; counting starts with the first vigilance seen."""
        if canicule is None or canicule.source != "vigilance":
            return
        counted = self.heatwave.started(today)
        if canicule.value is True:
            counted = counted.add(today)
        if counted != self.heatwave:
            self.heatwave = counted
            self._save_records()
            self._records_changed()
