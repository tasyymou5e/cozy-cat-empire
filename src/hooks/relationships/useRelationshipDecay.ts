/**
 * @fileoverview Relationship decay and maintenance streak logic
 * @module hooks/relationships/useRelationshipDecay
 */

import { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import {
  CatRelationship,
  RelationshipEvent,
  getRelationshipLevel,
  RELATIONSHIP_DECAY,
  getDecayInfo,
} from '@/types/relationships';
import { generateId } from '@/lib/utils';

interface UseRelationshipDecayOptions {
  relationships: CatRelationship[];
  setRelationships: React.Dispatch<React.SetStateAction<CatRelationship[]>>;
  setEvents: React.Dispatch<React.SetStateAction<RelationshipEvent[]>>;
  setLastEventId: (id: string) => void;
}

/**
 * Relationship decay and maintenance streak management
 */
export function useRelationshipDecay({
  relationships,
  setRelationships,
  setEvents,
  setLastEventId,
}: UseRelationshipDecayOptions) {
  const [maintenanceStreak, setMaintenanceStreak] = useState(0);
  const [longestMaintenanceStreak, setLongestMaintenanceStreak] = useState(0);
  const [lastMaintenanceDay, setLastMaintenanceDay] = useState<number | null>(null);

  /**
   * Processes relationship decay for neglected relationships
   */
  const processRelationshipDecay = useCallback((cats: Cat[], currentDay: number) => {
    const decayMessages = [
      "{cat1} and {cat2} haven't spent time together lately...",
      '{cat1} seems to have forgotten about {cat2}...',
      'The bond between {cat1} and {cat2} is fading...',
      '{cat1} and {cat2} are growing apart...',
    ];

    setRelationships((prev) => {
      const updatedRelationships: CatRelationship[] = [];
      const decayEvents: {
        cat1: Cat;
        cat2: Cat;
        oldLevel: string;
        newLevel: string;
        decay: number;
      }[] = [];

      prev.forEach((rel) => {
        const daysSinceInteraction = currentDay - rel.lastInteraction;

        if (
          daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS ||
          rel.score <= RELATIONSHIP_DECAY.MIN_DECAY_SCORE
        ) {
          updatedRelationships.push(rel);
          return;
        }

        let decayAmount = 0;
        if (daysSinceInteraction >= RELATIONSHIP_DECAY.SEVERE_THRESHOLD_DAYS) {
          decayAmount = RELATIONSHIP_DECAY.SEVERE_DECAY;
        } else if (daysSinceInteraction >= RELATIONSHIP_DECAY.MODERATE_THRESHOLD_DAYS) {
          decayAmount = RELATIONSHIP_DECAY.MODERATE_DECAY;
        } else {
          decayAmount = RELATIONSHIP_DECAY.LIGHT_DECAY;
        }

        const newScore = Math.max(RELATIONSHIP_DECAY.MIN_DECAY_SCORE, rel.score - decayAmount);
        const oldLevel = rel.level;
        const newLevel = getRelationshipLevel(newScore);

        if (oldLevel !== newLevel) {
          const cat1 = cats.find((c) => c.id === rel.catId1);
          const cat2 = cats.find((c) => c.id === rel.catId2);
          if (cat1 && cat2) {
            decayEvents.push({ cat1, cat2, oldLevel, newLevel, decay: decayAmount });
          }
        }

        updatedRelationships.push({
          ...rel,
          score: newScore,
          level: newLevel,
        });
      });

      decayEvents.forEach(({ cat1, cat2, decay }) => {
        const message = decayMessages[Math.floor(Math.random() * decayMessages.length)]
          .replace('{cat1}', cat1.name)
          .replace('{cat2}', cat2.name);

        const eventId = generateId();
        const event: RelationshipEvent = {
          id: eventId,
          catId1: cat1.id,
          catId2: cat2.id,
          catName1: cat1.name,
          catName2: cat2.name,
          type: 'negative',
          message,
          scoreChange: -decay,
          day: currentDay,
        };
        setEvents((e) => [event, ...e].slice(0, 100));
        setLastEventId(eventId);
      });

      return updatedRelationships;
    });
  }, [setRelationships, setEvents, setLastEventId]);

  /**
   * Checks and updates the maintenance streak
   */
  const checkMaintenanceStreak = useCallback(
    (currentDay: number) => {
      const friendships = relationships.filter((r) => r.score >= 20);
      if (friendships.length === 0) return;

      const allMaintained = friendships.every((r) => {
        const decayInfo = getDecayInfo(r, currentDay);
        return decayInfo.daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS;
      });

      if (allMaintained) {
        if (lastMaintenanceDay === currentDay - 1) {
          const newStreak = maintenanceStreak + 1;
          setMaintenanceStreak(newStreak);
          setLongestMaintenanceStreak((prev) => Math.max(prev, newStreak));
        } else if (lastMaintenanceDay !== currentDay) {
          setMaintenanceStreak(1);
          setLongestMaintenanceStreak((prev) => Math.max(prev, 1));
        }
        setLastMaintenanceDay(currentDay);
      } else {
        if (maintenanceStreak > 0) {
          setMaintenanceStreak(0);
        }
      }
    },
    [relationships, maintenanceStreak, lastMaintenanceDay]
  );

  return {
    maintenanceStreak,
    setMaintenanceStreak,
    longestMaintenanceStreak,
    setLongestMaintenanceStreak,
    lastMaintenanceDay,
    setLastMaintenanceDay,
    processRelationshipDecay,
    checkMaintenanceStreak,
  };
}
