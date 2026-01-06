import { ReactNode, useEffect } from 'react';
import { useErrorLogger } from '@/hooks/useErrorLogger';

interface ErrorLoggerProviderProps {
  children: ReactNode;
}

export function ErrorLoggerProvider({ children }: ErrorLoggerProviderProps) {
  // Initialize the error logger hooks (sets up global handlers)
  useErrorLogger();


  return <>{children}</>;
}
