import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/hooks/usePlayerActivityLog', () => ({
  usePlayerActivityLog: () => ({ logActivity: vi.fn() }),
}));

describe('useGamificationAnalytics', () => {
  it('should provide trackGamification function', async () => {
    const { useGamificationAnalytics } = await import('../useGamificationAnalytics');
    const { result } = renderHook(() => useGamificationAnalytics('user-1'));
    expect(typeof result.current.trackGamification).toBe('function');
  });
});
