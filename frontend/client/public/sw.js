/**
 * CraftLens Studio Offline-First Service Worker
 * Caches core app shell and static assets for remote artisan clusters without signal.
 */

const CACHE_NAME = "craftlens-v1";
const STATIC_ASSETS = [
  "/studio",
  "/manifest.json",
  "/logo.png",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("SW pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass API requests to network, let IndexedDB queue handle offline drops
  if (event.request.url.includes("/api/")) {
    return;
  }

  // Stale-while-revalidate for static assets and pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is for a navigation page, serve cached studio shell
          if (event.request.mode === "navigate") {
            return caches.match("/studio");
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
