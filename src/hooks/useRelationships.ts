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

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * useRelationships - Cat relationship management system
 * 
 * Manages social relationships between cats including friendships, rivalries,
 * group detection, compatibility checks, and daily relationship events.
 * Now includes maintenance streak tracking for relationship upkeep.
 */
export function useRelationships() {
  const [relationships, setRelationships] = useState<CatRelationship[]>([]);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [groups, setGroups] = useState<CatGroup[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  
  // Maintenance streak state
  const [maintenanceStreak, setMaintenanceStreak] = useState(0);
  const [longestMaintenanceStreak, setLongestMaintenanceStreak] = useState(0);
  const [lastMaintenanceDay, setLastMaintenanceDay] = useState<number | null>(null);

  // Get relationship between two cats
  const getRelationship = useCallback((catId1: string, catId2: string): CatRelationship | null => {
    return relationships.find(
      r => (r.catId1 === catId1 && r.catId2 === catId2) ||
           (r.catId1 === catId2 && r.catId2 === catId1)
    ) || null;
  }, [relationships]);

  // Update or create relationship
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

  // Add event to history
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
    setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
    setLastEventId(eventId); // Trigger animation
    updateRelationship(cat1.id, cat2.id, scoreChange, day);
  }, [updateRelationship]);

  // Socialize two cats manually
  const socializeCats = useCallback((cat1: Cat, cat2: Cat, day: number): { success: boolean; message: string } => {
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

  // Process daily relationship changes
  const processDailyRelationships = useCallback((cats: Cat[], day: number) => {
    // Small random interactions between cats
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

  // Detect social groups/cliques using graph analysis
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
          // Find leader (most connections)
          const leaderId = group.reduce((a, b) => 
            (friendGraph[a]?.size || 0) >= (friendGraph[b]?.size || 0) ? a : b
          );
          const leaderCat = cats.find(c => c.id === leaderId);
          
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

  // Process relationship decay for inactive relationships
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
        
        // No decay during grace period or for relationships already at minimum
        if (daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS || 
            rel.score <= RELATIONSHIP_DECAY.MIN_DECAY_SCORE) {
          updatedRelationships.push(rel);
          return;
        }

        // Calculate decay amount based on days since last interaction
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

        // Track level changes for events
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

      // Add decay events after updating relationships
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

  // Check and update maintenance streak
  const checkMaintenanceStreak = useCallback((currentDay: number) => {
    const friendships = relationships.filter(r => r.score >= 20);
    if (friendships.length === 0) return;
    
    // All friendships must have been interacted with in last 3 days
    const allMaintained = friendships.every(r => {
      const decayInfo = getDecayInfo(r, currentDay);
      return decayInfo.daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS;
    });
    
    if (allMaintained) {
      if (lastMaintenanceDay === currentDay - 1) {
        // Consecutive day
        const newStreak = maintenanceStreak + 1;
        setMaintenanceStreak(newStreak);
        setLongestMaintenanceStreak(prev => Math.max(prev, newStreak));
      } else if (lastMaintenanceDay !== currentDay) {
        // First day or streak broken and restarted
        setMaintenanceStreak(1);
        setLongestMaintenanceStreak(prev => Math.max(prev, 1));
      }
      setLastMaintenanceDay(currentDay);
    } else {
      // Streak broken
      if (maintenanceStreak > 0) {
        setMaintenanceStreak(0);
      }
    }
  }, [relationships, maintenanceStreak, lastMaintenanceDay]);

  // Get happiness modifier from relationships
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

  // Check breeding compatibility
  const getBreedingCompatibility = useCallback((cat1Id: string, cat2Id: string): {
    canBreed: boolean;
    bonus: number;
    message: string;
  } => {
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

  // Clean up relationships when cat is removed
  const removeCatRelationships = useCallback((catId: string) => {
    setRelationships(prev => prev.filter(r => r.catId1 !== catId && r.catId2 !== catId));
  }, []);

  // Load relationships from save
  const loadRelationships = useCallback((data: {
    relationships: CatRelationship[];
    events: RelationshipEvent[];
    maintenanceStreak?: number;
    longestMaintenanceStreak?: number;
    lastMaintenanceDay?: number | null;
  }) => {
    setRelationships(data.relationships || []);
    setEvents(data.events || []);
    setMaintenanceStreak(data.maintenanceStreak || 0);
    setLongestMaintenanceStreak(data.longestMaintenanceStreak || 0);
    setLastMaintenanceDay(data.lastMaintenanceDay ?? null);
  }, []);

  // Get save data
  const getRelationshipSaveData = useCallback(() => ({
    relationships,
    events,
    maintenanceStreak,
    longestMaintenanceStreak,
    lastMaintenanceDay,
  }), [relationships, events, maintenanceStreak, longestMaintenanceStreak, lastMaintenanceDay]);

  return {
    relationships,
    events,
    groups,
    lastEventId,
    maintenanceStreak,
    longestMaintenanceStreak,
    getRelationship,
    updateRelationship,
    addEvent,
    socializeCats,
    processDailyRelationships,
    processRelationshipDecay,
    checkMaintenanceStreak,
    detectGroups,
    getHappinessModifier,
    getBreedingCompatibility,
    removeCatRelationships,
    loadRelationships,
    getRelationshipSaveData,
  };
}
