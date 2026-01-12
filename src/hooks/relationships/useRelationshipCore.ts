/**
 * @fileoverview Core relationship state and CRUD operations
 * @module hooks/relationships/useRelationshipCore
 */

import { useState, useCallback } from 'react';
import { CatRelationship, getRelationshipLevel } from '@/types/relationships';

/**
 * Core relationship state management
 * 
 * Provides basic CRUD operations for cat relationships.
 */
export function useRelationshipCore() {
  const [relationships, setRelationships] = useState<CatRelationship[]>([]);

  /**
   * Gets the relationship between two specific cats
   */
  const getRelationship = useCallback(
    (catId1: string, catId2: string): CatRelationship | null => {
      return (
        relationships.find(
          (r) =>
            (r.catId1 === catId1 && r.catId2 === catId2) ||
            (r.catId1 === catId2 && r.catId2 === catId1)
        ) || null
      );
    },
    [relationships]
  );

  /**
   * Updates or creates a relationship between two cats
   * Scores are clamped to -100 to +100 range.
   */
  const updateRelationship = useCallback(
    (catId1: string, catId2: string, change: number, day: number) => {
      setRelationships((prev) => {
        const existing = prev.find(
          (r) =>
            (r.catId1 === catId1 && r.catId2 === catId2) ||
            (r.catId1 === catId2 && r.catId2 === catId1)
        );

        if (existing) {
          return prev.map((r) => {
            if (
              (r.catId1 === catId1 && r.catId2 === catId2) ||
              (r.catId1 === catId2 && r.catId2 === catId1)
            ) {
              const newScore = Math.max(-100, Math.min(100, r.score + change));
              return {
                ...r,
                score: newScore,
                level: getRelationshipLevel(newScore),
                lastInteraction: day,
              };
            }
            return r;
          });
        }

        // Create new relationship
        const newScore = Math.max(-100, Math.min(100, change));
        return [
          ...prev,
          {
            catId1,
            catId2,
            score: newScore,
            level: getRelationshipLevel(newScore),
            lastInteraction: day,
          },
        ];
      });
    },
    []
  );

  /**
   * Removes all relationships involving a specific cat
   */
  const removeCatRelationships = useCallback((catId: string) => {
    setRelationships((prev) => prev.filter((r) => r.catId1 !== catId && r.catId2 !== catId));
  }, []);

  /**
   * Calculates a happiness modifier based on a cat's relationships
   */
  const getHappinessModifier = useCallback(
    (catId: string): number => {
      let modifier = 0;
      relationships.forEach((r) => {
        if (r.catId1 === catId || r.catId2 === catId) {
          if (r.level === 'bestFriend') modifier += 5;
          else if (r.level === 'friend') modifier += 2;
          else if (r.level === 'rival') modifier -= 2;
          else if (r.level === 'enemy') modifier -= 5;
        }
      });
      return modifier;
    },
    [relationships]
  );

  return {
    relationships,
    setRelationships,
    getRelationship,
    updateRelationship,
    removeCatRelationships,
    getHappinessModifier,
  };
}
