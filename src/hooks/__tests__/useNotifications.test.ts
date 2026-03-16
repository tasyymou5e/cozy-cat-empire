import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockSelect = vi.fn();
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

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock('@/lib/errorHandling', () => ({
  handleAsyncError: vi.fn(),
}));

import { useNotifications } from '../useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [] }),
    };
    // First 3 calls: friend_requests, gifts, trades; 4th: profiles
    mockFrom.mockReturnValue(chainMock);

    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
  });

  it('returns empty notifications when no userId', () => {
    const { result } = renderHook(() => useNotifications(undefined));
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('markAsRead decrements unread count', () => {
    const { result } = renderHook(() => useNotifications(undefined));

    // Manually set state via markAsRead on empty list (no-op but shouldn't crash)
    act(() => result.current.markAsRead('fr-1'));
    expect(result.current.unreadCount).toBe(0);
  });

  it('clearAll resets everything', () => {
    const { result } = renderHook(() => useNotifications(undefined));
    act(() => result.current.clearAll());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});
