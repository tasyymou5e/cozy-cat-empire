/**
 * @fileoverview Tests for secure telemetry RPC wrappers.
 *
 * Verifies that the client wrappers around `log_auth_attempt_secure` and
 * `log_client_error_secure` (a) forward payloads with the exact field
 * shape the SECURITY DEFINER RPCs expect, and (b) gracefully swallow
 * server-side validation errors for malformed payloads instead of
 * throwing.
 *
 * The DB-level validation rules being asserted (mirrored here so the
 * contract is documented in code):
 *   log_auth_attempt_secure
 *     - _attempt_type ∈ {admin_login, admin_login_failed, access_denied,
 *                        login, signup, password_reset, logout}
 *     - _email is required, contains "@", length 3..254
 *     - _success must be boolean (not null)
 *     - _metadata must be a JSON object, ≤ 4 KB
 *   log_client_error_secure
 *     - _error_type matches /^[a-z][a-z0-9_]{2,49}$/
 *     - _error_message non-empty after trim, ≤ 5000 chars
 *     - _metadata must be a JSON object, ≤ 8 KB
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: mockLoggerError,
  }),
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: mockLoggerError },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'u1@example.com' } }),
}));

import { logAuthAttempt } from '@/hooks/admin/useAdminActivityLog';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

// Defeat the module-level rate limiter inside useErrorLogger by replacing
// Date.now with a monotonically advancing fake clock for the whole file.
const _origNow = Date.now;
let _clock = _origNow();
beforeEach(() => {
  mockRpc.mockReset();
  mockLoggerError.mockReset();
  _clock += 5 * 60_000;
  Date.now = () => _clock;
});
afterEach(() => {
  Date.now = _origNow;
});

describe('logAuthAttempt → log_auth_attempt_secure', () => {
  it('forwards a valid payload with the exact RPC field shape', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await logAuthAttempt({
      email: 'admin@example.com',
      attemptType: 'admin_login',
      success: true,
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'log_auth_attempt_secure',
      expect.objectContaining({
        _email: 'admin@example.com',
        _attempt_type: 'admin_login',
        _success: true,
        _error_message: null,
        _metadata: expect.objectContaining({ user_agent: expect.any(String) }),
      }),
    );
  });

  it.each([
    ['invalid attempt_type', { message: 'Invalid attempt_type' }],
    ['malformed email',      { message: 'Invalid email' }],
    ['array metadata',       { message: 'metadata must be an object' }],
    ['oversize metadata',    { message: 'metadata too large' }],
    ['oversize error msg',   { message: 'error_message too long' }],
  ])('swallows server validation error: %s', async (_label, rpcError) => {
    mockRpc.mockResolvedValue({ error: rpcError });

    await expect(
      logAuthAttempt({
        email: 'a@b.co',
        // intentionally cast — exercising server-side rejection of bad input
        attemptType: 'totally_not_allowed' as unknown as 'admin_login',
        success: true,
      }),
    ).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to log auth attempt:',
      rpcError,
    );
  });

  it('does not throw when the RPC throws a network error', async () => {
    mockRpc.mockRejectedValue(new Error('network down'));
    await expect(
      logAuthAttempt({ email: 'a@b.co', attemptType: 'admin_login', success: false }),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalled();
  });
});

describe('logErrorToDatabase → log_client_error_secure', () => {
  it('forwards a valid payload with the exact RPC field shape', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await logErrorToDatabase({
      error_type: 'network_error',
      error_message: 'GET /x failed with 500',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'log_client_error_secure',
      expect.objectContaining({
        _error_type: 'network_error',
        _error_message: 'GET /x failed with 500',
        _error_stack: null,
        _component_name: null,
      }),
    );
  });

  it('clamps oversized message and stack before sending', async () => {
    mockRpc.mockResolvedValue({ error: null });
    const longMsg = 'x'.repeat(6000);
    const longStack = 'y'.repeat(12000);

    await logErrorToDatabase({
      error_type: 'component_error',
      error_message: longMsg,
      error_stack: longStack,
    });

    const args = mockRpc.mock.calls[0][1] as Record<string, unknown>;
    expect((args._error_message as string).length).toBe(5000);
    expect((args._error_stack as string).length).toBe(10000);
  });

  it.each([
    ['empty error_type',     { error_type: '',              error_message: 'x' }, 'Invalid error_type'],
    ['malformed error_type', { error_type: 'BadType!',      error_message: 'x' }, 'Invalid error_type'],
    ['empty error_message',  { error_type: 'network_error', error_message: '   ' }, 'error_message required'],
  ])('swallows server validation error: %s', async (_label, payload, message) => {
    const rpcError = { message };
    mockRpc.mockResolvedValue({ error: rpcError });

    await expect(logErrorToDatabase(payload)).resolves.toBeUndefined();
  });

  it('does not throw when the RPC throws unexpectedly', async () => {
    mockRpc.mockRejectedValue(new Error('boom'));
    await expect(
      logErrorToDatabase({ error_type: 'network_error', error_message: 'x' }),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
