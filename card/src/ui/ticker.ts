import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from './define';
import type { AlertPoint, TickerPoint } from '../view';
import { keyed } from 'lit/directives/keyed.js';
import { colon } from '../i18n';
import { shared } from './charter';

/** A point of the scrolling bubble: a brief point, or an alert that had no room of its own. */
export type TickerItem = TickerPoint | (AlertPoint & { alert: true });

/** Every point stays 5 s. */
const STEP = 5000;
/** The point's colour: an alert takes its level's, a brief point its theme's. */
const tone = (p: TickerItem) => `--tone:var(--nw-${'official' in p || ('alert' in p && p.alert) ? `level${Math.min(3, Math.max(1, p.level))}` : p.theme ?? (p.level >= 2 ? `level${Math.min(3, p.level)}` : 'calm')})`;

/**
 * Shows the points one at a time, every 5 s, as the timeline's sentence (3 November, as the maquette's folded tile):
 * a large tinted icon, the label in small grey capitals, the sentence in bold, one bar per point; no halo. Hovering or focusing the card pauses it.
 * When the list changes (the tile unfolds), the bubble on screen stays if it is still in the list: nothing moves.
 */
@define('hestia-ticker')
export class HestiaTicker extends LitElement {
  @property({ attribute: false }) points: TickerItem[] = [];
  @state() private index = 0;
  @state() private leaving = false;
  private timer?: ReturnType<typeof setInterval>;
  private swap?: ReturnType<typeof setTimeout>;
  private shown?: string;

  connectedCallback() {
    super.connectedCallback();
    // Home Assistant may move the card mid-fade: a cancelled swap must not leave the bubble transparent.
    this.leaving = false; this.timer = setInterval(() => this.next(), STEP);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this.timer); clearTimeout(this.swap); }

  protected willUpdate(changed: Map<PropertyKey, unknown>) {
    if (!changed.has('points')) return;
    const keep = this.points.findIndex(p => p.text === this.shown);
    if (keep >= 0) { this.index = keep; return; }
    if (this.shown === undefined || this.reduced) { this.index = 0; return; }
    // The bubble on screen is gone from the list: it fades out, the first one fades in.
    this.leaving = true; clearTimeout(this.swap);
    this.swap = setTimeout(() => { this.index = 0; this.leaving = false; }, 300);
  }
  private get reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  private next() {
    const card = (this.getRootNode() as ShadowRoot).host;
    if (this.points.length < 2 || document.hidden || card?.matches(':hover, :focus-within')) return;
    const advance = () => { this.index = (this.index + 1) % this.points.length; this.leaving = false; };
    if (this.reduced) { advance(); return; }
    this.leaving = true; this.swap = setTimeout(advance, 350);
  }
  protected render() {
    const point = this.points[this.index % Math.max(1, this.points.length)];
    this.shown = point?.text;
    if (!point) return nothing;
    const n = this.index % this.points.length;
    return html`<div class="say nw-glass" aria-hidden="true" style=${tone(point)}>
      ${keyed(n, html`<div class=${`item${this.leaving ? ' out' : ''}`}><span class="badge"><ha-icon icon=${point.icon}></ha-icon></span>
        <div class="txt">${point.label ? html`<div class="when">${point.label}</div>` : nothing}<div class="x" title=${point.text}>${point.text}</div></div></div>`)}
      ${this.points.length > 1 ? html`<span class="progress" style=${`--step:${STEP}ms`}>${this.points.map((_, i) => i === n
        ? keyed(`on-${n}`, html`<i class="on"></i>`) : html`<i class=${i < n ? 'done' : ''}></i>`)}</span>` : nothing}</div>
      <ul class="sr">${this.points.map(p => html`<li>${p.label ? colon(p.label, p.text) : p.text}</li>`)}</ul>`;
  }
  static styles = [shared, css`
    :host { display:block; min-width:0; color:var(--nw-fg); }
    ha-icon { display:flex; line-height:0; }
    /* The timeline's frame is the charter's glass (.nw-glass): no shadow nor halo. */
    .say { display:flex; align-items:center; gap:12px; padding:12px 14px; box-sizing:border-box; }
    .item { flex:1; min-width:0; display:flex; align-items:center; gap:12px; animation:swap .28s var(--nw-ease) both; transition:opacity .3s, transform .3s; }
    .item.out { opacity:0; transform:translateY(-6px); }
    @keyframes swap { from { opacity:0; transform:translateY(8px); } }
    .badge { display:grid; place-items:center; width:36px; height:36px; flex:none; border-radius:11px; background:color-mix(in oklab, var(--tone) 34%, transparent); }
    .badge ha-icon { --mdc-icon-size:18px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .txt { min-width:0; }
    .when { font-size:var(--nw-fs-label); line-height:14px; letter-spacing:.08em; text-transform:uppercase; font-weight:650; white-space:nowrap; color:var(--nw-fg2); }
    .x { font-size:var(--nw-fs-text); line-height:20px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    /* One bar per point, narrower when there are many: on a phone, eight points never push the tile past its frame. */
    .progress { display:flex; gap:4px; flex:0 1 auto; min-width:0; align-self:flex-start; margin-top:6px; }
    .progress i { position:relative; flex:0 1 16px; min-width:6px; height:3px; border-radius:2px; background:var(--nw-line); overflow:hidden; }
    .progress i.done { background:color-mix(in srgb, var(--nw-fg2) 60%, transparent); }
    .progress i.on::after { content:''; position:absolute; inset:0; background:var(--nw-fg2); transform-origin:left; animation:fill var(--step) linear forwards; animation-play-state:var(--nw-motion, running); }
    @keyframes fill { from { transform:scaleX(0); } }
    @media (prefers-reduced-motion:reduce) { .item { animation:none; transition:none; } .progress i.on::after { animation:none; } }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
  `];
}
