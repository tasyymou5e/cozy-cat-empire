/**
 * Security Linter Hook
 *
 * Provides functionality to run database security scans and manage results.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LinterIssue, LinterResults } from '@/types/admin';

const LINTER_CACHE_KEY = 'security-linter-results';

export function useSecurityLinter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastScanTime, setLastScanTime] = useState<string | null>(() => {
    // Try to restore from localStorage
    const cached = localStorage.getItem(LINTER_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as LinterResults;
        return parsed.scannedAt;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Query for cached results
  const {
    data: cachedResults,
    isLoading: isLoadingCache,
  } = useQuery({
    queryKey: ['security-linter-cached'],
    queryFn: (): LinterResults | null => {
      const cached = localStorage.getItem(LINTER_CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as LinterResults;
        } catch {
          return null;
        }
      }
      return null;
    },
    staleTime: Infinity, // Don't auto-refetch
  });

  // Mutation to run the linter
  const runLinterMutation = useMutation({
    mutationFn: async (): Promise<LinterResults> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-security-linter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run security scan');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Cache results
      localStorage.setItem(LINTER_CACHE_KEY, JSON.stringify(data));
      setLastScanTime(data.scannedAt);
      
      // Invalidate cached query to update UI
      queryClient.invalidateQueries({ queryKey: ['security-linter-cached'] });

      toast({
        title: 'Security Scan Complete',
        description: `Found ${data.totalIssues} issue(s) in ${data.scanDurationMs}ms`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Scan Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const runLinter = useCallback(() => {
    runLinterMutation.mutate();
  }, [runLinterMutation]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(LINTER_CACHE_KEY);
    setLastScanTime(null);
    queryClient.invalidateQueries({ queryKey: ['security-linter-cached'] });
  }, [queryClient]);

  return {
    // Results
    results: cachedResults,
    lastScanTime,
    
    // Actions
    runLinter,
    clearCache,
    
    // State
    isScanning: runLinterMutation.isPending,
    isLoading: isLoadingCache,
    error: runLinterMutation.error,
  };
}
