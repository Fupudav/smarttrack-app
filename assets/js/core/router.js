/**
 * SmartTrack - Module de routage
 * Gère la navigation entre les écrans de l'application
 */

const Router = (function() {
    let currentRoute = null;
    let routes = {};
    let guards = {};
    let middleware = [];
    let isInitialized = false;
    let history = [];
    const maxHistorySize = 20;

    /**
     * Initialiser le router
     */
    async function init() {
        try {
            console.log('🗺️ Initialisation du Router...');
            
            // Définir les routes par défaut
            setupDefaultRoutes();
            
            // Configurer les gardes
            setupGuards();
            
            // Écouter les changements d'historique
            setupHistoryListeners();
            
            isInitialized = true;
            console.log('✓ Router initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation Router :', error);
            throw error;
        }
    }

    /**
     * Définir les routes par défaut
     */
    function setupDefaultRoutes() {
        // Route dashboard
        define(ROUTES.DASHBOARD, {
            render: renderDashboard,
            title: 'QG du Guerrier',
            icon: '🏰'
        });

        // Route préparation
        define(ROUTES.PREPARATION, {
            render: renderPreparation,
            title: 'Préparation de Bataille',
            icon: '⚔️'
        });

        // Route séance live
        define(ROUTES.LIVE_SESSION, {
            render: renderLiveSession,
            title: 'Champ de Bataille',
            icon: '🎯',
            protected: true
        });

        // Route historique
        define(ROUTES.HISTORY, {
            render: renderHistory,
            title: 'Historique des Batailles',
            icon: '📜'
        });

        // Route gamification
        define(ROUTES.GAMIFICATION, {
            render: renderGamification,
            title: 'Hall des Exploits',
            icon: '🏆'
        });

        // Route condition physique
        define(ROUTES.BODY, {
            render: renderBody,
            title: 'Condition Physique',
            icon: '🏋️'
        });

        // Route analytics
        define(ROUTES.ANALYTICS, {
            render: renderAnalytics,
            title: 'Analytics Avancées',
            icon: '📈'
        });

        // Route programmes
        define(ROUTES.PROGRAMS, {
            render: renderPrograms,
            title: 'Programmes d\'Entraînement',
            icon: '📋'
        });

        // Route paramètres
        define(ROUTES.SETTINGS, {
            render: renderSettings,
            title: 'Configuration',
            icon: '⚙️'
        });
    }

    /**
     * Configurer les gardes de navigation
     */
    function setupGuards() {
        // Garde pour les séances live
        guard(ROUTES.LIVE_SESSION, () => {
            // Vérifier qu'une séance est en cours
            return Storage.get(STORAGE_KEYS.SESSIONS)
                .then(sessions => {
                    const hasActivSession = sessions && sessions.some(s => s.isActive);
                    if (!hasActivSession) {
                        console.warn('⚠️ Tentative d\'accès à une séance live sans session active');
                        navigate(ROUTES.PREPARATION);
                        return false;
                    }
                    return true;
                });
        });
    }

    /**
     * Configurer les listeners d'historique
     */
    function setupHistoryListeners() {
        // Écouter les événements de navigation du navigateur
        window.addEventListener('popstate', handlePopState);
        
        // Écouter les événements personnalisés
        if (typeof EventBus !== 'undefined') {
            EventBus.on('router:navigate', handleNavigationEvent);
            EventBus.on('router:back', goBack);
            EventBus.on('router:forward', goForward);
        }
    }

    /**
     * Définir une route
     */
    function define(path, config) {
        if (typeof config === 'function') {
            config = { render: config };
        }

        routes[path] = {
            path,
            render: config.render,
            title: config.title || path,
            icon: config.icon || '📄',
            protected: config.protected || false,
            middleware: config.middleware || [],
            meta: config.meta || {}
        };

        console.log(`🗺️ Route définie : ${path}`);
    }

    /**
     * Ajouter un garde de navigation
     */
    function guard(path, guardFunction) {
        guards[path] = guardFunction;
        console.log(`🛡️ Garde ajouté pour : ${path}`);
    }

    /**
     * Ajouter un middleware global
     */
    function use(middlewareFunction) {
        middleware.push(middlewareFunction);
        console.log('🔧 Middleware ajouté');
    }

    /**
     * Naviguer vers une route
     */
    async function navigate(path, params = {}, options = {}) {
        try {
            if (!isInitialized) {
                console.warn('⚠️ Router non initialisé, navigation reportée');
                await init();
            }

            console.log(`🧭 Navigation vers : ${path}`);

            // Vérifier que la route existe
            const route = routes[path];
            if (!route) {
                console.error(`❌ Route inconnue : ${path}`);
                path = ROUTES.DASHBOARD; // Fallback
                route = routes[path];
            }

            // Exécuter les middlewares globaux
            for (const mw of middleware) {
                const result = await mw(path, params, options);
                if (result === false) {
                    console.log('🚫 Navigation bloquée par middleware');
                    return false;
                }
            }

            // Exécuter les middlewares de la route
            for (const mw of route.middleware) {
                const result = await mw(path, params, options);
                if (result === false) {
                    console.log('🚫 Navigation bloquée par middleware de route');
                    return false;
                }
            }

            // Vérifier les gardes
            if (guards[path]) {
                const guardResult = await guards[path](params, options);
                if (guardResult === false) {
                    console.log('🚫 Navigation bloquée par garde');
                    return false;
                }
            }

            // Émettre événement de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('router:before-navigate', {
                    from: currentRoute,
                    to: path,
                    params,
                    options
                });
            }

            // Sauvegarder l'historique
            if (currentRoute && currentRoute !== path) {
                addToHistory(currentRoute);
            }

            // Mettre à jour l'interface
            await updateUI(path, route, params, options);

            // Mettre à jour l'état
            currentRoute = path;

            // Mettre à jour le titre de la page
            document.title = `${route.title} - ${APP_NAME}`;

            // Émettre événement de navigation terminée
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('router:navigated', {
                    route: path,
                    params,
                    options,
                    timestamp: Date.now()
                });
            }

            console.log(`✓ Navigation vers ${path} terminée`);
            return true;

        } catch (error) {
            console.error(`❌ Erreur navigation vers ${path} :`, error);
            
            // Navigation de secours vers le dashboard
            if (path !== ROUTES.DASHBOARD) {
                console.log('🏠 Navigation de secours vers dashboard');
                return navigate(ROUTES.DASHBOARD);
            }
            
            return false;
        }
    }

    /**
     * Mettre à jour l'interface utilisateur
     */
    async function updateUI(path, route, params, options) {
        try {
            // Masquer tous les écrans
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });

            // Mettre à jour la navigation
            updateNavigation(path);

            // Rendre le contenu de la route
            await route.render(params, options);

            // Afficher l'écran correspondant
            const screenId = getScreenId(path);
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('active');
            } else {
                console.warn(`⚠️ Écran non trouvé : ${screenId}`);
            }

            // Scroller en haut
            if (!options.preserveScroll) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

        } catch (error) {
            console.error('❌ Erreur mise à jour UI :', error);
            throw error;
        }
    }

    /**
     * Mettre à jour la navigation active
     */
    function updateNavigation(path) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            
            const screenAttr = item.getAttribute('data-screen');
            if (screenAttr === path) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Obtenir l'ID de l'écran pour une route
     */
    function getScreenId(path) {
        return `screen-${path}`;
    }

    /**
     * Ajouter à l'historique
     */
    function addToHistory(route) {
        history.push({
            route,
            timestamp: Date.now()
        });

        // Limiter la taille de l'historique
        if (history.length > maxHistorySize) {
            history.shift();
        }
    }

    /**
     * Retour en arrière
     */
    function goBack() {
        if (history.length > 0) {
            const previous = history.pop();
            navigate(previous.route, {}, { fromHistory: true });
        } else {
            // Aller au dashboard par défaut
            navigate(ROUTES.DASHBOARD);
        }
    }

    /**
     * Aller en avant (si disponible)
     */
    function goForward() {
        // Implémentation basique - peut être améliorée
        console.log('🔄 Forward navigation non implémentée');
    }

    /**
     * Recharger la route actuelle
     */
    function reload() {
        if (currentRoute) {
            const route = routes[currentRoute];
            if (route) {
                updateUI(currentRoute, route, {}, { reload: true });
            }
        }
    }

    /**
     * Gérer les événements popstate
     */
    function handlePopState(event) {
        // Gérer la navigation avec les boutons du navigateur
        console.log('🔙 PopState détecté');
        // Implémentation selon les besoins
    }

    /**
     * Gérer les événements de navigation
     */
    function handleNavigationEvent(data) {
        if (data && data.route) {
            navigate(data.route, data.params, data.options);
        }
    }

    /**
     * Fonctions de rendu par défaut (seront remplacées par les modules)
     */
    async function renderDashboard(params, options) {
        console.log('🏰 Rendu Dashboard');
        // Le module dashboard prendra le relais
    }

    async function renderPreparation(params, options) {
        console.log('⚔️ Rendu Préparation');
        // Le module sessions prendra le relais
    }

    async function renderLiveSession(params, options) {
        console.log('🎯 Rendu Session Live');
        // Le module sessions prendra le relais
    }

    async function renderHistory(params, options) {
        console.log('📜 Rendu Historique');
        // Le module sessions prendra le relais
    }

    async function renderGamification(params, options) {
        console.log('🏆 Rendu Gamification');
        // Le module gamification prendra le relais
    }

    async function renderBody(params, options) {
        console.log('🏋️ Rendu Condition Physique');
        // Le module photos prendra le relais
    }

    async function renderAnalytics(params, options) {
        console.log('📈 Rendu Analytics');
        // Le module analytics prendra le relais
    }

    async function renderPrograms(params, options) {
        console.log('📋 Rendu Programmes');
        // Le module programs prendra le relais
    }

    async function renderSettings(params, options) {
        console.log('⚙️ Rendu Paramètres');
        // Rendu des paramètres
        const content = document.getElementById('app-content');
        if (content) {
            content.innerHTML = `
                <div class="screen active" id="screen-settings">
                    <div class="header">
                        <h1>⚙️ Configuration</h1>
                    </div>
                    <div class="card">
                        <h3>Paramètres de l'application</h3>
                        <p>Interface en cours de développement...</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Obtenir la route actuelle
     */
    function getCurrentRoute() {
        return currentRoute;
    }

    /**
     * Obtenir toutes les routes
     */
    function getRoutes() {
        return { ...routes };
    }

    /**
     * Obtenir l'historique
     */
    function getHistory() {
        return [...history];
    }

    /**
     * Vérifier si une route existe
     */
    function hasRoute(path) {
        return routes.hasOwnProperty(path);
    }

    /**
     * Obtenir les informations d'une route
     */
    function getRoute(path) {
        return routes[path] || null;
    }

    /**
     * Rediriger vers une route
     */
    function redirect(fromPath, toPath) {
        define(fromPath, {
            render: () => navigate(toPath),
            title: 'Redirection...'
        });
    }

    /**
     * Obtenir les statistiques du router
     */
    function getStats() {
        return {
            currentRoute,
            totalRoutes: Object.keys(routes).length,
            historySize: history.length,
            isInitialized,
            guards: Object.keys(guards).length,
            middleware: middleware.length
        };
    }

    // Interface publique
    return {
        init,
        define,
        guard,
        use,
        navigate,
        goBack,
        goForward,
        reload,
        redirect,
        getCurrentRoute,
        getRoutes,
        getHistory,
        hasRoute,
        getRoute,
        getStats
    };
})();

// Export global
window.Router = Router;