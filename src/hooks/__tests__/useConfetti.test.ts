import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import { useConfetti } from '../useConfetti';

describe('useConfetti', () => {
  it('should expose triggerConfetti and triggerAchievementConfetti', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.triggerConfetti).toBe('function');
    expect(typeof result.current.triggerAchievementConfetti).toBe('function');
  });

  it('should not throw when triggered', () => {
    const { result } = renderHook(() => useConfetti());
    expect(() => {
      act(() => {
        result.current.triggerConfetti();
      });
    }).not.toThrow();
  });
});
