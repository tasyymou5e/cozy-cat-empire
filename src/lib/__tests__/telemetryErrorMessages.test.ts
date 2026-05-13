/**
 * @fileoverview Unit tests for the telemetry error mapper.
 *
 * Verifies that:
 *   - Every constant in `AUTH_ATTEMPT_ERRORS` and `CLIENT_ERROR_ERRORS`
 *     maps to a distinct, non-empty friendly string.
 *   - The raw server message is preserved verbatim on the result.
 *   - Unknown / null inputs fall back to a generic message.
 *   - Object-shaped inputs (`{ message: '...' }`) are accepted.
 */

import { describe, it, expect } from 'vitest';
import {
  AUTH_ATTEMPT_ERRORS,
  CLIENT_ERROR_ERRORS,
} from '@/constants/telemetryErrors';
import {
  mapTelemetryError,
  friendlyTelemetryMessage,
} from '@/lib/telemetryErrorMessages';

const ALL_KNOWN: string[] = [
  ...Object.values(AUTH_ATTEMPT_ERRORS),
  ...Object.values(CLIENT_ERROR_ERRORS),
];

describe('mapTelemetryError', () => {
  it.each(ALL_KNOWN)('maps known message %s to a friendly string', (raw) => {
    const result = mapTelemetryError(raw);
    expect(result.known).toBe(true);
    expect(result.raw).toBe(raw);
    expect(result.friendly).toBeTruthy();
    // Never expose the raw server string as the friendly value.
    expect(result.friendly).not.toBe(raw);
  });

  it('accepts an error-shaped object', () => {
    const result = mapTelemetryError({ message: AUTH_ATTEMPT_ERRORS.INVALID_EMAIL });
    expect(result.known).toBe(true);
    expect(result.raw).toBe(AUTH_ATTEMPT_ERRORS.INVALID_EMAIL);
  });

  it('falls back for unknown messages but preserves raw', () => {
    const result = mapTelemetryError('some unrecognized server error');
    expect(result.known).toBe(false);
    expect(result.raw).toBe('some unrecognized server error');
    expect(result.friendly).toMatch(/rejected/i);
  });

  it.each([null, undefined, { message: null }, { message: '' }])(
    'falls back for empty input: %s',
    (input) => {
      const result = mapTelemetryError(input as never);
      expect(result.known).toBe(false);
      expect(result.raw).toBeNull();
      expect(result.friendly).toBeTruthy();
    },
  );
});

describe('friendlyTelemetryMessage', () => {
  it('returns just the friendly string', () => {
    expect(friendlyTelemetryMessage(CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE))
      .toMatch(/Invalid error category/);
  });
});
