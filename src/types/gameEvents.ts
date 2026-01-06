import { ObjectiveType } from './dailyObjectives';
import { XPSource } from './battlePass';
import { CoopChallengeType } from './coopChallenges';
import { Resources } from './game';

/**
 * All game actions that can trigger side effects
 */
export type GameAction =
  | 'FEED_CATS'
  | 'FEED_SINGLE_CAT'
  | 'DO_CHORE'
  | 'BUY_RESOURCE'
  | 'USE_MEDICINE'
  | 'USE_TOYS'
  | 'COMFORT_CAT'
  | 'SELL_CAT'
  | 'TRAIN_CAT'
  | 'REST_CAT'
  | 'BREED_CATS'
  | 'SOCIALIZE_CATS'
  | 'GROUP_ACTIVITY'
  | 'CAT_SHOW';

/**
 * Payload types for each action
 */
export interface GameActionPayloads {
  FEED_CATS: void;
  FEED_SINGLE_CAT: { catId: string };
  DO_CHORE: { choreId: string; baseReward: number };
  BUY_RESOURCE: { resource: keyof Resources; cost: number };
  USE_MEDICINE: { catId: string };
  USE_TOYS: void;
  COMFORT_CAT: { catId: string };
  SELL_CAT: { catId: string };
  TRAIN_CAT: { catId: string; trickId: string };
  REST_CAT: { catId: string };
  BREED_CATS: { cat1Id: string; cat2Id: string };
  SOCIALIZE_CATS: { cat1Id: string; cat2Id: string };
  GROUP_ACTIVITY: { groupId: string; activityType: 'play' | 'treat' | 'nap' };
  CAT_SHOW: { tier?: string };
}

/**
 * Side effects configuration for each action
 */
export interface ActionSideEffects {
  objective?: ObjectiveType;
  battlePass?: XPSource;
  coop?: { type: CoopChallengeType; amount: number };
}

/**
 * Mapping of actions to their side effects
 */
export const ACTION_SIDE_EFFECTS: Record<GameAction, ActionSideEffects> = {
  FEED_CATS: {
    objective: 'feed_cats',
  },
  FEED_SINGLE_CAT: {
    objective: 'feed_cats',
  },
  DO_CHORE: {
    objective: 'complete_chore',
    battlePass: 'complete_chore',
  },
  BUY_RESOURCE: {
    objective: 'buy_resource',
  },
  USE_MEDICINE: {
    objective: 'heal_cat',
  },
  USE_TOYS: {
    // Playing with toys is a fun activity, could add objective later
  },
  COMFORT_CAT: {
    objective: 'comfort_cat',
  },
  SELL_CAT: {
    objective: 'sell_cat',
  },
  TRAIN_CAT: {
    objective: 'train_cat',
    battlePass: 'train_trick',
    coop: { type: 'combined_training', amount: 1 },
  },
  REST_CAT: {
    // Resting doesn't have objectives/battlepass effects currently
  },
  BREED_CATS: {
    objective: 'breed_kitten',
    battlePass: 'breed_kitten',
    coop: { type: 'combined_breeding', amount: 1 },
  },
  SOCIALIZE_CATS: {
    objective: 'socialize',
    battlePass: 'socialize',
    coop: { type: 'combined_socializing', amount: 1 },
  },
  GROUP_ACTIVITY: {
    objective: 'socialize',
    battlePass: 'socialize',
    coop: { type: 'combined_socializing', amount: 1 },
  },
  CAT_SHOW: {
    objective: 'win_show',
    battlePass: 'win_show',
    coop: { type: 'combined_show_wins', amount: 1 },
  },
};
