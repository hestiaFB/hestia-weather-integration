// « Éclairs »: Blitzortung's strikes of the last hour on a radar around the home, the nearest one, the level and the counts.
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { fr, t } from '../i18n';
import type { LightningView } from '../view';
import { chip, entity, label, nf, panelHead } from '../ui/parts';
import type { Parts } from './today';

/** The four steps, calm to overhead, and their colours. */
const STEPS: Array<[string, string]> = [[fr('Calme'), 'calm'], [fr('Secteur'), 'level1'], [fr('Proche'), 'level2'], [fr('Sur vous'), 'level3']];
/** The radar's edge, in km; square-root scale: the near kilometres, those that matter, get more room. */
const EDGE = 50;
const C = 100, R = 82, radius = (km: number) => Math.sqrt(Math.min(km, EDGE) / EDGE) * R;
const has = (parts: Parts, part: string) => !parts || parts.has(part);
/** The colour of a strike by its age: red under 10 minutes, orange under 30, yellow up to the hour. */
const aged = (minutes: number) => minutes < 10 ? 'var(--nw-level3)' : minutes < 30 ? 'var(--nw-level2)' : 'var(--nw-level1)';
const strikes = (n: number | string, count: number) => t(count > 1 ? '{n} éclairs' : '{n} éclair', { n });

function radar(l: LightningView): TemplateResult {
  const xy = (km: number, az: number) => [C + radius(km) * Math.sin(az * Math.PI / 180), C - radius(km) * Math.cos(az * Math.PI / 180)];
  const placed = l.strikes.filter((s): s is [number, number, number] => s[2] !== null);
  // Strikes reloaded after a restart have no direction: a faint ring at their distance.
  const rings = [...new Set(l.strikes.filter(s => s[2] === null).map(s => Math.round(s[1])))];
  const last = placed.at(-1), pulse = last && last[0] < 10 ? xy(last[1], last[2]) : undefined;
  return html`<svg class="lz-radar" viewBox="-14 -14 228 228" role="img" aria-label=${t('Éclairs de la dernière heure autour de chez vous')}>
    ${svg`<circle cx=${C} cy=${C} r=${R} fill="color-mix(in oklab, var(--nw-wind) 8%, transparent)"/>
    <line x1=${C} y1=${C - R} x2=${C} y2=${C + R} stroke="var(--nw-line-soft)"/><line x1=${C - R} y1=${C} x2=${C + R} y2=${C} stroke="var(--nw-line-soft)"/>
    ${[10, 30, 50].map(km => svg`<circle class=${km === 30 ? 'ring near' : 'ring'} cx=${C} cy=${C} r=${radius(km)}/>
      <text class="km" x=${C + 3} y=${C - radius(km) + 10}>${km}</text>`)}
    <text x=${C} y=${C - R - 5}>${t('N')}</text><text x=${C + R + 9} y=${C + 4}>${t('E')}</text>
    <text x=${C} y=${C + R + 14}>${t('S')}</text><text x=${C - R - 9} y=${C + 4}>${t('O')}</text>
    ${rings.map(km => svg`<circle class="unplaced" cx=${C} cy=${C} r=${radius(km)}/>`)}
    ${placed.map(([minutes, km, az]) => { const [x, y] = xy(km, az);
      return svg`<circle cx=${x.toFixed(1)} cy=${y.toFixed(1)} r=${minutes < 10 ? 4 : 3} fill=${aged(minutes)} opacity=${Math.max(.4, 1 - minutes / 70).toFixed(2)}/>`; })}
    ${pulse ? svg`<circle class="lz-pulse" cx=${pulse[0].toFixed(1)} cy=${pulse[1].toFixed(1)} r="4"/>` : nothing}
    <circle cx=${C} cy=${C} r="5" fill="var(--nw-bg)" stroke="var(--nw-fg)" stroke-width="2"/>`}</svg>`;
}

/** The four steps, the highest on top, those reached lit in the colour of the step reached. */
const level = (step: number) => html`<div class="lz-level" role="img" aria-label=${t('Niveau : {step}', { step: t(STEPS[step][0]) })}>
  ${[3, 2, 1, 0].map(i => html`<div class=${i === step ? 'on' : ''}><i class=${i <= step ? 'lit' : ''} style=${`--c:var(--nw-${STEPS[step][1]})`}></i>${label(t(STEPS[i][0]))}</div>`)}</div>`;

export function lightningPanel(l: LightningView, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
  const head = panelHead('mdi:flash', STEPS[l.available ? l.step : 0][1], t('Éclairs'), l.source);
  const month = l.month === undefined ? nothing : chip({ theme: 'calm', icon: 'mdi:calendar-month', value: nf(l.month, 0), label: t('ce mois') });
  // A silent sensor, or an hour without any strike: one line says it.
  if (!l.available || !l.hourCount) return html`<section class="nw-panel" aria-label=${t('Éclairs')}>${head}${lead}
    <div class="lz-calm" data-entity=${entity(l.entity)}><p><b>${l.headline}</b>${l.available && !l.hourCount ? html` ${t('À moins de {km} km.', { km: EDGE })}` : nothing}</p>${l.available ? month : nothing}</div></section>`;
  // The charter's arrow (3 November): orange towards you, green away; in words beside it.
  const movement = l.trend === 'approche' ? html`<span class="nw-say lz-move"><i class="nw-trend" data-way="down" data-tone="worse"></i>${l.movement}</span>`
    : l.trend === 'eloigne' ? html`<span class="nw-say lz-move"><i class="nw-trend" data-way="up" data-tone="better"></i>${l.movement}</span>` : nothing;
  const stats: Array<[string, string]> = [[t('Dans l’heure'), strikes(l.hourCount, l.hourCount)], [t('En 10 min'), strikes(l.recentCount, l.recentCount)],
    l.month !== undefined ? [t('Ce mois'), strikes(nf(l.month, 0), l.month)] : [t('Dernier'), t('il y a {n} min', { n: Math.max(1, l.lastMinutes ?? 1) })]];
  return html`<section class="nw-panel" aria-label=${t('Éclairs')}>${head}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${entity(l.entity)}>
        <div class="nw-value"><b>${l.nearest === undefined ? '—' : nf(Math.max(1, l.nearest), 0)}</b><span>km</span></div>
        <small><b>${l.headline}</b>${l.direction ? ` · ${l.direction}` : ''}</small></div>${movement}</div>` : nothing}
    ${has(parts, 'radar') ? html`<div class="mini lz"><div class="mini-top">${t('Dernière heure · en rouge, les 10 dernières minutes')}</div>
        <div class="lz-body">${radar(l)}${level(l.step)}</div></div>` : nothing}
    ${has(parts, 'stats') ? html`<div class="nw-stats">${stats.map(([name, value]) => html`<div>${label(name)}<b>${value}</b></div>`)}</div>` : nothing}
  </section>`;
}

export const lightningStyles = css`
  .lz-body { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
  .lz-radar { width:100%; max-width:160px; aspect-ratio:1; justify-self:center; overflow:visible; }
  .lz-radar .ring { fill:none; stroke:var(--nw-line); }
  .lz-radar .ring.near { stroke:color-mix(in oklab, var(--nw-level2) 75%, transparent); stroke-dasharray:3 3; }
  .lz-radar .unplaced { fill:none; stroke:var(--nw-level1); stroke-opacity:.5; stroke-dasharray:1 3; }
  .lz-radar text { font-size:var(--nw-fs-small); font-weight:700; fill:var(--nw-fg2); text-anchor:middle; }
  .lz-radar text.km { font-size:var(--nw-fs-label); font-weight:600; text-anchor:start; }
  .lz-pulse { fill:none; stroke:var(--nw-level3); stroke-width:1.5; transform-box:fill-box; transform-origin:center;
    animation:lz-pulse 1.8s ease-out infinite; animation-play-state:var(--nw-motion, running); }
  @keyframes lz-pulse { from { opacity:.9; transform:scale(1); } to { opacity:0; transform:scale(3.2); } }
  @media (prefers-reduced-motion:reduce) { .lz-pulse { display:none; } }
  .lz-level { display:flex; flex-direction:column; gap:7px; }
  .lz-level div { display:flex; align-items:center; gap:8px; }
  .lz-level div:not(.on) .nw-label { opacity:.7; }
  .lz-level div.on .nw-label { color:var(--nw-fg); }
  .lz-level i { width:26px; height:8px; border-radius:4px; background:color-mix(in srgb, var(--nw-fg) 9%, transparent); flex:none; }
  .lz-level i.lit { background:var(--c); }
  .lz-calm { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .lz-calm p { margin:0; flex:1; min-width:12em; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  .lz-calm b { color:var(--nw-fg); font-weight:600; }
`;
