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

/**
 * Stable, machine-readable category keys for known telemetry RPC errors.
 * These are surfaced in admin UI filters so admins can quickly slice
 * common payload rejections without memorizing the exact server strings.
 */
export type TelemetryErrorCategory =
  | 'invalid_attempt_type'
  | 'invalid_email'
  | 'success_required'
  | 'invalid_error_type'
  | 'error_message_required'
  | 'error_message_too_long'
  | 'error_stack_too_long'
  | 'component_name_too_long'
  | 'route_too_long'
  | 'user_agent_too_long'
  | 'metadata_invalid'
  | 'metadata_too_large'
  | 'unknown';

interface CategoryMeta {
  key: TelemetryErrorCategory;
  label: string;
  friendly: string;
  /** Raw RAISE EXCEPTION strings that map to this category. */
  rawMessages: readonly string[];
}

/**
 * Catalogue of every known category. Order is the recommended display
 * order in admin filter dropdowns (most common rejections first).
 */
export const TELEMETRY_ERROR_CATEGORIES: readonly CategoryMeta[] = [
  {
    key: 'invalid_attempt_type',
    label: 'Invalid attempt type',
    friendly: 'Unrecognized authentication event type.',
    rawMessages: [AUTH_ATTEMPT_ERRORS.INVALID_ATTEMPT_TYPE],
  },
  {
    key: 'invalid_email',
    label: 'Invalid email',
    friendly: 'Email address is missing or malformed.',
    rawMessages: [AUTH_ATTEMPT_ERRORS.INVALID_EMAIL],
  },
  {
    key: 'success_required',
    label: 'Missing outcome flag',
    friendly: 'Could not record this auth event: missing outcome flag.',
    rawMessages: [AUTH_ATTEMPT_ERRORS.SUCCESS_REQUIRED],
  },
  {
    key: 'invalid_error_type',
    label: 'Invalid error type',
    friendly:
      'Invalid error category — must be lowercase letters, digits, or underscores.',
    rawMessages: [CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE],
  },
  {
    key: 'error_message_required',
    label: 'Missing error message',
    friendly: 'Error message is required.',
    rawMessages: [CLIENT_ERROR_ERRORS.ERROR_MESSAGE_REQUIRED],
  },
  {
    key: 'error_message_too_long',
    label: 'Error message too long',
    friendly: 'Error description is too long to record.',
    // Note: AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG and
    // CLIENT_ERROR_ERRORS.ERROR_MESSAGE_TOO_LONG share the same string.
    rawMessages: [
      AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG,
      CLIENT_ERROR_ERRORS.ERROR_MESSAGE_TOO_LONG,
    ],
  },
  {
    key: 'error_stack_too_long',
    label: 'Stack trace too long',
    friendly: 'Error stack trace is too long to record (max 10,000 characters).',
    rawMessages: [CLIENT_ERROR_ERRORS.ERROR_STACK_TOO_LONG],
  },
  {
    key: 'component_name_too_long',
    label: 'Component name too long',
    friendly: 'Component name is too long (max 200 characters).',
    rawMessages: [CLIENT_ERROR_ERRORS.COMPONENT_NAME_TOO_LONG],
  },
  {
    key: 'route_too_long',
    label: 'Route too long',
    friendly: 'Route is too long to record (max 500 characters).',
    rawMessages: [CLIENT_ERROR_ERRORS.ROUTE_TOO_LONG],
  },
  {
    key: 'user_agent_too_long',
    label: 'User agent too long',
    friendly: 'User agent string is too long to record (max 500 characters).',
    rawMessages: [CLIENT_ERROR_ERRORS.USER_AGENT_TOO_LONG],
  },
  {
    key: 'metadata_invalid',
    label: 'Metadata not an object',
    friendly: 'Telemetry metadata must be a JSON object.',
    rawMessages: [
      AUTH_ATTEMPT_ERRORS.METADATA_MUST_BE_OBJECT,
      CLIENT_ERROR_ERRORS.METADATA_MUST_BE_OBJECT,
    ],
  },
  {
    key: 'metadata_too_large',
    label: 'Metadata too large',
    friendly: 'Telemetry metadata payload is too large.',
    rawMessages: [
      AUTH_ATTEMPT_ERRORS.METADATA_TOO_LARGE,
      CLIENT_ERROR_ERRORS.METADATA_TOO_LARGE,
    ],
  },
] as const;

/** O(1) lookup: raw server message → category metadata. */
const CATEGORY_BY_RAW: ReadonlyMap<string, CategoryMeta> = new Map(
  TELEMETRY_ERROR_CATEGORIES.flatMap((c) =>
    c.rawMessages.map((raw) => [raw, c] as const),
  ),
);

/** Find the category metadata for a raw server message, if known. */
export function getTelemetryCategory(
  raw: string | null | undefined,
): CategoryMeta | null {
  if (!raw) return null;
  return CATEGORY_BY_RAW.get(raw) ?? null;
}

/** Get every raw server message string for a given category. */
export function rawMessagesForCategory(
  category: TelemetryErrorCategory,
): readonly string[] {
  if (category === 'unknown') return [];
  return (
    TELEMETRY_ERROR_CATEGORIES.find((c) => c.key === category)?.rawMessages ?? []
  );
}

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
  /** Stable category key, or `'unknown'` if the message is unrecognized. */
  category: TelemetryErrorCategory;
  /** Display label for the category (or `'Unknown'`). */
  categoryLabel: string;
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
    return {
      raw: null,
      friendly: FALLBACK,
      known: false,
      category: 'unknown',
      categoryLabel: 'Unknown',
    };
  }

  const meta = CATEGORY_BY_RAW.get(raw);
  if (meta) {
    return {
      raw,
      friendly: meta.friendly,
      known: true,
      category: meta.key,
      categoryLabel: meta.label,
    };
  }
  return {
    raw,
    friendly: FALLBACK,
    known: false,
    category: 'unknown',
    categoryLabel: 'Unknown',
  };
}

/** Convenience: get just the friendly string. */
export function friendlyTelemetryMessage(
  input: string | { message?: string | null } | null | undefined,
): string {
  return mapTelemetryError(input).friendly;
}

