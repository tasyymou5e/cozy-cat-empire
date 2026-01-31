import { useEffect, useCallback } from 'react';

/**
 * Build version from environment or fallback to build time
 * This should be set during the build process
 */
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || '__BUILD_TIME__';

/**
 * Hook that checks for app version changes and triggers a reload if needed.
 * This helps prevent stale client issues after deployments.
 *
 * The check happens when:
 * - The browser tab regains focus (visibility change)
 * - After a period of inactivity
 */
export function useVersionCheck(checkInterval = 5 * 60 * 1000) {
  const checkVersion = useCallback(async () => {
    try {
      // Fetch version.json with cache bypass
      const response = await fetch('/version.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const { version, buildTime } = await response.json();
        const serverVersion = version || buildTime;

        if (serverVersion && serverVersion !== BUILD_VERSION) {
          console.log('[VersionCheck] New version detected:', {
            current: BUILD_VERSION,
            server: serverVersion,
          });

          // Clear caches before reload
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }

          // Reload to get the new version
          window.location.reload();
        }
      }
    } catch {
      // Silently fail - version check is optional
      // This might fail if version.json doesn't exist or network is down
    }
  }, []);

  useEffect(() => {
    // Check version when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    // Check version on focus
    const handleFocus = () => {
      checkVersion();
    };

    // Set up periodic check
    const intervalId = setInterval(checkVersion, checkInterval);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [checkVersion, checkInterval]);
}
