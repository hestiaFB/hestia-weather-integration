"""What the « Hestia » home page says about Hestia Weather (socle v1, ECOSYSTEME.md § 8): one level, one sentence, a few details.

Blue (`ok`) when every place is computed with its station answering; orange (`action`) as soon as something needs the user.
Grey (`unknown`) is left to the socle, for when this status cannot be computed at all.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .i18n import language, t

@dataclass(frozen=True)
class Place:
    title: str
    loaded: bool = True
    station: int = 0
    """How many station sensors are chosen."""
    silent: Sequence[str] = ()
    """The chosen station sensors that do not answer (unavailable, unknown or gone), by name."""
    forecast: bool = True
    """Whether the weather service gave its forecast."""
    needs: Sequence[str] = ()
    """Enabled entities still missing their source, as « Vigilance : il faut la vigilance officielle »."""
    down: Sequence[str] = ()
    """The chosen air and pollen sources that do not answer, as « Atmo France ne répond pas : pollens »."""
    links: Sequence[str] = ()
    """The Hestia bricks listening to this place, by name."""


def _count(n: int, one: str, many: str) -> str:
    return t(one, n=n) if n == 1 or n == 0 and language() == "fr" else t(many, n=n)


def status(places: Sequence[Place], card_twice: bool = False) -> dict:
    """`card_twice`: the card from HACS is still installed next to the one the integration serves."""
    if not places:
        return {"level": "action", "summary": t("Aucun lieu suivi pour l’instant."),
                "details": [t("Ajoutez votre lieu dans l’onglet Météo.")], "links": []}
    todo: list[str] = []
    details: list[str] = []
    several = len(places) > 1
    for place in places:
        where = f" ({place.title})" if several else ""
        if not place.loaded:
            todo.append(t("Calcul arrêté : {place}", place=place.title))
            continue
        if place.station and len(place.silent) >= place.station:
            todo.append(t("La station ne répond pas{where}", where=where))
        elif place.silent:
            todo.append(t("Ne répond pas{where} : {names}", where=where, names=", ".join(place.silent)))
        if not place.forecast:
            todo.append(t("Prévisions pas encore reçues du service météo{where}", where=where))
        todo.extend(f"{need}{where}" for need in place.needs)
        todo.extend(f"{source}{where}" for source in place.down)
    if card_twice:
        todo.append(t("Carte installée deux fois : retirez la carte Hestia Weather de HACS"))
    links = [t("Relié à {name} · {place}", name=name, place=place.title) for place in places for name in place.links]
    stations = all(p.loaded and p.station for p in places)
    followed = (t("{n} lieux suivis avec leurs stations", n=len(places)) if stations else t("{n} lieux suivis", n=len(places))) if several \
        else t("1 lieu suivi avec sa station") if stations else t("1 lieu suivi")
    if todo:
        return {"level": "action", "summary": f"{followed}, " + _count(len(todo), "{n} point à régler.", "{n} points à régler."),
                "details": todo + details, "links": links}
    return {"level": "ok", "summary": f"{followed}, " + t("rien à régler."), "details": details, "links": links}
