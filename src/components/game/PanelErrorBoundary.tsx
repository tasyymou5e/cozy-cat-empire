import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

interface Props {
  children: ReactNode;
  panelName: string;
  fallbackHeight?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PanelErrorBoundary - Lightweight error boundary for game panels
 *
 * Catches errors in individual TabsContent panels to prevent
 * a single panel crash from taking down the entire game.
 *
 * @example
 * ```tsx
 * <PanelErrorBoundary panelName="BreedingPanel">
 *   <BreedingPanel {...props} />
 * </PanelErrorBoundary>
 * ```
 */
export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to database
    logErrorToDatabase({
      error_type: 'panel_error',
      error_message: error.message,
      error_stack: error.stack,
      component_name: this.props.panelName,
      route: window.location.pathname,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        panelName: this.props.panelName,
      },
    });

    console.error(`[PanelErrorBoundary] Error in ${this.props.panelName}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className={`${this.props.fallbackHeight || 'min-h-[200px]'}`}>
          <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Panel Error</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
              Something went wrong in this section. Try refreshing or switch to another tab.
            </p>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-xs text-left w-full">
                <summary className="cursor-pointer text-muted-foreground">Error details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-destructive whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
