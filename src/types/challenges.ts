export type ChallengeType = 
  | 'show_wins' 
  | 'breed_kittens' 
  | 'train_tricks' 
  | 'earn_money' 
  | 'collect_cats' 
  | 'socialize';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  challenge_type: ChallengeType;
  target_value: number;
  reward_coins: number;
  reward_badge: string | null;
  starts_at: string;
  ends_at: string;
  difficulty: ChallengeDifficulty;
  is_active: boolean;
  created_at: string;
}

export interface PlayerChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  created_at: string;
}

export interface ChallengeWithProgress extends WeeklyChallenge {
  progress?: PlayerChallengeProgress;
}

export const CHALLENGE_TEMPLATES: Omit<WeeklyChallenge, 'id' | 'starts_at' | 'ends_at' | 'is_active' | 'created_at'>[] = [
  // Easy challenges
  {
    name: "Show Starter",
    description: "Win cat shows to prove your cats are the best!",
    emoji: "🏆",
    challenge_type: "show_wins",
    target_value: 3,
    reward_coins: 500,
    reward_badge: "Show Novice",
    difficulty: "easy"
  },
  {
    name: "Kitten Keeper",
    description: "Breed adorable kittens to grow your cat family",
    emoji: "🐱",
    challenge_type: "breed_kittens",
    target_value: 2,
    reward_coins: 400,
    reward_badge: null,
    difficulty: "easy"
  },
  {
    name: "Trick Trainer",
    description: "Teach your cats new tricks",
    emoji: "🎪",
    challenge_type: "train_tricks",
    target_value: 5,
    reward_coins: 350,
    reward_badge: null,
    difficulty: "easy"
  },
  {
    name: "Cat Collector",
    description: "Add new cats to your collection",
    emoji: "📦",
    challenge_type: "collect_cats",
    target_value: 2,
    reward_coins: 300,
    reward_badge: null,
    difficulty: "easy"
  },
  // Medium challenges
  {
    name: "Champion Circuit",
    description: "Dominate the cat show circuit with multiple wins",
    emoji: "🥇",
    challenge_type: "show_wins",
    target_value: 7,
    reward_coins: 1000,
    reward_badge: "Show Champion",
    difficulty: "medium"
  },
  {
    name: "Breeding Master",
    description: "Become a skilled cat breeder",
    emoji: "💕",
    challenge_type: "breed_kittens",
    target_value: 5,
    reward_coins: 800,
    reward_badge: "Breeder",
    difficulty: "medium"
  },
  {
    name: "Performance Pro",
    description: "Train your cats to perform many tricks",
    emoji: "⭐",
    challenge_type: "train_tricks",
    target_value: 12,
    reward_coins: 750,
    reward_badge: null,
    difficulty: "medium"
  },
  {
    name: "Money Maker",
    description: "Earn coins through various activities",
    emoji: "💰",
    challenge_type: "earn_money",
    target_value: 2000,
    reward_coins: 600,
    reward_badge: null,
    difficulty: "medium"
  },
  {
    name: "Social Butterfly",
    description: "Help your cats make friends through socializing",
    emoji: "🤝",
    challenge_type: "socialize",
    target_value: 10,
    reward_coins: 700,
    reward_badge: null,
    difficulty: "medium"
  },
  // Hard challenges
  {
    name: "Show Legend",
    description: "Prove your cats are legendary show champions",
    emoji: "👑",
    challenge_type: "show_wins",
    target_value: 15,
    reward_coins: 2000,
    reward_badge: "Show Legend",
    difficulty: "hard"
  },
  {
    name: "Cat Empire",
    description: "Build a large collection of cats",
    emoji: "🏰",
    challenge_type: "collect_cats",
    target_value: 8,
    reward_coins: 1500,
    reward_badge: "Cat Lord",
    difficulty: "hard"
  },
  {
    name: "Kitten Kingdom",
    description: "Breed many kittens to expand your dynasty",
    emoji: "🍼",
    challenge_type: "breed_kittens",
    target_value: 10,
    reward_coins: 1800,
    reward_badge: "Master Breeder",
    difficulty: "hard"
  },
  // Expert challenges
  {
    name: "Ultimate Champion",
    description: "Achieve ultimate mastery of cat shows",
    emoji: "🌟",
    challenge_type: "show_wins",
    target_value: 25,
    reward_coins: 5000,
    reward_badge: "Ultimate Champion",
    difficulty: "expert"
  },
  {
    name: "Tycoon",
    description: "Amass a fortune in the cat business",
    emoji: "💎",
    challenge_type: "earn_money",
    target_value: 10000,
    reward_coins: 3000,
    reward_badge: "Cat Tycoon",
    difficulty: "expert"
  }
];
