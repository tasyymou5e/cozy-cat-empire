import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameMessage } from '@/hooks/useGameMessages';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (incomingText) {
      setDisplayedMessage({ text: incomingText, type: incomingType });
    } else {
      // Remove cleared messages immediately. Keeping a local copy for an exit
      // animation could leave the banner mounted if its timer was interrupted.
      setDisplayedMessage(null);
    }
  }, [incomingText, incomingType]);

  if (!displayedMessage) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'message-bar relative animate-message-in',
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="absolute right-1 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

MessageBar.displayName = 'MessageBar';
