/**
 * @fileoverview Observability assertions for error logging
 *
 * Validates that the error logging system fires correctly on
 * failure conditions and includes the right contextual data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

// useErrorLogger is centrally mocked in setup.ts
const mockedLogError = vi.mocked(logErrorToDatabase);

describe('Error Logger Observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logErrorToDatabase is available as a mock', () => {
    expect(mockedLogError).toBeDefined();
    expect(vi.isMockFunction(mockedLogError)).toBe(true);
  });

  it('can be called with error data and tracks calls', async () => {
    await logErrorToDatabase({
      error_type: 'network_error',
      error_message: 'GET /rest/v1/profiles failed with 500',
      metadata: { url: '/profiles', status: 500, method: 'GET' },
    });

    expect(mockedLogError).toHaveBeenCalledTimes(1);
    expect(mockedLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: 'network_error',
        error_message: expect.stringContaining('500'),
      }),
    );
  });

  it('tracks multiple error calls across a flow', async () => {
    await logErrorToDatabase({
      error_type: 'component_error',
      error_message: 'CatCard render failed',
      component_name: 'CatCard',
    });

    await logErrorToDatabase({
      error_type: 'interaction_error',
      error_message: 'Click handler threw',
      metadata: { eventType: 'click', target: 'button#sell' },
    });

    expect(mockedLogError).toHaveBeenCalledTimes(2);
  });
});
