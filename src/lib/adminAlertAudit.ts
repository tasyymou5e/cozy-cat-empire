/**
 * @fileoverview Persist the exact request/response of a *failed*
 * `send-admin-alert` edge function call so admins can inspect it on the
 * Telemetry page (same drilldown UI as rejected telemetry RPCs).
 *
 * Failures never leave a trace of their own (the function returns an error and
 * the toast disappears), so we write a structured `application_logs` row with
 * label `AdminAlert` carrying:
 *   - `request_json`: the exact body that was sent
 *   - `response_json`: the FunctionsHttpError body / message shape
 *
 * @module lib/adminAlertAudit
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('AdminAlert');

export const ADMIN_ALERT_LOG_LABEL = 'AdminAlert';

const MAX_JSON_CHARS = 4000;

function safeJson(value: unknown): string {
  try {
    const json = JSON.stringify(value, null, 2) ?? 'null';
    return json.length > MAX_JSON_CHARS
      ? `${json.slice(0, MAX_JSON_CHARS)}\n… truncated (${json.length} chars total)`
      : json;
  } catch {
    return '"<unserializable payload>"';
  }
}

interface AlertFailure {
  name?: string | null;
  message?: string | null;
  status?: number | null;
  context?: unknown;
  body?: unknown;
}

/** Normalise whatever `functions.invoke` threw into a serialisable shape. */
function normalise(error: unknown): AlertFailure {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const ctx = e.context as Record<string, unknown> | undefined;
    return {
      name: typeof e.name === 'string' ? e.name : null,
      message: typeof e.message === 'string' ? e.message : String(error),
      status:
        typeof e.status === 'number'
          ? e.status
          : ctx && typeof ctx.status === 'number'
            ? (ctx.status as number)
            : null,
      body: ctx && 'body' in ctx ? '<stream>' : undefined,
    };
  }
  return { message: String(error), status: null };
}

/**
 * Record a failed `send-admin-alert` invocation for admin drilldown.
 */
export function recordFailedAdminAlert(
  request: Record<string, unknown>,
  error: unknown,
): void {
  const normalised = normalise(error);
  const rawMessage = normalised.message ?? 'Unknown error';

  log.error('send-admin-alert failed', {
    admin_alert: true,
    function_name: 'send-admin-alert',
    http_status: normalised.status ?? 0,
    job_name: typeof request.job_name === 'string' ? request.job_name : null,
    is_test: request.is_test === true,
    request_json: safeJson(request),
    response_json: safeJson({
      name: normalised.name ?? null,
      status: normalised.status ?? null,
      message: rawMessage,
      body: normalised.body ?? null,
    }),
    raw_server_message: rawMessage,
  });
}
