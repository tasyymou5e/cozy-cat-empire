/**
 * @fileoverview useBroadcastSync - Cross-tab state synchronization
 *
 * Uses the BroadcastChannel API to synchronize state changes across
 * multiple browser tabs of the same origin. Essential for preventing
 * data conflicts when users have multiple game tabs open.
 *
 * @module hooks/useBroadcastSync
 */

import { useEffect, useCallback, useRef } from 'react';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useBroadcastSync');

interface BroadcastMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  tabId: string;
}

/**
 * Hook for cross-tab state synchronization.
 *
 * Creates a BroadcastChannel that allows different tabs to communicate
 * state changes to each other. Useful for syncing game saves, login
 * status, and other critical state.
 *
 * @param channelName - Unique name for the broadcast channel
 * @param onMessage - Callback when a message is received from another tab
 * @returns Functions to broadcast messages to other tabs
 *
 * @example
 * ```tsx
 * // In tab 1: Send a message when game saves
 * const { broadcast } = useBroadcastSync('game-sync', (msg) => {
 *   if (msg.type === 'GAME_SAVED') {
 *     refreshGameState();
 *   }
 * });
 *
 * const handleSave = async () => {
 *   await saveGame();
 *   broadcast({ type: 'GAME_SAVED', payload: { day: gameState.day } });
 * };
 *
 * // Tab 2 will receive the message and refresh
 * ```
 */
export function useBroadcastSync<T = unknown>(
  channelName: string,
  onMessage?: (message: BroadcastMessage<T>) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(generateTabId());

  // Initialize channel
  useEffect(() => {
    // BroadcastChannel may not be available in all browsers
    if (typeof BroadcastChannel === 'undefined') {
      logger.warn('BroadcastChannel not supported in this browser');
      return;
    }

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
      // Ignore messages from this tab
      if (event.data.tabId === tabIdRef.current) return;

      onMessage?.(event.data);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [channelName, onMessage]);

  /**
   * Broadcast a message to all other tabs
   */
  const broadcast = useCallback(
    (message: { type: string; payload?: T }) => {
      if (!channelRef.current) return;

      const fullMessage: BroadcastMessage<T> = {
        type: message.type,
        payload: message.payload as T,
        timestamp: Date.now(),
        tabId: tabIdRef.current,
      };

      channelRef.current.postMessage(fullMessage);
    },
    []
  );

  /**
   * Broadcast and also trigger local handler
   */
  const broadcastAndLocal = useCallback(
    (message: { type: string; payload?: T }) => {
      broadcast(message);

      // Also trigger local handler
      if (onMessage) {
        onMessage({
          type: message.type,
          payload: message.payload as T,
          timestamp: Date.now(),
          tabId: 'local',
        });
      }
    },
    [broadcast, onMessage]
  );

  return {
    /** Broadcast a message to other tabs only */
    broadcast,
    /** Broadcast to other tabs AND trigger local handler */
    broadcastAndLocal,
    /** This tab's unique ID */
    tabId: tabIdRef.current,
    /** Whether BroadcastChannel is supported */
    isSupported: typeof BroadcastChannel !== 'undefined',
  };
}

// Pre-defined message types for common sync operations
export const SYNC_MESSAGES = {
  /** Game state was saved to cloud */
  GAME_SAVED: 'GAME_SAVED',
  /** User logged in */
  USER_LOGIN: 'USER_LOGIN',
  /** User logged out */
  USER_LOGOUT: 'USER_LOGOUT',
  /** Daily reward was claimed */
  DAILY_REWARD_CLAIMED: 'DAILY_REWARD_CLAIMED',
  /** Lucky wheel was spun */
  WHEEL_SPUN: 'WHEEL_SPUN',
  /** Settings changed */
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  /** Request other tabs to refresh state */
  REQUEST_REFRESH: 'REQUEST_REFRESH',
} as const;

export type SyncMessageType = (typeof SYNC_MESSAGES)[keyof typeof SYNC_MESSAGES];

/**
 * Generate a unique ID for this tab
 */
function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
