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

// === INJECTION DYNAMIQUE DE program.css / program.js ===
async function injectDependencies(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;
    const text = await response.text();
    // Vérifier si déjà injecté
    if (text.includes('program.js') || text.includes('program.css')) {
      return new Response(text, { headers: response.headers });
    }
    // Inject <link rel="stylesheet" ...> après meta theme-color
    let modified = text.replace(
      /<meta[^>]*name=["']theme-color["'][^>]*>/i,
      match => `${match}\n    <link rel="stylesheet" href="program.css">`
    );
    // Inject <script src="program.js"></script> avant </body>
    modified = modified.replace(
      /<\/body>/i,
      `  <script src="program.js"></script>\n</body>`
    );
    return new Response(modified, { headers: response.headers });
  } catch (e) {
    swLogger.error('Injection failed', e);
    return response; // Fallback original
  }
}

// Modifier le fetch handler existant (Network First)
self.addEventListener('fetch', event => {
  // Stratégie: Network First, puis Cache
  event.respondWith(
    fetch(event.request)
      .then(async response => {
        // Injection si document HTML
        const finalResp = await injectDependencies(response.clone());
        // Mettre à jour le cache comme avant
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return finalResp;
      })
      .catch(() => {
        swLogger.log('SmartTrack SW: Pas de réseau, utilisation du cache pour:', event.request.url);
        return caches.match(event.request).then(response => {
          if (response) return response;
          if (event.request.destination === 'document') {
            return caches.match('./smarttrack.html').then(injectDependencies);
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
