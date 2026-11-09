import { describe, expect, it } from 'vitest';
import { alertItems, miniAlert, miniItems, pressureAhead, rainAhead, windAhead } from '../src/views/compact';
import { airPanels } from '../src/views/single';
import { displayed } from '../src/display';
import type { AlertPoint, Slot, TickerPoint, WeatherView } from '../src/view';
import type { WeatherCardConfig } from '../src/types';

const slot = (hour: number, precipitation: number): Slot => ({ hour, day: 0, precipitation, condition: 'cloudy', conditionLabel: 'Couvert', icon: 'mdi:x', night: false });
const view = (extra: Partial<WeatherView>): WeatherView => ({ hours: [], days: [], alerts: [], points: [], ...extra }) as unknown as WeatherView;
const point = (level: number, group = 'future'): TickerPoint => ({ group, label: 'À venir', icon: 'mdi:x', text: `niveau ${level}`, level });
const vigilance: AlertPoint = { level: 2, label: 'Vigilance orange', text: 'Orages', icon: 'mdi:x', source: '', official: true };

describe('The rain card', () => {
  it('adds the rain of the next hour and of the next six, and says when the first rain starts', () => {
    const v = view({ hours: [slot(14, 0), slot(15, 0), slot(16, 2.4), slot(17, 9), slot(18, 1.5), slot(19, 0), slot(20, 4)] });
    expect(rainAhead(v)).toEqual({ hour: 0, six: 12.9, next: '16 h' });
  });
  it('writes noon and midnight in words, and knows when no rain is forecast', () => {
    expect(rainAhead(view({ hours: [slot(23, 0), slot(0, .5)] })).next).toBe('minuit');
    expect(rainAhead(view({ hours: [slot(11, 0), slot(12, 1)] })).next).toBe('midi');
    expect(rainAhead(view({ hours: [slot(11, 0), slot(12, .1)] })).next).toBeUndefined();
  });
});

describe('The wind and pressure to come', () => {
  const at = (hour: number, extra: Partial<Slot>): Slot => ({ ...slot(hour, 0), ...extra });
  it('keeps the strongest wind and gust of the next six hours, and when it turns strong', () => {
    const hours = [at(14, { wind: 10, gust: 20 }), at(15, { wind: 18, gust: 42 }), at(16, { wind: 25 }), at(17, {}), at(18, {}), at(19, {}), at(20, { wind: 60, gust: 90 })];
    expect(windAhead(view({ hours }))).toEqual({ wind: 25, gust: 42, strong: '15 h' });
    expect(windAhead(view({ hours: [at(14, { wind: 29, gust: 39 })] }))).toEqual({ wind: 29, gust: 39, strong: undefined });
    expect(windAhead(view({ hours: [at(14, {})] }))).toEqual({ wind: undefined, gust: undefined, strong: undefined });
  });
  it('says the change of pressure over six hours, only when the provider forecasts it', () => {
    const hours = [at(14, { pressure: 1015 }), at(15, {}), at(17, { pressure: 1012 }), at(20, { pressure: 1009.4 }), at(21, {}), at(22, {}), at(23, {}), at(0, { pressure: 990 })];
    expect(pressureAhead(view({ hours }))).toEqual({ change: 1009.4 - 1015, last: 1009.4, hour: '20 h' });
    // Météo-France gives no pressure.
    expect(pressureAhead(view({ hours: [at(14, {}), at(15, {})] }))).toBeUndefined();
  });
});

describe('The alert card', () => {
  it('shows the vigilances and alerts, and only the serious points of the coming hours', () => {
    const v = view({ alerts: [vigilance], points: [point(1), point(2), point(3, 'official')] });
    expect(alertItems(v)).toEqual({ alerts: [vigilance], points: [point(2)] });
  });
  it('has nothing to show when all is calm', () => {
    const { alerts, points } = alertItems(view({ points: [point(0), point(1)] }));
    expect(alerts.length + points.length).toBe(0);
  });
});

describe('The tile’s blocks', () => {
  const bulletin = { summary: 'Ce soir, pluie.', periods: [] };
  const config = (extra: Partial<WeatherCardConfig>) => ({ type: 'custom:hestia-weather-card', ...extra }) as WeatherCardConfig;
  it('keeps the bulletin for a tile whose blocks are chosen: the moments come from it', () => {
    const v = view({ bulletin, air: { today: [], tomorrow: [] } } as Partial<WeatherView>);
    expect(displayed(v, config({ format: 'tile', show_bulletin: false, tile_blocks: ['moments'] }), true).bulletin).toEqual(bulletin);
    expect(displayed(v, config({ format: 'tile', show_bulletin: false }), true).bulletin).toBeUndefined();
  });
});

describe('The air and pollen card', () => {
  const panel = (kind: 'air' | 'pollen', tomorrow: boolean) => ({ kind, tomorrow, zone: '', details: [], updated: '', stale: false });
  it('shows the panels chosen, in their order, and skips those the sources do not give', () => {
    const v = view({ air: { today: [panel('air', false), panel('pollen', false)], tomorrow: [panel('air', true)] } } as Partial<WeatherView>);
    expect(airPanels(v, ['pollen_today', 'air_tomorrow', 'pollen_tomorrow'])).toEqual([panel('pollen', false), panel('air', true)]);
  });
});

describe('The Mini (issue #22)', () => {
  const v = view({
    now: { condition: 'cloudy', label: 'Couvert', icon: 'mdi:x', phase: 'day', temperature: 36.2, feels: 7.5, wind: 45, source: '', temperatureSource: '', darkSky: false },
    wind: { gust: [[1, 70], [2, null]] } as unknown as WeatherView['wind'], rain: { unit: 'mm', value: 0 } as WeatherView['rain'], pressure: { value: 990 } as WeatherView['pressure'],
    extras: [{ theme: 'rain', icon: 'mdi:water-percent', label: 'humidité', value: '92 %' }, { theme: 'level2', icon: 'mdi:sun-wireless-outline', label: 'UV fort', value: '6' }],
    alerts: [{ level: 2, text: 'Restriction d’eau', icon: 'mdi:x', source: '', official: false }, { level: 3, label: 'Vigilance rouge', text: 'Canicule', icon: 'mdi:x', source: '', official: true }],
  });
  it('reads each chosen value, in the chosen order, and colours those that deserve a look', () => {
    const items = miniItems(v, ['uv', 'feel', 'wind', 'gust', 'rain', 'humidity', 'pressure', 'temperature']);
    expect(items.map(i => [i.key, i.value, i.theme ?? null])).toEqual([['uv', 6, 'heat'], ['feel', 7.5, 'cold'], ['wind', 45, 'wind'], ['gust', 70, 'wind'],
      ['rain', 0, null], ['humidity', 92, 'watch'], ['pressure', 990, 'pressure'], ['temperature', 36.2, 'level3']]);
  });
  it('leaves out a value it does not know', () => {
    expect(miniItems(view({ now: { temperature: 12 } as WeatherView['now'], extras: [] }), ['humidity', 'gust', 'temperature']).map(i => i.key)).toEqual(['temperature']);
  });
  it('shows the official vigilance only by default, every alert or none on demand', () => {
    expect(miniAlert(v)?.text).toBe('Canicule');
    expect(miniAlert(view({ alerts: [v.alerts[0]] }))).toBeUndefined();
    expect(miniAlert(view({ alerts: [v.alerts[0]] }), 'all')?.text).toBe('Restriction d’eau');
    expect(miniAlert(v, 'none')).toBeUndefined();
  });
});
