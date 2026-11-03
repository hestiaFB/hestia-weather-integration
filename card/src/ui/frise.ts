// The banner's timeline, drawn: a sentence that scrolls through the points over a track cut by the forecast sky,
// the points as dated labels above it. The labels are placed after measuring, so they never overlap; when they cannot all fit, they keep only their icons.
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { colon, t } from '../i18n';
import { property, state } from 'lit/decorators.js';
import { define } from './define';
import { shared } from './charter';
import { buildFrise, type Frise, type FriseGroup, type FriseItem } from '../frise';
import type { AlertPoint, Slot, TickerPoint } from '../view';

/** Each point stays 4.5 s; a tap on a label holds it 9 s. */
const STEP = 4500, HOLD = 9000;
/** Rebuilt every 5 minutes even when the view does not change: « now » moves along the track. */
const STALE = 300;
/** Gap between two labels, and how far a label may pass the edge of the track. */
/** A label may pass the track's ends by the half-width of the dot of now (7 px), no more: it keeps clear of the frame (3 November). */
const GAP = 6, EDGE = 7;

const tone = (i: FriseItem) => `--tone:var(--nw-${i.theme ?? (i.alert ? `level${i.alert}` : 'calm')})`;
const stop = (e: Event) => e.stopPropagation();

@define('hestia-frise')
export class HestiaFrise extends LitElement {
  @property({ attribute: false }) points: TickerPoint[] = [];
  @property({ attribute: false }) alerts: AlertPoint[] = [];
  @property({ attribute: false }) hours: Slot[] = [];
  /** The integration's own list for the timeline (2.0.5 and later). */
  @property({ attribute: false }) timeline?: TickerPoint[];
  /** The point on show. */
  @state() private index = 0;
  /** The point sliding out, for the length of its transition. */
  @state() private leaving?: number;
  @state() private paused = false;
  /** How long the point on show stays: its progress bar fills in that time. */
  @state() private step = STEP;
  private frise: Frise = buildFrise([], [], [], 0);
  private built = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private leave?: ReturnType<typeof setTimeout>;
  private due = 0;
  private left = STEP;
  private resize?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this.schedule(STEP);
    if (this.hasUpdated) this.observe();
  }
  disconnectedCallback() { super.disconnectedCallback(); clearTimeout(this.timer); clearTimeout(this.leave); this.resize?.disconnect(); }

  protected willUpdate(changed: PropertyValues<this>) {
    const now = Date.now() / 1000;
    if (!changed.has('points') && !changed.has('alerts') && !changed.has('hours') && !changed.has('timeline') && now - this.built < STALE) return;
    const shown = this.frise.items[this.index]?.text;
    this.frise = buildFrise(this.points, this.alerts, this.hours, now, this.timeline); this.built = now;
    // The point on show stays on show if it is still there: nothing moves when the view is refreshed.
    const keep = this.frise.items.findIndex(i => i.text === shown);
    this.index = keep >= 0 ? keep : 0; this.leaving = undefined;
  }
  protected firstUpdated() { this.observe(); }
  protected updated() { this.layout(); }
  private observe() {
    const track = this.renderRoot.querySelector('.track');
    if (!track || typeof ResizeObserver === 'undefined') return;
    this.resize?.disconnect();
    this.resize = new ResizeObserver(() => this.layout()); this.resize.observe(track);
  }

  // ---- The scrolling: one timer, paused while the pointer or the focus is on the timeline. ----
  private schedule(delay: number) {
    clearTimeout(this.timer);
    this.step = delay; this.left = delay; this.due = Date.now() + delay;
    if (!this.paused) this.timer = setTimeout(() => this.next(), delay);
  }
  private next() {
    if (Date.now() / 1000 - this.built >= STALE) this.requestUpdate();
    const count = this.frise.items.length;
    if (count < 2 || document.hidden) { this.schedule(STEP); return; }
    this.show((this.index + 1) % count, STEP);
  }
  private show(n: number, delay: number) {
    if (n !== this.index) {
      this.leaving = this.index; this.index = n;
      clearTimeout(this.leave); this.leave = setTimeout(() => { this.leaving = undefined; }, 460);
    }
    this.schedule(delay);
  }
  /** A tap on a label shows its first point; another tap goes to the next point of the same label. */
  private pick(g: FriseGroup) {
    const k = g.items.indexOf(this.index);
    this.show(k < 0 ? g.items[0] : g.items[(k + 1) % g.items.length], HOLD);
  }
  private pause = (e: Event) => {
    if ((e as PointerEvent).pointerType === 'touch' || this.paused) return;
    this.paused = true; clearTimeout(this.timer); this.left = Math.max(300, this.due - Date.now());
  };
  private resume = (e: Event) => {
    if ((e as PointerEvent).pointerType === 'touch' || !this.paused || (e.type === 'pointerleave' && this.matches(':focus-within'))) return;
    this.paused = false; this.due = Date.now() + this.left; this.timer = setTimeout(() => this.next(), this.left);
  };

  // ---- Measured placement: labels keep apart and inside the frame, hours never touch, small segments lose their icon. ----
  private layout() {
    const track = this.renderRoot.querySelector<HTMLElement>('.track'), width = track?.clientWidth;
    if (!track || !width) return;
    const pins = [...track.querySelectorAll<HTMLElement>('.pin')];
    // Too many labels for the width (a phone): they keep only their icons, the time stays in the sentence above.
    track.classList.remove('compact');
    const room = (list: HTMLElement[]) => list.reduce((sum, p) => sum + p.offsetWidth + GAP, -GAP) <= width + 2 * EDGE;
    if (!room(pins)) track.classList.add('compact');
    const w = pins.map(p => p.offsetWidth), x = pins.map(p => Number(p.dataset.x) * width);
    x.forEach((v, i) => { x[i] = Math.max(v, w[i] / 2 - EDGE, i ? x[i - 1] + (w[i - 1] + w[i]) / 2 + GAP : -Infinity); });
    for (let i = x.length - 1; i >= 0; i--) x[i] = Math.min(x[i], i === x.length - 1 ? width - w[i] / 2 + EDGE : x[i + 1] - (w[i + 1] + w[i]) / 2 - GAP);
    // The stem stays above the label's true time (« Maintenant » over the dot of now), off-centre if the label had to move, never past its rounded ends.
    pins.forEach((p, i) => {
      p.style.left = `${Math.round(x[i])}px`;
      const shift = Number(p.dataset.x) * width - x[i], room = w[i] / 2 - 6;
      p.style.setProperty('--sx', `${Math.round(Math.max(-room, Math.min(room, shift)))}px`);
    });
    track.querySelectorAll<HTMLElement>('.seg').forEach(s => s.classList.toggle('tight', s.clientWidth < 28));
    const marks = [...this.renderRoot.querySelectorAll<HTMLElement>('.hours span')];
    marks.forEach(m => m.classList.remove('hide'));
    if (marks.length < 3) return;
    const end = marks[marks.length - 1].getBoundingClientRect();
    let previous = marks[0].getBoundingClientRect();
    for (const m of marks.slice(1, -1)) {
      const r = m.getBoundingClientRect();
      if (r.left < previous.right + 18 || r.right > end.left - 18) m.classList.add('hide'); else previous = r;
    }
  }

  protected render() {
    const { items, groups, segments, marks, band } = this.frise;
    if (!items.length && !segments.length) return nothing;
    const when = (i: FriseItem) => i.now || !i.clock ? i.label : `${i.label} · ${i.clock}`;
    return html`<div class=${`panel nw-glass${this.paused ? ' paused' : ''}`} @pointerenter=${this.pause} @pointerleave=${this.resume} @focusin=${this.pause} @focusout=${this.resume}>
      ${items.length ? html`<div class="head" aria-hidden="true">
        <div class="say">${items.map((i, n) => html`<div class=${`item${n === this.index ? ' on' : n === this.leaving ? ' off' : ''}${i.alert ? ' al' : ''}`}
          style=${`${tone(i)}${i.alert ? `;--al:var(--nw-level${i.alert})` : ''}`}>
          <span class="badge"><ha-icon icon=${i.icon}></ha-icon></span><div><div class="when">${when(i)}</div><div class="x" title=${i.text}>${i.text}</div></div></div>`)}</div>
        ${items.length > 1 ? html`<div class="progress" style=${`--step:${this.step}ms`}>${items.map((_, n) => html`<i class=${n === this.index ? 'on' : n < this.index ? 'done' : ''}></i>`)}</div>` : nothing}
      </div>` : nothing}
      <div class=${`track${groups.length ? '' : ' bare'}`}>
        <div class="chips">${groups.map((g, k) => {
          // The whole label takes the colour of the point on show: its background, the rings of its icons, the icon in front.
          // One icon per point, always in the same order: only the emphasis moves to the one on show (3 November); the count says how many share the time.
          const active = g.items.includes(this.index), lead = items[active ? this.index : g.items[0]];
          const shown = g.items;
          return html`<button type="button" class=${`pin${active ? ' on' : ''}${g.alert ? ' al' : ''}`} data-x=${g.x}
            style=${`left:${(g.x * 100).toFixed(2)}%;--k:${k};${tone(lead)}${g.alert ? `;--al:var(--nw-level${g.alert})` : ''}`}
            aria-label=${g.items.map(n => colon(when(items[n]), items[n].text)).join(t(' ; '))} @click=${() => this.pick(g)} @pointerdown=${stop}>
            <span class="chip">${shown.map(n => html`<ha-icon class=${active && g.items.length > 1 ? (n === this.index ? 'cur' : 'dim') : ''} icon=${items[n].icon}></ha-icon>`)}${g.clock === t('Maintenant') ? nothing : html`<span class="clock">${g.clock}</span>`}${g.items.length > 1 ? html`<span class="count">${g.items.length}</span>` : nothing}</span>
            <span class="stem"></span></button>`;
        })}</div>
        ${band ? html`<i class="vigil" style=${`width:${(band.to * 100).toFixed(2)}%;--al:var(--nw-level${band.level})`}></i>` : nothing}
        <div class="lane">${segments.length ? segments.map((s, n) => html`<span class=${`seg s-${s.kind}`} style=${`flex:${s.flex};--n:${n}`}><ha-icon icon=${s.icon}></ha-icon></span>`)
          : html`<span class="seg s-cloud" style="flex:1"></span>`}</div>
        <span class="needle"></span>
        ${(() => { const on = groups.find(g => g.items.includes(this.index));
          // The label on show, away from now: a small dot where its stem meets the track, as the scales' value (3 November).
          return on && on.x > 0 ? html`<i class="nw-dot mark" style=${`left:${(on.x * 100).toFixed(2)}%`}></i>` : nothing; })()}
      </div>
      ${segments.length ? html`<div class="hours" aria-hidden="true">${marks.map(m => html`<span class=${m.edge ?? ''} style=${`left:${(m.x * 100).toFixed(2)}%`}>${m.text}</span>`)}</div>` : nothing}
      <ul class="sr">${items.map(i => html`<li>${colon(when(i), i.text)}</li>`)}</ul>
    </div>`;
  }

  static styles = [shared, css`
    :host { display:block; min-width:0; color:var(--nw-fg); }
    ha-icon { display:flex; line-height:0; }
    button { font:inherit; color:inherit; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:0; padding:0; }
    /* Frosted glass: clear enough to see the animated sky through it, blurred enough to keep the text readable.
       A crisp outline and no shadow around it: its edge never looks blurred (2 November). */
    /* Measured on the maquette (3 November): the sentence 63 px high, labels 22 px under it and 10 px above the track,
       the track 18 px high and 16 px inside the frame, the hours 6 px under it. */
    /* The frame is the charter's glass (.nw-glass); only its padding here. */
    .panel { position:relative; padding:0 0 11px; }

    /* The sentence: one point at a time, sliding up. */
    .head { display:flex; align-items:center; gap:12px; padding:12px 14px 11px; }
    /* Clipped for the slide, so it starts 3 px further left: the outline of the badge stays whole. */
    .say { position:relative; flex:1; min-width:0; height:40px; overflow:hidden; margin-left:-3px; }
    .item { position:absolute; inset:0 0 0 3px; display:flex; gap:12px; align-items:center; opacity:0; translate:0 100%; transition:opacity .45s var(--nw-ease), translate .45s var(--nw-ease); }
    .item.on { opacity:1; translate:0 0; } .item.off { opacity:0; translate:0 -100%; }
    .item > div { min-width:0; }
    /* The point on show (2 November): a large tinted icon, the time in small grey capitals, the sentence in bold. */
    .when { font-size:var(--nw-fs-label); line-height:14px; letter-spacing:.08em; text-transform:uppercase; font-weight:650; white-space:nowrap; color:var(--nw-fg2); }
    .x { font-size:var(--nw-fs-text); line-height:20px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .badge { display:grid; place-items:center; width:36px; height:36px; flex:none; border-radius:11px; background:color-mix(in oklab, var(--tone) 34%, transparent); }
    .badge ha-icon { --mdc-icon-size:18px; color:color-mix(in oklab, var(--tone) 40%, var(--nw-fg)); }
    .item.al .badge { background:color-mix(in oklab, var(--al) 40%, transparent); }
    .item.al .badge ha-icon { color:color-mix(in oklab, var(--al) 30%, var(--nw-fg)); }
    /* One bar per point: the one on show fills while it stays. */
    .progress { display:flex; gap:4px; flex:none; }
    .progress i { position:relative; width:16px; height:3px; border-radius:2px; background:var(--nw-line); overflow:hidden; }
    .progress i.done { background:color-mix(in srgb, var(--nw-fg2) 60%, transparent); }
    .progress i.on::after { content:''; position:absolute; inset:0; background:var(--nw-fg2); transform-origin:left; animation:fill var(--step) linear forwards; }
    .paused .progress i.on::after { animation-play-state:paused; }
    @keyframes fill { from { transform:scaleX(0); } }

    /* The track (« météo incrustée », 2 November): labels raised above it on a long stem, the forecast sky inlaid as segments
       with their pictogram, the dot of now on the left, the official vigilance as a hatched band over it until it ends. */
    .track { position:relative; height:74px; margin:0 16px; }
    .track.bare { height:26px; margin-top:8px; }
    .chips { position:absolute; inset:0 0 auto; height:56px; z-index:1; }
    .pin { position:absolute; top:22px; display:flex; flex-direction:column; align-items:center; translate:-50% 0; border:0; background:none; padding:0; cursor:pointer;
      animation:pop .3s var(--nw-ease) both; animation-delay:calc(120ms + var(--k, 0) * 60ms); }
    @keyframes pop { from { opacity:0; transform:translateY(6px) scale(.92); } }
    .pin:focus-visible { outline:none; } .pin:focus-visible .chip { outline:2px solid var(--nw-accent); outline-offset:2px; }
    /* A label: one pill tinted with its point, its icons (two at most) plain, its time, how many share it. */
    .chip { position:relative; display:flex; gap:4px; align-items:center; padding:3px 8px 3px 6px; border-radius:var(--nw-radius-pill);
      white-space:nowrap; font-size:var(--nw-fs-small); line-height:16px; font-weight:650; font-variant-numeric:tabular-nums;
      background:color-mix(in oklab, var(--tone) 30%, var(--nw-bg)); box-shadow:0 0 0 1px var(--nw-line);
      transition:background .26s var(--nw-ease), transform .26s var(--nw-ease), box-shadow .26s var(--nw-ease); }
    .chip ha-icon { --mdc-icon-size:14px; transition:opacity .26s, transform .26s var(--nw-ease); }
    /* Several points in one label: the one on show, above in the sentence, is larger and lit; the others step back. */
    .chip ha-icon.cur { --mdc-icon-size:17px; color:color-mix(in oklab, var(--tone) 35%, var(--nw-fg)); }
    .chip ha-icon.dim { opacity:.45; }
    /* The stem reaches the track from the label on show only; it grows with the label lifting, so they never part. */
    /* The stem: hidden under the labels at rest; from the label on show it runs into the track. */
    .stem { translate:var(--sx, 0) 0; width:1.5px; height:10px; background:color-mix(in oklab, var(--tone) 70%, var(--nw-fg)); opacity:0; transition:opacity .2s, height .26s var(--nw-ease), margin .26s var(--nw-ease); }
    .pin.on .stem { opacity:1; height:14px; margin-top:-4px; }
    .pin.on .chip { background:color-mix(in oklab, var(--tone) 55%, var(--nw-bg)); transform:translateY(-4px) scale(1.06);
      box-shadow:0 0 0 1px var(--nw-line), 0 4px 10px -4px rgb(0 0 0 / .35); }
    .count { display:grid; place-items:center; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; border-radius:8px;
      font-size:var(--nw-fs-label); font-weight:700; background:var(--nw-fg); color:var(--nw-bg); }
    /* A label holding an alert: the alert's outline, no coloured halo (neutral shadows only, 2 November). */
    /* A label holding an alert keeps the same neutral outline: its icon says it (as the maquette). */
    .lane { position:absolute; left:0; right:0; top:56px; height:18px; display:flex; gap:3px; }
    .track.bare .lane { top:4px; }
    /* Each segment inlaid: a slight relief (light above, shade below), grown from now on arrival. */
    .seg { display:grid; place-items:center; min-width:0; height:100%; overflow:hidden; border-radius:6px; transform-origin:left;
      background:linear-gradient(180deg, color-mix(in oklab, var(--tone) 85%, #fff), color-mix(in oklab, var(--tone) 78%, transparent));
      box-shadow:inset 0 1px 0 rgb(255 255 255 / .35), inset 0 -1px 0 rgb(0 0 0 / .08);
      animation:grow .52s var(--nw-ease) both; animation-delay:calc(var(--n, 0) * 90ms); }
    @keyframes grow { from { transform:scaleX(0); } }
    .seg:first-child { border-radius:9px 6px 6px 9px; } .seg:last-child { border-radius:6px 9px 9px 6px; } .seg:only-child { border-radius:9px; }
    .seg ha-icon { --mdc-icon-size:15px; color:rgb(20 26 45 / .72); }
    .vigil { position:absolute; left:0; top:49px; height:4px; border-radius:3px; pointer-events:none;
      background:repeating-linear-gradient(135deg, var(--al) 0 6px, color-mix(in oklab, var(--al) 55%, transparent) 6px 10px); }
    .seg.tight ha-icon { display:none; }
    .s-sun { --tone:var(--nw-heat); } .s-night { --tone:color-mix(in oklab, var(--nw-pressure) 70%, var(--nw-cold)); }
    .s-partly { --tone:color-mix(in oklab, var(--nw-cold) 60%, var(--nw-heat)); } .s-cloud { --tone:color-mix(in srgb, var(--nw-fg2) 35%, var(--nw-bg)); }
    .s-rain { --tone:var(--nw-rain); } .s-storm { --tone:var(--nw-pressure); } .s-snow { --tone:var(--nw-cold); } .s-wind { --tone:var(--nw-wind); }
    .s-hail { --tone:color-mix(in oklab, var(--nw-cold) 55%, var(--nw-pressure)); } .s-fog { --tone:color-mix(in srgb, var(--nw-fg2) 22%, var(--nw-bg)); }
    .compact .clock { display:none; }
    /* Now: a dot at the start of the track, with a ring that widens slowly. */
    .needle { position:absolute; left:0; top:58px; z-index:2; width:14px; height:14px; margin-left:-7px; border-radius:50%; background:var(--nw-fg); box-shadow:0 0 0 3px var(--nw-bg); }
    .needle::after { content:''; position:absolute; inset:-3px; border-radius:50%; border:2px solid var(--nw-fg);
      animation:ripple 2.4s var(--nw-ease) infinite; animation-play-state:var(--nw-motion, running); }
    /* The value's dot is the charter's (.nw-dot): only where it sits on this track. */
    .mark { top:61px; }
    @keyframes ripple { from { transform:scale(.6); opacity:.9; } to { transform:scale(2.2); opacity:0; } }
    .track.bare .needle { top:6px; }
    .hours { position:relative; height:16px; margin:6px 16px 0; font-size:var(--nw-fs-label); line-height:16px; color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
    .hours span { position:absolute; translate:-50% 0; white-space:nowrap; }
    .hours span.first { translate:0 0; } .hours span.last { translate:-100% 0; } .hours span.hide { visibility:hidden; }
    @media (prefers-reduced-motion:reduce) {
      .item, .chip, .stem { transition:none; } .progress i.on::after, .pin, .seg, .needle::after { animation:none; }
    }
  `];
}

declare global { interface HTMLElementTagNameMap { 'hestia-frise': HestiaFrise } }
