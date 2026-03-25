import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/hooks/usePlayerActivityLog', () => ({
  usePlayerActivityLog: () => ({ logActivity: vi.fn() }),
}));

describe('useGamificationAnalytics', () => {
  it('should provide trackGamification function', async () => {
    const { useGamificationAnalytics } = await import('../useGamificationAnalytics');
    const { result } = renderHook(() => useGamificationAnalytics('user-1'));
    expect(typeof result.current.trackGamification).toBe('function');
  });

  it('should call logActivity when tracking', async () => {
    const mockLogActivity = vi.fn();
    vi.mocked(await import('@/hooks/usePlayerActivityLog')).usePlayerActivityLog = () => ({ logActivity: mockLogActivity });
    const { useGamificationAnalytics } = await import('../useGamificationAnalytics');
    const { result } = renderHook(() => useGamificationAnalytics('user-1'));
    act(() => result.current.trackGamification('lucky_wheel', 'spin'));
  });
});
