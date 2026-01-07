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
  /** Animation effects for this costume */
  animation?: {
    /** Type of animation */
    type: 'sparkle' | 'glow' | 'flow' | 'pulse' | 'shimmer' | 'rainbow';
    /** CSS class to apply */
    className?: string;
    /** Glow color for glow animations */
    glowColor?: string;
  };
  /** Particle effects around the costume */
  particles?: {
    type: 'sparkles' | 'stars' | 'hearts' | 'magic';
    count: number;
    color?: string;
  };
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
  animation: { type: 'glow', className: 'glow-gold' },
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
  animation: { type: 'sparkle', className: 'sparkle' },
  particles: { type: 'stars', count: 3, color: '#FFD700' },
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
  animation: { type: 'flow', className: 'flow' },
};

/**
 * Pirate costume - tricorn with skull (ID fixed from pirate_hat to pirate)
 */
const pirateVector: VectorCostume = {
  id: 'pirate',
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
 * Sweater - cozy knit sweater collar
 */
const sweaterVector: VectorCostume = {
  id: 'sweater',
  path: 'M-25,5 Q-30,15 -25,30 L25,30 Q30,15 25,5 Q15,0 0,5 Q-15,0 -25,5 Z',
  fill: '#8B4513',
  stroke: '#654321',
  strokeWidth: 1,
  decorations: [
    { path: 'M-20,12 L20,12', fill: 'none', stroke: '#A0522D' }, // Knit line 1
    { path: 'M-22,18 L22,18', fill: 'none', stroke: '#A0522D' }, // Knit line 2
    { path: 'M-20,24 L20,24', fill: 'none', stroke: '#A0522D' }, // Knit line 3
  ],
  anchor: { x: 0, y: 20 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Tuxedo - elegant formal wear
 */
const tuxedoVector: VectorCostume = {
  id: 'tuxedo',
  path: 'M-20,5 L-25,35 L-10,35 L0,20 L10,35 L25,35 L20,5 Q10,0 0,5 Q-10,0 -20,5 Z',
  fill: '#1a1a1a',
  stroke: '#333333',
  strokeWidth: 1,
  decorations: [
    { path: 'M-8,8 L0,18 L8,8 Z', fill: '#FFFFFF' }, // White shirt front
    { path: 'M-6,6 Q0,4 6,6 Q0,10 -6,6 Z', fill: '#FF0000' }, // Bow tie
    { path: 'M-1,6 L1,6 L1,8 L-1,8 Z', fill: '#990000' }, // Bow center
  ],
  anchor: { x: 0, y: 20 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
};

/**
 * Necklace - pearl necklace
 */
const necklaceVector: VectorCostume = {
  id: 'necklace',
  path: 'M-20,10 Q-25,25 -15,30 Q0,35 15,30 Q25,25 20,10',
  fill: 'none',
  stroke: '#D4AF37',
  strokeWidth: 2,
  decorations: [
    { path: 'M-18,15 A3,3 0 1,1 -18,15.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M-12,22 A3,3 0 1,1 -12,22.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M-4,27 A3.5,3.5 0 1,1 -4,27.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M4,27 A3.5,3.5 0 1,1 4,27.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M12,22 A3,3 0 1,1 12,22.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M18,15 A3,3 0 1,1 18,15.1 Z', fill: '#FFFAF0', stroke: '#D3D3D3' },
    { path: 'M0,30 A5,5 0 1,1 0,30.1 Z', fill: '#FFD700', stroke: '#B8860B' }, // Center gem
  ],
  anchor: { x: 0, y: 18 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
};

/**
 * Scarf - silk flowing scarf
 */
const scarfVector: VectorCostume = {
  id: 'scarf',
  path: 'M-25,8 Q-20,5 0,8 Q20,5 25,8 L28,15 Q20,12 0,15 Q-20,12 -28,15 Z',
  fill: '#9932CC',
  stroke: '#7B2D8E',
  strokeWidth: 1,
  decorations: [
    { path: 'M20,15 Q25,25 22,40 L28,42 Q32,28 28,15 Z', fill: '#9932CC', stroke: '#7B2D8E' }, // Hanging end 1
    { path: 'M24,15 Q30,30 26,45 L32,47 Q38,32 32,15 Z', fill: '#8B008B', stroke: '#7B2D8E' }, // Hanging end 2
  ],
  anchor: { x: 0, y: 15 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
};

/**
 * Angel wings - heavenly wings
 */
const angelWingsVector: VectorCostume = {
  id: 'angel_wings',
  path: 'M-10,0 Q-35,-10 -40,-5 Q-45,5 -35,15 Q-25,25 -10,20 Z M10,0 Q35,-10 40,-5 Q45,5 35,15 Q25,25 10,20 Z',
  fill: '#FFFFFF',
  stroke: '#E8E8E8',
  strokeWidth: 1,
  decorations: [
    { path: 'M-15,5 Q-28,0 -32,5', fill: 'none', stroke: '#F0F0F0' }, // Feather line L1
    { path: 'M-12,10 Q-25,8 -30,12', fill: 'none', stroke: '#F0F0F0' }, // Feather line L2
    { path: 'M15,5 Q28,0 32,5', fill: 'none', stroke: '#F0F0F0' }, // Feather line R1
    { path: 'M12,10 Q25,8 30,12', fill: 'none', stroke: '#F0F0F0' }, // Feather line R2
    { path: 'M0,-8 L2,-3 L0,2 L-2,-3 Z', fill: '#FFD700' }, // Halo sparkle
  ],
  anchor: { x: 0, y: 5 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
  animation: { type: 'flow', className: 'flutter' },
  particles: { type: 'sparkles', count: 4, color: '#FFFFFF' },
};

/**
 * Dragon costume - horns and scales
 */
const dragonVector: VectorCostume = {
  id: 'dragon',
  path: 'M-18,-25 Q-22,-35 -15,-40 L-10,-30 L-8,-25 M18,-25 Q22,-35 15,-40 L10,-30 L8,-25',
  fill: '#228B22',
  stroke: '#006400',
  strokeWidth: 1.5,
  decorations: [
    { path: 'M-15,-28 Q-12,-32 -10,-28 Q-8,-24 -12,-26 Z', fill: '#32CD32' }, // Left horn detail
    { path: 'M15,-28 Q12,-32 10,-28 Q8,-24 12,-26 Z', fill: '#32CD32' }, // Right horn detail
    { path: 'M-25,10 Q-35,5 -38,15 Q-35,25 -25,20 Z', fill: '#228B22', stroke: '#006400' }, // Left wing
    { path: 'M25,10 Q35,5 38,15 Q35,25 25,20 Z', fill: '#228B22', stroke: '#006400' }, // Right wing
    { path: 'M-20,5 L-18,8 L-22,8 Z', fill: '#FF4500' }, // Scale 1
    { path: 'M-10,8 L-8,11 L-12,11 Z', fill: '#FF4500' }, // Scale 2
    { path: 'M0,5 L2,8 L-2,8 Z', fill: '#FF4500' }, // Scale 3
  ],
  anchor: { x: 0, y: -25 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
  animation: { type: 'glow', className: 'glow-fire' },
};

/**
 * Astronaut - space helmet
 */
const astronautVector: VectorCostume = {
  id: 'astronaut',
  path: 'M-22,-25 Q-28,-10 -28,5 Q-28,25 0,28 Q28,25 28,5 Q28,-10 22,-25 Q10,-32 0,-32 Q-10,-32 -22,-25 Z',
  fill: '#E8E8E8',
  stroke: '#B0B0B0',
  strokeWidth: 1.5,
  decorations: [
    {
      path: 'M-15,-18 Q-18,-5 -18,5 Q-18,18 0,20 Q18,18 18,5 Q18,-5 15,-18 Q8,-22 0,-22 Q-8,-22 -15,-18 Z',
      fill: '#87CEEB',
      stroke: '#4682B4',
    }, // Visor
    { path: 'M-8,-12 Q-5,-8 -8,-4', fill: 'none', stroke: '#FFFFFF' }, // Visor reflection
    { path: 'M0,-38 L0,-32 M-3,-35 L3,-35', fill: 'none', stroke: '#B0B0B0' }, // Antenna
    { path: 'M-22,10 L-28,10 L-28,15 L-22,15 Z', fill: '#FF4500' }, // Left panel
    { path: 'M22,10 L28,10 L28,15 L22,15 Z', fill: '#32CD32' }, // Right panel
  ],
  anchor: { x: 0, y: -10 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
};

/**
 * Unicorn horn - magical spiral horn
 */
const unicornVector: VectorCostume = {
  id: 'unicorn',
  path: 'M0,-45 L8,-10 L-8,-10 Z',
  fill: 'url(#unicornGradient)',
  stroke: '#FFB6C1',
  strokeWidth: 1,
  decorations: [
    { path: 'M-4,-35 Q0,-32 4,-35', fill: 'none', stroke: '#DDA0DD' }, // Spiral 1
    { path: 'M-5,-28 Q0,-25 5,-28', fill: 'none', stroke: '#DDA0DD' }, // Spiral 2
    { path: 'M-6,-21 Q0,-18 6,-21', fill: 'none', stroke: '#DDA0DD' }, // Spiral 3
    { path: 'M-7,-14 Q0,-11 7,-14', fill: 'none', stroke: '#DDA0DD' }, // Spiral 4
    { path: 'M-12,-8 L-10,-5 L-14,-6 Z', fill: '#FFD700' }, // Sparkle 1
    { path: 'M10,-12 L12,-9 L8,-10 Z', fill: '#FFD700' }, // Sparkle 2
    { path: 'M-5,-42 L-3,-40 L-6,-41 Z', fill: '#FFFFFF' }, // Tip sparkle
  ],
  anchor: { x: 0, y: -35 },
  scales: { xs: 0.35, sm: 0.45, md: 0.6, lg: 0.75, xl: 0.9 },
  animation: { type: 'rainbow', className: 'rainbow' },
  particles: { type: 'magic', count: 5, color: '#FF69B4' },
};

/**
 * VIP Bronze Collar - distinguished bronze collar
 */
const vipBronzeCollarVector: VectorCostume = {
  id: 'vip_bronze_collar',
  path: 'M-22,8 Q-25,15 -22,22 Q0,28 22,22 Q25,15 22,8 Q0,5 -22,8 Z',
  fill: '#CD7F32',
  stroke: '#8B4513',
  strokeWidth: 1.5,
  decorations: [
    { path: 'M-3,12 L0,8 L3,12 L0,16 Z', fill: '#FFD700' }, // Center star
    { path: 'M-15,14 A2,2 0 1,1 -15,14.1 Z', fill: '#B8860B' }, // Left rivet
    { path: 'M15,14 A2,2 0 1,1 15,14.1 Z', fill: '#B8860B' }, // Right rivet
  ],
  anchor: { x: 0, y: 15 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
  animation: { type: 'shimmer', className: 'shimmer-bronze' },
};

/**
 * VIP Silver Cape - elegant silver flowing cape
 */
const vipSilverCapeVector: VectorCostume = {
  id: 'vip_silver_cape',
  path: 'M-15,-10 Q-28,20 -22,48 L22,48 Q28,20 15,-10 Z',
  fill: '#C0C0C0',
  stroke: '#A9A9A9',
  strokeWidth: 1,
  decorations: [
    { path: 'M-8,5 L-6,8 L-10,8 Z', fill: '#E8E8E8' }, // Star 1
    { path: 'M8,10 L10,13 L6,13 Z', fill: '#E8E8E8' }, // Star 2
    { path: 'M-5,20 L-3,23 L-7,23 Z', fill: '#E8E8E8' }, // Star 3
    { path: 'M5,28 L7,31 L3,31 Z', fill: '#E8E8E8' }, // Star 4
    { path: 'M0,15 L3,10 L6,15 L3,20 Z', fill: '#FFD700' }, // Center emblem
  ],
  anchor: { x: 0, y: 12 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
  animation: { type: 'flow', className: 'flow' },
  particles: { type: 'sparkles', count: 3, color: '#C0C0C0' },
};

/**
 * VIP Gold Crown - ornate golden crown with extra gems
 */
const vipGoldCrownVector: VectorCostume = {
  id: 'vip_gold_crown',
  path: 'M-25,-8 L-20,-28 L-12,-12 L0,-32 L12,-12 L20,-28 L25,-8 L22,5 L-22,5 Z',
  fill: '#FFD700',
  stroke: '#DAA520',
  strokeWidth: 1.5,
  decorations: [
    { path: 'M0,-24 L4,-20 L0,-16 L-4,-20 Z', fill: '#FF0000', stroke: '#8B0000' }, // Center ruby
    { path: 'M-14,-16 L-11,-13 L-14,-10 L-17,-13 Z', fill: '#0000FF', stroke: '#00008B' }, // Left sapphire
    { path: 'M14,-16 L17,-13 L14,-10 L11,-13 Z', fill: '#00FF00', stroke: '#006400' }, // Right emerald
    { path: 'M-20,-20 A2,2 0 1,1 -20,-19.9 Z', fill: '#FFFFFF' }, // Left pearl
    { path: 'M20,-20 A2,2 0 1,1 20,-19.9 Z', fill: '#FFFFFF' }, // Right pearl
    { path: 'M-7,-8 A1.5,1.5 0 1,1 -7,-7.9 Z', fill: '#E6E6FA' }, // Small gem 1
    { path: 'M7,-8 A1.5,1.5 0 1,1 7,-7.9 Z', fill: '#E6E6FA' }, // Small gem 2
    { path: 'M0,-5 L2,-3 L0,-1 L-2,-3 Z', fill: '#FFD700' }, // Bottom sparkle
  ],
  anchor: { x: 0, y: -35 },
  scales: { xs: 0.4, sm: 0.5, md: 0.65, lg: 0.8, xl: 1.0 },
  animation: { type: 'glow', className: 'glow-vip' },
  particles: { type: 'sparkles', count: 5, color: '#FFD700' },
};

/**
 * Map of costume IDs to vector definitions
 */
export const COSTUME_VECTORS: Record<string, VectorCostume> = {
  crown: crownVector,
  wizard_hat: wizardHatVector,
  party_hat: partyHatVector,
  top_hat: topHatVector,
  bow_tie: bowTieVector,
  sunglasses: sunglassesVector,
  superhero: superheroVector,
  pirate: pirateVector,
  sweater: sweaterVector,
  tuxedo: tuxedoVector,
  necklace: necklaceVector,
  scarf: scarfVector,
  angel_wings: angelWingsVector,
  dragon: dragonVector,
  astronaut: astronautVector,
  unicorn: unicornVector,
  vip_bronze_collar: vipBronzeCollarVector,
  vip_silver_cape: vipSilverCapeVector,
  vip_gold_crown: vipGoldCrownVector,
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
