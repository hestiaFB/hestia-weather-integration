"""The river from the CrueVeille integration (vico34/crueveille, domain vigicrues_alert): the water height measured at the Vigicrues
station nearest to the home, through Hub'Eau, how fast it rises and where it would stand if the rise went on.

Its « Alerte inondation » binary sensor carries all of it, with a risk level CrueVeille works out from the thresholds the household set:
« clear », « watch », « warning » or « critical ». It is no official Vigicrues vigilance (the official one comes with Météo-France's
vigilance, « Crues » and « Inondation »): Hestia-FB says so. CrueVeille is young, Hestia-FB lists it as a beta extension."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from .atmo import normal
from .i18n import N_, t
from .settings import Settings
from .units import finite, french

RISKS = ("clear", "watch", "warning", "critical")
"""CrueVeille's risk levels."""
STATES = ("calme", "a_surveiller", "vigilance", "critique")
"""The states of the « Rivière » sensor."""
WORDS = (N_("Rien à signaler"), N_("À surveiller"), N_("Seuil de vigilance"), N_("Seuil critique"))
ALERT = 2
"""From this level, the brief tells it."""


@dataclass(frozen=True)
class River:
    level: int
    """0 clear to 3 critical."""
    entity_id: str
    station: str = ""
    """« La Loire à Orléans », as Vigicrues names its station."""
    height: float | None = None
    """Metres."""
    rise: float | None = None
    """Centimetres per hour; negative when the river goes down."""
    projected: float | None = None
    """Metres, if the rise went on over the hours set in CrueVeille."""
    reason: str = ""
    """CrueVeille's own words for its level (French)."""
    observed: str | None = None

    @property
    def value(self) -> str:
        return STATES[self.level]

    @property
    def label(self) -> str:
        return t(WORDS[self.level])

    @property
    def measure(self) -> str:
        """« 2,10 m, +8 cm/h »."""
        parts = []
        if self.height is not None:
            parts.append(f"{french(self.height, 2, 2)} m")
        if self.rise is not None and abs(self.rise) >= 0.5:
            parts.append(("+" if self.rise > 0 else "−") + f"{french(abs(self.rise), 0)} cm/h")
        return ", ".join(parts)

    @property
    def text(self) -> str:
        """« Seuil de vigilance · La Loire à Orléans : 2,10 m, +8 cm/h »."""
        where = self.station or t("Rivière")
        measure = self.measure
        return f"{self.label} · {where}" + (f" : {measure}" if measure else "")

    def extra(self) -> dict[str, Any]:
        return {"niveau": self.level, "libelle": self.label, "station": self.station or None, "hauteur_m": self.height,
                "montee_cm_h": self.rise, "hauteur_projetee_m": self.projected, "raison_crueveille": self.reason or None,
                "mesure_le": self.observed, "origine": "Hub'Eau (Vigicrues)"}


def level_of(value: Any) -> int | None:
    risk = normal(value).strip()
    return RISKS.index(risk) if risk in RISKS else None


def read(get: Callable[[str], Any], settings: Settings) -> River | None:
    """The river near the home, or None when CrueVeille is not chosen or does not answer."""
    if not settings.river_entity:
        return None
    state = get(settings.river_entity)
    if state is None or state.state in ("unavailable", "unknown"):
        return None
    attributes = state.attributes or {}
    level = level_of(attributes.get("risk_level"))
    if level is None:
        return None
    return River(level, settings.river_entity, str(attributes.get("station_name") or ""), finite(attributes.get("water_level_m")),
                 finite(attributes.get("rise_cm_h")), finite(attributes.get("forecast_height_m")), str(attributes.get("alert_reason") or ""),
                 str(attributes.get("height_observed_at") or "") or None)
