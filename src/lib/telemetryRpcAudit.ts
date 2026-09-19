/**
 * @fileoverview Persist the exact request/response of a *rejected* secure
 * telemetry RPC call so admins can inspect the malformed payload.
 *
 * Rejected calls never reach `auth_attempts_log` / `error_logs` — the
 * SECURITY DEFINER functions `RAISE EXCEPTION` before inserting. Without this
 * audit trail there is nothing to drill into. We therefore write a structured
 * `application_logs` row (label `TelemetryRPC`) carrying:
 *   - `request`: the exact RPC params that were sent (JSON string, truncated)
 *   - `response`: the PostgREST error body shape plus the friendly mapping
 *
 * The raw server message is preserved verbatim.
 *
 * @module lib/telemetryRpcAudit
 */

import { createLogger } from '@/lib/logger';
import { mapTelemetryError } from '@/lib/telemetryErrorMessages';

const log = createLogger('TelemetryRPC');

export const TELEMETRY_RPC_LOG_LABEL = 'TelemetryRPC';

export type TelemetryRpcName =
  | 'log_auth_attempt_secure'
  | 'log_client_error_secure';

interface PostgrestLikeError {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
}

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

/**
 * Record a rejected telemetry RPC call for admin drilldown.
 */
export function recordRejectedTelemetryRpc(
  rpc: TelemetryRpcName,
  request: Record<string, unknown>,
  error: PostgrestLikeError,
): void {
  const mapped = mapTelemetryError(error);

  log.error(`${rpc} rejected the payload`, {
    telemetry_rpc: rpc,
    http_status: 400,
    request_json: safeJson(request),
    response_json: safeJson({
      code: error.code ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      message: error.message ?? null,
    }),
    raw_server_message: mapped.raw,
    friendly: mapped.friendly,
    category: mapped.category,
    category_label: mapped.categoryLabel,
    known: mapped.known,
  });
}
