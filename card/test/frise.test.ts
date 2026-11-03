import { describe, expect, it } from 'vitest';
import { buildFrise } from '../src/frise';
import type { AlertPoint, Slot, TickerPoint } from '../src/view';

// 17 h 00, the hours of the forecast from 17 h to 22 h.
const NOW = 1_800_000_000 - 1_800_000_000 % 3600;
const slot = (i: number, condition: string, night = false): Slot => ({ hour: (17 + i) % 24, day: 0, time: NOW + i * 3600, precipitation: 0, condition,
  conditionLabel: condition, icon: `mdi:${condition}`, night });
const hours = [slot(0, 'sunny'), slot(1, 'sunny'), slot(2, 'rainy'), slot(3, 'rainy'), slot(4, 'clear-night', true), slot(5, 'clear-night', true)];
const point = (text: string, extra: Partial<TickerPoint> = {}): TickerPoint => ({ group: 'now', label: 'Maintenant', icon: 'mdi:x', text, level: 0, ...extra });
const vigilance: AlertPoint = { level: 2, label: 'Vigilance orange', text: 'Orages', icon: 'mdi:weather-lightning', source: 'Vigilance orange · orages', official: true };
const measured: AlertPoint = { level: 1, label: 'Maintenant', text: 'Il pleut : 2 mm/h', icon: 'mdi:weather-pouring', source: 'Il pleut : 2 mm/h', official: false };

describe('The banner’s timeline', () => {
  it('gathers the points of now in one label, led by the alert measured at home, then one label per forecast point in time order', () => {
    const f = buildFrise([
      point('Pluie dans 3 h', { group: 'future', label: 'À venir', at: NOW + 3 * 3600, clock: '20 h', level: 2 }),
      point('Ressenti 3 °C de moins'),
      point('Montée à 24 °C', { group: 'future', label: 'À venir', at: NOW + 3600, clock: '18 h' }),
    ], [vigilance, measured], hours, NOW);
    expect(f.items.map(i => i.text)).toEqual(['Il pleut : 2 mm/h', 'Ressenti 3 °C de moins', 'Montée à 24 °C', 'Pluie dans 3 h']);
    expect(f.groups.map(g => [g.clock, g.items, g.alert])).toEqual([['Maintenant', [0, 1], 1], ['18 h', [2], undefined], ['20 h', [3], 2]]);
    expect(f.groups.map(g => g.x)).toEqual([0, 1 / 6, 3 / 6]);
  });
  it('keeps the official vigilance out of the timeline: it has its own pill above', () => {
    expect(buildFrise([], [vigilance], hours, NOW).items).toEqual([]);
  });
  it('follows the integration’s own list when it sends one, the points less than an hour apart sharing a label', () => {
    const f = buildFrise([point('Vieille liste')], [measured], hours, NOW, [
      point('La pression monte'),
      point('Fortes pluies : 12 mm prévus', { group: 'future', label: 'À venir', at: NOW + 2 * 3600, clock: '19 h', level: 2, alert: true }),
      point('Orage ou grêle', { group: 'future', label: 'À venir', at: NOW + 2.5 * 3600, clock: '19 h', level: 2 }),
      point('Gelée blanche possible', { group: 'future', label: 'À venir', at: NOW + 11 * 3600, clock: '4 h', level: 1 }),
    ]);
    expect(f.items.map(i => i.text)).toEqual(['La pression monte', 'Fortes pluies : 12 mm prévus', 'Orage ou grêle', 'Gelée blanche possible']);
    expect(f.groups.map(g => [g.clock, g.items, g.alert])).toEqual([['Maintenant', [0], undefined], ['19 h', [1, 2], 2], ['4 h', [3], undefined]]);
  });
  it('cuts the track by the forecast sky, night hours apart, light and heavy rain together', () => {
    expect(buildFrise([], [], hours, NOW).segments.map(s => [s.kind, s.flex / 3600])).toEqual([['sun', 2], ['rain', 2], ['night', 2]]);
    const showers = [slot(0, 'rainy'), slot(1, 'pouring'), slot(2, 'partlycloudy'), slot(3, 'partlycloudy', true)];
    showers[3].icon = 'mdi:weather-night-partly-cloudy';
    expect(buildFrise([], [], showers, NOW).segments.map(s => [s.kind, s.flex / 3600])).toEqual([['rain', 2], ['partly', 1], ['partly', 1]]);
  });
  it('starts the track now, and writes the hours every three hours from now under it (2 November)', () => {
    const late = [...Array(12)].map((_, i) => slot(i, 'cloudy'));
    expect(buildFrise([], [], hours, NOW).marks.map(m => m.text)).toEqual(['Maintenant', '20 h']);
    expect(buildFrise([], [], late, NOW).marks.map(m => m.text)).toEqual(['Maintenant', '20 h', '23 h', '2 h']);
    const started = buildFrise([], [], hours, NOW + 1800).segments;
    // The official vigilance holds for the day: its band runs to midnight, or to the end of the track.
    const vigilance = { level: 1 as const, text: 'Vent violent', icon: 'mdi:weather-windy', source: 'Météo-France', official: true };
    expect(buildFrise([], [vigilance], late, NOW).band).toEqual({ to: expect.closeTo(7 / 12, 1), level: 1 });
    expect(buildFrise([], [], late, NOW).band).toBeUndefined();
    expect(started[0].flex).toBe(1800 + 3600);
  });
  it('takes an undated point, from an older integration, as a point of now', () => {
    const f = buildFrise([point('Pluie dans 2 h', { group: 'future', label: 'À venir' })], [], [], NOW);
    expect(f.groups.map(g => [g.clock, g.items])).toEqual([['Maintenant', [0]]]);
    expect(f.segments).toEqual([]);
  });
});
