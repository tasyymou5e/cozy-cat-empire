/**
 * @fileoverview Relationship event handling and history
 * @module hooks/relationships/useRelationshipEvents
 */

import { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import { RelationshipEvent, PERSONALITY_COMPATIBILITY } from '@/types/relationships';
import { generateId } from '@/lib/utils';

interface UseRelationshipEventsOptions {
  updateRelationship: (catId1: string, catId2: string, change: number, day: number) => void;
}

/**
 * Relationship event management
 * 
 * Handles event creation, history, and daily interactions.
 */
export function useRelationshipEvents({ updateRelationship }: UseRelationshipEventsOptions) {
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  /**
   * Adds a relationship event to history and updates the relationship
   */
  const addEvent = useCallback(
    (
      cat1: Cat,
      cat2: Cat,
      type: 'positive' | 'negative' | 'neutral',
      message: string,
      scoreChange: number,
      day: number
    ) => {
      const eventId = generateId();
      const event: RelationshipEvent = {
        id: eventId,
        catId1: cat1.id,
        catId2: cat2.id,
        catName1: cat1.name,
        catName2: cat2.name,
        type,
        message,
        scoreChange,
        day,
      };
      setEvents((prev) => [event, ...prev].slice(0, 100));
      setLastEventId(eventId);
      updateRelationship(cat1.id, cat2.id, scoreChange, day);
    },
    [updateRelationship]
  );

  /**
   * Manually socializes two cats, improving their relationship
   */
  const socializeCats = useCallback(
    (cat1: Cat, cat2: Cat, day: number): { success: boolean; message: string } => {
      const compatibility = PERSONALITY_COMPATIBILITY[cat1.personality][cat2.personality];
      const baseBonus = 10;
      const bonus = baseBonus + Math.floor(compatibility / 2);

      const messages = [
        `${cat1.name} and ${cat2.name} shared treats together`,
        `${cat1.name} groomed ${cat2.name} affectionately`,
        `${cat1.name} and ${cat2.name} played with the same toy`,
        `${cat1.name} napped next to ${cat2.name}`,
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];
      addEvent(cat1, cat2, 'positive', message, bonus, day);

      return {
        success: true,
        message: `${message}! (+${bonus} relationship)`,
      };
    },
    [addEvent]
  );

  /**
   * Processes daily random interactions between cats
   */
  const processDailyRelationships = useCallback(
    (cats: Cat[], day: number) => {
      if (cats.length >= 2 && Math.random() < 0.3) {
        const shuffled = [...cats].sort(() => Math.random() - 0.5);
        const cat1 = shuffled[0];
        const cat2 = shuffled[1];

        const compatibility = PERSONALITY_COMPATIBILITY[cat1.personality][cat2.personality];
        const isPositive = Math.random() < 0.5 + compatibility / 100;

        if (isPositive) {
          const positiveMessages = [
            `${cat1.name} and ${cat2.name} played together`,
            `${cat1.name} shared a sunbeam with ${cat2.name}`,
            `${cat1.name} and ${cat2.name} groomed each other`,
          ];
          const msg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
          addEvent(cat1, cat2, 'positive', msg, 3 + Math.floor(Math.random() * 5), day);
        } else {
          const negativeMessages = [
            `${cat1.name} hissed at ${cat2.name}`,
            `${cat1.name} stole ${cat2.name}'s spot`,
            `${cat1.name} and ${cat2.name} fought over food`,
          ];
          const msg = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
          addEvent(cat1, cat2, 'negative', msg, -(3 + Math.floor(Math.random() * 5)), day);
        }
      }
    },
    [addEvent]
  );

  return {
    events,
    setEvents,
    lastEventId,
    addEvent,
    socializeCats,
    processDailyRelationships,
  };
}
