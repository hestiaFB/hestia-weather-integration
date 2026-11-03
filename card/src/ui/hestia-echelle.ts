// ÉCHELLE COMMUNE HESTIA — la construction de l'échelle façon fil, la même dans toutes les cartes (Ressenti de Weather, température de Confort).
// Modifier ICI, puis recopier avec charte/copier.sh dans chaque carte : jamais directement dans une brique. Son style : .nw-scale-* de hestia-charte.css.
import { html, nothing, type TemplateResult } from 'lit';

/** A part of the track: from one value to another, its word written inside when it fits, its colour (a charter token). */
export interface EchellePart { from: number; to: number; word?: string; tone: string }
/** A label over (« up ») or under (« down ») the track, at a value. A strong label may move to the other row rather than be dropped. */
export interface EchelleMark { value: number; text: TemplateResult | string; row?: 'up' | 'down'; strong?: boolean; chars?: number }
export interface Echelle {
  lo: number; hi: number; parts: EchellePart[];
  /** What the scale says, for screen readers. */
  label: string;
  /** The value: its bubble tinted like its part, a fine stem, the small dot on the track. */
  value?: number; valueText?: string; onValue?: (e: Event) => void; valueTitle?: string;
  /** The thresholds under the track: every part's bounds and both ends, in this format. */
  degree: (v: number) => string;
  /** More labels (the rooms, over the track). */
  marks?: EchelleMark[];
  /** The last 24 hours, as a thin line over the track. */
  span?: [number, number];
  /** Outside: a hollow ring on the track with its label under it; off the scale, the ring sits at the edge (no arrow, 3 November). */
  outside?: { value: number; label: string; onTap?: (e: Event) => void; title?: string };
  /** More markers on the track (the rooms of the home card). */
  dots?: unknown;
}

/** The share of the track for a value, clamped to the ends. */
export const echellePos = (e: Pick<Echelle, 'lo' | 'hi'>, v: number) => (Math.min(e.hi, Math.max(e.lo, v)) - e.lo) / (e.hi - e.lo) * 100;

export function echelle(e: Echelle): TemplateResult {
  const pos = (v: number) => echellePos(e, v), x = e.value === undefined ? undefined : pos(e.value);
  const lane = e.parts.map((p, i) => {
    const w = pos(p.to) - pos(p.from), r = x === undefined ? -1 : (x - pos(p.from)) / (w || 1);
    // The part's word steps aside from the value's dot to stay readable.
    const aside = r > .2 && r < .8 ? (r < .5 ? ' wr' : ' wl') : '';
    return html`<i class=${`nw-scale-part${aside}`} style=${`flex:${w};--tone:${p.tone};--n:${i}`}>${p.word ? html`<span>${p.word}</span>` : nothing}</i>`;
  });
  const tone = e.value === undefined ? 'var(--nw-fg2)'
    : (e.parts.find(p => e.value! >= p.from && e.value! < p.to) ?? (e.value < e.lo ? e.parts[0] : e.parts[e.parts.length - 1]))?.tone ?? 'var(--nw-fg2)';

  // Labels never overlap: the strong ones first, each in its row, or in the other one when it is taken.
  const thresholds: EchelleMark[] = [e.lo, ...e.parts.slice(1).map(p => p.from), e.hi]
    .filter((v, i, all) => all.indexOf(v) === i).map(v => ({ value: v, text: e.degree(v), row: 'down', strong: v !== e.lo && v !== e.hi }));
  // Outside off the scale: its ring at the edge it passes, its label there, before the threshold of that end.
  const out = e.outside;
  const labels = [...(out ? [{ value: out.value, text: html`<b>${out.label}</b>`, row: 'down' as const, strong: true, chars: 12 }] : []), ...thresholds, ...(e.marks ?? [])];
  const taken: Array<[number, number, string]> = x === undefined ? [] : [[x - 10, x + 10, 'up']];
  const placed = labels.map(l => ({ ...l, x: pos(l.value) })).sort((a, b) => Number(b.strong ?? true) - Number(a.strong ?? true)).flatMap(l => {
    const chars = l.chars ?? (typeof l.text === 'string' ? l.text.length : 6), half = chars * 6.6 / 320 * 100 / 2 + 1.5;
    const free = (row: string) => taken.every(([a, z, r]) => r !== row || l.x + half < a || l.x - half > z);
    const want = l.row ?? 'up', other = want === 'up' ? 'down' : 'up';
    const row = free(want) ? want : (l.strong ?? true) && free(other) ? other : null;
    if (!row) return [];
    taken.push([l.x - half, l.x + half, row]);
    const edge = l.x < 4 ? ' first' : l.x > 96 ? ' last' : '';
    return [html`<span class=${`nw-scale-lb${row === 'up' ? ' up' : ''}${edge}`} style=${`left:${edge === ' first' ? 0 : edge === ' last' ? 100 : l.x.toFixed(2)}%`}>${l.text}</span>`];
  });

  const edge = x === undefined ? '' : x < 10 ? ' edge-l' : x > 90 ? ' edge-r' : '';
  const at = x === undefined ? '' : `left:${x.toFixed(2)}%;--tone:${tone}`;
  const ring = !out ? nothing : out.onTap
    ? html`<button type="button" class="nw-scale-mk" style=${`left:${pos(out.value).toFixed(2)}%`} title=${out.title ?? out.label} aria-label=${out.title ?? out.label} @click=${out.onTap}></button>`
    : html`<span class="nw-scale-mk" style=${`left:${pos(out.value).toFixed(2)}%`}></span>`;
  return html`<div class="nw-scale" role="img" aria-label=${e.label}>
    <div class="nw-scale-lane">${lane}</div>
    ${e.span ? html`<div class="nw-scale-span" style=${`left:${pos(e.span[0]).toFixed(2)}%;width:${(pos(e.span[1]) - pos(e.span[0])).toFixed(2)}%`}></div>` : nothing}
    ${ring}
    ${e.dots ?? nothing}
    ${x === undefined ? nothing : html`<i class="nw-scale-stem" style=${at}></i><i class="nw-dot" style=${`left:${x.toFixed(2)}%`}></i>
      ${e.onValue ? html`<button type="button" class=${`nw-scale-pin${edge}`} style=${at} title=${e.valueTitle ?? ''} @click=${e.onValue}>${e.valueText}</button>`
        : html`<span class=${`nw-scale-pin${edge}`} style=${at}>${e.valueText}</span>`}`}
    ${placed}
  </div>`;
}
