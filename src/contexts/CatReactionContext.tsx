import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export interface CatReaction {
  catId: string;
  type: 'positive' | 'negative' | 'neutral';
  emoji: string;
  timestamp: number;
}

interface CatReactionContextType {
  reactions: CatReaction[];
  addReaction: (catId: string, type: 'positive' | 'negative' | 'neutral') => void;
  getCatReaction: (catId: string) => CatReaction | undefined;
}

const CatReactionContext = createContext<CatReactionContextType | undefined>(undefined);

const POSITIVE_EMOJIS = ['💕', '🥰', '💖', '✨', '😻'];
const NEGATIVE_EMOJIS = ['😾', '💢', '😤', '😿', '⚡'];
const NEUTRAL_EMOJIS = ['🤔', '😐', '😶'];

function getRandomEmoji(type: 'positive' | 'negative' | 'neutral'): string {
  const emojis =
    type === 'positive' ? POSITIVE_EMOJIS : type === 'negative' ? NEGATIVE_EMOJIS : NEUTRAL_EMOJIS;
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export function CatReactionProvider({ children }: { children: React.ReactNode }) {
  const [reactions, setReactions] = useState<CatReaction[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addReaction = useCallback((catId: string, type: 'positive' | 'negative' | 'neutral') => {
    const newReaction: CatReaction = {
      catId,
      type,
      emoji: getRandomEmoji(type),
      timestamp: Date.now(),
    };

    // Clear existing timeout for this cat if any
    const existingTimeout = timeoutRefs.current.get(catId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    setReactions((prev) => {
      // Remove existing reaction for this cat and add new one
      const filtered = prev.filter((r) => r.catId !== catId);
      return [...filtered, newReaction];
    });

    // Auto-remove after 2.5 seconds
    const timeout = setTimeout(() => {
      setReactions((prev) =>
        prev.filter((r) => r.catId !== catId || r.timestamp !== newReaction.timestamp)
      );
      timeoutRefs.current.delete(catId);
    }, 2500);

    timeoutRefs.current.set(catId, timeout);
  }, []);

  const getCatReaction = useCallback(
    (catId: string) => {
      return reactions.find((r) => r.catId === catId);
    },
    [reactions]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <CatReactionContext.Provider value={{ reactions, addReaction, getCatReaction }}>
      {children}
    </CatReactionContext.Provider>
  );
}

export function useCatReactions() {
  const context = useContext(CatReactionContext);
  if (!context) {
    throw new Error('useCatReactions must be used within a CatReactionProvider');
  }
  return context;
}
