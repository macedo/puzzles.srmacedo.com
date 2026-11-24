const CACHE_NAME = "srmacedo-puzzles-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/sliding-puzzle.html",
  "/css/application.css?v=e084eb5d",
  "/css/sliding-puzzle.css?v=931c74ab",
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
