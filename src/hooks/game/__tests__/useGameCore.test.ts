import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useGameCore } from '../useGameCore';

describe('useGameCore', () => {
  it('should initialize with default game state', () => {
    const { result } = renderHook(() => useGameCore());
    expect(result.current.state.day).toBe(1);
    expect(result.current.state.money).toBeGreaterThanOrEqual(0);
    expect(result.current.state.cats).toEqual([]);
  });

  it('should expose nextDay function', () => {
    const { result } = renderHook(() => useGameCore());
    expect(typeof result.current.nextDay).toBe('function');
  });

  it('should advance day when nextDay is called', () => {
    const { result } = renderHook(() => useGameCore());
    const initialDay = result.current.state.day;
    act(() => {
      result.current.nextDay();
    });
    expect(result.current.state.day).toBe(initialDay + 1);
  });
});
