/**
 * @fileoverview Cat relationship management system
 * 
 * Provides functionality for managing social relationships between cats,
 * including friendships, rivalries, group detection, compatibility checks,
 * and daily relationship events. Includes maintenance streak tracking
 * for relationship upkeep.
 * 
 * @module hooks/useRelationships
 */

import { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import {
  CatRelationship,
  RelationshipEvent,
  CatGroup,
  PERSONALITY_COMPATIBILITY,
  getRelationshipLevel,
  RELATIONSHIP_DECAY,
  getDecayInfo,
} from '@/types/relationships';
import { generateId } from '@/lib/utils';

/**
 * Save data structure for relationship persistence
 * 
 * @interface RelationshipSaveData
 * @property {CatRelationship[]} relationships - All cat relationships
 * @property {RelationshipEvent[]} events - History of relationship events
 * @property {number} [maintenanceStreak] - Current maintenance streak
 * @property {number} [longestMaintenanceStreak] - Best maintenance streak achieved
 * @property {number | null} [lastMaintenanceDay] - Last day maintenance was checked
 */
export interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
  maintenanceStreak?: number;
  longestMaintenanceStreak?: number;
  lastMaintenanceDay?: number | null;
}

/**
 * Result from a breeding compatibility check
 * 
 * @interface BreedingCompatibility
 * @property {boolean} canBreed - Whether the cats can breed together
 * @property {number} bonus - Percentage bonus/penalty to breeding outcome
 * @property {string} message - Human-readable explanation
 */
export interface BreedingCompatibility {
  canBreed: boolean;
  bonus: number;
  message: string;
}

/**
 * Result from a socialization action
 * 
 * @interface SocializeResult
 * @property {boolean} success - Whether socialization succeeded
 * @property {string} message - Description of what happened
 */
export interface SocializeResult {
  success: boolean;
  message: string;
}

/**
 * Hook for managing cat-to-cat relationships
 * 
 * Provides comprehensive functionality for:
 * - Tracking relationship scores between cats (-100 to +100)
 * - Recording and displaying relationship events
 * - Detecting social groups (cliques) among cats
 * - Processing daily random interactions
 * - Handling relationship decay for neglected relationships
 * - Tracking maintenance streaks for active relationship upkeep
 * - Checking breeding compatibility based on relationships
 * - Calculating happiness modifiers from relationships
 * 
 * Relationship levels:
 * - **Soul Mates** (80+): Best possible relationship
 * - **Best Friends** (50-79): Strong positive bond
 * - **Friends** (20-49): Positive relationship
 * - **Neutral** (-19 to 19): No strong feelings
 * - **Rivals** (-49 to -20): Mild animosity
 * - **Enemies** (-79 to -50): Strong dislike
 * - **Nemesis** (-100 to -80): Worst possible relationship
 * 
 * @returns {Object} Relationship management state and functions
 * 
 * @example
 * ```tsx
 * function CatSocialPanel() {
 *   const {
 *     relationships,
 *     events,
 *     groups,
 *     socializeCats,
 *     getBreedingCompatibility,
 *     maintenanceStreak
 *   } = useRelationships();
 * 
 *   // Socialize two cats
 *   const handleSocialize = (cat1: Cat, cat2: Cat, day: number) => {
 *     const result = socializeCats(cat1, cat2, day);
 *     toast({ title: result.message });
 *   };
 * 
 *   // Check if cats can breed
 *   const checkBreeding = (cat1Id: string, cat2Id: string) => {
 *     const compat = getBreedingCompatibility(cat1Id, cat2Id);
 *     if (!compat.canBreed) {
 *       toast({ title: 'Cannot breed', description: compat.message });
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <h2>Maintenance Streak: {maintenanceStreak} days 🔥</h2>
 *       <h3>Friend Groups ({groups.length})</h3>
 *       {groups.map(group => (
 *         <GroupCard key={group.id} group={group} />
 *       ))}
 *       <h3>Recent Events</h3>
 *       {events.slice(0, 5).map(event => (
 *         <EventCard key={event.id} event={event} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRelationships() {
  /** All cat-to-cat relationships with scores and levels */
  const [relationships, setRelationships] = useState<CatRelationship[]>([]);
  
  /** History of relationship events (limited to last 100) */
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  
  /** Detected social groups/cliques among cats */
  const [groups, setGroups] = useState<CatGroup[]>([]);
  
  /** ID of the most recent event (for triggering animations) */
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  
  /** Current consecutive days of maintaining all friendships */
  const [maintenanceStreak, setMaintenanceStreak] = useState(0);
  
  /** Highest maintenance streak achieved */
  const [longestMaintenanceStreak, setLongestMaintenanceStreak] = useState(0);
  
  /** Last day maintenance was successfully checked */
  const [lastMaintenanceDay, setLastMaintenanceDay] = useState<number | null>(null);

  /**
   * Gets the relationship between two specific cats
   * 
   * @param {string} catId1 - First cat's ID
   * @param {string} catId2 - Second cat's ID
   * @returns {CatRelationship | null} The relationship if it exists, null otherwise
   * 
   * @example
   * ```ts
   * const rel = getRelationship(cat1.id, cat2.id);
   * if (rel && rel.level === 'bestFriend') {
   *   console.log('These cats are best friends!');
   * }
   * ```
   */
  const getRelationship = useCallback((catId1: string, catId2: string): CatRelationship | null => {
    return relationships.find(
      r => (r.catId1 === catId1 && r.catId2 === catId2) ||
           (r.catId1 === catId2 && r.catId2 === catId1)
    ) || null;
  }, [relationships]);

  /**
   * Updates or creates a relationship between two cats
   * 
   * Scores are clamped to -100 to +100 range. If no relationship exists,
   * a new one is created. The relationship level is automatically recalculated.
   * 
   * @param {string} catId1 - First cat's ID
   * @param {string} catId2 - Second cat's ID
   * @param {number} change - Score change to apply (positive or negative)
   * @param {number} day - Current game day (for tracking last interaction)
   * 
   * @example
   * ```ts
   * // Improve relationship by 10 points
   * updateRelationship(cat1.id, cat2.id, 10, currentDay);
   * 
   * // Worsen relationship by 5 points
   * updateRelationship(cat1.id, cat2.id, -5, currentDay);
   * ```
   */
  const updateRelationship = useCallback((
    catId1: string,
    catId2: string,
    change: number,
    day: number
  ) => {
    setRelationships(prev => {
      const existing = prev.find(
        r => (r.catId1 === catId1 && r.catId2 === catId2) ||
             (r.catId1 === catId2 && r.catId2 === catId1)
      );

      if (existing) {
        return prev.map(r => {
          if ((r.catId1 === catId1 && r.catId2 === catId2) ||
              (r.catId1 === catId2 && r.catId2 === catId1)) {
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
      return [...prev, {
        catId1,
        catId2,
        score: newScore,
        level: getRelationshipLevel(newScore),
        lastInteraction: day,
      }];
    });
  }, []);

  /**
   * Adds a relationship event to history and updates the relationship
   * 
   * Events are displayed in the UI and kept in history (max 100 events).
   * The last event ID is updated to trigger animations.
   * 
   * @param {Cat} cat1 - First cat involved in the event
   * @param {Cat} cat2 - Second cat involved in the event
   * @param {'positive' | 'negative' | 'neutral'} type - Event type for styling
   * @param {string} message - Human-readable event description
   * @param {number} scoreChange - How much the relationship score changed
   * @param {number} day - Current game day
   * 
   * @example
   * ```ts
   * addEvent(cat1, cat2, 'positive', 'They shared a sunny spot together!', 5, currentDay);
   * ```
   */
  const addEvent = useCallback((
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
    setEvents(prev => [event, ...prev].slice(0, 100));
    setLastEventId(eventId);
    updateRelationship(cat1.id, cat2.id, scoreChange, day);
  }, [updateRelationship]);

  /**
   * Manually socializes two cats, improving their relationship
   * 
   * The relationship bonus depends on personality compatibility.
   * A random positive interaction message is selected.
   * 
   * @param {Cat} cat1 - First cat to socialize
   * @param {Cat} cat2 - Second cat to socialize
   * @param {number} day - Current game day
   * @returns {SocializeResult} Result with success status and message
   * 
   * @example
   * ```ts
   * const result = socializeCats(myCat, friendCat, gameState.day);
   * if (result.success) {
   *   toast({ title: result.message }); // "Whiskers and Mittens shared treats together! (+12 relationship)"
   * }
   * ```
   */
  const socializeCats = useCallback((cat1: Cat, cat2: Cat, day: number): SocializeResult => {
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
  }, [addEvent]);

  /**
   * Processes daily random interactions between cats
   * 
   * Has a 30% chance to trigger a random interaction between two cats.
   * Whether the interaction is positive or negative depends on personality
   * compatibility between the selected cats.
   * 
   * @param {Cat[]} cats - All cats in the game
   * @param {number} day - Current game day
   * 
   * @example
   * ```ts
   * // Call this when advancing to the next day
   * processDailyRelationships(state.cats, state.day);
   * ```
   */
  const processDailyRelationships = useCallback((cats: Cat[], day: number) => {
    if (cats.length >= 2 && Math.random() < 0.3) {
      const shuffled = [...cats].sort(() => Math.random() - 0.5);
      const cat1 = shuffled[0];
      const cat2 = shuffled[1];
      
      const compatibility = PERSONALITY_COMPATIBILITY[cat1.personality][cat2.personality];
      const isPositive = Math.random() < (0.5 + compatibility / 100);
      
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
  }, [addEvent]);

  /**
   * Detects social groups/cliques among cats using graph analysis
   * 
   * Analyzes the relationship network to find:
   * - **Friend groups**: Connected components of cats with score >= 20
   * - **Outcast groups**: Cats with no friends but have rivalries
   * 
   * Each group gets a fun name and a leader (cat with most connections).
   * 
   * @param {Cat[]} cats - All cats to analyze
   * 
   * @example
   * ```ts
   * // Call after relationships change
   * detectGroups(state.cats);
   * // Now `groups` state contains detected cliques
   * ```
   */
  const detectGroups = useCallback((cats: Cat[]) => {
    if (cats.length < 2) {
      setGroups([]);
      return;
    }

    const friendships = relationships.filter(r => r.score >= 20);
    const rivalries = relationships.filter(r => r.score <= -20);
    
    // Build adjacency list for friends
    const friendGraph: Record<string, Set<string>> = {};
    cats.forEach(c => { friendGraph[c.id] = new Set(); });
    
    friendships.forEach(r => {
      if (friendGraph[r.catId1] && friendGraph[r.catId2]) {
        friendGraph[r.catId1].add(r.catId2);
        friendGraph[r.catId2].add(r.catId1);
      }
    });

    // Find connected components (friend groups)
    const visited = new Set<string>();
    const newGroups: CatGroup[] = [];
    
    const dfs = (catId: string, group: string[]) => {
      if (visited.has(catId)) return;
      visited.add(catId);
      group.push(catId);
      friendGraph[catId]?.forEach(friendId => dfs(friendId, group));
    };

    cats.forEach(cat => {
      if (!visited.has(cat.id) && friendGraph[cat.id]?.size > 0) {
        const group: string[] = [];
        dfs(cat.id, group);
        
        if (group.length >= 2) {
          const leaderId = group.reduce((a, b) => 
            (friendGraph[a]?.size || 0) >= (friendGraph[b]?.size || 0) ? a : b
          );
          
          const groupNames = [
            'The Cozy Crew', 'Nap Squad', 'The Purr Pack', 'Whisker Gang',
            'Sunny Spot Club', 'The Cuddle Clique', 'Treat Team', 'Meow Mob'
          ];
          
          newGroups.push({
            id: generateId(),
            name: groupNames[newGroups.length % groupNames.length],
            memberIds: group,
            leaderCatId: leaderId,
            type: 'friendly',
          });
        }
      }
    });

    // Find outcasts (cats with no friends and mostly rivalries)
    const outcasts = cats.filter(cat => {
      const hasNoFriends = !friendships.some(r => r.catId1 === cat.id || r.catId2 === cat.id);
      const hasRivalries = rivalries.some(r => r.catId1 === cat.id || r.catId2 === cat.id);
      return hasNoFriends && hasRivalries;
    });

    if (outcasts.length >= 2) {
      newGroups.push({
        id: generateId(),
        name: 'The Loners',
        memberIds: outcasts.map(c => c.id),
        leaderCatId: outcasts[0].id,
        type: 'outcasts',
      });
    }

    setGroups(newGroups);
  }, [relationships]);

  /**
   * Processes relationship decay for neglected relationships
   * 
   * Relationships that haven't had recent interaction will decay:
   * - **Grace period**: No decay for first few days
   * - **Light decay**: Small score reduction after grace period
   * - **Moderate decay**: Medium reduction after longer neglect
   * - **Severe decay**: Large reduction for very neglected relationships
   * 
   * Relationships won't decay below a minimum score.
   * Level changes trigger visible events.
   * 
   * @param {Cat[]} cats - All cats (needed for event messages)
   * @param {number} currentDay - Current game day
   * 
   * @example
   * ```ts
   * // Call this when advancing to the next day
   * processRelationshipDecay(state.cats, state.day);
   * ```
   */
  const processRelationshipDecay = useCallback((cats: Cat[], currentDay: number) => {
    const decayMessages = [
      "{cat1} and {cat2} haven't spent time together lately...",
      "{cat1} seems to have forgotten about {cat2}...",
      "The bond between {cat1} and {cat2} is fading...",
      "{cat1} and {cat2} are growing apart...",
    ];

    setRelationships(prev => {
      const updatedRelationships: CatRelationship[] = [];
      const decayEvents: { cat1: Cat; cat2: Cat; oldLevel: string; newLevel: string; decay: number }[] = [];

      prev.forEach(rel => {
        const daysSinceInteraction = currentDay - rel.lastInteraction;
        
        if (daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS || 
            rel.score <= RELATIONSHIP_DECAY.MIN_DECAY_SCORE) {
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
          const cat1 = cats.find(c => c.id === rel.catId1);
          const cat2 = cats.find(c => c.id === rel.catId2);
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
        setEvents(e => [event, ...e].slice(0, 100));
        setLastEventId(eventId);
      });

      return updatedRelationships;
    });
  }, []);

  /**
   * Checks and updates the maintenance streak
   * 
   * A maintenance streak is earned when ALL friendships (score >= 20)
   * have been interacted with recently (within grace period).
   * Consecutive days of maintaining friendships build the streak.
   * 
   * @param {number} currentDay - Current game day
   * 
   * @example
   * ```ts
   * // Call this when advancing to the next day
   * checkMaintenanceStreak(state.day);
   * // Check maintenanceStreak and longestMaintenanceStreak for rewards
   * ```
   */
  const checkMaintenanceStreak = useCallback((currentDay: number) => {
    const friendships = relationships.filter(r => r.score >= 20);
    if (friendships.length === 0) return;
    
    const allMaintained = friendships.every(r => {
      const decayInfo = getDecayInfo(r, currentDay);
      return decayInfo.daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS;
    });
    
    if (allMaintained) {
      if (lastMaintenanceDay === currentDay - 1) {
        const newStreak = maintenanceStreak + 1;
        setMaintenanceStreak(newStreak);
        setLongestMaintenanceStreak(prev => Math.max(prev, newStreak));
      } else if (lastMaintenanceDay !== currentDay) {
        setMaintenanceStreak(1);
        setLongestMaintenanceStreak(prev => Math.max(prev, 1));
      }
      setLastMaintenanceDay(currentDay);
    } else {
      if (maintenanceStreak > 0) {
        setMaintenanceStreak(0);
      }
    }
  }, [relationships, maintenanceStreak, lastMaintenanceDay]);

  /**
   * Calculates a happiness modifier based on a cat's relationships
   * 
   * Cats with more friends are happier, cats with more enemies are sadder.
   * 
   * @param {string} catId - The cat's ID
   * @returns {number} Happiness modifier (positive or negative)
   * 
   * @example
   * ```ts
   * const modifier = getHappinessModifier(cat.id);
   * const adjustedHappiness = cat.happiness + modifier;
   * ```
   */
  const getHappinessModifier = useCallback((catId: string): number => {
    let modifier = 0;
    relationships.forEach(r => {
      if (r.catId1 === catId || r.catId2 === catId) {
        if (r.level === 'bestFriend') modifier += 5;
        else if (r.level === 'friend') modifier += 2;
        else if (r.level === 'rival') modifier -= 2;
        else if (r.level === 'enemy') modifier -= 5;
      }
    });
    return modifier;
  }, [relationships]);

  /**
   * Checks breeding compatibility between two cats
   * 
   * Relationship level affects breeding success:
   * - **Best Friends**: +20% stat bonus
   * - **Friends**: +10% health bonus
   * - **Neutral**: No bonus
   * - **Rivals**: 50% failure risk
   * - **Enemies**: Cannot breed at all
   * 
   * @param {string} cat1Id - First cat's ID
   * @param {string} cat2Id - Second cat's ID
   * @returns {BreedingCompatibility} Compatibility info
   * 
   * @example
   * ```ts
   * const compat = getBreedingCompatibility(cat1.id, cat2.id);
   * if (!compat.canBreed) {
   *   showError(compat.message); // "Enemies refuse to breed!"
   *   return;
   * }
   * if (compat.bonus > 0) {
   *   showBonus(compat.message); // "Best friends - +20% kitten stats!"
   * }
   * ```
   */
  const getBreedingCompatibility = useCallback((cat1Id: string, cat2Id: string): BreedingCompatibility => {
    const rel = getRelationship(cat1Id, cat2Id);
    if (!rel) return { canBreed: true, bonus: 0, message: 'Neutral - no relationship bonus' };
    
    switch (rel.level) {
      case 'enemy':
        return { canBreed: false, bonus: 0, message: 'Enemies refuse to breed!' };
      case 'rival':
        return { canBreed: true, bonus: -10, message: 'Rivals - 50% breeding failure risk' };
      case 'neutral':
        return { canBreed: true, bonus: 0, message: 'Neutral relationship' };
      case 'friend':
        return { canBreed: true, bonus: 10, message: 'Friends - +10% kitten health' };
      case 'bestFriend':
        return { canBreed: true, bonus: 20, message: 'Best friends - +20% kitten stats!' };
    }
  }, [getRelationship]);

  /**
   * Removes all relationships involving a specific cat
   * 
   * Call this when a cat is sold or otherwise removed from the game.
   * 
   * @param {string} catId - ID of the cat being removed
   * 
   * @example
   * ```ts
   * // When selling a cat
   * removeCatRelationships(soldCat.id);
   * ```
   */
  const removeCatRelationships = useCallback((catId: string) => {
    setRelationships(prev => prev.filter(r => r.catId1 !== catId && r.catId2 !== catId));
  }, []);

  /**
   * Loads relationship data from a save file
   * 
   * Restores all relationship state including streaks.
   * 
   * @param {RelationshipSaveData} data - Saved relationship data
   * 
   * @example
   * ```ts
   * const savedData = JSON.parse(localStorage.getItem('relationships'));
   * loadRelationships(savedData);
   * ```
   */
  const loadRelationships = useCallback((data: RelationshipSaveData) => {
    setRelationships(data.relationships || []);
    setEvents(data.events || []);
    setMaintenanceStreak(data.maintenanceStreak || 0);
    setLongestMaintenanceStreak(data.longestMaintenanceStreak || 0);
    setLastMaintenanceDay(data.lastMaintenanceDay ?? null);
  }, []);

  /**
   * Gets current relationship data for saving
   * 
   * Returns all data needed to restore relationship state.
   * 
   * @returns {RelationshipSaveData} All relationship data for persistence
   * 
   * @example
   * ```ts
   * const saveData = getRelationshipSaveData();
   * localStorage.setItem('relationships', JSON.stringify(saveData));
   * ```
   */
  const getRelationshipSaveData = useCallback((): RelationshipSaveData => ({
    relationships,
    events,
    maintenanceStreak,
    longestMaintenanceStreak,
    lastMaintenanceDay,
  }), [relationships, events, maintenanceStreak, longestMaintenanceStreak, lastMaintenanceDay]);

  return {
    /** All cat-to-cat relationships */
    relationships,
    /** History of relationship events */
    events,
    /** Detected social groups/cliques */
    groups,
    /** ID of most recent event (for animations) */
    lastEventId,
    /** Current consecutive maintenance days */
    maintenanceStreak,
    /** Best maintenance streak achieved */
    longestMaintenanceStreak,
    /** Get relationship between two cats */
    getRelationship,
    /** Update or create a relationship */
    updateRelationship,
    /** Add a relationship event */
    addEvent,
    /** Manually socialize two cats */
    socializeCats,
    /** Process daily random interactions */
    processDailyRelationships,
    /** Apply decay to neglected relationships */
    processRelationshipDecay,
    /** Check/update maintenance streak */
    checkMaintenanceStreak,
    /** Detect friend groups among cats */
    detectGroups,
    /** Get happiness modifier for a cat */
    getHappinessModifier,
    /** Check breeding compatibility */
    getBreedingCompatibility,
    /** Remove all relationships for a cat */
    removeCatRelationships,
    /** Load relationships from save */
    loadRelationships,
    /** Get data for saving */
    getRelationshipSaveData,
  };
}
