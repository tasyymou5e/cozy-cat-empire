import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

import { useFriends } from '../useFriends';

describe('useFriends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
  });

  it('should initialize with empty friends list', () => {
    const { result } = renderHook(() => useFriends(undefined));
    expect(result.current.friends).toEqual([]);
    expect(result.current.pendingRequests).toEqual([]);
  });

  it('should expose sendFriendRequest and acceptRequest', () => {
    const { result } = renderHook(() => useFriends('u1'));
    expect(typeof result.current.sendFriendRequest).toBe('function');
    expect(typeof result.current.acceptRequest).toBe('function');
  });
});
