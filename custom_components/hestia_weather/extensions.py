"""Optional integrations: installation belongs to Home Assistant, selection to each Weather place.

Downloaded HACS repositories, config entries and entity platforms are separate evidence of installation.
A proposed sensor in a draft never counts as a saved configuration on the overview.
"""
from __future__ import annotations

from typing import Any, Mapping

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .engine.i18n import N_, t

# id, integration domain, name, benefit, repository, configuration stage, sensor setting
CATALOGUE = (
    ("meteo_france", "meteo_france", "Météo-France", N_("Prévisions du lieu et vigilance officielle."), "", 0, "weather_entity"),
    ("atmo", "atmofrance", "Atmo France", N_("Qualité de l’air et pollens de votre commune."), "sebcaps/atmofrance", 2, ""),
    ("vigieau", "vigieau", "Vigieau", N_("Restrictions d’eau et usages concernés."), "kamaradclimber/vigieau", 6, "water_restriction_entity"),
    ("blitzortung", "blitzortung", "Blitzortung", N_("Éclairs à proximité, distance et direction de l’orage."), "mrk-its/homeassistant-blitzortung", 0, "lightning_entity"),
    ("waqi", "waqi", "WAQI", N_("Qualité de l’air mesurée par une station près de chez vous."), "", 2, ""),
    ("polleninformation", "polleninformation", "Polleninformation", N_("Pollens par espèce dans les pays couverts."), "krissen/polleninformation", 3, ""),
    ("irm_kmi", "irm_kmi", "IRM KMI", N_("Pollens en Belgique."), "jdejaegh/irm-kmi-ha", 3, ""),
    ("swiss_pollen", "swiss_pollen", "Swiss Pollen", N_("Mesures de pollens en Suisse."), "frimtec/hass-swiss-pollen", 3, ""),
    ("kleenex_pollenradar", "kleenex_pollenradar", "Kleenex / Scottex", N_("Pollens en France et dans les pays couverts."), "MarcoGos/kleenex_pollenradar", 3, ""),
)
# Integrations Weather could read one day: listed only when Home Assistant has them loaded (socle 1.18, « Demander »).
OTHERS = (
    {"key": "vigicrues", "name": "Vigicrues", "use": N_("Pourrait dire la hauteur de la rivière proche et sa vigilance crues.")},
    {"key": "meteoalarm", "name": "Meteoalarm", "use": N_("Pourrait donner les vigilances officielles hors de France.")},
    {"key": "pirateweather", "name": "Pirate Weather", "use": N_("Pourrait donner les prévisions et la pluie à venir hors de France.")},
)


def others(hass: HomeAssistant) -> list[dict[str, str]]:
    """The OTHERS this Home Assistant has loaded, with what Weather could do with each, in the reader's language."""
    loaded = getattr(hass.config, "components", None) or set()
    return [{**o, "use": t(o["use"])} for o in OTHERS if o["key"] in loaded]


COMFORT_API = "hestia_comfort_api"


def comfort_api(hass: HomeAssistant) -> Any:
    candidate = hass.data.get(COMFORT_API)
    return candidate if getattr(candidate, "version", None) == 1 else None


def official(hass: HomeAssistant, entry_id: str | None) -> list[dict[str, Any]]:
    """Hestia's own bricks for this place. Hestia Confort keeps the link and Weather reads or changes it through
    Confort's interface, so turning it off on either side turns it off on both."""
    link = comfort_api(hass)
    installed = link is not None or bool(hass.config_entries.async_entries("hestia_comfort"))
    switchable = link is not None and hasattr(link, "set_weather")
    if switchable:
        chosen = link.weather()
    else:
        # A Hestia Confort older than 1.7.21 only says it by listening to a place.
        weather = hass.data.get("hestia_weather_api")
        chosen = entry_id if weather is not None and entry_id and weather.linked(entry_id).get("hestia_comfort") else None
    other = hass.config_entries.async_get_entry(chosen) if chosen and chosen != entry_id else None
    return [{"id": "hestia_comfort", "name": "Hestia Confort", "official": True, "installed": installed,
             "linked": bool(entry_id) and chosen == entry_id, "elsewhere": other.title if other else "",
             "switchable": switchable,
             "description": t("Vos pièces comparées au dehors de ce lieu : quand aérer, quand fermer, quand chauffer."),
             "url": "https://github.com/hestiaFB/hestia-comfort-integration"}]


async def set_official(hass: HomeAssistant, key: str, entry_id: str, enabled: bool) -> None:
    """Links this place to the brick, or unlinks it if it is the one linked. Raises ValueError with a sentence to show."""
    link = comfort_api(hass) if key == "hestia_comfort" else None
    if link is None or not hasattr(link, "set_weather"):
        raise ValueError(t("Mettez à jour Hestia Confort pour régler la liaison depuis Hestia Weather."))
    if enabled:
        await link.set_weather(entry_id)
    elif link.weather() == entry_id:
        await link.set_weather(None)


def inventory(hass: HomeAssistant, options: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Installation is global, configuration is read from this place's saved options only."""
    entities = er.async_get(hass).entities
    platforms = {e.platform for e in entities.values()}
    installed = platforms | {e.domain for e in hass.config_entries.async_entries()}
    result = []
    for key, domain, name, benefit, repository, stage, field in CATALOGUE:
        if key == "meteo_france":
            chosen = any((entity := entities.get(options.get(setting, ""))) is not None and entity.platform == domain
                         for setting in ("weather_entity", "vigilance_entity"))
        elif field:
            chosen = bool(options.get(field))
        elif key == "atmo":
            chosen = (options.get("air_source") not in ("none", "waqi") and bool(options.get("atmo_air_entity"))
                      or options.get("pollen_source") not in ("none", "legacy") and bool(options.get("atmo_pollen_entity")))
        elif key == "waqi":
            chosen = options.get("air_source") == "waqi" and bool(options.get("waqi_air_entity"))
        else:
            chosen = (options.get("pollen_source") == "legacy" and (options.get("pollen_provider") or "polleninformation") == key
                      and bool(options.get("pollens")))
        downloaded = False
        hacs = hass.data.get("hacs")
        if hacs is not None and repository:
            try:
                repo = hacs.repositories.get_by_full_name(repository)
                downloaded = bool(repo is not None and repo.data.installed)
            except (AttributeError, KeyError):
                pass  # HACS's internals are optional: config entries and registry still work.
        result.append({"id": key, "name": name, "description": t(benefit), "installed": domain in installed or downloaded,
                       "configured": chosen,
                       "air_configured": options.get("air_source") not in ("none", "waqi") and bool(options.get("atmo_air_entity")) if key == "atmo" else False,
                       "pollen_configured": options.get("pollen_source") not in ("none", "legacy") and bool(options.get("atmo_pollen_entity")) if key == "atmo" else False,
                       "stage": stage, "field": field,
                       "url": f"https://github.com/{repository}" if repository else f"https://www.home-assistant.io/integrations/{domain}/" if key in ("waqi", "meteo_france") else "",
                       "integration": domain,
                       "install": (t("Dans HACS, cherchez « Blitzortung.org Lightning Detector » et téléchargez-le. Redémarrez Home Assistant, "
                                     "puis ajoutez l’intégration « Blitzortung » dans Paramètres → Appareils et services. Choisissez votre maison.")
                                   if key == "blitzortung" else t("Ajoutez l’intégration « {name} » dans Paramètres → Appareils et services.", name=name)
                                   + (" " + t("Si elle n’apparaît pas, téléchargez-la dans HACS, redémarrez Home Assistant, puis revenez l’ajouter.") if repository else ""))})
    result.append(online_service(options))
    return result


def online_service(options: Mapping[str, Any]) -> dict[str, Any]:
    """Open-Meteo is no integration: Hestia Weather asks it directly, with the home's position rounded to about a hundred metres.
    It gives the pressure to come when the weather service has none (Météo-France), and tomorrow's air when WAQI gives the air."""
    pressure = options.get("open_meteo_pressure", True) is not False
    air = options.get("air_source") == "waqi"
    uses = [t("la pression à venir, quand votre service météo ne la prévoit pas") if pressure else "",
            t("l’air de demain, avec WAQI") if air else ""]
    return {"id": "open_meteo", "name": "Open-Meteo", "online": True,
            "description": t("Service météo en ligne, gratuit et sans compte, que Hestia Weather interroge directement."),
            "detail": (t("Utilisé pour {uses}.", uses=t(" et ").join(u for u in uses if u)) if pressure or air else t("Pas utilisé pour ce lieu."))
                      + " " + t("Il reçoit la position de la maison, arrondie à environ 100 m."),
            "installed": True, "configured": pressure, "air_configured": air, "pollen_configured": False,
            "stage": 0, "field": "open_meteo_pressure", "url": "https://open-meteo.com", "integration": "", "install": ""}
