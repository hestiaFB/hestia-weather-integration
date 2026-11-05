"""The Hestia bricks Hestia Weather can feed, and how each one stands with this place: what the « Écosystème Hestia » screen says.

Hestia Weather consumes no other brick: it only publishes. A brick is « relié » when it listens to this place through the
published interface (api.py), « installé » when Home Assistant has it set up but it does not listen here, else missing or yet
to come. Nothing is guessed from the other bricks' settings (Écosystème Hestia, rule 3).
"""
from __future__ import annotations

from collections.abc import Collection, Mapping
from dataclasses import dataclass


@dataclass(frozen=True)
class Brick:
    domain: str
    name: str
    takes: str
    """What it takes from Hestia Weather, in a few words."""
    url: str = ""
    """Where to install it; empty while it does not exist yet."""


BRICKS = (
    Brick("hestia_comfort", "Hestia Confort", "votre station, vos alertes et vos prévisions, pour conseiller d’ouvrir ou de fermer au bon moment",
          "https://github.com/hestiaFB/hestia-comfort-integration"),
    Brick("hestia_heating", "Hestia Chauffage", "le froid à venir, l’ensoleillement et les degrés-jours, pour chauffer au bon moment"),
    Brick("hestia_garden", "Hestia Jardin", "la pluie tombée et à venir, pour n’arroser que si c’est utile"),
    Brick("hestia_energy", "Hestia Énergie", "l’ensoleillement prévu, pour estimer la production solaire"),
)


def links(linked: Mapping[str, int], installed: Collection[str]) -> str:
    """One line per brick, for the settings: linked to this place, installed but not linked, not installed, or to come.

    `linked`: the bricks listening to this place, by domain (an unnamed listener counts under ""); `installed`: the domains set up."""
    lines = []
    for b in BRICKS:
        if linked.get(b.domain):
            lines.append(f"- ✅ **{b.name}** · relié à ce lieu : il reprend {b.takes}.")
        elif b.domain in installed:
            lines.append(f"- **{b.name}** · installé, pas relié à ce lieu. Reliez-le dans ses propres réglages : il reprendra {b.takes}.")
        elif b.url:
            lines.append(f"- **{b.name}** · non installé. Il reprendrait {b.takes}. [L’installer]({b.url})")
        else:
            lines.append(f"- **{b.name}** · à venir : il reprendra {b.takes}.")
    if others := linked.get(""):
        lines.append(f"- {others} autre{'s' if others > 1 else ''} lien{'s' if others > 1 else ''} actif{'s' if others > 1 else ''} vers ce lieu.")
    return "\n".join(lines)


def states(linked: Mapping[str, int], installed: Collection[str]) -> list[dict[str, str]]:
    """The same as `links`, one entry per brick, for the Hestia panel: `state` is linked, installed, missing or future."""
    return [{"domain": b.domain, "name": b.name, "takes": b.takes, "url": b.url,
             "state": "linked" if linked.get(b.domain) else "installed" if b.domain in installed else "missing" if b.url else "future"}
            for b in BRICKS]


def summary(linked: Mapping[str, int]) -> str:
    """The menu's line: the bricks linked to this place, or none."""
    names = [b.name for b in BRICKS if linked.get(b.domain)]
    return ", ".join(names) if names else "aucune brique reliée"
