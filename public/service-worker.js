// FindAba City Directory & Local Search Service Worker
// Designed for Aba, Abia State — handles offline access and poor mobile connectivity
// Strategies:
// 1. Cache-First: Static assets and business directory JSON/API responses for offline viewing
// 2. Network-First: User-specific data (auth, profile, wallet, orders, bookings) to ensure freshness
// 3. SKIP_WAITING event listener: Enables instant activation and zero-delay updates

const CACHE_VERSION = 'v117.0';
const STATIC_CACHE = `findaba-static-${CACHE_VERSION}`;
const DIRECTORY_CACHE = `findaba-directory-${CACHE_VERSION}`;
const USER_DATA_CACHE = `findaba-userdata-${CACHE_VERSION}`;

console.log(`[ServiceWorker:init] Service Worker script loaded. Version: ${CACHE_VERSION}`);

// Static app shell assets precached on installation
const PRECACHE_STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/metadata.json'
];

// Baseline emergency offline business listings (Ariaria, Faulks Road, Eziukwu)
// Guarantees immediate offline directory viewing even on fresh installs without network
const BASELINE_BUSINESSES = [
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

// Baseline categories for offline viewing
const BASELINE_CATEGORIES = [
  "Footwear & Shoes",
  "Fashion & Tailoring",
  "Phone & Gadget Repair",
  "Restaurants & Eateries",
  "Auto Spare Parts",
  "Artisans & Plumbers",
  "Schools & Training Centers",
  "Transportation",
  "Health & Medical",
  "Faith-Based Organizations",
  "Government & Public"
];

// 1. INSTALLATION EVENT: Pre-cache static shell & baseline directory data
self.addEventListener('install', (event) => {
  console.log(`[ServiceWorker:install] Install event started for version: ${CACHE_VERSION}`);
  console.log(`[ServiceWorker:install] Pre-caching ${PRECACHE_STATIC_ASSETS.length} static shell assets into: ${STATIC_CACHE}`, PRECACHE_STATIC_ASSETS);
  console.log(`[ServiceWorker:install] Pre-populating directory cache '${DIRECTORY_CACHE}' with emergency offline businesses and categories.`);

  event.waitUntil(
    Promise.all([
      // Pre-cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_STATIC_ASSETS)
          .then(() => {
            console.log(`[ServiceWorker:install] ✅ Successfully precached all static shell assets into: ${STATIC_CACHE}`);
          })
          .catch((err) => {
            console.warn('[ServiceWorker:install] ⚠️ Non-fatal notice precaching static assets:', err);
          });
      }),
      // Pre-populate directory cache with baseline data
      caches.open(DIRECTORY_CACHE).then(async (cache) => {
        const businessResp = new Response(JSON.stringify(BASELINE_BUSINESSES), {
          headers: { 'Content-Type': 'application/json', 'X-FindAba-Offline-Preseed': 'true' }
        });
        await cache.put('/api/businesses', businessResp.clone());

        const categoryResp = new Response(JSON.stringify(BASELINE_CATEGORIES), {
          headers: { 'Content-Type': 'application/json', 'X-FindAba-Offline-Preseed': 'true' }
        });
        await cache.put('/api/categories', categoryResp.clone());
        console.log(`[ServiceWorker:install] ✅ Baseline emergency directory data stored in: ${DIRECTORY_CACHE}`);

        // Attempt live fetch if online during install
        try {
          console.log('[ServiceWorker:install] Probing network to pre-fetch fresh directory data (/api/businesses)...');
          const liveBiz = await fetch('/api/businesses', { cache: 'no-cache' });
          if (liveBiz && liveBiz.ok) {
            await cache.put('/api/businesses', liveBiz);
            console.log('[ServiceWorker:install] ✅ Live directory data pre-fetched and stored into cache.');
          }
        } catch (_) {
          console.log('[ServiceWorker:install] ℹ️ Network offline or constrained during install. Baseline emergency data remains ready.');
        }
      })
    ])
    .then(() => {
      console.log(`[ServiceWorker:install] ✅ Installation tasks complete. Calling self.skipWaiting() to activate immediately.`);
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATION EVENT: Clean up deprecated legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log(`[ServiceWorker:activate] Activate event started for version: ${CACHE_VERSION}`);
  const currentCaches = [STATIC_CACHE, DIRECTORY_CACHE, USER_DATA_CACHE];
  console.log(`[ServiceWorker:activate] Current authoritative caches:`, currentCaches);

  event.waitUntil(
    caches.keys().then((keys) => {
      console.log(`[ServiceWorker:activate] Scanning existing cache keys in CacheStorage:`, keys);
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            console.log(`[ServiceWorker:activate] 🗑️ Evicting obsolete cache: ${key}`);
            return caches.delete(key);
          } else {
            console.log(`[ServiceWorker:activate] 🔒 Preserving authoritative cache: ${key}`);
            return Promise.resolve();
          }
        })
      );
    })
    .then(() => {
      console.log(`[ServiceWorker:activate] 🚀 Calling self.clients.claim() to control all open browser tabs immediately.`);
      return self.clients.claim();
    })
  );
});

// 3. SKIP_WAITING EVENT LISTENER: Allow instant service worker update upon request
self.addEventListener('message', (event) => {
  console.log(`[ServiceWorker:message] Message received from client:`, event.data);
  if (
    event.data &&
    (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING')
  ) {
    console.log('[ServiceWorker:message] ⚡ Handling SKIP_WAITING command — activating service worker immediately.');
    self.skipWaiting();
  }
});

/**
 * Checks if request is for static assets (scripts, styles, fonts, images, HTML shell)
 */
function isStaticAssetRequest(url, request) {
  if (request.mode === 'navigate') {
    return true;
  }
  const pathname = url.pathname;
  return (
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|eot)$/i) !== null ||
    pathname.startsWith('/assets/') ||
    pathname === '/manifest.json' ||
    pathname === '/metadata.json'
  );
}

/**
 * Checks if request is for business directory JSON/API responses
 */
function isBusinessDirectoryRequest(url) {
  const pathname = url.pathname;
  return (
    pathname === '/api/businesses' ||
    pathname.startsWith('/api/businesses/') ||
    pathname === '/api/categories' ||
    pathname.startsWith('/api/categories/') ||
    pathname === '/api/directory' ||
    pathname.startsWith('/api/directory/') ||
    pathname === '/registry.json' ||
    pathname.includes('/supabase/businesses.json') ||
    pathname.includes('/rest/v1/businesses') ||
    pathname.includes('/rest/v1/categories')
  );
}

/**
 * Checks if request is for user-specific data requiring freshness
 */
function isUserSpecificDataRequest(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/profile') ||
    pathname.startsWith('/api/wallet') ||
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/whatsapp/otp') ||
    pathname.startsWith('/api/whatsapp/verify') ||
    pathname.startsWith('/api/signals')
  );
}

/**
 * CACHE-FIRST STRATEGY
 * Searches cache first. Returns cached item immediately if found.
 * If not in cache, fetches from network, updates cache, and returns response.
 * If network fails (offline condition), provides resilient offline fallbacks.
 */
async function handleCacheFirst(request, cacheName, isDirectory = false) {
  const url = request.url;
  const startTime = Date.now();
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const elapsed = Date.now() - startTime;
    console.log(`[ServiceWorker:fetch] [Cache-First] ✅ CACHE HIT (${elapsed}ms) in [${cacheName}]: ${url}`);

    // Background revalidation: keep cache fresh when network is accessible
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
          console.log(`[ServiceWorker:fetch] [Cache-First] 🔄 Background revalidation updated cache for: ${url}`);
        }
      })
      .catch((_) => {
        console.log(`[ServiceWorker:fetch] [Cache-First] ℹ️ Offline or low-connectivity: background update skipped for: ${url}`);
      });

    return cachedResponse;
  }

  console.log(`[ServiceWorker:fetch] [Cache-First] 🔍 CACHE MISS in [${cacheName}]. Fetching from network: ${url}`);

  // Not in cache: fetch from network and store in cache
  try {
    const networkResponse = await fetch(request);
    const elapsed = Date.now() - startTime;
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
      console.log(`[ServiceWorker:fetch] [Cache-First] 📥 Network fetch SUCCESS (${elapsed}ms). Cached into [${cacheName}]: ${url}`);
    } else {
      console.warn(`[ServiceWorker:fetch] [Cache-First] ⚠️ Network fetch returned status ${networkResponse?.status} (${elapsed}ms): ${url}`);
    }
    return networkResponse;
  } catch (err) {
    console.warn(`[ServiceWorker:fetch] [Cache-First] 🚫 Network request FAILED (offline condition) for: ${url}`, { error: err.message });

    // If business directory request fails offline and wasn't cached, serve emergency baseline
    if (isDirectory) {
      console.log(`[ServiceWorker:fetch] [Cache-First] 🛡️ OFFLINE FALLBACK: Serving emergency baseline directory data for: ${url}`);
      if (request.url.includes('/categories')) {
        return new Response(JSON.stringify(BASELINE_CATEGORIES), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-FindAba-Offline-Fallback': 'true' }
        });
      }
      return new Response(JSON.stringify(BASELINE_BUSINESSES), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-FindAba-Offline-Fallback': 'true' }
      });
    }

    // If navigation request fails, serve cached index.html or root
    if (request.mode === 'navigate') {
      console.log(`[ServiceWorker:fetch] [Cache-First] 🛡️ OFFLINE FALLBACK: Serving cached HTML app shell for navigation: ${url}`);
      const staticCache = await caches.open(STATIC_CACHE);
      const cachedShell = (await staticCache.match('/index.html')) || (await staticCache.match('/'));
      if (cachedShell) return cachedShell;
    }

    throw err;
  }
}

/**
 * NETWORK-FIRST STRATEGY
 * Tries network first to guarantee freshness for user-specific data.
 * If network succeeds, updates the cache.
 * If network fails or times out in low-connectivity conditions, falls back to the cached user data.
 */
async function handleNetworkFirst(request, cacheName, timeoutMs = 3500) {
  const url = request.url;
  const startTime = Date.now();
  console.log(`[ServiceWorker:fetch] [Network-First] 🌐 Initiating network fetch with ${timeoutMs}ms timeout for: ${url}`);
  const cache = await caches.open(cacheName);

  const fetchPromise = fetch(request).then((networkResponse) => {
    const elapsed = Date.now() - startTime;
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
      console.log(`[ServiceWorker:fetch] [Network-First] ✅ Network response received (${elapsed}ms). Cached in [${cacheName}]: ${url}`);
    } else {
      console.log(`[ServiceWorker:fetch] [Network-First] Network responded with status ${networkResponse?.status} (${elapsed}ms): ${url}`);
    }
    return networkResponse;
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Network timeout (${timeoutMs}ms) exceeded in low-connectivity conditions`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.warn(`[ServiceWorker:fetch] [Network-First] ⚠️ Network timed out or failed (${elapsed}ms) in offline/low-connectivity conditions for: ${url}. Error: ${err.message}`);

    // Network failed or timed out: fall back to cached user data
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log(`[ServiceWorker:fetch] [Network-First] 📦 OFFLINE FALLBACK: Serving cached user-specific data for: ${url}`);
      return cachedResponse;
    }

    console.warn(`[ServiceWorker:fetch] [Network-First] ❌ No cached user data available offline for: ${url}. Serving offline structured JSON.`);

    // Return structured offline response if client expects JSON
    if (request.headers.get('accept')?.includes('application/json') || request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          offline: true,
          error: 'Offline',
          message: 'Unable to refresh live user data due to network connection in Aba. Please reconnect.'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'X-FindAba-Offline': 'true' }
        }
      );
    }

    throw err;
  }
}

// 4. FETCH EVENT LISTENER: Route requests to appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Intercept only GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Intercept only HTTP(S) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Exclude payments and development HMR websockets
  if (
    url.pathname.startsWith('/api/payment') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.includes('hmr') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  console.log(`[ServiceWorker:fetch] 📡 Intercepted GET request: ${url.pathname} (full URL: ${url.href})`);

  // A. USER-SPECIFIC DATA -> NETWORK-FIRST STRATEGY (ensures fresh data)
  if (isUserSpecificDataRequest(url)) {
    console.log(`[ServiceWorker:fetch] 🧭 Route Decision: [User-Specific Data] -> Strategy: [Network-First] for ${url.pathname}`);
    event.respondWith(handleNetworkFirst(request, USER_DATA_CACHE));
    return;
  }

  // B. BUSINESS DIRECTORY JSON/API RESPONSES -> CACHE-FIRST STRATEGY (supports offline viewing)
  if (isBusinessDirectoryRequest(url)) {
    console.log(`[ServiceWorker:fetch] 🧭 Route Decision: [Business Directory API] -> Strategy: [Cache-First] for ${url.pathname}`);
    event.respondWith(handleCacheFirst(request, DIRECTORY_CACHE, true));
    return;
  }

  // C. STATIC ASSETS & APP SHELL -> CACHE-FIRST STRATEGY (fast local loading)
  if (isStaticAssetRequest(url, request) && url.origin === self.location.origin) {
    console.log(`[ServiceWorker:fetch] 🧭 Route Decision: [Static Asset / App Shell] -> Strategy: [Cache-First] for ${url.pathname}`);
    event.respondWith(handleCacheFirst(request, STATIC_CACHE, false));
    return;
  }

  // D. DEFAULT: Try network first with cache fallback
  event.respondWith(
    fetch(request).catch(async (err) => {
      console.warn(`[ServiceWorker:fetch] 🧭 Route Decision: [Default] Network failed for ${url.pathname}, checking offline cache fallback...`, err);
      const match = await caches.match(request);
      if (match) {
        console.log(`[ServiceWorker:fetch] 📦 [Default] Serving cached match for: ${url.pathname}`);
        return match;
      }
      throw err;
    })
  );
});
