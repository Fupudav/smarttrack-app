/**
 * SmartTrack - Vue Analytics
 * Interface pour l'analyse des performances et statistiques avancées
 */

const AnalyticsView = (function() {
    let isInitialized = false;
    let currentPeriod = 'month';
    let currentChartType = 'sessions';
    let chartInstances = {};

    /**
     * Initialiser la vue
     */
    function init() {
        try {
            console.log('📊 Initialisation AnalyticsView...');
            
            // Écouter les événements
            if (typeof EventBus !== 'undefined') {
                EventBus.on('analytics:data-updated', handleDataUpdated);
                EventBus.on('analytics:chart-updated', handleChartUpdated);
            }
            
            isInitialized = true;
            console.log('✓ AnalyticsView initialisée');
            
        } catch (error) {
            console.error('❌ Erreur initialisation AnalyticsView :', error);
            throw error;
        }
    }

    /**
     * Rendre l'interface analytics
     */
    async function render() {
        try {
            console.log('🎨 Rendu Analytics...');
            
            const container = document.getElementById('app-content');
            if (!container) {
                throw new Error('Container app-content non trouvé');
            }
            
            container.innerHTML = await renderAnalyticsScreen();
            
            // Initialiser les événements et données
            await initializeAnalytics();
            
            console.log('✓ Analytics rendu');
            
        } catch (error) {
            console.error('❌ Erreur rendu Analytics :', error);
            showErrorScreen('Erreur lors du chargement des analytics');
        }
    }

    /**
     * Rendre l'écran analytics
     */
    async function renderAnalyticsScreen() {
        return `
            <div class="screen analytics-screen">
                <div class="screen-header">
                    <div class="header-content">
                        <h1 class="screen-title">
                            <span class="title-icon">📊</span>
                            Analytics
                        </h1>
                        <p class="screen-subtitle">Analyse de vos performances</p>
                    </div>
                    
                    <div class="analytics-controls">
                        ${renderPeriodSelector()}
                        ${renderExportButton()}
                    </div>
                </div>
                
                <div class="analytics-content">
                    ${renderOverviewStats()}
                    ${renderChartsSection()}
                    ${renderDetailedStats()}
                    ${renderProgressSection()}
                </div>
            </div>
        `;
    }

    /**
     * Rendre le sélecteur de période
     */
    function renderPeriodSelector() {
        return `
            <div class="period-selector">
                <button class="period-btn ${currentPeriod === 'week' ? 'active' : ''}" 
                        data-period="week">
                    Cette semaine
                </button>
                <button class="period-btn ${currentPeriod === 'month' ? 'active' : ''}" 
                        data-period="month">
                    Ce mois
                </button>
                <button class="period-btn ${currentPeriod === 'year' ? 'active' : ''}" 
                        data-period="year">
                    Cette année
                </button>
                <button class="period-btn ${currentPeriod === 'all' ? 'active' : ''}" 
                        data-period="all">
                    Tout
                </button>
            </div>
        `;
    }

    /**
     * Rendre le bouton d'export
     */
    function renderExportButton() {
        return `
            <div class="export-controls">
                <button class="btn btn-secondary export-btn" data-action="export">
                    <span class="btn-icon">📥</span>
                    Exporter
                </button>
            </div>
        `;
    }

    /**
     * Rendre les statistiques générales
     */
    function renderOverviewStats() {
        return `
            <div class="overview-stats">
                <div class="stats-grid">
                    <div class="stat-card" data-stat="sessions">
                        <div class="stat-header">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-title">Sessions</span>
                        </div>
                        <div class="stat-value" id="stat-sessions">-</div>
                        <div class="stat-change" id="stat-sessions-change">-</div>
                    </div>
                    
                    <div class="stat-card" data-stat="duration">
                        <div class="stat-header">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-title">Temps total</span>
                        </div>
                        <div class="stat-value" id="stat-duration">-</div>
                        <div class="stat-change" id="stat-duration-change">-</div>
                    </div>
                    
                    <div class="stat-card" data-stat="exercises">
                        <div class="stat-header">
                            <span class="stat-icon">💪</span>
                            <span class="stat-title">Exercices</span>
                        </div>
                        <div class="stat-value" id="stat-exercises">-</div>
                        <div class="stat-change" id="stat-exercises-change">-</div>
                    </div>
                    
                    <div class="stat-card" data-stat="volume">
                        <div class="stat-header">
                            <span class="stat-icon">⚖️</span>
                            <span class="stat-title">Volume</span>
                        </div>
                        <div class="stat-value" id="stat-volume">-</div>
                        <div class="stat-change" id="stat-volume-change">-</div>
                    </div>
                    
                    <div class="stat-card" data-stat="streak">
                        <div class="stat-header">
                            <span class="stat-icon">🔥</span>
                            <span class="stat-title">Série</span>
                        </div>
                        <div class="stat-value" id="stat-streak">-</div>
                        <div class="stat-change" id="stat-streak-change">-</div>
                    </div>
                    
                    <div class="stat-card" data-stat="avg-session">
                        <div class="stat-header">
                            <span class="stat-icon">📈</span>
                            <span class="stat-title">Moyenne/session</span>
                        </div>
                        <div class="stat-value" id="stat-avg-session">-</div>
                        <div class="stat-change" id="stat-avg-session-change">-</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la section des graphiques
     */
    function renderChartsSection() {
        return `
            <div class="charts-section">
                <div class="charts-header">
                    <h3>Évolution des performances</h3>
                    <div class="chart-controls">
                        ${renderChartTypeSelector()}
                    </div>
                </div>
                
                <div class="charts-grid">
                    <div class="chart-container main-chart">
                        <canvas id="main-chart" width="800" height="400"></canvas>
                    </div>
                    
                    <div class="chart-container muscle-chart">
                        <h4>Répartition par groupe musculaire</h4>
                        <canvas id="muscle-chart" width="400" height="400"></canvas>
                    </div>
                </div>
                
                <div class="secondary-charts">
                    <div class="chart-container weekly-chart">
                        <h4>Activité hebdomadaire</h4>
                        <canvas id="weekly-chart" width="600" height="300"></canvas>
                    </div>
                    
                    <div class="chart-container progress-chart">
                        <h4>Progression</h4>
                        <canvas id="progress-chart" width="600" height="300"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre le sélecteur de type de graphique
     */
    function renderChartTypeSelector() {
        return `
            <div class="chart-type-selector">
                <button class="chart-type-btn ${currentChartType === 'sessions' ? 'active' : ''}" 
                        data-chart="sessions">
                    Sessions
                </button>
                <button class="chart-type-btn ${currentChartType === 'duration' ? 'active' : ''}" 
                        data-chart="duration">
                    Durée
                </button>
                <button class="chart-type-btn ${currentChartType === 'volume' ? 'active' : ''}" 
                        data-chart="volume">
                    Volume
                </button>
                <button class="chart-type-btn ${currentChartType === 'exercises' ? 'active' : ''}" 
                        data-chart="exercises">
                    Exercices
                </button>
            </div>
        `;
    }

    /**
     * Rendre les statistiques détaillées
     */
    function renderDetailedStats() {
        return `
            <div class="detailed-stats">
                <div class="stats-tabs">
                    <button class="stats-tab active" data-tab="muscle-groups">
                        Groupes musculaires
                    </button>
                    <button class="stats-tab" data-tab="exercises">
                        Exercices favoris
                    </button>
                    <button class="stats-tab" data-tab="records">
                        Records personnels
                    </button>
                    <button class="stats-tab" data-tab="consistency">
                        Régularité
                    </button>
                </div>
                
                <div class="stats-content">
                    <div class="stats-panel active" data-panel="muscle-groups">
                        ${renderMuscleGroupsStats()}
                    </div>
                    
                    <div class="stats-panel" data-panel="exercises">
                        ${renderFavoriteExercisesStats()}
                    </div>
                    
                    <div class="stats-panel" data-panel="records">
                        ${renderPersonalRecordsStats()}
                    </div>
                    
                    <div class="stats-panel" data-panel="consistency">
                        ${renderConsistencyStats()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les stats des groupes musculaires
     */
    function renderMuscleGroupsStats() {
        return `
            <div class="muscle-groups-stats">
                <div class="loading-placeholder" id="muscle-groups-loading">
                    <div class="loading-spinner"></div>
                    <p>Chargement des statistiques...</p>
                </div>
                <div class="muscle-groups-list" id="muscle-groups-list" style="display: none;">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;
    }

    /**
     * Rendre les stats d'exercices favoris
     */
    function renderFavoriteExercisesStats() {
        return `
            <div class="favorite-exercises-stats">
                <div class="loading-placeholder" id="exercises-loading">
                    <div class="loading-spinner"></div>
                    <p>Chargement des exercices...</p>
                </div>
                <div class="exercises-list" id="exercises-list" style="display: none;">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;
    }

    /**
     * Rendre les records personnels
     */
    function renderPersonalRecordsStats() {
        return `
            <div class="personal-records-stats">
                <div class="loading-placeholder" id="records-loading">
                    <div class="loading-spinner"></div>
                    <p>Chargement des records...</p>
                </div>
                <div class="records-list" id="records-list" style="display: none;">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;
    }

    /**
     * Rendre les stats de régularité
     */
    function renderConsistencyStats() {
        return `
            <div class="consistency-stats">
                <div class="loading-placeholder" id="consistency-loading">
                    <div class="loading-spinner"></div>
                    <p>Chargement de la régularité...</p>
                </div>
                <div class="consistency-data" id="consistency-data" style="display: none;">
                    <!-- Sera rempli dynamiquement -->
                </div>
            </div>
        `;
    }

    /**
     * Rendre la section de progression
     */
    function renderProgressSection() {
        return `
            <div class="progress-section">
                <div class="progress-header">
                    <h3>Progression et objectifs</h3>
                    <button class="btn btn-primary set-goals-btn" data-action="set-goals">
                        <span class="btn-icon">🎯</span>
                        Définir objectifs
                    </button>
                </div>
                
                <div class="progress-grid">
                    <div class="progress-card">
                        <div class="progress-header">
                            <h4>Sessions ce mois</h4>
                            <span class="progress-target" id="sessions-target">/ 12</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="sessions-progress" style="width: 0%"></div>
                        </div>
                        <div class="progress-stats">
                            <span id="sessions-current">0</span>
                            <span class="progress-percentage" id="sessions-percentage">0%</span>
                        </div>
                    </div>
                    
                    <div class="progress-card">
                        <div class="progress-header">
                            <h4>Temps d'entraînement</h4>
                            <span class="progress-target" id="duration-target">/ 20h</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="duration-progress" style="width: 0%"></div>
                        </div>
                        <div class="progress-stats">
                            <span id="duration-current">0h</span>
                            <span class="progress-percentage" id="duration-percentage">0%</span>
                        </div>
                    </div>
                    
                    <div class="progress-card">
                        <div class="progress-header">
                            <h4>Volume total</h4>
                            <span class="progress-target" id="volume-target">/ 5000kg</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="volume-progress" style="width: 0%"></div>
                        </div>
                        <div class="progress-stats">
                            <span id="volume-current">0kg</span>
                            <span class="progress-percentage" id="volume-percentage">0%</span>
                        </div>
                    </div>
                    
                    <div class="progress-card">
                        <div class="progress-header">
                            <h4>Série de jours</h4>
                            <span class="progress-target" id="streak-target">/ 30</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="streak-progress" style="width: 0%"></div>
                        </div>
                        <div class="progress-stats">
                            <span id="streak-current">0</span>
                            <span class="progress-percentage" id="streak-percentage">0%</span>
                        </div>
                    </div>
                </div>
                
                <div class="achievements-preview">
                    <h4>Accomplissements récents</h4>
                    <div class="achievements-list" id="recent-achievements">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialiser les analytics
     */
    async function initializeAnalytics() {
        try {
            // Attacher les événements
            attachEventListeners();
            
            // Charger les données initiales
            await loadAnalyticsData();
            
            // Initialiser les graphiques
            await initializeCharts();
            
        } catch (error) {
            console.error('❌ Erreur initialisation analytics :', error);
        }
    }

    /**
     * Attacher les événements
     */
    function attachEventListeners() {
        try {
            // Sélecteur de période
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', handlePeriodChange);
            });
            
            // Sélecteur de type de graphique
            document.querySelectorAll('.chart-type-btn').forEach(btn => {
                btn.addEventListener('click', handleChartTypeChange);
            });
            
            // Onglets des statistiques
            document.querySelectorAll('.stats-tab').forEach(tab => {
                tab.addEventListener('click', handleStatsTabChange);
            });
            
            // Bouton d'export
            const exportBtn = document.querySelector('.export-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', handleExport);
            }
            
            // Bouton d'objectifs
            const goalsBtn = document.querySelector('.set-goals-btn');
            if (goalsBtn) {
                goalsBtn.addEventListener('click', handleSetGoals);
            }
            
        } catch (error) {
            console.error('❌ Erreur événements analytics :', error);
        }
    }

    /**
     * Charger les données analytics
     */
    async function loadAnalyticsData() {
        try {
            if (typeof AnalyticsModel !== 'undefined') {
                // Charger les statistiques générales
                const overviewStats = await AnalyticsModel.getOverviewStats(currentPeriod);
                updateOverviewStats(overviewStats);
                
                // Charger les données des graphiques
                const chartData = await AnalyticsModel.getChartData(currentChartType, currentPeriod);
                updateMainChart(chartData);
                
                // Charger les données détaillées
                await loadDetailedStats();
                
                // Charger les données de progression
                const progressData = await AnalyticsModel.getProgressData();
                updateProgressData(progressData);
                
            } else {
                console.warn('⚠️ AnalyticsModel non disponible');
                showMockData();
            }
        } catch (error) {
            console.error('❌ Erreur chargement données :', error);
            showMockData();
        }
    }

    /**
     * Mettre à jour les statistiques générales
     */
    function updateOverviewStats(stats) {
        try {
            // Sessions
            updateStatCard('sessions', stats.sessions, stats.sessionsChange);
            
            // Durée
            updateStatCard('duration', formatDuration(stats.totalDuration), 
                formatPercentageChange(stats.durationChange));
            
            // Exercices
            updateStatCard('exercises', stats.totalExercises, stats.exercisesChange);
            
            // Volume
            updateStatCard('volume', `${stats.totalVolume} kg`, 
                formatPercentageChange(stats.volumeChange));
            
            // Série
            updateStatCard('streak', `${stats.currentStreak} jours`, 
                stats.streakChange);
            
            // Moyenne par session
            updateStatCard('avg-session', formatDuration(stats.avgSessionDuration), 
                formatPercentageChange(stats.avgChange));
                
        } catch (error) {
            console.error('❌ Erreur mise à jour stats :', error);
        }
    }

    /**
     * Mettre à jour une carte de statistique
     */
    function updateStatCard(statType, value, change) {
        try {
            const valueElement = document.getElementById(`stat-${statType}`);
            const changeElement = document.getElementById(`stat-${statType}-change`);
            
            if (valueElement) {
                valueElement.textContent = value;
            }
            
            if (changeElement && change !== undefined) {
                changeElement.textContent = change;
                changeElement.className = 'stat-change';
                
                if (typeof change === 'string' && change.includes('+')) {
                    changeElement.classList.add('positive');
                } else if (typeof change === 'string' && change.includes('-')) {
                    changeElement.classList.add('negative');
                }
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour carte stat :', error);
        }
    }

    /**
     * Initialiser les graphiques
     */
    async function initializeCharts() {
        try {
            // Vérifier que Chart.js est disponible (simulation)
            if (typeof Chart === 'undefined') {
                console.warn('⚠️ Chart.js non disponible - simulation des graphiques');
                showMockCharts();
                return;
            }
            
            // Initialiser le graphique principal
            await initializeMainChart();
            
            // Initialiser le graphique des groupes musculaires
            await initializeMuscleChart();
            
            // Initialiser le graphique hebdomadaire
            await initializeWeeklyChart();
            
            // Initialiser le graphique de progression
            await initializeProgressChart();
            
        } catch (error) {
            console.error('❌ Erreur initialisation graphiques :', error);
            showMockCharts();
        }
    }

    /**
     * Initialiser le graphique principal
     */
    async function initializeMainChart() {
        const ctx = document.getElementById('main-chart');
        if (!ctx) return;
        
        // Configuration du graphique principal
        chartInstances.main = {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Évolution dans le temps'
                    }
                }
            }
        };
    }

    /**
     * Charger les statistiques détaillées
     */
    async function loadDetailedStats() {
        try {
            if (typeof AnalyticsModel !== 'undefined') {
                // Groupes musculaires
                const muscleGroupsData = await AnalyticsModel.getMuscleGroupsStats(currentPeriod);
                updateMuscleGroupsStats(muscleGroupsData);
                
                // Exercices favoris
                const exercisesData = await AnalyticsModel.getFavoriteExercises(currentPeriod);
                updateFavoriteExercisesStats(exercisesData);
                
                // Records personnels
                const recordsData = await AnalyticsModel.getPersonalRecords();
                updatePersonalRecordsStats(recordsData);
                
                // Régularité
                const consistencyData = await AnalyticsModel.getConsistencyStats(currentPeriod);
                updateConsistencyStats(consistencyData);
                
            } else {
                showMockDetailedStats();
            }
        } catch (error) {
            console.error('❌ Erreur chargement stats détaillées :', error);
            showMockDetailedStats();
        }
    }

    /**
     * Afficher les données de simulation
     */
    function showMockData() {
        // Simulation des statistiques générales
        updateOverviewStats({
            sessions: 15,
            sessionsChange: '+3',
            totalDuration: 3600000 * 12, // 12 heures
            durationChange: 15,
            totalExercises: 45,
            exercisesChange: '+8',
            totalVolume: 2500,
            volumeChange: 20,
            currentStreak: 5,
            streakChange: '+2',
            avgSessionDuration: 3600000 * 0.8, // 48 minutes
            avgChange: 5
        });
    }

    /**
     * Afficher les graphiques de simulation
     */
    function showMockCharts() {
        const charts = ['main-chart', 'muscle-chart', 'weekly-chart', 'progress-chart'];
        
        charts.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#666';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Graphique simulé', canvas.width / 2, canvas.height / 2);
            }
        });
    }

    /**
     * Gestionnaires d'événements
     */
    function handlePeriodChange(event) {
        const newPeriod = event.target.dataset.period;
        if (newPeriod && newPeriod !== currentPeriod) {
            currentPeriod = newPeriod;
            
            // Mettre à jour l'UI
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Recharger les données
            loadAnalyticsData();
        }
    }

    function handleChartTypeChange(event) {
        const newType = event.target.dataset.chart;
        if (newType && newType !== currentChartType) {
            currentChartType = newType;
            
            // Mettre à jour l'UI
            document.querySelectorAll('.chart-type-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Mettre à jour le graphique
            updateMainChart();
        }
    }

    function handleStatsTabChange(event) {
        const targetTab = event.target.dataset.tab;
        if (!targetTab) return;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Mettre à jour les panneaux
        document.querySelectorAll('.stats-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.querySelector(`[data-panel="${targetTab}"]`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    function handleExport() {
        if (typeof AnalyticsController !== 'undefined') {
            AnalyticsController.exportData();
        } else {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.info('Export des données en cours...');
            }
        }
    }

    function handleSetGoals() {
        if (typeof AnalyticsController !== 'undefined') {
            AnalyticsController.showGoalsModal();
        } else {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.info('Configuration des objectifs...');
            }
        }
    }

    // Gestionnaires d'événements EventBus
    function handleDataUpdated(data) {
        console.log('📊 Données analytics mises à jour');
        loadAnalyticsData();
    }

    function handleChartUpdated(data) {
        console.log('📈 Graphique mis à jour :', data.chartType);
        if (data.chartType === currentChartType) {
            updateMainChart(data.chartData);
        }
    }

    /**
     * Utilitaires de formatage
     */
    function formatDuration(ms) {
        if (!ms || ms <= 0) return '0m';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    function formatPercentageChange(change) {
        if (typeof change !== 'number') return '';
        
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change}%`;
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
                        <h2>❌ Erreur Analytics</h2>
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
            currentPeriod,
            currentChartType,
            hasCharts: Object.keys(chartInstances).length > 0
        };
    }

    // Interface publique
    return {
        init,
        render,
        loadAnalyticsData,
        updateOverviewStats,
        handlePeriodChange,
        handleChartTypeChange,
        getInitializationStatus
    };
})();

// Export global
window.AnalyticsView = AnalyticsView;