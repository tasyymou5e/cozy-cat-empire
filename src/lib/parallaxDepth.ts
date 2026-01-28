/**
 * Micro-Depth Parallax Utilities
 * 
 * Adds per-object depth variation based on Y-position within shared parallax layers.
 * Objects lower on screen (closer to viewer) get more parallax movement.
 */

import { PARALLAX_DEPTHS, ParallaxDepth } from '@/components/empire/ParallaxLayer';

/**
 * Calculate micro-depth offset based on Y position
 * Objects lower on screen (closer to viewer) get more parallax movement
 * 
 * @param baseDepth - Base depth multiplier for the layer (e.g., 0.5 for midground)
 * @param yPercent - Object's Y position as percentage (0-100)
 * @param microRange - How much depth variation to add (0.15 = 15% extra at bottom)
 * @returns Adjusted depth multiplier
 */
export function calculateMicroDepth(
  baseDepth: number,
  yPercent: number,
  microRange: number = 0.15
): number {
  // Normalize Y to 0-1 range (0 = top, 1 = bottom)
  const yNormalized = Math.max(0, Math.min(1, yPercent / 100));
  return baseDepth + (yNormalized * microRange);
}

/**
 * Calculate individual object transform with micro-depth
 * 
 * @param offset - Parallax offset from useParallax hook
 * @param yPercent - Object's Y position as percentage (0-100)
 * @param baseDepth - Layer's base depth multiplier
 * @param microRange - Depth variation amount (default 0.15)
 * @returns CSS translate3d transform string
 */
export function getObjectParallaxTransform(
  offset: { x: number; y: number },
  yPercent: number,
  baseDepth: number,
  microRange: number = 0.15
): string {
  const depth = calculateMicroDepth(baseDepth, yPercent, microRange);
  return `translate3d(${offset.x * depth}px, ${offset.y * depth}px, 0)`;
}

/**
 * Get base depth value from layer name or number
 */
export function getBaseDepth(depth: ParallaxDepth | number): number {
  return typeof depth === 'number' ? depth : PARALLAX_DEPTHS[depth];
}

/**
 * Micro-depth configuration for different object types
 */
export const MICRO_DEPTH_CONFIG = {
  /** Props/furniture - moderate variation for subtle depth */
  props: {
    microRange: 0.12,
    baseDepth: PARALLAX_DEPTHS.midground, // 0.5
  },
  /** Cats - slightly more variation for dynamic feel as they move */
  cats: {
    microRange: 0.18,
    baseDepth: PARALLAX_DEPTHS.foreground, // 1.0
  },
  /** Floor decorations */
  floor: {
    microRange: 0.10,
    baseDepth: PARALLAX_DEPTHS.midForeground, // 0.75
  },
  /** Wall decorations - minimal variation (further back) */
  wall: {
    microRange: 0.05,
    baseDepth: PARALLAX_DEPTHS.midBackground, // 0.25
  },
} as const;
