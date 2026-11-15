import { describe, expect, it } from 'vitest';
import { familyOf } from '../src/alert-kinds';

// Issue #33: the families a card can leave out, read from the icon the engine gives each event.
describe('The family of an event', () => {
  it('puts the official vigilance first, whatever its icon', () => {
    expect(familyOf('mdi:weather-lightning', true)).toBe('official');
  });
  it('reads storms, rain, wind, temperature, fog, UV, air and the three extensions', () => {
    expect(familyOf('mdi:weather-lightning', false)).toBe('storm');
    expect(familyOf('mdi:weather-pouring', false)).toBe('rain');
    expect(familyOf('mdi:weather-windy', false)).toBe('wind');
    expect(familyOf('mdi:thermometer-high', false)).toBe('temperature');
    expect(familyOf('mdi:weather-fog', false)).toBe('fog');
    expect(familyOf('mdi:weather-sunny-alert', false)).toBe('uv');
    expect(familyOf('mdi:flower-pollen', false)).toBe('air');
    expect(familyOf('mdi:water-off', false)).toBe('water');
    expect(familyOf('mdi:fire-alert', false)).toBe('fire');
    expect(familyOf('mdi:waves', false)).toBe('river');
  });
  it('leaves an unknown icon in no family: it always shows', () => {
    expect(familyOf('mdi:information-outline', false)).toBeUndefined();
  });
});
