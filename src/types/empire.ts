import { HouseSize } from '@/types/game';

/**
 * Cat state during empire view
 */
export type CatState = 'idle' | 'walking' | 'interacting' | 'sleeping';

/**
 * Cat facing direction
 */
export type CatFacing = 'left' | 'right';

/**
 * Position and state of a roaming cat
 */
export interface CatPosition {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  facing: CatFacing;
  state: CatState;
  targetX?: number;
  targetY?: number;
}

/**
 * Visual theme configuration for a zone
 */
export interface ZoneTheme {
  name: string;
  backgroundClass: string;
  floorClass: string;
  floorPattern?: string;
  wallDecoration?: string;
  ambiance?: 'cozy' | 'spacious' | 'luxurious' | 'pastoral';
}

/**
 * Empire interaction types
 */
export type EmpireInteraction = 'pet' | 'feed' | 'play' | 'photobooth' | 'details';

/**
 * Zone themes mapped by house size
 */
export type EmpireZones = Record<HouseSize, ZoneTheme>;
