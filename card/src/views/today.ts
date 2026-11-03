// « Aujourd'hui »: the feel, then rain, wind and pressure measured at home, each in the same panel model.
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { colon, currentLocale, fr, t } from '../i18n';
import type { ChartPeriodId, Chip, ComfortView, PressureView, RainDay, RainPeriodId, RainView, Season, SeasonName, Stat, WeatherView, WindView } from '../view';
import type { TodayBlock } from '../types';
import { chartEnd, chartY, curvePaths, extremePills, type ChartPaths, type ChartPill } from '../ui/charts';
import { chip, entity, info, label, legend, nf, panelHead } from '../ui/parts';
import { lightningPanel } from './lightning';
import { rainAhead } from './compact';
import { echelle } from '../ui/hestia-echelle';

const pills = (list: ChartPill[]) => list.map(p => html`<span class=${`pill${p.y < 30 ? ' low' : ''}`} style=${`left:${p.x}%;top:${p.y}%`}>${p.text}</span>`);
const stats = (list: Stat[]) => list.length ? html`<div class="nw-stats">${list.map(s => html`<div data-entity=${entity(s.entity)}>${label(s.label)}<b>${s.value}</b></div>`)}</div>` : nothing;
/** The wind and pressure charts' periods: span in seconds, title, axis. */
const PERIODS: Record<ChartPeriodId, { span: number; title: string; axis: [string, string] }> = {
  '6h': { span: 6 * 3600, title: fr('6 dernières heures'), axis: ['−6 h', '−3 h'] },
  '1d': { span: 86400, title: fr('24 dernières heures'), axis: ['−24 h', '−12 h'] },
  '2d': { span: 2 * 86400, title: fr('2 derniers jours'), axis: [fr('−2 j'), fr('−1 j')] },
  '7d': { span: 7 * 86400, title: fr('7 derniers jours'), axis: [fr('−7 j'), ''] },
};
/** The chart's axis: the start, the middle (none for the week, whose middle is three days and a half), now. */
const axis = (p: { axis: [string, string] }) => html`<div class="mini-axis"><span>${t(p.axis[0])}</span><span>${t(p.axis[1])}</span><span>${t('maint.')}</span></div>`;
/** The rain bars' periods: title, and the axis under many bars (each of the seven days has its own label). */
const RAIN: Record<RainPeriodId, { title: string; axis?: [string, string, string] }> = {
  '24h': { title: fr('24 dernières heures'), axis: ['−24 h', '−12 h', fr('maintenant')] },
  '7d': { title: fr('7 derniers jours') },
  '30d': { title: fr('30 derniers jours'), axis: [fr('−30 j'), fr('−15 j'), fr('aujourd’hui')] },
};
/** The parts a panel shows; all of them in the full card. */
export type Parts = ReadonlySet<string> | undefined;
const has = (parts: Parts, part: string) => !parts || parts.has(part);

/** A curve and, under it, a fill fading downwards (2 November, as the maquette): a flat line no longer sits on a solid block.
 * Its gradient is named after the card: two cards on a page never paint with each other's (3 November). */
const curve = (paths: ChartPaths[], color: string, id: string) => [svg`<defs><linearGradient id=${id} x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color=${color} stop-opacity=".3"/><stop offset="1" stop-color=${color} stop-opacity="0"/></linearGradient></defs>`, ...paths.map(p => svg`
  <path d=${p.area} fill=${`url(#${id})`}/>
  <path d=${p.line} fill="none" stroke=${color} stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`)];

/** The feel's scale, by season: the cursor moves within what the season brings, not on −5 to 45 °C all year (2 November). */
const SCALES: Record<SeasonName, [number, number]> = { winter: [-15, 20], spring: [-5, 30], summer: [5, 40], autumn: [-10, 25] };
/** What the feel panel reads around it: the wind measured, the conditions (humidity, sun, dew point) and the season. */
export interface Around { wind?: number; extras: Chip[]; season: Season }
/** The conditions the feel's tiles take in: the « extras » chips left are the pollens, which have their own panel. */
const ABSORBED = ['mdi:water-percent', 'mdi:thermometer-water', 'mdi:solar-power-variant-outline', 'mdi:sun-wireless-outline', 'mdi:brightness-5'];
export const leftExtras = (extras: Chip[]) => extras.filter(c => !ABSORBED.includes(c.icon));
const find = (list: Chip[], icon: string) => list.find(c => c.icon === icon);
/** A figure as the integration writes it (« −1,2 °C », « 0.6 °C »). */
const figure = (text?: string) => {
  const n = text === undefined ? NaN : parseFloat(text.replace('−', '-').replace(',', '.').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

/** The humidity in words when the feel has none for it. */
const humid = (h?: number) => h === undefined ? '' : h >= 70 ? t('air humide') : h <= 35 ? t('air sec') : '';

interface Factor { icon: string; title: string; value?: string; note: string; effect: string; theme: string }
/** What plays on the feel, in four tiles: wind, humidity, sun, dew point, each with its effect in one word. */
function factors(c: ComfortView, a: Around): Factor[] {
  const none = { effect: t('sans effet'), theme: 'calm' };
  const effect = (f: Chip | undefined, quiet: string) => f
    ? { effect: (figure(f.value) ?? 0) > 0 ? t('réchauffe') : t('refroidit'), theme: (figure(f.value) ?? 0) > 0 ? 'heat' : 'cold', note: t('{value} au ressenti', { value: f.value ?? '' }) }
    : { ...none, note: quiet };
  const wind = find(c.factors, 'mdi:weather-windy'), wet = find(c.factors, 'mdi:water-percent');
  const sun = find(c.factors, 'mdi:white-balance-sunny'), clear = find(c.factors, 'mdi:weather-night');
  const humidity = find(a.extras, 'mdi:water-percent'), solar = find(a.extras, 'mdi:solar-power-variant-outline'), uv = find(a.extras, 'mdi:sun-wireless-outline');
  const dew = find(a.extras, 'mdi:thermometer-water'), dewPoint = figure(dew?.value);
  const night = !sun && !(figure(solar?.value) ?? 0);
  const out: Factor[] = [
    { icon: 'mdi:weather-windy', title: t('Vent'), value: a.wind === undefined ? undefined : `${nf(a.wind, 0)} km/h`, ...effect(wind, t('n’ajoute rien')) },
    { icon: 'mdi:water-percent', title: t('Humidité'), value: humidity?.value, ...effect(wet, c.humidity || humid(figure(humidity?.value))) },
    { icon: night ? 'mdi:weather-night' : 'mdi:white-balance-sunny', title: t('Soleil'), value: night ? undefined : solar?.value,
      ...effect(sun ?? clear, night ? t('la nuit, il ne réchauffe pas') : uv ? `${uv.label} · ${uv.value}` : t('ne réchauffe pas')) },
    { icon: 'mdi:thermometer-water', title: t('Point de rosée'), value: dew?.value,
      ...dewPoint === undefined ? { ...none, note: '' }
        : dewPoint >= 18 ? { effect: t('attention'), theme: dewPoint >= 20 ? 'level2' : 'level1', note: dewPoint >= 20 ? t('air très lourd') : t('air lourd') }
        : dewPoint <= 1 && (c.temperature ?? 99) <= 5 ? { effect: t('attention'), theme: 'level1', note: t('gelée blanche possible') }
        : { ...none, note: t('sans gêne') } },
  ];
  // A tile with nothing measured nor any effect says nothing: it stays out.
  return out.filter(f => f.value !== undefined || f.effect !== none.effect || (f.title === t('Soleil') && night));
}

/** The feel's words on the thresholds the integration uses (UTCI), each with its colour of the charter. */
const WORDS: Array<[number, number, string, string]> = [
  [-99, -13, fr('Froid intense'), 'color-mix(in oklab,var(--nw-cold) 70%,var(--nw-wind))'], [-13, 0, fr('Froid'), 'var(--nw-cold)'],
  [0, 9, fr('Frais'), 'color-mix(in oklab,var(--nw-cold) 45%,var(--nw-calm))'], [9, 26, fr('Agréable'), 'var(--nw-calm)'],
  [26, 32, fr('Chaud'), 'var(--nw-level2)'], [32, 38, fr('Très chaud'), 'var(--nw-heat)'], [38, 99, fr('Chaleur intense'), 'var(--nw-level3)']];
const sign = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(n)}°`;

/** The feel's scale as the timeline (3 November): the season's track cut into the feel's words, in relief, each word in its part
 *  (moved aside from the value's dot); the value in a bubble tinted like its part, a fine stem to a small dot; the thresholds under it. */
function feelScale(feels: number, real: number | undefined, lo: number, hi: number, scale: string): TemplateResult {
  // The scale is built by the charter (hestia-echelle), the same as Hestia Confort's temperature: only the feel's data here.
  const parts = WORDS.filter(([a, b]) => b > lo && a < hi).map(([a, b, w, c]) => ({ from: Math.max(a, lo), to: Math.min(b, hi), word: t(w), tone: c }));
  // The real temperature, a fine line on the track without a label: the gap with the feel reads at a glance (3 November).
  return html`${echelle({ lo, hi, parts, value: feels, valueText: `${nf(feels)} °C`, label: t('Ressenti {t} °C', { t: nf(feels) }), degree: sign,
    outside: real === undefined ? undefined : { value: real } })}
    <div class="feel-ends"><span>${scale}</span><span>${t('seuils du ressenti')}</span></div>`;
}

export function comfortPanel(c: ComfortView, uid: string, station: boolean, a: Around, parts?: Parts, extras: TemplateResult | typeof nothing = nothing): TemplateResult {
  const [lo, hi] = SCALES[a.season.season] ?? SCALES.autumn;
  const gap = c.gap === undefined || Math.abs(c.gap) < .1 ? t('comme la température') : t(station ? '{gap} °C par rapport au thermomètre' : '{gap} °C par rapport à la température du bulletin',
    { gap: `${c.gap > 0 ? '+' : '−'}${nf(Math.abs(c.gap))}` });
  const explain = info(`${uid}-feel`, {
    title: t('Ressenti'),
    text: html`${t('C’est la température que le corps perçoit. L’humidité et le soleil la font monter, le vent la fait baisser.')}
      ${t('C’est une estimation, pas un indice officiel.')} <a href="https://github.com/hestiaFB/hestia-weather-integration/blob/main/docs/ressenti.md" target="_blank" rel="noopener noreferrer">${t('En savoir plus')}</a>
      <div class="ex">${t('Source : {source}', { source: c.source })}</div>`,
    example: c.example ? t('En ce moment : {example}.', { example: c.example }) : t('25 °C au thermomètre dans un air très humide se ressentent comme 30 °C.'),
  });
  const tiles = has(parts, 'factors') ? factors(c, a) : [];
  // « échelle de novembre »: the scale holds for the month's season (« d’octobre » before a vowel, in French).
  const month = new Intl.DateTimeFormat(currentLocale(), { month: 'long' }).format(new Date());
  const scale = /^[aeiouy]/i.test(month) ? t('échelle d’{month}', { month }) : t('échelle de {month}', { month });
  const calm = !c.factors.some(f => f.icon === 'mdi:weather-windy') && a.wind !== undefined && a.wind < 5;
  return html`<section class="nw-panel" aria-label=${t('Ressenti')}>${panelHead('mdi:thermometer', 'heat', t('Ressenti'), c.source, explain, { aside: t('maintenant') })}
    ${has(parts, 'feel') ? html`<div class="feel-row" data-entity=${entity(c.entity)}><div class="nw-value"><b>${nf(c.feels)}</b><span>°C</span></div>
      ${c.word ? html`<span class="feel-word">${c.word}</span>` : nothing}<span class="feel-say">${calm && gap === t('comme la température') ? t('comme la température : pas de vent pour l’abaisser') : gap}</span></div>` : nothing}
    ${has(parts, 'gauge') ? feelScale(c.feels, c.temperature, lo, hi, scale) : nothing}
    ${tiles.length ? html`<div class="feel-factors">${tiles.map(f => html`<div>
      <span class="ff-head"><span class="ff-t"><ha-icon icon=${f.icon}></ha-icon>${f.title}</span><span class="ff-eff" style=${`--c:var(--nw-${f.theme})`}>${f.effect}</span></span>
      <b>${f.value?.replace(/^-/, '−') ?? '—'}</b>${f.note ? html`<small>${f.note}</small>` : nothing}</div>`)}</div>` : nothing}
    ${extras}
  </section>`;
}

/** `ahead`: the rain to come in a few words (« rien d’ici 18 h »), after what fell. */
export function rainPanel(r: RainView, parts?: Parts, lead: TemplateResult | typeof nothing = nothing, ahead = ''): TemplateResult {
  const top = Math.max(1, ...(r.days ?? []).map(d => d.value ?? 0)), period = RAIN[r.period ?? '7d'], dense = (r.days?.length ?? 0) > 7;
  // Over many bars, only the wettest one says its amount; each bar gives its own on hover.
  const wettest = dense ? (r.days ?? []).reduce<RainDay | undefined>((a, d) => (d.value ?? 0) > (a?.value ?? 0) ? d : a, undefined) : undefined;
  // Hover: « 14 h » over a day, « 7/10 » over a month, the date over a week.
  const when = (d: RainDay) => r.period === '24h' ? d.label : r.period === '30d' ? `${d.label}/${d.date.slice(5, 7)}` : d.date;
  const now = r.rate !== undefined && r.rate > 0 ? chip({ theme: 'rain', icon: 'mdi:weather-rainy', value: `${nf(r.rate)} mm/h`, label: t('en ce moment'), entity: r.rateEntity })
    // Only while it rains: « no rain » tells nothing the sky does not already say.
    : r.status ? chip({ theme: 'rain', icon: 'mdi:weather-rainy', label: r.status }) : nothing;
  return html`<section class="nw-panel" aria-label=${t('Pluie')}>${panelHead('mdi:weather-rainy', 'rain', t('Pluie'), r.source)}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${r.entity}>
      ${r.text ? html`<div class="nw-value"><b class="word">${r.text}</b></div>`
        : html`<div class="nw-value"><b>${r.value === undefined ? '—' : nf(r.value, 1, true)}</b><span>${r.unit}</span></div>`}<small>${[r.label, ahead].filter(Boolean).join(' · ')}</small></div>${now}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini" title=${r.daysNote}><div class="mini-top">${t(period.title)} · ${r.total === undefined ? 'mm' : `${r.totalPartial ? '≥ ' : ''}${nf(r.total)} mm`}</div>
      ${r.days ? html`<div class=${`bars${dense ? ' dense' : ''}`} style=${`--n:${r.days.length}`} role="img" aria-label=${t('Pluie des {period}', { period: t(period.title) })}>${r.days.map(d => html`<div title=${colon(when(d), d.value === undefined ? t('indisponible') : d.partial ? t('au moins {mm} mm', { mm: nf(d.value) }) : `${nf(d.value)} mm`)}>
          <span>${d.value === undefined ? (dense ? '' : '—') : d.value && (!dense || d === wettest) ? `${d.partial ? '≥ ' : ''}${nf(d.value)}` : ''}</span>
          <i class=${d.value ? '' : 'zero'} style=${`height:${d.value ? Math.max(12, d.value / top * 74) : 5}%`}></i></div>`)}</div>
        ${period.axis ? html`<div class="mini-axis">${period.axis.map(x => label(t(x)))}</div>` : html`<div class="bars-axis">${r.days.map(d => label(d.label.replace('.', '')))}</div>`}`
      : html`<p class="nw-empty">${r.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') ? stats(r.stats) : nothing}
  </section>`;
}

export function windPanel(w: WindView, uid: string, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
  const color = 'var(--nw-wind)', end = chartEnd(w.mean, w.gust), period = PERIODS[w.period ?? '6h'];
  const mean = curvePaths(w.mean, w.top, end, 0, period.span), gust = curvePaths(w.gust, w.top, end, 0, period.span);
  return html`<section class="nw-panel" aria-label=${t('Vent')}>${panelHead('mdi:weather-windy', 'wind', t('Vent'), w.source)}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${w.entity}><div class="nw-value"><b>${w.value === undefined ? '—' : nf(w.value, 0)}</b><span>km/h</span></div>
      <small>${[w.description || w.label, w.bearing === undefined ? '' : from(w.bearing)].filter(Boolean).join(' · ')}</small></div>
      ${w.status ? chip({ theme: 'wind', icon: 'mdi:weather-windy', label: w.status }) : nothing}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini"><div class="mini-top">${t(period.title)} · km/h</div>
      ${mean.length || gust.length ? html`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${t('Vent des {period}, moyennes et rafales', { period: t(period.title) })}>
          ${gust.map(p => svg`<path d=${p.line} fill="none" stroke="color-mix(in oklab,var(--nw-wind) 55%,transparent)" stroke-width="2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`)}
          ${curve(mean, color, `${uid}-fill-wind`)}</svg>${pills(extremePills(w.mean, end, v => chartY(v, w.top), v => nf(v, 0), period.span))}</div>${axis(period)}`
      : html`<p class="nw-empty">${w.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') ? stats(w.stats) : nothing}
  </section>`;
}


export function pressurePanel(p: PressureView, uid: string, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
  const period = PERIODS[p.period ?? '6h'], end = chartEnd(p.series), series = curvePaths(p.series, p.top, end, p.low, period.span);
  // Nothing moves (within 1 hPa): one phrase rather than a chip and three equal figures (2 November).
  const known = p.series.flatMap(([, v]) => v === null ? [] : [v]), stable = known.length > 1 && Math.max(...known) - Math.min(...known) <= 1;
  return html`<section class="nw-panel" aria-label=${t('Pression')}>${panelHead('mdi:gauge', 'pressure', t('Pression'), p.source)}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${entity(p.entity)}><div class="nw-value"><b>${p.value === undefined ? '—' : nf(p.value, 0)}</b><span>hPa</span></div>
      <small>${stable && p.trend ? `${p.trend.label} · ${p.description}` : p.description}</small></div>${p.trend && !stable ? html`<span class="nw-say p-trend"><i class="nw-trend" data-way=${/down|baisse/.test(p.trend.icon + p.trend.label) ? 'down' : 'up'}></i>${p.trend.value ? html`<b>${p.trend.value}</b> ` : nothing}${p.trend.label}</span>` : nothing}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini"><div class="mini-top">${t(period.title)} · hPa</div>
      ${series.length ? html`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${t('Pression des {period}', { period: t(period.title) })}>${curve(series, 'var(--nw-pressure)', `${uid}-fill-pressure`)}</svg>${pills(extremePills(p.series, end, v => chartY(v, p.top, p.low), v => nf(v, 0), period.span))}</div>${axis(period)}`
        : html`<p class="nw-empty">${p.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') && !stable ? stats(p.stats) : nothing}
  </section>`;
}

/** Where the wind comes from, in words: « du nord-ouest ». */
const FROM = [fr('du nord'), fr('du nord-est'), fr('d’est'), fr('du sud-est'), fr('du sud'), fr('du sud-ouest'), fr('d’ouest'), fr('du nord-ouest')];
const from = (deg: number) => t(FROM[Math.round(((deg % 360 + 360) % 360) / 45) % 8]);

export const around = (v: WeatherView): Around => ({ wind: v.wind?.value, extras: v.extras, season: v.season.info });

const TODAY: TodayBlock[] = ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'extras', 'air'];

export function renderToday(v: WeatherView, uid: string, station: boolean, air: TemplateResult | typeof nothing, blocks: TodayBlock[] = TODAY): TemplateResult {
  // Without Blitzortung there is no lightning panel: the measures keep their row of three.
  const a = rainAhead(v), ahead = !v.hours.length ? '' : a.six >= .1 ? t('{mm} mm d’ici 6 h', { mm: nf(a.six) })
    : a.next ? t('pas de pluie avant {hour}', { hour: a.next }) : t('rien d’ici 18 h');
  const panel = (b: TodayBlock) => b === 'rain' ? v.rain && rainPanel(v.rain, undefined, nothing, ahead) : b === 'wind' ? v.wind && windPanel(v.wind, uid) : b === 'pressure' ? v.pressure && pressurePanel(v.pressure, uid)
    : b === 'lightning' ? v.lightning && lightningPanel(v.lightning) : undefined;
  // Measures that follow each other share one grid; the feel and the chips stand on their own.
  const out: unknown[] = [];
  let run: TemplateResult[] = [];
  const flush = () => { if (run.length) out.push(html`<div class=${`grid3 n${run.length}`}>${run}</div>`); run = []; };
  for (const b of blocks) {
    const p = panel(b);
    if (p) { run.push(p); continue; }
    flush();
    if (b === 'comfort' && v.comfort) out.push(comfortPanel(v.comfort, uid, station, around(v)));
    // The feel's tiles take in humidity, sun and dew point; the pollens left have their own panel.
    const extras = v.comfort && blocks.includes('comfort') ? [] : v.extras;
    if (b === 'extras' && extras.length) out.push(html`<div class="nw-chips extras">${extras.map(chip)}</div>`);
    if (b === 'air') out.push(air);
  }
  flush();
  return html`${out}`;
}

export const todayStyles = css`
  /* Three panels: one column on a phone, two then three as the card widens; the third never leaves a hole. */
  .grid3 { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
  @container (min-width:560px) { .grid3 { grid-template-columns:repeat(2, minmax(0,1fr)); } .grid3.n3 > :last-child, .grid3.n1 > * { grid-column:1/-1; } }
  @container (min-width:640px) { .grid3.n3 { grid-template-columns:repeat(3, minmax(0,1fr)); } .grid3.n3 > :last-child { grid-column:auto; } }
  .extras { justify-content:center; }
  .metric .word { font-size:var(--nw-fs-title); letter-spacing:-.2px; }
  .compass { width:72px; height:72px; flex:none; }
  /* The feel (2 November): the value and its word, the season's scale, then what plays on it in four delimited tiles. */
  .feel-row { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px 12px; }
  .feel-word { font-size:var(--nw-fs-text); font-weight:650; }
  .feel-say { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .feel-ends { display:flex; justify-content:space-between; margin:2px 6px 0; font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
  .feel-factors { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  @container (min-width:600px) { .feel-factors { grid-template-columns:repeat(4, minmax(0,1fr)); } }
  .feel-factors > div { container-type:inline-size; display:grid; gap:2px; align-content:start; padding:10px 12px; border-radius:12px; min-width:0;
    background:var(--nw-bg); border:1px solid color-mix(in srgb, var(--nw-fg) 14%, transparent); }
  /* The title stays on one line: when the effect does not fit beside it, it goes under. */
  /* As the maquette: the effect stays on the title's line; a long title (« Point de rosée ») wraps rather than it. */
  .ff-head { display:flex; justify-content:space-between; align-items:center; gap:6px; font-size:var(--nw-fs-small); color:var(--nw-fg2); min-width:0; }
  .ff-t { display:flex; align-items:center; gap:6px; min-width:0; line-height:1.3; }
  .ff-t ha-icon { flex:none; }
  .ff-head ha-icon { --mdc-icon-size:15px; }
  /* A narrow tile: the effect under the title in every tile alike, rather than over it. */
  @container (max-width:150px) { .ff-head { flex-direction:column; align-items:flex-start; gap:4px; } }
  .ff-eff { flex:none; padding:0 6px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-label); font-weight:700; white-space:nowrap;
    background:color-mix(in oklab, var(--c) 28%, transparent); color:color-mix(in oklab, var(--c) 40%, var(--nw-fg)); }
  .feel-factors b { font-size:var(--nw-fs-title); font-weight:500; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
  .feel-factors small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  /* Rain of the last seven days: the value on each bar. */
  .bars, .bars-axis { display:grid; grid-template-columns:repeat(var(--n, 7), 1fr); gap:6px; }
  .bars.dense { gap:2px; }
  .bars.dense span { overflow:visible; white-space:nowrap; }
  .bars { align-items:end; height:66px; }
  .bars > div { display:flex; flex-direction:column; justify-content:flex-end; height:100%; gap:3px; }
  .bars span { font-size:var(--nw-fs-label); font-weight:700; text-align:center; line-height:1; min-height:12px; white-space:nowrap; }
  .bars i { display:block; border-radius:5px 5px 2px 2px; background:color-mix(in oklab, var(--nw-rain) 80%, transparent); min-height:3px; }
  .bars i.zero { background:color-mix(in oklab, var(--nw-line) 80%, transparent); }
  .bars-axis { text-align:center; }
  .bars-axis .nw-label { font-size:var(--nw-fs-label); letter-spacing:.02em; }
  .bars:not(.dense), .bars-axis { gap:3px; }
`;
