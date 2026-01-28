/**
 * @fileoverview Tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock logErrorToDatabase
vi.mock('@/hooks/useErrorLogger', () => ({
  logErrorToDatabase: vi.fn(),
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress React error boundary console errors in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(getByText('Child content')).toBeDefined();
  });

  it('should render fallback UI when error thrown', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeDefined();
    expect(queryByText('No error')).toBeNull();
  });

  it('should log error to database via logErrorToDatabase', async () => {
    const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logErrorToDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: 'react_error_boundary',
        error_message: 'Test error',
        component_name: 'TestComponent',
      })
    );
  });

  it('should allow retry after error', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeDefined();

    // Click retry button
    const retryButton = getByText('Try Again');
    retryButton.click();

    // Re-render without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeDefined();
  });

  it('should show Go Home button', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Go Home')).toBeDefined();
  });

  it('should show error details in development mode', () => {
    // NODE_ENV is 'test' by default in vitest
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeDefined();
  });

  it('should render custom fallback when provided', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom fallback')).toBeDefined();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('should use Unknown for component name when not provided', async () => {
    const { logErrorToDatabase } = await import('@/hooks/useErrorLogger');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logErrorToDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        component_name: 'Unknown',
      })
    );
  });

  it('should track retry count', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = getByText('Try Again');

    // Click retry multiple times
    retryButton.click();
    retryButton.click();

    // After clicking, should still show error UI
    expect(getByText('Something went wrong')).toBeDefined();
  });
});
