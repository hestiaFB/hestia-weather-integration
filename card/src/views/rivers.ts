// CrueVeille's stations as Home Assistant knows them (issue #18), and what the recorder gives of them: no drawing here.
// CrueVeille (vico34/crueveille, domain vigicrues_alert) makes one device per watched station: its « Alerte inondation » binary sensor
// carries the risk and the height, its sensors the height and the flow. Several stations are several CrueVeille entries.
import { t } from '../i18n';
import type { Point } from '../view';
import type { HassEntity, HomeAssistant } from '../types';

export const number = (v: unknown): number | undefined => { const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN; return Number.isFinite(n) ? n : undefined; };

/** One watched station: its « Alerte inondation » sensor, and the height and flow sensors of the same CrueVeille entry. */
export interface Station { alert: string; code: string; name: string; height?: string; flow?: string }

const isAlert = (s: HassEntity) => s.entity_id.startsWith('binary_sensor.') && 'risk_level' in s.attributes && 'station_code' in s.attributes;

/** Every CrueVeille station, or the ones chosen, in their order. A sensor of the same device (else of the same station code) gives the height and the flow. */
export function findStations(hass: Pick<HomeAssistant, 'states' | 'entities'>, chosen?: string[]): Station[] {
  const states = Object.values(hass.states);
  const alerts = chosen?.length ? chosen.map(id => hass.states[id]).filter((s): s is HassEntity => !!s && isAlert(s)) : states.filter(isAlert);
  return alerts.map(alert => {
    const code = String(alert.attributes.station_code ?? ''), device = hass.entities?.[alert.entity_id]?.device_id;
    const sensors = states.filter(s => s.entity_id.startsWith('sensor.') && (device ? hass.entities?.[s.entity_id]?.device_id === device : String(s.attributes.station_code ?? '') === code));
    const key = (s: HassEntity) => hass.entities?.[s.entity_id]?.translation_key ?? '';
    // Without the registry: the height is the one in metres that is not the projected one, the flow the one in m³/s.
    const height = sensors.find(s => key(s) === 'water_level')
      ?? sensors.find(s => !key(s) && s.attributes.unit_of_measurement === 'm' && !/forecast|projet|prevu|prévu/i.test(s.entity_id));
    const flow = sensors.find(s => key(s) === 'flow') ?? sensors.find(s => !key(s) && /m3\/s|m³\/s/.test(String(s.attributes.unit_of_measurement ?? '')));
    return { alert: alert.entity_id, code, name: String(alert.attributes.station_name ?? '') || code || t('Rivière'), height: height?.entity_id, flow: flow?.entity_id };
  });
}

/** Home Assistant's history, compressed: one list of { s: state, lu: seconds } per entity. */
export type History = Record<string, Array<{ s: string; lu: number }>>;
/** The recorder's daily statistics: their start (milliseconds) and the day's highest value. */
export type Statistics = Record<string, Array<{ start: number; max?: number | null }>>;
/** The highest day the recorder knows, and since when it keeps statistics. */
export interface Highest { value: number; at: number; since: number }

/** The points of a history, the value now last: the curve reaches « now ». */
export function seriesOf(rows: History[string] | undefined, now: number, value?: number): Point[] {
  const points: Point[] = (rows ?? []).map(r => [r.lu, number(r.s) ?? null]);
  if (value !== undefined) points.push([now, value]);
  return points;
}

/** The highest day of the daily statistics. */
export function highestOf(rows: Statistics[string] | undefined): Highest | undefined {
  const valid = (rows ?? []).filter((r): r is { start: number; max: number } => typeof r.max === 'number' && Number.isFinite(r.max));
  if (!valid.length) return undefined;
  const top = valid.reduce((a, b) => b.max > a.max ? b : a);
  return { value: top.max, at: top.start, since: valid[0].start };
}

