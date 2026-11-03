// LECTURE COMMUNE HESTIA — la grande température et son mini–maxi, la même dans toutes les cartes (Weather, Confort).
// Modifier ICI, puis recopier avec charte/copier.sh dans chaque carte : jamais directement dans une brique. Son style : .nw-reading de hestia-charte.css.
import { html, nothing, type TemplateResult } from 'lit';

export interface Lecture {
  /** The figure as the card writes it (« 21,6 »), and its unit (« °C »). */
  value: string; unit: string;
  /** Today's or the last 24 hours' low and high, already written (« 18,2 », « 22,8 »). */
  low?: string; high?: string;
  /** What the low and high are, for the tooltip and screen readers. */
  rangeTitle?: string;
  /** What the figure is, for screen readers; a tap opens its details when given. */
  label?: string; onTap?: (e: Event) => void; tapTitle?: string;
  /** A last line under the low and high, aligned the same way (Weather's trend: « ↑ +6,6 °C/h »). */
  more?: unknown;
}

/** The temperature and, right-aligned under its figures (after the decimal, before the unit), its low and high: « 18,2 – 22,8° ». */
export function lecture(l: Lecture): TemplateResult {
  const range = l.low !== undefined && l.high !== undefined ? `${l.low} – ${l.high}°` : l.low ?? l.high ? `${l.low ?? l.high}°` : '';
  const temp = html`<b class="nw-temp" aria-label=${l.label ?? nothing}>${l.value}<sup>${l.unit}</sup></b>`;
  return html`<div class="nw-reading">
    ${l.onTap ? html`<button type="button" class="nw-reading-tap" title=${l.tapTitle ?? nothing} @click=${l.onTap}>${temp}</button>` : temp}
    ${range ? html`<span class="nw-range" title=${l.rangeTitle ?? nothing} aria-label=${l.rangeTitle ?? nothing}>${range}</span>` : nothing}
    ${l.more ? html`<span class="nw-reading-more">${l.more}</span>` : nothing}
  </div>`;
}
