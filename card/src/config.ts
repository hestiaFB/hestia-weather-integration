import type { BannerBlock, CardBlock, ForecastBlock, TodayBlock, WeatherCardConfig } from './types';

/** The cards on their own, and everything each can show, in its default order. */
export const CARD_BLOCKS: Partial<Record<NonNullable<WeatherCardConfig['format']>, CardBlock[]>> = {
  comfort: ['feel', 'gauge', 'factors', 'extras'],
  rain: ['ahead', 'now', 'chart', 'stats'],
  wind: ['ahead', 'now', 'chart', 'stats'],
  pressure: ['ahead', 'now', 'chart', 'stats'],
  lightning: ['ahead', 'now', 'radar', 'stats'],
  air: ['air_today', 'pollen_today', 'air_tomorrow', 'pollen_tomorrow'],
  forecast: ['hours', 'days'],
};
/** What a card on its own shows: its chosen parts that its format has, everything when none is chosen.
 *  Parts left from another format (the format changed by hand) count as none chosen. */
export function cardBlocks(c: WeatherCardConfig): CardBlock[] {
  const all = CARD_BLOCKS[c.format ?? 'full'] ?? [];
  if (!c.card_blocks) return all;
  const kept = c.card_blocks.filter(b => all.includes(b));
  return kept.length || !c.card_blocks.length ? kept : all;
}

export interface Sections { hero: boolean; banner: BannerBlock[]; today: TodayBlock[]; forecasts: ForecastBlock[] }
/** What each section of the full card shows: its list when set, otherwise what the older switches showed. */
export function sections(c: WeatherCardConfig): Sections {
  return {
    // The banner and its animated sky always stay; only an older card that switched it off keeps it hidden.
    hero: c.banner_blocks !== undefined || c.show_synthesis !== false,
    banner: c.banner_blocks ?? (c.show_synthesis === false ? [] : [...(c.show_bulletin === false ? [] : ['bulletin' as const]), 'events']),
    today: c.today_blocks ?? (c.show_today === false ? [] : ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'extras', 'air']),
    forecasts: c.forecast_blocks ?? (c.show_predictions === false ? [] : ['hours', 'days', ...(c.show_atmo_tomorrow === false ? [] : ['air' as const])]),
  };
}

/** Remove obsolete options while preserving explicit section choices. */
export function cleanConfig(config: WeatherCardConfig): WeatherCardConfig {
  const copy = { ...config } as WeatherCardConfig & {
    mode?: string; lightning_distance_entity?: string; comfort_entity?: string;
    air_quality_entity?: string; model_entity?: string; forecast_entity?: string; air_path?: string;
  } & Record<string, unknown>;
  if (copy.mode === 'compact' && copy.show_predictions === undefined) copy.show_predictions = false;
  delete copy.mode;
  // The mixed list of the betas 3 and 4 becomes the three sections.
  const mixed = copy.full_blocks as string[] | undefined;
  if (Array.isArray(mixed)) {
    const banner = ['bulletin', 'events', 'moments', 'forecast'], air = mixed.includes('air');
    copy.banner_blocks ??= mixed.filter(b => banner.includes(b)) as BannerBlock[];
    copy.today_blocks ??= mixed.includes('today') ? ['comfort', 'rain', 'wind', 'pressure', 'extras', ...(air ? ['air' as const] : [])] : [];
    copy.forecast_blocks ??= mixed.includes('predictions') ? ['hours', 'days', ...(air ? ['air' as const] : [])] : [];
  }
  delete copy.full_blocks; delete copy.air_blocks;
  delete copy.lightning_distance_entity; delete copy.comfort_entity;
  delete copy.air_quality_entity; delete copy.model_entity; delete copy.forecast_entity; delete copy.air_path;
  // Thermal Comfort is no longer needed: humidex, dew and frost points are computed by the card.
  for (const key of ['humidex_entity', 'humidex_perception_entity', 'thermal_dew_point_entity', 'heat_index_entity', 'absolute_humidity_entity', 'thermal_perception_entity', 'thermal_device_id']) delete copy[key];
  return copy;
}

/** The sections' blocks in the card's own order: a block checked later takes its place there, not the end of the list. */
export const BLOCK_ORDERS: Partial<Record<keyof WeatherCardConfig, string[]>> = {
  banner_blocks: ['bulletin', 'events', 'moments', 'forecast'],
  today_blocks: ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'extras', 'air'],
  forecast_blocks: ['hours', 'days', 'air'],
};
/** `next` with its newly checked blocks moved just after the last block that precedes them in `order`; the rest keeps the order dragged. */
export function placeChecked(previous: readonly string[], next: readonly string[], order: readonly string[]): string[] {
  const rank = (b: string) => { const i = order.indexOf(b); return i < 0 ? order.length : i; };
  const added = new Set(next.filter(b => !previous.includes(b)));
  const out = next.filter(b => !added.has(b));
  for (const b of added) {
    let at = out.length;
    while (at > 0 && rank(out[at - 1]) > rank(b)) at--;
    out.splice(at, 0, b);
  }
  return out;
}
