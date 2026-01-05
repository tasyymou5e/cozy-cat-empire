import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  loading: boolean;
}

const STORAGE_KEY = 'cat-farm-daily-objectives';
const ALL_COMPLETE_BONUS = 100;

function getLocalState(): DailyObjectivesState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed: DailyObjectivesState = JSON.parse(stored);
    if (parsed.lastRefreshed === getTodayDateString()) {
      return parsed;
    }
  }
  return {
    objectives: generateDailyObjectives(3),
    lastRefreshed: getTodayDateString(),
    allCompletedBonus: ALL_COMPLETE_BONUS,
    bonusClaimed: false,
  };
}

export function useDailyObjectives(userId?: string): UseDailyObjectivesReturn {
  const [state, setState] = useState<DailyObjectivesState>(getLocalState);
  const [loading, setLoading] = useState(false);

  // Load from cloud when user is authenticated
  useEffect(() => {
    if (!userId) return;

    const loadFromCloud = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('daily_objectives_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading daily objectives:', error);
          return;
        }

        const today = getTodayDateString();

        if (data) {
          // Check if cloud data is from today
          if (data.last_refreshed === today) {
            setState({
              objectives: data.objectives as unknown as DailyObjective[],
              lastRefreshed: data.last_refreshed,
              allCompletedBonus: ALL_COMPLETE_BONUS,
              bonusClaimed: data.bonus_claimed ?? false,
            });
          } else {
            // New day, generate new objectives
            const newState = {
              objectives: generateDailyObjectives(3),
              lastRefreshed: today,
              allCompletedBonus: ALL_COMPLETE_BONUS,
              bonusClaimed: false,
            };
            setState(newState);
            // Update cloud with new objectives
            await supabase
              .from('daily_objectives_progress')
              .update({
                objectives: JSON.parse(JSON.stringify(newState.objectives)),
                last_refreshed: today,
                bonus_claimed: false,
              })
              .eq('user_id', userId);
          }
        } else {
          // No cloud data, create initial record
          const localState = getLocalState();
          await supabase
            .from('daily_objectives_progress')
            .insert({
              user_id: userId,
              objectives: JSON.parse(JSON.stringify(localState.objectives)),
              last_refreshed: localState.lastRefreshed,
              bonus_claimed: localState.bonusClaimed,
            });
          setState(localState);
        }
      } catch (e) {
        console.error('Failed to load daily objectives from cloud:', e);
      } finally {
        setLoading(false);
      }
    };

    loadFromCloud();
  }, [userId]);

  // Persist state to localStorage (always) and cloud (if logged in)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (userId) {
      const syncToCloud = async () => {
        await supabase
          .from('daily_objectives_progress')
          .upsert({
            user_id: userId,
            objectives: JSON.parse(JSON.stringify(state.objectives)),
            last_refreshed: state.lastRefreshed,
            bonus_claimed: state.bonusClaimed,
          }, {
            onConflict: 'user_id',
          });
      };
      syncToCloud();
    }
  }, [state, userId]);

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
    loading,
  };
}
