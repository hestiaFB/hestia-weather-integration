/**
 * The sun and the moon for a place and a moment: dawn, sunrise, solar noon, sunset, dusk, the sun's height,
 * the moon's phase, how much of it is lit, its rise and set, the next full and new moons. Computed in the browser, no sensor needed.
 *
 * The formulas are those of SunCalc (https://github.com/mourner/suncalc), after « Astronomy Answers » (aa.quae.nl),
 * rewritten here in TypeScript. SunCalc: Copyright (c) 2014, Vladimir Agafonkin. All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following
 * conditions are met: 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer. 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 * following disclaimer in the documentation and/or other materials provided with the distribution.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
const PI = Math.PI, rad = PI / 180, DAY = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
const toJulian = (d: Date) => d.valueOf() / DAY - .5 + J1970;
const fromJulian = (j: number) => new Date((j + .5 - J1970) * DAY);
const toDays = (d: Date) => toJulian(d) - J2000;
const rightAscension = (l: number, b: number) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l: number, b: number) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const altitude = (H: number, phi: number, dec: number) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d: number, lw: number) => rad * (280.16 + 360.9856235 * d) - lw;
const astroRefraction = (h: number) => { if (h < 0) h = 0; return .0002967 / Math.tan(h + .00312536 / (h + .08901179)); };
const solarMeanAnomaly = (d: number) => rad * (357.5291 + .98560028 * d);
const eclipticLongitude = (M: number) => M + rad * (1.9148 * Math.sin(M) + .02 * Math.sin(2 * M) + .0003 * Math.sin(3 * M)) + rad * 102.9372 + PI;
function sunCoords(d: number) { const L = eclipticLongitude(solarMeanAnomaly(d)); return { dec: declination(L, 0), ra: rightAscension(L, 0) }; }

/** The sun's height above the horizon (radians). */
export function sunAltitude(date: Date, lat: number, lng: number): number {
  const lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d);
  return altitude(siderealTime(d, lw) - c.ra, phi, c.dec);
}

const J0 = .0009;
const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * PI));
const approxTransit = (Ht: number, lw: number, n: number) => J0 + (Ht + lw) / (2 * PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) => J2000 + ds + .0053 * Math.sin(M) - .0069 * Math.sin(2 * L);
const hourAngle = (h: number, phi: number, d: number) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export interface SunTimes { dawn?: Date; sunrise?: Date; noon: Date; sunset?: Date; dusk?: Date }
/** The day's times around the solar noon nearest to `date`. Undefined in the polar day or night. */
export function sunTimes(date: Date, lat: number, lng: number): SunTimes {
  const lw = rad * -lng, phi = rad * lat, d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0), Jnoon = solarTransitJ(ds, M, L);
  const at = (h: number): [Date | undefined, Date | undefined] => { const w = hourAngle(h * rad, phi, dec); if (isNaN(w)) return [undefined, undefined];
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L); return [fromJulian(Jnoon - (Jset - Jnoon)), fromJulian(Jset)]; };
  const [sunrise, sunset] = at(-.833), [dawn, dusk] = at(-6);
  return { dawn, sunrise, noon: fromJulian(Jnoon), sunset, dusk };
}

function moonCoords(d: number) {
  const L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * Math.sin(M), b = rad * 5.128 * Math.sin(F), dt = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}
/** The moon's height above the horizon (radians, refraction included). */
export function moonAltitude(date: Date, lat: number, lng: number): number {
  const lw = rad * -lng, phi = rad * lat, d = toDays(date), c = moonCoords(d);
  const h = altitude(siderealTime(d, lw) - c.ra, phi, c.dec); return h + astroRefraction(h);
}
/** How much of the moon is lit (0–1) and its phase: 0 new, .25 first quarter, .5 full, .75 last quarter. */
export function moonIllumination(date: Date) {
  const d = toDays(date), s = sunCoords(d), m = moonCoords(d), sdist = 149598000;
  const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
  return { fraction: (1 + Math.cos(inc)) / 2, phase: .5 + .5 * inc * (angle < 0 ? -1 : 1) / PI };
}
/** Moonrise and moonset on the local day of `date`; either may be missing (the moon does not rise or set that day). */
export function moonTimes(date: Date, lat: number, lng: number): { rise?: Date; set?: Date } {
  const t = new Date(date); t.setHours(0, 0, 0, 0);
  const hc = .133 * rad, at = (h: number) => moonAltitude(new Date(t.valueOf() + h * 36e5), lat, lng) - hc;
  let h0 = at(0), rise: number | undefined, set: number | undefined;
  for (let i = 1; i <= 24; i += 2) {
    const h1 = at(i), h2 = at(i + 1), a = (h0 + h2) / 2 - h1, b = (h2 - h0) / 2, xe = -b / (2 * a), ye = (a * xe + b) * xe + h1;
    const disc = b * b - 4 * a * h1; let roots = 0, x1 = 0, x2 = 0;
    if (disc >= 0) { const dx = Math.sqrt(disc) / (Math.abs(a) * 2); x1 = xe - dx; x2 = xe + dx; if (Math.abs(x1) <= 1) roots++; if (Math.abs(x2) <= 1) roots++; if (x1 < -1) x1 = x2; }
    if (roots === 1) { if (h0 < 0) rise = i + x1; else set = i + x1; }
    else if (roots === 2) { rise = i + (ye < 0 ? x2 : x1); set = i + (ye < 0 ? x1 : x2); }
    if (rise !== undefined && set !== undefined) break;
    h0 = h2;
  }
  return { rise: rise === undefined ? undefined : new Date(t.valueOf() + rise * 36e5), set: set === undefined ? undefined : new Date(t.valueOf() + set * 36e5) };
}

/** The next moment, within 32 days, when the phase passes `target` (.5 full, 0 new): to the hour. */
function nextPhase(from: Date, target: number): Date {
  const gap = (d: Date) => ((target - moonIllumination(d).phase) % 1 + 1) % 1;
  let t = from.valueOf(), g = gap(from);
  for (let i = 0; i < 32 * 24; i++) { const n = t + 36e5, gn = gap(new Date(n)); if (gn > g + .5) return new Date(n); t = n; g = gn; }
  return new Date(t);
}

/** What the panel and the scene need. */
export interface AstroView {
  now: Date;
  sun: SunTimes & { altitude: number; up: boolean; dayLength?: number; dayChange?: number };
  moon: { phase: number; fraction: number; rise?: Date; set?: Date; up: boolean; nextFull: Date; nextNew: Date };
  /** Heights in degrees every 30 minutes from local midnight to the next (49 values). */
  sunPath: number[]; moonPath: number[];
}
/** The last views, one per place and minute: a card redraws at every change in Home Assistant, the sky only moves by the minute,
 *  and the next full and new moons cost some 1 500 steps. Shared by every card of the page. */
const memo = new Map<string, AstroView>();
export function astro(now: Date, lat: number, lon: number): AstroView {
  const key = `${lat}|${lon}|${Math.floor(now.valueOf() / 6e4)}`;
  let view = memo.get(key);
  if (!view) {
    if (memo.size > 8) memo.clear();
    memo.set(key, view = compute(now, lat, lon));
  }
  return view;
}
function compute(now: Date, lat: number, lon: number): AstroView {
  const today = sunTimes(now, lat, lon), yesterday = sunTimes(new Date(now.valueOf() - DAY), lat, lon);
  const span = (s: SunTimes) => s.sunrise && s.sunset ? (s.sunset.valueOf() - s.sunrise.valueOf()) / 6e4 : undefined;
  const dayLength = span(today), before = span(yesterday);
  const sunAlt = sunAltitude(now, lat, lon), ill = moonIllumination(now), mt = moonTimes(now, lat, lon);
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  const path = (f: (d: Date, la: number, lo: number) => number) => Array.from({ length: 49 }, (_, i) => f(new Date(midnight.valueOf() + i * 18e5), lat, lon) / rad);
  return { now, sunPath: path(sunAltitude), moonPath: path(moonAltitude),
    sun: { ...today, altitude: sunAlt / rad, up: sunAlt > -.833 * rad, dayLength, dayChange: dayLength !== undefined && before !== undefined ? dayLength - before : undefined },
    moon: { phase: ill.phase, fraction: ill.fraction, rise: mt.rise, set: mt.set, up: moonAltitude(now, lat, lon) > 0, nextFull: nextPhase(now, .5), nextNew: nextPhase(now, 0) } };
}
/** How much of the moon is lit (0 to 1) for its phase (0 new, .5 full). */
export const litOf = (phase: number) => (1 - Math.cos(2 * Math.PI * phase)) / 2;
/** A date as a decimal local hour (7.5 for 7 h 30). */
export const hourOf = (d?: Date) => d ? d.getHours() + d.getMinutes() / 60 : undefined;
