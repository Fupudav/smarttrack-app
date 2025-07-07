/**
 * SmartTrack - Vue Templates
 * Interface pour la gestion des modèles de session d'entraînement
 */

const TemplatesView = (function() {
    let isInitialized = false;
    let currentCategory = 'all';
    let selectedTemplate = null;

    /**
     * Initialiser la vue
     */
    function init() {
        try {
            console.log('📝 Initialisation TemplatesView...');
            
            // Écouter les événements
            if (typeof EventBus !== 'undefined') {
                EventBus.on('templates:template-created', handleTemplateCreated);
                EventBus.on('templates:template-used', handleTemplateUsed);
                EventBus.on('templates:template-deleted', handleTemplateDeleted);
            }
            
            isInitialized = true;
            console.log('✓ TemplatesView initialisée');
            
        } catch (error) {
            console.error('❌ Erreur initialisation TemplatesView :', error);
            throw error;
        }
    }

    /**
     * Rendre l'interface templates
     */
    async function render() {
        try {
            console.log('🎨 Rendu Templates...');
            
            const container = document.getElementById('app-content');
            if (!container) {
                throw new Error('Container app-content non trouvé');
            }
            
            container.innerHTML = await renderTemplatesScreen();
            
            // Initialiser les événements et données
            await initializeTemplates();
            
            console.log('✓ Templates rendu');
            
        } catch (error) {
            console.error('❌ Erreur rendu Templates :', error);
            showErrorScreen('Erreur lors du chargement des templates');
        }
    }

    /**
     * Rendre l'écran templates
     */
    async function renderTemplatesScreen() {
        return `
            <div class="screen templates-screen">
                <div class="screen-header">
                    <div class="header-content">
                        <h1 class="screen-title">
                            <span class="title-icon">📝</span>
                            Modèles de Session
                        </h1>
                        <p class="screen-subtitle">Créez et gérez vos modèles d'entraînement</p>
                    </div>
                    
                    <div class="templates-actions">
                        <button class="btn btn-secondary" id="import-template-btn">
                            <span class="btn-icon">📥</span>
                            Importer
                        </button>
                        <button class="btn btn-primary" id="create-template-btn">
                            <span class="btn-icon">➕</span>
                            Nouveau modèle
                        </button>
                    </div>
                </div>
                
                <div class="templates-filters">
                    ${renderTemplateFilters()}
                </div>
                
                <div class="templates-content">
                    <div class="templates-grid" id="templates-grid">
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>Chargement des modèles...</p>
                        </div>
                    </div>
                </div>
                
                <div class="templates-stats">
                    <div class="stats-summary">
                        <div class="stat-item">
                            <span class="stat-value" id="total-templates">0</span>
                            <span class="stat-label">Modèles créés</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="most-used-template">-</span>
                            <span class="stat-label">Plus utilisé</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="templates-usage">0</span>
                            <span class="stat-label">Utilisations totales</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les filtres de templates
     */
    function renderTemplateFilters() {
        return `
            <div class="filter-section">
                <div class="filter-buttons">
                    <button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" 
                            data-category="all">
                        Tous
                    </button>
                    <button class="filter-btn ${currentCategory === 'force' ? 'active' : ''}" 
                            data-category="force">
                        💪 Force
                    </button>
                    <button class="filter-btn ${currentCategory === 'cardio' ? 'active' : ''}" 
                            data-category="cardio">
                        🏃 Cardio
                    </button>
                    <button class="filter-btn ${currentCategory === 'mixte' ? 'active' : ''}" 
                            data-category="mixte">
                        🎯 Mixte
                    </button>
                    <button class="filter-btn ${currentCategory === 'recuperation' ? 'active' : ''}" 
                            data-category="recuperation">
                        🧘 Récupération
                    </button>
                    <button class="filter-btn ${currentCategory === 'custom' ? 'active' : ''}" 
                            data-category="custom">
                        ⚙️ Personnalisé
                    </button>
                </div>
                
                <div class="search-section">
                    <div class="search-input-container">
                        <input type="text" id="template-search" class="search-input" 
                               placeholder="Rechercher un modèle...">
                        <span class="search-icon">🔍</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre une carte de template
     */
    function renderTemplateCard(template) {
        return `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-header">
                    <div class="template-category ${template.category}">${formatCategory(template.category)}</div>
                    <div class="template-actions-quick">
                        <button class="btn-icon-small" title="Favoris" data-action="favorite" 
                                data-template-id="${template.id}">
                            ${template.isFavorite ? '⭐' : '☆'}
                        </button>
                        <button class="btn-icon-small" title="Plus d'options" data-action="options" 
                                data-template-id="${template.id}">
                            ⋮
                        </button>
                    </div>
                </div>
                
                <div class="template-content">
                    <h4 class="template-title">${template.name}</h4>
                    <p class="template-description">${template.description || 'Aucune description'}</p>
                    
                    <div class="template-info">
                        <div class="info-row">
                            <span class="info-icon">🏋️</span>
                            <span class="info-text">${template.exercises.length} exercices</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">⏱️</span>
                            <span class="info-text">~${template.estimated_duration}min</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">🎯</span>
                            <span class="info-text">${template.usage_count || 0} utilisations</span>
                        </div>
                    </div>
                    
                    <div class="template-preview">
                        <h5>Exercices inclus :</h5>
                        <div class="exercises-preview">
                            ${template.exercises.slice(0, 3).map(ex => `
                                <span class="exercise-tag">${ex.name}</span>
                            `).join('')}
                            ${template.exercises.length > 3 ? `
                                <span class="exercise-more">+${template.exercises.length - 3} autres</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="template-footer">
                    <div class="template-meta">
                        <span class="created-date">Créé le ${formatDate(template.created_at)}</span>
                        ${template.last_used ? `
                            <span class="last-used">Utilisé le ${formatDate(template.last_used)}</span>
                        ` : ''}
                    </div>
                    
                    <div class="template-actions">
                        <button class="btn btn-outline btn-sm template-preview-btn" 
                                data-template-id="${template.id}">
                            👁️ Aperçu
                        </button>
                        <button class="btn btn-primary btn-sm template-use-btn" 
                                data-template-id="${template.id}">
                            🚀 Utiliser
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la modal de création de template
     */
    function renderCreateTemplateModal() {
        return `
            <div class="create-template-modal">
                <div class="template-form">
                    <div class="form-section">
                        <h4>📝 Informations générales</h4>
                        <div class="form-grid">
                            <div class="form-field">
                                <label for="template-name">Nom du modèle</label>
                                <input type="text" id="template-name" class="form-input" 
                                       placeholder="Ex: Séance Push Pull">
                            </div>
                            
                            <div class="form-field">
                                <label for="template-category">Catégorie</label>
                                <select id="template-category" class="form-select">
                                    <option value="force">💪 Force</option>
                                    <option value="cardio">🏃 Cardio</option>
                                    <option value="mixte">🎯 Mixte</option>
                                    <option value="recuperation">🧘 Récupération</option>
                                    <option value="custom">⚙️ Personnalisé</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-field">
                            <label for="template-description">Description</label>
                            <textarea id="template-description" class="form-textarea" 
                                      placeholder="Décrivez les objectifs et caractéristiques de ce modèle"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>🏋️ Exercices du modèle</h4>
                        <div class="exercises-builder" id="template-exercises-builder">
                            <div class="exercises-search">
                                <input type="text" id="exercise-search" class="search-input" 
                                       placeholder="Rechercher un exercice à ajouter...">
                                <div class="exercises-suggestions" id="exercises-suggestions"></div>
                            </div>
                            
                            <div class="selected-exercises" id="selected-exercises">
                                <div class="empty-exercises">
                                    <p>Aucun exercice sélectionné</p>
                                    <small>Recherchez et ajoutez des exercices pour créer votre modèle</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>⚙️ Paramètres avancés</h4>
                        <div class="advanced-options">
                            <label class="checkbox-option">
                                <input type="checkbox" id="template-public">
                                <span class="checkbox-label">Rendre ce modèle public</span>
                                <small>Permettre à d'autres utilisateurs de l'utiliser</small>
                            </label>
                            
                            <label class="checkbox-option">
                                <input type="checkbox" id="template-favorite">
                                <span class="checkbox-label">Ajouter aux favoris</span>
                                <small>Accès rapide dans la préparation de session</small>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la modal d'aperçu de template
     */
    function renderTemplatePreviewModal(template) {
        return `
            <div class="template-preview-modal">
                <div class="preview-header">
                    <div class="template-info-header">
                        <h3>${template.name}</h3>
                        <span class="template-category ${template.category}">${formatCategory(template.category)}</span>
                    </div>
                    
                    <div class="template-stats-preview">
                        <div class="stat-preview">
                            <span class="stat-icon">🏋️</span>
                            <span class="stat-text">${template.exercises.length} exercices</span>
                        </div>
                        <div class="stat-preview">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-text">~${template.estimated_duration}min</span>
                        </div>
                        <div class="stat-preview">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-text">${template.usage_count || 0} utilisations</span>
                        </div>
                    </div>
                </div>
                
                <div class="preview-content">
                    ${template.description ? `
                        <div class="preview-description">
                            <h4>📝 Description</h4>
                            <p>${template.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="preview-exercises">
                        <h4>🏋️ Liste des exercices</h4>
                        <div class="exercises-list-preview">
                            ${template.exercises.map((exercise, index) => `
                                <div class="exercise-item-preview">
                                    <div class="exercise-number">${index + 1}</div>
                                    <div class="exercise-info">
                                        <div class="exercise-name">${exercise.name}</div>
                                        <div class="exercise-details">
                                            <span class="muscle-group">${formatMuscleGroup(exercise.muscle_group)}</span>
                                            <span class="sets-info">${exercise.sets.length} sets</span>
                                            ${exercise.exercise_mode === 'reps' ? 
                                                `<span class="reps-info">${exercise.sets[0]?.reps || 0} reps</span>` :
                                                `<span class="time-info">${exercise.sets[0]?.duration || 0}s</span>`
                                            }
                                        </div>
                                    </div>
                                    <div class="exercise-mode ${exercise.exercise_mode}">
                                        ${exercise.exercise_mode === 'reps' ? '🔢' : '⏱️'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="preview-metadata">
                        <h4>ℹ️ Informations</h4>
                        <div class="metadata-grid">
                            <div class="meta-item">
                                <span class="meta-label">Créé le :</span>
                                <span class="meta-value">${formatDate(template.created_at)}</span>
                            </div>
                            ${template.last_used ? `
                                <div class="meta-item">
                                    <span class="meta-label">Dernière utilisation :</span>
                                    <span class="meta-value">${formatDate(template.last_used)}</span>
                                </div>
                            ` : ''}
                                                         <div class="meta-item">
                                 <span class="meta-label">Groupes musculaires :</span>
                                 <span class="meta-value">${getUniqueMuscleGroups(template.exercises).join(', ')}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialiser les templates
     */
    async function initializeTemplates() {
        try {
            // Attacher les événements
            attachEventListeners();
            
            // Charger les données initiales
            await loadTemplatesData();
            
        } catch (error) {
            console.error('❌ Erreur initialisation templates :', error);
        }
    }

    /**
     * Attacher les événements
     */
    function attachEventListeners() {
        try {
            // Filtres de catégorie
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', handleCategoryFilter);
            });
            
            // Recherche
            const searchInput = document.getElementById('template-search');
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
            
            // Boutons d'action
            const createBtn = document.getElementById('create-template-btn');
            const importBtn = document.getElementById('import-template-btn');
            
            if (createBtn) {
                createBtn.addEventListener('click', handleCreateTemplate);
            }
            
            if (importBtn) {
                importBtn.addEventListener('click', handleImportTemplate);
            }
            
        } catch (error) {
            console.error('❌ Erreur événements templates :', error);
        }
    }

    /**
     * Charger les données des templates
     */
    async function loadTemplatesData() {
        try {
            if (typeof TemplatesModel !== 'undefined') {
                const templates = await TemplatesModel.getTemplates(currentCategory);
                updateTemplatesGrid(templates);
                
                // Mettre à jour les statistiques
                const stats = await TemplatesModel.getTemplatesStats();
                updateTemplatesStats(stats);
                
            } else {
                console.warn('⚠️ TemplatesModel non disponible');
                showMockData();
            }
        } catch (error) {
            console.error('❌ Erreur chargement templates :', error);
            showMockData();
        }
    }

    /**
     * Mettre à jour la grille des templates
     */
    function updateTemplatesGrid(templates) {
        const grid = document.getElementById('templates-grid');
        if (!grid) return;
        
        if (templates.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h4>Aucun modèle trouvé</h4>
                    <p>Créez votre premier modèle pour gagner du temps lors de vos séances.</p>
                    <button class="btn btn-primary" onclick="TemplatesView.showCreateTemplateModal()">
                        Créer un modèle
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = templates.map(template => renderTemplateCard(template)).join('');
        
        // Attacher les événements aux cartes
        attachTemplateCardEvents();
    }

    /**
     * Afficher les données de simulation
     */
    function showMockData() {
        const mockTemplates = [
            {
                id: 1,
                name: 'Push Upper Body',
                description: 'Séance de poussée pour le haut du corps',
                category: 'force',
                exercises: [
                    { name: 'Développé couché', muscle_group: 'pectoraux', exercise_mode: 'reps', sets: [{reps: 12}] },
                    { name: 'Développé incliné', muscle_group: 'pectoraux', exercise_mode: 'reps', sets: [{reps: 10}] },
                    { name: 'Dips', muscle_group: 'triceps', exercise_mode: 'reps', sets: [{reps: 15}] }
                ],
                estimated_duration: 45,
                usage_count: 8,
                created_at: Date.now() - 86400000 * 7,
                isFavorite: true
            },
            {
                id: 2,
                name: 'Cardio HIIT',
                description: 'Entraînement cardio haute intensité',
                category: 'cardio',
                exercises: [
                    { name: 'Burpees', muscle_group: 'cardio', exercise_mode: 'time', sets: [{duration: 30}] },
                    { name: 'Mountain climbers', muscle_group: 'cardio', exercise_mode: 'time', sets: [{duration: 30}] }
                ],
                estimated_duration: 20,
                usage_count: 3,
                created_at: Date.now() - 86400000 * 3,
                isFavorite: false
            }
        ];
        
        updateTemplatesGrid(mockTemplates);
        
        // Stats de simulation
        const totalTemplates = document.getElementById('total-templates');
        const mostUsed = document.getElementById('most-used-template');
        const totalUsage = document.getElementById('templates-usage');
        
        if (totalTemplates) totalTemplates.textContent = mockTemplates.length;
        if (mostUsed) mostUsed.textContent = mockTemplates[0].name;
        if (totalUsage) totalUsage.textContent = mockTemplates.reduce((sum, t) => sum + t.usage_count, 0);
    }

    /**
     * Gestionnaires d'événements
     */
    function handleCategoryFilter(event) {
        const newCategory = event.target.dataset.category;
        if (!newCategory || newCategory === currentCategory) return;
        
        // Mettre à jour les filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        currentCategory = newCategory;
        
        // Recharger les templates
        loadTemplatesData();
    }

    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        
        // Filtrer les cartes visibles
        document.querySelectorAll('.template-card').forEach(card => {
            const title = card.querySelector('.template-title').textContent.toLowerCase();
            const description = card.querySelector('.template-description').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function handleCreateTemplate() {
        showCreateTemplateModal();
    }

    function handleImportTemplate() {
        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = handleTemplateFileImport;
        input.click();
    }

    /**
     * Afficher la modal de création
     */
    function showCreateTemplateModal() {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: '➕ Nouveau modèle de session',
                content: renderCreateTemplateModal(),
                actions: [
                    { text: 'Annuler', type: 'secondary', handler: () => ModalManager.hide() },
                    { text: 'Créer le modèle', type: 'primary', handler: handleSaveTemplate }
                ],
                size: 'large',
                onShow: initializeCreateTemplateModal
            });
        }
    }

    /**
     * Gestionnaires d'événements EventBus
     */
    function handleTemplateCreated(data) {
        console.log('📝 Template créé :', data);
        loadTemplatesData();
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success(`Modèle "${data.template.name}" créé !`);
        }
    }

    function handleTemplateUsed(data) {
        console.log('🚀 Template utilisé :', data);
        // Mettre à jour le compteur d'utilisation
        loadTemplatesData();
    }

    function handleTemplateDeleted(data) {
        console.log('🗑️ Template supprimé :', data);
        loadTemplatesData();
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.info('Modèle supprimé');
        }
    }

    /**
     * Fonctions utilitaires
     */
    function formatCategory(category) {
        const categories = {
            'force': '💪 Force',
            'cardio': '🏃 Cardio',
            'mixte': '🎯 Mixte',
            'recuperation': '🧘 Récupération',
            'custom': '⚙️ Personnalisé'
        };
        return categories[category] || category;
    }

    function formatMuscleGroup(group) {
        const groups = {
            'echauffement': 'Échauffement',
            'biceps': 'Biceps',
            'triceps': 'Triceps',
            'epaules': 'Épaules',
            'dos': 'Dos',
            'pectoraux': 'Pectoraux',
            'jambes': 'Jambes',
            'cardio': 'Cardio'
        };
        return groups[group] || group;
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('fr-FR');
    }

    function getUniqueMuscleGroups(exercises) {
        const groups = [...new Set(exercises.map(ex => ex.muscle_group))];
        return groups.map(group => formatMuscleGroup(group));
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
                        <h2>❌ Erreur Templates</h2>
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
            currentCategory,
            hasSelectedTemplate: selectedTemplate !== null
        };
    }

    // Interface publique
    return {
        init,
        render,
        showCreateTemplateModal,
        loadTemplatesData,
        handleCategoryFilter,
        handleSearch,
        getInitializationStatus
    };
})();

// Export global
window.TemplatesView = TemplatesView;