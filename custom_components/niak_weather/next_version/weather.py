"""The weather observed at home, with the provider's forecasts: anything that accepts a weather entity gets the station's view.

Now comes from the station when there is one (the bulletin otherwise), the condition as Hestia Weather sees it (rain measured here
wins over the bulletin); the forecasts are the provider's, passed on in the same units as the rest.
"""
from __future__ import annotations

from typing import Any

from homeassistant.components.weather import Forecast, WeatherEntity, WeatherEntityFeature
from homeassistant.const import UnitOfPrecipitationDepth, UnitOfPressure, UnitOfSpeed, UnitOfTemperature
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .coordinator import HestiaWeatherConfigEntry, HestiaWeatherCoordinator
from .engine.catalogue import CONDITIONS
from .engine.units import Kind, finite, measurement
from .sensor import device_info, device_name, first_enabled, prefix


async def async_setup_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([HestiaWeatherEntity(entry.runtime_data, prefix(hass, entry), device_name(hass, entry))])


class HestiaWeatherEntity(CoordinatorEntity[HestiaWeatherCoordinator], WeatherEntity):
    _attr_has_entity_name = True
    _attr_name = None
    _attr_native_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_native_pressure_unit = UnitOfPressure.HPA
    _attr_native_wind_speed_unit = UnitOfSpeed.KILOMETERS_PER_HOUR
    _attr_native_precipitation_unit = UnitOfPrecipitationDepth.MILLIMETERS
    _attr_supported_features = WeatherEntityFeature.FORECAST_HOURLY | WeatherEntityFeature.FORECAST_DAILY

    def __init__(self, coordinator: HestiaWeatherCoordinator, prefix: str, device: str) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_weather"
        self.entity_id = f"weather.{prefix}"
        self._attr_device_info = device_info(coordinator, device)
        # Off at first unless chosen at setup: a second weather entity in every picker would confuse more than help, until it is wanted.
        self._attr_entity_registry_enabled_default = first_enabled(coordinator, "weather", False)
        self._forecast_version = coordinator.forecast_version

    @property
    def _bulletin(self) -> dict[str, Any]:
        state = self.hass.states.get(self.coordinator.settings.weather_entity)
        return dict(state.attributes) if state else {}

    def _from_bulletin(self, key: str, unit_key: str, kind: Kind) -> float | None:
        b = self._bulletin
        return measurement(b.get(key), b.get(unit_key), kind)

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.data is not None and self.coordinator.data.local.condition in CONDITIONS

    @property
    def condition(self) -> str | None:
        data = self.coordinator.data
        return data.local.condition if data and data.local.condition in CONDITIONS else None

    @property
    def native_temperature(self) -> float | None:
        return self.coordinator.data.local.temperature if self.coordinator.data else None

    @property
    def native_apparent_temperature(self) -> float | None:
        return self.coordinator.data.local.feel.value if self.coordinator.data else None

    @property
    def native_dew_point(self) -> float | None:
        return self.coordinator.data.local.dew_point if self.coordinator.data else None

    @property
    def humidity(self) -> float | None:
        return self.coordinator.data.local.humidity if self.coordinator.data else None

    @property
    def native_pressure(self) -> float | None:
        local = self.coordinator.data.local if self.coordinator.data else None
        if local and local.pressure is not None:
            return round(local.pressure, 1)
        return None if self.coordinator.settings.pressure_entity else self._from_bulletin("pressure", "pressure_unit", Kind.PRESSURE)

    @property
    def _station_wind(self) -> bool:
        s = self.coordinator.settings
        return bool(s.wind_speed_entity or s.wind_gust_entity)

    @property
    def native_wind_speed(self) -> float | None:
        if self._station_wind:
            return self.coordinator.data.local.wind.speed if self.coordinator.data else None
        return self._from_bulletin("wind_speed", "wind_speed_unit", Kind.WIND)

    @property
    def native_wind_gust_speed(self) -> float | None:
        if self._station_wind:
            return self.coordinator.data.local.wind.gust if self.coordinator.data else None
        return self._from_bulletin("wind_gust_speed", "wind_speed_unit", Kind.WIND)

    @property
    def wind_bearing(self) -> float | None:
        if self._station_wind:
            return self.coordinator.data.local.wind.bearing if self.coordinator.data else None
        return finite(self._bulletin.get("wind_bearing"))

    @property
    def uv_index(self) -> float | None:
        local = self.coordinator.data.local if self.coordinator.data else None
        return local.uv if local and local.uv is not None else finite(self._bulletin.get("uv_index"))

    @property
    def cloud_coverage(self) -> float | None:
        return finite(self._bulletin.get("cloud_coverage"))

    @property
    def attribution(self) -> str | None:
        source = self._bulletin.get("attribution")
        return f"Hestia Weather · prévisions : {source}" if source else "Hestia Weather"

    async def async_forecast_hourly(self) -> list[Forecast] | None:
        return [Forecast(**row) for row in self.coordinator.forecast_rows["hourly"]] or None

    async def async_forecast_daily(self) -> list[Forecast] | None:
        return [Forecast(**row) for row in self.coordinator.forecast_rows["daily"]] or None

    @callback
    def _handle_coordinator_update(self) -> None:
        super()._handle_coordinator_update()
        if self.coordinator.forecast_version != self._forecast_version:
            self._forecast_version = self.coordinator.forecast_version
            self.hass.async_create_task(self.async_update_listeners(None))
