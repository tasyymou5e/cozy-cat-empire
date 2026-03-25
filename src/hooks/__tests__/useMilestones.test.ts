import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/types/milestones', () => ({
  MILESTONES: [],
  getMilestoneProgress: () => 0,
}));

describe('useMilestones', () => {
  it('should initialize with empty unlocked milestones', async () => {
    const { useMilestones } = await import('../useMilestones');
    const stats = { totalMoneyEarned: 0, totalShowWins: 0, totalCatsOwned: 0, totalKittensBred: 0, day: 1 };
    const { result } = renderHook(() => useMilestones(stats));
    expect(result.current.unlockedMilestones).toEqual([]);
  });
});
