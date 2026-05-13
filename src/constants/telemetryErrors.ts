/**
 * @fileoverview Canonical error messages returned by the secure telemetry
 * SECURITY DEFINER RPCs.
 *
 * This file is the **single source of truth** for validation error strings
 * thrown by:
 *   - `log_auth_attempt_secure`
 *   - `log_client_error_secure`
 *
 * The PL/pgSQL functions in the database use these exact literals; if you
 * change a value here you MUST regenerate the SQL migration that defines
 * the functions so they stay in lockstep.
 *
 * @module constants/telemetryErrors
 */

export const AUTH_ATTEMPT_ERRORS = {
  INVALID_ATTEMPT_TYPE: 'Invalid attempt_type',
  INVALID_EMAIL: 'Invalid email',
  SUCCESS_REQUIRED: 'success required',
  ERROR_MESSAGE_TOO_LONG: 'error_message too long',
  METADATA_MUST_BE_OBJECT: 'metadata must be an object',
  METADATA_TOO_LARGE: 'metadata too large',
} as const;

export const CLIENT_ERROR_ERRORS = {
  INVALID_ERROR_TYPE: 'Invalid error_type',
  ERROR_MESSAGE_REQUIRED: 'error_message required',
  ERROR_MESSAGE_TOO_LONG: 'error_message too long',
  ERROR_STACK_TOO_LONG: 'error_stack too long',
  COMPONENT_NAME_TOO_LONG: 'component_name too long',
  ROUTE_TOO_LONG: 'route too long',
  USER_AGENT_TOO_LONG: 'user_agent too long',
  METADATA_MUST_BE_OBJECT: 'metadata must be an object',
  METADATA_TOO_LARGE: 'metadata too large',
} as const;

/** Union of every telemetry RPC error message string. */
export type TelemetryErrorMessage =
  | (typeof AUTH_ATTEMPT_ERRORS)[keyof typeof AUTH_ATTEMPT_ERRORS]
  | (typeof CLIENT_ERROR_ERRORS)[keyof typeof CLIENT_ERROR_ERRORS];
