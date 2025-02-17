const CACHE_NAME = 'tuneflow-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/static/css/utils.css',
    '/static/css/components/beatmaker.css',
    '/static/js/components/BeatMaker.js',
    '/static/js/components/BeatMakerUI.js',
    '/static/img/logo.svg',
    '/static/img/favicon.png',
    '/static/img/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event Strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Only cache static assets and fonts
                    if (event.request.url.match(/\.(css|js|png|jpg|jpeg|svg|woff2?)$/)) {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return response;
                });
            })
    );
});

// Background Sync for Offline Posts
self.addEventListener('sync', event => {
    if (event.tag === 'sync-beats') {
        event.waitUntil(syncBeats());
    }
});

// Push Notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/static/img/icon-192x192.png',
        badge: '/static/img/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Check it out',
                icon: '/static/img/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/static/img/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('TuneFlow', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
}); 