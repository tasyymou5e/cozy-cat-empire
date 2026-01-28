import { HouseSize } from '@/types/game';
import { RealSeason } from '@/lib/seasonUtils';

/**
 * Cat state during empire view
 */
export type CatState = 
  | 'idle' 
  | 'walking' 
  | 'interacting' 
  | 'sleeping'    // On furniture
  | 'playing'     // With toy prop
  | 'perching'    // On window/fence
  | 'sunbathing'; // In light beam

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
  nearPropId?: string; // ID of prop cat is near/interacting with
}

/**
 * Interactive prop definition
 */
export interface EmpireProp {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  scale: number;
  zIndex: number;
  interactable?: boolean;
  onInteract?: 'sleep' | 'play' | 'hide' | 'perch';
  attractsCats?: boolean;
  attractionRadius?: number;
}

/**
 * Time of day derived from game day
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Weather effect types
 */
export type WeatherEffect = 'clear' | 'rain' | 'cloudy' | 'sunny';

/**
 * Particle effect types
 */
export type ParticleType = 'dust-motes' | 'fireflies' | 'sparkles' | 'leaves' | 'snow' | 'petals';

/**
 * Window scene types
 */
export type WindowSceneType = 'city' | 'garden' | 'mountains' | 'fields';

/**
 * Enhanced zone theme with all visual layers
 */
export interface EnhancedZoneTheme {
  name: string;
  
  // Visual gradients
  skyGradient: string;
  wallGradient: string;
  floorGradient: string;
  floorPattern?: string;
  
  // Scene elements
  windowScene?: WindowSceneType;
  wallDecorations: Array<{ emoji: string; position: { x: number; y: number } }>;
  floorDecorations: Array<{ emoji: string; position: { x: number; y: number } }>;
  
  // Props for this zone
  props: EmpireProp[];
  
  // Atmospheric effects
  particles?: ParticleType;
  lighting: 'warm' | 'cool' | 'neutral' | 'golden';
  shadowIntensity: number;
  
  // Seasonal overrides
  seasonalDecorations?: Record<RealSeason, Array<{ emoji: string; position: { x: number; y: number } }>>;
  
  // Optional AI background key (for cached generated backgrounds)
  aiBackgroundKey?: string;
}

/**
 * Cat attraction zone for furniture seeking
 */
export interface AttractionZone {
  propId: string;
  center: { x: number; y: number };
  radius: number;
  behavior: 'sleep' | 'play' | 'perch' | 'sunbathe';
}

/**
 * Legacy zone theme (for backward compatibility)
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

/**
 * Enhanced zone themes mapped by house size
 */
export type EnhancedEmpireZones = Record<HouseSize, EnhancedZoneTheme>;
