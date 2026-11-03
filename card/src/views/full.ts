// The full card: the banner, then « Aujourd'hui » and « Prévisions », each folded or unfolded with a tap on its title.
import { css, html, nothing, type TemplateResult } from 'lit';
import { t } from '../i18n';
import type { WeatherView } from '../view';
import type { BannerBlock } from '../types';
import type { Sections } from '../config';
import { renderAir, renderAirDays, type AirDays } from './air';
import { renderForecasts } from './forecasts';
import { bulletinBlock, renderHero } from './hero';
import { forecastStrip, frise, moments } from './tile';
import { renderToday } from './today';

export type SectionId = 'today' | 'predictions';
export interface FullOptions {
  sky: TemplateResult; uid: string; entity: string;
  /** A local thermometer: the feel is compared with it rather than with the bulletin. */
  station: boolean;
  /** What each section shows, in its order; an empty list removes the section. */
  sections: Sections;
  folded: Record<SectionId, boolean>;
  onFold: (id: SectionId) => void;
  /** The hours/days tiles of the banner: their tab and the switch between them. */
  tab: 'hours' | 'days'; onTab: (tab: 'hours' | 'days') => void;
  /** Where the banner shows the time, if it does. */
  clock?: 'none' | 'left' | 'right';
  /** The glass frame behind « En ce moment ». */
  nowFrame?: 'opaque' | 'clear' | 'none';
  /** The day of the air and pollens panels in « Aujourd'hui ». */
  air: AirDays;
}

function section(id: SectionId, title: string, subtitle: string, o: FullOptions, body: () => TemplateResult): TemplateResult {
  const folded = o.folded[id];
  const toggle = (e: Event) => { if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); o.onFold(id); };
  return html`<section class=${`fm-section${folded ? ' folded' : ''}`} aria-labelledby=${`${o.uid}-${id}`}>
    <header class="fm-head nw-section-head nw-fold-head" role="button" tabindex="0" aria-expanded=${!folded} @click=${toggle} @keydown=${toggle}>
      <h2 id=${`${o.uid}-${id}`}>${title}</h2><span class="nw-sum">${subtitle}</span>
      <span class="nw-chevron" aria-hidden="true"><i class="nw-chev"></i></span></header>
    ${folded ? nothing : html`<div class="fm-body">${body()}</div>`}
  </section>`;
}

/** The full card: the smart banner, « Aujourd'hui », then « Prévisions », always in this order, each with what it was asked to show. */
export function renderFull(v: WeatherView, o: FullOptions): TemplateResult {
  const { hero, banner, today, forecasts } = o.sections;
  const draw = (b: BannerBlock) => b === 'bulletin' ? html`<div class="hero-bulletin">${bulletinBlock(v)}</div>` : b === 'events' ? frise(v)
    : b === 'moments' ? moments(v) : forecastStrip(v, o.tab, o.onTab);
  return html`<div class="nw-full">
    ${hero ? renderHero(v, o.sky, o.uid, banner, draw, o.clock, o.nowFrame) : nothing}
    ${today.length ? section('today', t('Aujourd’hui'), v.comfort ? t('Mesures et ressenti') : t('Conditions actuelles'), o,
      () => renderToday(v, o.uid, o.station, renderAirDays(v.air, o.air), today)) : nothing}
    ${forecasts.length ? section('predictions', t('Prévisions'), v.forecastSource, o,
      // Tomorrow's air is a tab of « Aujourd'hui » when it shows there; « Prévisions » keeps it otherwise.
      () => renderForecasts(v, o.entity, o.uid, today.includes('air') ? nothing : renderAir(v.air.tomorrow), forecasts)) : nothing}
  </div>`;
}

export const fullStyles = css`
  .nw-full { container-type:inline-size; color:var(--nw-fg); }
  .fm-section { padding:20px 24px 24px; border-top:1px solid var(--nw-line-soft); }
  .nw-full > .fm-section:first-child { border-top:0; }
  .fm-head { display:flex; align-items:center; gap:10px; min-width:0; }
  .fm-section > .fm-head { cursor:pointer; user-select:none; -webkit-user-select:none; border-radius:var(--nw-radius); }
  .fm-head:focus-visible { outline:2px solid var(--nw-accent); outline-offset:4px; }
  .fm-head > span:not(.nw-chevron):not(.nw-chip):not(.nw-sum) { font-size:var(--nw-fs-small); color:var(--nw-fg2); flex:1; min-width:0; }
  .fm-body { display:grid; gap:16px; margin-top:16px; }
  @container (max-width:560px) { .fm-section { padding:16px 14px 18px; } }
`;
