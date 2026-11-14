// What the Hestia Weather integration sends the card: everything it shows, already computed (contract version 1).
// It mirrors the integration's engine/view.py. Times are seconds since 1970; an unknown value is absent, never null.

export const VIEW_VERSION = 1;

export type Theme = 'rain' | 'wind' | 'heat' | 'cold' | 'calm' | 'pressure' | 'level1' | 'level2' | 'level3';
/** A small tinted pill: a value and what it is (« +1,2 °C soleil », « 78 % humidité »). */
export interface Chip { theme: Theme | string; icon: string; label: string; value?: string; entity?: string }
export interface Stat { label: string; value: string; entity?: string }
/** A point of a six-hour chart: [seconds, value], the value null where the station did not report. */
export type Point = [number, number | null];

export interface CurrentWeather {
  /** A Home Assistant condition, or « unknown ». */
  condition: string; label: string; icon: string;
  phase: 'day' | 'twilight' | 'night' | 'unknown';
  temperature?: number; feels?: number; temperatureEntity?: string; conditionEntity?: string;
  source: string; temperatureSource: string; wind?: number;
  /** °C per hour, only when the temperature moves by 0.1 °C an hour or more. */
  trend?: number;
  darkSky: boolean;
  /** Météo-France's nuance of the condition (drizzle, freezing rain, mist…), for the sky (integration 2.6.0 and later). */
  detail?: string;
}

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
export interface Season {
  season: SeasonName; fromSensor: boolean; label: string; icon: string;
  /** Days since the season began (0 on its first day), when its start can be dated. */
  daysIn?: number;
  /** [month, day] of its start. */
  start?: [number, number];
  dayLength?: number; dayChange?: number;
}
export interface SeasonView { info: Season; news?: string; tip: string }

/** When a forecast point happens (seconds), and the banner's label for it (« 20 h », « midi », « demain »); absent for what is measured now. */
export interface Timed { at?: number; clock?: string }
/** An alert bubble: the official vigilance, or what the station measures at home. Both can show at once. */
export interface AlertPoint extends Timed { level: 1 | 2 | 3; label?: string; text: string; icon: string; source: string; official: boolean; entity?: string;
  /** The brief's signal (« official », « water », « storm-near »…), from integration 3.9 on: a card can leave out some kinds (issue #22). */
  key?: string }
/** A point of the scrolling bubble. */
export interface TickerPoint extends Timed { group: string; label: string; icon: string; text: string; level: number; theme?: Theme; entity?: string;
  /** On the timeline: the point that needs attention most, with the alert's halo. */
  alert?: boolean;
  /** The brief's signal, as on AlertPoint (integration 3.9 and later). */
  key?: string }

export interface BriefSignal extends Timed {
  key: string; group: 'now' | 'future' | 'environment' | 'official'; severity: 0 | 1 | 2 | 3;
  text: string; explanation: string; icon: string; entity?: string;
}
export interface Brief {
  title: string; label: string; color: string; icon: string; summary: string;
  signals: BriefSignal[]; caveats: string[]; available: boolean; severity: number;
}

export interface BulletinPeriod {
  key: string; label: string; short: string; condition: string; icon: string; text: string; phrase: string;
  early: string; late: string; night: boolean; during: string; start: string;
  tmin?: number; tmax?: number; rain: number; wind?: number; gust?: number; bearing?: number;
}
export interface Bulletin { summary: string; periods: BulletinPeriod[] }

export interface ComfortView {
  feels: number; temperature?: number; word: string; humidity: string; gap?: number;
  factors: Chip[]; source: string; entity?: string;
  /** Today's calculation in words: « 28,0 °C (thermomètre) + 1,4 °C (humidité) + 1,2 °C (soleil) = 30,6 °C ressentis ». */
  example: string;
}
export interface RainDay { date: string; label: string; value?: number; partial: boolean }
export interface RainView {
  source: string; status?: string;
  /** The main figure: a measured total, or the bulletin's amount when there is no gauge. */
  value?: number; unit: string; label: string; text?: string; entity: string;
  rate?: number; rateEntity?: string;
  days?: RainDay[]; daysNote: string; empty: string;
  stats: Stat[];
  /** The period shown, seven days by default; over 24 hours or 30 days, `days` holds those bars and `total` their sum. */
  period?: RainPeriodId; total?: number; totalPartial?: boolean;
  /** The 24-hour and 30-day bars, from 2.8.1 on, when the rain counter keeps statistics. */
  periods?: RainPeriod[];
}
export interface WindView {
  source: string; status?: string;
  value?: number; label: string; entity: string; description: string;
  bearing?: number; compass: string; bearingEntity?: string;
  /** Six hours of ten-minute points, then the current value. */
  mean: Point[]; gust: Point[];
  /** Top of the chart's scale, shared by both curves. */
  top: number;
  meanLabel: string; empty: string; stats: Stat[];
  /** The period shown, six hours by default: `mean`, `gust` and `top` are the ones of this period. */
  period?: ChartPeriodId;
  /** Every period, from 2.8.1 on. */
  periods?: WindPeriod[];
}
/** How far back the wind and pressure charts go: six hours, a day, two days or a week. */
export type ChartPeriodId = '6h' | '1d' | '2d' | '7d';
/** The rain bars: one an hour over 24 hours, one a day over 7 or 30 days. */
export type RainPeriodId = '24h' | '7d' | '30d';
export interface RainPeriod { period: RainPeriodId; days: RainDay[]; total?: number; partial: boolean }
export interface WindPeriod { period: ChartPeriodId; mean: Point[]; gust: Point[]; top: number }
export interface PressurePeriod { period: ChartPeriodId; series: Point[]; low: number; top: number; stats: Stat[] }
/** The temperature or the humidity on its own card (issue #21), from integration 3.6.0 on: its value, its curve over each period. */
export interface MeasureView {
  source: string; value?: number; entity?: string; description: string; empty: string;
  periods: PressurePeriod[];
  /** The period shown and its curve, chosen by the card (`temperature_span`). */
  period?: ChartPeriodId; series?: Point[]; low?: number; top?: number; stats?: Stat[];
}
export interface PressureView {
  source: string; value?: number; entity?: string; description: string;
  /** The period shown, six hours by default: `series`, `low`, `top` and `stats` are the ones of this period. */
  period?: ChartPeriodId;
  trend?: Chip; series: Point[]; low: number; top: number; empty: string; stats: Stat[];
  /** Every period, from 2.8.1 on; an older integration sends six hours only. */
  periods?: PressurePeriod[];
}

/** One forecast hour. */
export interface Slot {
  hour: number;
  /** 0 today, 1 tomorrow. */
  day: number;
  temperature?: number; precipitation: number; condition: string; conditionLabel: string; icon: string; night: boolean;
  wind?: number; gust?: number; bearing?: number;
  /** Seconds: where the hour sits on the banner's timeline. */
  time?: number;
  /** Forecast pressure in hPa, when the weather provider gives it (2.9.8 and later; never with Météo-France). */
  pressure?: number;
}
export interface DayForecast {
  label: string; today: boolean; condition: string; conditionLabel: string; icon: string;
  low?: number; high?: number; rain: number; wind?: number; bearing?: number; gust?: number;
}

export interface AtmoReading { entityId: string; label: string; value?: number; color: string; zone: string; updated: string; unit?: string; stale: boolean; unavailableReason?: 'no_index' }
export interface AirItem { label: string; reading: AtmoReading; concentration?: AtmoReading }
export interface AirPanel {
  kind: 'air' | 'pollen'; tomorrow: boolean; zone: string; primary?: AtmoReading;
  /** A sub-index worse than the global index: it stays visible under it. */
  worse?: AirItem; details: AirItem[]; updated: string; stale: boolean;
  /** The top of the index: 6 for Atmo France (when absent), 4 for Polleninformation and IRM KMI, whose level starts at 0 (none). */
  scale?: number;
  /** Who gives it when it is not Atmo France (« Polleninformation », « IRM KMI », « WAQI », « Open-Meteo »); absent from integrations before 2.1. */
  source?: string;
}

/** The storm Blitzortung sees: the radar of the last hour, the nearest strike, the level, the counts. */
export interface LightningView {
  source: string; entity: string;
  /** False while the Blitzortung sensor does not answer. */
  available: boolean;
  /** 0 calm, 1 a storm within 30 km, 2 close or coming closer, 3 overhead. */
  step: 0 | 1 | 2 | 3;
  headline: string;
  nearest?: number; direction: string; trend?: 'approche' | 'eloigne'; movement: string;
  hourCount: number; recentCount: number; lastMinutes?: number;
  /** The last hour's strikes, oldest first: [minutes ago, km, degrees from the north or null after a restart]. */
  strikes: Array<[number, number, number | null]>;
  /** Strikes since the first of the month, when Blitzortung's counter keeps statistics. */
  month?: number;
}

/** A fire PyroVeille reports, placed from the home. */
export interface FirePoint { place: string; status: 1 | 2 | 3; distance?: number; azimuth?: number; url?: string }
/** The fires around the home, from PyroVeille (issue #23, integration 3.9.0 and later). */
export interface FireView {
  source: string; entity: string;
  /** 0 nothing to do, 1 to watch, 2 an active fire close or whose smoke comes this way. */
  level: 0 | 1 | 2;
  /** The nearest fire's status: 0 none, 1 extinguished, 2 reported, 3 active. */
  state: 0 | 1 | 2 | 3;
  headline: string; radius?: number; smoke: boolean;
  /** Where the wind comes from now, in degrees, when it blows. */
  windFrom?: number;
  /** Nearest first. */
  fires: FirePoint[];
}
/** The water restrictions of the day, from Vigieau (issue #25, integration 3.9.0 and later). */
export interface WaterView {
  source: string; entity: string;
  /** 0 no restriction to 4 crisis. */
  level: 0 | 1 | 2 | 3 | 4;
  label: string; headline: string; usages: string[]; watering: boolean;
  /** The link to the prefect's order. */
  order?: string;
}

export interface WeatherView {
  location: string; dateLabel: string; provider: string; forecastSource: string;
  /** Opened when the forecast is tapped. */
  weatherEntity: string;
  /** A local thermometer: the feel is compared with it rather than with the bulletin. */
  station: boolean;
  now: CurrentWeather; season: SeasonView;
  alerts: AlertPoint[]; points: TickerPoint[]; brief?: Brief; bulletin?: Bulletin;
  /** The banner's timeline: every point of the coming hours, each at its time (integration 2.0.5 and later). */
  timeline?: TickerPoint[];
  comfort?: ComfortView; rain?: RainView; wind?: WindView; pressure?: PressureView; extras: Chip[];
  /** The temperature and the humidity on their own card (issue #21, integration 3.6.0 and later). */
  temperature?: MeasureView; humidity?: MeasureView;
  hours: Slot[]; days: DayForecast[];
  air: { today: AirPanel[]; tomorrow: AirPanel[] };
  /** Blitzortung's storm, when it is chosen in the integration (from 2.9). */
  lightning?: LightningView;
  /** PyroVeille's fires and Vigieau's restrictions, when chosen in the integration (from 3.9). */
  fire?: FireView; water?: WaterView;
}

/** One message of the integration's `hestia_weather/subscribe`. */
/** `integration`: the integration's version (the card comes with it, since 2.3). */
export interface ViewMessage { version: number; integration?: string; entryId: string; title: string; view: WeatherView }
/** After the first view, only the parts that changed (`changes: true` in the subscription, point 8 of the plan). */
export interface ChangesMessage { version: number; integration?: string; entryId: string; title: string; changes: Partial<WeatherView>; removed?: string[] }
