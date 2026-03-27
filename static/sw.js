const CACHE_NAME = "srmacedo-puzzles-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/sliding-puzzle.html",
  "/css/application.css",
  "/css/sliding-puzzle.css",
  "/images/tetris.png"
]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
