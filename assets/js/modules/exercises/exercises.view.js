/**
 * SmartTrack - Vue Exercices
 * Interface utilisateur pour la gestion des exercices
 */

const ExercisesView = (function() {
    let currentExercises = [];
    let filteredExercises = [];
    let currentFilters = {};

    /**
     * Initialiser la vue
     */
    function init() {
        console.log('🎨 Initialisation ExercisesView...');
        
        // Écouter les événements des exercices
        if (typeof EventBus !== 'undefined') {
            EventBus.on('exercises:loaded', handleExercisesLoaded);
            EventBus.on('exercises:added', handleExerciseAdded);
            EventBus.on('exercises:updated', handleExerciseUpdated);
            EventBus.on('exercises:removed', handleExerciseRemoved);
        }
    }

    /**
     * Rendre la page des exercices
     */
    function render() {
        const container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML = `
            <div class="screen exercises-screen">
                <header class="screen-header">
                    <h1 class="screen-title">
                        <span>🏋️</span>
                        Arsenal d'Exercices
                    </h1>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="ExercisesView.showAddExerciseModal()">
                            <span>➕</span>
                            Nouvel Exercice
                        </button>
                    </div>
                </header>

                <div class="screen-content">
                    <!-- Filtres et recherche -->
                    <div class="filters-section">
                        <div class="search-container">
                            <input type="text" 
                                   id="exercise-search" 
                                   class="search-input" 
                                   placeholder="🔍 Rechercher un exercice..."
                                   oninput="ExercisesView.handleSearch(this.value)">
                        </div>
                        
                        <div class="filters-grid">
                            <div class="filter-group">
                                <label>Groupe Musculaire</label>
                                <select id="muscle-group-filter" onchange="ExercisesView.applyFilters()">
                                    <option value="all">Tous</option>
                                    <option value="echauffement">Échauffement</option>
                                    <option value="biceps">Biceps</option>
                                    <option value="triceps">Triceps</option>
                                    <option value="epaules">Épaules</option>
                                    <option value="dos">Dos</option>
                                    <option value="jambes">Jambes</option>
                                    <option value="pectoraux">Pectoraux</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label>Point d'Ancrage</label>
                                <select id="anchor-filter" onchange="ExercisesView.applyFilters()">
                                    <option value="all">Tous</option>
                                    <option value="none">Aucun</option>
                                    <option value="door-low">Porte Bas</option>
                                    <option value="door-middle">Porte Milieu</option>
                                    <option value="door-high">Porte Haut</option>
                                    <option value="floor">Sol</option>
                                    <option value="body">Corps</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label>Type</label>
                                <select id="type-filter" onchange="ExercisesView.applyFilters()">
                                    <option value="all">Tous</option>
                                    <option value="bodyweight">Poids du corps</option>
                                    <option value="elastics">Élastiques</option>
                                    <option value="weights">Poids</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label>Mode</label>
                                <select id="mode-filter" onchange="ExercisesView.applyFilters()">
                                    <option value="all">Tous</option>
                                    <option value="reps">Répétitions</option>
                                    <option value="time">Temps</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="filters-actions">
                            <button class="btn btn-secondary" onclick="ExercisesView.clearFilters()">
                                Effacer les filtres
                            </button>
                            <div class="exercises-count">
                                <span id="exercises-count">0 exercices</span>
                            </div>
                        </div>
                    </div>

                    <!-- Liste des exercices -->
                    <div class="exercises-container">
                        <div id="exercises-grid" class="exercises-grid">
                            <!-- Les exercices seront ajoutés ici -->
                        </div>
                        
                        <div id="exercises-empty" class="empty-state" style="display: none;">
                            <div class="empty-icon">🏋️</div>
                            <h3>Aucun exercice trouvé</h3>
                            <p>Ajustez vos filtres ou créez un nouvel exercice.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Charger les exercices
        loadExercises();
    }

    /**
     * Charger et afficher les exercices
     */
    async function loadExercises() {
        try {
            if (typeof ExercisesModel !== 'undefined') {
                currentExercises = await ExercisesModel.getAll();
                applyCurrentFilters();
            }
        } catch (error) {
            console.error('❌ Erreur chargement exercices :', error);
            showError('Erreur de chargement des exercices');
        }
    }

    /**
     * Appliquer les filtres actuels
     */
    function applyCurrentFilters() {
        if (!currentExercises.length) {
            filteredExercises = [];
        } else {
            filteredExercises = ExercisesModel.filter(currentFilters);
        }
        
        renderExercisesList();
        updateExercisesCount();
    }

    /**
     * Rendre la liste des exercices
     */
    function renderExercisesList() {
        const grid = document.getElementById('exercises-grid');
        const emptyState = document.getElementById('exercises-empty');
        
        if (!grid) return;

        if (filteredExercises.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = filteredExercises.map(exercise => `
            <div class="exercise-card" data-exercise-id="${exercise.id}">
                <div class="exercise-header">
                    <h3 class="exercise-name">${exercise.name}</h3>
                    <div class="exercise-actions">
                        <button class="btn-icon" onclick="ExercisesView.showExerciseDetails('${exercise.id}')" title="Détails">
                            👁️
                        </button>
                        <button class="btn-icon" onclick="ExercisesView.showEditExerciseModal('${exercise.id}')" title="Modifier">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="ExercisesView.confirmDeleteExercise('${exercise.id}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="exercise-info">
                    <div class="exercise-meta">
                        <span class="meta-item muscle-group">
                            <span class="meta-icon">${getMuscleGroupIcon(exercise.muscle_group)}</span>
                            <span>${getMuscleGroupName(exercise.muscle_group)}</span>
                        </span>
                        <span class="meta-item anchor">
                            <span class="meta-icon">${getAnchorIcon(exercise.anchor_point)}</span>
                            <span>${getAnchorName(exercise.anchor_point)}</span>
                        </span>
                    </div>
                    
                    <div class="exercise-tags">
                        <span class="tag tag-${exercise.exercise_type}">${getExerciseTypeName(exercise.exercise_type)}</span>
                        <span class="tag tag-${exercise.exercise_mode}">${exercise.exercise_mode === 'reps' ? 'Répétitions' : 'Temps'}</span>
                        ${exercise.is_unilateral ? '<span class="tag tag-unilateral">Unilatéral</span>' : ''}
                        ${exercise.is_predefined ? '<span class="tag tag-predefined">SmartWorkout</span>' : '<span class="tag tag-custom">Personnalisé</span>'}
                    </div>
                    
                    ${exercise.description ? `<p class="exercise-description">${exercise.description}</p>` : ''}
                </div>
                
                <div class="exercise-footer">
                    <div class="exercise-stats">
                        <span class="stat">
                            <span class="stat-icon">⏱️</span>
                            <span>Repos: ${exercise.default_rest_time || 90}s</span>
                        </span>
                        ${exercise.default_duration ? `
                            <span class="stat">
                                <span class="stat-icon">⏰</span>
                                <span>Durée: ${exercise.default_duration}s</span>
                            </span>
                        ` : ''}
                    </div>
                    
                    <button class="btn btn-primary btn-sm" onclick="ExercisesView.addToSession('${exercise.id}')">
                        <span>➕</span>
                        Ajouter à la session
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Mettre à jour le compteur d'exercices
     */
    function updateExercisesCount() {
        const countElement = document.getElementById('exercises-count');
        if (countElement) {
            const count = filteredExercises.length;
            countElement.textContent = `${count} exercice${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Gérer la recherche
     */
    function handleSearch(query) {
        currentFilters.search = query;
        applyCurrentFilters();
    }

    /**
     * Appliquer les filtres
     */
    function applyFilters() {
        const muscleGroup = document.getElementById('muscle-group-filter')?.value;
        const anchor = document.getElementById('anchor-filter')?.value;
        const type = document.getElementById('type-filter')?.value;
        const mode = document.getElementById('mode-filter')?.value;

        currentFilters = {
            ...currentFilters,
            muscleGroup: muscleGroup === 'all' ? null : muscleGroup,
            anchor: anchor === 'all' ? null : anchor,
            exerciseType: type === 'all' ? null : type,
            mode: mode === 'all' ? null : mode
        };

        applyCurrentFilters();
    }

    /**
     * Effacer tous les filtres
     */
    function clearFilters() {
        // Reset form
        const form = document.querySelector('.filters-section');
        if (form) {
            form.querySelectorAll('select').forEach(select => select.value = 'all');
            const searchInput = document.getElementById('exercise-search');
            if (searchInput) searchInput.value = '';
        }

        // Reset filters
        currentFilters = {};
        applyCurrentFilters();
    }

    /**
     * Afficher la modal d'ajout d'exercice
     */
    function showAddExerciseModal() {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: '➕ Nouvel Exercice',
                content: renderExerciseForm(),
                actions: [
                    { text: 'Annuler', type: 'secondary' },
                    { text: 'Créer', type: 'primary', handler: handleAddExercise }
                ],
                size: 'large'
            });
        }
    }

    /**
     * Afficher la modal d'édition d'exercice
     */
    function showEditExerciseModal(exerciseId) {
        const exercise = currentExercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: `✏️ Modifier ${exercise.name}`,
                content: renderExerciseForm(exercise),
                actions: [
                    { text: 'Annuler', type: 'secondary' },
                    { text: 'Sauvegarder', type: 'primary', handler: () => handleEditExercise(exerciseId) }
                ],
                size: 'large'
            });
        }
    }

    /**
     * Rendre le formulaire d'exercice
     */
    function renderExerciseForm(exercise = null) {
        const isEdit = exercise !== null;
        
        return `
            <form id="exercise-form" class="exercise-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="exercise-name">Nom de l'exercice *</label>
                        <input type="text" 
                               id="exercise-name" 
                               value="${exercise ? exercise.name : ''}" 
                               placeholder="Ex: Curl biceps" 
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label for="exercise-muscle-group">Groupe musculaire *</label>
                        <select id="exercise-muscle-group" required>
                            <option value="">Sélectionner...</option>
                            <option value="echauffement" ${exercise?.muscle_group === 'echauffement' ? 'selected' : ''}>Échauffement</option>
                            <option value="biceps" ${exercise?.muscle_group === 'biceps' ? 'selected' : ''}>Biceps</option>
                            <option value="triceps" ${exercise?.muscle_group === 'triceps' ? 'selected' : ''}>Triceps</option>
                            <option value="epaules" ${exercise?.muscle_group === 'epaules' ? 'selected' : ''}>Épaules</option>
                            <option value="dos" ${exercise?.muscle_group === 'dos' ? 'selected' : ''}>Dos</option>
                            <option value="jambes" ${exercise?.muscle_group === 'jambes' ? 'selected' : ''}>Jambes</option>
                            <option value="pectoraux" ${exercise?.muscle_group === 'pectoraux' ? 'selected' : ''}>Pectoraux</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="exercise-anchor">Point d'ancrage</label>
                        <select id="exercise-anchor">
                            <option value="none" ${exercise?.anchor_point === 'none' ? 'selected' : ''}>Aucun</option>
                            <option value="door-low" ${exercise?.anchor_point === 'door-low' ? 'selected' : ''}>Porte Bas</option>
                            <option value="door-middle" ${exercise?.anchor_point === 'door-middle' ? 'selected' : ''}>Porte Milieu</option>
                            <option value="door-high" ${exercise?.anchor_point === 'door-high' ? 'selected' : ''}>Porte Haut</option>
                            <option value="floor" ${exercise?.anchor_point === 'floor' ? 'selected' : ''}>Sol</option>
                            <option value="body" ${exercise?.anchor_point === 'body' ? 'selected' : ''}>Corps</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="exercise-type">Type d'exercice</label>
                        <select id="exercise-type">
                            <option value="elastics" ${exercise?.exercise_type === 'elastics' ? 'selected' : ''}>Élastiques</option>
                            <option value="bodyweight" ${exercise?.exercise_type === 'bodyweight' ? 'selected' : ''}>Poids du corps</option>
                            <option value="weights" ${exercise?.exercise_type === 'weights' ? 'selected' : ''}>Poids</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="exercise-mode">Mode d'exercice</label>
                        <select id="exercise-mode" onchange="ExercisesView.toggleModeFields(this.value)">
                            <option value="reps" ${exercise?.exercise_mode === 'reps' ? 'selected' : ''}>Répétitions</option>
                            <option value="time" ${exercise?.exercise_mode === 'time' ? 'selected' : ''}>Temps</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="exercise-rest">Temps de repos (secondes)</label>
                        <input type="number" 
                               id="exercise-rest" 
                               value="${exercise ? exercise.default_rest_time || 90 : 90}" 
                               min="30" 
                               max="600">
                    </div>
                    
                    <div class="form-group" id="duration-group" style="display: ${exercise?.exercise_mode === 'time' ? 'block' : 'none'}">
                        <label for="exercise-duration">Durée par défaut (secondes)</label>
                        <input type="number" 
                               id="exercise-duration" 
                               value="${exercise ? exercise.default_duration || 30 : 30}" 
                               min="10" 
                               max="300">
                    </div>
                    
                    <div class="form-group form-group-full">
                        <label for="exercise-description">Description</label>
                        <textarea id="exercise-description" 
                                  placeholder="Description de l'exercice (optionnel)">${exercise ? exercise.description || '' : ''}</textarea>
                    </div>
                    
                    <div class="form-group form-group-full">
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   id="exercise-unilateral" 
                                   ${exercise?.is_unilateral ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Exercice unilatéral (une jambe/un bras à la fois)
                        </label>
                    </div>
                </div>
            </form>
        `;
    }

    /**
     * Basculer les champs selon le mode
     */
    function toggleModeFields(mode) {
        const durationGroup = document.getElementById('duration-group');
        if (durationGroup) {
            durationGroup.style.display = mode === 'time' ? 'block' : 'none';
        }
    }

    /**
     * Gérer l'ajout d'exercice
     */
    async function handleAddExercise() {
        try {
            const formData = getFormData();
            if (!formData) return false;

            await ExercisesModel.add(formData);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success('Exercice créé avec succès !');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur création exercice :', error);
            showError('Erreur lors de la création de l\'exercice');
            return false;
        }
    }

    /**
     * Gérer l'édition d'exercice
     */
    async function handleEditExercise(exerciseId) {
        try {
            const formData = getFormData();
            if (!formData) return false;

            await ExercisesModel.update(exerciseId, formData);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success('Exercice modifié avec succès !');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification exercice :', error);
            showError('Erreur lors de la modification de l\'exercice');
            return false;
        }
    }

    /**
     * Récupérer les données du formulaire
     */
    function getFormData() {
        const form = document.getElementById('exercise-form');
        if (!form) return null;

        const name = form.querySelector('#exercise-name')?.value?.trim();
        const muscleGroup = form.querySelector('#exercise-muscle-group')?.value;
        const anchor = form.querySelector('#exercise-anchor')?.value;
        const type = form.querySelector('#exercise-type')?.value;
        const mode = form.querySelector('#exercise-mode')?.value;
        const rest = parseInt(form.querySelector('#exercise-rest')?.value);
        const duration = parseInt(form.querySelector('#exercise-duration')?.value);
        const description = form.querySelector('#exercise-description')?.value?.trim();
        const isUnilateral = form.querySelector('#exercise-unilateral')?.checked;

        if (!name || !muscleGroup) {
            showError('Le nom et le groupe musculaire sont obligatoires');
            return null;
        }

        return {
            name,
            muscle_group: muscleGroup,
            anchor_point: anchor,
            exercise_type: type,
            exercise_mode: mode,
            default_rest_time: rest,
            default_duration: mode === 'time' ? duration : undefined,
            description,
            is_unilateral: isUnilateral,
            category: muscleGroup === 'echauffement' ? 'warmup' : 'strength'
        };
    }

    /**
     * Confirmer la suppression d'un exercice
     */
    function confirmDeleteExercise(exerciseId) {
        const exercise = currentExercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        if (typeof ModalManager !== 'undefined') {
            ModalManager.confirm({
                title: 'Supprimer l\'exercice',
                message: `Êtes-vous sûr de vouloir supprimer "${exercise.name}" ?`,
                onConfirm: () => deleteExercise(exerciseId)
            });
        }
    }

    /**
     * Supprimer un exercice
     */
    async function deleteExercise(exerciseId) {
        try {
            await ExercisesModel.remove(exerciseId);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success('Exercice supprimé avec succès !');
            }
            
        } catch (error) {
            console.error('❌ Erreur suppression exercice :', error);
            showError('Erreur lors de la suppression de l\'exercice');
        }
    }

    /**
     * Ajouter un exercice à la session courante
     */
    async function addToSession(exerciseId) {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.addExerciseToCurrentSession(exerciseId);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Exercice ajouté à la session !');
                }
            }
        } catch (error) {
            console.error('❌ Erreur ajout à la session :', error);
            showError('Erreur lors de l\'ajout à la session');
        }
    }

    /**
     * Afficher les détails d'un exercice
     */
    function showExerciseDetails(exerciseId) {
        const exercise = currentExercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: `🏋️ ${exercise.name}`,
                content: renderExerciseDetails(exercise),
                actions: [
                    { text: 'Fermer', type: 'secondary' },
                    { text: 'Modifier', type: 'primary', handler: () => showEditExerciseModal(exerciseId) }
                ]
            });
        }
    }

    /**
     * Rendre les détails d'un exercice
     */
    function renderExerciseDetails(exercise) {
        return `
            <div class="exercise-details">
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Groupe musculaire:</strong>
                        <span>${getMuscleGroupName(exercise.muscle_group)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Point d'ancrage:</strong>
                        <span>${getAnchorName(exercise.anchor_point)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Type:</strong>
                        <span>${getExerciseTypeName(exercise.exercise_type)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Mode:</strong>
                        <span>${exercise.exercise_mode === 'reps' ? 'Répétitions' : 'Temps'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Temps de repos:</strong>
                        <span>${exercise.default_rest_time || 90} secondes</span>
                    </div>
                    ${exercise.default_duration ? `
                        <div class="detail-item">
                            <strong>Durée par défaut:</strong>
                            <span>${exercise.default_duration} secondes</span>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <strong>Unilatéral:</strong>
                        <span>${exercise.is_unilateral ? 'Oui' : 'Non'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Source:</strong>
                        <span>${exercise.is_predefined ? 'SmartWorkout' : 'Personnalisé'}</span>
                    </div>
                </div>
                
                ${exercise.description ? `
                    <div class="detail-description">
                        <strong>Description:</strong>
                        <p>${exercise.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Fonctions utilitaires pour l'affichage
    function getMuscleGroupIcon(group) {
        const icons = {
            'echauffement': '🔥',
            'biceps': '💪',
            'triceps': '🔱',
            'epaules': '🏔️',
            'dos': '🛡️',
            'jambes': '🦵',
            'pectoraux': '🛡️'
        };
        return icons[group] || '🏋️';
    }

    function getMuscleGroupName(group) {
        const names = {
            'echauffement': 'Échauffement',
            'biceps': 'Biceps',
            'triceps': 'Triceps',
            'epaules': 'Épaules',
            'dos': 'Dos',
            'jambes': 'Jambes',
            'pectoraux': 'Pectoraux'
        };
        return names[group] || group;
    }

    function getAnchorIcon(anchor) {
        const icons = {
            'none': '🚫',
            'door-low': '🚪⬇️',
            'door-middle': '🚪➡️',
            'door-high': '🚪⬆️',
            'floor': '🟫',
            'body': '🧍'
        };
        return icons[anchor] || '🏋️';
    }

    function getAnchorName(anchor) {
        const names = {
            'none': 'Aucun',
            'door-low': 'Porte Bas',
            'door-middle': 'Porte Milieu',
            'door-high': 'Porte Haut',
            'floor': 'Sol',
            'body': 'Corps'
        };
        return names[anchor] || anchor;
    }

    function getExerciseTypeName(type) {
        const names = {
            'bodyweight': 'Poids du corps',
            'elastics': 'Élastiques',
            'weights': 'Poids'
        };
        return names[type] || type;
    }

    /**
     * Afficher une erreur
     */
    function showError(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            alert(message);
        }
    }

    // Gestionnaires d'événements
    function handleExercisesLoaded(data) {
        console.log(`📋 ${data.count} exercices chargés`);
        loadExercises();
    }

    function handleExerciseAdded(data) {
        console.log('➕ Exercice ajouté :', data.exercise.name);
        currentExercises.unshift(data.exercise);
        applyCurrentFilters();
    }

    function handleExerciseUpdated(data) {
        console.log('✏️ Exercice modifié :', data.exercise.name);
        const index = currentExercises.findIndex(ex => ex.id === data.exercise.id);
        if (index !== -1) {
            currentExercises[index] = data.exercise;
            applyCurrentFilters();
        }
    }

    function handleExerciseRemoved(data) {
        console.log('🗑️ Exercice supprimé :', data.exercise.name);
        currentExercises = currentExercises.filter(ex => ex.id !== data.exercise.id);
        applyCurrentFilters();
    }

    // Interface publique
    return {
        init,
        render,
        handleSearch,
        applyFilters,
        clearFilters,
        showAddExerciseModal,
        showEditExerciseModal,
        showExerciseDetails,
        confirmDeleteExercise,
        addToSession,
        toggleModeFields
    };
})();

// Export global
window.ExercisesView = ExercisesView;