"""What a place reads from the Recorder: hours and weeks of its sensors, its rain counters' statistics, the lightning of the hour and of the month."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, Literal, cast

from homeassistant.components.recorder import get_instance, history, statistics
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .. import recorder_history
from ..const import LOGGER
from ..engine import lightning
from ..engine.series import RAIN_DAYS, WEEK, hourly_changes, rain_state_key, rain_sum_key, weather_history, weather_history_key, week_key
from ..engine.station import Statistic, midnight, steady_sums
from ..engine.trends import Change
from ..engine.units import Kind, measurement
from zoneinfo import ZoneInfo
from .shared import RAIN_UNITS, _seconds, blitzortung_counter

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from ..engine.settings import Settings


class RecorderMixin:
    """Part of HestiaWeatherCoordinator: its methods use the coordinator's own state (self)."""

    # The coordinator's state these methods read and write (set in coordinator.py).
    hass: HomeAssistant
    settings: Settings
    history: dict[str, list[Change]]
    rain_history: dict[str, list[Change]]
    statistics: list[Statistic]
    statistics_unit: str | None
    strikes: list[lightning.Strike]
    lightning_month: int | None
    _statistics_warned: bool

    async def _states_during(self, start: datetime, entity_ids: list[str]) -> dict[str, list[Change]]:
        """Every recorded state change since `start` (with the state just before it), from the Recorder."""
        weather_entity = self.settings.weather_entity
        with_weather = weather_entity in entity_ids
        end = dt_util.utcnow()

        def during() -> dict[str, list[Change]]:
            # Turned into small (time, value) changes in the Recorder's thread: its State objects, with the weather
            # service's attributes, are never held by the event loop.
            result = history.get_significant_states(self.hass, start, end, entity_ids, include_start_time_state=True,
                                                    significant_changes_only=False, minimal_response=False, no_attributes=not with_weather)
            # Full states (minimal_response=False): each row has its time and its state.
            changes = {entity_id: [Change(state.last_updated.timestamp(), state.state) for state in cast(list[Any], states) if hasattr(state, "last_updated")]
                       for entity_id, states in result.items()}
            if with_weather:
                changes.update(weather_history(weather_entity, result.get(weather_entity, ())))
            return changes

        try:
            return await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - history is optional: a Recorder failure must never stop the weather
            # The Recorder may also exclude these sensors: no trend is invented, the card says it is being measured.
            LOGGER.warning("History unavailable for %s: %s", ", ".join(entity_ids), err)
            return {}

    def _statistics_failed(self, message: str, *args: Any) -> None:
        """A Recorder that cannot answer is said once in the log, then quietly: the weather goes on without it."""
        if self._statistics_warned:
            LOGGER.debug(message, *args)
        else:
            self._statistics_warned = True
            LOGGER.warning(message, *args)

    async def _compact_states(self, start: datetime, end: datetime, entity_id: str) -> list[Change]:
        """A week of a sensor without statistics, read day by day and compacted (recorder_history.py): a sensor
        reporting every few seconds would otherwise bring tens of thousands of rows at once."""
        try:
            rows = await get_instance(self.hass).async_add_executor_job(recorder_history.read, self.hass, start, end, [entity_id])
        except Exception as err:  # noqa: BLE001 - history is optional: a Recorder failure must never stop the weather
            LOGGER.warning("History unavailable for %s: %s", entity_id, err)
            return []
        return [Change(row.last_updated.timestamp(), row.state) for row in rows.get(entity_id, [])]

    async def _load_history(self) -> None:
        """Six hours of pressure and wind for the charts and trends; today's gusts and the last hour of temperature when the station has no sensor for them."""
        s, now = self.settings, dt_util.utcnow()
        derived = s.station_history
        ids = sorted(e for e in {s.weather_entity, s.pressure_entity, s.wind_speed_entity, s.wind_gust_entity,
                                 s.temperature_entity if derived and not s.temperature_trend_entity else None} if e)
        if not ids:
            self.history = {}
            return
        start = now - timedelta(hours=6)
        if derived and not s.max_daily_gust_entity and s.wind_gust_entity:
            start = min(start, dt_util.start_of_local_day())
        recent = await self._states_during(start, ids)
        # The week of pressure, loaded less often, stays beside the six hours.
        self.history = {**{k: v for k, v in self.history.items() if k.endswith("#week")}, **recent}

    async def _load_week(self) -> None:
        """A week of pressure and wind for the longer charts: hourly means (maxima for gusts) of the long-term statistics,
        or the recorded states without them; the weather service's own values when the station has no such sensor."""
        s, now = self.settings, dt_util.utcnow()
        start = now - timedelta(seconds=WEEK + 3600)
        week: dict[str, list[Change]] = {}
        from_service = []
        for entity_id, attribute, kind, statistic in ((s.pressure_entity, "pressure", "pressure", "mean"),
                                                      (s.wind_speed_entity, "wind_speed", "speed", "mean"),
                                                      (s.wind_gust_entity, "wind_gust_speed", "speed", "max")):
            if not entity_id:
                from_service.append(attribute)
                continue
            rows = await self._hourly(entity_id, start, now, kind, statistic)
            if rows is None:
                rows = await self._compact_states(start, now, entity_id)
            week[week_key(entity_id)] = rows
        if from_service and s.weather_entity:
            recorded = await self._states_during(start, [s.weather_entity])
            for attribute in from_service:
                key = weather_history_key(s.weather_entity, attribute)
                week[week_key(key)] = recorded.get(key, [])
        self.history = {**{k: v for k, v in self.history.items() if not k.endswith("#week")}, **week}

    async def _hourly(self, entity_id: str, start: datetime, now: datetime, kind: str, statistic: str) -> list[Change] | None:
        """Hourly means or maxima, or None when the sensor keeps no statistics. The sensor itself may not have started yet
        (Hestia Weather often starts before the station): the statistics are read without it, in the unit they are kept in."""
        state = self.hass.states.get(entity_id)
        unit = state.attributes.get("unit_of_measurement") if state is not None else None

        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, now, {entity_id}, "hour", {kind: unit} if unit else None, cast(Any, {statistic}))
            return list(rows.get(entity_id, []))

        try:
            rows = await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - statistics are optional: the recorded states then give the week
            self._statistics_failed("Statistics unavailable for %s: %s", entity_id, err)
            return None
        return hourly_changes([(_seconds(r["start"]), _seconds(r["end"]), r.get(statistic)) for r in rows]) if rows else None

    async def _load_strikes(self) -> None:
        """The last hour of strikes from the Recorder, after a restart: their distance only, the Recorder keeps no position."""
        entity_id = self.settings.lightning_entity
        if not entity_id:
            return
        now = dt_util.utcnow()
        changes = await self._states_during(now - timedelta(seconds=lightning.KEEP), [entity_id])
        state = self.hass.states.get(entity_id)
        unit = state.attributes.get("unit_of_measurement") if state is not None else "km"
        # The state already there at the start is the last strike before the hour, or « unknown »: only changes count.
        recorded = [c for c in changes.get(entity_id, []) if c.time >= (now - timedelta(seconds=lightning.KEEP)).timestamp()]
        self.strikes = lightning.keep([*lightning.from_history(recorded, unit), *self.strikes], now.timestamp())

    async def _load_lightning_month(self) -> None:
        """The month's strikes from Blitzortung's counter, next to its distance sensor: the change of its long-term statistics since the
        first of the month (they follow the counter's resets to 0). Up to an hour late: the statistics are hourly."""
        counter = blitzortung_counter(er.async_get(self.hass), self.settings.lightning_entity)
        if not counter:
            self.lightning_month = None
            return
        zone = ZoneInfo(self.hass.config.time_zone)
        now = dt_util.utcnow()
        local = now.astimezone(zone)
        start = datetime(local.year, local.month, 1, tzinfo=zone)

        def during() -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, now, {counter}, "month", None, {"change"})
            return list(rows.get(counter, []))

        try:
            rows = await get_instance(self.hass).async_add_executor_job(during)
        except Exception as err:  # noqa: BLE001 - the month's count is optional: the radar does without it
            self._statistics_failed("Lightning statistics unavailable for %s: %s", counter, err)
            self.lightning_month = None
            return
        change = sum(r.get("change") or 0 for r in rows) if rows else None
        self.lightning_month = None if change is None else max(0, round(change))

    async def _load_rain(self) -> None:
        """Eight days of the daily rain counter and the total counter; long-term statistics of the total for weeks, months and the year."""
        s, now = self.settings, dt_util.utcnow()
        ids = sorted(e for e in {s.daily_rain_entity, s.rain_total_entity if s.station_history else None} if e)
        recorded = await self._states_during(now - timedelta(days=8), ids) if ids else {}
        self.statistics, self.statistics_unit = await self._rain_statistics(now)
        self.rain_history = {**recorded, **await self._rain_sums(now)}

    async def _rain_sums(self, now: datetime) -> dict[str, list[Change]]:
        """A month of hourly rain for the 24-hour and 30-day bars: the running sum of a rain counter's statistics,
        the total counter first, else the daily one, whose resets the sum already follows."""
        s = self.settings
        for entity_id in (s.rain_total_entity if s.station_history else None, s.daily_rain_entity):
            if not entity_id:
                continue
            # The statistics' own description, not the sensor: at start-up the station may not be there yet.
            unit = await self._sum_unit(entity_id)
            if unit not in RAIN_UNITS:
                continue
            start = now - timedelta(days=RAIN_DAYS + 1)

            def during(entity_id: str = entity_id) -> list[Any]:
                rows = statistics.statistics_during_period(self.hass, start, now, {entity_id}, "hour", None, {"sum", "state"})
                return list(rows.get(entity_id, []))

            try:
                rows = await get_instance(self.hass).async_add_executor_job(during)
            except Exception as err:  # noqa: BLE001 - statistics are optional: the seven days still come from the counter's history
                self._statistics_failed("Rain statistics unavailable for %s: %s", entity_id, err)
                continue
            # A counter that dropped to 0 and came back is not a month of fresh rain.
            sums = steady_sums([Statistic(_seconds(r["start"]), _seconds(r["end"]), r["sum"], r.get("state")) for r in rows if r.get("sum") is not None])
            if not sums:
                continue
            # Rows come in the unit the statistics keep: the bars are in millimetres.
            mm = (lambda v: measurement(v, unit, Kind.RAIN))
            last = sums[-1]
            return {rain_sum_key(entity_id): [Change(r.end, str(mm(r.sum))) for r in sums],
                    rain_state_key(entity_id): [Change(last.end, str(mm(last.state)))]}
        return {}

    async def _sum_unit(self, entity_id: str) -> str | None:
        """The unit of a counter's long-term statistics, or None when it keeps no running sum."""
        try:
            metadata = await get_instance(self.hass).async_add_executor_job(lambda: statistics.get_metadata(self.hass, statistic_ids={entity_id}))
        except Exception as err:  # noqa: BLE001 - statistics are optional
            self._statistics_failed("Statistics metadata unavailable for %s: %s", entity_id, err)
            return None
        meta = metadata.get(entity_id)
        return meta[1].get("unit_of_measurement") if meta and meta[1].get("has_sum") else None

    async def _rain_statistics(self, now: datetime) -> tuple[list[Statistic], str | None]:
        s = self.settings
        entity_id = s.rain_total_entity
        # Its statistics say whether it is a counter (a running sum below): the sensor may not have started yet.
        if not entity_id or not s.station_history:
            return [], None
        instance = get_instance(self.hass)
        zone = ZoneInfo(self.hass.config.time_zone)
        local = now.astimezone(zone)
        year = datetime(local.year, 1, 1, tzinfo=zone)
        # Hourly rows start on a local midnight, where a daily row ends: no false gap at the junction.
        hourly_start = datetime.fromtimestamp(midnight(local.date() - timedelta(days=9), zone), zone)
        daily_start = min(year, now - timedelta(days=8)) - timedelta(days=1)

        def during(start: datetime, period: Literal["day", "hour"]) -> list[Any]:
            rows = statistics.statistics_during_period(self.hass, start, now, {entity_id}, period, None, {"sum", "state"})
            return list(rows.get(entity_id, []))

        try:
            metadata = await instance.async_add_executor_job(lambda: statistics.get_metadata(self.hass, statistic_ids={entity_id}))
            meta = metadata.get(entity_id)
            # Without `units`, rows come in the unit the statistics are stored in.
            unit = meta[1].get("unit_of_measurement") if meta and meta[1].get("has_sum") else None
            if unit not in RAIN_UNITS:
                return [], None
            daily = await instance.async_add_executor_job(during, daily_start, "day")
            hourly = await instance.async_add_executor_job(during, hourly_start, "hour")
        except Exception as err:  # noqa: BLE001 - statistics are optional: totals then come from the counter history alone
            LOGGER.warning("Rain statistics unavailable for %s: %s", entity_id, err)
            return [], None
        rows = sorted((Statistic(_seconds(r["start"]), _seconds(r["end"]), r.get("sum"), r.get("state")) for r in (*daily, *hourly)),
                      key=lambda r: r.end - r.start, reverse=True)
        # One row per boundary: where a day and an hour end together, the hour wins.
        return steady_sums(sorted({r.end: r for r in rows}.values(), key=lambda r: r.end)), unit
