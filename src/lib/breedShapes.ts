/**
 * Breed Shape Definitions
 *
 * Defines breed-specific bezier curves and visual features for Paper.js cat generation.
 * Each breed has unique characteristics that affect the cat's appearance.
 */

import { CatBreed } from '@/types/game';

/**
 * Shape definition for head outline
 */
export interface HeadShape {
  /** Control points for head bezier curve */
  topCurve: number;
  /** Side bulge for cheeks */
  cheekWidth: number;
  /** Chin shape (0 = round, 1 = pointed) */
  chinShape: number;
  /** Overall face width multiplier */
  widthMultiplier: number;
}

/**
 * Shape definition for ear appearance
 */
export interface EarShape {
  /** Ear height multiplier */
  height: number;
  /** Ear width multiplier */
  width: number;
  /** Ear angle in degrees from vertical */
  angle: number;
  /** Ear tip pointiness (0 = round, 1 = pointed) */
  pointiness: number;
  /** Whether ears have tufts */
  hasTufts: boolean;
}

/**
 * Shape definition for eye appearance
 */
export interface EyeShape {
  /** Eye shape type */
  shape: 'round' | 'almond' | 'oval';
  /** Eye size multiplier */
  size: number;
  /** Eye slant angle */
  slant: number;
  /** Pupil type */
  pupil: 'round' | 'slit' | 'large';
}

/**
 * Shape definition for nose
 */
export interface NoseShape {
  /** Nose shape type */
  shape: 'standard' | 'flat' | 'pointed';
  /** Nose size multiplier */
  size: number;
  /** Nose bridge height */
  bridgeHeight: number;
}

/**
 * Complete breed definition
 */
export interface BreedDefinition {
  /** Head shape configuration */
  head: HeadShape;
  /** Ear shape configuration */
  ears: EarShape;
  /** Eye shape configuration */
  eyes: EyeShape;
  /** Nose shape configuration */
  nose: NoseShape;
  /** Fur length affects rendering */
  furLength: 'short' | 'medium' | 'long';
  /** Special breed characteristics */
  traits: string[];
}

/**
 * Breed shape definitions for all cat breeds
 */
export const BREED_SHAPES: Record<CatBreed, BreedDefinition> = {
  siamese: {
    head: {
      topCurve: 0.3,
      cheekWidth: 0.85,
      chinShape: 0.7,
      widthMultiplier: 0.9,
    },
    ears: {
      height: 1.3,
      width: 1.1,
      angle: 15,
      pointiness: 0.8,
      hasTufts: false,
    },
    eyes: {
      shape: 'almond',
      size: 1.1,
      slant: 15,
      pupil: 'slit',
    },
    nose: {
      shape: 'pointed',
      size: 0.9,
      bridgeHeight: 0.8,
    },
    furLength: 'short',
    traits: ['wedge-face', 'large-ears', 'blue-eyes'],
  },

  persian: {
    head: {
      topCurve: 0.8,
      cheekWidth: 1.2,
      chinShape: 0.2,
      widthMultiplier: 1.15,
    },
    ears: {
      height: 0.7,
      width: 0.9,
      angle: 5,
      pointiness: 0.3,
      hasTufts: false,
    },
    eyes: {
      shape: 'round',
      size: 1.3,
      slant: 0,
      pupil: 'large',
    },
    nose: {
      shape: 'flat',
      size: 0.8,
      bridgeHeight: 0.3,
    },
    furLength: 'long',
    traits: ['round-face', 'flat-nose', 'fluffy'],
  },

  'maine-coon': {
    head: {
      topCurve: 0.5,
      cheekWidth: 1.1,
      chinShape: 0.4,
      widthMultiplier: 1.1,
    },
    ears: {
      height: 1.2,
      width: 1.0,
      angle: 10,
      pointiness: 0.6,
      hasTufts: true,
    },
    eyes: {
      shape: 'oval',
      size: 1.0,
      slant: 5,
      pupil: 'round',
    },
    nose: {
      shape: 'standard',
      size: 1.1,
      bridgeHeight: 0.6,
    },
    furLength: 'long',
    traits: ['square-jaw', 'tufted-ears', 'rugged'],
  },

  'british-shorthair': {
    head: {
      topCurve: 0.7,
      cheekWidth: 1.3,
      chinShape: 0.3,
      widthMultiplier: 1.2,
    },
    ears: {
      height: 0.8,
      width: 0.85,
      angle: 8,
      pointiness: 0.4,
      hasTufts: false,
    },
    eyes: {
      shape: 'round',
      size: 1.2,
      slant: 0,
      pupil: 'round',
    },
    nose: {
      shape: 'standard',
      size: 1.0,
      bridgeHeight: 0.5,
    },
    furLength: 'short',
    traits: ['chubby-cheeks', 'round-face', 'dense-fur'],
  },

  ragdoll: {
    head: {
      topCurve: 0.6,
      cheekWidth: 1.0,
      chinShape: 0.35,
      widthMultiplier: 1.05,
    },
    ears: {
      height: 1.0,
      width: 0.95,
      angle: 12,
      pointiness: 0.5,
      hasTufts: true,
    },
    eyes: {
      shape: 'oval',
      size: 1.15,
      slant: 3,
      pupil: 'large',
    },
    nose: {
      shape: 'standard',
      size: 0.95,
      bridgeHeight: 0.55,
    },
    furLength: 'long',
    traits: ['soft-features', 'fluffy-ears', 'gentle'],
  },

  bengal: {
    head: {
      topCurve: 0.4,
      cheekWidth: 0.95,
      chinShape: 0.5,
      widthMultiplier: 0.95,
    },
    ears: {
      height: 1.0,
      width: 0.9,
      angle: 12,
      pointiness: 0.5,
      hasTufts: false,
    },
    eyes: {
      shape: 'almond',
      size: 1.05,
      slant: 10,
      pupil: 'slit',
    },
    nose: {
      shape: 'standard',
      size: 1.0,
      bridgeHeight: 0.65,
    },
    furLength: 'short',
    traits: ['athletic', 'wild-look', 'rosettes'],
  },

  tabby: {
    head: {
      topCurve: 0.5,
      cheekWidth: 1.0,
      chinShape: 0.4,
      widthMultiplier: 1.0,
    },
    ears: {
      height: 1.0,
      width: 1.0,
      angle: 10,
      pointiness: 0.5,
      hasTufts: false,
    },
    eyes: {
      shape: 'oval',
      size: 1.0,
      slant: 5,
      pupil: 'round',
    },
    nose: {
      shape: 'standard',
      size: 1.0,
      bridgeHeight: 0.5,
    },
    furLength: 'short',
    traits: ['standard', 'striped', 'friendly'],
  },

  stray: {
    head: {
      topCurve: 0.45,
      cheekWidth: 0.9,
      chinShape: 0.45,
      widthMultiplier: 0.95,
    },
    ears: {
      height: 1.05,
      width: 1.0,
      angle: 12,
      pointiness: 0.55,
      hasTufts: false,
    },
    eyes: {
      shape: 'oval',
      size: 0.95,
      slant: 8,
      pupil: 'slit',
    },
    nose: {
      shape: 'standard',
      size: 1.0,
      bridgeHeight: 0.55,
    },
    furLength: 'medium',
    traits: ['scrappy', 'varied', 'street-smart'],
  },
};

/**
 * Get breed definition by breed name
 */
export function getBreedShape(breed: CatBreed): BreedDefinition {
  return BREED_SHAPES[breed] || BREED_SHAPES['tabby'];
}

/**
 * Interpolate between two breed shapes for hybrid cats
 */
export function interpolateBreedShapes(
  breed1: CatBreed,
  breed2: CatBreed,
  ratio: number = 0.5
): BreedDefinition {
  const shape1 = getBreedShape(breed1);
  const shape2 = getBreedShape(breed2);

  const lerp = (a: number, b: number) => a + (b - a) * ratio;

  return {
    head: {
      topCurve: lerp(shape1.head.topCurve, shape2.head.topCurve),
      cheekWidth: lerp(shape1.head.cheekWidth, shape2.head.cheekWidth),
      chinShape: lerp(shape1.head.chinShape, shape2.head.chinShape),
      widthMultiplier: lerp(shape1.head.widthMultiplier, shape2.head.widthMultiplier),
    },
    ears: {
      height: lerp(shape1.ears.height, shape2.ears.height),
      width: lerp(shape1.ears.width, shape2.ears.width),
      angle: lerp(shape1.ears.angle, shape2.ears.angle),
      pointiness: lerp(shape1.ears.pointiness, shape2.ears.pointiness),
      hasTufts: ratio > 0.5 ? shape2.ears.hasTufts : shape1.ears.hasTufts,
    },
    eyes: {
      shape: ratio > 0.5 ? shape2.eyes.shape : shape1.eyes.shape,
      size: lerp(shape1.eyes.size, shape2.eyes.size),
      slant: lerp(shape1.eyes.slant, shape2.eyes.slant),
      pupil: ratio > 0.5 ? shape2.eyes.pupil : shape1.eyes.pupil,
    },
    nose: {
      shape: ratio > 0.5 ? shape2.nose.shape : shape1.nose.shape,
      size: lerp(shape1.nose.size, shape2.nose.size),
      bridgeHeight: lerp(shape1.nose.bridgeHeight, shape2.nose.bridgeHeight),
    },
    furLength: ratio > 0.5 ? shape2.furLength : shape1.furLength,
    traits: [...shape1.traits.slice(0, 2), ...shape2.traits.slice(0, 2)],
  };
}
