import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { usePlayerProfile } from '../usePlayerProfile';

describe('usePlayerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
    globalSupabaseMock.setTableResult('profiles', { data: null, error: null });
  });

  it('should initialize with null profile', () => {
    const { result } = renderHook(() => usePlayerProfile(undefined));
    expect(result.current.profile).toBeNull();
  });

  it('should expose updateProfile function', () => {
    const { result } = renderHook(() => usePlayerProfile('u1'));
    expect(typeof result.current.updateProfile).toBe('function');
  });
});
