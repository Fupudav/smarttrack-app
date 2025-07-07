/**
 * SmartTrack - Données par défaut
 * Initialise les 86 exercices SmartWorkout et les données initiales
 */

const DefaultData = (function() {
    let isInitialized = false;

    /**
     * Initialiser les données par défaut
     */
    async function initialize() {
        try {
            console.log('📋 Initialisation des données par défaut...');
            
            await initializeExercises();
            await initializeGameData();
            await initializeSettings();
            
            isInitialized = true;
            console.log('✓ Données par défaut initialisées');
            
        } catch (error) {
            console.error('❌ Erreur initialisation données par défaut :', error);
            throw error;
        }
    }

    /**
     * Initialiser les 86 exercices SmartWorkout
     */
    async function initializeExercises() {
        const existingExercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        
        if (existingExercises && existingExercises.length > 0) {
            console.log(`✓ ${existingExercises.length} exercices déjà présents`);
            return;
        }
        
        console.log('🏋️ Création des 86 exercices SmartWorkout...');
        
        // Base de données des exercices SmartWorkout (exactement comme dans l'original)
        const PREDEFINED_EXERCISES = {
            echauffement: [
                { name: 'Jumping Jacks', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Montées de genoux', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Talons-fesses', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Burpees', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Planche', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Planche latérale', anchor: 'none', unilateral: true, timeBase: true },
                { name: 'Mountain climbers', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Squats au poids du corps', anchor: 'none', unilateral: false, timeBase: false },
                { name: 'Pompes', anchor: 'none', unilateral: false, timeBase: false },
                { name: 'Fentes alternées', anchor: 'none', unilateral: true, timeBase: false },
                { name: 'Rotations épaules', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Cercles de bras', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Étirements dynamiques', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'High knees', anchor: 'none', unilateral: false, timeBase: true },
                { name: 'Pas chassés', anchor: 'none', unilateral: false, timeBase: true }
            ],
            
            biceps: [
                { name: 'Curl biceps', anchor: 'none', unilateral: false },
                { name: 'Curl biceps (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Curl biceps face à la porte', anchor: 'door-middle', unilateral: false },
                { name: 'Curl marteau', anchor: 'none', unilateral: false },
                { name: 'Curl marteau (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Curl biceps avec poignée', anchor: 'none', unilateral: false },
                { name: 'Curl biceps en pronation', anchor: 'none', unilateral: false }
            ],
            
            epaules: [
                { name: 'Cuban press', anchor: 'none', unilateral: false },
                { name: 'Développé arnold', anchor: 'none', unilateral: false },
                { name: 'Développé militaire assis', anchor: 'floor', unilateral: false },
                { name: 'Élévations frontales', anchor: 'none', unilateral: false },
                { name: 'Élévations latérales', anchor: 'none', unilateral: false },
                { name: 'Oiseau', anchor: 'door-middle', unilateral: false },
                { name: 'Overhead press', anchor: 'none', unilateral: false },
                { name: 'Reverse fly', anchor: 'door-middle', unilateral: false },
                { name: 'Reverse fly unilatéral', anchor: 'door-middle', unilateral: true },
                { name: 'Shrug', anchor: 'none', unilateral: false },
                { name: 'Tirage menton', anchor: 'door-low', unilateral: false }
            ],
            
            dos: [
                { name: 'Face Pull', anchor: 'door-middle', unilateral: false },
                { name: 'Face pull (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Pull-Over', anchor: 'door-high', unilateral: false },
                { name: 'Rowing buste penché', anchor: 'floor', unilateral: false },
                { name: 'Rowing buste penché (prise large)', anchor: 'floor', unilateral: false },
                { name: 'Rowing buste penché (prise serrée)', anchor: 'floor', unilateral: false },
                { name: 'Soulevé de terre', anchor: 'floor', unilateral: false },
                { name: 'Soulevé de terre (prise large)', anchor: 'floor', unilateral: false },
                { name: 'Tirage Bucheron (poulie basse)', anchor: 'door-low', unilateral: true },
                { name: 'Tirage horizontal unilatéral', anchor: 'door-middle', unilateral: true },
                { name: 'Tirage poulie basse', anchor: 'door-low', unilateral: false },
                { name: 'Tirage poulie basse (supination)', anchor: 'door-low', unilateral: false },
                { name: 'Tirage vertical', anchor: 'door-high', unilateral: false },
                { name: 'Tirage vertical (prise serrée)', anchor: 'door-high', unilateral: false },
                { name: 'Tirage vertical (supination)', anchor: 'door-high', unilateral: false },
                { name: 'Tirage vertical unilatéral', anchor: 'door-high', unilateral: true }
            ],
            
            jambes: [
                { name: 'Abduction de hanches', anchor: 'body', unilateral: false },
                { name: 'Adduction de hanches', anchor: 'body', unilateral: false },
                { name: 'Donkey kick', anchor: 'body', unilateral: true },
                { name: 'Donkey kick (jambes fléchies)', anchor: 'body', unilateral: true },
                { name: 'Extensions mollets', anchor: 'floor', unilateral: false },
                { name: 'Extensions mollets unilatérales', anchor: 'floor', unilateral: true },
                { name: 'Fentes', anchor: 'none', unilateral: true },
                { name: 'Fentes bulgares', anchor: 'none', unilateral: true },
                { name: 'Front squat', anchor: 'floor', unilateral: false },
                { name: 'Hip thrust', anchor: 'body', unilateral: false },
                { name: 'Leg curl', anchor: 'body', unilateral: false },
                { name: 'Leg extension unilatérale', anchor: 'body', unilateral: true },
                { name: 'Soulevé de terre jambes tendues', anchor: 'floor', unilateral: false },
                { name: 'Squat', anchor: 'none', unilateral: false },
                { name: 'Squat sumo', anchor: 'floor', unilateral: false },
                { name: 'Squat swing', anchor: 'none', unilateral: false },
                { name: 'Thruster', anchor: 'floor', unilateral: false }
            ],
            
            pectoraux: [
                { name: 'Développé épaules debout', anchor: 'none', unilateral: false },
                { name: 'Développé debout (poulie moyenne)', anchor: 'door-middle', unilateral: false },
                { name: 'Développé debout (2 ancrages)', anchor: 'door-middle', unilateral: false },
                { name: 'Développé décliné', anchor: 'door-low', unilateral: false },
                { name: 'Développé incliné', anchor: 'door-high', unilateral: false },
                { name: 'Développé incliné (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Développé joint (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Développé joint (poulie haute)', anchor: 'door-high', unilateral: false },
                { name: 'Développé 1 ancrage (poulie haute)', anchor: 'door-high', unilateral: false },
                { name: 'Développé joint (poulie moyenne)', anchor: 'door-middle', unilateral: false },
                { name: 'Écarté unilatéral', anchor: 'door-middle', unilateral: true },
                { name: 'Écarté unilatéral (poulie basse)', anchor: 'door-low', unilateral: true },
                { name: 'Écarté unilatéral (poulie haute)', anchor: 'door-high', unilateral: true },
                { name: 'Pompes lestées', anchor: 'body', unilateral: false }
            ],
            
            triceps: [
                { name: 'Triceps barre au front', anchor: 'door-high', unilateral: false },
                { name: 'Extension triceps (poulie haute)', anchor: 'door-high', unilateral: false },
                { name: 'Extension triceps verticale', anchor: 'none', unilateral: false },
                { name: 'Extension triceps verticale (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Kickback triceps (poulie basse)', anchor: 'door-low', unilateral: false },
                { name: 'Kickback triceps unilatéral', anchor: 'door-low', unilateral: true }
            ]
        };
        
        // Convertir en format SmartTrack avec IDs et métadonnées
        const smartTrackExercises = [];
        let exerciseCounter = 1;
        
        Object.keys(PREDEFINED_EXERCISES).forEach(muscleGroup => {
            PREDEFINED_EXERCISES[muscleGroup].forEach(exercise => {
                const smartTrackExercise = {
                    id: `sw_${muscleGroup}_${exerciseCounter}`,
                    name: exercise.name,
                    muscle_group: muscleGroup,
                    anchor_point: exercise.anchor || 'none',
                    is_unilateral: exercise.unilateral || false,
                    default_rest_time: 90,
                    category: muscleGroup === 'echauffement' ? 'warmup' : 'strength',
                    exercise_mode: exercise.timeBase ? 'time' : 'reps',
                    default_duration: exercise.timeBase ? 30 : null,
                    exercise_type: muscleGroup === 'echauffement' ? 'bodyweight' : 'elastics',
                    created_at: new Date().toISOString(),
                    is_predefined: true,
                    source: 'smartworkout'
                };
                
                smartTrackExercises.push(smartTrackExercise);
                exerciseCounter++;
            });
        });
        
        await Storage.set(STORAGE_KEYS.EXERCISES, smartTrackExercises);
        console.log(`✓ ${smartTrackExercises.length} exercices SmartWorkout créés`);
    }

    /**
     * Initialiser les données de gamification
     */
    async function initializeGameData() {
        const existingGameData = await Storage.get(STORAGE_KEYS.GAMIFICATION);
        
        if (existingGameData) {
            console.log('✓ Données de gamification déjà présentes');
            return;
        }
        
        console.log('🎮 Initialisation des données de gamification...');
        
        const gameData = {
            level: 1,
            xp: 0,
            totalXp: 0,
            badges: [],
            achievements: [],
            streaks: {
                current: 0,
                best: 0,
                lastWorkoutDate: null
            },
            challenges: {
                weekly: null,
                monthly: null,
                completed: []
            },
            stats: {
                totalWorkouts: 0,
                totalExercises: 0,
                totalReps: 0,
                totalTime: 0,
                averageWorkoutTime: 0,
                favoriteExercises: [],
                weeklyStats: []
            }
        };
        
        await Storage.set(STORAGE_KEYS.GAMIFICATION, gameData);
        console.log('✓ Données de gamification initialisées');
    }

    /**
     * Initialiser les paramètres par défaut
     */
    async function initializeSettings() {
        const existingSettings = await Storage.get(STORAGE_KEYS.SETTINGS);
        
        if (existingSettings) {
            console.log('✓ Paramètres déjà présents');
            return;
        }
        
        console.log('⚙️ Initialisation des paramètres...');
        
        const defaultSettings = {
            theme: 'auto',
            language: 'fr',
            notifications: {
                enabled: true,
                sound: true,
                vibration: true
            },
            timer: {
                autoStart: false,
                countdownBeforeStart: 3,
                restTimerDefault: 60
            },
            privacy: {
                analytics: true,
                dataCollection: true
            },
            display: {
                showTips: true,
                showStats: true,
                compactMode: false
            },
            backup: {
                autoBackup: true,
                backupFrequency: 'weekly'
            }
        };
        
        await Storage.set(STORAGE_KEYS.SETTINGS, defaultSettings);
        console.log('✓ Paramètres par défaut initialisés');
    }

    /**
     * Créer un template d'entraînement par défaut avec exercices SmartWorkout
     */
    async function createDefaultTemplate() {
        const templates = await Storage.get(STORAGE_KEYS.TEMPLATES);
        
        if (templates && templates.length > 0) {
            return;
        }
        
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises || exercises.length === 0) {
            console.warn('⚠️ Aucun exercice disponible pour créer le template');
            return;
        }
        
        // Trouver des exercices spécifiques pour le template
        const jumpingJacks = exercises.find(e => e.name === 'Jumping Jacks');
        const squatExercise = exercises.find(e => e.name === 'Squat');
        const pushExercise = exercises.find(e => e.name.includes('Développé'));
        const pullExercise = exercises.find(e => e.name.includes('Rowing'));
        const stretchExercise = exercises.find(e => e.name.includes('Étirement'));
        
        const defaultTemplate = {
            id: Utils.generateId(),
            name: 'Découverte SmartWorkout',
            description: 'Premier contact avec les élastiques SmartWorkout',
            exercises: [
                jumpingJacks ? {
                    id: jumpingJacks.id,
                    sets: [{ duration: 30, weight: 0 }]
                } : null,
                squatExercise ? {
                    id: squatExercise.id,
                    sets: [
                        { reps: 12, weight: 15 },
                        { reps: 10, weight: 15 },
                        { reps: 8, weight: 15 }
                    ]
                } : null,
                pushExercise ? {
                    id: pushExercise.id,
                    sets: [
                        { reps: 10, weight: 10 },
                        { reps: 8, weight: 10 }
                    ]
                } : null,
                pullExercise ? {
                    id: pullExercise.id,
                    sets: [
                        { reps: 10, weight: 10 },
                        { reps: 8, weight: 10 }
                    ]
                } : null,
                stretchExercise ? {
                    id: stretchExercise.id,
                    sets: [{ duration: 30, weight: 0 }]
                } : null
            ].filter(Boolean), // Supprimer les exercices non trouvés
            estimatedDuration: 25,
            difficulty: 'beginner',
            tags: ['debutant', 'smartworkout', 'elastiques'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await Storage.set(STORAGE_KEYS.TEMPLATES, [defaultTemplate]);
        console.log('✓ Template SmartWorkout par défaut créé');
    }

    /**
     * Obtenir les exercices par groupe musculaire
     */
    async function getExercisesByMuscleGroup(muscleGroup) {
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises) return [];
        
        return exercises.filter(ex => ex.muscle_group === muscleGroup);
    }

    /**
     * Obtenir un exercice par ID
     */
    async function getExerciseById(id) {
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises) return null;
        
        return exercises.find(ex => ex.id === id);
    }

    /**
     * Obtenir les exercices par point d'ancrage
     */
    async function getExercisesByAnchor(anchorPoint) {
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises) return [];
        
        return exercises.filter(ex => ex.anchor_point === anchorPoint);
    }

    /**
     * Rechercher des exercices
     */
    async function searchExercises(query) {
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises || !query) return exercises || [];
        
        const lowerQuery = query.toLowerCase();
        
        return exercises.filter(exercise => 
            exercise.name.toLowerCase().includes(lowerQuery) ||
            exercise.muscle_group.toLowerCase().includes(lowerQuery) ||
            exercise.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Obtenir les statistiques des exercices
     */
    async function getExerciseStats() {
        const exercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        if (!exercises) return {};
        
        const stats = {
            total: exercises.length,
            byMuscleGroup: {},
            byCategory: {},
            byAnchor: {},
            unilateral: exercises.filter(e => e.is_unilateral).length
        };
        
        exercises.forEach(exercise => {
            // Par groupe musculaire
            stats.byMuscleGroup[exercise.muscle_group] = 
                (stats.byMuscleGroup[exercise.muscle_group] || 0) + 1;
            
            // Par catégorie
            stats.byCategory[exercise.category] = 
                (stats.byCategory[exercise.category] || 0) + 1;
            
            // Par point d'ancrage
            stats.byAnchor[exercise.anchor_point] = 
                (stats.byAnchor[exercise.anchor_point] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Vérifier si les données sont initialisées
     */
    function isReady() {
        return isInitialized;
    }

    /**
     * Réinitialiser toutes les données
     */
    async function reset() {
        try {
            console.log('🔄 Réinitialisation des données...');
            
            // Vider le stockage
            await Storage.clear();
            
            // Réinitialiser
            await initialize();
            
            console.log('✓ Données réinitialisées');
            
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation :', error);
            throw error;
        }
    }

    // Interface publique
    return {
        initialize,
        initializeExercises,
        initializeGameData,
        initializeSettings,
        createDefaultTemplate,
        getExercisesByMuscleGroup,
        getExerciseById,
        getExercisesByAnchor,
        searchExercises,
        getExerciseStats,
        isReady,
        reset
    };
})();

// Export global
window.DefaultData = DefaultData;