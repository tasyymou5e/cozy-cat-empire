/**
 * useBulkActions - Bulk operations domain hook
 * 
 * Handles mass operations on multiple cats at once.
 */

import { useCallback } from 'react';
import { TRICKS } from '@/types/grading';
import { GameHookDependencies } from './types';

export interface BulkActionsType {
  healAllSickCats: () => void;
  restAllTiredCats: () => void;
  comfortAllUnhappyCats: () => void;
  trainAllAvailableCats: () => void;
  sellSelectedCats: (catIds: string[]) => void;
  socializeAllNeglected: () => void;
}

export function useBulkActions(deps: GameHookDependencies): BulkActionsType {
  const { setState, showMessage, playSound, relationshipSystem, onChallengeProgress } = deps;

  const healAllSickCats = useCallback(() => {
    setState(prev => {
      const sickCats = prev.cats.filter(c => c.health < 70);
      if (sickCats.length === 0) {
        showMessage("All cats are healthy! 💚", 'info');
        return prev;
      }
      if (prev.resources.medicine < sickCats.length) {
        showMessage(`Need ${sickCats.length} medicine to heal all sick cats!`, 'warning');
        playSound?.('error');
        return prev;
      }
      showMessage(`Healed ${sickCats.length} cats! All better now! 💚`, 'success');
      playSound?.('success');
      return {
        ...prev,
        resources: { ...prev.resources, medicine: prev.resources.medicine - sickCats.length },
        cats: prev.cats.map(c => c.health < 70 ? { ...c, health: 100 } : c),
      };
    });
  }, [setState, showMessage, playSound]);

  const restAllTiredCats = useCallback(() => {
    setState(prev => {
      const tiredCats = prev.cats.filter(c => c.restLevel < 50);
      if (tiredCats.length === 0) {
        showMessage("All cats are well-rested! 😴", 'info');
        return prev;
      }
      showMessage(`${tiredCats.length} tired cats are resting... 😴`, 'success');
      playSound?.('purr');
      return {
        ...prev,
        cats: prev.cats.map(c => {
          if (c.restLevel >= 50) return c;
          const newRest = Math.min(100, c.restLevel + 30);
          const gradeBonus = newRest >= 80 && c.restLevel < 80 ? 0.25 : 0;
          return { 
            ...c, 
            restLevel: newRest, 
            grade: Math.min(20, c.grade + gradeBonus), 
            happiness: Math.min(100, c.happiness + 5) 
          };
        }),
      };
    });
  }, [setState, showMessage, playSound]);

  const comfortAllUnhappyCats = useCallback(() => {
    setState(prev => {
      const unhappyCats = prev.cats.filter(c => c.happiness < 50);
      if (unhappyCats.length === 0) {
        showMessage("All cats are happy! 😊", 'info');
        return prev;
      }
      showMessage(`Comforted ${unhappyCats.length} unhappy cats! They feel loved! 💕`, 'success');
      playSound?.('purr');
      return {
        ...prev,
        cats: prev.cats.map(c => 
          c.happiness < 50 
            ? { ...c, happiness: Math.min(100, c.happiness + 30), health: Math.min(100, c.health + 5) }
            : c
        ),
      };
    });
  }, [setState, showMessage, playSound]);

  const trainAllAvailableCats = useCallback(() => {
    setState(prev => {
      const trainableCats = prev.cats.filter(c => 
        c.lastTrainingDay < prev.day && 
        TRICKS.some(t => !c.tricksLearned.includes(t.id))
      );
      if (trainableCats.length === 0) {
        showMessage("No cats available for training today!", 'info');
        return prev;
      }
      const resourceCost = trainableCats.length;
      if (prev.resources.treats < resourceCost || prev.resources.toys < resourceCost) {
        showMessage(`Need ${resourceCost} treats and ${resourceCost} toys to train all!`, 'warning');
        playSound?.('error');
        return prev;
      }
      
      let trainedCount = 0;
      let tricksLearned = 0;
      const updatedCats = prev.cats.map(c => {
        if (c.lastTrainingDay >= prev.day) return c;
        const nextTrick = TRICKS.find(t => !c.tricksLearned.includes(t.id));
        if (!nextTrick) return c;
        
        trainedCount++;
        const restBonus = c.restLevel >= 80 ? 10 : 0;
        const progressGain = 20 + Math.floor(Math.random() * 20) + restBonus;
        const newProgress = Math.min(100, (c.trickProgress[nextTrick.id] || 0) + progressGain);
        const learned = newProgress >= 100;
        
        if (learned) tricksLearned++;
        
        return {
          ...c,
          trickProgress: { ...c.trickProgress, [nextTrick.id]: newProgress },
          tricksLearned: learned && !c.tricksLearned.includes(nextTrick.id) 
            ? [...c.tricksLearned, nextTrick.id] 
            : c.tricksLearned,
          grade: learned ? Math.min(20, c.grade + nextTrick.gradeBonus) : c.grade,
          restLevel: Math.max(0, c.restLevel - 10),
          lastTrainingDay: prev.day,
        };
      });
      
      let msg = `Trained ${trainedCount} cats today! 🎾`;
      if (tricksLearned > 0) {
        msg = `Trained ${trainedCount} cats - ${tricksLearned} learned new tricks! 🎉`;
      }
      showMessage(msg, 'success');
      playSound?.('success');
      onChallengeProgress?.('train_tricks', tricksLearned);
      
      return {
        ...prev,
        resources: { 
          ...prev.resources, 
          treats: prev.resources.treats - trainedCount, 
          toys: prev.resources.toys - trainedCount 
        },
        cats: updatedCats,
      };
    });
  }, [setState, showMessage, playSound, onChallengeProgress]);

  const socializeAllNeglected = useCallback(() => {
    setState(prev => {
      // Find relationships that haven't been interacted with in 2+ days
      const neglectedPairs: Array<{ cat1Id: string; cat2Id: string }> = [];
      
      for (const rel of relationshipSystem.relationships) {
        const daysSinceInteraction = prev.day - rel.lastInteraction;
        if (daysSinceInteraction >= 2) {
          const cat1 = prev.cats.find(c => c.id === rel.catId1);
          const cat2 = prev.cats.find(c => c.id === rel.catId2);
          if (cat1 && cat2) {
            neglectedPairs.push({ cat1Id: cat1.id, cat2Id: cat2.id });
          }
        }
      }
      
      if (neglectedPairs.length === 0) {
        showMessage("All relationships are healthy! No socialization needed. 💚", 'info');
        return prev;
      }
      
      const treatCost = neglectedPairs.length * 2;
      if (prev.resources.treats < treatCost) {
        showMessage(`Need ${treatCost} treats to socialize all neglected pairs!`, 'warning');
        playSound?.('error');
        return prev;
      }
      
      // Socialize each pair
      for (const pair of neglectedPairs) {
        const cat1 = prev.cats.find(c => c.id === pair.cat1Id);
        const cat2 = prev.cats.find(c => c.id === pair.cat2Id);
        if (cat1 && cat2) {
          relationshipSystem.socializeCats(cat1, cat2, prev.day);
        }
      }
      
      showMessage(`Socialized ${neglectedPairs.length} cat pairs! Relationships improved! 🤝`, 'success');
      playSound?.('friendship');
      onChallengeProgress?.('socialize', neglectedPairs.length);
      
      return {
        ...prev,
        resources: { ...prev.resources, treats: prev.resources.treats - treatCost },
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem, onChallengeProgress]);

  const sellSelectedCats = useCallback((catIds: string[]) => {
    if (catIds.length === 0) return;
    setState(prev => {
      let totalEarnings = 0;
      const catsToSell = prev.cats.filter(c => catIds.includes(c.id));
      catsToSell.forEach(cat => {
        const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
        totalEarnings += sellPrice;
        relationshipSystem.removeCatRelationships(cat.id);
      });
      showMessage(`Sold ${catsToSell.length} cats for $${totalEarnings}! 💰`, 'success');
      playSound?.('coin');
      return {
        ...prev,
        money: prev.money + totalEarnings,
        cats: prev.cats.filter(c => !catIds.includes(c.id)),
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem]);

  return { 
    healAllSickCats, 
    restAllTiredCats, 
    comfortAllUnhappyCats, 
    trainAllAvailableCats, 
    sellSelectedCats, 
    socializeAllNeglected 
  };
}
