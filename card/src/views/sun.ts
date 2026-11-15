// « Soleil et lune » (issue #34): the sun's course over the day as a curve above and below the horizon, the moon's beside it,
// where both stand now; the sun's times and the day's length; the moon's phase, its rise and set, the next full and new moons.
// A panel of « Aujourd'hui » and a card on its own. Computed in the browser for the place of Home Assistant (astro.ts).
import { css, html, nothing, svg, type TemplateResult } from 'lit';
import { currentLanguage, fr, t } from '../i18n';
import { panelHead } from '../ui/parts';
import { hourOf, litOf, type AstroView } from '../astro';
import { dateFormat } from '../intl-cache';

/** A time as the card writes it: « 7 h 32 » in French, « 07:32 » elsewhere. */
export const clock = (d?: Date) => {
  if (!d) return '—';
  const h = d.getHours(), m = d.getMinutes();
  return currentLanguage() === 'fr' ? `${h} h ${String(m).padStart(2, '0')}` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
/** A length in minutes: « 9 h 43 ». */
const length = (min: number) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return currentLanguage() === 'fr' ? `${h} h ${String(m).padStart(2, '0')}` : `${h}h ${String(m).padStart(2, '0')}m`; };
const day = (d: Date) => dateFormat(currentLanguage(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
const PHASES: Array<[number, string]> = [[.03, fr('Nouvelle lune')], [.22, fr('Premier croissant')], [.28, fr('Premier quartier')], [.47, fr('Lune gibbeuse croissante')],
  [.53, fr('Pleine lune')], [.72, fr('Lune gibbeuse décroissante')], [.78, fr('Dernier quartier')], [.97, fr('Dernier croissant')], [1.01, fr('Nouvelle lune')]];
/** Which of the eight phases (0 new … 4 full … 7 waning crescent): the quarters and the full moon last a day or so, the crescents and
 *  gibbous moons a week. The phase names and the Mini's moon icon share it. */
export const phaseIndex = (phase: number) => { const f = ((phase % 1) + 1) % 1, i = PHASES.findIndex(([edge]) => f < edge); return i < 0 || i === 8 ? 0 : i; };
export const phaseName = (phase: number) => t(PHASES[phaseIndex(phase)][1]);

/** The moon as it looks tonight, the same as the animated sky's: a pale disc with its craters, cut to its lit part;
 *  the dark part a faint veil with a fine rim, and a soft halo around it. */
let moons = 0;
export function moonDisc(phase: number, size = 44): TemplateResult {
  const f = ((phase % 1) + 1) % 1, wax = f < .5, g = wax ? f : 1 - f, lit = litOf(f), id = `nw-moon-${++moons}`;
  const shape = `M0 -1A1 1 0 0 ${wax ? 1 : 0} 0 1A${Math.abs(Math.cos(2 * Math.PI * f)).toFixed(3)} 1 0 0 ${(g < .25) === wax ? 0 : 1} 0 -1Z`;
  return html`<svg class="moon-disc" viewBox="-1.6 -1.6 3.2 3.2" width=${size * 1.45} height=${size * 1.45} aria-hidden="true">
    <defs><radialGradient id=${`${id}-g`} cx=".38" cy=".36" r=".8"><stop offset="0" stop-color="#fffef6"/><stop offset=".6" stop-color="#f1edd6"/><stop offset="1" stop-color="#cdd5da"/></radialGradient>
      <radialGradient id=${`${id}-h`}><stop offset=".55" stop-color="#fff7d8" stop-opacity=${(.18 + .3 * lit).toFixed(2)}/><stop offset="1" stop-color="#fff7d8" stop-opacity="0"/></radialGradient>
      <clipPath id=${`${id}-c`}>${lit > .985 ? svg`<circle r="1"/>` : svg`<path d=${shape}/>`}</clipPath></defs>
    <circle r="1.6" fill=${`url(#${id}-h)`}/>
    <circle r="1" class="moon-dark"/>
    ${lit < .015 ? nothing : svg`<g clip-path=${`url(#${id}-c)`}><circle r="1" fill=${`url(#${id}-g)`}/>
      <g fill="#aab1a2" fill-opacity=".45"><circle cx="-.38" cy=".18" r=".19"/><circle cx=".28" cy="-.42" r=".15"/><circle cx=".38" cy=".38" r=".25"/><circle cx="-.1" cy="-.28" r=".09"/><circle cx="0" cy=".66" r=".11"/></g></g>`}
  </svg>`;
}

/** The parts the card on its own can show; the full card shows them all. */
export type SunPart = 'path' | 'sun' | 'moon';

export function sunPanel(a: AstroView, parts?: Set<string>): TemplateResult {
  const has = (p: SunPart) => !parts || parts.has(p);
  const { sun, moon } = a;
  // The day from midnight to midnight across the plot, the horizon in the middle; heights in degrees. The curves stretch with the panel
  // (vector-effect keeps the lines fine); the sun, the moon and the times are placed over them in HTML, so they never stretch.
  const x = (h: number) => h / 24 * 100, y = (alt: number) => Math.max(2, Math.min(98, 50 - alt * .68));
  const line = (samples: number[]) => samples.map((alt, i) => `${i ? 'L' : 'M'}${(x(i / 2) * 2.4).toFixed(1)} ${y(alt).toFixed(1)}`).join('');
  const now = hourOf(a.now)!, sunLine = line(a.sunPath);
  const tick = (d?: Date) => d ? html`<span class="tick" style=${`left:${x(hourOf(d)!).toFixed(2)}%`}>${clock(d)}</span>` : nothing;
  const change = sun.dayChange === undefined || Math.abs(sun.dayChange) < .5 ? '' : t('{sign}{n} min par rapport à hier', { sign: sun.dayChange > 0 ? '+' : '−', n: Math.round(Math.abs(sun.dayChange)) });
  const until = (d: Date) => Math.max(0, Math.round((d.valueOf() - a.now.valueOf()) / 864e5));
  const nextMoon = moon.nextFull < moon.nextNew
    ? (until(moon.nextFull) ? t('Pleine lune dans {n} jours, {day}', { n: until(moon.nextFull), day: day(moon.nextFull) }) : t('Pleine lune cette nuit'))
    : (until(moon.nextNew) ? t('Nouvelle lune dans {n} jours, {day}', { n: until(moon.nextNew), day: day(moon.nextNew) }) : t('Nouvelle lune cette nuit'));
  return html`<section class="nw-panel sun-panel" aria-label=${t('Soleil et lune')}>${panelHead('mdi:weather-sunset-up', 'level1', t('Soleil et lune'), t('Calculé pour votre lieu'))}
    ${has('path') && a.sunPath.length ? html`<div class="sky-path" role="img" aria-label=${t('La course du soleil et de la lune aujourd’hui')}>
        <svg viewBox="0 0 240 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="nw-sun-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--nw-level1)" stop-opacity=".5"/><stop offset=".5" stop-color="var(--nw-level1)" stop-opacity="0"/></linearGradient>
            <clipPath id="nw-sun-above"><rect x="0" y="0" width="240" height="50"/></clipPath><clipPath id="nw-sun-below"><rect x="0" y="50" width="240" height="50"/></clipPath></defs>
          <path class="day-fill" clip-path="url(#nw-sun-above)" d=${`${sunLine}L240 50L0 50Z`}/>
          <path class="moon-path" clip-path="url(#nw-sun-above)" d=${line(a.moonPath)}/>
          <path class="sun-path" clip-path="url(#nw-sun-above)" d=${sunLine}/><path class="sun-path below" clip-path="url(#nw-sun-below)" d=${sunLine}/>
          <line class="horizon" x1="0" x2="240" y1="50" y2="50"/><line class="now-line" x1=${x(now) * 2.4} x2=${x(now) * 2.4} y1="0" y2="100"/></svg>
        <div class="over" aria-hidden="true">
          ${moon.up ? html`<span class="dot moon-dot" style=${`left:${x(now).toFixed(2)}%;top:${y(a.moonPath[Math.round(now * 2)] ?? 0).toFixed(1)}%`}>${moonDisc(moon.phase, 16)}</span>` : nothing}
          <span class=${`dot sun-dot${sun.up ? '' : ' down'}`} style=${`left:${x(now).toFixed(2)}%;top:${y(sun.altitude).toFixed(1)}%`}></span></div>
        <div class="ticks">${tick(sun.sunrise)}${tick(sun.noon)}${tick(sun.sunset)}</div>
      </div>` : nothing}
    <div class="sun-cols">
      ${has('sun') ? html`<div class="sun-col">
        <div class="pair"><div><span class="nw-label">${t('Lever')}</span><b>${clock(sun.sunrise)}</b></div><div><span class="nw-label">${t('Coucher')}</span><b>${clock(sun.sunset)}</b></div></div>
        ${sun.dayLength === undefined ? nothing : html`<p>${t('Jour de {length}', { length: length(sun.dayLength) })}${change ? html` · <span class="dim">${change}</span>` : nothing}</p>`}
        <p class="dim">${t('Aube {dawn} · crépuscule {dusk}', { dawn: clock(sun.dawn), dusk: clock(sun.dusk) })}</p></div>` : nothing}
      ${has('moon') ? html`<div class="sun-col moon-col">${moonDisc(moon.phase)}<div>
        <b>${phaseName(moon.phase)}</b><p>${t('Éclairée à {n} %', { n: Math.round(moon.fraction * 100) })}</p>
        <p class="dim">${t('Lever {rise} · coucher {set}', { rise: clock(moon.rise), set: clock(moon.set) })}</p>
        <p class="dim">${nextMoon}</p></div></div>` : nothing}
    </div>
  </section>`;
}

export const sunStyles = css`
  .sky-path { position:relative; height:132px; margin:2px 0 4px; }
  .sky-path svg, .sky-path .over { position:absolute; left:0; right:0; top:0; height:108px; width:100%; }
  .sky-path .horizon { stroke:var(--nw-line); stroke-width:1; vector-effect:non-scaling-stroke; }
  .sky-path .day-fill { fill:url(#nw-sun-day); }
  .sky-path .sun-path { fill:none; stroke:color-mix(in oklab, var(--nw-level1) 75%, var(--nw-fg)); stroke-width:2; stroke-linecap:round; vector-effect:non-scaling-stroke; }
  .sky-path .sun-path.below { stroke:var(--nw-fg2); stroke-opacity:.5; stroke-dasharray:2 4; }
  .sky-path .moon-path { fill:none; stroke:var(--nw-fg2); stroke-opacity:.6; stroke-width:1.2; stroke-dasharray:1 3; stroke-linecap:round; vector-effect:non-scaling-stroke; }
  .sky-path .now-line { stroke:var(--nw-fg); stroke-opacity:.22; stroke-dasharray:2 3; vector-effect:non-scaling-stroke; }
  .sky-path .dot { position:absolute; transform:translate(-50%, -50%); border-radius:50%; }
  .sky-path .sun-dot { width:14px; height:14px; background:radial-gradient(circle at 40% 38%, #fff7cf, #ffd45e 60%, #f2b544); box-shadow:0 0 0 5px rgb(255 212 94 / .25), 0 0 14px 4px rgb(255 200 80 / .35); }
  .sky-path .sun-dot.down { background:var(--nw-fg2); box-shadow:none; opacity:.5; }
  .sky-path .moon-dot { width:16px; height:16px; display:grid; place-items:center; }
  .sky-path .moon-dot .moon-disc { margin:0; }
  .sky-path .ticks { position:absolute; left:0; right:0; top:112px; height:16px; font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }
  .sky-path .tick { position:absolute; transform:translateX(-50%); white-space:nowrap; }
  .sun-cols { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px 22px; margin-top:6px; }
  .sun-col { display:flex; flex-direction:column; gap:4px; min-width:0; }
  .sun-col p { margin:0; font-size:var(--nw-fs-small); }
  .sun-col .dim { color:var(--nw-fg2); }
  .sun-col .pair { display:flex; gap:22px; }
  .sun-col .pair > div { display:flex; flex-direction:column; gap:2px; }
  .sun-col .pair b { font-size:var(--nw-fs-case); font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:-.3px; }
  .moon-col { flex-direction:row; align-items:center; gap:14px; }
  .moon-col b { font-size:var(--nw-fs-text); }
  .moon-disc { flex:none; margin:-8px; }
  .moon-disc .moon-dark { fill:color-mix(in srgb, var(--nw-fg) 10%, transparent); stroke:color-mix(in srgb, var(--nw-fg) 22%, transparent); stroke-width:.04; }
`;
