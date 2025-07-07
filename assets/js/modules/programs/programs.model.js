/**
 * SmartTrack - Modèle Programs
 * Gestion des programmes d'entraînement
 */

const ProgramsModel = (function() {
    let programs = [];
    let currentProgram = null;
    let isLoaded = false;

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('📚 Initialisation du modèle Programs...');
            
            await loadPrograms();
            await loadCurrentProgram();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('storage:saved', handleStorageUpdate);
                EventBus.on('programs:reload', loadPrograms);
            }
            
            console.log(`✓ Modèle Programs initialisé (${programs.length} programmes)`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Programs :', error);
            throw error;
        }
    }

    /**
     * Charger tous les programmes
     */
    async function loadPrograms() {
        try {
            const data = await Storage.get(STORAGE_KEYS.PROGRAMS);
            programs = data || [];
            isLoaded = true;
            
            // Trier par date de création décroissante
            programs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Émettre événement de chargement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:loaded', { count: programs.length });
            }
            
            return programs;
            
        } catch (error) {
            console.error('❌ Erreur chargement programmes :', error);
            programs = [];
            return [];
        }
    }

    /**
     * Charger le programme actuel
     */
    async function loadCurrentProgram() {
        try {
            currentProgram = await Storage.get(STORAGE_KEYS.CURRENT_PROGRAM);
            return currentProgram;
            
        } catch (error) {
            console.error('❌ Erreur chargement programme actuel :', error);
            currentProgram = null;
            return null;
        }
    }

    /**
     * Sauvegarder les programmes
     */
    async function savePrograms() {
        try {
            await Storage.set(STORAGE_KEYS.PROGRAMS, programs);
            
            // Émettre événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:saved', { count: programs.length });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde programmes :', error);
            return false;
        }
    }

    /**
     * Créer un nouveau programme
     */
    async function createProgram(programData) {
        try {
            // Valider les données
            const validatedData = validateProgramData(programData);
            if (!validatedData) {
                throw new Error('Données de programme invalides');
            }

            // Créer le programme
            const newProgram = {
                id: Utils.generateId(),
                ...validatedData,
                status: 'draft', // draft, active, completed, paused
                progress: {
                    currentWeek: 1,
                    currentSession: 1,
                    completedSessions: 0,
                    totalSessions: calculateTotalSessions(validatedData),
                    startDate: null,
                    completionDate: null
                },
                statistics: {
                    averageSessionDuration: 0,
                    totalVolume: 0,
                    consistencyScore: 0
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Ajouter à la liste
            programs.unshift(newProgram);
            
            // Sauvegarder
            await savePrograms();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:created', { program: newProgram });
            }
            
            return newProgram;
            
        } catch (error) {
            console.error('❌ Erreur création programme :', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un programme
     */
    async function updateProgram(id, updatedData) {
        try {
            const index = programs.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Programme non trouvé');
            }

            // Valider les nouvelles données
            const validatedData = validateProgramData(updatedData, true);
            if (!validatedData) {
                throw new Error('Données de programme invalides');
            }

            // Mettre à jour le programme
            const originalProgram = programs[index];
            programs[index] = {
                ...originalProgram,
                ...validatedData,
                updated_at: new Date().toISOString()
            };

            // Recalculer le total des sessions si les semaines ont changé
            if (validatedData.weeks) {
                programs[index].progress.totalSessions = calculateTotalSessions(programs[index]);
            }

            // Sauvegarder
            await savePrograms();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:updated', { 
                    program: programs[index],
                    original: originalProgram 
                });
            }
            
            return programs[index];
            
        } catch (error) {
            console.error('❌ Erreur modification programme :', error);
            throw error;
        }
    }

    /**
     * Supprimer un programme
     */
    async function removeProgram(id) {
        try {
            const index = programs.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Programme non trouvé');
            }

            // Vérifier si c'est le programme actuel
            if (currentProgram && currentProgram.id === id) {
                currentProgram = null;
                await Storage.remove(STORAGE_KEYS.CURRENT_PROGRAM);
            }

            // Supprimer le programme
            const removedProgram = programs.splice(index, 1)[0];
            
            // Sauvegarder
            await savePrograms();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:removed', { program: removedProgram });
            }
            
            return removedProgram;
            
        } catch (error) {
            console.error('❌ Erreur suppression programme :', error);
            throw error;
        }
    }

    /**
     * Démarrer un programme
     */
    async function startProgram(programId) {
        try {
            const program = getById(programId);
            if (!program) {
                throw new Error('Programme non trouvé');
            }

            // Arrêter le programme actuel s'il y en a un
            if (currentProgram) {
                await pauseCurrentProgram();
            }

            // Mettre à jour le statut du programme
            program.status = 'active';
            program.progress.startDate = new Date().toISOString();
            program.progress.currentWeek = 1;
            program.progress.currentSession = 1;
            program.progress.completedSessions = 0;

            await updateProgram(programId, program);

            // Définir comme programme actuel
            currentProgram = program;
            await Storage.set(STORAGE_KEYS.CURRENT_PROGRAM, currentProgram);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:started', { program });
            }
            
            return program;
            
        } catch (error) {
            console.error('❌ Erreur démarrage programme :', error);
            throw error;
        }
    }

    /**
     * Mettre en pause le programme actuel
     */
    async function pauseCurrentProgram() {
        try {
            if (!currentProgram) {
                return false;
            }

            // Mettre à jour le statut
            currentProgram.status = 'paused';
            await updateProgram(currentProgram.id, currentProgram);

            // Supprimer de la session actuelle
            currentProgram = null;
            await Storage.remove(STORAGE_KEYS.CURRENT_PROGRAM);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:paused');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur pause programme :', error);
            return false;
        }
    }

    /**
     * Reprendre un programme en pause
     */
    async function resumeProgram(programId) {
        try {
            const program = getById(programId);
            if (!program || program.status !== 'paused') {
                throw new Error('Programme non trouvé ou non en pause');
            }

            return await startProgram(programId);
            
        } catch (error) {
            console.error('❌ Erreur reprise programme :', error);
            throw error;
        }
    }

    /**
     * Terminer une session du programme actuel
     */
    async function completeSession(sessionData) {
        try {
            if (!currentProgram) {
                throw new Error('Aucun programme actuel');
            }

            // Mettre à jour le progrès
            currentProgram.progress.completedSessions++;
            
            // Calculer la prochaine session
            const nextSession = calculateNextSession(currentProgram);
            if (nextSession) {
                currentProgram.progress.currentWeek = nextSession.week;
                currentProgram.progress.currentSession = nextSession.session;
            } else {
                // Programme terminé
                currentProgram.status = 'completed';
                currentProgram.progress.completionDate = new Date().toISOString();
            }

            // Mettre à jour les statistiques
            await updateProgramStatistics(currentProgram, sessionData);

            // Sauvegarder
            await updateProgram(currentProgram.id, currentProgram);
            await Storage.set(STORAGE_KEYS.CURRENT_PROGRAM, currentProgram);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:session-completed', { 
                    program: currentProgram,
                    sessionData 
                });
            }

            // Si programme terminé, nettoyer
            if (currentProgram.status === 'completed') {
                const completedProgram = currentProgram;
                currentProgram = null;
                await Storage.remove(STORAGE_KEYS.CURRENT_PROGRAM);
                
                // Émettre événement de fin
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:completed', { program: completedProgram });
                }
            }
            
            return currentProgram;
            
        } catch (error) {
            console.error('❌ Erreur complétion session programme :', error);
            throw error;
        }
    }

    /**
     * Obtenir la prochaine session du programme actuel
     */
    function getNextSession() {
        if (!currentProgram || currentProgram.status !== 'active') {
            return null;
        }

        const currentWeek = currentProgram.progress.currentWeek;
        const currentSession = currentProgram.progress.currentSession;
        
        // Trouver la semaine et la session actuelles
        const week = currentProgram.weeks.find(w => w.week === currentWeek);
        if (!week) return null;

        const session = week.sessions.find(s => s.session === currentSession);
        if (!session) return null;

        return {
            week: currentWeek,
            session: currentSession,
            sessionData: session,
            weekData: week
        };
    }

    /**
     * Créer une session depuis le programme actuel
     */
    async function createSessionFromProgram() {
        try {
            const nextSession = getNextSession();
            if (!nextSession) {
                throw new Error('Aucune session suivante trouvée');
            }

            // Créer les données de session
            const sessionData = {
                name: `${currentProgram.name} - S${nextSession.week}.${nextSession.session}`,
                exercises: nextSession.sessionData.exercises.map(exercise => ({
                    exercise_id: exercise.exercise_id,
                    sets: exercise.sets.map(set => ({
                        reps: set.reps || 0,
                        weight: set.weight || 0,
                        duration: set.duration || 0,
                        rest_time: set.rest_time || 90,
                        completed: false
                    })),
                    completed: false,
                    order: exercise.order || 0
                })),
                notes: nextSession.sessionData.notes || '',
                programId: currentProgram.id,
                programWeek: nextSession.week,
                programSession: nextSession.session
            };

            // Créer la session avec le modèle Sessions
            const newSession = await SessionsModel.createSession(sessionData);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:session-created', { 
                    program: currentProgram,
                    session: newSession,
                    nextSession 
                });
            }
            
            return newSession;
            
        } catch (error) {
            console.error('❌ Erreur création session depuis programme :', error);
            throw error;
        }
    }

    /**
     * Calculer la prochaine session
     */
    function calculateNextSession(program) {
        const currentWeek = program.progress.currentWeek;
        const currentSession = program.progress.currentSession;
        
        // Trouver la semaine actuelle
        const week = program.weeks.find(w => w.week === currentWeek);
        if (!week) return null;

        // Vérifier s'il y a une session suivante dans la semaine
        const nextSessionInWeek = week.sessions.find(s => s.session === currentSession + 1);
        if (nextSessionInWeek) {
            return {
                week: currentWeek,
                session: currentSession + 1
            };
        }

        // Passer à la semaine suivante
        const nextWeek = program.weeks.find(w => w.week === currentWeek + 1);
        if (nextWeek && nextWeek.sessions.length > 0) {
            return {
                week: currentWeek + 1,
                session: 1
            };
        }

        // Aucune session suivante (programme terminé)
        return null;
    }

    /**
     * Calculer le nombre total de sessions
     */
    function calculateTotalSessions(program) {
        if (!program.weeks) return 0;
        
        return program.weeks.reduce((total, week) => {
            return total + (week.sessions ? week.sessions.length : 0);
        }, 0);
    }

    /**
     * Mettre à jour les statistiques du programme
     */
    async function updateProgramStatistics(program, sessionData) {
        try {
            if (!sessionData || !sessionData.stats) return;

            const stats = program.statistics;
            const completedSessions = program.progress.completedSessions;

            // Durée moyenne des sessions
            if (completedSessions > 0) {
                const currentAvg = stats.averageSessionDuration || 0;
                stats.averageSessionDuration = Math.round(
                    ((currentAvg * (completedSessions - 1)) + sessionData.duration) / completedSessions
                );
            }

            // Volume total
            stats.totalVolume += sessionData.stats.completedSets || 0;

            // Score de constance (basé sur la régularité)
            stats.consistencyScore = calculateProgramConsistency(program);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour statistiques programme :', error);
        }
    }

    /**
     * Calculer la constance du programme
     */
    function calculateProgramConsistency(program) {
        if (!program.progress.startDate || program.progress.completedSessions === 0) {
            return 0;
        }

        const startDate = new Date(program.progress.startDate);
        const now = new Date();
        const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart === 0) return 100;

        // Calcul simple : pourcentage de sessions complétées par rapport au temps écoulé
        const expectedSessions = Math.min(daysSinceStart / 2, program.progress.totalSessions); // 1 session tous les 2 jours max
        const consistency = Math.min(100, (program.progress.completedSessions / expectedSessions) * 100);
        
        return Math.round(consistency);
    }

    /**
     * Obtenir tous les programmes
     */
    function getAll() {
        if (!isLoaded) {
            console.warn('⚠️ Programmes non chargés, retour d\'un tableau vide');
            return [];
        }
        return [...programs];
    }

    /**
     * Obtenir un programme par ID
     */
    function getById(id) {
        return programs.find(program => program.id === id) || null;
    }

    /**
     * Obtenir le programme actuel
     */
    function getCurrentProgram() {
        return currentProgram;
    }

    /**
     * Rechercher des programmes
     */
    function search(query) {
        if (!query || query.trim() === '') {
            return getAll();
        }

        const lowerQuery = query.toLowerCase().trim();
        
        return programs.filter(program => {
            return (
                program.name.toLowerCase().includes(lowerQuery) ||
                program.description.toLowerCase().includes(lowerQuery) ||
                program.category.toLowerCase().includes(lowerQuery) ||
                program.difficulty.toLowerCase().includes(lowerQuery)
            );
        });
    }

    /**
     * Filtrer les programmes
     */
    function filter(criteria = {}) {
        let filtered = [...programs];

        // Filtre par statut
        if (criteria.status && criteria.status !== 'all') {
            filtered = filtered.filter(p => p.status === criteria.status);
        }

        // Filtre par difficulté
        if (criteria.difficulty && criteria.difficulty !== 'all') {
            filtered = filtered.filter(p => p.difficulty === criteria.difficulty);
        }

        // Filtre par durée
        if (criteria.maxWeeks) {
            filtered = filtered.filter(p => p.weeks.length <= criteria.maxWeeks);
        }

        // Recherche textuelle
        if (criteria.search) {
            const query = criteria.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    /**
     * Valider les données d'un programme
     */
    function validateProgramData(data, isUpdate = false) {
        try {
            const validated = {};

            // Nom (obligatoire)
            if (!isUpdate || data.name !== undefined) {
                validated.name = Utils.validateString(data.name, 1, 100);
                if (!validated.name) {
                    throw new Error('Nom invalide (1-100 caractères requis)');
                }
            }

            // Description
            if (data.description !== undefined) {
                validated.description = Utils.validateString(data.description, 0, 500) || '';
            }

            // Catégorie
            if (data.category !== undefined) {
                const validCategories = ['strength', 'cardio', 'flexibility', 'custom', 'beginner'];
                validated.category = validCategories.includes(data.category) ? 
                    data.category : 'custom';
            }

            // Difficulté
            if (data.difficulty !== undefined) {
                const validDifficulties = ['beginner', 'intermediate', 'advanced'];
                validated.difficulty = validDifficulties.includes(data.difficulty) ? 
                    data.difficulty : 'intermediate';
            }

            // Semaines (obligatoire pour nouveau programme)
            if (!isUpdate || data.weeks !== undefined) {
                if (!data.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0) {
                    throw new Error('Au moins une semaine requise');
                }
                
                validated.weeks = data.weeks.map((week, index) => ({
                    week: index + 1,
                    sessions: week.sessions || [],
                    notes: week.notes || ''
                }));
            }

            // Durée estimée par session
            if (data.estimatedSessionDuration !== undefined) {
                validated.estimatedSessionDuration = Utils.validateNumber(data.estimatedSessionDuration, 30, 120) || 60;
            }

            return validated;
            
        } catch (error) {
            console.error('❌ Erreur validation programme :', error);
            return null;
        }
    }

    /**
     * Obtenir les statistiques des programmes
     */
    function getStats() {
        const stats = {
            total: programs.length,
            byStatus: {},
            byDifficulty: {},
            byCategory: {},
            averageCompletion: 0,
            mostPopular: null
        };

        let totalCompletion = 0;

        programs.forEach(program => {
            // Par statut
            const status = program.status;
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Par difficulté
            const difficulty = program.difficulty;
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;

            // Par catégorie
            const category = program.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Pourcentage de complétion
            if (program.progress.totalSessions > 0) {
                const completion = (program.progress.completedSessions / program.progress.totalSessions) * 100;
                totalCompletion += completion;
            }
        });

        // Moyenne de complétion
        if (programs.length > 0) {
            stats.averageCompletion = Math.round(totalCompletion / programs.length);
        }

        return stats;
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.PROGRAMS) {
            console.log('🔄 Mise à jour des programmes détectée');
            loadPrograms();
        } else if (data.key === STORAGE_KEYS.CURRENT_PROGRAM) {
            loadCurrentProgram();
        }
    }

    // Interface publique
    return {
        init,
        loadPrograms,
        createProgram,
        updateProgram,
        removeProgram,
        startProgram,
        pauseCurrentProgram,
        resumeProgram,
        completeSession,
        getNextSession,
        createSessionFromProgram,
        getAll,
        getById,
        getCurrentProgram,
        search,
        filter,
        getStats
    };
})();

// Export global
window.ProgramsModel = ProgramsModel;