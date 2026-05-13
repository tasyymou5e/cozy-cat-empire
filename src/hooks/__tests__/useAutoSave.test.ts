/**
 * @fileoverview Test suite for useAutoSave hook
 *
 * Tests auto-save functionality including:
 * - Interval behavior
 * - Change detection
 * - Guard conditions
 * - Error handling and retry logic
 * - Callbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { useCloudSave } from '../useCloudSave';
import { logErrorToDatabase } from '../useErrorLogger';
import { GameState } from '@/types/game';

// Mock dependencies — these override the global setup.ts mocks
vi.mock('../useCloudSave');
vi.mock('../useErrorLogger', () => ({
  logErrorToDatabase: vi.fn().mockResolvedValue(undefined),
  useErrorLogger: () => ({
    logError: vi.fn(),
    logInteractionError: vi.fn(),
    logNetworkError: vi.fn(),
    logComponentError: vi.fn(),
    logCriticalError: vi.fn(),
  }),
}));

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  cats: [],
  money: 100,
  space: 5,
  houseSize: 'apartment',
  acres: 0,
  day: 1,
  resources: { food: 10, medicine: 5, toys: 3, treats: 5 },
  reputation: 0,
  totalShowWins: 0,
  catsAdopted: 0,
  totalMoneyEarned: 100,
  marketListings: [],
  achievements: [],
  breedingCooldown: 0,
  showCooldown: 0,
  ownedCostumes: [],
  catCostumes: {},
  ...overrides,
});

/**
 * Advance fake timers by `ms` and then drain any pending timers that were
 * scheduled as a side-effect of awaited async work (e.g. retry setTimeouts
 * scheduled inside `await cloudSave(...)`). This makes the async retry chain
 * deterministic across environments.
 */
async function advanceAndDrain(ms: number, maxDrains = 10): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  for (let i = 0; i < maxDrains; i++) {
    const pending = vi.getTimerCount();
    if (pending === 0) break;
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
  }
}

describe('useAutoSave', () => {
  let mockCloudSave: Mock;

  beforeEach(() => {
    vi.useFakeTimers();

    mockCloudSave = vi.fn().mockResolvedValue({ success: true });
    (useCloudSave as Mock).mockReturnValue({
      cloudSave: mockCloudSave,
    });
    (logErrorToDatabase as Mock).mockResolvedValue(undefined);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Interval Behavior', () => {
    it('should save at configured interval', async () => {
      const onSaveComplete = vi.fn();
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
          onSaveComplete,
        })
      );

      await advanceAndDrain(60000);

      expect(mockCloudSave).toHaveBeenCalledTimes(1);
    });

    it('should clear interval on unmount', () => {
      const mockState = createMockGameState();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should restart interval when interval changes', async () => {
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      const { rerender } = renderHook(
        ({ intervalMs }) =>
          useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
            intervalMs,
            enabled: true,
          }),
        { initialProps: { intervalMs: 60000 } }
      );

      await advanceAndDrain(30000);

      rerender({ intervalMs: 30000 });

      await advanceAndDrain(30000);

      expect(mockCloudSave).toHaveBeenCalled();
    });
  });

  describe('Change Detection', () => {
    it('should skip save when state unchanged', async () => {
      const mockState = createMockGameState();

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      await advanceAndDrain(60000);

      await advanceAndDrain(60000);

      expect(mockCloudSave.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('should save when cats are added', async () => {
      const initialState = createMockGameState({ cats: [] });
      const updatedState = createMockGameState({
        cats: [{ id: 'cat-1', name: 'Whiskers' }] as any,
      });

      const { rerender } = renderHook(
        ({ state }) =>
          useAutoSave('user-123', state, 0, { relationships: [], events: [] }, mockCloudSave, {
            intervalMs: 60000,
            enabled: true,
          }),
        { initialProps: { state: initialState } }
      );

      await advanceAndDrain(60000);

      const callsAfterFirst = mockCloudSave.mock.calls.length;

      rerender({ state: updatedState });

      await advanceAndDrain(60000);

      expect(mockCloudSave.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });

    it('should save when money changes', async () => {
      const initialState = createMockGameState({ money: 100, cats: [{ id: '1' }] as any });
      const updatedState = createMockGameState({ money: 200, cats: [{ id: '1' }] as any });

      const { rerender } = renderHook(
        ({ state }) =>
          useAutoSave('user-123', state, 0, { relationships: [], events: [] }, mockCloudSave, {
            intervalMs: 60000,
            enabled: true,
          }),
        { initialProps: { state: initialState } }
      );

      await advanceAndDrain(60000);

      const callsAfterFirst = mockCloudSave.mock.calls.length;

      rerender({ state: updatedState });

      await advanceAndDrain(60000);

      expect(mockCloudSave.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });

    it('should save when day advances', async () => {
      const initialState = createMockGameState({ day: 1, cats: [{ id: '1' }] as any });
      const updatedState = createMockGameState({ day: 2, cats: [{ id: '1' }] as any });

      const { rerender } = renderHook(
        ({ state }) =>
          useAutoSave('user-123', state, 0, { relationships: [], events: [] }, mockCloudSave, {
            intervalMs: 60000,
            enabled: true,
          }),
        { initialProps: { state: initialState } }
      );

      await advanceAndDrain(60000);

      const callsAfterFirst = mockCloudSave.mock.calls.length;

      rerender({ state: updatedState });

      await advanceAndDrain(60000);

      expect(mockCloudSave.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });
  });

  describe('Guard Conditions', () => {
    it('should not save when userId is undefined', async () => {
      const mockState = createMockGameState();

      renderHook(() =>
        useAutoSave(undefined, mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      await advanceAndDrain(60000);

      expect(mockCloudSave).not.toHaveBeenCalled();
    });

    it('should not save when enabled is false', async () => {
      const mockState = createMockGameState();

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: false,
        })
      );

      await advanceAndDrain(60000);

      expect(mockCloudSave).not.toHaveBeenCalled();
    });

    it('should skip save when disabled and saveNow called', async () => {
      const mockState = createMockGameState();

      const { result } = renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: false,
        })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      // Should not save when disabled
      expect(mockCloudSave).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should retry on failure up to MAX_RETRIES', async () => {
      mockCloudSave
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true });

      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });
      const onSaveError = vi.fn();

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
          onSaveError,
        })
      );

      // Initial save + both retries (each scheduled 5s after the previous failure).
      // Use runOnlyPendingTimersAsync in a loop so that the async retry chain
      // (setTimeout -> async fn -> awaited cloudSave -> next setTimeout) is fully
      // drained between ticks.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      for (let i = 0; i < 5 && mockCloudSave.mock.calls.length < 3; i++) {
        await act(async () => {
          await vi.runOnlyPendingTimersAsync();
        });
      }

      expect(mockCloudSave).toHaveBeenCalledTimes(3);
    });

    it('should log error to database after max retries', async () => {
      mockCloudSave.mockResolvedValue({ success: false, error: 'Persistent error' });

      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      await advanceAndDrain(60000);

      // MAX_RETRIES = 2, so we expect 1 initial + 2 retries = 3 attempts.
      expect(mockCloudSave).toHaveBeenCalledTimes(3);
      expect(logErrorToDatabase).toHaveBeenCalled();
    });

    it('should call onSaveError callback after max retries', async () => {
      mockCloudSave.mockResolvedValue({ success: false, error: 'Network error' });

      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });
      const onSaveError = vi.fn();

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
          onSaveError,
        })
      );

      await advanceAndDrain(60000);

      expect(mockCloudSave).toHaveBeenCalledTimes(3);
      expect(onSaveError).toHaveBeenCalledTimes(1);
      expect(onSaveError.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track error count after retries exhausted', async () => {
      mockCloudSave.mockResolvedValue({ success: false, error: 'Persistent error' });

      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      const { result } = renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      await advanceAndDrain(60000);

      expect(mockCloudSave).toHaveBeenCalledTimes(3);
      expect(result.current.stats.errorCount).toBe(1);
      expect(result.current.stats.isRetrying).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should call onSaveStart before save', async () => {
      const onSaveStart = vi.fn();
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
          onSaveStart,
        })
      );

      await advanceAndDrain(60000);

      expect(onSaveStart).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveComplete on success', async () => {
      const onSaveComplete = vi.fn();
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
          onSaveComplete,
        })
      );

      await advanceAndDrain(60000);

      expect(onSaveComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Save Methods', () => {
    it('should allow manual save via saveNow', async () => {
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      const { result } = renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockCloudSave).toHaveBeenCalledTimes(1);
    });

    it('should allow force save via forceSave', async () => {
      const mockState = createMockGameState({ cats: [{ id: '1' }] as any });

      const { result } = renderHook(() =>
        useAutoSave('user-123', mockState, 0, { relationships: [], events: [] }, mockCloudSave, {
          intervalMs: 60000,
          enabled: true,
        })
      );

      // First save
      await act(async () => {
        await result.current.saveNow();
      });

      // Force save (bypasses change detection)
      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockCloudSave).toHaveBeenCalledTimes(2);
    });
  });
});
