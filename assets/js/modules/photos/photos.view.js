/**
 * SmartTrack - Vue Photos
 * Interface pour la gestion des photos de progression
 */

const PhotosView = (function() {
    let isInitialized = false;
    let currentFilter = 'all';
    let selectedPhotos = [];
    let comparisonMode = false;

    /**
     * Initialiser la vue
     */
    function init() {
        try {
            console.log('📸 Initialisation PhotosView...');
            
            // Écouter les événements
            if (typeof EventBus !== 'undefined') {
                EventBus.on('photos:photo-uploaded', handlePhotoUploaded);
                EventBus.on('photos:photo-deleted', handlePhotoDeleted);
                EventBus.on('photos:comparison-created', handleComparisonCreated);
                EventBus.on('photos:photo-updated', handlePhotoUpdated);
            }
            
            isInitialized = true;
            console.log('✓ PhotosView initialisée');
            
        } catch (error) {
            console.error('❌ Erreur initialisation PhotosView :', error);
            throw error;
        }
    }

    /**
     * Rendre l'interface photos
     */
    async function render() {
        try {
            console.log('🎨 Rendu Photos...');
            
            const container = document.getElementById('app-content');
            if (!container) {
                throw new Error('Container app-content non trouvé');
            }
            
            container.innerHTML = await renderPhotosScreen();
            
            // Initialiser les événements et données
            await initializePhotos();
            
            console.log('✓ Photos rendu');
            
        } catch (error) {
            console.error('❌ Erreur rendu Photos :', error);
            showErrorScreen('Erreur lors du chargement des photos');
        }
    }

    /**
     * Rendre l'écran photos
     */
    async function renderPhotosScreen() {
        return `
            <div class="screen photos-screen">
                <div class="screen-header">
                    <div class="header-content">
                        <h1 class="screen-title">
                            <span class="title-icon">📸</span>
                            Photos de Progression
                        </h1>
                        <p class="screen-subtitle">Suivez visuellement votre évolution physique</p>
                    </div>
                    
                    <div class="photos-actions">
                        <button class="btn btn-secondary" id="compare-photos-btn" 
                                ${selectedPhotos.length < 2 ? 'disabled' : ''}>
                            <span class="btn-icon">⚖️</span>
                            Comparer (${selectedPhotos.length})
                        </button>
                        <button class="btn btn-primary" id="add-photo-btn">
                            <span class="btn-icon">📷</span>
                            Ajouter une photo
                        </button>
                    </div>
                </div>
                
                <div class="photos-filters">
                    ${renderPhotoFilters()}
                </div>
                
                <div class="photos-content">
                    <div class="photos-grid" id="photos-grid">
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>Chargement des photos...</p>
                        </div>
                    </div>
                </div>
                
                <div class="photos-stats">
                    <div class="stats-summary">
                        <div class="stat-item">
                            <span class="stat-value" id="total-photos">0</span>
                            <span class="stat-label">Photos sauvées</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="photos-this-month">0</span>
                            <span class="stat-label">Ce mois-ci</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="progression-days">0</span>
                            <span class="stat-label">Jours de suivi</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les filtres de photos
     */
    function renderPhotoFilters() {
        return `
            <div class="filter-section">
                <div class="filter-buttons">
                    <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                            data-filter="all">
                        Toutes
                    </button>
                    <button class="filter-btn ${currentFilter === 'face' ? 'active' : ''}" 
                            data-filter="face">
                        👤 Visage
                    </button>
                    <button class="filter-btn ${currentFilter === 'front' ? 'active' : ''}" 
                            data-filter="front">
                        🔄 Face
                    </button>
                    <button class="filter-btn ${currentFilter === 'side' ? 'active' : ''}" 
                            data-filter="side">
                        ↔️ Profil
                    </button>
                    <button class="filter-btn ${currentFilter === 'back' ? 'active' : ''}" 
                            data-filter="back">
                        🔄 Dos
                    </button>
                    <button class="filter-btn ${currentFilter === 'custom' ? 'active' : ''}" 
                            data-filter="custom">
                        ⚙️ Personnalisé
                    </button>
                </div>
                
                <div class="date-filters">
                    <select id="period-filter" class="filter-select">
                        <option value="all">Toute la période</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="quarter">Ce trimestre</option>
                        <option value="year">Cette année</option>
                    </select>
                </div>
                
                <div class="view-options">
                    <button class="view-btn ${comparisonMode ? '' : 'active'}" 
                            data-view="grid" title="Vue grille">
                        📱
                    </button>
                    <button class="view-btn ${comparisonMode ? 'active' : ''}" 
                            data-view="timeline" title="Vue chronologique">
                        📈
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Rendre une carte photo
     */
    function renderPhotoCard(photo) {
        const isSelected = selectedPhotos.includes(photo.id);
        
        return `
            <div class="photo-card ${isSelected ? 'selected' : ''}" data-photo-id="${photo.id}">
                <div class="photo-header">
                    <div class="photo-type ${photo.type}">${formatPhotoType(photo.type)}</div>
                    <div class="photo-actions-quick">
                        <button class="btn-icon-small ${isSelected ? 'active' : ''}" 
                                title="Sélectionner pour comparaison" 
                                data-action="select" data-photo-id="${photo.id}">
                            ${isSelected ? '☑️' : '☐'}
                        </button>
                        <button class="btn-icon-small" title="Plus d'options" 
                                data-action="options" data-photo-id="${photo.id}">
                            ⋮
                        </button>
                    </div>
                </div>
                
                <div class="photo-container">
                    <img src="${photo.thumbnail || photo.url}" 
                         alt="${photo.title}" 
                         class="photo-image"
                         loading="lazy"
                         onclick="PhotosView.showPhotoViewer('${photo.id}')">
                    
                    ${photo.progress_marker ? `
                        <div class="progress-marker">
                            <span class="marker-icon">🎯</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="photo-content">
                    <h4 class="photo-title">${photo.title || 'Photo de progression'}</h4>
                    
                    <div class="photo-info">
                        <div class="info-row">
                            <span class="info-icon">📅</span>
                            <span class="info-text">${formatDate(photo.created_at)}</span>
                        </div>
                        
                        ${photo.weight ? `
                            <div class="info-row">
                                <span class="info-icon">⚖️</span>
                                <span class="info-text">${photo.weight}kg</span>
                            </div>
                        ` : ''}
                        
                        ${photo.body_part ? `
                            <div class="info-row">
                                <span class="info-icon">🎯</span>
                                <span class="info-text">${photo.body_part}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${photo.notes ? `
                        <p class="photo-notes">${photo.notes}</p>
                    ` : ''}
                </div>
                
                <div class="photo-footer">
                    <div class="photo-meta">
                        <span class="file-size">${formatFileSize(photo.file_size)}</span>
                        ${photo.camera_info ? `
                            <span class="camera-info" title="${photo.camera_info}">📷</span>
                        ` : ''}
                    </div>
                    
                    <div class="photo-actions">
                        <button class="btn btn-outline btn-sm photo-edit-btn" 
                                data-photo-id="${photo.id}">
                            ✏️ Modifier
                        </button>
                        <button class="btn btn-primary btn-sm photo-view-btn" 
                                data-photo-id="${photo.id}">
                            👁️ Voir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la modal d'ajout de photo
     */
    function renderAddPhotoModal() {
        return `
            <div class="add-photo-modal">
                <div class="photo-upload-section">
                    <div class="upload-area" id="photo-upload-area">
                        <div class="upload-content">
                            <div class="upload-icon">📷</div>
                            <h4>Ajoutez votre photo de progression</h4>
                            <p>Cliquez ou glissez-déposez votre image ici</p>
                            <input type="file" id="photo-file-input" accept="image/*" multiple>
                            <div class="upload-options">
                                <button type="button" class="btn btn-secondary" id="camera-capture-btn">
                                    📸 Prendre une photo
                                </button>
                                <button type="button" class="btn btn-primary" id="file-select-btn">
                                    📁 Choisir un fichier
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="photo-preview" id="photo-preview" style="display: none;">
                        <img id="preview-image" src="" alt="Aperçu">
                        <div class="preview-overlay">
                            <button class="btn btn-secondary btn-sm" id="change-photo-btn">
                                🔄 Changer
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="photo-details-section">
                    <h4>📝 Informations de la photo</h4>
                    
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="photo-title">Titre (optionnel)</label>
                            <input type="text" id="photo-title" class="form-input" 
                                   placeholder="Ex: Progression dos - Janvier">
                        </div>
                        
                        <div class="form-field">
                            <label for="photo-type">Type de photo</label>
                            <select id="photo-type" class="form-select">
                                <option value="front">🔄 Face</option>
                                <option value="side">↔️ Profil</option>
                                <option value="back">🔄 Dos</option>
                                <option value="face">👤 Visage</option>
                                <option value="custom">⚙️ Personnalisé</option>
                            </select>
                        </div>
                        
                        <div class="form-field">
                            <label for="photo-weight">Poids actuel (kg)</label>
                            <input type="number" id="photo-weight" class="form-input" 
                                   placeholder="Ex: 75" step="0.1" min="0">
                        </div>
                        
                        <div class="form-field">
                            <label for="photo-body-part">Partie du corps</label>
                            <select id="photo-body-part" class="form-select">
                                <option value="">Sélectionner...</option>
                                <option value="corps-entier">Corps entier</option>
                                <option value="haut-du-corps">Haut du corps</option>
                                <option value="bas-du-corps">Bas du corps</option>
                                <option value="bras">Bras</option>
                                <option value="jambes">Jambes</option>
                                <option value="abdos">Abdominaux</option>
                                <option value="dos">Dos</option>
                                <option value="pectoraux">Pectoraux</option>
                                <option value="epaules">Épaules</option>
                                <option value="visage">Visage</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label for="photo-notes">Notes (optionnel)</label>
                        <textarea id="photo-notes" class="form-textarea" 
                                  placeholder="Ajoutez vos observations, objectifs ou remarques..."></textarea>
                    </div>
                    
                    <div class="form-field">
                        <label class="checkbox-option">
                            <input type="checkbox" id="photo-progress-marker">
                            <span class="checkbox-label">Marquer comme photo de référence</span>
                            <small>Cette photo servira de point de comparaison</small>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la visionneuse de photo
     */
    function renderPhotoViewer(photo) {
        return `
            <div class="photo-viewer">
                <div class="viewer-header">
                    <div class="photo-info-header">
                        <h3>${photo.title || 'Photo de progression'}</h3>
                        <span class="photo-date">${formatDate(photo.created_at)}</span>
                    </div>
                    
                    <div class="viewer-actions">
                        <button class="btn-icon" title="Précédent" data-action="previous">
                            ⬅️
                        </button>
                        <button class="btn-icon" title="Suivant" data-action="next">
                            ➡️
                        </button>
                        <button class="btn-icon" title="Télécharger" data-action="download">
                            💾
                        </button>
                        <button class="btn-icon" title="Partager" data-action="share">
                            📤
                        </button>
                        <button class="btn-icon" title="Modifier" data-action="edit">
                            ✏️
                        </button>
                        <button class="btn-icon" title="Supprimer" data-action="delete">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="viewer-content">
                    <div class="photo-display">
                        <img src="${photo.url}" alt="${photo.title}" class="main-photo">
                        
                        ${photo.progress_marker ? `
                            <div class="progress-marker-badge">
                                <span class="marker-icon">🎯</span>
                                <span class="marker-text">Photo de référence</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="photo-sidebar">
                        <div class="photo-details">
                            <h4>📋 Détails</h4>
                            
                            <div class="detail-item">
                                <span class="detail-label">Type :</span>
                                <span class="detail-value">${formatPhotoType(photo.type)}</span>
                            </div>
                            
                            <div class="detail-item">
                                <span class="detail-label">Date :</span>
                                <span class="detail-value">${formatDateTime(photo.created_at)}</span>
                            </div>
                            
                            ${photo.weight ? `
                                <div class="detail-item">
                                    <span class="detail-label">Poids :</span>
                                    <span class="detail-value">${photo.weight} kg</span>
                                </div>
                            ` : ''}
                            
                            ${photo.body_part ? `
                                <div class="detail-item">
                                    <span class="detail-label">Partie du corps :</span>
                                    <span class="detail-value">${photo.body_part}</span>
                                </div>
                            ` : ''}
                            
                            <div class="detail-item">
                                <span class="detail-label">Taille :</span>
                                <span class="detail-value">${formatFileSize(photo.file_size)}</span>
                            </div>
                            
                            ${photo.camera_info ? `
                                <div class="detail-item">
                                    <span class="detail-label">Appareil :</span>
                                    <span class="detail-value">${photo.camera_info}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${photo.notes ? `
                            <div class="photo-notes-detail">
                                <h4>📝 Notes</h4>
                                <p>${photo.notes}</p>
                            </div>
                        ` : ''}
                        
                        <div class="comparison-suggestions">
                            <h4>⚖️ Comparaisons suggérées</h4>
                            <div id="comparison-suggestions">
                                <p class="loading-text">Recherche de photos similaires...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre la modal de comparaison
     */
    function renderComparisonModal(photos) {
        return `
            <div class="comparison-modal">
                <div class="comparison-header">
                    <h3>⚖️ Comparaison de photos</h3>
                    <p>Visualisez votre progression entre ${photos.length} photos</p>
                </div>
                
                <div class="comparison-controls">
                    <div class="view-controls">
                        <button class="btn btn-sm comparison-view-btn active" data-view="side-by-side">
                            ↔️ Côte à côte
                        </button>
                        <button class="btn btn-sm comparison-view-btn" data-view="overlay">
                            📊 Superposition
                        </button>
                        <button class="btn btn-sm comparison-view-btn" data-view="slider">
                            🎚️ Curseur
                        </button>
                    </div>
                    
                    <div class="analysis-controls">
                        <button class="btn btn-secondary btn-sm" id="analysis-grid-btn">
                            📐 Grille d'analyse
                        </button>
                        <button class="btn btn-secondary btn-sm" id="measurements-btn">
                            📏 Mesures
                        </button>
                    </div>
                </div>
                
                <div class="comparison-content" id="comparison-content">
                    ${renderSideBySideComparison(photos)}
                </div>
                
                <div class="comparison-analysis">
                    <div class="timeline-info">
                        <div class="timeline-item">
                            <span class="timeline-label">Première photo :</span>
                            <span class="timeline-value">${formatDate(photos[0].created_at)}</span>
                        </div>
                        <div class="timeline-item">
                            <span class="timeline-label">Dernière photo :</span>
                            <span class="timeline-value">${formatDate(photos[photos.length - 1].created_at)}</span>
                        </div>
                        <div class="timeline-item">
                            <span class="timeline-label">Période :</span>
                            <span class="timeline-value">${calculateTimeDifference(photos[0].created_at, photos[photos.length - 1].created_at)}</span>
                        </div>
                    </div>
                    
                    ${calculateProgressStats(photos)}
                </div>
            </div>
        `;
    }

    /**
     * Rendre une comparaison côte à côte
     */
    function renderSideBySideComparison(photos) {
        return `
            <div class="side-by-side-comparison">
                ${photos.map((photo, index) => `
                    <div class="comparison-photo">
                        <div class="photo-container">
                            <img src="${photo.url}" alt="${photo.title}">
                            <div class="photo-overlay">
                                <div class="photo-label">Photo ${index + 1}</div>
                                <div class="photo-date">${formatDate(photo.created_at)}</div>
                                ${photo.weight ? `<div class="photo-weight">${photo.weight}kg</div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Initialiser les photos
     */
    async function initializePhotos() {
        try {
            // Attacher les événements
            attachEventListeners();
            
            // Charger les données initiales
            await loadPhotosData();
            
        } catch (error) {
            console.error('❌ Erreur initialisation photos :', error);
        }
    }

    /**
     * Attacher les événements
     */
    function attachEventListeners() {
        try {
            // Filtres
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', handleFilterChange);
            });
            
            const periodFilter = document.getElementById('period-filter');
            if (periodFilter) {
                periodFilter.addEventListener('change', handlePeriodFilter);
            }
            
            // Boutons d'action
            const addPhotoBtn = document.getElementById('add-photo-btn');
            const compareBtn = document.getElementById('compare-photos-btn');
            
            if (addPhotoBtn) {
                addPhotoBtn.addEventListener('click', handleAddPhoto);
            }
            
            if (compareBtn) {
                compareBtn.addEventListener('click', handleComparePhotos);
            }
            
            // Vues
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', handleViewChange);
            });
            
        } catch (error) {
            console.error('❌ Erreur événements photos :', error);
        }
    }

    /**
     * Charger les données des photos
     */
    async function loadPhotosData() {
        try {
            if (typeof PhotosModel !== 'undefined') {
                const photos = await PhotosModel.getPhotos(currentFilter);
                updatePhotosGrid(photos);
                
                // Mettre à jour les statistiques
                const stats = await PhotosModel.getPhotosStats();
                updatePhotosStats(stats);
                
            } else {
                console.warn('⚠️ PhotosModel non disponible');
                showMockData();
            }
        } catch (error) {
            console.error('❌ Erreur chargement photos :', error);
            showMockData();
        }
    }

    /**
     * Mettre à jour la grille des photos
     */
    function updatePhotosGrid(photos) {
        const grid = document.getElementById('photos-grid');
        if (!grid) return;
        
        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📸</div>
                    <h4>Aucune photo trouvée</h4>
                    <p>Commencez à documenter votre progression en ajoutant votre première photo.</p>
                    <button class="btn btn-primary" onclick="PhotosView.showAddPhotoModal()">
                        Ajouter une photo
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = photos.map(photo => renderPhotoCard(photo)).join('');
        
        // Attacher les événements aux cartes
        attachPhotoCardEvents();
    }

    /**
     * Afficher les données de simulation
     */
    function showMockData() {
        const mockPhotos = [
            {
                id: 1,
                title: 'Progression Face - Janvier',
                type: 'front',
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGhvdG8gZGUgcHJvZ3Jlc3Npb248L3RleHQ+Cjwvc3ZnPg==',
                weight: 75.2,
                body_part: 'corps-entier',
                notes: 'Début du programme de transformation',
                created_at: Date.now() - 86400000 * 30,
                file_size: 2048000,
                progress_marker: true
            },
            {
                id: 2,
                title: 'Progression Profil - Février',
                type: 'side',
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGhvdG8gZGUgcHJvZ3Jlc3Npb248L3RleHQ+Cjwvc3ZnPg==',
                weight: 73.8,
                body_part: 'corps-entier',
                notes: 'Première amélioration visible',
                created_at: Date.now() - 86400000 * 7,
                file_size: 1890000,
                progress_marker: false
            }
        ];
        
        updatePhotosGrid(mockPhotos);
        
        // Stats de simulation
        const totalPhotos = document.getElementById('total-photos');
        const photosThisMonth = document.getElementById('photos-this-month');
        const progressionDays = document.getElementById('progression-days');
        
        if (totalPhotos) totalPhotos.textContent = mockPhotos.length;
        if (photosThisMonth) photosThisMonth.textContent = '2';
        if (progressionDays) progressionDays.textContent = '30';
    }

    /**
     * Gestionnaires d'événements
     */
    function handleFilterChange(event) {
        const newFilter = event.target.dataset.filter;
        if (!newFilter || newFilter === currentFilter) return;
        
        // Mettre à jour les filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        currentFilter = newFilter;
        
        // Recharger les photos
        loadPhotosData();
    }

    function handlePeriodFilter(event) {
        const period = event.target.value;
        // Filtrer par période
        loadPhotosData();
    }

    function handleViewChange(event) {
        const view = event.target.dataset.view;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Basculer la vue
        if (view === 'timeline') {
            comparisonMode = true;
            // Implémenter la vue chronologique
        } else {
            comparisonMode = false;
            // Vue grille standard
        }
        
        loadPhotosData();
    }

    function handleAddPhoto() {
        showAddPhotoModal();
    }

    function handleComparePhotos() {
        if (selectedPhotos.length < 2) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.warning('Sélectionnez au moins 2 photos pour comparer');
            }
            return;
        }
        
        showComparisonModal();
    }

    /**
     * Afficher la modal d'ajout de photo
     */
    function showAddPhotoModal() {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: '📷 Ajouter une photo de progression',
                content: renderAddPhotoModal(),
                actions: [
                    { text: 'Annuler', type: 'secondary', handler: () => ModalManager.hide() },
                    { text: 'Sauvegarder', type: 'primary', handler: handleSavePhoto }
                ],
                size: 'large',
                onShow: initializeAddPhotoModal
            });
        }
    }

    /**
     * Afficher la visionneuse de photo
     */
    function showPhotoViewer(photoId) {
        // Récupérer la photo et afficher la visionneuse
        if (typeof PhotosModel !== 'undefined') {
            PhotosModel.getPhoto(photoId).then(photo => {
                if (photo && typeof ModalManager !== 'undefined') {
                    ModalManager.show({
                        title: '',
                        content: renderPhotoViewer(photo),
                        actions: [],
                        size: 'fullscreen',
                        onShow: initializePhotoViewer
                    });
                }
            });
        }
    }

    /**
     * Gestionnaires d'événements EventBus
     */
    function handlePhotoUploaded(data) {
        console.log('📸 Photo uploadée :', data);
        loadPhotosData();
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success('Photo ajoutée avec succès !');
        }
    }

    function handlePhotoDeleted(data) {
        console.log('🗑️ Photo supprimée :', data);
        loadPhotosData();
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.info('Photo supprimée');
        }
    }

    function handleComparisonCreated(data) {
        console.log('⚖️ Comparaison créée :', data);
        // Mettre à jour l'affichage si nécessaire
    }

    function handlePhotoUpdated(data) {
        console.log('✏️ Photo mise à jour :', data);
        loadPhotosData();
    }

    /**
     * Fonctions utilitaires
     */
    function formatPhotoType(type) {
        const types = {
            'front': '🔄 Face',
            'side': '↔️ Profil',
            'back': '🔄 Dos',
            'face': '👤 Visage',
            'custom': '⚙️ Personnalisé'
        };
        return types[type] || type;
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('fr-FR');
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function calculateTimeDifference(start, end) {
        const diff = Math.abs(end - start);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Aujourd\'hui';
        if (days === 1) return '1 jour';
        if (days < 7) return `${days} jours`;
        if (days < 30) return `${Math.floor(days / 7)} semaines`;
        if (days < 365) return `${Math.floor(days / 30)} mois`;
        return `${Math.floor(days / 365)} années`;
    }

    function calculateProgressStats(photos) {
        // Calculer les statistiques de progression
        const weightChange = photos.length > 1 && photos[0].weight && photos[photos.length - 1].weight
            ? photos[photos.length - 1].weight - photos[0].weight
            : null;
        
        return `
            <div class="progress-stats">
                <h4>📊 Analyse de progression</h4>
                ${weightChange !== null ? `
                    <div class="stat-item">
                        <span class="stat-label">Évolution du poids :</span>
                        <span class="stat-value ${weightChange >= 0 ? 'positive' : 'negative'}">
                            ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg
                        </span>
                    </div>
                ` : ''}
                <div class="stat-item">
                    <span class="stat-label">Photos comparées :</span>
                    <span class="stat-value">${photos.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Régularité :</span>
                    <span class="stat-value">Excellent suivi</span>
                </div>
            </div>
        `;
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
                        <h2>❌ Erreur Photos</h2>
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
            currentFilter,
            selectedPhotosCount: selectedPhotos.length,
            comparisonMode
        };
    }

    // Interface publique
    return {
        init,
        render,
        showAddPhotoModal,
        showPhotoViewer,
        handleFilterChange,
        handleComparePhotos,
        loadPhotosData,
        getInitializationStatus
    };
})();

// Export global
window.PhotosView = PhotosView;