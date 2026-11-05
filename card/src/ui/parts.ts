// The charter's pieces as templates. Views assemble these; they never write a pill or a bubble by hand.
import { html, nothing, svg, type TemplateResult } from 'lit';
import type { AlertPoint, Chip, TickerPoint } from '../view';
import { numberFormat } from '../intl-cache';
import { currentLocale, t } from '../i18n';
import './marquee';

/** A number in the user's language, at most `digits` decimals (exactly `digits` when `fixed`). */
export const nf = (v: number, digits = 1, fixed = false) => numberFormat(currentLocale(), { maximumFractionDigits: digits, minimumFractionDigits: fixed ? digits : 0 }).format(v);
/** A number stays with its unit at the end of a line: « (6 °C) » is never cut after the 6. */
export const unbroken = (text: string) => text.replace(/(\d) (°C|km\/h|mm|%|hPa)/g, '$1\u00a0$2');
/** The colour of a meaning token, for `--c`. */
export const tint = (theme: string) => `--c:var(--nw-${theme})`;
/** Colour of a temperature, from cold (5 °C) to heat (30 °C), mixed from the palette. */
export const tempColor = (t: number) => `color-mix(in oklab,var(--nw-heat) ${Math.round(Math.min(100, Math.max(0, (t - 5) / 25 * 100)))}%,var(--nw-cold))`;
/** Opens the entity's more-info when the card is tapped there. */
export const entity = (id?: string) => id ?? nothing;

export const label = (text: string) => html`<span class="nw-label">${text}</span>`;
export const badge = (text: string) => html`<span class="nw-badge" title=${text}>${text}</span>`;

export function chip(c: Chip): TemplateResult {
  return html`<span class="nw-chip" style=${tint(c.theme)} data-entity=${entity(c.entity)} role=${c.entity ? 'button' : nothing} tabindex=${c.entity ? 0 : nothing}>
    <ha-icon icon=${c.icon}></ha-icon>${c.value ? html`<b>${c.value}</b>` : nothing}${c.label}</span>`;
}

/** A brief bubble: its icon takes the colour of its theme; the outline stays neutral. */
export function bubble(p: TickerPoint, extraClass = ''): TemplateResult {
  return html`<p class=${`nw-bubble ${extraClass}`} data-theme=${p.theme ?? nothing} style=${p.theme ? tint(p.theme) : nothing}>
    <ha-icon icon=${p.icon}></ha-icon><span class="nw-label">${p.label}</span><b title=${p.text}>${p.text}</b></p>`;
}

/** An alert bubble: the same shape, tinted by its level, with its halo. */
export function alertBubble(a: AlertPoint, extraClass = ''): TemplateResult {
  return html`<p class=${`nw-bubble nw-bubble--alert nw-level${a.level} ${extraClass}`} role="status">
    <ha-icon icon=${a.icon}></ha-icon>${a.label ? html`<span class="nw-label">${a.label}</span>` : nothing}<b title=${a.text}>${a.text}</b></p>`;
}

/** The official vigilance in the banner: « Vigilance orange · Orages », as a pill with its halo, the whole width of its line.
 *  A text too long for it scrolls in a loop (ui/marquee.ts); its second copy is only there for the loop, screen readers skip it. */
export function alertPill(a: AlertPoint): TemplateResult {
  const words = html`${a.label ? html`<b>${a.label}<span class="sep"> · </span></b>` : nothing}${a.text}`;
  return html`<p class=${`nw-alert nw-level${a.level}`} role="status" title=${a.source} data-entity=${entity(a.entity)}>
    <span class="dot"><ha-icon icon=${a.icon}></ha-icon></span><hestia-weather-marquee><span class="run">${words}</span><span class="run" aria-hidden="true">${words}</span></hestia-weather-marquee></p>`;
}

/** The sixteen points of the compass, in the user's language (« SO » in French, « SW » in English). */
/** Where the wind comes from, as a point of the compass. */
export const rose = (deg: number) => t('N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO').split(' ')[Math.round(((deg % 360 + 360) % 360) / 22.5) % 16];

/** The wind of a forecast in words: « Vent du SO 12 km/h, rafales 30 km/h »; `upTo` for a day's strongest wind (« jusqu’à 30 km/h »). */
export function windTip(speed: string | number, bearing?: number, gust?: string | number, upTo = false): string {
  const from = bearing === undefined ? '' : rose(bearing);
  const wind = upTo ? (from ? t('Vent du {from} jusqu’à {speed} km/h', { from, speed }) : t('Vent jusqu’à {speed} km/h', { speed }))
    : from ? t('Vent du {from} {speed} km/h', { from, speed }) : t('Vent {speed} km/h', { speed });
  return gust === undefined ? wind : `${wind}${t(', rafales {gust} km/h', { gust })}`;
}

/** An arrow pointing where the wind goes (the bearing is where it comes from). */
export const windArrow = (bearing: number) => html`<i class="nw-trend wind" aria-hidden="true" style=${`--r:${Math.round(bearing + 180)}deg`}></i>`;

export interface Explanation { title: string; text: unknown; example?: unknown }
/** The « i » button and its explanation bubble. `id` must be unique in the card. */
export function info(id: string, e: Explanation): TemplateResult {
  return html`<button class="nw-info" type="button" popovertarget=${id} aria-label=${t('Qu’est-ce que : {title} ?', { title: e.title })} @click=${stop}></button>
    <div class="nw-pop" id=${id} popover style=${`--nw-example-word:"${t('Exemple')}"`} @toggle=${place} @click=${stop}><b>${e.title}</b>${e.text}${e.example ? html`<div class="ex">${e.example}</div>` : nothing}</div>`;
}
const stop = (event: Event) => event.stopPropagation();
/** Opens the bubble under its button, without leaving the screen. */
function place(event: Event) {
  const pop = event.currentTarget as HTMLElement;
  if ((event as ToggleEvent).newState !== 'open') return;
  const button = (pop.getRootNode() as ShadowRoot).querySelector(`[popovertarget="${pop.id}"]`);
  if (!button) return;
  const r = button.getBoundingClientRect();
  pop.style.top = `${Math.max(8, Math.min(r.bottom + 8, innerHeight - pop.offsetHeight - 8))}px`;
  pop.style.left = `${Math.max(8, Math.min(r.left - 12, innerWidth - pop.offsetWidth - 8))}px`;
}

/** The source of a panel, behind a small « i » next to its title (2 November: no more source pill, no sources line at the foot). */
export const sourceInfo = (key: string, title: string, source: string) =>
  info(`src-${key.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}`, { title, text: t('Source : {source}', { source }) });

/** Panel header: tinted icon, title and its « i » (the panel's own explanation, which then gives the source, or the source alone),
 *  then `end` on the right (the today/tomorrow tabs). `key` tells apart two panels of the same title. */
export function panelHead(icon: string, theme: string, title: string, source: string, explain?: TemplateResult, o: { key?: string; end?: unknown; aside?: string } = {}): TemplateResult {
  return html`<header class="nw-panel-head"><span class="nw-panel-icon" style=${tint(theme)}><ha-icon icon=${icon}></ha-icon></span>
    <h3><span>${title}</span>${explain ?? (source ? sourceInfo(o.key ?? title, title, source) : nothing)}</h3>${o.aside ? html`<span class="aside">${o.aside}</span>` : nothing}${o.end ?? nothing}</header>`;
}

/** Legend entry: a line, a square or a dashed line in a colour. */
export const legend = (text: string, color: string, shape: '' | 'sq' | 'dash' = '') =>
  html`<span><i class=${shape} style=${shape === 'dash' ? `--c:${color}` : `background:${color}`}></i>${text}</span>`;
