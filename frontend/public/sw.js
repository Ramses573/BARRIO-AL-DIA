// Service Worker para Barrio al Día PWA
const CACHE_NAME = 'barrio-al-dia-v2'
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
]

const isLocalHost = () => {
  const host = self.location.hostname || ''
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')
}

self.addEventListener('install', (event) => {
  if (isLocalHost()) {
    self.skipWaiting()
    return
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (isLocalHost() || name !== CACHE_NAME) {
            return caches.delete(name)
          }
          return Promise.resolve()
        })
      )
    ).then(() => {
      if (isLocalHost()) {
        return self.registration.unregister()
      }
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (isLocalHost()) {
    return
  }
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/')
        })
      })
  )
})
