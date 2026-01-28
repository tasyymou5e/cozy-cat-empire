import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Cat, CatPersonality } from '@/types/game';
import { CatPosition, CatFacing, CatState, EmpireProp, AttractionZone } from '@/types/empire';
import { MOVEMENT_BOUNDS, MOVEMENT_TIMING } from '@/config/empire';

/**
 * Generate a random position within movement bounds
 */
function randomPosition(): { x: number; y: number } {
  return {
    x: MOVEMENT_BOUNDS.minX + Math.random() * (MOVEMENT_BOUNDS.maxX - MOVEMENT_BOUNDS.minX),
    y: MOVEMENT_BOUNDS.minY + Math.random() * (MOVEMENT_BOUNDS.maxY - MOVEMENT_BOUNDS.minY),
  };
}

/**
 * Generate a random interval between movements
 */
function randomInterval(): number {
  return MOVEMENT_TIMING.minInterval + Math.random() * (MOVEMENT_TIMING.maxInterval - MOVEMENT_TIMING.minInterval);
}

/**
 * Calculate facing direction based on movement
 */
function calculateFacing(oldX: number, newX: number): CatFacing {
  return newX > oldX ? 'right' : 'left';
}

/**
 * Map prop interaction type to cat state
 */
function propInteractionToState(interaction: EmpireProp['onInteract']): CatState {
  switch (interaction) {
    case 'sleep': return 'sleeping';
    case 'play': return 'playing';
    case 'perch': return 'perching';
    case 'hide': return 'idle'; // Hidden cats are still idle
    default: return 'idle';
  }
}

/**
 * Get weighted position considering furniture attraction
 */
function getWeightedPosition(
  currentPos: { x: number; y: number },
  attractionZones: AttractionZone[],
  catPersonality?: CatPersonality
): { x: number; y: number; nearPropId?: string; state?: CatState } {
  // 35% chance to move toward attractive furniture
  if (Math.random() < 0.35 && attractionZones.length > 0) {
    const preferredZones = attractionZones.filter(zone => {
      // Personality-based preferences
      if (catPersonality === 'lazy' && zone.behavior === 'sleep') return true;
      if (catPersonality === 'playful' && zone.behavior === 'play') return true;
      if (catPersonality === 'curious' && zone.behavior === 'perch') return true;
      if (catPersonality === 'affectionate' && zone.behavior === 'sunbathe') return true;
      // Random chance for other zones
      return Math.random() < 0.4;
    });

    if (preferredZones.length > 0) {
      const target = preferredZones[Math.floor(Math.random() * preferredZones.length)];
      const radius = target.radius * 0.5;
      return {
        x: Math.max(MOVEMENT_BOUNDS.minX, Math.min(MOVEMENT_BOUNDS.maxX, 
          target.center.x + (Math.random() - 0.5) * radius)),
        y: Math.max(MOVEMENT_BOUNDS.minY, Math.min(MOVEMENT_BOUNDS.maxY,
          target.center.y + (Math.random() - 0.5) * radius)),
        nearPropId: target.propId,
        state: target.behavior === 'sleep' ? 'sleeping' : 
               target.behavior === 'play' ? 'playing' :
               target.behavior === 'perch' ? 'perching' :
               target.behavior === 'sunbathe' ? 'sunbathing' : 'idle',
      };
    }
  }

  // Otherwise random position
  return randomPosition();
}

/**
 * Build attraction zones from props
 */
function buildAttractionZones(props: EmpireProp[]): AttractionZone[] {
  return props
    .filter(prop => prop.attractsCats && prop.attractionRadius)
    .map(prop => ({
      propId: prop.id,
      center: prop.position,
      radius: prop.attractionRadius!,
      behavior: prop.onInteract === 'sleep' ? 'sleep' :
                prop.onInteract === 'play' ? 'play' :
                prop.onInteract === 'perch' ? 'perch' : 'sunbathe',
    }));
}

/**
 * Hook to manage roaming cat positions and movements with prop attraction
 */
export function useRoamingCats(cats: Cat[], props: EmpireProp[] = []) {
  const [positions, setPositions] = useState<Map<string, CatPosition>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Build attraction zones from props
  const attractionZones = useMemo(() => buildAttractionZones(props), [props]);

  // Initialize positions for new cats
  useEffect(() => {
    setPositions((prev) => {
      const next = new Map(prev);
      let hasChanges = false;

      cats.forEach((cat) => {
        if (!next.has(cat.id)) {
          const pos = randomPosition();
          next.set(cat.id, {
            x: pos.x,
            y: pos.y,
            facing: Math.random() > 0.5 ? 'right' : 'left',
            state: 'idle',
          });
          hasChanges = true;
        }
      });

      // Remove positions for cats that no longer exist
      next.forEach((_, catId) => {
        if (!cats.find((c) => c.id === catId)) {
          next.delete(catId);
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  }, [cats]);

  // Move a specific cat to a new position
  const moveCat = useCallback((catId: string, personality?: CatPersonality) => {
    setPositions((prev) => {
      const current = prev.get(catId);
      if (!current) return prev;

      const weighted = getWeightedPosition(
        { x: current.x, y: current.y },
        attractionZones,
        personality
      );
      const facing = calculateFacing(current.x, weighted.x);

      const next = new Map(prev);
      next.set(catId, {
        ...current,
        x: weighted.x,
        y: weighted.y,
        facing,
        state: 'walking',
        targetX: weighted.x,
        targetY: weighted.y,
        nearPropId: weighted.nearPropId,
      });
      return next;
    });

    // Set state after transition completes
    setTimeout(() => {
      setPositions((prev) => {
        const current = prev.get(catId);
        if (!current || current.state !== 'walking') return prev;

        const next = new Map(prev);
        // If near a prop, use the attracted state
        const attractedState = current.nearPropId 
          ? attractionZones.find(z => z.propId === current.nearPropId)
          : null;
        
        next.set(catId, {
          ...current,
          state: attractedState 
            ? (attractedState.behavior === 'sleep' ? 'sleeping' :
               attractedState.behavior === 'play' ? 'playing' :
               attractedState.behavior === 'perch' ? 'perching' : 'idle')
            : 'idle',
          targetX: undefined,
          targetY: undefined,
        });
        return next;
      });
    }, MOVEMENT_TIMING.transitionDuration);
  }, [attractionZones]);

  // Schedule next movement for a cat
  const scheduleMovement = useCallback((catId: string, personality?: CatPersonality) => {
    // Clear existing timer
    const existingTimer = timersRef.current.get(catId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Cats at furniture stay longer
    const interval = randomInterval() * (positions.get(catId)?.nearPropId ? 1.5 : 1);

    const timer = setTimeout(() => {
      moveCat(catId, personality);
      scheduleMovement(catId, personality);
    }, interval);

    timersRef.current.set(catId, timer);
  }, [moveCat, positions]);

  // Start movement timers for all cats
  useEffect(() => {
    cats.forEach((cat) => {
      if (!timersRef.current.has(cat.id)) {
        // Add initial random delay so cats don't all move at once
        const initialDelay = Math.random() * MOVEMENT_TIMING.maxInterval;
        const timer = setTimeout(() => {
          moveCat(cat.id, cat.personality);
          scheduleMovement(cat.id, cat.personality);
        }, initialDelay);
        timersRef.current.set(cat.id, timer);
      }
    });

    // Cleanup timers for removed cats
    timersRef.current.forEach((timer, catId) => {
      if (!cats.find((c) => c.id === catId)) {
        clearTimeout(timer);
        timersRef.current.delete(catId);
      }
    });

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [cats, moveCat, scheduleMovement]);

  // Set cat to interacting state temporarily
  const setInteracting = useCallback((catId: string) => {
    setPositions((prev) => {
      const current = prev.get(catId);
      if (!current) return prev;

      const next = new Map(prev);
      next.set(catId, { ...current, state: 'interacting' });
      return next;
    });

    // Return to previous state after a short delay
    setTimeout(() => {
      setPositions((prev) => {
        const current = prev.get(catId);
        if (!current || current.state !== 'interacting') return prev;

        const next = new Map(prev);
        next.set(catId, { ...current, state: 'idle' });
        return next;
      });
    }, 1500);
  }, []);

  // Summon 1-3 cats to a specific prop when clicked
  const summonCatsToProp = useCallback((propId: string) => {
    const targetZone = attractionZones.find(z => z.propId === propId);
    const targetProp = props.find(p => p.id === propId);
    
    if (!targetZone && !targetProp) return { summonedCount: 0, catIds: [] };

    // Get position from zone or prop directly
    const targetPos = targetZone?.center ?? targetProp?.position;
    if (!targetPos) return { summonedCount: 0, catIds: [] };

    // Find available cats (not already at this prop, not interacting)
    const availableCatIds = Array.from(positions.entries())
      .filter(([_, pos]) => 
        pos.nearPropId !== propId && 
        pos.state !== 'interacting' &&
        pos.state !== 'walking'
      )
      .map(([id]) => id);

    if (availableCatIds.length === 0) return { summonedCount: 0, catIds: [] };

    // Summon 1-3 cats (random, but at most available cats)
    const summonCount = Math.min(
      Math.floor(Math.random() * 3) + 1,
      availableCatIds.length
    );

    // Shuffle and pick cats
    const shuffled = availableCatIds.sort(() => Math.random() - 0.5);
    const summonedIds = shuffled.slice(0, summonCount);

    // Determine target state based on prop interaction type
    const targetState: CatState = targetZone 
      ? (targetZone.behavior === 'sleep' ? 'sleeping' :
         targetZone.behavior === 'play' ? 'playing' :
         targetZone.behavior === 'perch' ? 'perching' : 'idle')
      : 'idle';

    // Move each summoned cat to the prop with slight offset
    setPositions((prev) => {
      const next = new Map(prev);
      
      summonedIds.forEach((catId, index) => {
        const current = prev.get(catId);
        if (!current) return;

        // Spread cats around the prop slightly
        const angleOffset = (index / summonCount) * Math.PI * 2;
        const spreadRadius = 5;
        const offsetX = Math.cos(angleOffset) * spreadRadius;
        const offsetY = Math.sin(angleOffset) * spreadRadius * 0.5;

        const newX = Math.max(MOVEMENT_BOUNDS.minX, 
          Math.min(MOVEMENT_BOUNDS.maxX, targetPos.x + offsetX));
        const newY = Math.max(MOVEMENT_BOUNDS.minY, 
          Math.min(MOVEMENT_BOUNDS.maxY, targetPos.y + offsetY));

        next.set(catId, {
          ...current,
          x: newX,
          y: newY,
          facing: calculateFacing(current.x, newX),
          state: 'walking',
          targetX: newX,
          targetY: newY,
          nearPropId: propId,
        });

        // Clear and reschedule movement timer for this cat
        const existingTimer = timersRef.current.get(catId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
      });

      return next;
    });

    // Transition to final state after walk completes
    setTimeout(() => {
      setPositions((prev) => {
        const next = new Map(prev);
        
        summonedIds.forEach((catId) => {
          const current = prev.get(catId);
          if (!current || current.state !== 'walking') return;

          next.set(catId, {
            ...current,
            state: targetState,
            targetX: undefined,
            targetY: undefined,
          });
        });

        return next;
      });

      // Reschedule movement for summoned cats (with longer delay since they're at furniture)
      summonedIds.forEach((catId) => {
        const cat = cats.find(c => c.id === catId);
        if (cat) {
          const timer = setTimeout(() => {
            moveCat(catId, cat.personality);
            scheduleMovement(catId, cat.personality);
          }, randomInterval() * 2); // Stay longer at summoned furniture
          timersRef.current.set(catId, timer);
        }
      });
    }, MOVEMENT_TIMING.transitionDuration);

    return { summonedCount: summonedIds.length, catIds: summonedIds };
  }, [attractionZones, props, positions, cats, moveCat, scheduleMovement]);

  return {
    positions,
    setInteracting,
    summonCatsToProp,
    attractionZones,
  };
}
