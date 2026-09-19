const CACHE = "hlsa-app-v12";

// Appends a throwaway query param so the OUTGOING network request has a URL GitHub
// Pages' CDN has never seen before, guaranteeing a true cache miss there. This is the
// piece that was still missing: { cache: "no-store" } on a fetch() only defeats the
// BROWSER's own HTTP cache — GitHub Pages' CDN (Fastly) sits in front of that and does
// NOT honor client cache-bypass request headers at all (confirmed directly: an
// explicit Cache-Control: no-cache request still came back X-Cache: HIT, Age: 111). A
// unique URL is the only thing that reliably defeats an edge cache like that.
function bust(url) {
  return url + (url.indexOf("?") === -1 ? "?" : "&") + "_sw=" + Date.now();
}
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/logo.png",
  "./assets/qrcode.min.js",
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

  // version.json is the update-detection mechanism (see index.html) — it must NEVER be
  // served from this (or any) cache, or the version check becomes exactly as stale as
  // the thing it's supposed to detect. Network-only, no fallback: if it fails, the page
  // just skips that particular check, which is fine.
  if (req.url.endsWith("version.json")) {
    event.respondWith(fetch(bust(req.url), { cache: "no-store" }));
    return;
  }

  const isAppShellDoc = req.mode === "navigate" || req.url.endsWith("manifest.webmanifest");

  if (isAppShellDoc) {
    // Network-first: always try to get the latest index.html/manifest when online, so
    // an update you push is visible the very next time the app opens. Cache is only
    // used as an offline fallback. The actual network fetch goes to a cache-busted URL
    // (see bust() above) to get past GitHub Pages' CDN, not just the browser's own
    // cache — { cache: "no-store" } alone only handles the latter. The response is
    // still stored under the ORIGINAL clean URL (req), so the offline fallback and any
    // other lookup of this page keep working against a stable key.
    event.respondWith(
      fetch(bust(req.url), { cache: "no-store" })
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
