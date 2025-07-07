/**
 * SmartTrack - Constantes globales
 */

// Version de l'application
const APP_VERSION = '2.0.0';
const APP_NAME = 'SmartTrack';

// Configuration du stockage
const STORAGE_KEYS = {
    EXERCISES: 'smarttrack_exercises',
    SESSIONS: 'smarttrack_sessions',
    TEMPLATES: 'smarttrack_templates',
    GAMIFICATION: 'smarttrack_gamification',
    SETTINGS: 'smarttrack_settings',
    BODY_MEASUREMENTS: 'smarttrack_measurements',
    PROGRESS_PHOTOS: 'smarttrack_photos',
    PROGRAMS: 'smarttrack_programs',
    ANALYTICS: 'smarttrack_analytics',
    RECORDS: 'smarttrack_records'
};

// Routes de l'application
const ROUTES = {
    DASHBOARD: 'dashboard',
    PREPARATION: 'preparation',
    LIVE_SESSION: 'live',
    HISTORY: 'history',
    GAMIFICATION: 'gamification',
    BODY: 'body',
    EXERCISES: 'exercises',
    TEMPLATES: 'templates',
    PROGRAMS: 'programs',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings'
};

// Types d'exercices
const EXERCISE_TYPES = {
    STRENGTH: 'strength',
    CARDIO: 'cardio',
    ELASTICS: 'elastics',
    BODYWEIGHT: 'bodyweight',
    STRETCHING: 'stretching'
};

// Modes d'exercices
const EXERCISE_MODES = {
    REPS: 'reps',
    TIME: 'time',
    BOTH: 'both'
};

// Groupes musculaires
const MUSCLE_GROUPS = {
    WARMUP: 'echauffement',
    BICEPS: 'biceps',
    TRICEPS: 'triceps',
    SHOULDERS: 'epaules',
    BACK: 'dos',
    CHEST: 'pectoraux',
    LEGS: 'jambes',
    OTHER: 'autres'
};

// Niveaux de programmes
const PROGRAM_LEVELS = {
    BEGINNER: 'debutant',
    INTERMEDIATE: 'intermediaire',
    ADVANCED: 'avance',
    LEGEND: 'legende',
    SPECIFIC: 'specifique'
};

// Catégories de badges
const BADGE_CATEGORIES = {
    REGULARITY: 'regularity',
    PERFORMANCE: 'performance',
    EXPLORATION: 'exploration',
    PROGRESSION: 'progression'
};

// Types de notifications
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Durées par défaut
const DEFAULTS = {
    REST_TIME: 90,
    EXERCISE_DURATION: 30,
    SESSION_TIMEOUT: 3600000, // 1 heure en ms
    NOTIFICATION_DURATION: 3000,
    AUTO_SAVE_INTERVAL: 30000, // 30 secondes
    ANIMATION_DURATION: 300
};

// Limites de validation
const LIMITS = {
    EXERCISE_NAME_MIN: 3,
    EXERCISE_NAME_MAX: 50,
    REPS_MIN: 1,
    REPS_MAX: 999,
    WEIGHT_MIN: 0,
    WEIGHT_MAX: 9999,
    REST_TIME_MIN: 10,
    REST_TIME_MAX: 600,
    DURATION_MIN: 10,
    DURATION_MAX: 3600,
    SETS_MIN: 1,
    SETS_MAX: 20,
    PHOTO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    PHOTO_MAX_COUNT: 10
};

// Configuration des élastiques
const ELASTIC_CONFIG = {
    RESISTANCES: [
        { name: 'Très léger', value: 2, color: '#FFE5B4' },
        { name: 'Léger', value: 5, color: '#90EE90' },
        { name: 'Moyen', value: 10, color: '#87CEEB' },
        { name: 'Fort', value: 15, color: '#DDA0DD' },
        { name: 'Très fort', value: 20, color: '#F0E68C' },
        { name: 'Extra fort', value: 25, color: '#FFA07A' }
    ],
    ANCHOR_POINTS: {
        NONE: 'none',
        HIGH: 'high',
        MIDDLE: 'middle',
        LOW: 'low',
        DOOR: 'door'
    }
};

// Configuration des analytics
const ANALYTICS_CONFIG = {
    CHART_COLORS: [
        '#007AFF', '#34C759', '#FF9500', '#FF3B30',
        '#5856D6', '#AF52DE', '#FF2D92', '#64D2FF'
    ],
    PERIODS: {
        WEEK: 7,
        MONTH: 30,
        QUARTER: 90,
        YEAR: 365
    }
};

// Messages d'erreur
const ERROR_MESSAGES = {
    STORAGE_FAILED: 'Erreur de sauvegarde des données',
    LOAD_FAILED: 'Erreur de chargement des données',
    VALIDATION_FAILED: 'Données invalides',
    NETWORK_ERROR: 'Erreur de connexion',
    UNKNOWN_ERROR: 'Erreur inconnue'
};

// Messages de succès
const SUCCESS_MESSAGES = {
    EXERCISE_SAVED: 'Exercice sauvegardé !',
    SESSION_SAVED: 'Séance enregistrée !',
    TEMPLATE_SAVED: 'Modèle créé !',
    SETTINGS_SAVED: 'Paramètres sauvegardés !',
    DATA_EXPORTED: 'Données exportées !',
    DATA_IMPORTED: 'Données importées !'
};

// Configuration du système de gamification
const GAMIFICATION_CONFIG = {
    XP_PER_LEVEL: 100,
    XP_REWARDS: {
        SESSION_COMPLETE: 50,
        NEW_RECORD: 25,
        STREAK_BONUS: 10,
        EXERCISE_COMPLETE: 5,
        FIRST_TIME_EXERCISE: 15
    },
    LEVEL_TITLES: {
        1: 'Apprenti de la Forge',
        5: 'Guerrier Novice',
        10: 'Soldat Aguerri',
        15: 'Forgeron de Combat',
        20: 'Maître d\'Armes',
        30: 'Champion de la Forge',
        50: 'Légende Vivante',
        100: 'Titan Immortel'
    }
};

// Configuration des défis hebdomadaires
const WEEKLY_CHALLENGES = [
    {
        id: 'regular_warrior',
        name: 'Maître de la Régularité',
        description: 'Effectuer 3 séances cette semaine',
        icon: '🔥',
        requirement: { type: 'weekly_sessions', value: 3 },
        xpReward: 100
    },
    {
        id: 'explorer',
        name: 'Explorateur Intrépide',
        description: 'Tester 5 nouveaux exercices',
        icon: '🗺️',
        requirement: { type: 'new_exercises', value: 5 },
        xpReward: 150
    },
    {
        id: 'endurance_master',
        name: 'Maître de l\'Endurance',
        description: 'Séance de plus de 45 minutes',
        icon: '⏱️',
        requirement: { type: 'long_session', value: 45 * 60 },
        xpReward: 75
    },
    {
        id: 'muscle_architect',
        name: 'Architecte Musculaire',
        description: 'Travailler 4 groupes musculaires différents',
        icon: '🏗️',
        requirement: { type: 'muscle_groups', value: 4 },
        xpReward: 125
    },
    {
        id: 'record_breaker',
        name: 'Briseur de Records',
        description: 'Battre un record personnel',
        icon: '💥',
        requirement: { type: 'new_record', value: 1 },
        xpReward: 200
    }
];

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_VERSION,
        APP_NAME,
        STORAGE_KEYS,
        ROUTES,
        EXERCISE_TYPES,
        EXERCISE_MODES,
        MUSCLE_GROUPS,
        PROGRAM_LEVELS,
        BADGE_CATEGORIES,
        NOTIFICATION_TYPES,
        DEFAULTS,
        LIMITS,
        ELASTIC_CONFIG,
        ANALYTICS_CONFIG,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        GAMIFICATION_CONFIG,
        WEEKLY_CHALLENGES
    };
}