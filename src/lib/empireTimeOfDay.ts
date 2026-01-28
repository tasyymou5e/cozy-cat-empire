import { TimeOfDay } from '@/types/empire';

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
}> = {
  morning: { 
    gradient: 'from-yellow-200/20 via-amber-100/10 to-transparent', 
    opacity: 0.35,
    description: 'Warm golden sunrise light'
  },
  afternoon: { 
    gradient: 'from-transparent via-transparent to-transparent', 
    opacity: 0,
    description: 'Bright daylight'
  },
  evening: { 
    gradient: 'from-orange-300/25 via-pink-200/15 to-purple-200/10', 
    opacity: 0.4,
    description: 'Warm sunset tones'
  },
  night: { 
    gradient: 'from-blue-900/40 via-indigo-900/30 to-purple-900/20', 
    opacity: 0.5,
    description: 'Cool moonlit atmosphere'
  },
};

/**
 * Get lighting mood based on time of day
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
export function getAmbientParticles(timeOfDay: TimeOfDay): 'dust-motes' | 'fireflies' | 'sparkles' | null {
  switch (timeOfDay) {
    case 'morning': return 'dust-motes';
    case 'afternoon': return null;
    case 'evening': return 'dust-motes';
    case 'night': return 'fireflies';
  }
}
