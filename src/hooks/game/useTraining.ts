/**
 * @fileoverview useTraining - Training and socialization domain hook
 *
 * Handles cat training, resting, and social activities:
 * - Individual trick training
 * - Cat resting for energy recovery
 * - Group activities within relationship groups
 * - Two-cat socialization for relationship building
 *
 * Training costs resources and affects cat grades through trick learning.
 *
 * @module hooks/game/useTraining
 */

import { useCallback } from 'react';
import { TrickId, TRICKS } from '@/types/grading';
import { GameHookDependencies } from './types';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useTraining');

/**
 * Actions available for training and socialization
 */
export interface TrainingActions {
  /**
   * Train a cat on a specific trick.
   * Costs 1 treat + 1 toy. Progress depends on rest level.
   * @param catId - ID of the cat to train
   * @param trickId - ID of the trick to learn
   */
  trainCat: (catId: string, trickId: TrickId) => void;

  /**
   * Rest a tired cat to recover energy.
   * Improves rest level, small happiness boost.
   * @param catId - ID of the cat to rest
   */
  restCat: (catId: string) => void;

  /**
   * Do a group activity with cats in a relationship group.
   * Options: 'play' (toys), 'treat' (treats), 'nap' (free).
   * @param groupId - ID of the cat group
   * @param activityType - Type of activity
   */
  doGroupActivity: (groupId: string, activityType: 'play' | 'treat' | 'nap') => void;

  /**
   * Socialize two cats together.
   * Costs 2 treats. Improves relationship and happiness.
   * @param cat1Id - First cat ID
   * @param cat2Id - Second cat ID
   */
  socializeCats: (cat1Id: string, cat2Id: string) => void;
}

/**
 * Hook for managing cat training and socialization.
 *
 * @param deps - Shared game hook dependencies
 * @returns Object containing all training actions
 *
 * @example
 * ```typescript
 * const { trainCat, restCat, socializeCats } = useTraining(deps);
 *
 * // Train a cat to sit
 * trainCat('cat-123', 'sit');
 *
 * // Rest a tired cat
 * restCat('cat-123');
 *
 * // Socialize two cats
 * socializeCats('cat-123', 'cat-456');
 * ```
 */
export function useTraining(deps: GameHookDependencies): TrainingActions {
  const { setState, showMessage, playSound, relationshipSystem, onChallengeProgress } = deps;

  const trainCat = useCallback(
    (catId: string, trickId: TrickId) => {
      logger.info('[trainCat] Called with:', { catId, trickId });
      setState((prev) => {
        logger.info('[trainCat] setState prev resources:', prev.resources, 'day:', prev.day);
        if (prev.resources.treats < 1 || prev.resources.toys < 1) {
          logger.info('[trainCat] Not enough resources - treats:', prev.resources.treats, 'toys:', prev.resources.toys);
          showMessage('Need 1 treat and 1 toy to train! 🎾', 'warning');
          playSound?.('error');
          return prev;
        }

        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) return prev;

        // Cats can only train once per day
        if (cat.lastTrainingDay >= prev.day) {
          showMessage(`${cat.name} already trained today! Try tomorrow.`, 'warning');
          return prev;
        }

        const trick = TRICKS.find((t) => t.id === trickId);
        if (!trick) return prev;

        // Well-rested cats learn faster
        const restBonus = cat.restLevel >= 80 ? 10 : 0;
        const progressGain = 20 + Math.floor(Math.random() * 20) + restBonus;
        const newProgress = Math.min(100, (cat.trickProgress[trickId] || 0) + progressGain);
        const learned = newProgress >= 100;

        const newTrickProgress = { ...cat.trickProgress, [trickId]: newProgress };
        const newTricksLearned =
          learned && !cat.tricksLearned.includes(trickId)
            ? [...cat.tricksLearned, trickId]
            : cat.tricksLearned;

        let gradeBonus = 0;
        if (learned && !cat.tricksLearned.includes(trickId)) {
          gradeBonus = trick.gradeBonus;
          showMessage(`🎉 ${cat.name} learned ${trick.name}! (+${gradeBonus} grade)`, 'success');
          playSound?.('levelUp');
          onChallengeProgress?.('train_tricks', 1);
        } else {
          showMessage(`${cat.name} practiced ${trick.name}! (${newProgress}% progress)`, 'info');
          playSound?.('click');
        }

        return {
          ...prev,
          resources: {
            ...prev.resources,
            treats: prev.resources.treats - 1,
            toys: prev.resources.toys - 1,
          },
          cats: prev.cats.map((c) => {
            if (c.id !== catId) return c;
            return {
              ...c,
              trickProgress: newTrickProgress,
              tricksLearned: newTricksLearned,
              grade: Math.min(20, c.grade + gradeBonus),
              restLevel: Math.max(0, c.restLevel - 10),
              lastTrainingDay: prev.day,
            };
          }),
        };
      });
    },
    [setState, showMessage, playSound, onChallengeProgress]
  );

  const restCat = useCallback(
    (catId: string) => {
      setState((prev) => {
        const cat = prev.cats.find((c) => c.id === catId);
        if (!cat) return prev;

        const restGain = 20;
        const newRest = Math.min(100, cat.restLevel + restGain);
        // Bonus grade for reaching full rest
        const gradeBonus = newRest >= 80 && cat.restLevel < 80 ? 0.25 : 0;

        showMessage(`${cat.name} is resting... 😴`, 'info');
        playSound?.('purr');

        return {
          ...prev,
          cats: prev.cats.map((c) => {
            if (c.id !== catId) return c;
            return {
              ...c,
              restLevel: newRest,
              grade: Math.min(20, c.grade + gradeBonus),
              happiness: Math.min(100, c.happiness + 5),
            };
          }),
        };
      });
    },
    [setState, showMessage, playSound]
  );

  const doGroupActivity = useCallback(
    (groupId: string, activityType: 'play' | 'treat' | 'nap') => {
      const group = relationshipSystem.groups.find((g) => g.id === groupId);
      if (!group) return;

      // Resource costs and happiness/relationship bonuses by activity type
      const costs = {
        play: { toys: 1, treats: 0 },
        treat: { toys: 0, treats: 2 },
        nap: { toys: 0, treats: 0 },
      };
      const bonuses = {
        play: { happiness: 10, relationship: 5 },
        treat: { happiness: 8, relationship: 8 },
        nap: { happiness: 5, relationship: 3 },
      };

      setState((prev) => {
        const cost = costs[activityType];
        if (prev.resources.toys < cost.toys || prev.resources.treats < cost.treats) {
          showMessage('Not enough resources for group activity!', 'warning');
          playSound?.('error');
          return prev;
        }

        const bonus = bonuses[activityType];
        const memberCats = prev.cats.filter((c) => group.memberIds.includes(c.id));

        // Add relationship events between all group members
        for (let i = 0; i < memberCats.length; i++) {
          for (let j = i + 1; j < memberCats.length; j++) {
            relationshipSystem.addEvent(
              memberCats[i],
              memberCats[j],
              'positive',
              `${memberCats[i].name} and ${memberCats[j].name} did a group ${activityType} activity`,
              bonus.relationship,
              prev.day
            );
          }
        }

        const activityNames = { play: 'playtime', treat: 'treat party', nap: 'nap session' };
        showMessage(`${group.name} had a group ${activityNames[activityType]}! 🎉`, 'success');
        playSound?.('friendship');

        return {
          ...prev,
          resources: {
            ...prev.resources,
            toys: prev.resources.toys - cost.toys,
            treats: prev.resources.treats - cost.treats,
          },
          cats: prev.cats.map((cat) => {
            if (group.memberIds.includes(cat.id)) {
              return { ...cat, happiness: Math.min(100, cat.happiness + bonus.happiness) };
            }
            return cat;
          }),
        };
      });
    },
    [setState, showMessage, playSound, relationshipSystem]
  );

  const socializeCats = useCallback(
    (cat1Id: string, cat2Id: string) => {
      setState((prev) => {
        if (prev.resources.treats < 2) {
          showMessage('Need 2 treats to socialize! 🍬', 'warning');
          playSound?.('error');
          return prev;
        }

        const cat1 = prev.cats.find((c) => c.id === cat1Id);
        const cat2 = prev.cats.find((c) => c.id === cat2Id);
        if (!cat1 || !cat2) return prev;

        const result = relationshipSystem.socializeCats(cat1, cat2, prev.day);
        showMessage(`🤝 ${result.message}`, 'success');
        playSound?.('friendship');
        playSound?.('purr');
        onChallengeProgress?.('socialize', 1);

        return {
          ...prev,
          resources: { ...prev.resources, treats: prev.resources.treats - 2 },
          cats: prev.cats.map((c) => {
            if (c.id === cat1Id || c.id === cat2Id) {
              return { ...c, happiness: Math.min(100, c.happiness + 5) };
            }
            return c;
          }),
        };
      });
    },
    [setState, showMessage, playSound, relationshipSystem, onChallengeProgress]
  );

  return { trainCat, restCat, doGroupActivity, socializeCats };
}
