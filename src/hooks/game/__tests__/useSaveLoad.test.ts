import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

import { useSaveLoad } from '../useSaveLoad';

describe('useSaveLoad', () => {
  it('should expose save and load functions', () => {
    const mockState = { cats: [], money: 100, day: 1, resources: { food: 0, medicine: 0, toys: 0, treats: 0 } };
    const { result } = renderHook(() => useSaveLoad(mockState as any, vi.fn()));
    expect(typeof result.current.saveGame).toBe('function');
    expect(typeof result.current.loadGame).toBe('function');
  });
});
