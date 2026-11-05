"""Where the station stands, and when its measures cannot be trusted (docs/STATION-EMPLACEMENT.md, validated by Frank on
5 November 2026).

What the household says serves at once; what the nights learn replaces it:
- First be wary. Against a wall in the sun, or on the roof, the station's temperature is not the air's: while the sun faces
  that wall (until sunset, the wall keeping its heat), under a sky less than 60 % cloudy, a station warmer than the forecast
  by a degree or more gives way to the forecast. A wind coming from a sheltered side cannot be « calm »: the stronger of the
  station and the forecast is kept.
- Then check. Each night, the station is compared with Open-Meteo's forecast of the same hours over the last 92 days (the call
  that learns the station's shade, place/shade.py): the temperature by the sun's position and the sky, the wind by the side it
  comes from, the rain day by day.
- Correct only what is learned. The temperature loses the excess learned under that sun and that sky, never a number written
  in advance; the gap of overcast hours (a valley, a town) is the place's own climate and is never corrected. The wind and
  the rain are never corrected: a sheltered side takes the forecast, a sheltered gauge is only said.

Kept free of Home Assistant imports so that it can be tested like the rest of the engine.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, replace
from datetime import date, datetime, timedelta
from functools import lru_cache
from statistics import median
from typing import Any, Callable, Iterable, Mapping, Sequence
from zoneinfo import ZoneInfo

from . import station_shade
from .forecast import Hour
from .i18n import N_, t
from .open_meteo import State
from .settings import Settings
from .units import Kind, finite, french, measurement

# The sides of the house, by the direction their wall faces (degrees).
SIDES = {"n": 0, "ne": 45, "e": 90, "se": 135, "s": 180, "sw": 225, "w": 270, "nw": 315}
DIRS = tuple(SIDES)
PLACES = (*DIRS, "roof", "open")
WALLS, HEIGHTS, GROUNDS, GAUGES = ("against", "near", "far"), ("low", "standard", "high"), ("grass", "gravel", "paving"), ("open", "tree", "eave")
SHADES = ("never", "morning", "afternoon", "always")
# The sun heats a wall it faces within this angle (°): 70 % of its light.
FACING = 45.0
# Skies: clear under 20 %, mixed under 60 % (the shade's own limits), overcast from 80 % of clouds.
CLEAR, SUNNY, OVERCAST = station_shade.CLEAR_CLOUDS, station_shade.DIRECT_CLOUDS, 80.0
# A gap that counts (°C): Météo-France gives its temperature to the degree.
GAP = 1.0
# The sun's position in sectors of this many degrees of azimuth, for the temperature.
SECTOR = 30
# A sector, a side of the wind is learned from this many hours, its last ones only (as the shade's cells).
HOURS, RECENT = station_shade.RECENT_HOURS, 48
# Below this forecast wind (km/h) the vane turns at random: not compared.
WIND_MIN = 10.0
# A side whose wind is under half the station's usual share is sheltered; so is a gauge collecting under half the rain.
SHELTER = 0.5
# A day of rain: 1 mm at the station or in the forecast; the gauge is learned from this many.
RAIN_MM, RAIN_DAYS = 1.0, 15
# Under this share of a clear sky's sun, the station is in the shade (station_shade cells).
SHADED = 0.5
# The temperature is said checked once this many positions of the day's sun are learned, and the wind once this many sides.
CHECKED = 3
OF = {"n": N_("du nord"), "ne": N_("du nord-est"), "e": N_("de l’est"), "se": N_("du sud-est"), "s": N_("du sud"),
      "sw": N_("du sud-ouest"), "w": N_("de l’ouest"), "nw": N_("du nord-ouest")}
SHORT = {"n": N_("N"), "ne": N_("NE"), "e": N_("E"), "se": N_("SE"), "s": N_("S"), "sw": N_("SO"), "w": N_("O"), "nw": N_("NO")}


def opposite(side: str) -> str:
    return DIRS[(DIRS.index(side) + 4) % 8]


def side_of(bearing: float) -> str:
    """The side a wind comes from: « w » for 260°."""
    return DIRS[int(((bearing % 360) + 22.5) // 45) % 8]


def facing(side: str, azimuth: float) -> bool:
    return abs((azimuth - SIDES[side] + 540) % 360 - 180) <= FACING


@lru_cache(maxsize=64)
def wall_window(side: str, day: date, zone: ZoneInfo, latitude: float, longitude: float) -> tuple[datetime, datetime] | None:
    """When the sun heats the wall of that side today: from the first moment it faces it, until sunset. None when it never
    faces it (a north wall in winter)."""
    start = datetime(day.year, day.month, day.day, tzinfo=zone)
    first = last = None
    for step in range(0, 24 * 6):
        moment = start + timedelta(minutes=10 * step)
        elevation, azimuth = station_shade.sun_position(moment, latitude, longitude)
        if elevation > 0:
            last = moment
            if first is None and facing(side, azimuth):
                first = moment
    return (first, last) if first is not None and last is not None and first < last else None


def sky(clouds: float | None) -> str | None:
    if clouds is None:
        return None
    return "clear" if clouds < CLEAR else "mixed" if clouds < SUNNY else "overcast" if clouds >= OVERCAST else None


def temperature_key(moment: datetime, latitude: float, longitude: float, clouds: float | None) -> str | None:
    """Where the sun is and how the sky is: « 210/clear », « night/mixed »; None under clouds (no excess to learn)."""
    kind = sky(clouds)
    if kind not in ("clear", "mixed"):
        return None
    elevation, azimuth = station_shade.sun_position(moment, latitude, longitude)
    if elevation < station_shade.LOW:
        return f"night/{kind}"
    return f"{int(azimuth // SECTOR) * SECTOR}/{kind}"


def _blend(before: float | None, now: float) -> float:
    return round(now if before is None else before + (now - before) * station_shade.BLEND, 2)


# ---- What the nights learn ----

def learn_temperature(hours: Iterable[tuple[datetime, float | None, float | None, float | None]], latitude: float, longitude: float,
                      known: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """The station's temperature against the forecast. `hours`: (start of the hour, forecast °C, cloud cover %, the station's
    mean °C), oldest first. Returns {"background": {"day": gap, "night": gap}, "cells": {"210/clear": [excess, hours]}}: the
    gap of overcast hours, then the excess over it under each sun and sky."""
    known = known or {}
    background = dict(known.get("background") or {})
    cells: dict[str, list[float]] = {k: list(v) for k, v in (known.get("cells") or {}).items()}
    overcast: dict[str, list[float]] = {"day": [], "night": []}
    seen: dict[str, list[float]] = {}
    for start, forecast, clouds, measured in hours:
        if forecast is None or measured is None or clouds is None:
            continue
        middle = start + timedelta(minutes=30)
        gap = measured - forecast
        if clouds >= OVERCAST:
            elevation, _ = station_shade.sun_position(middle, latitude, longitude)
            overcast["day" if elevation >= station_shade.LOW else "night"].append(gap)
        elif key := temperature_key(middle, latitude, longitude, clouds):
            seen.setdefault(key, []).append(gap)
    for part, gaps in overcast.items():
        if len(gaps) >= HOURS:
            background[part] = _blend(background.get(part), median(gaps))
    for key, gaps in seen.items():
        base = background.get("night" if key.startswith("night") else "day")
        last = gaps[-RECENT:]
        if base is None or len(last) < HOURS:
            continue
        before = cells.get(key)
        cells[key] = [_blend(before[0] if before else None, median(last) - base), len(gaps)]
    return {"background": background, "cells": cells}


def learn_wind(hours: Iterable[tuple[float | None, float | None, float | None]], known: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """The station's wind over the forecast's, by the side it comes from. `hours`: (forecast km/h, forecast bearing °, the
    station's mean km/h). Returns {"sides": {"w": [share, hours]}}."""
    sides: dict[str, list[float]] = {k: list(v) for k, v in ((known or {}).get("sides") or {}).items()}
    seen: dict[str, list[float]] = {}
    for forecast, bearing, measured in hours:
        if forecast is None or bearing is None or measured is None or forecast < WIND_MIN:
            continue
        seen.setdefault(side_of(bearing), []).append(measured / forecast)
    for side, shares in seen.items():
        last = shares[-RECENT:]
        if len(last) < HOURS:
            continue
        before = sides.get(side)
        sides[side] = [_blend(before[0] if before else None, median(last)), len(shares)]
    return {"sides": sides}


def learn_rain(days: Iterable[tuple[float | None, float | None]], known: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """The share of the forecast rain the gauge collects. `days`: (forecast mm, measured mm) of whole days. Returns
    {"share": 0.52, "days": 22} once there are enough days of rain, else what was known."""
    pairs = [(f, m) for f, m in days if f is not None and m is not None and f > 0 and max(f, m) >= RAIN_MM]
    if len(pairs) < RAIN_DAYS:
        return dict(known or {})
    before = (known or {}).get("share")
    return {"share": _blend(before, median(m / f for f, m in pairs)), "days": len(pairs)}


def sheltered_sides(settings: Settings, learned: Mapping[str, Any]) -> frozenset[str]:
    """The sides the wind is sheltered from: learned when at least three sides are, else declared."""
    declared = set(settings.wind_shelter or ())
    sides = {k: v for k, v in ((learned.get("wind") or {}).get("sides") or {}).items() if v[1] >= HOURS}
    if len(sides) < CHECKED:
        return frozenset(declared)
    usual = median(v[0] for v in sides.values())
    return frozenset(d for d in DIRS if (d in sides and sides[d][0] < SHELTER * usual) or (d not in sides and d in declared))


# ---- What is retained now ----

@dataclass(frozen=True)
class Note:
    """Why a value is not the station's own: « forecast » taken in its place, or « corrected » by what is learned."""

    how: str
    why: str
    params: tuple[tuple[str, str], ...] = ()

    def text(self) -> str:
        return t(self.why, **{k: t(v) if k == "side" else v for k, v in self.params})


def shaded_now(shade: Mapping[str, float], moment: datetime, latitude: float, longitude: float) -> bool:
    where = station_shade.cell(moment - timedelta(minutes=30), latitude, longitude)
    share = shade.get(where) if where else None
    return share is not None and share < SHADED


def _excess_why(settings: Settings) -> str:
    if settings.station_side == "roof":
        return N_("le toit au soleil ajoute {gap} °C")
    if settings.station_side in SIDES and settings.station_wall in ("against", "near"):
        return N_("le mur au soleil ajoute {gap} °C")
    return N_("par beau temps, la station compte {gap} °C de trop")


def retained_temperature(settings: Settings, learned: Mapping[str, Any], measured: float | None, forecast: float | None,
                         clouds: float | None, now: datetime, zone: ZoneInfo, latitude: float, longitude: float,
                         shade: Mapping[str, float]) -> tuple[float | None, Note | None]:
    """The outdoor temperature to use now, and why it is not the station's when it is not."""
    if measured is None:
        return None, None
    cells = (learned.get("temperature") or {}).get("cells") or {}
    key = temperature_key(now, latitude, longitude, clouds)
    if key in cells and cells[key][1] >= HOURS:
        excess = cells[key][0]
        if excess >= GAP:
            return round(measured - excess, 1), Note("corrected", _excess_why(settings), (("gap", french(excess)),))
        return measured, None
    elevation, _ = station_shade.sun_position(now, latitude, longitude)
    if forecast is None or clouds is None or clouds >= SUNNY or elevation < station_shade.LOW or shaded_now(shade, now, latitude, longitude):
        return measured, None
    side = settings.station_side
    if side == "roof":
        why = N_("la station est sur le toit, au soleil")
    elif side in SIDES and settings.station_wall == "against" and (window := wall_window(side, now.astimezone(zone).date(), zone, round(latitude, 2), round(longitude, 2))) \
            and window[0] <= now <= window[1]:
        why = N_("la station est au soleil contre le mur")
    else:
        return measured, None
    return (forecast, Note("forecast", why)) if measured >= forecast + GAP else (measured, None)


def retained_wind(settings: Settings, learned: Mapping[str, Any], speed: float | None, gust: float | None, forecast_speed: float | None,
                  forecast_gust: float | None, bearing: float | None) -> tuple[float | None, float | None, Note | None]:
    """From a sheltered side, the station cannot say « calm »: the stronger of it and the forecast."""
    if bearing is None or side_of(bearing) not in sheltered_sides(settings, learned):
        return speed, gust, None

    def stronger(a: float | None, b: float | None) -> float | None:
        return b if a is None else a if b is None else max(a, b)
    new_speed, new_gust = stronger(speed, forecast_speed), stronger(gust, forecast_gust)
    if new_speed == speed and new_gust == gust:
        return speed, gust, None
    return new_speed, new_gust, Note("forecast", N_("station abritée {side}"), (("side", OF[side_of(bearing)]),))


def humidity_at(temperature: float, humidity: float, retained: float) -> float:
    """The relative humidity at another temperature, for the same water in the air: the wall heats the air, it adds no water."""
    def saturation(c: float) -> float:
        a0 = 373.15 / (273.15 + c)
        return 10 ** (-7.90298 * (a0 - 1) + 5.02808 * math.log10(a0) - 1.3816e-7 * (10 ** (11.344 * (1 - 1 / a0)) - 1)
                      + 8.1328e-3 * (10 ** (-3.49149 * (a0 - 1)) - 1))
    return round(max(1.0, min(100.0, humidity * saturation(temperature) / saturation(retained))), 1)


def _reading(get: Callable[[str], Any], entity_id: str | None, kind: Kind) -> float | None:
    state = get(entity_id) if entity_id else None
    if state is None or state.state in ("unknown", "unavailable"):
        return None
    return measurement(state.state, state.attributes.get("unit_of_measurement"), kind)


def _forecast(get: Callable[[str], Any], settings: Settings, hours: Sequence[Hour], now: datetime) -> dict[str, float | None]:
    weather = get(settings.weather_entity)
    bulletin: Mapping[str, Any] = weather.attributes if weather is not None and weather.state not in ("unknown", "unavailable") else {}
    hour = next((h for h in hours if h.time is not None and h.time <= now < h.time + timedelta(hours=1)), hours[0] if hours else None)
    speed_unit = bulletin.get("wind_speed_unit")

    def pick(attribute: str, unit: Any, kind: Kind, fallback: float | None) -> float | None:
        value = finite(bulletin.get(attribute)) if kind is Kind.PLAIN else measurement(bulletin.get(attribute), unit, kind)
        return value if value is not None else fallback
    return {"temperature": pick("temperature", bulletin.get("temperature_unit"), Kind.TEMPERATURE, hour.temperature if hour else None),
            "clouds": pick("cloud_coverage", None, Kind.PLAIN, hour.cloud_coverage if hour else None),
            "speed": pick("wind_speed", speed_unit, Kind.WIND, hour.wind_speed if hour else None),
            "gust": pick("wind_gust_speed", speed_unit, Kind.WIND, hour.wind_gust if hour else None),
            "bearing": pick("wind_bearing", None, Kind.PLAIN, hour.wind_bearing if hour else None)}


def _virtual(get: Callable[[str], Any], entity_id: str, value: float, unit: str) -> State:
    state = get(entity_id)
    return State(entity_id, str(value), {**(state.attributes if state is not None else {}), "unit_of_measurement": unit})


def overlay(settings: Settings, get: Callable[[str], Any], learned: Mapping[str, Any], hours: Sequence[Hour], now: datetime, zone: ZoneInfo,
            latitude: float, longitude: float, shade: Mapping[str, float]) -> tuple[Settings, Callable[[str], Any]]:
    """The settings and the reader the engine uses: the station's temperature (and its humidity, same water in the air) and
    wind replaced where they cannot be trusted now, `station_notes` saying why. Untouched when everything is the station's."""
    notes: dict[str, Note] = {}
    virtual: dict[str, State] = {}
    forecast = _forecast(get, settings, hours, now)
    measured = _reading(get, settings.temperature_entity, Kind.TEMPERATURE)
    value, note = retained_temperature(settings, learned, measured, forecast["temperature"], forecast["clouds"], now, zone, latitude, longitude, shade)
    if note is not None and value is not None and measured is not None and settings.temperature_entity:
        notes["temperature"] = note
        virtual[settings.temperature_entity] = _virtual(get, settings.temperature_entity, value, "°C")
        humidity = _reading(get, settings.humidity_entity, Kind.PLAIN)
        if humidity is not None and settings.humidity_entity:
            virtual[settings.humidity_entity] = _virtual(get, settings.humidity_entity, humidity_at(measured, humidity, value), "%")
    if settings.wind_speed_entity or settings.wind_gust_entity:
        speed, gust = _reading(get, settings.wind_speed_entity, Kind.WIND), _reading(get, settings.wind_gust_entity, Kind.WIND)
        new_speed, new_gust, note = retained_wind(settings, learned, speed, gust, forecast["speed"], forecast["gust"], forecast["bearing"])
        if note is not None:
            notes["wind"] = note
            for entity_id, old, new in ((settings.wind_speed_entity, speed, new_speed), (settings.wind_gust_entity, gust, new_gust)):
                if entity_id and new is not None and new != old:
                    virtual[entity_id] = _virtual(get, entity_id, new, "km/h")
    if not notes:
        return settings, get

    def read(entity_id: str) -> Any:
        return virtual.get(entity_id) or get(entity_id)
    return replace(settings, station_notes=notes), read


# ---- How far each measure can be trusted (État du lieu, api.station_trust) ----

def _hm(moment: datetime) -> str:
    return t("{h} h", h=moment.hour) if moment.minute == 0 else t("{h} h {m}", h=moment.hour, m=f"{moment.minute:02d}")


def _hot_hours(cells: Mapping[str, Sequence[float]], day: date, zone: ZoneInfo, latitude: float, longitude: float) -> tuple[datetime, datetime, float] | None:
    """Today's hours whose sun, under a clear sky, was learned to heat the station: first, last, the largest excess."""
    start, found, worst = datetime(day.year, day.month, day.day, tzinfo=zone), [], 0.0
    for step in range(0, 24 * 6):
        moment = start + timedelta(minutes=10 * step)
        key = temperature_key(moment, latitude, longitude, 0)
        if key and not key.startswith("night") and key in cells and cells[key][1] >= HOURS and cells[key][0] >= GAP:
            found.append(moment)
            worst = max(worst, cells[key][0])
    return (found[0], found[-1] + timedelta(minutes=10), worst) if found else None


def describe(settings: Settings, learned: Mapping[str, Any], shade: Mapping[str, Any] | None, now: datetime, zone: ZoneInfo,
             latitude: float, longitude: float) -> dict[str, dict[str, str]]:
    """Each measure the station gives: « ok » (fiable), « handled » (fiable sauf…, Hestia s'en charge) or « watch »
    (à vérifier), a title, what Hestia does, and what was learned."""
    out: dict[str, dict[str, str]] = {}
    days = learned.get("days")
    since = t("Appris sur {n} jours d’historique.", n=days) if days else ""
    today = now.astimezone(zone).date()

    def row(level: str, title: str, line: str, more: str = "") -> dict[str, str]:
        return {"level": level, "title": title, "line": line, "learned": more}

    if settings.temperature_entity:
        cells = (learned.get("temperature") or {}).get("cells") or {}
        hot = _hot_hours(cells, today, zone, latitude, longitude)
        side, wall = settings.station_side, settings.station_wall
        night = cells.get("night/clear")
        cold = (t("Les nuits claires, {gap} °C de moins : le froid du ras du sol.", gap=french(-night[0]))
                if night and night[1] >= HOURS and night[0] <= -GAP else "")
        window = wall_window(side, today, zone, round(latitude, 2), round(longitude, 2)) if side in SIDES and wall == "against" else None
        if hot:
            out["temperature"] = row("handled", t("Fiable, sauf par beau temps"),
                                     t("De {start} à {end}, par beau temps, Hestia enlève jusqu’à {gap} °C.", start=_hm(hot[0]), end=_hm(hot[1]), gap=french(hot[2])),
                                     " ".join(filter(None, (since, cold))))
        elif sum(1 for k, v in cells.items() if not k.startswith("night") and v[1] >= HOURS) >= CHECKED:
            out["temperature"] = row("ok", t("Fiable"), t("Vérifiée par beau temps : pas d’écart."), " ".join(filter(None, (since, cold))))
        elif window:
            out["temperature"] = row("handled", t("Fiable, sauf par beau temps"),
                                     t("De {start} à {end} en ce moment, Hestia prend la prévision.", start=_hm(window[0]), end=_hm(window[1])),
                                     t("Le soleil est sur le mur à ces heures."))
        elif side == "roof":
            out["temperature"] = row("handled", t("Fiable, sauf au soleil"), t("Au soleil, Hestia prend la prévision."), t("Le toit chauffe la station."))
        elif side == "open" and settings.station_height in (None, "standard") and settings.station_ground in (None, "grass"):
            out["temperature"] = row("ok", t("Fiable"), t("Loin des murs : Hestia compare chaque nuit avec la prévision."))
        else:
            out["temperature"] = row("watch", t("À vérifier"), t("Hestia compare chaque nuit avec la prévision."), since)

    if settings.wind_speed_entity or settings.wind_gust_entity:
        sheltered = sheltered_sides(settings, learned)
        sides = (learned.get("wind") or {}).get("sides") or {}
        hours = sum(int(v[1]) for v in sides.values())
        more = t("Vérifié sur {n} heures de vent.", n=hours) if hours else ""
        open_sides = ", ".join(t(SHORT[d]) for d in DIRS if d not in sheltered)
        if sheltered:
            names = ", ".join(t(OF[d]) for d in DIRS if d in sheltered)
            out["wind"] = row("handled", t("Fiable, sauf vent {sides}", sides=names),
                              t("Dégagée : {sides}.", sides=open_sides) if open_sides else t("Gênée de tous côtés."),
                              " ".join(filter(None, (t("Vent {sides} : Hestia prend le vent prévu.", sides=names), more))))
        elif len([v for v in sides.values() if v[1] >= HOURS]) >= CHECKED or settings.wind_shelter is not None:
            out["wind"] = row("ok", t("Fiable"), t("Dégagée de tous côtés."), more)
        else:
            out["wind"] = row("watch", t("Pas encore vérifié"), t("Hestia compare chaque nuit avec la prévision."))

    if settings.rain_rate_entity or settings.daily_rain_entity or settings.rain_total_entity:
        rain = learned.get("rain") or {}
        share = rain.get("share")
        collected = (t("Il recueille environ {pct} % de la pluie prévue ({n} jours de pluie).", pct=round(share * 100), n=rain.get("days"))
                     if share is not None else "")
        if settings.rain_gauge_shelter in ("tree", "eave"):
            out["rain"] = row("handled", t("À l’abri"), t("Une pluie annoncée n’est pas démentie."), collected or t("Les cumuls sont peut-être en dessous."))
        elif share is not None and share < SHELTER:
            out["rain"] = row("watch", t("Semble à l’abri"), collected, t("Dites où est le pluviomètre dans Station › Emplacement."))
        else:
            out["rain"] = row("ok", t("Fiable"), collected or t("Rien ne dit le contraire."))

    if settings.solar_radiation_entity:
        cells = (shade or {}).get("cells") or {}
        learned_cells, reachable = (shade or {}).get("learned") or 0, (shade or {}).get("reachable") or 0
        more = t("{n} positions du soleil apprises sur {total}.", n=learned_cells, total=reachable) if learned_cells else ""
        if any(v < SHADED for v in cells.values()):
            out["sun"] = row("handled", t("Fiable, sauf à l’ombre"), t("L’ombre est comptée : ce n’est pas un nuage."), more)
        elif learned_cells or settings.station_shade == "never":
            out["sun"] = row("ok", t("Fiable"), t("En plein soleil."), more)
        else:
            out["sun"] = row("watch", t("Pas encore vérifié"), t("Il faut quelques heures de ciel clair."))
    return out


def asked(settings: Settings, sources: Mapping[str, Any]) -> list[str]:
    """The questions of « Emplacement » this station asks, in order."""
    side = sources.get("station_side")
    keys = ["station_side"]
    if side in SIDES:
        keys.append("station_wall")
    if side != "roof":
        keys += ["station_height", "station_ground"]
    if settings.solar_radiation_entity:
        keys.append("station_shade")
    if settings.rain_rate_entity or settings.daily_rain_entity or settings.rain_total_entity:
        keys.append("rain_gauge_shelter")
    if settings.wind_speed_entity or settings.wind_gust_entity:
        keys.append("wind_shelter")
    return keys


def questions_left(settings: Settings, sources: Mapping[str, Any]) -> int:
    """The questions not answered yet: « Je ne sais pas » is an answer (an empty value), a missing key is not."""
    return sum(1 for k in asked(settings, sources) if k not in sources)
