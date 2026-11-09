// The cards on their own: one part of the full card (the feel, the rain, the wind, the pressure, the air and pollens, the forecasts, the events),
// showing only the parts chosen for it. The panels are the full card's, without their frame: the card is the frame.
import { css, html, nothing, type TemplateResult } from 'lit';
import { t } from '../i18n';
import type { AirPanel, WeatherView } from '../view';
import type { CardBlock } from '../types';
import { chip, panelHead } from '../ui/parts';

/** Where Blitzortung is chosen: the integration's settings. */
const SETTINGS = '/config/integrations/integration/hestia_weather';
import { airPanel } from './air';
import { pressureComing, rainComing, renderForecastCard, stormComing, temperatureComing, windComing } from './compact';
import { around, comfortPanel, leftExtras, measurePanel, pressurePanel, rainPanel, windPanel } from './today';
import { lightningPanel } from './lightning';
import '../ui/frise';

export type SingleFormat = 'comfort' | 'temperature' | 'rain' | 'wind' | 'pressure' | 'lightning' | 'air' | 'forecast' | 'events';
export interface SingleOptions {
  uid: string; entity: string;
  /** A local thermometer: the feel is compared with it rather than with the bulletin. */
  station: boolean;
  tab: 'hours' | 'days'; onTab: (tab: 'hours' | 'days') => void;
  /** The panels' titles: false hides them (`show_title`, issue #21). */
  title?: boolean;
}

/** The air and pollen panels chosen, in their order. */
export function airPanels(v: WeatherView, blocks: CardBlock[]): AirPanel[] {
  const pick = (b: CardBlock) => {
    const [kind, day] = b.split('_') as ['air' | 'pollen', 'today' | 'tomorrow'];
    return (day === 'today' ? v.air.today : day === 'tomorrow' ? v.air.tomorrow : []).find(p => p.kind === kind);
  };
  return blocks.map(pick).filter((p): p is AirPanel => !!p);
}

export function renderSingle(v: WeatherView, format: SingleFormat, blocks: CardBlock[], o: SingleOptions): TemplateResult {
  if (format === 'forecast') return renderForecastCard(v, o.tab, o.onTab, o.entity, o.uid, blocks);
  if (format === 'events') return html`<div class="nw-single events">${eventsPanel(v)}</div>`;
  const parts = new Set<string>(blocks);
  const empty = (text: string) => html`<p class="nw-empty">${text}</p>`;
  let body: TemplateResult;
  if (!blocks.length) body = empty(t('Rien à afficher : cochez au moins un élément dans les réglages de la carte.'));
  else if (format === 'comfort') {
    // The tiles take in humidity, sun and dew point when they show; only the rest stays in chips.
    const left = parts.has('factors') ? leftExtras(v.extras) : v.extras;
    const extras = parts.has('extras') && left.length ? html`<div class="nw-chips extras">${left.map(chip)}</div>` : nothing;
    body = v.comfort ? comfortPanel(v.comfort, o.uid, o.station, around(v), parts, extras) : empty(t('Ressenti indisponible pour le moment.'));
  } else if (format === 'temperature') {
    // Issue #21: the temperature (to come, now, its curve and extremes), then the humidity's panel when it is chosen.
    const lead = parts.has('ahead') ? temperatureComing(v) : nothing;
    const temp = v.temperature ? measurePanel(v.temperature, { key: 'temperature', icon: 'mdi:thermometer', theme: 'heat', title: t('Température'), unit: '°C', digits: 1, trend: v.now.trend }, o.uid, parts, lead)
      : parts.has('ahead') || parts.has('now') || parts.has('chart') || parts.has('stats')
        ? html`<section class="nw-panel" aria-label=${t('Température')}>${panelHead('mdi:thermometer', 'heat', t('Température'), v.provider)}${lead === nothing ? empty(t('Température indisponible pour le moment.')) : lead}</section>` : nothing;
    const hum = parts.has('humidity') ? v.humidity ? measurePanel(v.humidity, { key: 'humidity', icon: 'mdi:water-percent', theme: 'rain', title: t('Humidité'), unit: '%', digits: 0 }, o.uid, parts)
      : html`<section class="nw-panel" aria-label=${t('Humidité')}>${panelHead('mdi:water-percent', 'rain', t('Humidité'), v.provider)}${empty(t('Humidité indisponible pour le moment.'))}</section>` : nothing;
    body = html`${temp}${hum}`;
  } else if (format === 'rain') {
    const lead = parts.has('ahead') ? rainComing(v) : nothing;
    // Without a rain gauge nor a bulletin amount, the rain to come still has its panel.
    body = v.rain ? rainPanel(v.rain, parts, lead)
      : html`<section class="nw-panel" aria-label=${t('Pluie')}>${panelHead('mdi:weather-rainy', 'rain', t('Pluie'), v.provider)}${lead === nothing ? empty(t('Pluie indisponible pour le moment.')) : lead}</section>`;
  } else if (format === 'wind') {
    const lead = parts.has('ahead') ? windComing(v) : nothing;
    // Without a wind sensor, the wind to come still has its panel, like the rain.
    body = v.wind ? windPanel(v.wind, o.uid, parts, lead) : lead === nothing ? empty(t('Vent indisponible pour le moment.'))
      : html`<section class="nw-panel" aria-label=${t('Vent')}>${panelHead('mdi:weather-windy', 'wind', t('Vent'), v.provider)}${lead}</section>`;
  } else if (format === 'pressure') {
    const lead = parts.has('ahead') ? pressureComing(v, parts.size === 1) : nothing;
    body = v.pressure ? pressurePanel(v.pressure, o.uid, parts, lead) : lead === nothing ? empty(t('Pression indisponible pour le moment.'))
      : html`<section class="nw-panel" aria-label=${t('Pression')}>${panelHead('mdi:gauge', 'pressure', t('Pression'), v.provider)}${lead}</section>`;
  } else if (format === 'lightning') body = v.lightning ? lightningPanel(v.lightning, parts, parts.has('ahead') ? stormComing(v) : nothing)
    // Blitzortung is a third-party integration: the card says what it brings and where to choose it.
    : html`<section class="nw-panel lz-missing" aria-label=${t('Éclairs')}>${panelHead('mdi:flash', 'wind', t('Éclairs'), 'Blitzortung')}
        <p>${t('Cette carte montre les éclairs autour de chez vous grâce à Blitzortung, un réseau de détecteurs bénévoles. Installez l’extension depuis HACS, puis choisissez-la dans les réglages de Hestia Weather.')}</p>
        <div class="links"><a href="https://github.com/mrk-its/homeassistant-blitzortung" target="_blank" rel="noopener noreferrer">${t('Installer Blitzortung')}</a>
          <a class="second" href=${SETTINGS}>${t('Réglages de Hestia Weather')}</a></div></section>`;
  else {
    const panels = airPanels(v, blocks);
    body = panels.length ? html`<div class="panels-two">${panels.map(p => airPanel(p))}</div>` : empty(t('Air et pollens indisponibles pour le moment.'));
  }
  return html`<div class=${`nw-single ${format}${o.title === false ? ' untitled' : ''}`}>${body}</div>`;
}

/** The banner's timeline alone (issue #15): the forecast sky of the coming hours and its points, for small screens. */
function eventsPanel(v: WeatherView): TemplateResult {
  // The card is the frame: no title nor glass around the timeline, whose sentence already says what comes.
  return html`<section aria-label=${t('Événements')}>${v.points.length || v.alerts.length || v.hours.length || v.timeline?.length
    ? html`<hestia-frise bare .points=${v.points} .alerts=${v.alerts} .hours=${v.hours} .timeline=${v.timeline}></hestia-frise>`
    : html`<p class="nw-empty">${t('Événements indisponibles pour le moment.')}</p>`}</section>`;
}

export const singleStyles = css`
  .nw-single { padding:14px 16px 16px; color:var(--nw-fg); }
  .nw-single .nw-panel { border:0; padding:0; background:none; }
  /* Without titles (issue #21): the card shows only what it measures, as a sensor tile would. */
  .nw-single.untitled .nw-panel-head { display:none; }
  /* Température: the humidity under the temperature, past a soft line. */
  .nw-single.temperature { display:flex; flex-direction:column; gap:18px; }
  .nw-single.temperature .nw-panel + .nw-panel { padding-top:16px; border-top:1px solid var(--nw-line-soft); border-radius:0; }
  .nw-single .extras { justify-content:flex-start; }
  .lz-missing p { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); line-height:1.5; }
  .lz-missing .links { display:flex; flex-wrap:wrap; gap:8px; }
  .lz-missing a { display:inline-block; padding:6px 14px; border-radius:var(--nw-radius-pill); background:var(--nw-accent); color:var(--nw-bg); font-weight:600; text-decoration:none; font-size:var(--nw-fs-small); }
  .lz-missing a.second { background:none; color:var(--nw-accent); box-shadow:inset 0 0 0 1px var(--nw-line); }
  .nw-single.air .panels-two { gap:24px 20px; }
  .nw-single.events { padding:2px 0; }
  .nw-single.events .nw-empty { padding:12px 16px; margin:0; }
  .nw-single .lz-radar { max-width:210px; }
`;
