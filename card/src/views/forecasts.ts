// « Prévisions »: the next 18 hours as a curve, the next 7 days as a table.
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { colon, hourMark, t } from '../i18n';
import type { DayForecast, Slot, WeatherView } from '../view';
import { label, legend, nf, panelHead, tempColor, windArrow, windTip } from '../ui/parts';

/** The hour under the finger: a line on the curve and a bubble with its time, temperature, rain and wind (2 November, as the maquette). */
function scrub(hours: Slot[]) {
  const move = (e: PointerEvent) => {
    const box = e.currentTarget as HTMLElement, r = box.getBoundingClientRect(), n = hours.length;
    const i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (n - 1)), h = hours[i], x = i / (n - 1) * r.width;
    const line = box.querySelector<HTMLElement>('.fc-scrub'), tip = box.querySelector<HTMLElement>('.fc-tip');
    if (!line || !tip) return;
    line.style.left = `${x}px`;
    tip.textContent = [i ? hourMark(h.hour) : t('Maintenant'), h.temperature === undefined ? '' : `${nf(h.temperature, 0)} °C`,
      h.precipitation >= .1 ? `${nf(h.precipitation)} mm` : '', h.wind === undefined ? '' : windTip(nf(h.wind, 0), h.bearing)].filter(Boolean).join(' · ');
    tip.style.left = `${Math.min(r.width - tip.offsetWidth / 2, Math.max(tip.offsetWidth / 2, x))}px`;
    box.classList.add('scrubbing');
  };
  const leave = (e: Event) => (e.currentTarget as HTMLElement).classList.remove('scrubbing');
  return { move, leave };
}

export function hoursChart(hours: Slot[], source: string, entity: string, uid: string): TemplateResult | typeof nothing {
  const points = hours.map((h, i) => ({ h, i })).filter(p => p.h.temperature !== undefined);
  if (points.length < 3) return nothing;
  const n = hours.length, step = 100 / (n - 1), X = (i: number) => i * step;
  const temps = points.map(p => p.h.temperature!), lo = Math.min(...temps) - 1.5, hi = Math.max(...temps) + 1.5;
  const Y = (t: number) => (1 - (t - lo) / (hi - lo)) * 64 + 14; // % of the height: room above for the pills, below for the rain
  const xy = points.map(p => [X(p.i), Y(p.h.temperature!)] as const);
  const line = xy.map(([x, y], i) => i ? `C${xy[i - 1][0] + (x - xy[i - 1][0]) / 2} ${xy[i - 1][1]} ${xy[i - 1][0] + (x - xy[i - 1][0]) / 2} ${y} ${x} ${y}` : `M${x} ${y}`).join(' ');
  const max = points.reduce((a, b) => b.h.temperature! > a.h.temperature! ? b : a), min = points.reduce((a, b) => b.h.temperature! < a.h.temperature! ? b : a);
  const peak = Math.max(2, ...hours.map(h => h.precipitation)), rain = hours.some(h => h.precipitation >= .1);
  const nights: Array<[number, number]> = [];
  hours.forEach((h, i) => { if (!h.night) return; const last = nights.at(-1); if (last && last[1] === i - 1) last[1] = i; else nights.push([i, i]); });
  // Every three hours from now, each under its point of the curve: the hour and its sky.
  const ticks = hours.map((_, i) => i).filter(i => i % 3 === 0);
  const pill = (p: { h: Slot; i: number }) => { const y = Y(p.h.temperature!);
    return html`<span class=${`pill${y < 30 ? ' low' : ''}`} style=${`left:${Math.min(94, Math.max(6, X(p.i)))}%;top:${y}%`}>${nf(p.h.temperature!, 0)}°</span>`; };
  // Unique names: a gradient must never be looked up in another copy of the chart.
  const stroke = `${uid}-fs`, fill = `${uid}-fa`, finger = scrub(hours);
  return html`<section class="nw-panel" aria-label=${t('18 prochaines heures')}>${panelHead('mdi:thermometer', 'wind', t('18 prochaines heures'), source)}
    <div class="fc" @pointermove=${finger.move} @pointerdown=${finger.move} @pointerleave=${finger.leave}>
      <div class="fc-plot" role="img" aria-label=${`${t('Températures de {low} à {high} °C', { low: nf(min.h.temperature!, 0), high: nf(max.h.temperature!, 0) })}${rain ? t(', pluie jusqu’à {mm} mm par heure', { mm: nf(Math.max(...hours.map(h => h.precipitation))) }) : t(', pas de pluie prévue')}`}>
        ${nights.map(([a, b]) => { const left = Math.max(0, X(a) - step / 2), right = Math.min(100, X(b) + step / 2);
          return html`<i class="fc-night" style=${`left:${left}%;width:${right - left}%`}></i>`; })}
        ${hours.map((h, i) => h.precipitation >= .1 ? html`<i class="fc-bar" style=${`left:calc(${X(i)}% - 5px);height:${Math.max(4, h.precipitation / peak * 20)}%`}></i>` : nothing)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>
          <linearGradient id=${stroke} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)"/><stop offset=".5" stop-color="var(--nw-calm)"/><stop offset="1" stop-color="var(--nw-cold)"/></linearGradient>
          <linearGradient id=${fill} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-heat)" stop-opacity=".22"/><stop offset="1" stop-color="var(--nw-cold)" stop-opacity="0"/></linearGradient></defs>
          ${svg`<path d=${`${line} L${xy.at(-1)![0]} 82 L${xy[0][0]} 82Z`} fill=${`url(#${fill})`}/><path class="fc-line" d=${line} stroke=${`url(#${stroke})`}/>`}</svg>
        <i class="fc-dot" style=${`left:${xy[0][0]}%;top:${xy[0][1]}%`}></i>
        ${pill(max)}${min.i !== max.i && nf(min.h.temperature!, 0) !== nf(max.h.temperature!, 0) ? pill(min) : nothing}
      </div>
      <i class="fc-scrub"></i><span class="fc-tip"></span>
      <div class="fc-hours" data-entity=${entity}>${ticks.map(i => { const h = hours[i];
        // The wind under each tick (3 November): where it blows to, and how strong, the gust in the tooltip.
        return html`<div style=${`left:${X(i)}%`} title=${h.conditionLabel}><span>${i ? hourMark(h.hour) : t('Maint.')}</span><ha-icon icon=${h.icon}></ha-icon>
          ${h.wind === undefined ? nothing : html`<span class="fc-wind" title=${windTip(nf(h.wind, 0), h.bearing, h.gust !== undefined && h.gust > h.wind ? nf(h.gust, 0) : undefined)}>${h.bearing === undefined ? nothing : windArrow(h.bearing)}${nf(h.wind, 0)}</span>`}</div>`; })}</div>
      ${hours.some(h => h.wind !== undefined) ? html`<p class="fc-unit">${t('Vent en km/h')}</p>` : nothing}
    </div>
    <p class="fc-hint">${t('Glissez le doigt sur la courbe pour lire chaque heure.')}</p>
  </section>`;
}

/** A day's hours as a small curve, when the forecast reaches them (today and tomorrow). */
function dayCurve(hours: Slot[]): TemplateResult | typeof nothing {
  const known = hours.filter(h => h.temperature !== undefined);
  if (known.length < 3) return nothing;
  const temps = known.map(h => h.temperature!), lo = Math.min(...temps) - 1, hi = Math.max(...temps) + 1;
  const xy = known.map((h, i) => [i / (known.length - 1) * 300, 42 - (h.temperature! - lo) / (hi - lo) * 34] as const);
  const d = xy.map(([x, y], i) => i ? `C${(xy[i - 1][0] + x) / 2} ${xy[i - 1][1]} ${(xy[i - 1][0] + x) / 2} ${y} ${x} ${y}` : `M${x} ${y}`).join(' ');
  return html`<svg class="dx-curve" viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden="true">${svg`<path d=${d} fill="none" stroke="var(--nw-heat)" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`}</svg>
    <div class="dx-axis">${[known[0], known[Math.floor(known.length / 2)], known.at(-1)!].map(h => html`<span>${hourMark(h.hour)}</span>`)}</div>`;
}

export function week(days: DayForecast[], source: string, entity: string, hours: Slot[] = [], now?: number): TemplateResult | typeof nothing {
  if (!days.length) return nothing;
  const lows = days.flatMap(d => d.low ?? d.high ?? []), highs = days.flatMap(d => d.high ?? d.low ?? []);
  const lo = Math.min(...lows), hi = Math.max(...highs, lo + 1), P = (t: number) => (t - lo) / (hi - lo) * 100;
  // The hours count their days from today, which may not be the first row (yesterday stays listed just after midnight).
  const first = Math.max(0, days.findIndex(d => d.today));
  // Each bar shows its part of the week's colours, cold to heat, as if cut from one strip; today carries the temperature now.
  const range = (d: DayForecast) => {
    if (d.low === undefined || d.high === undefined) return nothing;
    const left = P(d.low), width = Math.max(2, P(d.high) - P(d.low));
    const dot = d.today && now !== undefined && d.high > d.low ? Math.min(100, Math.max(0, (now - d.low) / (d.high - d.low) * 100)) : undefined;
    return html`<i style=${`left:${left}%;width:${width}%;background-size:${(100 / width * 100).toFixed(1)}% 100%;background-position:${width >= 100 ? 0 : (left / (100 - width) * 100).toFixed(1)}% 0`}>${dot === undefined ? nothing : html`<b style=${`left:${dot}%`}></b>`}</i>`;
  };
  return html`<section class="nw-panel" aria-label=${t('{n} prochains jours', { n: days.length })}>${panelHead('mdi:white-balance-sunny', 'wind', t('{n} prochains jours', { n: days.length }), source)}
    <div class="wk">${days.map((d, k) => html`<details>
      <summary aria-label=${`${d.label} : ${d.conditionLabel}`}><span class=${`day${d.today ? ' today' : ''}`}>${d.label}</span>
        <ha-icon icon=${d.icon} title=${d.conditionLabel}></ha-icon>
        <span class="rain">${d.rain >= .1 ? html`<ha-icon icon="mdi:water-outline"></ha-icon>${nf(d.rain)} mm` : ''}</span>
        <span class="lo">${d.low === undefined ? '' : `${d.low}°`}</span>
        <span class="track">${range(d)}</span>
        <span class="hi">${d.high === undefined ? '—' : `${d.high}°`}</span>
        <i class="nw-chev"></i></summary>
      <div class="dx">${dayCurve(hours.filter(h => h.day === k - first))}
        <p>${[d.conditionLabel, d.wind === undefined ? '' : windTip(d.wind, d.bearing, d.gust !== undefined && d.gust > d.wind ? d.gust : undefined, true),
          d.rain >= .1 ? colon(t('Pluie'), `${nf(d.rain)} mm`) : ''].filter(Boolean).join(' · ')}</p></div>
    </details>`)}</div>
    <p class="fc-hint">${t('Touchez un jour pour voir son détail.')}</p>
  </section>`;
}

export function renderForecasts(v: WeatherView, entity: string, uid: string, air: TemplateResult | typeof nothing,
                                blocks: Array<'hours' | 'days' | 'air'> = ['hours', 'days', 'air']): TemplateResult {
  // The curve and the table chosen, in their order; tomorrow's air and pollens under them when chosen.
  const panels = blocks.map(b => b === 'hours' ? hoursChart(v.hours, v.provider, entity, uid) : b === 'days' ? week(v.days, v.provider, entity, v.hours, v.now.temperature) : nothing)
    .filter(p => p !== nothing);
  const wanted = blocks.some(b => b !== 'air');
  return html`${panels.length ? html`<div class=${`panels${panels.length === 1 ? ' single' : ''}`}>${panels}</div>`
    : wanted ? html`<p class="nw-empty">${t('Prévisions indisponibles pour le moment.')}</p>` : nothing}${blocks.includes('air') ? air : nothing}`;
}

export const forecastStyles = css`
  /* Hours and days one under the other, full width (2 November, as the maquette). */
  .panels { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; align-items:stretch; }
  .fc-hint { margin:0; text-align:center; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  /* 18 hours */
  .fc { position:relative; display:grid; grid-template-rows:150px auto; gap:8px; touch-action:pan-y; cursor:crosshair; }
  .fc-plot { position:relative; }
  .fc-night { position:absolute; top:0; bottom:18%; background:color-mix(in srgb, var(--nw-fg) 5%, transparent); }
  .fc-plot svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .fc-line { fill:none; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
  .fc-bar { position:absolute; bottom:0; width:10px; border-radius:3px; background:var(--nw-rain); }
  .fc-dot { position:absolute; width:10px; height:10px; margin:-5px 0 0 -5px; box-sizing:border-box; border-radius:50%; background:var(--nw-bg); border:2px solid var(--nw-fg); }
  .fc-scrub { position:absolute; top:0; height:150px; width:2px; margin-left:-1px; background:var(--nw-fg); opacity:0; transition:opacity .15s; pointer-events:none; }
  .fc-tip { position:absolute; top:-6px; translate:-50% 0; white-space:nowrap; font-size:var(--nw-fs-small); font-weight:650; padding:4px 9px; border-radius:10px;
    background:var(--nw-fg); color:var(--nw-bg); pointer-events:none; opacity:0; transition:opacity .15s; }
  .fc.scrubbing .fc-scrub { opacity:.8; } .fc.scrubbing .fc-tip { opacity:1; }
  /* Each tick sits exactly under its point of the curve: the hour, then its sky. */
  .fc-hours { position:relative; height:56px; }
  .fc-wind { display:inline-flex; align-items:center; gap:3px; margin-top:2px; font-size:11px; color:var(--nw-fg2); white-space:nowrap; }
  .fc-unit { margin:0; text-align:right; font-size:10.5px; color:var(--nw-fg2); }
  .fc-hours > div { position:absolute; top:0; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:2px;
    font-size:11px; color:var(--nw-fg2); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .fc-hours > div:first-child { transform:none; align-items:flex-start; }
  .fc-hours > div:last-child:not(:first-child) { transform:translateX(-100%); align-items:flex-end; }
  .fc-hours ha-icon { --mdc-icon-size:15px; }
  /* 7 days: one row each, a bar on the week's scale, a tap opens the day. */
  .wk { display:grid; }
  .wk details + details { border-top:1px solid color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .wk summary { display:grid; grid-template-columns:44px 22px 72px 28px minmax(40px,1fr) 28px 14px; align-items:center; gap:8px; padding:8px 2px;
    list-style:none; cursor:pointer; font-size:14px; font-variant-numeric:tabular-nums; }
  .wk summary::-webkit-details-marker { display:none; }
  .wk .day { font-weight:650; }
  .wk .day.today { color:color-mix(in oklab, var(--nw-wind) var(--nw-ink), var(--nw-fg)); }
  .wk summary > ha-icon { --mdc-icon-size:20px; color:var(--nw-fg2); }
  .wk .lo { color:var(--nw-fg2); text-align:right; } .wk .hi { font-weight:650; }
  .wk .rain { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; font-size:12px; color:color-mix(in oklab, var(--nw-rain) 70%, var(--nw-fg)); }
  .wk .rain ha-icon { --mdc-icon-size:13px; }
  .wk .track { position:relative; height:6px; border-radius:9px; background:color-mix(in srgb, var(--nw-fg) 6%, transparent); }
  .wk .track > i { position:absolute; top:0; bottom:0; border-radius:9px;
    background-image:linear-gradient(90deg, var(--nw-cold), var(--nw-calm) 45%, var(--nw-level2) 75%, var(--nw-heat)); background-repeat:no-repeat; }
  .wk .track b { position:absolute; top:50%; width:10px; height:10px; margin:-5px 0 0 -5px; box-sizing:border-box; border-radius:50%; background:var(--nw-bg); box-shadow:0 0 0 2px var(--nw-fg); }
  .wk .dx { padding:0 2px 10px; }
  .wk .dx p { margin:6px 0 0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .dx-curve { display:block; width:100%; height:46px; overflow:visible; }
  .dx-axis { display:flex; justify-content:space-between; font-size:10.5px; color:var(--nw-fg2); }
  @container (max-width:420px) { .wk summary { grid-template-columns:34px 18px 66px 24px minmax(30px,1fr) 26px 12px; gap:5px; } .wk .rain { font-size:11px; } }
  @media (prefers-reduced-motion:reduce) { .fc-scrub, .fc-tip { transition:none; } }
`;
