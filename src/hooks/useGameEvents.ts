import { useCallback } from 'react';
import { 
  GameAction, 
  GameActionPayloads, 
  ACTION_SIDE_EFFECTS 
} from '@/types/gameEvents';
import { ObjectiveType } from '@/types/dailyObjectives';
import { XPSource } from '@/types/battlePass';
import { CoopChallengeType } from '@/types/coopChallenges';
import { Resources } from '@/types/game';

/**
 * Configuration for the game events hook
 */
interface UseGameEventsConfig {
  actions: {
    feedCats: () => void;
    doChore: (choreId: string, baseReward: number) => void;
    buyResource: (resource: keyof Resources, cost: number) => void;
    useMedicine: (catId: string) => void;
    comfortCat: (catId: string) => void;
    sellCat: (catId: string) => void;
    trainCat: (catId: string, trickId: string) => void;
    breedCats: (cat1Id: string, cat2Id: string) => void;
    socializeCats: (cat1Id: string, cat2Id: string) => void;
    catShow: (tier?: string) => void;
  };
  trackObjective: (type: ObjectiveType, amount?: number) => void;
  addBattlePassXP: (source: XPSource) => void;
  updateCoopProgress: (type: CoopChallengeType, amount: number) => void;
}

/**
 * Centralized game action dispatcher with automatic side effects.
 * 
 * Replaces individual wrapped handlers with a single `dispatchAction` function
 * that executes the core action and applies all configured side effects automatically.
 * 
 * @example
 * ```tsx
 * const { dispatchAction } = useGameEvents({ actions, trackObjective, addBattlePassXP, updateCoopProgress });
 * 
 * // Instead of: wrappedTrainCat(catId, trickId)
 * dispatchAction('TRAIN_CAT', { catId, trickId });
 * ```
 */
export function useGameEvents(config: UseGameEventsConfig) {
  const { actions, trackObjective, addBattlePassXP, updateCoopProgress } = config;

  /**
   * Execute a game action and automatically apply all side effects
   */
  const dispatchAction = useCallback(<A extends GameAction>(
    action: A,
    payload?: GameActionPayloads[A]
  ) => {
    // 1. Execute the core game action
    switch (action) {
      case 'FEED_CATS':
        actions.feedCats();
        break;
      case 'DO_CHORE': {
        const p = payload as GameActionPayloads['DO_CHORE'];
        actions.doChore(p.choreId, p.baseReward);
        break;
      }
      case 'BUY_RESOURCE': {
        const p = payload as GameActionPayloads['BUY_RESOURCE'];
        actions.buyResource(p.resource, p.cost);
        break;
      }
      case 'USE_MEDICINE': {
        const p = payload as GameActionPayloads['USE_MEDICINE'];
        actions.useMedicine(p.catId);
        break;
      }
      case 'COMFORT_CAT': {
        const p = payload as GameActionPayloads['COMFORT_CAT'];
        actions.comfortCat(p.catId);
        break;
      }
      case 'SELL_CAT': {
        const p = payload as GameActionPayloads['SELL_CAT'];
        actions.sellCat(p.catId);
        break;
      }
      case 'TRAIN_CAT': {
        const p = payload as GameActionPayloads['TRAIN_CAT'];
        actions.trainCat(p.catId, p.trickId);
        break;
      }
      case 'BREED_CATS': {
        const p = payload as GameActionPayloads['BREED_CATS'];
        actions.breedCats(p.cat1Id, p.cat2Id);
        break;
      }
      case 'SOCIALIZE_CATS': {
        const p = payload as GameActionPayloads['SOCIALIZE_CATS'];
        actions.socializeCats(p.cat1Id, p.cat2Id);
        break;
      }
      case 'CAT_SHOW': {
        const p = payload as GameActionPayloads['CAT_SHOW'];
        actions.catShow(p?.tier);
        break;
      }
    }

    // 2. Apply all side effects from the mapping
    const effects = ACTION_SIDE_EFFECTS[action];
    
    if (effects.objective) {
      trackObjective(effects.objective);
    }
    
    if (effects.battlePass) {
      addBattlePassXP(effects.battlePass);
    }
    
    if (effects.coop) {
      updateCoopProgress(effects.coop.type, effects.coop.amount);
    }
  }, [actions, trackObjective, addBattlePassXP, updateCoopProgress]);

  return { dispatchAction };
}
