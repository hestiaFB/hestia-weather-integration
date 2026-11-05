"""« Télécharger les diagnostics »: what Hestia Weather reads for one place, in one file to share in an issue.

The chosen sensors as read, what was loaded from the weather service and the Recorder, and how fresh it is, so that a
strange reading can be explained without access to the home. Where the home is stays out: its coordinates, the commune
and the air and pollen zones are removed, and the lightning strikes (each one placed around the home) are only counted.
"""
from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import HestiaWeatherConfigEntry

TO_REDACT = {"latitude", "longitude", "elevation", "location", "waqi_place", "waqi_station", "atmo_area", "atmo_pollen_area",
             "pollen_station"}
# The attributes of a sensor that explain a reading; the rest (pictures, forecasts) is left out.
ATTRIBUTES = ("unit_of_measurement", "device_class", "state_class", "friendly_name", "attribution",
              "temperature_unit", "pressure_unit", "wind_speed_unit", "precipitation_unit")


def _state(hass: HomeAssistant, entity_id: str) -> dict[str, Any]:
    state = hass.states.get(entity_id)
    if state is None:
        return {"state": None, "missing": True}
    return {"state": state.state, "last_updated": state.last_updated.isoformat(),
            "attributes": {k: state.attributes[k] for k in ATTRIBUTES if k in state.attributes}}


def _series(series: dict[str, list[Any]]) -> dict[str, dict[str, Any]]:
    """How much of each recorded series was loaded, and up to when: enough to see a gap, without the values."""
    return {key: {"changes": len(changes), "last": dt_util.utc_from_timestamp(changes[-1].time).isoformat() if changes else None}
            for key, changes in series.items()}


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: HestiaWeatherConfigEntry) -> dict[str, Any]:
    integration = await async_get_integration(hass, DOMAIN)
    coordinator = getattr(entry, "runtime_data", None)
    options = dict(entry.options)
    entities = sorted({v for k, v in options.items() if k.endswith("_entity") and isinstance(v, str) and v})
    result: dict[str, Any] = {
        "version": str(integration.version),
        "generated_at": dt_util.utcnow().isoformat(),
        "place": {"title": entry.title, "state": entry.state.value, "options": options},
        "states": {entity_id: _state(hass, entity_id) for entity_id in entities},
    }
    if coordinator is not None:
        result["loaded"] = {
            "last_update_success": coordinator.last_update_success,
            "forecast_at": coordinator.forecast_at.isoformat() if coordinator.forecast_at else None,
            "forecast_rows": {kind: len(rows) for kind, rows in coordinator.forecast_rows.items()},
            "hours": len(coordinator.hours), "days": len(coordinator.days),
            "history": _series(coordinator.history),
            "rain_history": _series(coordinator.rain_history),
            "rain_statistics": {"rows": len(coordinator.statistics), "unit": coordinator.statistics_unit},
            "strikes": len(coordinator.strikes), "lightning_month": coordinator.lightning_month,
            "air_forecast": coordinator.air_forecast is not None,
        }
    return async_redact_data(result, TO_REDACT)
