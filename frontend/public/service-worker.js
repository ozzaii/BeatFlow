/**
 * @file service-worker.js
 * @description Service worker for background audio and offline support
 * Features:
 * - Background audio playback
 * - Offline caching
 * - Smart preloading
 * - Push notifications
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `beatflow-${CACHE_VERSION}`

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/models/audio-enhancer.onnx',
  '/wasm/audio-processor.wasm',
]

// Audio sample paths to cache
const AUDIO_PATHS = [
  '/samples/909/',
  '/samples/808/',
  '/samples/acoustic/',
]

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      }),
      // Register background sync
      self.registration.sync.register('audio-sync'),
      // Set up push notifications
      self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VAPID_PUBLIC_KEY,
      }),
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('beatflow-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  // Audio files strategy
  if (isAudioRequest(event.request)) {
    event.respondWith(handleAudioRequest(event.request))
  }
  // API requests strategy
  else if (isApiRequest(event.request)) {
    event.respondWith(handleApiRequest(event.request))
  }
  // Static assets strategy
  else {
    event.respondWith(handleStaticRequest(event.request))
  }
})

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'audio-sync') {
    event.waitUntil(syncAudioData())
  }
})

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification('BeatFlow', {
      body: data.message,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      data: data.payload,
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Audio request handling
async function handleAudioRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Refresh cache in background
    refreshCache(request)
    return cachedResponse
  }

  // Network request with timeout
  try {
    const networkResponse = await timeoutPromise(
      fetch(request.clone()),
      5000 // 5 second timeout
    )
    
    // Cache successful response
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // Fallback to offline audio placeholder
    return caches.match('/offline/audio-placeholder.mp3')
  }
}

// API request handling
async function handleApiRequest(request) {
  try {
    // Network first for API requests
    const response = await fetch(request.clone())
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cached response
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback
    return new Response(
      JSON.stringify({ error: 'You are offline' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }
    )
  }
}

// Static request handling
async function handleStaticRequest(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request.clone())
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    throw error
  }
}

// Background sync implementation
async function syncAudioData() {
  const db = await openDB()
  const unsynced = await db.getAll('unsynced')
  
  for (const data of unsynced) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      await db.delete('unsynced', data.id)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}

// Utility functions
function isAudioRequest(request) {
  return AUDIO_PATHS.some(path => request.url.includes(path))
}

function isApiRequest(request) {
  return request.url.includes('/api/')
}

async function refreshCache(request) {
  try {
    const response = await fetch(request.clone())
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response)
    }
  } catch (error) {
    console.error('Cache refresh failed:', error)
  }
}

function timeoutPromise(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ])
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('beatflow', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      db.createObjectStore('unsynced', { keyPath: 'id' })
    }
  })
} 