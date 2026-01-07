import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'auth-background-url-v1';
const CACHE_TIMESTAMP_KEY = 'auth-background-timestamp-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AuthBackgroundState {
  backgroundUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuthBackground() {
  const [state, setState] = useState<AuthBackgroundState>({
    backgroundUrl: null,
    isLoading: true,
    error: null,
  });

  const fetchBackground = useCallback(async (forceRegenerate = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first (unless forcing regenerate)
      if (!forceRegenerate) {
        const cachedUrl = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedUrl && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < CACHE_DURATION) {
            // Verify the URL is still accessible
            try {
              const response = await fetch(cachedUrl, { method: 'HEAD' });
              if (response.ok) {
                setState({ backgroundUrl: cachedUrl, isLoading: false, error: null });
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
      const { data, error } = await supabase.functions.invoke('generate-auth-background');

      if (error) {
        throw new Error(error.message || 'Failed to generate background');
      }

      if (data?.url) {
        // Cache the URL
        localStorage.setItem(CACHE_KEY, data.url);
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        setState({ backgroundUrl: data.url, isLoading: false, error: null });
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
    // Clear cache and regenerate
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
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
