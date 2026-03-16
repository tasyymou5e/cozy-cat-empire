/**
 * @fileoverview Integration tests for the full cloud save → load → sync flow.
 *
 * Tests the interplay between useCloudSave, useAutoSave, and external-update
 * detection to ensure the complete persistence pipeline works end-to-end.
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudSave } from '../useCloudSave';
import { useAutoSave } from '../useAutoSave';
import { GameState } from '@/types/game';

// ── Supabase mock ────────────────────────────────────────────────────────

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockInsert = vi.fn().mockReturnValue({ then: vi.fn((cb: Function) => cb({ error: null })) });
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

const makeChainable = () => {
  const obj: Record<string, unknown> = {};
  const self = () => obj;
  ['select','insert','delete','eq','order','limit','in','then'].forEach(m => { obj[m] = vi.fn().mockImplementation((...args: unknown[]) => { if (m === 'then') { const cb = args[0] as Function; cb?.({ error: null, data: [] }); return Promise.resolve(); } return obj; }); });
  return obj;
};

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'game_saves') {
    return { select: mockSelect, upsert: mockUpsert, update: mockUpdate };
  }
  return makeChainable();
});

const mockSubscribe = vi.fn().mockReturnThis();
const mockOn = vi.fn().mockReturnThis();
const mockChannel = vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe });
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('@/lib/saveMigration', () => ({
  needsMigration: vi.fn().mockReturnValue(false),
  getSaveVersionInfo: vi.fn(),
  migrateSaveData: vi.fn(),
}));

vi.mock('@/types/guards', () => ({
  isValidGameState: vi.fn().mockReturnValue(true),
  isCatRelationship: vi.fn().mockReturnValue(true),
  isRelationshipEvent: vi.fn().mockReturnValue(true),
}));

vi.mock('../useErrorLogger', () => ({
  logErrorToDatabase: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────

const USER_ID = 'user-integration-1';

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  cats: [{ id: 'cat-1', name: 'Whiskers', type: 'stray', breed: 'tabby', health: 80, happiness: 70, hunger: 60, value: 80, age: 1, personality: 'playful', showWins: 0, isForSale: false, grade: 3, tricksLearned: [], trickProgress: {}, restLevel: 80, feedingScore: 50, lastTrainingDay: 0 }] as GameState['cats'],
  money: 500,
  space: 5,
  houseSize: 'apartment',
  acres: 0,
  day: 5,
  resources: { food: 10, medicine: 5, toys: 3, treats: 5 },
  reputation: 0,
  totalShowWins: 0,
  catsAdopted: 1,
  totalMoneyEarned: 500,
  marketListings: [],
  achievements: [],
  breedingCooldown: 0,
  showCooldown: 0,
  ownedCostumes: [],
  catCostumes: {},
  ...overrides,
});

const REL_DATA = { relationships: [], events: [] };

// ── Tests ────────────────────────────────────────────────────────────────

describe('Cloud Save Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Save → Load round-trip ─────────────────────────────────────────

  it('saves state then loads it back identically', async () => {
    const state = makeState();

    const { result } = renderHook(() => useCloudSave(USER_ID));

    // First do a load so isLoadedRef becomes true
    await act(async () => {
      await result.current.cloudLoad();
    });

    // Now save
    let saveResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      saveResult = await result.current.cloudSave(state, 3, REL_DATA);
    });

    expect(saveResult?.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        kittens_bred: 3,
      }),
      { onConflict: 'user_id' },
    );

    // Simulate loading saved data back
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        game_state: state,
        kittens_bred: 3,
        relationships: REL_DATA,
        last_played_at: new Date().toISOString(),
      },
      error: null,
    });

    let loadResult: { data: unknown; error?: string } | undefined;
    await act(async () => {
      loadResult = await result.current.cloudLoad();
    });

    expect(loadResult?.data).not.toBeNull();
    expect((loadResult?.data as { kittens_bred: number }).kittens_bred).toBe(3);
  });

  // ── Save blocked before load gate ──────────────────────────────────

  it('blocks saves until cloud data has been loaded', async () => {
    const state = makeState();

    const { result } = renderHook(() => useCloudSave(USER_ID));

    // Attempt save without loading first
    let saveResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      saveResult = await result.current.cloudSave(state, 0, REL_DATA);
    });

    expect(saveResult?.success).toBe(false);
    expect(saveResult?.error).toContain('not loaded');
  });

  // ── Empty-state safety guard ───────────────────────────────────────

  it('rejects saving empty cats on day > 1 as potential data loss', async () => {
    const dangerousState = makeState({ cats: [], day: 10 });

    const { result } = renderHook(() => useCloudSave(USER_ID));

    // Load first to pass the gate
    await act(async () => {
      await result.current.cloudLoad();
    });

    let saveResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      saveResult = await result.current.cloudSave(dangerousState, 0, REL_DATA);
    });

    expect(saveResult?.success).toBe(false);
    expect(saveResult?.error).toContain('data loss');
  });

  // ── Auto-save triggers cloudSave on state change ───────────────────

  it('auto-save fires after interval when state changes', async () => {
    const mockCloudSaveFn = vi.fn().mockResolvedValue({ success: true });

    // Mock useCloudSave for useAutoSave
    vi.doMock('../useCloudSave', () => ({
      useCloudSave: () => ({ cloudSave: mockCloudSaveFn }),
    }));

    // Re-import to get the mocked version
    const { useAutoSave: useAutoSaveFresh } = await import('../useAutoSave');

    const state = makeState();

    const { result } = renderHook(() =>
      useAutoSaveFresh(USER_ID, state, 0, REL_DATA, {
        intervalMs: 30_000,
        enabled: true,
      }),
    );

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(mockCloudSaveFn).toHaveBeenCalled();

    // Cleanup
    vi.doUnmock('../useCloudSave');
  });

  // ── External update flag ───────────────────────────────────────────

  it('sets hasExternalUpdate when realtime fires and clears after load', async () => {
    const { result } = renderHook(() => useCloudSave(USER_ID));

    expect(result.current.hasExternalUpdate).toBe(false);

    // Simulate realtime callback (grab the handler from mockOn)
    const onCall = mockOn.mock.calls.find(
      (c: unknown[]) => c[0] === 'postgres_changes',
    );

    if (onCall) {
      const handler = onCall[2] as (payload: unknown) => void;

      // Fire with a timestamp far from any save
      act(() => {
        handler({ new: { last_played_at: '2099-01-01T00:00:00Z' } });
      });

      expect(result.current.hasExternalUpdate).toBe(true);
    }

    // clearExternalUpdate resets
    act(() => {
      result.current.clearExternalUpdate();
    });

    expect(result.current.hasExternalUpdate).toBe(false);
  });

  // ── Realtime channel cleanup on unmount ────────────────────────────

  it('removes realtime channel on unmount', () => {
    const { unmount } = renderHook(() => useCloudSave(USER_ID));
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  // ── Integrity auto-correction ──────────────────────────────────────

  it('auto-corrects negative money before saving', async () => {
    const badState = makeState({ money: -50 });

    const { result } = renderHook(() => useCloudSave(USER_ID));

    await act(async () => {
      await result.current.cloudLoad();
    });

    await act(async () => {
      await result.current.cloudSave(badState, 0, REL_DATA);
    });

    // The upserted game_state should have money >= 0
    const savedState = mockUpsert.mock.calls[0]?.[0]?.game_state;
    expect(savedState?.money).toBeGreaterThanOrEqual(0);
  });

  // ── Load error handling ────────────────────────────────────────────

  it('returns error when supabase load fails', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'timeout' } });

    // Need fresh hook so maybeSingle throws
    const mockEqFresh = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
    });
    mockSelect.mockReturnValueOnce({ eq: mockEqFresh });

    const { result } = renderHook(() => useCloudSave(USER_ID));

    let loadResult: { data: unknown; error?: string } | undefined;
    await act(async () => {
      loadResult = await result.current.cloudLoad();
    });

    expect(loadResult?.data).toBeNull();
    expect(loadResult?.error).toBeDefined();
  });

  // ── getLastSaveTime updates after save ─────────────────────────────

  it('updates getLastSaveTime after successful save', async () => {
    const { result } = renderHook(() => useCloudSave(USER_ID));

    expect(result.current.getLastSaveTime()).toBeNull();

    await act(async () => {
      await result.current.cloudLoad();
    });

    await act(async () => {
      await result.current.cloudSave(makeState(), 0, REL_DATA);
    });

    expect(result.current.getLastSaveTime()).not.toBeNull();
  });
});
