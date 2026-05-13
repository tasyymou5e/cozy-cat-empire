import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { usePlayerStats } from '../usePlayerStats';

describe('usePlayerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with default stats', () => {
    const { result } = renderHook(() => usePlayerStats(undefined));
    expect(result.current.stats).toBeDefined();
  });

  it('should expose fetchStats function', () => {
    const { result } = renderHook(() => usePlayerStats('u1'));
    expect(typeof result.current.fetchStats).toBe('function');
  });
});
