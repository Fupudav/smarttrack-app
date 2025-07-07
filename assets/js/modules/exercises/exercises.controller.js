/**
 * SmartTrack - Contrôleur Exercices
 * Orchestration entre le modèle et la vue des exercices
 */

const ExercisesController = (function() {
    let isInitialized = false;

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('🎮 Initialisation ExercisesController...');
            
            // Initialiser la vue
            if (typeof ExercisesView !== 'undefined') {
                ExercisesView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:exercises', handleExercisesRoute);
                EventBus.on('app:initialized', handleAppInitialized);
            }
            
            isInitialized = true;
            console.log('✓ ExercisesController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation ExercisesController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers les exercices
     */
    function handleExercisesRoute() {
        console.log('📍 Navigation vers Exercices');
        renderExercisesScreen();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - ExercisesController prêt');
    }

    /**
     * Rendre l'écran des exercices
     */
    function renderExercisesScreen() {
        try {
            if (typeof ExercisesView !== 'undefined') {
                ExercisesView.render();
                updateActiveNavigation('exercises');
            } else {
                console.error('❌ ExercisesView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu écran exercices :', error);
            showErrorScreen('Erreur lors du chargement des exercices');
        }
    }

    /**
     * Obtenir les exercices avec filtres
     */
    async function getExercises(filters = {}) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                if (Object.keys(filters).length > 0) {
                    return await ExercisesModel.filter(filters);
                } else {
                    return await ExercisesModel.getAll();
                }
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération exercices :', error);
            return [];
        }
    }

    /**
     * Rechercher des exercices
     */
    async function searchExercises(query) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                return await ExercisesModel.search(query);
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur recherche exercices :', error);
            return [];
        }
    }

    /**
     * Créer un nouvel exercice
     */
    async function createExercise(exerciseData) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                const newExercise = await ExercisesModel.add(exerciseData);
                
                // Log pour analytics
                logExerciseAction('create', newExercise.id);
                
                return newExercise;
            }
            throw new Error('ExercisesModel non disponible');
        } catch (error) {
            console.error('❌ Erreur création exercice :', error);
            throw error;
        }
    }

    /**
     * Modifier un exercice
     */
    async function updateExercise(exerciseId, updates) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                const updatedExercise = await ExercisesModel.update(exerciseId, updates);
                
                // Log pour analytics
                logExerciseAction('update', exerciseId);
                
                return updatedExercise;
            }
            throw new Error('ExercisesModel non disponible');
        } catch (error) {
            console.error('❌ Erreur modification exercice :', error);
            throw error;
        }
    }

    /**
     * Supprimer un exercice
     */
    async function deleteExercise(exerciseId) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                const deletedExercise = await ExercisesModel.remove(exerciseId);
                
                // Log pour analytics
                logExerciseAction('delete', exerciseId);
                
                return deletedExercise;
            }
            throw new Error('ExercisesModel non disponible');
        } catch (error) {
            console.error('❌ Erreur suppression exercice :', error);
            throw error;
        }
    }

    /**
     * Dupliquer un exercice
     */
    async function duplicateExercise(exerciseId) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                const duplicatedExercise = await ExercisesModel.duplicate(exerciseId);
                
                // Log pour analytics
                logExerciseAction('duplicate', exerciseId);
                
                return duplicatedExercise;
            }
            throw new Error('ExercisesModel non disponible');
        } catch (error) {
            console.error('❌ Erreur duplication exercice :', error);
            throw error;
        }
    }

    /**
     * Ajouter un exercice à la session courante
     */
    async function addExerciseToSession(exerciseId, sets = null) {
        try {
            if (typeof SessionsModel !== 'undefined') {
                // Créer sets par défaut si non fournis
                let defaultSets = sets;
                if (!defaultSets) {
                    const exercise = await ExercisesModel.getById(exerciseId);
                    if (exercise) {
                        defaultSets = generateDefaultSets(exercise);
                    }
                }
                
                const sessionExercise = await SessionsModel.addExerciseToCurrentSession(exerciseId, defaultSets);
                
                // Log pour analytics
                logExerciseAction('add_to_session', exerciseId);
                
                return sessionExercise;
            }
            throw new Error('SessionsModel non disponible');
        } catch (error) {
            console.error('❌ Erreur ajout exercice à la session :', error);
            throw error;
        }
    }

    /**
     * Générer des sets par défaut pour un exercice
     */
    function generateDefaultSets(exercise) {
        const defaultSets = [];
        const setCount = exercise.muscle_group === 'echauffement' ? 1 : 3;
        
        for (let i = 0; i < setCount; i++) {
            if (exercise.exercise_mode === 'time') {
                defaultSets.push({
                    duration: exercise.default_duration || 30,
                    rest_time: exercise.default_rest_time || 90,
                    completed: false
                });
            } else {
                defaultSets.push({
                    reps: exercise.muscle_group === 'echauffement' ? 10 : 12,
                    weight: 0,
                    rest_time: exercise.default_rest_time || 90,
                    completed: false
                });
            }
        }
        
        return defaultSets;
    }

    /**
     * Obtenir les statistiques des exercices
     */
    async function getExercisesStats() {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                return await ExercisesModel.getStats();
            }
            return null;
        } catch (error) {
            console.error('❌ Erreur récupération stats exercices :', error);
            return null;
        }
    }

    /**
     * Obtenir les exercices favoris
     */
    async function getFavoriteExercises(limit = 10) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                return await ExercisesModel.getFavorites(limit);
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération exercices favoris :', error);
            return [];
        }
    }

    /**
     * Obtenir les exercices par groupe musculaire
     */
    async function getExercisesByMuscleGroup(muscleGroup) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                return await ExercisesModel.getByMuscleGroup(muscleGroup);
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération exercices par groupe :', error);
            return [];
        }
    }

    /**
     * Obtenir les exercices recommandés
     */
    async function getRecommendedExercises(criteria = {}) {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                // Logique de recommandation simple
                let recommended = [];
                
                // Si on a des critères spécifiques
                if (criteria.muscleGroup) {
                    recommended = await ExercisesModel.getByMuscleGroup(criteria.muscleGroup);
                } else {
                    // Recommandations générales : exercices populaires
                    recommended = await ExercisesModel.getFavorites(6);
                }
                
                // Mélanger aléatoirement pour plus de variété
                return shuffleArray(recommended);
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération exercices recommandés :', error);
            return [];
        }
    }

    /**
     * Importer des exercices depuis un fichier
     */
    async function importExercises(exercisesData) {
        try {
            if (!Array.isArray(exercisesData)) {
                throw new Error('Format de données invalide');
            }
            
            const importResults = {
                success: 0,
                errors: 0,
                details: []
            };
            
            for (const exerciseData of exercisesData) {
                try {
                    await createExercise(exerciseData);
                    importResults.success++;
                } catch (error) {
                    importResults.errors++;
                    importResults.details.push({
                        exercise: exerciseData.name || 'Nom inconnu',
                        error: error.message
                    });
                }
            }
            
            return importResults;
        } catch (error) {
            console.error('❌ Erreur import exercices :', error);
            throw error;
        }
    }

    /**
     * Exporter les exercices
     */
    async function exportExercises(format = 'json') {
        try {
            const exercises = await getExercises();
            
            if (format === 'json') {
                return {
                    format: 'json',
                    data: JSON.stringify(exercises, null, 2),
                    filename: `smarttrack-exercises-${new Date().toISOString().split('T')[0]}.json`
                };
            }
            
            throw new Error('Format d\'export non supporté');
        } catch (error) {
            console.error('❌ Erreur export exercices :', error);
            throw error;
        }
    }

    /**
     * Valider les données d'exercice
     */
    function validateExerciseData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Le nom est obligatoire');
        }
        
        if (!data.muscle_group) {
            errors.push('Le groupe musculaire est obligatoire');
        }
        
        if (data.default_rest_time && (data.default_rest_time < 30 || data.default_rest_time > 600)) {
            errors.push('Le temps de repos doit être entre 30 et 600 secondes');
        }
        
        if (data.exercise_mode === 'time' && data.default_duration && (data.default_duration < 10 || data.default_duration > 300)) {
            errors.push('La durée par défaut doit être entre 10 et 300 secondes');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Logger les actions sur les exercices pour analytics
     */
    function logExerciseAction(action, exerciseId, metadata = {}) {
        try {
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('analytics:exercise-action', {
                    action,
                    exerciseId,
                    timestamp: Date.now(),
                    metadata
                });
            }
        } catch (error) {
            console.warn('⚠️ Erreur log action exercice :', error);
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
                        <h2>⚠️ Module non disponible</h2>
                        <p>Le module des exercices n'est pas encore chargé.</p>
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
                        <h2>❌ Erreur</h2>
                        <p>${message}</p>
                        <div class="error-actions">
                            <button class="btn btn-secondary" onclick="history.back()">
                                Retour
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
     * Mélanger un tableau aléatoirement
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasModel: typeof ExercisesModel !== 'undefined',
            hasView: typeof ExercisesView !== 'undefined'
        };
    }

    // Interface publique
    return {
        init,
        renderExercisesScreen,
        getExercises,
        searchExercises,
        createExercise,
        updateExercise,
        deleteExercise,
        duplicateExercise,
        addExerciseToSession,
        getExercisesStats,
        getFavoriteExercises,
        getExercisesByMuscleGroup,
        getRecommendedExercises,
        importExercises,
        exportExercises,
        validateExerciseData,
        getInitializationStatus
    };
})();

// Export global
window.ExercisesController = ExercisesController;