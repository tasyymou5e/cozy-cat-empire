/**
 * @fileoverview Tests for useAdminRateLimit hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })),
  },
}));

// Mock Auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-123' },
  })),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import { useAdminRateLimit } from '../useAdminRateLimit';

describe('useAdminRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock chain - the actual implementation uses .single()
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle });
    // Default: no existing rate limit record (PGRST116 = no rows)
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('should allow action within rate limit', async () => {
    // No existing rate limit record (PGRST116 = no rows returned)
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const { result } = renderHook(() => useAdminRateLimit());

    let checkResult: any;
    await act(async () => {
      checkResult = await result.current.checkRateLimit('user_delete');
    });

    expect(checkResult.allowed).toBe(true);
    expect(checkResult.remaining).toBe(5); // Default limit for user_delete
  });

  it('should block action when rate limit exceeded', async () => {
    // Existing record at limit
    mockSingle.mockResolvedValue({
      data: {
        action_count: 5,
        window_start: new Date().toISOString(),
      },
      error: null,
    });

    const { result } = renderHook(() => useAdminRateLimit());

    let checkResult: any;
    await act(async () => {
      checkResult = await result.current.checkRateLimit('user_delete');
    });

    expect(checkResult.allowed).toBe(false);
    expect(checkResult.remaining).toBe(0);
  });

  it('should reset limit after time window expires', async () => {
    // Old record outside window
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
    
    mockSingle.mockResolvedValue({
      data: {
        action_count: 5,
        window_start: oldDate.toISOString(),
      },
      error: null,
    });

    const { result } = renderHook(() => useAdminRateLimit());

    let checkResult: any;
    await act(async () => {
      checkResult = await result.current.checkRateLimit('user_delete');
    });

    // Should be allowed because window expired
    expect(checkResult.allowed).toBe(true);
  });

  it('should track different action types separately', async () => {
    // First action type at limit
    mockSingle.mockResolvedValueOnce({
      data: {
        action_count: 5,
        window_start: new Date().toISOString(),
      },
      error: null,
    });
    
    // Second action type (bulk_suspend) has room - use an action that exists in RATE_LIMITS
    mockSingle.mockResolvedValueOnce({
      data: {
        action_count: 1,
        window_start: new Date().toISOString(),
      },
      error: null,
    });

    const { result } = renderHook(() => useAdminRateLimit());

    let deleteResult: any;
    let bulkSuspendResult: any;

    await act(async () => {
      deleteResult = await result.current.checkRateLimit('user_delete');
    });

    await act(async () => {
      // Use bulk_suspend which exists in RATE_LIMITS (limit: 3)
      bulkSuspendResult = await result.current.checkRateLimit('bulk_suspend');
    });

    expect(deleteResult.allowed).toBe(false);
    expect(bulkSuspendResult.allowed).toBe(true);
  });

  it('should record action and increment count', async () => {
    // No existing record - will trigger insert
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const { result } = renderHook(() => useAdminRateLimit());

    let recorded: boolean = false;
    await act(async () => {
      recorded = await result.current.recordAction('user_delete');
    });

    expect(recorded).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });
});
