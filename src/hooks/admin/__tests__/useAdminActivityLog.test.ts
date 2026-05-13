/**
 * @fileoverview Tests for useAdminActivityLog hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Supabase client
const mockInsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

// Capture logger.error so we can assert error handling without using console
const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: mockLoggerError,
  }),
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: mockLoggerError },
}));

// Mock Auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-123', email: 'admin@example.com' },
  })),
}));

import { useAdminActivityLog } from '../useAdminActivityLog';

describe('useAdminActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should log admin activity with correct fields', async () => {
    const { result } = renderHook(() => useAdminActivityLog());

    await act(async () => {
      await result.current.logActivity({
        actionType: 'user_suspend',
        actionDescription: 'Suspended user for violations',
        targetUserId: 'target-user-123',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        admin_user_id: 'admin-123',
        action_type: 'user_suspend',
        action_description: 'Suspended user for violations',
        target_user_id: 'target-user-123',
      }),
    ]);
  });

  it('should include metadata in log entry', async () => {
    const { result } = renderHook(() => useAdminActivityLog());

    const metadata = {
      reason: 'spam',
      duration: '7 days',
    };

    await act(async () => {
      await result.current.logActivity({
        actionType: 'user_suspend',
        actionDescription: 'Suspended user',
        metadata,
      });
    });

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: expect.objectContaining(metadata),
      }),
    ]);
  });

  it('should include target table and record id when provided', async () => {
    const { result } = renderHook(() => useAdminActivityLog());

    await act(async () => {
      await result.current.logActivity({
        actionType: 'record_delete',
        actionDescription: 'Deleted error log entry',
        targetTable: 'error_logs',
        targetRecordId: 'record-456',
      });
    });

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        target_table: 'error_logs',
        target_record_id: 'record-456',
      }),
    ]);
  });

  it('should handle database insert errors gracefully', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } });

    const { result } = renderHook(() => useAdminActivityLog());

    // Should not throw
    await act(async () => {
      await result.current.logActivity({
        actionType: 'test_action',
        actionDescription: 'Test',
      });
    });

    expect(mockLoggerError).toHaveBeenCalled();
  });
});
