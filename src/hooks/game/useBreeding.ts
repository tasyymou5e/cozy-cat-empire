/**
 * @fileoverview useBreeding - Cat breeding domain hook
 * 
 * Handles breeding two cats to create kittens with inherited traits.
 * Features include:
 * - Relationship-based compatibility checks
 * - Trait inheritance from parents
 * - Breeding cooldown management
 * - Achievement tracking (Perfect Match for best friends)
 * 
 * @module hooks/game/useBreeding
 */

import { useCallback } from 'react';
import { Cat, CAT_NAMES, BREEDS, PERSONALITIES } from '@/types/game';
import { GameHookDependencies, generateId, createDefaultTrickProgress } from './types';

/**
 * Actions available for cat breeding
 */
export interface BreedingActions {
  /**
   * Breed two cats to create a kitten.
   * 
   * Requirements:
   * - No active breeding cooldown
   * - Space available for new cat
   * - Compatible relationship between parents
   * 
   * The kitten inherits:
   * - Random breed from parents
   * - Averaged grade with variance
   * - Random personality
   * - Bonuses based on parent relationship
   * 
   * @param cat1Id - ID of first parent
   * @param cat2Id - ID of second parent
   */
  breedCats: (cat1Id: string, cat2Id: string) => void;
}

/**
 * Hook for cat breeding mechanics.
 * 
 * @param deps - Shared game hook dependencies
 * @returns Object containing breeding actions
 * 
 * @example
 * ```typescript
 * const { breedCats } = useBreeding(deps);
 * 
 * // Breed two cats
 * breedCats('parent-1', 'parent-2');
 * ```
 */
export function useBreeding(deps: GameHookDependencies): BreedingActions {
  const { 
    setState, showMessage, playSound, relationshipSystem, 
    setKittensBreed, checkAchievements, onChallengeProgress, logActivity 
  } = deps;

  const breedCats = useCallback((cat1Id: string, cat2Id: string) => {
    setState(prev => {
      // Check breeding cooldown
      if (prev.breedingCooldown > 0) {
        showMessage(`Breeding on cooldown! ${prev.breedingCooldown} days left.`, 'warning');
        return prev;
      }
      
      // Check space
      if (prev.cats.length >= prev.space) {
        showMessage("No space for kittens! Upgrade home first. 🏠", 'warning');
        playSound?.('error');
        return prev;
      }

      const parent1 = prev.cats.find(c => c.id === cat1Id);
      const parent2 = prev.cats.find(c => c.id === cat2Id);
      if (!parent1 || !parent2) return prev;

      // Check compatibility based on relationship
      const compatibility = relationshipSystem.getBreedingCompatibility(cat1Id, cat2Id);
      if (!compatibility.canBreed) {
        showMessage(`💔 ${compatibility.message}`, 'error');
        playSound?.('hiss');
        return prev;
      }

      // Negative compatibility may cause breeding to fail
      if (compatibility.bonus < 0 && Math.random() < 0.5) {
        showMessage(`${parent1.name} and ${parent2.name} refused to breed... 😾`, 'warning');
        playSound?.('hiss');
        return { ...prev, breedingCooldown: 2 };
      }

      // Determine kitten traits
      const breeds = [parent1.breed, parent2.breed];
      const breed = breeds[Math.floor(Math.random() * 2)];
      
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Kitten ${prev.cats.length + 1}`;

      // Calculate bonuses from parent relationship
      const healthBonus = Math.floor(compatibility.bonus / 2);
      const happinessBonus = Math.floor(compatibility.bonus / 2);
      const parentAvgGrade = Math.floor((parent1.grade + parent2.grade) / 2);
      const gradeVariance = Math.floor(Math.random() * 5) - 2;
      const kittenGrade = Math.max(1, Math.min(20, parentAvgGrade + gradeVariance + Math.floor(compatibility.bonus / 10)));

      // Create the kitten
      const kitten: Cat = {
        id: generateId(), type: 'pure', breed, name,
        health: Math.min(100, 100 + healthBonus),
        happiness: Math.min(100, 100 + happinessBonus),
        hunger: 70,
        value: Math.floor((BREEDS[parent1.breed].baseValue + BREEDS[parent2.breed].baseValue) / 2 + Math.random() * 50 + compatibility.bonus),
        age: 0,
        personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
        showWins: 0, isForSale: false,
        grade: kittenGrade,
        tricksLearned: [],
        trickProgress: createDefaultTrickProgress(),
        restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
      };

      // Add positive relationship event for parents
      relationshipSystem.addEvent(parent1, parent2, 'positive', `${parent1.name} and ${parent2.name} had a kitten together`, 15, prev.day);

      // Check for Perfect Match achievement (breeding best friends)
      const relationship = relationshipSystem.getRelationship(cat1Id, cat2Id);
      const isBestFriendBreed = relationship && relationship.level === 'bestFriend';

      setKittensBreed(k => k + 1);
      
      if (isBestFriendBreed) {
        showMessage(`💕 Perfect Match! ${parent1.name} and ${parent2.name} (best friends) had a kitten: ${name}!`, 'success');
        playSound?.('achievement');
      } else {
        const bonusMsg = compatibility.bonus > 0 ? ` (${compatibility.message})` : '';
        showMessage(`🎉 ${parent1.name} and ${parent2.name} had a kitten: ${name}!${bonusMsg}`, 'success');
      }
      playSound?.('meow');
      playSound?.('success');
      onChallengeProgress?.('breed_kittens', 1);
      
      // Log breeding activity
      logActivity?.({
        activityType: 'cat_bred',
        activityDescription: `Bred a new ${breed} kitten named ${name}`,
        metadata: {
          kitten_name: name,
          kitten_breed: breed,
          parent1: parent1.name,
          parent2: parent2.name,
          wasBestFriendBreed: isBestFriendBreed
        }
      });

      const newState = { ...prev, cats: [...prev.cats, kitten], breedingCooldown: 5 };
      return checkAchievements(newState, 1, isBestFriendBreed);
    });
  }, [setState, showMessage, playSound, relationshipSystem, setKittensBreed, checkAchievements, onChallengeProgress, logActivity]);

  return { breedCats };
}
