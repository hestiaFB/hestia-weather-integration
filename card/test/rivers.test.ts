import { describe, expect, it } from 'vitest';
import { findStations, highestOf, seriesOf } from '../src/views/rivers';
import { fireEdge } from '../src/views/fire';
import type { HassEntity } from '../src/types';
import type { FireView } from '../src/view';

const state = (entity_id: string, value: string, attributes: Record<string, unknown>): HassEntity => ({ entity_id, state: value, attributes });
const loire = { station_code: 'K4350010', station_name: 'La Loire à Orléans' };
const cher = { station_code: 'K6402520', station_name: 'Le Cher à Tours' };
const states = Object.fromEntries([
  state('binary_sensor.loire_alerte_inondation', 'off', { ...loire, risk_level: 'clear', water_level_m: 2.1 }),
  state('sensor.loire_hauteur', '2.1', { ...loire, unit_of_measurement: 'm' }),
  state('sensor.loire_hauteur_projetee', '2.3', { ...loire, unit_of_measurement: 'm' }),
  state('sensor.loire_debit', '310', { ...loire, unit_of_measurement: 'm3/s' }),
  state('binary_sensor.cher_alerte_inondation', 'on', { ...cher, risk_level: 'warning' }),
  state('sensor.cher_a', '3.4', { ...cher, unit_of_measurement: 'm' }),
  state('sensor.cher_b', '3.6', { ...cher, unit_of_measurement: 'm' }),
  state('binary_sensor.door', 'off', {}),
].map(s => [s.entity_id, s]));

describe('The River card’s stations (issue #18)', () => {
  it('finds every CrueVeille station, its height and its flow, without the registry', () => {
    expect(findStations({ states })[0]).toEqual({ alert: 'binary_sensor.loire_alerte_inondation', code: 'K4350010', name: 'La Loire à Orléans',
      height: 'sensor.loire_hauteur', flow: 'sensor.loire_debit' });
    expect(findStations({ states }).map(s => s.name)).toEqual(['La Loire à Orléans', 'Le Cher à Tours']);
  });
  it('takes the registry’s word when Home Assistant gives it', () => {
    const entities = { 'binary_sensor.cher_alerte_inondation': { entity_id: '', device_id: 'cher' },
      'sensor.cher_a': { entity_id: '', device_id: 'cher', translation_key: 'forecast_height' },
      'sensor.cher_b': { entity_id: '', device_id: 'cher', translation_key: 'water_level' } };
    expect(findStations({ states, entities }, ['binary_sensor.cher_alerte_inondation'])).toEqual([
      { alert: 'binary_sensor.cher_alerte_inondation', code: 'K6402520', name: 'Le Cher à Tours', height: 'sensor.cher_b', flow: undefined }]);
  });
  it('keeps the chosen stations in their order, and ignores what is not CrueVeille', () => {
    expect(findStations({ states }, ['binary_sensor.cher_alerte_inondation', 'binary_sensor.door', 'binary_sensor.loire_alerte_inondation']).map(s => s.code))
      .toEqual(['K6402520', 'K4350010']);
  });
  it('draws the history up to now, with holes where the sensor did not answer', () => {
    expect(seriesOf([{ s: '2.05', lu: 100 }, { s: 'unavailable', lu: 200 }], 300, 2.1)).toEqual([[100, 2.05], [200, null], [300, 2.1]]);
  });
  it('gives the highest day the recorder knows', () => {
    expect(highestOf([{ start: 1000, max: 2.5 }, { start: 2000, max: 4.2 }, { start: 3000, max: null }])).toEqual({ value: 4.2, at: 2000, since: 1000 });
    expect(highestOf([])).toBeUndefined();
  });
});

describe('The fire radar (issue #23)', () => {
  const view = (radius?: number, distances: number[] = []) => ({ radius, fires: distances.map(distance => ({ place: '', status: 3, distance })) }) as unknown as FireView;
  it('reaches PyroVeille’s radius, else the farthest fire, in round kilometres', () => {
    expect([fireEdge(view(30)), fireEdge(view(8)), fireEdge(view(undefined, [4, 42])), fireEdge(view())]).toEqual([30, 10, 50, 30]);
  });
});
