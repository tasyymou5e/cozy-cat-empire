import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameMessage } from '@/hooks/useGameMessages';

/**
 * Props for the MessageBar component
 * Supports both legacy props and new GameMessage object
 */
interface MessageBarProps {
  /** The message text to display (legacy) */
  message?: string;
  /** Message type affecting styling (legacy) */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** New unified message object */
  gameMessage?: GameMessage | null;
  /** Optional callback to dismiss the message */
  onDismiss?: () => void;
  /** Number of messages in queue (optional) */
  queueCount?: number;
}

/**
 * MessageBar - Displays game notifications and alerts
 *
 * Supports both legacy props (message + type) and new GameMessage object.
 * When using GameMessage, auto-dismiss is handled by useGameMessages hook.
 *
 * @example
 * ```tsx
 * // Legacy usage
 * <MessageBar message="Cat fed!" type="success" onDismiss={...} />
 *
 * // New unified usage
 * <MessageBar gameMessage={currentMessage} onDismiss={...} queueCount={2} />
 * ```
 */
export const MessageBar = React.forwardRef<HTMLDivElement, MessageBarProps>(function MessageBar(
  { message, type, gameMessage, onDismiss, queueCount = 0 },
  ref
) {
  // Support both legacy and new props
  const displayText = gameMessage?.text ?? message ?? '';
  const displayType = gameMessage?.type ?? type ?? 'info';

  if (!displayText.trim()) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'message-bar relative transition-all duration-300',
        displayType === 'success' && 'message-success',
        displayType === 'warning' && 'message-warning',
        displayType === 'error' && 'message-error'
      )}
    >
      <p className="text-center font-medium pr-8">{displayText}</p>

      {/* Queue indicator */}
      {queueCount > 0 && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs bg-background/60 px-1.5 py-0.5 rounded-full">
          +{queueCount}
        </span>
      )}

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
});

MessageBar.displayName = 'MessageBar';
