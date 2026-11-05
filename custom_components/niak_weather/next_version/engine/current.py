"""What it is like outside right now: the sky to show, and the four measurement tiles with where each value comes from."""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Callable, Sequence

from .conditions import CONDITIONS
from .forecast import Hour
from .i18n import N_, t
from .lightning import Lightning
from .local import LocalWeather
from .nuances import sky_detail
from .settings import Settings
from .units import Kind, finite, french, measurement

Getter = Callable[[str], Any]
STATION = N_("Station locale")
NO_RAIN_MEASURED = N_("Pas de pluie mesurée · ciel du bulletin")
DARK_SKIES = ("lightning", "lightning-rainy", "pouring", "hail")
RAIN_LABELS = {"rainy": N_("Pluie"), "pouring": N_("Fortes pluies"), "lightning-rainy": N_("Pluie orageuse"), "snowy": N_("Neige"), "snowy-rainy": N_("Pluie et neige"),
               "hail": N_("Grêle"), "sunny": N_("Temps sec"), "clear-night": N_("Temps sec"), "partlycloudy": N_("Temps sec"), "cloudy": N_("Temps sec"),
               "fog": N_("Brouillard"), "windy": N_("Temps sec"), "windy-variant": N_("Temps sec"), "lightning": N_("Orage")}


def station_label() -> str:
    """The source label, without changing the stable STATION sentinel."""
    return t(STATION)


def available(state: Any) -> bool:
    return state is not None and state.state not in ("unknown", "unavailable")


def _state(get: Getter, entity_id: str | None) -> Any:
    return get(entity_id) if entity_id else None


def weather_source_label(get: Getter, settings: Settings) -> str:
    """Who publishes the forecast: « Météo-France » when recognisable, else the configured name."""
    weather = get(settings.weather_entity)
    attribution = (weather.attributes.get("attribution") or "") if weather else ""
    if re.search(r"m[eé]t[eé]o.?france", f"{attribution} {settings.weather_entity}", re.IGNORECASE):
        return "Météo-France"
    return settings.forecast_source or t("Bulletin météo")


def meaningful_comfort(get: Getter, settings: Settings, w: LocalWeather) -> bool:
    """A feel worth showing: from a working thermometer, or from the bulletin's temperature and humidity when there is no station."""
    if not w.available or w.feel.value is None:
        return False
    thermometer = _state(get, settings.temperature_entity)
    if available(thermometer) and finite(thermometer.state) is not None:
        return True
    # A configured but unavailable thermometer is never replaced by the bulletin.
    return not settings.temperature_entity and w.humidity_source == "bulletin"


@dataclass(frozen=True)
class CurrentWeather:
    condition: str
    """A Home Assistant condition, or « unknown »."""
    label: str
    icon: str
    phase: str
    """« day », « twilight », « night » or « unknown », from the sun's elevation."""
    temperature: float | None
    feels: float | None
    temperature_entity: str | None
    condition_entity: str | None
    source: str
    temperature_source: str
    wind: float | None
    trend: float | None = None
    """°C per hour, only when the temperature moves by 0.1 °C an hour or more."""
    dark_sky: bool = False
    detail: str = ""
    """Météo-France's nuance of the condition (drizzle, freezing rain, mist…), for the card's sky; empty for the plain scene."""


def current_weather(get: Getter, settings: Settings, w: LocalWeather, temperature_trend: float | None = None,
                    original_condition: str | None = None, hour_rain: float | None = None,
                    lightning: Lightning | None = None) -> CurrentWeather:
    """Current conditions only: no future forecast or alert can select the sky. `original_condition` is Météo-France's sensor
    of its own description, when enabled; `hour_rain` the rain forecast for this hour, in mm; `lightning` Blitzortung's strikes."""
    weather = get(settings.weather_entity)
    condition = weather.state.replace("_", "-") if available(weather) else "unknown"
    if condition == "clear":
        condition = "sunny"
    if condition not in CONDITIONS:
        condition = "unknown"
    condition_entity = None if condition == "unknown" else settings.weather_entity
    source = t("État du ciel indisponible") if condition == "unknown" else t("Ciel · bulletin météo")
    rate = w.rain.rate
    # A rain gauge measures liquid water, not snow, hail, fog or lightning.
    if rate is not None and rate >= 0.3 and condition not in ("snowy", "snowy-rainy", "hail"):
        condition = "lightning-rainy" if condition in ("lightning", "lightning-rainy") else "pouring" if rate >= 4 else "rainy"
        condition_entity = settings.rain_rate_entity or settings.weather_entity
        source = t("Pluie mesurée · orage du bulletin") if condition == "lightning-rainy" else t("Pluie mesurée ici")
    # A working gauge can contradict the bulletin's rain, but cannot establish sunshine, cloud cover, or the absence of snow or lightning.
    if settings.rain_rate_entity and rate == 0 and condition in ("rainy", "pouring", "lightning-rainy"):
        condition = "lightning" if condition == "lightning-rainy" else "cloudy"
        source, condition_entity = NO_RAIN_MEASURED, settings.rain_rate_entity
    # Strikes within 10 km in the last ten minutes: the storm is here, whatever the bulletin says. Snow and hail keep their sky.
    if lightning is not None and lightning.overhead and condition not in ("lightning", "lightning-rainy", "hail", "snowy", "snowy-rainy"):
        raining = condition in ("rainy", "pouring") or (rate is not None and rate >= 0.3)
        condition = "lightning-rainy" if raining else "lightning"
        source, condition_entity = t("Éclairs à {distance} km · Blitzortung", distance=french(max(1.0, lightning.recent_nearest or 0), 0)), settings.lightning_entity

    sun = get(settings.sun_entity or "sun.sun")
    elevation_sensor = _state(get, settings.sun_elevation_entity)
    elevation = (finite(elevation_sensor.state) if available(elevation_sensor)
                 else finite(sun.attributes.get("elevation")) if available(sun) else None)
    if elevation is not None:
        phase = "day" if elevation > 6 else "twilight" if elevation > -6 else "night"
    elif available(sun) and sun.state in ("above_horizon", "below_horizon"):
        phase = "day" if sun.state == "above_horizon" else "night"
    elif condition == "clear-night":
        phase = "night"
    elif weather is not None and isinstance(weather.attributes.get("is_daytime"), bool):
        phase = "day" if weather.attributes["is_daytime"] else "night"
    else:
        phase = "unknown"
    if condition == "clear-night" and phase == "day":
        condition = "sunny"
    if condition == "sunny" and phase == "night":
        condition = "clear-night"

    sensor = _state(get, settings.temperature_entity)
    local = measurement(sensor.state, sensor.attributes.get("unit_of_measurement"), Kind.TEMPERATURE) if available(sensor) else None
    temperature = local if local is not None else (
        measurement(weather.attributes.get("temperature"), weather.attributes.get("temperature_unit"), Kind.TEMPERATURE) if available(weather) else None)
    original = _state(get, original_condition)
    description = str(original.state) if available(original) else None
    label, icon = CONDITIONS.get(condition, (N_("Météo indisponible"), "mdi:weather-cloudy-alert"))
    label = t(label)
    if source == NO_RAIN_MEASURED and condition == "cloudy":
        label = t("Nuageux, sans pluie mesurée")
    return CurrentWeather(
        condition=condition, label=label, icon=icon, phase=phase, temperature=temperature, feels=w.feel.value if w.available else None,
        temperature_entity=settings.temperature_entity if local is not None else settings.weather_entity, condition_entity=condition_entity,
        source=t(source) if source == NO_RAIN_MEASURED else source, temperature_source=station_label() if local is not None else weather_source_label(get, settings), wind=w.wind.speed,
        trend=temperature_trend if temperature_trend is not None and abs(temperature_trend) >= 0.1 else None, dark_sky=condition in DARK_SKIES,
        detail=sky_detail(condition, description, rate if rate is not None else hour_rain, temperature))


@dataclass(frozen=True)
class Source:
    """A value and where it was read: the station, or the bulletin standing in for it."""

    value: float | None
    source: str
    entity: str
    fallback: bool = False
    """The station has a sensor for it, but the bulletin stands in while it is unavailable."""


@dataclass(frozen=True)
class Metric:
    key: str
    """« temperature », « wind », « rain » or « pressure »."""
    title: str
    icon: str
    unit: str
    description: str
    source: str
    entity: str
    value: float | None = None
    text: str | None = None
    detail: str | None = None
    fallback: bool = False
    bearing: float | None = None
    bearing_source: str | None = None
    bearing_entity: str | None = None
    gust: Source | None = None


def current_metrics(get: Getter, settings: Settings, w: LocalWeather, hours: Sequence[Hour] = (), now: datetime | None = None) -> list[Metric]:
    """Temperature, wind, rain and pressure, in that order. Bulletin fallbacks only stand in for display: forecast rain never becomes a measured total."""
    weather = get(settings.weather_entity)
    bulletin = weather.attributes if available(weather) else {}
    provider, result = weather_source_label(get, settings), []

    def local(entity_id: str | None, kind: Kind = Kind.PLAIN) -> float | None:
        state = _state(get, entity_id)
        return measurement(state.state, state.attributes.get("unit_of_measurement"), kind) if available(state) else None

    def read(entity_id: str | None, attribute: str, unit: str, kind: Kind) -> Source:
        value, from_bulletin = local(entity_id, kind), measurement(bulletin.get(attribute), bulletin.get(unit), kind)
        if value is not None or (from_bulletin is None and entity_id):
            return Source(value, STATION, entity_id or "")
        return Source(from_bulletin, provider, settings.weather_entity, bool(entity_id))

    temperature = read(settings.temperature_entity, "temperature", "temperature_unit", Kind.TEMPERATURE)
    if temperature.value is not None or settings.temperature_entity:
        result.append(Metric("temperature", t("Température"), "mdi:thermometer", "°C",
                             t("Mesurée chez vous") if temperature.source == STATION else t("Température du bulletin"), station_label() if temperature.source == STATION else temperature.source, temperature.entity,
                             temperature.value, detail=t("Ressenti {value} °C", value=french(w.feel.value)) if meaningful_comfort(get, settings, w) else None,
                             fallback=temperature.fallback))

    wind = read(settings.wind_speed_entity, "wind_speed", "wind_speed_unit", Kind.WIND)
    gust = read(settings.wind_gust_entity, "wind_gust_speed", "wind_speed_unit", Kind.WIND)
    if wind.value is not None or gust.value is not None or settings.wind_speed_entity or settings.wind_gust_entity:
        detail = "" if gust.value is None else t("Rafales {value} km/h", value=french(gust.value, 0)) + (f" · {station_label() if gust.source == STATION else gust.source}" if gust.source != wind.source else "")
        local_bearing = local(settings.wind_bearing_entity)
        result.append(Metric("wind", t("Vent"), "mdi:weather-windy", "km/h", (w.wind.beaufort_text or t("Mesuré chez vous")) if wind.source == STATION else t("Vent du bulletin"),
                             station_label() if wind.source == STATION else wind.source, wind.entity, wind.value, detail=detail, fallback=wind.fallback,
                             bearing=local_bearing if local_bearing is not None else finite(bulletin.get("wind_bearing")),
                             bearing_source=station_label() if local_bearing is not None else provider,
                             bearing_entity=settings.wind_bearing_entity if local_bearing is not None else settings.weather_entity, gust=gust))

    daily, rate = local(settings.daily_rain_entity, Kind.RAIN), local(settings.rain_rate_entity, Kind.RAIN)
    if daily is not None or rate is not None:
        result.append(Metric("rain", t("Pluie"), "mdi:weather-rainy", "mm" if daily is not None else "mm/h", t("Depuis minuit") if daily is not None else t("Intensité mesurée"),
                             station_label(), (settings.daily_rain_entity if daily is not None else settings.rain_rate_entity) or "", daily if daily is not None else rate,
                             detail=t("Intensité indisponible") if rate is None else t("Pas de pluie mesurée en ce moment") if rate == 0 else t("{value} mm/h en ce moment", value=french(rate))))
    else:
        raw_label = RAIN_LABELS.get(weather.state.replace("_", "-")) if available(weather) else None
        label = t(raw_label) if raw_label else None
        moment = now or datetime.now().astimezone()
        upcoming = sorted((h for h in hours if h.time is not None and moment <= h.time <= moment + timedelta(minutes=90)), key=lambda h: h.time)
        expected = upcoming[0].precipitation if upcoming else None
        has_bulletin, forecast_only = bool(label) or expected is not None, expected is not None and not label
        if has_bulletin or settings.daily_rain_entity or settings.rain_rate_entity:
            result.append(Metric("rain", t("Pluie"), "mdi:weather-rainy", "mm" if forecast_only else "", t("État annoncé dans le bulletin") if label else t("Prochain créneau prévu"),
                                 (t("{provider} · Prévision", provider=provider) if forecast_only else provider) if has_bulletin else station_label(),
                                 settings.weather_entity if has_bulletin else settings.daily_rain_entity or settings.rain_rate_entity or settings.weather_entity,
                                 None if label else expected, text=label,
                                 detail=t("{value} mm prévus sur le prochain créneau", value=french(expected)) if expected is not None else None,
                                 fallback=has_bulletin and bool(settings.daily_rain_entity or settings.rain_rate_entity)))

    pressure = read(settings.pressure_entity, "pressure", "pressure_unit", Kind.PRESSURE)
    if pressure.value is not None or settings.pressure_entity:
        measured, change, minutes = pressure.source == STATION, w.pressure_trend.change, w.pressure_trend.minutes
        span = f"{french(minutes, 0)} min" if minutes and minutes < 150 else "3 h"
        detail = None if not measured else t("Tendance en cours de mesure") if change is None else t("{change} hPa sur {span}", change=f"{'+' if change > 0 else ''}{french(change)}", span=span)
        result.append(Metric("pressure", t("Pression"), "mdi:gauge", "hPa", (w.pressure_trend.text or t("Mesurée chez vous")) if measured else t("Pression du bulletin"),
                             station_label() if pressure.source == STATION else pressure.source, pressure.entity, pressure.value, detail=detail, fallback=pressure.fallback))
    return result
