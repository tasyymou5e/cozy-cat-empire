import { useState, useEffect, useCallback } from 'react';
import { 
  DailyObjective, 
  DailyObjectivesState, 
  ObjectiveType,
  generateDailyObjectives, 
  getTodayDateString 
} from '@/types/dailyObjectives';

interface UseDailyObjectivesReturn {
  objectives: DailyObjective[];
  allCompleted: boolean;
  bonusClaimed: boolean;
  updateProgress: (type: ObjectiveType, amount?: number) => void;
  claimBonus: () => number;
  refreshObjectives: () => void;
}

const STORAGE_KEY = 'cat-farm-daily-objectives';
const ALL_COMPLETE_BONUS = 100;

function getInitialState(): DailyObjectivesState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed: DailyObjectivesState = JSON.parse(stored);
    // Check if objectives are from today
    if (parsed.lastRefreshed === getTodayDateString()) {
      return parsed;
    }
  }
  
  // Generate new objectives
  return {
    objectives: generateDailyObjectives(3),
    lastRefreshed: getTodayDateString(),
    allCompletedBonus: ALL_COMPLETE_BONUS,
    bonusClaimed: false,
  };
}

export function useDailyObjectives(): UseDailyObjectivesReturn {
  const [state, setState] = useState<DailyObjectivesState>(getInitialState);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check for new day and refresh
  useEffect(() => {
    const today = getTodayDateString();
    if (state.lastRefreshed !== today) {
      setState({
        objectives: generateDailyObjectives(3),
        lastRefreshed: today,
        allCompletedBonus: ALL_COMPLETE_BONUS,
        bonusClaimed: false,
      });
    }
  }, [state.lastRefreshed]);

  const updateProgress = useCallback((type: ObjectiveType, amount: number = 1) => {
    setState(prev => ({
      ...prev,
      objectives: prev.objectives.map(obj => {
        if (obj.type !== type || obj.completed) return obj;
        
        const newProgress = Math.min(obj.progress + amount, obj.target);
        return {
          ...obj,
          progress: newProgress,
          completed: newProgress >= obj.target,
        };
      }),
    }));
  }, []);

  const allCompleted = state.objectives.every(obj => obj.completed);

  const claimBonus = useCallback((): number => {
    if (!allCompleted || state.bonusClaimed) return 0;
    
    setState(prev => ({ ...prev, bonusClaimed: true }));
    return state.allCompletedBonus;
  }, [allCompleted, state.bonusClaimed, state.allCompletedBonus]);

  const refreshObjectives = useCallback(() => {
    setState({
      objectives: generateDailyObjectives(3),
      lastRefreshed: getTodayDateString(),
      allCompletedBonus: ALL_COMPLETE_BONUS,
      bonusClaimed: false,
    });
  }, []);

  return {
    objectives: state.objectives,
    allCompleted,
    bonusClaimed: state.bonusClaimed,
    updateProgress,
    claimBonus,
    refreshObjectives,
  };
}
