/**
 * SmartTrack - Modèle Gamification
 * Gestion du système XP, niveaux, badges et défis
 */

const GamificationModel = (function() {
    let playerData = null;
    let badges = [];
    let challenges = [];
    let isLoaded = false;

    // Configuration XP
    const XP_CONFIG = {
        BASE_SESSION: 50,           // XP de base par session terminée
        PER_EXERCISE: 10,           // XP par exercice complété
        PER_SET: 5,                 // XP par set réalisé
        STREAK_MULTIPLIER: 1.5,     // Multiplicateur pour série de jours
        PERFECT_SESSION: 100,       // Bonus session parfaite (tous sets complétés)
        FIRST_SESSION_DAY: 25,      // Bonus première session du jour
        CHALLENGE_COMPLETED: 200,   // XP pour défi complété
        BADGE_UNLOCKED: 150        // XP pour nouveau badge
    };

    /**
     * Initialiser le modèle de gamification
     */
    async function init() {
        try {
            console.log('🎮 Initialisation du modèle Gamification...');
            
            await loadPlayerData();
            await loadBadges();
            await loadChallenges();
            
            // Écouter les événements de sessions
            if (typeof EventBus !== 'undefined') {
                EventBus.on('sessions:finished', handleSessionCompleted);
                EventBus.on('sessions:set-completed', handleSetCompleted);
                EventBus.on('storage:saved', handleStorageUpdate);
            }
            
            // Vérifier les défis quotidiens/hebdomadaires
            await checkDailyChallenges();
            
            console.log(`✓ Modèle Gamification initialisé (Niveau ${playerData.level})`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Gamification :', error);
            throw error;
        }
    }

    /**
     * Charger les données du joueur
     */
    async function loadPlayerData() {
        try {
            playerData = await Storage.get(STORAGE_KEYS.PLAYER_DATA);
            
            if (!playerData) {
                // Initialiser un nouveau joueur
                playerData = {
                    level: 1,
                    xp: 0,
                    totalXp: 0,
                    badges: [],
                    completedChallenges: [],
                    stats: {
                        totalSessions: 0,
                        totalExercises: 0,
                        totalSets: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        perfectSessions: 0
                    },
                    preferences: {
                        notifications: true,
                        achievements: true,
                        sounds: true
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                await savePlayerData();
            }
            
            isLoaded = true;
            return playerData;
            
        } catch (error) {
            console.error('❌ Erreur chargement données joueur :', error);
            // Données par défaut en cas d'erreur
            playerData = {
                level: 1,
                xp: 0,
                totalXp: 0,
                badges: [],
                completedChallenges: [],
                stats: { totalSessions: 0, totalExercises: 0, totalSets: 0, currentStreak: 0, longestStreak: 0, perfectSessions: 0 },
                preferences: { notifications: true, achievements: true, sounds: true },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            return playerData;
        }
    }

    /**
     * Charger les badges disponibles
     */
    async function loadBadges() {
        try {
            const data = await Storage.get(STORAGE_KEYS.BADGES);
            badges = data || PREDEFINED_BADGES;
            return badges;
            
        } catch (error) {
            console.error('❌ Erreur chargement badges :', error);
            badges = PREDEFINED_BADGES;
            return badges;
        }
    }

    /**
     * Charger les défis
     */
    async function loadChallenges() {
        try {
            const data = await Storage.get(STORAGE_KEYS.CHALLENGES);
            challenges = data || generateWeeklyChallenges();
            return challenges;
            
        } catch (error) {
            console.error('❌ Erreur chargement défis :', error);
            challenges = generateWeeklyChallenges();
            return challenges;
        }
    }

    /**
     * Sauvegarder les données du joueur
     */
    async function savePlayerData() {
        try {
            playerData.updated_at = new Date().toISOString();
            await Storage.set(STORAGE_KEYS.PLAYER_DATA, playerData);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:player-updated', { player: playerData });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde données joueur :', error);
            return false;
        }
    }

    /**
     * Ajouter de l'XP au joueur
     */
    async function addXP(amount, reason = 'Unknown') {
        try {
            if (!playerData || amount <= 0) return false;

            const oldLevel = playerData.level;
            const oldXp = playerData.xp;

            playerData.xp += amount;
            playerData.totalXp += amount;

            // Vérifier montée de niveau
            const newLevel = calculateLevel(playerData.totalXp);
            if (newLevel > oldLevel) {
                playerData.level = newLevel;
                await handleLevelUp(oldLevel, newLevel);
            }

            await savePlayerData();

            // Émettre événement XP gagné
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:xp-gained', {
                    amount,
                    reason,
                    oldXp,
                    newXp: playerData.xp,
                    levelUp: newLevel > oldLevel,
                    newLevel
                });
            }

            console.log(`🎮 +${amount} XP (${reason}) - Total: ${playerData.totalXp} - Niveau: ${playerData.level}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur ajout XP :', error);
            return false;
        }
    }

    /**
     * Calculer le niveau basé sur l'XP total
     */
    function calculateLevel(totalXp) {
        // Formule exponentielle : Level = floor(sqrt(totalXp / 100)) + 1
        return Math.floor(Math.sqrt(totalXp / 100)) + 1;
    }

    /**
     * Calculer l'XP requis pour le prochain niveau
     */
    function getXpForNextLevel(level = null) {
        const currentLevel = level || (playerData ? playerData.level : 1);
        const nextLevel = currentLevel + 1;
        return Math.pow(nextLevel - 1, 2) * 100;
    }

    /**
     * Calculer l'XP requis pour le niveau actuel
     */
    function getXpForCurrentLevel(level = null) {
        const currentLevel = level || (playerData ? playerData.level : 1);
        if (currentLevel <= 1) return 0;
        return Math.pow(currentLevel - 1, 2) * 100;
    }

    /**
     * Obtenir le progrès vers le prochain niveau
     */
    function getLevelProgress() {
        if (!playerData) return { current: 0, required: 100, percentage: 0 };

        const currentLevelXp = getXpForCurrentLevel();
        const nextLevelXp = getXpForNextLevel();
        const currentXp = playerData.totalXp - currentLevelXp;
        const requiredXp = nextLevelXp - currentLevelXp;

        return {
            current: currentXp,
            required: requiredXp,
            percentage: Math.round((currentXp / requiredXp) * 100)
        };
    }

    /**
     * Gérer la montée de niveau
     */
    async function handleLevelUp(oldLevel, newLevel) {
        try {
            console.log(`🎉 NIVEAU SUPÉRIEUR ! ${oldLevel} → ${newLevel}`);

            // Ajouter XP bonus pour montée de niveau
            playerData.totalXp += 50;

            // Vérifier déblocage de badges
            await checkLevelBadges(newLevel);

            // Émettre événement montée de niveau
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:level-up', {
                    oldLevel,
                    newLevel,
                    player: playerData
                });
            }

            // Notification si activées
            if (playerData.preferences.notifications) {
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(
                        `🎉 Niveau ${newLevel} atteint !`,
                        `Félicitations ! Vous avez débloqué le niveau ${newLevel}.`
                    );
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur montée de niveau :', error);
        }
    }

    /**
     * Débloquer un badge
     */
    async function unlockBadge(badgeId) {
        try {
            if (!playerData || playerData.badges.includes(badgeId)) {
                return false; // Badge déjà débloqué
            }

            const badge = badges.find(b => b.id === badgeId);
            if (!badge) {
                console.warn(`❌ Badge ${badgeId} non trouvé`);
                return false;
            }

            playerData.badges.push(badgeId);
            
            // Ajouter XP bonus
            await addXP(XP_CONFIG.BADGE_UNLOCKED, `Badge débloqué: ${badge.name}`);

            console.log(`🏆 Badge débloqué : ${badge.name}`);

            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:badge-unlocked', {
                    badge,
                    player: playerData
                });
            }

            // Notification
            if (playerData.preferences.achievements && typeof NotificationManager !== 'undefined') {
                NotificationManager.success(
                    `🏆 Badge débloqué !`,
                    `${badge.name} - ${badge.description}`
                );
            }

            await savePlayerData();
            return true;
            
        } catch (error) {
            console.error('❌ Erreur déblocage badge :', error);
            return false;
        }
    }

    /**
     * Vérifier les badges basés sur le niveau
     */
    async function checkLevelBadges(level) {
        const levelBadges = [
            { level: 5, badgeId: 'novice' },
            { level: 10, badgeId: 'athlete' },
            { level: 20, badgeId: 'expert' },
            { level: 50, badgeId: 'legend' }
        ];

        for (const levelBadge of levelBadges) {
            if (level >= levelBadge.level) {
                await unlockBadge(levelBadge.badgeId);
            }
        }
    }

    /**
     * Vérifier tous les badges après une session
     */
    async function checkAllBadges() {
        try {
            const stats = playerData.stats;

            // Badge première session
            if (stats.totalSessions === 1) {
                await unlockBadge('first_session');
            }

            // Badge série
            if (stats.currentStreak >= 7) {
                await unlockBadge('weekly_warrior');
            }
            if (stats.currentStreak >= 30) {
                await unlockBadge('monthly_master');
            }

            // Badge sessions parfaites
            if (stats.perfectSessions >= 10) {
                await unlockBadge('perfectionist');
            }

            // Badge volume
            if (stats.totalSets >= 1000) {
                await unlockBadge('thousand_sets');
            }

            // Badges spéciaux basés sur les exercices
            // TODO: Ajouter vérifications spécialisées

        } catch (error) {
            console.error('❌ Erreur vérification badges :', error);
        }
    }

    /**
     * Gérer la fin d'une session
     */
    async function handleSessionCompleted(data) {
        try {
            const session = data.session;
            if (!session || !playerData) return;

            // Calculer XP de base
            let xpGained = XP_CONFIG.BASE_SESSION;

            // XP par exercice
            xpGained += session.exercises.length * XP_CONFIG.PER_EXERCISE;

            // XP par set complété
            let completedSets = 0;
            let totalSets = 0;
            session.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    totalSets++;
                    if (set.completed) {
                        completedSets++;
                        xpGained += XP_CONFIG.PER_SET;
                    }
                });
            });

            // Bonus session parfaite
            let isPerfectSession = false;
            if (completedSets === totalSets && totalSets > 0) {
                xpGained += XP_CONFIG.PERFECT_SESSION;
                isPerfectSession = true;
                playerData.stats.perfectSessions++;
            }

            // Bonus première session du jour
            const today = new Date().toDateString();
            const sessionDate = new Date(session.date).toDateString();
            if (sessionDate === today) {
                // Vérifier si c'est la première aujourd'hui
                const sessionsToday = await SessionsModel.getByDateRange(
                    new Date(today),
                    new Date(today)
                );
                if (sessionsToday.length === 1) {
                    xpGained += XP_CONFIG.FIRST_SESSION_DAY;
                }
            }

            // Multiplicateur de série
            if (playerData.stats.currentStreak > 1) {
                xpGained = Math.round(xpGained * XP_CONFIG.STREAK_MULTIPLIER);
            }

            // Mettre à jour les statistiques
            playerData.stats.totalSessions++;
            playerData.stats.totalExercises += session.exercises.length;
            playerData.stats.totalSets += completedSets;
            
            // Calculer la nouvelle série
            await updateStreak(session.date);

            // Ajouter l'XP
            await addXP(xpGained, 'Session terminée');

            // Vérifier les badges
            await checkAllBadges();

            // Vérifier les défis
            await checkChallengeProgress();

            console.log(`🎮 Session terminée: +${xpGained} XP (${isPerfectSession ? 'Parfaite!' : completedSets + '/' + totalSets + ' sets'})`);
            
        } catch (error) {
            console.error('❌ Erreur traitement session gamification :', error);
        }
    }

    /**
     * Gérer la complétion d'un set
     */
    async function handleSetCompleted(data) {
        try {
            // Pour l'instant, on ne donne pas d'XP immédiat pour les sets
            // L'XP est calculé à la fin de la session
            
            // Mais on peut émettre des événements pour l'UI
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:set-completed', data);
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement set gamification :', error);
        }
    }

    /**
     * Mettre à jour la série de jours consécutifs
     */
    async function updateStreak(sessionDate) {
        try {
            // Récupérer toutes les sessions pour calculer la série
            const allSessions = await SessionsModel.getAll();
            
            // Grouper par jour
            const sessionDays = {};
            allSessions.forEach(session => {
                const day = new Date(session.date).toDateString();
                sessionDays[day] = true;
            });

            // Calculer la série actuelle
            let currentStreak = 0;
            const today = new Date();
            
            for (let i = 0; i < 365; i++) { // Vérifier jusqu'à 1 an
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const checkDay = checkDate.toDateString();
                
                if (sessionDays[checkDay]) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            playerData.stats.currentStreak = currentStreak;
            if (currentStreak > playerData.stats.longestStreak) {
                playerData.stats.longestStreak = currentStreak;
            }

            await savePlayerData();
            
        } catch (error) {
            console.error('❌ Erreur calcul série :', error);
        }
    }

    /**
     * Générer les défis hebdomadaires
     */
    function generateWeeklyChallenges() {
        const weekStart = Utils.getStartOfWeek(new Date());
        
        return WEEKLY_CHALLENGES.map(challenge => ({
            ...challenge,
            id: Utils.generateId(),
            startDate: weekStart.toISOString(),
            endDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 0,
            completed: false,
            claimed: false
        }));
    }

    /**
     * Vérifier les défis quotidiens
     */
    async function checkDailyChallenges() {
        try {
            const today = new Date().toDateString();
            const lastCheck = await Storage.get('last_challenge_check');
            
            if (lastCheck !== today) {
                // Réinitialiser les défis quotidiens
                challenges.forEach(challenge => {
                    if (challenge.type === 'daily') {
                        challenge.progress = 0;
                        challenge.completed = false;
                        challenge.claimed = false;
                    }
                });

                // Générer nouveaux défis hebdomadaires si nécessaire
                const weekStart = Utils.getStartOfWeek(new Date()).toDateString();
                const currentWeekChallenges = challenges.filter(c => 
                    c.type === 'weekly' && 
                    new Date(c.startDate).toDateString() === weekStart
                );

                if (currentWeekChallenges.length === 0) {
                    const newWeeklyChallenges = generateWeeklyChallenges();
                    challenges = challenges.filter(c => c.type !== 'weekly').concat(newWeeklyChallenges);
                }

                await Storage.set(STORAGE_KEYS.CHALLENGES, challenges);
                await Storage.set('last_challenge_check', today);
            }
            
        } catch (error) {
            console.error('❌ Erreur vérification défis quotidiens :', error);
        }
    }

    /**
     * Vérifier le progrès des défis
     */
    async function checkChallengeProgress() {
        try {
            // TODO: Implémenter la vérification des défis
            // Basé sur les statistiques du joueur et les sessions récentes
            
        } catch (error) {
            console.error('❌ Erreur vérification progrès défis :', error);
        }
    }

    /**
     * Obtenir les données du joueur
     */
    function getPlayerData() {
        return playerData ? { ...playerData } : null;
    }

    /**
     * Obtenir tous les badges
     */
    function getAllBadges() {
        return badges.map(badge => ({
            ...badge,
            unlocked: playerData ? playerData.badges.includes(badge.id) : false
        }));
    }

    /**
     * Obtenir les badges débloqués
     */
    function getUnlockedBadges() {
        if (!playerData) return [];
        return badges.filter(badge => playerData.badges.includes(badge.id));
    }

    /**
     * Obtenir les défis actifs
     */
    function getActiveChallenges() {
        const now = new Date();
        return challenges.filter(challenge => {
            const endDate = new Date(challenge.endDate);
            return endDate > now && !challenge.completed;
        });
    }

    /**
     * Obtenir les défis complétés
     */
    function getCompletedChallenges() {
        return challenges.filter(challenge => challenge.completed);
    }

    /**
     * Obtenir les statistiques de gamification
     */
    function getGamificationStats() {
        if (!playerData) return null;

        return {
            player: playerData,
            levelProgress: getLevelProgress(),
            totalBadges: badges.length,
            unlockedBadges: playerData.badges.length,
            activeChallenges: getActiveChallenges().length,
            completedChallenges: getCompletedChallenges().length
        };
    }

    /**
     * Réinitialiser les données de gamification
     */
    async function resetPlayerData() {
        try {
            playerData = {
                level: 1,
                xp: 0,
                totalXp: 0,
                badges: [],
                completedChallenges: [],
                stats: { totalSessions: 0, totalExercises: 0, totalSets: 0, currentStreak: 0, longestStreak: 0, perfectSessions: 0 },
                preferences: { notifications: true, achievements: true, sounds: true },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await savePlayerData();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('gamification:reset');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur réinitialisation gamification :', error);
            return false;
        }
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.PLAYER_DATA) {
            console.log('🔄 Mise à jour données joueur détectée');
            loadPlayerData();
        }
    }

    // Interface publique
    return {
        init,
        addXP,
        unlockBadge,
        getPlayerData,
        getAllBadges,
        getUnlockedBadges,
        getActiveChallenges,
        getCompletedChallenges,
        getGamificationStats,
        getLevelProgress,
        resetPlayerData,
        calculateLevel,
        getXpForNextLevel
    };
})();

// Export global
window.GamificationModel = GamificationModel;