/**
 * SmartTrack - Point d'entrée principal
 * Application modulaire de suivi d'entraînement
 */

class SmartTrackApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.loadingScreen = null;
    }

    /**
     * Initialisation de l'application
     */
    async init() {
        try {
            console.log(`🚀 Initialisation de ${APP_NAME} v${APP_VERSION}`);
            this.showLoadingScreen();
            
            // Phase 1 : Modules core
            await this.initCoreModules();
            
            // Phase 2 : Chargement des données
            await this.loadAppData();
            
            // Phase 3 : Modules métier
            await this.initBusinessModules();
            
            // Phase 4 : Interface utilisateur
            await this.initUI();
            
            // Phase 5 : Finalisation
            await this.finalize();
            
            this.initialized = true;
            this.hideLoadingScreen();
            
            console.log('✅ SmartTrack initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation :', error);
            this.showError('Erreur d\'initialisation', error.message);
        }
    }

    /**
     * Afficher l'écran de chargement
     */
    showLoadingScreen() {
        this.loadingScreen = document.getElementById('loading-screen');
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Masquer l'écran de chargement
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
                document.getElementById('main-nav').style.display = 'flex';
            }, 300);
        }
    }

    /**
     * Initialiser les modules core
     */
    async initCoreModules() {
        console.log('📦 Initialisation des modules core...');
        
        // EventBus - Système d'événements global
        if (typeof EventBus !== 'undefined') {
            this.modules.eventBus = EventBus;
            console.log('✓ EventBus initialisé');
        }
        
        // Storage - Gestion du stockage
        if (typeof Storage !== 'undefined') {
            this.modules.storage = Storage;
            await Storage.init();
            console.log('✓ Storage initialisé');
        }
        
        // Utils - Utilitaires
        if (typeof Utils !== 'undefined') {
            this.modules.utils = Utils;
            console.log('✓ Utils initialisé');
        }
        
        // Router - Navigation
        if (typeof Router !== 'undefined') {
            this.modules.router = Router;
            await Router.init();
            console.log('✓ Router initialisé');
        }
        
        // Notification - Système de notifications
        if (typeof NotificationManager !== 'undefined') {
            this.modules.notification = NotificationManager;
            NotificationManager.init();
            console.log('✓ NotificationManager initialisé');
        }
    }

    /**
     * Charger les données de l'application
     */
    async loadAppData() {
        console.log('📊 Chargement des données...');
        
        try {
            // Charger les paramètres
            const settings = await Storage.get(STORAGE_KEYS.SETTINGS);
            if (settings) {
                this.applySettings(settings);
            }
            
            // Initialiser les données par défaut si nécessaire
            if (typeof DefaultData !== 'undefined') {
                await DefaultData.initialize();
                console.log('✓ Données par défaut initialisées');
            }
            
            console.log('✓ Données chargées');
            
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des données :', error);
            // Continuer avec les données par défaut
        }
    }

    /**
     * Initialiser les modules métier
     */
    async initBusinessModules() {
        console.log('🔧 Initialisation des modules métier...');
        
        const modulesList = [
            { name: 'ExercisesModel', key: 'exercises' },
            { name: 'SessionsModel', key: 'sessions' },
            { name: 'GamificationModel', key: 'gamification' },
            { name: 'TemplatesModel', key: 'templates' },
            { name: 'ProgramsModel', key: 'programs' },
            { name: 'PhotosModel', key: 'photos' },
            { name: 'AnalyticsModel', key: 'analytics' }
        ];
        
        for (const module of modulesList) {
            try {
                if (typeof window[module.name] !== 'undefined') {
                    this.modules[module.key] = window[module.name];
                    if (typeof window[module.name].init === 'function') {
                        await window[module.name].init();
                    }
                    console.log(`✓ ${module.name} initialisé`);
                } else {
                    console.warn(`⚠️ Module ${module.name} non trouvé`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de l'initialisation de ${module.name} :`, error);
            }
        }
    }

    /**
     * Initialiser l'interface utilisateur
     */
    async initUI() {
        console.log('🎨 Initialisation de l\'interface...');
        
        // Initialiser les composants UI
        if (typeof ModalManager !== 'undefined') {
            this.modules.modal = ModalManager;
            ModalManager.init();
            console.log('✓ ModalManager initialisé');
        }
        
        if (typeof TimerComponent !== 'undefined') {
            this.modules.timer = TimerComponent;
            TimerComponent.init();
            console.log('✓ TimerComponent initialisé');
        }
        
        if (typeof ChartsManager !== 'undefined') {
            this.modules.charts = ChartsManager;
            ChartsManager.init();
            console.log('✓ ChartsManager initialisé');
        }
        
        // Initialiser les contrôleurs (Phase 4)
        console.log('🎮 Initialisation des contrôleurs...');
        
        const controllersList = [
            { name: 'DashboardController', key: 'dashboard' },
            { name: 'ExercisesController', key: 'exercises' },
            { name: 'PreparationController', key: 'preparation' }
        ];
        
        for (const controller of controllersList) {
            try {
                if (typeof window[controller.name] !== 'undefined') {
                    this.modules[controller.key] = window[controller.name];
                    if (typeof window[controller.name].init === 'function') {
                        await window[controller.name].init();
                    }
                    console.log(`✓ ${controller.name} initialisé`);
                } else {
                    console.warn(`⚠️ Contrôleur ${controller.name} non trouvé`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de l'initialisation de ${controller.name} :`, error);
            }
        }
        
        // Configurer les gestionnaires d'événements globaux
        this.setupGlobalEventHandlers();
        
        // Charger la route initiale
        if (this.modules.router) {
            Router.navigate(ROUTES.DASHBOARD);
        }
        
        console.log('✓ Interface initialisée');
    }

    /**
     * Finaliser l'initialisation
     */
    async finalize() {
        console.log('🏁 Finalisation...');
        
        // Démarrer l'auto-sauvegarde
        this.startAutoSave();
        
        // Vérifier les mises à jour
        this.checkForUpdates();
        
        // Enregistrer l'événement d'initialisation
        if (this.modules.eventBus) {
            EventBus.emit('app:initialized', { 
                version: APP_VERSION,
                timestamp: Date.now()
            });
        }
        
        console.log('✓ Finalisation terminée');
    }

    /**
     * Configurer les gestionnaires d'événements globaux
     */
    setupGlobalEventHandlers() {
        // Gestionnaire pour fermer les menus déroulants
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });
        
        // Gestionnaire pour les raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Gestionnaire pour la sauvegarde avant fermeture
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
        
        // Gestionnaire pour les changements de visibilité
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Démarrer l'auto-sauvegarde
     */
    startAutoSave() {
        setInterval(() => {
            if (this.modules.storage) {
                Storage.autoSave();
            }
        }, DEFAULTS.AUTO_SAVE_INTERVAL);
    }

    /**
     * Vérifier les mises à jour
     */
    checkForUpdates() {
        // Logique de vérification des mises à jour
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    this.showUpdateNotification();
                }
            });
        }
    }

    /**
     * Afficher une notification de mise à jour
     */
    showUpdateNotification() {
        if (this.modules.notification) {
            NotificationManager.show(
                'Mise à jour disponible ! Rechargez la page pour l\'appliquer.',
                NOTIFICATION_TYPES.INFO,
                5000
            );
        }
    }

    /**
     * Appliquer les paramètres
     */
    applySettings(settings) {
        // Thème
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }
        
        // Autres paramètres...
        console.log('✓ Paramètres appliqués');
    }

    /**
     * Fermer tous les menus déroulants
     */
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
        const overlay = document.getElementById('dropdown-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    /**
     * Gérer les raccourcis clavier
     */
    handleKeyboardShortcuts(e) {
        // Échap pour fermer les modales et menus
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
            if (this.modules.modal) {
                ModalManager.closeAll();
            }
        }
        
        // Ctrl+S pour sauvegarder
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.modules.storage) {
                Storage.saveAll();
                if (this.modules.notification) {
                    NotificationManager.show('Données sauvegardées', NOTIFICATION_TYPES.SUCCESS);
                }
            }
        }
    }

    /**
     * Gérer la sauvegarde avant fermeture
     */
    handleBeforeUnload(e) {
        if (this.modules.storage && Storage.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
            return e.returnValue;
        }
    }

    /**
     * Gérer les changements de visibilité
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page masquée - sauvegarder les données
            if (this.modules.storage) {
                Storage.saveAll();
            }
        } else {
            // Page visible - vérifier les mises à jour
            this.checkForUpdates();
        }
    }

    /**
     * Afficher une erreur critique
     */
    showError(title, message) {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 1rem;">❌</div>
                <h3 style="color: #FF3B30; margin-bottom: 1rem;">${title}</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">${message}</p>
                <button onclick="location.reload()" style="
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                ">Recharger</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * Obtenir un module
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Vérifier si l'application est initialisée
     */
    isInitialized() {
        return this.initialized;
    }
}

// Initialisation globale
const app = new SmartTrackApp();

// Interface globale pour compatibilité
window.SmartTrack = app;
window.router = app.getModule('router');
window.ui = {
    toggleTrackingMenu: () => {
        const dropdown = document.getElementById('tracking-dropdown');
        const overlay = document.getElementById('dropdown-overlay');
        
        if (dropdown && overlay) {
            const isVisible = dropdown.classList.contains('show');
            
            if (isVisible) {
                dropdown.classList.remove('show');
                overlay.classList.remove('show');
            } else {
                dropdown.classList.add('show');
                overlay.classList.add('show');
            }
        }
    }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    console.error('❌ Erreur globale :', e.error);
    
    if (!app.isInitialized()) {
        app.showError('Erreur de chargement', 'Une erreur est survenue lors du chargement de l\'application.');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rejetée :', e.reason);
    e.preventDefault();
});