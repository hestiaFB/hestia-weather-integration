import type { AirPanel, ChartPeriodId, MeasureView, PressureView, RainPeriodId, RainView, WeatherView, WindView } from './view';
import type { WeatherCardConfig } from './types';

/** The view as this card shows it: the integration computes everything, the card's display settings leave out what they hide. */
/** The pressure over the chosen period, when the integration sends it; six hours otherwise. */
function pressureOver(p: PressureView, period: ChartPeriodId): PressureView {
  const chosen = p.periods?.find(x => x.period === period);
  return chosen ? { ...p, period, series: chosen.series, low: chosen.low, top: chosen.top, stats: chosen.stats } : { ...p, period: '6h' };
}

/** The temperature or the humidity over the chosen period; six hours when that one is missing. */
function measureOver(m: MeasureView, period: ChartPeriodId): MeasureView {
  const chosen = m.periods.find(x => x.period === period) ?? m.periods.find(x => x.period === '6h');
  return chosen ? { ...m, period: chosen.period, series: chosen.series, low: chosen.low, top: chosen.top, stats: chosen.stats } : { ...m, period: '6h', series: [], low: 0, top: 2, stats: [] };
}

/** The wind over the chosen period, when the integration sends it; six hours otherwise. */
function windOver(w: WindView, period: ChartPeriodId): WindView {
  const chosen = w.periods?.find(x => x.period === period);
  return chosen ? { ...w, period, mean: chosen.mean, gust: chosen.gust, top: chosen.top } : { ...w, period: '6h' };
}

/** The rain bars over the chosen period, when the counter keeps statistics; the seven days otherwise. */
function rainOver(r: RainView, period: RainPeriodId): RainView {
  const chosen = r.periods?.find(x => x.period === period);
  return chosen ? { ...r, period, days: chosen.days, total: chosen.total, totalPartial: chosen.partial } : { ...r, period: '7d' };
}

export function displayed(v: WeatherView, config: WeatherCardConfig, tile: boolean): WeatherView {
  // The tile is the brief: it always shows it. On the full card the synthesis can be switched off, its bubbles with it.
  // A full card whose blocks are chosen keeps everything: its blocks decide what shows (the timeline only with « events »).
  const chosen = !tile && !!config.banner_blocks;
  const brief = tile || chosen || (config.smart_brief !== false && config.show_synthesis !== false);
  // Without details, the whole « Détail » fold goes: its list and the publication date it also holds.
  const details = (panels: AirPanel[]) => config.show_atmo_details === false ? panels.map(p => ({ ...p, details: [], updated: '' })) : panels;
  return {
    ...v,
    brief: brief ? v.brief : undefined, alerts: brief ? v.alerts : [], points: brief ? v.points : [], timeline: brief ? v.timeline : [],
    // A tile whose blocks are chosen keeps the bulletin: its moments come from it.
    bulletin: config.show_bulletin === false && !(tile && config.tile_blocks?.length) && !chosen ? undefined : v.bulletin,
    pressure: v.pressure && pressureOver(v.pressure, config.pressure_span ?? '6h'),
    wind: v.wind && windOver(v.wind, config.wind_span ?? '6h'),
    temperature: v.temperature && measureOver(v.temperature, config.temperature_span ?? '6h'),
    humidity: v.humidity && measureOver(v.humidity, config.temperature_span ?? '6h'),
    rain: v.rain && rainOver(v.rain, config.rain_span ?? '7d'),
    air: { today: details(v.air.today), tomorrow: config.show_atmo_tomorrow === false && !config.forecast_blocks && config.format !== 'air' ? [] : details(v.air.tomorrow) },
  };
}
