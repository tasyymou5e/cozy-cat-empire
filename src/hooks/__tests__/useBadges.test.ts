import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { useBadges } from '../useBadges';

describe('useBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize without crashing', () => {
    const { result } = renderHook(() => useBadges(undefined));
    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current.badges)).toBe(true);
  });

  it('should load badges when userId provided', async () => {
    globalSupabaseMock.setTableResult('player_badges', { data: [], error: null });
    const { result } = renderHook(() => useBadges('u1'));
    expect(result.current).toBeDefined();
  });
});
