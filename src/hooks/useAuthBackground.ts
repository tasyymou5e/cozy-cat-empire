import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentRealSeason, type RealSeason } from '@/lib/seasonUtils';

const CACHE_KEY_PREFIX = 'auth-background-url';
const CACHE_TIMESTAMP_KEY = 'auth-background-timestamp-v2';
const CACHE_SEASON_KEY = 'auth-background-season';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const getCacheKey = (season: RealSeason) => `${CACHE_KEY_PREFIX}-${season}-v2`;

interface AuthBackgroundState {
  backgroundUrl: string | null;
  isLoading: boolean;
  error: string | null;
  currentSeason: RealSeason;
}

export function useAuthBackground() {
  const [state, setState] = useState<AuthBackgroundState>({
    backgroundUrl: null,
    isLoading: true,
    error: null,
    currentSeason: getCurrentRealSeason(),
  });

  const fetchBackground = useCallback(async (forceRegenerate = false) => {
    const currentSeason = getCurrentRealSeason();
    const cacheKey = getCacheKey(currentSeason);
    
    setState(prev => ({ ...prev, isLoading: true, error: null, currentSeason }));

    try {
      // Check if season changed - force regenerate if so
      const cachedSeason = localStorage.getItem(CACHE_SEASON_KEY);
      if (cachedSeason && cachedSeason !== currentSeason) {
        forceRegenerate = true;
      }

      // Check cache first (unless forcing regenerate)
      if (!forceRegenerate) {
        const cachedUrl = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedUrl && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < CACHE_DURATION) {
            // Verify the URL is still accessible
            try {
              const response = await fetch(cachedUrl, { method: 'HEAD' });
              if (response.ok) {
                setState({ backgroundUrl: cachedUrl, isLoading: false, error: null, currentSeason });
                return;
              }
            } catch {
              // URL not accessible, will regenerate
              console.log('Cached background URL not accessible, regenerating...');
            }
          }
        }
      }

      // Call edge function to get/generate background
      const { data, error } = await supabase.functions.invoke('generate-auth-background', {
        body: { forceRegenerate, season: currentSeason }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate background');
      }

      if (data?.url) {
        // Cache the URL with season
        localStorage.setItem(cacheKey, data.url);
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        localStorage.setItem(CACHE_SEASON_KEY, currentSeason);
        setState({ backgroundUrl: data.url, isLoading: false, error: null, currentSeason });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error fetching auth background:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const regenerate = useCallback(() => {
    const currentSeason = getCurrentRealSeason();
    const cacheKey = getCacheKey(currentSeason);
    
    // Clear cache and regenerate
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    localStorage.removeItem(CACHE_SEASON_KEY);
    return fetchBackground(true);
  }, [fetchBackground]);

  useEffect(() => {
    fetchBackground();
  }, [fetchBackground]);

  return {
    ...state,
    regenerate,
  };
}
