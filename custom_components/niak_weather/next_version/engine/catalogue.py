"""The catalogue: what the weather means for the house, as values any automation can read (watering, heating, shutters, notifications).

Each entry gives its value with the sentence that explains it, where it comes from (station, bulletin, forecast, vigilance, Atmo),
and when it starts and ends when that is known. An unknown value stays None: it never reads as « no rain » or « no alert ».
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Callable, Mapping, Sequence
from zoneinfo import ZoneInfo

from . import atmo, polleninfo, water
from .brief import COLOR_NAMES, Brief, number, read_vigilance
from .feel import STORMY, normalise_condition
from .forecast import Day, Hour
from .lightning import NEAR_KM, Lightning
from .local import CONDITION_TITLES, LocalWeather
from .settings import Settings
from .station import Derived
from .units import Kind, finite, measurement

HOUR = timedelta(hours=1)
CONDITIONS = ("clear-night", "cloudy", "exceptional", "fog", "hail", "lightning", "lightning-rainy", "partlycloudy", "pouring", "rainy",
              "snowy", "snowy-rainy", "sunny", "windy", "windy-variant")
"""Home Assistant's weather conditions: the states of « temps observé »."""
VIGILANCE = COLOR_NAMES
DRYING = ("excellent", "bon", "moyen", "mauvais", "impossible")
ALERTS = ("vigilance", "orage", "vent_fort", "pluie_forte", "gel", "canicule", "uv_fort")
"""The entries that start, change and end as alerts."""
RAINY = ("rainy", "pouring", "lightning-rainy", "snowy-rainy", "hail")
# How much sun each condition lets through, for hours whose cloud cover is not given.
SUN_SHARE = {"sunny": 100, "clear-night": 100, "windy": 60, "partlycloudy": 55, "windy-variant": 40, "exceptional": 30, "cloudy": 15,
             "lightning": 15, "fog": 10, "rainy": 10, "snowy": 10, "lightning-rainy": 10, "pouring": 5, "snowy-rainy": 5, "hail": 5}
HEATING_BASE, COOLING_BASE = 18, 22


@dataclass(frozen=True)
class Item:
    value: Any
    """A number, a word, True/False for a yes/no, or None when unknown."""
    reason: str = ""
    source: str | None = None
    """« station », « bulletin », « prevision », « vigilance », « atmo », « waqi », « blitzortung » or « vigieau »."""
    start: datetime | None = None
    end: datetime | None = None
    partial: bool = False
    """Part of the data was missing: a total may be higher, a window was not fully covered."""
    level: int = 0
    """For an alert: 1 to watch, 2 serious, 3 official red."""
    extra: Mapping[str, Any] = field(default_factory=dict)


Catalogue = Mapping[str, Item]


def hour_text(moment: datetime, zone: ZoneInfo) -> str:
    """« 6 h », « midi », « minuit »."""
    hour = moment.astimezone(zone).hour
    return "minuit" if hour == 0 else "midi" if hour == 12 else f"{hour} h"


def _overlap(h: Hour, start: datetime, end: datetime) -> float:
    if h.time is None:
        return 0
    return max(0.0, (min(end, h.time + HOUR) - max(start, h.time)).total_seconds())


def rain_between(hours: Sequence[Hour], start: datetime, end: datetime) -> tuple[float | None, bool]:
    """The forecast rain between two moments, each hour counted for the part of it inside the window.
    None when no forecast hour covers the window; partial when the forecast stops before the end or misses an amount."""
    total, covered, missing = 0.0, 0.0, False
    for h in hours:
        seconds = _overlap(h, start, end)
        if not seconds:
            continue
        covered += seconds
        if h.precipitation is None:
            missing = True
        else:
            total += max(0.0, h.precipitation) * seconds / 3600
    if not covered:
        return None, True
    return round(total, 1), missing or covered < (end - start).total_seconds() - 1


def night_end(now: datetime, zone: ZoneInfo) -> datetime:
    """The end of the coming night: the first 10 h at least six hours away (at 23 h or at 5 h, tomorrow morning)."""
    later = (now + timedelta(hours=6)).astimezone(zone)
    end = later.replace(hour=10, minute=0, second=0, microsecond=0)
    return end if end > later else end + timedelta(days=1)


def _span_of(rainy: Sequence[Hour], now: datetime, zone: ZoneInfo) -> str:
    """« Pluie de 16 h à 19 h », then the next shower: « , puis demain vers midi ». « Demain » when it falls tomorrow in the
    daytime (after midnight, the night is still tonight's)."""
    runs: list[list[datetime]] = []
    for h in rainy:
        if h.time is None:
            continue
        if runs and h.time - runs[-1][-1] <= HOUR:
            runs[-1].append(h.time)
        else:
            runs.append([h.time])

    def said(run: list[datetime]) -> str:
        local = run[0].astimezone(zone)
        day = "demain " if local.date() > now.astimezone(zone).date() and local.hour >= 6 else ""
        return f"{day}vers {hour_text(run[0], zone)}" if len(run) == 1 else f"{day}de {hour_text(run[0], zone)} à {hour_text(run[-1] + HOUR, zone)}"

    return "Pluie " + said(runs[0]) + (f", puis {said(runs[1])}" if len(runs) > 1 else "")


def _day_of(days: Sequence[Day], day: date, zone: ZoneInfo) -> Day | None:
    return next((d for d in days if d.time.astimezone(zone).date() == day), None)


def _day_mean(hours: Sequence[Hour], days: Sequence[Day], day: date, zone: ZoneInfo) -> float | None:
    """The day's mean temperature as heating engineers count it, (high + low) / 2; else the mean of a nearly complete hourly day."""
    forecast = _day_of(days, day, zone)
    if forecast and forecast.high is not None and forecast.low is not None:
        return (forecast.high + forecast.low) / 2
    temps = [h.temperature for h in hours if h.time is not None and h.time.astimezone(zone).date() == day and h.temperature is not None]
    return sum(temps) / len(temps) if len(temps) >= 20 else None


def build_catalogue(w: LocalWeather, brief: Brief, derived: Derived | None, settings: Settings, get: Callable[[str], Any],
                    hours: Sequence[Hour], days: Sequence[Day], now: datetime, zone: ZoneInfo,
                    platforms: Mapping[str, str] | None = None, lightning: Lightning | None = None) -> dict[str, Item]:
    """Every entry of the catalogue at this moment. `hours` and `days` are the whole forecasts; `lightning` Blitzortung's strikes."""
    upcoming = sorted((h for h in hours if h.time is not None and h.time + HOUR > now), key=lambda h: h.time or now)
    forecast = bool(upcoming)
    weather = get(settings.weather_entity)
    bulletin_state = normalise_condition(weather.state) if weather is not None and weather.state not in ("unavailable", "unknown") else None
    bulletin: Mapping[str, Any] = weather.attributes if weather is not None else {}
    station_temperature = bool(settings.temperature_entity)
    signal = {s.key: s for s in brief.signals}

    def at(seconds: float | None) -> datetime | None:
        return None if seconds is None else datetime.fromtimestamp(seconds, zone)

    def within(span: timedelta) -> list[Hour]:
        return [h for h in upcoming if h.time is not None and h.time < now + span]

    items: dict[str, Item] = {}

    # ---- Maintenant ----
    condition = w.condition if w.condition in CONDITIONS else None
    if condition is None:
        items["temps_observe"] = Item(None, "Bulletin indisponible", "bulletin")
    elif w.observed:
        why = {"fog": f"{number(w.humidity or 0, 0)} % d’humidité mesurés : brouillard",
               "partlycloudy": f"{number(w.solar or 0, 0)} W/m² mesurés : du soleil malgré le bulletin"}.get(
            condition, f"{number(w.rain.rate or 0)} mm/h mesurés : la station passe devant le bulletin")
        items["temps_observe"] = Item(condition, why, "station")
    else:
        items["temps_observe"] = Item(condition, f"Bulletin : {CONDITION_TITLES.get(condition, condition).lower()}", "bulletin")
    if (condition is not None and lightning is not None and lightning.overhead
            and condition not in ("lightning", "lightning-rainy", "hail", "snowy", "snowy-rainy")):
        # Strikes within 10 km: the storm is here, whatever the sky the bulletin or the station gave.
        sky = "lightning-rainy" if condition in ("rainy", "pouring") else "lightning"
        items["temps_observe"] = Item(sky, f"Éclairs à {number(max(1.0, lightning.recent_nearest or 0), 0)} km : orage sur place", "blitzortung")

    if settings.rain_rate_entity:
        rate = w.rain.rate
        items["pluie_en_cours"] = (Item(None, "Pluviomètre indisponible", "station") if rate is None else
                                   Item(rate >= 0.3, f"{number(rate)} mm/h mesurés" if rate >= 0.3 else "Pas de pluie mesurée", "station"))
    elif bulletin_state is None:
        items["pluie_en_cours"] = Item(None, "Bulletin indisponible", "bulletin")
    else:
        raining = bulletin_state in RAINY
        items["pluie_en_cours"] = Item(raining, f"Bulletin : {CONDITION_TITLES.get(bulletin_state, bulletin_state).lower()}" if raining
                                       else "Pas de pluie selon le bulletin", "bulletin")

    fog_later = signal.get("fog-later")
    if w.condition == "fog" and w.observed:
        items["brouillard"] = Item(True, f"Air saturé : {number(w.humidity or 0, 0)} % d’humidité mesurés", "station")
    elif bulletin_state == "fog":
        items["brouillard"] = Item(True, "Annoncé par le bulletin", "bulletin")
    elif fog_later:
        items["brouillard"] = Item(True, fog_later.text, "prevision", start=at(fog_later.at))
    elif bulletin_state is None and w.temperature is None:
        items["brouillard"] = Item(None, "Bulletin indisponible")
    else:
        items["brouillard"] = Item(False, "Pas de brouillard attendu", "station" if w.humidity_source == "station" else "bulletin")

    # ---- Alertes ----
    if not settings.vigilance_entity:
        items["vigilance"] = Item(None, "Vigilance officielle non configurée", "vigilance")
    else:
        official = read_vigilance(settings, get, now, platforms)
        items["vigilance"] = (Item(None, "Vigilance indisponible ou trop ancienne", "vigilance") if official is None else
                              Item(VIGILANCE[official.level], official.text if official.level else "Aucune vigilance", "vigilance", level=official.level,
                                   extra=official.extra))

    six = within(timedelta(hours=6))
    strikes = lightning.extra() if lightning is not None and lightning.available else {}
    storm_index = next((i for i, h in enumerate(upcoming) if h in six and normalise_condition(h.condition) in STORMY), None)
    storm_now = bulletin_state in STORMY
    if storm_index is not None or storm_now:
        run = upcoming[storm_index:] if storm_index is not None else []
        last = None
        for h in run:
            if normalise_condition(h.condition) not in STORMY:
                break
            last = h
        first = run[0] if run else None
        end = last.time + HOUR if last and last.time else None
        started = storm_now or (first is not None and first.time is not None and first.time <= now)
        words = "Orage en cours" if started else f"Orage prévu vers {hour_text(first.time, zone)}" if first and first.time else "Orage"
        # Blitzortung sees no strike near the storm the bulletin says is here: it is told, never hidden (it may be forming).
        calm = f", aucun éclair à moins de {NEAR_KM} km pour l’instant" if started and strikes and not lightning.near else ""
        items["orage"] = Item(True, words + (f", jusqu’à {hour_text(end, zone)}" if end else "") + calm, "prevision" if first else "bulletin",
                              start=None if started or not first else first.time, end=end, level=2, extra=strikes)
    elif forecast:
        # Without the next hours, a calm sky now says nothing about the storm of 17 h.
        items["orage"] = Item(False, "Aucun orage dans les 6 h", "prevision", extra=strikes)
    else:
        items["orage"] = Item(None, "Prévisions indisponibles", "prevision", extra=strikes)
    if lightning is not None and lightning.near:
        # Strikes within 30 km: the storm is here, forecast or not. Its end, when the forecast gives one, is kept.
        before = items["orage"]
        items["orage"] = Item(True, lightning.text, "blitzortung", end=before.end if before.value else None,
                              level=max(lightning.level, 1), extra=strikes)

    if settings.wind_speed_entity or settings.wind_gust_entity:
        speed, gust, wind_source = w.wind.speed, w.wind.gust, "station"
    else:
        unit = bulletin.get("wind_speed_unit")
        speed, gust = measurement(bulletin.get("wind_speed"), unit, Kind.WIND), measurement(bulletin.get("wind_gust_speed"), unit, Kind.WIND)
        wind_source = "bulletin"
    if speed is None and gust is None:
        items["vent_fort"] = Item(None, "Vent inconnu", wind_source)
    elif (speed or 0) >= 30 or (gust or 0) >= 40:
        said = "mesurées" if wind_source == "station" else "annoncées"
        items["vent_fort"] = Item(True, f"Rafales {said} à {number(gust, 0)} km/h" if gust is not None else
                                  f"Vent {said[:-2]} à {number(speed or 0, 0)} km/h", wind_source,
                                  level=2 if (speed or 0) >= 50 or (gust or 0) >= 60 else 1)
    else:
        items["vent_fort"] = Item(False, "Vent sous 30 km/h, rafales sous 40 km/h", wind_source)

    rate = w.rain.rate if settings.rain_rate_entity else None
    total6, partial6 = rain_between(upcoming, now, now + timedelta(hours=6))
    rainy6 = [h for h in six if (h.precipitation or 0) >= 0.3]
    heavy_future = bool(rainy6) and (max(h.precipitation or 0 for h in rainy6) >= 5 or (total6 or 0) >= 20)
    measured_heavy = rate is not None and rate >= 4
    pouring = not settings.rain_rate_entity and bulletin_state == "pouring"
    if settings.rain_rate_entity and rate is None and not forecast:
        items["pluie_forte"] = Item(None, "Pluviomètre et prévisions indisponibles")
    elif not settings.rain_rate_entity and bulletin_state is None and not forecast:
        items["pluie_forte"] = Item(None, "Prévisions indisponibles", "prevision")
    elif measured_heavy or heavy_future or pouring:
        parts = [f"{number(rate or 0)} mm/h mesurés"] if measured_heavy else ["Fortes pluies selon le bulletin"] if pouring else []
        end = rainy6[-1].time + HOUR if rainy6 and rainy6[-1].time else None
        if heavy_future and end:
            parts.append(f"{number(total6 or 0)} mm prévus d’ici {hour_text(end, zone)}")
        items["pluie_forte"] = Item(True, " ; ".join(parts), "station" if measured_heavy else "bulletin" if pouring else "prevision",
                                    start=None if measured_heavy or not rainy6 else rainy6[0].time, end=end, partial=heavy_future and partial6, level=2)
    else:
        items["pluie_forte"] = Item(False, "Pas de forte pluie mesurée ni prévue", "prevision" if forecast else "station")

    frost = signal.get("frost-night")
    night18 = [h.temperature for h in upcoming if h.time is not None and h.time < now + timedelta(hours=18) and h.temperature is not None]
    low18 = min(night18) if night18 else None
    temperature = w.temperature
    freezing = temperature is not None and temperature <= 0
    if temperature is None and not forecast:
        items["gel"] = Item(None, "Température et prévisions indisponibles")
    elif freezing or frost:
        parts = [f"{number(temperature or 0)} °C {'mesurés' if station_temperature else 'annoncés'}"] if freezing else []
        if frost:
            parts.append(frost.text)
        coldest = min(v for v in (temperature if freezing else None, low18) if v is not None)
        items["gel"] = Item(True, " ; ".join(parts), "station" if freezing and station_temperature else "prevision",
                            start=None if freezing else at(frost.at if frost else None), level=2 if coldest <= -3 else 1, extra={"minimale": low18})
    else:
        items["gel"] = Item(False, f"Minimale prévue : {number(low18)} °C" if low18 is not None else "Pas de gel prévu", "prevision",
                            extra={"minimale": low18})

    feels = w.feel.value
    day_ahead = [h for h in within(timedelta(hours=24)) if h.temperature is not None]
    hot_hour = max(day_ahead, key=lambda h: h.temperature or 0) if day_ahead else None
    tomorrow = now.astimezone(zone).date() + timedelta(days=1)
    tomorrow_day = _day_of(days, tomorrow, zone)
    candidates = [(hot_hour.temperature, f"vers {hour_text(hot_hour.time, zone)}" if hot_hour.time and hot_hour.time.astimezone(zone).date() < tomorrow
                   else "demain", hot_hour.time)] if hot_hour and hot_hour.temperature is not None else []
    if tomorrow_day and tomorrow_day.high is not None:
        candidates.append((tomorrow_day.high, "demain", tomorrow_day.time))
    hottest = max(candidates, key=lambda c: c[0] or 0) if candidates else None
    if feels is None and hottest is None:
        items["canicule"] = Item(None, "Ressenti et prévisions indisponibles")
    elif (feels is not None and feels >= 34) or (hottest and (hottest[0] or 0) >= 35):
        parts = [f"{number(feels)} °C ressentis"] if feels is not None and feels >= 34 else []
        if hottest and (hottest[0] or 0) >= 35:
            parts.append(f"{number(hottest[0] or 0)} °C prévus {hottest[1]}")
        serious = (feels is not None and feels >= 38) or bool(hottest and (hottest[0] or 0) >= 38)
        items["canicule"] = Item(True, " ; ".join(parts), "station" if feels is not None and feels >= 34 else "prevision",
                                 start=None if feels is not None and feels >= 34 else hottest[2] if hottest else None, level=2 if serious else 1)
    else:
        items["canicule"] = Item(False, "Pas de forte chaleur", "prevision" if hottest else "station")

    # The UV sensor first; without it (or while it is silent), the weather service's index.
    weather = get(settings.weather_entity) if settings.weather_entity else None
    forecast_uv = finite(weather.attributes.get("uv_index")) if weather is not None and weather.state not in ("unavailable", "unknown") else None
    uv, uv_source = (w.uv, "station") if w.uv is not None else (forecast_uv, "prevision")
    if uv is None:
        items["uv_fort"] = Item(None, "Capteur UV indisponible" if settings.uv_index_entity else "Pas de capteur UV ni d’indice prévu", "station")
    else:
        strong = uv >= 6
        text = "faible" if uv < 3 else "modéré" if uv < 6 else "fort" if uv < 8 else "très fort" if uv < 11 else "extrême"
        items["uv_fort"] = Item(strong, f"Indice UV {number(uv, 0)} : {text}" if strong else "Indice UV sous 6", uv_source,
                                level=2 if uv >= 8 else 1 if strong else 0)

    # ---- Prochaines heures ----
    for key, span in (("pluie_heure", 1), ("pluie_6h", 6), ("pluie_24h_prevue", 24)):
        total, partial = rain_between(upcoming, now, now + timedelta(hours=span))
        rainy = [h for h in within(timedelta(hours=span)) if (h.precipitation or 0) >= 0.3]
        if total is None:
            items[key] = Item(None, "Prévisions indisponibles", "prevision")
        else:
            items[key] = Item(total, _span_of(rainy, now, zone) if rainy and total >= 0.1 else "Sec", "prevision",
                              start=rainy[0].time if rainy else None, end=rainy[-1].time + HOUR if rainy and rainy[-1].time else None, partial=partial)

    end_of_night = night_end(now, zone)
    night = [h for h in upcoming if h.time is not None and h.time < end_of_night and h.temperature is not None]
    if night:
        coldest_hour = min(night, key=lambda h: h.temperature or 0)
        low = coldest_hour.temperature or 0
        when = f"vers {hour_text(coldest_hour.time, zone)}" if coldest_hour.time else ""
        items["minimale_nuit"] = Item(low, f"Nuit chaude, {when}" if low >= 20 else when[:1].upper() + when[1:], "prevision", start=coldest_hour.time,
                                      partial=(night[-1].time or now) + HOUR < end_of_night)
    else:
        morning = _day_of(days, end_of_night.date(), zone)
        items["minimale_nuit"] = (Item(morning.low, "Minimale du jour prévue", "prevision", partial=True) if morning and morning.low is not None
                                  else Item(None, "Prévisions indisponibles", "prevision"))

    tomorrow_hours = [h for h in hours if h.time is not None and h.time.astimezone(zone).date() == tomorrow and h.temperature is not None]
    peak = max(tomorrow_hours, key=lambda h: h.temperature or 0) if tomorrow_hours else None
    if tomorrow_day and tomorrow_day.high is not None:
        items["maximale_demain"] = Item(tomorrow_day.high, f"Vers {hour_text(peak.time, zone)}" if peak and peak.time else "Prévision du jour", "prevision",
                                        start=peak.time if peak else None)
    elif peak:
        last_hour = max(h.time for h in tomorrow_hours if h.time is not None).astimezone(zone).hour
        items["maximale_demain"] = Item(peak.temperature, f"Vers {hour_text(peak.time, zone)}" if peak.time else "", "prevision", start=peak.time,
                                        partial=last_hour < 18)
    else:
        items["maximale_demain"] = Item(None, "Prévisions indisponibles", "prevision")

    winds = [(h.wind_gust if h.wind_gust is not None else h.wind_speed, h) for h in six]
    winds = [(v, h) for v, h in winds if v is not None]
    if winds:
        top, top_hour = max(winds, key=lambda x: x[0] or 0)
        items["rafales_6h"] = Item(round(top or 0), "Calme" if (top or 0) < 20 else
                                   f"Jusqu’à {number(top or 0, 0)} km/h vers {hour_text(top_hour.time, zone)}" if top_hour.time else "",
                                   "prevision", start=top_hour.time, partial=any(h.wind_gust is None for h in six))
    else:
        items["rafales_6h"] = Item(None, "Prévisions de vent indisponibles", "prevision")

    # ---- Jardin ----
    week = [d for d in derived.days if d.value is not None] if derived else []
    if week:
        items["pluie_7j"] = Item(round(sum(d.value or 0 for d in week), 1), "Mesurée par la station, aujourd’hui compris", "station",
                                 partial=len(week) < 7 or any(d.partial for d in week))
    else:
        items["pluie_7j"] = Item(None, "Pas de pluie mesurée : pluviomètre absent ou historique désactivé", "station")

    restriction = water.read(get, settings)
    if restriction is not None:
        items["restrictions_eau"] = Item(restriction.value, restriction.text, "vigieau", level=restriction.level, extra=restriction.extra())
    else:
        items["restrictions_eau"] = Item(None, "Vigieau non choisi" if not settings.water_restriction_entity else "Vigieau indisponible", "vigieau")

    # ---- Bâtiment ----
    today = now.astimezone(zone).date()
    mean_today, mean_tomorrow = _day_mean(hours, days, today, zone), _day_mean(hours, days, tomorrow, zone)
    for key, base, sign in (("degres_jours_chauffe", HEATING_BASE, 1), ("degres_jours_clim", COOLING_BASE, -1)):
        def degrees(mean: float | None) -> float | None:
            return None if mean is None else round(max(0.0, sign * (base - mean)), 1)
        value, next_day = degrees(mean_today), degrees(mean_tomorrow)
        if value is None:
            items[key] = Item(None, "Prévision du jour indisponible", "prevision")
        else:
            items[key] = Item(value, f"Moyenne prévue {number(mean_today or 0)} °C, base {base} °C"
                              + (f" ; demain {number(next_day)}" if next_day is not None else ""), "prevision", extra={"demain": next_day, "base": base})

    # ---- Énergie ----
    daylight = [h for h in hours if h.time is not None and h.time.astimezone(zone).date() == tomorrow
                and w.sunrise <= h.time.astimezone(zone).hour + 0.5 < w.sunset]
    shares = [100 - h.cloud_coverage if h.cloud_coverage is not None else SUN_SHARE.get(normalise_condition(h.condition)) for h in daylight]
    known = [s for s in shares if s is not None]
    sunshine: float | None
    if known:
        sunshine, partial = round(sum(known) / len(known)), len(known) < len(shares) or len(daylight) < (w.sunset - w.sunrise) - 1
    elif tomorrow_day and SUN_SHARE.get(normalise_condition(tomorrow_day.condition)) is not None:
        sunshine, partial = SUN_SHARE[normalise_condition(tomorrow_day.condition)], True
    else:
        sunshine, partial = None, True
    items["ensoleillement_demain"] = (Item(None, "Prévision de demain indisponible", "prevision") if sunshine is None else
                                      Item(sunshine, "Grand soleil" if sunshine >= 80 else "Soleil, quelques nuages" if sunshine >= 60 else
                                           "Éclaircies" if sunshine >= 35 else "Ciel souvent couvert" if sunshine >= 15 else "Ciel couvert",
                                           "prevision", partial=partial))

    # ---- Vie pratique ----
    items["sechage_linge"] = _drying(w, items["pluie_en_cours"], upcoming, now, zone)

    if night:
        coldest_hour = min(night, key=lambda h: h.temperature or 0)
        low = coldest_hour.temperature or 0
        clear = (normalise_condition(coldest_hour.condition) in ("clear-night", "sunny")
                 or (coldest_hour.cloud_coverage is not None and coldest_hour.cloud_coverage < 40))
        calm = coldest_hour.wind_speed is None or coldest_hour.wind_speed < 10
        when = hour_text(coldest_hour.time, zone) if coldest_hour.time else ""
        # A windscreen under a clear, calm sky cools a few degrees below the air: frost forms up to +3 °C.
        if low <= 0 or (low <= 3 and clear and calm):
            items["givre_pare_brise"] = Item(True, f"{number(low)} °C{' et ciel clair' if clear else ''} vers {when}", "prevision", start=coldest_hour.time)
        else:
            items["givre_pare_brise"] = Item(False, f"Pas de givre : {number(low)} °C au plus froid", "prevision")
    else:
        items["givre_pare_brise"] = Item(None, "Prévisions indisponibles", "prevision")

    items["qualite_air"] = _atmo(get, settings, "air", atmo.POLLUTANT_METRICS, now, zone)
    items["pollens"] = (_atmo(get, settings, "pollen", atmo.POLLEN_METRICS, now, zone) if settings.pollen_source not in ("none", "legacy")
                        else _polleninformation(get, settings, now, zone) if settings.pollen_source == "legacy"
                        else Item(None, "Pas de source de pollens", "atmo"))
    return items


def _drying(w: LocalWeather, raining: Item, upcoming: Sequence[Hour], now: datetime, zone: ZoneInfo) -> Item:
    """Whether laundry dries outside: no rain now or within 3 h, daylight, then warmth, dry air, a breeze and sun."""
    soon = next((h for h in upcoming if h.time is not None and h.time < now + timedelta(hours=3) and (h.precipitation or 0) >= 0.3), None)
    local = now.astimezone(zone)
    hour = local.hour + local.minute / 60
    if raining.value:
        return Item("impossible", "Il pleut", raining.source)
    if soon and soon.time:
        return Item("impossible", f"Pluie prévue vers {hour_text(soon.time, zone)}", "prevision", start=soon.time)
    if w.sun_elevation < 3 or hour >= w.sunset - 0.5 or hour < w.sunrise:
        return Item("mauvais", "Nuit ou jour qui tombe", "station")
    temperature, humidity = w.temperature, w.humidity
    if temperature is None:
        return Item(None, "Température inconnue")
    source = "station" if w.humidity_source == "station" else "bulletin"
    if temperature < 5 or (humidity is not None and humidity >= 90) or w.condition == "fog":
        return Item("mauvais", "Trop froid ou trop humide", source)
    wind = w.wind.speed
    warm = 2 if temperature >= 20 else 1 if temperature >= 12 else 0
    dry = 1 if humidity is None else 2 if humidity < 50 else 1 if humidity < 70 else 0
    breeze = 1 if wind is not None and 5 <= wind <= 40 else 0
    sun = 1 if w.sunshine or w.condition in ("sunny", "partlycloudy") else 0
    score = warm + dry + breeze + sun
    rain_at = next((h.time for h in upcoming if h.time is not None and h.time > now and (h.precipitation or 0) >= 0.3), None)
    minutes = round(w.sunset * 60)
    sunset = local.replace(hour=min(23, minutes // 60), minute=minutes % 60, second=0, microsecond=0)
    until = min(t for t in (rain_at, sunset) if t is not None)
    words = ["chaud" if warm == 2 else "doux" if warm else "frais"]
    if humidity is not None:
        words.append("sec" if humidity < 50 else "un peu humide" if humidity < 70 else "humide")
    if wind is not None:
        words.append("sans vent" if wind < 5 else "léger vent" if wind < 20 else "bon vent" if wind <= 40 else "trop de vent")
    return Item("excellent" if score >= 5 else "bon" if score >= 3 else "moyen", f"Jusqu’à {hour_text(until, zone)} : {', '.join(words)}", source, end=until)


def _polleninformation(get: Callable[[str], Any], settings: Settings, now: datetime, zone: ZoneInfo) -> Item:
    """The level of the day given per species (Polleninformation or IRM KMI), on its own scale of 0 to 4, and the species that weighs most."""
    source, name = polleninfo.provider(settings), polleninfo.provider_name(settings)
    if not settings.pollens and not settings.pollen_risk_entity:
        return Item(None, f"Capteurs {name} non choisis", source)
    value, main = polleninfo.worst(*polleninfo.readings(get, settings, False, now, zone))
    if value is None:
        return Item(None, f"{name} indisponible", source)
    tomorrow, _ = polleninfo.worst(*polleninfo.readings(get, settings, True, now, zone))
    word = polleninfo.WORDS[value]
    return Item(value, f"{word} ({value}/4)" + (f" · {main}" if main else ""), source,
                extra={"libelle": word, "principal": main, "echelle": polleninfo.SCALE, "demain": tomorrow})


def _atmo(get: Callable[[str], Any], settings: Settings, kind: str, metrics: Sequence[str], now: datetime, zone: ZoneInfo) -> Item:
    """The Atmo France index of the day (1 to 6), its word and what weighs most; for the air, WAQI's station said on the same scale."""
    measured = kind == "air" and settings.air_source == "waqi"
    source = "waqi" if measured else "atmo"
    reading = atmo.read_metric(get, settings, kind, False, now, zone)
    if reading is None:
        return Item(None, "Station WAQI non choisie" if measured else "Atmo France non configuré", source)
    if reading.value == 7 and not reading.stale:
        return Item(None, "Événement signalé par Atmo : pas d’indice ce jour", source)
    if reading.value is None or reading.stale or reading.value > 6:
        return Item(None, "Mesure WAQI indisponible ou trop ancienne" if measured else "Indice Atmo indisponible ou trop ancien", source)
    details = [(m, r) for m in metrics if (r := atmo.read_metric(get, settings, m, False, now, zone)) is not None and r.value is not None and not r.stale]
    main = max(details, key=lambda x: x[1].value or 0)[0] if details else None
    tomorrow = atmo.read_metric(get, settings, kind, True, now, zone)
    index = int(reading.value)
    detail = atmo.short_label(main) if main else None
    return Item(index, f"{reading.label} ({index}/6)" + (f" · {detail}" if detail else ""), source,
                extra={"libelle": reading.label, "principal": detail, "zone": reading.zone or None,
                       "demain": int(tomorrow.value) if tomorrow and tomorrow.value is not None and not tomorrow.stale and tomorrow.value <= 6 else None})
