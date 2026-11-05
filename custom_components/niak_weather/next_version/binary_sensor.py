"""Yes/no answers ready to trigger an automation or serve as its condition, with « when » and « why » as attributes."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity, BinarySensorEntityDescription
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .coordinator import HestiaWeatherConfigEntry, HestiaWeatherCoordinator
from .engine.catalogue import ALERTS, Item
from .sensor import device_info, device_name, first_enabled, item_attributes, prefix

# Grouped as in the documentation: Maintenant, Alertes, Vie pratique.
BINARY_SENSORS: tuple[BinarySensorEntityDescription, ...] = (
    BinarySensorEntityDescription(key="pluie_en_cours", translation_key="pluie_en_cours"),
    BinarySensorEntityDescription(key="brouillard", translation_key="brouillard", entity_registry_enabled_default=False),
    BinarySensorEntityDescription(key="orage", translation_key="orage"),
    BinarySensorEntityDescription(key="vent_fort", translation_key="vent_fort"),
    BinarySensorEntityDescription(key="pluie_forte", translation_key="pluie_forte"),
    BinarySensorEntityDescription(key="gel", translation_key="gel"),
    BinarySensorEntityDescription(key="canicule", translation_key="canicule"),
    BinarySensorEntityDescription(key="uv_fort", translation_key="uv_fort", entity_registry_enabled_default=False),
    BinarySensorEntityDescription(key="givre_pare_brise", translation_key="givre_pare_brise", entity_registry_enabled_default=False),
)


async def async_setup_entry(hass: HomeAssistant, entry: HestiaWeatherConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    place, device = prefix(hass, entry), device_name(hass, entry)
    async_add_entities(HestiaWeatherBinarySensor(entry.runtime_data, description, place, device) for description in BINARY_SENSORS)


class HestiaWeatherBinarySensor(CoordinatorEntity[HestiaWeatherCoordinator], BinarySensorEntity):
    _attr_has_entity_name = True
    # Blitzortung's strikes change these at every strike: worth reading, not worth the Recorder's space.
    _unrecorded_attributes = frozenset({"eclair_le_plus_proche_km", "direction", "azimut", "tendance", "eclairs_20_min", "eclairs_proches_20_min"})

    def __init__(self, coordinator: HestiaWeatherCoordinator, description: BinarySensorEntityDescription, prefix: str, device: str) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{description.key}"
        self.entity_id = f"binary_sensor.{prefix}_{description.key}"
        self._attr_device_info = device_info(coordinator, device)
        self._attr_entity_registry_enabled_default = first_enabled(coordinator, description.key, description.entity_registry_enabled_default)

    @property
    def _item(self) -> Item | None:
        return self.coordinator.data.catalogue.get(self.entity_description.key) if self.coordinator.data else None

    @property
    def is_on(self) -> bool | None:
        data, key = self.coordinator.data, self.entity_description.key
        if data is None:
            return None
        # An alert stays on a little after it stops being observed: the same « on » as the event that announced it.
        if key in ALERTS and key in data.alerts:
            return True
        item = data.catalogue.get(key)
        return None if item is None or item.value is None else bool(item.value)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        data, key, item = self.coordinator.data, self.entity_description.key, self._item
        if data is None or item is None:
            return None
        attributes = item_attributes(item)
        alert = data.alerts.get(key) if key in ALERTS else None
        if alert:
            # While held, the alert keeps its last reason rather than « no rain ».
            attributes |= {"raison": alert.text, "source": alert.source, "niveau": alert.level,
                           "depuis": datetime.fromtimestamp(alert.since, dt_util.get_default_time_zone()).isoformat()}
        elif key in ALERTS:
            attributes["niveau"] = 0
        return attributes
