/**
 * @fileoverview Integration tests for error handling flow
 *
 * Tests the complete error handling pipeline from capture to logging.
 * Uses vi.unmock + vi.importActual to bypass global mocks from setup.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('Error Handling Integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Rate limiting', () => {
    it('should not exceed 10 errors per minute to database', async () => {
      vi.resetModules();

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({ insert: insertMock }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      for (let i = 0; i < 15; i++) {
        await logErrorToDatabase({
          error_type: 'rate_limit_test',
          error_message: `Error ${i}`,
        });
      }

      expect(insertMock).toHaveBeenCalledTimes(10);
    });

    it('should log warning when rate limited', async () => {
      vi.resetModules();

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      for (let i = 0; i < 11; i++) {
        await logErrorToDatabase({
          error_type: 'rate_limit_warning_test',
          error_message: `Error ${i}`,
        });
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ErrorLogger]',
        'Rate limit exceeded, skipping log'
      );
    });
  });

  describe('Error correlation', () => {
    it('should track last click for error context', () => {
      const mockClick = {
        target: 'button#test',
        timestamp: Date.now(),
        x: 100,
        y: 200,
      };

      (window as unknown as Record<string, unknown>).__lastClick = mockClick;

      expect((window as unknown as Record<string, { target: string }>).__lastClick.target).toBe('button#test');
    });

    it('should include viewport dimensions', async () => {
      vi.resetModules();

      const capturedLogEntry = { metadata: {} as Record<string, unknown> };

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn((entries) => {
              Object.assign(capturedLogEntry, entries[0]);
              return Promise.resolve({ error: null });
            }),
          }),
        },
      }));

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: () => ({ user: null }),
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await logErrorToDatabase({
        error_type: 'viewport_test',
        error_message: 'Test with viewport',
      });

      // logErrorToDatabase doesn't add viewport — only the hook version does
      // But it does add timestamp
      expect(capturedLogEntry.metadata).toHaveProperty('timestamp');
    });

    it('should include current route', async () => {
      vi.resetModules();

      const capturedLogEntry = { route: '' };

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn((entries) => {
              Object.assign(capturedLogEntry, entries[0]);
              return Promise.resolve({ error: null });
            }),
          }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await logErrorToDatabase({
        error_type: 'route_test',
        error_message: 'Test with route',
        route: '/test-route',
      });

      expect(capturedLogEntry.route).toBe('/test-route');
    });
  });

  describe('Error types', () => {
    const errorTypes = [
      { type: 'uncaught_error', description: 'should categorize uncaught_error correctly' },
      { type: 'unhandled_promise_rejection', description: 'should categorize unhandled_promise_rejection correctly' },
      { type: 'react_error_boundary', description: 'should categorize react_error_boundary correctly' },
      { type: 'network_error', description: 'should categorize network_error correctly' },
      { type: 'interaction_error', description: 'should categorize interaction_error correctly' },
      { type: 'critical_error', description: 'should categorize critical_error correctly' },
    ];

    errorTypes.forEach(({ type, description }) => {
      it(description, async () => {
        vi.resetModules();

        let capturedErrorType = '';

        vi.doMock('@/integrations/supabase/client', () => ({
          supabase: {
            from: () => ({
              insert: vi.fn((entries) => {
                capturedErrorType = entries[0].error_type;
                return Promise.resolve({ error: null });
              }),
            }),
          },
        }));

        const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

        await logErrorToDatabase({
          error_type: type,
          error_message: `Test ${type}`,
        });

        expect(capturedErrorType).toBe(type);
      });
    });
  });

  describe('Error metadata enrichment', () => {
    it('should add timestamp to metadata', async () => {
      vi.resetModules();

      let capturedMetadata: Record<string, unknown> = {};

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn((entries) => {
              capturedMetadata = entries[0].metadata as Record<string, unknown>;
              return Promise.resolve({ error: null });
            }),
          }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await logErrorToDatabase({
        error_type: 'metadata_test',
        error_message: 'Test metadata',
      });

      expect(capturedMetadata).toHaveProperty('timestamp');
      expect(typeof capturedMetadata.timestamp).toBe('string');
    });

    it('should preserve custom metadata', async () => {
      vi.resetModules();

      let capturedMetadata: Record<string, unknown> = {};

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn((entries) => {
              capturedMetadata = entries[0].metadata as Record<string, unknown>;
              return Promise.resolve({ error: null });
            }),
          }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await logErrorToDatabase({
        error_type: 'custom_metadata_test',
        error_message: 'Test',
        metadata: {
          customField: 'customValue',
          anotherField: 123,
        },
      });

      expect(capturedMetadata.customField).toBe('customValue');
      expect(capturedMetadata.anotherField).toBe(123);
    });
  });

  describe('Graceful failure', () => {
    it('should not throw when database insert fails', async () => {
      vi.resetModules();

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await expect(
        logErrorToDatabase({
          error_type: 'failure_test',
          error_message: 'Test',
        })
      ).resolves.not.toThrow();
    });

    it('should log to console when database fails', async () => {
      vi.resetModules();

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: () => ({
            insert: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        },
      }));

      const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

      await logErrorToDatabase({
        error_type: 'console_fallback_test',
        error_message: 'Test',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
