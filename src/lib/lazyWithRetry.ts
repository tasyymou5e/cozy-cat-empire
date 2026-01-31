import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Wraps React.lazy() with retry logic and cache-busting for dynamic imports.
 * Handles "Failed to fetch dynamically imported module" errors that occur
 * when chunk hashes change after deployments.
 *
 * @param importFn - The dynamic import function
 * @param retries - Number of retry attempts (default: 3)
 * @param retryDelay - Base delay between retries in ms (default: 1000)
 * @returns A lazy-loaded component with automatic retry on chunk load failure
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  retryDelay = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;

        // Check if this is a chunk loading error
        if (isChunkLoadError(error)) {
          console.warn(
            `[lazyWithRetry] Chunk load failed, attempt ${attempt + 1}/${retries}:`,
            (error as Error).message
          );

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));

          // On second-to-last retry, try clearing service worker cache
          if (attempt === retries - 2) {
            await clearServiceWorkerCache();
          }

          // Force page reload on last attempt (gets fresh chunk manifest)
          if (attempt === retries - 1) {
            console.warn('[lazyWithRetry] Final attempt failed, triggering reload');
            // Clear caches before reload
            await clearServiceWorkerCache();
            window.location.reload();
            // Return a never-resolving promise to prevent further execution
            return new Promise(() => {});
          }
        } else {
          // Non-chunk error, don't retry
          throw error;
        }
      }
    }

    throw lastError;
  });
}

/**
 * Checks if an error is a chunk/module loading error
 */
function isChunkLoadError(error: unknown): boolean {
  const message = (error as Error)?.message || '';
  const name = (error as Error)?.name || '';

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading CSS chunk') ||
    name === 'ChunkLoadError' ||
    // Vite-specific error patterns
    message.includes('Unable to preload CSS') ||
    message.includes('error loading dynamically imported module')
  );
}

/**
 * Clears all service worker caches to force fresh fetches
 */
async function clearServiceWorkerCache(): Promise<void> {
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      console.log('[lazyWithRetry] Service worker caches cleared');
    } catch (e) {
      console.warn('[lazyWithRetry] Failed to clear caches:', e);
    }
  }

  // Also try to unregister and re-register service worker
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
      console.log('[lazyWithRetry] Service worker updated');
    } catch (e) {
      console.warn('[lazyWithRetry] Failed to update service worker:', e);
    }
  }
}

/**
 * Utility to check if a chunk load error occurred and handle it
 * Can be used in error boundaries or catch blocks
 */
export function handleChunkLoadError(error: Error): boolean {
  if (isChunkLoadError(error)) {
    console.warn('[handleChunkLoadError] Chunk load error detected, clearing cache and reloading');
    clearServiceWorkerCache().then(() => {
      window.location.reload();
    });
    return true;
  }
  return false;
}
