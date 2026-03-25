import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/types/luckyWheel', () => ({
  selectRandomPrize: () => ({ id: 'coins', label: 'Coins', value: 100, emoji: '🪙', rarity: 'common' }),
  getTodayDateString: () => '2026-03-25',
}));

vi.mock('./useBroadcastSync', () => ({
  useBroadcastSync: () => ({ broadcastMessage: vi.fn() }),
  SYNC_MESSAGES: {},
}));

describe('useLuckyWheel', () => {
  it('should initialize with spin availability', async () => {
    const { useLuckyWheel } = await import('../useLuckyWheel');
    const { result } = renderHook(() => useLuckyWheel());
    expect(result.current.isSpinning).toBe(false);
    expect(typeof result.current.spin).toBe('function');
  });
});
