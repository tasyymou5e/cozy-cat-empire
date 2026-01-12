/**
 * @fileoverview Composed relationship hook
 * 
 * This is the main hook that composes all relationship sub-hooks.
 * Use this for full relationship functionality.
 * 
 * @module hooks/relationships/useRelationships
 */

import { useCallback } from 'react';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { useRelationshipCore } from './useRelationshipCore';
import { useRelationshipEvents } from './useRelationshipEvents';
import { useRelationshipDecay } from './useRelationshipDecay';
import { useRelationshipGroups } from './useRelationshipGroups';
import { useRelationshipBreeding, BreedingCompatibility } from './useRelationshipBreeding';

/**
 * Save data structure for relationship persistence
 */
export interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
  maintenanceStreak?: number;
  longestMaintenanceStreak?: number;
  lastMaintenanceDay?: number | null;
}

export interface SocializeResult {
  success: boolean;
  message: string;
}

export type { BreedingCompatibility };

/**
 * Composed hook for managing cat-to-cat relationships
 * 
 * Combines all relationship functionality:
 * - Core CRUD operations
 * - Event handling and history
 * - Decay processing and maintenance streaks
 * - Group/clique detection
 * - Breeding compatibility checks
 */
export function useRelationships() {
  // Core state and CRUD
  const {
    relationships,
    setRelationships,
    getRelationship,
    updateRelationship,
    removeCatRelationships,
    getHappinessModifier,
  } = useRelationshipCore();

  // Event handling
  const {
    events,
    setEvents,
    lastEventId,
    addEvent,
    socializeCats,
    processDailyRelationships,
  } = useRelationshipEvents({ updateRelationship });

  // Decay and maintenance
  const {
    maintenanceStreak,
    setMaintenanceStreak,
    longestMaintenanceStreak,
    setLongestMaintenanceStreak,
    lastMaintenanceDay,
    setLastMaintenanceDay,
    processRelationshipDecay,
    checkMaintenanceStreak,
  } = useRelationshipDecay({
    relationships,
    setRelationships,
    setEvents,
    setLastEventId: (id: string) => {
      // This is handled by useRelationshipEvents but we need to pass it for decay events
    },
  });

  // Group detection
  const { groups, detectGroups } = useRelationshipGroups({ relationships });

  // Breeding compatibility
  const { getBreedingCompatibility } = useRelationshipBreeding({ getRelationship });

  /**
   * Loads relationship data from a save file
   */
  const loadRelationships = useCallback((data: RelationshipSaveData) => {
    setRelationships(data.relationships || []);
    setEvents(data.events || []);
    setMaintenanceStreak(data.maintenanceStreak || 0);
    setLongestMaintenanceStreak(data.longestMaintenanceStreak || 0);
    setLastMaintenanceDay(data.lastMaintenanceDay ?? null);
  }, [setRelationships, setEvents, setMaintenanceStreak, setLongestMaintenanceStreak, setLastMaintenanceDay]);

  /**
   * Gets current relationship data for saving
   */
  const getRelationshipSaveData = useCallback(
    (): RelationshipSaveData => ({
      relationships,
      events,
      maintenanceStreak,
      longestMaintenanceStreak,
      lastMaintenanceDay,
    }),
    [relationships, events, maintenanceStreak, longestMaintenanceStreak, lastMaintenanceDay]
  );

  return {
    // State
    relationships,
    events,
    groups,
    lastEventId,
    maintenanceStreak,
    longestMaintenanceStreak,
    
    // Core operations
    getRelationship,
    updateRelationship,
    addEvent,
    
    // Socialization
    socializeCats,
    processDailyRelationships,
    
    // Decay & maintenance
    processRelationshipDecay,
    checkMaintenanceStreak,
    
    // Groups
    detectGroups,
    
    // Utilities
    getHappinessModifier,
    getBreedingCompatibility,
    removeCatRelationships,
    
    // Persistence
    loadRelationships,
    getRelationshipSaveData,
  };
}
