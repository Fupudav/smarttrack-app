/**
 * SmartTrack - Contrôleur Programs
 * Orchestration des programmes d'entraînement structurés
 */

const ProgramsController = (function() {
    let isInitialized = false;
    let currentProgram = null;
    let programDrafts = [];

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('📋 Initialisation ProgramsController...');
            
            // Initialiser la vue
            if (typeof ProgramsView !== 'undefined') {
                ProgramsView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:programs', handleProgramsRoute);
                EventBus.on('sessions:live-completed', handleSessionCompleted);
                EventBus.on('app:initialized', handleAppInitialized);
                EventBus.on('programs:session-completed', handleProgramSessionCompleted);
            }
            
            isInitialized = true;
            console.log('✓ ProgramsController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation ProgramsController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers programs
     */
    async function handleProgramsRoute() {
        console.log('📍 Navigation vers Programs');
        await renderPrograms();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - ProgramsController prêt');
    }

    /**
     * Rendre l'interface programs
     */
    async function renderPrograms() {
        try {
            if (typeof ProgramsView !== 'undefined') {
                await ProgramsView.render();
                updateActiveNavigation('programs');
            } else {
                console.error('❌ ProgramsView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu programs :', error);
            showErrorScreen('Erreur lors du chargement des programmes');
        }
    }

    /**
     * Démarrer un programme
     */
    async function startProgram(programId) {
        try {
            console.log(`🚀 Démarrage du programme ${programId}...`);
            
            if (typeof ProgramsModel !== 'undefined') {
                // Vérifier s'il y a déjà un programme en cours
                const existingProgram = await ProgramsModel.getCurrentProgram();
                if (existingProgram) {
                    const confirmed = await showProgramConflictModal(existingProgram);
                    if (!confirmed) {
                        return false;
                    }
                }
                
                // Démarrer le nouveau programme
                const program = await ProgramsModel.startProgram(programId);
                currentProgram = program;
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-started', {
                        program,
                        timestamp: Date.now()
                    });
                }
                
                // Afficher la modal de bienvenue
                await showProgramWelcomeModal(program);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(`Programme "${program.name}" démarré !`);
                }
                
                return true;
                
            } else {
                throw new Error('ProgramsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur démarrage programme :', error);
            showError('Erreur lors du démarrage du programme');
            return false;
        }
    }

    /**
     * Mettre en pause un programme
     */
    async function pauseProgram() {
        try {
            console.log('⏸️ Pause du programme...');
            
            if (typeof ProgramsModel !== 'undefined' && currentProgram) {
                await ProgramsModel.pauseProgram(currentProgram.id);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-paused', {
                        program: currentProgram,
                        timestamp: Date.now()
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Programme mis en pause');
                }
                
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('❌ Erreur pause programme :', error);
            showError('Erreur lors de la pause du programme');
            return false;
        }
    }

    /**
     * Reprendre un programme
     */
    async function resumeProgram() {
        try {
            console.log('▶️ Reprise du programme...');
            
            if (typeof ProgramsModel !== 'undefined' && currentProgram) {
                await ProgramsModel.resumeProgram(currentProgram.id);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-resumed', {
                        program: currentProgram,
                        timestamp: Date.now()
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Programme repris !');
                }
                
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('❌ Erreur reprise programme :', error);
            showError('Erreur lors de la reprise du programme');
            return false;
        }
    }

    /**
     * Arrêter un programme
     */
    async function stopProgram() {
        try {
            console.log('⏹️ Arrêt du programme...');
            
            if (typeof ProgramsModel !== 'undefined' && currentProgram) {
                // Confirmer l'arrêt
                const confirmed = await showStopProgramModal();
                if (!confirmed) return false;
                
                await ProgramsModel.stopProgram(currentProgram.id);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-stopped', {
                        program: currentProgram,
                        timestamp: Date.now()
                    });
                }
                
                currentProgram = null;
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.info('Programme arrêté');
                }
                
                // Actualiser l'affichage
                if (typeof ProgramsView !== 'undefined') {
                    await ProgramsView.loadProgramsData();
                }
                
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('❌ Erreur arrêt programme :', error);
            showError('Erreur lors de l\'arrêt du programme');
            return false;
        }
    }

    /**
     * Terminer un programme
     */
    async function completeProgram(programId) {
        try {
            console.log(`🎉 Complétion du programme ${programId}...`);
            
            if (typeof ProgramsModel !== 'undefined') {
                const completedProgram = await ProgramsModel.completeProgram(programId);
                
                // Traitement gamification
                await processProgramCompletion(completedProgram);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-completed', {
                        program: completedProgram,
                        timestamp: Date.now()
                    });
                }
                
                // Afficher la modal de félicitations
                await showProgramCompletionModal(completedProgram);
                
                currentProgram = null;
                
                return completedProgram;
            }
            return null;
            
        } catch (error) {
            console.error('❌ Erreur complétion programme :', error);
            showError('Erreur lors de la complétion du programme');
            return null;
        }
    }

    /**
     * Créer un programme personnalisé
     */
    async function createProgram(programData) {
        try {
            console.log('🛠️ Création du programme personnalisé...');
            
            // Valider les données
            const validationResult = validateProgramData(programData);
            if (!validationResult.isValid) {
                showError(`Données invalides : ${validationResult.errors.join(', ')}`);
                return false;
            }
            
            if (typeof ProgramsModel !== 'undefined') {
                // Créer le programme
                const program = await ProgramsModel.createProgram(programData);
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('programs:program-created', {
                        program,
                        timestamp: Date.now()
                    });
                }
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(`Programme "${program.name}" créé avec succès !`);
                }
                
                // Proposer de démarrer le programme
                await showProgramCreatedModal(program);
                
                return program;
            }
            
            throw new Error('ProgramsModel non disponible');
            
        } catch (error) {
            console.error('❌ Erreur création programme :', error);
            showError('Erreur lors de la création du programme');
            return null;
        }
    }

    /**
     * Prévisualiser un programme
     */
    async function previewProgram(programId) {
        try {
            console.log(`👁️ Prévisualisation du programme ${programId}...`);
            
            if (typeof ProgramsModel !== 'undefined') {
                const program = await ProgramsModel.getProgramById(programId);
                
                if (program) {
                    await showProgramPreviewModal(program);
                } else {
                    showError('Programme non trouvé');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur prévisualisation programme :', error);
            showError('Erreur lors de la prévisualisation');
        }
    }

    /**
     * Gérer la fin de session
     */
    async function handleSessionCompleted(data) {
        try {
            if (!currentProgram) return;
            
            console.log('🎯 Session terminée - Vérification progression programme...');
            
            if (typeof ProgramsModel !== 'undefined') {
                // Mettre à jour la progression du programme
                const progressResult = await ProgramsModel.updateProgramProgress(
                    currentProgram.id,
                    data.session
                );
                
                // Vérifier si une semaine est terminée
                if (progressResult.weekCompleted) {
                    await handleWeekCompletion(progressResult);
                }
                
                // Vérifier si le programme est terminé
                if (progressResult.programCompleted) {
                    await completeProgram(currentProgram.id);
                }
                
                // Mettre à jour le programme actuel
                currentProgram = progressResult.program;
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement session programme :', error);
        }
    }

    /**
     * Gérer la complétion d'une semaine
     */
    async function handleWeekCompletion(progressResult) {
        try {
            console.log(`📅 Semaine ${progressResult.completedWeek} terminée !`);
            
            // Émettre l'événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('programs:week-completed', {
                    program: currentProgram,
                    week: progressResult.completedWeek,
                    timestamp: Date.now()
                });
            }
            
            // Traitement gamification pour la semaine
            if (typeof GamificationModel !== 'undefined') {
                await GamificationModel.addXP(100, 'program_week_completed');
                
                // Vérifier les badges de progression
                await GamificationModel.checkBadges([
                    'program_follower',
                    'week_warrior',
                    'consistent_trainer'
                ]);
            }
            
            // Afficher la modal de fin de semaine
            await showWeekCompletionModal(progressResult);
            
        } catch (error) {
            console.error('❌ Erreur complétion semaine :', error);
        }
    }

    /**
     * Traiter la complétion d'un programme pour la gamification
     */
    async function processProgramCompletion(completedProgram) {
        try {
            if (typeof GamificationModel !== 'undefined') {
                // XP pour complétion du programme
                let completionXP = 500; // Base
                
                // Bonus selon la durée du programme
                completionXP += completedProgram.duration * 50;
                
                // Bonus selon le niveau
                const levelMultipliers = {
                    'beginner': 1,
                    'intermediate': 1.5,
                    'advanced': 2,
                    'expert': 2.5
                };
                completionXP *= levelMultipliers[completedProgram.level] || 1;
                
                await GamificationModel.addXP(completionXP, 'program_completed');
                
                // Vérifier les badges de complétion
                await GamificationModel.checkBadges([
                    'program_finisher',
                    'dedicated_athlete',
                    'goal_achiever'
                ]);
            }
        } catch (error) {
            console.error('❌ Erreur traitement gamification programme :', error);
        }
    }

    /**
     * Valider les données d'un programme
     */
    function validateProgramData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Le nom doit contenir au moins 3 caractères');
        }
        
        if (!data.level || !['beginner', 'intermediate', 'advanced'].includes(data.level)) {
            errors.push('Niveau invalide');
        }
        
        if (!data.duration || data.duration < 1 || data.duration > 52) {
            errors.push('La durée doit être entre 1 et 52 semaines');
        }
        
        if (!data.frequency || data.frequency < 1 || data.frequency > 7) {
            errors.push('La fréquence doit être entre 1 et 7 sessions par semaine');
        }
        
        if (!data.objectives || data.objectives.length === 0) {
            errors.push('Au moins un objectif doit être sélectionné');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Afficher la modal de conflit de programme
     */
    async function showProgramConflictModal(existingProgram) {
        return new Promise((resolve) => {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '⚠️ Programme en cours',
                    content: `
                        <div class="program-conflict-modal">
                            <p>Vous avez déjà un programme en cours :</p>
                            <div class="existing-program">
                                <strong>${existingProgram.name}</strong>
                                <span>Progression : ${Math.round(existingProgram.progress || 0)}%</span>
                            </div>
                            <p>Voulez-vous l'arrêter pour démarrer le nouveau programme ?</p>
                        </div>
                    `,
                    actions: [
                        { text: 'Annuler', type: 'secondary', handler: () => {
                            ModalManager.hide();
                            resolve(false);
                        }},
                        { text: 'Remplacer', type: 'danger', handler: () => {
                            ModalManager.hide();
                            resolve(true);
                        }}
                    ]
                });
            } else {
                resolve(confirm('Un programme est déjà en cours. Le remplacer ?'));
            }
        });
    }

    /**
     * Afficher la modal de bienvenue d'un programme
     */
    async function showProgramWelcomeModal(program) {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: '🚀 Programme démarré !',
                content: `
                    <div class="program-welcome-modal">
                        <div class="welcome-header">
                            <h3>${program.name}</h3>
                            <span class="program-level ${program.level}">${formatLevel(program.level)}</span>
                        </div>
                        
                        <div class="welcome-info">
                            <p>Félicitations ! Vous venez de démarrer votre programme d'entraînement.</p>
                            
                            <div class="program-overview">
                                <div class="overview-item">
                                    <span class="item-icon">📅</span>
                                    <span>${program.duration} semaines d'entraînement</span>
                                </div>
                                <div class="overview-item">
                                    <span class="item-icon">🎯</span>
                                    <span>${program.sessions_per_week} sessions par semaine</span>
                                </div>
                                <div class="overview-item">
                                    <span class="item-icon">⏱️</span>
                                    <span>~${program.avg_session_duration}min par session</span>
                                </div>
                            </div>
                            
                            <div class="welcome-tips">
                                <h4>💡 Conseils pour réussir :</h4>
                                <ul>
                                    <li>Respectez la planification des séances</li>
                                    <li>Écoutez votre corps et prenez du repos si nécessaire</li>
                                    <li>Suivez votre progression dans l'onglet "En cours"</li>
                                    <li>N'hésitez pas à ajuster les charges selon vos capacités</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `,
                actions: [
                    { text: 'Voir le programme', type: 'secondary', handler: () => {
                        ModalManager.hide();
                        if (typeof ProgramsView !== 'undefined') {
                            ProgramsView.switchToTab('current');
                        }
                    }},
                    { text: 'Première séance !', type: 'primary', handler: () => {
                        ModalManager.hide();
                        if (typeof Router !== 'undefined') {
                            Router.navigate('preparation');
                        }
                    }}
                ]
            });
        }
    }

    /**
     * Afficher la modal de fin de programme
     */
    async function showProgramCompletionModal(program) {
        if (typeof ModalManager !== 'undefined') {
            ModalManager.show({
                title: '🎉 Programme terminé !',
                content: `
                    <div class="program-completion-modal">
                        <div class="completion-celebration">
                            <div class="celebration-icon">🏆</div>
                            <h3>Félicitations !</h3>
                            <p>Vous avez terminé le programme "${program.name}" !</p>
                        </div>
                        
                        <div class="completion-stats">
                            <div class="stat-item">
                                <span class="stat-icon">📅</span>
                                <span class="stat-text">${program.duration} semaines complétées</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">🎯</span>
                                <span class="stat-text">${program.completed_sessions} sessions réalisées</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-text">${formatDuration(program.total_training_time)} d'entraînement</span>
                            </div>
                        </div>
                        
                        <div class="completion-achievements">
                            <h4>🏅 Accomplissements débloqués</h4>
                            <p>Badges et XP gagnés pour cette réussite !</p>
                        </div>
                        
                        <div class="next-steps">
                            <h4>🚀 Et maintenant ?</h4>
                            <p>Continuez votre progression avec un nouveau programme ou créez le vôtre !</p>
                        </div>
                    </div>
                `,
                actions: [
                    { text: 'Voir l\'historique', type: 'secondary', handler: () => {
                        ModalManager.hide();
                        if (typeof ProgramsView !== 'undefined') {
                            ProgramsView.switchToTab('history');
                        }
                    }},
                    { text: 'Nouveau programme', type: 'primary', handler: () => {
                        ModalManager.hide();
                        if (typeof ProgramsView !== 'undefined') {
                            ProgramsView.switchToTab('available');
                        }
                    }}
                ]
            });
        }
    }

    /**
     * Formatage utilitaire
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
                        <h2>⚠️ Programs non disponible</h2>
                        <p>Le module de programmes n'est pas encore chargé.</p>
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
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasView: typeof ProgramsView !== 'undefined',
            hasCurrentProgram: currentProgram !== null,
            draftsCount: programDrafts.length
        };
    }

    // Interface publique
    return {
        init,
        renderPrograms,
        startProgram,
        pauseProgram,
        resumeProgram,
        stopProgram,
        completeProgram,
        createProgram,
        previewProgram,
        handleSessionCompleted,
        getInitializationStatus
    };
})();

// Export global
window.ProgramsController = ProgramsController;