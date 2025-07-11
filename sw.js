// SmartTrack Service Worker - Version intelligente
const VERSION = '1.0.1';
// TEST COMMENT
const CACHE_NAME = `smarttrack-v${VERSION}`;
const urlsToCache = [
  './smarttrack.html',
  './manifest.json',
  './smarttrack-icon.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js'
];

// Système de logging conditionnel pour Service Worker
const swLogger = {
  enabled: false, // Désactiver en production
  
  log: function(message, ...args) {
    if (this.enabled) {
      console.log(`[SmartTrack SW] ${message}`, ...args);
    }
  },
  
  warn: function(message, ...args) {
    if (this.enabled) {
      console.warn(`[SmartTrack SW] ${message}`, ...args);
    }
  },
  
  error: function(message, ...args) {
    // Les erreurs sont toujours affichées
    console.error(`[SmartTrack SW] ${message}`, ...args);
  }
};

// Installation du service worker
self.addEventListener('install', event => {
  swLogger.log('SmartTrack SW: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        swLogger.log('SmartTrack SW: Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        swLogger.log('SmartTrack SW: Tous les fichiers mis en cache');
        // Force l'activation immédiate du nouveau service worker
        return self.skipWaiting();
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  swLogger.log('SmartTrack SW: Activation en cours...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprimer tous les anciens caches SmartTrack
          if (cacheName.startsWith('smarttrack-v') && cacheName !== CACHE_NAME) {
            swLogger.log('SmartTrack SW: Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        }).filter(Boolean) // Filtrer les undefined
      );
    }).then(() => {
      swLogger.log('SmartTrack SW: Prise de contrôle immédiate');
      // Prend le contrôle immédiatement de toutes les pages
      return self.clients.claim();
    })
  );
});

// Stratégie de récupération des fichiers
self.addEventListener('fetch', event => {
  // Stratégie: Network First, puis Cache
  // Parfait pour une app qui se met à jour souvent
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la requête réseau réussit
        if (response && response.status === 200) {
          // Cloner la réponse car elle ne peut être lue qu'une fois
          const responseToCache = response.clone();
          
          // Mettre à jour le cache avec la nouvelle version
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si pas de réseau, utiliser le cache
        swLogger.log('SmartTrack SW: Pas de réseau, utilisation du cache pour:', event.request.url);
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si pas trouvé dans le cache, retourner une page d'erreur simple
            if (event.request.destination === 'document') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>SmartTrack - Hors ligne</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                      text-align: center; 
                      padding: 50px; 
                      background: #F2F2F7;
                    }
                    .offline-msg {
                      background: white;
                      padding: 30px;
                      border-radius: 16px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .emoji { font-size: 48px; margin-bottom: 20px; }
                    h1 { color: #007AFF; margin-bottom: 10px; }
                    p { color: #666; }
                    button {
                      background: #007AFF;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      font-size: 16px;
                      margin-top: 20px;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-msg">
                    <div class="emoji">📱</div>
                    <h1>SmartTrack</h1>
                    <p>Vous êtes hors ligne.</p>
                    <p>Reconnectez-vous à internet pour accéder à l'application.</p>
                    <button onclick="window.location.reload()">Réessayer</button>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
          });
      })
  );
});

// Écouter les messages du client (optionnel - pour forcer la mise à jour)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour (optionnel)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Vérifier s'il y a une nouvelle version
    fetch('./smarttrack.html', { cache: 'no-cache' })
      .then(response => response.text())
      .then(html => {
        // Tu peux ajouter ici une logique pour détecter si le fichier a changé
        event.ports[0].postMessage({ hasUpdate: true });
      })
      .catch(() => {
        event.ports[0].postMessage({ hasUpdate: false });
      });
  }
});
