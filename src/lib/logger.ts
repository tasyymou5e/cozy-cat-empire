/**
 * @fileoverview Environment-aware logger utility
 *
 * Provides structured logging that silences debug/info logs in production
 * while preserving warn/error output. Use instead of raw console.log.
 *
 * @module lib/logger
 */

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

const isDev = import.meta.env.DEV;

const noop = () => {};

/**
 * Create a namespaced logger instance.
 *
 * @param namespace - Prefix for all log messages (e.g., 'CloudSync', 'PortraitReconciliation')
 * @returns Logger with debug/info/warn/error methods
 *
 * @example
 * ```ts
 * const log = createLogger('CloudSync');
 * log.debug('Starting sync...'); // Only in dev
 * log.error('Sync failed:', error); // Always shown
 * ```
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;

  return {
    debug: isDev ? (...args: unknown[]) => console.log(prefix, ...args) : noop,
    info: isDev ? (...args: unknown[]) => console.info(prefix, ...args) : noop,
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}

/**
 * Default logger without a namespace prefix.
 * Use createLogger() for component/hook-specific loggers.
 */
export const logger: Logger = {
  debug: isDev ? console.log.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};
