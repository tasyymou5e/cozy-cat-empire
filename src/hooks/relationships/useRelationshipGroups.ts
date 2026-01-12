/**
 * @fileoverview Social group/clique detection
 * @module hooks/relationships/useRelationshipGroups
 */

import { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import { CatRelationship, CatGroup } from '@/types/relationships';
import { generateId } from '@/lib/utils';

interface UseRelationshipGroupsOptions {
  relationships: CatRelationship[];
}

/**
 * Detects and manages social groups among cats
 */
export function useRelationshipGroups({ relationships }: UseRelationshipGroupsOptions) {
  const [groups, setGroups] = useState<CatGroup[]>([]);

  /**
   * Detects social groups/cliques among cats using graph analysis
   */
  const detectGroups = useCallback(
    (cats: Cat[]) => {
      if (cats.length < 2) {
        setGroups([]);
        return;
      }

      const friendships = relationships.filter((r) => r.score >= 20);
      const rivalries = relationships.filter((r) => r.score <= -20);

      // Build adjacency list for friends
      const friendGraph: Record<string, Set<string>> = {};
      cats.forEach((c) => {
        friendGraph[c.id] = new Set();
      });

      friendships.forEach((r) => {
        if (friendGraph[r.catId1] && friendGraph[r.catId2]) {
          friendGraph[r.catId1].add(r.catId2);
          friendGraph[r.catId2].add(r.catId1);
        }
      });

      // Find connected components (friend groups)
      const visited = new Set<string>();
      const newGroups: CatGroup[] = [];

      const dfs = (catId: string, group: string[]) => {
        if (visited.has(catId)) return;
        visited.add(catId);
        group.push(catId);
        friendGraph[catId]?.forEach((friendId) => dfs(friendId, group));
      };

      cats.forEach((cat) => {
        if (!visited.has(cat.id) && friendGraph[cat.id]?.size > 0) {
          const group: string[] = [];
          dfs(cat.id, group);

          if (group.length >= 2) {
            const leaderId = group.reduce((a, b) =>
              (friendGraph[a]?.size || 0) >= (friendGraph[b]?.size || 0) ? a : b
            );

            const groupNames = [
              'The Cozy Crew',
              'Nap Squad',
              'The Purr Pack',
              'Whisker Gang',
              'Sunny Spot Club',
              'The Cuddle Clique',
              'Treat Team',
              'Meow Mob',
            ];

            newGroups.push({
              id: generateId(),
              name: groupNames[newGroups.length % groupNames.length],
              memberIds: group,
              leaderCatId: leaderId,
              type: 'friendly',
            });
          }
        }
      });

      // Find outcasts (cats with no friends and mostly rivalries)
      const outcasts = cats.filter((cat) => {
        const hasNoFriends = !friendships.some((r) => r.catId1 === cat.id || r.catId2 === cat.id);
        const hasRivalries = rivalries.some((r) => r.catId1 === cat.id || r.catId2 === cat.id);
        return hasNoFriends && hasRivalries;
      });

      if (outcasts.length >= 2) {
        newGroups.push({
          id: generateId(),
          name: 'The Loners',
          memberIds: outcasts.map((c) => c.id),
          leaderCatId: outcasts[0].id,
          type: 'outcasts',
        });
      }

      setGroups(newGroups);
    },
    [relationships]
  );

  return {
    groups,
    detectGroups,
  };
}
