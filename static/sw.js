const CACHE_NAME = "srmacedo-puzzles-v5";
const ASSETS = [
  "/",
  "/index.html",
  "/sliding-puzzle.html",
  "/sudoku.html",
  "/memory-match.html",
  "/css/application.css?v=e084eb5d",
  "/css/game.css?v=f827bf4d",
  "/css/sliding-puzzle.css?v=2f023e1a",
  "/css/memory-match.css?v=e655817c",
  "/css/sudoku.css?v=5a6ef62b",
  "/js/game.js?v=d78ba1fd",
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
