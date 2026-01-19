/**
 * @fileoverview Breeding Matchmaking Algorithm
 *
 * Implements a sophisticated matchmaking system that evaluates breeding pairs
 * based on multiple factors to suggest optimal combinations.
 *
 * Factors considered:
 * 1. Genetics (breed rarity, value potential)
 * 2. Grades (parent grades affect kitten quality)
 * 3. Relationship scores (compatibility bonuses)
 * 4. Personality compatibility
 * 5. Health and age eligibility
 */

import { Cat, BREEDS, CatBreed } from '@/types/game';
import {
  CatRelationship,
  getRelationshipLevel,
  PERSONALITY_COMPATIBILITY,
  RelationshipLevel,
} from '@/types/relationships';

/**
 * Detailed breeding match suggestion with scoring breakdown
 */
export interface BreedingMatch {
  cat1: Cat;
  cat2: Cat;
  /** Overall match score (0-100) */
  overallScore: number;
  /** Individual scoring factors */
  scores: {
    genetics: number;
    grades: number;
    relationship: number;
    personality: number;
    health: number;
  };
  /** Whether breeding is possible */
  canBreed: boolean;
  /** Estimated kitten quality (grade range) */
  estimatedKittenGrade: { min: number; max: number; expected: number };
  /** Estimated kitten value range */
  estimatedKittenValue: { min: number; max: number };
  /** Human-readable match reason */
  matchReason: string;
  /** Match quality tier */
  tier: 'legendary' | 'excellent' | 'good' | 'average' | 'poor';
  /** Relationship level between cats */
  relationshipLevel: RelationshipLevel | 'none';
  /** Relationship bonus percentage */
  relationshipBonus: number;
}

/**
 * Breed synergy bonus for certain combinations
 * Some breeds complement each other genetically
 */
const BREED_SYNERGY: Partial<Record<CatBreed, CatBreed[]>> = {
  persian: ['ragdoll', 'british-shorthair'],
  siamese: ['bengal', 'maine-coon'],
  'maine-coon': ['ragdoll', 'siamese'],
  bengal: ['siamese', 'tabby'],
  ragdoll: ['persian', 'maine-coon'],
  'british-shorthair': ['persian', 'tabby'],
  tabby: ['bengal', 'british-shorthair'],
  stray: ['tabby'],
};

/**
 * Calculate genetics score based on breed rarity and synergy
 */
function calculateGeneticsScore(cat1: Cat, cat2: Cat): number {
  const breed1 = BREEDS[cat1.breed];
  const breed2 = BREEDS[cat2.breed];

  // Base score from average rarity (higher rarity = better genetics)
  const avgRarity = (breed1.rarity + breed2.rarity) / 2;
  let score = (avgRarity / 6) * 60; // Max 60 from rarity

  // Synergy bonus
  const synergies1 = BREED_SYNERGY[cat1.breed] || [];
  const synergies2 = BREED_SYNERGY[cat2.breed] || [];
  if (synergies1.includes(cat2.breed) || synergies2.includes(cat1.breed)) {
    score += 25; // Synergy bonus
  }

  // Diversity bonus (different breeds)
  if (cat1.breed !== cat2.breed) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Calculate grade score based on parent grades
 */
function calculateGradeScore(cat1: Cat, cat2: Cat): number {
  const avgGrade = (cat1.grade + cat2.grade) / 2;
  const maxGrade = Math.max(cat1.grade, cat2.grade);
  const minGrade = Math.min(cat1.grade, cat2.grade);

  // Base score from average grade (out of 20)
  let score = (avgGrade / 20) * 70;

  // Bonus for high max grade
  if (maxGrade >= 15) score += 15;
  else if (maxGrade >= 10) score += 10;

  // Penalty for large grade gap (genetic instability)
  const gradeGap = maxGrade - minGrade;
  if (gradeGap > 10) score -= 15;
  else if (gradeGap > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate relationship score
 */
function calculateRelationshipScore(
  cat1Id: string,
  cat2Id: string,
  relationships: CatRelationship[]
): { score: number; level: RelationshipLevel | 'none'; bonus: number } {
  const rel = relationships.find(
    (r) =>
      (r.catId1 === cat1Id && r.catId2 === cat2Id) || (r.catId1 === cat2Id && r.catId2 === cat1Id)
  );

  if (!rel) {
    return { score: 50, level: 'none', bonus: 0 };
  }

  const level = getRelationshipLevel(rel.score);

  switch (level) {
    case 'bestFriend':
      return { score: 100, level, bonus: 20 };
    case 'friend':
      return { score: 80, level, bonus: 10 };
    case 'neutral':
      return { score: 50, level, bonus: 0 };
    case 'rival':
      return { score: 30, level, bonus: -10 };
    case 'enemy':
      return { score: 0, level, bonus: -100 }; // Cannot breed
    default:
      return { score: 50, level: 'neutral', bonus: 0 };
  }
}

/**
 * Calculate personality compatibility score
 */
function calculatePersonalityScore(cat1: Cat, cat2: Cat): number {
  const compatibility = PERSONALITY_COMPATIBILITY[cat1.personality]?.[cat2.personality] ?? 0;

  // Convert from -10 to +20 range to 0-100
  return Math.max(0, Math.min(100, ((compatibility + 10) / 30) * 100));
}

/**
 * Calculate health score based on current stats
 */
function calculateHealthScore(cat1: Cat, cat2: Cat): number {
  const avgHealth = (cat1.health + cat2.health) / 2;
  const avgHappiness = (cat1.happiness + cat2.happiness) / 2;
  const minAge = Math.min(cat1.age, cat2.age);

  let score = (avgHealth / 100) * 40 + (avgHappiness / 100) * 30;

  // Age bonus for mature cats
  if (minAge >= 5) score += 20;
  else if (minAge >= 2) score += 10;

  // Rest level consideration
  const avgRest = (cat1.restLevel + cat2.restLevel) / 2;
  score += (avgRest / 100) * 10;

  return Math.min(100, score);
}

/**
 * Estimate kitten grade based on parents
 */
function estimateKittenGrade(
  cat1: Cat,
  cat2: Cat,
  relationshipBonus: number
): { min: number; max: number; expected: number } {
  const avgGrade = (cat1.grade + cat2.grade) / 2;
  const bonusFromRelationship = relationshipBonus > 0 ? Math.floor(relationshipBonus / 10) : 0;

  const expected = Math.round(avgGrade + bonusFromRelationship);
  const variance = 2;

  return {
    min: Math.max(1, expected - variance),
    max: Math.min(20, expected + variance),
    expected: Math.max(1, Math.min(20, expected)),
  };
}

/**
 * Estimate kitten value based on parents
 */
function estimateKittenValue(
  cat1: Cat,
  cat2: Cat,
  relationshipBonus: number
): { min: number; max: number } {
  const breed1Value = BREEDS[cat1.breed].baseValue;
  const breed2Value = BREEDS[cat2.breed].baseValue;
  const avgValue = (breed1Value + breed2Value) / 2;

  const bonusMultiplier = 1 + relationshipBonus / 100;
  const baseValue = avgValue * bonusMultiplier;

  return {
    min: Math.round(baseValue * 0.8),
    max: Math.round(baseValue * 1.3),
  };
}

/**
 * Determine match tier based on overall score
 */
function getMatchTier(score: number): BreedingMatch['tier'] {
  if (score >= 85) return 'legendary';
  if (score >= 70) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
}

/**
 * Generate match reason based on top factors
 */
function generateMatchReason(scores: BreedingMatch['scores'], cat1: Cat, cat2: Cat): string {
  const factors: { name: string; score: number }[] = [
    { name: 'genetics', score: scores.genetics },
    { name: 'grades', score: scores.grades },
    { name: 'relationship', score: scores.relationship },
    { name: 'personality', score: scores.personality },
    { name: 'health', score: scores.health },
  ];

  factors.sort((a, b) => b.score - a.score);
  const topFactor = factors[0];

  switch (topFactor.name) {
    case 'genetics':
      return `Excellent genetic match! ${BREEDS[cat1.breed].name} × ${BREEDS[cat2.breed].name} synergy.`;
    case 'grades':
      return `High-quality parents (Grade ${cat1.grade} × ${cat2.grade}) promise talented kittens.`;
    case 'relationship':
      return `Strong bond between ${cat1.name} & ${cat2.name} boosts kitten stats.`;
    case 'personality':
      return `${cat1.personality} and ${cat2.personality} personalities complement perfectly.`;
    case 'health':
      return `Both cats in prime condition for healthy kittens.`;
    default:
      return `Good overall compatibility.`;
  }
}

/**
 * Calculate a comprehensive breeding match between two cats
 */
export function calculateBreedingMatch(
  cat1: Cat,
  cat2: Cat,
  relationships: CatRelationship[]
): BreedingMatch {
  const genetics = calculateGeneticsScore(cat1, cat2);
  const grades = calculateGradeScore(cat1, cat2);
  const { score: relationship, level: relationshipLevel, bonus } = calculateRelationshipScore(
    cat1.id,
    cat2.id,
    relationships
  );
  const personality = calculatePersonalityScore(cat1, cat2);
  const health = calculateHealthScore(cat1, cat2);

  const scores = { genetics, grades, relationship, personality, health };

  // Weighted average for overall score
  const weights = { genetics: 0.25, grades: 0.3, relationship: 0.2, personality: 0.15, health: 0.1 };
  const overallScore =
    genetics * weights.genetics +
    grades * weights.grades +
    relationship * weights.relationship +
    personality * weights.personality +
    health * weights.health;

  const canBreed = relationshipLevel !== 'enemy' && cat1.health >= 60 && cat2.health >= 60;

  return {
    cat1,
    cat2,
    overallScore: Math.round(overallScore),
    scores,
    canBreed,
    estimatedKittenGrade: estimateKittenGrade(cat1, cat2, bonus),
    estimatedKittenValue: estimateKittenValue(cat1, cat2, bonus),
    matchReason: generateMatchReason(scores, cat1, cat2),
    tier: getMatchTier(overallScore),
    relationshipLevel,
    relationshipBonus: bonus,
  };
}

/**
 * Find optimal breeding matches for all eligible cats
 *
 * @param cats - All cats owned by the player
 * @param relationships - All cat relationships
 * @param limit - Maximum number of suggestions to return
 * @returns Sorted array of breeding matches (best first)
 */
export function findOptimalBreedingMatches(
  cats: Cat[],
  relationships: CatRelationship[],
  limit: number = 10
): BreedingMatch[] {
  // Filter eligible cats (healthy adults)
  const eligibleCats = cats.filter((c) => c.health >= 60 && c.age >= 1);

  if (eligibleCats.length < 2) return [];

  const matches: BreedingMatch[] = [];

  // Calculate all possible pairs
  for (let i = 0; i < eligibleCats.length; i++) {
    for (let j = i + 1; j < eligibleCats.length; j++) {
      const match = calculateBreedingMatch(eligibleCats[i], eligibleCats[j], relationships);
      if (match.canBreed) {
        matches.push(match);
      }
    }
  }

  // Sort by overall score (descending)
  matches.sort((a, b) => b.overallScore - a.overallScore);

  return matches.slice(0, limit);
}

/**
 * Get tier color class for UI styling
 */
export function getTierColorClass(tier: BreedingMatch['tier']): string {
  switch (tier) {
    case 'legendary':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    case 'excellent':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
    case 'good':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    case 'average':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    case 'poor':
      return 'text-muted-foreground bg-muted/50 border-muted';
  }
}

/**
 * Get tier emoji for display
 */
export function getTierEmoji(tier: BreedingMatch['tier']): string {
  switch (tier) {
    case 'legendary':
      return '🌟';
    case 'excellent':
      return '💎';
    case 'good':
      return '✨';
    case 'average':
      return '👍';
    case 'poor':
      return '😐';
  }
}
