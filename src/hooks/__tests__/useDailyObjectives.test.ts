import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { useDailyObjectives } from '../useDailyObjectives';

describe('useDailyObjectives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize without crashing', () => {
    const { result } = renderHook(() => useDailyObjectives(undefined));
    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current.objectives)).toBe(true);
  });
});
