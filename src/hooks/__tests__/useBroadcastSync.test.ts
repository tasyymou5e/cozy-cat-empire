import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

import { useBroadcastSync } from '../useBroadcastSync';

describe('useBroadcastSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
  });

  it('should expose broadcastUpdate function', () => {
    const { result } = renderHook(() =>
      useBroadcastSync('u1', vi.fn())
    );
    expect(typeof result.current.broadcastUpdate).toBe('function');
  });
});
