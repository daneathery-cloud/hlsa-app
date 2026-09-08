const CACHE = "hlsa-app-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Only handle requests to this app's own origin. Cross-origin requests (the HLSA
  // WordPress API for live posts/RSVP, Google Fonts) are left alone entirely — the
  // page's own fetch() calls already have their own fresh-data-with-fallback logic,
  // and caching them here would just serve stale sponsor/post/RSVP data on repeat opens.
  if (new URL(req.url).origin !== self.location.origin) return;

  const isAppShellDoc = req.mode === "navigate" || req.url.endsWith("manifest.webmanifest");

  if (isAppShellDoc) {
    // Network-first: always try to get the latest index.html/manifest when online, so
    // an update you push is visible the very next time the app opens. Cache is only
    // used as an offline fallback.
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets (icons, logo): cache-first for speed, revalidating in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
