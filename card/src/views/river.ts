// « Rivière » (issue #18): CrueVeille's stations, each with its height, its rise, its flow, their curves and the highest height known.
// The card reads CrueVeille's sensors itself (views/rivers.ts), and asks Home Assistant's recorder for their curves and their highest day.
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../ui/define';
import { currentLocale, fr, t } from '../i18n';
import { dateFormat } from '../intl-cache';
import type { ChartPeriodId, MeasureView, Point, Stat } from '../view';
import type { CardBlock, HomeAssistant, WeatherCardConfig } from '../types';
import { findStations, highestOf, number, seriesOf, type Highest, type History, type Station, type Statistics } from './rivers';
import { nf, panelHead } from '../ui/parts';
import { measurePanel, todayStyles } from './today';
import { tokens, shared, pieces } from '../ui/charter';
import { traitStyles } from '../ui/trait';

/** CrueVeille's risk levels, their words and their colours. */
const RISKS: Record<string, [string, string]> = {
  clear: [fr('Rien à signaler'), 'calm'], watch: [fr('À surveiller'), 'level1'], warning: [fr('Seuil de vigilance'), 'level2'], critical: [fr('Seuil critique'), 'level3'] };
const SPANS: Record<ChartPeriodId, number> = { '6h': 6 * 3600, '1d': 86400, '2d': 2 * 86400, '7d': 7 * 86400 };
/** The curves are asked again this often; the highest day known, once an hour. */
const HISTORY_MS = 10 * 60_000, RECORD_MS = 3600_000;

/** A curve's own range, a little wider than its points: a river's height moves by a few centimetres. */
function range(points: Point[], step: number): { low: number; top: number } {
  const values = points.map(p => p[1]).filter((v): v is number => v !== null);
  if (!values.length) return { low: 0, top: step };
  const lo = Math.min(...values), hi = Math.max(...values), pad = Math.max(step, (hi - lo) * .15);
  return { low: Math.max(0, lo - pad), top: hi + pad };
}

const day = (ms: number) => dateFormat(currentLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));

/** The period's lowest and highest, as the other cards give them. */
function extremes(points: Point[], digits: number, unit: string): Stat[] {
  const values = points.map(p => p[1]).filter((v): v is number => v !== null);
  if (values.length < 2) return [];
  return [{ label: t('Min'), value: `${nf(Math.min(...values), digits)} ${unit}` }, { label: t('Max'), value: `${nf(Math.max(...values), digits)} ${unit}` }];
}

/** One station's panels: the height (its rise, its curve, its numbers) and, when chosen, the flow. */
export function stationPanels(st: Station, hass: Pick<HomeAssistant, 'states'>, history: History, highest: Highest | undefined,
                              period: ChartPeriodId, blocks: CardBlock[], uid: string, now = Date.now() / 1000): TemplateResult {
  const alert = hass.states[st.alert], a = alert?.attributes ?? {};
  const [risk, theme] = RISKS[String(a.risk_level ?? '')] ?? [fr('Hauteur inconnue'), 'calm'];
  const heightNow = number(st.height ? hass.states[st.height]?.state : undefined) ?? number(a.water_level_m);
  const rise = number(a.rise_cm_h), projected = number(a.forecast_height_m);
  const parts = new Set<string>(blocks);
  const heights = seriesOf(st.height ? history[st.height] : undefined, now, heightNow);
  const moving = rise !== undefined && Math.abs(rise) >= .5;
  const description = `${t(risk)}${moving ? ` · ${rise! > 0 ? '+' : '−'}${nf(Math.abs(rise!), 0)} cm/h` : rise !== undefined ? ` · ${t('stable')}` : ''}`;
  const stats: Stat[] = [...extremes(heights, 2, 'm'),
    ...(projected !== undefined && moving ? [{ label: t('Projetée'), value: `${nf(projected, 2)} m` }] : []),
    ...(highest ? [{ label: t('Plus haut connu'), value: `${nf(highest.value, 2)} m · ${day(highest.at)}` }] : [])];
  const height: MeasureView = { source: t('CrueVeille (Vigicrues, Hub’Eau) : seuils réglés dans CrueVeille, pas la vigilance crues officielle'),
    value: heightNow, entity: st.height ?? st.alert, description, empty: t('Pas encore de courbe : Home Assistant garde la hauteur à partir de maintenant.'),
    periods: [], period, series: heights, ...range(heights, .05), stats };
  const reason = parts.has('now') && a.alert_reason && ['warning', 'critical'].includes(String(a.risk_level)) ? html`<p class="rv-reason">${String(a.alert_reason)}</p>` : nothing;
  const heightPanel = measurePanel(height, { key: `rv-${st.code}`, icon: 'mdi:waves', theme: theme === 'calm' ? 'rain' : theme, title: st.name, unit: 'm', digits: 2 }, uid, parts, reason);
  const flowNow = number(st.flow ? hass.states[st.flow]?.state : undefined);
  const flows = seriesOf(st.flow ? history[st.flow] : undefined, now, flowNow);
  const flow: MeasureView = { source: 'Vigicrues', value: flowNow, entity: st.flow, description: t('Débit'), empty: t('Pas encore de courbe du débit.'),
    periods: [], period, series: flows, ...range(flows, 1), stats: extremes(flows, 1, 'm³/s') };
  const flowPanel = parts.has('flow') && st.flow ? measurePanel(flow, { key: `rvq-${st.code}`, icon: 'mdi:waves-arrow-right', theme: 'cold', title: t('Débit'), unit: 'm³/s', digits: 1 },
    uid, new Set(['now', 'chart', ...(parts.has('stats') ? ['stats'] : [])])) : nothing;
  return html`<div class="rv-station">${heightPanel}${flowPanel}</div>`;
}

@define('hestia-river')
export class HestiaRiver extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public config?: WeatherCardConfig;
  @property({ attribute: false }) public blocks: CardBlock[] = [];
  @property() public uid = 'rv';
  /** Set while the dashboard is edited: a station-less card says what to install. */
  @property({ attribute: false }) public settings = '';
  @state() private history: History = {};
  @state() private highest: Record<string, Highest | undefined> = {};
  private asked = { history: '', records: '' };
  private timer?: ReturnType<typeof setInterval>;
  /** The stations' states last drawn: Home Assistant pushes every change, the card redraws only for its own. */
  private seen = '';

  public connectedCallback(): void { super.connectedCallback(); this.timer = setInterval(() => { this.asked = { history: '', records: '' }; this.fetch(); }, HISTORY_MS); }
  public disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this.timer); }
  private get stations(): Station[] { return this.hass ? findStations(this.hass, this.config?.rivers) : []; }
  private get period(): ChartPeriodId { return this.config?.river_span ?? '2d'; }

  protected shouldUpdate(changed: Map<PropertyKey, unknown>): boolean {
    if (!changed.has('hass') || changed.size > 1) return true;
    const ids = this.stations.flatMap(s => [s.alert, s.height, s.flow]).filter((id): id is string => !!id);
    const seen = ids.map(id => `${id}=${this.hass!.states[id]?.last_updated ?? this.hass!.states[id]?.state}`).join('|');
    if (seen === this.seen) return false;
    this.seen = seen;
    return true;
  }
  protected updated(): void { this.toggleAttribute('many', this.stations.length > 1); this.fetch(); }

  private fetch(): void {
    const hass = this.hass;
    if (!hass?.callWS) return;
    const stations = this.stations, ids = stations.flatMap(s => [s.height, s.flow]).filter((id): id is string => !!id);
    if (!ids.length) return;
    const span = SPANS[this.period], key = `${ids.join(',')}|${this.period}`;
    if (this.asked.history !== key) {
      this.asked.history = key;
      void hass.callWS<History>({ type: 'history/history_during_period', start_time: new Date(Date.now() - span * 1000).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false })
        .then(h => { this.history = h ?? {}; }).catch(() => { /* the curve stays empty */ });
    }
    const heights = stations.map(s => s.height).filter((id): id is string => !!id), records = heights.join(',');
    if (heights.length && this.asked.records !== records) {
      this.asked.records = records;
      setTimeout(() => { if (this.asked.records === records) this.asked.records = ''; }, RECORD_MS);
      void hass.callWS<Statistics>({ type: 'recorder/statistics_during_period', start_time: '2000-01-01T00:00:00Z', statistic_ids: heights,
        period: 'day', types: ['max'] })
        .then(s => { this.highest = Object.fromEntries(heights.map(id => [id, highestOf(s?.[id])])); }).catch(() => { /* no record line */ });
    }
  }

  protected render() {
    if (!this.hass) return nothing;
    const stations = this.stations;
    if (!stations.length) return html`<section class="nw-panel lz-missing" aria-label=${t('Rivière')}>${panelHead('mdi:waves', 'rain', t('Rivière'), 'CrueVeille')}
      <p>${t('Cette carte suit la hauteur et le débit des rivières aux stations Vigicrues grâce à CrueVeille. Installez l’extension depuis HACS et ajoutez-y une entrée par station à suivre.')}</p>
      <div class="links"><a href="https://github.com/vico34/crueveille" target="_blank" rel="noopener noreferrer">${t('Installer CrueVeille')}</a></div></section>`;
    if (!this.blocks.length) return html`<p class="nw-empty">${t('Rien à afficher : cochez au moins un élément dans les réglages de la carte.')}</p>`;
    return html`${stations.map((st, i) => html`${i ? html`<hr>` : nothing}${stationPanels(st, this.hass!, this.history, st.height ? this.highest[st.height] : undefined, this.period, this.blocks, `${this.uid}-${i}`)}`)}`;
  }

  static styles = [tokens, shared, pieces, todayStyles, traitStyles, css`
    :host { display:flex; flex-direction:column; gap:16px; }
    /* Without titles (issue #21): the station's head goes, its numbers stay; with several stations, their names stay to tell them apart. */
    :host(.untitled:not([many])) .nw-panel-head { display:none; }
    .nw-panel { border:0; padding:0; background:none; }
    .rv-station { display:flex; flex-direction:column; gap:14px; }
    .rv-reason { margin:0 0 4px; font-size:var(--nw-fs-small); color:var(--nw-fg2); line-height:1.45; }
    hr { border:0; border-top:1px solid var(--nw-line-soft); margin:0; }
    .nw-empty { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); }
    .lz-missing p { margin:0; font-size:var(--nw-fs-text); color:var(--nw-fg2); line-height:1.5; }
    .lz-missing .links { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .lz-missing a { display:inline-block; padding:6px 14px; border-radius:var(--nw-radius-pill); background:var(--nw-accent); color:var(--nw-bg); font-weight:600; text-decoration:none; font-size:var(--nw-fs-small); }
  `];
}
