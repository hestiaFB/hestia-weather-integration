"""What the card shows, computed once per update from the engine's results.
The card only reads this: it never sees sensor ids to read, attribute names or units to convert. It draws the charts itself
from the points given here, and hides what its own display settings leave out."""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, fields, is_dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Mapping, Sequence
from zoneinfo import ZoneInfo

from . import alerts, polleninfo, waqi
from .atmo import METRICS, POLLEN_METRICS, POLLUTANT_METRICS, Reading, read_metric
from .brief import Brief
from .bulletin import Bulletin, build_bulletin
from .conditions import condition_icon, condition_label
from .current import STATION, CurrentWeather, available, current_metrics, current_weather, meaningful_comfort, weather_source_label
from .forecast import Day, Hour, daily_wind, day_offset, local_day
from .i18n import N_, language, t
from .lightning import Lightning
from .local import LocalWeather
from .season import MONTHS, Season, current_season
from .series import (PERIODS, RAIN_PERIODS, ColumnStatus, Point, column_status, joined, pressure_chart_series, rain_bars, rain_days,
                     rain_state_key, rain_sum_key, wind_chart_series, weather_history_key, week_key)
from .settings import Settings
from .station import Derived, RainDay
from .trends import Change
from .units import Kind, french, finite, measurement

Getter = Callable[[str], Any]
ROSE = ("N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO")
WEEKDAYS = (N_("lundi"), N_("mardi"), N_("mercredi"), N_("jeudi"), N_("vendredi"), N_("samedi"), N_("dimanche"))
SHORT_WEEKDAYS = (N_("Lun"), N_("Mar"), N_("Mer"), N_("Jeu"), N_("Ven"), N_("Sam"), N_("Dim"))

@dataclass(frozen=True)
class Chip:
    """A small tinted pill: a value and what it is (« +1,2 °C soleil », « 78 % humidité »)."""

    theme: str
    icon: str
    label: str
    value: str | None = None
    entity: str | None = None


@dataclass(frozen=True)
class Stat:
    label: str
    value: str
    entity: str | None = None


@dataclass(frozen=True)
class ComfortView:
    feels: float
    temperature: float | None
    word: str
    humidity: str
    gap: float | None
    factors: tuple[Chip, ...]
    source: str
    entity: str | None
    example: str
    """Today's calculation in words: « 22,4 °C (humidex) + 1,2 °C (soleil) = 23,6 °C ressentis »."""


@dataclass(frozen=True)
class RainPeriod:
    """Rain bars over 24 hours (one an hour) or 30 days (one a day), and their total."""
    period: str
    days: tuple[RainDay, ...]
    total: float | None
    partial: bool


@dataclass(frozen=True)
class RainView:
    source: str
    status: str | None
    value: float | None
    """The main figure: a measured total, or the bulletin's amount when there is no gauge."""
    unit: str
    label: str
    text: str | None
    entity: str
    rate: float | None
    rate_entity: str | None
    days: tuple[RainDay, ...] | None
    days_note: str
    empty: str
    stats: tuple[Stat, ...]
    periods: tuple[RainPeriod, ...] = ()
    """The bars over 24 hours and 30 days, when the rain counter keeps statistics; `days` stay the seven days."""


@dataclass(frozen=True)
class WindPeriod:
    """The wind chart over one of the periods the card offers: 6h, 1d, 2d or 7d."""
    period: str
    mean: tuple[Point, ...]
    gust: tuple[Point, ...]
    top: float


@dataclass(frozen=True)
class WindView:
    source: str
    status: str | None
    value: float | None
    label: str
    entity: str
    description: str
    bearing: float | None
    compass: str
    bearing_entity: str | None
    mean: tuple[Point, ...]
    """Six hours of ten-minute points, [seconds, km/h or null], then the current value."""
    gust: tuple[Point, ...]
    top: float
    """Top of the chart's scale, shared by both curves."""
    mean_label: str
    empty: str
    stats: tuple[Stat, ...]
    periods: tuple[WindPeriod, ...] = ()


@dataclass(frozen=True)
class PressurePeriod:
    """The pressure chart over one of the periods the card offers: 6h, 1d, 2d or 7d."""
    period: str
    series: tuple[Point, ...]
    low: float
    top: float
    stats: tuple[Stat, ...]


@dataclass(frozen=True)
class PressureView:
    source: str
    value: float | None
    entity: str | None
    description: str
    trend: Chip | None
    series: tuple[Point, ...]
    """Six hours, as before the periods: an older card still draws them."""
    low: float
    top: float
    empty: str
    stats: tuple[Stat, ...]
    periods: tuple[PressurePeriod, ...] = ()


@dataclass(frozen=True)
class Slot:
    """One forecast hour."""

    hour: int
    day: int
    """0 today, 1 tomorrow."""
    temperature: float | None
    precipitation: float
    condition: str
    condition_label: str
    icon: str
    night: bool
    wind: float | None
    gust: float | None
    bearing: float | None
    time: float | None = None
    """Seconds since 1970: where the hour sits on the banner's timeline."""
    pressure: float | None = None
    """Forecast sea-level pressure in hPa, when the provider gives it."""


@dataclass(frozen=True)
class DayForecast:
    label: str
    today: bool
    condition: str
    condition_label: str
    icon: str
    low: float | None
    high: float | None
    rain: float
    wind: float | None
    bearing: float | None
    gust: float | None


@dataclass(frozen=True)
class AirItem:
    label: str
    reading: Reading
    concentration: Reading | None = None


@dataclass(frozen=True)
class AirPanel:
    kind: str
    """« air » or « pollen »."""
    tomorrow: bool
    zone: str
    primary: Reading | None
    worse: AirItem | None
    """A sub-index worse than the global index: it stays visible under it."""
    details: tuple[AirItem, ...]
    updated: str
    stale: bool
    scale: int = 6
    """The top of the index: 6 for Atmo France, 4 for Polleninformation and IRM KMI."""
    source: str | None = None
    """Who gives it, when it is not Atmo France: « Polleninformation », « IRM KMI », « WAQI », « Open-Meteo »."""


@dataclass(frozen=True)
class Air:
    today: tuple[AirPanel, ...]
    tomorrow: tuple[AirPanel, ...]


@dataclass(frozen=True)
class SeasonView:
    info: Season
    news: str | None
    tip: str


@dataclass(frozen=True)
class LightningView:
    """The storm Blitzortung sees: the card's radar of the last hour, the nearest strike, the level and the month's count."""
    source: str
    entity: str
    available: bool
    """False while the Blitzortung sensor does not answer: no strike then says nothing."""
    step: int
    """0 calm, 1 a storm within 30 km, 2 close or coming closer, 3 overhead."""
    headline: str
    nearest: float | None
    """Kilometres to the nearest strike of the last 20 minutes, else of the hour."""
    direction: str
    trend: str | None
    """« approche », « eloigne » or None."""
    movement: str
    hour_count: int
    recent_count: int
    """Strikes in the last 10 minutes."""
    last_minutes: int | None
    strikes: tuple[tuple[int, float, float | None], ...]
    """The last hour's strikes, oldest first: [minutes ago, km, degrees from the north or null after a restart]."""
    month: int | None = None


@dataclass(frozen=True)
class WeatherView:
    location: str
    date_label: str
    provider: str
    forecast_source: str
    weather_entity: str
    """Opened when the forecast is tapped."""
    station: bool
    """A local thermometer: the feel is compared with it rather than with the bulletin."""
    now: CurrentWeather
    season: SeasonView
    alerts: tuple[alerts.AlertPoint, ...]
    points: tuple[alerts.Point, ...]
    timeline: tuple[alerts.Point, ...]
    """The banner's timeline: every point of the coming hours, each at its time."""
    brief: Brief | None
    bulletin: Bulletin | None
    comfort: ComfortView | None
    rain: RainView | None
    wind: WindView | None
    pressure: PressureView | None
    extras: tuple[Chip, ...]
    hours: tuple[Slot, ...]
    days: tuple[DayForecast, ...]
    air: Air
    lightning: LightningView | None = None


def place_name(name: str) -> str:
    """The town in a weather entity's name: « Météo-France forecast for city Auriol - Provence-Alpes-Côte d'Azur (13) - FR Auriol » → « Auriol »."""
    city = re.search(r"for city\s+(.+?)\s+-\s", name, re.IGNORECASE)
    if city:
        return city.group(1)
    return name.split(" - ")[0] if len(name) > 30 and " - " in name else name


def rose(degrees: float) -> str:
    return t("N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO").split()[math.floor(degrees % 360 / 22.5 + 0.5) % 16]


def signed(value: float, digits: int = 1) -> str:
    """« +1,3 », « −0,8 »: always a sign, a true minus."""
    return f"{'+' if value > 0 else '−'}{french(abs(value), digits, digits)}"


def build_view(get: Getter, settings: Settings, w: LocalWeather, brief: Brief | None, hours: Sequence[Hour], days: Sequence[Day],
               history: Mapping[str, Sequence[Change]], rain_history: Mapping[str, Sequence[Change]], derived: Derived | None,
               now: datetime, zone: ZoneInfo, latitude: float | None = None, elevation: float = 0,
               original_condition: str | None = None, lightning: Lightning | None = None) -> WeatherView:
    """`hours` and `days` are the whole parsed forecasts; `history` covers six hours (and today for gusts), `rain_history` eight days."""
    weather = get(settings.weather_entity)
    attributes: Mapping[str, Any] = weather.attributes if weather else {}
    # Without a trend sensor, the station's own history gives it.
    trend = (w.temperature_trend if settings.temperature_trend_entity else derived.temperature_trend if derived else None) if w.available else None
    shown = alerts.alert_points(brief)
    today = now.astimezone(zone)
    date_label = t("{weekday} {day} {month}", weekday=t(WEEKDAYS[today.weekday()]), day=today.day, month=t(MONTHS[today.month - 1]))
    season = current_season(get, settings.season_entity, now, zone, latitude, elevation)
    # The forecast hour under way (or the next one): its rain gives the nuance when Météo-France's description is not there.
    this_hour = next((h for h in hours if h.time is None or h.time.timestamp() > now.timestamp() - 3600), None)
    rain, wind, pressure = _measures(get, settings, w, hours, history, rain_history, derived, now, zone)
    return WeatherView(
        location=settings.location or place_name(str(attributes.get("friendly_name") or "")),
        date_label=date_label[0].upper() + date_label[1:], provider=weather_source_label(get, settings),
        forecast_source=settings.forecast_source or ("Météo-France" if re.search("france", str(attributes.get("attribution")), re.IGNORECASE) else t("Prévisions météo")),
        weather_entity=settings.weather_entity, station=bool(settings.temperature_entity),
        now=current_weather(get, settings, w, trend, original_condition, this_hour.precipitation if this_hour else None, lightning), season=SeasonView(season, season.news, season.tip),
        alerts=tuple(shown), points=tuple(p for p in alerts.ticker_points(brief) if p.text not in {a.source for a in shown}),
        timeline=tuple(alerts.timeline_points(brief)), brief=brief,
        bulletin=build_bulletin(hours, now, zone), comfort=_comfort(get, settings, w), rain=rain, wind=wind, pressure=pressure,
        extras=_extras(get, settings, w, now, zone), hours=forecast_slots(hours, now, zone, w.sunrise, w.sunset), days=forecast_days(days, hours, now, zone),
        air=Air(_air(get, settings, now, zone, False), _air(get, settings, now, zone, True)),
        lightning=_lightning(settings, lightning))


def _lightning(settings: Settings, seen: Lightning | None) -> LightningView | None:
    """The radar's view, when Blitzortung is chosen."""
    if seen is None or not settings.lightning_entity:
        return None
    now = seen.now or 0.0
    nearest = seen.nearest if seen.nearest is not None else min((s.distance for s in seen.hour), default=None)
    headline = (t("Blitzortung ne répond pas : les éclairs ne sont pas suivis pour le moment.") if not seen.available
                else (t("L’orage est sur vous."), t("L’orage est proche."), t("Un orage dans le secteur."))[3 - seen.step] if seen.step
                else t("Orage au loin.") if seen.nearest is not None
                else t("Plus d’éclair depuis {minutes} min.", minutes=max(1, round((now - max(s.at for s in seen.hour)) / 60))) if seen.hour
                else t("Aucun éclair dans l’heure."))
    last = max((s.at for s in seen.hour), default=None)
    return LightningView(
        source="Blitzortung", entity=settings.lightning_entity, available=seen.available, step=seen.step, headline=headline,
        nearest=None if nearest is None else round(nearest, 1), direction=t(seen.direction) if seen.direction else "", trend=seen.trend,
        movement=seen.movement, hour_count=len(seen.hour), recent_count=seen.recent_count,
        last_minutes=None if last is None else max(0, round((now - last) / 60)),
        strikes=tuple((max(0, round((now - s.at) / 60)), round(s.distance, 1), None if s.azimuth is None else round(s.azimuth)) for s in seen.hour),
        month=seen.month)


def forecast_slots(hours: Sequence[Hour], now: datetime, zone: ZoneInfo, sunrise: float = 6.5, sunset: float = 21) -> tuple[Slot, ...]:
    """The next 18 forecast hours, in local time, night flagged from today's sunrise and sunset (decimal hours)."""
    upcoming = sorted((h for h in hours if h.time is not None and h.time.timestamp() >= now.timestamp() - 1800), key=lambda h: h.time)[:18]
    slots = []
    for h in upcoming:
        hour = h.time.astimezone(zone).hour
        night = hour < sunrise or hour >= sunset
        slots.append(Slot(hour, day_offset(h.time, now, zone), h.temperature, max(0.0, h.precipitation or 0.0), h.condition, condition_label(h.condition),
                          condition_icon(h.condition, night), night, h.wind_speed, h.wind_gust, h.wind_bearing, h.time.timestamp(),
                          None if h.pressure is None else round(h.pressure, 1)))
    return tuple(slots)


def forecast_days(days: Sequence[Day], hours: Sequence[Hour], now: datetime, zone: ZoneInfo) -> tuple[DayForecast, ...]:
    """Up to seven days, today first; the wind comes from the hourly forecast, daily forecasts carry none."""
    winds, result = daily_wind(hours, now, zone), []
    for d in days[:7]:
        offset = day_offset(d.time, now, zone)
        w = winds.get(offset)
        result.append(DayForecast(t("Auj.") if offset == 0 else t(SHORT_WEEKDAYS[local_day(d.time, zone).weekday()]), offset == 0, d.condition,
                                  condition_label(d.condition), condition_icon(d.condition), None if d.low is None else round(d.low, 0),
                                  None if d.high is None else round(d.high, 0), round(d.precipitation or 0, 1),
                                  w.speed if w else None, w.bearing if w else None, w.gust if w else None))
    return tuple(result)


def _comfort(get: Getter, settings: Settings, w: LocalWeather) -> ComfortView | None:
    if not meaningful_comfort(get, settings, w) or w.feel.value is None:
        return None
    feels, temperature, sources, effects = w.feel.value, w.temperature, w.sources, w.feel.effects
    provider = weather_source_label(get, settings)
    source = provider if not settings.temperature_entity else t("{station} · humidité {provider}", station=t(STATION), provider=provider) if w.humidity_source == "bulletin" else t(STATION)
    humidex = w.humidex if w.feel.base == "humidex" else None
    terms = ((humidex - temperature if humidex is not None and temperature is not None else None, "rain", "mdi:water-percent", t("humidité"), sources.get("humidex")),
             (effects.wind, "wind", "mdi:weather-windy", t("vent"), sources.get("wind_speed")),
             (effects.sun, "level1", "mdi:white-balance-sunny", t("soleil"), sources.get("solar")),
             (effects.rain, "rain", "mdi:weather-pouring", t("pluie"), sources.get("rain_rate")),
             (effects.night, "cold", "mdi:weather-night", t("ciel clair"), sources.get("weather")))
    significant = [term for term in terms if term[0] is not None and abs(term[0]) >= 0.1]
    base = humidex if humidex is not None else temperature
    example = "" if base is None else (
        t("{value} °C ({source})", value=french(base, 1, 1), source=t("humidex") if humidex is not None else t("thermomètre"))
        + "".join(t(" {sign} {value} °C ({label})", sign="+" if v > 0 else "−", value=french(abs(v), 1, 1), label=label) for v, _, _, label, _ in significant if label != t("humidité"))
        + t(" = {value} °C ressentis", value=french(feels, 1, 1)))
    return ComfortView(feels, temperature, w.feel.word, w.feel.humidity_word, None if temperature is None else feels - temperature,
                       tuple(Chip(theme, icon, label, f"{signed(v)} °C", entity) for v, theme, icon, label, entity in significant),
                       source, sources.get("temperature"), example)


def _rain_periods(rain_history: Mapping[str, Sequence[Change]], entities: Sequence[str | None], live: Callable[[str], float | None],
                  now: datetime, zone: ZoneInfo) -> tuple[RainPeriod, ...]:
    """The 24-hour and 30-day bars from the counter's hourly running sum, carried on to now by the counter's own reading."""
    entity = next((e for e in entities if e and rain_history.get(rain_sum_key(e))), None)
    if entity is None:
        return ()
    sums = rain_history[rain_sum_key(entity)]
    last_state = next(iter(rain_history.get(rain_state_key(entity), ())), None)
    reading, base = live(entity), finite(sums[-1].state)
    start = finite(last_state.state) if last_state else None
    carried = None
    if reading is not None and base is not None and start is not None:
        # The counter went on since the last hour of statistics; below its value there, it was reset (a daily counter at midnight).
        carried = Change(now.timestamp(), str(base + (reading - start if reading >= start else reading)))
    out = []
    for period in RAIN_PERIODS:
        bars = rain_bars(sums, now, zone, period, carried)
        known = [d.value for d in bars if d.value is not None]
        out.append(RainPeriod(period, bars, round(sum(known), 1) if known else None, any(d.partial or d.value is None for d in bars[:-1])))
    return tuple(out)


AGO = {"6h": N_("Il y a 6 h"), "1d": N_("Il y a 24 h"), "2d": N_("Il y a 2 j"), "7d": N_("Il y a 7 j")}


def _pressure_period(period: str, rows: Sequence[Change], unit: str | None, now: datetime, value: float | None) -> PressurePeriod:
    """One period of the pressure chart: its curve, its scale, and where it started, its lowest and highest values."""
    series = pressure_chart_series(rows, unit, now, value, period)
    values = [p.value for p in series if p.value is not None]
    first = next((p for p in series if p.value is not None), None)
    stats = []
    if len(values) > 1:
        # « Il y a… » only when the curve really starts near the beginning of the period.
        if first is not None and first.time <= now.timestamp() - PERIODS[period][0] * 5 / 6:
            stats.append(Stat(t(AGO[period]), f"{french(first.value, 0)} hPa"))
        stats += [Stat(t("Min."), f"{french(min(values), 0)} hPa"), Stat(t("Max."), f"{french(max(values), 0)} hPa")]
    return PressurePeriod(period, series, math.floor(min(values)) - 1 if values else 0, math.ceil(max(values)) + 1 if values else 2, tuple(stats))


def _measures(get: Getter, settings: Settings, w: LocalWeather, hours: Sequence[Hour], history: Mapping[str, Sequence[Change]],
              rain_history: Mapping[str, Sequence[Change]], derived: Derived | None, now: datetime,
              zone: ZoneInfo) -> tuple[RainView | None, WindView | None, PressureView | None]:
    metrics = {m.key: m for m in current_metrics(get, settings, w, hours, now)}
    status: ColumnStatus = column_status(w if w.available else None)

    def state(entity_id: str | None) -> Any:
        return get(entity_id) if entity_id else None

    def unit_of(entity_id: str | None) -> str | None:
        s = state(entity_id)
        return s.attributes.get("unit_of_measurement") if s else None

    def read(entity_id: str | None, kind: Kind) -> float | None:
        s = state(entity_id)
        value = measurement(s.state, s.attributes.get("unit_of_measurement"), kind) if available(s) else None
        return value if value is not None and value >= 0 else None

    def source_of(metric: Any) -> str:
        if metric is None:
            return t(STATION)
        source = t(metric.source)
        return t("{source} · repli", source=source) if metric.fallback else source

    def history_of(entity_id: str | None, attribute: str, unit: str) -> tuple[Sequence[Change], str | None]:
        if entity_id == settings.weather_entity:
            return history.get(weather_history_key(entity_id, attribute), ()), unit
        return history.get(entity_id or "", ()), unit_of(entity_id)

    def week_of(entity_id: str | None, attribute: str, recent: Sequence[Change]) -> list[Change]:
        """The week's hours, then the six detailed hours."""
        key = weather_history_key(entity_id, attribute) if entity_id == settings.weather_entity else entity_id or ""
        return joined(history.get(week_key(key), ()), recent)

    rain = None
    rain_metric = metrics.get("rain")
    if rain_metric or any((settings.rain_total_entity, settings.rain_24h_entity, settings.daily_rain_entity, settings.weekly_rain_entity,
                           settings.monthly_rain_entity, settings.yearly_rain_entity)):
        recent, today = read(settings.rain_24h_entity, Kind.RAIN), read(settings.daily_rain_entity, Kind.RAIN)
        computed = derived.recent if derived and not settings.rain_24h_entity and not settings.daily_rain_entity else None
        value = recent if recent is not None else today if today is not None else computed.value if computed else None
        measured = value is not None
        counter = not settings.daily_rain_entity and derived is not None and bool(settings.rain_total_entity)
        if counter:
            days = derived.days
        else:
            rows = rain_history.get(settings.daily_rain_entity or "", ())
            daily = state(settings.daily_rain_entity)
            live = Change(now.timestamp(), daily.state if available(daily) else "unavailable")
            days = rain_days([*rows, live] if rows else [], unit_of(settings.daily_rain_entity), now, zone)
        stats = []
        for key, field, label in (("week", "weekly_rain_entity", N_("Semaine")), ("month", "monthly_rain_entity", N_("Mois")), ("year", "yearly_rain_entity", N_("Année"))):
            entity_id = getattr(settings, field)
            total = getattr(derived, key) if derived and not entity_id and settings.rain_total_entity else None
            if entity_id:
                v = read(entity_id, Kind.RAIN)
                stats.append(Stat(t(label), "—" if v is None else f"{french(v)} mm", entity_id))
            elif total is not None and total.value is not None:
                # A partial total is « at least » that much: the sign says it, the label stays short.
                stats.append(Stat(t(label), f"{'≥ ' if total.partial else ''}{french(total.value)} mm", settings.rain_total_entity))
        if recent is not None or (computed is not None and computed.value is not None):
            label = t("Ces dernières 24 h") + (t(" · cumul partiel") if computed is not None and computed.partial else "")
        elif today is not None:
            label = t("Depuis minuit")
        elif not measured and rain_metric:
            label = rain_metric.description
        else:
            label = t("Ces dernières 24 h") if settings.rain_24h_entity else t("Depuis minuit")
        if measured:
            entity = settings.rain_24h_entity if recent is not None else settings.daily_rain_entity or settings.rain_24h_entity or settings.rain_total_entity
        else:
            entity = rain_metric.entity if rain_metric else None
        rain = RainView(
            source=t("Station locale · historique") if computed is not None and computed.value is not None else t(STATION) if measured else source_of(rain_metric),
            status=status.rain, value=value if measured else None if rain_metric is None or rain_metric.text else rain_metric.value,
            unit="mm" if measured or not rain_metric else rain_metric.unit, label=label, text=None if measured or not rain_metric else rain_metric.text,
            entity=entity or settings.weather_entity, rate=read(settings.rain_rate_entity, Kind.RAIN) if settings.rain_rate_entity else None,
            rate_entity=settings.rain_rate_entity, days=days if any(d.value is not None for d in days) else None,
            days_note=(t("Calculé depuis le compteur total") if counter else t("Maxima enregistrés")) + (t(" · ≥ historique partiel") if any(d.partial for d in days) else ""),
            empty=t("Historique de pluie indisponible") if settings.daily_rain_entity or counter else t("Historique mesuré disponible avec un pluviomètre facultatif"),
            stats=tuple(stats), periods=_rain_periods(rain_history, (settings.rain_total_entity if settings.station_history else None,
                                                                     settings.daily_rain_entity), lambda e: read(e, Kind.RAIN), now, zone))

    wind = None
    wind_metric = metrics.get("wind")
    if wind_metric or settings.wind_gust_entity or settings.wind_speed_entity or settings.max_daily_gust_entity:
        known_gust = wind_metric.gust if wind_metric and wind_metric.gust and wind_metric.gust.value is not None else None
        gust_entity = known_gust.entity if known_gust else settings.wind_gust_entity
        gust = known_gust.value if known_gust else read(settings.wind_gust_entity, Kind.WIND)
        known_wind = wind_metric is not None and wind_metric.value is not None
        wind_entity = wind_metric.entity if known_wind else settings.wind_speed_entity or settings.wind_gust_entity or (wind_metric.entity if wind_metric else None)
        gust_only = not settings.wind_speed_entity and not known_wind and bool(settings.wind_gust_entity)
        value = wind_metric.value if known_wind else read(wind_entity, Kind.WIND)
        computed_max = derived.gust_max if derived and not settings.max_daily_gust_entity else None
        maximum = read(settings.max_daily_gust_entity, Kind.WIND)
        if maximum is None and computed_max is not None:
            maximum = computed_max.value
        wind_rows, wind_unit = history_of(wind_entity, "wind_speed", "km/h")
        gust_rows, gust_unit = history_of(gust_entity, "wind_gust_speed", "km/h")
        wind_week, gust_week = week_of(wind_entity, "wind_speed", wind_rows), week_of(gust_entity, "wind_gust_speed", gust_rows)

        def wind_period(period: str) -> WindPeriod:
            rows, gusts_rows = (wind_rows, gust_rows) if period == "6h" else (wind_week, gust_week)
            mean = wind_chart_series(rows, wind_unit, now, value, "peak" if gust_only else "mean", period)
            gusts = wind_chart_series(gusts_rows, gust_unit, now, gust, "peak", period) if gust_entity and not gust_only else ()
            return WindPeriod(period, mean, gusts, max(20, math.ceil(max((p.value or 0 for p in (*mean, *gusts)), default=0) / 10) * 10))

        wind_periods = tuple(wind_period(period) for period in PERIODS)
        mean, gusts, top = wind_periods[0].mean, wind_periods[0].gust, wind_periods[0].top
        bearing = wind_metric.bearing if wind_metric else None
        stats = []
        if gust is not None and not gust_only:
            stats.append(Stat(t("Rafales"), f"{french(gust, 0)} km/h", gust_entity))
        if bearing is not None:
            stats.append(Stat(t("Direction"), f"{rose(bearing)} · {french(bearing % 360, 0)}°", wind_metric.bearing_entity))
        if maximum is not None:
            stats.append(Stat(t("Max. du jour"), f"{'≥ ' if computed_max is not None and computed_max.partial else ''}{french(maximum, 0)} km/h",
                              settings.max_daily_gust_entity or settings.wind_gust_entity))
        wind = WindView(
            source=source_of(wind_metric) if wind_metric and wind_entity == wind_metric.entity else t(STATION), status=status.wind, value=value,
            label=t("Rafales") if gust_only else t("Vent moyen"), entity=wind_entity or settings.weather_entity, description=w.wind.beaufort_text,
            bearing=bearing, compass=t("Direction indisponible") if bearing is None else f"Vent {w.wind.from_name}" if w.wind.from_name and language() == "fr" else t("Vent du {direction}", direction=rose(bearing)),
            bearing_entity=wind_metric.bearing_entity if wind_metric else None, mean=mean, gust=gusts, top=top,
            mean_label=t("Rafales") if gust_only else t("Vent moyen"),
            empty=t("Historique du service météo absent ou trop court dans Home Assistant") if wind_entity == settings.weather_entity
                  else t("Historique du vent indisponible ou insuffisant"), stats=tuple(stats), periods=wind_periods)

    pressure = None
    pressure_metric = metrics.get("pressure")
    if pressure_metric or settings.pressure_entity:
        value = pressure_metric.value if pressure_metric and pressure_metric.value is not None else read(settings.pressure_entity, Kind.PRESSURE)
        entity = pressure_metric.entity if pressure_metric else settings.pressure_entity
        pressure_rows, pressure_unit = history_of(entity, "pressure", "hPa")
        week = week_of(entity, "pressure", pressure_rows)
        periods = tuple(_pressure_period(period, week if period != "6h" else pressure_rows, pressure_unit, now, value) for period in PERIODS)
        six = periods[0]
        change, minutes = w.pressure_trend.change, w.pressure_trend.minutes
        measured = pressure_metric is not None and pressure_metric.source in (STATION, t(STATION))
        pressure = PressureView(
            source=source_of(pressure_metric), value=value, entity=entity,
            description=(w.pressure_trend.text or t("Mesurée chez vous")) if measured or not pressure_metric else t("Pression du bulletin"),
            trend=None if change is None or not measured else pressure_trend(change, f"{french(minutes, 0)} min" if minutes and minutes < 150 else "3 h"),
            series=six.series, low=six.low, top=six.top,
            empty=t("Historique du service météo absent ou trop court dans Home Assistant") if entity == settings.weather_entity
                  else t("Historique de pression indisponible ou insuffisant"), stats=six.stats, periods=periods)
    return rain, wind, pressure


def pressure_trend(change: float, span: str) -> Chip:
    """« +1,3 hPa en 3 h », or « stable sur 3 h » when the pressure does not move."""
    if abs(change) < 0.05:
        return Chip("pressure", "mdi:trending-neutral", t("stable sur {span}", span=span))
    return Chip("pressure", "mdi:trending-up" if change > 0 else "mdi:trending-down", t("en {span}", span=span), f"{signed(change)} hPa")


def _extras(get: Getter, settings: Settings, w: LocalWeather, now: datetime, zone: ZoneInfo) -> tuple[Chip, ...]:
    if not w.available:
        return ()
    sources, out = w.sources, []
    if w.solar is not None:
        out.append(Chip("level1", "mdi:solar-power-variant-outline", t("soleil"), f"{french(w.solar, 0)} W/m²", sources.get("solar")))
    if w.uv is not None:
        out.append(Chip("level3" if w.uv >= 8 else "level2" if w.uv >= 6 else "level1", "mdi:sun-wireless-outline", f"UV {w.uv_text}".strip(),
                        french(w.uv, 0), sources.get("uv")))
    if w.lux is not None:
        out.append(Chip("level1", "mdi:brightness-5", "lux", f"{french(w.lux / 1000, 1)} k" if w.lux >= 1000 else french(w.lux, 0), sources.get("lux")))
    if w.humidity is not None:
        out.append(Chip("rain", "mdi:water-percent", t("humidité"), f"{french(w.humidity, 0)} %", sources.get("humidity")))
    if w.dew_point is not None:
        dew = w.dew_point
        out.append(Chip("cold", "mdi:thermometer-water", t("rosée · très lourd") if dew >= 20 else t("rosée · lourd") if dew >= 18 else t("rosée"),
                        f"{french(dew, 1, 1)} °C", sources.get("dew_point")))
    # Pollens given per species (Polleninformation, IRM KMI): only the species that are present.
    if not settings.atmo_pollens and settings.pollen_source != "none":
        for pollen in settings.pollens:
            s = get(pollen.entity_id)
            if not available(s):
                continue
            level = polleninfo.usable_level(get, settings, pollen, now=now, zone=zone) or 0
            if level > 0:
                out.append(Chip("level3" if level >= 4 else "level2" if level >= 3 else "level1", pollen.icon or "mdi:flower-pollen",
                                t(("", N_("faible"), N_("modéré"), N_("élevé"), N_("très élevé"))[level]), pollen.name or pollen.entity_id, pollen.entity_id))
    return tuple(out)


def _air(get: Getter, settings: Settings, now: datetime, zone: ZoneInfo, tomorrow: bool) -> tuple[AirPanel, ...]:
    def read(metric: str) -> Reading | None:
        return read_metric(get, settings, metric, tomorrow, now, zone)

    def name(metric: str) -> str:
        return METRICS[metric].label.replace(" — sous-indice", "")

    def usable(r: Reading | None) -> bool:
        return r is not None and not r.stale and r.value is not None and r.value <= 6

    def panel(kind: str, primary: Reading | None, details: list[AirItem]) -> tuple[AirPanel, ...]:
        readings = [r for r in (primary, *(x for d in details for x in (d.reading, d.concentration))) if r is not None]
        if not readings:
            return ()
        # Keep a concerning sub-index visible when the global index is lower or missing; never rename it as the global index.
        worst = sorted((d for d in details if d.reading.unit is None and usable(d.reading)), key=lambda d: -(d.reading.value or 0))
        top = worst[0] if worst else None
        worse = top if top is not None and (not usable(primary) or (top.reading.value or 0) > (primary.value or 0)) else None
        return (AirPanel(kind, tomorrow, " / ".join(dict.fromkeys(r.zone for r in readings if r.zone)), primary, worse, tuple(details),
                         " / ".join(dict.fromkeys(r.updated for r in readings if r.updated)), any(r.stale for r in readings),
                         source=waqi.source(settings, readings[0].entity_id) if kind == "air" else None),)

    pollution = [AirItem(name(m), r) for m in POLLUTANT_METRICS if (r := read(m)) is not None]
    species = []
    with_pollen = settings.pollen_source not in ("none", "legacy")
    if with_pollen:
        for metric in POLLEN_METRICS:
            r, c = read(metric), read(f"{metric}_concentration")
            if r is not None or c is not None:
                species.append(AirItem(name(metric), r if r is not None else c, c if r is not None else None))
    legacy = settings.pollen_source == "legacy" and bool(settings.pollens or settings.pollen_risk_entity)
    return (*panel("air", read("air"), pollution), *(panel("pollen", read("pollen"), species) if with_pollen else ()),
            *(_legacy_pollen(get, settings, now, zone, tomorrow) if legacy else ()))


def _legacy_pollen(get: Getter, settings: Settings, now: datetime, zone: ZoneInfo, tomorrow: bool) -> tuple[AirPanel, ...]:
    """The panel of the pollens given per species (Polleninformation, IRM KMI): the overall risk (or the worst species) on its scale of 0 to 4,
    then each species."""
    risk, species = polleninfo.readings(get, settings, tomorrow, now, zone)
    known = [(n, r) for n, r in species if r.value is not None]
    if risk is None and not known:
        return ()
    details = tuple(AirItem(n, r) for n, r in sorted(species, key=lambda x: -(x[1].value or 0)))
    primary = risk if risk is not None and risk.value is not None else max((r for _, r in known), key=lambda r: r.value or 0, default=None)
    top = details[0] if details and details[0].reading.value else None
    worse = top if top is not None and primary is not None and (top.reading.value or 0) > (primary.value or 0) else None
    readings = [r for r in (primary, *(d.reading for d in details)) if r is not None]
    return (AirPanel("pollen", tomorrow, " / ".join(dict.fromkeys(r.zone for r in readings if r.zone)), primary, worse, details,
                     " / ".join(dict.fromkeys(r.updated for r in readings if r.updated)), any(r.stale for r in readings), polleninfo.SCALE,
                     polleninfo.provider_name(settings)),)


def _camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(part.capitalize() for part in rest)


_FIELDS: dict[type, tuple[tuple[str, str], ...]] = {}
"""Each dataclass's fields and their camelCase names, looked up once: the view has some 25 000 values to write."""


def to_json(value: Any) -> Any:
    """The view as plain JSON for the card: camelCase keys, unknown values left out (they read as undefined), points as [seconds, value]."""
    kind = type(value)
    # The plain values first, by their exact type (an Enum deriving from str still goes below).
    if value is None or kind is str or kind is int or kind is bool:
        return value
    if kind is float:
        return value if math.isfinite(value) else None
    names = _FIELDS.get(kind)
    if names is None and is_dataclass(value) and not isinstance(value, type):
        names = _FIELDS[kind] = tuple((f.name, _camel(f.name)) for f in fields(value))
    if names is not None:
        return {camel: to_json(v) for name, camel in names if (v := getattr(value, name)) is not None}
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, Mapping):
        return {str(k): to_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_json(v) for v in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value
