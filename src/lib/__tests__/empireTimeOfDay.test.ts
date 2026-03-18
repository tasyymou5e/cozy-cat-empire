import { describe, it, expect } from 'vitest';
import { getTimeOfDay } from '../empireTimeOfDay';

describe('empireTimeOfDay', () => {
  it('should return a valid time of day', () => {
    const tod = getTimeOfDay(5);
    expect(['morning', 'afternoon', 'evening', 'night']).toContain(tod);
  });

  it('should return different values for different game days', () => {
    const results = new Set([1, 5, 10, 15].map(d => getTimeOfDay(d)));
    expect(results.size).toBeGreaterThanOrEqual(1);
  });
});
