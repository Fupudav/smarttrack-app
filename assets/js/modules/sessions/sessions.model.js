/**
 * SmartTrack - Modèle Sessions
 * Gestion des données des séances d'entraînement
 */

const SessionsModel = (function() {
    let sessions = [];
    let currentSession = null;
    let liveSession = null;
    let isLoaded = false;

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('⚔️ Initialisation du modèle Sessions...');
            
            await loadSessions();
            await loadCurrentSession();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('storage:saved', handleStorageUpdate);
                EventBus.on('sessions:reload', loadSessions);
            }
            
            console.log(`✓ Modèle Sessions initialisé (${sessions.length} séances)`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Sessions :', error);
            throw error;
        }
    }

    /**
     * Charger toutes les sessions
     */
    async function loadSessions() {
        try {
            const data = await Storage.get(STORAGE_KEYS.SESSIONS);
            sessions = data || [];
            isLoaded = true;
            
            // Trier par date décroissante
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Émettre événement de chargement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:loaded', { count: sessions.length });
            }
            
            return sessions;
            
        } catch (error) {
            console.error('❌ Erreur chargement sessions :', error);
            sessions = [];
            return [];
        }
    }

    /**
     * Charger la session courante (en préparation)
     */
    async function loadCurrentSession() {
        try {
            currentSession = await Storage.get(STORAGE_KEYS.CURRENT_SESSION);
            if (currentSession) {
                console.log('📝 Session en préparation trouvée');
            }
            return currentSession;
            
        } catch (error) {
            console.error('❌ Erreur chargement session courante :', error);
            currentSession = null;
            return null;
        }
    }

    /**
     * Sauvegarder les sessions
     */
    async function saveSessions() {
        try {
            await Storage.set(STORAGE_KEYS.SESSIONS, sessions);
            
            // Émettre événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:saved', { count: sessions.length });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde sessions :', error);
            return false;
        }
    }

    /**
     * Sauvegarder la session courante
     */
    async function saveCurrentSession() {
        try {
            await Storage.set(STORAGE_KEYS.CURRENT_SESSION, currentSession);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde session courante :', error);
            return false;
        }
    }

    /**
     * Créer une nouvelle session
     */
    function createSession(sessionData = {}) {
        const newSession = {
            id: Utils.generateId(),
            date: sessionData.date || new Date().toISOString(),
            name: sessionData.name || `Séance du ${Utils.formatDate(new Date())}`,
            exercises: sessionData.exercises || [],
            notes: sessionData.notes || '',
            duration: 0,
            status: 'preparation', // preparation, active, completed, cancelled
            stats: {
                totalReps: 0,
                totalWeight: 0,
                totalTime: 0,
                exerciseCount: 0
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        currentSession = newSession;
        
        // Émettre événement
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sessions:created', { session: newSession });
        }
        
        return newSession;
    }

    /**
     * Obtenir la session courante
     */
    function getCurrentSession() {
        return currentSession;
    }

    /**
     * Mettre à jour la session courante
     */
    async function updateCurrentSession(updates) {
        try {
            if (!currentSession) {
                throw new Error('Aucune session courante');
            }

            currentSession = {
                ...currentSession,
                ...updates,
                updated_at: new Date().toISOString()
            };

            await saveCurrentSession();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:current-updated', { session: currentSession });
            }
            
            return currentSession;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour session courante :', error);
            throw error;
        }
    }

    /**
     * Ajouter un exercice à la session courante
     */
    async function addExerciseToCurrentSession(exerciseId, sets = []) {
        try {
            if (!currentSession) {
                createSession();
            }

            const exerciseData = {
                exercise_id: exerciseId,
                sets: sets.length > 0 ? sets : [{ reps: 0, weight: 0, completed: false }],
                completed: false,
                order: currentSession.exercises.length
            };

            currentSession.exercises.push(exerciseData);
            await saveCurrentSession();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:exercise-added', { 
                    session: currentSession,
                    exercise: exerciseData 
                });
            }
            
            return exerciseData;
            
        } catch (error) {
            console.error('❌ Erreur ajout exercice à la session :', error);
            throw error;
        }
    }

    /**
     * Supprimer un exercice de la session courante
     */
    async function removeExerciseFromCurrentSession(exerciseIndex) {
        try {
            if (!currentSession || !currentSession.exercises[exerciseIndex]) {
                throw new Error('Exercice non trouvé dans la session');
            }

            const removedExercise = currentSession.exercises.splice(exerciseIndex, 1)[0];
            
            // Réorganiser les ordres
            currentSession.exercises.forEach((ex, index) => {
                ex.order = index;
            });

            await saveCurrentSession();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:exercise-removed', { 
                    session: currentSession,
                    exercise: removedExercise 
                });
            }
            
            return removedExercise;
            
        } catch (error) {
            console.error('❌ Erreur suppression exercice de la session :', error);
            throw error;
        }
    }

    /**
     * Démarrer une session live
     */
    async function startLiveSession() {
        try {
            if (!currentSession || currentSession.exercises.length === 0) {
                throw new Error('Aucune session à démarrer ou session vide');
            }

            liveSession = {
                ...currentSession,
                status: 'active',
                startTime: new Date().toISOString(),
                currentExerciseIndex: 0,
                currentSetIndex: 0,
                timer: {
                    sessionTime: 0,
                    exerciseTime: 0,
                    restTime: 0,
                    isResting: false
                }
            };

            // Initialiser tous les sets comme non complétés
            liveSession.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    set.completed = false;
                    set.startTime = null;
                    set.endTime = null;
                });
            });

            await Storage.set(STORAGE_KEYS.LIVE_SESSION, liveSession);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:live-started', { session: liveSession });
            }
            
            return liveSession;
            
        } catch (error) {
            console.error('❌ Erreur démarrage session live :', error);
            throw error;
        }
    }

    /**
     * Obtenir la session live
     */
    function getLiveSession() {
        return liveSession;
    }

    /**
     * Mettre à jour la session live
     */
    async function updateLiveSession(updates) {
        try {
            if (!liveSession) {
                throw new Error('Aucune session live active');
            }

            liveSession = {
                ...liveSession,
                ...updates,
                updated_at: new Date().toISOString()
            };

            await Storage.set(STORAGE_KEYS.LIVE_SESSION, liveSession);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:live-updated', { session: liveSession });
            }
            
            return liveSession;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour session live :', error);
            throw error;
        }
    }

    /**
     * Compléter un set dans la session live
     */
    async function completeSet(exerciseIndex, setIndex, setData) {
        try {
            if (!liveSession) {
                throw new Error('Aucune session live active');
            }

            const exercise = liveSession.exercises[exerciseIndex];
            const set = exercise.sets[setIndex];
            
            if (!exercise || !set) {
                throw new Error('Exercice ou set non trouvé');
            }

            // Mettre à jour le set
            set.completed = true;
            set.endTime = new Date().toISOString();
            set.reps = setData.reps || set.reps;
            set.weight = setData.weight || set.weight;
            set.duration = setData.duration || set.duration;

            await updateLiveSession(liveSession);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:set-completed', { 
                    session: liveSession,
                    exerciseIndex,
                    setIndex,
                    set 
                });
            }
            
            return set;
            
        } catch (error) {
            console.error('❌ Erreur complétion set :', error);
            throw error;
        }
    }

    /**
     * Terminer la session live
     */
    async function finishLiveSession() {
        try {
            if (!liveSession) {
                throw new Error('Aucune session live active');
            }

            // Calculer les statistiques finales
            const stats = calculateSessionStats(liveSession);
            
            // Créer la session terminée
            const completedSession = {
                ...liveSession,
                status: 'completed',
                endTime: new Date().toISOString(),
                duration: Date.now() - new Date(liveSession.startTime).getTime(),
                stats: stats
            };

            // Ajouter aux sessions sauvegardées
            sessions.unshift(completedSession);
            await saveSessions();

            // Nettoyer les sessions temporaires
            currentSession = null;
            liveSession = null;
            await Storage.remove(STORAGE_KEYS.CURRENT_SESSION);
            await Storage.remove(STORAGE_KEYS.LIVE_SESSION);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:finished', { session: completedSession });
            }
            
            return completedSession;
            
        } catch (error) {
            console.error('❌ Erreur fin session live :', error);
            throw error;
        }
    }

    /**
     * Annuler la session courante
     */
    async function cancelCurrentSession() {
        try {
            currentSession = null;
            await Storage.remove(STORAGE_KEYS.CURRENT_SESSION);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:current-cancelled');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur annulation session courante :', error);
            return false;
        }
    }

    /**
     * Calculer les statistiques d'une session
     */
    function calculateSessionStats(session) {
        const stats = {
            totalReps: 0,
            totalWeight: 0,
            totalTime: 0,
            exerciseCount: session.exercises.length,
            completedSets: 0,
            totalSets: 0
        };

        session.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                stats.totalSets++;
                if (set.completed) {
                    stats.completedSets++;
                    stats.totalReps += set.reps || 0;
                    stats.totalWeight += (set.reps || 0) * (set.weight || 0);
                    stats.totalTime += set.duration || 0;
                }
            });
        });

        return stats;
    }

    /**
     * Obtenir toutes les sessions
     */
    function getAll() {
        return [...sessions];
    }

    /**
     * Obtenir une session par ID
     */
    function getById(id) {
        return sessions.find(session => session.id === id) || null;
    }

    /**
     * Obtenir les sessions par période
     */
    function getByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= start && sessionDate <= end;
        });
    }

    /**
     * Obtenir les sessions récentes
     */
    function getRecent(limit = 10) {
        return sessions.slice(0, limit);
    }

    /**
     * Supprimer une session
     */
    async function removeSession(id) {
        try {
            const index = sessions.findIndex(s => s.id === id);
            if (index === -1) {
                throw new Error('Session non trouvée');
            }

            const removedSession = sessions.splice(index, 1)[0];
            await saveSessions();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sessions:removed', { session: removedSession });
            }
            
            return removedSession;
            
        } catch (error) {
            console.error('❌ Erreur suppression session :', error);
            throw error;
        }
    }

    /**
     * Obtenir les statistiques générales
     */
    function getStats() {
        const stats = {
            totalSessions: sessions.length,
            totalDuration: 0,
            totalReps: 0,
            totalWeight: 0,
            averageDuration: 0,
            lastSession: null,
            streak: 0
        };

        if (sessions.length === 0) {
            return stats;
        }

        // Calculer les totaux
        sessions.forEach(session => {
            if (session.stats) {
                stats.totalDuration += session.duration || 0;
                stats.totalReps += session.stats.totalReps || 0;
                stats.totalWeight += session.stats.totalWeight || 0;
            }
        });

        // Moyennes
        stats.averageDuration = Math.round(stats.totalDuration / sessions.length);
        
        // Dernière session
        stats.lastSession = sessions[0];
        
        // Calculer la série (streak)
        stats.streak = calculateStreak();

        return stats;
    }

    /**
     * Calculer la série de séances consécutives
     */
    function calculateStreak() {
        if (sessions.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sessions.length; i++) {
            const sessionDate = new Date(sessions[i].date);
            sessionDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff === streak + 1) {
                // Jour manqué mais on peut continuer
                streak++;
            } else {
                // Série cassée
                break;
            }
        }

        return streak;
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.SESSIONS) {
            console.log('🔄 Mise à jour des sessions détectée');
            loadSessions();
        } else if (data.key === STORAGE_KEYS.CURRENT_SESSION) {
            loadCurrentSession();
        }
    }

    /**
     * Vérifier si les sessions sont chargées
     */
    function isSessionsLoaded() {
        return isLoaded;
    }

    /**
     * Obtenir le nombre de sessions
     */
    function getCount() {
        return sessions.length;
    }

    // Interface publique
    return {
        init,
        loadSessions,
        createSession,
        getCurrentSession,
        updateCurrentSession,
        addExerciseToCurrentSession,
        removeExerciseFromCurrentSession,
        startLiveSession,
        getLiveSession,
        updateLiveSession,
        completeSet,
        finishLiveSession,
        cancelCurrentSession,
        getAll,
        getById,
        getByDateRange,
        getRecent,
        removeSession,
        getStats,
        isSessionsLoaded,
        getCount
    };
})();

// Export global
window.SessionsModel = SessionsModel;