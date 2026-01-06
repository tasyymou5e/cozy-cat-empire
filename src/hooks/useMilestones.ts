import { useState, useEffect, useCallback } from 'react';
import { Milestone, MILESTONES, getMilestoneProgress } from '@/types/milestones';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  claimMilestone: () => number;
  dismissCelebration: () => void;
}

const STORAGE_KEY = 'cat-farm-milestones';
const TITLE_KEY = 'cat-farm-player-title';

export function useMilestones(): UseMilestonesReturn {
  const { user } = useAuth();
  
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [playerTitle, setPlayerTitle] = useState<string | null>(() => {
    return localStorage.getItem(TITLE_KEY);
  });
  
  const [pendingCelebration, setPendingCelebration] = useState<Milestone | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Load from cloud on mount
  useEffect(() => {
    if (!user?.id || cloudLoaded) return;
    
    const loadFromCloud = async () => {
      const { data } = await supabase
        .from('player_progress')
        .select('unlocked_milestones, player_title')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        const cloudMilestones = data.unlocked_milestones || [];
        const cloudTitle = data.player_title;
        
        // Merge with local (cloud wins for conflicts)
        const merged = [...new Set([...unlockedMilestones, ...cloudMilestones])];
        setUnlockedMilestones(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        
        if (cloudTitle) {
          setPlayerTitle(cloudTitle);
          localStorage.setItem(TITLE_KEY, cloudTitle);
        }
      }
      setCloudLoaded(true);
    };
    
    loadFromCloud();
  }, [user?.id, cloudLoaded]);

  // Sync to cloud when data changes
  useEffect(() => {
    if (!user?.id || !cloudLoaded) return;
    
    const syncToCloud = async () => {
      await supabase
        .from('player_progress')
        .upsert({
          user_id: user.id,
          unlocked_milestones: unlockedMilestones,
          player_title: playerTitle,
        }, { onConflict: 'user_id' });
    };
    
    syncToCloud();
  }, [user?.id, unlockedMilestones, playerTitle, cloudLoaded]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMilestones));
  }, [unlockedMilestones]);

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
        setPendingCelebration(milestone);
        return milestone;
      }
    }
    return null;
  }, [unlockedMilestones]);

  const claimMilestone = useCallback((): number => {
    if (!pendingCelebration) return 0;
    
    const milestone = pendingCelebration;
    
    setUnlockedMilestones(prev => [...prev, milestone.id]);
    
    if (milestone.reward.title) {
      setPlayerTitle(milestone.reward.title);
    }
    
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
