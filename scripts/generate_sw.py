#!/usr/bin/env python3
import os
import json
from pathlib import Path
import hashlib

class ServiceWorkerGenerator:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.static_dir = self.root_dir / 'static'
        self.version = self.generate_version()
        
    def generate_version(self):
        """Generate a version hash based on file contents"""
        hasher = hashlib.md5()
        
        for root, _, files in os.walk(self.static_dir):
            for file in sorted(files):
                file_path = os.path.join(root, file)
                with open(file_path, 'rb') as f:
                    for chunk in iter(lambda: f.read(4096), b''):
                        hasher.update(chunk)
                        
        return hasher.hexdigest()[:8]
        
    def generate(self):
        """Generate the service worker content"""
        cache_name = f'beatflow-{self.version}'
        
        # Define resources to precache
        precache_urls = self.get_precache_urls()
        
        # Create service worker content
        sw_content = f"""
            const CACHE_NAME = '{cache_name}';
            const OFFLINE_URL = '/offline.html';
            const PRECACHE_URLS = {json.dumps(precache_urls, indent=2)};
            
            // Cache strategies
            const CACHE_STRATEGIES = {{
                'static': 'cache-first',
                'pages': 'network-first',
                'api': 'network-only'
            }};
            
            // Install event - precache static resources
            self.addEventListener('install', event => {{
                event.waitUntil(
                    Promise.all([
                        caches.open(CACHE_NAME).then(cache => {{
                            return cache.addAll(PRECACHE_URLS);
                        }}),
                        // Cache offline page
                        fetch(OFFLINE_URL).then(response => {{
                            return caches.open(CACHE_NAME).then(cache => {{
                                return cache.put(OFFLINE_URL, response);
                            }});
                        }})
                    ]).then(() => {{
                        return self.skipWaiting();
                    }})
                );
            }});
            
            // Activate event - clean up old caches
            self.addEventListener('activate', event => {{
                event.waitUntil(
                    Promise.all([
                        // Clean up old caches
                        caches.keys().then(cacheNames => {{
                            return Promise.all(
                                cacheNames.map(cacheName => {{
                                    if (cacheName !== CACHE_NAME) {{
                                        return caches.delete(cacheName);
                                    }}
                                }})
                            );
                        }}),
                        // Take control of all clients
                        self.clients.claim()
                    ])
                );
            }});
            
            // Fetch event - handle requests with appropriate strategies
            self.addEventListener('fetch', event => {{
                const url = new URL(event.request.url);
                
                // Skip cross-origin requests
                if (url.origin !== location.origin) {{
                    return;
                }}
                
                // Determine cache strategy
                let strategy = 'network-first';
                if (url.pathname.startsWith('/static/')) {{
                    strategy = 'cache-first';
                }} else if (url.pathname.startsWith('/api/')) {{
                    strategy = 'network-only';
                }}
                
                event.respondWith(
                    handleFetchStrategy(event.request, strategy)
                );
            }});
            
            // Background sync for offline actions
            self.addEventListener('sync', event => {{
                if (event.tag === 'sync-beats') {{
                    event.waitUntil(syncBeats());
                }}
            }});
            
            // Push notifications
            self.addEventListener('push', event => {{
                const data = event.data.json();
                
                const options = {{
                    body: data.body,
                    icon: '/static/img/icon-192x192.png',
                    badge: '/static/img/badge.png',
                    vibrate: [100, 50, 100],
                    data: {{
                        url: data.url
                    }},
                    actions: [
                        {{
                            action: 'open',
                            title: 'Open',
                            icon: '/static/img/open.png'
                        }},
                        {{
                            action: 'close',
                            title: 'Close',
                            icon: '/static/img/close.png'
                        }}
                    ]
                }};
                
                event.waitUntil(
                    self.registration.showNotification(data.title, options)
                );
            }});
            
            // Notification click handler
            self.addEventListener('notificationclick', event => {{
                event.notification.close();
                
                if (event.action === 'open') {{
                    const url = event.notification.data.url;
                    event.waitUntil(
                        clients.openWindow(url)
                    );
                }}
            }});
            
            // Cache strategy handlers
            async function handleFetchStrategy(request, strategy) {{
                switch (strategy) {{
                    case 'cache-first':
                        return handleCacheFirst(request);
                    case 'network-first':
                        return handleNetworkFirst(request);
                    case 'network-only':
                        return handleNetworkOnly(request);
                    default:
                        return handleNetworkFirst(request);
                }}
            }}
            
            async function handleCacheFirst(request) {{
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {{
                    return cachedResponse;
                }}
                
                try {{
                    const networkResponse = await fetch(request);
                    await updateCache(request, networkResponse.clone());
                    return networkResponse;
                }} catch (error) {{
                    return await handleOffline(request);
                }}
            }}
            
            async function handleNetworkFirst(request) {{
                try {{
                    const networkResponse = await fetch(request);
                    await updateCache(request, networkResponse.clone());
                    return networkResponse;
                }} catch (error) {{
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {{
                        return cachedResponse;
                    }}
                    return await handleOffline(request);
                }}
            }}
            
            async function handleNetworkOnly(request) {{
                try {{
                    return await fetch(request);
                }} catch (error) {{
                    return await handleOffline(request);
                }}
            }}
            
            async function updateCache(request, response) {{
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response);
            }}
            
            async function handleOffline(request) {{
                // If HTML request, return offline page
                if (request.headers.get('Accept').includes('text/html')) {{
                    return await caches.match(OFFLINE_URL);
                }}
                
                // Return error response for other requests
                return new Response('Offline', {{
                    status: 503,
                    statusText: 'Service Unavailable'
                }});
            }}
            
            // Background sync handler
            async function syncBeats() {{
                const cache = await caches.open(CACHE_NAME);
                const requests = await cache.keys();
                
                const syncRequests = requests.filter(request => {{
                    return request.url.includes('/api/beats');
                }});
                
                return Promise.all(
                    syncRequests.map(async request => {{
                        try {{
                            const response = await fetch(request);
                            if (response.ok) {{
                                await cache.delete(request);
                            }}
                            return response;
                        }} catch (error) {{
                            return error;
                        }}
                    }})
                );
            }}
        """
        
        # Write service worker file
        sw_path = self.root_dir / 'static' / 'sw.js'
        with open(sw_path, 'w') as f:
            f.write(sw_content.strip())
            
        print(f"✨ Generated service worker version {self.version}")
        
    def get_precache_urls(self):
        """Get list of URLs to precache"""
        urls = [
            '/',
            '/offline.html',
            '/manifest.json',
            '/static/css/components.min.css',
            '/static/js/components.min.js'
        ]
        
        # Add static assets
        for root, _, files in os.walk(self.static_dir):
            for file in files:
                if file.endswith(('.css', '.js', '.png', '.jpg', '.svg', '.woff2')):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, self.root_dir)
                    urls.append(f'/{relative_path}')
                    
        return sorted(set(urls))

if __name__ == '__main__':
    generator = ServiceWorkerGenerator()
    generator.generate() 