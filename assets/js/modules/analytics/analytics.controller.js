/**
 * SmartTrack - Contrôleur Analytics
 * Orchestration de l'analyse des performances et statistiques
 */

const AnalyticsController = (function() {
    let isInitialized = false;
    let currentGoals = {};
    let exportFormat = 'json';

    /**
     * Initialiser le contrôleur
     */
    async function init() {
        try {
            console.log('📊 Initialisation AnalyticsController...');
            
            // Initialiser la vue
            if (typeof AnalyticsView !== 'undefined') {
                AnalyticsView.init();
            }
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('route:analytics', handleAnalyticsRoute);
                EventBus.on('sessions:live-completed', handleSessionCompleted);
                EventBus.on('app:initialized', handleAppInitialized);
                EventBus.on('analytics:goals-updated', handleGoalsUpdated);
            }
            
            // Charger les objectifs sauvegardés
            await loadUserGoals();
            
            isInitialized = true;
            console.log('✓ AnalyticsController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation AnalyticsController :', error);
            throw error;
        }
    }

    /**
     * Gérer la route vers analytics
     */
    async function handleAnalyticsRoute() {
        console.log('📍 Navigation vers Analytics');
        await renderAnalytics();
    }

    /**
     * Gérer l'initialisation de l'app
     */
    function handleAppInitialized() {
        console.log('🚀 App initialisée - AnalyticsController prêt');
    }

    /**
     * Rendre l'interface analytics
     */
    async function renderAnalytics() {
        try {
            if (typeof AnalyticsView !== 'undefined') {
                await AnalyticsView.render();
                updateActiveNavigation('analytics');
            } else {
                console.error('❌ AnalyticsView non disponible');
                showFallbackScreen();
            }
        } catch (error) {
            console.error('❌ Erreur rendu analytics :', error);
            showErrorScreen('Erreur lors du chargement des analytics');
        }
    }

    /**
     * Exporter les données
     */
    async function exportData() {
        try {
            console.log('📥 Export des données analytics...');
            
            if (typeof AnalyticsModel !== 'undefined') {
                // Obtenir toutes les données
                const exportData = await AnalyticsModel.getExportData();
                
                // Préparer les données selon le format
                let fileContent, fileName, mimeType;
                
                switch (exportFormat) {
                    case 'csv':
                        fileContent = convertToCSV(exportData);
                        fileName = `smarttrack-analytics-${getDateString()}.csv`;
                        mimeType = 'text/csv';
                        break;
                        
                    case 'json':
                    default:
                        fileContent = JSON.stringify(exportData, null, 2);
                        fileName = `smarttrack-analytics-${getDateString()}.json`;
                        mimeType = 'application/json';
                        break;
                }
                
                // Télécharger le fichier
                downloadFile(fileContent, fileName, mimeType);
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success('Données exportées avec succès !');
                }
                
                // Émettre l'événement
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('analytics:data-exported', { 
                        format: exportFormat,
                        fileName,
                        recordCount: countRecords(exportData)
                    });
                }
                
            } else {
                throw new Error('AnalyticsModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur export données :', error);
            showError('Erreur lors de l\'export des données');
        }
    }

    /**
     * Afficher la modal des objectifs
     */
    async function showGoalsModal() {
        try {
            console.log('🎯 Affichage modal objectifs...');
            
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🎯 Définir vos objectifs',
                    content: renderGoalsModal(),
                    actions: [
                        { text: 'Annuler', type: 'secondary', handler: () => ModalManager.hide() },
                        { text: 'Sauvegarder', type: 'primary', handler: saveGoals }
                    ],
                    size: 'medium',
                    onShow: attachGoalsModalEvents
                });
            } else {
                showError('Interface de configuration non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur modal objectifs :', error);
            showError('Erreur lors de l\'ouverture des objectifs');
        }
    }

    /**
     * Rendre la modal des objectifs
     */
    function renderGoalsModal() {
        return `
            <div class="goals-modal">
                <div class="goals-intro">
                    <p>Définissez vos objectifs mensuels pour rester motivé et suivre vos progrès.</p>
                </div>
                
                <div class="goals-form">
                    <div class="goal-field">
                        <label for="goal-sessions">Sessions par mois</label>
                        <input type="number" id="goal-sessions" class="goal-input" 
                               value="${currentGoals.sessions || 12}" min="1" max="31">
                        <span class="goal-help">Nombre de sessions d'entraînement</span>
                    </div>
                    
                    <div class="goal-field">
                        <label for="goal-duration">Temps d'entraînement (heures)</label>
                        <input type="number" id="goal-duration" class="goal-input" 
                               value="${currentGoals.duration || 20}" min="1" max="100">
                        <span class="goal-help">Temps total d'entraînement par mois</span>
                    </div>
                    
                    <div class="goal-field">
                        <label for="goal-volume">Volume total (kg)</label>
                        <input type="number" id="goal-volume" class="goal-input" 
                               value="${currentGoals.volume || 5000}" min="100" max="50000">
                        <span class="goal-help">Poids total soulevé par mois</span>
                    </div>
                    
                    <div class="goal-field">
                        <label for="goal-streak">Série de jours</label>
                        <input type="number" id="goal-streak" class="goal-input" 
                               value="${currentGoals.streak || 30}" min="3" max="365">
                        <span class="goal-help">Jours consécutifs d'entraînement</span>
                    </div>
                    
                    <div class="goal-field">
                        <label for="goal-exercises">Exercices par session</label>
                        <input type="number" id="goal-exercises" class="goal-input" 
                               value="${currentGoals.exercisesPerSession || 6}" min="1" max="20">
                        <span class="goal-help">Nombre moyen d'exercices par session</span>
                    </div>
                    
                    <div class="goal-field">
                        <label for="goal-frequency">Fréquence hebdomadaire</label>
                        <input type="number" id="goal-frequency" class="goal-input" 
                               value="${currentGoals.weeklyFrequency || 3}" min="1" max="7">
                        <span class="goal-help">Sessions par semaine</span>
                    </div>
                </div>
                
                <div class="goals-presets">
                    <h4>Objectifs prédéfinis</h4>
                    <div class="preset-buttons">
                        <button class="btn btn-outline preset-btn" data-preset="beginner">
                            Débutant
                        </button>
                        <button class="btn btn-outline preset-btn" data-preset="intermediate">
                            Intermédiaire
                        </button>
                        <button class="btn btn-outline preset-btn" data-preset="advanced">
                            Avancé
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attacher les événements de la modal objectifs
     */
    function attachGoalsModalEvents() {
        try {
            // Boutons de préréglages
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', handlePresetSelection);
            });
            
            // Validation en temps réel
            document.querySelectorAll('.goal-input').forEach(input => {
                input.addEventListener('input', validateGoalInput);
            });
            
        } catch (error) {
            console.error('❌ Erreur événements modal objectifs :', error);
        }
    }

    /**
     * Gérer la sélection de préréglages
     */
    function handlePresetSelection(event) {
        const preset = event.target.dataset.preset;
        if (!preset) return;
        
        const presets = {
            beginner: {
                sessions: 8,
                duration: 12,
                volume: 2000,
                streak: 14,
                exercisesPerSession: 4,
                weeklyFrequency: 2
            },
            intermediate: {
                sessions: 12,
                duration: 20,
                volume: 5000,
                streak: 30,
                exercisesPerSession: 6,
                weeklyFrequency: 3
            },
            advanced: {
                sessions: 16,
                duration: 32,
                volume: 10000,
                streak: 60,
                exercisesPerSession: 8,
                weeklyFrequency: 4
            }
        };
        
        const selectedPreset = presets[preset];
        if (selectedPreset) {
            // Remplir les champs
            Object.keys(selectedPreset).forEach(key => {
                const input = document.getElementById(`goal-${key === 'exercisesPerSession' ? 'exercises' : key === 'weeklyFrequency' ? 'frequency' : key}`);
                if (input) {
                    input.value = selectedPreset[key];
                }
            });
            
            // Marquer le bouton comme sélectionné
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
            event.target.classList.add('selected');
        }
    }

    /**
     * Valider les entrées d'objectifs
     */
    function validateGoalInput(event) {
        const input = event.target;
        const value = parseInt(input.value);
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        
        if (value < min || value > max) {
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }
    }

    /**
     * Sauvegarder les objectifs
     */
    async function saveGoals() {
        try {
            // Récupérer les valeurs
            const newGoals = {
                sessions: parseInt(document.getElementById('goal-sessions').value),
                duration: parseInt(document.getElementById('goal-duration').value),
                volume: parseInt(document.getElementById('goal-volume').value),
                streak: parseInt(document.getElementById('goal-streak').value),
                exercisesPerSession: parseInt(document.getElementById('goal-exercises').value),
                weeklyFrequency: parseInt(document.getElementById('goal-frequency').value),
                updatedAt: Date.now()
            };
            
            // Valider les objectifs
            if (!validateGoals(newGoals)) {
                showError('Veuillez vérifier vos objectifs');
                return;
            }
            
            // Sauvegarder
            if (typeof Storage !== 'undefined') {
                await Storage.setItem('user_goals', newGoals);
            }
            
            currentGoals = newGoals;
            
            // Fermer la modal
            if (typeof ModalManager !== 'undefined') {
                ModalManager.hide();
            }
            
            // Émettre l'événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('analytics:goals-updated', newGoals);
            }
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.success('Objectifs sauvegardés !');
            }
            
            // Mettre à jour l'affichage
            await updateProgressDisplay();
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde objectifs :', error);
            showError('Erreur lors de la sauvegarde');
        }
    }

    /**
     * Valider les objectifs
     */
    function validateGoals(goals) {
        const rules = {
            sessions: { min: 1, max: 31 },
            duration: { min: 1, max: 100 },
            volume: { min: 100, max: 50000 },
            streak: { min: 3, max: 365 },
            exercisesPerSession: { min: 1, max: 20 },
            weeklyFrequency: { min: 1, max: 7 }
        };
        
        for (const [key, value] of Object.entries(goals)) {
            if (key === 'updatedAt') continue;
            
            const rule = rules[key];
            if (!rule) continue;
            
            if (value < rule.min || value > rule.max) {
                console.warn(`❌ Objectif ${key} invalide : ${value} (min: ${rule.min}, max: ${rule.max})`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Charger les objectifs utilisateur
     */
    async function loadUserGoals() {
        try {
            if (typeof Storage !== 'undefined') {
                const savedGoals = await Storage.getItem('user_goals');
                if (savedGoals) {
                    currentGoals = savedGoals;
                } else {
                    // Objectifs par défaut
                    currentGoals = {
                        sessions: 12,
                        duration: 20,
                        volume: 5000,
                        streak: 30,
                        exercisesPerSession: 6,
                        weeklyFrequency: 3
                    };
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement objectifs :', error);
            currentGoals = {
                sessions: 12,
                duration: 20,
                volume: 5000,
                streak: 30,
                exercisesPerSession: 6,
                weeklyFrequency: 3
            };
        }
    }

    /**
     * Mettre à jour l'affichage de progression
     */
    async function updateProgressDisplay() {
        try {
            if (typeof AnalyticsModel !== 'undefined') {
                const currentProgress = await AnalyticsModel.getCurrentProgress();
                
                // Mettre à jour chaque objectif
                updateProgressCard('sessions', currentProgress.sessions, currentGoals.sessions);
                updateProgressCard('duration', currentProgress.duration, currentGoals.duration * 3600000); // Convertir en ms
                updateProgressCard('volume', currentProgress.volume, currentGoals.volume);
                updateProgressCard('streak', currentProgress.streak, currentGoals.streak);
            }
        } catch (error) {
            console.warn('⚠️ Erreur mise à jour progression :', error);
        }
    }

    /**
     * Mettre à jour une carte de progression
     */
    function updateProgressCard(type, current, target) {
        try {
            const percentage = Math.min(100, Math.round((current / target) * 100));
            
            // Éléments DOM
            const currentElement = document.getElementById(`${type}-current`);
            const targetElement = document.getElementById(`${type}-target`);
            const progressElement = document.getElementById(`${type}-progress`);
            const percentageElement = document.getElementById(`${type}-percentage`);
            
            // Mettre à jour les valeurs
            if (currentElement) {
                if (type === 'duration') {
                    currentElement.textContent = formatDuration(current);
                } else {
                    currentElement.textContent = current;
                }
            }
            
            if (targetElement) {
                if (type === 'duration') {
                    targetElement.textContent = `/ ${formatDuration(target)}`;
                } else {
                    targetElement.textContent = `/ ${target}`;
                }
            }
            
            if (progressElement) {
                progressElement.style.width = `${percentage}%`;
                
                // Couleur selon la progression
                progressElement.className = 'progress-fill';
                if (percentage >= 100) {
                    progressElement.classList.add('completed');
                } else if (percentage >= 75) {
                    progressElement.classList.add('high');
                } else if (percentage >= 50) {
                    progressElement.classList.add('medium');
                }
            }
            
            if (percentageElement) {
                percentageElement.textContent = `${percentage}%`;
            }
            
        } catch (error) {
            console.error('❌ Erreur mise à jour carte progression :', error);
        }
    }

    /**
     * Gérer la fin de session
     */
    function handleSessionCompleted(data) {
        console.log('🎯 Session terminée - Mise à jour analytics');
        
        // Mettre à jour les analytics avec délai pour laisser le temps aux données de se propager
        setTimeout(async () => {
            if (typeof AnalyticsView !== 'undefined') {
                await AnalyticsView.loadAnalyticsData();
            }
            await updateProgressDisplay();
        }, 1000);
    }

    /**
     * Gérer la mise à jour des objectifs
     */
    function handleGoalsUpdated(newGoals) {
        currentGoals = newGoals;
        updateProgressDisplay();
        console.log('🎯 Objectifs mis à jour');
    }

    /**
     * Convertir les données en CSV
     */
    function convertToCSV(data) {
        let csv = '';
        
        // Sessions
        if (data.sessions && data.sessions.length > 0) {
            csv += 'SESSIONS\n';
            csv += 'Date,Nom,Durée,Exercices,Sets,Volume\n';
            
            data.sessions.forEach(session => {
                csv += `${new Date(session.started_at).toLocaleDateString()},`;
                csv += `"${session.name}",`;
                csv += `${Math.round(session.duration / 60000)},`; // minutes
                csv += `${session.exercises?.length || 0},`;
                csv += `${session.total_sets || 0},`;
                csv += `${session.total_volume || 0}\n`;
            });
            
            csv += '\n';
        }
        
        // Exercices
        if (data.exercises && data.exercises.length > 0) {
            csv += 'EXERCICES\n';
            csv += 'Nom,Groupe musculaire,Mode,Utilisations\n';
            
            data.exercises.forEach(exercise => {
                csv += `"${exercise.name}",`;
                csv += `"${exercise.muscle_group}",`;
                csv += `"${exercise.exercise_mode}",`;
                csv += `${exercise.usage_count || 0}\n`;
            });
        }
        
        return csv;
    }

    /**
     * Télécharger un fichier
     */
    function downloadFile(content, fileName, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('❌ Erreur téléchargement :', error);
            throw error;
        }
    }

    /**
     * Compter les enregistrements
     */
    function countRecords(data) {
        let count = 0;
        if (data.sessions) count += data.sessions.length;
        if (data.exercises) count += data.exercises.length;
        return count;
    }

    /**
     * Obtenir une chaîne de date
     */
    function getDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    /**
     * Formater une durée
     */
    function formatDuration(ms) {
        if (!ms || ms <= 0) return '0h';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Obtenir les objectifs actuels
     */
    function getCurrentGoals() {
        return { ...currentGoals };
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
                        <h2>⚠️ Analytics non disponible</h2>
                        <p>Le module d'analytics n'est pas encore chargé.</p>
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
                        <h2>❌ Erreur Analytics</h2>
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
            hasView: typeof AnalyticsView !== 'undefined',
            hasGoals: Object.keys(currentGoals).length > 0,
            exportFormat
        };
    }

    // Interface publique
    return {
        init,
        renderAnalytics,
        exportData,
        showGoalsModal,
        saveGoals,
        loadUserGoals,
        updateProgressDisplay,
        getCurrentGoals,
        getInitializationStatus
    };
})();

// Export global
window.AnalyticsController = AnalyticsController;