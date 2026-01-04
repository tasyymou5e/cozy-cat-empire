/**
 * Costume Vector Library
 * 
 * SVG path definitions for costumes to render as vector graphics
 * instead of emoji overlays.
 */

import { COSTUMES, getCostumeById } from '@/types/costumes';

/**
 * Vector costume definition
 */
export interface VectorCostume {
  /** Costume ID matching the COSTUMES array */
  id: string;
  /** SVG path data for the main shape */
  path: string;
  /** Default fill color */
  fill: string;
  /** Stroke color (optional) */
  stroke?: string;
  /** Stroke width (optional) */
  strokeWidth?: number;
  /** Additional decorative paths */
  decorations?: Array<{
    path: string;
    fill: string;
    stroke?: string;
  }>;
  /** Position anchor point (relative to avatar center) */
  anchor: { x: number; y: number };
  /** Scale factor per avatar size */
  scales: Record<string, number>;
}

/**
 * Crown costume - golden crown with gems
 */
const crownVector: VectorCostume = {
  id: 'crown',
  path: 'M-20,-5 L-15,-20 L-10,-8 L0,-25 L10,-8 L15,-20 L20,-5 L18,5 L-18,5 Z',
  fill: '#FFD700',
  stroke: '#B8860B',
  strokeWidth: 1,
  decorations: [
    { path: 'M0,-18 L3,-15 L0,-12 L-3,-15 Z', fill: '#FF0000' }, // Center gem
    { path: 'M-12,-12 L-10,-10 L-12,-8 L-14,-10 Z', fill: '#0000FF' }, // Left gem
    { path: 'M12,-12 L14,-10 L12,-8 L10,-10 Z', fill: '#00FF00' }, // Right gem
  ],
  anchor: { x: 0, y: -35 },
  scales: { xs: 0.4, sm: 0.5, md: 0.65, lg: 0.8, xl: 1.0 },
};

/**
 * Wizard hat - purple with stars
 */
const wizardHatVector: VectorCostume = {
  id: 'wizard_hat',
  path: 'M0,-40 L15,5 L25,8 L-25,8 L-15,5 Z',
  fill: '#6B3FA0',
  stroke: '#4B0082',
  strokeWidth: 1,
  decorations: [
    { path: 'M-8,-15 L-6,-10 L-11,-12 L-6,-14 L-8,-15', fill: '#FFD700' }, // Star 1
    { path: 'M5,-25 L7,-20 L2,-22 L7,-24 L5,-25', fill: '#FFD700' }, // Star 2
    { path: 'M-3,-8 L0,-5 L-3,-2 L-6,-5 Z', fill: '#C0C0C0' }, // Moon
  ],
  anchor: { x: 0, y: -30 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Party hat - colorful cone
 */
const partyHatVector: VectorCostume = {
  id: 'party_hat',
  path: 'M0,-35 L15,5 L-15,5 Z',
  fill: '#FF69B4',
  stroke: '#FF1493',
  strokeWidth: 1,
  decorations: [
    { path: 'M-5,-20 A3,3 0 1,1 -5,-19.9 Z', fill: '#FFFF00' }, // Dot 1
    { path: 'M5,-15 A3,3 0 1,1 5,-14.9 Z', fill: '#00FFFF' }, // Dot 2
    { path: 'M-3,-8 A3,3 0 1,1 -3,-7.9 Z', fill: '#90EE90' }, // Dot 3
    { path: 'M0,-35 L5,-32 L-2,-30 L3,-27 L-4,-25', fill: 'none', stroke: '#FFFF00' }, // Ribbon
  ],
  anchor: { x: 0, y: -32 },
  scales: { xs: 0.4, sm: 0.5, md: 0.65, lg: 0.8, xl: 0.95 },
};

/**
 * Top hat - formal black hat
 */
const topHatVector: VectorCostume = {
  id: 'top_hat',
  path: 'M-12,-35 L12,-35 L12,-5 L20,-5 L20,2 L-20,2 L-20,-5 L-12,-5 Z',
  fill: '#1a1a1a',
  stroke: '#333333',
  strokeWidth: 1,
  decorations: [
    { path: 'M-12,-8 L12,-8 L12,-5 L-12,-5 Z', fill: '#8B0000' }, // Red band
  ],
  anchor: { x: 0, y: -30 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Bow tie - red/pink bow
 */
const bowTieVector: VectorCostume = {
  id: 'bow_tie',
  path: 'M-15,0 Q-10,-8 0,0 Q10,-8 15,0 Q10,8 0,0 Q-10,8 -15,0 Z',
  fill: '#FF4444',
  stroke: '#CC0000',
  strokeWidth: 1,
  decorations: [
    { path: 'M-2,-2 L2,-2 L2,2 L-2,2 Z', fill: '#CC0000' }, // Center knot
  ],
  anchor: { x: 0, y: 25 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
};

/**
 * Sunglasses - cool shades
 */
const sunglassesVector: VectorCostume = {
  id: 'sunglasses',
  path: 'M-20,-3 L-18,-8 L-8,-8 L-5,-3 L5,-3 L8,-8 L18,-8 L20,-3 L18,5 L8,8 L-8,8 L-18,5 Z',
  fill: '#1a1a1a',
  stroke: '#333333',
  strokeWidth: 0.5,
  decorations: [
    { path: 'M-5,-3 L5,-3', fill: 'none', stroke: '#1a1a1a' }, // Bridge
  ],
  anchor: { x: 0, y: -5 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Superhero cape - flowing cape
 */
const superheroVector: VectorCostume = {
  id: 'superhero',
  path: 'M-15,-10 Q-25,20 -20,45 L20,45 Q25,20 15,-10 Z',
  fill: '#DC143C',
  stroke: '#8B0000',
  strokeWidth: 1,
  decorations: [
    { path: 'M-8,15 L0,8 L8,15 L0,22 Z', fill: '#FFD700' }, // Shield emblem
  ],
  anchor: { x: 0, y: 10 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
};

/**
 * Pirate hat - tricorn with skull
 */
const pirateHatVector: VectorCostume = {
  id: 'pirate_hat',
  path: 'M-25,-5 Q-15,-25 0,-20 Q15,-25 25,-5 L20,5 L-20,5 Z',
  fill: '#1a1a1a',
  stroke: '#333333',
  strokeWidth: 1,
  decorations: [
    { path: 'M-5,-12 A5,5 0 1,1 5,-12 A5,5 0 1,1 -5,-12', fill: '#FFFFFF' }, // Skull
    { path: 'M-8,-6 L8,-6', fill: 'none', stroke: '#FFFFFF' }, // Crossbones
    { path: 'M0,-10 L0,-2', fill: 'none', stroke: '#FFFFFF' }, // Crossbones
  ],
  anchor: { x: 0, y: -30 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Map of costume IDs to vector definitions
 */
export const COSTUME_VECTORS: Record<string, VectorCostume> = {
  'crown': crownVector,
  'wizard_hat': wizardHatVector,
  'party_hat': partyHatVector,
  'top_hat': topHatVector,
  'bow_tie': bowTieVector,
  'sunglasses': sunglassesVector,
  'superhero': superheroVector,
  'pirate_hat': pirateHatVector,
};

/**
 * Get vector costume by ID
 * Returns undefined if no vector version exists (falls back to emoji)
 */
export function getVectorCostume(costumeId: string): VectorCostume | undefined {
  return COSTUME_VECTORS[costumeId];
}

/**
 * Check if a costume has a vector version
 */
export function hasVectorCostume(costumeId: string): boolean {
  return costumeId in COSTUME_VECTORS;
}

/**
 * Get scaled costume dimensions for a given avatar size
 */
export function getScaledCostumeDimensions(
  costume: VectorCostume,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
): { scale: number; offsetX: number; offsetY: number } {
  const scale = costume.scales[size] || 1;
  return {
    scale,
    offsetX: costume.anchor.x * scale,
    offsetY: costume.anchor.y * scale,
  };
}

/**
 * Get all costumes that have vector versions
 */
export function getVectorCostumeIds(): string[] {
  return Object.keys(COSTUME_VECTORS);
}
