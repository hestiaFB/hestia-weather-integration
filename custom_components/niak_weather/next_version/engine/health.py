"""The technical state of a place, for the home page of the « Météo » tab: what works, what needs the user, what could be set better.

Orange (`bad`) is only for what stops something from working; a better setting is a tip, never orange. Grey (`none`) is what is
not used. Every text is French, short, and says what the user gains or loses.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from .families import STATION_DEPENDENT
from .i18n import N_, language, t

STALE_FORECAST = 90
"""Minutes after which a forecast that should come every 15 minutes is old."""
# Where an entity's missing source is set (an assistant step); the others are station sensors.
NEED_STAGE = {"vigilance": 0, "qualite_air": 2, "pollens": 3, "restrictions_eau": 6}
# What a station sensor brings, when the station has one that is not chosen.
GAINS = {
    "temperature_entity": N_("la température mesurée chez vous, au lieu de celle du service météo"),
    "humidity_entity": N_("l’humidité mesurée chez vous, pour le ressenti, le brouillard et le séchage du linge"),
    "rain_rate_entity": N_("la pluie qui tombe maintenant, pour l’alerte de pluie forte"),
    "wind_gust_entity": N_("les rafales mesurées, pour l’alerte de vent fort"),
    "wind_bearing_entity": N_("la direction du vent, pour les autres briques (ouvrir côté abrité)"),
    "pressure_entity": N_("la tendance de la pression, signe d’une dégradation"),
    "uv_index_entity": N_("l’indice UV, pour l’alerte UV forts"),
    "solar_radiation_entity": N_("l’ensoleillement mesuré"),
}


@dataclass(frozen=True)
class Sensor:
    label: str
    """What it measures (« Rafales »)."""
    name: str
    status: str
    """« ok », « silent » (unavailable or unknown) or « missing » (no longer in Home Assistant)."""
    age: float | None = None
    """Minutes since its last value (ok) or since it stopped answering (silent)."""


@dataclass(frozen=True)
class Facts:
    title: str
    failed: bool = False
    restarting: bool = False
    """Saved a moment ago: it computes again shortly, nothing is missing yet."""
    weather: str = ""
    weather_ok: bool = True
    forecast_age: float | None = None
    forecast_hours: int | None = None
    forecast_days: int | None = None
    computation_age: float | None = None
    history_sources: int | None = None
    interface_version: int = 1
    vigilance: str = ""
    vigilance_ok: bool = True
    vigilance_found: str = ""
    """A Météo-France vigilance sensor Home Assistant has, when none is chosen."""
    season: str = ""
    water: str = ""
    """Vigieau's sensor, by name; "" when not chosen."""
    water_ok: bool = True
    lightning: str = ""
    """Blitzortung's distance sensor, by name; "" when not chosen."""
    lightning_ok: bool = True
    """It answers: « unknown » is its quiet state, not a failure."""
    station: str = ""
    """The station's model (« GW2000A »), "" without a station."""
    sensors: Sequence[Sensor] = ()
    history: bool = True
    unused: Sequence[tuple[str, str, str]] = ()
    """Station sensors Home Assistant has but that are not chosen: (field, label, sensor name)."""
    air: str = ""
    air_ok: bool = True
    atmo_installed: bool = False
    pollen: str = ""
    pollen_ok: bool = True
    pollen_available: bool = False
    entities: Sequence[tuple[str, str, str, bool, bool]] = ()
    """(key, name, family, enabled, has a value)."""
    needs: dict[str, str] = field(default_factory=dict)
    """What an entity still misses, by key: « la vigilance officielle »."""
    ready_families: Sequence[str] = ()
    """Families switched off whose entities would all have their source."""
    integration: str = ""
    card_twice: bool = False
    """The card from HACS is still installed next to the one the integration serves."""
    links: Sequence[str] = ()


def _duration(minutes: float) -> str:
    """« 5 min », « 3 h », « 2 j »."""
    if minutes < 60:
        return t("{n} min", n=round(minutes))
    return t("{n} h", n=round(minutes / 60)) if minutes < 48 * 60 else t("{n} j", n=round(minutes / 1440))


def ago(minutes: float | None) -> str:
    if minutes is None:
        return ""
    return t("à l’instant") if minutes < 1.5 else t("il y a {duration}", duration=_duration(minutes))


def _since(minutes: float | None) -> str:
    return " " + t("depuis {duration}", duration=_duration(minutes)) if minutes is not None and minutes >= 1.5 else ""


def _count(n: int, one: str, many: str, **values: object) -> str:
    """One of two French texts with {n}, chosen by n: « 0 point », « 3 points » (« 0 points » in English)."""
    return t(one, n=n, **values) if n == 1 or n == 0 and language() == "fr" else t(many, n=n, **values)


def _line(level: str, text: str, why: str = "", stage: int | None = None) -> dict:
    return {"level": level, "text": text, "why": why, "stage": stage}


def silent_sources(f: Facts) -> list[str]:
    """The chosen air and pollen sources that do not answer, one line per provider: « Atmo France ne répond pas : qualité de l’air et pollens »."""
    if f.failed or f.restarting:
        return []
    down: dict[str, list[str]] = {}
    for what, value, good in ((t("qualité de l’air"), f.air, f.air_ok), (t("pollens"), f.pollen, f.pollen_ok)):
        if value and not good:
            down.setdefault(value.split(" · ")[0], []).append(what)
    return [t("{provider} ne répond pas : {what}", provider=provider, what=t(" et ").join(whats)) for provider, whats in down.items()]


def report(f: Facts) -> dict:
    todo: list[dict] = []
    tips: list[dict] = []
    enabled = {key for key, _, _, on, _ in f.entities if on}
    names = {key: name for key, name, _, _, _ in f.entities}

    # ---- What stops something from working ----
    if f.failed:
        todo.append(_line("bad", t("Calcul arrêté"), t("Home Assistant n’a pas pu démarrer ce lieu : vérifiez ses réglages ou les journaux (cherchez « weather »)."), 0))
    if not f.weather_ok:
        todo.append(_line("bad", t("Le service météo ne répond pas"), t("{service} : pas de prévisions tant qu’il ne revient pas.", service=f.weather or t("Aucun service choisi")), 0))
    elif not f.failed and not f.restarting and f.forecast_age is None:
        todo.append(_line("bad", t("Prévisions pas encore reçues"), t("Le service météo n’a pas encore donné ses prévisions heure par heure."), 0))
    elif f.forecast_age is not None and f.forecast_age > STALE_FORECAST:
        todo.append(_line("bad", t("Prévisions anciennes"), t("Reçues {when} : le service météo ne les renouvelle plus.", when=ago(f.forecast_age)), 0))
    broken = [s for s in f.sensors if s.status != "ok"]
    oldest = max((s.age for s in broken if s.age is not None), default=None)
    if f.sensors and len(broken) == len(f.sensors):
        todo.append(_line("bad", t("La station ne répond pas"),
                          t("Aucun de ses {n} capteurs ne donne de valeur{since} : Hestia s’appuie sur le service météo.", n=len(f.sensors), since=_since(oldest)), 1))
    elif broken:
        when = _since(oldest)
        todo.append(_line("bad", _count(len(broken), "{n} capteur de la station ne répond pas", "{n} capteurs de la station ne répondent pas"),
                          ", ".join(s.label for s in broken) + (f" ·{when}" if when else "") + ".", 1))
    for key, text in f.needs.items():
        if key in enabled:
            if key in STATION_DEPENDENT:
                if f.station:
                    why = (t("Facultatif : {need} mesure l’indice chez vous ; sans lui, l’indice UV du service météo est utilisé.", need=t(text)) if key == "uv_fort"
                           else t("Facultatif : {need} permet cette fonction.", need=t(text)))
                    tips.append(_line("tip", t("Compléter : {name}", name=names.get(key, key)), why, 1))
                continue
            todo.append(_line("bad", t("{name} : active sans source", name=names.get(key, key)), t("Il faut {need} : elle reste vide.", need=t(text)), NEED_STAGE.get(key, 1)))
    for text in silent_sources(f):
        todo.append(_line("bad", text, t("Ses valeurs restent vides tant qu’elle ne revient pas : voyez son intégration dans Appareils et services."), 2))
    if f.card_twice:
        todo.append(_line("bad", t("Carte installée deux fois"), t("Retirez la carte Hestia Weather de HACS : l’intégration la fournit maintenant."), None))

    # ---- What could be set better ----
    if not f.station:
        tips.append(_line("tip", t("Ajouter une station météo"),
                          t("Sans station, la température, la pluie et le vent viennent du service météo, à quelques kilomètres. "
                            "Facultative, une station ajoute les mesures chez vous, les cumuls de pluie et les fonctions liées à ses capteurs."), 1))
    else:
        for key, label, name in f.unused:
            tips.append(_line("tip", t("Ajouter : {what}", what=f"{label[:1].lower()}{label[1:]}" if language() == "fr" else label),
                              t("Votre station en a un (« {name} ») : {gain}.", name=name, gain=t(GAINS.get(key, N_("une mesure de plus")))), 1))
        if not f.history:
            tips.append(_line("tip", t("Calculer depuis l’historique"),
                              t("Cumuls de pluie, tendance de la température et rafale du jour, quand la station ne les donne pas."), 1))
    if not f.vigilance and "vigilance" not in enabled:
        tips.append(_line("tip", t("Choisir la vigilance officielle"),
                          t("Un capteur est disponible (« {name} ») : les alertes officielles s’ajoutent à celles de Hestia.", name=f.vigilance_found), 0)
                    if f.vigilance_found else
                    _line("tip", t("Ajouter la vigilance officielle"),
                          t("Installez Météo-France ou MeteoSwiss pour votre région : les alertes officielles s’ajoutent à celles de Hestia."), 0))
    if not f.air:
        tips.append(_line("tip", t("Choisir une zone Atmo France"), t("Atmo France est installée : l’indice de l’air du jour et ses polluants."), 2)
                    if f.atmo_installed else
                    _line("tip", t("Ajouter la qualité de l’air"), t("Installez Atmo France : l’indice de l’air et les pollens du jour."), 2))
    if not f.pollen and f.pollen_available:
        tips.append(_line("tip", t("Suivre les pollens"), t("Une source de pollens est installée : l’indice du jour, espèce par espèce."), 3))
    if f.ready_families:
        tips.append(_line("tip", t("Entités Hestia Weather à activer : {families}", families=", ".join(f.ready_families)),
                          t("Hestia Weather peut les créer pour vos automatisations : leurs sources sont en place. La carte n’en a pas besoin."), 4))

    # ---- Sources ----
    forecast_ok = f.weather_ok and f.forecast_age is not None and f.forecast_age <= STALE_FORECAST
    # A key for the panel, a label for people: a translated label is never compared.
    sources = [{"key": "forecast", "label": t("Prévisions"), "level": "ok" if forecast_ok else "bad",
                "text": f"{f.weather} · " + (t("ne répond pas") if not f.weather_ok else t("pas encore reçues") if f.forecast_age is None
                                             else t("reçues {when}", when=ago(f.forecast_age)))}]
    if f.vigilance:
        sources.append({"key": "vigilance", "label": t("Vigilance"), "level": "ok" if f.vigilance_ok else "bad",
                        "text": f.vigilance + ("" if f.vigilance_ok else " · " + t("ne répond pas"))})
    else:
        sources.append({"key": "vigilance", "label": t("Vigilance"), "level": "bad" if "vigilance" in enabled else "none", "text": t("aucun capteur choisi")})
    if f.station:
        ok = len(f.sensors) - len(broken)
        sources.append({"key": "station", "label": t("Station"), "level": "bad" if broken else "ok",
                        "text": f"{f.station} · " + (_count(len(f.sensors), "{n} capteur, tous répondent", "{n} capteurs, tous répondent") if not broken
                                                    else _count(ok, "{n} capteur sur {total} répond", "{n} capteurs sur {total} répondent", total=len(f.sensors)))})
    else:
        sources.append({"key": "station", "label": t("Station"), "level": "none", "text": t("pas de station")})
    for key, label, value, good in (("air", t("Qualité de l’air"), f.air, f.air_ok), ("pollen", t("Pollens"), f.pollen, f.pollen_ok)):
        sources.append({"key": key, "label": label, "level": "none" if not value else "ok" if good else "bad",
                        "text": t("aucune source") if not value else value + ("" if good else " · " + t("ne répond pas"))})
    sources.append({"key": "season", "label": t("Saison"), "level": "ok" if f.season else "none", "text": f.season or t("pas de capteur : suit la date")})
    # Optional extras: shown once chosen, never as a grey line for every home that has no use for them.
    for key, label, value, good in (("water", t("Restrictions d’eau"), f.water, f.water_ok), ("lightning", t("Éclairs"), f.lightning, f.lightning_ok)):
        if value:
            sources.append({"key": key, "label": label, "level": "ok" if good else "bad", "text": value + ("" if good else " · " + t("ne répond pas"))})

    # ---- The station's sensors, those that do not answer first ----
    sensors = []
    for s in sorted(f.sensors, key=lambda s: s.status == "ok"):
        if s.status == "ok":
            text = ago(s.age)
        elif s.status == "missing":
            text = t("n’existe plus")
        else:
            text = t("ne répond pas") + (f" · {_duration(s.age)}" if s.age is not None and s.age >= 1.5 else "")
        sensors.append({"label": s.label, "name": s.name, "level": "ok" if s.status == "ok" else "bad", "text": text})

    # ---- Entities ----
    active = [e for e in f.entities if e[3]]
    empty = [e[1] for e in active if not e[4]]
    families_on = list(dict.fromkeys(e[2] for e in active))
    off_families = [fam for fam in dict.fromkeys(e[2] for e in f.entities) if fam not in families_on]
    off = len(f.entities) - len(active)
    entities = [{"level": "ok", "text": t("{n} actives sur {total}", n=len(active), total=len(f.entities)), "why": ", ".join(families_on)}]
    if empty:
        entities.append({"level": "none", "text": _count(len(empty), "{n} active sans valeur", "{n} actives sans valeur"),
                         "why": ", ".join(empty) + " · " + t("rien à afficher pour l’instant, ou source manquante")})
    if off:
        entities.append({"level": "none", "text": _count(off, "{n} désactivée", "{n} désactivées"),
                         "why": ", ".join(off_families) if off_families else t("dans les familles actives")})

    # ---- Versions and links ----
    versions = [{"level": "ok", "text": t("Intégration {version}", version=f.integration), "why": t("préversion") if "b" in f.integration else ""}]
    versions.append({"level": "bad" if f.card_twice else "ok", "text": t("Carte {version}", version=f.integration),
                     "why": t("installée deux fois : retirez celle de HACS") if f.card_twice else t("fournie par l’intégration")})
    versions += [{"level": "ok", "text": t("Relié à {name}", name=name), "why": ""} for name in f.links] or [
        {"level": "none", "text": t("Aucune brique Hestia reliée"), "why": t("Hestia Confort peut reprendre la station, les alertes et les prévisions de ce lieu")}]

    return {"title": f.title, "level": "action" if todo else "ok",
            "summary": _count(len(todo), "{n} point à régler", "{n} points à régler") if todo else t("Tout est suivi"),
            "tips_summary": _count(len(tips), "{n} réglage à améliorer", "{n} réglages à améliorer") if tips else "", "version": f.integration,
            "todo": todo, "tips": tips, "sources": sources, "sensors": sensors, "entities": entities, "versions": versions,
            "technical": {"station": {"name": f.station, "responding": len(f.sensors) - len(broken), "configured": len(f.sensors),
                                       "history": f.history, "history_sources": f.history_sources},
                          "forecast": {"hours": f.forecast_hours, "days": f.forecast_days,
                                       "received": ago(f.forecast_age) or None},
                          "computation": ago(f.computation_age) or None,
                          "entities": {"active": len(active), "with_value": len(active) - len(empty), "total": len(f.entities)},
                          "integration": f.integration, "links": list(f.links), "interface_version": f.interface_version}}
