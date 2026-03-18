// Service Worker for Push Notifications and Asset Caching
// Version 2 - Updated caching strategy for code-split chunks

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = ['/', '/index.html', '/favicon.ico', '/og-image.png'];

// Regex to match hashed JS/CSS chunks (e.g., Index-CRUofOJP.js)
const HASHED_ASSET_REGEX = /\/assets\/.*-[a-zA-Z0-9]{8}\.(js|css)$/;

// Install: Precache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// Fetch: Apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API requests (always network)
  if (url.hostname.includes('supabase')) return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Network-first for HTML pages (always get fresh HTML for correct chunk references)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for hashed JS/CSS chunks to prevent stale chunk issues
  // These files have content hashes in their names, so new deploys = new filenames
  if (HASHED_ASSET_REGEX.test(url.pathname)) {
    event.respondWith(networkFirstForChunks(request));
    return;
  }

  // Cache-first for truly static assets (images, fonts, non-hashed assets)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request));
});

function isStaticAsset(url) {
  // Match static assets that don't have hashes (images, fonts, etc.)
  return url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|mp3|wav)$/);
}

async function cacheFirst(request) {
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

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback to cached index for offline navigation
    const fallback = await caches.match('/');
    if (fallback) return fallback;

    throw error;
  }
}

/**
 * Network-first strategy specifically for hashed chunks
 * This prevents "Failed to fetch dynamically imported module" errors
 * that occur when chunk hashes change after deployments
 */
async function networkFirstForChunks(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
      return response;
    }
    // If network returns non-ok (404 for old chunks), don't cache and don't fallback
    // Let it fail so lazyWithRetry can handle the retry and reload logic
    throw new Error(`Chunk fetch returned ${response.status}`);
  } catch (error) {
    // For chunk loading, we prefer to fail fast rather than serve stale chunks
    // This allows the lazyWithRetry wrapper to handle retries and page reloads
    console.warn('[SW] Chunk fetch failed, not serving from cache:', request.url);

    // Only fallback to cache if we have a recent cached version
    // Check if we're offline first
    if (!navigator.onLine) {
      const cached = await caches.match(request);
      if (cached) {
        console.log('[SW] Serving cached chunk (offline mode):', request.url);
        return cached;
      }
    }

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Push notification handlers
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data = {
    title: 'Cat Farm',
    body: 'You have a new notification!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Message handler for cache clearing requests from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    console.log('[SW] Received cache clear request');
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key))).then(() => {
          console.log('[SW] All caches cleared');
          // Notify the client that caches are cleared
          if (event.source) {
            event.source.postMessage({ type: 'CACHES_CLEARED' });
          }
        });
      })
    );
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
