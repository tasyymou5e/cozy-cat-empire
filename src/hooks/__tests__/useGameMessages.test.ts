import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameMessages } from '../useGameMessages';

describe('useGameMessages', () => {
  it('should start with empty messages', () => {
    const { result } = renderHook(() => useGameMessages());
    expect(result.current.messages).toEqual([]);
  });

  it('should add a message', () => {
    const { result } = renderHook(() => useGameMessages());
    act(() => result.current.showMessage('Hello', 'info'));
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].text).toBe('Hello');
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useGameMessages());
    act(() => result.current.showMessage('Hello', 'info'));
    act(() => result.current.clearMessages());
    expect(result.current.messages).toEqual([]);
  });
});
