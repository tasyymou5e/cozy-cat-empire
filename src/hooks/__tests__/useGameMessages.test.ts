import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameMessages } from '../useGameMessages';

describe('useGameMessages', () => {
  it('should start with no current message', () => {
    const { result } = renderHook(() => useGameMessages());
    expect(result.current.currentMessage).toBeNull();
  });

  it('should show a message', () => {
    const { result } = renderHook(() => useGameMessages());
    act(() => result.current.showMessage('Hello', 'info'));
    expect(result.current.currentMessage).not.toBeNull();
    expect(result.current.currentMessage?.text).toBe('Hello');
  });

  it('should dismiss message', () => {
    const { result } = renderHook(() => useGameMessages());
    act(() => result.current.showMessage('Hello', 'info'));
    act(() => result.current.dismissMessage());
    expect(result.current.currentMessage).toBeNull();
  });
});
