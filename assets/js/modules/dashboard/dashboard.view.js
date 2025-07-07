/**
 * SmartTrack - Vue Dashboard
 * Interface principale avec statistiques et gamification
 */

const DashboardView = (function() {
    let playerData = null;
    let analyticsData = null;
    let currentSession = null;
    let currentProgram = null;

    /**
     * Initialiser la vue
     */
    function init() {
        console.log('🎨 Initialisation DashboardView...');
        
        // Écouter les événements
        if (typeof EventBus !== 'undefined') {
            EventBus.on('gamification:player-updated', handlePlayerUpdated);
            EventBus.on('gamification:xp-gained', handleXpGained);
            EventBus.on('gamification:level-up', handleLevelUp);
            EventBus.on('gamification:badge-unlocked', handleBadgeUnlocked);
            EventBus.on('sessions:current-updated', handleSessionUpdated);
            EventBus.on('programs:started', handleProgramStarted);
            EventBus.on('analytics:updated', handleAnalyticsUpdated);
        }
    }

    /**
     * Rendre le dashboard
     */
    async function render() {
        const container = document.getElementById('app-content');
        if (!container) return;

        // Charger les données nécessaires
        await loadDashboardData();

        container.innerHTML = `
            <div class="screen dashboard-screen" id="screen-dashboard">
                <header class="dashboard-header">
                    <div class="welcome-section">
                        <h1 class="welcome-title">
                            <span class="welcome-icon">⚔️</span>
                            Bienvenue au QG
                        </h1>
                        <p class="welcome-subtitle">Votre centre de commandement pour l'entraînement</p>
                    </div>
                    
                    <!-- Profil Joueur -->
                    <div class="player-profile" id="player-profile">
                        ${renderPlayerProfile()}
                    </div>
                </header>

                <div class="dashboard-content">
                    <!-- Section Session Active -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>🎯 Session Active</h2>
                        </div>
                        <div id="active-session" class="active-session-card">
                            ${renderActiveSession()}
                        </div>
                    </div>

                    <!-- Stats Rapides -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>📊 Statistiques Rapides</h2>
                        </div>
                        <div class="quick-stats">
                            ${renderQuickStats()}
                        </div>
                    </div>

                    <!-- Programmes et Templates -->
                    <div class="dashboard-grid">
                        <!-- Programme Actuel -->
                        <div class="dashboard-section">
                            <div class="section-header">
                                <h2>📚 Programme Actuel</h2>
                                ${!currentProgram ? `<button class="btn btn-sm btn-secondary" onclick="DashboardView.goToPrograms()">Parcourir</button>` : ''}
                            </div>
                            <div id="current-program" class="program-card">
                                ${renderCurrentProgram()}
                            </div>
                        </div>

                        <!-- Exercices Favoris -->
                        <div class="dashboard-section">
                            <div class="section-header">
                                <h2>🏋️ Exercices Favoris</h2>
                                <button class="btn btn-sm btn-secondary" onclick="DashboardView.goToExercises()">Voir tout</button>
                            </div>
                            <div id="favorite-exercises" class="favorite-exercises">
                                ${renderFavoriteExercises()}
                            </div>
                        </div>
                    </div>

                    <!-- Gamification -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>🏆 Achievements & Progression</h2>
                            <button class="btn btn-sm btn-secondary" onclick="DashboardView.goToGamification()">Voir tout</button>
                        </div>
                        <div class="gamification-overview">
                            ${renderGamificationOverview()}
                        </div>
                    </div>

                    <!-- Actions Rapides -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>⚡ Actions Rapides</h2>
                        </div>
                        <div class="quick-actions">
                            ${renderQuickActions()}
                        </div>
                    </div>

                    <!-- Activité Récente -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>📈 Activité Récente</h2>
                            <button class="btn btn-sm btn-secondary" onclick="DashboardView.goToHistory()">Historique complet</button>
                        </div>
                        <div id="recent-activity" class="recent-activity">
                            ${renderRecentActivity()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Démarrer les mises à jour en temps réel
        startRealTimeUpdates();
    }

    /**
     * Charger les données du dashboard
     */
    async function loadDashboardData() {
        try {
            // Charger les données du joueur
            if (typeof GamificationModel !== 'undefined') {
                playerData = await GamificationModel.getPlayerData();
            }

            // Charger les analytics
            if (typeof AnalyticsModel !== 'undefined') {
                analyticsData = await AnalyticsModel.getOverviewStats();
            }

            // Charger la session courante
            if (typeof SessionsModel !== 'undefined') {
                currentSession = await SessionsModel.getCurrentSession();
            }

            // Charger le programme actuel
            if (typeof ProgramsModel !== 'undefined') {
                currentProgram = await ProgramsModel.getCurrentProgram();
            }

        } catch (error) {
            console.error('❌ Erreur chargement données dashboard :', error);
        }
    }

    /**
     * Rendre le profil du joueur
     */
    function renderPlayerProfile() {
        if (!playerData) {
            return `
                <div class="player-profile-card">
                    <div class="player-info">
                        <h3>Nouveau Guerrier</h3>
                        <p>Commencez votre aventure !</p>
                    </div>
                    <div class="player-level">
                        <span class="level-badge">Niveau 1</span>
                    </div>
                </div>
            `;
        }

        const levelProgress = GamificationModel.getLevelProgress();

        return `
            <div class="player-profile-card">
                <div class="player-info">
                    <h3>Guerrier Niveau ${playerData.level}</h3>
                    <div class="xp-bar">
                        <div class="xp-progress" style="width: ${levelProgress.percentage}%"></div>
                        <span class="xp-text">${levelProgress.current} / ${levelProgress.required} XP</span>
                    </div>
                    <div class="player-stats">
                        <span class="stat">
                            <span class="stat-icon">🔥</span>
                            <span>Série: ${playerData.stats.currentStreak} jours</span>
                        </span>
                        <span class="stat">
                            <span class="stat-icon">🏆</span>
                            <span>${playerData.badges.length} badges</span>
                        </span>
                    </div>
                </div>
                <div class="player-level">
                    <span class="level-badge level-${Math.min(playerData.level, 10)}">
                        Niveau ${playerData.level}
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la session active
     */
    function renderActiveSession() {
        if (!currentSession) {
            return `
                <div class="no-active-session">
                    <div class="empty-icon">⚔️</div>
                    <h3>Aucune session active</h3>
                    <p>Prêt pour un nouvel entraînement ?</p>
                    <div class="session-actions">
                        <button class="btn btn-primary" onclick="DashboardView.startNewSession()">
                            <span>⚔️</span>
                            Commencer une session
                        </button>
                        <button class="btn btn-secondary" onclick="DashboardView.goToPreparation()">
                            <span>📋</span>
                            Préparer une session
                        </button>
                    </div>
                </div>
            `;
        }

        const exerciseCount = currentSession.exercises ? currentSession.exercises.length : 0;
        const completedExercises = currentSession.exercises ? 
            currentSession.exercises.filter(ex => ex.completed).length : 0;

        return `
            <div class="active-session-info">
                <div class="session-header">
                    <h3>${currentSession.name}</h3>
                    <span class="session-status status-${currentSession.status}">
                        ${getStatusIcon(currentSession.status)} ${getStatusText(currentSession.status)}
                    </span>
                </div>
                
                <div class="session-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${exerciseCount > 0 ? (completedExercises / exerciseCount) * 100 : 0}%"></div>
                    </div>
                    <span class="progress-text">${completedExercises} / ${exerciseCount} exercices</span>
                </div>
                
                <div class="session-actions">
                    ${currentSession.status === 'preparation' ? `
                        <button class="btn btn-primary" onclick="DashboardView.continueSession()">
                            <span>▶️</span>
                            Démarrer l'entraînement
                        </button>
                        <button class="btn btn-secondary" onclick="DashboardView.goToPreparation()">
                            <span>📝</span>
                            Modifier
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="DashboardView.continueSession()">
                            <span>⚔️</span>
                            Continuer l'entraînement
                        </button>
                        <button class="btn btn-secondary" onclick="DashboardView.pauseSession()">
                            <span>⏸️</span>
                            Pause
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Rendre les statistiques rapides
     */
    function renderQuickStats() {
        if (!analyticsData) {
            return `
                <div class="quick-stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <span class="stat-value">Pas de données</span>
                        <span class="stat-label">Commencez votre première session !</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="quick-stat-card">
                <div class="stat-icon">⚔️</div>
                <div class="stat-info">
                    <span class="stat-value">${analyticsData.totalSessions}</span>
                    <span class="stat-label">Sessions</span>
                </div>
            </div>
            
            <div class="quick-stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <span class="stat-value">${analyticsData.currentStreak}</span>
                    <span class="stat-label">Série actuelle</span>
                </div>
            </div>
            
            <div class="quick-stat-card">
                <div class="stat-icon">💪</div>
                <div class="stat-info">
                    <span class="stat-value">${analyticsData.totalSets}</span>
                    <span class="stat-label">Sets complétés</span>
                </div>
            </div>
            
            <div class="quick-stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-info">
                    <span class="stat-value">${Utils.formatDuration(analyticsData.totalDuration)}</span>
                    <span class="stat-label">Temps total</span>
                </div>
            </div>
        `;
    }

    /**
     * Rendre le programme actuel
     */
    function renderCurrentProgram() {
        if (!currentProgram) {
            return `
                <div class="no-program">
                    <div class="empty-icon">📚</div>
                    <h3>Aucun programme actif</h3>
                    <p>Suivez un programme structuré pour de meilleurs résultats !</p>
                    <button class="btn btn-primary btn-sm" onclick="DashboardView.goToPrograms()">
                        <span>📚</span>
                        Parcourir les programmes
                    </button>
                </div>
            `;
        }

        const progressPercent = currentProgram.progress.totalSessions > 0 ? 
            (currentProgram.progress.completedSessions / currentProgram.progress.totalSessions) * 100 : 0;

        return `
            <div class="program-info">
                <h3>${currentProgram.name}</h3>
                <p class="program-description">${currentProgram.description || 'Programme d\'entraînement personnalisé'}</p>
                
                <div class="program-progress">
                    <div class="progress-header">
                        <span>Semaine ${currentProgram.progress.currentWeek}</span>
                        <span>Session ${currentProgram.progress.currentSession}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="progress-text">
                        ${currentProgram.progress.completedSessions} / ${currentProgram.progress.totalSessions} sessions
                    </span>
                </div>
                
                <div class="program-actions">
                    <button class="btn btn-primary btn-sm" onclick="DashboardView.continueProgram()">
                        <span>▶️</span>
                        Prochaine session
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="DashboardView.pauseProgram()">
                        <span>⏸️</span>
                        Suspendre
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les exercices favoris
     */
    function renderFavoriteExercises() {
        // Pour l'instant, afficher des exercices statiques
        // TODO: Implémenter la logique des exercices favoris
        return `
            <div class="favorite-exercise-item" onclick="DashboardView.addExerciseToSession('curl-biceps')">
                <span class="exercise-icon">💪</span>
                <span class="exercise-name">Curl biceps</span>
                <span class="exercise-add">+</span>
            </div>
            
            <div class="favorite-exercise-item" onclick="DashboardView.addExerciseToSession('push-ups')">
                <span class="exercise-icon">🛡️</span>
                <span class="exercise-name">Pompes</span>
                <span class="exercise-add">+</span>
            </div>
            
            <div class="favorite-exercise-item" onclick="DashboardView.addExerciseToSession('squats')">
                <span class="exercise-icon">🦵</span>
                <span class="exercise-name">Squats</span>
                <span class="exercise-add">+</span>
            </div>
            
            <div class="show-more" onclick="DashboardView.goToExercises()">
                <span>Voir tous les exercices →</span>
            </div>
        `;
    }

    /**
     * Rendre l'aperçu de gamification
     */
    function renderGamificationOverview() {
        if (!playerData) {
            return `
                <div class="gamification-card">
                    <h3>🎮 Système de progression</h3>
                    <p>Gagnez de l'XP et débloquez des badges en vous entraînant !</p>
                </div>
            `;
        }

        const recentBadges = playerData.badges.slice(-3); // 3 derniers badges

        return `
            <div class="gamification-grid">
                <div class="gamification-card xp-card">
                    <h4>💫 Expérience</h4>
                    <div class="xp-info">
                        <span class="xp-total">${playerData.totalXp} XP</span>
                        <span class="xp-level">Niveau ${playerData.level}</span>
                    </div>
                    <div class="xp-progress">
                        <div class="xp-bar">
                            <div class="xp-fill" style="width: ${GamificationModel.getLevelProgress().percentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="gamification-card badges-card">
                    <h4>🏆 Badges</h4>
                    <div class="badges-overview">
                        <span class="badges-count">${playerData.badges.length} badges</span>
                        <div class="recent-badges">
                            ${recentBadges.length > 0 ? 
                                recentBadges.map(badgeId => `<span class="badge-icon">🏆</span>`).join('') :
                                '<span class="no-badges">Déverrouillez votre premier badge !</span>'
                            }
                        </div>
                    </div>
                </div>
                
                <div class="gamification-card stats-card">
                    <h4>📊 Statistiques</h4>
                    <div class="player-overview-stats">
                        <div class="stat-item">
                            <span class="stat-value">${playerData.stats.totalSessions}</span>
                            <span class="stat-label">Sessions</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${playerData.stats.currentStreak}</span>
                            <span class="stat-label">Série</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les actions rapides
     */
    function renderQuickActions() {
        return `
            <div class="quick-action" onclick="DashboardView.startNewSession()">
                <div class="action-icon">⚔️</div>
                <div class="action-info">
                    <h4>Nouvelle Session</h4>
                    <p>Commencer un entraînement immédiatement</p>
                </div>
            </div>
            
            <div class="quick-action" onclick="DashboardView.goToPreparation()">
                <div class="action-icon">📋</div>
                <div class="action-info">
                    <h4>Préparer Session</h4>
                    <p>Planifier et personnaliser votre entraînement</p>
                </div>
            </div>
            
            <div class="quick-action" onclick="DashboardView.goToExercises()">
                <div class="action-icon">🏋️</div>
                <div class="action-info">
                    <h4>Exercices</h4>
                    <p>Parcourir l'arsenal d'exercices</p>
                </div>
            </div>
            
            <div class="quick-action" onclick="DashboardView.goToAnalytics()">
                <div class="action-icon">📈</div>
                <div class="action-info">
                    <h4>Analytics</h4>
                    <p>Voir vos progrès et statistiques</p>
                </div>
            </div>
            
            <div class="quick-action" onclick="DashboardView.testConfetti()">
                <div class="action-icon">🎉</div>
                <div class="action-info">
                    <h4>Test Confetti</h4>
                    <p>Tester les animations de célébration</p>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'activité récente
     */
    function renderRecentActivity() {
        // TODO: Implémenter l'activité récente réelle
        return `
            <div class="activity-item">
                <div class="activity-icon">⚔️</div>
                <div class="activity-info">
                    <h4>Bienvenue dans SmartTrack !</h4>
                    <p>Votre application de suivi d'entraînement est prête.</p>
                    <span class="activity-time">Maintenant</span>
                </div>
            </div>
            
            <div class="activity-placeholder">
                <p>Votre activité récente apparaîtra ici après vos premiers entraînements.</p>
            </div>
        `;
    }

    /**
     * Démarrer les mises à jour en temps réel
     */
    function startRealTimeUpdates() {
        // Mettre à jour les données toutes les 30 secondes
        setInterval(async () => {
            await updateDashboardData();
        }, 30000);
    }

    /**
     * Mettre à jour les données du dashboard
     */
    async function updateDashboardData() {
        try {
            // Recharger les données
            await loadDashboardData();
            
            // Mettre à jour les sections spécifiques
            updatePlayerProfile();
            updateActiveSession();
            updateQuickStats();
            
        } catch (error) {
            console.error('❌ Erreur mise à jour dashboard :', error);
        }
    }

    /**
     * Mettre à jour le profil du joueur
     */
    function updatePlayerProfile() {
        const profileElement = document.getElementById('player-profile');
        if (profileElement) {
            profileElement.innerHTML = renderPlayerProfile();
        }
    }

    /**
     * Mettre à jour la session active
     */
    function updateActiveSession() {
        const sessionElement = document.getElementById('active-session');
        if (sessionElement) {
            sessionElement.innerHTML = renderActiveSession();
        }
    }

    /**
     * Mettre à jour les statistiques rapides
     */
    function updateQuickStats() {
        const statsElement = document.querySelector('.quick-stats');
        if (statsElement) {
            statsElement.innerHTML = renderQuickStats();
        }
    }

    // Actions du dashboard
    function startNewSession() {
        if (typeof Router !== 'undefined') {
            Router.navigate('preparation');
        }
    }

    function goToPreparation() {
        if (typeof Router !== 'undefined') {
            Router.navigate('preparation');
        }
    }

    function goToExercises() {
        if (typeof Router !== 'undefined') {
            Router.navigate('exercises');
        }
    }

    function goToPrograms() {
        if (typeof Router !== 'undefined') {
            Router.navigate('programs');
        }
    }

    function goToGamification() {
        if (typeof Router !== 'undefined') {
            Router.navigate('gamification');
        }
    }

    function goToAnalytics() {
        if (typeof Router !== 'undefined') {
            Router.navigate('analytics');
        }
    }

    function goToHistory() {
        if (typeof Router !== 'undefined') {
            Router.navigate('history');
        }
    }

    function continueSession() {
        if (typeof Router !== 'undefined') {
            Router.navigate('live-session');
        }
    }

    function pauseSession() {
        // TODO: Implémenter la pause de session
        console.log('Pause session');
    }

    function continueProgram() {
        // TODO: Implémenter la continuation de programme
        console.log('Continue program');
    }

    function pauseProgram() {
        // TODO: Implémenter la pause de programme
        console.log('Pause program');
    }

    function addExerciseToSession(exerciseId) {
        // TODO: Implémenter l'ajout d'exercice
        console.log('Add exercise to session:', exerciseId);
    }

    function testConfetti() {
        if (typeof ConfettiManager !== 'undefined') {
            // Tester différents types de confetti avec un délai
            ConfettiManager.trigger('victory');
            
            setTimeout(() => {
                ConfettiManager.trigger('levelUp');
            }, 800);
            
            setTimeout(() => {
                ConfettiManager.trigger('badge');
            }, 1600);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('🎉 Confettis de test lancés !', 'info');
            }
        } else {
            console.warn('⚠️ ConfettiManager non disponible');
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('⚠️ Module confetti non disponible', 'warning');
            }
        }
    }

    // Fonctions utilitaires
    function getStatusIcon(status) {
        const icons = {
            'preparation': '📝',
            'active': '⚔️',
            'completed': '✅',
            'paused': '⏸️'
        };
        return icons[status] || '❓';
    }

    function getStatusText(status) {
        const texts = {
            'preparation': 'En préparation',
            'active': 'Active',
            'completed': 'Terminée',
            'paused': 'En pause'
        };
        return texts[status] || 'Inconnu';
    }

    // Gestionnaires d'événements
    function handlePlayerUpdated(data) {
        playerData = data.player;
        updatePlayerProfile();
    }

    function handleXpGained(data) {
        // TODO: Animer le gain d'XP
        console.log('XP gained:', data);
    }

    function handleLevelUp(data) {
        // TODO: Animer la montée de niveau
        console.log('Level up:', data);
    }

    function handleBadgeUnlocked(data) {
        // TODO: Animer le déblocage de badge
        console.log('Badge unlocked:', data);
    }

    function handleSessionUpdated(data) {
        currentSession = data.session;
        updateActiveSession();
    }

    function handleProgramStarted(data) {
        currentProgram = data.program;
        // Recharger la section programme
        const programElement = document.getElementById('current-program');
        if (programElement) {
            programElement.innerHTML = renderCurrentProgram();
        }
    }

    function handleAnalyticsUpdated(data) {
        analyticsData = data.analytics;
        updateQuickStats();
    }

    // Interface publique
    return {
        init,
        render,
        startNewSession,
        goToPreparation,
        goToExercises,
        goToPrograms,
        goToGamification,
        goToAnalytics,
        goToHistory,
        continueSession,
        pauseSession,
        continueProgram,
        pauseProgram,
        addExerciseToSession,
        testConfetti
    };
})();

// Export global
window.DashboardView = DashboardView;