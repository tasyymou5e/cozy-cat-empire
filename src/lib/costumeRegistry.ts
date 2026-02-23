/**
 * @fileoverview Unified costume lookup registry
 *
 * Resolves the circular dependency between costumes.ts and seasonalContent.ts
 * by acting as a leaf-node that imports from both.
 *
 * @module lib/costumeRegistry
 */

import { COSTUMES, Costume } from '@/types/costumes';
import { SEASONS } from '@/types/seasonalContent';

/**
 * Look up a costume by ID from both standard and seasonal sources.
 *
 * @param id - Costume ID to find
 * @returns The costume if found, undefined otherwise
 */
export function getCostumeById(id: string): Costume | undefined {
  const standard = COSTUMES.find((c) => c.id === id);
  if (standard) return standard;

  for (const season of SEASONS) {
    const seasonal = season.costumes.find((c: Costume) => c.id === id);
    if (seasonal) return seasonal;
  }

  return undefined;
}
