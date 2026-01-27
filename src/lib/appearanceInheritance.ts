/**
 * @fileoverview Appearance inheritance for kitten creation
 *
 * Generates kitten appearances based on parent genetics with
 * realistic trait inheritance and mutation mechanics.
 *
 * @module lib/appearanceInheritance
 */

import { Cat } from '@/types/game';
import {
  CatAppearance,
  FurColor,
  FurPattern,
  EyeColor,
  HairLength,
  FacialFeature,
  FUR_COLORS,
  PATTERNS,
  EYE_COLORS,
  HAIR_LENGTHS,
  FACIAL_FEATURES,
  generateDefaultAppearance,
} from '@/types/catAppearance';

export interface InheritanceOptions {
  /** Base mutation chance (0-1). Default 0.10 */
  mutationChance?: number;
  /** Inherited breed for fallback defaults */
  inheritedBreed?: Cat['breed'];
}

const FUR_COLOR_OPTIONS = Object.keys(FUR_COLORS) as FurColor[];
const PATTERN_OPTIONS = Object.keys(PATTERNS) as FurPattern[];
const EYE_COLOR_OPTIONS = Object.keys(EYE_COLORS) as EyeColor[];
const HAIR_LENGTH_OPTIONS = Object.keys(HAIR_LENGTHS) as HairLength[];
const FACIAL_FEATURE_OPTIONS = Object.keys(FACIAL_FEATURES) as FacialFeature[];

/**
 * Inherit a trait from parents with mutation chance
 */
function inheritTrait<T>(trait1: T, trait2: T, allOptions: T[], mutationChance = 0.1): T {
  const roll = Math.random();

  if (roll < 0.45) {
    return trait1;
  } else if (roll < 0.9) {
    return trait2;
  } else if (roll < 0.9 + mutationChance) {
    // Mutation: pick random option
    return allOptions[Math.floor(Math.random() * allOptions.length)];
  }

  // Fallback to parent 1
  return trait1;
}

/**
 * Hair length inheritance with dominance logic
 * Dominance: fluffy > medium > short
 */
function inheritHairLength(length1: HairLength, length2: HairLength): HairLength {
  const dominance: Record<HairLength, number> = {
    fluffy: 3,
    medium: 2,
    short: 1,
  };

  const dom1 = dominance[length1];
  const dom2 = dominance[length2];
  const dominantLength = dom1 >= dom2 ? length1 : length2;
  const recessiveLength = dom1 < dom2 ? length1 : length2;

  const roll = Math.random();

  // 70% dominant, 20% recessive, 10% mutation
  if (roll < 0.7) {
    return dominantLength;
  } else if (roll < 0.9) {
    return recessiveLength;
  } else {
    // Rare mutation to medium (middle ground)
    return 'medium';
  }
}

/**
 * Inherit facial feature (mostly normal, rare mutations)
 */
function inheritFacialFeature(
  feature1: FacialFeature,
  feature2: FacialFeature
): FacialFeature {
  const roll = Math.random();

  // 80% normal, 10% inherit from parent 1, 5% parent 2, 5% random mutation
  if (roll < 0.8) {
    return 'normal';
  } else if (roll < 0.9) {
    return feature1;
  } else if (roll < 0.95) {
    return feature2;
  } else {
    return FACIAL_FEATURE_OPTIONS[Math.floor(Math.random() * FACIAL_FEATURE_OPTIONS.length)];
  }
}

/**
 * Generate kitten appearance based on parent genetics
 *
 * @param parent1 - First parent cat
 * @param parent2 - Second parent cat
 * @param options - Inheritance options
 * @returns Generated CatAppearance for the kitten
 *
 * @example
 * ```typescript
 * const kittenAppearance = inheritAppearance(mom, dad, {
 *   mutationChance: 0.05,
 *   inheritedBreed: 'persian',
 * });
 * ```
 */
export function inheritAppearance(
  parent1: Cat,
  parent2: Cat,
  options: InheritanceOptions = {}
): CatAppearance {
  const { mutationChance = 0.1, inheritedBreed } = options;

  // Get parent appearances, falling back to breed defaults
  const appearance1 =
    parent1.appearance || generateDefaultAppearance(parent1.breed);
  const appearance2 =
    parent2.appearance || generateDefaultAppearance(parent2.breed);

  // Inherit each trait
  const furColor = inheritTrait(
    appearance1.furColor,
    appearance2.furColor,
    FUR_COLOR_OPTIONS,
    mutationChance
  );

  const pattern = inheritTrait(
    appearance1.pattern,
    appearance2.pattern,
    PATTERN_OPTIONS,
    mutationChance
  );

  // Pattern color: 50/50 from parents, no mutation
  const patternColor =
    Math.random() < 0.5 ? appearance1.patternColor : appearance2.patternColor;

  const eyeColor = inheritTrait(
    appearance1.eyeColor,
    appearance2.eyeColor,
    EYE_COLOR_OPTIONS,
    mutationChance
  );

  const hairLength = inheritHairLength(
    appearance1.hairLength,
    appearance2.hairLength
  );

  const facialFeature = inheritFacialFeature(
    appearance1.facialFeature,
    appearance2.facialFeature
  );

  return {
    furColor,
    pattern,
    patternColor,
    eyeColor,
    hairLength,
    facialFeature,
  };
}
