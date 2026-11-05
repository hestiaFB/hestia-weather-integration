"""The nuance of the sky inside a Home Assistant condition, as Météo-France tells it apart: drizzle or showers, freezing rain,
mist or dense fog… Home Assistant folds Météo-France's 45 descriptions into 12 conditions; the card draws each nuance."""
from __future__ import annotations

import unicodedata

# Météo-France description (Home Assistant's meteo_france const.py) → (condition, nuance). An empty nuance is the plain scene.
DESCRIPTIONS: dict[str, tuple[str, str]] = {
    "ensoleille": ("sunny", ""),
    "nuit claire": ("clear-night", ""), "ciel clair": ("clear-night", ""),
    "peu nuageux": ("partlycloudy", "few"),
    "eclaircies": ("partlycloudy", ""), "variable": ("partlycloudy", ""),
    "ciel voile": ("partlycloudy", "veil"), "ciel voile nuit": ("partlycloudy", "veil"),
    "tres nuageux": ("cloudy", ""), "couvert": ("cloudy", "overcast"),
    "brume": ("fog", "mist"), "brume ou bancs de brouillard": ("fog", "mist"),
    "bancs de brouillard": ("fog", "patches"),
    "brouillard": ("fog", ""), "brouillard dense": ("fog", "dense"),
    "brouillard givrant": ("fog", "freezing-fog"), "brouillard dense givrant": ("fog", "freezing-fog"),
    "bruine": ("rainy", "drizzle"), "pluie faible": ("rainy", "drizzle"), "bruine / pluie faible": ("rainy", "drizzle"),
    "rares averses": ("rainy", "showers-light"), "pluies eparses": ("rainy", "showers-light"),
    "pluies eparses / rares averses": ("rainy", "showers-light"), "averses faibles": ("rainy", "showers-light"),
    "averses": ("rainy", "showers"), "pluie / averses": ("rainy", "showers"),
    "pluie": ("rainy", ""), "pluie moderee": ("rainy", ""),
    "pluie forte": ("pouring", ""),
    "pluie et neige": ("snowy-rainy", ""), "averses de pluie et neige": ("snowy-rainy", "sleet-showers"),
    "pluie verglacante": ("snowy-rainy", "freezing-rain"),
    "quelques flocons": ("snowy", "flurries"), "neige faible": ("snowy", "flurries"), "averses de neige faible": ("snowy", "flurries"),
    "averses de neige": ("snowy", "snow-showers"),
    "neige": ("snowy", ""), "neige / averses de neige": ("snowy", ""),
    "neige forte": ("snowy", "heavy-snow"),
    "risque de grele": ("hail", ""), "averses de grele": ("hail", ""),
    "risque d'orages": ("lightning", "storm-risk"), "orages": ("lightning", ""), "orage avec grele": ("lightning", "storm-hail"),
    "pluies orageuses": ("lightning-rainy", ""), "pluie orageuses": ("lightning-rainy", ""),
    "averses orageuses": ("lightning-rainy", "storm-showers"),
}


def _key(text: str) -> str:
    """Lower case, no accents, straight apostrophes, single spaces: « Risque d’orages » → « risque d'orages »."""
    plain = unicodedata.normalize("NFKD", text.replace("’", "'")).encode("ascii", "ignore").decode()
    return " ".join(plain.lower().split())


def sky_detail(condition: str, description: str | None, rain: float | None, temperature: float | None) -> str:
    """The nuance for the sky drawn now. Météo-France's own description wins when it agrees with the condition shown
    (a rain gauge may have replaced it); otherwise the nuance comes from the figures: `rain` in mm per hour (measured,
    else forecast for this hour) and `temperature` in °C. Empty when nothing sets this sky apart."""
    found = DESCRIPTIONS.get(_key(description)) if description else None
    if found and found[0] == condition:
        return found[1]
    if condition == "snowy-rainy" and temperature is not None and temperature <= 0:
        return "freezing-rain"
    if rain is None:
        return ""
    if condition == "rainy" and 0 < rain < 0.5:
        return "drizzle"
    if condition == "snowy":
        # Water equivalent: under 0.3 mm/h a few flakes, from 3 mm/h heavy snow.
        return "flurries" if 0 < rain < 0.3 else "heavy-snow" if rain >= 3 else ""
    return ""
