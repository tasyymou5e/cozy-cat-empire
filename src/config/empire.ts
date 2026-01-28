import { EmpireZones, EnhancedEmpireZones } from '@/types/empire';
import { APARTMENT_PROPS, HOUSE_PROPS, MANSION_PROPS, FARM_PROPS } from './empireProps';

/**
 * Legacy empire zone themes (for backward compatibility)
 */
export const EMPIRE_ZONES: EmpireZones = {
  apartment: {
    name: 'Cozy Apartment',
    backgroundClass: 'bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950 dark:to-amber-900',
    floorClass: 'bg-gradient-to-b from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800',
    floorPattern: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)',
    ambiance: 'cozy',
  },
  house: {
    name: 'Suburban House',
    backgroundClass: 'bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-sky-900',
    floorClass: 'bg-gradient-to-b from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-900',
    floorPattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
    ambiance: 'spacious',
  },
  mansion: {
    name: 'Luxury Estate',
    backgroundClass: 'bg-gradient-to-b from-violet-100 to-violet-50 dark:from-violet-950 dark:to-violet-900',
    floorClass: 'bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600',
    floorPattern: 'repeating-conic-gradient(from 0deg, transparent 0deg 90deg, rgba(255,255,255,0.1) 90deg 180deg)',
    wallDecoration: '✨',
    ambiance: 'luxurious',
  },
  farm: {
    name: 'Cat Empire Farm',
    backgroundClass: 'bg-gradient-to-b from-green-200 to-green-100 dark:from-green-950 dark:to-green-900',
    floorClass: 'bg-gradient-to-b from-lime-300 to-lime-400 dark:from-lime-800 dark:to-lime-900',
    floorPattern: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.2) 0%, transparent 50%)',
    wallDecoration: '🌾',
    ambiance: 'pastoral',
  },
};

/**
 * Enhanced empire zone themes with props, particles, and seasonal decorations
 */
export const ENHANCED_EMPIRE_ZONES: EnhancedEmpireZones = {
  apartment: {
    name: 'Cozy Apartment',
    skyGradient: 'from-orange-100 via-amber-50 to-amber-100 dark:from-amber-950 dark:via-amber-900 dark:to-amber-950',
    wallGradient: 'from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-950',
    floorGradient: 'from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800',
    floorPattern: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)',
    windowScene: 'city',
    wallDecorations: [
      { emoji: '🖼️', position: { x: 20, y: 25 } },
      { emoji: '🕰️', position: { x: 75, y: 22 } },
    ],
    floorDecorations: [],
    props: APARTMENT_PROPS,
    particles: 'dust-motes',
    lighting: 'warm',
    shadowIntensity: 0.3,
    seasonalDecorations: {
      spring: [
        { emoji: '🌸', position: { x: 10, y: 30 } },
        { emoji: '🌷', position: { x: 88, y: 35 } },
      ],
      summer: [
        { emoji: '🌻', position: { x: 10, y: 30 } },
        { emoji: '☀️', position: { x: 60, y: 8 } },
      ],
      autumn: [
        { emoji: '🍂', position: { x: 10, y: 30 } },
        { emoji: '🎃', position: { x: 88, y: 72 } },
      ],
      winter: [
        { emoji: '❄️', position: { x: 45, y: 10 } },
        { emoji: '🎄', position: { x: 90, y: 55 } },
      ],
    },
  },
  house: {
    name: 'Suburban House',
    skyGradient: 'from-sky-200 via-sky-100 to-sky-50 dark:from-sky-950 dark:via-sky-900 dark:to-sky-950',
    wallGradient: 'from-sky-100 to-sky-50 dark:from-sky-900 dark:to-sky-950',
    floorGradient: 'from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-900',
    floorPattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
    windowScene: 'garden',
    wallDecorations: [
      { emoji: '🖼️', position: { x: 15, y: 25 } },
      { emoji: '📷', position: { x: 85, y: 28 } },
    ],
    floorDecorations: [],
    props: HOUSE_PROPS,
    particles: 'dust-motes',
    lighting: 'neutral',
    shadowIntensity: 0.25,
    seasonalDecorations: {
      spring: [
        { emoji: '🌸', position: { x: 5, y: 35 } },
        { emoji: '🦋', position: { x: 92, y: 25 } },
      ],
      summer: [
        { emoji: '🌻', position: { x: 5, y: 35 } },
        { emoji: '🍉', position: { x: 75, y: 78 } },
      ],
      autumn: [
        { emoji: '🍁', position: { x: 5, y: 35 } },
        { emoji: '🍂', position: { x: 92, y: 40 } },
      ],
      winter: [
        { emoji: '❄️', position: { x: 48, y: 8 } },
        { emoji: '🎁', position: { x: 70, y: 72 } },
      ],
    },
  },
  mansion: {
    name: 'Luxury Estate',
    skyGradient: 'from-violet-100 via-purple-50 to-violet-100 dark:from-violet-950 dark:via-violet-900 dark:to-purple-950',
    wallGradient: 'from-violet-100 to-violet-50 dark:from-violet-900 dark:to-violet-950',
    floorGradient: 'from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600',
    floorPattern: 'repeating-conic-gradient(from 0deg, transparent 0deg 90deg, rgba(255,255,255,0.05) 90deg 180deg)',
    windowScene: 'mountains',
    wallDecorations: [
      { emoji: '🎭', position: { x: 18, y: 28 } },
      { emoji: '🏆', position: { x: 82, y: 25 } },
    ],
    floorDecorations: [
      { emoji: '💎', position: { x: 50, y: 82 } },
    ],
    props: MANSION_PROPS,
    particles: 'sparkles',
    lighting: 'golden',
    shadowIntensity: 0.2,
    seasonalDecorations: {
      spring: [
        { emoji: '🌹', position: { x: 8, y: 38 } },
        { emoji: '💐', position: { x: 90, y: 40 } },
      ],
      summer: [
        { emoji: '🍾', position: { x: 78, y: 75 } },
        { emoji: '🪭', position: { x: 12, y: 45 } },
      ],
      autumn: [
        { emoji: '🍇', position: { x: 8, y: 38 } },
        { emoji: '🕯️', position: { x: 50, y: 18 } },
      ],
      winter: [
        { emoji: '❄️', position: { x: 30, y: 10 } },
        { emoji: '❄️', position: { x: 70, y: 12 } },
        { emoji: '🎄', position: { x: 50, y: 50 } },
      ],
    },
  },
  farm: {
    name: 'Cat Empire Farm',
    skyGradient: 'from-sky-300 via-sky-200 to-green-100 dark:from-green-950 dark:via-green-900 dark:to-sky-950',
    wallGradient: 'from-sky-200 to-green-100 dark:from-green-900 dark:to-green-950',
    floorGradient: 'from-lime-300 to-lime-400 dark:from-lime-800 dark:to-lime-900',
    floorPattern: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)',
    windowScene: 'fields',
    wallDecorations: [
      { emoji: '☁️', position: { x: 20, y: 12 } },
      { emoji: '☁️', position: { x: 70, y: 8 } },
      { emoji: '🌤️', position: { x: 45, y: 5 } },
    ],
    floorDecorations: [
      { emoji: '🌼', position: { x: 35, y: 78 } },
      { emoji: '🌼', position: { x: 65, y: 82 } },
    ],
    props: FARM_PROPS,
    particles: 'leaves',
    lighting: 'neutral',
    shadowIntensity: 0.15,
    seasonalDecorations: {
      spring: [
        { emoji: '🌸', position: { x: 5, y: 45 } },
        { emoji: '🐣', position: { x: 55, y: 78 } },
        { emoji: '🌷', position: { x: 40, y: 80 } },
      ],
      summer: [
        { emoji: '🌻', position: { x: 78, y: 60 } },
        { emoji: '🦋', position: { x: 35, y: 35 } },
        { emoji: '🐝', position: { x: 55, y: 45 } },
      ],
      autumn: [
        { emoji: '🎃', position: { x: 40, y: 72 } },
        { emoji: '🍂', position: { x: 15, y: 55 } },
        { emoji: '🌾', position: { x: 75, y: 68 } },
      ],
      winter: [
        { emoji: '⛄', position: { x: 35, y: 65 } },
        { emoji: '❄️', position: { x: 25, y: 25 } },
        { emoji: '❄️', position: { x: 60, y: 18 } },
      ],
    },
  },
};

/**
 * Movement bounds for cats (percentage of container)
 */
export const MOVEMENT_BOUNDS = {
  minX: 5,
  maxX: 90,
  minY: 35, // Keep cats in lower portion (floor area)
  maxY: 85,
};

/**
 * Timing constants for cat movement
 */
export const MOVEMENT_TIMING = {
  minInterval: 3000, // Minimum ms between movements
  maxInterval: 8000, // Maximum ms between movements
  transitionDuration: 3000, // CSS transition duration in ms
};
