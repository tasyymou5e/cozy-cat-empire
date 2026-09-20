/**
 * @fileoverview Live integration tests for the secure telemetry RPCs.
 *
 * Hits the deployed Supabase REST endpoints for `log_auth_attempt_secure`
 * and `log_client_error_secure` with malformed payloads and asserts the
 * EXACT `message` strings returned by the SECURITY DEFINER functions.
 *
 * These assertions import the canonical constants from
 * `src/constants/telemetryErrors.ts`. If the SQL changes a message, this
 * test fails — and any client/UI text that surfaces the message should be
 * updated in lockstep.
 *
 * Skipped automatically when the environment can't reach the network
 * (e.g. offline CI), so this file never blocks the rest of the suite.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  AUTH_ATTEMPT_ERRORS,
  CLIENT_ERROR_ERRORS,
} from '@/constants/telemetryErrors';

const SUPABASE_URL = 'https://bkkluziuyystiqkcpbnd.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra2x1eml1eXlzdGlxa2NwYm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzM3NTcsImV4cCI6MjA4Mjk0OTc1N30.Ru-rZv9TpwaecoHsyypnC3E9hFYQXBfE04-NsT5uucg';

interface RpcError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

async function callRpc(name: string, body: Record<string, unknown>): Promise<{
  status: number;
  body: RpcError | null;
}> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  // 204 No Content on success, JSON error body on RAISE EXCEPTION.
  const text = await res.text();
  return {
    status: res.status,
    body: text ? (JSON.parse(text) as RpcError) : null,
  };
}

let online = true;

beforeAll(async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: ANON_KEY },
    });
    online = res.ok || res.status === 401 || res.status === 404;
  } catch {
    online = false;
  }
});

function liveEach<T extends readonly unknown[]>(cases: ReadonlyArray<T>) {
  return (name: string, fn: (...args: T) => Promise<void> | void) => {
    it.each(cases as unknown as T[])(name, async (...args) => {
      if (!online) return;
      await fn(...(args as unknown as T));
    });
  };
}

describe('live: log_auth_attempt_secure exact server messages', () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    [
      'invalid attempt_type',
      { _email: 'a@b.co', _attempt_type: 'totally_not_allowed', _success: true },
      AUTH_ATTEMPT_ERRORS.INVALID_ATTEMPT_TYPE,
    ],
    [
      'empty email',
      { _email: '   ', _attempt_type: 'login', _success: true },
      AUTH_ATTEMPT_ERRORS.INVALID_EMAIL,
    ],
    [
      'email missing @',
      { _email: 'noatsign', _attempt_type: 'login', _success: true },
      AUTH_ATTEMPT_ERRORS.INVALID_EMAIL,
    ],
    [
      'email too short',
      { _email: 'a', _attempt_type: 'login', _success: true },
      AUTH_ATTEMPT_ERRORS.INVALID_EMAIL,
    ],
    [
      'success is null',
      { _email: 'a@b.co', _attempt_type: 'login', _success: null },
      AUTH_ATTEMPT_ERRORS.SUCCESS_REQUIRED,
    ],
    [
      'error_message too long',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: false,
        _error_message: 'x'.repeat(1001),
      },
      AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG,
    ],
    [
      'metadata not an object (array)',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: true,
        _metadata: [1, 2, 3],
      },
      AUTH_ATTEMPT_ERRORS.METADATA_MUST_BE_OBJECT,
    ],
    [
      'metadata too large',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: true,
        _metadata: { blob: 'y'.repeat(5000) },
      },
      AUTH_ATTEMPT_ERRORS.METADATA_TOO_LARGE,
    ],
  ];

  liveEach(cases)('%s → %s', async (_label, payload, expected) => {
    const { status, body } = await callRpc('log_auth_attempt_secure', payload);
    expect(status).toBe(400);
    expect(body).not.toBeNull();
    expect(body).toEqual({
      code: 'P0001',
      message: expected,
      details: null,
      hint: null,
    });
    // Body must contain exactly these four keys — no extras leaking out.
    expect(Object.keys(body as object).sort()).toEqual(
      ['code', 'details', 'hint', 'message'],
    );
  });
});

describe('live: log_client_error_secure exact server messages', () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    [
      'empty error_type',
      { _error_type: '', _error_message: 'x' },
      CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
    ],
    [
      'uppercase error_type',
      { _error_type: 'BadType', _error_message: 'x' },
      CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
    ],
    [
      'error_type with punctuation',
      { _error_type: 'bad-type!', _error_message: 'x' },
      CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
    ],
    [
      'error_type starts with digit',
      { _error_type: '1bad', _error_message: 'x' },
      CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
    ],
    [
      'error_type too short',
      { _error_type: 'ab', _error_message: 'x' },
      CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
    ],
    [
      'whitespace error_message',
      { _error_type: 'network_error', _error_message: '   ' },
      CLIENT_ERROR_ERRORS.ERROR_MESSAGE_REQUIRED,
    ],
    [
      'error_message too long',
      { _error_type: 'network_error', _error_message: 'x'.repeat(5001) },
      CLIENT_ERROR_ERRORS.ERROR_MESSAGE_TOO_LONG,
    ],
    [
      'error_stack too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _error_stack: 'y'.repeat(10001),
      },
      CLIENT_ERROR_ERRORS.ERROR_STACK_TOO_LONG,
    ],
    [
      'component_name too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _component_name: 'c'.repeat(201),
      },
      CLIENT_ERROR_ERRORS.COMPONENT_NAME_TOO_LONG,
    ],
    [
      'route too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _route: '/'.padEnd(501, 'r'),
      },
      CLIENT_ERROR_ERRORS.ROUTE_TOO_LONG,
    ],
    [
      'user_agent too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _user_agent: 'u'.repeat(501),
      },
      CLIENT_ERROR_ERRORS.USER_AGENT_TOO_LONG,
    ],
    [
      'metadata not an object',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _metadata: [1, 2, 3],
      },
      CLIENT_ERROR_ERRORS.METADATA_MUST_BE_OBJECT,
    ],
    [
      'metadata too large',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _metadata: { blob: 'y'.repeat(9000) },
      },
      CLIENT_ERROR_ERRORS.METADATA_TOO_LARGE,
    ],
  ];

  liveEach(cases)('%s → %s', async (_label, payload, expected) => {
    const { status, body } = await callRpc('log_client_error_secure', payload);
    expect(status).toBe(400);
    expect(body).not.toBeNull();
    expect(body).toEqual({
      code: 'P0001',
      message: expected,
      details: null,
      hint: null,
    });
    expect(Object.keys(body as object).sort()).toEqual(
      ['code', 'details', 'hint', 'message'],
    );
  });
});
