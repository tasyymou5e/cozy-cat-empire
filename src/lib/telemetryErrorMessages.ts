/**
 * @fileoverview Mapping from raw secure-RPC server error messages to
 * user-friendly text suitable for toasts, admin tables, and any other UI
 * surface that needs to communicate a telemetry validation failure.
 *
 * The **raw server message** (the exact `RAISE EXCEPTION` string from the
 * SECURITY DEFINER functions in `log_auth_attempt_secure` /
 * `log_client_error_secure`) remains the canonical value and MUST be
 * preserved unchanged in:
 *   - structured logs (`logger.error(..., rpcError)`)
 *   - the `error_message` column of `auth_attempts_log`
 *   - the assertions in `secureTelemetryRpcLive.test.ts`
 *
 * This mapper is purely a **presentation layer** convenience.
 *
 * @module lib/telemetryErrorMessages
 */

import {
  AUTH_ATTEMPT_ERRORS,
  CLIENT_ERROR_ERRORS,
} from '@/constants/telemetryErrors';

/** Friendly text shown to users / admins for each known RPC error. */
const FRIENDLY_BY_RAW: Readonly<Record<string, string>> = {
  // log_auth_attempt_secure
  [AUTH_ATTEMPT_ERRORS.INVALID_ATTEMPT_TYPE]:
    'Unrecognized authentication event type.',
  [AUTH_ATTEMPT_ERRORS.INVALID_EMAIL]:
    'Email address is missing or malformed.',
  [AUTH_ATTEMPT_ERRORS.SUCCESS_REQUIRED]:
    'Could not record this auth event: missing outcome flag.',
  [AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG]:
    'Error description is too long to record (max 1000 characters).',

  // log_client_error_secure
  [CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE]:
    'Invalid error category — must be lowercase letters, digits, or underscores.',
  [CLIENT_ERROR_ERRORS.ERROR_MESSAGE_REQUIRED]:
    'Error message is required.',
  [CLIENT_ERROR_ERRORS.ERROR_STACK_TOO_LONG]:
    'Error stack trace is too long to record (max 10,000 characters).',
  [CLIENT_ERROR_ERRORS.COMPONENT_NAME_TOO_LONG]:
    'Component name is too long (max 200 characters).',
  [CLIENT_ERROR_ERRORS.ROUTE_TOO_LONG]:
    'Route is too long to record (max 500 characters).',
  [CLIENT_ERROR_ERRORS.USER_AGENT_TOO_LONG]:
    'User agent string is too long to record (max 500 characters).',

  // shared between both RPCs (overrides above with identical mapping)
  [CLIENT_ERROR_ERRORS.METADATA_MUST_BE_OBJECT]:
    'Telemetry metadata must be a JSON object.',
  [CLIENT_ERROR_ERRORS.METADATA_TOO_LARGE]:
    'Telemetry metadata payload is too large.',
  // `error_message too long` is shared too — value is identical so the
  // assignment above already covers both RPCs.
};

const FALLBACK = 'Telemetry payload was rejected by the server.';

/**
 * Result of mapping a raw RPC error to a user-facing presentation form.
 */
export interface FriendlyTelemetryError {
  /** Raw `RAISE EXCEPTION` string returned by the SECURITY DEFINER RPC. */
  raw: string | null;
  /** Friendly, human-readable copy suitable for UI surfaces. */
  friendly: string;
  /** True when `raw` matched a known constant from `telemetryErrors.ts`. */
  known: boolean;
}

/**
 * Convert a raw secure-RPC server message into a friendly UI string while
 * preserving the original message verbatim.
 *
 * Accepts:
 *   - the bare `message` string from a `PostgrestError`
 *   - the full error object `{ message?: string }`
 *   - `null` / `undefined` (returns the fallback)
 */
export function mapTelemetryError(
  input: string | { message?: string | null } | null | undefined,
): FriendlyTelemetryError {
  const raw =
    typeof input === 'string'
      ? input
      : input && typeof input === 'object'
        ? (input.message ?? null)
        : null;

  if (!raw) {
    return { raw: null, friendly: FALLBACK, known: false };
  }

  const friendly = FRIENDLY_BY_RAW[raw];
  if (friendly) {
    return { raw, friendly, known: true };
  }
  return { raw, friendly: FALLBACK, known: false };
}

/** Convenience: get just the friendly string. */
export function friendlyTelemetryMessage(
  input: string | { message?: string | null } | null | undefined,
): string {
  return mapTelemetryError(input).friendly;
}
