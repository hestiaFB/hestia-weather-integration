import type { AlertKind } from './types';

/** The kind of an alert or a point, from its signal (issue #22); the pressure too since issue #49. */
export function alertKind(key?: string): AlertKind | undefined {
  if (!key) return undefined;
  if (key === 'official' || key === 'water' || key === 'fire' || key === 'river' || key === 'uv') return key;
  if (key.startsWith('storm')) return 'storm';
  if (key.startsWith('rain') || key === 'wind-rain') return 'rain';
  if (key.startsWith('wind')) return 'wind';
  if (key.startsWith('fog')) return 'fog';
  if (key.startsWith('temperature') || key === 'comfort-gap' || key === 'freeze-future' || key === 'frost-night') return 'temperature';
  if (/^(air|pollen|atmo|legacy)/.test(key)) return 'air';
  if (key.startsWith('pressure')) return 'pressure';
  return undefined;
}

/** An event's kind (issues #22, #33): the official vigilance by its flag, then its signal (integration 3.9 and later), else its icon,
 *  which the engine gives every kind of event (an integration older than 3.9). Unknown ones belong to none and always show. */
export function familyOf(icon: string | undefined, official: boolean, key?: string): AlertKind | undefined {
  if (official) return 'official';
  const known = alertKind(key);
  if (known || !icon) return known;
  const i = icon.replace('mdi:', '');
  if (/lightning/.test(i)) return 'storm';
  if (/water-off/.test(i)) return 'water';
  if (/fire/.test(i)) return 'fire';
  if (/waves|home-flood|landslide/.test(i)) return 'river';
  if (/pouring|rainy|water-alert|umbrella/.test(i)) return 'rain';
  if (/windy|wind-turbine/.test(i)) return 'wind';
  if (/fog|blur/.test(i)) return 'fog';
  if (/sun-wireless|weather-sunny-alert/.test(i)) return 'uv';
  if (/thermometer|snowflake|ice/.test(i)) return 'temperature';
  if (/molecule|air-filter|flower|grass|tree|leaf|fruit|pollen/.test(i)) return 'air';
  if (/gauge/.test(i)) return 'pressure';
  return undefined;
}

/** Whether a card set to leave out `hidden` shows this alert or point: the one rule of every card (Mini, Alert, Events, tiles). */
export const shown = (hidden: readonly AlertKind[] = [], a: { key?: string; icon?: string; official?: boolean; group?: string }): boolean => {
  if (!hidden.length) return true;
  const kind = familyOf(a.icon, !!a.official || a.group === 'official', a.key);
  return !kind || !hidden.includes(kind);
};
