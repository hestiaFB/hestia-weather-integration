"""The interface Hestia Weather publishes for the other Hestia bricks (version 1).

Other bricks read `hass.data["hestia_weather_api"]` and check `version` before using it.
They never read Hestia Weather's own settings: this object is the contract, and it only grows
compatibly within a major version.
"""
from __future__ import annotations
from typing import TYPE_CHECKING, Any, Callable

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

# Kept free of Home Assistant imports so that it can be tested like the engine.
DOMAIN = "hestia_weather"

API_KEY = "hestia_weather_api"
API_VERSION = 1
# Station roles published to the other bricks, mapped to Hestia Weather's own settings.
STATION = {"temperature": "temperature_entity", "humidity": "humidity_entity", "rain_rate": "rain_rate_entity",
           "wind_speed": "wind_speed_entity", "wind_gust": "wind_gust_entity", "wind_bearing": "wind_bearing_entity",
           "solar_radiation": "solar_radiation_entity", "uv_index": "uv_index_entity", "pressure": "pressure_entity"}


class HestiaWeatherApi:
    version = API_VERSION

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        # How many listeners each brick has on each place: (entry_id, brick) → count.
        self._links: dict[tuple[str, str], int] = {}

    def _entries(self):
        return [e for e in self.hass.config_entries.async_entries(DOMAIN) if getattr(e.state, "value", e.state) == "loaded"]

    def _entry(self, entry_id: str | None):
        entries = self._entries()
        if entry_id:
            return next((e for e in entries if e.entry_id == entry_id), None)
        return entries[0] if len(entries) == 1 else None

    def places(self) -> list[dict[str, str]]:
        """The configured places, for a brick that must let the user choose one."""
        return [{"entry_id": e.entry_id, "title": e.title} for e in self._entries()]

    def station(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """The station sensors chosen in Hestia Weather, by role. Roles without a sensor are left out."""
        entry = self._entry(entry_id)
        if entry is None:
            return None
        settings = entry.runtime_data.settings
        sensors = {role: getattr(settings, name) for role, name in STATION.items() if getattr(settings, name, None)}
        return {"entry_id": entry.entry_id, "title": entry.title, "sensors": sensors}

    def hourly(self, entry_id: str | None = None) -> list[dict[str, Any]]:
        """The hourly forecast as Hestia Weather reads it: °C, %, mm, km/h and degrees, ISO times; `cloud_coverage` in %
        when the weather service gives it (Hestia Confort estimates with it the sun its station cannot see)."""
        entry = self._entry(entry_id)
        if entry is None:
            return []
        return [{"time": h.time.isoformat(), "temperature": h.temperature, "humidity": h.humidity,
                 "precipitation": h.precipitation, "wind_speed": h.wind_speed, "wind_gust": h.wind_gust,
                 "wind_bearing": h.wind_bearing, "condition": h.condition, "cloud_coverage": h.cloud_coverage}
                for h in entry.runtime_data.hours if h.time is not None]

    def air(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """Today's outdoor air from the source chosen in Hestia Weather, on Atmo's scale: 1 Bon to 6 Extrêmement mauvais.

        `source` is « atmo » (the regional index of the day) or « waqi » (a station's measure); `entity_id` its sensor.
        `index` is None while the source does not answer. None without a place or without an air source."""
        entry = self._entry(entry_id)
        if entry is None:
            return None
        settings = entry.runtime_data.settings
        waqi = settings.air_source == "waqi"
        entity_id = settings.waqi.get("waqi_air_entity") if waqi else settings.atmo.get("atmo_air_entity")
        if settings.air_source == "none" or not entity_id:
            return None
        data = getattr(entry.runtime_data, "data", None)
        item = data.catalogue.get("qualite_air") if data is not None else None
        index = item.value if item is not None and isinstance(item.value, int) and 1 <= item.value <= 6 else None
        return {"entry_id": entry.entry_id, "source": "waqi" if waqi else "atmo", "provider": "WAQI" if waqi else "Atmo France",
                "entity_id": entity_id, "index": index, "label": item.extra.get("libelle") if index is not None else None,
                "at": data.computed.isoformat() if data is not None else None}

    def pollen(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """Today's pollens from the source chosen in Hestia Weather (Atmo France, Polleninformation, IRM KMI, Swiss Pollen, Kleenex).

        `level` is the same for every source: 0 none, 1 low, 2 moderate, 3 high, 4 very high (Atmo's 1-6 index brought onto it);
        `high` is True from « high » on. `index` and `scale` are the source's own value and top (6 for Atmo, 4 for the others),
        `label` its word, `main` the species that weighs most, `tomorrow` tomorrow's `level`. `level` is None while the source
        does not answer. None without a place or without a pollen source."""
        entry = self._entry(entry_id)
        if entry is None:
            return None
        settings = entry.runtime_data.settings
        if not (settings.atmo_pollens or settings.pollen_source == "legacy"):
            return None
        data = getattr(entry.runtime_data, "data", None)
        item = data.catalogue.get("pollens") if data is not None else None
        atmo = item is not None and item.source == "atmo"
        scale = 6 if atmo else 4

        def level(value: Any) -> int | None:
            if not isinstance(value, int) or isinstance(value, bool) or not (1 if atmo else 0) <= value <= scale:
                return None
            # Atmo: 1 very low and 2 low → low, 3 moderate, 4 high, 5 very high and 6 extremely high → very high.
            return (1, 1, 2, 3, 4, 4)[value - 1] if atmo else value
        today = level(item.value if item is not None else None)
        extra = item.extra if item is not None and today is not None else {}
        return {"entry_id": entry.entry_id, "source": item.source if item is not None else None, "level": today,
                "high": today is not None and today >= 3, "index": item.value if today is not None else None, "scale": scale,
                "label": extra.get("libelle"), "main": extra.get("principal"), "tomorrow": level(extra.get("demain")),
                "at": data.computed.isoformat() if data is not None else None}

    def season(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """Today's season for this place, as Hestia Weather shows it: the Season sensor chosen in its settings when it
        answers, else the astronomical date. `season` is « spring », « summer », « autumn » or « winter »;
        `day_length` the hours of daylight. None without a place."""
        entry = self._entry(entry_id)
        if entry is None:
            return None
        from datetime import datetime, timezone
        from zoneinfo import ZoneInfo
        try:
            from .engine.season import current_season
        except ImportError:  # loaded on its own, as by the tests
            from engine.season import current_season
        found = current_season(self.hass.states.get, entry.runtime_data.settings.season_entity, datetime.now(timezone.utc),
                               ZoneInfo(self.hass.config.time_zone), self.hass.config.latitude, self.hass.config.elevation or 0)
        return {"entry_id": entry.entry_id, "season": found.season, "label": found.label, "from_sensor": found.from_sensor,
                "days_in": found.days_in, "day_length": found.day_length}

    def rain(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """When the next rain starts. `minutes` (0: due now) with `precision` « minute » when Météo-France's radar
        forecast says it, « hour » when only the hourly forecast does (the rain falls somewhere in that hour);
        `dry_until`: the end of the hour the radar sees dry. None without a place or before the first calculation."""
        entry = self._entry(entry_id)
        data = getattr(entry.runtime_data, "data", None) if entry is not None else None
        if data is None:
            return None
        return {"entry_id": entry.entry_id, **data.rain_ahead, "at": data.computed.isoformat()}

    def lightning(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """The storm Blitzortung sees, from its strikes of the last 20 minutes. `near`: a strike within 30 km (the Orage sensor is on);
        `overhead`: within 10 km in the last 10 minutes; `nearest_km` the closest strike; `direction` in words (« au sud-ouest »);
        `trend` « approche », « eloigne » or None; `count` the strikes; `last` the time of the last one. `available` is False while
        the Blitzortung sensor does not answer: no strike then says nothing. None without a place or without Blitzortung."""
        entry = self._entry(entry_id)
        data = getattr(entry.runtime_data, "data", None) if entry is not None else None
        if data is None or not entry.runtime_data.settings.lightning_entity:
            return None
        from datetime import datetime, timezone
        try:
            from .engine import lightning
        except ImportError:  # loaded on its own, as by the tests
            from engine import lightning
        entity_id = entry.runtime_data.settings.lightning_entity
        state = self.hass.states.get(entity_id)
        seen = lightning.read(entry.runtime_data.strikes, data.computed.timestamp(), state is not None and state.state != "unavailable")
        extra = seen.extra()
        return {"entry_id": entry.entry_id, "entity_id": entity_id, "available": seen.available, "near": seen.near, "overhead": seen.overhead,
                "level": seen.level, "nearest_km": extra["eclair_le_plus_proche_km"], "direction": extra["direction"], "azimuth": extra["azimut"],
                "trend": seen.trend, "count": seen.count, "near_count": seen.near_count, "text": seen.text or None,
                "last": datetime.fromtimestamp(seen.last, timezone.utc).isoformat() if seen.last else None, "at": data.computed.isoformat()}

    def water(self, entry_id: str | None = None) -> dict[str, Any] | None:
        """The drought restrictions of the day from Vigieau: `level` 0 (none) to 4 (crisis), `state` « aucune » to « crise »,
        `restricted` True from « Alerte » on, `watering_restricted` when watering is among the restricted uses, `usages` their names,
        `order` the prefect's order. `level` is None while Vigieau does not answer. None without a place or without Vigieau."""
        entry = self._entry(entry_id)
        data = getattr(entry.runtime_data, "data", None) if entry is not None else None
        if data is None or not entry.runtime_data.settings.water_restriction_entity:
            return None
        item = data.catalogue.get("restrictions_eau")
        extra = item.extra if item is not None and item.value is not None else {}
        level = extra.get("niveau")
        return {"entry_id": entry.entry_id, "entity_id": entry.runtime_data.settings.water_restriction_entity, "level": level,
                "state": item.value if extra else None, "label": extra.get("libelle"), "restricted": level is not None and level >= 2,
                "watering_restricted": bool(extra.get("arrosage_restreint")), "usages": list(extra.get("usages") or []),
                "order": extra.get("arrete"), "at": data.computed.isoformat()}

    def add_listener(self, entry_id: str | None, update: Callable[[], None], brick: str | None = None) -> Callable[[], None]:
        """Calls `update` whenever this place is recomputed (new measures or forecasts).

        `brick`: the listener's own domain (« hestia_comfort »), so that Hestia Weather's settings show it linked to this place."""
        entry = self._entry(entry_id)
        if entry is None:
            return lambda: None
        remove = entry.runtime_data.async_add_listener(update)
        key = (entry.entry_id, brick or "")
        self._links[key] = self._links.get(key, 0) + 1

        stopped = False

        def stop() -> None:
            nonlocal stopped
            if stopped:
                return
            stopped = True
            remove()
            self._links[key] -= 1
        return stop

    def linked(self, entry_id: str) -> dict[str, int]:
        """The bricks listening to this place, by domain ("" for those that did not say who they are)."""
        return {brick: n for (place, brick), n in self._links.items() if place == entry_id and n}
