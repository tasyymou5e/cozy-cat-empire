import React from 'react';
import { cn } from '@/lib/utils';

interface MessageBarProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const MessageBar = React.forwardRef<HTMLDivElement, MessageBarProps>(
  function MessageBar({ message, type }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'message-bar',
          type === 'success' && 'message-success',
          type === 'warning' && 'message-warning',
          type === 'error' && 'message-error',
        )}
      >
        <p className="text-center font-medium">{message}</p>
      </div>
    );
  }
);

MessageBar.displayName = 'MessageBar';
