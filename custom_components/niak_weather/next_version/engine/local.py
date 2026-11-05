"""The weather at home: station readings, the bulletin as a fallback, and what the engine deduces from them.

The result is a typed object. An unknown value is None: no placeholder number, no text key to mistype.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import datetime
from typing import Any, Callable, Mapping, Protocol, Sequence
from zoneinfo import ZoneInfo

from .feel import Alert, Effects, Level, Measures, verdict
from .forecast import Hour, parse_time
from .moisture import comfort_word, dew_point, frost_point, humidex, humidex_feel, humidity_feel
from .settings import Settings
from .trends import Change, Trend, trend
from .i18n import N_, t
from .units import Kind, finite, fr, measurement


class StateLike(Protocol):
    """What the engine needs from a Home Assistant state."""

    state: str
    attributes: Mapping[str, Any]


Getter = Callable[[str], "StateLike | None"]

# Each reading: the setting naming its sensor, and what it measures.
READINGS: dict[str, tuple[str, Kind]] = {
    "temperature": ("temperature_entity", Kind.TEMPERATURE), "humidity": ("humidity_entity", Kind.PLAIN),
    "wind_speed": ("wind_speed_entity", Kind.WIND), "wind_gust": ("wind_gust_entity", Kind.WIND),
    "wind_bearing": ("wind_bearing_entity", Kind.PLAIN), "rain_rate": ("rain_rate_entity", Kind.RAIN),
    "rain_today": ("daily_rain_entity", Kind.RAIN), "rain_24h": ("rain_24h_entity", Kind.RAIN),
    "rain_week": ("weekly_rain_entity", Kind.RAIN), "rain_month": ("monthly_rain_entity", Kind.RAIN),
    "rain_year": ("yearly_rain_entity", Kind.RAIN), "rain_event": ("event_rain_entity", Kind.RAIN),
    "pressure": ("pressure_entity", Kind.PRESSURE), "solar": ("solar_radiation_entity", Kind.SOLAR),
    "dew_point": ("dew_point_entity", Kind.TEMPERATURE), "uv": ("uv_index_entity", Kind.PLAIN),
    "lux": ("illuminance_entity", Kind.PLAIN), "max_gust": ("max_daily_gust_entity", Kind.WIND),
    "temperature_trend": ("temperature_trend_entity", Kind.TEMPERATURE_DELTA), "weather": ("weather_entity", Kind.PLAIN),
    "sun_elevation": ("sun_elevation_entity", Kind.PLAIN),
}

CONDITION_TITLES = {"sunny": "Grand soleil", "clear-night": "Nuit claire", "partlycloudy": "Éclaircies", "cloudy": "Ciel couvert",
                    "fog": "Brouillard", "rainy": "Pluvieux", "pouring": "Fortes pluies", "lightning": "Orageux",
                    "lightning-rainy": "Orages et pluie", "hail": "Grêle", "snowy": "Neige", "snowy-rainy": "Pluie et neige",
                    "windy": "Venteux", "windy-variant": "Venteux", "exceptional": "Conditions exceptionnelles"}
RAIN_TITLES = ("", "Bruine", "Il pleut", "Grosse averse", "Déluge")
SECTORS = ("Nord", "Nord-Nord-Est", "Nord-Est", "Est-Nord-Est", "Est", "Est-Sud-Est", "Sud-Est", "Sud-Sud-Est",
           "Sud", "Sud-Sud-Ouest", "Sud-Ouest", "Ouest-Sud-Ouest", "Ouest", "Ouest-Nord-Ouest", "Nord-Ouest", "Nord-Nord-Ouest")
ROSES = ("N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO")
BEAUFORT = (N_("calme"), N_("très légère brise"), N_("légère brise"), N_("petite brise"), N_("jolie brise"), N_("bonne brise"), N_("vent frais"),
            N_("grand frais"), N_("coup de vent"), N_("fort coup de vent"), N_("tempête"), N_("violente tempête"), N_("ouragan"))
BEAUFORT_LIMITS = (1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118)


@dataclass(frozen=True)
class Feel:
    value: float | None
    base: str
    """« humidex » when the humidex raises the thermometer, else « thermometer »."""
    effects: Effects
    gap: float | None
    """Feel minus thermometer."""
    word: str
    humidity_word: str
    humidex_word: str
    phrase: str


@dataclass(frozen=True)
class Wind:
    speed: float | None
    gust: float | None
    max_today: float | None
    effective: float | None
    bearing: float | None
    """Where it comes from, in degrees, only when the wind blows (5 km/h or more)."""
    beaufort: int | None
    beaufort_text: str
    rose: str
    sector: str
    from_name: str
    """« du Sud-Sud-Ouest », « de l’Est »."""
    trend: Trend


@dataclass(frozen=True)
class Rain:
    rate: float | None
    level: int
    today: float | None
    last_24h: float | None
    week: float | None
    month: float | None
    year: float | None
    event: float | None
    narrative: str
    next_hours: int | None
    """Hours before the first forecast hour with rain, None when none is forecast."""
    next_amount: float | None


@dataclass(frozen=True)
class LocalWeather:
    temperature: float | None
    humidity: float | None
    humidity_source: str | None
    """« station », « bulletin » or None when the humidity is unknown."""
    dew_point: float | None
    frost_point: float | None
    humidex: float | None
    feel: Feel
    wind: Wind
    rain: Rain
    pressure: float | None
    pressure_trend: Trend
    temperature_trend: float | None
    solar: float | None
    sunshine: bool
    uv: float | None
    uv_text: str
    lux: float | None
    sun_elevation: float
    sunrise: float
    sunset: float
    """Today's sunrise and sunset as decimal local hours (6.5 = 6 h 30)."""
    condition: str
    observed: bool
    observed_fog: bool
    forecast_condition: str
    title: str
    subtitle: str
    alert: Alert | None
    level: Level
    forecast_available: bool
    sources: dict[str, str] = field(default_factory=dict)
    """Which sensor each value comes from, to open its details."""

    @property
    def available(self) -> bool:
        return self.temperature is not None


_UNSET: Any = object()


def build_local(get: Getter, settings: Settings, hours: Sequence[Hour], history: Mapping[str, Sequence[Change]],
                now: datetime, zone: ZoneInfo, *, humidex_given: float | None = _UNSET) -> LocalWeather:
    """Everything known about the weather at home now. `hours` are the next forecast hours, first one first."""
    values: dict[str, float | None] = {}
    sources: dict[str, str] = {}
    for key, (name, kind) in READINGS.items():
        entity_id = getattr(settings, name)
        if not entity_id:
            continue
        sources[key] = entity_id
        state = get(entity_id)
        values[key] = measurement(state.state, state.attributes.get("unit_of_measurement"), kind) if state else None
    value = values.get
    weather = get(settings.weather_entity)
    bulletin: Mapping[str, Any] = weather.attributes if weather else {}

    # A configured but unavailable station sensor is never silently replaced by the bulletin.
    temperature = value("temperature") if settings.temperature_entity else measurement(
        bulletin.get("temperature"), bulletin.get("temperature_unit"), Kind.TEMPERATURE)
    if not settings.temperature_entity:
        sources["temperature"] = settings.weather_entity
    sun = get(settings.sun_entity or "sun.sun")
    sun_attributes: Mapping[str, Any] = sun.attributes if sun else {}
    elevation = value("sun_elevation")
    if elevation is None:
        elevation = finite(sun_attributes.get("elevation"))
    elevation = 0 if elevation is None else elevation

    def solar_time(key: str, fallback: float) -> float:
        moment = parse_time(sun_attributes[key]) if sun_attributes.get(key) else None
        if moment is None:
            return fallback
        local = moment.astimezone(zone)
        return round(local.hour + local.minute / 60, 2)

    # Humidity, dew point, frost point and humidex are computed here: no Thermal Comfort needed. Station first; without
    # a station humidity, the bulletin's own temperature and humidity give the dew point, which varies least from place to place.
    bulletin_t = measurement(bulletin.get("temperature"), bulletin.get("temperature_unit"), Kind.TEMPERATURE)
    bulletin_h = finite(bulletin.get("humidity"))
    station_h = value("humidity")
    use_bulletin = humidex_given is _UNSET and not settings.humidity_entity and bulletin_h is not None
    humidity = station_h
    if use_bulletin:
        humidity = bulletin_h
        sources["humidity"] = settings.weather_entity
    measured_dew = value("dew_point")
    if temperature is not None and station_h is not None:
        dew = dew_point(temperature, station_h)
    elif measured_dew is not None:
        dew = measured_dew
    else:
        dew = dew_point(bulletin_t, bulletin_h) if use_bulletin and bulletin_t is not None and bulletin_h is not None else None
    dew_value = measured_dew
    if measured_dew is None and dew is not None:
        dew_value = round(dew, 1)
        sources["dew_point"] = sources.get("humidity", settings.weather_entity)
    humidity_source = ("station" if station_h is not None or (settings.dew_point_entity and dew_value is not None)
                       else "bulletin" if use_bulletin else None)
    # Humidex measures heat discomfort only: in cold or dry air it falls below the thermometer and would make the feel
    # colder for no reason. The feel then starts from the thermometer, the humidity being known but not a factor.
    if humidex_given is not _UNSET:
        humidex_value = finite(humidex_given)
    else:
        computed = round(humidex(temperature, dew), 1) if temperature is not None and dew is not None else None
        humidex_value = computed if computed is not None and computed > temperature else None
    if humidex_value is not None:
        sources["humidex"] = sources.get("humidity") or sources.get("dew_point") or settings.weather_entity
    frost = round(frost_point(temperature, dew), 1) if temperature is not None and dew is not None else None

    v = verdict(Measures(temperature=temperature, humidity=humidity, humidex=humidex_value, wind_speed=value("wind_speed"),
                         wind_gust=value("wind_gust"), solar_radiation=value("solar"), sun_elevation=elevation, rain_rate=value("rain_rate"),
                         # Observed fog needs the station's own moisture, never the bulletin's.
                         dew_point=dew_value if humidity_source == "station" else None, uv_index=value("uv"),
                         cloud_coverage=finite(bulletin.get("cloud_coverage"))),
                weather.state if weather else "", hours[:18])

    wind = value("wind_speed")
    beaufort = None if wind is None or wind < 0 else sum(wind >= limit for limit in BEAUFORT_LIMITS)
    raw_bearing = value("wind_bearing")
    bearing = round(raw_bearing, 0) if wind is not None and wind >= 5 and raw_bearing is not None and raw_bearing >= 0 else None
    sector_index = None if bearing is None else int(round(bearing / 22.5, 0)) % 16
    sector = SECTORS[sector_index] if sector_index is not None else ""
    uv, pressure, solar = value("uv"), value("pressure"), value("solar")
    now_seconds = now.timestamp()

    def unit_of(entity_id: str | None) -> str:
        state = get(entity_id) if entity_id else None
        return str(state.attributes.get("unit_of_measurement") or "") if state else ""

    feel_value = v.feels
    feel = Feel(value=feel_value, base="humidex" if humidex_value is not None else "thermometer", effects=v.effects,
                gap=None if temperature is None or feel_value is None else round(feel_value - temperature, 1),
                word=comfort_word(feel_value), humidity_word=humidity_feel(dew, humidity, feel_value),
                humidex_word=humidex_feel(humidex_value) if humidex_value is not None else "", phrase="")
    wind_info = Wind(speed=wind, gust=value("wind_gust"), max_today=value("max_gust"), effective=v.effective_wind, bearing=bearing,
                     beaufort=beaufort, beaufort_text=t(BEAUFORT[beaufort]) if beaufort is not None else "",
                     rose=ROSES[sector_index] if sector_index is not None else "", sector=sector,
                     from_name=("de l’" if sector[:1] in ("E", "O") else "du ") + sector if sector else "",
                     trend=trend(history.get(settings.wind_speed_entity or "", ()), wind, now_seconds, Kind.WIND, unit_of(settings.wind_speed_entity)))
    rain = Rain(rate=value("rain_rate"), level=v.rain_level, today=value("rain_today"), last_24h=value("rain_24h"), week=value("rain_week"),
                month=value("rain_month"), year=value("rain_year"), event=value("rain_event"),
                narrative=rain_narrative(value("rain_today"), value("rain_week"), value("rain_month")),
                next_hours=v.next_rain_hours, next_amount=v.next_rain_amount)
    uv_text = "" if uv is None or uv < 0 else t("faible") if uv < 3 else t("modéré") if uv < 6 else t("fort") if uv < 8 else t("très fort") if uv < 11 else t("extrême")
    # The verdict only sees fog with the station's own moisture, and never under rain measured or announced.
    observed_fog = v.observed and v.condition == "fog"
    local = LocalWeather(
        temperature=temperature, humidity=humidity, humidity_source=humidity_source, dew_point=dew_value, frost_point=frost, humidex=humidex_value,
        feel=feel, wind=wind_info, rain=rain, pressure=pressure,
        pressure_trend=trend(history.get(settings.pressure_entity or "", ()), pressure, now_seconds, Kind.PRESSURE, unit_of(settings.pressure_entity)),
        temperature_trend=value("temperature_trend"), solar=solar, sunshine=solar is not None and solar >= 350, uv=uv, uv_text=uv_text, lux=value("lux"),
        sun_elevation=elevation, sunrise=solar_time("next_rising", 6.5), sunset=solar_time("next_setting", 21),
        condition=v.condition, observed=v.observed, observed_fog=observed_fog, forecast_condition=weather.state if weather else "",
        title=RAIN_TITLES[v.rain_level] if v.rain_level and not v.condition.startswith("snow") else CONDITION_TITLES.get(v.condition, "Dehors"),
        subtitle="", alert=v.alert, level=v.level, forecast_available=bool(hours), sources=sources)
    phrase = feel_phrase(local)
    if not settings.temperature_entity:
        phrase = phrase.replace("qu’au thermomètre", "que la température du bulletin").replace("au thermomètre", "à la température du bulletin")
    return replace(local, subtitle=subtitle(local, hours), feel=replace(feel, phrase=phrase))


def rain_narrative(day: float | None, week: float | None, month: float | None) -> str:
    """One line putting today's rain in perspective with the week and the month."""
    if day is None or month is None or day < 0 or month < 0:
        return ""
    if month < 0.15:
        return "pas une goutte ce mois-ci"
    if abs(month - day) < 0.15:
        return "tout ce qui est tombé ce mois-ci est tombé aujourd’hui"
    if week is not None and week > 0 and abs(month - week) < 0.15:
        return "toute la pluie du mois est tombée cette semaine"
    if day >= 0.15 and month > 0 and day / month >= 0.5:
        return "aujourd’hui pèse plus de la moitié du mois"
    if week is not None and week < 0.15:
        return "rien cette semaine"
    return ""


def subtitle(w: LocalWeather, hours: Sequence[Hour]) -> str:
    """The short line under the title: the alert, the rain, the fog or the wind."""
    feels = fr(w.feel.value)
    texts = {Alert.THUNDERSTORM: "orage annoncé dans les heures qui viennent",
             Alert.GUSTS: f"rafales à {fr(w.wind.gust, 0)} km/h — attention à ce qui traîne dehors",
             Alert.HEATWAVE: f"{feels} °C ressentis — on reste à l’ombre", Alert.FROST: f"{feels} °C ressentis — gel probable cette nuit",
             Alert.HEAT: f"{feels} °C ressentis — la chaleur commence à peser", Alert.COLD: f"{feels} °C ressentis — il fait vraiment froid",
             Alert.UV: f"indice UV {fr(w.uv, 0)} — {w.uv_text}, crème obligatoire"}
    if w.alert in texts:
        return texts[w.alert]
    if w.rain.level > 0:
        rate = fr(w.rain.rate, 0 if (w.rain.rate or 0) >= 10 else 1)
        end = next((i for i, h in enumerate(hours[:12]) if (h.precipitation or 0) < 0.3), -1)
        total = round(sum(h.precipitation or 0 for h in hours[:6]), 1)
        if end == 0:
            phrase = "ça se termine dans l’heure"
        elif end > 0:
            phrase = (f"encore {fr(total)} mm — " if total >= 0.3 else "") + f"accalmie dans {end} h"
        else:
            phrase = (f"{fr(total)} mm attendues dans les 6 h" if total >= 0.3 else "prévision indisponible" if not hours
                      else "rien de plus dans la prévision")
        return f"{rate} mm/h · {fr(w.rain.today)} mm depuis minuit — {phrase}"
    if w.condition == "fog" and w.observed:
        return f"{fr(w.humidity, 0)} % d’humidité — visibilité réduite"
    if w.rain.next_hours is not None:
        when = "dans l’heure" if w.rain.next_hours == 0 else f"dans {w.rain.next_hours} h"
        return f"{fr(w.rain.next_amount or 0)} mm de pluie {when}"
    return w.wind.beaufort_text


def feel_phrase(w: LocalWeather) -> str:
    """Why the feel differs from the thermometer, in a few words."""
    if w.temperature is None:
        return ""
    if w.feel.base == "thermometer" and not w.humidity_source:
        return "Humidité inconnue : non prise en compte"
    gap = w.feel.gap or 0
    size = fr(abs(gap))
    if abs(gap) < 0.6:
        return "Ressenti égal au thermomètre"
    e = w.feel.effects
    if gap > 0:
        cause = "du vent chaud" if e.wind > 0.3 else "du soleil" if e.sun >= 1.5 else "de l’humidité"
        return f"{size} °C de plus qu’au thermomètre, à cause {cause}"
    wind, rain, night = abs(e.wind), abs(e.rain), abs(e.night)
    cause = "de la pluie" if rain >= wind and rain > 0.4 else "du ciel dégagé" if night > wind and night > 0.4 else "du vent"
    return f"{size} °C de moins qu’au thermomètre, à cause {cause}"
