export type TrickId = 'sit' | 'paw' | 'rollOver' | 'jump' | 'fetch';

export interface Trick {
  id: TrickId;
  name: string;
  emoji: string;
  difficulty: number; // 1-5
  gradeBonus: number;
}

export const TRICKS: Trick[] = [
  { id: 'sit', name: 'Sit', emoji: '🪑', difficulty: 1, gradeBonus: 0.5 },
  { id: 'paw', name: 'Give Paw', emoji: '🐾', difficulty: 2, gradeBonus: 0.75 },
  { id: 'rollOver', name: 'Roll Over', emoji: '🔄', difficulty: 3, gradeBonus: 1 },
  { id: 'jump', name: 'Jump', emoji: '⬆️', difficulty: 4, gradeBonus: 1.25 },
  { id: 'fetch', name: 'Fetch', emoji: '🎾', difficulty: 5, gradeBonus: 1.5 },
];

export interface GradeStats {
  baseGrade: number; // Initial grade 1-20
  feedingBonus: number; // From regular feeding
  trickBonus: number; // From learned tricks
  restBonus: number; // From being well-rested
  ageBonus: number; // Bonus for being 60+ days old
  showBonus: number; // From show wins
}

// Weighted random for initial grade
export const GRADE_WEIGHTS = [
  { min: 1, max: 5, weight: 35 },   // Common
  { min: 6, max: 10, weight: 35 },  // Common
  { min: 11, max: 14, weight: 20 }, // Uncommon
  { min: 15, max: 17, weight: 8 },  // Rare
  { min: 18, max: 19, weight: 1.8 }, // Very Rare
  { min: 20, max: 20, weight: 0.2 }, // Ultra Rare
];

export function generateRandomGrade(): number {
  const totalWeight = GRADE_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const bracket of GRADE_WEIGHTS) {
    if (random < bracket.weight) {
      return bracket.min + Math.floor(Math.random() * (bracket.max - bracket.min + 1));
    }
    random -= bracket.weight;
  }
  return 1;
}

export function getGradeTier(grade: number): 'common' | 'uncommon' | 'rare' | 'veryRare' | 'ultraRare' {
  if (grade >= 20) return 'ultraRare';
  if (grade >= 18) return 'veryRare';
  if (grade >= 15) return 'rare';
  if (grade >= 8) return 'uncommon';
  return 'common';
}

export function getGradeColor(grade: number): string {
  const tier = getGradeTier(grade);
  switch (tier) {
    case 'ultraRare': return 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500';
    case 'veryRare': return 'text-yellow-500';
    case 'rare': return 'text-purple-500';
    case 'uncommon': return 'text-blue-500';
    default: return 'text-muted-foreground';
  }
}

export function getGradeBorderClass(grade: number): string {
  const tier = getGradeTier(grade);
  switch (tier) {
    case 'ultraRare': return 'border-2 animate-rainbow-glow';
    case 'veryRare': return 'border-2 border-yellow-400 animate-golden-glow';
    case 'rare': return 'border-2 border-purple-400 animate-purple-glow';
    case 'uncommon': return 'border-2 border-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.35)] hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.5)]';
    default: return 'border border-border';
  }
}

export function getGradeGlowClass(grade: number): string {
  const tier = getGradeTier(grade);
  switch (tier) {
    case 'ultraRare': 
      return 'shadow-[0_0_30px_8px_rgba(236,72,153,0.6)] hover:shadow-[0_0_40px_12px_rgba(236,72,153,0.8)]';
    case 'veryRare': 
      return 'shadow-[0_0_25px_6px_rgba(234,179,8,0.5)] hover:shadow-[0_0_35px_10px_rgba(234,179,8,0.7)]';
    case 'rare': 
      return 'shadow-[0_0_20px_4px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_8px_rgba(168,85,247,0.6)]';
    case 'uncommon': 
      return 'shadow-[0_0_15px_2px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_4px_rgba(59,130,246,0.5)]';
    default: 
      return '';
  }
}

export function getGradeStars(grade: number): number {
  if (grade >= 20) return 5;
  if (grade >= 16) return 4;
  if (grade >= 12) return 3;
  if (grade >= 8) return 2;
  if (grade >= 4) return 1;
  return 0;
}

export const MIN_SHOW_GRADE = 8;
export const MAX_GRADE_AGE = 60; // Days for full age bonus
export const MAX_GRADE = 20;
