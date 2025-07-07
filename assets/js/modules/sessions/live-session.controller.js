/**
 * SmartTrack - Contrôleur Session Live
 * Orchestration de l'entraînement en temps réel
 */

const LiveSessionController = (function() {
    let isInitialized = false;
    let currentSession = null;
    let sessionState = {
        isActive: false,
        isPaused: false,
        startTime: null,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        elapsedTime: 0
    };

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('🎮 Initialisation LiveSessionController...');
            
            // Initialiser la vue
            if (typeof LiveSessionView !== 'undefined') {
                LiveSessionView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:live-session', handleLiveSessionRoute);
                EventBus.on('sessions:live-started', handleSessionStarted);
                EventBus.on('sessions:live-completed', handleSessionCompleted);
                EventBus.on('app:initialized', handleAppInitialized);
                EventBus.on('app:visibility-changed', handleVisibilityChanged);
            }
            
            isInitialized = true;
            console.log('✓ LiveSessionController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation LiveSessionController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers la session live
     */
    async function handleLiveSessionRoute() {
        console.log('📍 Navigation vers Session Live');
        await renderLiveSession();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - LiveSessionController prêt');
    }

    /**
     * Gérer les changements de visibilité
     */
    function handleVisibilityChanged(data) {
        if (data.isVisible && sessionState.isActive) {
            // Synchroniser l'état quand l'app redevient visible
            synchronizeSessionState();
        }
    }

    /**
     * Rendre l'interface de session live
     */
    async function renderLiveSession() {
        try {
            // Vérifier qu'une session est disponible
            await ensureActiveSession();
            
            if (typeof LiveSessionView !== 'undefined') {
                await LiveSessionView.render();
                updateActiveNavigation('live-session');
            } else {
                console.error('❌ LiveSessionView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu session live :', error);
            showErrorScreen('Erreur lors du chargement de la session live');
        }
    }

    /**
     * S'assurer qu'une session active existe
     */
    async function ensureActiveSession() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                currentSession = await SessionsModel.getCurrentSession();
                
                if (!currentSession) {
                    console.warn('⚠️ Aucune session courante - redirection vers préparation');
                    navigateToPreparation();
                    return;
                }
                
                if (currentSession.status !== 'active' && currentSession.status !== 'preparation') {
                    console.warn('⚠️ Session pas en mode live - redirection vers préparation');
                    navigateToPreparation();
                    return;
                }
                
                // Restaurer l'état de la session
                if (currentSession.status === 'active') {
                    sessionState.isActive = true;
                    sessionState.currentExerciseIndex = currentSession.current_exercise_index || 0;
                    sessionState.currentSetIndex = currentSession.current_set_index || 0;
                    sessionState.startTime = currentSession.started_at;
                }
            }
        } catch (error) {
            console.error('❌ Erreur vérification session :', error);
            throw error;
        }
    }

    /**
     * Démarrer une session live
     */
    async function startLiveSession() {
        try {
            console.log('▶️ Démarrage session live...');
            
            if (typeof SessionsModel !== 'undefined') {
                // Démarrer la session dans le modèle
                currentSession = await SessionsModel.startLiveSession();
                
                // Mettre à jour l'état local
                sessionState.isActive = true;
                sessionState.isPaused = false;
                sessionState.startTime = Date.now();
                sessionState.currentExerciseIndex = 0;
                sessionState.currentSetIndex = 0;
                
                // Démarrer les mécanismes de gamification
                await startGamificationTracking();
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:live-started', { 
                        session: currentSession,
                        state: sessionState 
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session démarrée ! Bon entraînement !');
                }
                
                return currentSession;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur démarrage session live :', error);
            showError('Erreur lors du démarrage de la session');
            throw error;
        }
    }

    /**
     * Mettre en pause la session
     */
    async function pauseLiveSession() {
        try {
            console.log('⏸️ Pause session live...');
            
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.pauseLiveSession();
                
                sessionState.isPaused = true;
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:live-paused', { 
                        session: currentSession,
                        state: sessionState 
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Session mise en pause');
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur pause session :', error);
            showError('Erreur lors de la pause');
            return false;
        }
    }

    /**
     * Reprendre la session
     */
    async function resumeLiveSession() {
        try {
            console.log('▶️ Reprise session live...');
            
            if (typeof SessionsModel !== 'undefined') {
                await SessionsModel.resumeLiveSession();
                
                sessionState.isPaused = false;
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:live-resumed', { 
                        session: currentSession,
                        state: sessionState 
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session reprise !');
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur reprise session :', error);
            showError('Erreur lors de la reprise');
            return false;
        }
    }

    /**
     * Terminer la session
     */
    async function finishLiveSession() {
        try {
            console.log('🏁 Fin session live...');
            
            if (typeof SessionsModel !== 'undefined') {
                // Calculer les statistiques finales
                const sessionStats = calculateFinalStats();
                
                // Terminer la session dans le modèle
                const completedSession = await SessionsModel.finishLiveSession(sessionStats);
                
                // Mettre à jour l'état
                sessionState.isActive = false;
                sessionState.isPaused = false;
                
                // Traitement gamification
                await processSessionCompletion(completedSession);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:live-completed', { 
                        session: completedSession,
                        stats: sessionStats 
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Session terminée ! Félicitations !');
                }
                
                // Afficher le résumé ou naviguer
                await showSessionSummary(completedSession, sessionStats);
                
                return completedSession;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur fin session :', error);
            showError('Erreur lors de la fin de session');
            throw error;
        }
    }

    /**
     * Terminer un set
     */
    async function completeSet(exerciseIndex, setIndex, actualData = {}) {
        try {
            console.log(`✓ Complétion set ${setIndex + 1} de l'exercice ${exerciseIndex + 1}`);
            
            if (typeof SessionsModel !== 'undefined') {
                // Enregistrer les données du set
                await SessionsModel.completeSet(exerciseIndex, setIndex, {
                    completed_at: Date.now(),
                    ...actualData
                });
                
                // Mettre à jour l'état local
                sessionState.currentSetIndex = setIndex;
                
                // Ajouter de l'XP pour le set
                await addXPForSet(exerciseIndex, setIndex);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sessions:set-completed', { 
                        exerciseIndex,
                        setIndex,
                        actualData,
                        session: currentSession 
                    });
                }
                
                // Vérifier si l'exercice est terminé
                const exercise = currentSession.exercises[exerciseIndex];
                if (exercise && setIndex >= exercise.sets.length - 1) {
                    await completeExercise(exerciseIndex);
                }
                
                return true;
            }
            throw new Error('SessionsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur complétion set :', error);
            showError('Erreur lors de la complétion du set');
            return false;
        }
    }

    /**
     * Terminer un exercice
     */
    async function completeExercise(exerciseIndex) {
        try {
            console.log(`🎯 Complétion exercice ${exerciseIndex + 1}`);
            
            // Ajouter de l'XP pour l'exercice
            await addXPForExercise(exerciseIndex);
            
            // Vérifier les badges débloqués
            await checkExerciseBadges(exerciseIndex);
            
            // Passer à l'exercice suivant
            if (exerciseIndex < currentSession.exercises.length - 1) {
                sessionState.currentExerciseIndex = exerciseIndex + 1;
                sessionState.currentSetIndex = 0;
            } else {
                // Dernière exercice - session terminée
                await finishLiveSession();
            }
            
            // Émettre l'événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:exercise-completed', { 
                    exerciseIndex,
                    session: currentSession 
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur complétion exercice :', error);
            return false;
        }
    }

    /**
     * Naviguer entre exercices
     */
    async function navigateToExercise(exerciseIndex) {
        try {
            if (exerciseIndex >= 0 && exerciseIndex < currentSession.exercises.length) {
                sessionState.currentExerciseIndex = exerciseIndex;
                sessionState.currentSetIndex = 0;
                
                // Sauvegarder l'état
                await saveSessionState();
                
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('❌ Erreur navigation exercice :', error);
            return false;
        }
    }

    /**
     * Démarrer le suivi gamification
     */
    async function startGamificationTracking() {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // Incrémenter le compteur de sessions
                await GamificationModel.incrementSessionCount();
                
                // Mettre à jour la série de jours
                await GamificationModel.updateDailyStreak();
                
                // Vérifier les badges de démarrage
                await GamificationModel.checkBadges(['session_started']);
            }
        } catch (error) {
            console.warn('⚠️ Erreur suivi gamification :', error);
        }
    }

    /**
     * Ajouter de l'XP pour un set
     */
    async function addXPForSet(exerciseIndex, setIndex) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const exercise = currentSession.exercises[exerciseIndex];
                const set = exercise.sets[setIndex];
                
                // Calcul XP basé sur l'exercice et le set
                let xp = 10; // Base
                
                // Bonus selon le type d'exercice
                if (exercise.muscle_group !== 'echauffement') {
                    xp += 5;
                }
                
                // Bonus selon l'intensité
                if (exercise.exercise_mode === 'time' && set.duration >= 60) {
                    xp += 5;
                } else if (exercise.exercise_mode === 'reps' && set.reps >= 15) {
                    xp += 5;
                }
                
                await GamificationModel.addXP(xp, 'set_completed');
            }
        } catch (error) {
            console.warn('⚠️ Erreur ajout XP set :', error);
        }
    }

    /**
     * Ajouter de l'XP pour un exercice
     */
    async function addXPForExercise(exerciseIndex) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const exercise = currentSession.exercises[exerciseIndex];
                
                // XP basé sur le nombre de sets
                let xp = 50 + (exercise.sets.length * 10);
                
                await GamificationModel.addXP(xp, 'exercise_completed');
            }
        } catch (error) {
            console.warn('⚠️ Erreur ajout XP exercice :', error);
        }
    }

    /**
     * Vérifier les badges d'exercice
     */
    async function checkExerciseBadges(exerciseIndex) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                const exercise = currentSession.exercises[exerciseIndex];
                
                // Badges spécifiques aux groupes musculaires
                const muscleGroupBadges = {
                    'biceps': 'biceps_master',
                    'triceps': 'triceps_master',
                    'pectoraux': 'chest_master',
                    'dos': 'back_master',
                    'jambes': 'legs_master',
                    'epaules': 'shoulders_master'
                };
                
                if (muscleGroupBadges[exercise.muscle_group]) {
                    await GamificationModel.checkBadges([muscleGroupBadges[exercise.muscle_group]]);
                }
                
                // Badge pour exercices d'échauffement
                if (exercise.muscle_group === 'echauffement') {
                    await GamificationModel.checkBadges(['warmup_warrior']);
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur vérification badges :', error);
        }
    }

    /**
     * Traiter la fin de session pour la gamification
     */
    async function processSessionCompletion(completedSession) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // XP de fin de session
                const bonusXP = calculateSessionBonusXP(completedSession);
                await GamificationModel.addXP(bonusXP, 'session_completed');
                
                // Vérifier les badges de session
                await GamificationModel.checkBadges([
                    'first_session',
                    'session_completionist',
                    'endurance_athlete',
                    'consistency_king'
                ]);
                
                // Mettre à jour les statistiques
                await GamificationModel.updateSessionStats(completedSession);
            }
        } catch (error) {
            console.warn('⚠️ Erreur traitement gamification :', error);
        }
    }

    /**
     * Calculer l'XP bonus de fin de session
     */
    function calculateSessionBonusXP(completedSession) {
        let bonusXP = 100; // Base
        
        // Bonus durée
        const duration = completedSession.duration || 0;
        if (duration >= 3600000) { // 1 heure
            bonusXP += 50;
        } else if (duration >= 1800000) { // 30 minutes
            bonusXP += 25;
        }
        
        // Bonus exercices
        const exerciseCount = completedSession.exercises ? completedSession.exercises.length : 0;
        bonusXP += exerciseCount * 10;
        
        // Bonus completion parfaite
        const allSetsCompleted = completedSession.exercises?.every(ex => 
            ex.sets?.every(set => set.completed)
        );
        if (allSetsCompleted) {
            bonusXP += 75;
        }
        
        return bonusXP;
    }

    /**
     * Calculer les statistiques finales
     */
    function calculateFinalStats() {
        if (!currentSession) return {};
        
        const stats = {
            duration: sessionState.startTime ? Date.now() - sessionState.startTime : 0,
            exercises_completed: 0,
            sets_completed: 0,
            total_volume: 0,
            muscle_groups: new Set()
        };
        
        if (currentSession.exercises) {
            currentSession.exercises.forEach(exercise => {
                let exerciseCompleted = true;
                let exerciseSets = 0;
                
                if (exercise.sets) {
                    exercise.sets.forEach(set => {
                        if (set.completed) {
                            exerciseSets++;
                            stats.sets_completed++;
                            
                            // Calculer le volume
                            if (exercise.exercise_mode === 'reps' && set.weight > 0) {
                                stats.total_volume += set.reps * set.weight;
                            }
                        } else {
                            exerciseCompleted = false;
                        }
                    });
                }
                
                if (exerciseCompleted && exerciseSets > 0) {
                    stats.exercises_completed++;
                }
                
                stats.muscle_groups.add(exercise.muscle_group);
            });
        }
        
        stats.muscle_groups = Array.from(stats.muscle_groups);
        
        return stats;
    }

    /**
     * Synchroniser l'état de la session
     */
    async function synchronizeSessionState() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                const latestSession = await SessionsModel.getCurrentSession();
                
                if (latestSession && latestSession.id === currentSession?.id) {
                    currentSession = latestSession;
                    
                    // Mettre à jour l'état local
                    sessionState.currentExerciseIndex = latestSession.current_exercise_index || 0;
                    sessionState.currentSetIndex = latestSession.current_set_index || 0;
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur synchronisation état :', error);
        }
    }

    /**
     * Sauvegarder l'état de la session
     */
    async function saveSessionState() {
        try {
            if (typeof SessionsModel !== 'undefined' && currentSession) {
                await SessionsModel.updateCurrentSession({
                    current_exercise_index: sessionState.currentExerciseIndex,
                    current_set_index: sessionState.currentSetIndex,
                    last_updated: Date.now()
                });
            }
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde état :', error);
        }
    }

    /**
     * Afficher le résumé de session
     */
    async function showSessionSummary(completedSession, stats) {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🎉 Session Terminée !',
                    content: renderSessionSummary(completedSession, stats),
                    actions: [
                        { text: 'Retour au QG', type: 'secondary', handler: navigateToDashboard },
                        { text: 'Nouvelle Session', type: 'primary', handler: navigateToPreparation }
                    ],
                    size: 'large'
                });
            } else {
                // Fallback - naviguer vers le dashboard
                setTimeout(() => navigateToDashboard(), 2000);
            }
        } catch (error) {
            console.error('❌ Erreur affichage résumé :', error);
            navigateToDashboard();
        }
    }

    /**
     * Rendre le résumé de session
     */
    function renderSessionSummary(session, stats) {
        return `
            <div class="session-summary">
                <div class="summary-header">
                    <h3>${session.name}</h3>
                    <p>Félicitations ! Vous avez terminé votre session d'entraînement.</p>
                </div>
                
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <span class="stat-value">${formatDuration(stats.duration)}</span>
                            <span class="stat-label">Durée totale</span>
                        </div>
                    </div>
                    
                    <div class="summary-stat">
                        <div class="stat-icon">🏋️</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.exercises_completed}</span>
                            <span class="stat-label">Exercices terminés</span>
                        </div>
                    </div>
                    
                    <div class="summary-stat">
                        <div class="stat-icon">💪</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.sets_completed}</span>
                            <span class="stat-label">Sets complétés</span>
                        </div>
                    </div>
                    
                    ${stats.total_volume > 0 ? `
                        <div class="summary-stat">
                            <div class="stat-icon">⚖️</div>
                            <div class="stat-info">
                                <span class="stat-value">${stats.total_volume} kg</span>
                                <span class="stat-label">Volume total</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="summary-achievements">
                    <h4>🏆 Accomplissements</h4>
                    <ul>
                        <li>Session d'entraînement complétée</li>
                        <li>Groupes musculaires travaillés : ${stats.muscle_groups.join(', ')}</li>
                        <li>XP et badges gagnés !</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Obtenir l'état actuel
     */
    function getCurrentState() {
        return {
            session: currentSession,
            state: { ...sessionState }
        };
    }

    /**
     * Vérifier si une session est active
     */
    function isSessionActive() {
        return sessionState.isActive && !sessionState.isPaused;
    }

    // Navigation
    function navigateToDashboard() {
        if (typeof Router !== 'undefined') {
            Router.navigate('dashboard');
        }
    }

    function navigateToPreparation() {
        if (typeof Router !== 'undefined') {
            Router.navigate('preparation');
        }
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
                        <h2>⚠️ Session Live non disponible</h2>
                        <p>Le module de session live n'est pas encore chargé.</p>
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
                        <h2>❌ Erreur Session Live</h2>
                        <p>${message}</p>
                        <div class="error-actions">
                            <button class="btn btn-secondary" onclick="LiveSessionController.navigateToPreparation()">
                                Retour à la préparation
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
     * Afficher une erreur
     */
    function showError(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.error(message);
        } else {
            alert(message);
        }
    }

    /**
     * Formater une durée
     */
    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }

    /**
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasView: typeof LiveSessionView !== 'undefined',
            hasCurrentSession: currentSession !== null,
            sessionState: { ...sessionState }
        };
    }

    // Gestionnaires d'événements
    function handleSessionStarted(data) {
        currentSession = data.session;
        sessionState = { ...sessionState, ...data.state };
        console.log('🎯 Session live démarrée');
    }

    function handleSessionCompleted(data) {
        sessionState.isActive = false;
        sessionState.isPaused = false;
        console.log('🏁 Session live terminée');
    }

    // Interface publique
    return {
        init,
        renderLiveSession,
        startLiveSession,
        pauseLiveSession,
        resumeLiveSession,
        finishLiveSession,
        completeSet,
        completeExercise,
        navigateToExercise,
        getCurrentState,
        isSessionActive,
        navigateToDashboard,
        navigateToPreparation,
        getInitializationStatus
    };
})();

// Export global
window.LiveSessionController = LiveSessionController;