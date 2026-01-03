import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the MessageBar component
 */
interface MessageBarProps {
  /** The message text to display */
  message: string;
  /** Message type affecting styling */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Optional callback to dismiss the message */
  onDismiss?: () => void;
}

/**
 * MessageBar - Displays game notifications and alerts
 * 
 * Shows messages with different styling based on type. Success messages
 * auto-dismiss after 5 seconds. Can be manually dismissed via X button.
 * 
 * @example
 * ```tsx
 * <MessageBar 
 *   message="Cat fed successfully!"
 *   type="success"
 *   onDismiss={() => setMessage('')}
 * />
 * ```
 */
export const MessageBar = React.forwardRef<HTMLDivElement, MessageBarProps>(
  function MessageBar({ message, type, onDismiss }, ref) {
    useEffect(() => {
      if (type === 'success' && onDismiss && message.trim()) {
        const timer = setTimeout(() => {
          onDismiss();
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }, [message, type, onDismiss]);

    if (!message.trim()) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'message-bar relative',
          type === 'success' && 'message-success',
          type === 'warning' && 'message-warning',
          type === 'error' && 'message-error',
        )}
      >
        <p className="text-center font-medium pr-8">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);

MessageBar.displayName = 'MessageBar';
