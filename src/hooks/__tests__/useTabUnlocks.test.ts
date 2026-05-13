import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/config/tabUnlocks', () => ({
  isTabUnlocked: (tabId: string) => tabId === 'actions',
  getTabUnlockHint: () => null,
}));

vi.mock('@/constants/tabs', () => ({
  TAB_LABELS: { actions: { icon: '🎬', label: 'Actions' } },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useTabUnlocks', () => {
  it('should check tab unlock status', async () => {
    const { useTabUnlocks } = await import('../useTabUnlocks');
    const progress = { catsOwned: 0, day: 1, totalMoneyEarned: 0, totalShowWins: 0, kittensBred: 0, isAuthenticated: false };
    const { result } = renderHook(() => useTabUnlocks(progress));
    expect(result.current.isUnlocked('actions')).toBe(true);
  });
});
