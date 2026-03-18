import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

import { useVersionCheck } from '../useVersionCheck';

describe('useVersionCheck', () => {
  it('should not throw on initialization', () => {
    expect(() => {
      renderHook(() => useVersionCheck());
    }).not.toThrow();
  });
});
