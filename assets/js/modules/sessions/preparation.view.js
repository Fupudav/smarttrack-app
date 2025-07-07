/**
 * SmartTrack - Vue Préparation de Session
 * Interface pour planifier et configurer les sessions d'entraînement
 */

const PreparationView = (function() {
    let currentSession = null;
    let availableExercises = [];
    let selectedExercises = [];
    let availableTemplates = [];

    /**
     * Initialiser la vue
     */
    function init() {
        console.log('🎨 Initialisation PreparationView...');
        
        // Écouter les événements
        if (typeof EventBus !== 'undefined') {
            EventBus.on('sessions:current-updated', handleSessionUpdated);
            EventBus.on('exercises:loaded', handleExercisesLoaded);
            EventBus.on('templates:loaded', handleTemplatesLoaded);
        }
    }

    /**
     * Rendre la page de préparation
     */
    async function render() {
        const container = document.getElementById('app-content');
        if (!container) return;

        // Charger les données nécessaires
        await loadPreparationData();

        container.innerHTML = `
            <div class="screen preparation-screen">
                <header class="screen-header">
                    <h1 class="screen-title">
                        <span>📋</span>
                        Préparation de Session
                    </h1>
                    <div class="header-actions">
                        <button class="btn btn-secondary" onclick="PreparationView.goBack()">
                            <span>←</span>
                            Retour
                        </button>
                        <button class="btn btn-primary" onclick="PreparationView.startSession()" id="start-session-btn">
                            <span>▶️</span>
                            Démarrer l'entraînement
                        </button>
                    </div>
                </header>

                <div class="screen-content">
                    <!-- Configuration de session -->
                    <div class="session-config-section">
                        <div class="session-config-card">
                            <h2>⚙️ Configuration</h2>
                            
                            <div class="config-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="session-name">Nom de la session</label>
                                        <input type="text" 
                                               id="session-name" 
                                               value="${currentSession ? currentSession.name : 'Nouvelle session'}"
                                               onchange="PreparationView.updateSessionName(this.value)"
                                               placeholder="Ex: Entraînement du matin">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="session-type">Type de session</label>
                                        <select id="session-type" onchange="PreparationView.updateSessionType(this.value)">
                                            <option value="custom" ${currentSession?.type === 'custom' ? 'selected' : ''}>Personnalisée</option>
                                            <option value="quick" ${currentSession?.type === 'quick' ? 'selected' : ''}>Rapide</option>
                                            <option value="program" ${currentSession?.type === 'program' ? 'selected' : ''}>Programme</option>
                                            <option value="template" ${currentSession?.type === 'template' ? 'selected' : ''}>Template</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="session-duration">Durée estimée</label>
                                        <input type="number" 
                                               id="session-duration" 
                                               value="${currentSession ? currentSession.estimated_duration || 45 : 45}"
                                               onchange="PreparationView.updateSessionDuration(this.value)"
                                               min="15" 
                                               max="180" 
                                               step="15">
                                        <span class="input-suffix">minutes</span>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="session-intensity">Intensité</label>
                                        <select id="session-intensity" onchange="PreparationView.updateSessionIntensity(this.value)">
                                            <option value="light" ${currentSession?.intensity === 'light' ? 'selected' : ''}>Légère</option>
                                            <option value="moderate" ${currentSession?.intensity === 'moderate' ? 'selected' : ''}>Modérée</option>
                                            <option value="high" ${currentSession?.intensity === 'high' ? 'selected' : ''}>Intense</option>
                                            <option value="extreme" ${currentSession?.intensity === 'extreme' ? 'selected' : ''}>Extrême</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Templates rapides -->
                    <div class="templates-section">
                        <div class="section-header">
                            <h2>📄 Templates Rapides</h2>
                            <button class="btn btn-sm btn-secondary" onclick="PreparationView.goToTemplates()">
                                Voir tous
                            </button>
                        </div>
                        <div class="templates-grid" id="templates-grid">
                            ${renderTemplates()}
                        </div>
                    </div>

                    <!-- Construction de session -->
                    <div class="session-builder">
                        <div class="builder-grid">
                            <!-- Exercices disponibles -->
                            <div class="exercises-panel">
                                <div class="panel-header">
                                    <h3>🏋️ Exercices Disponibles</h3>
                                    <div class="panel-actions">
                                        <input type="text" 
                                               class="search-input" 
                                               placeholder="🔍 Rechercher..."
                                               oninput="PreparationView.searchExercises(this.value)">
                                        <select class="filter-select" onchange="PreparationView.filterExercises(this.value)">
                                            <option value="all">Tous les groupes</option>
                                            <option value="echauffement">Échauffement</option>
                                            <option value="biceps">Biceps</option>
                                            <option value="triceps">Triceps</option>
                                            <option value="epaules">Épaules</option>
                                            <option value="dos">Dos</option>
                                            <option value="jambes">Jambes</option>
                                            <option value="pectoraux">Pectoraux</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="exercises-list" id="available-exercises">
                                    ${renderAvailableExercises()}
                                </div>
                            </div>

                            <!-- Session en cours -->
                            <div class="session-panel">
                                <div class="panel-header">
                                    <h3>⚔️ Session en Cours</h3>
                                    <div class="session-stats">
                                        <span id="exercise-count">${selectedExercises.length} exercices</span>
                                        <span id="estimated-time">${calculateEstimatedTime()} min</span>
                                    </div>
                                </div>
                                
                                <div class="session-exercises" id="session-exercises" ondrop="PreparationView.handleDrop(event)" ondragover="PreparationView.handleDragOver(event)">
                                    ${selectedExercises.length === 0 ? renderEmptySession() : renderSessionExercises()}
                                </div>
                                
                                <div class="session-actions">
                                    <button class="btn btn-secondary btn-sm" onclick="PreparationView.clearSession()">
                                        <span>🗑️</span>
                                        Vider la session
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="PreparationView.saveAsTemplate()">
                                        <span>💾</span>
                                        Sauver comme template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Activer le drag and drop
        setupDragAndDrop();
        
        // Mettre à jour l'état du bouton de démarrage
        updateStartButton();
    }

    /**
     * Charger les données nécessaires
     */
    async function loadPreparationData() {
        try {
            // Charger la session courante
            if (typeof SessionsModel !== 'undefined') {
                currentSession = await SessionsModel.getCurrentSession();
                if (currentSession && currentSession.exercises) {
                    selectedExercises = currentSession.exercises;
                }
            }

            // Charger les exercices disponibles
            if (typeof ExercisesModel !== 'undefined') {
                availableExercises = await ExercisesModel.getAll();
            }

            // Charger les templates
            if (typeof TemplatesModel !== 'undefined') {
                availableTemplates = await TemplatesModel.getAll();
            }

        } catch (error) {
            console.error('❌ Erreur chargement données préparation :', error);
        }
    }

    /**
     * Rendre les templates rapides
     */
    function renderTemplates() {
        if (!availableTemplates || availableTemplates.length === 0) {
            return `
                <div class="template-card template-create">
                    <div class="template-icon">📄</div>
                    <h4>Créer votre premier template</h4>
                    <p>Sauvegardez vos sessions favorites</p>
                </div>
            `;
        }

        return availableTemplates.slice(0, 3).map(template => `
            <div class="template-card" onclick="PreparationView.loadTemplate('${template.id}')">
                <div class="template-header">
                    <h4>${template.name}</h4>
                    <span class="template-exercises">${template.exercises.length} exercices</span>
                </div>
                <div class="template-info">
                    <span class="template-duration">⏱️ ${template.estimated_duration || 45} min</span>
                    <span class="template-muscle-groups">${getTemplateMuscleGroups(template)}</span>
                </div>
                <div class="template-actions">
                    <button class="btn btn-primary btn-sm">
                        <span>📋</span>
                        Utiliser
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Rendre les exercices disponibles
     */
    function renderAvailableExercises() {
        if (!availableExercises || availableExercises.length === 0) {
            return `
                <div class="empty-exercises">
                    <p>Aucun exercice disponible</p>
                </div>
            `;
        }

        return availableExercises.map(exercise => `
            <div class="exercise-item" 
                 draggable="true" 
                 ondragstart="PreparationView.handleDragStart(event, '${exercise.id}')"
                 onclick="PreparationView.addExercise('${exercise.id}')">
                <div class="exercise-info">
                    <div class="exercise-header">
                        <span class="exercise-icon">${getMuscleGroupIcon(exercise.muscle_group)}</span>
                        <span class="exercise-name">${exercise.name}</span>
                    </div>
                    <div class="exercise-meta">
                        <span class="exercise-group">${getMuscleGroupName(exercise.muscle_group)}</span>
                        <span class="exercise-mode">${exercise.exercise_mode === 'reps' ? 'Répétitions' : 'Temps'}</span>
                    </div>
                </div>
                <div class="exercise-add">
                    <span>+</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Rendre la session vide
     */
    function renderEmptySession() {
        return `
            <div class="empty-session">
                <div class="empty-icon">📋</div>
                <h3>Session vide</h3>
                <p>Glissez des exercices ici ou cliquez pour les ajouter</p>
                <div class="empty-suggestions">
                    <button class="btn btn-secondary btn-sm" onclick="PreparationView.addQuickWorkout()">
                        ⚡ Entraînement rapide
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="PreparationView.addWarmup()">
                        🔥 Ajouter échauffement
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Rendre les exercices de la session
     */
    function renderSessionExercises() {
        return selectedExercises.map((exercise, index) => `
            <div class="session-exercise" data-exercise-id="${exercise.id}" data-index="${index}">
                <div class="exercise-handle">
                    <span>⋮⋮</span>
                </div>
                
                <div class="exercise-main">
                    <div class="exercise-header">
                        <span class="exercise-icon">${getMuscleGroupIcon(exercise.muscle_group)}</span>
                        <span class="exercise-name">${exercise.name}</span>
                        <button class="btn-icon btn-danger" onclick="PreparationView.removeExercise(${index})">
                            <span>×</span>
                        </button>
                    </div>
                    
                    <div class="exercise-sets">
                        <div class="sets-header">
                            <span>Sets:</span>
                            <button class="btn-icon" onclick="PreparationView.addSet(${index})">+</button>
                        </div>
                        
                        <div class="sets-list">
                            ${renderExerciseSets(exercise, index)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Rendre les sets d'un exercice
     */
    function renderExerciseSets(exercise, exerciseIndex) {
        if (!exercise.sets || exercise.sets.length === 0) {
            return `
                <div class="no-sets">
                    <button class="btn btn-secondary btn-sm" onclick="PreparationView.addSet(${exerciseIndex})">
                        + Ajouter un set
                    </button>
                </div>
            `;
        }

        return exercise.sets.map((set, setIndex) => `
            <div class="set-item">
                <span class="set-number">${setIndex + 1}</span>
                
                ${exercise.exercise_mode === 'reps' ? `
                    <div class="set-input">
                        <input type="number" 
                               value="${set.reps || 12}" 
                               onchange="PreparationView.updateSet(${exerciseIndex}, ${setIndex}, 'reps', this.value)"
                               min="1" 
                               max="100">
                        <label>reps</label>
                    </div>
                    
                    <div class="set-input">
                        <input type="number" 
                               value="${set.weight || 0}" 
                               onchange="PreparationView.updateSet(${exerciseIndex}, ${setIndex}, 'weight', this.value)"
                               min="0" 
                               step="0.5">
                        <label>kg</label>
                    </div>
                ` : `
                    <div class="set-input">
                        <input type="number" 
                               value="${set.duration || exercise.default_duration || 30}" 
                               onchange="PreparationView.updateSet(${exerciseIndex}, ${setIndex}, 'duration', this.value)"
                               min="10" 
                               max="300">
                        <label>sec</label>
                    </div>
                `}
                
                <div class="set-input">
                    <input type="number" 
                           value="${set.rest_time || exercise.default_rest_time || 90}" 
                           onchange="PreparationView.updateSet(${exerciseIndex}, ${setIndex}, 'rest_time', this.value)"
                           min="30" 
                           max="600">
                    <label>repos</label>
                </div>
                
                <button class="btn-icon btn-danger" onclick="PreparationView.removeSet(${exerciseIndex}, ${setIndex})">
                    <span>×</span>
                </button>
            </div>
        `).join('');
    }

    /**
     * Configurer le drag and drop
     */
    function setupDragAndDrop() {
        // Déjà configuré dans le HTML via les attributs ondrag*
    }

    /**
     * Gérer le début du drag
     */
    function handleDragStart(event, exerciseId) {
        event.dataTransfer.setData('text/plain', exerciseId);
        event.currentTarget.classList.add('dragging');
    }

    /**
     * Gérer le drag over
     */
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    /**
     * Gérer le drop
     */
    function handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const exerciseId = event.dataTransfer.getData('text/plain');
        if (exerciseId) {
            addExercise(exerciseId);
        }
        
        // Nettoyer les classes de drag
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
    }

    /**
     * Ajouter un exercice à la session
     */
    function addExercise(exerciseId) {
        const exercise = availableExercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        // Vérifier si l'exercice n'est pas déjà dans la session
        if (selectedExercises.find(ex => ex.id === exerciseId)) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.warning('Cet exercice est déjà dans la session');
            }
            return;
        }

        // Créer l'exercice avec des sets par défaut
        const sessionExercise = {
            ...exercise,
            sets: generateDefaultSets(exercise)
        };

        selectedExercises.push(sessionExercise);
        
        // Mettre à jour l'affichage
        updateSessionDisplay();
        
        // Sauvegarder dans le modèle
        saveSessionToModel();
    }

    /**
     * Supprimer un exercice de la session
     */
    function removeExercise(index) {
        if (index >= 0 && index < selectedExercises.length) {
            selectedExercises.splice(index, 1);
            updateSessionDisplay();
            saveSessionToModel();
        }
    }

    /**
     * Ajouter un set à un exercice
     */
    function addSet(exerciseIndex) {
        if (exerciseIndex >= 0 && exerciseIndex < selectedExercises.length) {
            const exercise = selectedExercises[exerciseIndex];
            const newSet = generateDefaultSet(exercise);
            
            if (!exercise.sets) exercise.sets = [];
            exercise.sets.push(newSet);
            
            updateSessionDisplay();
            saveSessionToModel();
        }
    }

    /**
     * Supprimer un set
     */
    function removeSet(exerciseIndex, setIndex) {
        if (exerciseIndex >= 0 && exerciseIndex < selectedExercises.length) {
            const exercise = selectedExercises[exerciseIndex];
            if (exercise.sets && setIndex >= 0 && setIndex < exercise.sets.length) {
                exercise.sets.splice(setIndex, 1);
                updateSessionDisplay();
                saveSessionToModel();
            }
        }
    }

    /**
     * Mettre à jour un set
     */
    function updateSet(exerciseIndex, setIndex, property, value) {
        if (exerciseIndex >= 0 && exerciseIndex < selectedExercises.length) {
            const exercise = selectedExercises[exerciseIndex];
            if (exercise.sets && setIndex >= 0 && setIndex < exercise.sets.length) {
                exercise.sets[setIndex][property] = parseFloat(value) || 0;
                saveSessionToModel();
            }
        }
    }

    /**
     * Générer des sets par défaut
     */
    function generateDefaultSets(exercise) {
        const sets = [];
        const setCount = exercise.muscle_group === 'echauffement' ? 1 : 3;
        
        for (let i = 0; i < setCount; i++) {
            sets.push(generateDefaultSet(exercise));
        }
        
        return sets;
    }

    /**
     * Générer un set par défaut
     */
    function generateDefaultSet(exercise) {
        if (exercise.exercise_mode === 'time') {
            return {
                duration: exercise.default_duration || 30,
                rest_time: exercise.default_rest_time || 90,
                completed: false
            };
        } else {
            return {
                reps: exercise.muscle_group === 'echauffement' ? 10 : 12,
                weight: 0,
                rest_time: exercise.default_rest_time || 90,
                completed: false
            };
        }
    }

    /**
     * Calculer le temps estimé
     */
    function calculateEstimatedTime() {
        let totalTime = 0;
        
        selectedExercises.forEach(exercise => {
            if (exercise.sets) {
                exercise.sets.forEach(set => {
                    if (exercise.exercise_mode === 'time') {
                        totalTime += (set.duration || 30) + (set.rest_time || 90);
                    } else {
                        // Estimation: 3 secondes par rep + temps de repos
                        totalTime += ((set.reps || 12) * 3) + (set.rest_time || 90);
                    }
                });
            }
        });
        
        return Math.round(totalTime / 60); // Convertir en minutes
    }

    /**
     * Mettre à jour l'affichage de la session
     */
    function updateSessionDisplay() {
        // Mettre à jour la liste des exercices
        const sessionContainer = document.getElementById('session-exercises');
        if (sessionContainer) {
            sessionContainer.innerHTML = selectedExercises.length === 0 ? 
                renderEmptySession() : 
                renderSessionExercises();
        }
        
        // Mettre à jour les statistiques
        const exerciseCount = document.getElementById('exercise-count');
        if (exerciseCount) {
            exerciseCount.textContent = `${selectedExercises.length} exercices`;
        }
        
        const estimatedTime = document.getElementById('estimated-time');
        if (estimatedTime) {
            estimatedTime.textContent = `${calculateEstimatedTime()} min`;
        }
        
        // Mettre à jour le bouton de démarrage
        updateStartButton();
    }

    /**
     * Mettre à jour le bouton de démarrage
     */
    function updateStartButton() {
        const startBtn = document.getElementById('start-session-btn');
        if (startBtn) {
            startBtn.disabled = selectedExercises.length === 0;
            startBtn.textContent = selectedExercises.length === 0 ? 
                '⚠️ Ajoutez des exercices' : 
                '▶️ Démarrer l\'entraînement';
        }
    }

    /**
     * Sauvegarder la session dans le modèle
     */
    async function saveSessionToModel() {
        try {
            if (typeof SessionsModel !== 'undefined' && currentSession) {
                await SessionsModel.updateCurrentSession({
                    exercises: selectedExercises,
                    estimated_duration: calculateEstimatedTime()
                });
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde session :', error);
        }
    }

    // Actions publiques
    function goBack() {
        if (typeof Router !== 'undefined') {
            Router.navigate('dashboard');
        }
    }

    async function startSession() {
        if (selectedExercises.length === 0) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.warning('Ajoutez des exercices avant de démarrer');
            }
            return;
        }

        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.startLiveSession();
                
                if (typeof Router !== 'undefined') {
                    Router.navigate('live-session');
                }
            }
        } catch (error) {
            console.error('❌ Erreur démarrage session :', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error('Erreur lors du démarrage de la session');
            }
        }
    }

    function clearSession() {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.confirm({
                title: 'Vider la session',
                message: 'Êtes-vous sûr de vouloir supprimer tous les exercices ?',
                onConfirm: () => {
                    selectedExercises = [];
                    updateSessionDisplay();
                    saveSessionToModel();
                }
            });
        }
    }

    function saveAsTemplate() {
        if (selectedExercises.length === 0) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.warning('Ajoutez des exercices avant de sauvegarder');
            }
            return;
        }

        // TODO: Implémenter la sauvegarde de template
        console.log('Save as template');
    }

    function loadTemplate(templateId) {
        // TODO: Implémenter le chargement de template
        console.log('Load template:', templateId);
    }

    function searchExercises(query) {
        // TODO: Implémenter la recherche d'exercices
        console.log('Search exercises:', query);
    }

    function filterExercises(muscleGroup) {
        // TODO: Implémenter le filtrage d'exercices
        console.log('Filter exercises:', muscleGroup);
    }

    function addQuickWorkout() {
        // TODO: Ajouter un entraînement rapide prédéfini
        console.log('Add quick workout');
    }

    function addWarmup() {
        // Ajouter automatiquement des exercices d'échauffement
        const warmupExercises = availableExercises.filter(ex => ex.muscle_group === 'echauffement');
        warmupExercises.slice(0, 3).forEach(exercise => {
            addExercise(exercise.id);
        });
    }

    function updateSessionName(name) {
        if (currentSession) {
            currentSession.name = name;
            saveSessionToModel();
        }
    }

    function updateSessionType(type) {
        if (currentSession) {
            currentSession.type = type;
            saveSessionToModel();
        }
    }

    function updateSessionDuration(duration) {
        if (currentSession) {
            currentSession.estimated_duration = parseInt(duration);
            saveSessionToModel();
        }
    }

    function updateSessionIntensity(intensity) {
        if (currentSession) {
            currentSession.intensity = intensity;
            saveSessionToModel();
        }
    }

    function goToTemplates() {
        if (typeof Router !== 'undefined') {
            Router.navigate('templates');
        }
    }

    // Fonctions utilitaires
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

    function getTemplateMuscleGroups(template) {
        const groups = [...new Set(template.exercises.map(ex => ex.muscle_group))];
        return groups.slice(0, 2).map(getMuscleGroupName).join(', ') + 
               (groups.length > 2 ? '...' : '');
    }

    // Gestionnaires d'événements
    function handleSessionUpdated(data) {
        currentSession = data.session;
        if (currentSession && currentSession.exercises) {
            selectedExercises = currentSession.exercises;
            updateSessionDisplay();
        }
    }

    function handleExercisesLoaded(data) {
        availableExercises = data.exercises;
        // Mettre à jour l'affichage des exercices disponibles
        const container = document.getElementById('available-exercises');
        if (container) {
            container.innerHTML = renderAvailableExercises();
        }
    }

    function handleTemplatesLoaded(data) {
        availableTemplates = data.templates;
        // Mettre à jour l'affichage des templates
        const container = document.getElementById('templates-grid');
        if (container) {
            container.innerHTML = renderTemplates();
        }
    }

    // Interface publique
    return {
        init,
        render,
        goBack,
        startSession,
        clearSession,
        saveAsTemplate,
        loadTemplate,
        searchExercises,
        filterExercises,
        addQuickWorkout,
        addWarmup,
        updateSessionName,
        updateSessionType,
        updateSessionDuration,
        updateSessionIntensity,
        goToTemplates,
        handleDragStart,
        handleDragOver,
        handleDrop,
        addExercise,
        removeExercise,
        addSet,
        removeSet,
        updateSet
    };
})();

// Export global
window.PreparationView = PreparationView;