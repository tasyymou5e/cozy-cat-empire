/**
 * useGameMessages - Centralized Game Message Management
 * 
 * Provides unified message handling with:
 * - Message queue with priority levels
 * - Auto-dismiss timing based on type
 * - Deduplication of repeated messages
 * - Backward-compatible API
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
  error: 0, // Manual dismiss for errors
};

/** Priority weights for sorting */
const PRIORITY_WEIGHTS: Record<MessagePriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

/** Deduplication window (ms) */
const DEDUP_WINDOW = 500;

/** Max history size */
const MAX_HISTORY = 10;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGameMessages(): UseGameMessagesReturn {
  const [currentMessage, setCurrentMessage] = useState<GameMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<GameMessage[]>([]);
  const [messageHistory, setMessageHistory] = useState<GameMessage[]>([]);
  
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<{ text: string; timestamp: number } | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => 
    `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, []);

  // Clear dismiss timer
  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  // Show next message from queue
  const showNextFromQueue = useCallback(() => {
    setMessageQueue(prev => {
      if (prev.length === 0) {
        setCurrentMessage(null);
        return prev;
      }

      // Sort by priority (highest first), then by timestamp (oldest first)
      const sorted = [...prev].sort((a, b) => {
        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const nextMessage = sorted[0];
      setCurrentMessage(nextMessage);
      
      // Add to history
      setMessageHistory(hist => {
        const newHist = [nextMessage, ...hist].slice(0, MAX_HISTORY);
        return newHist;
      });

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
  const showMessage = useCallback((
    text: string, 
    type: MessageType = 'info', 
    options?: MessageOptions
  ) => {
    const now = Date.now();
    
    // Deduplication: skip if same message was shown recently
    if (lastMessageRef.current && 
        lastMessageRef.current.text === text && 
        now - lastMessageRef.current.timestamp < DEDUP_WINDOW) {
      return;
    }
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
    if (!currentMessage) {
      setCurrentMessage(newMessage);
      setMessageHistory(hist => [newMessage, ...hist].slice(0, MAX_HISTORY));
    } else {
      // Critical priority messages interrupt current message
      if (priority === 'critical') {
        // Push current to front of queue and show critical
        setMessageQueue(prev => [currentMessage, ...prev]);
        setCurrentMessage(newMessage);
        setMessageHistory(hist => [newMessage, ...hist].slice(0, MAX_HISTORY));
        clearDismissTimer();
      } else {
        // Add to queue
        setMessageQueue(prev => [...prev, newMessage]);
      }
    }
  }, [currentMessage, generateId, clearDismissTimer]);

  return {
    currentMessage,
    showMessage,
    dismissMessage,
    queueCount: messageQueue.length,
    messageHistory,
  };
}

// Default export for convenience
export default useGameMessages;
