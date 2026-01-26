import { useState, useEffect, useCallback, useRef } from 'react';
import { Cat } from '@/types/game';
import { CatPosition, CatFacing } from '@/types/empire';
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
 * Hook to manage roaming cat positions and movements
 */
export function useRoamingCats(cats: Cat[]) {
  const [positions, setPositions] = useState<Map<string, CatPosition>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
  const moveCat = useCallback((catId: string) => {
    setPositions((prev) => {
      const current = prev.get(catId);
      if (!current) return prev;

      const newPos = randomPosition();
      const facing = calculateFacing(current.x, newPos.x);

      const next = new Map(prev);
      next.set(catId, {
        ...current,
        x: newPos.x,
        y: newPos.y,
        facing,
        state: 'walking',
        targetX: newPos.x,
        targetY: newPos.y,
      });
      return next;
    });

    // Set state back to idle after transition completes
    setTimeout(() => {
      setPositions((prev) => {
        const current = prev.get(catId);
        if (!current || current.state !== 'walking') return prev;

        const next = new Map(prev);
        next.set(catId, {
          ...current,
          state: 'idle',
          targetX: undefined,
          targetY: undefined,
        });
        return next;
      });
    }, MOVEMENT_TIMING.transitionDuration);
  }, []);

  // Schedule next movement for a cat
  const scheduleMovement = useCallback((catId: string) => {
    // Clear existing timer
    const existingTimer = timersRef.current.get(catId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      moveCat(catId);
      scheduleMovement(catId); // Schedule next movement
    }, randomInterval());

    timersRef.current.set(catId, timer);
  }, [moveCat]);

  // Start movement timers for all cats
  useEffect(() => {
    cats.forEach((cat) => {
      if (!timersRef.current.has(cat.id)) {
        // Add initial random delay so cats don't all move at once
        const initialDelay = Math.random() * MOVEMENT_TIMING.maxInterval;
        const timer = setTimeout(() => {
          moveCat(cat.id);
          scheduleMovement(cat.id);
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

    // Return to idle after a short delay
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

  return {
    positions,
    setInteracting,
  };
}
