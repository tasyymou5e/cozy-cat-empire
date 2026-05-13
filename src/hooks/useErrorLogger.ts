import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('ErrorLogger');

interface ErrorLogData {
  error_type: string;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

let isInitialized = false;

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_ERRORS_PER_WINDOW = 10;
const errorTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  while (errorTimestamps.length > 0 && errorTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    errorTimestamps.shift();
  }
  if (errorTimestamps.length >= MAX_ERRORS_PER_WINDOW) {
    log.warn('Rate limit exceeded, skipping log');
    return true;
  }
  errorTimestamps.push(now);
  return false;
}

export function useErrorLogger() {
  const { user } = useAuth();
  const { toast } = useToast();

  const logError = useCallback(
    async (data: ErrorLogData) => {
      if (isRateLimited()) return;

      try {
        const metadata = {
          ...data.metadata,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          viewport: { width: window.innerWidth, height: window.innerHeight },
        };

        log.error({ error_type: data.error_type, error_message: data.error_message, ...metadata });

        // Route through SECURITY DEFINER RPC so unauthenticated client errors
        // still get captured while direct INSERT on error_logs requires auth.
        const { error } = await supabase.rpc('log_client_error_secure', {
          _error_type: data.error_type,
          _error_message: data.error_message.slice(0, 5000),
          _error_stack: data.error_stack?.slice(0, 10000) ?? null,
          _component_name: data.component_name ?? null,
          _route: data.route || window.location.pathname,
          _user_agent: navigator.userAgent,
          _metadata: metadata as never,
        });
        if (error) log.error('Failed to save error log:', error);
      } catch (e) {
        log.error('Logging failed:', e);
      }
    },
    [user?.id]
  );

  const logInteractionError = useCallback(
    (eventType: string, target: string, error: Error) => {
      logError({
        error_type: 'interaction_error', error_message: error.message, error_stack: error.stack,
        metadata: { eventType, target, errorName: error.name },
      });
    },
    [logError]
  );

  const logNetworkError = useCallback(
    (url: string, status: number, statusText: string, method: string) => {
      logError({
        error_type: 'network_error',
        error_message: `${method} ${url} failed with ${status} ${statusText}`,
        metadata: { url, status, statusText, method },
      });
    },
    [logError]
  );

  const logComponentError = useCallback(
    (componentName: string, error: Error, errorInfo?: { componentStack?: string }) => {
      logError({
        error_type: 'component_error', error_message: error.message, error_stack: error.stack,
        component_name: componentName, metadata: { errorName: error.name, componentStack: errorInfo?.componentStack },
      });
    },
    [logError]
  );

  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

    const handleGlobalError = (event: ErrorEvent) => {
      logError({
        error_type: 'uncaught_error', error_message: event.message, error_stack: event.error?.stack,
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      logError({
        error_type: 'unhandled_promise_rejection', error_message: error?.message || String(error),
        error_stack: error?.stack, metadata: { errorName: error?.name },
      });
    };

    const handleClickError = (event: MouseEvent) => {
      const target = event.target as Element;
      let className = '';
      if (target.className) {
        if (typeof target.className === 'string') className = target.className;
        else if ('baseVal' in target.className) className = (target.className as SVGAnimatedString).baseVal || '';
      }
      const targetInfo = target.tagName + (target.id ? `#${target.id}` : '') + (className ? `.${className.split(' ')[0]}` : '');
      (window as unknown as Record<string, unknown>).__lastClick = {
        target: targetInfo, timestamp: Date.now(), x: event.clientX, y: event.clientY,
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

  const logCriticalError = useCallback(
    (error: Error, context: string) => {
      logError({ error_type: 'critical_error', error_message: error.message, error_stack: error.stack, metadata: { context } });
      toast({ title: 'An error occurred', description: 'Our team has been notified. Please try again.', variant: 'destructive' });
    },
    [logError, toast]
  );

  return { logError, logInteractionError, logNetworkError, logComponentError, logCriticalError };
}

export async function logErrorToDatabase(data: ErrorLogData & { user_id?: string }) {
  if (isRateLimited()) return;
  try {
    const metadata = { ...data.metadata, timestamp: new Date().toISOString() };
    await supabase.rpc('log_client_error_secure', {
      _error_type: data.error_type,
      _error_message: data.error_message.slice(0, 5000),
      _error_stack: data.error_stack?.slice(0, 10000) ?? null,
      _component_name: data.component_name ?? null,
      _route: data.route || (typeof window !== 'undefined' ? window.location.pathname : ''),
      _user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      _metadata: metadata as never,
    });
  } catch (e) {
    log.error('Standalone logging failed:', e);
  }
}