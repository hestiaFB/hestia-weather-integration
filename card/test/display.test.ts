import { describe, expect, it } from 'vitest';
import { displayed } from '../src/display';
import type { AirPanel, WeatherView } from '../src/view';
import type { WeatherCardConfig } from '../src/types';

const reading = { entityId: 'sensor.air', label: 'Moyen', value: 2, color: '#50ccaa', zone: 'Gardanne', updated: '', stale: false };
const panel = (tomorrow: boolean): AirPanel => ({ kind: 'air', tomorrow, zone: 'Gardanne', primary: reading, details: [{ label: 'O₃', reading }], updated: '10/10 à 13 h', stale: false });
const view = {
  location: 'Gardanne', alerts: [{ level: 1, text: 'Vigilance jaune', icon: 'mdi:alert', source: 'x', official: true }],
  points: [{ group: 'now', label: 'Maintenant', icon: 'mdi:x', text: 'Il pleut', level: 1 }],
  brief: { title: 'Pluie', label: 'À surveiller', color: '', icon: '', summary: '', signals: [], caveats: [], available: true, severity: 1 },
  bulletin: { summary: 'Pluie ce soir.', periods: [] }, air: { today: [panel(false)], tomorrow: [panel(true)] },
} as unknown as WeatherView;
const config = (extra: Partial<WeatherCardConfig> = {}): WeatherCardConfig => ({ type: 'custom:hestia-weather-card', ...extra });

describe('What the card shows of the integration’s view', () => {
  it('shows everything by default', () => {
    expect(displayed(view, config(), false)).toEqual(view);
  });
  it('switches the synthesis off with its bubbles on the full card, never on the tile', () => {
    for (const off of [{ smart_brief: false }, { show_synthesis: false }]) {
      const v = displayed(view, config(off), false);
      expect([v.brief, v.alerts, v.points]).toEqual([undefined, [], []]);
      expect(displayed(view, config(off), true).points).toEqual(view.points);
    }
  });
  it('hides the bulletin, tomorrow’s air and the air details on request, keeping the rest', () => {
    const v = displayed(view, config({ show_bulletin: false, show_atmo_tomorrow: false, show_atmo_details: false }), false);
    expect(v.bulletin).toBeUndefined();
    expect(v.air.tomorrow).toEqual([]);
    // No « Détail » fold at all: neither the list nor the publication date it holds.
    expect(v.air.today[0]).toMatchObject({ primary: reading, details: [], updated: '' });
    expect(v.location).toBe('Gardanne');
  });
  it('shows the pressure over the chosen period, six hours with an older integration', () => {
    const six = { period: '6h' as const, series: [[1, 1012]] as [number, number][], low: 1011, top: 1013, stats: [] };
    const week = { period: '7d' as const, series: [[1, 1000], [2, 1012]] as [number, number][], low: 999, top: 1013, stats: [{ label: 'Il y a 7 j', value: '1 000 hPa' }] };
    const pressure = { source: 'Station', description: '', empty: '', ...six, periods: [six, week] };
    const v = displayed({ ...view, pressure } as WeatherView, config({ pressure_span: '7d' }), false).pressure!;
    expect([v.period, v.series, v.low, v.stats]).toEqual(['7d', week.series, 999, week.stats]);
    const old = displayed({ ...view, pressure: { ...pressure, periods: undefined } } as WeatherView, config({ pressure_span: '7d' }), false).pressure!;
    expect([old.period, old.series]).toEqual(['6h', six.series]);
  });
  it('shows the wind and the rain over the chosen periods, the default ones without them', () => {
    const wind = { mean: [[1, 5]], gust: [], top: 20, periods: [{ period: '7d', mean: [[1, 9]], gust: [[1, 30]], top: 30 }] };
    const rain = { days: [{ date: 'd', label: 'lun.', value: 1, partial: false }], periods: [{ period: '30d', days: [], total: 12, partial: true }] };
    const v = displayed({ ...view, wind, rain } as unknown as WeatherView, config({ wind_span: '7d', rain_span: '30d' }), false);
    expect([v.wind!.period, v.wind!.gust, v.wind!.top]).toEqual(['7d', [[1, 30]], 30]);
    expect([v.rain!.period, v.rain!.days, v.rain!.total, v.rain!.totalPartial]).toEqual(['30d', [], 12, true]);
    const plain = displayed({ ...view, wind, rain } as unknown as WeatherView, config({ rain_span: '24h' }), false);
    expect([plain.wind!.period, plain.rain!.period, plain.rain!.days?.length]).toEqual(['6h', '7d', 1]);
  });
});

describe('The Temperature card’s period (issue #21)', () => {
  const period = (p: '6h' | '1d', v: number) => ({ period: p, series: [[1, v]] as [number, number][], low: v - 1, top: v + 1, stats: [{ label: 'Min.', value: `${v} °C` }] });
  const m = { source: 'Station', value: 5, description: '', empty: '', periods: [period('6h', 4), period('1d', 2)] };
  it('shows the temperature and the humidity over the chosen period, six hours by default or when it is missing', () => {
    const v = { ...view, temperature: m, humidity: m } as unknown as WeatherView;
    expect(displayed(v, config({ temperature_span: '1d' }), false).temperature!.series).toEqual([[1, 2]]);
    expect(displayed(v, config({ temperature_span: '1d' }), false).humidity!.period).toBe('1d');
    expect(displayed(v, config(), false).temperature!.series).toEqual([[1, 4]]);
    expect(displayed(v, config({ temperature_span: '7d' }), false).temperature!.period).toBe('6h');
  });
});
