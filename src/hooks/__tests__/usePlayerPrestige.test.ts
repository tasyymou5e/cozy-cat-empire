import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerPrestige, PLAYER_PRESTIGE_LEVELS } from '../usePlayerPrestige';

describe('usePlayerPrestige', () => {
  beforeEach(() => localStorage.removeItem('cat-farm-player-prestige'));

  it('should start at level 0', () => {
    const { result } = renderHook(() => usePlayerPrestige());
    expect(result.current.prestige.level).toBe(0);
    expect(result.current.prestige.coinMultiplier).toBe(1);
  });

  it('should not allow prestige before day 100', () => {
    const { result } = renderHook(() => usePlayerPrestige());
    const canDo = result.current.canPrestige({ day: 50, totalMoneyEarned: 20000, totalShowWins: 0, allBreedsCollected: false });
    expect(canDo).toBe(false);
  });

  it('should allow prestige at level 0 with day 100+ and enough money', () => {
    const { result } = renderHook(() => usePlayerPrestige());
    const canDo = result.current.canPrestige({ day: 100, totalMoneyEarned: 10000, totalShowWins: 0, allBreedsCollected: false });
    expect(canDo).toBe(true);
  });

  it('should perform prestige and advance level', () => {
    const { result } = renderHook(() => usePlayerPrestige());
    act(() => { result.current.performPrestige(); });
    expect(result.current.prestige.level).toBe(1);
    expect(result.current.prestige.coinMultiplier).toBe(PLAYER_PRESTIGE_LEVELS[0].coinMultiplier);
  });

  it('should return next prestige info', () => {
    const { result } = renderHook(() => usePlayerPrestige());
    const info = result.current.getNextPrestigeInfo();
    expect(info).toEqual(PLAYER_PRESTIGE_LEVELS[0]);
  });
});
