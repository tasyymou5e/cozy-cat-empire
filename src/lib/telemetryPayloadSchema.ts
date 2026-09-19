/**
 * @fileoverview Client-side mirror of the server-side validation performed by
 * the secure telemetry SECURITY DEFINER RPCs
 * (`log_auth_attempt_secure`, `log_client_error_secure`).
 *
 * The rules here MUST stay in lockstep with
 * `supabase/migrations/20260513060136_*.sql`. Each rule points at the canonical
 * error constant the database raises so the validator page can show the exact
 * server message an admin would receive.
 *
 * @module lib/telemetryPayloadSchema
 */

import { AUTH_ATTEMPT_ERRORS, CLIENT_ERROR_ERRORS } from '@/constants/telemetryErrors';

export type TelemetryRpcName = 'log_auth_attempt_secure' | 'log_client_error_secure';

export type FieldKind = 'string' | 'boolean' | 'object';

export interface FieldSpec {
  /** Parameter name exactly as the RPC expects it. */
  name: string;
  kind: FieldKind;
  required: boolean;
  /** Human description of the field. */
  description: string;
  /** Max characters (strings) or bytes (metadata objects). */
  maxLength?: number;
  /** Allow-list of accepted values. */
  allowedValues?: readonly string[];
  /** Regex the trimmed value must match. */
  pattern?: RegExp;
  /** Human-readable form of the pattern. */
  patternLabel?: string;
  /** Server error raised when the value is missing or shaped wrong. */
  invalidMessage: string;
  /** Server error raised when the value exceeds its length cap. */
  tooLongMessage?: string;
  /** Example of a valid value, used for the "fix" suggestion. */
  example: string;
}

export interface RpcSpec {
  rpc: TelemetryRpcName;
  label: string;
  description: string;
  fields: FieldSpec[];
  /** A payload that passes every rule, offered as a starting point. */
  samplePayload: Record<string, unknown>;
}

const AUTH_ATTEMPT_TYPES = [
  'admin_login', 'admin_login_failed', 'access_denied',
  'login', 'signup', 'password_reset', 'logout',
] as const;

export const TELEMETRY_RPC_SPECS: Record<TelemetryRpcName, RpcSpec> = {
  log_auth_attempt_secure: {
    rpc: 'log_auth_attempt_secure',
    label: 'Auth attempt',
    description: 'Records a sign-in / access attempt into auth_attempts_log.',
    fields: [
      {
        name: '_email',
        kind: 'string',
        required: true,
        description: 'Email the attempt was made with. Must contain "@".',
        maxLength: 254,
        pattern: /^.*@.*$/,
        patternLabel: 'must contain an "@" and be 3-254 characters',
        invalidMessage: AUTH_ATTEMPT_ERRORS.INVALID_EMAIL,
        tooLongMessage: AUTH_ATTEMPT_ERRORS.INVALID_EMAIL,
        example: 'admin@example.com',
      },
      {
        name: '_attempt_type',
        kind: 'string',
        required: true,
        description: 'What kind of attempt this was.',
        allowedValues: AUTH_ATTEMPT_TYPES,
        invalidMessage: AUTH_ATTEMPT_ERRORS.INVALID_ATTEMPT_TYPE,
        example: 'admin_login',
      },
      {
        name: '_success',
        kind: 'boolean',
        required: true,
        description: 'Whether the attempt succeeded. Must be true or false, never null.',
        invalidMessage: AUTH_ATTEMPT_ERRORS.SUCCESS_REQUIRED,
        example: 'true',
      },
      {
        name: '_error_message',
        kind: 'string',
        required: false,
        description: 'Optional failure reason.',
        maxLength: 1000,
        invalidMessage: AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG,
        tooLongMessage: AUTH_ATTEMPT_ERRORS.ERROR_MESSAGE_TOO_LONG,
        example: 'Invalid password',
      },
      {
        name: '_metadata',
        kind: 'object',
        required: false,
        description: 'Optional JSON object of extra context, max 4 KB.',
        maxLength: 4096,
        invalidMessage: AUTH_ATTEMPT_ERRORS.METADATA_MUST_BE_OBJECT,
        tooLongMessage: AUTH_ATTEMPT_ERRORS.METADATA_TOO_LARGE,
        example: '{ "source": "admin-login-form" }',
      },
    ],
    samplePayload: {
      _email: 'admin@example.com',
      _attempt_type: 'admin_login',
      _success: false,
      _error_message: 'Invalid password',
      _metadata: { source: 'admin-login-form' },
    },
  },
  log_client_error_secure: {
    rpc: 'log_client_error_secure',
    label: 'Client error',
    description: 'Records a browser-side error into error_logs.',
    fields: [
      {
        name: '_error_type',
        kind: 'string',
        required: true,
        description: 'Lowercase snake_case category of the error.',
        pattern: /^[a-z][a-z0-9_]{2,49}$/,
        patternLabel: 'lowercase letters, digits and underscores, 3-50 characters, starts with a letter',
        invalidMessage: CLIENT_ERROR_ERRORS.INVALID_ERROR_TYPE,
        example: 'component_error',
      },
      {
        name: '_error_message',
        kind: 'string',
        required: true,
        description: 'What went wrong.',
        maxLength: 5000,
        invalidMessage: CLIENT_ERROR_ERRORS.ERROR_MESSAGE_REQUIRED,
        tooLongMessage: CLIENT_ERROR_ERRORS.ERROR_MESSAGE_TOO_LONG,
        example: 'Cannot read properties of undefined',
      },
      {
        name: '_error_stack',
        kind: 'string',
        required: false,
        description: 'Optional stack trace.',
        maxLength: 10000,
        invalidMessage: CLIENT_ERROR_ERRORS.ERROR_STACK_TOO_LONG,
        tooLongMessage: CLIENT_ERROR_ERRORS.ERROR_STACK_TOO_LONG,
        example: 'at CatCard (CatCard.tsx:42)',
      },
      {
        name: '_component_name',
        kind: 'string',
        required: false,
        description: 'Optional component the error came from.',
        maxLength: 200,
        invalidMessage: CLIENT_ERROR_ERRORS.COMPONENT_NAME_TOO_LONG,
        tooLongMessage: CLIENT_ERROR_ERRORS.COMPONENT_NAME_TOO_LONG,
        example: 'CatCard',
      },
      {
        name: '_route',
        kind: 'string',
        required: false,
        description: 'Optional page path.',
        maxLength: 500,
        invalidMessage: CLIENT_ERROR_ERRORS.ROUTE_TOO_LONG,
        tooLongMessage: CLIENT_ERROR_ERRORS.ROUTE_TOO_LONG,
        example: '/catking/dashboard',
      },
      {
        name: '_user_agent',
        kind: 'string',
        required: false,
        description: 'Optional browser user agent.',
        maxLength: 500,
        invalidMessage: CLIENT_ERROR_ERRORS.USER_AGENT_TOO_LONG,
        tooLongMessage: CLIENT_ERROR_ERRORS.USER_AGENT_TOO_LONG,
        example: 'Mozilla/5.0 ...',
      },
      {
        name: '_metadata',
        kind: 'object',
        required: false,
        description: 'Optional JSON object of extra context, max 8 KB.',
        maxLength: 8192,
        invalidMessage: CLIENT_ERROR_ERRORS.METADATA_MUST_BE_OBJECT,
        tooLongMessage: CLIENT_ERROR_ERRORS.METADATA_TOO_LARGE,
        example: '{ "viewport": { "width": 1280 } }',
      },
    ],
    samplePayload: {
      _error_type: 'component_error',
      _error_message: 'Cannot read properties of undefined',
      _error_stack: 'at CatCard (CatCard.tsx:42)',
      _component_name: 'CatCard',
      _route: '/catking/dashboard',
      _user_agent: 'Mozilla/5.0',
      _metadata: { viewport: { width: 1280, height: 800 } },
    },
  },
};

export type FieldStatus = 'ok' | 'missing' | 'malformed' | 'omitted';

export interface FieldResult {
  field: FieldSpec;
  status: FieldStatus;
  /** Value found in the payload, rendered for display. */
  valuePreview: string;
  /** Exact message the database would raise, when invalid. */
  serverMessage?: string;
  /** Plain-language explanation of the problem. */
  problem?: string;
  /** What to change to make it valid. */
  fix?: string;
}

export interface ExtraFieldResult {
  name: string;
  valuePreview: string;
  fix: string;
}

export interface ValidationReport {
  rpc: TelemetryRpcName;
  valid: boolean;
  fields: FieldResult[];
  /** Keys present in the payload that the RPC does not accept. */
  extras: ExtraFieldResult[];
  /** Payload with problems corrected, ready to copy. */
  suggestedPayload: Record<string, unknown>;
}

function preview(value: unknown): string {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  return JSON.stringify(value);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Validate a payload against one telemetry RPC, mirroring the database rules.
 * Returns a per-field verdict plus a corrected payload suggestion.
 */
export function validateTelemetryPayload(
  rpc: TelemetryRpcName,
  payload: Record<string, unknown>
): ValidationReport {
  const spec = TELEMETRY_RPC_SPECS[rpc];
  const suggested: Record<string, unknown> = {};
  const fields: FieldResult[] = spec.fields.map((field) => {
    const raw = payload[field.name];
    const present = raw !== undefined && raw !== null && raw !== '';

    const bad = (problem: string, fix: string, serverMessage: string): FieldResult => {
      suggested[field.name] = field.kind === 'object'
        ? { note: 'replace with a JSON object' }
        : field.kind === 'boolean'
          ? true
          : field.example;
      return {
        field, status: 'malformed', valuePreview: preview(raw),
        problem, fix, serverMessage,
      };
    };

    // Missing values
    if (!present) {
      if (field.kind === 'boolean' && typeof raw === 'boolean') {
        // false is a legitimate boolean value; fall through to the checks below.
      } else if (field.required) {
        suggested[field.name] = field.kind === 'boolean' ? true : field.example;
        return {
          field,
          status: 'missing',
          valuePreview: preview(raw),
          problem: 'Required field is missing or empty.',
          fix: `Add "${field.name}" — for example ${field.example}.`,
          serverMessage: field.invalidMessage,
        };
      } else {
        return { field, status: 'omitted', valuePreview: preview(raw) };
      }
    }

    // Type checks
    if (field.kind === 'boolean' && typeof raw !== 'boolean') {
      return bad(
        'Must be a true/false boolean, not a string or number.',
        `Set "${field.name}" to true or false without quotes.`,
        field.invalidMessage
      );
    }
    if (field.kind === 'string' && typeof raw !== 'string') {
      return bad(
        'Must be text.',
        `Wrap the value in quotes, e.g. "${field.example}".`,
        field.invalidMessage
      );
    }
    if (field.kind === 'object') {
      if (typeof raw !== 'object' || Array.isArray(raw)) {
        return bad(
          'Must be a JSON object (not an array, string or number).',
          `Use an object such as ${field.example}.`,
          field.invalidMessage
        );
      }
      const bytes = byteLength(JSON.stringify(raw));
      if (field.maxLength && bytes > field.maxLength) {
        return bad(
          `Object is ${bytes} bytes, over the ${field.maxLength} byte limit.`,
          'Remove large keys or trim long strings before sending.',
          field.tooLongMessage ?? field.invalidMessage
        );
      }
      suggested[field.name] = raw;
      return { field, status: 'ok', valuePreview: preview(raw) };
    }

    // String rules
    const value = String(raw);
    const trimmed = value.trim();
    if (field.allowedValues && !field.allowedValues.includes(trimmed)) {
      return bad(
        'Value is not in the allow-list.',
        `Use one of: ${field.allowedValues.join(', ')}.`,
        field.invalidMessage
      );
    }
    if (field.name === '_email' && (trimmed.length < 3 || !trimmed.includes('@'))) {
      return bad(
        'Does not look like an email address.',
        `Use a full address such as ${field.example}.`,
        field.invalidMessage
      );
    }
    if (field.pattern && !field.pattern.test(trimmed)) {
      return bad(
        `Does not match the required format (${field.patternLabel ?? field.pattern.source}).`,
        `Rewrite it as e.g. "${field.example}".`,
        field.invalidMessage
      );
    }
    if (field.maxLength && trimmed.length > field.maxLength) {
      return bad(
        `${trimmed.length} characters, over the ${field.maxLength} character limit.`,
        `Shorten it to ${field.maxLength} characters or fewer.`,
        field.tooLongMessage ?? field.invalidMessage
      );
    }

    suggested[field.name] = trimmed;
    return { field, status: 'ok', valuePreview: preview(raw) };
  });

  const known = new Set(spec.fields.map((f) => f.name));
  const extras: ExtraFieldResult[] = Object.keys(payload)
    .filter((k) => !known.has(k))
    .map((name) => ({
      name,
      valuePreview: preview(payload[name]),
      fix: known.has(`_${name}`)
        ? `Rename it to "_${name}" — RPC parameters are prefixed with an underscore.`
        : 'Remove this key or move it inside "_metadata" — the RPC ignores unknown parameters.',
    }));

  const valid = fields.every((f) => f.status === 'ok' || f.status === 'omitted') && extras.length === 0;
  return { rpc, valid, fields, extras, suggestedPayload: suggested };
}
