/**
 * SmartTrack - Contrôleur Dashboard
 * Orchestration du dashboard principal
 */

const DashboardController = (function() {
    let isInitialized = false;
    let refreshInterval = null;

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('🎮 Initialisation DashboardController...');
            
            // Initialiser la vue
            if (typeof DashboardView !== 'undefined') {
                DashboardView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:dashboard', handleDashboardRoute);
                EventBus.on('route:home', handleDashboardRoute); // Alias pour home
                EventBus.on('app:initialized', handleAppInitialized);
                EventBus.on('app:visibility-changed', handleVisibilityChanged);
            }
            
            isInitialized = true;
            console.log('✓ DashboardController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation DashboardController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers le dashboard
     */
    function handleDashboardRoute() {
        console.log('📍 Navigation vers Dashboard');
        renderDashboard();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - DashboardController prêt');
        
        // Afficher le dashboard par défaut
        renderDashboard();
    }

    /**
     * Gérer les changements de visibilité de l'app
     */
    function handleVisibilityChanged(data) {
        if (data.isVisible) {
            // Rafraîchir les données quand l'app redevient visible
            refreshDashboardData();
            startAutoRefresh();
        } else {
            // Arrêter le rafraîchissement automatique
            stopAutoRefresh();
        }
    }

    /**
     * Rendre le dashboard
     */
    async function renderDashboard() {
        try {
            if (typeof DashboardView !== 'undefined') {
                await DashboardView.render();
                updateActiveNavigation('dashboard');
                startAutoRefresh();
            } else {
                console.error('❌ DashboardView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu dashboard :', error);
            showErrorScreen('Erreur lors du chargement du dashboard');
        }
    }

    /**
     * Rafraîchir les données du dashboard
     */
    async function refreshDashboardData() {
        try {
            console.log('🔄 Rafraîchissement données dashboard...');
            
            // Émettre un événement pour indiquer le rafraîchissement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('dashboard:refresh-started');
            }
            
            // Demander aux modèles de rafraîchir leurs données
            await Promise.all([
                refreshPlayerData(),
                refreshSessionData(),
                refreshAnalyticsData(),
                refreshProgramData()
            ]);
            
            // Émettre un événement pour indiquer la fin du rafraîchissement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('dashboard:refresh-completed');
            }
            
            console.log('✓ Données dashboard rafraîchies');
            
        } catch (error) {
            console.error('❌ Erreur rafraîchissement dashboard :', error);
            
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('dashboard:refresh-failed', { error: error.message });
            }
        }
    }

    /**
     * Rafraîchir les données du joueur
     */
    async function refreshPlayerData() {
        if (typeof GamificationModel !== 'undefined') {
            try {
                const playerData = await GamificationModel.getPlayerData();
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('gamification:player-updated', { player: playerData });
                }
            } catch (error) {
                console.warn('⚠️ Erreur rafraîchissement données joueur :', error);
            }
        }
    }

    /**
     * Rafraîchir les données de session
     */
    async function refreshSessionData() {
        if (typeof SessionsModel !== 'undefined') {
            try {
                const currentSession = await SessionsModel.getCurrentSession();
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:current-updated', { session: currentSession });
                }
            } catch (error) {
                console.warn('⚠️ Erreur rafraîchissement session :', error);
            }
        }
    }

    /**
     * Rafraîchir les données d'analytics
     */
    async function refreshAnalyticsData() {
        if (typeof AnalyticsModel !== 'undefined') {
            try {
                const analyticsData = await AnalyticsModel.getOverviewStats();
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('analytics:updated', { analytics: analyticsData });
                }
            } catch (error) {
                console.warn('⚠️ Erreur rafraîchissement analytics :', error);
            }
        }
    }

    /**
     * Rafraîchir les données de programme
     */
    async function refreshProgramData() {
        if (typeof ProgramsModel !== 'undefined') {
            try {
                const currentProgram = await ProgramsModel.getCurrentProgram();
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:current-updated', { program: currentProgram });
                }
            } catch (error) {
                console.warn('⚠️ Erreur rafraîchissement programme :', error);
            }
        }
    }

    /**
     * Démarrer le rafraîchissement automatique
     */
    function startAutoRefresh() {
        // Arrêter le rafraîchissement existant s'il y en a un
        stopAutoRefresh();
        
        // Rafraîchir toutes les 2 minutes
        refreshInterval = setInterval(refreshDashboardData, 120000);
        console.log('⏰ Auto-refresh dashboard démarré');
    }

    /**
     * Arrêter le rafraîchissement automatique
     */
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log('⏰ Auto-refresh dashboard arrêté');
        }
    }

    /**
     * Actions de navigation depuis le dashboard
     */
    async function navigateToExercises() {
        if (typeof Router !== 'undefined') {
            Router.navigate('exercises');
        }
    }

    async function navigateToPreparation() {
        if (typeof Router !== 'undefined') {
            Router.navigate('preparation');
        }
    }

    async function navigateToPrograms() {
        if (typeof Router !== 'undefined') {
            Router.navigate('programs');
        }
    }

    async function navigateToGamification() {
        if (typeof Router !== 'undefined') {
            Router.navigate('gamification');
        }
    }

    async function navigateToAnalytics() {
        if (typeof Router !== 'undefined') {
            Router.navigate('analytics');
        }
    }

    async function navigateToHistory() {
        if (typeof Router !== 'undefined') {
            Router.navigate('history');
        }
    }

    async function navigateToLiveSession() {
        if (typeof Router !== 'undefined') {
            Router.navigate('live-session');
        }
    }

    /**
     * Actions de session depuis le dashboard
     */
    async function startNewSession() {
        try {
            console.log('🎯 Démarrage nouvelle session...');
            
            if (typeof SessionsModel !== 'undefined') {
                // Créer une nouvelle session de préparation
                const newSession = await SessionsModel.createSession({
                    name: `Session ${new Date().toLocaleDateString()}`,
                    type: 'custom'
                });
                
                console.log('✓ Nouvelle session créée :', newSession.id);
                
                // Naviguer vers la préparation
                navigateToPreparation();
                
            } else {
                throw new Error('SessionsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur démarrage session :', error);
            showError('Erreur lors de la création de la session');
        }
    }

    async function continueCurrentSession() {
        try {
            console.log('⚔️ Continuation session...');
            
            if (typeof SessionsModel !== 'undefined') {
                const currentSession = await SessionsModel.getCurrentSession();
                
                if (!currentSession) {
                    throw new Error('Aucune session active');
                }
                
                if (currentSession.status === 'preparation') {
                    // Si en préparation, aller à la préparation
                    navigateToPreparation();
                } else {
                    // Sinon, aller à la session live
                    navigateToLiveSession();
                }
                
            } else {
                throw new Error('SessionsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur continuation session :', error);
            showError('Erreur lors de la continuation de la session');
        }
    }

    async function pauseCurrentSession() {
        try {
            console.log('⏸️ Pause session...');
            
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.pauseCurrentSession();
                
                // Rafraîchir les données
                await refreshSessionData();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Session mise en pause');
                }
                
            } else {
                throw new Error('SessionsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur pause session :', error);
            showError('Erreur lors de la pause de la session');
        }
    }

    /**
     * Actions de programme depuis le dashboard
     */
    async function continueCurrentProgram() {
        try {
            console.log('📚 Continuation programme...');
            
            if (typeof ProgramsModel !== 'undefined') {
                const nextSession = await ProgramsModel.getNextSession();
                
                if (nextSession) {
                    // Créer la session depuis le programme
                    await SessionsModel.createSessionFromProgram(nextSession);
                    navigateToPreparation();
                } else {
                    throw new Error('Aucune session suivante disponible');
                }
                
            } else {
                throw new Error('ProgramsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur continuation programme :', error);
            showError('Erreur lors de la continuation du programme');
        }
    }

    async function pauseCurrentProgram() {
        try {
            console.log('⏸️ Pause programme...');
            
            if (typeof ProgramsModel !== 'undefined') {
                await ProgramsModel.pauseCurrentProgram();
                
                // Rafraîchir les données
                await refreshProgramData();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Programme suspendu');
                }
                
            } else {
                throw new Error('ProgramsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur pause programme :', error);
            showError('Erreur lors de la suspension du programme');
        }
    }

    /**
     * Ajouter un exercice à la session courante
     */
    async function addExerciseToCurrentSession(exerciseId) {
        try {
            console.log('➕ Ajout exercice à la session :', exerciseId);
            
            if (typeof SessionsModel !== 'undefined' && typeof ExercisesController !== 'undefined') {
                // Utiliser le contrôleur d'exercices pour ajouter à la session
                await ExercisesController.addExerciseToSession(exerciseId);
                
                // Rafraîchir les données de session
                await refreshSessionData();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Exercice ajouté à la session !');
                }
                
            } else {
                throw new Error('Modules requis non disponibles');
            }
            
        } catch (error) {
            console.error('❌ Erreur ajout exercice :', error);
            showError('Erreur lors de l\'ajout de l\'exercice');
        }
    }

    /**
     * Obtenir les statistiques du dashboard
     */
    async function getDashboardStats() {
        try {
            const stats = {
                player: null,
                session: null,
                analytics: null,
                program: null
            };
            
            // Collecter les données de tous les modèles
            if (typeof GamificationModel !== 'undefined') {
                stats.player = await GamificationModel.getPlayerData();
            }
            
            if (typeof SessionsModel !== 'undefined') {
                stats.session = await SessionsModel.getCurrentSession();
            }
            
            if (typeof AnalyticsModel !== 'undefined') {
                stats.analytics = await AnalyticsModel.getOverviewStats();
            }
            
            if (typeof ProgramsModel !== 'undefined') {
                stats.program = await ProgramsModel.getCurrentProgram();
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur récupération stats dashboard :', error);
            return null;
        }
    }

    /**
     * Mettre à jour la navigation active
     */
    function updateActiveNavigation(section) {
        try {
            // Retirer l'état actif de tous les éléments de navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Marquer l'élément actuel comme actif
            const activeItem = document.querySelector(`[data-screen="${section}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        } catch (error) {
            console.warn('⚠️ Erreur mise à jour navigation :', error);
        }
    }

    /**
     * Afficher un écran de secours
     */
    function showFallbackScreen() {
        const container = document.getElementById('app-content');
        if (container) {
            container.innerHTML = `
                <div class="screen error-screen">
                    <div class="error-content">
                        <h2>⚠️ Dashboard non disponible</h2>
                        <p>Le module dashboard n'est pas encore chargé.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Recharger l'application
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Afficher un écran d'erreur
     */
    function showErrorScreen(message) {
        const container = document.getElementById('app-content');
        if (container) {
            container.innerHTML = `
                <div class="screen error-screen">
                    <div class="error-content">
                        <h2>❌ Erreur Dashboard</h2>
                        <p>${message}</p>
                        <div class="error-actions">
                            <button class="btn btn-secondary" onclick="DashboardController.renderDashboard()">
                                Réessayer
                            </button>
                            <button class="btn btn-primary" onclick="location.reload()">
                                Recharger
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Afficher une erreur
     */
    function showError(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            alert(message);
        }
    }

    /**
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasView: typeof DashboardView !== 'undefined',
            hasRefreshInterval: refreshInterval !== null
        };
    }

    /**
     * Nettoyer les ressources (appelé lors de la navigation)
     */
    function cleanup() {
        stopAutoRefresh();
    }

    // Interface publique
    return {
        init,
        renderDashboard,
        refreshDashboardData,
        navigateToExercises,
        navigateToPreparation,
        navigateToPrograms,
        navigateToGamification,
        navigateToAnalytics,
        navigateToHistory,
        navigateToLiveSession,
        startNewSession,
        continueCurrentSession,
        pauseCurrentSession,
        continueCurrentProgram,
        pauseCurrentProgram,
        addExerciseToCurrentSession,
        getDashboardStats,
        getInitializationStatus,
        cleanup
    };
})();

// Export global
window.DashboardController = DashboardController;