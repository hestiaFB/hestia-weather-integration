// « Aujourd'hui »: the feel, then rain, wind and pressure measured at home, each in the same panel model.
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { colon, fr, t } from '../i18n';
import type { ChartPeriodId, ComfortView, PressureView, RainDay, RainPeriodId, RainView, Stat, WeatherView, WindView } from '../view';
import type { TodayBlock } from '../types';
import { chartEnd, chartY, curvePaths, extremePills, type ChartPaths, type ChartPill } from '../ui/charts';
import { chip, entity, info, label, legend, nf, panelHead, tempColor } from '../ui/parts';
import { lightningPanel } from './lightning';

const pills = (list: ChartPill[]) => list.map(p => html`<span class=${`pill${p.y < 30 ? ' low' : ''}`} style=${`left:${p.x}%;top:${p.y}%`}>${p.text}</span>`);
const stats = (list: Stat[]) => list.length ? html`<div class="stats">${list.map(s => html`<div data-entity=${entity(s.entity)}>${label(s.label)}<b>${s.value}</b></div>`)}</div>` : nothing;
/** The wind and pressure charts' periods: span in seconds, title, axis. */
const PERIODS: Record<ChartPeriodId, { span: number; title: string; axis: [string, string] }> = {
  '6h': { span: 6 * 3600, title: fr('6 dernières heures'), axis: ['−6 h', '−3 h'] },
  '1d': { span: 86400, title: fr('24 dernières heures'), axis: ['−24 h', '−12 h'] },
  '2d': { span: 2 * 86400, title: fr('2 derniers jours'), axis: [fr('−2 j'), fr('−1 j')] },
  '7d': { span: 7 * 86400, title: fr('7 derniers jours'), axis: [fr('−7 j'), ''] },
};
/** The chart's axis: the start, the middle (none for the week, whose middle is three days and a half), now. */
const axis = (p: { axis: [string, string] }) => html`<div class="mini-axis">${label(t(p.axis[0]))}${label(t(p.axis[1]))}${label(t('maintenant'))}</div>`;
/** The rain bars' periods: title, and the axis under many bars (each of the seven days has its own label). */
const RAIN: Record<RainPeriodId, { title: string; axis?: [string, string, string] }> = {
  '24h': { title: fr('24 dernières heures'), axis: ['−24 h', '−12 h', fr('maintenant')] },
  '7d': { title: fr('7 derniers jours') },
  '30d': { title: fr('30 derniers jours'), axis: [fr('−30 j'), fr('−15 j'), fr('aujourd’hui')] },
};
/** The parts a panel shows; all of them in the full card. */
export type Parts = ReadonlySet<string> | undefined;
const has = (parts: Parts, part: string) => !parts || parts.has(part);

const curve = (paths: ChartPaths[], color: string) => paths.map(p => svg`
  <path d=${p.area} fill=${`color-mix(in oklab,${color} 16%,transparent)`}/>
  <path d=${p.line} fill="none" stroke=${color} stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`);

export function comfortPanel(c: ComfortView, uid: string, station: boolean, parts?: Parts, extras: TemplateResult | typeof nothing = nothing): TemplateResult {
  const P = (t: number) => Math.min(100, Math.max(0, (t + 5) / 50 * 100));
  const gap = c.gap === undefined || Math.abs(c.gap) < .1 ? '' : t(station ? '{gap} °C par rapport au thermomètre' : '{gap} °C par rapport à la température du bulletin',
    { gap: `${c.gap > 0 ? '+' : '−'}${nf(Math.abs(c.gap))}` });
  const explain = info(`${uid}-feel`, {
    title: t('Ressenti'),
    text: html`${t('C’est la température que le corps perçoit. L’humidité et le soleil la font monter, le vent la fait baisser.')}
      ${t('C’est une estimation, pas un indice officiel.')} <a href="https://github.com/hestiaFB/hestia-weather-integration/blob/main/docs/ressenti.md" target="_blank" rel="noopener noreferrer">${t('En savoir plus')}</a>`,
    example: c.example ? t('En ce moment : {example}.', { example: c.example }) : t('25 °C au thermomètre dans un air très humide se ressentent comme 30 °C.'),
  });
  return html`<section class="nw-panel" aria-label=${t('Ressenti')}>${panelHead('mdi:thermometer', 'heat', t('Ressenti'), c.source, explain)}
    ${has(parts, 'feel') || has(parts, 'factors') && c.factors.length ? html`<div class="metric-row">
      ${has(parts, 'feel') ? html`<div class="metric" data-entity=${entity(c.entity)}><div class="metric-main"><b>${nf(c.feels)}</b><span>°C</span></div>
        <small>${[c.word ? html`<b>${c.word}</b>` : '', c.humidity, gap].filter(Boolean).map((x, i) => html`${i ? ' · ' : ''}${x}`)}</small></div>` : nothing}
      ${has(parts, 'factors') && c.factors.length ? html`<div class="nw-chips factors">${c.factors.map(chip)}</div>` : nothing}
    </div>` : nothing}
    ${has(parts, 'gauge') ? html`<div class="rail-line"><span>−5°</span><div class="rail">
      ${c.temperature === undefined ? nothing : html`<i class="thermo" style=${`left:${P(c.temperature)}%`} title=${t(station ? 'Thermomètre {t} °C' : 'Bulletin {t} °C', { t: nf(c.temperature) })}></i>`}
      <i class="feel" style=${`left:${P(c.feels)}%;--c:${tempColor(c.feels)}`} title=${t('Ressenti {t} °C', { t: nf(c.feels) })}></i></div><span>45°</span></div>` : nothing}
    ${extras}
  </section>`;
}

export function rainPanel(r: RainView, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
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
      ${r.text ? html`<div class="metric-main"><b class="word">${r.text}</b></div>`
        : html`<div class="metric-main"><b>${r.value === undefined ? '—' : nf(r.value, 1, true)}</b><span>${r.unit}</span></div>`}<small>${r.label}</small></div>${now}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini" title=${r.daysNote}><div class="mini-top">${t(period.title)} · ${r.total === undefined ? 'mm' : `${r.totalPartial ? '≥ ' : ''}${nf(r.total)} mm`}</div>
      ${r.days ? html`<div class=${`bars${dense ? ' dense' : ''}`} style=${`--n:${r.days.length}`} role="img" aria-label=${t('Pluie des {period}', { period: t(period.title) })}>${r.days.map(d => html`<div title=${colon(when(d), d.value === undefined ? t('indisponible') : d.partial ? t('au moins {mm} mm', { mm: nf(d.value) }) : `${nf(d.value)} mm`)}>
          <span>${d.value === undefined ? (dense ? '' : '—') : d.value && (!dense || d === wettest) ? `${d.partial ? '≥ ' : ''}${nf(d.value)}` : ''}</span>
          <i class=${d.value ? '' : 'zero'} style=${`height:${d.value ? Math.max(12, d.value / top * 74) : 5}%`}></i></div>`)}</div>
        ${period.axis ? html`<div class="mini-axis">${period.axis.map(x => label(t(x)))}</div>` : html`<div class="bars-axis">${r.days.map(d => label(d.label.replace('.', '')))}</div>`}`
      : html`<p class="nw-empty">${r.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') ? stats(r.stats) : nothing}
  </section>`;
}

export function windPanel(w: WindView, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
  const color = 'var(--nw-wind)', end = chartEnd(w.mean, w.gust), period = PERIODS[w.period ?? '6h'];
  const mean = curvePaths(w.mean, w.top, end, 0, period.span), gust = curvePaths(w.gust, w.top, end, 0, period.span);
  return html`<section class="nw-panel" aria-label=${t('Vent')}>${panelHead('mdi:weather-windy', 'wind', t('Vent'), w.source)}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${w.entity}><div class="metric-main"><b>${w.value === undefined ? '—' : nf(w.value, 0)}</b><span>km/h</span></div>
      <small>${w.label}${w.description ? ` · ${w.description}` : ''}</small></div>
      ${w.status ? chip({ theme: 'wind', icon: 'mdi:weather-windy', label: w.status }) : nothing}
      ${w.bearing === undefined ? nothing : html`<svg class="compass" viewBox="0 0 72 72" role="img" aria-label=${w.compass} data-entity=${entity(w.bearingEntity)}>
        <circle cx="36" cy="36" r="30" fill="color-mix(in oklab,var(--nw-wind) 10%,transparent)" stroke="var(--nw-line)"/>
        <text x="36" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="var(--nw-fg2)">N</text>
        <path d="M36 16 44 46 36 40 28 46Z" fill="color-mix(in oklab,var(--nw-wind) 75%,var(--nw-fg))" transform=${`rotate(${(w.bearing + 180) % 360} 36 36)`}/></svg>`}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini"><div class="mini-top">${t(period.title)} · km/h</div>
      ${mean.length || gust.length ? html`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${t('Vent des {period}, moyennes et rafales', { period: t(period.title) })}>
          ${gust.map(p => svg`<path d=${p.line} fill="none" stroke="color-mix(in oklab,var(--nw-wind) 55%,transparent)" stroke-width="2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`)}
          ${curve(mean, color)}</svg>${pills(extremePills(w.mean, end, v => chartY(v, w.top), v => nf(v, 0), period.span))}</div>${axis(period)}
        <div class="nw-legend">${legend(w.meanLabel, color)}${gust.length ? legend(t('Rafales'), color, 'dash') : nothing}</div>`
      : html`<p class="nw-empty">${w.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') ? stats(w.stats) : nothing}
  </section>`;
}


export function pressurePanel(p: PressureView, parts?: Parts, lead: TemplateResult | typeof nothing = nothing): TemplateResult {
  const period = PERIODS[p.period ?? '6h'], end = chartEnd(p.series), series = curvePaths(p.series, p.top, end, p.low, period.span);
  return html`<section class="nw-panel" aria-label=${t('Pression')}>${panelHead('mdi:gauge', 'pressure', t('Pression'), p.source)}${lead}
    ${has(parts, 'now') ? html`<div class="metric-row"><div class="metric" data-entity=${entity(p.entity)}><div class="metric-main"><b>${p.value === undefined ? '—' : nf(p.value, 0)}</b><span>hPa</span></div>
      <small>${p.description}</small></div>${p.trend ? chip(p.trend) : nothing}</div>` : nothing}
    ${has(parts, 'chart') ? html`<div class="mini"><div class="mini-top">${t(period.title)} · hPa</div>
      ${series.length ? html`<div class="mini-plot"><svg viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label=${t('Pression des {period}', { period: t(period.title) })}>${curve(series, 'var(--nw-pressure)')}</svg>${pills(extremePills(p.series, end, v => chartY(v, p.top, p.low), v => nf(v, 0), period.span))}</div>${axis(period)}`
        : html`<p class="nw-empty">${p.empty}</p>`}</div>` : nothing}
    ${has(parts, 'stats') ? stats(p.stats) : nothing}
  </section>`;
}

const TODAY: TodayBlock[] = ['comfort', 'rain', 'wind', 'pressure', 'lightning', 'extras', 'air'];

export function renderToday(v: WeatherView, uid: string, station: boolean, air: TemplateResult | typeof nothing, blocks: TodayBlock[] = TODAY): TemplateResult {
  // Without Blitzortung there is no lightning panel: the measures keep their row of three.
  const panel = (b: TodayBlock) => b === 'rain' ? v.rain && rainPanel(v.rain) : b === 'wind' ? v.wind && windPanel(v.wind) : b === 'pressure' ? v.pressure && pressurePanel(v.pressure)
    : b === 'lightning' ? v.lightning && lightningPanel(v.lightning) : undefined;
  // Measures that follow each other share one grid; the feel and the chips stand on their own.
  const out: unknown[] = [];
  let run: TemplateResult[] = [];
  const flush = () => { if (run.length) out.push(html`<div class=${`grid3 n${run.length}`}>${run}</div>`); run = []; };
  for (const b of blocks) {
    const p = panel(b);
    if (p) { run.push(p); continue; }
    flush();
    if (b === 'comfort' && v.comfort) out.push(comfortPanel(v.comfort, uid, station));
    if (b === 'extras' && v.extras.length) out.push(html`<div class="nw-chips extras">${v.extras.map(chip)}</div>`);
    if (b === 'air') out.push(air);
  }
  flush();
  return html`${out}`;
}

export const todayStyles = css`
  /* Three panels: one column on a phone, two then three as the card widens; the third never leaves a hole. */
  .grid3 { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
  @container (min-width:560px) { .grid3 { grid-template-columns:repeat(2, minmax(0,1fr)); } .grid3.n3 > :last-child, .grid3.n1 > * { grid-column:1/-1; } }
  @container (min-width:860px) { .grid3.n3 { grid-template-columns:repeat(3, minmax(0,1fr)); } .grid3.n3 > :last-child { grid-column:auto; } }
  .extras { justify-content:center; }
  .factors { justify-content:flex-end; }
  .metric .word { font-size:var(--nw-fs-title); letter-spacing:-.2px; }
  .compass { width:72px; height:72px; flex:none; }
  /* The feel gauge on one line, its bounds at both ends. */
  .rail-line { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:10px; font-size:var(--nw-fs-small); color:var(--nw-fg2); padding:6px 0 2px; }
  .rail { position:relative; height:8px; border-radius:var(--nw-radius-pill);
    background:linear-gradient(90deg, var(--nw-cold), var(--nw-rain) 28%, var(--nw-calm) 45%, var(--nw-level1) 62%, var(--nw-heat) 78%, var(--nw-level3)); }
  .rail .thermo { position:absolute; top:50%; width:3px; height:18px; margin:-9px 0 0 -1.5px; border-radius:2px; background:var(--nw-bg); box-shadow:0 0 0 1px var(--nw-line); }
  .rail .feel { position:absolute; top:50%; box-sizing:border-box; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%; background:var(--nw-bg); border:4px solid var(--c); box-shadow:0 1px 4px #0002; }
  /* Rain of the last seven days: the value on each bar. */
  .bars, .bars-axis { display:grid; grid-template-columns:repeat(var(--n, 7), 1fr); gap:6px; }
  .bars.dense { gap:2px; }
  .bars.dense span { overflow:visible; white-space:nowrap; }
  .bars { align-items:end; height:66px; }
  .bars > div { display:flex; flex-direction:column; justify-content:flex-end; height:100%; gap:3px; }
  .bars span { font-size:var(--nw-fs-small); font-weight:700; text-align:center; line-height:1; min-height:12px; }
  .bars i { display:block; border-radius:5px 5px 2px 2px; background:color-mix(in oklab, var(--nw-rain) 80%, transparent); min-height:3px; }
  .bars i.zero { background:color-mix(in oklab, var(--nw-line) 80%, transparent); }
  .bars-axis { text-align:center; }
`;
