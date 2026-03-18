import { describe, it, expect } from 'vitest';
import { getCurrentRealSeason, SEASONAL_PROMPTS } from '../seasonUtils';

describe('seasonUtils', () => {
  it('getCurrentRealSeason should return a valid season', () => {
    const season = getCurrentRealSeason();
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(season);
  });

  it('SEASONAL_PROMPTS should have entries for all seasons', () => {
    expect(SEASONAL_PROMPTS).toHaveProperty('spring');
    expect(SEASONAL_PROMPTS).toHaveProperty('summer');
    expect(SEASONAL_PROMPTS).toHaveProperty('autumn');
    expect(SEASONAL_PROMPTS).toHaveProperty('winter');
  });
});
