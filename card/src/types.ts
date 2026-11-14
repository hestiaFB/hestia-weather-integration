export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated?: string;
}

/** The part of Home Assistant's websocket connection the card uses. */
export interface HassConnection {
  /** Subscribes to a command's events; resolves to the function that stops it, rejects with `{ code, message }`. */
  subscribeMessage<T>(callback: (message: T) => void, message: Record<string, unknown>): Promise<() => Promise<void>>;
}

/** What Home Assistant's frontend knows of an entity's registry entry (the River card finds CrueVeille's sensors of a station with it). */
export interface HassEntityEntry { entity_id: string; device_id?: string | null; platform?: string; translation_key?: string | null }

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  entities?: Record<string, HassEntityEntry>;
  language: string;
  locale: { language: string };
  connection?: HassConnection;
  callWS<T>(message: Record<string, unknown>): Promise<T>;
}

/** A block of the unfolded tile. */
export type TileBlock = 'bulletin' | 'events' | 'moments' | 'forecast';
/** The full card's three sections, always in this order, each with its own blocks: nothing moves from one to another. */
export type BannerBlock = 'bulletin' | 'events' | 'moments' | 'forecast';
export type TodayBlock = 'comfort' | 'rain' | 'wind' | 'pressure' | 'lightning' | 'extras' | 'air';
export type ForecastBlock = 'hours' | 'days' | 'air';
/** What a card on its own shows (comfort, rain, wind, pressure, air, forecast), each format with its own parts. */
export type CardBlock = 'now' | 'chart' | 'radar' | 'stats' | 'ahead' | 'feel' | 'gauge' | 'factors' | 'extras'
  | 'air_today' | 'pollen_today' | 'air_tomorrow' | 'pollen_tomorrow' | 'hours' | 'days' | 'humidity' | 'list' | 'flow';

/** The card's own settings: what it shows and how. Its sources (weather, station, air) are set in the Hestia Weather integration. */
/** What a press does: the full weather over the page, the weather page, fold or unfold the tile, or nothing. */
export type PressAction = 'popup' | 'page' | 'toggle' | 'forecast' | 'none';

export interface WeatherCardConfig {
  type: 'custom:hestia-weather-card';
  /** The integration's place to show; may be left out when there is only one. */
  entry_id?: string;
  /** full (default): the weather page. tile: one band that unfolds on tap. intermediate: the same tile, unfolded at first.
   *  mini: one line. forecast: the hours and the days alone. rain: the rain to come and the rain that fell.
   *  comfort, wind, pressure, air: that part of the full card alone. events: the timeline (« frise ») alone. records: the records of the station
   *  and of the place (issue #17). fire: PyroVeille's fires on a radar (issue #23). water: Vigieau's restrictions (issue #25).
   *  river: CrueVeille's rivers, their height and flow (issue #18). alert: only while there is a vigilance or an alert, hidden otherwise.
   *  On the small formats a long press (a tap on mini and alert) does what hold_action says. */
  format?: 'full' | 'intermediate' | 'tile' | 'mini' | 'comfort' | 'temperature' | 'rain' | 'wind' | 'pressure' | 'lightning' | 'air' | 'forecast' | 'events' | 'records' | 'fire' | 'water' | 'river' | 'alert';
  /** The River card (issue #18): CrueVeille's « Alerte inondation » sensors to show, one per station, in this order. Unset: every station. */
  rivers?: string[];
  /** The River card's curves: six hours, a day, two days (default) or a week. */
  river_span?: '6h' | '1d' | '2d' | '7d';
  /** The Records card: this month, this year, all time, or this year and all time (both, default). */
  records_period?: 'month' | 'year' | 'all' | 'both';
  /** The Records card: the station (default), the place since 1940 (Open-Meteo's archive), or both. */
  records_source?: 'station' | 'lieu' | 'both';
  /** Mini: the values of its line, in this order (issue #22); the temperature, when chosen, goes large at the end. Unset: the temperature. */
  mini_values?: MiniValue[];
  /** Mini: the alerts its line shows: the official vigilances only (default), every alert, or none. */
  mini_alerts?: 'official' | 'all' | 'none';
  /** Mini: the large temperature at the end of the line (right, default) or just after the round (left) (issue #22). */
  mini_temperature?: 'left' | 'right';
  /** Mini: the place and the weather in words (shown by default); off, the line keeps the round and the values. An alert keeps its words. */
  mini_words?: boolean;
  /** Mini and Alert: the kinds of alerts left out, whatever their level (issue #22): « water » for Vigieau, « air » for the air and pollens… */
  hidden_alerts?: AlertKind[];
  /** The Records card: one line per record (list, default) or four cases (cases). */
  records_layout?: 'list' | 'cases';
  /** The cards on their own: what they show, in this order. Unset, everything their format has. */
  card_blocks?: CardBlock[];
  /** The lightning card: hidden while no storm is within 30 km (shown while the dashboard is edited). */
  hide_when_calm?: boolean;
  /** What the unfolded tile shows, in this order. Default: the bulletin, then the events. */
  tile_blocks?: TileBlock[];
  /** Full card, what each section shows and in which order; an empty list removes the section. Unset, the older switches decide.
   *  The banner: bulletin, events (timeline), moments, forecast (the hours/days tiles); the place, vigilance and weather now always lead. */
  banner_blocks?: BannerBlock[];
  /** « Aujourd'hui »: comfort (feel), rain, wind, pressure, lightning (with Blitzortung), extras (chips), air (today's air and pollens). */
  today_blocks?: TodayBlock[];
  /** How far back the pressure and wind charts go. Default: six hours. */
  pressure_span?: '6h' | '1d' | '2d' | '7d';
  /** The Temperature card's curves (temperature and humidity): six hours (default), a day, two days or a week. */
  temperature_span?: '6h' | '1d' | '2d' | '7d';
  /** The cards on their own: their panels' titles (shown by default; issue #21). */
  show_title?: boolean;
  wind_span?: '6h' | '1d' | '2d' | '7d';
  /** The rain bars: one an hour over 24 hours, one a day over 7 days (default) or 30 days. */
  rain_span?: '24h' | '7d' | '30d';
  /** The time in the banner: under the title (left) or above « En ce moment » (right). Unset: no clock. */
  clock?: 'none' | 'left' | 'right';
  /** The glass frame behind « En ce moment » in the banner: opaque (default), clear, or none. */
  now_frame?: 'opaque' | 'clear' | 'none';
  /** « Prévisions »: hours (the 18-hour curve), days (the 7-day table), air (tomorrow's air and pollens). */
  forecast_blocks?: ForecastBlock[];
  /** What a long press on the tile (a tap on mini and alert) does: popup, the full weather over the page; page, opens weather_path;
   *  toggle, folds or unfolds the tile (tile formats only); none, nothing. Default: page when weather_path is set, popup otherwise. */
  hold_action?: PressAction;
  /* forecast: Home Assistant's own window of the weather entity, with its hourly and daily forecasts (issue #24).
     On the cards on their own (comfort … records), a tap and a long press elsewhere than on a value: nothing by default. */
  /** What a tap on the tile does, with the same choices. Default: toggle. */
  tap_action?: PressAction;
  /** The forecasts open on the hours or on the days (the tile's « Prévisions » block and the forecast card). */
  forecast_tab?: 'hours' | 'days';
  /** Full card: start with « Aujourd'hui » or « Prévisions » folded. */
  collapse_today?: boolean;
  collapse_predictions?: boolean;
  smart_brief?: boolean;
  show_synthesis?: boolean;
  show_today?: boolean;
  /** The day's bulletin in the banner, and in the unfolded tile. */
  show_bulletin?: boolean;
  show_predictions?: boolean;
  show_atmo_details?: boolean;
  show_atmo_tomorrow?: boolean;
  weather_animations?: boolean;
  /** Frosted glass over the sky (blur). Off, the glass is plain and more opaque: lighter for slow devices. */
  glass_effect?: boolean;
  weather_animation_quality?: 'low' | 'standard';
  weather_path?: string;
  /** Before 2.0 the card held its sources; they stay in old dashboards, for the integration to take over. */
  weather_entity?: string;
}

/** The kinds of alerts a card can leave out (issue #22). */
export const ALERT_KINDS = ['official', 'storm', 'rain', 'wind', 'temperature', 'fog', 'uv', 'air', 'water', 'fire', 'river'] as const;
export type AlertKind = typeof ALERT_KINDS[number];

/** What the Mini's line can show (issue #22). */
export const MINI_VALUES = ['temperature', 'feel', 'wind', 'gust', 'rain', 'humidity', 'pressure', 'uv'] as const;
export type MiniValue = typeof MINI_VALUES[number];
