const CACHE = 'adn-tracker-v4-logo'
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/favicon.ico", "/apple-touch-icon.png", "/icons/icon-16.png", "/icons/icon-32.png", "/icons/icon-48.png", "/icons/icon-72.png", "/icons/icon-96.png", "/icons/icon-128.png", "/icons/icon-144.png", "/icons/icon-152.png", "/icons/icon-180.png", "/icons/icon-192.png", "/icons/icon-256.png", "/icons/icon-384.png", "/icons/icon-512.png", "/icons/icon-1024.png", "/icons/apple-touch-icon.png", "/icons/pwa-icon.png"]
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('/index.html'))))
})
