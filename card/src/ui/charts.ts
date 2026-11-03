// The small history charts, drawn from the integration's points in a 100 × 50 box. Only drawing here: the points come computed.
import type { Point } from '../view';

/** Height of the drawing box; the width is always 100, the chart's whole span. */
export const CHART_HEIGHT = 50;
/** Six hours, unless the chart says otherwise (the pressure over a day or a week). */
const SPAN = 6 * 3600;
export interface ChartPaths { line: string; area: string }
/** A value posed on a chart: its position in % of the chart box, and its text. */
export interface ChartPill { x: number; y: number; text: string }

/** The newest point of the series, in seconds: the right edge of the chart. */
export const chartEnd = (...series: Point[][]) => Math.max(0, ...series.flatMap(s => s.length ? [s[s.length - 1][0]] : []));

/** Vertical position of a value in the box, with room above for the value pills. */
export const chartY = (value: number, top: number, bottom = 0) => CHART_HEIGHT - 2 - (value - bottom) / Math.max(1e-6, top - bottom) * (CHART_HEIGHT - 6);

/** Shape-preserving cubic curves: no overshoot, and never joined across unavailable data. */
export function curvePaths(series: Point[], top: number, end: number, bottom = 0, span = SPAN): ChartPaths[] {
  const segments: Point[][] = []; let segment: Point[] = [];
  for (const p of series) { if (p[1] === null) { if (segment.length > 1) segments.push(segment); segment = []; } else segment.push(p); }
  if (segment.length > 1) segments.push(segment);
  return segments.map(group => {
    const coords = group.map(([t, v]) => ({ x: (t - (end - span)) / span * 100, y: chartY(v!, top, bottom) }));
    const slopes = coords.slice(1).map((p, i) => (p.y - coords[i].y) / (p.x - coords[i].x));
    const tangents = coords.map((_, i) => i === 0 ? slopes[0] : i === coords.length - 1 ? slopes.at(-1)! : slopes[i - 1] * slopes[i] <= 0 ? 0 : 2 / (1 / slopes[i - 1] + 1 / slopes[i]));
    slopes.forEach((s, i) => {
      if (s === 0) { tangents[i] = 0; tangents[i + 1] = 0; return; }
      const norm = Math.hypot(tangents[i] / s, tangents[i + 1] / s);
      if (norm > 3) { tangents[i] *= 3 / norm; tangents[i + 1] *= 3 / norm; }
    });
    const f = (v: number) => v.toFixed(2);
    let line = `M${f(coords[0].x)},${f(coords[0].y)}`;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i], dx = (b.x - a.x) / 3;
      line += ` C${f(a.x + dx)},${f(a.y + tangents[i - 1] * dx)} ${f(b.x - dx)},${f(b.y - tangents[i] * dx)} ${f(b.x)},${f(b.y)}`;
    }
    return { line, area: `${line} L${f(coords.at(-1)!.x)},${CHART_HEIGHT} L${f(coords[0].x)},${CHART_HEIGHT} Z` };
  });
}

/** The highest and lowest points of a curve, as pills on the chart; one pill when the curve is flat. */
export function extremePills(series: Point[], end: number, y: (v: number) => number, text: (v: number) => string, span = SPAN): ChartPill[] {
  const valid = series.filter((p): p is [number, number] => p[1] !== null);
  if (valid.length < 2) return [];
  const hi = valid.reduce((a, b) => b[1] > a[1] ? b : a), lo = valid.reduce((a, b) => b[1] < a[1] ? b : a);
  const x = (t: number) => Math.min(92, Math.max(8, (t - (end - span)) / span * 100));
  const pill = ([t, v]: [number, number]) => ({ x: x(t), y: y(v) / CHART_HEIGHT * 100, text: text(v) });
  // A line that hardly moves (less than 1) says nothing more with a pill on it (2 November).
  if (hi[1] - lo[1] < 1) return [];
  return text(hi[1]) === text(lo[1]) ? [pill(hi)] : [pill(hi), pill(lo)];
}
