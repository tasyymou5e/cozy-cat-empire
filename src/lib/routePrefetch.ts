// Route module map for prefetching lazy-loaded pages
const routeModules: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/collection': () => import('@/pages/CatCollection'),
  '/customize': () => import('@/pages/CatCustomization'),
  '/photobooth': () => import('@/pages/CatPhotoBooth'),
  '/gallery': () => import('@/pages/CatGallery'),
  '/relationships': () => import('@/pages/CatRelationships'),
  '/leaderboard': () => import('@/pages/Leaderboard'),
  '/stats': () => import('@/pages/Stats'),
  '/auth': () => import('@/pages/Auth'),
  // Admin routes
  '/catking': () => import('@/pages/AdminAuth'),
  '/catking/dashboard': () => import('@/pages/admin/AdminDashboard'),
  '/catking/users': () => import('@/pages/admin/AdminUsers'),
  '/catking/stats': () => import('@/pages/admin/AdminStatistics'),
  '/catking/errors': () => import('@/pages/admin/AdminErrorLogs'),
  '/catking/moderation': () => import('@/pages/admin/AdminModeration'),
  '/catking/settings': () => import('@/pages/admin/AdminSettings'),
  '/catking/announcements': () => import('@/pages/admin/AdminAnnouncements'),
  '/catking/ai-metrics': () => import('@/pages/admin/AdminAIMetrics'),
  '/catking/game-config': () => import('@/pages/admin/AdminGameConfig'),
  '/catking/battle-pass': () => import('@/pages/admin/AdminBattlePass'),
  '/catking/notifications': () => import('@/pages/admin/AdminNotifications'),
  '/catking/profile-repair': () => import('@/pages/admin/AdminProfileRepair'),
  '/catking/scheduled-jobs': () => import('@/pages/admin/AdminScheduledJobs'),
};

// Track prefetched routes to avoid duplicate fetches
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a single route's chunk
 */
export const prefetchRoute = (path: string): void => {
  // Normalize path
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  if (prefetchedRoutes.has(normalizedPath)) return;
  
  const loader = routeModules[normalizedPath];
  if (loader) {
    prefetchedRoutes.add(normalizedPath);
    loader().catch(() => {
      // Silently fail - prefetch is best-effort
      prefetchedRoutes.delete(normalizedPath);
    });
  }
};

/**
 * Prefetch multiple routes
 */
export const prefetchRoutes = (paths: string[]): void => {
  paths.forEach(prefetchRoute);
};

/**
 * Prefetch critical routes during idle time
 */
export const prefetchCriticalRoutes = (): void => {
  const criticalPaths = ['/', '/collection'];
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoutes(criticalPaths);
    }, { timeout: 3000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      prefetchRoutes(criticalPaths);
    }, 2000);
  }
};

/**
 * Prefetch admin routes (call when user is confirmed admin)
 */
export const prefetchAdminRoutes = (): void => {
  const adminPaths = [
    '/catking/dashboard',
    '/catking/users',
    '/catking/stats',
    '/catking/errors',
    '/catking/moderation',
    '/catking/settings',
  ];
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoutes(adminPaths);
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      prefetchRoutes(adminPaths);
    }, 3000);
  }
};

/**
 * Check if a route has been prefetched
 */
export const isRoutePrefetched = (path: string): boolean => {
  return prefetchedRoutes.has(path);
};
