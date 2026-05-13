import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useSeasonalContent } from '../useSeasonalContent';

describe('useSeasonalContent', () => {
  it('should return current season as a Season object (or null off-season)', () => {
    const { result } = renderHook(() => useSeasonalContent());
    const season = result.current.currentSeason;
    if (season !== null) {
      expect(season).toHaveProperty('id');
      expect(season).toHaveProperty('name');
    }
    expect(typeof result.current.daysRemaining).toBe('number');
    expect(typeof result.current.isSeasonActive).toBe('boolean');
  });
});
