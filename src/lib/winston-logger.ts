/**
 * @fileoverview Winston-inspired structured logger for browser and edge functions.
 *
 * Implements Winston's core concepts:
 * - Log levels: error(0), warn(1), info(2), http(3), verbose(4), debug(5), silly(6)
 * - Labels (equivalent to Winston's "service" metadata)
 * - Structured metadata
 * - Transport to Supabase (application_logs table)
 *
 * @see https://github.com/winstonjs/winston
 * @module lib/winston-logger
 */

import { supabase } from '@/integrations/supabase/client';

// Winston log levels (RFC 5424 inspired, same as Winston)
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

export type WinstonLogLevel = keyof typeof LOG_LEVELS;

export const LOG_LEVEL_COLORS: Record<WinstonLogLevel, string> = {
  error: '#ef4444',
  warn: '#f59e0b',
  info: '#3b82f6',
  http: '#8b5cf6',
  verbose: '#06b6d4',
  debug: '#10b981',
  silly: '#6b7280',
};

export const LOG_LEVEL_EMOJI: Record<WinstonLogLevel, string> = {
  error: '🔴',
  warn: '🟡',
  info: '🔵',
  http: '🟣',
  verbose: '🔷',
  debug: '🟢',
  silly: '⚪',
};

interface LogMeta {
  [key: string]: string | number | boolean | null | undefined | LogMeta | LogMeta[];
}

interface LogEntry {
  level: WinstonLogLevel;
  message: string;
  label?: string;
  metadata?: LogMeta;
  source?: 'client' | 'edge_function' | 'cron' | 'system';
  functionName?: string;
  durationMs?: number;
  requestId?: string;
  stackTrace?: string;
}

interface WinstonTransport {
  name: string;
  log: (entry: LogEntry) => void | Promise<void>;
}

interface WinstonLoggerOptions {
  level?: WinstonLogLevel;
  label?: string;
  source?: LogEntry['source'];
  transports?: WinstonTransport[];
  silent?: boolean;
}

// ─── Console Transport ───────────────────────────────────────

const consoleTransport: WinstonTransport = {
  name: 'console',
  log: (entry) => {
    const prefix = `${LOG_LEVEL_EMOJI[entry.level]} [${entry.label || 'app'}]`;
    const method =
      entry.level === 'error'
        ? 'error'
        : entry.level === 'warn'
          ? 'warn'
          : entry.level === 'debug' || entry.level === 'verbose' || entry.level === 'silly'
            ? 'debug'
            : 'info';

    const args: unknown[] = [prefix, entry.message];
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      args.push(entry.metadata);
    }
    if (entry.durationMs !== undefined) {
      args.push(`(${entry.durationMs}ms)`);
    }
    console[method](...args);
  },
};

// ─── Supabase Transport ──────────────────────────────────────

let logQueue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000; // Batch logs every 5 seconds
const MAX_QUEUE_SIZE = 50;

async function flushLogs() {
  if (logQueue.length === 0) return;

  const batch = logQueue.splice(0, MAX_QUEUE_SIZE);

  try {
    const rows = batch.map((entry) => ({
      level: entry.level,
      message: entry.message.slice(0, 5000),
      label: entry.label || null,
      metadata: (entry.metadata || {}) as import('@/integrations/supabase/types').Json,
      source: entry.source || 'client',
      function_name: entry.functionName || null,
      duration_ms: entry.durationMs || null,
      request_id: entry.requestId || null,
      stack_trace: entry.stackTrace?.slice(0, 10000) || null,
    }));

    const { error } = await supabase.from('application_logs').insert(rows);
    if (error) {
      // Don't recurse — just console.warn
      console.warn('[WinstonLogger] Failed to flush logs to DB:', error.message);
      // Put failed logs back (up to limit)
      if (logQueue.length < 200) {
        logQueue.unshift(...batch);
      }
    }
  } catch (err) {
    console.warn('[WinstonLogger] Transport error:', err);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushLogs();
  }, FLUSH_INTERVAL);
}

const supabaseTransport: WinstonTransport = {
  name: 'supabase',
  log: (entry) => {
    logQueue.push(entry);
    if (logQueue.length >= MAX_QUEUE_SIZE) {
      flushLogs();
    } else {
      scheduleFlush();
    }
  },
};

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (logQueue.length > 0) {
      // Use sendBeacon-style sync flush
      const rows = logQueue.splice(0).map((entry) => ({
        level: entry.level,
        message: entry.message.slice(0, 5000),
        label: entry.label || null,
        metadata: entry.metadata || {},
        source: entry.source || 'client',
        function_name: entry.functionName || null,
        duration_ms: entry.durationMs || null,
        request_id: entry.requestId || null,
        stack_trace: entry.stackTrace?.slice(0, 10000) || null,
      }));

      // Best-effort send
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/application_logs`,
        new Blob(
          [JSON.stringify(rows)],
          { type: 'application/json' }
        )
      );
    }
  });
}

// ─── Winston Logger Class ────────────────────────────────────

class WinstonLogger {
  private level: WinstonLogLevel;
  private label: string;
  private source: LogEntry['source'];
  private transports: WinstonTransport[];
  private silent: boolean;

  constructor(options: WinstonLoggerOptions = {}) {
    this.level = options.level ?? (import.meta.env.DEV ? 'debug' : 'info');
    this.label = options.label ?? 'app';
    this.source = options.source ?? 'client';
    this.transports = options.transports ?? [consoleTransport, supabaseTransport];
    this.silent = options.silent ?? false;
  }

  private shouldLog(level: WinstonLogLevel): boolean {
    return !this.silent && LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  private log(level: WinstonLogLevel, message: string, meta?: LogMeta) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      label: this.label,
      source: this.source,
      metadata: meta,
      durationMs: meta?.durationMs as number | undefined,
      requestId: meta?.requestId as string | undefined,
      functionName: meta?.functionName as string | undefined,
      stackTrace: meta?.stackTrace as string | undefined,
    };

    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch {
        // Silently skip failed transports
      }
    }
  }

  error(message: string, meta?: LogMeta) {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: LogMeta) {
    this.log('info', message, meta);
  }

  http(message: string, meta?: LogMeta) {
    this.log('http', message, meta);
  }

  verbose(message: string, meta?: LogMeta) {
    this.log('verbose', message, meta);
  }

  debug(message: string, meta?: LogMeta) {
    this.log('debug', message, meta);
  }

  silly(message: string, meta?: LogMeta) {
    this.log('silly', message, meta);
  }

  /**
   * Create a child logger with a different label (Winston's child() pattern)
   */
  child(options: Partial<WinstonLoggerOptions>): WinstonLogger {
    return new WinstonLogger({
      level: options.level ?? this.level,
      label: options.label ?? this.label,
      source: options.source ?? this.source,
      transports: options.transports ?? this.transports,
      silent: options.silent ?? this.silent,
    });
  }

  /**
   * Timer utility — returns a function that logs elapsed time
   * Inspired by Winston's profiling feature
   */
  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const durationMs = Math.round(performance.now() - start);
      this.info(`${label} completed`, { durationMs });
    };
  }

  /** Force flush all queued logs */
  async flush(): Promise<void> {
    await flushLogs();
  }
}

// ─── Exports ─────────────────────────────────────────────────

/**
 * Create a Winston-style logger with a specific label.
 *
 * @example
 * ```ts
 * const log = createWinstonLogger({ label: 'CloudSync' });
 * log.info('Sync started');
 * log.error('Sync failed', { error: err.message });
 * 
 * // Timer
 * const done = log.startTimer('Save operation');
 * await saveToDB();
 * done(); // Logs: "Save operation completed (123ms)"
 * ```
 */
export function createWinstonLogger(options?: WinstonLoggerOptions): WinstonLogger {
  return new WinstonLogger(options);
}

/** Default application logger */
export const winstonLogger = createWinstonLogger({ label: 'CatFarm' });

/** Console-only logger (no DB writes) — for hot paths */
export const consoleOnlyLogger = createWinstonLogger({
  label: 'CatFarm',
  transports: [consoleTransport],
});
