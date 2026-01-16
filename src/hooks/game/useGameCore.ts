/**
 * @fileoverview useGameCore - Core game mechanics domain hook
 *
 * Handles fundamental game operations:
 * - Completing chores for money
 * - Housing upgrades (apartment → house → mansion → farm)
 * - Day advancement with daily updates
 * - Daily event processing
 * - Money operations
 *
 * @module hooks/game/useGameCore
 */

import { useCallback } from 'react';
import { HOUSE_UPGRADES } from '@/types/game';
import { getRandomDailyEvent, DailyEvent } from '@/types/dailyEvents';
import { GameHookDependencies, generateMarketListings } from './types';

/**
 * Actions available for core game mechanics
 */
export interface GameCoreActions {
  /**
   * Complete a chore to earn money.
   * @param choreId - ID of the chore type
   * @param baseReward - Base coin reward (random bonus added)
   */
  doChore: (choreId: string, baseReward: number) => void;

  /**
   * Upgrade housing to increase cat capacity.
   * Progression: apartment (5) → house (10) → mansion (25) → farm (50+)
   */
  upgradeHouse: () => void;

  /**
   * Advance to the next day.
   * Processes: hunger decrease, health/happiness changes, relationship decay,
   * cooldown reductions, market refresh (every 3 days).
   */
  nextDay: () => void;

  /**
   * Process a random daily event.
   * Events can affect money, reputation, resources, and cat stats.
   */
  processDailyEvent: () => void;

  /** Clear the current daily event display */
  clearDailyEvent: () => void;

  /** Dismiss the current message */
  dismissMessage: () => void;

  /**
   * Safely deduct money with validation.
   * @param amount - Amount to deduct
   * @param reason - Reason shown in message
   * @returns true if successful
   */
  deductMoney: (amount: number, reason: string) => boolean;

  /**
   * Set money directly (for backend sync).
   * @param newMoney - New money value
   */
  setMoney: (newMoney: number) => void;
}

/**
 * Extended dependencies for core game mechanics
 */
export interface GameCoreDependencies extends GameHookDependencies {
  /** Setter for current daily event */
  setCurrentDailyEvent: React.Dispatch<React.SetStateAction<DailyEvent | null>>;
  /** Setter for message text */
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Hook for core game mechanics.
 *
 * @param deps - Extended game hook dependencies
 * @returns Object containing core game actions
 *
 * @example
 * ```typescript
 * const { doChore, upgradeHouse, nextDay } = useGameCore(deps);
 *
 * // Complete a chore
 * doChore('clean', 15);
 *
 * // Upgrade house
 * upgradeHouse();
 *
 * // Advance to next day
 * nextDay();
 * ```
 */
export function useGameCore(deps: GameCoreDependencies): GameCoreActions {
  const {
    state,
    setState,
    showMessage,
    playSound,
    relationshipSystem,
    checkAchievements,
    onChallengeProgress,
    setCurrentDailyEvent,
    setMessage,
  } = deps;

  const doChore = useCallback(
    (choreId: string, baseReward: number) => {
      const bonus = Math.floor(Math.random() * 20);
      const earnings = baseReward + bonus;
      setState((prev) => {
        // Some chores also boost cat happiness
        const happinessBoost = choreId === 'play' || choreId === 'socialize';
        return {
          ...prev,
          money: prev.money + earnings,
          cats: happinessBoost
            ? prev.cats.map((cat) => ({
                ...cat,
                happiness: Math.min(100, cat.happiness + 5),
              }))
            : prev.cats,
        };
      });
      showMessage(`Chore done! Earned $${earnings}. 🧹`, 'success');
      playSound?.('coin');
      onChallengeProgress?.('earn_money', earnings);
    },
    [setState, showMessage, playSound, onChallengeProgress]
  );

  const upgradeHouse = useCallback(() => {
    setState((prev) => {
      // Farm expansion (after reaching farm level)
      if (prev.houseSize === 'farm') {
        if (prev.acres >= 100) {
          showMessage('Your farm is at maximum size! 🌾', 'info');
          return prev;
        }
        const cost = 5000 * (prev.acres + 1);
        if (prev.money < cost) {
          showMessage(`Need $${cost} to expand farm! 💰`, 'warning');
          playSound?.('error');
          return prev;
        }
        showMessage(`Farm expanded to ${prev.acres + 1} acres! 🚜`, 'success');
        playSound?.('levelUp');
        return { ...prev, money: prev.money - cost, acres: prev.acres + 1, space: prev.space + 20 };
      }

      // Regular house upgrades
      const upgrade = HOUSE_UPGRADES[prev.houseSize];
      if (!upgrade.next) return prev;

      if (prev.money < upgrade.cost) {
        showMessage(`Need $${upgrade.cost} to upgrade! 💰`, 'warning');
        playSound?.('error');
        return prev;
      }

      const newHouse = upgrade.next;
      showMessage(`Upgraded to ${newHouse}! 🎊`, 'success');
      playSound?.('levelUp');
      return {
        ...prev,
        money: prev.money - upgrade.cost,
        houseSize: newHouse,
        space: upgrade.space,
        acres: newHouse === 'farm' ? 1 : 0,
      };
    });
  }, [setState, showMessage, playSound]);

  const nextDay = useCallback(() => {
    setState((prev) => {
      const deadCats: string[] = [];

      // Process daily cat stat changes
      const updatedCats = prev.cats
        .map((cat) => {
          const baseHappiness = Math.max(0, cat.happiness - 3);
          const hunger = Math.max(0, cat.hunger - 10);
          let health = cat.health;
          let happiness = baseHappiness;

          // Relationships affect happiness
          const relationshipMod = relationshipSystem.getHappinessModifier(cat.id);
          happiness = Math.max(0, Math.min(100, happiness + relationshipMod));

          // Low hunger and happiness damage health
          if (hunger < 30) {
            health -= 5;
            happiness -= 5;
          }
          if (happiness < 40) health -= 3;

          health = Math.max(0, health);
          happiness = Math.max(0, happiness);

          return {
            ...cat,
            health,
            happiness,
            hunger,
            age: cat.age + 0.01,
            restLevel: Math.max(0, cat.restLevel - 5),
          };
        })
        .filter((cat) => {
          // Remove dead cats
          if (cat.health <= 0) {
            deadCats.push(cat.name);
            relationshipSystem.removeCatRelationships(cat.id);
            return false;
          }
          return true;
        });

      // Process relationship system
      relationshipSystem.processDailyRelationships(updatedCats, prev.day + 1);
      relationshipSystem.processRelationshipDecay(updatedCats, prev.day + 1);
      relationshipSystem.detectGroups(updatedCats);

      // Refresh market every 3 days
      const newMarket = prev.day % 3 === 0 ? generateMarketListings() : prev.marketListings;
      const newBreedingCooldown = Math.max(0, prev.breedingCooldown - 1);
      const newShowCooldown = Math.max(0, prev.showCooldown - 1);

      // Show appropriate day message
      if (deadCats.length > 0) {
        showMessage(
          `Day ${prev.day + 1}. Sadly, ${deadCats.join(', ')} passed away... 😢`,
          'error'
        );
      } else if (newShowCooldown === 0 && prev.showCooldown > 0) {
        showMessage(`Day ${prev.day + 1}! 🎪 Cat show is available today!`, 'success');
      } else {
        showMessage(`Day ${prev.day + 1} begins! ☀️`, 'info');
      }
      playSound?.('nextDay');

      const newState = {
        ...prev,
        day: prev.day + 1,
        cats: updatedCats,
        marketListings: newMarket,
        breedingCooldown: newBreedingCooldown,
        showCooldown: newShowCooldown,
      };
      return checkAchievements(newState);
    });
  }, [setState, showMessage, playSound, relationshipSystem, checkAchievements]);

  const processDailyEvent = useCallback(() => {
    const event = getRandomDailyEvent(state.day);
    if (!event) return;

    setCurrentDailyEvent(event);
    playSound?.('dailyEvent');

    setState((prev) => {
      const newState = { ...prev };

      // Apply event effects
      if (event.moneyChange) {
        newState.money = Math.max(0, newState.money + event.moneyChange);
      }
      if (event.reputationChange) {
        newState.reputation += event.reputationChange;
      }
      if (event.resourceChange) {
        newState.resources = {
          food: Math.max(0, newState.resources.food + (event.resourceChange.food || 0)),
          medicine: Math.max(0, newState.resources.medicine + (event.resourceChange.medicine || 0)),
          toys: Math.max(0, newState.resources.toys + (event.resourceChange.toys || 0)),
          treats: Math.max(0, newState.resources.treats + (event.resourceChange.treats || 0)),
        };
      }
      if (event.catEffect) {
        newState.cats = newState.cats.map((cat) => ({
          ...cat,
          health: Math.max(0, Math.min(100, cat.health + (event.catEffect?.healthChange || 0))),
          happiness: Math.max(
            0,
            Math.min(100, cat.happiness + (event.catEffect?.happinessChange || 0))
          ),
          hunger: Math.max(0, Math.min(100, cat.hunger + (event.catEffect?.hungerChange || 0))),
        }));
      }

      return newState;
    });
  }, [state.day, playSound, setState, setCurrentDailyEvent]);

  const clearDailyEvent = useCallback(() => {
    setCurrentDailyEvent(null);
  }, [setCurrentDailyEvent]);

  const dismissMessage = useCallback(() => {
    setMessage('');
  }, [setMessage]);

  const deductMoney = useCallback(
    (amount: number, reason: string): boolean => {
      let success = false;
      setState((prev) => {
        if (prev.money < amount) {
          showMessage('Not enough money!', 'warning');
          playSound?.('error');
          return prev;
        }
        showMessage(`Spent $${amount.toLocaleString()} on ${reason}`, 'info');
        playSound?.('coin');
        success = true;
        return {
          ...prev,
          money: prev.money - amount,
        };
      });
      return success;
    },
    [setState, showMessage, playSound]
  );

  const setMoney = useCallback(
    (newMoney: number) => {
      setState((prev) => ({
        ...prev,
        money: newMoney,
      }));
    },
    [setState]
  );

  return {
    doChore,
    upgradeHouse,
    nextDay,
    processDailyEvent,
    clearDailyEvent,
    dismissMessage,
    deductMoney,
    setMoney,
  };
}
