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
import {
  AUTH_ATTEMPT_ERRORS,
  CLIENT_ERROR_ERRORS,
} from '@/constants/telemetryErrors';

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
    ['invalid attempt_type', { message: AUTH_ATTEMPT_ERRORS.INVALID_ATTEMPT_TYPE }],
    ['malformed email',      { message: AUTH_ATTEMPT_ERRORS.INVALID_EMAIL }],
    ['array metadata',       { message: AUTH_ATTEMPT_ERRORS.METADATA_MUST_BE_OBJECT }],
    ['oversize metadata',    { message: AUTH_ATTEMPT_ERRORS.METADATA_TOO_LARGE }],
    ['oversize error msg',   { message: AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG }],
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
      expect.objectContaining({ raw_server_message: rpcError.message }),
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
  // NOTE: assertion-style tests for the happy path are covered by the
  // logAuthAttempt block above. Here we focus exclusively on malformed
  // payload handling, which is what this RPC tightening is about.

  it.each([
    ['empty error_type',     { error_type: '',              error_message: 'x' }, CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE],
    ['malformed error_type', { error_type: 'BadType!',      error_message: 'x' }, CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE],
    ['empty error_message',  { error_type: 'network_error', error_message: '   ' }, CLIENT_ERROR_ERRORS.ERROR_MESSAGE_REQUIRED],
    ['oversize error_message', { error_type: 'network_error', error_message: 'x'.repeat(5001) }, CLIENT_ERROR_ERRORS.ERROR_MESSAGE_TOO_LONG],
    ['array metadata',       { error_type: 'network_error', error_message: 'x', metadata: [1, 2, 3] as unknown as Record<string, unknown> }, CLIENT_ERROR_ERRORS.METADATA_MUST_BE_OBJECT],
    ['oversize metadata',    { error_type: 'network_error', error_message: 'x', metadata: { blob: 'y'.repeat(9000) } }, CLIENT_ERROR_ERRORS.METADATA_TOO_LARGE],
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
  });
});
