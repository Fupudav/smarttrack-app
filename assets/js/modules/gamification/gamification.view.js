/**
 * SmartTrack - Vue Gamification
 * Interface pour le système de gamification, badges et défis
 */

const GamificationView = (function() {
    let isInitialized = false;
    let currentTab = 'profile';
    let currentBadgeFilter = 'all';
    let playerStats = {};

    /**
     * Initialiser la vue
     */
    function init() {
        try {
            console.log('🏆 Initialisation GamificationView...');
            
            // Écouter les événements
            if (typeof EventBus !== 'undefined') {
                EventBus.on('gamification:level-up', handleLevelUp);
                EventBus.on('gamification:badge-earned', handleBadgeEarned);
                EventBus.on('gamification:challenge-completed', handleChallengeCompleted);
                EventBus.on('gamification:stats-updated', handleStatsUpdated);
            }
            
            isInitialized = true;
            console.log('✓ GamificationView initialisée');
            
        } catch (error) {
            console.error('❌ Erreur initialisation GamificationView :', error);
            throw error;
        }
    }

    /**
     * Rendre l'interface gamification
     */
    async function render() {
        try {
            console.log('🎨 Rendu Gamification...');
            
            const container = document.getElementById('app-content');
            if (!container) {
                throw new Error('Container app-content non trouvé');
            }
            
            container.innerHTML = await renderGamificationScreen();
            
            // Initialiser les événements et données
            await initializeGamification();
            
            console.log('✓ Gamification rendu');
            
        } catch (error) {
            console.error('❌ Erreur rendu Gamification :', error);
            showErrorScreen('Erreur lors du chargement de la gamification');
        }
    }

    /**
     * Rendre l'écran gamification
     */
    async function renderGamificationScreen() {
        return `
            <div class="screen gamification-screen">
                <div class="screen-header">
                    <div class="header-content">
                        <h1 class="screen-title">
                            <span class="title-icon">🏆</span>
                            Hall des Exploits
                        </h1>
                        <p class="screen-subtitle">Votre progression et accomplissements</p>
                    </div>
                </div>
                
                <div class="gamification-tabs">
                    ${renderNavigationTabs()}
                </div>
                
                <div class="gamification-content">
                    <div class="tab-content active" data-tab="profile">
                        ${renderProfileTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="badges">
                        ${renderBadgesTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="challenges">
                        ${renderChallengesTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="stats">
                        ${renderStatsTab()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les onglets de navigation
     */
    function renderNavigationTabs() {
        return `
            <div class="tab-nav">
                <button class="tab-btn ${currentTab === 'profile' ? 'active' : ''}" 
                        data-tab="profile">
                    <span class="tab-icon">👤</span>
                    <span class="tab-label">Profil</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'badges' ? 'active' : ''}" 
                        data-tab="badges">
                    <span class="tab-icon">🎖️</span>
                    <span class="tab-label">Badges</span>
                    <span class="tab-badge" id="badges-count">0</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'challenges' ? 'active' : ''}" 
                        data-tab="challenges">
                    <span class="tab-icon">⚔️</span>
                    <span class="tab-label">Défis</span>
                    <span class="tab-badge" id="challenges-count">0</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'stats' ? 'active' : ''}" 
                        data-tab="stats">
                    <span class="tab-icon">📊</span>
                    <span class="tab-label">Statistiques</span>
                </button>
            </div>
        `;
    }

    /**
     * Rendre l'onglet profil
     */
    function renderProfileTab() {
        return `
            <div class="profile-section">
                <div class="player-card">
                    <div class="player-avatar">
                        <div class="avatar-icon">⚔️</div>
                        <div class="level-badge" id="player-level">1</div>
                    </div>
                    
                    <div class="player-info">
                        <div class="player-title" id="player-title">Apprenti de la Forge</div>
                        <div class="player-name">Guerrier SmartTrack</div>
                        <div class="player-stats-mini">
                            <span>🔥 <span id="streak-display">0</span> jours</span>
                            <span>🎯 <span id="sessions-display">0</span> sessions</span>
                        </div>
                    </div>
                    
                    <div class="level-progress">
                        <div class="xp-bar">
                            <div class="xp-fill" id="xp-progress" style="width: 0%"></div>
                        </div>
                        <div class="xp-text">
                            <span id="current-xp">0</span> / <span id="next-level-xp">100</span> XP
                        </div>
                    </div>
                </div>
                
                <div class="achievements-overview">
                    <h3>🏆 Accomplissements récents</h3>
                    <div class="recent-achievements" id="recent-achievements">
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>Chargement des accomplissements...</p>
                        </div>
                    </div>
                </div>
                
                <div class="progress-highlights">
                    <h3>📈 Faits marquants</h3>
                    <div class="highlights-grid">
                        <div class="highlight-card">
                            <div class="highlight-icon">🎖️</div>
                            <div class="highlight-info">
                                <span class="highlight-value" id="total-badges">0</span>
                                <span class="highlight-label">Badges débloqués</span>
                            </div>
                        </div>
                        
                        <div class="highlight-card">
                            <div class="highlight-icon">⭐</div>
                            <div class="highlight-info">
                                <span class="highlight-value" id="total-xp">0</span>
                                <span class="highlight-label">XP total gagné</span>
                            </div>
                        </div>
                        
                        <div class="highlight-card">
                            <div class="highlight-icon">🔥</div>
                            <div class="highlight-info">
                                <span class="highlight-value" id="best-streak">0</span>
                                <span class="highlight-label">Meilleure série</span>
                            </div>
                        </div>
                        
                        <div class="highlight-card">
                            <div class="highlight-icon">🏋️</div>
                            <div class="highlight-info">
                                <span class="highlight-value" id="total-exercises">0</span>
                                <span class="highlight-label">Exercices maîtrisés</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="weekly-summary">
                    <h3>📅 Résumé de la semaine</h3>
                    <div class="week-chart" id="week-chart">
                        <div class="week-day" data-day="0">
                            <div class="day-label">Dim</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="1">
                            <div class="day-label">Lun</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="2">
                            <div class="day-label">Mar</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="3">
                            <div class="day-label">Mer</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="4">
                            <div class="day-label">Jeu</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="5">
                            <div class="day-label">Ven</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                        <div class="week-day" data-day="6">
                            <div class="day-label">Sam</div>
                            <div class="day-bar"><div class="bar-fill" style="height: 0%"></div></div>
                            <div class="day-value">0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'onglet badges
     */
    function renderBadgesTab() {
        return `
            <div class="badges-section">
                <div class="badges-header">
                    <h3>🎖️ Collection de badges</h3>
                    <div class="badges-filters">
                        ${renderBadgeFilters()}
                    </div>
                </div>
                
                <div class="badges-stats">
                    <div class="badge-progress">
                        <span>Progression : </span>
                        <span id="badges-progress">0 / 0</span>
                        <div class="progress-bar">
                            <div class="progress-fill" id="badges-progress-bar" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="badges-grid" id="badges-grid">
                    <div class="loading-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Chargement des badges...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les filtres de badges
     */
    function renderBadgeFilters() {
        return `
            <div class="filter-buttons">
                <button class="filter-btn ${currentBadgeFilter === 'all' ? 'active' : ''}" 
                        data-filter="all">
                    Tous
                </button>
                <button class="filter-btn ${currentBadgeFilter === 'earned' ? 'active' : ''}" 
                        data-filter="earned">
                    Débloqués
                </button>
                <button class="filter-btn ${currentBadgeFilter === 'locked' ? 'active' : ''}" 
                        data-filter="locked">
                    Verrouillés
                </button>
                <button class="filter-btn ${currentBadgeFilter === 'regularity' ? 'active' : ''}" 
                        data-filter="regularity">
                    Régularité
                </button>
                <button class="filter-btn ${currentBadgeFilter === 'performance' ? 'active' : ''}" 
                        data-filter="performance">
                    Performance
                </button>
            </div>
        `;
    }

    /**
     * Rendre l'onglet défis
     */
    function renderChallengesTab() {
        return `
            <div class="challenges-section">
                <div class="challenges-header">
                    <h3>⚔️ Défis hebdomadaires</h3>
                    <div class="week-info">
                        <span>Semaine du </span>
                        <span id="current-week">-</span>
                    </div>
                </div>
                
                <div class="challenges-grid" id="challenges-grid">
                    <div class="loading-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Chargement des défis...</p>
                    </div>
                </div>
                
                <div class="challenge-rewards">
                    <h4>🎁 Récompenses de la semaine</h4>
                    <div class="rewards-summary" id="weekly-rewards">
                        <div class="reward-item">
                            <span class="reward-icon">⭐</span>
                            <span class="reward-text">XP gagnés : <span id="weekly-xp">0</span></span>
                        </div>
                        <div class="reward-item">
                            <span class="reward-icon">🏆</span>
                            <span class="reward-text">Défis réussis : <span id="completed-challenges">0</span></span>
                        </div>
                    </div>
                </div>
                
                <div class="challenge-history">
                    <h4>📜 Historique des défis</h4>
                    <div class="history-summary" id="challenge-history">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'onglet statistiques
     */
    function renderStatsTab() {
        return `
            <div class="stats-section">
                <div class="stats-overview">
                    <h3>📊 Statistiques de performance</h3>
                    
                    <div class="stats-grid">
                        <div class="stat-group">
                            <h4>🎯 Sessions</h4>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <span class="stat-label">Total des sessions</span>
                                    <span class="stat-value" id="total-sessions">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Temps d'entraînement</span>
                                    <span class="stat-value" id="total-training-time">0h 0m</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Moyenne par session</span>
                                    <span class="stat-value" id="avg-session-time">0m</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-group">
                            <h4>💪 Exercices</h4>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <span class="stat-label">Exercices différents</span>
                                    <span class="stat-value" id="unique-exercises">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Sets complétés</span>
                                    <span class="stat-value" id="total-sets">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Volume total</span>
                                    <span class="stat-value" id="total-volume">0 kg</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-group">
                            <h4>🔥 Régularité</h4>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <span class="stat-label">Série actuelle</span>
                                    <span class="stat-value" id="current-streak">0 jours</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Meilleure série</span>
                                    <span class="stat-value" id="best-streak-stat">0 jours</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Régularité mensuelle</span>
                                    <span class="stat-value" id="monthly-consistency">0%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-group">
                            <h4>🏆 Accomplissements</h4>
                            <div class="stat-items">
                                <div class="stat-item">
                                    <span class="stat-label">XP total</span>
                                    <span class="stat-value" id="total-xp-stat">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Badges débloqués</span>
                                    <span class="stat-value" id="earned-badges-stat">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Défis réussis</span>
                                    <span class="stat-value" id="completed-challenges-stat">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="progression-chart">
                    <h4>📈 Évolution du niveau</h4>
                    <div class="level-timeline" id="level-timeline">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                </div>
                
                <div class="activity-heatmap">
                    <h4>🗓️ Carte d'activité</h4>
                    <div class="heatmap-container" id="activity-heatmap">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialiser la gamification
     */
    async function initializeGamification() {
        try {
            // Attacher les événements
            attachEventListeners();
            
            // Charger les données initiales
            await loadGamificationData();
            
        } catch (error) {
            console.error('❌ Erreur initialisation gamification :', error);
        }
    }

    /**
     * Attacher les événements
     */
    function attachEventListeners() {
        try {
            // Onglets de navigation
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', handleTabChange);
            });
            
            // Filtres de badges
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', handleBadgeFilterChange);
            });
            
        } catch (error) {
            console.error('❌ Erreur événements gamification :', error);
        }
    }

    /**
     * Charger les données de gamification
     */
    async function loadGamificationData() {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // Charger les stats du joueur
                playerStats = await GamificationModel.getPlayerStats();
                updatePlayerProfile(playerStats);
                
                // Charger selon l'onglet actuel
                switch (currentTab) {
                    case 'profile':
                        await loadProfileData();
                        break;
                    case 'badges':
                        await loadBadgesData();
                        break;
                    case 'challenges':
                        await loadChallengesData();
                        break;
                    case 'stats':
                        await loadStatsData();
                        break;
                }
                
            } else {
                console.warn('⚠️ GamificationModel non disponible');
                showMockData();
            }
        } catch (error) {
            console.error('❌ Erreur chargement données gamification :', error);
            showMockData();
        }
    }

    /**
     * Mettre à jour le profil joueur
     */
    function updatePlayerProfile(stats) {
        try {
            // Niveau et titre
            const levelElement = document.getElementById('player-level');
            const titleElement = document.getElementById('player-title');
            
            if (levelElement) levelElement.textContent = stats.level || 1;
            if (titleElement) titleElement.textContent = stats.title || 'Apprenti de la Forge';
            
            // XP et progression
            const currentXPElement = document.getElementById('current-xp');
            const nextLevelXPElement = document.getElementById('next-level-xp');
            const xpProgressElement = document.getElementById('xp-progress');
            
            if (currentXPElement) currentXPElement.textContent = stats.currentXP || 0;
            if (nextLevelXPElement) nextLevelXPElement.textContent = stats.nextLevelXP || 100;
            if (xpProgressElement) {
                const percentage = ((stats.currentXP || 0) / (stats.nextLevelXP || 100)) * 100;
                xpProgressElement.style.width = `${percentage}%`;
            }
            
            // Statistiques mini
            const streakElement = document.getElementById('streak-display');
            const sessionsElement = document.getElementById('sessions-display');
            
            if (streakElement) streakElement.textContent = stats.currentStreak || 0;
            if (sessionsElement) sessionsElement.textContent = stats.totalSessions || 0;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour profil :', error);
        }
    }

    /**
     * Charger les données du profil
     */
    async function loadProfileData() {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // Accomplissements récents
                const recentAchievements = await GamificationModel.getRecentAchievements();
                updateRecentAchievements(recentAchievements);
                
                // Faits marquants
                const highlights = await GamificationModel.getHighlights();
                updateHighlights(highlights);
                
                // Activité de la semaine
                const weeklyActivity = await GamificationModel.getWeeklyActivity();
                updateWeeklyChart(weeklyActivity);
            }
        } catch (error) {
            console.error('❌ Erreur chargement profil :', error);
        }
    }

    /**
     * Charger les données des badges
     */
    async function loadBadgesData() {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const badges = await GamificationModel.getAllBadges();
                const filteredBadges = filterBadges(badges, currentBadgeFilter);
                updateBadgesGrid(filteredBadges);
                updateBadgesProgress(badges);
            }
        } catch (error) {
            console.error('❌ Erreur chargement badges :', error);
        }
    }

    /**
     * Afficher les données de simulation
     */
    function showMockData() {
        const mockStats = {
            level: 5,
            title: 'Guerrier Novice',
            currentXP: 45,
            nextLevelXP: 100,
            currentStreak: 3,
            totalSessions: 12,
            totalXP: 545,
            totalBadges: 8,
            bestStreak: 7,
            totalExercises: 24
        };
        
        updatePlayerProfile(mockStats);
        
        // Onglets de comptage
        const badgesCount = document.getElementById('badges-count');
        const challengesCount = document.getElementById('challenges-count');
        
        if (badgesCount) badgesCount.textContent = '8';
        if (challengesCount) challengesCount.textContent = '3';
    }

    /**
     * Gestionnaires d'événements
     */
    function handleTabChange(event) {
        const targetTab = event.target.closest('.tab-btn').dataset.tab;
        if (!targetTab || targetTab === currentTab) return;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-btn').classList.add('active');
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Mettre à jour l'état
        currentTab = targetTab;
        
        // Charger les données de l'onglet
        loadGamificationData();
    }

    function handleBadgeFilterChange(event) {
        const newFilter = event.target.dataset.filter;
        if (!newFilter || newFilter === currentBadgeFilter) return;
        
        // Mettre à jour les filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        currentBadgeFilter = newFilter;
        
        // Recharger les badges
        loadBadgesData();
    }

    // Gestionnaires d'événements EventBus
    function handleLevelUp(data) {
        console.log('🎉 Level Up détecté !', data);
        
        // Animation de level up
        showLevelUpAnimation(data.newLevel, data.newTitle);
        
        // Mettre à jour l'affichage
        updatePlayerProfile(data.playerStats);
    }

    function handleBadgeEarned(data) {
        console.log('🎖️ Nouveau badge débloqué !', data);
        
        // Animation de badge
        showBadgeEarnedAnimation(data.badge);
        
        // Mettre à jour l'affichage si on est sur l'onglet badges
        if (currentTab === 'badges') {
            loadBadgesData();
        }
    }

    function handleChallengeCompleted(data) {
        console.log('⚔️ Défi complété !', data);
        
        // Animation de défi
        showChallengeCompletedAnimation(data.challenge);
        
        // Mettre à jour l'affichage si on est sur l'onglet défis
        if (currentTab === 'challenges') {
            loadChallengesData();
        }
    }

    function handleStatsUpdated(data) {
        console.log('📊 Stats mises à jour');
        playerStats = data;
        updatePlayerProfile(data);
    }

    /**
     * Animations
     */
    function showLevelUpAnimation(newLevel, newTitle) {
        // Animation de level up avec modal ou notification
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`🎉 Niveau ${newLevel} atteint ! ${newTitle}`);
        }
    }

    function showBadgeEarnedAnimation(badge) {
        // Animation de nouveau badge
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`🎖️ Nouveau badge : ${badge.name} !`);
        }
    }

    function showChallengeCompletedAnimation(challenge) {
        // Animation de défi complété
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`⚔️ Défi complété : ${challenge.name} !`);
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
            currentTab,
            currentBadgeFilter,
            hasPlayerStats: Object.keys(playerStats).length > 0
        };
    }

    // Interface publique
    return {
        init,
        render,
        loadGamificationData,
        updatePlayerProfile,
        handleTabChange,
        handleBadgeFilterChange,
        getInitializationStatus
    };
})();

// Export global
window.GamificationView = GamificationView;