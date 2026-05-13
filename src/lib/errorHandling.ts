/**
 * @fileoverview Standardized error handling utilities for hooks
 *
 * Provides consistent error handling patterns across the codebase.
 * Centralizes error logging, user notifications, and error result types.
 *
 * @module lib/errorHandling
 */

import { logErrorToDatabase } from '@/hooks/useErrorLogger';

import { createLogger } from '@/lib/logger';

const logger = createLogger('errorHandling');

/**
 * Standard result type for async operations
 */
export interface OperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  /** Hook or function name where error occurred */
  source: string;
  /** Specific operation that failed (e.g., 'fetchFriends', 'acceptTrade') */
  operation: string;
  /** User ID if available */
  userId?: string;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
}

/**
 * Standard error handler for async operations in hooks
 *
 * Logs the error to console, database (if user is logged in),
 * and returns a standardized error result.
 *
 * @param error - The caught error
 * @param context - Context about where the error occurred
 * @param defaultMessage - User-friendly fallback message
 * @returns Standardized error result object
 *
 * @example
 * ```ts
 * try {
 *   const { data, error } = await supabase.from('cats').select();
 *   if (error) throw error;
 *   return { success: true, data };
 * } catch (err) {
 *   return handleAsyncError(err, {
 *     source: 'useCats',
 *     operation: 'fetchCats',
 *     userId
 *   }, 'Failed to fetch cats');
 * }
 * ```
 */
export function handleAsyncError(
  error: unknown,
  context: ErrorContext,
  defaultMessage: string
): OperationResult<never> {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log to console in development
  logger.error(`[${context.source}] ${context.operation} failed:`, error);

  // Log to database (non-blocking, defensive against sync/non-promise mocks)
  try {
    const result = logErrorToDatabase({
      error_type: 'hook_error',
      error_message: errorMessage,
      error_stack: errorStack,
      component_name: context.source,
      user_id: context.userId,
      metadata: {
        operation: context.operation,
        ...context.metadata,
      },
    });
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(() => {
        // Silently fail if database logging fails
      });
    }
  } catch {
    // Silently fail if logger throws synchronously
  }

  return {
    success: false,
    error: defaultMessage,
  };
}

/**
 * Creates a success result with optional data
 *
 * @param data - Optional data to include in result
 * @returns Success result object
 *
 * @example
 * ```ts
 * return successResult({ id: '123', name: 'Test' });
 * // { success: true, data: { id: '123', name: 'Test' } }
 * ```
 */
export function successResult<T>(data?: T): OperationResult<T> {
  return data !== undefined ? { success: true, data } : ({ success: true } as OperationResult<T>);
}

/**
 * Creates an error result with message
 *
 * @param error - Error message
 * @returns Error result object
 *
 * @example
 * ```ts
 * return errorResult('User not found');
 * // { success: false, error: 'User not found' }
 * ```
 */
export function errorResult(error: string): OperationResult<never> {
  return { success: false, error };
}

/**
 * Wraps an async operation with standardized error handling
 *
 * @param operation - Async function to execute
 * @param context - Error context for logging
 * @param defaultErrorMessage - Fallback error message
 * @returns Result of operation or error result
 *
 * @example
 * ```ts
 * const result = await withErrorHandling(
 *   async () => {
 *     const { data, error } = await supabase.from('cats').select();
 *     if (error) throw error;
 *     return data;
 *   },
 *   { source: 'useCats', operation: 'fetchCats', userId },
 *   'Failed to fetch cats'
 * );
 * ```
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  defaultErrorMessage: string
): Promise<OperationResult<T>> {
  try {
    const data = await operation();
    return successResult(data);
  } catch (error) {
    return handleAsyncError(error, context, defaultErrorMessage);
  }
}

/**
 * Safe wrapper for fire-and-forget operations (like activity logging)
 *
 * Executes the operation without blocking, swallowing any errors silently.
 * Useful for non-critical operations that shouldn't affect the main flow.
 *
 * @param operation - Async function to execute
 *
 * @example
 * ```ts
 * // Log activity without blocking the main flow
 * fireAndForget(() => logPlayerActivity(userId, activityData));
 * ```
 */
export function fireAndForget(operation: () => Promise<unknown>): void {
  operation().catch(() => {
    // Silently ignore - this is intentional for non-critical operations
  });
}
