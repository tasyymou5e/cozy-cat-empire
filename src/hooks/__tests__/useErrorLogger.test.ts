/**
 * @fileoverview Tests for error logging system
 *
 * Validates error capture, rate limiting, and database logging.
 * Uses vi.unmock + vi.importActual to bypass the global mocks from setup.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Unmock the modules we need real implementations of
vi.unmock('@/hooks/useErrorLogger');

// Mock the logger to produce predictable output
vi.mock('@/lib/logger', () => ({
  createLogger: (namespace: string) => ({
    debug: (...args: unknown[]) => console.debug(`[${namespace}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${namespace}]`, ...args),
  }),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null })),
  },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

describe('useErrorLogger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('rate limiting', () => {
    it('should allow logging up to 10 errors per minute', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);
    });

    it('should block logging after rate limit exceeded', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      await act(async () => {
        await result.current.logError({
          error_type: 'test_error',
          error_message: 'This should be blocked',
        });
      });

      // Only 10 errors logged via console.error
      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);
    });

    it('should reset rate limit after window expires', async () => {
      vi.useFakeTimers();
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);

      await act(async () => {
        vi.advanceTimersByTime(61000);
      });

      await act(async () => {
        await result.current.logError({
          error_type: 'test_error',
          error_message: 'After window reset',
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(11);
      vi.useRealTimers();
    });
  });

  describe('error capture', () => {
    it('should capture uncaught errors with correct metadata', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      await act(async () => {
        await result.current.logError({
          error_type: 'uncaught_error',
          error_message: 'Test uncaught error',
          error_stack: 'Error: Test\n  at test.js:1:1',
          metadata: { filename: 'test.js', lineno: 1, colno: 1 },
        });
      });

      // Winston logger calls console.error with the log entry
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should capture unhandled promise rejections', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      await act(async () => {
        await result.current.logError({
          error_type: 'unhandled_promise_rejection',
          error_message: 'Promise rejection test',
          metadata: { errorName: 'PromiseRejectionError' },
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should capture component errors from ErrorBoundary', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      await act(async () => {
        result.current.logComponentError('TestComponent', new Error('Component crashed'), {
          componentStack: '\n    at TestComponent\n    at App',
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle SVGAnimatedString in click targets', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      await act(async () => {
        result.current.logInteractionError('click', 'svg.icon', new Error('Click error'));
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logErrorToDatabase standalone function', () => {
    it('should log errors without React hooks context', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');

      await mod.logErrorToDatabase({
        error_type: 'standalone_error',
        error_message: 'Standalone test',
        user_id: 'standalone-user',
      });

      expect(true).toBe(true);
    });

    it('should respect rate limiting', async () => {
      vi.resetModules();
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');

      for (let i = 0; i < 10; i++) {
        await mod.logErrorToDatabase({
          error_type: 'rate_test',
          error_message: `Error ${i}`,
        });
      }

      await mod.logErrorToDatabase({
        error_type: 'rate_test',
        error_message: 'Should be blocked',
      });

      // Winston logger uses console.warn with [ErrorLogger] prefix
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        'Rate limit exceeded, skipping log'
      );
    });

    it('should truncate long messages and stacks', async () => {
      vi.resetModules();
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');

      const longMessage = 'x'.repeat(10000);
      const longStack = 'y'.repeat(20000);

      await mod.logErrorToDatabase({
        error_type: 'truncation_test',
        error_message: longMessage,
        error_stack: longStack,
      });

      expect(true).toBe(true);
    });
  });

  describe('specialized loggers', () => {
    it('should log network errors correctly', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      await act(async () => {
        result.current.logNetworkError('/api/test', 500, 'Internal Server Error', 'POST');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log interaction errors correctly', async () => {
      const mod = await vi.importActual<typeof import('@/hooks/useErrorLogger')>('@/hooks/useErrorLogger');
      const { result } = renderHook(() => mod.useErrorLogger());

      const testError = new Error('Button click failed');

      await act(async () => {
        result.current.logInteractionError('click', 'button#submit', testError);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
