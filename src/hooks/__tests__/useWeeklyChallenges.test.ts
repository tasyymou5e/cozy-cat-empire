import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { useWeeklyChallenges } from '../useWeeklyChallenges';

describe('useWeeklyChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with empty challenges', () => {
    const { result } = renderHook(() => useWeeklyChallenges(undefined));
    expect(Array.isArray(result.current.challenges)).toBe(true);
  });

  it('should expose updateProgress function', () => {
    const { result } = renderHook(() => useWeeklyChallenges('u1'));
    expect(typeof result.current.updateProgress).toBe('function');
  });
});
