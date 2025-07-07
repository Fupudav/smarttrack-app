/**
 * SmartTrack - Module de gestion du stockage
 * Gère la persistance des données dans localStorage avec cache et validation
 */

const Storage = (function() {
    // Cache en mémoire pour de meilleures performances
    let cache = {};
    let hasUnsavedChanges = false;
    let isInitialized = false;

    /**
     * Initialiser le module de stockage
     */
    async function init() {
        try {
            console.log('🗄️ Initialisation du Storage...');
            
            // Vérifier la disponibilité du localStorage
            if (!isLocalStorageAvailable()) {
                throw new Error('localStorage non disponible');
            }
            
            // Charger les données en cache
            await loadAllToCache();
            
            // Nettoyer les anciennes données si nécessaire
            await cleanup();
            
            isInitialized = true;
            console.log('✓ Storage initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation Storage :', error);
            // Fallback vers un stockage en mémoire
            initMemoryFallback();
        }
    }

    /**
     * Vérifier la disponibilité du localStorage
     */
    function isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Charger toutes les données en cache
     */
    async function loadAllToCache() {
        for (const key of Object.values(STORAGE_KEYS)) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    cache[key] = JSON.parse(data);
                } else {
                    cache[key] = null;
                }
            } catch (error) {
                console.warn(`⚠️ Erreur chargement ${key} :`, error);
                cache[key] = null;
            }
        }
    }

    /**
     * Fallback vers stockage en mémoire
     */
    function initMemoryFallback() {
        console.warn('⚠️ Utilisation du stockage en mémoire');
        // Le cache servira de stockage principal
        isInitialized = true;
    }

    /**
     * Obtenir une donnée
     */
    async function get(key) {
        if (!isInitialized) {
            await init();
        }

        // Retourner depuis le cache
        if (cache.hasOwnProperty(key)) {
            return cache[key];
        }

        // Charger depuis localStorage si pas en cache
        try {
            const data = localStorage.getItem(key);
            const parsed = data ? JSON.parse(data) : null;
            cache[key] = parsed;
            return parsed;
        } catch (error) {
            console.error(`❌ Erreur lecture ${key} :`, error);
            return null;
        }
    }

    /**
     * Sauvegarder une donnée
     */
    async function set(key, value) {
        if (!isInitialized) {
            await init();
        }

        try {
            // Valider la donnée
            if (!validateData(key, value)) {
                throw new Error(`Données invalides pour ${key}`);
            }

            // Mettre à jour le cache
            cache[key] = value;
            hasUnsavedChanges = true;

            // Sauvegarder dans localStorage
            if (value === null || value === undefined) {
                localStorage.removeItem(key);
            } else {
                const serialized = JSON.stringify(value);
                localStorage.setItem(key, serialized);
            }

            // Émettre un événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('storage:saved', { key, value });
            }

            return true;

        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${key} :`, error);
            
            // Notifier l'erreur
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show(
                    ERROR_MESSAGES.STORAGE_FAILED,
                    NOTIFICATION_TYPES.ERROR
                );
            }
            
            return false;
        }
    }

    /**
     * Supprimer une donnée
     */
    async function remove(key) {
        try {
            delete cache[key];
            localStorage.removeItem(key);
            hasUnsavedChanges = true;
            
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('storage:removed', { key });
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Erreur suppression ${key} :`, error);
            return false;
        }
    }

    /**
     * Valider les données avant sauvegarde
     */
    function validateData(key, value) {
        if (value === null || value === undefined) {
            return true; // Suppression valide
        }

        try {
            // Vérifier que les données sont sérialisables
            JSON.stringify(value);

            // Validations spécifiques par type de données
            switch (key) {
                case STORAGE_KEYS.EXERCISES:
                    return validateExercises(value);
                
                case STORAGE_KEYS.SESSIONS:
                    return validateSessions(value);
                
                case STORAGE_KEYS.TEMPLATES:
                    return validateTemplates(value);
                
                case STORAGE_KEYS.GAMIFICATION:
                    return validateGamification(value);
                
                default:
                    return true;
            }
        } catch {
            return false;
        }
    }

    /**
     * Valider les exercices
     */
    function validateExercises(exercises) {
        if (!Array.isArray(exercises)) return false;
        
        return exercises.every(exercise => 
            exercise.id &&
            exercise.name &&
            exercise.muscle_group &&
            typeof exercise.is_unilateral === 'boolean'
        );
    }

    /**
     * Valider les séances
     */
    function validateSessions(sessions) {
        if (!Array.isArray(sessions)) return false;
        
        return sessions.every(session => 
            session.id &&
            session.date &&
            Array.isArray(session.exercises)
        );
    }

    /**
     * Valider les templates
     */
    function validateTemplates(templates) {
        if (!Array.isArray(templates)) return false;
        
        return templates.every(template => 
            template.id &&
            template.name &&
            Array.isArray(template.exercises)
        );
    }

    /**
     * Valider la gamification
     */
    function validateGamification(gamification) {
        return (
            typeof gamification === 'object' &&
            typeof gamification.level === 'number' &&
            typeof gamification.xp === 'number' &&
            Array.isArray(gamification.badges)
        );
    }

    /**
     * Sauvegarder toutes les données en attente
     */
    async function saveAll() {
        if (!hasUnsavedChanges) {
            return true;
        }

        try {
            let savedCount = 0;
            
            for (const [key, value] of Object.entries(cache)) {
                if (Object.values(STORAGE_KEYS).includes(key)) {
                    if (await set(key, value)) {
                        savedCount++;
                    }
                }
            }
            
            hasUnsavedChanges = false;
            console.log(`✓ ${savedCount} données sauvegardées`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde globale :', error);
            return false;
        }
    }

    /**
     * Auto-sauvegarde périodique
     */
    function autoSave() {
        if (hasUnsavedChanges) {
            saveAll();
        }
    }

    /**
     * Exporter toutes les données
     */
    async function exportData() {
        try {
            const exportData = {};
            
            for (const key of Object.values(STORAGE_KEYS)) {
                exportData[key] = await get(key);
            }
            
            exportData.exportDate = new Date().toISOString();
            exportData.version = APP_VERSION;
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Erreur export :', error);
            return null;
        }
    }

    /**
     * Importer des données
     */
    async function importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Données d\'import invalides');
            }
            
            // Sauvegarder les données actuelles
            const backup = await exportData();
            
            let importedCount = 0;
            
            // Importer chaque clé
            for (const [key, value] of Object.entries(data)) {
                if (Object.values(STORAGE_KEYS).includes(key) && value !== undefined) {
                    if (await set(key, value)) {
                        importedCount++;
                    }
                }
            }
            
            console.log(`✓ ${importedCount} données importées`);
            
            // Émettre un événement d'import
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('storage:imported', { 
                    count: importedCount,
                    backup: backup 
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur import :', error);
            return false;
        }
    }

    /**
     * Nettoyer les anciennes données
     */
    async function cleanup() {
        try {
            // Supprimer les clés obsolètes
            const obsoleteKeys = [
                'smarttrack_old_data',
                'workout_tracker_legacy'
            ];
            
            for (const key of obsoleteKeys) {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ Suppression clé obsolète : ${key}`);
                }
            }
            
            // Nettoyer les sessions trop anciennes (> 1 an)
            const sessions = await get(STORAGE_KEYS.SESSIONS);
            if (Array.isArray(sessions)) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                
                const cleanedSessions = sessions.filter(session => 
                    new Date(session.date) > oneYearAgo
                );
                
                if (cleanedSessions.length !== sessions.length) {
                    await set(STORAGE_KEYS.SESSIONS, cleanedSessions);
                    console.log(`🗑️ ${sessions.length - cleanedSessions.length} anciennes séances supprimées`);
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur nettoyage :', error);
        }
    }

    /**
     * Calculer la taille utilisée
     */
    function getStorageSize() {
        try {
            let totalSize = 0;
            
            for (const key of Object.values(STORAGE_KEYS)) {
                const data = localStorage.getItem(key);
                if (data) {
                    totalSize += new Blob([data]).size;
                }
            }
            
            return {
                bytes: totalSize,
                kb: Math.round(totalSize / 1024),
                mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
            };
            
        } catch (error) {
            console.error('❌ Erreur calcul taille :', error);
            return { bytes: 0, kb: 0, mb: 0 };
        }
    }

    /**
     * Vider tout le stockage
     */
    async function clear() {
        try {
            for (const key of Object.values(STORAGE_KEYS)) {
                localStorage.removeItem(key);
                delete cache[key];
            }
            
            hasUnsavedChanges = false;
            
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('storage:cleared');
            }
            
            console.log('🗑️ Stockage vidé');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur vidage :', error);
            return false;
        }
    }

    /**
     * Vérifier si il y a des changements non sauvegardés
     */
    function hasChanges() {
        return hasUnsavedChanges;
    }

    /**
     * Obtenir les statistiques du stockage
     */
    function getStats() {
        const size = getStorageSize();
        
        return {
            isInitialized,
            hasUnsavedChanges,
            cacheSize: Object.keys(cache).length,
            storageSize: size,
            lastAccess: new Date().toISOString()
        };
    }

    // Interface publique
    return {
        init,
        get,
        set,
        remove,
        saveAll,
        autoSave,
        exportData,
        importData,
        cleanup,
        clear,
        hasUnsavedChanges: hasChanges,
        getStats,
        getStorageSize,
        // Alias pour compatibilité avec d'anciens appels
        getItem: get,
        setItem: set
    };
})();

// Export global
window.Storage = Storage;