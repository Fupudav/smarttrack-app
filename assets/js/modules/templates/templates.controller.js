/**
 * SmartTrack - Contrôleur Templates
 * Orchestration de la logique métier pour les modèles de session
 */

const TemplatesController = (function() {
    let isInitialized = false;
    let selectedTemplateForSession = null;
    let validationRules = null;

    /**
     * Initialiser le contrôleur
     */
    function init() {
        try {
            console.log('📝 Initialisation TemplatesController...');
            
            // Initialiser les règles de validation
            setupValidationRules();
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('router:route-changed', handleRouteChange);
                EventBus.on('templates:create-template', handleCreateTemplate);
                EventBus.on('templates:use-template', handleUseTemplate);
                EventBus.on('templates:delete-template', handleDeleteTemplate);
                EventBus.on('templates:duplicate-template', handleDuplicateTemplate);
                EventBus.on('templates:export-template', handleExportTemplate);
                EventBus.on('templates:import-template', handleImportTemplate);
                EventBus.on('session:template-requested', handleTemplateRequest);
            }
            
            isInitialized = true;
            console.log('✓ TemplatesController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation TemplatesController :', error);
            throw error;
        }
    }

    /**
     * Configurer les règles de validation
     */
    function setupValidationRules() {
        validationRules = {
            name: {
                required: true,
                minLength: 3,
                maxLength: 50,
                pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/
            },
            description: {
                maxLength: 500
            },
            category: {
                required: true,
                allowedValues: ['force', 'cardio', 'mixte', 'recuperation', 'custom']
            },
            exercises: {
                required: true,
                minCount: 1,
                maxCount: 20
            }
        };
    }

    /**
     * Gérer le changement de route
     */
    async function handleRouteChange(data) {
        try {
            if (data.route === 'templates') {
                console.log('📝 Navigation vers Templates');
                
                // Initialiser la vue si nécessaire
                if (typeof TemplatesView !== 'undefined') {
                    await TemplatesView.render();
                } else {
                    console.error('❌ TemplatesView non disponible');
                }
            }
        } catch (error) {
            console.error('❌ Erreur navigation Templates :', error);
        }
    }

    /**
     * Créer un nouveau template
     */
    async function handleCreateTemplate(templateData) {
        try {
            console.log('📝 Création template :', templateData);
            
            // Valider les données
            const validation = validateTemplateData(templateData);
            if (!validation.isValid) {
                throw new Error(`Validation échouée : ${validation.errors.join(', ')}`);
            }
            
            // Créer le template via le modèle
            if (typeof TemplatesModel !== 'undefined') {
                const template = await TemplatesModel.createTemplate(templateData);
                
                // Notifier la création
                EventBus.emit('templates:template-created', { template });
                
                // Intégration gamification
                await handleTemplateCreationReward(template);
                
                return { success: true, template };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur création template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur création template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Utiliser un template pour une session
     */
    async function handleUseTemplate(data) {
        try {
            console.log('🚀 Utilisation template :', data);
            
            const { templateId, sessionOptions = {} } = data;
            
            // Récupérer le template
            if (typeof TemplatesModel !== 'undefined') {
                const template = await TemplatesModel.getTemplate(templateId);
                if (!template) {
                    throw new Error('Template non trouvé');
                }
                
                // Marquer comme utilisé
                await TemplatesModel.markTemplateAsUsed(templateId);
                
                // Préparer les données de session
                const sessionData = prepareSessionFromTemplate(template, sessionOptions);
                
                // Stocker pour la préparation de session
                selectedTemplateForSession = {
                    template,
                    sessionData,
                    timestamp: Date.now()
                };
                
                // Notifier l'utilisation
                EventBus.emit('templates:template-used', { 
                    template, 
                    sessionData 
                });
                
                // Rediriger vers la préparation
                if (typeof Router !== 'undefined') {
                    Router.navigate('preparation', { fromTemplate: templateId });
                }
                
                return { success: true, sessionData };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur utilisation template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur utilisation template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Supprimer un template
     */
    async function handleDeleteTemplate(data) {
        try {
            console.log('🗑️ Suppression template :', data);
            
            const { templateId, confirmation = false } = data;
            
            // Demander confirmation si non fournie
            if (!confirmation) {
                const confirmed = await showDeleteConfirmation(templateId);
                if (!confirmed) return { success: false, cancelled: true };
            }
            
            // Supprimer via le modèle
            if (typeof TemplatesModel !== 'undefined') {
                await TemplatesModel.deleteTemplate(templateId);
                
                // Notifier la suppression
                EventBus.emit('templates:template-deleted', { templateId });
                
                return { success: true };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur suppression template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur suppression template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Dupliquer un template
     */
    async function handleDuplicateTemplate(data) {
        try {
            console.log('📋 Duplication template :', data);
            
            const { templateId, newName } = data;
            
            // Récupérer le template original
            if (typeof TemplatesModel !== 'undefined') {
                const originalTemplate = await TemplatesModel.getTemplate(templateId);
                if (!originalTemplate) {
                    throw new Error('Template original non trouvé');
                }
                
                // Créer les données pour le nouveau template
                const duplicateData = {
                    ...originalTemplate,
                    id: undefined,
                    name: newName || `${originalTemplate.name} (Copie)`,
                    created_at: Date.now(),
                    last_used: null,
                    usage_count: 0
                };
                
                // Créer le nouveau template
                const newTemplate = await TemplatesModel.createTemplate(duplicateData);
                
                // Notifier la création
                EventBus.emit('templates:template-created', { template: newTemplate });
                
                return { success: true, template: newTemplate };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur duplication template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur duplication template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Exporter un template
     */
    async function handleExportTemplate(data) {
        try {
            console.log('📤 Export template :', data);
            
            const { templateId, format = 'json', includeMetadata = true } = data;
            
            // Récupérer le template
            if (typeof TemplatesModel !== 'undefined') {
                const template = await TemplatesModel.getTemplate(templateId);
                if (!template) {
                    throw new Error('Template non trouvé');
                }
                
                // Préparer les données d'export
                const exportData = prepareTemplateExport(template, includeMetadata);
                
                // Générer le fichier selon le format
                let fileContent, fileName, mimeType;
                
                switch (format) {
                    case 'json':
                        fileContent = JSON.stringify(exportData, null, 2);
                        fileName = `template_${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                        mimeType = 'application/json';
                        break;
                        
                    case 'csv':
                        fileContent = convertTemplateToCSV(exportData);
                        fileName = `template_${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
                        mimeType = 'text/csv';
                        break;
                        
                    default:
                        throw new Error(`Format d'export non supporté : ${format}`);
                }
                
                // Déclencher le téléchargement
                downloadFile(fileContent, fileName, mimeType);
                
                // Notifier l'export
                EventBus.emit('templates:template-exported', { 
                    template, 
                    format, 
                    fileName 
                });
                
                return { success: true, fileName };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur export template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur export template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Importer un template
     */
    async function handleImportTemplate(data) {
        try {
            console.log('📥 Import template :', data);
            
            const { file, replaceExisting = false } = data;
            
            // Lire le fichier
            const fileContent = await readFileContent(file);
            let templateData;
            
            // Parser selon le type de fichier
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                templateData = JSON.parse(fileContent);
            } else {
                throw new Error('Format de fichier non supporté. Utilisez JSON.');
            }
            
            // Valider les données importées
            const validation = validateImportedTemplate(templateData);
            if (!validation.isValid) {
                throw new Error(`Template invalide : ${validation.errors.join(', ')}`);
            }
            
            // Vérifier les conflits de nom
            if (typeof TemplatesModel !== 'undefined') {
                const existingTemplate = await TemplatesModel.getTemplateByName(templateData.name);
                
                if (existingTemplate && !replaceExisting) {
                    // Proposer un nouveau nom
                    templateData.name = `${templateData.name} (Importé)`;
                }
                
                // Nettoyer les données pour l'import
                const cleanTemplateData = {
                    ...templateData,
                    id: undefined,
                    created_at: Date.now(),
                    last_used: null,
                    usage_count: 0
                };
                
                // Créer le template
                const newTemplate = await TemplatesModel.createTemplate(cleanTemplateData);
                
                // Notifier l'import
                EventBus.emit('templates:template-imported', { 
                    template: newTemplate,
                    originalFileName: file.name
                });
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.success(`Template "${newTemplate.name}" importé avec succès !`);
                }
                
                return { success: true, template: newTemplate };
                
            } else {
                throw new Error('TemplatesModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur import template :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur import template : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer les demandes de template depuis d'autres modules
     */
    async function handleTemplateRequest(data) {
        try {
            const { requestType, templateId } = data;
            
            switch (requestType) {
                case 'get-for-session':
                    return await provideTemplateForSession(templateId);
                    
                case 'get-favorites':
                    return await provideFavoriteTemplates();
                    
                case 'get-recent':
                    return await provideRecentTemplates();
                    
                default:
                    console.warn('❓ Type de demande template non reconnu :', requestType);
                    return null;
            }
            
        } catch (error) {
            console.error('❌ Erreur demande template :', error);
            return null;
        }
    }

    /**
     * Valider les données d'un template
     */
    function validateTemplateData(data) {
        const errors = [];
        
        // Validation du nom
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Le nom est requis');
        } else if (data.name.length < validationRules.name.minLength) {
            errors.push(`Le nom doit contenir au moins ${validationRules.name.minLength} caractères`);
        } else if (data.name.length > validationRules.name.maxLength) {
            errors.push(`Le nom ne peut pas dépasser ${validationRules.name.maxLength} caractères`);
        } else if (!validationRules.name.pattern.test(data.name)) {
            errors.push('Le nom contient des caractères non autorisés');
        }
        
        // Validation de la catégorie
        if (!data.category) {
            errors.push('La catégorie est requise');
        } else if (!validationRules.category.allowedValues.includes(data.category)) {
            errors.push('Catégorie non valide');
        }
        
        // Validation des exercices
        if (!data.exercises || !Array.isArray(data.exercises)) {
            errors.push('Les exercices sont requis');
        } else if (data.exercises.length < validationRules.exercises.minCount) {
            errors.push(`Au moins ${validationRules.exercises.minCount} exercice est requis`);
        } else if (data.exercises.length > validationRules.exercises.maxCount) {
            errors.push(`Maximum ${validationRules.exercises.maxCount} exercices autorisés`);
        }
        
        // Validation de la description
        if (data.description && data.description.length > validationRules.description.maxLength) {
            errors.push(`La description ne peut pas dépasser ${validationRules.description.maxLength} caractères`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Préparer une session à partir d'un template
     */
    function prepareSessionFromTemplate(template, options = {}) {
        const sessionData = {
            name: template.name,
            type: 'template',
            template_id: template.id,
            exercises: template.exercises.map(exercise => ({
                ...exercise,
                id: `${exercise.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                completed_sets: 0,
                start_time: null,
                end_time: null,
                notes: '',
                // Copier les sets avec reset des données de performance
                sets: exercise.sets.map(set => ({
                    ...set,
                    completed: false,
                    actual_reps: null,
                    actual_weight: null,
                    actual_duration: null,
                    rest_time: null
                }))
            })),
            estimated_duration: template.estimated_duration,
            notes: options.notes || '',
            created_at: Date.now(),
            started_at: null,
            ended_at: null
        };
        
        return sessionData;
    }

    /**
     * Gérer les récompenses pour la création de template
     */
    async function handleTemplateCreationReward(template) {
        try {
            // Gagner de l'XP pour la création
            if (typeof GamificationModel !== 'undefined') {
                await GamificationModel.addExperience(10, 'template_creation');
                
                // Vérifier les badges liés aux templates
                await GamificationModel.checkTemplateCreationBadges();
            }
            
        } catch (error) {
            console.error('❌ Erreur récompenses template :', error);
        }
    }

    /**
     * Afficher une confirmation de suppression
     */
    async function showDeleteConfirmation(templateId) {
        return new Promise((resolve) => {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🗑️ Supprimer le modèle',
                    content: `
                        <div class="confirmation-content">
                            <p>Êtes-vous sûr de vouloir supprimer ce modèle ?</p>
                            <p><strong>Cette action est irréversible.</strong></p>
                        </div>
                    `,
                    actions: [
                        { 
                            text: 'Annuler', 
                            type: 'secondary', 
                            handler: () => {
                                ModalManager.hide();
                                resolve(false);
                            }
                        },
                        { 
                            text: 'Supprimer', 
                            type: 'danger', 
                            handler: () => {
                                ModalManager.hide();
                                resolve(true);
                            }
                        }
                    ]
                });
            } else {
                // Fallback avec confirm natif
                resolve(confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?'));
            }
        });
    }

    /**
     * Préparer les données d'export
     */
    function prepareTemplateExport(template, includeMetadata) {
        const exportData = {
            name: template.name,
            description: template.description,
            category: template.category,
            exercises: template.exercises,
            estimated_duration: template.estimated_duration
        };
        
        if (includeMetadata) {
            exportData.metadata = {
                created_at: template.created_at,
                usage_count: template.usage_count,
                export_date: Date.now(),
                export_version: '1.0'
            };
        }
        
        return exportData;
    }

    /**
     * Convertir un template en format CSV
     */
    function convertTemplateToCSV(templateData) {
        const headers = ['Exercice', 'Groupe Musculaire', 'Mode', 'Sets', 'Reps/Durée'];
        const rows = [headers.join(',')];
        
        templateData.exercises.forEach(exercise => {
            const mode = exercise.exercise_mode === 'reps' ? 'Répétitions' : 'Temps';
            const setsInfo = exercise.sets.map(set => {
                if (exercise.exercise_mode === 'reps') {
                    return `${set.reps} reps`;
                } else {
                    return `${set.duration}s`;
                }
            }).join(' | ');
            
            const row = [
                `"${exercise.name}"`,
                `"${exercise.muscle_group}"`,
                `"${mode}"`,
                exercise.sets.length,
                `"${setsInfo}"`
            ];
            
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    /**
     * Déclencher le téléchargement d'un fichier
     */
    function downloadFile(content, fileName, mimeType) {
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
    }

    /**
     * Lire le contenu d'un fichier
     */
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erreur lecture fichier'));
            
            reader.readAsText(file);
        });
    }

    /**
     * Valider un template importé
     */
    function validateImportedTemplate(data) {
        const errors = [];
        
        // Vérifications basiques
        if (!data || typeof data !== 'object') {
            errors.push('Données de template invalides');
            return { isValid: false, errors };
        }
        
        // Utiliser la validation standard
        return validateTemplateData(data);
    }

    /**
     * Fournir un template pour une session
     */
    async function provideTemplateForSession(templateId) {
        if (selectedTemplateForSession && selectedTemplateForSession.template.id === templateId) {
            return selectedTemplateForSession;
        }
        return null;
    }

    /**
     * Fournir les templates favoris
     */
    async function provideFavoriteTemplates() {
        try {
            if (typeof TemplatesModel !== 'undefined') {
                return await TemplatesModel.getFavoriteTemplates();
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération templates favoris :', error);
            return [];
        }
    }

    /**
     * Fournir les templates récents
     */
    async function provideRecentTemplates() {
        try {
            if (typeof TemplatesModel !== 'undefined') {
                return await TemplatesModel.getRecentTemplates(5);
            }
            return [];
        } catch (error) {
            console.error('❌ Erreur récupération templates récents :', error);
            return [];
        }
    }

    /**
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            hasSelectedTemplate: selectedTemplateForSession !== null,
            validationRules: validationRules !== null
        };
    }

    /**
     * Obtenir les statistiques des templates
     */
    async function getTemplatesStats() {
        try {
            if (typeof TemplatesModel !== 'undefined') {
                return await TemplatesModel.getTemplatesStats();
            }
            return null;
        } catch (error) {
            console.error('❌ Erreur récupération stats templates :', error);
            return null;
        }
    }

    // Interface publique
    return {
        init,
        handleCreateTemplate,
        handleUseTemplate,
        handleDeleteTemplate,
        handleDuplicateTemplate,
        handleExportTemplate,
        handleImportTemplate,
        validateTemplateData,
        prepareSessionFromTemplate,
        getTemplatesStats,
        getInitializationStatus
    };
})();

// Export global
window.TemplatesController = TemplatesController;