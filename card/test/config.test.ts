import { describe, expect, it } from 'vitest';
import { BLOCK_ORDERS, cardBlocks, cleanConfig, placeChecked } from '../src/config';
import type { WeatherCardConfig } from '../src/types';

const base: WeatherCardConfig = { type:'custom:hestia-weather-card',weather_entity:'weather.city' };
describe('Legacy display migration',()=>{
  it('removes compact and preserves hidden forecasts without mutating input',()=>{
    const legacy={...base,mode:'compact'};
    const next=cleanConfig(legacy);
    expect(next).toEqual({...base,show_predictions:false});
    expect(legacy.mode).toBe('compact');
    expect(cleanConfig(next)).toEqual(next);
  });
  it.each([true,false])('preserves explicit forecast choice %s',show_predictions=>{
    expect(cleanConfig({...base,mode:'compact',show_predictions} as WeatherCardConfig)).toEqual({...base,show_predictions});
  });
  it('removes detailed without introducing section restrictions',()=>{
    expect(cleanConfig({...base,mode:'detailed'} as WeatherCardConfig)).toEqual(base);
  });
  it('does not add a mode to new configurations',()=>{
    expect(cleanConfig(base)).toEqual(base);
  });
});

describe('The cards on their own', () => {
  const card = (extra: Partial<WeatherCardConfig>) => ({ type: 'custom:hestia-weather-card', ...extra }) as WeatherCardConfig;
  it('show everything their format has until parts are chosen', () => {
    expect(cardBlocks(card({ format: 'wind' }))).toEqual(['ahead', 'now', 'chart', 'stats']);
    // A card whose parts were chosen before « À venir » existed keeps its choice.
    expect(cardBlocks(card({ format: 'pressure', card_blocks: ['now', 'chart'] }))).toEqual(['now', 'chart']);
    expect(cardBlocks(card({ format: 'air' }))).toEqual(['air_today', 'pollen_today', 'air_tomorrow', 'pollen_tomorrow']);
    expect(cardBlocks(card({ format: 'full' }))).toEqual([]);
  });
  it('keep the chosen parts in their order, and only those of their format', () => {
    expect(cardBlocks(card({ format: 'air', card_blocks: ['pollen_tomorrow', 'air_today'] }))).toEqual(['pollen_tomorrow', 'air_today']);
    expect(cardBlocks(card({ format: 'pressure', card_blocks: ['chart', 'gauge'] }))).toEqual(['chart']);
  });
  it('start over with everything when the parts belong to another format, and show nothing when all are unticked', () => {
    expect(cardBlocks(card({ format: 'pressure', card_blocks: ['radar', 'feel'] }))).toEqual(['ahead', 'now', 'chart', 'stats']);
    expect(cardBlocks(card({ format: 'rain', card_blocks: [] }))).toEqual([]);
  });
});

describe('placeChecked', () => {
  const order = BLOCK_ORDERS.today_blocks!;
  it('puts a block checked later at its place, not at the end', () => {
    expect(placeChecked(['comfort', 'rain', 'wind', 'pressure', 'extras', 'air'], ['comfort', 'rain', 'wind', 'pressure', 'extras', 'air', 'lightning'], order))
      .toEqual(['comfort', 'rain', 'wind', 'pressure', 'lightning', 'extras', 'air']);
  });
  it('keeps the order the user dragged', () => {
    expect(placeChecked(['air', 'rain'], ['air', 'rain'], order)).toEqual(['air', 'rain']);
    expect(placeChecked(['air', 'rain'], ['air', 'rain', 'wind'], order)).toEqual(['air', 'rain', 'wind']);
    expect(placeChecked(['air', 'rain'], ['air', 'rain', 'comfort'], order)).toEqual(['comfort', 'air', 'rain']);
  });
  it('leaves an unchecked block out', () => {
    expect(placeChecked(['rain', 'wind'], ['wind'], order)).toEqual(['wind']);
  });
});
