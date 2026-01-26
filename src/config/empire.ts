import { EmpireZones } from '@/types/empire';

/**
 * Empire zone themes for each house tier
 * 
 * Each theme defines the visual appearance of the dwelling:
 * - backgroundClass: Tailwind classes for the wall/background area
 * - floorClass: Tailwind classes for the floor area
 * - floorPattern: Optional CSS gradient or pattern for floor texture
 * - ambiance: The overall feel of the space
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
