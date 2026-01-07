import { Cat } from '@/types/game';
import { CatRelationship, getRelationshipLevel, RelationshipLevel } from '@/types/relationships';

/**
 * Relationship utility functions
 *
 * Extracted from UnifiedCatCard for reuse across components.
 * These functions handle common relationship calculations.
 */

/**
 * Get all relationships involving a specific cat
 */
export function getCatRelationships(
  catId: string,
  relationships: CatRelationship[]
): CatRelationship[] {
  return relationships.filter((r) => r.catId1 === catId || r.catId2 === catId);
}

/**
 * Get the ID of the other cat in a relationship
 */
export function getOtherCatId(catId: string, relationship: CatRelationship): string {
  return relationship.catId1 === catId ? relationship.catId2 : relationship.catId1;
}

/**
 * Filter relationships by level(s)
 */
export function filterRelationshipsByLevel(
  relationships: CatRelationship[],
  levels: RelationshipLevel[]
): CatRelationship[] {
  return relationships.filter((r) => levels.includes(getRelationshipLevel(r.score)));
}

/**
 * Count friends (friend or bestFriend level) for a cat
 */
export function countFriends(catId: string, relationships: CatRelationship[]): number {
  const catRels = getCatRelationships(catId, relationships);
  return catRels.filter((r) => {
    const level = getRelationshipLevel(r.score);
    return level === 'friend' || level === 'bestFriend';
  }).length;
}

/**
 * Count enemies (enemy or rival level) for a cat
 */
export function countEnemies(catId: string, relationships: CatRelationship[]): number {
  const catRels = getCatRelationships(catId, relationships);
  return catRels.filter((r) => {
    const level = getRelationshipLevel(r.score);
    return level === 'enemy' || level === 'rival';
  }).length;
}

/**
 * Get friend relationships for a cat
 */
export function getFriendRelationships(
  catId: string,
  relationships: CatRelationship[]
): CatRelationship[] {
  const catRels = getCatRelationships(catId, relationships);
  return catRels.filter((r) => {
    const level = getRelationshipLevel(r.score);
    return level === 'friend' || level === 'bestFriend';
  });
}

/**
 * Get enemy relationships for a cat
 */
export function getEnemyRelationships(
  catId: string,
  relationships: CatRelationship[]
): CatRelationship[] {
  const catRels = getCatRelationships(catId, relationships);
  return catRels.filter((r) => {
    const level = getRelationshipLevel(r.score);
    return level === 'enemy' || level === 'rival';
  });
}

/**
 * Get the best friend of a cat (if any)
 */
export function getBestFriend(
  catId: string,
  relationships: CatRelationship[],
  cats: Cat[]
): Cat | null {
  const catRels = getCatRelationships(catId, relationships);
  const bestFriendRel = catRels.find((r) => getRelationshipLevel(r.score) === 'bestFriend');

  if (!bestFriendRel) return null;

  const bestFriendId = getOtherCatId(catId, bestFriendRel);
  return cats.find((c) => c.id === bestFriendId) || null;
}

/**
 * Get the worst enemy of a cat (if any)
 */
export function getWorstEnemy(
  catId: string,
  relationships: CatRelationship[],
  cats: Cat[]
): Cat | null {
  const catRels = getCatRelationships(catId, relationships);
  const enemyRel = catRels
    .filter((r) => {
      const level = getRelationshipLevel(r.score);
      return level === 'enemy' || level === 'rival';
    })
    .sort((a, b) => a.score - b.score)[0]; // Most negative first

  if (!enemyRel) return null;

  const enemyId = getOtherCatId(catId, enemyRel);
  return cats.find((c) => c.id === enemyId) || null;
}

/**
 * Check if a cat needs social attention (more enemies than friends or low relationships)
 */
export function needsSocialAttention(catId: string, relationships: CatRelationship[]): boolean {
  const friends = countFriends(catId, relationships);
  const enemies = countEnemies(catId, relationships);
  return enemies > friends;
}

/**
 * Get relationship summary for a cat
 */
export function getRelationshipSummary(
  catId: string,
  relationships: CatRelationship[],
  cats: Cat[]
) {
  const catRels = getCatRelationships(catId, relationships);
  const friendRels = getFriendRelationships(catId, relationships);
  const enemyRels = getEnemyRelationships(catId, relationships);
  const bestFriend = getBestFriend(catId, relationships, cats);

  return {
    totalRelationships: catRels.length,
    friendCount: friendRels.length,
    enemyCount: enemyRels.length,
    bestFriend,
    needsAttention: enemyRels.length > friendRels.length,
  };
}
