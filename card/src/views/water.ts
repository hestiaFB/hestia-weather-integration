// « Restrictions d'eau » (issue #25): Vigieau's level for the home's commune, on five steps, and the restricted uses one by one.
import { css, html, nothing, type TemplateResult } from 'lit';
import { fr, t } from '../i18n';
import type { WaterView } from '../view';
import { entity, label, panelHead } from '../ui/parts';
import type { Parts } from './today';

/** The five levels, no restriction to crisis, and their colours. */
const STEPS: Array<[string, string]> = [[fr('Aucune'), 'calm'], [fr('Vigilance'), 'level1'], [fr('Alerte'), 'level2'], [fr('Alerte renforcée'), 'level3'], [fr('Crise'), 'level3']];
const has = (parts: Parts, part: string) => !parts || parts.has(part);
/** A use about watering: the gardener looks for it first. */
const watering = (use: string) => /arros/i.test(use.normalize('NFD').replace(/[̀-ͯ]/g, ''));

const steps = (level: number) => html`<div class="wt-steps" role="img" aria-label=${t('Niveau : {step}', { step: t(STEPS[level][0]) })}>
  ${STEPS.map(([word], i) => html`<div class=${i === level ? 'on' : ''}><i class=${i <= level && level > 0 ? 'lit' : ''} style=${`--c:var(--nw-${STEPS[level][1]})`}></i>${label(t(word))}</div>`)}</div>`;

export function waterPanel(w: WaterView, parts?: Parts): TemplateResult {
  const theme = STEPS[w.level][1];
  // Watering first: it is what the household checks before the evening.
  const uses = [...w.usages.filter(watering), ...w.usages.filter(u => !watering(u))];
  return html`<section class="nw-panel wt" aria-label=${t('Restrictions d’eau')}>${panelHead('mdi:water-off', theme === 'calm' ? 'rain' : theme, t('Restrictions d’eau'), w.source)}
    ${has(parts, 'now') ? html`<div class="wt-now" data-entity=${entity(w.entity)}>
        <div><b class=${w.level ? 'nw-ink' : ''} style=${w.level ? `--c:var(--nw-${theme})` : ''}>${w.label}</b>
          <small>${w.level >= 2 ? w.watering ? t('L’arrosage fait partie des usages restreints.') : t('L’arrosage n’est pas restreint.') : w.headline}</small></div>
        ${steps(w.level)}</div>` : nothing}
    ${has(parts, 'list') && w.level >= 2 ? uses.length
      ? html`<div class="wt-uses">${label(t(uses.length > 1 ? '{n} usages restreints' : '{n} usage restreint', { n: uses.length }))}
          <ul>${uses.map(u => html`<li class=${watering(u) ? 'garden' : ''}><ha-icon icon=${watering(u) ? 'mdi:sprinkler-variant' : 'mdi:water-outline'}></ha-icon><span>${u}</span></li>`)}</ul></div>`
      : html`<p class="nw-empty">${t('Vigieau ne détaille pas les usages restreints.')}</p>` : nothing}
    ${w.order && w.level >= 1 ? html`<a class="wt-order" href=${w.order} target="_blank" rel="noopener noreferrer"><ha-icon icon="mdi:file-document-outline"></ha-icon>${t('Lire l’arrêté préfectoral')}</a>` : nothing}
  </section>`;
}

/** Vigieau not chosen: what it brings and where to choose it. */
export function waterMissing(settings: string): TemplateResult {
  return html`<section class="nw-panel lz-missing" aria-label=${t('Restrictions d’eau')}>${panelHead('mdi:water-off', 'rain', t('Restrictions d’eau'), 'Vigieau')}
    <p>${t('Cette carte montre les restrictions d’eau de votre commune grâce à Vigieau. Installez l’extension depuis HACS, puis choisissez-la dans les réglages de Hestia Weather.')}</p>
    <div class="links"><a href="https://github.com/kamaradclimber/vigieau" target="_blank" rel="noopener noreferrer">${t('Installer Vigieau')}</a>
      <a class="second" href=${settings}>${t('Réglages de Hestia Weather')}</a></div></section>`;
}

export const waterStyles = css`
  .wt-now { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
  .wt-now > div:first-child { display:flex; flex-direction:column; gap:4px; min-width:0; }
  .wt-now b { font-size:var(--nw-fs-case); font-weight:600; letter-spacing:-.015em; }
  .wt-now b.nw-ink { font-size:var(--nw-fs-case); }
  .wt-now small { font-size:var(--nw-fs-text); color:var(--nw-fg2); line-height:1.45; }
  .wt-steps { display:flex; flex-direction:column-reverse; gap:6px; }
  .wt-steps div { display:flex; align-items:center; gap:8px; }
  .wt-steps div:not(.on) .nw-label { opacity:.7; }
  .wt-steps div.on .nw-label { color:var(--nw-fg); }
  .wt-steps i { width:26px; height:8px; border-radius:4px; background:color-mix(in srgb, var(--nw-fg) 9%, transparent); flex:none; }
  .wt-steps i.lit { background:var(--c); }
  .wt-uses { margin-top:14px; }
  .wt-uses ul { list-style:none; margin:6px 0 0; padding:0; }
  .wt-uses li { display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-top:1px solid var(--nw-line-soft); font-size:var(--nw-fs-text); line-height:1.4; --mdc-icon-size:18px; }
  .wt-uses li:first-child { border-top:0; }
  .wt-uses li ha-icon { flex:none; color:var(--nw-fg2); margin-top:1px; }
  .wt-uses li.garden { font-weight:600; }
  .wt-uses li.garden ha-icon { color:color-mix(in oklab, var(--nw-rain) 70%, var(--nw-fg)); }
  .wt-order { display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:var(--nw-fs-small); font-weight:600; color:var(--nw-accent); text-decoration:none; --mdc-icon-size:16px; }
  .wt .nw-empty { margin:10px 0 0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  @container (max-width:340px) { .wt-now { grid-template-columns:1fr; } .wt-steps { flex-direction:row; flex-wrap:wrap; gap:6px 12px; } }
`;
