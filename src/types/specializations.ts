import { Cat } from './game';

export type SpecializationType = 'show_star' | 'social_butterfly' | 'dynasty_builder';

export interface Specialization {
  id: SpecializationType;
  name: string;
  emoji: string;
  description: string;
  color: string;
  bonuses: SpecializationBonus[];
  requirements: SpecializationRequirement;
}

export interface SpecializationBonus {
  type: string;
  value: number;
  description: string;
}

export interface SpecializationRequirement {
  minGrade: number;
  additionalRequirement?: {
    type: 'show_wins' | 'relationships' | 'kittens';
    value: number;
    description: string;
  };
}

export interface CatSpecialization {
  catId: string;
  specialization: SpecializationType;
  level: number; // 1-3 mastery levels
  xp: number;
  specializedAt: string; // ISO date
}

export const SPECIALIZATION_MIN_GRADE = 12;

export const SPECIALIZATIONS: Record<SpecializationType, Specialization> = {
  show_star: {
    id: 'show_star',
    name: 'Show Star',
    emoji: '🌟',
    description: 'Masters of the show ring, earning more prizes and glory',
    color: 'amber',
    bonuses: [
      { type: 'show_score', value: 15, description: '+15% show score' },
      { type: 'show_money', value: 25, description: '+25% show prize money' },
      { type: 'reputation', value: 10, description: '+10% reputation gain' },
    ],
    requirements: {
      minGrade: SPECIALIZATION_MIN_GRADE,
      additionalRequirement: {
        type: 'show_wins',
        value: 5,
        description: '5+ show wins',
      },
    },
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    emoji: '🦋',
    description: 'Natural charmers who build friendships easily',
    color: 'pink',
    bonuses: [
      { type: 'relationship_gain', value: 50, description: '+50% relationship gain' },
      { type: 'group_bonus', value: 20, description: '+20% group activity bonus' },
      { type: 'happiness', value: 10, description: '+10 daily happiness' },
    ],
    requirements: {
      minGrade: SPECIALIZATION_MIN_GRADE,
      additionalRequirement: {
        type: 'relationships',
        value: 3,
        description: '3+ friendships',
      },
    },
  },
  dynasty_builder: {
    id: 'dynasty_builder',
    name: 'Dynasty Builder',
    emoji: '👑',
    description: 'Legendary parents who produce exceptional kittens',
    color: 'purple',
    bonuses: [
      { type: 'kitten_grade', value: 3, description: '+3 kitten starting grade' },
      { type: 'kitten_health', value: 15, description: '+15% kitten health' },
      { type: 'breeding_success', value: 20, description: '+20% breeding success' },
    ],
    requirements: {
      minGrade: SPECIALIZATION_MIN_GRADE,
      additionalRequirement: {
        type: 'kittens',
        value: 2,
        description: '2+ kittens bred',
      },
    },
  },
};

export const MASTERY_LEVELS = [
  { level: 1, name: 'Novice', xpRequired: 0, bonusMultiplier: 1.0 },
  { level: 2, name: 'Adept', xpRequired: 100, bonusMultiplier: 1.5 },
  { level: 3, name: 'Master', xpRequired: 300, bonusMultiplier: 2.0 },
];

export interface SpecializationEligibility {
  isEligible: boolean;
  meetsGrade: boolean;
  meetsAdditional: boolean;
  eligiblePaths: SpecializationType[];
}

export function checkSpecializationEligibility(
  cat: Cat,
  friendshipCount: number,
  kittenCount: number
): SpecializationEligibility {
  const meetsGrade = cat.grade >= SPECIALIZATION_MIN_GRADE;

  const eligiblePaths: SpecializationType[] = [];

  // Check Show Star
  if (meetsGrade && cat.showWins >= 5) {
    eligiblePaths.push('show_star');
  }

  // Check Social Butterfly
  if (meetsGrade && friendshipCount >= 3) {
    eligiblePaths.push('social_butterfly');
  }

  // Check Dynasty Builder
  if (meetsGrade && kittenCount >= 2) {
    eligiblePaths.push('dynasty_builder');
  }

  return {
    isEligible: eligiblePaths.length > 0,
    meetsGrade,
    meetsAdditional: eligiblePaths.length > 0,
    eligiblePaths,
  };
}

export function getMasteryLevel(xp: number): (typeof MASTERY_LEVELS)[number] {
  for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_LEVELS[i].xpRequired) {
      return MASTERY_LEVELS[i];
    }
  }
  return MASTERY_LEVELS[0];
}

export function getNextMasteryLevel(xp: number): (typeof MASTERY_LEVELS)[number] | null {
  const current = getMasteryLevel(xp);
  const nextIndex = MASTERY_LEVELS.findIndex((l) => l.level === current.level) + 1;
  return nextIndex < MASTERY_LEVELS.length ? MASTERY_LEVELS[nextIndex] : null;
}
