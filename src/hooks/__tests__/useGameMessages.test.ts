import { afterEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameMessages } from '../useGameMessages';

describe('useGameMessages', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('auto-dismisses bulk-action success messages', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameMessages());

    act(() => result.current.showMessage('Healed 3 cats!', 'success'));
    expect(result.current.currentMessage?.text).toBe('Healed 3 cats!');

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.currentMessage).toBeNull();
  });

  it('advances through queued messages and clears the final popup', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameMessages());

    act(() => {
      result.current.showMessage('Comforted cats!', 'success');
      result.current.showMessage('Trained cats!', 'success');
    });

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.currentMessage?.text).toBe('Trained cats!');

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.currentMessage).toBeNull();
  });
});
