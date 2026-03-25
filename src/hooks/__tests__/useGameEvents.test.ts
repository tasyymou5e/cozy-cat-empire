import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/types/gameEvents', () => ({
  ACTION_SIDE_EFFECTS: {},
}));

vi.mock('@/types/dailyObjectives', () => ({}));
vi.mock('@/types/battlePass', () => ({}));
vi.mock('@/types/coopChallenges', () => ({}));
vi.mock('@/config/gameEventSounds', () => ({
  getSoundForAction: () => null,
}));

describe('useGameEvents', () => {
  it('should return dispatch function', async () => {
    const { useGameEvents } = await import('../useGameEvents');
    const config = {
      actions: {
        feedCats: vi.fn(), feedSingleCat: vi.fn(), doChore: vi.fn(), buyResource: vi.fn(),
        useMedicine: vi.fn(), useToys: vi.fn(), comfortCat: vi.fn(), sellCat: vi.fn(),
        trainCat: vi.fn(), restCat: vi.fn(), breedCats: vi.fn(), socializeCats: vi.fn(),
        doGroupActivity: vi.fn(), catShow: vi.fn(),
      },
      trackObjective: vi.fn(),
      trackBattlePassXP: vi.fn(),
      trackCoopProgress: vi.fn(),
      playSound: vi.fn(),
    };
    const { result } = renderHook(() => useGameEvents(config));
    expect(typeof result.current.dispatch).toBe('function');
  });
});
