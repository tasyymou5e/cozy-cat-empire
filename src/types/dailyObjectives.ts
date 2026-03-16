export type ObjectiveType =
  | 'feed_cats'
  | 'win_show'
  | 'socialize'
  | 'train_cat'
  | 'sell_cat'
  | 'buy_resource'
  | 'comfort_cat'
  | 'heal_cat'
  | 'breed_kitten'
  | 'complete_chore';

export interface ObjectiveDefinition {
  id: ObjectiveType;
  name: string;
  description: string;
  emoji: string;
  targetRange: [number, number]; // min-max for random target
  rewardRange: [number, number]; // min-max coin reward
}

export interface DailyObjective {
  id: string;
  type: ObjectiveType;
  name: string;
  description: string;
  emoji: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
}

export interface DailyObjectivesState {
  objectives: DailyObjective[];
  lastRefreshed: string; // ISO date string
  allCompletedBonus: number;
  bonusClaimed: boolean;
}

export const OBJECTIVE_DEFINITIONS: ObjectiveDefinition[] = [
  {
    id: 'feed_cats',
    name: 'Feeding Time',
    description: 'Feed your cats',
    emoji: '🍖',
    targetRange: [2, 5],
    rewardRange: [30, 60],
  },
  {
    id: 'win_show',
    name: 'Show Star',
    description: 'Win cat shows',
    emoji: '🏆',
    targetRange: [1, 3],
    rewardRange: [75, 150],
  },
  {
    id: 'socialize',
    name: 'Social Hour',
    description: 'Socialize cat pairs',
    emoji: '💕',
    targetRange: [2, 4],
    rewardRange: [40, 80],
  },
  {
    id: 'train_cat',
    name: 'Training Day',
    description: 'Complete training sessions',
    emoji: '🎓',
    targetRange: [1, 3],
    rewardRange: [50, 100],
  },
  {
    id: 'sell_cat',
    name: 'Cat Trader',
    description: 'Sell cats',
    emoji: '💰',
    targetRange: [1, 2],
    rewardRange: [40, 80],
  },
  {
    id: 'buy_resource',
    name: 'Stock Up',
    description: 'Purchase resources',
    emoji: '🛒',
    targetRange: [3, 6],
    rewardRange: [25, 50],
  },
  {
    id: 'comfort_cat',
    name: 'Comfort Zone',
    description: 'Comfort unhappy cats',
    emoji: '🤗',
    targetRange: [1, 3],
    rewardRange: [35, 70],
  },
  {
    id: 'heal_cat',
    name: 'Doctor Care',
    description: 'Heal sick cats',
    emoji: '💊',
    targetRange: [1, 2],
    rewardRange: [45, 90],
  },
  {
    id: 'breed_kitten',
    name: 'New Life',
    description: 'Breed kittens',
    emoji: '🍼',
    targetRange: [1, 2],
    rewardRange: [80, 150],
  },
  {
    id: 'complete_chore',
    name: 'Busy Bee',
    description: 'Complete chores',
    emoji: '🧹',
    targetRange: [2, 4],
    rewardRange: [35, 70],
  },
];

/**
 * Generate daily objectives with difficulty scaling based on player day
 */
export function generateDailyObjectives(count: number = 3, playerDay: number = 1): DailyObjective[] {
  // Scale factor: 1.0 at day 1, up to 2.5 at day 100+
  const scaleFactor = 1 + Math.min(playerDay / 100, 1.5);

  const shuffled = [...OBJECTIVE_DEFINITIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((def, index) => {
    const baseTarget = Math.floor(
      Math.random() * (def.targetRange[1] - def.targetRange[0] + 1) + def.targetRange[0]
    );
    const target = Math.max(1, Math.round(baseTarget * scaleFactor));

    const baseReward = Math.floor(
      Math.random() * (def.rewardRange[1] - def.rewardRange[0] + 1) + def.rewardRange[0]
    );
    const reward = Math.round(baseReward * scaleFactor);

    return {
      id: `${def.id}_${Date.now()}_${index}`,
      type: def.id,
      name: def.name,
      description: `${def.description} (${target}x)`,
      emoji: def.emoji,
      target,
      progress: 0,
      reward,
      completed: false,
    };
  });
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
