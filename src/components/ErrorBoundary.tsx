import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log the error to database
    logErrorToDatabase({
      error_type: 'react_error_boundary',
      error_message: error.message,
      error_stack: error.stack,
      component_name: this.props.componentName || 'Unknown',
      route: window.location.pathname,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
      },
    });

    // Also log to console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Checks if the error is a chunk/module loading error
   */
  isChunkLoadError = (error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message || '';
    const name = error.name || '';
    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError') ||
      message.includes('Loading CSS chunk') ||
      name === 'ChunkLoadError' ||
      message.includes('Unable to preload CSS') ||
      message.includes('error loading dynamically imported module')
    );
  };

  /**
   * Clears all caches and reloads the page
   */
  clearCachesAndReload = async () => {
    // Clear service worker caches
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        console.log('[ErrorBoundary] Caches cleared');
      } catch (e) {
        console.warn('[ErrorBoundary] Failed to clear caches:', e);
      }
    }

    // Try to update service worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
        }
      } catch (e) {
        console.warn('[ErrorBoundary] Failed to update service worker:', e);
      }
    }

    // Force reload
    window.location.reload();
  };

  handleRetry = () => {
    const error = this.state.error;

    // If this is a chunk load error, clear caches and reload
    if (this.isChunkLoadError(error)) {
      console.log('[ErrorBoundary] Chunk load error detected, clearing caches and reloading');
      this.clearCachesAndReload();
      return;
    }

    if (this.state.retryCount >= 3) {
      // After 3 retries, suggest a full page reload
      window.location.reload();
      return;
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                An unexpected error occurred. The error has been logged and we'll look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-muted p-3 rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                  <pre className="whitespace-pre-wrap break-words text-destructive">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap break-words mt-2 text-muted-foreground text-[10px]">
                      {this.state.error.stack}
                    </pre>
                  )}
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary
        componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
