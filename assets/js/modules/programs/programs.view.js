/**
 * SmartTrack - Vue Programs
 * Interface pour les programmes d'entraînement structurés
 */

const ProgramsView = (function() {
    let isInitialized = false;
    let currentTab = 'available';
    let currentFilter = 'all';
    let currentProgram = null;

    /**
     * Initialiser la vue
     */
    function init() {
        try {
            console.log('📋 Initialisation ProgramsView...');
            
            // Écouter les événements
            if (typeof EventBus !== 'undefined') {
                EventBus.on('programs:program-started', handleProgramStarted);
                EventBus.on('programs:program-completed', handleProgramCompleted);
                EventBus.on('programs:week-completed', handleWeekCompleted);
            }
            
            isInitialized = true;
            console.log('✓ ProgramsView initialisée');
            
        } catch (error) {
            console.error('❌ Erreur initialisation ProgramsView :', error);
            throw error;
        }
    }

    /**
     * Rendre l'interface programs
     */
    async function render() {
        try {
            console.log('🎨 Rendu Programs...');
            
            const container = document.getElementById('app-content');
            if (!container) {
                throw new Error('Container app-content non trouvé');
            }
            
            container.innerHTML = await renderProgramsScreen();
            
            // Initialiser les événements et données
            await initializePrograms();
            
            console.log('✓ Programs rendu');
            
        } catch (error) {
            console.error('❌ Erreur rendu Programs :', error);
            showErrorScreen('Erreur lors du chargement des programmes');
        }
    }

    /**
     * Rendre l'écran programs
     */
    async function renderProgramsScreen() {
        return `
            <div class="screen programs-screen">
                <div class="screen-header">
                    <div class="header-content">
                        <h1 class="screen-title">
                            <span class="title-icon">📋</span>
                            Programmes d'Entraînement
                        </h1>
                        <p class="screen-subtitle">Programmes structurés pour vos objectifs</p>
                    </div>
                    
                    <div class="programs-actions">
                        <button class="btn btn-secondary" id="create-program-btn">
                            <span class="btn-icon">➕</span>
                            Créer programme
                        </button>
                    </div>
                </div>
                
                <div class="programs-tabs">
                    ${renderNavigationTabs()}
                </div>
                
                <div class="programs-content">
                    <div class="tab-content active" data-tab="available">
                        ${renderAvailableTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="current">
                        ${renderCurrentTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="history">
                        ${renderHistoryTab()}
                    </div>
                    
                    <div class="tab-content" data-tab="create">
                        ${renderCreateTab()}
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
                <button class="tab-btn ${currentTab === 'available' ? 'active' : ''}" 
                        data-tab="available">
                    <span class="tab-icon">📚</span>
                    <span class="tab-label">Disponibles</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'current' ? 'active' : ''}" 
                        data-tab="current">
                    <span class="tab-icon">🎯</span>
                    <span class="tab-label">En cours</span>
                    <span class="tab-badge" id="current-badge">0</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'history' ? 'active' : ''}" 
                        data-tab="history">
                    <span class="tab-icon">📜</span>
                    <span class="tab-label">Historique</span>
                </button>
                
                <button class="tab-btn ${currentTab === 'create' ? 'active' : ''}" 
                        data-tab="create">
                    <span class="tab-icon">🛠️</span>
                    <span class="tab-label">Créer</span>
                </button>
            </div>
        `;
    }

    /**
     * Rendre l'onglet programmes disponibles
     */
    function renderAvailableTab() {
        return `
            <div class="available-programs">
                <div class="programs-filters">
                    <h3>📚 Programmes disponibles</h3>
                    <div class="filter-controls">
                        ${renderProgramFilters()}
                    </div>
                </div>
                
                <div class="programs-grid" id="available-programs-grid">
                    <div class="loading-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Chargement des programmes...</p>
                    </div>
                </div>
                
                <div class="programs-info">
                    <h4>💡 À propos des programmes</h4>
                    <p>
                        Les programmes d'entraînement vous offrent une structure optimisée pour atteindre
                        vos objectifs spécifiques. Chaque programme comprend des séances planifiées,
                        une progression adaptative et des conseils d'experts.
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les filtres de programmes
     */
    function renderProgramFilters() {
        return `
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                        data-filter="all">
                    Tous
                </button>
                <button class="filter-btn ${currentFilter === 'beginner' ? 'active' : ''}" 
                        data-filter="beginner">
                    Débutant
                </button>
                <button class="filter-btn ${currentFilter === 'intermediate' ? 'active' : ''}" 
                        data-filter="intermediate">
                    Intermédiaire
                </button>
                <button class="filter-btn ${currentFilter === 'advanced' ? 'active' : ''}" 
                        data-filter="advanced">
                    Avancé
                </button>
                <button class="filter-btn ${currentFilter === 'strength' ? 'active' : ''}" 
                        data-filter="strength">
                    Force
                </button>
                <button class="filter-btn ${currentFilter === 'endurance' ? 'active' : ''}" 
                        data-filter="endurance">
                    Endurance
                </button>
            </div>
        `;
    }

    /**
     * Rendre l'onglet programme actuel
     */
    function renderCurrentTab() {
        return `
            <div class="current-program">
                <div class="current-program-header">
                    <h3>🎯 Programme en cours</h3>
                </div>
                
                <div id="current-program-content">
                    <div class="no-current-program">
                        <div class="empty-state">
                            <div class="empty-icon">📋</div>
                            <h4>Aucun programme en cours</h4>
                            <p>Sélectionnez un programme pour commencer votre entraînement structuré.</p>
                            <button class="btn btn-primary" onclick="ProgramsView.switchToTab('available')">
                                Parcourir les programmes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'onglet historique
     */
    function renderHistoryTab() {
        return `
            <div class="program-history">
                <div class="history-header">
                    <h3>📜 Historique des programmes</h3>
                    <div class="history-stats" id="history-stats">
                        <div class="stat-item">
                            <span class="stat-value" id="completed-programs">0</span>
                            <span class="stat-label">Programmes terminés</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="total-weeks">0</span>
                            <span class="stat-label">Semaines d'entraînement</span>
                        </div>
                    </div>
                </div>
                
                <div class="history-timeline" id="history-timeline">
                    <div class="loading-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Chargement de l'historique...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'onglet création
     */
    function renderCreateTab() {
        return `
            <div class="create-program">
                <div class="create-header">
                    <h3>🛠️ Créer un programme personnalisé</h3>
                    <p>Concevez votre propre programme d'entraînement adapté à vos besoins.</p>
                </div>
                
                <div class="create-form" id="create-program-form">
                    ${renderCreateForm()}
                </div>
            </div>
        `;
    }

    /**
     * Rendre le formulaire de création
     */
    function renderCreateForm() {
        return `
            <div class="program-form">
                <div class="form-section">
                    <h4>📝 Informations générales</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="program-name">Nom du programme</label>
                            <input type="text" id="program-name" class="form-input" 
                                   placeholder="Ex: Mon programme force">
                        </div>
                        
                        <div class="form-field">
                            <label for="program-level">Niveau</label>
                            <select id="program-level" class="form-select">
                                <option value="beginner">Débutant</option>
                                <option value="intermediate">Intermédiaire</option>
                                <option value="advanced">Avancé</option>
                            </select>
                        </div>
                        
                        <div class="form-field">
                            <label for="program-duration">Durée (semaines)</label>
                            <input type="number" id="program-duration" class="form-input" 
                                   min="1" max="52" value="4">
                        </div>
                        
                        <div class="form-field">
                            <label for="program-frequency">Fréquence (sessions/semaine)</label>
                            <input type="number" id="program-frequency" class="form-input" 
                                   min="1" max="7" value="3">
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label for="program-description">Description</label>
                        <textarea id="program-description" class="form-textarea" 
                                  placeholder="Décrivez les objectifs et caractéristiques de votre programme"></textarea>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🎯 Objectifs</h4>
                    <div class="objectives-grid">
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="strength">
                            <span class="objective-label">💪 Développer la force</span>
                        </label>
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="endurance">
                            <span class="objective-label">🏃 Améliorer l'endurance</span>
                        </label>
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="muscle">
                            <span class="objective-label">🎯 Prendre du muscle</span>
                        </label>
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="weight">
                            <span class="objective-label">⚖️ Contrôler le poids</span>
                        </label>
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="flexibility">
                            <span class="objective-label">🤸 Gagner en souplesse</span>
                        </label>
                        <label class="objective-option">
                            <input type="checkbox" name="objectives" value="wellness">
                            <span class="objective-label">🧘 Bien-être général</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>📅 Structure des semaines</h4>
                    <div class="weeks-builder" id="weeks-builder">
                        <!-- Sera rempli dynamiquement -->
                    </div>
                    <button type="button" class="btn btn-secondary" id="add-week-btn">
                        ➕ Ajouter une semaine
                    </button>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="save-draft-btn">
                        💾 Sauvegarder brouillon
                    </button>
                    <button type="button" class="btn btn-primary" id="create-program-final-btn">
                        🚀 Créer le programme
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Rendre une carte de programme
     */
    function renderProgramCard(program) {
        return `
            <div class="program-card" data-program-id="${program.id}">
                <div class="program-header">
                    <div class="program-icon">${program.icon || '📋'}</div>
                    <div class="program-level ${program.level}">${formatLevel(program.level)}</div>
                </div>
                
                <div class="program-content">
                    <h4 class="program-title">${program.name}</h4>
                    <p class="program-description">${program.description}</p>
                    
                    <div class="program-info">
                        <div class="info-item">
                            <span class="info-icon">📅</span>
                            <span class="info-text">${program.duration} semaines</span>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">🎯</span>
                            <span class="info-text">${program.sessions_per_week} sessions/semaine</span>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">⏱️</span>
                            <span class="info-text">${program.avg_session_duration}min/session</span>
                        </div>
                    </div>
                    
                    <div class="program-objectives">
                        ${program.objectives.map(obj => `
                            <span class="objective-tag">${formatObjective(obj)}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="program-actions">
                    <button class="btn btn-outline program-preview-btn" 
                            data-program-id="${program.id}">
                        👁️ Aperçu
                    </button>
                    <button class="btn btn-primary program-start-btn" 
                            data-program-id="${program.id}">
                        🚀 Commencer
                    </button>
                </div>
                
                ${program.stats ? `
                    <div class="program-stats">
                        <div class="stat">
                            <span class="stat-value">${program.stats.completion_rate}%</span>
                            <span class="stat-label">Taux de réussite</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${program.stats.users_count}</span>
                            <span class="stat-label">Utilisateurs</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Rendre le programme actuel détaillé
     */
    function renderCurrentProgramDetail(program) {
        if (!program) {
            return `
                <div class="no-current-program">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h4>Aucun programme en cours</h4>
                        <p>Sélectionnez un programme pour commencer votre entraînement structuré.</p>
                        <button class="btn btn-primary" onclick="ProgramsView.switchToTab('available')">
                            Parcourir les programmes
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="current-program-detail">
                <div class="program-header-current">
                    <div class="program-title-section">
                        <h3>${program.name}</h3>
                        <span class="program-level ${program.level}">${formatLevel(program.level)}</span>
                    </div>
                    
                    <div class="program-progress-overview">
                        <div class="progress-circle">
                            <div class="progress-circle-fill" style="stroke-dasharray: ${program.progress || 0}, 100"></div>
                            <div class="progress-text">${Math.round(program.progress || 0)}%</div>
                        </div>
                        <div class="progress-details">
                            <div>Semaine ${program.current_week || 1} / ${program.duration}</div>
                            <div>Session ${program.current_session || 1} / ${program.sessions_per_week}</div>
                        </div>
                    </div>
                    
                    <div class="program-actions-current">
                        <button class="btn btn-secondary" id="pause-program-btn">
                            ⏸️ Pause
                        </button>
                        <button class="btn btn-danger" id="stop-program-btn">
                            ⏹️ Arrêter
                        </button>
                    </div>
                </div>
                
                <div class="current-week-detail">
                    <h4>📅 Semaine ${program.current_week || 1}</h4>
                    <div class="week-sessions" id="current-week-sessions">
                        ${renderWeekSessions(program.current_week_data)}
                    </div>
                </div>
                
                <div class="program-calendar">
                    <h4>📆 Calendrier du programme</h4>
                    <div class="calendar-view" id="program-calendar">
                        ${renderProgramCalendar(program)}
                    </div>
                </div>
                
                <div class="program-statistics">
                    <h4>📊 Statistiques</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${program.completed_sessions || 0}</div>
                            <div class="stat-label">Sessions complétées</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${formatDuration(program.total_training_time || 0)}</div>
                            <div class="stat-label">Temps d'entraînement</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${program.streak || 0}</div>
                            <div class="stat-label">Série de jours</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialiser les programmes
     */
    async function initializePrograms() {
        try {
            // Attacher les événements
            attachEventListeners();
            
            // Charger les données initiales
            await loadProgramsData();
            
        } catch (error) {
            console.error('❌ Erreur initialisation programmes :', error);
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
            
            // Filtres de programmes
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', handleFilterChange);
            });
            
            // Bouton de création
            const createBtn = document.getElementById('create-program-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => switchToTab('create'));
            }
            
        } catch (error) {
            console.error('❌ Erreur événements programmes :', error);
        }
    }

    /**
     * Charger les données des programmes
     */
    async function loadProgramsData() {
        try {
            if (typeof ProgramsModel !== 'undefined') {
                // Charger selon l'onglet actuel
                switch (currentTab) {
                    case 'available':
                        await loadAvailablePrograms();
                        break;
                    case 'current':
                        await loadCurrentProgram();
                        break;
                    case 'history':
                        await loadProgramHistory();
                        break;
                    case 'create':
                        await loadCreateForm();
                        break;
                }
                
            } else {
                console.warn('⚠️ ProgramsModel non disponible');
                showMockData();
            }
        } catch (error) {
            console.error('❌ Erreur chargement données programmes :', error);
            showMockData();
        }
    }

    /**
     * Charger les programmes disponibles
     */
    async function loadAvailablePrograms() {
        try {
            if (typeof ProgramsModel !== 'undefined') {
                const programs = await ProgramsModel.getAvailablePrograms(currentFilter);
                updateAvailableProgramsGrid(programs);
            }
        } catch (error) {
            console.error('❌ Erreur chargement programmes disponibles :', error);
        }
    }

    /**
     * Charger le programme actuel
     */
    async function loadCurrentProgram() {
        try {
            if (typeof ProgramsModel !== 'undefined') {
                currentProgram = await ProgramsModel.getCurrentProgram();
                updateCurrentProgramContent(currentProgram);
                
                // Mettre à jour le badge
                const badge = document.getElementById('current-badge');
                if (badge) {
                    badge.textContent = currentProgram ? '1' : '0';
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement programme actuel :', error);
        }
    }

    /**
     * Afficher les données de simulation
     */
    function showMockData() {
        // Selon l'onglet actuel
        if (currentTab === 'available') {
            const mockPrograms = [
                {
                    id: 1,
                    name: 'Programme Force Débutant',
                    description: 'Programme idéal pour débuter la musculation avec les bons mouvements',
                    level: 'beginner',
                    duration: 6,
                    sessions_per_week: 3,
                    avg_session_duration: 45,
                    objectives: ['strength', 'muscle'],
                    icon: '💪'
                },
                {
                    id: 2,
                    name: 'Cardio Intensif',
                    description: 'Améliorez votre condition cardiovasculaire rapidement',
                    level: 'intermediate',
                    duration: 4,
                    sessions_per_week: 4,
                    avg_session_duration: 30,
                    objectives: ['endurance', 'weight'],
                    icon: '🏃'
                }
            ];
            
            updateAvailableProgramsGrid(mockPrograms);
        }
        
        // Badge de comptage
        const currentBadge = document.getElementById('current-badge');
        if (currentBadge) {
            currentBadge.textContent = '0';
        }
    }

    /**
     * Mettre à jour la grille des programmes disponibles
     */
    function updateAvailableProgramsGrid(programs) {
        const grid = document.getElementById('available-programs-grid');
        if (!grid) return;
        
        if (programs.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h4>Aucun programme trouvé</h4>
                    <p>Essayez de modifier vos filtres ou créez votre propre programme.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = programs.map(program => renderProgramCard(program)).join('');
        
        // Attacher les événements aux nouvelles cartes
        attachProgramCardEvents();
    }

    /**
     * Mettre à jour le contenu du programme actuel
     */
    function updateCurrentProgramContent(program) {
        const content = document.getElementById('current-program-content');
        if (!content) return;
        
        content.innerHTML = renderCurrentProgramDetail(program);
        
        // Attacher les événements
        attachCurrentProgramEvents();
    }

    /**
     * Changer d'onglet
     */
    function switchToTab(tab) {
        if (tab === currentTab) return;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetTab = document.querySelector(`[data-tab="${tab}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.querySelector(`.tab-content[data-tab="${tab}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Mettre à jour l'état
        currentTab = tab;
        
        // Charger les données de l'onglet
        loadProgramsData();
    }

    /**
     * Gestionnaires d'événements
     */
    function handleTabChange(event) {
        const targetTab = event.target.closest('.tab-btn').dataset.tab;
        if (targetTab) {
            switchToTab(targetTab);
        }
    }

    function handleFilterChange(event) {
        const newFilter = event.target.dataset.filter;
        if (!newFilter || newFilter === currentFilter) return;
        
        // Mettre à jour les filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        currentFilter = newFilter;
        
        // Recharger les programmes
        loadAvailablePrograms();
    }

    /**
     * Gestionnaires d'événements EventBus
     */
    function handleProgramStarted(data) {
        console.log('🚀 Programme démarré :', data);
        
        // Basculer vers l'onglet "En cours"
        switchToTab('current');
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`Programme "${data.program.name}" démarré !`);
        }
    }

    function handleProgramCompleted(data) {
        console.log('🎉 Programme terminé :', data);
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`Programme "${data.program.name}" terminé ! Félicitations !`);
        }
        
        // Actualiser l'affichage
        loadProgramsData();
    }

    function handleWeekCompleted(data) {
        console.log('📅 Semaine terminée :', data);
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`Semaine ${data.week} terminée ! Continuez sur votre lancée !`);
        }
    }

    /**
     * Fonctions utilitaires
     */
    function formatLevel(level) {
        const levels = {
            'beginner': 'Débutant',
            'intermediate': 'Intermédiaire',
            'advanced': 'Avancé',
            'expert': 'Expert'
        };
        return levels[level] || level;
    }

    function formatObjective(objective) {
        const objectives = {
            'strength': '💪 Force',
            'endurance': '🏃 Endurance',
            'muscle': '🎯 Muscle',
            'weight': '⚖️ Poids',
            'flexibility': '🤸 Souplesse',
            'wellness': '🧘 Bien-être'
        };
        return objectives[objective] || objective;
    }

    function formatDuration(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
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
                        <h2>❌ Erreur Programs</h2>
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
            currentFilter,
            hasCurrentProgram: currentProgram !== null
        };
    }

    // Interface publique
    return {
        init,
        render,
        switchToTab,
        loadProgramsData,
        handleTabChange,
        handleFilterChange,
        getInitializationStatus
    };
})();

// Export global
window.ProgramsView = ProgramsView;