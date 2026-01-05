import { Cat } from './game';

export interface LegacyCat {
  id: string;
  cat: Cat;
  retiredAt: number; // game day
  retiredDate: string; // ISO date
  achievements: LegacyAchievement[];
  legacyBonus: number; // percentage bonus (0.01 = 1%)
  legacyTrait: LegacyTrait;
}

export type LegacyAchievement = 
  | 'show_champion'    // 20+ show wins
  | 'perfect_grade'    // Grade 18+
  | 'elder'            // Age 100+ days
  | 'trick_master'     // All 5 tricks learned
  | 'legendary';       // All of the above

export type LegacyTrait = 
  | 'show_lineage'     // +2 grade for kittens
  | 'healthy_genes'    // +10% starting health for kittens
  | 'quick_learner'    // +20% training speed for kittens
  | 'social_nature'    // +5 starting relationship score
  | 'golden_legacy';   // All bonuses combined

export interface RetirementRequirements {
  minShowWins: number;
  minGrade: number;
  minAge: number;
  minTricks: number;
}

export const RETIREMENT_REQUIREMENTS: RetirementRequirements = {
  minShowWins: 20,
  minGrade: 18,
  minAge: 100,
  minTricks: 5,
};

export interface RetirementEligibility {
  isEligible: boolean;
  meetsShowWins: boolean;
  meetsGrade: boolean;
  meetsAge: boolean;
  meetsTricks: boolean;
  achievementCount: number;
}

export function checkRetirementEligibility(cat: Cat): RetirementEligibility {
  const meetsShowWins = cat.showWins >= RETIREMENT_REQUIREMENTS.minShowWins;
  const meetsGrade = cat.grade >= RETIREMENT_REQUIREMENTS.minGrade;
  const meetsAge = cat.age >= RETIREMENT_REQUIREMENTS.minAge;
  const meetsTricks = (cat.tricksLearned?.length || 0) >= RETIREMENT_REQUIREMENTS.minTricks;
  
  const achievements = [meetsShowWins, meetsGrade, meetsAge, meetsTricks];
  const achievementCount = achievements.filter(Boolean).length;
  
  // Need at least 2 achievements to retire
  const isEligible = achievementCount >= 2;
  
  return {
    isEligible,
    meetsShowWins,
    meetsGrade,
    meetsAge,
    meetsTricks,
    achievementCount,
  };
}

export function determineLegacyTrait(eligibility: RetirementEligibility): LegacyTrait {
  const { meetsShowWins, meetsGrade, meetsAge, meetsTricks, achievementCount } = eligibility;
  
  // All 4 achievements = golden legacy
  if (achievementCount === 4) return 'golden_legacy';
  
  // Prioritize based on what they achieved
  if (meetsShowWins && meetsGrade) return 'show_lineage';
  if (meetsTricks) return 'quick_learner';
  if (meetsAge) return 'healthy_genes';
  if (meetsShowWins) return 'social_nature';
  
  return 'healthy_genes'; // default
}

export function calculateLegacyBonus(eligibility: RetirementEligibility): number {
  // 1% base + 0.5% per achievement
  return 0.01 + (eligibility.achievementCount * 0.005);
}

export const LEGACY_TRAIT_INFO: Record<LegacyTrait, { name: string; description: string; emoji: string }> = {
  show_lineage: {
    name: 'Show Lineage',
    description: '+2 starting grade for kittens',
    emoji: '🏆',
  },
  healthy_genes: {
    name: 'Healthy Genes',
    description: '+10% starting health for kittens',
    emoji: '💚',
  },
  quick_learner: {
    name: 'Quick Learner',
    description: '+20% training speed for kittens',
    emoji: '🎓',
  },
  social_nature: {
    name: 'Social Nature',
    description: '+5 starting relationship score',
    emoji: '💕',
  },
  golden_legacy: {
    name: 'Golden Legacy',
    description: 'All bonuses combined!',
    emoji: '👑',
  },
};

export const LEGACY_ACHIEVEMENT_INFO: Record<LegacyAchievement, { name: string; emoji: string }> = {
  show_champion: { name: 'Show Champion', emoji: '🥇' },
  perfect_grade: { name: 'Perfect Grade', emoji: '⭐' },
  elder: { name: 'Wise Elder', emoji: '🧙' },
  trick_master: { name: 'Trick Master', emoji: '🎪' },
  legendary: { name: 'Legendary', emoji: '👑' },
};
