import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Error log data structure for database storage
 */
interface ErrorLogData {
  error_type: string;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

/** Singleton to prevent duplicate logging across re-renders */
let isInitialized = false;

/** Rate limiting configuration */
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_ERRORS_PER_WINDOW = 10; // Max 10 errors per minute
const errorTimestamps: number[] = [];

/**
 * Check if error logging is rate limited
 * Prevents spam attacks by limiting errors logged per time window
 */
function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps outside the window
  while (errorTimestamps.length > 0 && errorTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    errorTimestamps.shift();
  }
  // Check if we've exceeded the limit
  if (errorTimestamps.length >= MAX_ERRORS_PER_WINDOW) {
    console.warn('[ErrorLogger] Rate limit exceeded, skipping log');
    return true;
  }
  // Add current timestamp
  errorTimestamps.push(now);
  return false;
}

/**
 * Hook for comprehensive error logging and tracking
 *
 * Captures and logs errors to the database including uncaught exceptions,
 * unhandled promise rejections, component errors, and network failures.
 * Automatically sets up global error handlers on mount.
 *
 * @returns Error logging functions for different error types
 *
 * @example
 * ```tsx
 * const { logError, logComponentError, logNetworkError } = useErrorLogger();
 *
 * // Log a generic error
 * logError({
 *   error_type: 'validation_error',
 *   error_message: 'Invalid input',
 *   metadata: { field: 'email' }
 * });
 *
 * // Log a component error in error boundary
 * logComponentError('MyComponent', error, errorInfo);
 *
 * // Log a network error
 * logNetworkError('/api/cats', 500, 'Internal Server Error', 'GET');
 * ```
 */
export function useErrorLogger() {
  const { user } = useAuth();

  const logError = useCallback(async (data: ErrorLogData) => {
    // Check rate limit first
    if (isRateLimited()) {
      return;
    }

    try {
      const logEntry = {
        user_id: user?.id || null,
        error_type: data.error_type,
        error_message: data.error_message.slice(0, 5000), // Limit message length
        error_stack: data.error_stack?.slice(0, 10000) || null,
        component_name: data.component_name || null,
        route: data.route || window.location.pathname,
        user_agent: navigator.userAgent,
        metadata: {
          ...data.metadata,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      // Log to console in development
      console.error('[ErrorLogger]', logEntry);

      // Insert into database
      const { error } = await supabase
        .from('error_logs')
        .insert([logEntry]);

      if (error) {
        console.error('[ErrorLogger] Failed to save error log:', error);
      }
    } catch (e) {
      // Silently fail to avoid infinite loops
      console.error('[ErrorLogger] Logging failed:', e);
    }
  }, [user?.id]);

  const logInteractionError = useCallback((
    eventType: string,
    target: string,
    error: Error
  ) => {
    logError({
      error_type: 'interaction_error',
      error_message: error.message,
      error_stack: error.stack,
      metadata: {
        eventType,
        target,
        errorName: error.name
      }
    });
  }, [logError]);

  const logNetworkError = useCallback((
    url: string,
    status: number,
    statusText: string,
    method: string
  ) => {
    logError({
      error_type: 'network_error',
      error_message: `${method} ${url} failed with ${status} ${statusText}`,
      metadata: {
        url,
        status,
        statusText,
        method
      }
    });
  }, [logError]);

  const logComponentError = useCallback((
    componentName: string,
    error: Error,
    errorInfo?: { componentStack?: string }
  ) => {
    logError({
      error_type: 'component_error',
      error_message: error.message,
      error_stack: error.stack,
      component_name: componentName,
      metadata: {
        errorName: error.name,
        componentStack: errorInfo?.componentStack
      }
    });
  }, [logError]);

  // Set up global error handlers
  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      logError({
        error_type: 'uncaught_error',
        error_message: event.message,
        error_stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      logError({
        error_type: 'unhandled_promise_rejection',
        error_message: error?.message || String(error),
        error_stack: error?.stack,
        metadata: {
          errorName: error?.name
        }
      });
    };

    // Click error handler (wrap all clicks)
    const handleClickError = (event: MouseEvent) => {
      const target = event.target as Element;
      // Handle both regular className (string) and SVGAnimatedString
      let className = '';
      if (target.className) {
        if (typeof target.className === 'string') {
          className = target.className;
        } else if ('baseVal' in target.className) {
          className = (target.className as SVGAnimatedString).baseVal || '';
        }
      }
      const targetInfo = target.tagName + (target.id ? `#${target.id}` : '') + (className ? `.${className.split(' ')[0]}` : '');
      
      // Store click info for potential error correlation
      (window as unknown as Record<string, unknown>).__lastClick = {
        target: targetInfo,
        timestamp: Date.now(),
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY
      };
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('click', handleClickError, true);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('click', handleClickError, true);
      isInitialized = false;
    };
  }, [logError]);

  return {
    logError,
    logInteractionError,
    logNetworkError,
    logComponentError
  };
}

/**
 * Standalone function for logging errors outside React components
 *
 * Use this in edge functions, utility files, or anywhere React hooks
 * are not available.
 *
 * @param data - Error data including optional user_id
 *
 * @example
 * ```ts
 * await logErrorToDatabase({
 *   error_type: 'edge_function_error',
 *   error_message: 'Processing failed',
 *   user_id: userId
 * });
 * ```
 */
export async function logErrorToDatabase(data: ErrorLogData & { user_id?: string }) {
  // Check rate limit first
  if (isRateLimited()) {
    return;
  }

  try {
    const logEntry = {
      user_id: data.user_id || null,
      error_type: data.error_type,
      error_message: data.error_message.slice(0, 5000),
      error_stack: data.error_stack?.slice(0, 10000) || null,
      component_name: data.component_name || null,
      route: data.route || (typeof window !== 'undefined' ? window.location.pathname : ''),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString()
      }
    };

    await supabase.from('error_logs').insert([logEntry]);
  } catch (e) {
    console.error('[ErrorLogger] Standalone logging failed:', e);
  }
}
