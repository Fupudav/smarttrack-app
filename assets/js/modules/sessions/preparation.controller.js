/**
 * SmartTrack - Contrôleur Préparation de Session
 * Orchestration de la préparation et configuration des sessions
 */

const PreparationController = (function() {
    let isInitialized = false;
    let currentSession = null;

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('🎮 Initialisation PreparationController...');
            
            // Initialiser la vue
            if (typeof PreparationView !== 'undefined') {
                PreparationView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:preparation', handlePreparationRoute);
                EventBus.on('sessions:current-updated', handleSessionUpdated);
                EventBus.on('app:initialized', handleAppInitialized);
            }
            
            isInitialized = true;
            console.log('✓ PreparationController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation PreparationController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers la préparation
     */
    async function handlePreparationRoute() {
        console.log('📍 Navigation vers Préparation');
        await renderPreparation();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - PreparationController prêt');
    }

    /**
     * Gérer la mise à jour de session
     */
    function handleSessionUpdated(data) {
        currentSession = data.session;
        console.log('📝 Session mise à jour dans PreparationController');
    }

    /**
     * Rendre l'écran de préparation
     */
    async function renderPreparation() {
        try {
            // S'assurer qu'une session existe
            await ensureSession();
            
            if (typeof PreparationView !== 'undefined') {
                await PreparationView.render();
                updateActiveNavigation('preparation');
            } else {
                console.error('❌ PreparationView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu préparation :', error);
            showErrorScreen('Erreur lors du chargement de la préparation');
        }
    }

    /**
     * S'assurer qu'une session courante existe
     */
    async function ensureSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                currentSession = await SessionsModel.getCurrentSession();
                
                // Si pas de session courante, en créer une
                if (!currentSession) {
                    console.log('🆕 Création d\'une nouvelle session...');
                    currentSession = await SessionsModel.createSession({
                        name: `Session ${new Date().toLocaleDateString()}`,
                        type: 'custom'
                    });
                    console.log('✓ Session créée :', currentSession.id);
                }
            }
        } catch (error) {
            console.error('❌ Erreur création session :', error);
            throw error;
        }
    }

    /**
     * Créer une nouvelle session
     */
    async function createNewSession(sessionData = {}) {
        try {
            console.log('🆕 Création nouvelle session...');
            
            if (typeof SessionsModel !== 'undefined') {
                const defaultData = {
                    name: `Session ${new Date().toLocaleDateString()}`,
                    type: 'custom',
                    intensity: 'moderate',
                    estimated_duration: 45,
                    ...sessionData
                };
                
                currentSession = await SessionsModel.createSession(defaultData);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Nouvelle session créée !');
                }
                
                return currentSession;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur création session :', error);
            showError('Erreur lors de la création de la session');
            throw error;
        }
    }

    /**
     * Mettre à jour les paramètres de session
     */
    async function updateSessionSettings(updates) {
        try {
            if (typeof SessionsModel !== 'undefined' && currentSession) {
                await SessionsModel.updateCurrentSession(updates);
                
                // Mettre à jour notre référence locale
                currentSession = { ...currentSession, ...updates };
                
                console.log('✓ Paramètres session mis à jour');
                return currentSession;
            }
            throw new Error('Session ou modèle non disponible');
            
        } catch (error) {
            console.error('❌ Erreur mise à jour session :', error);
            showError('Erreur lors de la mise à jour');
            throw error;
        }
    }

    /**
     * Ajouter un exercice à la session
     */
    async function addExerciseToSession(exerciseId, customSets = null) {
        try {
            console.log('➕ Ajout exercice à la session :', exerciseId);
            
            if (typeof SessionsModel !== 'undefined' && typeof ExercisesModel !== 'undefined') {
                // Récupérer l'exercice complet
                const exercise = await ExercisesModel.getById(exerciseId);
                if (!exercise) {
                    throw new Error('Exercice non trouvé');
                }
                
                // Utiliser le contrôleur d'exercices si disponible
                if (typeof ExercisesController !== 'undefined') {
                    await ExercisesController.addExerciseToSession(exerciseId, customSets);
                } else {
                    // Fallback : ajouter directement
                    await SessionsModel.addExerciseToCurrentSession(exerciseId, customSets);
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(`${exercise.name} ajouté à la session !`);
                }
                
                return true;
            }
            throw new Error('Modèles requis non disponibles');
            
        } catch (error) {
            console.error('❌ Erreur ajout exercice :', error);
            showError('Erreur lors de l\'ajout de l\'exercice');
            return false;
        }
    }

    /**
     * Supprimer un exercice de la session
     */
    async function removeExerciseFromSession(exerciseIndex) {
        try {
            console.log('🗑️ Suppression exercice de la session :', exerciseIndex);
            
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.removeExerciseFromCurrentSession(exerciseIndex);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Exercice supprimé de la session');
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur suppression exercice :', error);
            showError('Erreur lors de la suppression');
            return false;
        }
    }

    /**
     * Charger un template dans la session courante
     */
    async function loadTemplate(templateId) {
        try {
            console.log('📄 Chargement template :', templateId);
            
            if (typeof TemplatesModel !== 'undefined' && typeof SessionsModel !== 'undefined') {
                const template = await TemplatesModel.getById(templateId);
                if (!template) {
                    throw new Error('Template non trouvé');
                }
                
                // Utiliser le template pour créer la session
                await TemplatesModel.useTemplate(templateId);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(`Template "${template.name}" chargé !`);
                }
                
                return true;
            }
            throw new Error('Modèles requis non disponibles');
            
        } catch (error) {
            console.error('❌ Erreur chargement template :', error);
            showError('Erreur lors du chargement du template');
            return false;
        }
    }

    /**
     * Sauvegarder la session courante comme template
     */
    async function saveCurrentSessionAsTemplate(templateName) {
        try {
            console.log('💾 Sauvegarde session comme template :', templateName);
            
            if (typeof TemplatesModel !== 'undefined' && currentSession) {
                if (!currentSession.exercises || currentSession.exercises.length === 0) {
                    throw new Error('La session doit contenir des exercices');
                }
                
                const template = await TemplatesModel.createTemplateFromSession(
                    currentSession.id,
                    templateName || `Template ${new Date().toLocaleDateString()}`
                );
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Template sauvegardé !');
                }
                
                return template;
            }
            throw new Error('TemplatesModel ou session non disponible');
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde template :', error);
            showError('Erreur lors de la sauvegarde');
            throw error;
        }
    }

    /**
     * Démarrer la session live
     */
    async function startLiveSession() {
        try {
            console.log('▶️ Démarrage session live...');
            
            if (typeof SessionsModel !== 'undefined') {
                if (!currentSession || !currentSession.exercises || currentSession.exercises.length === 0) {
                    throw new Error('La session doit contenir des exercices');
                }
                
                // Démarrer la session live
                await SessionsModel.startLiveSession();
                
                // Naviguer vers l'écran de session live
                if (typeof Router !== 'undefined') {
                    Router.navigate('live-session');
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session démarrée ! Bon entraînement !');
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur démarrage session :', error);
            showError('Erreur lors du démarrage de la session');
            return false;
        }
    }

    /**
     * Vider la session courante
     */
    async function clearCurrentSession() {
        try {
            console.log('🗑️ Vidage session courante...');
            
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.clearCurrentSession();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Session vidée');
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur vidage session :', error);
            showError('Erreur lors du vidage');
            return false;
        }
    }

    /**
     * Obtenir les exercices recommandés
     */
    async function getRecommendedExercises(criteria = {}) {
        try {
            if (typeof ExercisesController !== 'undefined') {
                return await ExercisesController.getRecommendedExercises(criteria);
            } else if (typeof ExercisesModel !== 'undefined') {
                return await ExercisesModel.getAll();
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération exercices recommandés :', error);
            return [];
        }
    }

    /**
     * Obtenir les templates disponibles
     */
    async function getAvailableTemplates() {
        try {
            if (typeof TemplatesModel !== 'undefined') {
                return await TemplatesModel.getAll();
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération templates :', error);
            return [];
        }
    }

    /**
     * Valider la session avant le démarrage
     */
    function validateSession() {
        const errors = [];
        
        if (!currentSession) {
            errors.push('Aucune session active');
            return { isValid: false, errors };
        }
        
        if (!currentSession.exercises || currentSession.exercises.length === 0) {
            errors.push('La session doit contenir au moins un exercice');
        }
        
        // Vérifier que chaque exercice a au moins un set
        currentSession.exercises.forEach((exercise, index) => {
            if (!exercise.sets || exercise.sets.length === 0) {
                errors.push(`L'exercice "${exercise.name}" n'a aucun set configuré`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculer les statistiques de la session
     */
    function calculateSessionStats() {
        if (!currentSession || !currentSession.exercises) {
            return {
                exerciseCount: 0,
                totalSets: 0,
                estimatedDuration: 0,
                muscleGroups: []
            };
        }
        
        const stats = {
            exerciseCount: currentSession.exercises.length,
            totalSets: 0,
            estimatedDuration: 0,
            muscleGroups: []
        };
        
        const muscleGroupsSet = new Set();
        
        currentSession.exercises.forEach(exercise => {
            if (exercise.sets) {
                stats.totalSets += exercise.sets.length;
                
                // Calculer la durée estimée
                exercise.sets.forEach(set => {
                    if (exercise.exercise_mode === 'time') {
                        stats.estimatedDuration += (set.duration || 30) + (set.rest_time || 90);
                    } else {
                        // Estimation: 3 secondes par rep + temps de repos
                        stats.estimatedDuration += ((set.reps || 12) * 3) + (set.rest_time || 90);
                    }
                });
            }
            
            muscleGroupsSet.add(exercise.muscle_group);
        });
        
        stats.muscleGroups = Array.from(muscleGroupsSet);
        stats.estimatedDuration = Math.round(stats.estimatedDuration / 60); // En minutes
        
        return stats;
    }

    /**
     * Navigation - Retour au dashboard
     */
    function navigateTodashboard() {
        if (typeof Router !== 'undefined') {
            Router.navigate('dashboard');
        }
    }

    /**
     * Navigation - Aller aux exercices
     */
    function navigateToExercises() {
        if (typeof Router !== 'undefined') {
            Router.navigate('exercises');
        }
    }

    /**
     * Navigation - Aller aux templates
     */
    function navigateToTemplates() {
        if (typeof Router !== 'undefined') {
            Router.navigate('templates');
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
                        <h2>⚠️ Préparation non disponible</h2>
                        <p>Le module de préparation n'est pas encore chargé.</p>
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
                        <h2>❌ Erreur Préparation</h2>
                        <p>${message}</p>
                        <div class="error-actions">
                            <button class="btn btn-secondary" onclick="PreparationController.navigateToD ashboard()">
                                Retour au dashboard
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
            hasView: typeof PreparationView !== 'undefined',
            hasCurrentSession: currentSession !== null
        };
    }

    /**
     * Obtenir la session courante
     */
    function getCurrentSession() {
        return currentSession;
    }

    // Interface publique
    return {
        init,
        renderPreparation,
        createNewSession,
        updateSessionSettings,
        addExerciseToSession,
        removeExerciseFromSession,
        loadTemplate,
        saveCurrentSessionAsTemplate,
        startLiveSession,
        clearCurrentSession,
        getRecommendedExercises,
        getAvailableTemplates,
        validateSession,
        calculateSessionStats,
        navigateToDashboard,
        navigateToExercises,
        navigateToTemplates,
        getInitializationStatus,
        getCurrentSession
    };
})();

// Export global
window.PreparationController = PreparationController;