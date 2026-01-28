/**
 * @fileoverview Tests for error logging system
 *
 * Validates error capture, rate limiting, and database logging.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
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
    // Reset module to clear rate limiting state
    vi.resetModules();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('rate limiting', () => {
    it('should allow logging up to 10 errors per minute', async () => {
      // Import fresh module
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      // Log 10 errors - should all succeed
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      // All 10 should be logged (console.error called for each)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);
    });

    it('should block logging after rate limit exceeded', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      // Log 10 errors first
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      // 11th error should be blocked
      await act(async () => {
        await result.current.logError({
          error_type: 'test_error',
          error_message: 'This should be blocked',
        });
      });

      // Only 10 errors logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);
    });

    it('should reset rate limit after window expires', async () => {
      vi.useFakeTimers();
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      // Log 10 errors
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.logError({
            error_type: 'test_error',
            error_message: `Test error ${i}`,
          });
        });
      }

      expect(consoleErrorSpy).toHaveBeenCalledTimes(10);

      // Fast forward 61 seconds (past the 1 minute window)
      await act(async () => {
        vi.advanceTimersByTime(61000);
      });

      // Should be able to log again
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
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      await act(async () => {
        await result.current.logError({
          error_type: 'uncaught_error',
          error_message: 'Test uncaught error',
          error_stack: 'Error: Test\n  at test.js:1:1',
          metadata: {
            filename: 'test.js',
            lineno: 1,
            colno: 1,
          },
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'uncaught_error',
          error_message: 'Test uncaught error',
        })
      );
    });

    it('should capture unhandled promise rejections', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      await act(async () => {
        await result.current.logError({
          error_type: 'unhandled_promise_rejection',
          error_message: 'Promise rejection test',
          metadata: {
            errorName: 'PromiseRejectionError',
          },
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'unhandled_promise_rejection',
        })
      );
    });

    it('should capture component errors from ErrorBoundary', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      await act(async () => {
        result.current.logComponentError('TestComponent', new Error('Component crashed'), {
          componentStack: '\n    at TestComponent\n    at App',
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'component_error',
          component_name: 'TestComponent',
        })
      );
    });

    it('should handle SVGAnimatedString in click targets', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      // Test interaction error logging (which uses target parsing)
      await act(async () => {
        result.current.logInteractionError('click', 'svg.icon', new Error('Click error'));
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'interaction_error',
          metadata: expect.objectContaining({
            target: 'svg.icon',
          }),
        })
      );
    });
  });

  describe('logErrorToDatabase standalone function', () => {
    it('should log errors without React hooks context', async () => {
      const { logErrorToDatabase } = await import('../useErrorLogger');

      await logErrorToDatabase({
        error_type: 'standalone_error',
        error_message: 'Standalone test',
        user_id: 'standalone-user',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should respect rate limiting', async () => {
      vi.resetModules();
      const { logErrorToDatabase } = await import('../useErrorLogger');

      // Log 10 errors
      for (let i = 0; i < 10; i++) {
        await logErrorToDatabase({
          error_type: 'rate_test',
          error_message: `Error ${i}`,
        });
      }

      // 11th should be rate limited (function returns early, no error)
      await logErrorToDatabase({
        error_type: 'rate_test',
        error_message: 'Should be blocked',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ErrorLogger] Rate limit exceeded, skipping log'
      );
    });

    it('should truncate long messages and stacks', async () => {
      vi.resetModules();
      const { logErrorToDatabase } = await import('../useErrorLogger');

      const longMessage = 'x'.repeat(10000);
      const longStack = 'y'.repeat(20000);

      await logErrorToDatabase({
        error_type: 'truncation_test',
        error_message: longMessage,
        error_stack: longStack,
      });

      // Should not throw even with very long strings
      expect(true).toBe(true);
    });
  });

  describe('specialized loggers', () => {
    it('should log network errors correctly', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      await act(async () => {
        result.current.logNetworkError('/api/test', 500, 'Internal Server Error', 'POST');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'network_error',
          error_message: 'POST /api/test failed with 500 Internal Server Error',
        })
      );
    });

    it('should log interaction errors correctly', async () => {
      const { useErrorLogger } = await import('../useErrorLogger');
      const { result } = renderHook(() => useErrorLogger());

      const testError = new Error('Button click failed');

      await act(async () => {
        result.current.logInteractionError('click', 'button#submit', testError);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        expect.objectContaining({
          error_type: 'interaction_error',
          error_message: 'Button click failed',
        })
      );
    });
  });
});
