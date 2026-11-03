// Air and pollens from Atmo France (index 1 to 6), Polleninformation or IRM KMI (0 to 4): the same panel for today (in « Aujourd'hui »)
// and tomorrow (in « Prévisions »).
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { currentLocale, t } from '../i18n';
import type { AirItem, AirPanel, AtmoReading, WeatherView } from '../view';
import { chip, label, nf, panelHead } from '../ui/parts';

/** The steps in the charter's colours. Atmo (6): good, fair, the three alert levels, the worst. Polleninformation (4): low to very high. */
const STEPS: Record<number, string[]> = { 6: ['calm', 'calm', 'level1', 'level2', 'level3', 'pressure'], 4: ['calm', 'level1', 'level2', 'level3'] };
/** The level when it is known and fresh; Polleninformation's 0 (« none ») is a real level, Atmo's scale starts at 1. */
const known = (r: AtmoReading | undefined, scale: number) => r && !r.stale && r.value !== undefined && r.value <= scale && (scale !== 6 || r.value >= 1) ? r.value : undefined;

/** The level as a ring (2 November, as the maquette): an arc filled up to the level, in the colour of its step, the level in the middle. */
function disc(r: AtmoReading | undefined, scale: number): TemplateResult {
  const value = known(r, scale), steps = STEPS[scale] ?? STEPS[6], C = 163.4;
  const color = value === undefined ? 'transparent' : `var(--nw-${steps[Math.max(0, Math.min(steps.length - 1, value - (scale === 6 ? 1 : 0)))]})`;
  const share = value === undefined ? 0 : Math.max(.04, value / scale);
  return html`<svg class="disc" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="none" stroke="color-mix(in oklab,var(--nw-fg) 8%,transparent)" stroke-width="7"/>
    ${svg`<circle cx="32" cy="32" r="26" fill="none" stroke=${color} stroke-width="7" stroke-linecap="round" stroke-dasharray=${`${(share * C).toFixed(1)} ${C}`} transform="rotate(-90 32 32)"/>`}
    <text x="32" y="38" text-anchor="middle" font-size="18" font-weight="300" fill="currentColor">${value ?? '–'}</text></svg>`;
}

/** One line per pollutant or species: its name, a bar up to its level in its step's colour, its level in words (or its concentration). */
function bars(p: AirPanel, scale: number): TemplateResult | typeof nothing {
  const steps = STEPS[scale] ?? STEPS[6];
  const rows = p.details.map(d => {
    const v = known(d.reading, scale);
    const color = v === undefined ? 'transparent' : `var(--nw-${steps[Math.max(0, Math.min(steps.length - 1, v - (scale === 6 ? 1 : 0)))]})`;
    // Level 0 (« none ») draws no bar; the words start lower-case, as the maquette (« très élevé »).
    const words = detail(d), lower = words.charAt(0).toLocaleLowerCase(currentLocale()) + words.slice(1);
    return html`<div data-entity=${d.reading.entityId}><span>${d.label}</span><i><b style=${`width:${!v ? 0 : Math.max(6, v / scale * 100)}%;--c:${color}`}></b></i><span>${lower}</span></div>`;
  });
  return rows.length ? html`<div class="aq-bars">${rows}</div>` : nothing;
}

/** What a detail line says: its level, or its concentration as published. */
function detail(item: AirItem): string {
  const r = item.reading, c = item.concentration;
  const concentration = (x: AtmoReading) => x.value === undefined ? t('concentration indisponible') : `${nf(x.value, 2)}${x.unit ? ` ${x.unit}` : ''}`;
  const value = r.unit !== undefined ? concentration(r) : `${r.label}${c ? ` · ${concentration(c)}` : ''}`;
  return `${value}${r.stale ? ` · ${t('données anciennes')}` : ''}`;
}

/** `tabs`: the today/tomorrow switch in the header, when the panel has both days; the day is then said by the tab. */
export function airPanel(p: AirPanel, tabs: unknown = nothing): TemplateResult {
  const air = p.kind === 'air', r = p.primary, scale = p.scale ?? 6, value = known(r, scale), atmo = scale === 6;
  // WAQI and Open-Meteo use Atmo's scale of 6 but name themselves.
  const source = p.source ?? (atmo ? 'Atmo France' : 'Polleninformation');
  const worse = p.worse ? known(p.worse.reading, scale) ?? 0 : 0;
  const absentForecast = !air && atmo && p.tomorrow && !r?.stale && r?.unavailableReason === 'no_index';
  const ambiguousZero = !air && atmo && p.details.some(d => d.concentration?.value === 0 && known(d.reading, scale) === undefined);
  // Pollens with their species: the ring beside the species' bars, which say it all; otherwise the ring and its word.
  const side = !air && p.details.length > 0;
  const word = absentForecast ? t('Prévision non disponible') : !r ? t('Indice non configuré') : r.stale ? t('Données anciennes') : r.value === 7 ? t('Événement signalé') : r.label;
  return html`<section class="nw-panel" aria-label=${air ? t(p.tomorrow ? 'Air extérieur demain' : 'Air extérieur aujourd’hui') : t(p.tomorrow ? 'Pollens demain' : 'Pollens aujourd’hui')}>
    ${panelHead(air ? 'mdi:air-filter' : 'mdi:flower-pollen-outline', 'calm', air ? t('Air extérieur') : t('Pollens'),
      p.updated ? `${source} · ${atmo && !p.source ? t('Publication Atmo : {date}.', { date: p.updated }) : t('Mise à jour {source} : {date}.', { source, date: p.updated })}` : source,
      undefined, { key: `${p.kind}-${p.tomorrow}`, end: tabs })}
    ${tabs !== nothing ? (p.zone ? html`<p class="nw-sub">${p.zone}</p>` : nothing) : html`<p class="nw-sub">${p.tomorrow ? t('Demain') : t('Aujourd’hui')}${p.zone ? ` · ${p.zone}` : ''}</p>`}
    <div class=${`aq${side ? ' pollen' : ''}`}><div class="aq-main" data-entity=${r?.entityId ?? nothing} role=${r ? 'button' : nothing} tabindex=${r ? 0 : nothing}>${disc(r, scale)}
      <div class="txt"><strong>${word}</strong>
        <small>${value !== undefined ? t('Niveau {value} sur {scale}', { value, scale }) : r?.value === 7 && atmo ? t('Code 7 · hors échelle') : absentForecast ? t('Indice pollen non fourni') : t('Niveau indisponible')}</small></div></div>
      ${side ? bars(p, scale) : nothing}</div>${side ? nothing : bars(p, scale)}
    ${absentForecast ? html`<p class="availability-note">${t('Atmo France ne fournit pas d’indice pollen exploitable pour demain à cet endroit.')}</p>` : nothing}
    ${p.worse ? html`<div class="nw-chips">${chip({ theme: `level${Math.min(3, Math.max(1, worse - (atmo ? 2 : 1)))}` as 'level1', icon: 'mdi:alert-circle-outline',
      value: p.worse.label, label: p.worse.reading.label.toLowerCase(), entity: p.worse.reading.entityId })}</div>` : nothing}
    ${ambiguousZero ? html`<p class="availability-note">${t('Une concentration à 0 peut être une valeur réelle ou remplacer une donnée manquante chez Atmo France. Elle ne permet pas, à elle seule, de conclure à une absence de pollen.')}</p>` : nothing}
    ${p.stale ? html`<p class="availability-note">${t('Certaines données sont anciennes : à vérifier dans l’intégration.')}</p>` : nothing}
  </section>`;
}

export const renderAir = (panels: AirPanel[]) => panels.length ? html`<div class="panels-two">${panels.map(p => airPanel(p))}</div>` : nothing;

/** Which day each panel shows, and the switch. */
export interface AirDays { tomorrow: Record<AirPanel['kind'], boolean>; onDay: (kind: AirPanel['kind'], tomorrow: boolean) => void }
const stop = (e: Event) => e.stopPropagation();
/** « Aujourd'hui »'s air and pollens (2 November): one panel each, today or tomorrow at a tap on its tabs. */
export function renderAirDays(air: WeatherView['air'], d: AirDays): TemplateResult | typeof nothing {
  const panels = (['air', 'pollen'] as const).flatMap(kind => {
    const today = air.today.find(p => p.kind === kind), next = air.tomorrow.find(p => p.kind === kind);
    const shown = d.tomorrow[kind] && next ? next : today ?? next;
    if (!shown) return [];
    const pick = (tomorrow: boolean) => (e: Event) => { stop(e); d.onDay(kind, tomorrow); };
    const tabs = today && next ? html`<span class="seg air-days" role="group" aria-label=${t('Jour affiché')}>
      <button type="button" aria-pressed=${!shown.tomorrow} @click=${pick(false)} @pointerdown=${stop}>${t('Aujourd’hui')}</button>
      <button type="button" aria-pressed=${shown.tomorrow} @click=${pick(true)} @pointerdown=${stop}>${t('Demain')}</button></span>` : nothing;
    return [airPanel(shown, tabs)];
  });
  return panels.length ? html`<div class="panels-two">${panels}</div>` : nothing;
}

export const airStyles = css`
  .panels-two { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; align-items:stretch; }
  .panels-two > :only-child { grid-column:1/-1; }
  @container (max-width:640px) { .panels-two { grid-template-columns:minmax(0,1fr); } }
  .availability-note { color:var(--nw-fg2); font-size:var(--nw-fs-small); line-height:1.5; }
  .air-days { margin-left:auto; }
  /* Air: the ring and its word, then the pollutants' bars under them. Pollens: the ring beside the species' bars. */
  .aq.pollen { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:16px; }
  .aq-main { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:16px; }
  .aq.pollen .aq-main { grid-template-columns:auto; }
  .aq.pollen .aq-main .txt { display:none; }
  .aq .disc { width:64px; height:64px; }
  .aq .txt { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .aq strong { font-size:17px; font-weight:650; }
  .aq small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .aq-bars { display:grid; gap:6px; min-width:0; }
  .aq-bars > div { display:grid; grid-template-columns:minmax(56px,auto) minmax(40px,1fr) auto; align-items:center; gap:8px; font-size:13px; }
  .aq-bars i { position:relative; display:block; height:5px; border-radius:9px; overflow:hidden; background:color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .aq-bars b { position:absolute; inset:0 auto 0 0; border-radius:9px; background:var(--c); }
  .aq-bars span:last-child { color:var(--nw-fg2); font-size:var(--nw-fs-small); text-align:right; white-space:nowrap; }
`;
