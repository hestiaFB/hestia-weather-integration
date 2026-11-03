// The small cards: « Mini » (one line), « Prévisions » (the hours and the days alone), the rain to come, and « Alerte » (only when there is one).
// A tap on Mini and Alerte opens the full card, like a long press on the tile.
import { css, html, nothing, type TemplateResult } from 'lit';
import { colon, hourText, t } from '../i18n';
import type { TickerPoint, WeatherView } from '../view';
import { alertBubble, alertPill, bubble, chip, label, nf } from '../ui/parts';
import { hoursChart, week } from './forecasts';
import type { PressTarget } from './tile';

/** One line: the sky and the temperature now, the place, and the most serious alert. */
export function renderMini(v: WeatherView, holdTarget: PressTarget): TemplateResult {
  const n = v.now, alert = v.alerts.find(a => a.official) ?? v.alerts[0];
  const place = v.location ? t('Météo à {place}', { place: v.location }) : t('Météo');
  return html`<div class=${`nw-mini${holdTarget === 'none' ? ' still' : ''}`} role=${holdTarget === 'none' ? 'group' : 'button'} tabindex=${holdTarget === 'none' ? -1 : 0}
      aria-label=${holdTarget === 'none' ? place : colon(place, holdTarget === 'page' ? t('appui pour la page météo') : t('appui pour la carte complète'))}>
    <ha-icon class="mini-icon" icon=${n.icon}></ha-icon>
    <span class="mini-temp">${n.temperature === undefined ? '—' : nf(n.temperature)}<small>°C</small></span>
    <span class="mini-text"><b>${n.label}</b>${v.location ? html`<span>${v.location}</span>` : nothing}</span>
    ${alert ? alertPill(alert) : nothing}
  </div>`;
}

/** What deserves to be seen now: the vigilances, the alert measured at home, then the serious points of the coming hours. */
export function alertItems(v: WeatherView): { alerts: WeatherView['alerts']; points: TickerPoint[] } {
  return { alerts: v.alerts, points: v.points.filter(p => p.level >= 2 && p.group !== 'official') };
}

/** Only while there is something serious; the card hides itself otherwise (a placeholder while the dashboard is being edited). */
export function renderAlert(v: WeatherView, editing: boolean): TemplateResult | typeof nothing {
  const { alerts, points } = alertItems(v);
  if (!alerts.length && !points.length) return editing
    ? html`<div class="nw-alertcard quiet-card"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><b>${t('Aucune alerte en ce moment.')}</b> ${t('Cette carte reste cachée tant que tout est calme.')}</span></div>`
    : nothing;
  return html`<div class="nw-alertcard" role="button" tabindex="0" aria-label=${t('Alertes météo : appui pour la carte complète')}>
    ${v.location ? html`<span class="place">${v.location}</span>` : nothing}
    ${alerts.map(a => alertBubble(a))}${points.map(p => bubble(p))}
  </div>`;
}

/** The hours (curve) or the days (table), with the switch between them when both are chosen. */
export function renderForecastCard(v: WeatherView, tab: 'hours' | 'days', onTab: (tab: 'hours' | 'days') => void, entity: string, uid: string,
                                   blocks: ReadonlyArray<string> = ['hours', 'days']): TemplateResult {
  const hasHours = blocks.includes('hours') && v.hours.some(h => h.temperature !== undefined), hasDays = blocks.includes('days') && v.days.length > 0;
  const shown = !hasHours ? 'days' : !hasDays ? 'hours' : tab;
  const select = (t: 'hours' | 'days') => (e: Event) => { e.stopPropagation(); onTab(t); };
  const body = !hasHours && !hasDays ? nothing : shown === 'hours' ? hoursChart(v.hours, v.provider, entity, uid) : week(v.days, v.provider, entity, v.hours, v.now.temperature);
  return html`<div class="nw-forecastcard">
    <div class="fcard-head"><span class="fcard-title"><b>${t('Prévisions')}</b>${v.location ? html`<span>${v.location}</span>` : nothing}</span>
      ${hasHours && hasDays ? html`<span class="seg" role="group" aria-label=${t('Prévisions affichées')}>
        <button type="button" aria-pressed=${shown === 'hours'} @click=${select('hours')}>${t('Heures')}</button>
        <button type="button" aria-pressed=${shown === 'days'} @click=${select('days')}>${t('Jours')}</button></span>` : nothing}</div>
    ${body === nothing ? html`<p class="nw-empty">${t('Prévisions indisponibles pour le moment.')}</p>` : body}
  </div>`;
}

/** The rain to come, from the forecast hours: within the hour, over 6 hours, and when the next rain starts. */
export function rainAhead(v: WeatherView): { hour: number; six: number; next?: string } {
  const hours = v.hours, sum = (n: number) => hours.slice(0, n).reduce((t, h) => t + (h.precipitation ?? 0), 0);
  const first = hours.find(h => h.precipitation >= .3);
  return { hour: sum(1), six: sum(6), next: first ? hourText(first.hour) : undefined };
}

/** « À venir »: the rain of the next hour and of the next six, or when the next rain starts. */
export function rainComing(v: WeatherView): TemplateResult {
  const ahead = rainAhead(v);
  const coming = !v.hours.length ? html`<p class="nw-empty">${t('Prévisions indisponibles pour le moment.')}</p>`
    : ahead.six < .1 ? html`<div class="nw-chips">${chip({ theme: 'calm', icon: 'mdi:weather-partly-cloudy', label: ahead.next ? t('Pas de pluie avant {hour}', { hour: ahead.next }) : t('Pas de pluie prévue d’ici 18 h') })}</div>`
    : html`<div class="nw-chips">${chip({ theme: 'rain', icon: 'mdi:timer-sand', value: `${nf(ahead.hour)} mm`, label: t('dans l’heure') })}
        ${chip({ theme: 'rain', icon: 'mdi:weather-pouring', value: `${nf(ahead.six)} mm`, label: t('sur 6 h') })}
        ${ahead.next && ahead.hour < .1 ? chip({ theme: 'rain', icon: 'mdi:clock-outline', label: t('à partir de {hour}', { hour: ahead.next }) }) : nothing}</div>`;
  return html`<div class="rain-ahead">${label(t('À venir'))}${coming}</div>`;
}

/** The wind to come over the next six hours: the strongest average wind and gust, and when it turns strong. */
export function windAhead(v: WeatherView): { wind?: number; gust?: number; strong?: string } {
  const six = v.hours.slice(0, 6), top = (xs: Array<number | undefined>) => xs.reduce<number | undefined>((a, x) => x === undefined ? a : Math.max(a ?? x, x), undefined);
  // The same thresholds as the integration: average wind from 30 km/h, gusts from 40 km/h.
  const first = six.find(h => (h.wind ?? 0) >= 30 || (h.gust ?? 0) >= 40);
  return { wind: top(six.map(h => h.wind)), gust: top(six.map(h => h.gust)), strong: first ? hourText(first.hour) : undefined };
}

/** « À venir » for the wind: the strongest wind and gust of the next six hours, and from when it blows hard. */
export function windComing(v: WeatherView): TemplateResult {
  const a = windAhead(v), theme = a.strong ? 'wind' : 'calm';
  const coming = a.wind === undefined && a.gust === undefined ? html`<p class="nw-empty">${t('Prévisions indisponibles pour le moment.')}</p>`
    : html`<div class="nw-chips">${a.wind === undefined ? nothing : chip({ theme, icon: 'mdi:weather-windy', value: `${nf(a.wind, 0)} km/h`, label: t('au plus sur 6 h') })}
        ${a.gust === undefined ? nothing : chip({ theme, icon: 'mdi:weather-windy-variant', value: `${nf(a.gust, 0)} km/h`, label: t('en rafales') })}
        ${a.strong ? chip({ theme: 'wind', icon: 'mdi:clock-outline', label: t('vent fort à partir de {hour}', { hour: a.strong }) }) : nothing}</div>`;
  return html`<div class="rain-ahead">${label(t('À venir'))}${coming}</div>`;
}

/** The pressure to come, when the weather provider forecasts it (Météo-France does not): its change over the next six hours. */
export function pressureAhead(v: WeatherView): { change: number; last: number; hour: string } | undefined {
  const known = v.hours.slice(0, 7).filter((h): h is typeof h & { pressure: number } => h.pressure !== undefined);
  if (known.length < 2) return undefined;
  const first = known[0], last = known[known.length - 1];
  return { change: last.pressure - first.pressure, last: last.pressure, hour: hourText(last.hour) };
}

/** « À venir » for the pressure: rising, falling or steady over the next six hours, and the value then.
 *  Most providers (Météo-France among them) do not forecast it: the block then stays away, unless it is the card's only part. */
export function pressureComing(v: WeatherView, alone = false): TemplateResult | typeof nothing {
  const a = pressureAhead(v);
  if (!a && !alone) return nothing;
  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${nf(Math.abs(n))} hPa`;
  const coming = !a ? html`<p class="nw-empty">${t('Votre fournisseur météo ne prévoit pas la pression.')}</p>`
    : html`<div class="nw-chips">${chip({ theme: Math.abs(a.change) >= 4 ? 'pressure' : 'calm', icon: 'mdi:gauge',
          value: Math.abs(a.change) < 1 ? undefined : signed(a.change), label: Math.abs(a.change) < 1 ? t('Pression stable sur 6 h') : t('sur 6 h') })}
        ${chip({ theme: 'pressure', icon: 'mdi:gauge', value: `${nf(a.last, 0)} hPa`, label: t('vers {hour}', { hour: a.hour }) })}</div>`;
  return html`<div class="rain-ahead">${label(t('À venir'))}${coming}</div>`;
}

const STORMY = ['lightning', 'lightning-rainy', 'hail'];
/** « À venir » for the lightning: a storm forecast within six hours, from the weather provider (Blitzortung only sees the strikes of now). */
export function stormComing(v: WeatherView): TemplateResult {
  const storm = v.hours.slice(0, 6).find(h => STORMY.includes(h.condition));
  const coming = !v.hours.length ? html`<p class="nw-empty">${t('Prévisions indisponibles pour le moment.')}</p>`
    : html`<div class="nw-chips">${storm ? chip({ theme: 'level2', icon: 'mdi:weather-lightning', label: t('Orage prévu vers {hour}', { hour: hourText(storm.hour) }) })
      : chip({ theme: 'calm', icon: 'mdi:weather-partly-cloudy', label: t('Pas d’orage prévu d’ici 6 h') })}</div>`;
  return html`<div class="rain-ahead">${label(t('À venir'))}${coming}</div>`;
}

export const compactStyles = css`
  .nw-mini { display:flex; align-items:center; gap:10px; padding:10px 14px; min-height:56px; box-sizing:border-box; cursor:pointer; color:var(--nw-fg); }
  .nw-mini.still { cursor:default; }
  .nw-mini:focus-visible, .nw-alertcard:focus-visible { outline:2px solid var(--nw-accent); outline-offset:-2px; }
  .mini-icon { --mdc-icon-size:30px; color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); flex:none; }
  .mini-temp { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-.6px; white-space:nowrap; line-height:1; }
  .mini-temp small { font-size:var(--nw-fs-small); font-weight:400; vertical-align:super; margin-left:1px; letter-spacing:0; }
  .mini-text { display:flex; flex-direction:column; min-width:0; flex:1; line-height:1.3; }
  .mini-text b { font-size:var(--nw-fs-text); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mini-text span { font-size:var(--nw-fs-small); color:var(--nw-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nw-mini .nw-alert { flex:none; max-width:46%; }
  /* Narrow: the sky, the temperature and the vigilance; the words give way. */
  @container (max-width:300px) { .mini-text { display:none; } .nw-mini .nw-alert { max-width:none; margin-left:auto; } }

  .nw-alertcard { display:flex; flex-direction:column; align-items:stretch; gap:8px; padding:12px 14px; cursor:pointer; color:var(--nw-fg); }
  .nw-alertcard .place { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-alertcard .nw-bubble { max-width:none; }
  .quiet-card { flex-direction:row; align-items:center; gap:10px; cursor:default; color:var(--nw-fg2); font-size:var(--nw-fs-text); }
  .quiet-card ha-icon { --mdc-icon-size:22px; color:color-mix(in oklab, var(--nw-calm) var(--nw-ink), var(--nw-fg)); flex:none; }
  .quiet-card b { color:var(--nw-fg); font-weight:600; }

  .nw-forecastcard { display:flex; flex-direction:column; gap:12px; padding:14px 16px 16px; }
  .fcard-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .fcard-title { display:flex; align-items:baseline; gap:8px; min-width:0; }
  .fcard-title b { font-size:var(--nw-fs-title); font-weight:700; letter-spacing:-.2px; }
  .fcard-title span { font-size:var(--nw-fs-small); color:var(--nw-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* The full card's panels, without their frame: the card is the frame. */
  .nw-forecastcard .nw-panel { border:0; padding:0; background:none; }
  .nw-forecastcard .nw-panel-head { display:none; }
  .rain-ahead { display:flex; flex-direction:column; gap:6px; padding-bottom:12px; border-bottom:1px solid var(--nw-line-soft); }
  .rain-ahead:last-child { padding-bottom:0; border-bottom:0; }
`;
