/**
 * @fileoverview Environment-aware logger utility
 *
 * Now delegates to the Winston-inspired structured logger for
 * persistent logging to the application_logs table while maintaining
 * the same simple API used across the codebase.
 *
 * @module lib/logger
 */

import { createWinstonLogger } from '@/lib/winston-logger';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  /** Debug-level log — silenced in production */
  debug: (...args: unknown[]) => void;
  /** Info-level log — silenced in production */
  info: (...args: unknown[]) => void;
  /** Warning-level log — always shown */
  warn: (...args: unknown[]) => void;
  /** Error-level log — always shown */
  error: (...args: unknown[]) => void;
}

/**
 * Convert variadic log args into Winston's (message, meta) format.
 */
function argsToMeta(args: unknown[]): { message: string; meta?: Record<string, unknown> } {
  if (args.length === 0) return { message: '' };

  const message = String(args[0]);

  if (args.length === 1) return { message };

  // If second arg is an object, use as metadata
  if (args.length === 2 && typeof args[1] === 'object' && args[1] !== null && !(args[1] instanceof Error)) {
    return { message, meta: args[1] as Record<string, unknown> };
  }

  // For errors or multiple args, serialize into metadata
  const extra: Record<string, unknown> = {};
  args.slice(1).forEach((arg, i) => {
    if (arg instanceof Error) {
      extra.error = arg.message;
      extra.stackTrace = arg.stack;
    } else if (typeof arg === 'object' && arg !== null) {
      Object.assign(extra, arg);
    } else {
      extra[`arg${i}`] = arg;
    }
  });

  return { message, meta: Object.keys(extra).length > 0 ? extra : undefined };
}

/**
 * Create a namespaced logger instance backed by Winston.
 *
 * @param namespace - Prefix for all log messages (e.g., 'CloudSync', 'PortraitReconciliation')
 * @returns Logger with debug/info/warn/error methods
 *
 * @example
 * ```ts
 * const log = createLogger('CloudSync');
 * log.debug('Starting sync...'); // Only in dev
 * log.error('Sync failed:', error); // Always shown + persisted to DB
 * ```
 */
export function createLogger(namespace: string): Logger {
  const winston = createWinstonLogger({ label: namespace });

  const makeMethod = (level: LogLevel) => (...args: unknown[]) => {
    const { message, meta } = argsToMeta(args);
    winston[level](message, meta as any);
  };

  return {
    debug: makeMethod('debug'),
    info: makeMethod('info'),
    warn: makeMethod('warn'),
    error: makeMethod('error'),
  };
}

/**
 * Default logger without a namespace prefix.
 * Use createLogger() for component/hook-specific loggers.
 */
export const logger: Logger = createLogger('app');
