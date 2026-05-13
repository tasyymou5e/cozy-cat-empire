import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { useGlobalLeaderboard } from '../useGlobalLeaderboard';

describe('useGlobalLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with empty leaderboard', () => {
    const { result } = renderHook(() => useGlobalLeaderboard('u1'));
    expect(Array.isArray(result.current.leaderboard)).toBe(true);
  });

  it('should expose syncPlayerStats', () => {
    const { result } = renderHook(() => useGlobalLeaderboard('u1'));
    expect(typeof result.current.syncPlayerStats).toBe('function');
  });
});
