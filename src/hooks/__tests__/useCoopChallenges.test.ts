import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

describe('useCoopChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with empty challenges', async () => {
    const { useCoopChallenges } = await import('../useCoopChallenges');
    const { result } = renderHook(() => useCoopChallenges('user-1', []));
    expect(Array.isArray(result.current.activeChallenges)).toBe(true);
  });
});
