"""Water restrictions from the Vigieau integration (kamaradclimber/vigieau): the prefect's drought orders for the home's commune.

Its alert level sensor says « Pas de restriction », « Vigilance », « Alerte », « Alerte renforcée » or « Crise », and lists the restricted
uses in one attribute. Vigilance asks to save water but restricts nothing: the restrictions start at « Alerte »."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Callable
from .i18n import N_, t

from .atmo import normal
from .settings import Settings

LEVELS = ("aucune", "vigilance", "alerte", "alerte_renforcee", "crise")
"""The states of the « Restrictions d'eau » sensor."""
WORDS = (N_("Pas de restriction"), N_("Vigilance"), N_("Alerte"), N_("Alerte renforcée"), N_("Crise"))
ALERT = 2
"""From this level, uses are restricted: the card and the brief tell it."""
_STATES = {"pas de restriction": 0, "pas de restrictions": 0, "aucune restriction": 0, "vigilance": 1, "alerte": 2,
           "alerte renforcee": 3, "crise": 4, **{str(i): i for i in range(5)}}


@dataclass(frozen=True)
class Restriction:
    level: int
    """0 no restriction to 4 crisis."""
    entity_id: str
    usages: tuple[str, ...] = ()
    """The restricted uses, as the order names them."""
    order: str | None = None
    """The link to the prefect's order, when Vigieau gives it."""

    @property
    def value(self) -> str:
        return LEVELS[self.level]

    @property
    def label(self) -> str:
        return t(WORDS[self.level])

    @property
    def watering(self) -> bool:
        """Watering is among the restricted uses."""
        return any("arros" in normal(u) for u in self.usages)

    @property
    def text(self) -> str:
        """« Pas de restriction d’eau », « Vigilance : pas encore de restriction », « Alerte renforcée · 9 usages restreints, dont l’arrosage »."""
        if self.level == 0:
            return t("Pas de restriction d’eau")
        if self.level < ALERT:
            return t("Vigilance : pas encore de restriction, l’eau est à économiser")
        if not self.usages:
            return self.label
        n = len(self.usages)
        return (t("{level} · {count} usages restreints", level=self.label, count=n) if n > 1 else t("{level} · 1 usage restreint", level=self.label)) + (
            t(", dont l’arrosage") if self.watering else "")

    def extra(self) -> dict[str, Any]:
        return {"niveau": self.level, "libelle": self.label, "usages": list(self.usages), "arrosage_restreint": self.watering,
                "arrete": self.order}


def level_of(state: Any) -> int | None:
    return _STATES.get(normal(state).strip()) if state is not None else None


def usages(text: Any) -> tuple[str, ...]:
    """Vigieau joins the uses with commas; a use's own name may hold one (« toitures, façades »), so a new use starts on a capital."""
    return tuple(u.strip() for u in re.split(r",\s+(?=[A-ZÀ-Ý])", str(text or "")) if u.strip())


def read(get: Callable[[str], Any], settings: Settings) -> Restriction | None:
    """The restrictions of the day, or None when Vigieau is not chosen or does not answer."""
    if not settings.water_restriction_entity:
        return None
    state = get(settings.water_restriction_entity)
    level = level_of(state.state) if state is not None else None
    if level is None:
        return None
    attributes = state.attributes
    return Restriction(level, settings.water_restriction_entity, usages(attributes.get("current_restrictions")) if level >= ALERT else (),
                       str(attributes.get("source") or "") or None)
