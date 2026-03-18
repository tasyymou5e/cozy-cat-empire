import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import { useConfetti } from '../useConfetti';

describe('useConfetti', () => {
  it('should expose fireConfetti and fireCelebration', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.fireConfetti).toBe('function');
    expect(typeof result.current.fireCelebration).toBe('function');
    expect(typeof result.current.fireStars).toBe('function');
  });

  it('should not throw when fired', () => {
    const { result } = renderHook(() => useConfetti());
    expect(() => {
      act(() => { result.current.fireConfetti(); });
    }).not.toThrow();
  });
});
