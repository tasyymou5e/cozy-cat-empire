/**
 * @fileoverview Barrel export for relationship hooks
 * 
 * The relationship system is decomposed into focused hooks for maintainability:
 * - useRelationshipCore: State + CRUD operations
 * - useRelationshipEvents: Event handling and history
 * - useRelationshipDecay: Decay processing and maintenance streaks
 * - useRelationshipGroups: Group/clique detection
 * - useRelationshipBreeding: Breeding compatibility checks
 * 
 * @module hooks/relationships
 */

export { useRelationships } from './useRelationships';
export type { RelationshipSaveData, BreedingCompatibility, SocializeResult } from './useRelationships';

// Individual hooks for advanced use cases
export { useRelationshipCore } from './useRelationshipCore';
export { useRelationshipEvents } from './useRelationshipEvents';
export { useRelationshipDecay } from './useRelationshipDecay';
export { useRelationshipGroups } from './useRelationshipGroups';
export { useRelationshipBreeding } from './useRelationshipBreeding';
