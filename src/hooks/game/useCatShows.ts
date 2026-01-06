/**
 * useCatShows - Cat show competitions domain hook
 * 
 * Handles entering cats in shows, calculating scores, and distributing prizes.
 */

import { useCallback } from 'react';
import { BREEDS } from '@/types/game';
import { ShowTier, SHOW_TIERS, getCurrentSeasonalEvent, getSpecialEvent } from '@/types/showEvents';
import { GameHookDependencies, SHOW_COOLDOWN_DAYS } from './types';

export interface CatShowActions {
  catShow: (tier?: ShowTier) => void;
}

export function useCatShows(deps: GameHookDependencies): CatShowActions {
  const { setState, showMessage, playSound, relationshipSystem, onChallengeProgress, logActivity } = deps;

  const catShow = useCallback((tier: ShowTier = 'local') => {
    setState(prev => {
      if (prev.showCooldown > 0) {
        showMessage(`Next show in ${prev.showCooldown} days! Cat shows are every ${SHOW_COOLDOWN_DAYS} days. 🎪`, 'warning');
        playSound?.('error');
        return prev;
      }

      const tierInfo = SHOW_TIERS.find(t => t.id === tier)!;
      
      // Check if player has enough wins to enter this tier
      if (prev.totalShowWins < tierInfo.minWins) {
        showMessage(`Need ${tierInfo.minWins} wins to enter ${tierInfo.name}! 🏆`, 'warning');
        playSound?.('error');
        return prev;
      }

      // Check entry fee
      if (prev.money < tierInfo.entryFee) {
        showMessage(`Need $${tierInfo.entryFee} entry fee for ${tierInfo.name}! 💰`, 'warning');
        playSound?.('error');
        return prev;
      }

      // Get eligible cats for this tier (healthy, happy, and meets grade requirement)
      const eligibleCats = prev.cats.filter(
        c => c.health >= 70 && c.happiness >= 60 && c.grade >= tierInfo.minGrade
      );
      
      if (eligibleCats.length === 0) {
        showMessage(`No cats meet ${tierInfo.name} requirements (Grade ${tierInfo.minGrade}+, healthy, happy)! 🎪`, 'warning');
        playSound?.('error');
        return prev;
      }
      
      // Calculate event bonuses
      const seasonalEvent = getCurrentSeasonalEvent(prev.day);
      const specialEvent = getSpecialEvent(prev.day);
      let eventMultiplier = 1;
      let eventName = '';
      
      if (seasonalEvent) {
        eventMultiplier *= seasonalEvent.bonusMultiplier;
        eventName = seasonalEvent.name;
      }
      if (specialEvent) {
        eventMultiplier *= specialEvent.bonusMultiplier;
        eventName = specialEvent.name;
      }
      
      const totalMultiplier = tierInfo.rewardMultiplier * eventMultiplier;
      
      const participants = eligibleCats.slice(0, 5);
      let totalReward = 0;
      let wins = 0;
      const winners: string[] = [];
      const losers: string[] = [];
      
      // Higher tier = harder competition
      const difficultyModifier = 1 + (SHOW_TIERS.indexOf(tierInfo) * 0.15);
      
      const updatedCats = prev.cats.map(cat => {
        if (!participants.find(p => p.id === cat.id)) return cat;
        
        const friendsInShow = participants.filter(p => {
          if (p.id === cat.id) return false;
          const rel = relationshipSystem.getRelationship(cat.id, p.id);
          return rel && rel.score >= 20;
        });
        const friendBonus = friendsInShow.length * 5;
        
        // Grade now matters more for higher tiers
        const gradeBonus = (cat.grade - tierInfo.minGrade) * 3;
        
        const score = cat.health + cat.happiness + (BREEDS[cat.breed].rarity * 10) + 
                      (cat.showWins * 5) + friendBonus + gradeBonus;
        const threshold = 200 * difficultyModifier;
        const won = Math.random() * threshold < score;
        
        if (won) {
          wins++;
          winners.push(cat.id);
          const baseReward = (50 + BREEDS[cat.breed].baseValue / 2) * totalMultiplier;
          totalReward += baseReward;
          return { ...cat, showWins: cat.showWins + 1, value: cat.value + Math.floor(20 * tierInfo.rewardMultiplier) };
        }
        losers.push(cat.id);
        return cat;
      });
      
      if (winners.length > 0 && losers.length > 0 && Math.random() < 0.2) {
        const winnerId = winners[Math.floor(Math.random() * winners.length)];
        const loserId = losers[Math.floor(Math.random() * losers.length)];
        const winner = prev.cats.find(c => c.id === winnerId);
        const loser = prev.cats.find(c => c.id === loserId);
        if (winner && loser) {
          relationshipSystem.addEvent(loser, winner, 'negative', `${loser.name} is jealous of ${winner.name}'s show win`, -5, prev.day);
        }
      }
      
      if (winners.length >= 2 && Math.random() < 0.3) {
        const cat1 = prev.cats.find(c => c.id === winners[0]);
        const cat2 = prev.cats.find(c => c.id === winners[1]);
        if (cat1 && cat2) {
          relationshipSystem.addEvent(cat1, cat2, 'positive', `${cat1.name} and ${cat2.name} celebrated their show wins together`, 5, prev.day);
        }
      }
      
      totalReward = Math.floor(totalReward);
      const netReward = totalReward - tierInfo.entryFee;
      
      let resultMsg = `${tierInfo.emoji} ${tierInfo.name}: ${wins} wins! `;
      if (tierInfo.entryFee > 0) {
        resultMsg += `Earned $${totalReward} - $${tierInfo.entryFee} fee = $${netReward}. `;
      } else {
        resultMsg += `Earned $${totalReward}. `;
      }
      if (eventName) {
        resultMsg += `(${eventMultiplier}x ${eventName} bonus!) `;
      }
      resultMsg += `🏆`;
      
      showMessage(resultMsg, wins > 0 ? 'success' : 'info');
      if (wins > 0) {
        playSound?.('achievement');
        playSound?.('coin');
        onChallengeProgress?.('show_wins', wins);
        
        // Log show win activity
        logActivity?.({
          activityType: 'show_win',
          activityDescription: `Won ${wins} award${wins > 1 ? 's' : ''} at the ${tierInfo.name}!`,
          metadata: {
            tier: tier,
            wins: wins,
            reward: Math.floor(totalReward)
          }
        });
      }
      
      return {
        ...prev,
        money: prev.money + netReward,
        cats: updatedCats,
        totalShowWins: prev.totalShowWins + wins,
        reputation: prev.reputation + wins * 2 * tierInfo.rewardMultiplier,
        showCooldown: SHOW_COOLDOWN_DAYS,
      };
    });
  }, [setState, showMessage, playSound, relationshipSystem, onChallengeProgress, logActivity]);

  return { catShow };
}
