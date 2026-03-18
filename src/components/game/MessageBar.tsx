import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameMessage } from '@/hooks/useGameMessages';

interface MessageBarProps {
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  gameMessage?: GameMessage | null;
  onDismiss?: () => void;
  queueCount?: number;
}

export const MessageBar = React.forwardRef<HTMLDivElement, MessageBarProps>(function MessageBar(
  { message, type, gameMessage, onDismiss, queueCount = 0 },
  ref
) {
  const incomingText = gameMessage?.text ?? message ?? '';
  const incomingType = gameMessage?.type ?? type ?? 'info';

  const [displayedMessage, setDisplayedMessage] = useState<{ text: string; type: string } | null>(
    incomingText ? { text: incomingText, type: incomingType } : null
  );
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up any pending exit timer
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (incomingText) {
      // New message — show immediately, cancel any exit
      setDisplayedMessage({ text: incomingText, type: incomingType });
      setIsExiting(false);
    } else if (displayedMessage) {
      // Message cleared — start exit animation
      setIsExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setDisplayedMessage(null);
        setIsExiting(false);
      }, 300);
    }

    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
    // Only react to incoming message changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingText, incomingType]);

  if (!displayedMessage) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'message-bar relative',
        isExiting ? 'animate-message-out' : 'animate-message-in',
        displayedMessage.type === 'success' && 'message-success',
        displayedMessage.type === 'warning' && 'message-warning',
        displayedMessage.type === 'error' && 'message-error'
      )}
    >
      <p className="text-center font-medium pr-8">{displayedMessage.text}</p>

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
