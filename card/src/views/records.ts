// « Records » (issue #17): the station's records and the place's since 1940, of the year and of all time, with their day
// (and, for the station, their hour), and the days counted. The integration sends them apart from the view (websocket hestia_weather/records):
// they change at most once an hour. Maquette: docs/maquette-records.html.
import { css, html, nothing, type TemplateResult } from 'lit';
import { currentLocale, fr, hourMark, t } from '../i18n';
import { dateFormat } from '../intl-cache';
import { info, nf, tint } from '../ui/parts';
import type { WeatherCardConfig } from '../types';

/** A record: [value, day (ISO), local hour or null]. */
export type Mark = [number, string, number | null];
export interface MarkSet { ever: Mark | null; year: Mark | null; month: Mark | null }
export interface Count { year: number | null; month: number | null; mean: number | null; best: [number, number] | null; partial: boolean; since: string | null }
export interface RecordSource { since: string; marks: Record<string, MarkSet>; counts: Record<string, Count> }
export interface RecordsMessage { version: number; station: RecordSource | null; lieu: RecordSource | null; loading: string[] }
export const RECORDS_VERSION = 1;

export type RecordsPeriod = NonNullable<WeatherCardConfig['records_period']>;
export type RecordsSource = 'station' | 'lieu';
/** The sources a card shows, in this order. */
export const recordSources = (c: WeatherCardConfig): RecordsSource[] =>
  c.records_source === 'lieu' ? ['lieu'] : c.records_source === 'both' ? ['station', 'lieu'] : ['station'];

/** The four records: key, name, unit, icon, decimals. */
const MARKS: Array<[string, string, string, string, number]> = [
  ['chaleur', fr('Chaleur'), '°C', 'mdi:thermometer-high', 1], ['froid', fr('Froid'), '°C', 'mdi:snowflake', 1],
  ['rafale', fr('Rafale'), 'km/h', 'mdi:weather-windy', 0], ['pluie', fr('Pluie'), fr('mm/j'), 'mdi:water-outline', 1]];
const THEME: Record<string, string> = { chaleur: 'heat', froid: 'cold', rafale: 'wind', pluie: 'rain' };
const COUNTS: Array<[string, string]> = [['jours_gel', fr('Jours de gel')], ['jours_chauds', fr('Jours ≥ 30 °C')], ['nuits_tropicales', fr('Nuits ≥ 20 °C')],
  ['jours_canicule', fr('Vigilance canicule')]];
/** A record beaten within these days wears « Nouveau » (not this month's: they are all recent). */
const FRESH_DAYS = 7;

const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
/** « 13 août 2025 »; this year's records leave the year out: « 11 août ». */
function day(iso: string, withYear: boolean): string {
  return dateFormat(currentLocale(), { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).format(parse(iso));
}
const monthYear = (iso: string) => dateFormat(currentLocale(), { month: 'short', year: 'numeric' }).format(parse(iso));
const fresh = (m: Mark, today: Date) => (today.getTime() - parse(m[1]).getTime()) / 86_400_000 < FRESH_DAYS;
/** Temperatures keep their tenth (« 35,0 °C »); rain and gusts drop a zero tenth (« 42 mm »). */
const number = (v: number, digits: number, unit: string) => nf(v, digits, unit === '°C').replace('-', '−');
const value = (m: Mark, unit: string, digits: number) => html`<div class="rk-v">${number(m[0], digits, unit)}<small>${t(unit)}</small></div>`;
/** The day, and for the station the hour on the same line (« 24 juin · vers 16 h »); under it on a narrow card. */
const when = (m: Mark, withYear: boolean) => html`<div class="rk-d">${day(m[1], withYear)}${m[2] !== null
  ? html`<span class="rk-h"><span class="rk-sep"> · </span>${t('vers {hour}', { hour: hourMark(m[2]) })}</span>` : nothing}</div>`;
const chip = (key: string) => html`<span class="nw-chip" style=${tint(THEME[key])}>${t('Nouveau')}</span>`;
const icon = (key: string, glyph: string) => html`<ha-icon class="rk-icon" icon=${glyph} style=${tint(THEME[key])}></ha-icon>`;

/** A record and its day, or a dash while it has never been measured. */
function cell(key: string, m: Mark | null, unit: string, digits: number, withYear: boolean, today: Date, chipped = true): TemplateResult {
  if (!m) return html`<div class="rk-cell"><div class="rk-v rk-none">—</div></div>`;
  return html`<div class="rk-cell">${value(m, unit, digits)}${when(m, withYear)}${chipped && fresh(m, today) ? chip(key) : nothing}</div>`;
}

/** The record a single period shows: this month's, this year's or the one of all time. */
const single = (m: MarkSet | undefined, period: RecordsPeriod): Mark | null => (period === 'month' ? m?.month : period === 'all' ? m?.ever : m?.year) ?? null;

/** A · Liste: one line per record; both periods side by side. */
function list(s: RecordSource, period: RecordsPeriod, today: Date): TemplateResult {
  const both = period === 'both';
  return html`${both ? html`<div class="rk-cols"><span></span><span class="nw-label">${t('Cette année')}</span><span class="nw-label">${t('Depuis toujours')}</span></div>` : nothing}
    ${MARKS.map(([key, name, unit, glyph, digits]) => {
      const m = s.marks[key];
      return html`<div class=${both ? 'rk-row two' : 'rk-row'}><div class="rk-what">${icon(key, glyph)}<span>${t(name)}</span></div>
        ${both ? html`${cell(key, m?.year ?? null, unit, digits, false, today)}${cell(key, m?.ever ?? null, unit, digits, true, today)}`
          : cell(key, single(m, period), unit, digits, period === 'all', today, period !== 'month')}</div>`;
    })}`;
}

/** B · Cases: two by two; with both periods, this year's record large and the record of all time under it. */
function cases(s: RecordSource, period: RecordsPeriod, today: Date): TemplateResult {
  return html`<div class="rk-cases">${MARKS.map(([key, name, unit, glyph, digits]) => {
    const marks = s.marks[key], main = period === 'both' ? marks?.year : single(marks, period), ever = marks?.ever;
    return html`<div class="rk-case"><div class="rk-top">${icon(key, glyph)}<span class="nw-label">${t(name)}</span></div>
      ${main ? html`<div class="rk-vrow">${value(main, unit, digits)}${period !== 'month' && fresh(main, today) ? chip(key) : nothing}</div>${when(main, period === 'all')}`
        : html`<div class="rk-v rk-none">—</div>`}
      ${period === 'both' && ever ? html`<div class="rk-sub">${t('Record : {value}', { value: `${number(ever[0], digits, unit)} ${t(unit)}` })}<br>${day(ever[1], true)}</div>` : nothing}
    </div>`;
  })}</div>`;
}

/** The days counted: this year (with the normal of the full years), the best year, or both. */
function counts(s: RecordSource, period: RecordsPeriod): TemplateResult | typeof nothing {
  const shown = COUNTS.filter(([key]) => s.counts[key]);
  if (!shown.length) return nothing;
  const days = (n: number) => t('{n} j', { n });
  return html`<div class="nw-stats rk-counts" style=${`--n:${shown.length}`}>${shown.map(([key, name]) => {
    const c = s.counts[key];
    const main = period === 'all' ? (c.best ? html`<b>${days(c.best[0])}</b><span class="rk-s">${t('en {year}', { year: c.best[1] })}</span>` : html`<b>—</b>`)
      : html`<b>${days((period === 'month' ? c.month : c.year) ?? 0)}</b>`;
    const extra = period === 'both' && c.best ? html`<span class="rk-s">${t('record {n} j ({year})', { n: c.best[0], year: c.best[1] })}</span>`
      : period === 'year' && c.mean !== null ? html`<span class="rk-s">${t('normale {n} j', { n: nf(c.mean, 0) })}</span>` : nothing;
    return html`<div><span class="rk-k">${t(name)}</span>${main}${extra}</div>`;
  })}</div>`;
}

const TITLES: Record<RecordsSource, [string, string, string]> = {
  station: [fr('Votre station'), 'mdi:trophy-outline',
    fr('Ce que vos capteurs ont mesuré, depuis que Home Assistant garde leurs statistiques. L’heure est celle de l’heure la plus chaude, la plus froide ou la plus venteuse du jour.')],
  lieu: [fr('Le lieu'), 'mdi:map-outline',
    fr('L’archive Open-Meteo, jour par jour depuis 1940 à votre position. Ses valeurs sont un peu adoucies : une moyenne sur une zone d’une dizaine de kilomètres.')],
};

const WAIT: Record<RecordsSource, string> = { station: fr('Lecture des statistiques de la station…'), lieu: fr('Lecture de l’archive depuis 1940…') };
const MISSING: Record<RecordsSource, string> = {
  station: fr('Aucune statistique de température, de rafale ou de pluie pour le moment : choisissez vos capteurs dans les réglages de Hestia Weather.'),
  lieu: fr('Archive Open-Meteo indisponible pour le moment.') };

function panel(source: RecordsSource, s: RecordSource | null, loading: boolean, c: WeatherCardConfig, uid: string, today: Date): TemplateResult {
  const [title, glyph, text] = TITLES[source];
  const period = c.records_period ?? 'both';
  const since = s ? source === 'lieu' ? t('archive depuis {year}', { year: parse(s.since).getFullYear() }) : t('depuis {date}', { date: monthYear(s.since) }) : undefined;
  const head = html`<header class="nw-panel-head"><span class="nw-panel-icon"><ha-icon icon=${glyph}></ha-icon></span>
    <h3><span>${t(title)}</span>${info(`${uid}-rk-${source}`, { title: t(title), text: t(text) })}</h3>${since ? html`<span class="aside">${since}</span>` : nothing}</header>`;
  const body = s ? html`${c.records_layout === 'cases' ? cases(s, period, today) : list(s, period, today)}${counts(s, period)}`
    : html`<p class="nw-empty">${t(loading ? WAIT[source] : MISSING[source])}</p>`;
  return html`<section class="nw-panel rk-panel" aria-label=${t(title)}>${head}${body}</section>`;
}

export function renderRecords(r: RecordsMessage, c: WeatherCardConfig, uid: string, today = new Date()): TemplateResult {
  const period = c.records_period ?? 'both';
  const title = period === 'year' ? `${t('Records')} · ${today.getFullYear()}`
    : period === 'month' ? `${t('Records')} · ${dateFormat(currentLocale(), { month: 'long', year: 'numeric' }).format(today)}` : t('Records');
  return html`<div class="nw-single records"><h2 class="nw-title">${title}</h2>
    ${recordSources(c).map(source => panel(source, r[source], r.loading.includes(source), c, uid, today))}</div>`;
}

export const recordsStyles = css`
  /* The card fills its row (a horizontal stack, a row of the Sections view): two Records cards side by side end level,
     the last panel taking the room left and its days counted at the bottom (issue #17). */
  .nw-single.records { display:flex; flex-direction:column; gap:10px; container-type:inline-size; box-sizing:border-box; height:100%; }
  .nw-single.records .rk-panel:last-child { flex:1; }
  .rk-panel { display:flex; flex-direction:column; }
  .rk-panel .rk-counts { margin-top:auto; padding-top:12px; }
  .nw-single.records .nw-title { margin:0 2px 2px; }
  .nw-single.records .rk-panel { background:var(--nw-surface); padding:14px 16px; border-radius:16px; }
  .rk-panel .nw-panel-head { margin-bottom:10px; }
  .rk-icon { --mdc-icon-size:18px; display:flex; flex:none; color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .rk-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 12px; align-items:center; padding:10px 0; border-top:1px solid var(--nw-line-soft); }
  .rk-row.two, .rk-cols { grid-template-columns:minmax(0,.8fr) minmax(0,1fr) minmax(0,1fr); }
  .rk-cols { display:grid; gap:12px; padding:0 0 6px; }
  .rk-cols .nw-label { text-align:right; }
  .rk-cols + .rk-row, .rk-panel .nw-panel-head + .rk-row { border-top:0; }
  .rk-row .rk-what { display:flex; align-items:center; gap:8px; min-width:0; font-size:var(--nw-fs-text); font-weight:600; }
  .rk-row .rk-what span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .rk-row .rk-cell { text-align:right; min-width:0; }
  .rk-panel .rk-v { font-size:var(--nw-fs-case); font-weight:600; letter-spacing:-.015em; line-height:1.2; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .rk-panel .rk-v small { font-size:var(--nw-fs-small); font-weight:500; color:var(--nw-fg2); margin-left:2px; letter-spacing:0; }
  .rk-panel .rk-v.rk-none { color:var(--nw-fg2); font-weight:400; }
  .rk-panel .rk-d { font-size:var(--nw-fs-small); color:var(--nw-fg2); line-height:1.35; }
  .rk-panel .rk-d .rk-h { white-space:nowrap; }
  @container (max-width:460px) { .rk-row.two .rk-d .rk-h { display:block; } .rk-row.two .rk-d .rk-sep { display:none; } }
  .rk-panel .nw-chip { font-size:var(--nw-fs-label); line-height:16px; padding:2px 9px; }
  .rk-row .nw-chip { margin-top:3px; }
  .rk-cases { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .rk-case { background:var(--nw-bg); border-radius:12px; padding:10px 12px; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .rk-case .rk-top { display:flex; align-items:center; gap:6px; min-width:0; }
  .rk-case .rk-top .nw-label { overflow:hidden; text-overflow:ellipsis; }
  .rk-case .rk-vrow { display:flex; align-items:center; flex-wrap:wrap; gap:4px 8px; margin-top:4px; }
  .rk-case .rk-sub { margin-top:6px; padding-top:6px; border-top:1px solid var(--nw-line-soft); font-size:var(--nw-fs-small); color:var(--nw-fg2); line-height:1.35; }
  
  .rk-counts .rk-k { font-size:var(--nw-fs-label); line-height:1.35; font-weight:500; color:var(--nw-fg2); }
  .rk-counts .rk-s { font-size:var(--nw-fs-label); line-height:1.35; color:var(--nw-fg2); }
  .rk-panel .nw-empty { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
  @container (max-width:340px) {
    .rk-counts { --n:2 !important; }
    .rk-row.two, .rk-cols { grid-template-columns:minmax(0,.62fr) minmax(0,1fr) minmax(0,1fr); gap:8px; }
    .rk-panel .rk-v { font-size:19px; }
  }
`;
