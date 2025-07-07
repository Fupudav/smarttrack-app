/**
 * SmartTrack - Modèle Exercices
 * Gestion des données des exercices
 */

const ExercisesModel = (function() {
    let exercises = [];
    let isLoaded = false;

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('🏋️ Initialisation du modèle Exercices...');
            
            await loadExercises();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('storage:saved', handleStorageUpdate);
                EventBus.on('exercises:reload', loadExercises);
            }
            
            console.log(`✓ Modèle Exercices initialisé (${exercises.length} exercices)`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Exercices :', error);
            throw error;
        }
    }

    /**
     * Charger tous les exercices
     */
    async function loadExercises() {
        try {
            const data = await Storage.get(STORAGE_KEYS.EXERCISES);
            exercises = data || [];
            isLoaded = true;
            
            // Émettre événement de chargement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('exercises:loaded', { count: exercises.length });
            }
            
            return exercises;
            
        } catch (error) {
            console.error('❌ Erreur chargement exercices :', error);
            exercises = [];
            return [];
        }
    }

    /**
     * Sauvegarder les exercices
     */
    async function saveExercises() {
        try {
            await Storage.set(STORAGE_KEYS.EXERCISES, exercises);
            
            // Émettre événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('exercises:saved', { count: exercises.length });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde exercices :', error);
            return false;
        }
    }

    /**
     * Obtenir tous les exercices
     */
    function getAll() {
        if (!isLoaded) {
            console.warn('⚠️ Exercices non chargés, retour d\'un tableau vide');
            return [];
        }
        return [...exercises];
    }

    /**
     * Obtenir un exercice par ID
     */
    function getById(id) {
        return exercises.find(exercise => exercise.id === id) || null;
    }

    /**
     * Obtenir les exercices par groupe musculaire
     */
    function getByMuscleGroup(muscleGroup) {
        return exercises.filter(exercise => exercise.muscle_group === muscleGroup);
    }

    /**
     * Obtenir les exercices par catégorie
     */
    function getByCategory(category) {
        return exercises.filter(exercise => exercise.category === category);
    }

    /**
     * Obtenir les exercices par point d'ancrage
     */
    function getByAnchor(anchorPoint) {
        return exercises.filter(exercise => exercise.anchor_point === anchorPoint);
    }

    /**
     * Obtenir les exercices unilatéraux
     */
    function getUnilateral() {
        return exercises.filter(exercise => exercise.is_unilateral === true);
    }

    /**
     * Rechercher des exercices
     */
    function search(query) {
        if (!query || query.trim() === '') {
            return getAll();
        }

        const lowerQuery = query.toLowerCase().trim();
        
        return exercises.filter(exercise => {
            return (
                exercise.name.toLowerCase().includes(lowerQuery) ||
                exercise.muscle_group.toLowerCase().includes(lowerQuery) ||
                exercise.category.toLowerCase().includes(lowerQuery) ||
                (exercise.description && exercise.description.toLowerCase().includes(lowerQuery))
            );
        });
    }

    /**
     * Filtrer les exercices avec critères multiples
     */
    function filter(criteria = {}) {
        let filtered = [...exercises];

        // Filtre par groupe musculaire
        if (criteria.muscleGroup && criteria.muscleGroup !== 'all') {
            filtered = filtered.filter(ex => ex.muscle_group === criteria.muscleGroup);
        }

        // Filtre par catégorie
        if (criteria.category && criteria.category !== 'all') {
            filtered = filtered.filter(ex => ex.category === criteria.category);
        }

        // Filtre par point d'ancrage
        if (criteria.anchor && criteria.anchor !== 'all') {
            filtered = filtered.filter(ex => ex.anchor_point === criteria.anchor);
        }

        // Filtre unilatéral/bilatéral
        if (criteria.unilateral !== undefined) {
            filtered = filtered.filter(ex => ex.is_unilateral === criteria.unilateral);
        }

        // Filtre par type d'exercice
        if (criteria.exerciseType && criteria.exerciseType !== 'all') {
            filtered = filtered.filter(ex => ex.exercise_type === criteria.exerciseType);
        }

        // Filtre par mode (reps/time)
        if (criteria.mode && criteria.mode !== 'all') {
            filtered = filtered.filter(ex => ex.exercise_mode === criteria.mode);
        }

        // Recherche textuelle
        if (criteria.search) {
            const query = criteria.search.toLowerCase();
            filtered = filtered.filter(ex => 
                ex.name.toLowerCase().includes(query) ||
                ex.muscle_group.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    /**
     * Ajouter un nouvel exercice
     */
    async function add(exerciseData) {
        try {
            // Valider les données
            const validatedData = validateExerciseData(exerciseData);
            if (!validatedData) {
                throw new Error('Données d\'exercice invalides');
            }

            // Créer l'exercice avec un ID unique
            const newExercise = {
                id: Utils.generateId(),
                ...validatedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_predefined: false,
                source: 'user'
            };

            // Ajouter à la liste
            exercises.push(newExercise);
            
            // Sauvegarder
            await saveExercises();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('exercises:added', { exercise: newExercise });
            }
            
            return newExercise;
            
        } catch (error) {
            console.error('❌ Erreur ajout exercice :', error);
            throw error;
        }
    }

    /**
     * Modifier un exercice existant
     */
    async function update(id, updatedData) {
        try {
            const index = exercises.findIndex(ex => ex.id === id);
            if (index === -1) {
                throw new Error('Exercice non trouvé');
            }

            // Valider les nouvelles données
            const validatedData = validateExerciseData(updatedData, true);
            if (!validatedData) {
                throw new Error('Données d\'exercice invalides');
            }

            // Mettre à jour l'exercice
            const originalExercise = exercises[index];
            exercises[index] = {
                ...originalExercise,
                ...validatedData,
                updated_at: new Date().toISOString()
            };

            // Sauvegarder
            await saveExercises();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('exercises:updated', { 
                    exercise: exercises[index],
                    original: originalExercise 
                });
            }
            
            return exercises[index];
            
        } catch (error) {
            console.error('❌ Erreur modification exercice :', error);
            throw error;
        }
    }

    /**
     * Supprimer un exercice
     */
    async function remove(id) {
        try {
            const index = exercises.findIndex(ex => ex.id === id);
            if (index === -1) {
                throw new Error('Exercice non trouvé');
            }

            // Vérifier si l'exercice est utilisé dans des sessions
            const isUsed = await checkExerciseUsage(id);
            if (isUsed) {
                throw new Error('Impossible de supprimer un exercice utilisé dans des sessions');
            }

            // Supprimer l'exercice
            const removedExercise = exercises.splice(index, 1)[0];
            
            // Sauvegarder
            await saveExercises();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('exercises:removed', { exercise: removedExercise });
            }
            
            return removedExercise;
            
        } catch (error) {
            console.error('❌ Erreur suppression exercice :', error);
            throw error;
        }
    }

    /**
     * Dupliquer un exercice
     */
    async function duplicate(id) {
        try {
            const original = getById(id);
            if (!original) {
                throw new Error('Exercice non trouvé');
            }

            // Créer une copie avec un nouveau nom
            const copy = {
                ...original,
                name: `${original.name} (Copie)`,
                is_predefined: false,
                source: 'user'
            };

            // Supprimer les champs qui seront régénérés
            delete copy.id;
            delete copy.created_at;
            delete copy.updated_at;

            return await add(copy);
            
        } catch (error) {
            console.error('❌ Erreur duplication exercice :', error);
            throw error;
        }
    }

    /**
     * Valider les données d'un exercice
     */
    function validateExerciseData(data, isUpdate = false) {
        try {
            const validated = {};

            // Nom (obligatoire)
            if (!isUpdate || data.name !== undefined) {
                validated.name = Utils.validateString(data.name, 1, 100);
                if (!validated.name) {
                    throw new Error('Nom invalide (1-100 caractères requis)');
                }
            }

            // Groupe musculaire (obligatoire)
            if (!isUpdate || data.muscle_group !== undefined) {
                const validMuscleGroups = Object.keys(MUSCLE_GROUPS);
                if (!validMuscleGroups.includes(data.muscle_group)) {
                    throw new Error('Groupe musculaire invalide');
                }
                validated.muscle_group = data.muscle_group;
            }

            // Point d'ancrage
            if (data.anchor_point !== undefined) {
                const validAnchors = ['none', 'door-low', 'door-middle', 'door-high', 'floor', 'body'];
                validated.anchor_point = validAnchors.includes(data.anchor_point) ? 
                    data.anchor_point : 'none';
            }

            // Exercice unilatéral
            if (data.is_unilateral !== undefined) {
                validated.is_unilateral = Boolean(data.is_unilateral);
            }

            // Temps de repos par défaut
            if (data.default_rest_time !== undefined) {
                validated.default_rest_time = Utils.validateNumber(data.default_rest_time, 30, 600) || 90;
            }

            // Catégorie
            if (data.category !== undefined) {
                const validCategories = ['warmup', 'strength', 'cardio', 'stretching'];
                validated.category = validCategories.includes(data.category) ? 
                    data.category : 'strength';
            }

            // Mode d'exercice
            if (data.exercise_mode !== undefined) {
                const validModes = ['reps', 'time'];
                validated.exercise_mode = validModes.includes(data.exercise_mode) ? 
                    data.exercise_mode : 'reps';
            }

            // Durée par défaut (pour les exercices en temps)
            if (data.default_duration !== undefined) {
                validated.default_duration = Utils.validateNumber(data.default_duration, 10, 300);
            }

            // Type d'exercice
            if (data.exercise_type !== undefined) {
                const validTypes = ['bodyweight', 'elastics', 'weights'];
                validated.exercise_type = validTypes.includes(data.exercise_type) ? 
                    data.exercise_type : 'elastics';
            }

            // Description
            if (data.description !== undefined) {
                validated.description = Utils.validateString(data.description, 0, 500) || '';
            }

            return validated;
            
        } catch (error) {
            console.error('❌ Erreur validation exercice :', error);
            return null;
        }
    }

    /**
     * Vérifier si un exercice est utilisé dans des sessions
     */
    async function checkExerciseUsage(exerciseId) {
        try {
            const sessions = await Storage.get(STORAGE_KEYS.SESSIONS);
            if (!sessions) return false;

            return sessions.some(session => 
                session.exercises && session.exercises.some(ex => ex.exercise_id === exerciseId)
            );
            
        } catch (error) {
            console.error('❌ Erreur vérification usage exercice :', error);
            return false;
        }
    }

    /**
     * Obtenir les statistiques des exercices
     */
    function getStats() {
        const stats = {
            total: exercises.length,
            byMuscleGroup: {},
            byCategory: {},
            byAnchor: {},
            byType: {},
            unilateral: 0,
            predefined: 0,
            userCreated: 0
        };

        exercises.forEach(exercise => {
            // Par groupe musculaire
            const muscleGroup = exercise.muscle_group;
            stats.byMuscleGroup[muscleGroup] = (stats.byMuscleGroup[muscleGroup] || 0) + 1;

            // Par catégorie
            const category = exercise.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Par point d'ancrage
            const anchor = exercise.anchor_point;
            stats.byAnchor[anchor] = (stats.byAnchor[anchor] || 0) + 1;

            // Par type
            const type = exercise.exercise_type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Compteurs
            if (exercise.is_unilateral) stats.unilateral++;
            if (exercise.is_predefined) stats.predefined++;
            else stats.userCreated++;
        });

        return stats;
    }

    /**
     * Obtenir les exercices favoris (les plus utilisés)
     */
    async function getFavorites(limit = 10) {
        try {
            // TODO: Calculer depuis les sessions réelles
            // Pour l'instant, retourner les premiers exercices
            return exercises.slice(0, limit);
            
        } catch (error) {
            console.error('❌ Erreur récupération favoris :', error);
            return [];
        }
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.EXERCISES) {
            console.log('🔄 Mise à jour des exercices détectée');
            loadExercises();
        }
    }

    /**
     * Vérifier si les exercices sont chargés
     */
    function isLoaded() {
        return isLoaded;
    }

    /**
     * Obtenir le nombre d'exercices
     */
    function getCount() {
        return exercises.length;
    }

    // Interface publique
    return {
        init,
        loadExercises,
        getAll,
        getById,
        getByMuscleGroup,
        getByCategory,
        getByAnchor,
        getUnilateral,
        search,
        filter,
        add,
        update,
        remove,
        duplicate,
        getStats,
        getFavorites,
        isLoaded,
        getCount
    };
})();

// Export global
window.ExercisesModel = ExercisesModel;