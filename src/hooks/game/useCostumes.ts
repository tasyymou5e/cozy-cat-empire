/**
 * @fileoverview useCostumes - Costume management domain hook
 *
 * Handles cat costume purchasing and equipping:
 * - Buying costumes from the shop
 * - Equipping costumes to cats
 * - Unequipping costumes from cats
 *
 * Costumes are purely cosmetic and persist in game state.
 *
 * @module hooks/game/useCostumes
 */

import { useCallback } from 'react';
import { getCostumeById } from '@/types/costumes';
import { GameHookDependencies } from './types';

/**
 * Actions available for costume management
 */
export interface CostumeActions {
  /**
   * Purchase a costume from the shop.
   * Costume is added to ownedCostumes and can be equipped to any cat.
   * @param costumeId - ID of the costume to purchase
   */
  buyCostume: (costumeId: string) => void;

  /**
   * Equip or unequip a costume on a cat.
   * @param catId - ID of the cat
   * @param costumeId - ID of costume to equip, or null to unequip
   */
  equipCostume: (catId: string, costumeId: string | null) => void;
}

/**
 * Hook for managing cat costumes.
 *
 * @param deps - Shared game hook dependencies
 * @returns Object containing costume management actions
 *
 * @example
 * ```typescript
 * const { buyCostume, equipCostume } = useCostumes(deps);
 *
 * // Buy a costume
 * buyCostume('party-hat');
 *
 * // Equip it to a cat
 * equipCostume('cat-123', 'party-hat');
 *
 * // Remove the costume
 * equipCostume('cat-123', null);
 * ```
 */
export function useCostumes(deps: GameHookDependencies): CostumeActions {
  const { setState, showMessage, playSound, createEventSnapshot } = deps;

  const buyCostume = useCallback(
    (costumeId: string) => {
      const costume = getCostumeById(costumeId);
      if (!costume) {
        showMessage('Costume not found!', 'error');
        return;
      }

      setState((prev) => {
        // Check if already owned
        if (prev.ownedCostumes.includes(costumeId)) {
          showMessage('You already own this costume!', 'warning');
          return prev;
        }

        // Check if can afford
        if (prev.money < costume.price) {
          showMessage('Not enough money!', 'error');
          playSound?.('error');
          return prev;
        }

        showMessage(`Bought ${costume.name}! ${costume.emoji}`, 'success');
        playSound?.('coin');

        // Create snapshot after purchase
        createEventSnapshot?.('purchase', [costume.name]);

        return {
          ...prev,
          money: prev.money - costume.price,
          ownedCostumes: [...prev.ownedCostumes, costumeId],
        };
      });
    },
    [setState, showMessage, playSound, createEventSnapshot]
  );

  const equipCostume = useCallback(
    (catId: string, costumeId: string | null) => {
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) {
          showMessage('Cat not found!', 'error');
          return prev;
        }

        const newCatCostumes = { ...prev.catCostumes };

        if (costumeId === null) {
          // Unequip costume
          delete newCatCostumes[catId];
          showMessage(`Removed ${cat.name}'s costume.`, 'info');
        } else {
          // Validate costume exists
          const costume = getCostumeById(costumeId);
          if (!costume) {
            showMessage('Invalid costume!', 'error');
            playSound?.('error');
            return prev;
          }

          // Validate costume is owned
          if (!prev.ownedCostumes.includes(costumeId)) {
            showMessage("You don't own this costume!", 'error');
            playSound?.('error');
            return prev;
          }

          newCatCostumes[catId] = costumeId;
          showMessage(`${cat.name} is now wearing ${costume.name}! ${costume.emoji}`, 'success');
        }

        return {
          ...prev,
          catCostumes: newCatCostumes,
        };
      });
    },
    [setState, showMessage, playSound]
  );

  return { buyCostume, equipCostume };
}
