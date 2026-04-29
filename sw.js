// ============================================================
//  SERVICE WORKER — Keperawatan RSU Surya Husadha Ubung
//  v4 — scope otomatis dari lokasi sw.js, aman multi-repo
// ============================================================

// BASE otomatis terdeteksi dari letak sw.js
const BASE = self.location.pathname.replace(/sw\.js$/, '');
const CACHE_NAME = 'komkep-shu-v1';

const CACHE_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: bersihkan cache lama ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Lewati semua domain eksternal
  if (url.origin !== self.location.origin) return;

  // Lewati non-GET
  if (event.request.method !== 'GET') return;

  // Hanya handle request di dalam scope BASE ini saja
  if (!url.pathname.startsWith(BASE)) return;

  // Network First → fallback Cache (untuk PWA offline)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || (event.request.mode === 'navigate'
            ? caches.match(BASE + 'index.html')
            : undefined)
        )
      )
  );
});
