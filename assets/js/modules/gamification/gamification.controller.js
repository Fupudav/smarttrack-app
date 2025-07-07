/**
 * SmartTrack - Contrôleur Gamification
 * Orchestration du système de gamification, badges et défis
 */

const GamificationController = (function() {
    let isInitialized = false;
    let animationQueue = [];
    let isProcessingAnimations = false;

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('🏆 Initialisation GamificationController...');
            
            // Initialiser la vue
            if (typeof GamificationView !== 'undefined') {
                GamificationView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:gamification', handleGamificationRoute);
                EventBus.on('sessions:live-completed', handleSessionCompleted);
                EventBus.on('exercises:exercise-used', handleExerciseUsed);
                EventBus.on('app:initialized', handleAppInitialized);
                EventBus.on('gamification:animation-requested', handleAnimationRequest);
            }
            
            isInitialized = true;
            console.log('✓ GamificationController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation GamificationController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers gamification
     */
    async function handleGamificationRoute() {
        console.log('📍 Navigation vers Gamification');
        await renderGamification();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - GamificationController prêt');
    }

    /**
     * Rendre l'interface gamification
     */
    async function renderGamification() {
        try {
            if (typeof GamificationView !== 'undefined') {
                await GamificationView.render();
                updateActiveNavigation('gamification');
            } else {
                console.error('❌ GamificationView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu gamification :', error);
            showErrorScreen('Erreur lors du chargement de la gamification');
        }
    }

    /**
     * Gérer la fin de session
     */
    async function handleSessionCompleted(data) {
        try {
            console.log('🎯 Session terminée - Traitement gamification...');
            
            if (typeof GamificationModel !== 'undefined') {
                const session = data.session;
                const stats = data.stats || {};
                
                // Calculer l'XP de base pour la session
                let sessionXP = 50; // XP de base
                
                // Bonus selon la durée
                if (stats.duration >= 1800000) { // 30 minutes
                    sessionXP += 25;
                }
                
                // Bonus selon les exercices
                sessionXP += (stats.exercises_completed || 0) * 10;
                
                // Bonus selon les sets
                sessionXP += (stats.sets_completed || 0) * 5;
                
                // Ajouter l'XP
                const xpResult = await GamificationModel.addXP(sessionXP, 'session_completed');
                
                // Vérifier les niveaux et badges
                await processSessionAchievements(session, stats, xpResult);
                
                // Mettre à jour les défis
                await updateWeeklyChallenges(session, stats);
                
                // Mettre à jour la série de jours
                await GamificationModel.updateDailyStreak();
                
                // Émettre l'événement de mise à jour
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('gamification:session-processed', {
                        session,
                        stats,
                        xpGained: sessionXP,
                        achievements: xpResult
                    });
                }
                
            } else {
                console.warn('⚠️ GamificationModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement session gamification :', error);
        }
    }

    /**
     * Traiter les accomplissements de session
     */
    async function processSessionAchievements(session, stats, xpResult) {
        try {
            // Vérifier les level ups
            if (xpResult.levelUp) {
                queueAnimation({
                    type: 'level-up',
                    data: {
                        newLevel: xpResult.newLevel,
                        newTitle: xpResult.newTitle,
                        playerStats: xpResult.playerStats
                    }
                });
            }
            
            // Vérifier les badges de session
            const badgesToCheck = [
                'first_session',
                'session_completionist',
                'endurance_athlete',
                'consistency_king'
            ];
            
            if (typeof GamificationModel !== 'undefined') {
                const earnedBadges = await GamificationModel.checkBadges(badgesToCheck);
                
                // Traiter les nouveaux badges
                earnedBadges.forEach(badge => {
                    queueAnimation({
                        type: 'badge-earned',
                        data: { badge }
                    });
                });
                
                // Badges spécifiques selon les stats
                await checkSpecificBadges(session, stats);
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement accomplissements :', error);
        }
    }

    /**
     * Vérifier les badges spécifiques
     */
    async function checkSpecificBadges(session, stats) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const badgesToCheck = [];
                
                // Badge endurance
                if (stats.duration >= 3600000) { // 1 heure
                    badgesToCheck.push('endurance_master');
                }
                
                // Badge volume
                if (stats.total_volume >= 1000) {
                    badgesToCheck.push('volume_master');
                }
                
                // Badge perfectionniste
                if (stats.exercises_completed > 0 && stats.sets_completed / stats.exercises_completed >= 3) {
                    badgesToCheck.push('perfectionist');
                }
                
                // Badge explorateur
                if (session.exercises && session.exercises.length >= 8) {
                    badgesToCheck.push('exercise_explorer');
                }
                
                if (badgesToCheck.length > 0) {
                    const earnedBadges = await GamificationModel.checkBadges(badgesToCheck);
                    
                    earnedBadges.forEach(badge => {
                        queueAnimation({
                            type: 'badge-earned',
                            data: { badge }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('❌ Erreur vérification badges spécifiques :', error);
        }
    }

    /**
     * Mettre à jour les défis hebdomadaires
     */
    async function updateWeeklyChallenges(session, stats) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const challenges = await GamificationModel.getCurrentChallenges();
                
                for (const challenge of challenges) {
                    if (challenge.completed) continue;
                    
                    let progress = false;
                    
                    switch (challenge.requirement.type) {
                        case 'weekly_sessions':
                            progress = await GamificationModel.updateChallengeProgress(
                                challenge.id, 1
                            );
                            break;
                            
                        case 'long_session':
                            if (stats.duration >= challenge.requirement.value * 1000) {
                                progress = await GamificationModel.completeChallengeDirectly(challenge.id);
                            }
                            break;
                            
                        case 'muscle_groups':
                            if (stats.muscle_groups && stats.muscle_groups.length > 0) {
                                progress = await GamificationModel.updateChallengeProgress(
                                    challenge.id, stats.muscle_groups.length
                                );
                            }
                            break;
                            
                        case 'new_exercises':
                            // Compter les nouveaux exercices utilisés
                            const newExercises = session.exercises?.filter(ex => ex.isFirstTime) || [];
                            if (newExercises.length > 0) {
                                progress = await GamificationModel.updateChallengeProgress(
                                    challenge.id, newExercises.length
                                );
                            }
                            break;
                    }
                    
                    // Si défi complété
                    if (progress && progress.completed) {
                        queueAnimation({
                            type: 'challenge-completed',
                            data: { challenge: progress.challenge }
                        });
                        
                        // Ajouter l'XP du défi
                        await GamificationModel.addXP(
                            challenge.xpReward || 100, 
                            'challenge_completed'
                        );
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour défis :', error);
        }
    }

    /**
     * Gérer l'utilisation d'exercice
     */
    async function handleExerciseUsed(data) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // Vérifier si c'est la première fois
                const isFirstTime = await GamificationModel.isFirstTimeExercise(data.exerciseId);
                
                if (isFirstTime) {
                    // XP pour nouvel exercice
                    await GamificationModel.addXP(15, 'first_time_exercise');
                    
                    // Vérifier les badges d'exploration
                    const explorerBadges = await GamificationModel.checkBadges(['exercise_explorer']);
                    
                    explorerBadges.forEach(badge => {
                        queueAnimation({
                            type: 'badge-earned',
                            data: { badge }
                        });
                    });
                }
                
                // Marquer l'exercice comme utilisé
                await GamificationModel.markExerciseAsUsed(data.exerciseId);
            }
        } catch (error) {
            console.error('❌ Erreur traitement exercice utilisé :', error);
        }
    }

    /**
     * Ajouter une animation à la queue
     */
    function queueAnimation(animation) {
        animationQueue.push(animation);
        processAnimationQueue();
    }

    /**
     * Traiter la queue d'animations
     */
    async function processAnimationQueue() {
        if (isProcessingAnimations || animationQueue.length === 0) {
            return;
        }
        
        isProcessingAnimations = true;
        
        while (animationQueue.length > 0) {
            const animation = animationQueue.shift();
            await processAnimation(animation);
            
            // Attendre entre les animations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        isProcessingAnimations = false;
    }

    /**
     * Traiter une animation
     */
    async function processAnimation(animation) {
        try {
            switch (animation.type) {
                case 'level-up':
                    await showLevelUpModal(animation.data);
                    break;
                    
                case 'badge-earned':
                    await showBadgeEarnedModal(animation.data);
                    break;
                    
                case 'challenge-completed':
                    await showChallengeCompletedModal(animation.data);
                    break;
                    
                default:
                    console.warn('⚠️ Type d\'animation inconnue :', animation.type);
            }
            
            // Émettre l'événement correspondant
            if (typeof EventBus !== 'undefined') {
                EventBus.emit(`gamification:${animation.type.replace('-', '_')}`, animation.data);
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement animation :', error);
        }
    }

    /**
     * Afficher la modal de level up
     */
    async function showLevelUpModal(data) {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🎉 Niveau supérieur !',
                    content: renderLevelUpModal(data),
                    actions: [
                        { text: 'Formidable !', type: 'primary', handler: () => ModalManager.hide() }
                    ],
                    size: 'medium',
                    className: 'level-up-modal'
                });
            } else {
                // Fallback notification
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(
                        `🎉 Niveau ${data.newLevel} atteint ! ${data.newTitle}`,
                        5000
                    );
                }
            }
        } catch (error) {
            console.error('❌ Erreur modal level up :', error);
        }
    }

    /**
     * Rendre la modal de level up
     */
    function renderLevelUpModal(data) {
        return `
            <div class="level-up-content">
                <div class="level-up-animation">
                    <div class="level-number">${data.newLevel}</div>
                    <div class="level-rays"></div>
                </div>
                
                <div class="level-up-info">
                    <h3>Niveau ${data.newLevel} atteint !</h3>
                    <p class="new-title">${data.newTitle}</p>
                    <p class="level-description">
                        Félicitations ! Votre dévouement à l'entraînement vous permet de gravir
                        les échelons de la hiérarchie des guerriers.
                    </p>
                </div>
                
                <div class="level-rewards">
                    <h4>Récompenses débloquées :</h4>
                    <ul>
                        <li>Nouveau titre de prestige</li>
                        <li>Accès à de nouveaux défis</li>
                        <li>Bonus XP permanent</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Afficher la modal de badge
     */
    async function showBadgeEarnedModal(data) {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🎖️ Nouveau badge !',
                    content: renderBadgeEarnedModal(data),
                    actions: [
                        { text: 'Voir mes badges', type: 'secondary', handler: () => {
                            ModalManager.hide();
                            navigateToBadges();
                        }},
                        { text: 'Continuer', type: 'primary', handler: () => ModalManager.hide() }
                    ],
                    size: 'medium',
                    className: 'badge-earned-modal'
                });
            } else {
                // Fallback notification
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(
                        `🎖️ Nouveau badge : ${data.badge.name} !`,
                        4000
                    );
                }
            }
        } catch (error) {
            console.error('❌ Erreur modal badge :', error);
        }
    }

    /**
     * Rendre la modal de badge
     */
    function renderBadgeEarnedModal(data) {
        const badge = data.badge;
        return `
            <div class="badge-earned-content">
                <div class="badge-animation">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-glow"></div>
                </div>
                
                <div class="badge-info">
                    <h3>${badge.name}</h3>
                    <p class="badge-description">${badge.description}</p>
                    
                    <div class="badge-stats">
                        <div class="badge-stat">
                            <span class="stat-label">Catégorie</span>
                            <span class="stat-value">${formatBadgeCategory(badge.category)}</span>
                        </div>
                        <div class="badge-stat">
                            <span class="stat-label">Rareté</span>
                            <span class="stat-value">${formatBadgeRarity(badge.rarity)}</span>
                        </div>
                        <div class="badge-stat">
                            <span class="stat-label">Date</span>
                            <span class="stat-value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Afficher la modal de défi complété
     */
    async function showChallengeCompletedModal(data) {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '⚔️ Défi complété !',
                    content: renderChallengeCompletedModal(data),
                    actions: [
                        { text: 'Voir mes défis', type: 'secondary', handler: () => {
                            ModalManager.hide();
                            navigateToChallenges();
                        }},
                        { text: 'Excellent !', type: 'primary', handler: () => ModalManager.hide() }
                    ],
                    size: 'medium',
                    className: 'challenge-completed-modal'
                });
            } else {
                // Fallback notification
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(
                        `⚔️ Défi complété : ${data.challenge.name} !`,
                        4000
                    );
                }
            }
        } catch (error) {
            console.error('❌ Erreur modal défi :', error);
        }
    }

    /**
     * Rendre la modal de défi complété
     */
    function renderChallengeCompletedModal(data) {
        const challenge = data.challenge;
        return `
            <div class="challenge-completed-content">
                <div class="challenge-animation">
                    <div class="challenge-icon">${challenge.icon}</div>
                    <div class="challenge-particles"></div>
                </div>
                
                <div class="challenge-info">
                    <h3>${challenge.name}</h3>
                    <p class="challenge-description">${challenge.description}</p>
                    
                    <div class="challenge-reward">
                        <div class="reward-icon">⭐</div>
                        <div class="reward-text">
                            <strong>+${challenge.xpReward || 100} XP</strong>
                            <span>Récompense gagnée</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Naviguer vers les badges
     */
    function navigateToBadges() {
        if (typeof Router !== 'undefined') {
            Router.navigate('gamification').then(() => {
                // Simuler le clic sur l'onglet badges
                setTimeout(() => {
                    const badgeTab = document.querySelector('[data-tab="badges"]');
                    if (badgeTab) {
                        badgeTab.click();
                    }
                }, 100);
            });
        }
    }

    /**
     * Naviguer vers les défis
     */
    function navigateToChallenges() {
        if (typeof Router !== 'undefined') {
            Router.navigate('gamification').then(() => {
                // Simuler le clic sur l'onglet défis
                setTimeout(() => {
                    const challengeTab = document.querySelector('[data-tab="challenges"]');
                    if (challengeTab) {
                        challengeTab.click();
                    }
                }, 100);
            });
        }
    }

    /**
     * Gérer une demande d'animation
     */
    function handleAnimationRequest(data) {
        queueAnimation(data);
    }

    /**
     * Formater la catégorie de badge
     */
    function formatBadgeCategory(category) {
        const categories = {
            'regularity': 'Régularité',
            'performance': 'Performance',
            'exploration': 'Exploration',
            'progression': 'Progression'
        };
        return categories[category] || category;
    }

    /**
     * Formater la rareté de badge
     */
    function formatBadgeRarity(rarity) {
        const rarities = {
            'common': 'Commun',
            'uncommon': 'Peu commun',
            'rare': 'Rare',
            'epic': 'Épique',
            'legendary': 'Légendaire'
        };
        return rarities[rarity] || rarity;
    }

    /**
     * Mettre à jour la navigation active
     */
    function updateActiveNavigation(section) {
        try {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
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
                        <h2>⚠️ Gamification non disponible</h2>
                        <p>Le module de gamification n'est pas encore chargé.</p>
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
                        <h2>❌ Erreur Gamification</h2>
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
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasView: typeof GamificationView !== 'undefined',
            animationQueueLength: animationQueue.length,
            isProcessingAnimations
        };
    }

    // Interface publique
    return {
        init,
        renderGamification,
        handleSessionCompleted,
        handleExerciseUsed,
        queueAnimation,
        showLevelUpModal,
        showBadgeEarnedModal,
        showChallengeCompletedModal,
        getInitializationStatus
    };
})();

// Export global
window.GamificationController = GamificationController;