"""Names and icons of Home Assistant weather conditions: one table for the whole engine."""
from __future__ import annotations

from .i18n import N_, t

CONDITIONS: dict[str, tuple[str, str]] = {
    "sunny": (N_("Ensoleillé"), "mdi:weather-sunny"), "clear-night": (N_("Nuit claire"), "mdi:weather-night"),
    "partlycloudy": (N_("Éclaircies"), "mdi:weather-partly-cloudy"), "cloudy": (N_("Ciel couvert"), "mdi:weather-cloudy"),
    "rainy": (N_("Pluie"), "mdi:weather-rainy"), "pouring": (N_("Fortes pluies"), "mdi:weather-pouring"),
    "lightning": (N_("Orage"), "mdi:weather-lightning"), "lightning-rainy": (N_("Orage et pluie"), "mdi:weather-lightning-rainy"),
    "snowy": (N_("Neige"), "mdi:weather-snowy"), "snowy-rainy": (N_("Pluie et neige"), "mdi:weather-snowy-rainy"),
    "hail": (N_("Grêle"), "mdi:weather-hail"), "fog": (N_("Brouillard"), "mdi:weather-fog"),
    "windy": (N_("Venteux"), "mdi:weather-windy"), "windy-variant": (N_("Venteux et nuageux"), "mdi:weather-windy-variant"),
    "exceptional": (N_("Conditions exceptionnelles"), "mdi:alert-circle-outline"),
}


def condition_icon(condition: str, night: bool = False) -> str:
    """Icon of a condition; at night the sun gives way to the moon."""
    if night and condition == "sunny":
        return "mdi:weather-night"
    if night and condition == "partlycloudy":
        return "mdi:weather-night-partly-cloudy"
    return CONDITIONS.get(condition, ("", "mdi:weather-cloudy"))[1]


def condition_label(condition: str) -> str:
    return t(CONDITIONS.get(condition, (condition, ""))[0])
