import { describe, it, expect } from 'vitest';
import { getCurrentSeason, getSeasonEmoji } from '../seasonUtils';

describe('seasonUtils', () => {
  it('getCurrentSeason should return a valid season', () => {
    const season = getCurrentSeason();
    expect(['spring', 'summer', 'fall', 'winter']).toContain(season);
  });

  it('getSeasonEmoji should return an emoji string', () => {
    const emoji = getSeasonEmoji('spring');
    expect(typeof emoji).toBe('string');
    expect(emoji.length).toBeGreaterThan(0);
  });
});
