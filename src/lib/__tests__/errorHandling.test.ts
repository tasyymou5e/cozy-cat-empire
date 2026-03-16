import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useErrorLogger', () => ({
  logErrorToDatabase: vi.fn().mockResolvedValue(undefined),
}));

import {
  handleAsyncError,
  successResult,
  errorResult,
  withErrorHandling,
  fireAndForget,
} from '../errorHandling';

describe('errorHandling utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleAsyncError', () => {
    it('returns standardized error result with default message', () => {
      const result = handleAsyncError(new Error('db fail'), {
        source: 'useTest',
        operation: 'fetch',
      }, 'Something went wrong');

      expect(result).toEqual({ success: false, error: 'Something went wrong' });
    });

    it('handles non-Error objects', () => {
      const result = handleAsyncError('string error', {
        source: 'useTest',
        operation: 'save',
      }, 'Default msg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Default msg');
    });

    it('logs to console', () => {
      handleAsyncError(new Error('test'), {
        source: 'useHook',
        operation: 'op',
      }, 'msg');

      expect(console.error).toHaveBeenCalledWith(
        '[useHook] op failed:',
        expect.any(Error)
      );
    });
  });

  describe('successResult', () => {
    it('returns success with data', () => {
      expect(successResult({ id: '1' })).toEqual({
        success: true,
        data: { id: '1' },
      });
    });

    it('returns success without data', () => {
      expect(successResult()).toEqual({ success: true });
    });
  });

  describe('errorResult', () => {
    it('returns error result', () => {
      expect(errorResult('Not found')).toEqual({
        success: false,
        error: 'Not found',
      });
    });
  });

  describe('withErrorHandling', () => {
    it('wraps successful operations', async () => {
      const result = await withErrorHandling(
        async () => 42,
        { source: 'test', operation: 'compute' },
        'Failed'
      );

      expect(result).toEqual({ success: true, data: 42 });
    });

    it('catches and wraps errors', async () => {
      const result = await withErrorHandling(
        async () => { throw new Error('boom'); },
        { source: 'test', operation: 'compute' },
        'Computation failed'
      );

      expect(result).toEqual({ success: false, error: 'Computation failed' });
    });
  });

  describe('fireAndForget', () => {
    it('does not throw on success', () => {
      expect(() => fireAndForget(async () => {})).not.toThrow();
    });

    it('swallows errors silently', () => {
      expect(() =>
        fireAndForget(async () => { throw new Error('ignored'); })
      ).not.toThrow();
    });
  });
});
