import { TimeOfDay, ParticleType } from '@/types/empire';

/**
 * Calculate time of day based on game day
 * Cycles through morning -> afternoon -> evening -> night
 */
export function getTimeOfDay(gameDay: number): TimeOfDay {
  const cycle = gameDay % 4;
  switch (cycle) {
    case 0: return 'morning';
    case 1: return 'afternoon';
    case 2: return 'evening';
    default: return 'night';
  }
}

/**
 * Time of day overlay configurations
 */
export const TIME_OF_DAY_OVERLAYS: Record<TimeOfDay, { 
  gradient: string; 
  opacity: number;
  description: string;
  filterStyle: string;
  ambientColor: string;
}> = {
  morning: { 
    gradient: 'from-yellow-200/20 via-amber-100/10 to-transparent', 
    opacity: 0.35,
    description: 'Warm golden sunrise light',
    filterStyle: 'sepia(0.1) brightness(1.05) saturate(1.1)',
    ambientColor: 'rgba(255, 200, 100, 0.15)',
  },
  afternoon: { 
    gradient: 'from-transparent via-transparent to-transparent', 
    opacity: 0,
    description: 'Bright daylight',
    filterStyle: 'brightness(1.02) saturate(1.05)',
    ambientColor: 'rgba(255, 255, 255, 0.05)',
  },
  evening: { 
    gradient: 'from-orange-300/25 via-pink-200/15 to-purple-200/10', 
    opacity: 0.4,
    description: 'Warm sunset tones',
    filterStyle: 'sepia(0.15) brightness(0.95) saturate(1.2)',
    ambientColor: 'rgba(255, 140, 80, 0.2)',
  },
  night: { 
    gradient: 'from-blue-900/40 via-indigo-900/30 to-purple-900/20', 
    opacity: 0.5,
    description: 'Cool moonlit atmosphere',
    filterStyle: 'brightness(0.75) saturate(0.85) contrast(1.1)',
    ambientColor: 'rgba(100, 120, 200, 0.25)',
  },
};

/**
 * Get lighting color temperature based on time of day
 */
export function getLightingMood(timeOfDay: TimeOfDay): 'warm' | 'cool' | 'neutral' | 'golden' {
  switch (timeOfDay) {
    case 'morning': return 'golden';
    case 'afternoon': return 'neutral';
    case 'evening': return 'warm';
    case 'night': return 'cool';
  }
}

/**
 * Get ambient particle suggestion based on time of day
 */
export function getAmbientParticles(timeOfDay: TimeOfDay): ParticleType | null {
  switch (timeOfDay) {
    case 'morning': return 'dust-motes';
    case 'afternoon': return null;
    case 'evening': return 'dust-motes';
    case 'night': return 'fireflies';
  }
}

/**
 * Get shadow intensity multiplier based on time of day
 */
export function getShadowMultiplier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'morning': return 0.8; // Soft morning shadows
    case 'afternoon': return 1.2; // Strong shadows
    case 'evening': return 0.7; // Long, soft shadows
    case 'night': return 0.3; // Minimal shadows
  }
}

/**
 * Get light beam configuration for morning/afternoon sunlight
 */
export function getLightBeamConfig(timeOfDay: TimeOfDay): { 
  show: boolean; 
  angle: number; 
  intensity: number;
  color: string;
} | null {
  switch (timeOfDay) {
    case 'morning': 
      return { show: true, angle: 25, intensity: 0.6, color: 'rgba(255, 220, 150, 0.4)' };
    case 'afternoon': 
      return { show: true, angle: 60, intensity: 0.4, color: 'rgba(255, 255, 200, 0.3)' };
    case 'evening': 
      return { show: true, angle: 75, intensity: 0.5, color: 'rgba(255, 150, 100, 0.35)' };
    case 'night': 
      return null;
  }
}
