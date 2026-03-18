import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { usePlayerProfile } from '../usePlayerProfile';

describe('usePlayerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
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
