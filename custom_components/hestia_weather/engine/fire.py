"""Nearby fires from the PyroVeille integration (vico34/pyroveille): the fires reported on feuxdeforet.fr around the home.

Its « Alerte incendie proche » binary sensor lists, in one attribute, the fires within the radius chosen in PyroVeille, each with its
commune, its status (active, reported or inactive), its position and its distance. That map is fed by reports, it is no official vigilance:
Hestia-FB says where it comes from. With the wind blowing at home, it also tells whether the smoke may come towards the house."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Sequence

from .atmo import normal
from .i18n import N_, t
from .lightning import bearing, direction_words
from .settings import Settings
from .units import Kind, finite, french, measurement

STATES = ("aucun", "eteint", "signale", "actif")
"""The states of the « Incendie proche » sensor: the nearest fire still burning, else an extinguished one, else none."""
WORDS = (N_("Aucun feu signalé"), N_("Feu éteint"), N_("Feu signalé"), N_("Feu actif"))
INACTIVE, REPORTED, ACTIVE = 1, 2, 3
_STATUS = {"active": ACTIVE, "actif": ACTIVE, "reported": REPORTED, "signale": REPORTED, "inactive": INACTIVE, "inactif": INACTIVE,
           "eteint": INACTIVE}
NEAR_KM = 10
"""An active fire closer than this needs attention, whatever the wind."""
SMOKE_SPREAD = 45
"""The wind comes from the fire's side when its direction is within this many degrees of the fire's: the smoke may reach the house."""


@dataclass(frozen=True)
class Fire:
    place: str
    """The commune (and department) PyroVeille gives, else the report's title."""
    status: int
    """INACTIVE, REPORTED or ACTIVE."""
    distance: float | None = None
    """Kilometres from the place PyroVeille watches."""
    azimuth: float | None = None
    """Degrees from the north, from the home towards the fire; None when its position is unknown."""
    url: str | None = None

    @property
    def burning(self) -> bool:
        return self.status >= REPORTED

    def where(self) -> str:
        """« à 4 km au sud-ouest (Gignac 34) »."""
        distance = t(" à {distance} km", distance=french(self.distance, 0 if self.distance >= 10 else 1)) if self.distance is not None else ""
        side = " " + t(direction_words(self.azimuth)) if self.azimuth is not None else ""
        return f"{distance}{side}" + (f" ({self.place})" if self.place else "")


@dataclass(frozen=True)
class Fires:
    entity_id: str
    fires: tuple[Fire, ...]
    """Nearest first."""
    radius: float | None = None
    """The radius PyroVeille watches, in kilometres."""
    smoke: bool = False
    """The wind blows from the nearest fire still burning towards the house."""

    @property
    def nearest(self) -> Fire | None:
        """The nearest fire still burning, else the nearest extinguished one."""
        return next((f for f in self.fires if f.burning), self.fires[0] if self.fires else None)

    @property
    def burning(self) -> tuple[Fire, ...]:
        return tuple(f for f in self.fires if f.burning)

    @property
    def state(self) -> int:
        """0 none, then INACTIVE, REPORTED or ACTIVE: the nearest fire's."""
        return self.nearest.status if self.nearest else 0

    @property
    def value(self) -> str:
        return STATES[self.state]

    @property
    def level(self) -> int:
        """0 nothing to do, 1 to watch (a fire reported or burning in the radius), 2 an active fire close or whose smoke comes this way."""
        fire = self.nearest
        if fire is None or not fire.burning:
            return 0
        close = fire.distance is not None and fire.distance <= NEAR_KM
        return 2 if fire.status == ACTIVE and (close or self.smoke) else 1

    @property
    def text(self) -> str:
        """« Feu actif à 4 km au sud-ouest (Gignac 34), fumée possible vers la maison · 2 autres feux dans le secteur »."""
        fire = self.nearest
        if fire is None:
            return t("Aucun feu signalé dans le secteur")
        text = t(WORDS[fire.status]) + fire.where()
        if self.smoke:
            text += t(", fumée possible vers la maison")
        others = len(self.burning) - 1
        if others > 0:
            text += " · " + (t("{count} autres feux dans le secteur", count=others) if others > 1 else t("1 autre feu dans le secteur"))
        return text

    def extra(self) -> dict[str, Any]:
        fire = self.nearest
        return {"statut": self.value, "lieu": fire.place if fire else None, "distance_km": fire.distance if fire else None,
                "direction": t(direction_words(fire.azimuth)) if fire and fire.azimuth is not None else None,
                "fumee_vers_maison": self.smoke, "feux_actifs": len(self.burning), "rayon_km": self.radius,
                "lien": fire.url if fire else None, "origine": "feuxdeforet.fr"}


def _status(alert: Mapping[str, Any]) -> int:
    status = _STATUS.get(normal(alert.get("fire_status") or alert.get("status")).strip())
    if status is not None:
        return status
    return ACTIVE if alert.get("active") is True else INACTIVE


def fire_of(alert: Mapping[str, Any], latitude: float | None, longitude: float | None) -> Fire:
    lat, lon = finite(alert.get("latitude")), finite(alert.get("longitude"))
    azimuth = (bearing(latitude, longitude, lat, lon)
               if lat is not None and lon is not None and latitude is not None and longitude is not None else None)
    distance = finite(alert.get("distance_km"))
    place = " ".join(str(p) for p in (alert.get("commune"), alert.get("department")) if p) or str(alert.get("title") or "")
    return Fire(place, _status(alert), round(distance, 1) if distance is not None and distance >= 0 else None, azimuth,
                str(alert.get("url") or "") or None)


def downwind(wind_from: float | None, azimuth: float | None) -> bool:
    """The wind comes from the fire's side: its smoke goes towards the house."""
    if wind_from is None or azimuth is None:
        return False
    return abs((wind_from - azimuth + 180) % 360 - 180) <= SMOKE_SPREAD


CALM = 5
"""Below this wind (km/h), its direction means nothing."""


def wind_from(station: float | None, bulletin: Mapping[str, Any], hours: Sequence[Any]) -> float | None:
    """Where the wind comes from now, in degrees: the station's when it has a wind vane, else the weather service's current wind, else
    its first forecast hour; None when the wind is calm or its direction unknown."""
    if station is not None:
        return station
    speed = measurement(bulletin.get("wind_speed"), bulletin.get("wind_speed_unit"), Kind.WIND)
    direction = finite(bulletin.get("wind_bearing"))
    if speed is not None and direction is not None:
        return direction % 360 if speed >= CALM else None
    first = hours[0] if hours else None
    speed, direction = (getattr(first, "wind_speed", None), getattr(first, "wind_bearing", None)) if first is not None else (None, None)
    return direction % 360 if speed is not None and speed >= CALM and direction is not None else None


def read(get: Callable[[str], Any], settings: Settings, latitude: float | None = None, longitude: float | None = None,
         wind_from: float | None = None) -> Fires | None:
    """The fires around the home, or None when PyroVeille is not chosen or does not answer. `wind_from` is where the wind comes from,
    in degrees, when it blows."""
    if not settings.fire_entity:
        return None
    state = get(settings.fire_entity)
    if state is None or state.state not in ("on", "off"):
        return None
    attributes = state.attributes or {}
    alerts = attributes.get("alerts")
    fires = [fire_of(a, latitude, longitude) for a in alerts if isinstance(a, Mapping)] if isinstance(alerts, (list, tuple)) else []
    if not fires and state.state == "on" and isinstance(attributes.get("nearest"), Mapping):
        fires = [fire_of(attributes["nearest"], latitude, longitude)]
    fires.sort(key=lambda f: (f.distance is None, f.distance or 0))
    result = Fires(settings.fire_entity, tuple(fires), finite(attributes.get("radius_km")))
    nearest = result.nearest
    return Fires(result.entity_id, result.fires, result.radius,
                 bool(nearest and nearest.burning and downwind(wind_from, nearest.azimuth)))
