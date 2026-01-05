import { useState, useEffect, useCallback } from 'react';
import { Milestone, MILESTONES, getMilestoneProgress } from '@/types/milestones';

interface MilestoneStats {
  totalMoneyEarned: number;
  totalShowWins: number;
  catsOwned: number;
  day: number;
  kittensBred: number;
}

interface UseMilestonesReturn {
  unlockedMilestones: string[];
  pendingCelebration: Milestone | null;
  playerTitle: string | null;
  checkMilestones: (stats: MilestoneStats) => Milestone | null;
  claimMilestone: () => number; // Returns reward coins
  dismissCelebration: () => void;
}

const STORAGE_KEY = 'cat-farm-milestones';
const TITLE_KEY = 'cat-farm-player-title';

export function useMilestones(): UseMilestonesReturn {
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [playerTitle, setPlayerTitle] = useState<string | null>(() => {
    return localStorage.getItem(TITLE_KEY);
  });
  
  const [pendingCelebration, setPendingCelebration] = useState<Milestone | null>(null);

  // Persist unlocked milestones
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMilestones));
  }, [unlockedMilestones]);

  // Persist player title
  useEffect(() => {
    if (playerTitle) {
      localStorage.setItem(TITLE_KEY, playerTitle);
    }
  }, [playerTitle]);

  const checkMilestones = useCallback((stats: MilestoneStats): Milestone | null => {
    for (const milestone of MILESTONES) {
      if (unlockedMilestones.includes(milestone.id)) continue;
      
      const progress = getMilestoneProgress(milestone, stats);
      if (progress >= milestone.threshold) {
        // Milestone achieved!
        setPendingCelebration(milestone);
        return milestone;
      }
    }
    return null;
  }, [unlockedMilestones]);

  const claimMilestone = useCallback((): number => {
    if (!pendingCelebration) return 0;
    
    const milestone = pendingCelebration;
    
    // Mark as unlocked
    setUnlockedMilestones(prev => [...prev, milestone.id]);
    
    // Set title if available
    if (milestone.reward.title) {
      setPlayerTitle(milestone.reward.title);
    }
    
    // Clear pending
    setPendingCelebration(null);
    
    return milestone.reward.coins || 0;
  }, [pendingCelebration]);

  const dismissCelebration = useCallback(() => {
    setPendingCelebration(null);
  }, []);

  return {
    unlockedMilestones,
    pendingCelebration,
    playerTitle,
    checkMilestones,
    claimMilestone,
    dismissCelebration,
  };
}
