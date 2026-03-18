/**
 * @fileoverview useCatManagement - Cat lifecycle management domain hook
 *
 * Handles all cat-related CRUD operations:
 * - Adding new cats (by type or from market)
 * - Selling cats
 * - Renaming cats
 * - Comforting unhappy cats
 * - Receiving cats from gifts/trades
 * - Managing cat appearance and portraits
 * - Cat specializations and XP
 *
 * This hook manages the core cat lifecycle from acquisition to sale.
 *
 * @module hooks/game/useCatManagement
 */

import { useCallback } from 'react';
import { Cat, CAT_NAMES, BREEDS, PERSONALITIES, CAT_COSTS } from '@/types/game';
import { CatAppearance } from '@/types/catAppearance';
import { generateRandomGrade } from '@/types/grading';
import { SpecializationType } from '@/types/specializations';
import { getMasteryLevel } from '@/types/specializations';
import {
  GameHookDependencies,
  generateId,
  createDefaultTrickProgress,
  getRandomBreed,
} from './types';

/**
 * Actions available for cat management
 */
export interface CatManagementActions {
  /**
   * Add a new cat to the player's collection
   * @param type - 'stray' (free), 'adopted' ($50), or 'pure' ($200)
   */
  addCat: (type: Cat['type']) => void;

  /**
   * Buy a cat from the market
   * @param listingId - ID of the market listing
   */
  buyFromMarket: (listingId: string) => void;

  /**
   * Sell a cat (removes from collection, adds money)
   * @param catId - ID of the cat to sell
   */
  sellCat: (catId: string) => void;

  /**
   * Rename a cat (validates uniqueness and length)
   * @param catId - ID of the cat to rename
   * @param newName - New name (1-20 characters, unique)
   * @returns true if successful
   */
  renameCat: (catId: string, newName: string) => boolean;

  /**
   * Comfort an unhappy cat (+30 happiness, +5 health)
   * @param catId - ID of the cat to comfort
   */
  comfortCat: (catId: string) => void;

  /**
   * Add a cat received from gift or trade
   * @param cat - Cat object (will get new ID to avoid conflicts)
   */
  addReceivedCat: (cat: Cat) => void;

  /**
   * Update a cat's visual appearance
   * @param catId - ID of the cat
   * @param appearance - New appearance configuration
   */
  updateCatAppearance: (catId: string, appearance: CatAppearance) => void;

  /**
   * Update a cat's AI-generated portrait
   * @param catId - ID of the cat
   * @param portraitUrl - URL of the portrait
   * @param hash - Optional appearance hash for change detection
   */
  updateCatPortrait: (catId: string, portraitUrl: string, hash?: string) => void;

  /**
   * Set a specialization on a cat (one-time, permanent)
   * @param catId - ID of the cat to specialize
   * @param type - Specialization type
   */
  setSpecialization: (catId: string, type: SpecializationType) => void;

  /**
   * Add XP to a specialized cat
   * @param catId - ID of the cat
   * @param amount - XP to add
   */
  addSpecializationXP: (catId: string, amount: number) => void;

  /**
   * Update a cat with partial data (generic update)
   * @param catId - ID of the cat to update
   * @param updates - Partial cat data to merge
   */
  updateCat: (catId: string, updates: Partial<Cat>) => void;
}

/**
 * Hook for managing cat lifecycle operations.
 *
 * @param deps - Shared game hook dependencies
 * @returns Object containing all cat management actions
 *
 * @example
 * ```typescript
 * const { addCat, sellCat, renameCat } = useCatManagement(deps);
 *
 * // Add a new stray cat (free)
 * addCat('stray');
 *
 * // Rename a cat
 * if (renameCat('cat-123', 'Whiskers')) {
 *   console.log('Renamed successfully!');
 * }
 *
 * // Sell a cat
 * sellCat('cat-456');
 * ```
 */
export function useCatManagement(deps: GameHookDependencies): CatManagementActions {
  const { setState, showMessage, playSound, relationshipSystem, onChallengeProgress, createEventSnapshot } = deps;

  const addCat = useCallback(
    (type: Cat['type']) => {
      setState((prev) => {
        if (prev.cats.length >= prev.space) {
          showMessage('No space! Upgrade your home first. 🏠', 'warning');
          playSound?.('error');
          return prev;
        }
        const cost = CAT_COSTS[type];
        if (prev.money < cost) {
          showMessage('Not enough cat money! 💸', 'error');
          playSound?.('error');
          return prev;
        }

        const breed = getRandomBreed(type);
        const usedNames = new Set(prev.cats.map((c) => c.name));
        const availableNames = CAT_NAMES.filter((n) => !usedNames.has(n));
        const name =
          availableNames[Math.floor(Math.random() * availableNames.length)] ||
          `Cat ${prev.cats.length + 1}`;

        const newCat: Cat = {
          id: generateId(),
          type,
          breed,
          name,
          health: 100,
          happiness: 100,
          hunger: 50,
          value: BREEDS[breed].baseValue + Math.floor(Math.random() * 50),
          age: type === 'stray' ? Math.floor(Math.random() * 3) + 1 : 1,
          personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
          showWins: 0,
          isForSale: false,
          grade: generateRandomGrade(),
          tricksLearned: [],
          trickProgress: createDefaultTrickProgress(),
          restLevel: 100,
          feedingScore: 0,
          lastTrainingDay: 0,
        };

        showMessage(`Welcome ${name} the ${BREEDS[breed].name}! 🎉`, 'success');
        playSound?.('meow');
        onChallengeProgress?.('collect_cats', 1);

        // Create snapshot after adoption
        createEventSnapshot?.('cat_adopted', [name]);

        return {
          ...prev,
          money: prev.money - cost,
          cats: [...prev.cats, newCat],
          catsAdopted: prev.catsAdopted + 1,
        };
      });
    },
    [setState, showMessage, playSound, onChallengeProgress, createEventSnapshot]
  );

  const buyFromMarket = useCallback(
    (listingId: string) => {
      setState((prev) => {
        const listing = prev.marketListings.find((l) => l.id === listingId);
        if (!listing) return prev;

        if (prev.cats.length >= prev.space) {
          showMessage('No space! Upgrade your home first. 🏠', 'warning');
          playSound?.('error');
          return prev;
        }
        if (prev.money < listing.price) {
          showMessage('Not enough cat money! 💸', 'error');
          playSound?.('error');
          return prev;
        }

        const newCat = { ...listing.cat, id: generateId(), isForSale: false };
        showMessage(`Bought ${newCat.name} from ${listing.seller}! 🛒`, 'success');
        playSound?.('coin');
        playSound?.('meow');
        onChallengeProgress?.('collect_cats', 1);

        return {
          ...prev,
          money: prev.money - listing.price,
          cats: [...prev.cats, newCat],
          marketListings: prev.marketListings.filter((l) => l.id !== listingId),
          catsAdopted: prev.catsAdopted + 1,
        };
      });
    },
    [setState, showMessage, playSound, onChallengeProgress]
  );

  const sellCat = useCallback(
    (catId: string) => {
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) return prev;

        // Create snapshot BEFORE selling for recovery
        createEventSnapshot?.('cat_sold', [cat.name]);

        const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
        showMessage(`Goodbye ${cat.name}! Sold for $${sellPrice}. 👋`, 'info');
        playSound?.('coin');
        relationshipSystem.removeCatRelationships(catId);

        // Clean up costume association when cat is sold
        const newCatCostumes = { ...prev.catCostumes };
        delete newCatCostumes[catId];

        return {
          ...prev,
          money: prev.money + sellPrice,
          cats: prev.cats.filter((c) => c.id !== catId),
          catCostumes: newCatCostumes,
        };
      });
    },
    [setState, showMessage, playSound, relationshipSystem, createEventSnapshot]
  );

  const renameCat = useCallback(
    (catId: string, newName: string): boolean => {
      const trimmedName = newName.trim();
      if (!trimmedName || trimmedName.length > 20) {
        showMessage('Name must be 1-20 characters!', 'warning');
        playSound?.('error');
        return false;
      }

      let success = false;
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) return prev;

        // Check for duplicate names (case-insensitive)
        const isDuplicate = prev.cats.some(
          (c) => c.id !== catId && c.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          showMessage('Another cat already has this name!', 'warning');
          playSound?.('error');
          return prev;
        }

        showMessage(`${cat.name} is now called ${trimmedName}! ✏️`, 'success');
        playSound?.('success');
        success = true;
        return {
          ...prev,
          cats: prev.cats.map((c) => (c.id === catId ? { ...c, name: trimmedName } : c)),
        };
      });
      return success;
    },
    [setState, showMessage, playSound]
  );

  const comfortCat = useCallback(
    (catId: string) => {
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) return prev;

        showMessage(`You comforted ${cat.name}! 💕`, 'success');
        playSound?.('purr');
        return {
          ...prev,
          cats: prev.cats.map((c) =>
            c.id === catId
              ? {
                  ...c,
                  happiness: Math.min(100, c.happiness + 30),
                  health: Math.min(100, c.health + 5),
                }
              : c
          ),
        };
      });
    },
    [setState, showMessage, playSound]
  );

  const addReceivedCat = useCallback(
    (cat: Cat) => {
      setState((prev) => {
        if (prev.cats.length >= prev.space) {
          showMessage('No space for this cat!', 'error');
          return prev;
        }

        // Give cat a new ID to avoid conflicts
        const newCat = { ...cat, id: Date.now().toString() + Math.random().toString(36).slice(2) };
        showMessage(`${cat.name} has joined your family! 🎁`, 'success');
        playSound?.('success');

        return {
          ...prev,
          cats: [...prev.cats, newCat],
        };
      });
    },
    [setState, showMessage, playSound]
  );

  /** Add a recovered cat preserving its original ID (for orphan recovery) */
  const addRecoveredCat = useCallback(
    (cat: Cat) => {
      setState((prev) => {
        if (prev.cats.length >= prev.space) {
          showMessage('No space for this cat!', 'error');
          return prev;
        }

        // Check if a cat with this ID already exists
        if (prev.cats.some((c) => c.id === cat.id)) {
          showMessage(`${cat.name} is already in your collection!`, 'warning');
          return prev;
        }

        showMessage(`${cat.name} has been recovered! 🎉`, 'success');
        playSound?.('success');

        return {
          ...prev,
          cats: [...prev.cats, cat],
        };
      });
    },
    [setState, showMessage, playSound]
  );

  const updateCatAppearance = useCallback(
    (catId: string, appearance: CatAppearance) => {
      setState((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) => (cat.id === catId ? { ...cat, appearance } : cat)),
      }));
    },
    [setState]
  );

  const updateCatPortrait = useCallback(
    (catId: string, portraitUrl: string, hash?: string) => {
      setState((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId
            ? { ...cat, portraitUrl, portraitGeneratedAt: Date.now(), appearanceHash: hash }
            : cat
        ),
      }));
    },
    [setState]
  );

  const setSpecialization = useCallback(
    (catId: string, type: SpecializationType) => {
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat || cat.specialization) return prev; // Already specialized

        showMessage(`${cat.name} is now a ${type.replace('_', ' ')}! 🌟`, 'success');
        playSound?.('levelUp');

        return {
          ...prev,
          cats: prev.cats.map((c) =>
            c.id === catId
              ? {
                  ...c,
                  specialization: {
                    type,
                    level: 1,
                    xp: 0,
                    specializedAt: new Date().toISOString(),
                  },
                }
              : c
          ),
        };
      });
    },
    [setState, showMessage, playSound]
  );

  const addSpecializationXP = useCallback(
    (catId: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) => {
          if (cat.id !== catId || !cat.specialization) return cat;

          const newXP = cat.specialization.xp + amount;
          const newLevel = getMasteryLevel(newXP).level;

          return {
            ...cat,
            specialization: {
              ...cat.specialization,
              xp: newXP,
              level: newLevel,
            },
          };
        }),
      }));
    },
    [setState]
  );

  /**
   * Generic update for a cat's properties (used for prestige, etc.)
   */
  const updateCat = useCallback(
    (catId: string, updates: Partial<Cat>) => {
      setState((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId ? { ...cat, ...updates } : cat
        ),
      }));
    },
    [setState]
  );

  return {
    addCat,
    buyFromMarket,
    sellCat,
    renameCat,
    comfortCat,
    addReceivedCat,
    updateCatAppearance,
    updateCatPortrait,
    setSpecialization,
    addSpecializationXP,
    updateCat,
  };
}
