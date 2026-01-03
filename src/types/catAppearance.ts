import { CatBreed } from './game';

export type FurColor = 'orange' | 'black' | 'white' | 'gray' | 'brown' | 'cream' | 'ginger' | 'calico';
export type FurPattern = 'solid' | 'tabby' | 'spotted' | 'tuxedo' | 'bicolor' | 'calico';
export type EyeColor = 'green' | 'blue' | 'amber' | 'gold' | 'heterochromia' | 'copper';
export type HairLength = 'short' | 'medium' | 'fluffy';
export type FacialFeature = 'normal' | 'scar' | 'eyepatch' | 'whiskers_long' | 'grumpy' | 'cute_blush';

export interface CatAppearance {
  furColor: FurColor;
  pattern: FurPattern;
  patternColor: string;
  eyeColor: EyeColor;
  hairLength: HairLength;
  facialFeature: FacialFeature;
}

export const FUR_COLORS: Record<FurColor, { hex: string; name: string }> = {
  orange: { hex: '#F97316', name: 'Orange' },
  black: { hex: '#1C1917', name: 'Black' },
  white: { hex: '#FAFAF9', name: 'White' },
  gray: { hex: '#6B7280', name: 'Gray' },
  brown: { hex: '#78350F', name: 'Brown' },
  cream: { hex: '#FEF3C7', name: 'Cream' },
  ginger: { hex: '#EA580C', name: 'Ginger' },
  calico: { hex: '#FBBF24', name: 'Calico Base' },
};

export const PATTERN_COLORS: Record<string, { hex: string; name: string }> = {
  '#1C1917': { hex: '#1C1917', name: 'Black' },
  '#78350F': { hex: '#78350F', name: 'Dark Brown' },
  '#F97316': { hex: '#F97316', name: 'Orange' },
  '#FAFAF9': { hex: '#FAFAF9', name: 'White' },
  '#6B7280': { hex: '#6B7280', name: 'Gray' },
};

export const EYE_COLORS: Record<EyeColor, { hex: string; name: string; secondary?: string }> = {
  green: { hex: '#22C55E', name: 'Green' },
  blue: { hex: '#3B82F6', name: 'Blue' },
  amber: { hex: '#F59E0B', name: 'Amber' },
  gold: { hex: '#EAB308', name: 'Gold' },
  heterochromia: { hex: '#3B82F6', name: 'Heterochromia', secondary: '#22C55E' },
  copper: { hex: '#B45309', name: 'Copper' },
};

export const HAIR_LENGTHS: Record<HairLength, { name: string; description: string }> = {
  short: { name: 'Short', description: 'Sleek and smooth' },
  medium: { name: 'Medium', description: 'Normal fluffy coat' },
  fluffy: { name: 'Fluffy', description: 'Extra fluffy and poofy' },
};

export const FACIAL_FEATURES: Record<FacialFeature, { name: string; emoji: string }> = {
  normal: { name: 'Normal', emoji: '' },
  scar: { name: 'Battle Scar', emoji: '⚔️' },
  eyepatch: { name: 'Eyepatch', emoji: '🏴‍☠️' },
  whiskers_long: { name: 'Long Whiskers', emoji: '〰️' },
  grumpy: { name: 'Grumpy Face', emoji: '😾' },
  cute_blush: { name: 'Cute Blush', emoji: '🥰' },
};

export const PATTERNS: Record<FurPattern, { name: string; description: string }> = {
  solid: { name: 'Solid', description: 'Single color' },
  tabby: { name: 'Tabby', description: 'Classic stripes' },
  spotted: { name: 'Spotted', description: 'Cute spots' },
  tuxedo: { name: 'Tuxedo', description: 'Formal look' },
  bicolor: { name: 'Bicolor', description: 'Two-toned' },
  calico: { name: 'Calico', description: 'Multi-colored patches' },
};

// Generate default appearance based on breed
export function generateDefaultAppearance(breed: CatBreed): CatAppearance {
  const breedDefaults: Record<CatBreed, Partial<CatAppearance>> = {
    stray: { furColor: 'gray', pattern: 'tabby', eyeColor: 'amber' },
    tabby: { furColor: 'orange', pattern: 'tabby', eyeColor: 'green' },
    persian: { furColor: 'white', pattern: 'solid', eyeColor: 'blue', hairLength: 'fluffy' },
    siamese: { furColor: 'cream', pattern: 'bicolor', patternColor: '#78350F', eyeColor: 'blue' },
    'maine-coon': { furColor: 'brown', pattern: 'tabby', eyeColor: 'gold', hairLength: 'fluffy' },
    'british-shorthair': { furColor: 'gray', pattern: 'solid', eyeColor: 'copper', hairLength: 'short' },
    ragdoll: { furColor: 'cream', pattern: 'bicolor', eyeColor: 'blue', hairLength: 'fluffy' },
    bengal: { furColor: 'ginger', pattern: 'spotted', eyeColor: 'green', hairLength: 'short' },
  };

  const defaults = breedDefaults[breed] || {};
  
  return {
    furColor: defaults.furColor || 'orange',
    pattern: defaults.pattern || 'solid',
    patternColor: defaults.patternColor || '#1C1917',
    eyeColor: defaults.eyeColor || 'amber',
    hairLength: defaults.hairLength || 'medium',
    facialFeature: 'normal',
  };
}

// Randomize appearance
export function randomizeAppearance(): CatAppearance {
  const furColors = Object.keys(FUR_COLORS) as FurColor[];
  const patterns = Object.keys(PATTERNS) as FurPattern[];
  const eyeColors = Object.keys(EYE_COLORS) as EyeColor[];
  const hairLengths = Object.keys(HAIR_LENGTHS) as HairLength[];
  const features = Object.keys(FACIAL_FEATURES) as FacialFeature[];
  const patternColorKeys = Object.keys(PATTERN_COLORS);

  return {
    furColor: furColors[Math.floor(Math.random() * furColors.length)],
    pattern: patterns[Math.floor(Math.random() * patterns.length)],
    patternColor: patternColorKeys[Math.floor(Math.random() * patternColorKeys.length)],
    eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
    hairLength: hairLengths[Math.floor(Math.random() * hairLengths.length)],
    facialFeature: features[Math.floor(Math.random() * features.length)],
  };
}
