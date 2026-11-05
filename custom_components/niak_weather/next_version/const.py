"""Constants of the Hestia Weather integration."""
from __future__ import annotations

import logging
from datetime import timedelta

DOMAIN = "hestia_weather"
LOGGER = logging.getLogger(__package__)

CARD_TYPE = "custom:hestia-weather-card"
VIEW_VERSION = 1
"""Version of the view sent to the card: raised when its shape changes in a way an older card cannot read."""

FORECAST_INTERVAL = timedelta(minutes=15)
FORECAST_RETRY = timedelta(minutes=1)
HISTORY_INTERVAL = timedelta(minutes=5)
RAIN_INTERVAL = timedelta(minutes=15)
# The week of pressure and wind is drawn from hourly statistics: read once an hour.
WEEK_INTERVAL = timedelta(hours=1)
AIR_INTERVAL = timedelta(minutes=15)
"""Checks whether tomorrow's air forecast (Open-Meteo, with WAQI) is due: it is fetched once an hour."""
TICK = timedelta(minutes=1)
"""Everything that depends on the time of day (next hours, date, trends) is recomputed at least this often."""
DEBOUNCE_SECONDS = 2
