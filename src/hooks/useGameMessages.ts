/**
 * useGameMessages - Centralized Game Message Management
 *
 * Provides unified message handling with:
 * - Message queue with priority levels
 * - Auto-dismiss timing based on type
 * - Deduplication of repeated messages
 * - Queue cap to prevent unbounded stacking
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type MessageType = 'info' | 'success' | 'warning' | 'error';
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export interface GameMessage {
  id: string;
  text: string;
  type: MessageType;
  priority: MessagePriority;
  timestamp: number;
  autoDismiss: number; // ms, 0 = manual dismiss only
}

export interface MessageOptions {
  priority?: MessagePriority;
  autoDismiss?: number; // ms override
}

export interface UseGameMessagesReturn {
  /** Current message to display */
  currentMessage: GameMessage | null;
  /** Show a message (replaces showMessage in game hooks) */
  showMessage: (text: string, type?: MessageType, options?: MessageOptions) => void;
  /** Dismiss current message and show next in queue */
  dismissMessage: () => void;
  /** Number of messages waiting in queue */
  queueCount: number;
  /** Message history (last 10) */
  messageHistory: GameMessage[];
}

// ============================================================================
// Constants
// ============================================================================

/** Auto-dismiss times by message type (ms) */
const AUTO_DISMISS_TIMES: Record<MessageType, number> = {
  info: 4000,
  success: 5000,
  warning: 6000,
  error: 8000,
};

/** Priority weights for sorting */
const PRIORITY_WEIGHTS: Record<MessagePriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

/** Deduplication window (ms) */
const DEDUP_WINDOW = 1500;

/** Max history size */
const MAX_HISTORY = 10;

/** Max queue size — drop lowest-priority oldest when exceeded */
const MAX_QUEUE = 5;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGameMessages(): UseGameMessagesReturn {
  const [currentMessage, setCurrentMessage] = useState<GameMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<GameMessage[]>([]);
  const [messageHistory, setMessageHistory] = useState<GameMessage[]>([]);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<{ text: string; timestamp: number } | null>(null);
  const currentMessageRef = useRef<GameMessage | null>(null);

  // Keep ref in sync so callbacks don't need currentMessage in deps
  currentMessageRef.current = currentMessage;

  // Generate unique ID
  const generateId = useCallback(
    () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    []
  );

  // Clear dismiss timer
  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  // Show next message from queue
  const showNextFromQueue = useCallback(() => {
    setMessageQueue((prev) => {
      if (prev.length === 0) {
        setCurrentMessage(null);
        return prev;
      }

      const sorted = [...prev].sort((a, b) => {
        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const nextMessage = sorted[0];
      setCurrentMessage(nextMessage);

      setMessageHistory((hist) => [nextMessage, ...hist].slice(0, MAX_HISTORY));

      return sorted.slice(1);
    });
  }, []);

  // Dismiss current message
  const dismissMessage = useCallback(() => {
    clearDismissTimer();
    showNextFromQueue();
  }, [clearDismissTimer, showNextFromQueue]);

  // Set up auto-dismiss timer when current message changes
  useEffect(() => {
    clearDismissTimer();

    if (currentMessage && currentMessage.autoDismiss > 0) {
      dismissTimerRef.current = setTimeout(() => {
        dismissMessage();
      }, currentMessage.autoDismiss);
    }

    return () => clearDismissTimer();
  }, [currentMessage, clearDismissTimer, dismissMessage]);

  // Show a message
  const showMessage = useCallback(
    (text: string, type: MessageType = 'info', options?: MessageOptions) => {
      const now = Date.now();

      // Deduplication: skip if same message text was shown recently
      if (
        lastMessageRef.current &&
        lastMessageRef.current.text === text &&
        now - lastMessageRef.current.timestamp < DEDUP_WINDOW
      ) {
        return;
      }

      // Also skip if same text is the current message or already queued
      if (currentMessageRef.current?.text === text) return;

      lastMessageRef.current = { text, timestamp: now };

      const priority = options?.priority ?? 'normal';
      const autoDismiss = options?.autoDismiss ?? AUTO_DISMISS_TIMES[type];

      const newMessage: GameMessage = {
        id: generateId(),
        text,
        type,
        priority,
        timestamp: now,
        autoDismiss,
      };

      // If no current message, show immediately
      if (!currentMessageRef.current) {
        setCurrentMessage(newMessage);
        setMessageHistory((hist) => [newMessage, ...hist].slice(0, MAX_HISTORY));
      } else {
        // Critical priority messages interrupt current message
        if (priority === 'critical') {
          setMessageQueue((prev) => [currentMessageRef.current!, ...prev].slice(0, MAX_QUEUE));
          setCurrentMessage(newMessage);
          setMessageHistory((hist) => [newMessage, ...hist].slice(0, MAX_HISTORY));
          clearDismissTimer();
        } else {
          // Add to queue, cap size
          setMessageQueue((prev) => {
            // Skip if same text already in queue
            if (prev.some((m) => m.text === text)) return prev;

            const updated = [...prev, newMessage];
            if (updated.length > MAX_QUEUE) {
              // Drop lowest-priority, oldest message
              updated.sort((a, b) => {
                const pd = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
                if (pd !== 0) return pd;
                return a.timestamp - b.timestamp;
              });
              updated.shift(); // remove lowest
            }
            return updated;
          });
        }
      }
    },
    [generateId, clearDismissTimer]
  );

  return {
    currentMessage,
    showMessage,
    dismissMessage,
    queueCount: messageQueue.length,
    messageHistory,
  };
}

export default useGameMessages;
