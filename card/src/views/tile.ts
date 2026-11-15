// The tile: on the dashboard it is one band; by default a tap unfolds it in place (the blocks chosen: bulletin, events, moments, forecasts)
// and a long press opens the full card. Each press can be set to do something else.
import { css, html, nothing, type TemplateResult } from 'lit';
import { lecture } from '../ui/hestia-lecture';
import { hourMark, t } from '../i18n';
import type { BulletinPeriod, WeatherView } from '../view';
import type { TileBlock } from '../types';
import { alertPill, label, nf, tint, unbroken, windArrow, windTip } from '../ui/parts';
import '../ui/ticker';
import '../ui/frise';

/** What a press does: the full card over the page, the user's weather page, fold or unfold the tile, or nothing. */
export type PressTarget = 'card' | 'page' | 'toggle' | 'forecast' | 'none';

export interface TileState {
  open: boolean;
  /** What a tap and a long press do. */
  tapTarget: PressTarget;
  holdTarget: PressTarget;
  /** What the unfolded tile shows, in this order. */
  blocks: TileBlock[];
  tab: 'hours' | 'days';
  onTab: (tab: 'hours' | 'days') => void;
  /** postcard: the scene above a line with the coming event and the chevron. window: the weather now on the left, the scene in a window
   *  on the right. immersive: the scene over the whole tile, the coming event in a pill on its ground. */
  style?: TileStyle;
}
export type TileStyle = 'postcard' | 'window' | 'immersive';

export const DEFAULT_BLOCKS: TileBlock[] = ['bulletin', 'events'];

/** What a press leads to, in a few words. */
function goal(target: PressTarget, open: boolean): string {
  return target === 'page' ? t('page météo') : target === 'card' ? t('carte complète') : open ? t('replier') : t('déplier');
}

/** A moment of the day, an hour or a day: a see-through tile over the sky. */
function glassTile(title: string, icon: string, value: string, extra: unknown = nothing, tip = ''): TemplateResult {
  return html`<div class="nw-tile" title=${tip || nothing}>${label(title)}<ha-icon icon=${icon}></ha-icon><strong>${value}</strong>${extra}</div>`;
}
/** Rain in the rain colour, or an empty line so the tiles keep the same height. */
const rainLine = (mm: number, min = .1) => mm >= min ? html`<span class="nw-ink" style=${tint('rain')}>${nf(mm)} mm</span>` : html`<span class="nw-ink">&nbsp;</span>`;
/** The wind: an arrow where it goes and its speed in km/h, the gusts in the tooltip; an empty line keeps the tiles level. */
function windLine(wind?: number, bearing?: number, gust?: number): TemplateResult {
  if (wind === undefined) return html`<span class="tile-wind">&nbsp;</span>`;
  const tip = windTip(nf(wind, 0), bearing, gust !== undefined && gust > wind ? nf(gust, 0) : undefined);
  return html`<span class="tile-wind" title=${tip} aria-label=${tip}>${bearing === undefined ? nothing : windArrow(bearing)}${nf(wind, 0)}</span>`;
}
const temps = (p: BulletinPeriod) => p.tmin === undefined ? '—' : p.tmin === p.tmax ? `${p.tmin} °C` : `${p.tmin}–${p.tmax} °C`;

/** The four moments of the day: evening, night, morning, afternoon. */
export const moments = (v: WeatherView) => v.bulletin?.periods.length
  ? html`<div class="block">${label(t('Les prochains moments'))}<div class="moments">${v.bulletin.periods.map(p => glassTile(p.label, p.icon, temps(p),
    html`<small>${p.phrase}</small>${p.rain >= 1 ? rainLine(p.rain) : nothing}`, p.text))}</div></div>` : nothing;

/** The hours or the days, with the switch between them. */
export function forecastStrip(v: WeatherView, tab: 'hours' | 'days', onTab: (tab: 'hours' | 'days') => void, title = t('Prévisions')): TemplateResult | typeof nothing {
  const hours = v.hours.slice(0, 12).filter(h => h.temperature !== undefined), days = v.days.slice(0, 5);
  if (!hours.length && !days.length) return nothing;
  const shown = !hours.length ? 'days' : !days.length ? 'hours' : tab;
  const select = (t: 'hours' | 'days') => (e: Event) => { e.stopPropagation(); onTab(t); };
  return html`<div class="block"><div class="block-title">${label(title)}
      ${hours.length && days.length ? html`<span class="seg" role="group" aria-label=${t('Prévisions affichées')}>
        <button type="button" aria-pressed=${shown === 'hours'} @click=${select('hours')} @pointerdown=${stopPress}>${t('Heures')}</button>
        <button type="button" aria-pressed=${shown === 'days'} @click=${select('days')} @pointerdown=${stopPress}>${t('Jours')}</button></span>` : nothing}</div>
    ${shown === 'hours'
      ? html`<div class="hours">${hours.map(h => glassTile(hourMark(h.hour), h.icon, `${nf(h.temperature!, 0)}°`,
          html`${rainLine(h.precipitation)}${windLine(h.wind, h.bearing, h.gust)}`, h.conditionLabel))}</div>`
      : html`<div class="days">${days.map(d => glassTile(d.label, d.icon, d.high === undefined ? '—' : `${d.high}°`,
          html`<span class="lo">${d.low === undefined ? '' : `${d.low}°`}</span>${rainLine(d.rain)}${windLine(d.wind, d.bearing, d.gust)}`, d.conditionLabel))}</div>`}</div>`;
}
/** The hours/days switch must not start a long press on the card. */
const stopPress = (e: Event) => e.stopPropagation();

/** Today's forecast low and high under the temperature, until midnight; nothing when the forecast gives neither. */
export function todayRange(v: WeatherView): TemplateResult | typeof nothing {
  const d = v.days.find(day => day.today);
  if (!d || (d.low === undefined && d.high === undefined)) return nothing;
  const tip = t('Prévu aujourd’hui : {range}', { range: [d.low === undefined ? '' : t('mini {t} °C', { t: d.low }), d.high === undefined ? '' : t('maxi {t} °C', { t: d.high })].filter(Boolean).join(', ') });
  return html`<span class="range" title=${tip} aria-label=${tip}>${d.low === undefined || d.high === undefined ? html`<span>${d.low ?? d.high}°</span>` : html`<span>${d.low} – ${d.high}°</span>`}</span>`;
}

/** « En ce moment »: condition, temperature and today's low and high, then the source. Shared by the tile and the banner. */
export function nowBlock(v: WeatherView, kicker: boolean, extra: unknown = nothing, head: unknown = nothing, frame: 'opaque' | 'clear' | 'none' = 'opaque'): TemplateResult {
  const n = v.now;
  // The banner's « En ce moment » sits in the charter's glass frame over the sky (no shadow), its temperature the charter's reading
  // (hestia-lecture, the same as Hestia Confort's): the low and high centred under the figures. The tile keeps its own small line.
  const d = v.days.find(day => day.today);
  const range = (x?: number) => x === undefined ? undefined : `${x}`;
  return html`<div class=${`nw-now${kicker && frame !== 'none' ? ` nw-glass${frame === 'clear' ? '' : ' nw-glass-solid'}` : ''}`}>${head}${kicker ? label(t('En ce moment')) : nothing}
    <span class="cond" data-entity=${n.conditionEntity ?? nothing} title=${n.source}><ha-icon icon=${n.icon}></ha-icon>${n.label}</span>
    ${n.temperature === undefined ? html`<span class="cond">${t('Température indisponible')}</span>`
      : kicker ? html`<div data-entity=${n.temperatureEntity ?? nothing} title=${n.temperatureSource}>${lecture({ value: nf(n.temperature), unit: '°C', low: range(d?.low), high: range(d?.high),
          label: t('{source} : {t} degrés Celsius', { source: n.temperatureSource, t: nf(n.temperature) }), more: extra === nothing ? undefined : extra })}</div>`
      : html`<span class="temp" data-entity=${n.temperatureEntity ?? nothing} title=${n.temperatureSource} aria-label=${t('{source} : {t} degrés Celsius', { source: n.temperatureSource, t: nf(n.temperature) })}>${nf(n.temperature)}<small>°C</small></span>`}
    ${kicker ? nothing : todayRange(v)}${kicker && n.temperature !== undefined ? nothing : extra}</div>`;
}

/** « Événements »: the timeline of the coming hours, with the points of now and of the next hours over the forecast sky. Shared with the banner. */
export const frise = (v: WeatherView) => v.points.length || v.alerts.length || v.hours.length || v.timeline?.length
  ? html`<div class="nw-events">${label(t('Événements'))}<hestia-frise .points=${v.points} .alerts=${v.alerts} .hours=${v.hours} .timeline=${v.timeline}></hestia-frise></div>` : nothing;

export function renderTile(v: WeatherView, sky: TemplateResult, s: TileState): TemplateResult {
  // The top keeps the official vigilance, one pill folded, the others opening under it. What the station measures leads the scrolling bubble,
  // in alert style, then the other vigilances; unfolded, the timeline takes over from the bubble.
  const official = v.alerts.filter(a => a.official), [first, ...more] = official;
  const points = [...v.alerts.filter(a => !a.official), ...more].map(a => ({ ...a, alert: true as const }));
  const ticker = [...points, ...v.points];
  const headline = v.bulletin?.summary;
  const presses = ([['tap', s.tapTarget], ['hold', s.holdTarget]] as const).filter(([, target]) => target !== 'none');
  const foldable = s.tapTarget === 'toggle' || s.holdTarget === 'toggle';
  // Under the unfolded tile, folding on a tap goes without saying.
  const hints = presses.filter(([name, target]) => name !== 'tap' || target !== 'toggle');
  const style = s.style ?? 'postcard';
  // The chevron tells the tile opens; it turns over when it does. Only when a press folds it.
  const chevron = foldable ? html`<span class="nw-chevron t-chev" aria-hidden="true"><i class="nw-chev"></i></span>` : nothing;
  const event = ticker.length ? html`<hestia-ticker bare .points=${ticker}></hestia-ticker>` : html`<span class="t-calm">${headline ? unbroken(headline) : ''}</span>`;
  const meta = html`<div class="meta">${v.location ? html`<span class="place">${v.location}</span>` : nothing}${first ? alertPill(first) : nothing}
    ${more.map(a => html`<div class="reveal"><div>${alertPill(a)}</div></div>`)}</div>`;
  const scene = html`<div class="t-scene" aria-hidden="true">${sky}</div>`;
  // The event and the chevron under the scene: a line on the postcard and the window, a pill on the ground of the immersive tile.
  const bar = ticker.length || foldable ? html`<div class=${style === 'immersive' ? 't-pill' : 't-line'}>${event}${chevron}</div>` : nothing;
  const now = nowBlock(v, false);
  const top = style === 'window'
    ? html`<div class="t-split"><div class="t-left">${meta}${now}</div>${scene}</div>${bar}`
    : html`${scene}<div class="t-over">${meta}${now}</div>${bar}`;
  return html`<div class=${`nw-tilecard t-${style}${s.open ? ' open' : ''}${v.now.darkSky ? ' dark-sky' : ''}${ticker.length ? '' : ' quiet'}`}
      role="button" tabindex="0" aria-expanded=${foldable ? s.open : nothing}
      aria-label=${`${v.location ? t('Météo à {place}', { place: v.location }) : t('Météo')}${presses.length ? ` : ${presses.map(([name, target]) => name === 'tap' ? t('appui pour {goal}', { goal: goal(target, s.open) }) : t('appui long pour {goal}', { goal: goal(target, s.open) })).join(', ')}` : ''}`}>
    <i class="press-ring" aria-hidden="true"></i>
    ${top}
    <div class="more" ?inert=${!s.open}><div><div class="more-in">
      ${s.blocks.map(block => block === 'bulletin' ? (headline ? html`<div class="bulletin">${label(t('Bulletin du jour'))}<p class="nw-bulletin">${unbroken(headline)}</p></div>` : nothing)
        : block === 'events' ? frise(v) : block === 'moments' ? moments(v) : forecastStrip(v, s.tab, s.onTab))}
      <div class="foot"><span>${v.forecastSource}${v.now.temperatureSource !== v.forecastSource ? ` · ${v.now.temperatureSource.toLowerCase()}` : ''}</span>
        ${hints.length ? html`<span>${hints.map(([name, target]) => name === 'tap' ? t('Appui : {goal}', { goal: goal(target, true) }) : t('Appui long : {goal}', { goal: goal(target, true) })).join(' · ')}</span>` : nothing}</div>
    </div></div></div>
  </div>`;
}

export const tileStyles = css`
  .nw-tilecard { position:relative; isolation:isolate; overflow:hidden; cursor:pointer; user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent;
    color:var(--nw-fg); border-radius:inherit; transition:box-shadow .2s; }
  .nw-tilecard:focus-visible { outline:2px solid var(--nw-accent); outline-offset:-2px; }
  /* The banner's sky (hero.ts) keeps its drawing size and shrinks as one block: clouds, sun and rain stay in proportion. */
  .sky { position:absolute; top:0; right:0; z-index:-2; width:calc(100% / var(--k)); height:calc(100% / var(--k)); transform:scale(var(--k)); transform-origin:top right; pointer-events:none; }
  .veil { position:absolute; inset:0; z-index:-1; pointer-events:none; }
  /* The scene (the sky alone, or set in a place) sits in a box of its own; the sky element fills it. */
  .t-scene { position:relative; overflow:hidden; pointer-events:none; }
  .t-scene > * { position:absolute; inset:0; display:block; }
  .meta { display:flex; flex-direction:column; align-items:flex-start; gap:6px; min-width:0; }
  .place { font-size:var(--nw-fs-title); font-weight:700; letter-spacing:-.02em; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* Over the scene: the place and « En ce moment » in white with a fine dark halo, readable on a bright sky as on a night one. */
  .t-over { position:absolute; left:16px; right:16px; top:14px; z-index:1; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; pointer-events:none; }
  .t-over > * { pointer-events:auto; }
  .t-over .place, .t-over .nw-now { color:#fff; text-shadow:0 1px 2px rgb(10 20 35 / .55), 0 0 10px rgb(10 20 35 / .35); }
  .t-over .nw-now ha-icon { filter:drop-shadow(0 1px 1.5px rgb(10 20 35 / .55)); }
  .t-over .nw-now { align-items:flex-end; text-align:right; }
  /* The coming event and the chevron, on one line; with nothing coming, the start of the bulletin, quietly. */
  .t-line { display:flex; align-items:center; gap:12px; padding:12px 14px 12px 16px; min-width:0; }
  .t-line hestia-ticker, .t-pill hestia-ticker { flex:1; min-width:0; }
  .t-calm { flex:1; min-width:0; font-size:var(--nw-fs-small); color:var(--nw-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .t-chev { width:32px; height:32px; transition:transform var(--nw-expand) var(--nw-ease), background .2s; }
  .open .t-chev { transform:rotate(180deg); }
  .nw-tilecard:hover .t-chev { background:color-mix(in srgb, var(--nw-fg) 8%, transparent); }
  /* A · the postcard: the scene above, it tightens a little as the tile opens. */
  .t-postcard .t-scene { height:var(--nw-tile-scene, 200px); transition:height var(--nw-expand) var(--nw-ease); }
  .t-postcard.open .t-scene { height:calc(var(--nw-tile-scene, 200px) - 44px); }
  /* B · the window: the weather now on the card's background, large; the scene in a rounded window on the right. */
  .t-split { display:grid; grid-template-columns:minmax(150px, .9fr) minmax(0, 1.1fr); min-height:176px; }
  .t-left { display:flex; flex-direction:column; gap:6px; padding:16px 6px 8px 18px; min-width:0; }
  .t-left .nw-now { align-items:flex-start; text-align:left; }
  .t-left .nw-now .temp { font-size:var(--nw-fs-temp); }
  .t-window .t-scene { margin:10px 10px 0 0; border-radius:16px; --nw-house-x:50%; --nw-house-size:.8; }
  /* C · immersive: the scene over the whole tile; the event in a pill on its ground, which stays put as the tile opens. */
  .t-immersive .t-scene { height:var(--nw-tile-scene, 236px); --nw-house-x:72%; --nw-house-size:.9; }
  .t-pill { position:absolute; left:12px; top:calc(var(--nw-tile-scene, 236px) - 60px); z-index:1; width:min(66%, 360px); box-sizing:border-box;
    display:flex; align-items:center; gap:10px; padding:7px 7px 7px 10px; border-radius:16px;
    background:color-mix(in srgb, var(--nw-bg) 84%, transparent); box-shadow:0 0 0 1px var(--nw-line), 0 6px 18px -10px rgb(0 0 0 / .5); }
  .t-pill .t-chev { width:30px; height:30px; }
  @container (max-width:480px) { .t-pill { width:auto; right:12px; } }
  /* Under the scene the timeline sits on the card's background: it takes the panels' fill (as « Aujourd'hui »), no glass nor outline. */
  .nw-tilecard hestia-frise { --nw-glass-clear:var(--nw-surface); --nw-frost:none; --nw-frame-line:transparent; }
  /* Folded, extra alerts wait in the scrolling bubble; unfolded, they open gently under the first one. */
  .reveal { display:grid; grid-template-rows:0fr; margin-top:-6px; opacity:0;
    transition:grid-template-rows var(--nw-expand) var(--nw-ease), margin-top var(--nw-expand) var(--nw-ease), opacity .3s .1s; }
  .reveal > div { min-height:0; overflow:clip; overflow-clip-margin:18px; }
  .open .reveal { grid-template-rows:1fr; margin-top:0; opacity:1; }
  /* The unfolding part: the height animates with grid-template-rows, no measuring in script. */
  /* Folded, the hidden part is not drawn at all (visibility waits for the end of the folding): its glass costs nothing on a phone. */
  .more { display:grid; grid-template-rows:0fr; visibility:hidden; transition:grid-template-rows var(--nw-expand) var(--nw-ease), visibility 0s linear var(--nw-expand); }
  .open .more { grid-template-rows:1fr; visibility:visible; transition:grid-template-rows var(--nw-expand) var(--nw-ease), visibility 0s; }
  .more > div { overflow:hidden; min-height:0; }
  .more-in { padding:0 16px 14px; display:flex; flex-direction:column; gap:12px; opacity:0; transform:translateY(-6px); transition:opacity .3s .1s, transform .3s .1s; }
  .open .more-in { opacity:1; transform:none; }
  /* Unfolded, as on the full card: under the top row, the bulletin and the timeline sit over a veil that fades in slowly and stays light,
     so a cloud passing low behind the text is softened, not bright white (9 November). */
  .more { position:relative; }
  .more-in { padding-top:4px; }
  .bulletin, .nw-events, .block { display:flex; flex-direction:column; gap:6px; }
  .bulletin, .nw-events { gap:4px; }
  /* Moments, hours and days: see-through tiles over the sky, without blur (it would be recomputed at every frame of the sky). */
  .moments, .hours, .days { display:grid; gap:8px; }
  .moments { grid-template-columns:repeat(4, minmax(0,1fr)); }
  .days { grid-template-columns:repeat(5, minmax(0,1fr)); }
  .hours { grid-auto-flow:column; grid-auto-columns:minmax(60px,1fr); overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
  .nw-tile { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; align-content:start; column-gap:8px; row-gap:3px;
    padding:10px 12px; border-radius:var(--nw-radius); min-width:0; box-sizing:border-box;
    background:color-mix(in srgb, var(--nw-bg) 72%, transparent); border:1px solid var(--nw-line); }
  .nw-tile > .nw-label, .nw-tile > small, .nw-tile > .nw-ink { grid-column:1/-1; }
  .nw-tile ha-icon { --mdc-icon-size:24px; }
  .nw-tile strong { font-size:var(--nw-fs-title); line-height:1.2; font-weight:700; letter-spacing:-.3px; white-space:nowrap; }
  .nw-tile small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .hours .nw-tile, .days .nw-tile { grid-template-columns:1fr; justify-items:center; text-align:center; padding:9px 6px; }
  .hours .nw-tile strong, .days .nw-tile strong { font-size:var(--nw-fs-text); }
  .days .lo { font-size:var(--nw-fs-small); font-weight:600; color:var(--nw-fg2); }
  .tile-wind { display:inline-flex; align-items:center; justify-content:center; gap:3px; font-size:var(--nw-fs-small); color:var(--nw-fg2); white-space:nowrap; }
  .tile-wind svg { width:10px; height:10px; fill:color-mix(in oklab, var(--nw-wind) 70%, var(--nw-fg)); }
  .block-title { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .seg { display:inline-flex; padding:2px; border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:color-mix(in srgb, var(--nw-bg) 72%, transparent); }
  .seg button { font-size:var(--nw-fs-small); line-height:1; font-weight:600; border:0; background:none; color:var(--nw-fg2); padding:5px 10px; border-radius:var(--nw-radius-pill); cursor:pointer; }
  .seg button[aria-pressed=true] { background:var(--nw-bg); color:var(--nw-fg); box-shadow:0 1px 3px #0002; }
  @container (max-width:600px) { .moments { grid-template-columns:repeat(2, minmax(0,1fr)); } }
  .foot { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px 10px; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  /* Long press: a ring fills up under the finger. */
  .nw-tilecard.pressing { box-shadow:inset 0 0 0 3px color-mix(in srgb, var(--nw-accent) 45%, transparent); }
  .press-ring { position:absolute; width:44px; height:44px; margin:-22px 0 0 -22px; border-radius:50%; pointer-events:none; opacity:0;
    background:conic-gradient(var(--nw-accent) calc(var(--p, 0) * 1turn), transparent 0);
    -webkit-mask:radial-gradient(circle, transparent 15px, #000 16px); mask:radial-gradient(circle, transparent 15px, #000 16px); }
  .pressing .press-ring { opacity:.9; }
  @container (max-width:480px) {
    .days { grid-template-columns:repeat(5, minmax(58px,1fr)); overflow-x:auto; scrollbar-width:none; }
  }
  @media (prefers-reduced-motion:reduce) { .more, .more-in, .reveal, .t-chev, .t-postcard .t-scene { transition:none; } }
`;
