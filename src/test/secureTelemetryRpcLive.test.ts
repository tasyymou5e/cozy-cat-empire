/**
 * @fileoverview Live integration tests for the secure telemetry RPCs.
 *
 * Hits the deployed Supabase REST endpoints for `log_auth_attempt_secure`
 * and `log_client_error_secure` with malformed payloads and asserts the
 * EXACT `message` strings returned by the SECURITY DEFINER functions.
 *
 * These assertions are the canonical contract: the messages here MUST
 * match the `RAISE EXCEPTION` strings inside the SQL functions. If the
 * SQL changes a message, this test fails — and any client/UI text that
 * surfaces the message should be updated in lockstep.
 *
 * Skipped automatically when the environment can't reach the network
 * (e.g. offline CI), so this file never blocks the rest of the suite.
 */

import { describe, it, expect, beforeAll } from 'vitest';

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
      'Invalid attempt_type',
    ],
    [
      'empty email',
      { _email: '   ', _attempt_type: 'login', _success: true },
      'Invalid email',
    ],
    [
      'email missing @',
      { _email: 'noatsign', _attempt_type: 'login', _success: true },
      'Invalid email',
    ],
    [
      'email too short',
      { _email: 'a', _attempt_type: 'login', _success: true },
      'Invalid email',
    ],
    [
      'success is null',
      { _email: 'a@b.co', _attempt_type: 'login', _success: null },
      'success required',
    ],
    [
      'error_message too long',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: false,
        _error_message: 'x'.repeat(1001),
      },
      'error_message too long',
    ],
    [
      'metadata not an object (array)',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: true,
        _metadata: [1, 2, 3],
      },
      'metadata must be an object',
    ],
    [
      'metadata too large',
      {
        _email: 'a@b.co',
        _attempt_type: 'login',
        _success: true,
        _metadata: { blob: 'y'.repeat(5000) },
      },
      'metadata too large',
    ],
  ];

  liveEach(cases)('%s → %s', async (_label, payload, expected) => {
    const { body } = await callRpc('log_auth_attempt_secure', payload);
    expect(body?.message).toBe(expected);
    expect(body?.code).toBe('P0001');
  });
});

describe('live: log_client_error_secure exact server messages', () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    [
      'empty error_type',
      { _error_type: '', _error_message: 'x' },
      'Invalid error_type',
    ],
    [
      'uppercase error_type',
      { _error_type: 'BadType', _error_message: 'x' },
      'Invalid error_type',
    ],
    [
      'error_type with punctuation',
      { _error_type: 'bad-type!', _error_message: 'x' },
      'Invalid error_type',
    ],
    [
      'error_type starts with digit',
      { _error_type: '1bad', _error_message: 'x' },
      'Invalid error_type',
    ],
    [
      'error_type too short',
      { _error_type: 'ab', _error_message: 'x' },
      'Invalid error_type',
    ],
    [
      'whitespace error_message',
      { _error_type: 'network_error', _error_message: '   ' },
      'error_message required',
    ],
    [
      'error_message too long',
      { _error_type: 'network_error', _error_message: 'x'.repeat(5001) },
      'error_message too long',
    ],
    [
      'error_stack too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _error_stack: 'y'.repeat(10001),
      },
      'error_stack too long',
    ],
    [
      'component_name too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _component_name: 'c'.repeat(201),
      },
      'component_name too long',
    ],
    [
      'route too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _route: '/'.padEnd(501, 'r'),
      },
      'route too long',
    ],
    [
      'user_agent too long',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _user_agent: 'u'.repeat(501),
      },
      'user_agent too long',
    ],
    [
      'metadata not an object',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _metadata: [1, 2, 3],
      },
      'metadata must be an object',
    ],
    [
      'metadata too large',
      {
        _error_type: 'network_error',
        _error_message: 'x',
        _metadata: { blob: 'y'.repeat(9000) },
      },
      'metadata too large',
    ],
  ];

  liveEach(cases)('%s → %s', async (_label, payload, expected) => {
    const { body } = await callRpc('log_client_error_secure', payload);
    expect(body?.message).toBe(expected);
    expect(body?.code).toBe('P0001');
  });
});
