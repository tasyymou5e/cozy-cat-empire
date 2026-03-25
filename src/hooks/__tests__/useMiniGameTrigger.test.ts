import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMiniGameTrigger } from '../useMiniGameTrigger';

vi.mock('@/components/game/minigames', () => ({}));

describe('useMiniGameTrigger', () => {
  it('should start closed', () => {
    const { result } = renderHook(() => useMiniGameTrigger());
    expect(result.current.isOpen).toBe(false);
  });

  it('should open on manual trigger', () => {
    const { result } = renderHook(() => useMiniGameTrigger());
    act(() => result.current.triggerGame());
    expect(result.current.isOpen).toBe(true);
  });

  it('should close game', () => {
    const { result } = renderHook(() => useMiniGameTrigger());
    act(() => result.current.triggerGame());
    act(() => result.current.closeGame());
    expect(result.current.isOpen).toBe(false);
  });
});
