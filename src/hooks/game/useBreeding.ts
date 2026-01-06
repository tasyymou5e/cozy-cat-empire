/**
 * useBreeding - Cat breeding domain hook
 * 
 * Handles breeding two cats to create kittens with inherited traits.
 */

import { useCallback } from 'react';
import { Cat, CAT_NAMES, BREEDS, PERSONALITIES } from '@/types/game';
import { GameHookDependencies, generateId, createDefaultTrickProgress } from './types';

export interface BreedingActions {
  breedCats: (cat1Id: string, cat2Id: string) => void;
}

export function useBreeding(deps: GameHookDependencies): BreedingActions {
  const { 
    setState, showMessage, playSound, relationshipSystem, 
    setKittensBreed, checkAchievements, onChallengeProgress, logActivity 
  } = deps;

  const breedCats = useCallback((cat1Id: string, cat2Id: string) => {
    setState(prev => {
      if (prev.breedingCooldown > 0) {
        showMessage(`Breeding on cooldown! ${prev.breedingCooldown} days left.`, 'warning');
        return prev;
      }
      if (prev.cats.length >= prev.space) {
        showMessage("No space for kittens! Upgrade home first. 🏠", 'warning');
        playSound?.('error');
        return prev;
      }

      const parent1 = prev.cats.find(c => c.id === cat1Id);
      const parent2 = prev.cats.find(c => c.id === cat2Id);
      if (!parent1 || !parent2) return prev;

      const compatibility = relationshipSystem.getBreedingCompatibility(cat1Id, cat2Id);
      if (!compatibility.canBreed) {
        showMessage(`💔 ${compatibility.message}`, 'error');
        playSound?.('hiss');
        return prev;
      }

      if (compatibility.bonus < 0 && Math.random() < 0.5) {
        showMessage(`${parent1.name} and ${parent2.name} refused to breed... 😾`, 'warning');
        playSound?.('hiss');
        return { ...prev, breedingCooldown: 2 };
      }

      const breeds = [parent1.breed, parent2.breed];
      const breed = breeds[Math.floor(Math.random() * 2)];
      
      const usedNames = new Set(prev.cats.map(c => c.name));
      const availableNames = CAT_NAMES.filter(n => !usedNames.has(n));
      const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Kitten ${prev.cats.length + 1}`;

      const healthBonus = Math.floor(compatibility.bonus / 2);
      const happinessBonus = Math.floor(compatibility.bonus / 2);
      const parentAvgGrade = Math.floor((parent1.grade + parent2.grade) / 2);
      const gradeVariance = Math.floor(Math.random() * 5) - 2;
      const kittenGrade = Math.max(1, Math.min(20, parentAvgGrade + gradeVariance + Math.floor(compatibility.bonus / 10)));

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

      relationshipSystem.addEvent(parent1, parent2, 'positive', `${parent1.name} and ${parent2.name} had a kitten together`, 15, prev.day);

      // Check if this is a best friend breeding for Perfect Match achievement
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
      
      // Log cat bred activity
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
