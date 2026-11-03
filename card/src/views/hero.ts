// The banner of the full card, over the animated sky: the official vigilance, the day's bulletin, the weather now,
// then the timeline of the coming hours with the brief's points.
import { css, html, nothing, type TemplateResult } from 'lit';
import { fr, t } from '../i18n';
import type { WeatherView } from '../view';
import { alertPill, info, label, nf, tint, unbroken } from '../ui/parts';
import { nowBlock } from './tile';
import '../ui/clock';

const GROUPS = [
  { key: 'official', title: fr('Vigilance officielle') },
  { key: 'now', title: fr('Maintenant') },
  { key: 'future', title: fr('À venir') },
  { key: 'environment', title: fr('Air et pollens') },
] as const;

/** The « i » of the banner: what the brief is, then every point it weighed, by group, with a link to its source. */
function briefInfo(v: WeatherView, uid: string): TemplateResult {
  const brief = v.brief;
  const groups = brief ? GROUPS.map(g => ({ ...g, signals: brief.signals.filter(s => s.group === g.key && (s.severity > 0 || v.points.some(p => p.text === s.text))) }))
    .filter(g => g.signals.length) : [];
  return info(`${uid}-brief`, {
    title: t('Synthèse'),
    text: html`${t('La météo du jour en une phrase, avec ce qui compte maintenant et ce qui arrive.')}
      ${groups.map(g => html`<div class="brief-group">${label(t(g.title))}<ul>${g.signals.map(s => html`<li data-entity=${s.entity ?? nothing}>
        <ha-icon icon=${s.icon}></ha-icon><span>${s.text}</span></li>`)}</ul></div>`)}
      ${brief?.caveats.length ? html`<div class="brief-group">${label(t('À vérifier'))}<ul>${brief.caveats.map(c => html`<li><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${c}</span></li>`)}</ul></div>` : nothing}`,
    example: t('« Pluie ce soir, puis éclaircies demain matin. »'),
  });
}

import type { BannerBlock } from '../types';

/** The banner: the place, the vigilance and the weather now, then its blocks drawn by `draw`, in their order.
 *  `clock` puts the time under the title (left) or above the weather now (right). */
export function renderHero(v: WeatherView, sky: TemplateResult, uid: string, blocks: BannerBlock[], draw: (b: BannerBlock) => unknown,
  clock: 'none' | 'left' | 'right' = 'none', frame: 'opaque' | 'clear' | 'none' = 'opaque'): TemplateResult {
  // The charter's arrow and the change in plain grey (3 November): only when the temperature really moves, half a degree an hour or more.
  const trend = v.now.trend === undefined || Math.abs(v.now.trend) < .5 ? nothing : html`<span class="now-trend nw-say"
    title=${v.now.trend > 0 ? t('La température monte') : t('La température baisse')}><i class="nw-trend" data-way=${v.now.trend > 0 ? 'up' : 'down'}></i>${v.now.trend > 0 ? '+' : '−'}${nf(Math.abs(v.now.trend))} °C/h</span>`;
  const season = v.season.news ? html`<span class="nw-chip" style=${tint('calm')} title=${v.season.tip}><ha-icon icon=${v.season.info.icon}></ha-icon>${v.season.news}</span>` : nothing;
  const official = v.alerts.filter(a => a.official);
  // The bulletin sits next to the weather now when it comes first; the other blocks follow under them, in their order.
  // On a phone, the weather's words leave the frame for the line under « Bulletin du jour »: the frame keeps the figures only,
  // narrow enough for the sky to show (3 November, « Nuageux, sans pluie mesurée » crushed the title).
  const below = blocks[0] === 'bulletin' && !!v.bulletin;
  const cond = below ? html`<p class="hero-cond" data-entity=${v.now.conditionEntity ?? nothing} title=${v.now.source}><ha-icon icon=${v.now.icon}></ha-icon>${v.now.label}</p>` : nothing;
  const bulletin = bulletinBlock(v, cond);
  const rest = blocks[0] === 'bulletin' ? blocks.slice(1) : blocks;
  return html`<section class=${`nw-hero${v.now.darkSky ? ' dark-sky' : ''}${below ? ' cond-below' : ''}`} aria-label=${t('Synthèse')}>
    <div class="sky" aria-hidden="true">${sky}</div><div class="veil" aria-hidden="true"></div>
    <header class="fm-head"><h2 class="nw-title">${t('Synthèse')}</h2>${briefInfo(v, uid)}<span>${[v.location, v.dateLabel].filter(Boolean).join(' · ')}</span>${season}</header>
    <div class="hero-main">
      ${clock === 'left' ? html`<hestia-clock class="hero-clock"></hestia-clock>` : nothing}
      ${official.length ? html`<div class="nw-alerts">${official.map(a => alertPill(a))}</div>` : nothing}
      ${blocks[0] === 'bulletin' ? bulletin : nothing}
    </div>
    ${nowBlock(v, true, trend, clock === 'right' ? html`<hestia-clock class="now-clock"></hestia-clock>` : nothing, frame)}
    ${rest.length ? html`<div class="hero-blocks">${rest.map(draw)}</div>` : nothing}
  </section>`;
}

/** « Bulletin du jour » and its text; `lead` goes between them (the weather's words, on a phone). */
export const bulletinBlock = (v: WeatherView, lead: unknown = nothing) => v.bulletin ? html`${label(t('Bulletin du jour'))}${lead}<p class="nw-bulletin">${unbroken(v.bulletin.summary)}</p>` : nothing;

export const heroStyles = css`
  .nw-hero { position:relative; isolation:isolate; overflow:hidden; padding:20px 24px 24px; display:grid; grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:"head now" "main now" "blocks blocks"; column-gap:24px; row-gap:12px; color:var(--nw-fg); }
  .nw-hero .sky { --k:1; }
  /* The text side stays readable; the bottom fades softly towards the next section, light enough for the ground (puddles, snow) to show. */
  .nw-hero .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 92%, transparent) 30%,
    color-mix(in srgb, var(--nw-bg) 45%, transparent) 55%, transparent 78%),
    linear-gradient(0deg, color-mix(in srgb, var(--nw-bg) 55%, transparent) 0%, transparent 30%); }
  .nw-hero > .fm-head { grid-area:head; cursor:default; flex-wrap:wrap; }
  .hero-main { grid-area:main; display:flex; flex-direction:column; align-items:flex-start; gap:10px; min-width:0; }
  .hero-cond { display:none; margin:-4px 0 0; align-items:center; gap:6px; font-size:var(--nw-fs-text); font-weight:650; }
  .hero-cond ha-icon { --mdc-icon-size:17px; }
  .nw-alerts { display:flex; flex-wrap:wrap; gap:8px; max-width:100%; }
  .now-trend { display:inline-flex; align-items:center; gap:5px; font-variant-numeric:tabular-nums; }
  /* « Sans cadre »: no frame behind the figures, only a fine, tight shadow around the letters and icons, almost an outline,
     in the theme's background (dark behind light text, light behind dark text; dark on a storm sky's white text). */
  .nw-hero > .nw-now:not(.nw-glass) { --halo:color-mix(in srgb, var(--nw-bg) 85%, transparent);
    text-shadow:0 0 1px var(--halo), 0 0 2px var(--halo), 0 1px 3px var(--halo); }
  .nw-hero.dark-sky > .nw-now:not(.nw-glass) { --halo:rgb(11 26 43 / .7); }
  .nw-hero > .nw-now:not(.nw-glass) :is(ha-icon, .nw-trend) { filter:drop-shadow(0 0 1px var(--halo)) drop-shadow(0 1px 2px var(--halo)); }
  .nw-hero .nw-bulletin { animation:nw-rise .7s var(--nw-ease) both; }
  @keyframes nw-rise { from { opacity:0; filter:blur(3px); } }
  .nw-hero > .nw-now { grid-area:now; align-self:start; gap:4px; }
  .nw-hero > .nw-now .temp small { font-size:var(--nw-fs-title); }
  .hero-clock { font-size:var(--nw-fs-temp); font-weight:300; letter-spacing:-1px; }
  .now-clock { font-size:var(--nw-fs-title); font-weight:650; color:var(--nw-fg2); margin-bottom:4px; }
  .hero-blocks { grid-area:blocks; display:flex; flex-direction:column; gap:14px; margin-top:4px; min-width:0; }
  .hero-blocks > .nw-events, .hero-blocks > .hero-bulletin, .hero-blocks > .block { display:flex; flex-direction:column; gap:6px; }
  .brief-group { margin-top:10px; }
  .brief-group ul { list-style:none; margin:4px 0 0; padding:0; display:grid; gap:4px; }
  .brief-group li { display:flex; align-items:flex-start; gap:7px; font-size:var(--nw-fs-small); }
  .brief-group li ha-icon { --mdc-icon-size:15px; color:var(--nw-fg2); margin-top:1px; }
  @media (prefers-reduced-motion:reduce) { .nw-hero .nw-bulletin { animation:none; } }
  @container (max-width:650px) {
    /* On a phone, as the folded tile (3 November): the title on the left, « En ce moment » in a small glass frame on the right,
       the sun moved between them so the sky stays in sight; a light, long veil under them keeps the text readable and the sky alive. */
    .nw-hero { grid-template-areas:"head now" "main main" "blocks blocks"; column-gap:12px; padding:16px 14px 18px; --nw-orb-x:44%; }
    .nw-hero > .fm-head { align-self:start; row-gap:2px; }
    .nw-hero > .fm-head > span:not(.nw-chevron):not(.nw-chip):not(.nw-sum) { flex:1 0 100%; }
    .nw-hero > .nw-now > .nw-label { display:none; }
    .nw-hero.cond-below .hero-cond { display:flex; }
    .nw-hero.cond-below > .nw-now .cond { display:none; }
    /* A long condition (« Nuageux, sans pluie mesurée ») wraps in the frame rather than crush the title: the frame keeps under half the card. */
    .nw-hero > .nw-now { max-width:min(46cqi, 180px); }
    /* The frame hangs from the top of the card (3 November): it rises without lifting the bulletin, the sky shows more between them. */
    .nw-hero > .nw-now { translate:0 -16px; padding-top:10px; border-top:0; border-top-left-radius:0; border-top-right-radius:0; }
    .nw-hero > .nw-now .cond { display:block; text-align:right; text-wrap:balance; }
    .nw-hero > .nw-now .cond ha-icon { display:inline-flex; vertical-align:-3px; margin-right:6px; }
    .nw-hero > .nw-now .nw-temp { font-size:var(--nw-fs-value); }
    .nw-hero .veil { background:linear-gradient(90deg, var(--nw-bg) 0%, color-mix(in srgb, var(--nw-bg) 85%, transparent) 22%,
      color-mix(in srgb, var(--nw-bg) 30%, transparent) 42%, transparent 60%); }
    /* Under the frame, whatever its height (a clock above it, a long condition): the bulletin and the blocks over a veil that fades in
       slowly and stays light (3 November, « the animations are our strength »): no edge, the sky still in sight behind the text. */
    .nw-hero::after { content:''; position:absolute; grid-row:main-start / -1; grid-column:1 / -1; top:-40px; bottom:-18px; left:-14px; right:-14px;
      z-index:-1; pointer-events:none; background:linear-gradient(180deg, transparent 0, color-mix(in srgb, var(--nw-bg) 45%, transparent) 90px,
      color-mix(in srgb, var(--nw-bg) 60%, transparent) 100%); }
  }
`;
