import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useSeasonalContent } from '../useSeasonalContent';

describe('useSeasonalContent', () => {
  it('should return current season', () => {
    const { result } = renderHook(() => useSeasonalContent());
    expect(result.current.currentSeason).toBeDefined();
    expect(['spring', 'summer', 'fall', 'winter']).toContain(result.current.currentSeason);
  });
});
