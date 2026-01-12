import { useCallback, useEffect, useRef } from 'react';
import { prefetchRoute, prefetchCriticalRoutes, prefetchAdminRoutes } from '@/lib/routePrefetch';

/**
 * Hook for prefetching routes on user interaction
 */
export function usePrefetch() {
  const prefetchedRef = useRef(new Set<string>());

  const prefetchOnInteraction = useCallback((path: string) => {
    if (prefetchedRef.current.has(path)) return;
    prefetchedRef.current.add(path);
    prefetchRoute(path);
  }, []);

  return { prefetchOnInteraction };
}

/**
 * Hook to prefetch critical routes on mount (use on Auth page)
 */
export function useCriticalPrefetch() {
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);
}

/**
 * Hook to prefetch admin routes (use when user is confirmed admin)
 */
export function useAdminPrefetch() {
  useEffect(() => {
    prefetchAdminRoutes();
  }, []);
}
