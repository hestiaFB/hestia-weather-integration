"""The brief: what deserves attention now, next, in the air, and the official vigilance.

An attention hierarchy, never a weather model of its own nor a health recommendation.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Callable, Mapping, Sequence
from zoneinfo import ZoneInfo

from . import atmo, polleninfo, swiss, water, waqi
from .forecast import Day, Hour
from .lightning import Lightning
from .local import LocalWeather
from .i18n import N_, t
from .settings import Settings
from .units import french

GROUPS = ("official", "now", "future", "environment")
COLORS = ("61,155,233", "190,140,35", "230,125,45", "215,70,75")
COLOR_NAMES = (N_("verte"), N_("jaune"), N_("orange"), N_("rouge"))
LEVELS = (N_("Synthèse"), N_("À surveiller"), N_("Attention renforcée"), N_("Vigilance rouge officielle"))
# Each level of an official vigilance, as the banner says it.
VIGILANCE_NAMES = (N_("Vigilance verte"), N_("Vigilance jaune"), N_("Vigilance orange"), N_("Vigilance rouge"))
# Météo-France's phenomena: their own French names, said in the user's language.
PHENOMENA = (N_("Vent violent"), N_("Pluie-inondation"), N_("Orages"), N_("Inondation"), N_("Crues"), N_("Neige-verglas"), N_("Canicule"),
             N_("Grand-froid"), N_("Avalanches"), N_("Vagues-submersion"))
_KNOWN_COLORS = {"vert": 0, "green": 0, "jaune": 1, "yellow": 1, "orange": 2, "rouge": 3, "red": 3}


@dataclass(frozen=True)
class Signal:
    key: str
    group: str
    """« official », « now », « future » or « environment »."""
    severity: int
    """0 information, 1 to watch, 2 serious, 3 official red."""
    text: str
    explanation: str
    icon: str
    entity: str | None = None
    at: float | None = None
    """When a forecast point happens, in seconds since 1970; absent for what is measured now."""
    clock: str | None = None
    """That time as the banner writes it: « 20 h », « midi », « minuit », « demain »."""
    short: str | None = None
    """The sentence on the banner's timeline, without the time its label already gives: « Fortes pluies : 12 mm prévus »."""
    index: float | None = None
    """Atmo index (1 to 6) of an air or pollen point."""


@dataclass(frozen=True)
class Brief:
    title: str
    label: str
    color: str
    icon: str
    summary: str
    signals: tuple[Signal, ...]
    caveats: tuple[str, ...]
    available: bool
    severity: int = 0


def number(value: float, digits: int = 1) -> str:
    """French number, at most `digits` decimals, as the browser writes it."""
    return french(value, digits)


def _round_half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def _timing(hours: float) -> str:
    return t("dans l’heure") if hours < 1 else t("dans environ {hours} h", hours=_round_half_up(hours))


def known_color(value: Any) -> int | None:
    return _KNOWN_COLORS.get(atmo.normal(value).strip())


def _lower_first(text: str) -> str:
    """« Graminées » → « graminées », but « PM2.5 » and « NO₂ » stay as they are."""
    return text[0].lower() + text[1:] if re.match(r"^[A-ZÀ-Ý][a-zà-ÿ]", text) else text


def clock(when: datetime, now: datetime, zone: ZoneInfo) -> str:
    """« 20 h », « midi », « minuit » within the next 24 hours; « demain » or the day's name beyond."""
    local = when.astimezone(zone)
    if when - now < timedelta(hours=24):
        return t("minuit") if local.hour == 0 else t("midi") if local.hour == 12 else t("{hour} h", hour=local.hour)
    days = (local.date() - now.astimezone(zone).date()).days
    return t("demain") if days == 1 else t((N_("lundi"), N_("mardi"), N_("mercredi"), N_("jeudi"), N_("vendredi"), N_("samedi"), N_("dimanche"))[local.weekday()])


@dataclass(frozen=True)
class Vigilance:
    level: int
    """0 green to 3 red."""
    phenomena: tuple[tuple[str, int], ...]
    """Each phenomenon above green with its own level, the most serious first."""
    warnings: tuple[swiss.Warning, ...] = ()
    source: str = "Météo-France"

    @property
    def extra(self) -> dict[str, Any]:
        values: dict[str, Any] = {"phenomenes": {k: COLOR_NAMES[c] for k, c in self.phenomena}}
        if self.source == "MétéoSuisse":
            values.update(fournisseur=self.source, degre=max((w.degree for w in self.warnings), default=1), echelle=5,
                          degres_phenomenes={w.name: w.degree for w in reversed(self.warnings)},
                          alertes=[{"phenomene": w.name, "degre": w.degree, "debut": w.start, "fin": w.end, "texte": w.text}
                                   for w in self.warnings])
        return values

    @property
    def text(self) -> str:
        """One text for every format: « Vigilance jaune · vent violent »; a phenomenon below the overall level says its own colour."""
        if self.source == "MétéoSuisse":
            degree = max((w.degree for w in self.warnings), default=1)
            details = ", ".join(f"{t(w.name).lower()} ({w.degree}/5)" for w in self.warnings)
            return f"MétéoSuisse · {t(swiss.DEGREES[degree])} ({degree}/5)" + (f" · {details}" if details else "")
        names = [f"{t(k).lower()}{'' if c == self.level else f' ({t(COLOR_NAMES[c])})'}" for k, c in self.phenomena]
        return f"{t(VIGILANCE_NAMES[self.level])}{' · ' + ', '.join(names) if names else ''}"


def read_vigilance(settings: Settings, get: Callable[[str], Any], now: datetime, platforms: Mapping[str, str] | None = None) -> Vigilance | None:
    """The Météo-France vigilance, or None when it is not configured, not recognised or more than 48 hours old."""
    official = get(settings.vigilance_entity) if settings.vigilance_entity else None
    if official is not None and ((platforms or {}).get(settings.vigilance_entity or "") == "swissweather"
                                or "meteoswiss" in atmo.normal(official.attributes.get("attribution"))):
        updated = getattr(official, "last_updated", None)
        if isinstance(updated, datetime) and (updated.tzinfo is None or now - updated > timedelta(hours=48)):
            return None
        warnings = swiss.read(official, now)
        if warnings is None:
            return None
        return Vigilance(max((swiss.SEVERITIES[w.degree] for w in warnings), default=0),
                         tuple((w.name, swiss.SEVERITIES[w.degree]) for w in warnings), warnings, "MétéoSuisse")
    recognised = official is not None and (bool(re.search(r"meteo.?france", atmo.normal(official.attributes.get("attribution"))))
                                           or (platforms or {}).get(settings.vigilance_entity or "") == "meteo_france")
    level = known_color(official.state) if recognised else None
    updated = getattr(official, "last_updated", None)
    if level is None or (isinstance(updated, datetime) and now - updated > timedelta(hours=48)):
        return None
    phenomena = sorted(((k, known_color(v)) for k, v in official.attributes.items() if k not in ("attribution", "friendly_name", "icon")),
                       key=lambda x: -(x[1] or 0))
    return Vigilance(level, tuple((k, c) for k, c in phenomena if c))


@dataclass(frozen=True)
class _Point:
    hours: float
    hour: Hour


def build_brief(w: LocalWeather, settings: Settings, get: Callable[[str], Any], hours: Sequence[Hour], days: Sequence[Day],
                now: datetime, zone: ZoneInfo, platforms: Mapping[str, str] | None = None, lightning: Lightning | None = None) -> Brief:
    signals: list[Signal] = []
    caveats: list[str] = []
    add = signals.append
    src = w.sources.get
    temp, feels, wind, gust, rain = w.temperature, w.feel.value, w.wind.speed, w.wind.gust, w.rain.rate
    station = bool(settings.temperature_entity)

    def when(t: datetime | None) -> dict[str, Any]:
        return {} if t is None else {"at": t.timestamp(), "clock": clock(t, now, zone)}

    current = t("Ressenti indisponible.") if feels is None else t("{value} °C ressentis", value=number(feels))
    if feels is not None and temp is not None:
        delta, gap = feels - temp, number(abs(feels - temp))
        if abs(delta) < 0.6:
            current += t(", proche du thermomètre.") if station else t(", proche de la température météo.")
        elif delta > 0:
            current += t(", {gap} °C de plus que le thermomètre.", gap=gap) if station else t(", {gap} °C de plus que la température météo.", gap=gap)
        else:
            current += t(", {gap} °C de moins que le thermomètre.", gap=gap) if station else t(", {gap} °C de moins que la température météo.", gap=gap)
        e = w.feel.effects
        effect = sorted(((e.wind, "wind"), (e.sun, "sun"), (e.rain, "rain"), (e.night, "night")), key=lambda x: -abs(x[0]))[0]
        warmer = {"wind": N_(" Le vent accentue la chaleur."), "sun": N_(" Le soleil accentue la chaleur."), "rain": N_(" La pluie accentue la chaleur."),
                  "night": N_(" Le ciel nocturne accentue la chaleur.")}
        cooler = {"wind": N_(" Le vent accentue la fraîcheur."), "sun": N_(" Le soleil accentue la fraîcheur."), "rain": N_(" La pluie accentue la fraîcheur."),
                  "night": N_(" Le ciel nocturne accentue la fraîcheur.")}
        if abs(delta) >= 0.6:
            if abs(effect[0]) >= 0.6:
                current += t((warmer if effect[0] > 0 else cooler)[effect[1]])
            elif w.humidex is not None and w.humidex - temp >= 0.6:
                current += t(" L’humidité accentue la chaleur.")
    if feels is not None and not w.humidity_source and w.humidex is None:
        caveats.append(t("Humidité inconnue : le ressenti n’en tient pas compte."))
    if feels is not None and (feels >= 34 or feels <= 2):
        add(Signal("temperature", "now", 2 if feels >= 38 or feels <= -3 else 1,
                   t("Forte chaleur : {value} °C ressentis", value=number(feels)) if feels >= 34
                   else t("Grand froid : {value} °C ressentis", value=number(feels)) if feels <= -3 else t("Froid : {value} °C ressentis", value=number(feels)),
                   t("Ressenti calculé par la carte. Ce n’est pas une vigilance officielle."), "mdi:thermometer-high" if feels >= 34 else "mdi:thermometer-low", src("temperature")))
    if temp is not None and feels is not None and abs(feels - temp) > 4 and not any(s.key == "temperature" for s in signals):
        add(Signal("comfort-gap", "now", 0,
                   (t("Ressenti : {gap} °C de plus qu’au thermomètre", gap=number(abs(feels - temp))) if station
                    else t("Ressenti : {gap} °C de plus que la température annoncée", gap=number(abs(feels - temp)))) if feels > temp
                   else (t("Ressenti : {gap} °C de moins qu’au thermomètre", gap=number(abs(feels - temp))) if station
                         else t("Ressenti : {gap} °C de moins que la température annoncée", gap=number(abs(feels - temp)))),
                   t("Plus de 4 °C d’écart entre le ressenti calculé et la température."), "mdi:thermometer-high" if feels > temp else "mdi:thermometer-low", src("temperature")))
    if (wind or 0) >= 30 or (gust or 0) >= 40:
        add(Signal("wind", "now", 2 if (wind or 0) >= 50 or (gust or 0) >= 60 else 1,
                   (t("Vent très fort") if max(wind or 0, gust or 0) >= 60 else t("Vent fort"))
                   + (t(", rafales à {gust} km/h", gust=_round_half_up(gust)) if gust is not None else t(" : {wind} km/h", wind=_round_half_up(wind or 0))),
                   t("Mesuré par votre station : vent moyen dès 30 km/h ou rafales dès 40 km/h."), "mdi:weather-windy", src("wind_gust" if gust is not None else "wind_speed")))
    elif wind is not None and wind >= 0:
        add(Signal("wind-soft", "now", 0, t("Vent faible : {wind} km/h", wind=_round_half_up(wind)) if wind < 15 else t("Vent modéré : {wind} km/h", wind=_round_half_up(wind)),
                   t("Vent moyen mesuré en ce moment."),
                   "mdi:weather-windy", src("wind_speed")))
    if rain is not None and rain >= 0.3:
        add(Signal("rain-now", "now", 2 if rain >= 4 else 1 if rain >= 1 else 0, t("Forte pluie : {rate} mm/h", rate=number(rain)) if rain >= 4 else t("Il pleut : {rate} mm/h", rate=number(rain)),
                   t("Pluie mesurée par votre station en ce moment."), "mdi:weather-pouring", src("rain_rate")))
    if (wind or 0) >= 30 and (rain or 0) >= 1:
        add(Signal("wind-rain", "now", 2, t("Pluie et vent fort en même temps"), t("Au moins 1 mm/h de pluie et 30 km/h de vent moyen en même temps."),
                   "mdi:weather-pouring", src("rain_rate")))
    if w.condition == "fog" and w.observed:
        add(Signal("fog", "now", 1, t("Brouillard possible"), t("Estimé avec l’humidité et le point de rosée. La visibilité n’est pas mesurée."), "mdi:weather-fog", src("humidity")))
    if (w.uv or 0) >= 6:
        add(Signal("uv", "now", 2 if (w.uv or 0) >= 8 else 1, t("UV élevés : indice {uv}", uv=number(w.uv or 0)), t("Indice UV de vos capteurs."), "mdi:weather-sunny-alert", src("uv")))
    if lightning is not None and lightning.nearest is not None:
        # Strikes seen now by Blitzortung: within 30 km the storm is here (one gesture to give); farther, only worth knowing.
        add(Signal("storm-near" if lightning.near else "storm-far", "now", lightning.level, lightning.text,
                   lightning.explanation + (t(" Débranchez les appareils sensibles et rentrez ce qui craint.") if lightning.near else ""),
                   "mdi:weather-lightning", settings.lightning_entity, short=lightning.text))
    restriction = water.read(get, settings)
    if restriction is not None and restriction.level >= water.ALERT:
        add(Signal("water", "now", 2 if restriction.level >= 4 else 1,
                   t("Restrictions d’eau : {level}", level=restriction.label.lower()) + (t(", arrosage restreint") if restriction.watering else ""),
                   (t("Arrêté préfectoral relayé par Vigieau : {count} usages concernés.", count=len(restriction.usages)) if restriction.usages
                    else t("Arrêté préfectoral relayé par Vigieau.")) + " " + t("Ouvrez le capteur pour le détail."), "mdi:water-off" if restriction.level >= 4 else "mdi:water-alert", restriction.entity_id))
    p = w.pressure_trend
    if p.direction is not None and str(p.direction) in ("hausse", "baisse") and p.change is not None:
        add(Signal("pressure", "now", 0,
                   (t("La pression monte : +{change} hPa en {hours} h", change=number(abs(p.change)), hours=number((p.minutes or 180) / 60)) if str(p.direction) == "hausse"
                    else t("La pression baisse : −{change} hPa en {hours} h", change=number(abs(p.change)), hours=number((p.minutes or 180) / 60))),
                   t("Calculé avec l’historique de la station. Cela ne suffit pas à prévoir la pluie."), "mdi:gauge", src("pressure")))

    # Forecast points by their time, never by their position; past and undated hours are left out.
    points = [_Point((h.time - now).total_seconds() / 3600, h) for h in hours if h.time is not None]
    upcoming = sorted((x for x in points if 0 <= x.hours <= 6), key=lambda x: x.hours)
    rains = [x for x in upcoming if x.hour.precipitation is not None and x.hour.precipitation >= 0.3]
    total = sum(max(0, x.hour.precipitation or 0) for x in upcoming)
    # Less than 1 mm over 6 h is a few drops: not worth a line.
    if rains and total >= 1:
        peak = max(x.hour.precipitation or 0 for x in rains)
        heavy = peak >= 5 or total >= 20
        amount = (t("au moins {mm} mm prévus", mm=number(total)) if any(x.hour.precipitation is None for x in upcoming)
                  else t("{mm} mm prévus", mm=number(total)))
        what = t("Fortes pluies") if heavy else t("Pluie")
        add(Signal("rain-future", "future", 2 if heavy else 1 if total >= 5 else 0,
                   t("{what} {when} : {amount}", what=what, when=_timing(rains[0].hours), amount=amount),
                   t("Total prévu sur les 6 prochaines heures."), "mdi:weather-pouring", settings.weather_entity, **when(rains[0].hour.time),
                   short=t("{what} : {amount}", what=what, amount=amount)))
    storm = next((x for x in upcoming if x.hour.condition.replace("_", "-") in ("lightning", "lightning-rainy", "hail")), None)
    # A storm already seen within 30 km says more than the forecast of one.
    if storm and not (lightning is not None and lightning.near):
        add(Signal("storm", "future", 2, t("Orage ou grêle {when}", when=_timing(storm.hours)), t("Annoncé par le fournisseur météo pour les 6 prochaines heures."),
                   "mdi:weather-lightning", settings.weather_entity, **when(storm.hour.time), short=t("Orage ou grêle")))
    # Strong wind forecast: the same thresholds as the wind measured at home, which says it already when it blows now.
    windy = [x for x in upcoming if (x.hour.wind_speed or 0) >= 30 or (x.hour.wind_gust or 0) >= 40]
    if windy and not any(s.key == "wind" for s in signals):
        top = max(x.hour.wind_speed or 0 for x in windy)
        top_gust = max((x.hour.wind_gust or 0 for x in windy), default=0) or None
        what = t("Vent très fort") if max(top, top_gust or 0) >= 60 else t("Vent fort")
        amount = t("rafales à {gust} km/h", gust=_round_half_up(top_gust)) if top_gust is not None else t("{wind} km/h", wind=_round_half_up(top))
        add(Signal("wind-future", "future", 2 if top >= 50 or (top_gust or 0) >= 60 else 1,
                   t("{what} {when} : {amount}", what=what, when=_timing(windy[0].hours), amount=amount),
                   t("Prévision du fournisseur météo : vent moyen dès 30 km/h ou rafales dès 40 km/h, dans les 6 prochaines heures."),
                   "mdi:weather-windy", settings.weather_entity, **when(windy[0].hour.time), short=t("{what} : {amount}", what=what, amount=amount)))
    # Pressure forecast, only from providers that give it (not Météo-France): a change of 4 hPa or more within 6 h.
    pressures = [x for x in upcoming if x.hour.pressure is not None]
    if len(pressures) >= 2:
        first, last = pressures[0], pressures[-1]
        change = (last.hour.pressure or 0) - (first.hour.pressure or 0)
        span = max(1, _round_half_up(last.hours - first.hours))
        if abs(change) >= 4:
            falling = change < 0
            text = (t("La pression va baisser : −{change} hPa en {hours} h", change=number(abs(change)), hours=span) if falling
                    else t("La pression va monter : +{change} hPa en {hours} h", change=number(abs(change)), hours=span))
            add(Signal("pressure-future", "future", 1 if falling and change <= -6 else 0, text,
                       t("Prévision du fournisseur météo sur les 6 prochaines heures. Une baisse rapide annonce souvent une dégradation."),
                       "mdi:gauge", settings.weather_entity, **when(last.hour.time),
                       short=t("Pression : −{change} hPa prévus", change=number(abs(change))) if falling
                       else t("Pression : +{change} hPa prévus", change=number(abs(change)))))
    cold = next((x for x in upcoming if x.hour.temperature is not None and x.hour.temperature <= 0), None)
    if cold:
        add(Signal("freeze-future", "future", 1, t("Gel {when} : {t} °C prévus", when=_timing(cold.hours), t=number(cold.hour.temperature or 0)), t("Prévision du fournisseur météo."),
                   "mdi:snowflake", settings.weather_entity, **when(cold.hour.time),
                   short=t("Gel : {t} °C prévus", t=number(cold.hour.temperature or 0))))

    def at(offset: float) -> str:
        return t("vers {hour} h", hour=(now + timedelta(hours=offset)).astimezone(zone).hour)

    # Tonight: the forecast minimum of the next 18 h against the frost and dew points.
    night = [x for x in points if 0 <= x.hours <= 18 and x.hour.temperature is not None]
    low = min(night, key=lambda x: x.hour.temperature or 0) if night else None
    low_t = low.hour.temperature if low else None
    if low and low_t is not None and low_t <= 3:
        # The ground cools 2–3 °C below the sheltered thermometer on a calm night: frost can form with +3 °C forecast.
        what = t("Gel") if low_t <= 0 else t("Gelée blanche possible") if w.frost_point is not None and w.frost_point >= low_t - 3 else t("Gel au sol possible")
        text = t("{what} {when} : {t} °C prévus", what=what, when=at(low.hours), t=number(low_t))
        add(Signal("frost-night", "future", 1, text, t("Minimum prévu dans les 18 h. Au sol, il fait 2 à 3 °C de moins que sous abri. Pensez aux plantes et au pare-brise."),
                   "mdi:snowflake-alert", settings.weather_entity, **when(low.hour.time),
                   short=t("{what} : {t} °C prévus", what=what, t=number(low_t))))
        # The night's minimum says more than the first freezing hour: keep one frost line.
        signals[:] = [s for s in signals if s.key != "freeze-future"]
    if low and low_t is not None:
        # The night is judged on its own forecast: the afternoon's wind and dew point change every minute and would make the line blink.
        night_calm = low.hour.wind_speed < 8 if low.hour.wind_speed is not None else (wind or 0) < 8
        saturated = low.hour.humidity >= 95 if low.hour.humidity is not None else w.dew_point is not None and low_t <= w.dew_point
        if w.condition != "fog" and night_calm and (low.hour.precipitation or 0) < 0.3 and saturated and low_t > 0:
            add(Signal("fog-later", "future", 0, t("Brouillard possible {when}", when=at(low.hours)),
                       t("Au plus froid de la nuit, l’air prévu est saturé d’humidité, sans vent ni pluie. C’est une estimation de la carte, pas une prévision de brouillard du fournisseur."),
                       "mdi:weather-fog", settings.weather_entity, **when(low.hour.time), short=t("Brouillard possible")))
    valid = [x.hour.temperature for x in upcoming if x.hour.temperature is not None]
    if temp is not None and valid and not cold:
        top, bottom = max(valid), min(valid)
        if top - temp >= 3 or temp - bottom >= 3:
            rising = top - temp >= 3
            peak = next(x for x in upcoming if x.hour.temperature == (top if rising else bottom))
            add(Signal("temperature-future", "future", 0,
                       t("Montée jusqu’à {t} °C dans les 6 h", t=number(top)) if rising else t("Baisse jusqu’à {t} °C dans les 6 h", t=number(bottom)),
                       t("Comparé à la température actuelle, sur les 6 prochaines heures."), "mdi:thermometer", settings.weather_entity, **when(peak.hour.time),
                       short=t("Montée jusqu’à {t} °C", t=number(top)) if rising else t("Baisse jusqu’à {t} °C", t=number(bottom))))
    tomorrow = now.astimezone(zone).date() + timedelta(days=1)
    heavy_day = next((d for d in days if d.time.astimezone(zone).date() == tomorrow and d.precipitation is not None and d.precipitation >= 20), None)
    if heavy_day:
        add(Signal("rain-tomorrow", "future", 0, t("Forte pluie demain : {mm} mm", mm=number(heavy_day.precipitation or 0)), t("Prévision du fournisseur météo pour demain, dès 20 mm."),
                   "mdi:weather-pouring", settings.weather_entity, heavy_day.time.timestamp(), t("demain"),
                   short=t("Forte pluie : {mm} mm", mm=number(heavy_day.precipitation or 0))))
    if not upcoming:
        caveats.append(t("Prévisions des 6 prochaines heures indisponibles."))
    elif any(x.hour.precipitation is None for x in upcoming):
        caveats.append(t("Certaines quantités de pluie manquent : le total peut être plus élevé."))

    with_pollen = settings.pollen_source not in ("none", "legacy")
    for next_day in (False, True):
        def group(metrics: Sequence[str]) -> list[tuple[str, atmo.Reading]]:
            out = []
            for metric in metrics:
                r = atmo.read_metric(get, settings, metric, next_day, now, zone)
                if r is not None and r.value is not None:
                    out.append((metric, r))
            return out
        air = group(("air", *atmo.POLLUTANT_METRICS))
        pollens = group(("pollen", *atmo.POLLEN_METRICS)) if with_pollen else []
        when = t("demain") if next_day else t("aujourd’hui")
        noon = datetime.combine(now.astimezone(zone).date() + timedelta(days=1), datetime.min.time(), zone).replace(hour=12)
        dated = {"at": noon.timestamp(), "clock": t("demain")} if next_day else {}
        for kind, readings in (("air", air), ("pollen", pollens)):
            fresh = sorted((x for x in readings if not x[1].stale and (x[1].value or 0) <= 6), key=lambda x: -(x[1].value or 0))
            # WAQI measures today's air at a station; Open-Meteo forecasts tomorrow's: both said on Atmo's scale.
            origin = waqi.source(settings, readings[0][1].entity_id) if kind == "air" and readings else None
            if any(x[1].stale for x in readings):
                caveats.append(t("{source} air {when} : données trop anciennes, non utilisées.", source=origin or "Atmo", when=when) if kind == "air"
                               else t("{source} pollens {when} : données trop anciennes, non utilisées.", source=origin or "Atmo", when=when))
            if any(not x[1].updated for x in fresh):
                caveats.append(t("{source} air : date de publication inconnue.", source=origin or "Atmo") if kind == "air"
                               else t("{source} pollens : date de publication inconnue.", source=origin or "Atmo"))
            if fresh:
                metric, r = fresh[0]
                v = r.value or 0
                serious, watch = (4, 3) if kind == "air" else (5, 4)
                detail = f" ({_lower_first(atmo.short_label(metric))})" if metric != kind else ""
                said = (t("Air extérieur : {level}", level=r.label.lower()) if kind == "air" else t("Pollens : niveau {level}", level=r.label.lower()))
                zone_text = t(", zone {zone}", zone=r.zone) if r.zone else ""
                not_here = t("Ce n’est pas une mesure faite chez vous.")
                if origin is None:
                    why = (t("Indice Atmo {index} sur 6{zone}.", index=int(v), zone=zone_text) + " "
                           + (t("Publié le {date}.", date=r.updated) if r.updated else t("Date de publication inconnue.")) + " " + not_here)
                elif origin == waqi.NAME:
                    why = (t("Mesure WAQI{zone}, ramenée au niveau {index} sur 6.", zone=f", {r.zone}" if r.zone else "", index=int(v)) + " "
                           + (t("Relevée le {date}.", date=r.updated) if r.updated else t("Heure de mesure inconnue.")) + " " + not_here)
                else:
                    why = (t("Prévision Open-Meteo (modèle européen Copernicus), niveau {index} sur 6.", index=int(v)) + " "
                           + (t("Calculée le {date}.", date=r.updated) + " " if r.updated else " ") + not_here)
                add(Signal(f"{kind}-{str(next_day).lower()}", "environment", 2 if v >= serious else 1 if v >= watch else 0,
                           f"{said} {when}{detail}", why,
                           "mdi:air-filter" if kind == "air" else "mdi:flower-pollen", r.entity_id, **dated, short=f"{said}{detail}", index=v))
            event = next((x for x in readings if x[1].value == 7 and not x[1].stale), None)
            if event:
                add(Signal(f"atmo-event-{str(next_day).lower()}", "environment", 1, t("Événement signalé par Atmo {when}", when=when),
                           t("Atmo signale un événement particulier (code 7). Ce n’est pas un niveau de pollution."), "mdi:information-outline", event[1].entity_id,
                           **dated, short=t("Événement signalé par Atmo")))
    if settings.pollen_source not in ("none", "atmo") and not settings.atmo_pollens:
        for pollen in settings.pollens:
            state = get(pollen.entity_id)
            level = polleninfo.usable_level(get, settings, pollen, now=now, zone=zone)
            if level is not None and 3 <= level <= 4:
                label = polleninfo.name(pollen, state)
                scale = N_("1 à 4") if polleninfo.provider(settings) == polleninfo.KLEENEX else N_("0 à 4")
                add(Signal(f"legacy-{pollen.entity_id}", "environment", 2 if level == 4 else 1,
                           t("{name} : pollens très élevés", name=label) if level == 4 else t("{name} : pollens élevés", name=label),
                           t("Niveau {provider}, sur une échelle de {scale}. Ce n’est pas une mesure faite chez vous.", provider=polleninfo.provider_name(settings), scale=t(scale)),
                           "mdi:flower-pollen", pollen.entity_id,
                           short=t("Pollens : {name} très élevés", name=label.lower()) if level == 4 else t("Pollens : {name} élevés", name=label.lower()), index=level))
    if settings.vigilance_entity:
        official = read_vigilance(settings, get, now, platforms)
        if official is None:
            caveats.append(t("Vigilance indisponible ou trop ancienne : consultez le service officiel de votre région."))
        elif official.level > 0:
            add(Signal("official", "official", official.level, official.text,
                       t("Vigilance officielle {source}. Ouvrez le capteur pour lire les consignes.", source=official.source), "mdi:alert-outline", settings.vigilance_entity))

    severity = max((s.severity for s in signals), default=0)
    signals.sort(key=lambda s: (-s.severity, GROUPS.index(s.group), s.key))

    def phrases(g: str) -> str:
        return t(" ; ").join([s.text for s in signals if s.group == g][:2])

    lines = [t("Maintenant : {text}", text=current + (" " + phrases("now") + "." if phrases("now") else ""))]
    if phrases("future"):
        lines.append(t("À venir : {text}.", text=phrases("future")))
    elif not upcoming:
        lines.append(t("À venir : prévisions indisponibles."))
    if phrases("environment"):
        lines.append(t("Air et pollens : {text}.", text=phrases("environment")))
    if phrases("official"):
        lines.append(phrases("official") + ".")
    omitted = sum(1 for g in ("now", "future", "environment") for s in [x for x in signals if x.group == g][2:] if s.severity > 0)
    if omitted:
        lines.append(t("{count} autres points à consulter dans les explications.", count=omitted) if omitted > 1
                     else t("1 autre point à consulter dans les explications."))
    available = feels is not None or bool(signals) or bool(upcoming)
    official_signal = next((s for s in signals if s.key == "official"), None)
    themes = {"wind": N_("Vent"), "wind-rain": N_("Pluie et vent"), "rain-now": N_("Pluie"), "rain-future": N_("Pluie"), "wind-future": N_("Vent"), "pressure-future": N_("Pression"), "storm": N_("Orage"), "storm-near": N_("Orage"),
              "water": N_("Restrictions d’eau"),
              "temperature": N_("Chaleur") if feels is not None and feels >= 34 else N_("Froid"), "freeze-future": N_("Froid"), "frost-night": N_("Gel"),
              "fog": N_("Brouillard"), "uv": N_("UV")}
    topics: list[str] = []
    for s in signals:
        if s.severity > 0 and s.group != "official":
            topic = t(themes.get(s.key) or (N_("Air extérieur") if s.key.startswith("air-") or s.key.startswith("atmo-event") else N_("Pollens") if s.group == "environment" else N_("Météo")))
            if topic not in topics:
                topics.append(topic)
    title = official_signal.text if official_signal and official_signal.severity == severity else " · ".join(topics[:3]) if topics else t("Votre météo en bref")
    return Brief(title=title, label=t("Données insuffisantes") if not available else t("Synthèse partielle") if severity == 0 and caveats else t(LEVELS[severity]),
                 color=COLORS[severity] if available else "150,150,150", icon=next((s.icon for s in signals if s.severity > 0), "mdi:weather-partly-cloudy"),
                 summary="\n".join(lines), signals=tuple(signals), caveats=tuple(dict.fromkeys(caveats)), available=available, severity=severity)
