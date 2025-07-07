/**
 * SmartTrack - Vue Session Live
 * Interface d'entraînement en temps réel avec timer et progression
 */

const LiveSessionView = (function() {
    let currentSession = null;
    let currentExerciseIndex = 0;
    let currentSetIndex = 0;
    let isActive = false;
    let isPaused = false;
    let sessionTimer = null;
    let restTimer = null;
    let exerciseTimer = null;

    /**
     * Initialiser la vue
     */
    function init() {
        console.log('🎨 Initialisation LiveSessionView...');
        
        // Écouter les événements
        if (typeof EventBus !== 'undefined') {
            EventBus.on('sessions:live-started', handleSessionStarted);
            EventBus.on('sessions:live-paused', handleSessionPaused);
            EventBus.on('sessions:live-resumed', handleSessionResumed);
            EventBus.on('sessions:live-completed', handleSessionCompleted);
            EventBus.on('sessions:set-completed', handleSetCompleted);
            EventBus.on('timer:tick', handleTimerTick);
        }
    }

    /**
     * Rendre l'interface de session live
     */
    async function render() {
        const container = document.getElementById('app-content');
        if (!container) return;

        // Charger la session courante
        await loadCurrentSession();

        if (!currentSession || !currentSession.exercises || currentSession.exercises.length === 0) {
            renderNoActiveSession();
            return;
        }

        container.innerHTML = `
            <div class="screen live-session-screen">
                <!-- Header Session -->
                <header class="live-session-header">
                    <div class="session-info">
                        <h1 class="session-title">${currentSession.name}</h1>
                        <div class="session-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="session-progress" style="width: ${calculateSessionProgress()}%"></div>
                            </div>
                            <span class="progress-text" id="session-progress-text">
                                ${currentExerciseIndex + 1} / ${currentSession.exercises.length} exercices
                            </span>
                        </div>
                    </div>
                    
                    <div class="session-controls">
                        <button class="btn btn-secondary" onclick="LiveSessionView.pauseSession()" id="pause-btn">
                            <span>⏸️</span>
                            Pause
                        </button>
                        <button class="btn btn-danger" onclick="LiveSessionView.endSession()">
                            <span>🏁</span>
                            Terminer
                        </button>
                    </div>
                </header>

                <!-- Timer Principal -->
                <div class="main-timer-section">
                    <div class="timer-display" id="main-timer">
                        <div class="timer-value" id="timer-value">00:00</div>
                        <div class="timer-label" id="timer-label">Session</div>
                    </div>
                    
                    <div class="timer-controls">
                        <button class="btn btn-lg btn-primary" id="main-action-btn" onclick="LiveSessionView.handleMainAction()">
                            <span id="main-action-icon">▶️</span>
                            <span id="main-action-text">Commencer</span>
                        </button>
                    </div>
                </div>

                <!-- Exercice Actuel -->
                <div class="current-exercise-section">
                    <div class="exercise-card current-exercise" id="current-exercise">
                        ${renderCurrentExercise()}
                    </div>
                </div>

                <!-- Sets de l'exercice -->
                <div class="sets-section">
                    <div class="sets-header">
                        <h3>Sets à réaliser</h3>
                        <div class="sets-progress">
                            <span id="sets-progress">${currentSetIndex + 1} / ${getCurrentExercise()?.sets?.length || 0}</span>
                        </div>
                    </div>
                    
                    <div class="sets-list" id="sets-list">
                        ${renderSets()}
                    </div>
                </div>

                <!-- Navigation Exercices -->
                <div class="exercise-navigation">
                    <button class="btn btn-secondary" 
                            onclick="LiveSessionView.previousExercise()" 
                            ${currentExerciseIndex === 0 ? 'disabled' : ''}>
                        <span>⬅️</span>
                        Précédent
                    </button>
                    
                    <div class="exercise-indicator">
                        ${renderExerciseIndicator()}
                    </div>
                    
                    <button class="btn btn-secondary" 
                            onclick="LiveSessionView.nextExercise()" 
                            ${currentExerciseIndex >= currentSession.exercises.length - 1 ? 'disabled' : ''}>
                        <span>➡️</span>
                        Suivant
                    </button>
                </div>

                <!-- Exercices Suivants -->
                <div class="upcoming-exercises">
                    <h3>À venir</h3>
                    <div class="upcoming-list" id="upcoming-list">
                        ${renderUpcomingExercises()}
                    </div>
                </div>

                <!-- Modal Rest Timer -->
                <div class="rest-modal" id="rest-modal" style="display: none;">
                    <div class="rest-content">
                        <div class="rest-timer">
                            <div class="rest-timer-value" id="rest-timer-value">90</div>
                            <div class="rest-timer-label">Secondes de repos</div>
                        </div>
                        
                        <div class="rest-exercise-info">
                            <h4>Prochain set :</h4>
                            <p id="next-set-info">Set 2 - 12 reps</p>
                        </div>
                        
                        <div class="rest-controls">
                            <button class="btn btn-secondary" onclick="LiveSessionView.skipRest()">
                                <span>⏭️</span>
                                Passer
                            </button>
                            <button class="btn btn-primary" onclick="LiveSessionView.addRestTime()">
                                <span>➕</span>
                                +30s
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Session -->
                <div class="session-stats" id="session-stats">
                    ${renderSessionStats()}
                </div>
            </div>
        `;

        // Initialiser l'état de la session
        initializeSessionState();
    }

    /**
     * Charger la session courante
     */
    async function loadCurrentSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                currentSession = await SessionsModel.getCurrentSession();
                
                if (currentSession && currentSession.status === 'active') {
                    // Restaurer l'état de la session
                    currentExerciseIndex = currentSession.current_exercise_index || 0;
                    currentSetIndex = currentSession.current_set_index || 0;
                    isActive = true;
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement session live :', error);
        }
    }

    /**
     * Rendre l'exercice actuel
     */
    function renderCurrentExercise() {
        const exercise = getCurrentExercise();
        if (!exercise) return '<p>Aucun exercice actuel</p>';

        return `
            <div class="exercise-header">
                <div class="exercise-icon">${getMuscleGroupIcon(exercise.muscle_group)}</div>
                <div class="exercise-info">
                    <h2 class="exercise-name">${exercise.name}</h2>
                    <div class="exercise-meta">
                        <span class="muscle-group">${getMuscleGroupName(exercise.muscle_group)}</span>
                        <span class="exercise-type">${getExerciseTypeName(exercise.exercise_type)}</span>
                    </div>
                </div>
            </div>
            
            ${exercise.description ? `
                <div class="exercise-description">
                    <p>${exercise.description}</p>
                </div>
            ` : ''}
            
            <div class="exercise-instructions">
                ${renderExerciseInstructions(exercise)}
            </div>
        `;
    }

    /**
     * Rendre les instructions d'exercice
     */
    function renderExerciseInstructions(exercise) {
        const currentSet = getCurrentSet();
        if (!currentSet) return '';

        if (exercise.exercise_mode === 'time') {
            return `
                <div class="instruction-item">
                    <div class="instruction-icon">⏱️</div>
                    <div class="instruction-text">
                        <strong>Durée :</strong> ${currentSet.duration} secondes
                    </div>
                </div>
                <div class="instruction-item">
                    <div class="instruction-icon">💪</div>
                    <div class="instruction-text">
                        Maintenez l'effort pendant toute la durée
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="instruction-item">
                    <div class="instruction-icon">🔢</div>
                    <div class="instruction-text">
                        <strong>Répétitions :</strong> ${currentSet.reps}
                    </div>
                </div>
                ${currentSet.weight > 0 ? `
                    <div class="instruction-item">
                        <div class="instruction-icon">⚖️</div>
                        <div class="instruction-text">
                            <strong>Poids :</strong> ${currentSet.weight} kg
                        </div>
                    </div>
                ` : ''}
                <div class="instruction-item">
                    <div class="instruction-icon">💪</div>
                    <div class="instruction-text">
                        Effectuez les répétitions avec une bonne forme
                    </div>
                </div>
            `;
        }
    }

    /**
     * Rendre les sets
     */
    function renderSets() {
        const exercise = getCurrentExercise();
        if (!exercise || !exercise.sets) return '';

        return exercise.sets.map((set, index) => `
            <div class="set-item ${index === currentSetIndex ? 'current' : ''} ${set.completed ? 'completed' : ''}" 
                 data-set-index="${index}">
                <div class="set-number">${index + 1}</div>
                
                <div class="set-details">
                    ${exercise.exercise_mode === 'time' ? `
                        <span class="set-duration">${set.duration}s</span>
                    ` : `
                        <span class="set-reps">${set.reps} reps</span>
                        ${set.weight > 0 ? `<span class="set-weight">${set.weight}kg</span>` : ''}
                    `}
                    <span class="set-rest">Repos: ${set.rest_time}s</span>
                </div>
                
                <div class="set-status">
                    ${set.completed ? '✅' : (index === currentSetIndex ? '⏳' : '⏸️')}
                </div>
                
                ${index === currentSetIndex ? `
                    <button class="btn btn-sm btn-primary" onclick="LiveSessionView.completeCurrentSet()">
                        <span>✓</span>
                        Terminé
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Rendre l'indicateur d'exercices
     */
    function renderExerciseIndicator() {
        if (!currentSession || !currentSession.exercises) return '';

        return currentSession.exercises.map((exercise, index) => `
            <div class="exercise-dot ${index === currentExerciseIndex ? 'current' : ''} ${isExerciseCompleted(index) ? 'completed' : ''}"
                 title="${exercise.name}">
                ${index + 1}
            </div>
        `).join('');
    }

    /**
     * Rendre les exercices à venir
     */
    function renderUpcomingExercises() {
        if (!currentSession || !currentSession.exercises) return '';

        const upcomingExercises = currentSession.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4);
        
        if (upcomingExercises.length === 0) {
            return '<p class="no-upcoming">Plus d\'exercices - Fin de session proche !</p>';
        }

        return upcomingExercises.map((exercise, index) => `
            <div class="upcoming-exercise">
                <div class="upcoming-icon">${getMuscleGroupIcon(exercise.muscle_group)}</div>
                <div class="upcoming-info">
                    <h4>${exercise.name}</h4>
                    <p>${exercise.sets ? exercise.sets.length : 0} sets - ${getMuscleGroupName(exercise.muscle_group)}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Rendre les statistiques de session
     */
    function renderSessionStats() {
        const stats = calculateSessionStats();
        
        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-info">
                        <span class="stat-value">${formatDuration(stats.elapsedTime)}</span>
                        <span class="stat-label">Temps écoulé</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-info">
                        <span class="stat-value">${stats.completedSets}</span>
                        <span class="stat-label">Sets terminés</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">💪</div>
                    <div class="stat-info">
                        <span class="stat-value">${stats.completedExercises}</span>
                        <span class="stat-label">Exercices finis</span>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-info">
                        <span class="stat-value">${stats.progressPercentage}%</span>
                        <span class="stat-label">Progression</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendre l'écran "Pas de session active"
     */
    function renderNoActiveSession() {
        const container = document.getElementById('app-content');
        if (container) {
            container.innerHTML = `
                <div class="screen live-session-screen">
                    <div class="no-session">
                        <div class="no-session-icon">⚔️</div>
                        <h2>Aucune session active</h2>
                        <p>Vous devez d'abord préparer une session avant de pouvoir l'exécuter.</p>
                        <div class="no-session-actions">
                            <button class="btn btn-primary" onclick="LiveSessionView.goToPreparation()">
                                <span>📋</span>
                                Préparer une session
                            </button>
                            <button class="btn btn-secondary" onclick="LiveSessionView.goToDashboard()">
                                <span>🏰</span>
                                Retour au QG
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Initialiser l'état de la session
     */
    function initializeSessionState() {
        updateUI();
        
        if (isActive) {
            startSessionTimer();
        }
    }

    /**
     * Mettre à jour l'interface
     */
    function updateUI() {
        updateMainActionButton();
        updateProgress();
        updateCurrentExercise();
        updateSets();
        updateStats();
    }

    /**
     * Mettre à jour le bouton d'action principal
     */
    function updateMainActionButton() {
        const btn = document.getElementById('main-action-btn');
        const icon = document.getElementById('main-action-icon');
        const text = document.getElementById('main-action-text');
        
        if (!btn || !icon || !text) return;

        if (!isActive) {
            icon.textContent = '▶️';
            text.textContent = 'Commencer';
            btn.className = 'btn btn-lg btn-primary';
        } else if (isPaused) {
            icon.textContent = '▶️';
            text.textContent = 'Reprendre';
            btn.className = 'btn btn-lg btn-primary';
        } else {
            const currentSet = getCurrentSet();
            if (currentSet && !currentSet.completed) {
                icon.textContent = '✓';
                text.textContent = 'Terminer le set';
                btn.className = 'btn btn-lg btn-success';
            } else {
                icon.textContent = '➡️';
                text.textContent = 'Set suivant';
                btn.className = 'btn btn-lg btn-primary';
            }
        }
    }

    /**
     * Gérer l'action principale
     */
    async function handleMainAction() {
        try {
            if (!isActive) {
                await startSession();
            } else if (isPaused) {
                await resumeSession();
            } else {
                const currentSet = getCurrentSet();
                if (currentSet && !currentSet.completed) {
                    await completeCurrentSet();
                } else {
                    await nextSet();
                }
            }
        } catch (error) {
            console.error('❌ Erreur action principale :', error);
            showError('Erreur lors de l\'action');
        }
    }

    /**
     * Démarrer la session
     */
    async function startSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.startLiveSession();
                isActive = true;
                isPaused = false;
                
                startSessionTimer();
                updateUI();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session démarrée ! Bon entraînement !');
                }
            }
        } catch (error) {
            console.error('❌ Erreur démarrage session :', error);
            throw error;
        }
    }

    /**
     * Mettre en pause la session
     */
    async function pauseSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.pauseLiveSession();
                isPaused = true;
                
                stopAllTimers();
                updateUI();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Session mise en pause');
                }
            }
        } catch (error) {
            console.error('❌ Erreur pause session :', error);
            showError('Erreur lors de la pause');
        }
    }

    /**
     * Reprendre la session
     */
    async function resumeSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.resumeLiveSession();
                isPaused = false;
                
                startSessionTimer();
                updateUI();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session reprise !');
                }
            }
        } catch (error) {
            console.error('❌ Erreur reprise session :', error);
            throw error;
        }
    }

    /**
     * Terminer la session
     */
    async function endSession() {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.confirm({
                    title: 'Terminer la session',
                    message: 'Êtes-vous sûr de vouloir terminer cette session d\'entraînement ?',
                    onConfirm: async () => {
                        await finishSession();
                    }
                });
            } else {
                await finishSession();
            }
        } catch (error) {
            console.error('❌ Erreur fin session :', error);
            showError('Erreur lors de la fin de session');
        }
    }

    /**
     * Finaliser la session
     */
    async function finishSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.finishLiveSession();
                
                stopAllTimers();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session terminée ! Félicitations !');
                }
                
                // Naviguer vers le résumé ou dashboard
                if (typeof Router !== 'undefined') {
                    Router.navigate('dashboard');
                }
            }
        } catch (error) {
            console.error('❌ Erreur finalisation session :', error);
            throw error;
        }
    }

    /**
     * Terminer le set actuel
     */
    async function completeCurrentSet() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.completeSet(currentExerciseIndex, currentSetIndex);
                
                const exercise = getCurrentExercise();
                const nextSetIndex = currentSetIndex + 1;
                
                // Vérifier si c'était le dernier set de l'exercice
                if (nextSetIndex >= exercise.sets.length) {
                    // Exercice terminé
                    await completeExercise();
                } else {
                    // Démarrer le repos
                    const currentSet = getCurrentSet();
                    if (currentSet && currentSet.rest_time > 0) {
                        startRestTimer(currentSet.rest_time);
                    }
                    
                    currentSetIndex = nextSetIndex;
                }
                
                updateUI();
            }
        } catch (error) {
            console.error('❌ Erreur complétion set :', error);
            throw error;
        }
    }

    /**
     * Passer au set suivant
     */
    async function nextSet() {
        const exercise = getCurrentExercise();
        if (!exercise) return;

        if (currentSetIndex < exercise.sets.length - 1) {
            currentSetIndex++;
        } else {
            await nextExercise();
        }
        
        updateUI();
    }

    /**
     * Exercice précédent
     */
    function previousExercise() {
        if (currentExerciseIndex > 0) {
            currentExerciseIndex--;
            currentSetIndex = 0;
            updateUI();
        }
    }

    /**
     * Exercice suivant
     */
    async function nextExercise() {
        if (currentExerciseIndex < currentSession.exercises.length - 1) {
            currentExerciseIndex++;
            currentSetIndex = 0;
            updateUI();
        } else {
            // Dernière exercice - terminer la session
            await finishSession();
        }
    }

    /**
     * Terminer l'exercice actuel
     */
    async function completeExercise() {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // Ajouter de l'XP pour l'exercice terminé
                await GamificationModel.addXP(50, 'exercise_completed');
            }
            
            await nextExercise();
            
        } catch (error) {
            console.error('❌ Erreur complétion exercice :', error);
        }
    }

    /**
     * Démarrer le timer de repos
     */
    function startRestTimer(duration) {
        const modal = document.getElementById('rest-modal');
        const timerValue = document.getElementById('rest-timer-value');
        
        if (modal) modal.style.display = 'flex';
        
        let timeLeft = duration;
        restTimer = setInterval(() => {
            timeLeft--;
            
            if (timerValue) {
                timerValue.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(restTimer);
                if (modal) modal.style.display = 'none';
                
                // Son ou vibration pour indiquer la fin du repos
                playRestEndSound();
            }
        }, 1000);
    }

    /**
     * Passer le repos
     */
    function skipRest() {
        if (restTimer) {
            clearInterval(restTimer);
            restTimer = null;
        }
        
        const modal = document.getElementById('rest-modal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * Ajouter du temps de repos
     */
    function addRestTime() {
        const timerValue = document.getElementById('rest-timer-value');
        if (timerValue) {
            const currentTime = parseInt(timerValue.textContent);
            timerValue.textContent = currentTime + 30;
        }
    }

    /**
     * Démarrer le timer de session
     */
    function startSessionTimer() {
        if (sessionTimer) clearInterval(sessionTimer);
        
        sessionTimer = setInterval(() => {
            updateSessionTimer();
        }, 1000);
    }

    /**
     * Arrêter tous les timers
     */
    function stopAllTimers() {
        if (sessionTimer) {
            clearInterval(sessionTimer);
            sessionTimer = null;
        }
        
        if (restTimer) {
            clearInterval(restTimer);
            restTimer = null;
        }
        
        if (exerciseTimer) {
            clearInterval(exerciseTimer);
            exerciseTimer = null;
        }
    }

    /**
     * Mettre à jour le timer de session
     */
    function updateSessionTimer() {
        const timerValue = document.getElementById('timer-value');
        if (timerValue && currentSession) {
            const elapsed = Date.now() - (currentSession.started_at || Date.now());
            timerValue.textContent = formatDuration(elapsed);
        }
    }

    // Fonctions utilitaires et getters
    function getCurrentExercise() {
        return currentSession && currentSession.exercises ? 
            currentSession.exercises[currentExerciseIndex] : null;
    }

    function getCurrentSet() {
        const exercise = getCurrentExercise();
        return exercise && exercise.sets ? exercise.sets[currentSetIndex] : null;
    }

    function calculateSessionProgress() {
        if (!currentSession || !currentSession.exercises) return 0;
        
        let totalSets = 0;
        let completedSets = 0;
        
        currentSession.exercises.forEach((exercise, exerciseIndex) => {
            if (exercise.sets) {
                totalSets += exercise.sets.length;
                
                if (exerciseIndex < currentExerciseIndex) {
                    // Exercice précédent - tous les sets complétés
                    completedSets += exercise.sets.length;
                } else if (exerciseIndex === currentExerciseIndex) {
                    // Exercice actuel - sets jusqu'à l'index actuel
                    completedSets += currentSetIndex;
                }
            }
        });
        
        return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    }

    function calculateSessionStats() {
        if (!currentSession) {
            return {
                elapsedTime: 0,
                completedSets: 0,
                completedExercises: 0,
                progressPercentage: 0
            };
        }

        let completedSets = 0;
        let completedExercises = 0;
        
        currentSession.exercises.forEach((exercise, exerciseIndex) => {
            if (exercise.sets) {
                const exerciseCompletedSets = exercise.sets.filter(set => set.completed).length;
                completedSets += exerciseCompletedSets;
                
                if (exerciseCompletedSets === exercise.sets.length) {
                    completedExercises++;
                }
            }
        });

        return {
            elapsedTime: currentSession.started_at ? Date.now() - currentSession.started_at : 0,
            completedSets,
            completedExercises,
            progressPercentage: calculateSessionProgress()
        };
    }

    function isExerciseCompleted(exerciseIndex) {
        if (!currentSession || !currentSession.exercises[exerciseIndex]) return false;
        
        const exercise = currentSession.exercises[exerciseIndex];
        return exercise.sets && exercise.sets.every(set => set.completed);
    }

    function updateProgress() {
        const progressBar = document.getElementById('session-progress');
        const progressText = document.getElementById('session-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${calculateSessionProgress()}%`;
        }
        
        if (progressText && currentSession) {
            progressText.textContent = `${currentExerciseIndex + 1} / ${currentSession.exercises.length} exercices`;
        }
    }

    function updateCurrentExercise() {
        const container = document.getElementById('current-exercise');
        if (container) {
            container.innerHTML = renderCurrentExercise();
        }
    }

    function updateSets() {
        const container = document.getElementById('sets-list');
        if (container) {
            container.innerHTML = renderSets();
        }
        
        const setsProgress = document.getElementById('sets-progress');
        if (setsProgress) {
            const exercise = getCurrentExercise();
            setsProgress.textContent = `${currentSetIndex + 1} / ${exercise?.sets?.length || 0}`;
        }
    }

    function updateStats() {
        const container = document.getElementById('session-stats');
        if (container) {
            container.innerHTML = renderSessionStats();
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

    function getExerciseTypeName(type) {
        const names = {
            'bodyweight': 'Poids du corps',
            'elastics': 'Élastiques',
            'weights': 'Poids'
        };
        return names[type] || type;
    }

    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
    }

    function playRestEndSound() {
        // Jouer un son ou déclencher une vibration si supporté
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Son avec Web Audio API (optionnel)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio non supporté');
        }
    }

    function showError(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            alert(message);
        }
    }

    // Navigation
    function goToPreparation() {
        if (typeof Router !== 'undefined') {
            Router.navigate('preparation');
        }
    }

    function goToDashboard() {
        if (typeof Router !== 'undefined') {
            Router.navigate('dashboard');
        }
    }

    // Gestionnaires d'événements
    function handleSessionStarted(data) {
        currentSession = data.session;
        isActive = true;
        isPaused = false;
        startSessionTimer();
        updateUI();
    }

    function handleSessionPaused(data) {
        isPaused = true;
        stopAllTimers();
        updateUI();
    }

    function handleSessionResumed(data) {
        isPaused = false;
        startSessionTimer();
        updateUI();
    }

    function handleSessionCompleted(data) {
        isActive = false;
        stopAllTimers();
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.success('Session terminée avec succès !');
        }
    }

    function handleSetCompleted(data) {
        if (data.exerciseIndex === currentExerciseIndex && data.setIndex === currentSetIndex) {
            updateUI();
        }
    }

    function handleTimerTick(data) {
        updateSessionTimer();
    }

    // Interface publique
    return {
        init,
        render,
        handleMainAction,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
        completeCurrentSet,
        nextSet,
        previousExercise,
        nextExercise,
        skipRest,
        addRestTime,
        goToPreparation,
        goToDashboard
    };
})();

// Export global
window.LiveSessionView = LiveSessionView;