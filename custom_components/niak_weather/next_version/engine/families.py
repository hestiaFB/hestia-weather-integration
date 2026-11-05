"""The entities by family, as the documentation and the settings show them, and what each one needs to give a value."""
from __future__ import annotations

from .i18n import N_
from .settings import Settings

# Each family, then the keys of its entities (the end of their unique id: <entry_id>_<key>).
FAMILIES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("maintenant", ("feels_like", "temps_observe", "pluie_en_cours", "brouillard", "dew_point", "frost_point", "humidex", "pressure_trend",
                    "temperature_trend", "rain_24h", "max_gust_today")),
    ("alertes", ("vigilance", "alert", "brief", "orage", "vent_fort", "pluie_forte", "gel", "canicule", "uv_fort")),
    ("prochaines_heures", ("bulletin", "next_rain", "pluie_heure", "pluie_6h", "pluie_24h_prevue", "minimale_nuit", "maximale_demain", "rafales_6h")),
    ("jardin", ("pluie_7j", "restrictions_eau")),
    ("batiment", ("degres_jours_chauffe", "degres_jours_clim")),
    ("energie", ("ensoleillement_demain",)),
    ("vie_pratique", ("sechage_linge", "givre_pare_brise", "qualite_air", "pollens")),
    ("meteo", ("weather",)),
)
DEFAULT_FAMILIES = ("maintenant", "alertes", "prochaines_heures")
_FAMILY = {key: family for family, keys in FAMILIES for key in keys}
# These enrichments need optional local measurements. Enabling their entities
# does not make a station mandatory, including after a station is removed.
STATION_DEPENDENT = frozenset({"uv_fort", "pluie_7j", "rain_24h", "pressure_trend", "max_gust_today", "temperature_trend"})


def family_of(key: str) -> str | None:
    return _FAMILY.get(key)


def needs(settings: Settings) -> dict[str, str]:
    """What is missing for an entity to give a value, in a few words; absent when nothing is."""
    rain_gauge = bool(settings.rain_total_entity or settings.daily_rain_entity or settings.rain_24h_entity)
    legacy = settings.pollen_source == "legacy" and bool(settings.pollens or settings.pollen_risk_entity)
    atmo_pollen = settings.pollen_source != "none" and bool(settings.atmo.get("atmo_pollen_entity"))
    missing = {
        "vigilance": not settings.vigilance_entity and N_("la vigilance officielle"),
        "restrictions_eau": not settings.water_restriction_entity and N_("l’intégration Vigieau"),
        "uv_fort": not settings.uv_index_entity and N_("un capteur UV (OpenUV, station…)"),
        "pluie_7j": not (rain_gauge and settings.station_history) and N_("un pluviomètre et l’historique de la station"),
        "rain_24h": not rain_gauge and N_("un pluviomètre"),
        "pressure_trend": not settings.pressure_entity and N_("un capteur de pression"),
        "max_gust_today": not (settings.max_daily_gust_entity or settings.wind_gust_entity) and N_("un capteur de rafales"),
        "temperature_trend": not (settings.temperature_trend_entity or settings.temperature_entity) and N_("un thermomètre extérieur"),
        "qualite_air": not (settings.waqi.get("waqi_air_entity") if settings.air_source == "waqi" else settings.atmo.get("atmo_air_entity")) and (
            N_("une station WAQI qui donne l’indice de qualité de l’air") if settings.air_source == "waqi" else
            N_("une zone Atmo France fournissant l’indice de qualité de l’air") if settings.atmo_area else N_("Atmo France ou WAQI")),
        "pollens": not (legacy or atmo_pollen) and (N_("une zone Atmo France fournissant l’indice pollen") if settings.pollen_source == "atmo" and (settings.atmo_pollen_area or settings.atmo_area) else N_("Atmo France, Polleninformation ou IRM KMI")),
    }
    return {key: text for key, text in missing.items() if text}


def enabled_at_first(key: str, chosen: list[str] | None, default: bool, settings: Settings) -> bool:
    """Whether an entity starts enabled: the families chosen at setup when there are some (and what it needs is there), else its own default."""
    family = family_of(key)
    if chosen is None or family is None:
        return default
    return family in chosen and key not in needs(settings)
