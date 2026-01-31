

# Dynamic Import Failure Fix Plan

## Problem Analysis

### The Error
```
Failed to fetch dynamically imported module: 
https://id-preview-d01b9c7d--e8e83e8c-0c77-43d8-8d1e-9f913ade2ac9.lovable.app/assets/Index-CRUofOJP.js
```

### Root Cause
This error occurs when React's `lazy()` tries to load a code-split chunk that no longer exists or can't be fetched. Common causes:

1. **Build Hash Mismatch**: After a new deployment, old chunk hashes (like `Index-CRUofOJP.js`) become invalid while the browser still has the old HTML/JS cached
2. **Service Worker Caching**: The SW uses cache-first for `.js` files, potentially serving stale references
3. **No Retry Mechanism**: Current lazy imports have no retry logic - they fail immediately
4. **No Recovery Path**: ErrorBoundary catches the error but "Try Again" just retries the same failed import

### Current Architecture Gap

```
┌─────────────────────────────────────────────────────────────────┐
│                   CURRENT FLOW (PROBLEMATIC)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks link to "/"                                         │
│         ↓                                                        │
│  lazy(() => import('./pages/Index'))                             │
│         ↓                                                        │
│  Browser requests /assets/Index-CRUofOJP.js                      │
│         ↓                                                        │
│  Service Worker (cache-first) → Cache MISS or STALE              │
│         ↓                                                        │
│  Network request → 404 (chunk deleted after redeploy)            │
│         ↓                                                        │
│  TypeError: Failed to fetch dynamically imported module          │
│         ↓                                                        │
│  ErrorBoundary shows error page                                  │
│         ↓                                                        │
│  User clicks "Try Again" → SAME ERROR (cache not cleared)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Solution

### 1. Add Lazy Import Retry Wrapper

Create a utility that wraps `lazy()` with automatic retry logic and cache-busting:

```typescript
// src/lib/lazyWithRetry.ts

/**
 * Wraps React.lazy() with retry logic and cache-busting for dynamic imports
 * Handles "Failed to fetch dynamically imported module" errors
 */
export function lazyWithRetry<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  retryDelay = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if this is a chunk loading error
        if (isChunkLoadError(error)) {
          console.warn(`[lazyWithRetry] Chunk load failed, attempt ${attempt + 1}/${retries}`);
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          
          // On final retry, try clearing service worker cache
          if (attempt === retries - 2) {
            await clearServiceWorkerCache();
          }
          
          // Force page reload on last attempt (gets fresh chunk manifest)
          if (attempt === retries - 1) {
            console.warn('[lazyWithRetry] Final attempt failed, triggering reload');
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

function isChunkLoadError(error: unknown): boolean {
  const message = (error as Error)?.message || '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError')
  );
}

async function clearServiceWorkerCache(): Promise<void> {
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      console.log('[lazyWithRetry] Service worker caches cleared');
    } catch (e) {
      console.warn('[lazyWithRetry] Failed to clear caches:', e);
    }
  }
}
```

### 2. Update App.tsx to Use Retry Wrapper

Replace all `lazy()` calls with `lazyWithRetry()`:

```typescript
// Before
const Index = lazy(() => import('./pages/Index'));

// After
const Index = lazyWithRetry(() => import('./pages/Index'));
```

### 3. Improve Service Worker Caching Strategy

Update `public/sw.js` to use a smarter caching strategy for JS chunks:

```javascript
// For JS assets, use network-first with cache fallback
// This ensures fresh chunks are always fetched after deployments
async function cacheFirst(request) {
  const url = new URL(request.url);
  
  // For hashed JS chunks (e.g., Index-CRUofOJP.js), use network-first
  // They change on every deploy, so cache-first causes stale chunk issues
  if (url.pathname.match(/assets\/.*-[a-zA-Z0-9]{8}\.js$/)) {
    return networkFirstForChunks(request);
  }
  
  // Original cache-first for truly static assets (images, fonts, CSS)
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

async function networkFirstForChunks(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fall back to cache only if network fails
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

### 4. Add Version Check for Stale Clients

Add a mechanism to detect when the app has been updated:

```typescript
// src/hooks/useVersionCheck.ts
import { useEffect } from 'react';

const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();

export function useVersionCheck() {
  useEffect(() => {
    // Check version on visibility change (tab comes back into focus)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const response = await fetch('/version.json', { cache: 'no-store' });
          if (response.ok) {
            const { version } = await response.json();
            if (version && version !== BUILD_VERSION) {
              console.log('[VersionCheck] New version detected, reloading...');
              window.location.reload();
            }
          }
        } catch {
          // Silently fail - version check is optional
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
```

### 5. Enhance ErrorBoundary for Chunk Errors

Update ErrorBoundary to specifically handle chunk loading errors:

```typescript
// Add to ErrorBoundary.tsx

handleRetry = () => {
  const error = this.state.error;
  
  // If this is a chunk load error, clear caches and reload
  if (error?.message?.includes('Failed to fetch dynamically imported module')) {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(keys => 
        Promise.all(keys.map(key => caches.delete(key)))
      );
    }
    // Force full reload to get fresh manifest
    window.location.reload();
    return;
  }
  
  // Existing retry logic...
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/lazyWithRetry.ts` | **NEW** - Create retry wrapper utility |
| `src/App.tsx` | Replace `lazy()` with `lazyWithRetry()` |
| `public/sw.js` | Update to network-first for hashed JS chunks |
| `src/components/ErrorBoundary.tsx` | Add chunk error detection and cache-clearing |
| `vite.config.ts` | Add build version to environment |

---

## Expected Outcome

After implementation:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIXED FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User clicks link to "/"                                         │
│         ↓                                                        │
│  lazyWithRetry(() => import('./pages/Index'))                    │
│         ↓                                                        │
│  Attempt 1: Network request → 404 (stale chunk)                  │
│         ↓                                                        │
│  Retry with exponential backoff (1s, 2s, 3s)                     │
│         ↓                                                        │
│  Attempt 2: Still fails                                          │
│         ↓                                                        │
│  Clear service worker cache                                      │
│         ↓                                                        │
│  Attempt 3: Still fails                                          │
│         ↓                                                        │
│  Automatic page reload (gets fresh HTML with new chunk hashes)   │
│         ↓                                                        │
│  SUCCESS - App loads with correct chunks                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

1. **Why network-first for hashed chunks?**: Vite generates content-hashed filenames (e.g., `Index-CRUofOJP.js`). After a new deploy, these hashes change but the browser may have cached references to old hashes. Network-first ensures the browser always checks for the latest version.

2. **Why exponential backoff?**: Network issues may be transient. Waiting longer between retries gives temporary issues time to resolve.

3. **Why clear SW cache before final retry?**: The service worker might be serving stale responses from its cache. Clearing it forces a fresh network fetch.

4. **Why auto-reload as last resort?**: If all retries fail, the HTML itself is likely stale (pointing to old chunk hashes). A full reload gets fresh HTML with the correct chunk manifest.

