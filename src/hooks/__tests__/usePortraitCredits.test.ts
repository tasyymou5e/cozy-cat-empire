import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { usePortraitCredits } from '../usePortraitCredits';

describe('usePortraitCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
    globalSupabaseMock.setTableResult('player_portrait_credits', { data: null, error: null });
  });

  it('should initialize with default credits', () => {
    const { result } = renderHook(() => usePortraitCredits());
    expect(result.current.credits).toBeDefined();
  });
});
