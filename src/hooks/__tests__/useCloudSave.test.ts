import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockFrom = vi.fn();
const mockChannel = vi.fn();
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
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
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

import { useCloudSave } from '../useCloudSave';

describe('useCloudSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
  });

  it('returns null data when userId is undefined', () => {
    const { result } = renderHook(() => useCloudSave(undefined));
    expect(result.current.isLoaded).toBe(false);
  });

  it('cloudSave returns error when not logged in', async () => {
    const { result } = renderHook(() => useCloudSave(undefined));

    let saveResult: { success: boolean; error?: string } | undefined;
    await act(async () => {
      saveResult = await result.current.cloudSave(
        { cats: [], day: 1, money: 0 } as any,
        0,
        { relationships: [], events: [] }
      );
    });

    expect(saveResult?.success).toBe(false);
    expect(saveResult?.error).toBe('Not logged in');
  });

  it('cloudLoad returns error when not logged in', async () => {
    const { result } = renderHook(() => useCloudSave(undefined));

    let loadResult: { data: unknown; error?: string } | undefined;
    await act(async () => {
      loadResult = await result.current.cloudLoad();
    });

    expect(loadResult?.data).toBeNull();
    expect(loadResult?.error).toBe('Not logged in');
  });

  it('cloudLoad returns null data for new users', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useCloudSave('user-123'));

    let loadResult: { data: unknown; error?: string } | undefined;
    await act(async () => {
      loadResult = await result.current.cloudLoad();
    });

    expect(loadResult?.data).toBeNull();
    expect(loadResult?.error).toBeUndefined();
  });

  it('hasCloudSave returns false when not logged in', async () => {
    const { result } = renderHook(() => useCloudSave(undefined));

    let hasSave: boolean | undefined;
    await act(async () => {
      hasSave = await result.current.hasCloudSave();
    });

    expect(hasSave).toBe(false);
  });

  it('getLastSaveTime returns null initially', () => {
    const { result } = renderHook(() => useCloudSave('user-1'));
    expect(result.current.getLastSaveTime()).toBeNull();
  });

  it('clearExternalUpdate resets flag', () => {
    const { result } = renderHook(() => useCloudSave('user-1'));
    act(() => result.current.clearExternalUpdate());
    expect(result.current.hasExternalUpdate).toBe(false);
  });
});
