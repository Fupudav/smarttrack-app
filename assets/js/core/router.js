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

        // Route exercices
        define('exercises', {
            render: renderExercises,
            title: 'Arsenal d\'Exercices',
            icon: '🏋️'
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

        // Route templates
        define('templates', {
            render: renderTemplates,
            title: 'Modèles de Session',
            icon: '📝'
        });

        // Route photos
        define('photos', {
            render: renderPhotos,
            title: 'Photos de Progression',
            icon: '📸'
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
            // Vérifier qu'une séance au statut "active" existe
            return Storage.get(STORAGE_KEYS.SESSIONS)
                .then(sessions => {
                    const hasActiveSession = Array.isArray(sessions) && sessions.some(s => s.status === 'active');

                    if (!hasActiveSession) {
                        console.warn('⚠️ Tentative d\'accès à une séance live sans session active');
                        navigate(ROUTES.PREPARATION);
                        return false;
                    }

                    return true;
                })
                .catch(err => {
                    console.error('❌ Erreur vérification session active :', err);
                    return false;
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
                
                // Émettre événement spécifique à la route
                EventBus.emit(`route:${path}`, {
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
            let screen = document.getElementById(screenId);

            // Rechercher d'abord par ID, puis en fallback par classe
            if (!screen) {
                screen = document.querySelector(`.${path}-screen`);

                // Si on le trouve, on lui ajoute l'ID standard pour les prochaines navigations
                if (screen) {
                    screen.id = screenId;
                }
            }

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
     * Fonctions de rendu par défaut (utilisent les contrôleurs)
     */
    async function renderDashboard(params, options) {
        console.log('🏰 Rendu Dashboard');
        if (typeof DashboardController !== 'undefined') {
            await DashboardController.renderDashboard();
        } else {
            console.warn('⚠️ DashboardController non disponible');
            renderFallbackScreen('Dashboard', '🏰');
        }
    }

    async function renderPreparation(params, options) {
        console.log('⚔️ Rendu Préparation');
        if (typeof PreparationController !== 'undefined') {
            await PreparationController.renderPreparation();
        } else {
            console.warn('⚠️ PreparationController non disponible');
            renderFallbackScreen('Préparation', '⚔️');
        }
    }

    async function renderExercises(params, options) {
        console.log('🏋️ Rendu Exercices');
        if (typeof ExercisesController !== 'undefined') {
            await ExercisesController.renderExercisesScreen();
        } else {
            console.warn('⚠️ ExercisesController non disponible');
            renderFallbackScreen('Exercices', '🏋️');
        }
    }

    async function renderLiveSession(params, options) {
        console.log('🎯 Rendu Session Live');
        if (typeof LiveSessionController !== 'undefined') {
            await LiveSessionController.renderLiveSession();
        } else {
            console.warn('⚠️ LiveSessionController non disponible');
            renderFallbackScreen('Session Live', '🎯');
        }
    }

    async function renderHistory(params, options) {
        console.log('📜 Rendu Historique');
        
        // Créer l'interface d'historique
        const content = document.getElementById('app-content');
        if (content) {
            // Structure HTML pour l'historique
            content.innerHTML = `
                <div class="screen active" id="screen-history">
                    <div class="header">
                        <h1>📜 Historique des Batailles</h1>
                        <button class="btn btn-secondary" onclick="history.back()">
                            ← Retour
                        </button>
                    </div>
                    <div id="history-content" class="content">
                        <div class="loading-spinner">
                            Chargement de l'historique...
                        </div>
                    </div>
                </div>
            `;
            
            // Charger les données d'historique
            try {
                if (typeof SessionsModel !== 'undefined') {
                    const sessions = await SessionsModel.getAllSessions();
                    const completedSessions = sessions.filter(s => s.status === 'completed');
                    renderHistoryList(completedSessions);
                } else {
                    console.warn('⚠️ SessionsModel non disponible pour l\'historique');
                    renderHistoryFallback();
                }
            } catch (error) {
                console.error('❌ Erreur chargement historique :', error);
                renderHistoryError();
            }
        }
    }

    /**
     * Rendre la liste d'historique
     */
    function renderHistoryList(sessions) {
        const contentEl = document.getElementById('history-content');
        if (!contentEl) return;

        if (sessions.length === 0) {
            contentEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <h3>Aucune bataille terminée</h3>
                    <p>Vos victoires apparaîtront ici une fois que vous aurez terminé vos premières séances.</p>
                    <button class="btn btn-primary" onclick="router.navigate('preparation')">
                        Commencer une bataille
                    </button>
                </div>
            `;
            return;
        }

        // Trier par date décroissante
        const sortedSessions = sessions.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

        const historyHTML = `
            <div class="history-stats">
                <div class="stat-card">
                    <div class="stat-value">${sessions.length}</div>
                    <div class="stat-label">Batailles Terminées</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60000)}min</div>
                    <div class="stat-label">Temps Total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${sessions.reduce((acc, s) => acc + (s.totalSets || 0), 0)}</div>
                    <div class="stat-label">Séries Réalisées</div>
                </div>
            </div>
            <div class="history-list">
                ${sortedSessions.map(session => `
                    <div class="history-item card">
                        <div class="session-header">
                            <div class="session-title">
                                <strong>${session.name || 'Séance'}</strong>
                                <span class="session-date">${new Date(session.endDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div class="session-stats">
                                <span class="stat">${Math.round((session.duration || 0) / 60000)}min</span>
                                <span class="stat">${session.exercisesCount || 0} exercices</span>
                                <span class="stat">${session.totalSets || 0} séries</span>
                            </div>
                        </div>
                        ${session.xpEarned ? `<div class="xp-badge">+${session.xpEarned} XP</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        contentEl.innerHTML = historyHTML;
    }

    /**
     * Rendre un état de fallback pour l'historique
     */
    function renderHistoryFallback() {
        const contentEl = document.getElementById('history-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Module d'historique temporairement indisponible</h3>
                    <p>Les données d'historique ne peuvent pas être chargées pour le moment.</p>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        Recharger
                    </button>
                </div>
            `;
        }
    }

    /**
     * Rendre un état d'erreur pour l'historique
     */
    function renderHistoryError() {
        const contentEl = document.getElementById('history-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Erreur de chargement</h3>
                    <p>Une erreur est survenue lors du chargement de l'historique.</p>
                    <button class="btn btn-secondary" onclick="router.reload()">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    async function renderGamification(params, options) {
        console.log('🏆 Rendu Gamification');
        if (typeof GamificationController !== 'undefined') {
            await GamificationController.renderGamification();
        } else {
            console.warn('⚠️ GamificationController non disponible');
            renderFallbackScreen('Gamification', '🏆');
        }
    }

    async function renderBody(params, options) {
        console.log('🏋️ Rendu Condition Physique');
        if (typeof PhotosController !== 'undefined') {
            await PhotosController.renderPhotos();
        } else {
            console.warn('⚠️ PhotosController non disponible');
            renderFallbackScreen('Condition Physique', '🏋️');
        }
    }

    async function renderAnalytics(params, options) {
        console.log('📈 Rendu Analytics');
        if (typeof AnalyticsController !== 'undefined') {
            await AnalyticsController.renderAnalytics();
        } else {
            console.warn('⚠️ AnalyticsController non disponible');
            renderFallbackScreen('Analytics', '📈');
        }
    }

    async function renderPrograms(params, options) {
        console.log('📋 Rendu Programmes');
        if (typeof ProgramsController !== 'undefined') {
            await ProgramsController.renderPrograms();
        } else {
            console.warn('⚠️ ProgramsController non disponible');
            renderFallbackScreen('Programmes', '📋');
        }
    }

    async function renderTemplates(params, options) {
        console.log('📝 Rendu Templates');
        if (typeof TemplatesController !== 'undefined') {
            await TemplatesController.renderTemplates();
        } else {
            console.warn('⚠️ TemplatesController non disponible');
            renderFallbackScreen('Templates', '📝');
        }
    }

    async function renderPhotos(params, options) {
        console.log('📸 Rendu Photos');
        if (typeof PhotosController !== 'undefined') {
            await PhotosController.renderPhotos();
        } else {
            console.warn('⚠️ PhotosController non disponible');
            renderFallbackScreen('Photos', '📸');
        }
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
     * Rendre un écran de secours
     */
    function renderFallbackScreen(moduleName, icon) {
        const content = document.getElementById('app-content');
        if (content) {
            content.innerHTML = `
                <div class="screen active">
                    <div class="error-content">
                        <div class="error-icon">${icon}</div>
                        <h2>Module ${moduleName} non disponible</h2>
                        <p>Ce module n'est pas encore chargé ou a rencontré une erreur.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Recharger l'application
                        </button>
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