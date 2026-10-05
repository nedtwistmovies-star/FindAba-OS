// FindAba City OS - Industrial Offline Service Worker v113.0
// Strategy: Stale-While-Revalidate + Fast Network Timeout for Business Directory Data
// Enables full offline browsing of merchant listings, phone numbers, and contact details
// in markets with poor or intermittent network connectivity (Ariaria, Faulks Road, Cemetery, etc.)

const SHELL_CACHE_NAME = 'findaba-shell-v113.0';
const DIRECTORY_CACHE_NAME = 'findaba-directory-v113.0';

const PRECACHE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

const PRECACHE_DIRECTORY_ASSETS = [
  '/api/businesses',
  '/api/directory'
];

// Baseline verified emergency fallback listings in case of absolute first-load offline install
const BASELINE_OFFLINE_BUSINESSES = [
  {
    id: "offline-ariaria-master-shoes",
    name: "Aba Master Leathercrafts & Footwear Cluster",
    category: "Footwear & Shoes",
    primary_product_or_service: "Handcrafted Leather Shoes, School Shoes, Sandals",
    area: "Ariaria International",
    address: "Block 14, Powerline Leather Zone, Ariaria Market, Aba",
    phone_whatsapp: "+2348030001122",
    phone: "+2348030001122",
    email: "ariaria.shoes@findaba.com.ng",
    rating: 4.8,
    review_count: 142,
    verification_status: "Verified",
    verification_level: "Physically Verified",
    description: "Verified master shoe manufacturers and leather artisans specializing in durable school footwear, men's formal brogues, and bulk commercial orders.",
    status: "active"
  },
  {
    id: "offline-faulks-garment-tailors",
    name: "Faulks Road Garment & Tailoring Hub",
    category: "Fashion & Tailoring",
    primary_product_or_service: "Custom Suits, Traditional Attires, Corporate Uniforms",
    area: "Faulks Road Hub",
    address: "88 Faulks Road, Opposite Brass Junction, Aba",
    phone_whatsapp: "+2348029994455",
    phone: "+2348029994455",
    email: "tailors.faulks@findaba.com.ng",
    rating: 4.9,
    review_count: 88,
    verification_status: "Verified",
    verification_level: "Signature",
    description: "Industrial fashion designers and tailors for bridal, formal and ceremonial garments with doorstep courier logistics.",
    status: "active"
  },
  {
    id: "offline-eziukwu-provisions-spares",
    name: "Eziukwu Commercial Hardware & Industrial Spares",
    category: "Auto Spare Parts",
    primary_product_or_service: "Heavy Vehicle & Generator Parts, Industrial Bearings",
    area: "Eziukwu Market",
    address: "Line 4 Eziukwu Market Complex, Aba",
    phone_whatsapp: "+2348148882211",
    phone: "+2348148882211",
    email: "spares.eziukwu@findaba.com.ng",
    rating: 4.7,
    review_count: 53,
    verification_status: "Verified",
    verification_level: "Physically Verified",
    description: "Authoritative stockists for industrial machine parts, truck suspension components, and electrical alternators.",
    status: "active"
  }
];

// 1. INSTALLATION: Pre-cache App Shell & Critical Directory Data
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_SHELL_ASSETS).catch((err) => {
          console.warn('[SW] Shell precache warning (safe to proceed):', err);
        });
      }),
      caches.open(DIRECTORY_CACHE_NAME).then(async (cache) => {
        // Try pre-fetching directory data from server
        for (const url of PRECACHE_DIRECTORY_ASSETS) {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (err) {
            console.warn('[SW] Directory precache fallback triggered for:', url);
            // Pre-seed with baseline directory payload so cache is never blank
            const fallbackResp = new Response(JSON.stringify(BASELINE_OFFLINE_BUSINESSES), {
              headers: { 
                'Content-Type': 'application/json',
                'X-FindAba-Offline-Preseed': 'true'
              }
            });
            await cache.put(url, fallbackResp);
          }
        }
      })
    ]).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATION: Evict Outdated Caches
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE_NAME, DIRECTORY_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !currentCaches.includes(key)).map((key) => {
          console.log('[SW] Evicting legacy cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. MESSAGE: Skip Waiting on User or System Request
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper: Check if request is for business directory data
function isBusinessDirectoryRequest(url) {
  const path = url.pathname;
  return (
    path === '/api/businesses' ||
    path.startsWith('/api/businesses/') ||
    path === '/api/directory' ||
    path.startsWith('/api/directory/') ||
    path === '/registry.json' ||
    path.includes('/rest/v1/businesses')
  );
}

// Helper: Fast network fetch with configurable timeout (3.5s)
function fetchWithTimeout(request, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal })
    .then((response) => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      throw err;
    });
}

// 4. FETCH EVENT: Intelligent Caching Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never intercept non-HTTP(S) schemes
  if (!request.url.startsWith('http')) {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Bypass Auth, Payments, WhatsApp Webhooks, and Vite HMR Websockets
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/api/payment') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.includes('hmr') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // A. STRATEGY FOR CRITICAL BUSINESS DIRECTORY DATA
  if (isBusinessDirectoryRequest(url)) {
    event.respondWith(
      (async () => {
        const dirCache = await caches.open(DIRECTORY_CACHE_NAME);

        // 1. Try fast network fetch first (to stay fresh if connected)
        try {
          const networkResponse = await fetchWithTimeout(request.clone(), 3000);
          if (networkResponse && networkResponse.status === 200) {
            // Update directory cache in background
            dirCache.put(request, networkResponse.clone()).catch(() => {});
            // Also update the canonical /api/businesses cache key
            dirCache.put('/api/businesses', networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
        } catch (netErr) {
          console.log('[SW] Network slow or offline. Serving cached directory data:', url.pathname);
        }

        // 2. Network failed or timed out: Serve from directory cache
        try {
          // Exact match
          let cachedResponse = await dirCache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to canonical /api/businesses cache key
          cachedResponse = await dirCache.match('/api/businesses');
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to shell cache
          const shellCache = await caches.open(SHELL_CACHE_NAME);
          cachedResponse = await shellCache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        } catch (cacheErr) {
          console.warn('[SW] Cache read exception:', cacheErr);
        }

        // 3. Last-resort offline fallback: Synthesize valid JSON directory response
        return new Response(JSON.stringify(BASELINE_OFFLINE_BUSINESSES), {
          status: 200,
          statusText: 'OK (Offline Cache Fallback)',
          headers: {
            'Content-Type': 'application/json',
            'X-FindAba-Offline-Fallback': 'true',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      })()
    );
    return;
  }

  // B. STRATEGY FOR HTML NAVIGATION REQUESTS (SPA Deeplinks)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback to app shell
          const shellCache = await caches.open(SHELL_CACHE_NAME);
          const cachedIndex = await shellCache.match('/index.html');
          if (cachedIndex) return cachedIndex;

          const cachedRoot = await shellCache.match('/');
          if (cachedRoot) return cachedRoot;

          return new Response('<h1>FindAba City OS - Offline</h1><p>Please connect to the network to refresh the application shell.</p>', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // C. STRATEGY FOR STATIC ASSETS (JS, CSS, Images, Fonts)
  if (
    url.origin === self.location.origin &&
    (
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2)$/i) ||
      url.pathname.startsWith('/assets/')
    )
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately and revalidate in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, networkResponse)).catch(() => {});
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache: fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // D. DEFAULT: Network-first for other same-origin requests with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
