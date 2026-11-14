// « Feux de forêt » (issue #23): PyroVeille's fires on a radar around the home, the nearest one, the smoke, and the list of fires.
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { fr, t } from '../i18n';
import type { FirePoint, FireView } from '../view';
import { entity, label, nf, panelHead, rose } from '../ui/parts';
import type { Parts } from './today';

/** The status of a fire: its words and its colour (1 extinguished, 2 reported, 3 active). */
const STATUS: Record<number, [string, string]> = { 1: [fr('Éteint'), 'var(--nw-fg2)'], 2: [fr('Signalé'), 'var(--nw-level2)'], 3: [fr('Actif'), 'var(--nw-level3)'] };
/** The card's colour: calm, to watch, needs attention. */
const THEMES = ['calm', 'level2', 'level3'];
const C = 100, R = 82;
const has = (parts: Parts, part: string) => !parts || parts.has(part);

/** The radar's edge: the radius PyroVeille watches, else the farthest fire, rounded up to a round number of kilometres. */
export function fireEdge(f: FireView): number {
  const far = Math.max(0, ...f.fires.map(x => x.distance ?? 0));
  const edge = f.radius && f.radius > 0 ? f.radius : far || 30;
  return [10, 15, 20, 30, 40, 50, 75, 100, 150, 200].find(step => step >= edge) ?? Math.ceil(edge / 100) * 100;
}
/** Three rings: a third, two thirds and the whole of the edge, in kilometres. */
const rings = (edge: number) => [edge / 3, 2 * edge / 3, edge].map(km => Math.round(km));

function radar(f: FireView): TemplateResult {
  const edge = fireEdge(f), radius = (km: number) => Math.min(km, edge) / edge * R;
  const xy = (km: number, az: number) => [C + radius(km) * Math.sin(az * Math.PI / 180), C - radius(km) * Math.cos(az * Math.PI / 180)];
  // The oldest drawn first: an active fire stays on top of an extinguished one at the same place.
  const placed = f.fires.filter((x): x is FirePoint & { distance: number; azimuth: number } => x.distance !== undefined && x.azimuth !== undefined)
    .sort((a, b) => a.status - b.status);
  // Where the wind blows the smoke: an arrow across the radar, from the side the wind comes from.
  const wind = f.windFrom === undefined ? nothing : (() => {
    const [x1, y1] = xy(edge * .92, f.windFrom), [x2, y2] = xy(edge * .92, f.windFrom + 180);
    return svg`<line class="fr-wind" x1=${x1.toFixed(1)} y1=${y1.toFixed(1)} x2=${x2.toFixed(1)} y2=${y2.toFixed(1)} marker-end="url(#fr-arrow)"/>`;
  })();
  return html`<svg class="fr-radar" viewBox="-14 -14 228 228" role="img" aria-label=${t('Feux signalés autour de chez vous')}>
    ${svg`<defs><marker id="fr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--nw-wind)"/></marker></defs>
    <circle cx=${C} cy=${C} r=${R} fill="color-mix(in oklab, var(--nw-heat) 8%, transparent)"/>
    <line x1=${C} y1=${C - R} x2=${C} y2=${C + R} stroke="var(--nw-line-soft)"/><line x1=${C - R} y1=${C} x2=${C + R} y2=${C} stroke="var(--nw-line-soft)"/>
    ${rings(edge).map(km => svg`<circle class="ring" cx=${C} cy=${C} r=${radius(km)}/><text class="km" x=${C + 3} y=${C - radius(km) + 10}>${km}</text>`)}
    <text x=${C} y=${C - R - 5}>${t('N')}</text><text x=${C + R + 9} y=${C + 4}>${t('E')}</text>
    <text x=${C} y=${C + R + 14}>${t('S')}</text><text x=${C - R - 9} y=${C + 4}>${t('O')}</text>
    ${wind}
    ${placed.map(x => { const [px, py] = xy(x.distance, x.azimuth);
      return x.status === 1 ? svg`<circle class="fr-out" cx=${px.toFixed(1)} cy=${py.toFixed(1)} r="3.5"/>`
        : svg`<circle cx=${px.toFixed(1)} cy=${py.toFixed(1)} r=${x.status === 3 ? 5 : 4} fill=${STATUS[x.status][1]}/>`; })}
    ${placed.filter(x => x.status === 3).slice(0, 1).map(x => { const [px, py] = xy(x.distance, x.azimuth);
      return svg`<circle class="fr-pulse" cx=${px.toFixed(1)} cy=${py.toFixed(1)} r="5"/>`; })}
    <circle cx=${C} cy=${C} r="5" fill="var(--nw-bg)" stroke="var(--nw-fg)" stroke-width="2"/>`}</svg>`;
}

/** « 4,6 km · SO »: how far, and on which side of the home. */
const where = (x: FirePoint) => [x.distance === undefined ? '' : `${nf(x.distance, x.distance >= 10 ? 0 : 1)} km`, x.azimuth === undefined ? '' : rose(x.azimuth)]
  .filter(Boolean).join(' · ');

function row(x: FirePoint): TemplateResult {
  const [word, color] = STATUS[x.status] ?? STATUS[1];
  const name = x.place || t('Feu');
  return html`<li class=${`fr-row s${x.status}`}><i style=${`--c:${color}`}></i>
    <span class="fr-place">${x.url ? html`<a href=${x.url} target="_blank" rel="noopener noreferrer">${name}</a>` : name}</span>
    <span class="fr-where">${where(x)}</span>${label(t(word))}</li>`;
}

/** The fires in the radius: the burning ones first, nearest first; the extinguished ones after, at most a few. */
function list(f: FireView): TemplateResult {
  const burning = f.fires.filter(x => x.status >= 2), out = f.fires.filter(x => x.status < 2).slice(0, 3);
  if (!burning.length && !out.length) return html`<p class="nw-empty">${t('Aucun feu dans le rayon surveillé.')}</p>`;
  return html`<ul class="fr-list">${[...burning, ...out].map(row)}</ul>`;
}

export function firePanel(f: FireView, parts?: Parts): TemplateResult {
  const theme = THEMES[f.level] ?? 'calm';
  const head = panelHead('mdi:pine-tree-fire', theme === 'calm' ? 'heat' : theme, t('Feux de forêt'), t('PyroVeille (feuxdeforet.fr, signalements, pas une vigilance officielle)'));
  const burning = f.fires.filter(x => x.status >= 2).length;
  const nearest = f.fires.find(x => x.status >= 2);
  return html`<section class="nw-panel fr" aria-label=${t('Feux de forêt')}>${head}
    ${has(parts, 'now') ? nearest ? html`<div class="metric-row"><div class="metric" data-entity=${entity(f.entity)}>
        <div class="nw-value"><b>${nearest.distance === undefined ? '—' : nf(nearest.distance, nearest.distance >= 10 ? 0 : 1)}</b><span>km</span></div>
        <small class=${f.level ? 'nw-ink' : ''} style=${f.level ? `--c:var(--nw-${theme})` : ''}>${f.headline}</small></div></div>`
      // Nothing burning: one line says it, as the lightning card does when the sky is calm.
      : html`<p class="fr-calm" data-entity=${entity(f.entity)}>${f.headline}</p>` : nothing}
    ${has(parts, 'radar') ? html`<div class="mini fr-mini"><div class="mini-top">${f.radius ? t('Rayon de {km} km', { km: nf(f.radius, 0) }) : t('Autour de chez vous')}${f.windFrom !== undefined ? ` · ${t('la flèche suit le vent')}` : ''}</div>
        <div class="fr-body">${radar(f)}<div class="fr-legend">
          ${[3, 2, 1].map(s => html`<div><i class=${s === 1 ? 'out' : ''} style=${`--c:${STATUS[s][1]}`}></i>${label(t(STATUS[s][0]))}</div>`)}
          <div class="count">${label(t('Dans le rayon'))}<b>${burning ? t(burning > 1 ? '{n} feux' : '{n} feu', { n: burning }) : t('aucun feu')}</b></div></div></div></div>` : nothing}
    ${has(parts, 'list') ? list(f) : nothing}
  </section>`;
}

/** PyroVeille not chosen: what it brings and where to choose it. */
export function fireMissing(settings: string): TemplateResult {
  return html`<section class="nw-panel lz-missing" aria-label=${t('Feux de forêt')}>${panelHead('mdi:pine-tree-fire', 'heat', t('Feux de forêt'), 'PyroVeille')}
    <p>${t('Cette carte montre les feux de forêt signalés autour de chez vous grâce à PyroVeille. Installez l’extension depuis HACS, puis allumez-la dans le panneau Hestia-FB → Météo → Extensions.')}</p>
    <div class="links"><a href="https://github.com/vico34/pyroveille" target="_blank" rel="noopener noreferrer">${t('Installer PyroVeille')}</a>
      <a class="second" href=${settings}>${t('Réglages de Hestia Weather')}</a></div></section>`;
}

export const fireStyles = css`
  .fr-body { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
  .fr-radar { width:100%; max-width:200px; aspect-ratio:1; justify-self:center; overflow:visible; }
  .fr-radar .ring { fill:none; stroke:var(--nw-line); }
  .fr-radar text { font-size:var(--nw-fs-small); font-weight:700; fill:var(--nw-fg2); text-anchor:middle; }
  .fr-radar text.km { font-size:var(--nw-fs-label); font-weight:600; text-anchor:start; }
  .fr-radar .fr-out { fill:none; stroke:var(--nw-fg2); stroke-width:1.5; opacity:.7; }
  .fr-radar .fr-wind { stroke:var(--nw-wind); stroke-width:2; stroke-dasharray:4 3; opacity:.9; }
  .fr-pulse { fill:none; stroke:var(--nw-level3); stroke-width:1.5; transform-box:fill-box; transform-origin:center;
    animation:fr-pulse 1.8s ease-out infinite; animation-play-state:var(--nw-motion, running); }
  @keyframes fr-pulse { from { opacity:.9; transform:scale(1); } to { opacity:0; transform:scale(3); } }
  @media (prefers-reduced-motion:reduce) { .fr-pulse { display:none; } }
  .fr-legend { display:flex; flex-direction:column; gap:7px; }
  .fr-legend div { display:flex; align-items:center; gap:8px; }
  .fr-legend i { width:10px; height:10px; border-radius:50%; background:var(--c); flex:none; }
  .fr-legend i.out { background:none; box-shadow:inset 0 0 0 1.5px var(--c); }
  .fr-legend .count { flex-direction:column; align-items:flex-start; gap:2px; margin-top:4px; }
  .fr-legend .count b { font-size:var(--nw-fs-text); font-weight:600; }
  .fr-list { list-style:none; margin:4px 0 0; padding:0; }
  .fr-row { display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; gap:10px; align-items:center; padding:9px 0; border-top:1px solid var(--nw-line-soft); font-size:var(--nw-fs-text); }
  .fr-row:first-child { border-top:0; }
  .fr-row i { width:10px; height:10px; border-radius:50%; background:var(--c); }
  .fr-row.s1 i { background:none; box-shadow:inset 0 0 0 1.5px var(--c); }
  .fr-row.s1 .fr-place { color:var(--nw-fg2); }
  .fr-place { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
  .fr-place a { color:inherit; text-decoration:none; }
  .fr-place a:hover { text-decoration:underline; }
  .fr-where { font-size:var(--nw-fs-small); color:var(--nw-fg2); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .fr-calm { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  .fr .nw-empty { margin:6px 0 0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  @container (max-width:340px) { .fr-body { grid-template-columns:1fr; } .fr-legend { flex-direction:row; flex-wrap:wrap; gap:6px 14px; } }
`;
