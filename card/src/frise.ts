// The banner's timeline (« frise Capsules »), as data: the sky forecast cut into segments, the brief's points as dated labels,
// the points measured now gathered in one label, the hours under the track. The drawing is in ui/frise.ts.
import type { AlertPoint, Slot, TickerPoint } from './view';
import { hourText, t } from './i18n';

const HOUR = 3600;
/** A forecast point less than 20 minutes away is « now ». */
const SOON = 20 * 60;
/** Forecast points less than an hour apart share a label: the timeline stays readable on a phone. */
const TOGETHER = HOUR;
/** The track shows at most the next 18 hours, at least 3. */
const LONGEST = 18 * HOUR, SHORTEST = 3 * HOUR;

/** A point of the timeline: a brief point, or an alert measured at home (it leads the « Maintenant » label, with its halo). */
export interface FriseItem {
  label: string; icon: string; text: string; theme?: string;
  /** Alert level: the measured alert, or a serious point (level 2 and more). */
  alert?: 1 | 2 | 3;
  at?: number; clock: string;
  /** Measured now, or less than 20 minutes away: in the « Maintenant » label. */
  now: boolean;
}
/** A label above the track: the points of now together, then the forecast points, those less than an hour apart together. `x` runs from 0 (now) to 1 (end of the track). */
export interface FriseGroup { items: number[]; x: number; clock: string; theme?: string; alert?: 1 | 2 | 3 }
export interface FriseSegment { kind: string; icon: string; flex: number }
export interface FriseMark { x: number; text: string; edge?: 'first' | 'last' }
/** The official vigilance over the track, from now to `to` (the end of the day it covers, or of the track). */
export interface FriseBand { to: number; level: 1 | 2 | 3 }
export interface Frise { items: FriseItem[]; groups: FriseGroup[]; segments: FriseSegment[]; marks: FriseMark[]; band?: FriseBand }

/** The colour family of a forecast hour on the track. */
const KINDS: Record<string, string> = {
  sunny: 'sun', 'clear-night': 'night', partlycloudy: 'partly', cloudy: 'cloud', fog: 'fog', rainy: 'rain', pouring: 'rain',
  lightning: 'storm', 'lightning-rainy': 'storm', snowy: 'snow', 'snowy-rainy': 'snow', hail: 'hail', windy: 'wind', 'windy-variant': 'wind', exceptional: 'cloud',
};
const kind = (s: Slot) => s.condition === 'sunny' && s.night ? 'night' : KINDS[s.condition] ?? 'cloud';
export const hourLabel = hourText;
const level = (n: number) => Math.min(3, Math.max(1, n)) as 1 | 2 | 3;

/** `timeline` comes from the integration (2.0.5 and later); without it, the timeline is made of the bubble's points and the alert measured at home. */
export function buildFrise(points: TickerPoint[], alerts: AlertPoint[], hours: Slot[], now: number, timeline?: TickerPoint[]): Frise {
  const dated = hours.filter((h): h is Slot & { time: number } => h.time !== undefined);
  const last = dated[dated.length - 1];
  const span = Math.max(SHORTEST, Math.min(LONGEST, last ? last.time + HOUR - now : LONGEST));
  const x = (t: number) => Math.max(0, Math.min(1, (t - now) / span));
  // A point the integration could not date (an older version, the air today) is a point of now.
  const timed = (at?: number, clock?: string) => ({ at, clock: clock ?? (at === undefined ? '' : hourLabel(new Date(at * 1000).getHours())), now: at === undefined || at <= now + SOON });
  const point = (p: TickerPoint): FriseItem => ({ label: p.label, icon: p.icon, text: p.text, theme: p.theme,
    alert: p.alert ? level(p.level) : p.level >= 2 ? level(p.level) : undefined, ...timed(p.at, p.clock) });
  const measured = alerts.filter(a => !a.official).map((a): FriseItem => ({ label: a.label ?? t('Maintenant'), icon: a.icon, text: a.text, alert: level(a.level), ...timed(a.at, a.clock) }));
  const all = timeline ? timeline.map(point) : [...measured, ...points.map(point)];
  const items = [...all.filter(i => i.now), ...all.filter(i => !i.now).sort((a, b) => a.at! - b.at!)];

  const group = (indexes: number[], at: number, clock: string): FriseGroup => {
    const alert = Math.max(0, ...indexes.map(i => items[i].alert ?? 0));
    return { items: indexes, x: x(at), clock, theme: items[indexes[0]].theme, alert: alert ? level(alert) : undefined };
  };
  const present = items.flatMap((i, n) => i.now ? [n] : []);
  const coming: number[][] = [];
  items.forEach((i, n) => {
    if (i.now) return;
    const last = coming[coming.length - 1];
    if (last && i.at! - items[last[0]].at! < TOGETHER) last.push(n); else coming.push([n]);
  });
  const groups = [...(present.length ? [group(present, now, t('Maintenant'))] : []), ...coming.map(g => group(g, items[g[0]].at!, items[g[0]].clock))];

  const segments: FriseSegment[] = [];
  for (const h of dated) {
    const from = Math.max(h.time, now), to = Math.min(h.time + HOUR, now + span);
    if (to <= from) continue;
    // One segment per kind of sky: light and heavy rain make one rain segment; only the partly cloudy day and night keep apart.
    const k = kind(h), previous = segments[segments.length - 1];
    if (previous && previous.kind === k && (k !== 'partly' || previous.icon === h.icon)) previous.flex += to - from;
    else segments.push({ kind: k, icon: h.icon, flex: to - from });
  }

  // A sliver of sky (under 3 % of the track, often the last minutes of the span) joins its neighbour: no stub at the end.
  const total = segments.reduce((t, s) => t + s.flex, 0);
  for (let i = segments.length - 1; i >= 0 && segments.length > 1; i--) {
    if (segments[i].flex >= total * .03) continue;
    segments[i ? i - 1 : 1].flex += segments[i].flex; segments.splice(i, 1);
  }

  // The hours under the track every three hours from now (2 November, as the maquette): « Maintenant, 1 h, 4 h, 7 h… ».
  const marks: FriseMark[] = [{ x: 0, text: t('Maintenant'), edge: 'first' }];
  for (let k = 1; k * 3 * HOUR <= span + 1; k++) {
    const target = now + k * 3 * HOUR, h = dated.find(s => Math.abs(s.time - target) <= HOUR / 2);
    if (h) marks.push({ x: x(h.time), text: hourLabel(h.hour), edge: x(h.time) > .97 ? 'last' : undefined });
  }

  // Météo-France's vigilance holds for the day: its band runs to midnight, or to the end of the track.
  const official = alerts.filter(a => a.official);
  // Midnight read on the forecast hours, in the home's time zone (not the browser's).
  const midnight = dated.find(h => h.hour === 0 && h.time > now)?.time;
  const band = official.length ? { to: midnight === undefined ? 1 : x(midnight), level: level(Math.max(...official.map(a => a.level))) } : undefined;

  return { items, groups, segments, marks, band };
}
