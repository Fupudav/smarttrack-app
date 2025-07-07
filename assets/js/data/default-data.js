/**
 * SmartTrack - Données par défaut
 * Initialise les exercices de base et les données initiales
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
     * Initialiser les exercices par défaut
     */
    async function initializeExercises() {
        const existingExercises = await Storage.get(STORAGE_KEYS.EXERCISES);
        
        if (existingExercises && existingExercises.length > 0) {
            console.log('✓ Exercices déjà présents');
            return;
        }
        
        console.log('🏋️ Création des exercices par défaut...');
        
        const defaultExercises = [
            // Échauffement
            {
                id: 'warmup_jumping_jacks',
                name: 'Jumping Jacks',
                muscle_group: 'echauffement',
                type: 'cardio',
                is_unilateral: false,
                description: 'Exercice d\'échauffement complet'
            },
            {
                id: 'warmup_arm_circles',
                name: 'Rotations bras',
                muscle_group: 'echauffement',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Échauffement des épaules'
            },
            {
                id: 'warmup_leg_swings',
                name: 'Balancement jambes',
                muscle_group: 'echauffement',
                type: 'stretching',
                is_unilateral: true,
                description: 'Échauffement des hanches'
            },
            
            // Pectoraux
            {
                id: 'chest_pushups',
                name: 'Pompes',
                muscle_group: 'pectoraux',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Pompes classiques'
            },
            {
                id: 'chest_diamond_pushups',
                name: 'Pompes diamant',
                muscle_group: 'pectoraux',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Pompes mains en diamant'
            },
            {
                id: 'chest_incline_pushups',
                name: 'Pompes inclinées',
                muscle_group: 'pectoraux',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Pompes pieds surélevés'
            },
            
            // Biceps
            {
                id: 'biceps_curls',
                name: 'Curl biceps',
                muscle_group: 'biceps',
                type: 'strength',
                is_unilateral: false,
                description: 'Curl biceps avec haltères'
            },
            {
                id: 'biceps_hammer_curls',
                name: 'Curl marteau',
                muscle_group: 'biceps',
                type: 'strength',
                is_unilateral: false,
                description: 'Curl prise marteau'
            },
            {
                id: 'biceps_concentration_curls',
                name: 'Curl concentration',
                muscle_group: 'biceps',
                type: 'strength',
                is_unilateral: true,
                description: 'Curl concentration assis'
            },
            
            // Triceps
            {
                id: 'triceps_dips',
                name: 'Dips triceps',
                muscle_group: 'triceps',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Dips sur chaise'
            },
            {
                id: 'triceps_overhead_extension',
                name: 'Extension triceps',
                muscle_group: 'triceps',
                type: 'strength',
                is_unilateral: false,
                description: 'Extension triceps au-dessus de la tête'
            },
            {
                id: 'triceps_kickbacks',
                name: 'Kickback triceps',
                muscle_group: 'triceps',
                type: 'strength',
                is_unilateral: true,
                description: 'Extension triceps penché'
            },
            
            // Épaules
            {
                id: 'shoulders_press',
                name: 'Développé épaules',
                muscle_group: 'epaules',
                type: 'strength',
                is_unilateral: false,
                description: 'Développé épaules debout'
            },
            {
                id: 'shoulders_lateral_raises',
                name: 'Élévations latérales',
                muscle_group: 'epaules',
                type: 'strength',
                is_unilateral: false,
                description: 'Élévations latérales aux haltères'
            },
            {
                id: 'shoulders_front_raises',
                name: 'Élévations frontales',
                muscle_group: 'epaules',
                type: 'strength',
                is_unilateral: false,
                description: 'Élévations frontales aux haltères'
            },
            
            // Dos
            {
                id: 'back_pullups',
                name: 'Tractions',
                muscle_group: 'dos',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Tractions à la barre'
            },
            {
                id: 'back_rows',
                name: 'Rowing',
                muscle_group: 'dos',
                type: 'strength',
                is_unilateral: false,
                description: 'Rowing barre ou haltères'
            },
            {
                id: 'back_single_arm_rows',
                name: 'Rowing unilatéral',
                muscle_group: 'dos',
                type: 'strength',
                is_unilateral: true,
                description: 'Rowing un bras'
            },
            
            // Jambes
            {
                id: 'legs_squats',
                name: 'Squats',
                muscle_group: 'jambes',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Squats au poids du corps'
            },
            {
                id: 'legs_lunges',
                name: 'Fentes',
                muscle_group: 'jambes',
                type: 'bodyweight',
                is_unilateral: true,
                description: 'Fentes avant'
            },
            {
                id: 'legs_calf_raises',
                name: 'Mollets',
                muscle_group: 'jambes',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Élévations mollets'
            },
            {
                id: 'legs_wall_sit',
                name: 'Chaise murale',
                muscle_group: 'jambes',
                type: 'bodyweight',
                is_unilateral: false,
                description: 'Position chaise contre le mur'
            },
            
            // Exercices avec élastiques
            {
                id: 'elastic_chest_press',
                name: 'Développé élastique',
                muscle_group: 'pectoraux',
                type: 'elastics',
                is_unilateral: false,
                description: 'Développé avec élastique'
            },
            {
                id: 'elastic_lat_pulldown',
                name: 'Tirage élastique',
                muscle_group: 'dos',
                type: 'elastics',
                is_unilateral: false,
                description: 'Tirage vertical avec élastique'
            },
            {
                id: 'elastic_bicep_curls',
                name: 'Curl élastique',
                muscle_group: 'biceps',
                type: 'elastics',
                is_unilateral: false,
                description: 'Curl biceps avec élastique'
            },
            {
                id: 'elastic_tricep_press',
                name: 'Extension élastique',
                muscle_group: 'triceps',
                type: 'elastics',
                is_unilateral: false,
                description: 'Extension triceps avec élastique'
            },
            
            // Stretching
            {
                id: 'stretch_chest',
                name: 'Étirement pectoraux',
                muscle_group: 'pectoraux',
                type: 'stretching',
                is_unilateral: false,
                description: 'Étirement des pectoraux'
            },
            {
                id: 'stretch_shoulders',
                name: 'Étirement épaules',
                muscle_group: 'epaules',
                type: 'stretching',
                is_unilateral: false,
                description: 'Étirement des épaules'
            },
            {
                id: 'stretch_back',
                name: 'Étirement dos',
                muscle_group: 'dos',
                type: 'stretching',
                is_unilateral: false,
                description: 'Étirement du dos'
            },
            {
                id: 'stretch_legs',
                name: 'Étirement jambes',
                muscle_group: 'jambes',
                type: 'stretching',
                is_unilateral: false,
                description: 'Étirement des jambes'
            }
        ];
        
        await Storage.set(STORAGE_KEYS.EXERCISES, defaultExercises);
        console.log(`✓ ${defaultExercises.length} exercices par défaut créés`);
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
     * Créer un template d'entraînement par défaut
     */
    async function createDefaultTemplate() {
        const templates = await Storage.get(STORAGE_KEYS.TEMPLATES);
        
        if (templates && templates.length > 0) {
            return;
        }
        
        const defaultTemplate = {
            id: Utils.generateId(),
            name: 'Entraînement découverte',
            description: 'Un entraînement complet pour débuter',
            exercises: [
                {
                    id: 'warmup_jumping_jacks',
                    sets: [{ reps: 20, weight: 0 }]
                },
                {
                    id: 'chest_pushups',
                    sets: [
                        { reps: 10, weight: 0 },
                        { reps: 8, weight: 0 },
                        { reps: 6, weight: 0 }
                    ]
                },
                {
                    id: 'legs_squats',
                    sets: [
                        { reps: 15, weight: 0 },
                        { reps: 12, weight: 0 },
                        { reps: 10, weight: 0 }
                    ]
                },
                {
                    id: 'stretch_chest',
                    sets: [{ duration: 30, weight: 0 }]
                }
            ],
            estimatedDuration: 20,
            difficulty: 'beginner',
            tags: ['debutant', 'complet', 'maison'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await Storage.set(STORAGE_KEYS.TEMPLATES, [defaultTemplate]);
        console.log('✓ Template par défaut créé');
    }

    /**
     * Obtenir les exercices par groupe musculaire
     */
    function getExercisesByMuscleGroup(muscleGroup) {
        const exercises = [
            // Sera rempli par la fonction initialize
        ];
        
        return exercises.filter(ex => ex.muscle_group === muscleGroup);
    }

    /**
     * Obtenir un exercice par ID
     */
    function getExerciseById(id) {
        const exercises = [
            // Sera rempli par la fonction initialize
        ];
        
        return exercises.find(ex => ex.id === id);
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
        isReady,
        reset
    };
})();

// Export global
window.DefaultData = DefaultData;