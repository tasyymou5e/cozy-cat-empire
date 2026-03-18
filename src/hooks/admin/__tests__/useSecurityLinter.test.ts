import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { useSecurityLinter } from '../useSecurityLinter';

describe('useSecurityLinter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it('should expose runLinter function', () => {
    const { result } = renderHook(() => useSecurityLinter());
    expect(typeof result.current.runLinter).toBe('function');
  });

  it('should initialize with not scanning', () => {
    const { result } = renderHook(() => useSecurityLinter());
    expect(result.current.isScanning).toBe(false);
  });
});
