/**
 * SmartTrack - Modèle Templates
 * Gestion des templates de séances d'entraînement
 */

const TemplatesModel = (function() {
    let templates = [];
    let isLoaded = false;

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('📋 Initialisation du modèle Templates...');
            
            await loadTemplates();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('storage:saved', handleStorageUpdate);
                EventBus.on('templates:reload', loadTemplates);
            }
            
            console.log(`✓ Modèle Templates initialisé (${templates.length} templates)`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Templates :', error);
            throw error;
        }
    }

    /**
     * Charger tous les templates
     */
    async function loadTemplates() {
        try {
            const data = await Storage.get(STORAGE_KEYS.TEMPLATES);
            templates = data || [];
            isLoaded = true;
            
            // Trier par date de création décroissante
            templates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Émettre événement de chargement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:loaded', { count: templates.length });
            }
            
            return templates;
            
        } catch (error) {
            console.error('❌ Erreur chargement templates :', error);
            templates = [];
            return [];
        }
    }

    /**
     * Sauvegarder les templates
     */
    async function saveTemplates() {
        try {
            await Storage.set(STORAGE_KEYS.TEMPLATES, templates);
            
            // Émettre événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:saved', { count: templates.length });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde templates :', error);
            return false;
        }
    }

    /**
     * Créer un nouveau template
     */
    async function createTemplate(templateData) {
        try {
            // Valider les données
            const validatedData = validateTemplateData(templateData);
            if (!validatedData) {
                throw new Error('Données de template invalides');
            }

            // Créer le template
            const newTemplate = {
                id: Utils.generateId(),
                ...validatedData,
                usage_count: 0,
                last_used: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Ajouter à la liste
            templates.unshift(newTemplate);
            
            // Sauvegarder
            await saveTemplates();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:created', { template: newTemplate });
            }
            
            return newTemplate;
            
        } catch (error) {
            console.error('❌ Erreur création template :', error);
            throw error;
        }
    }

    /**
     * Créer un template depuis une session existante
     */
    async function createTemplateFromSession(sessionId, templateName = '') {
        try {
            const session = await SessionsModel.getById(sessionId);
            if (!session) {
                throw new Error('Session non trouvée');
            }

            // Préparer les données du template
            const templateData = {
                name: templateName || `Template ${session.name}`,
                description: `Template créé depuis la session du ${Utils.formatDate(session.date)}`,
                category: 'custom',
                exercises: session.exercises.map(exercise => ({
                    exercise_id: exercise.exercise_id,
                    sets: exercise.sets.map(set => ({
                        reps: set.reps || 0,
                        weight: set.weight || 0,
                        duration: set.duration || 0,
                        rest_time: set.rest_time || 90
                    }))
                })),
                estimated_duration: session.duration || 60,
                difficulty: 'intermediate',
                tags: ['custom', 'from-session'],
                source: 'session'
            };

            return await createTemplate(templateData);
            
        } catch (error) {
            console.error('❌ Erreur création template depuis session :', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un template
     */
    async function updateTemplate(id, updatedData) {
        try {
            const index = templates.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Template non trouvé');
            }

            // Valider les nouvelles données
            const validatedData = validateTemplateData(updatedData, true);
            if (!validatedData) {
                throw new Error('Données de template invalides');
            }

            // Mettre à jour le template
            const originalTemplate = templates[index];
            templates[index] = {
                ...originalTemplate,
                ...validatedData,
                updated_at: new Date().toISOString()
            };

            // Sauvegarder
            await saveTemplates();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:updated', { 
                    template: templates[index],
                    original: originalTemplate 
                });
            }
            
            return templates[index];
            
        } catch (error) {
            console.error('❌ Erreur modification template :', error);
            throw error;
        }
    }

    /**
     * Supprimer un template
     */
    async function removeTemplate(id) {
        try {
            const index = templates.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Template non trouvé');
            }

            // Supprimer le template
            const removedTemplate = templates.splice(index, 1)[0];
            
            // Sauvegarder
            await saveTemplates();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:removed', { template: removedTemplate });
            }
            
            return removedTemplate;
            
        } catch (error) {
            console.error('❌ Erreur suppression template :', error);
            throw error;
        }
    }

    /**
     * Dupliquer un template
     */
    async function duplicateTemplate(id) {
        try {
            const original = getById(id);
            if (!original) {
                throw new Error('Template non trouvé');
            }

            // Créer une copie avec un nouveau nom
            const copy = {
                ...original,
                name: `${original.name} (Copie)`
            };

            // Supprimer les champs qui seront régénérés
            delete copy.id;
            delete copy.created_at;
            delete copy.updated_at;
            delete copy.usage_count;
            delete copy.last_used;

            return await createTemplate(copy);
            
        } catch (error) {
            console.error('❌ Erreur duplication template :', error);
            throw error;
        }
    }

    /**
     * Utiliser un template pour créer une nouvelle session
     */
    async function useTemplate(templateId) {
        try {
            const template = getById(templateId);
            if (!template) {
                throw new Error('Template non trouvé');
            }

            // Mettre à jour les statistiques d'utilisation
            template.usage_count++;
            template.last_used = new Date().toISOString();
            await updateTemplate(templateId, { 
                usage_count: template.usage_count,
                last_used: template.last_used 
            });

            // Créer les données de session basées sur le template
            const sessionData = {
                name: template.name,
                exercises: template.exercises.map(exercise => ({
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
                }))
            };

            // Créer la session avec le modèle Sessions
            const newSession = await SessionsModel.createSession(sessionData);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('templates:used', { 
                    template,
                    session: newSession 
                });
            }
            
            return newSession;
            
        } catch (error) {
            console.error('❌ Erreur utilisation template :', error);
            throw error;
        }
    }

    /**
     * Obtenir tous les templates
     */
    function getAll() {
        if (!isLoaded) {
            console.warn('⚠️ Templates non chargés, retour d\'un tableau vide');
            return [];
        }
        return [...templates];
    }

    /**
     * Obtenir un template par ID
     */
    function getById(id) {
        return templates.find(template => template.id === id) || null;
    }

    /**
     * Obtenir les templates par catégorie
     */
    function getByCategory(category) {
        return templates.filter(template => template.category === category);
    }

    /**
     * Rechercher des templates
     */
    function search(query) {
        if (!query || query.trim() === '') {
            return getAll();
        }

        const lowerQuery = query.toLowerCase().trim();
        
        return templates.filter(template => {
            return (
                template.name.toLowerCase().includes(lowerQuery) ||
                template.description.toLowerCase().includes(lowerQuery) ||
                template.category.toLowerCase().includes(lowerQuery) ||
                (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            );
        });
    }

    /**
     * Filtrer les templates avec critères multiples
     */
    function filter(criteria = {}) {
        let filtered = [...templates];

        // Filtre par catégorie
        if (criteria.category && criteria.category !== 'all') {
            filtered = filtered.filter(t => t.category === criteria.category);
        }

        // Filtre par difficulté
        if (criteria.difficulty && criteria.difficulty !== 'all') {
            filtered = filtered.filter(t => t.difficulty === criteria.difficulty);
        }

        // Filtre par durée
        if (criteria.maxDuration) {
            filtered = filtered.filter(t => t.estimated_duration <= criteria.maxDuration);
        }
        if (criteria.minDuration) {
            filtered = filtered.filter(t => t.estimated_duration >= criteria.minDuration);
        }

        // Filtre par tag
        if (criteria.tag) {
            filtered = filtered.filter(t => 
                t.tags && t.tags.includes(criteria.tag)
            );
        }

        // Recherche textuelle
        if (criteria.search) {
            const query = criteria.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
            );
        }

        // Tri
        if (criteria.sortBy) {
            switch (criteria.sortBy) {
                case 'name':
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'usage':
                    filtered.sort((a, b) => b.usage_count - a.usage_count);
                    break;
                case 'recent':
                    filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                    break;
                case 'duration':
                    filtered.sort((a, b) => a.estimated_duration - b.estimated_duration);
                    break;
                default:
                    // Tri par défaut : récent
                    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        }

        return filtered;
    }

    /**
     * Obtenir les templates les plus utilisés
     */
    function getMostUsed(limit = 5) {
        return templates
            .filter(t => t.usage_count > 0)
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, limit);
    }

    /**
     * Obtenir les templates récents
     */
    function getRecent(limit = 5) {
        return templates
            .sort((a, b) => new Date(b.last_used || 0) - new Date(a.last_used || 0))
            .slice(0, limit);
    }

    /**
     * Obtenir les templates favoris (usage élevé et récent)
     */
    function getFavorites(limit = 5) {
        const now = Date.now();
        const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

        return templates
            .filter(t => t.usage_count > 0)
            .map(t => {
                // Score basé sur usage et récence
                const recencyScore = t.last_used ? 
                    Math.max(0, 1 - (now - new Date(t.last_used).getTime()) / MONTH_MS) : 0;
                const usageScore = Math.min(t.usage_count / 10, 1); // Normaliser sur 10 utilisations
                return {
                    ...t,
                    favoriteScore: (usageScore * 0.7) + (recencyScore * 0.3)
                };
            })
            .sort((a, b) => b.favoriteScore - a.favoriteScore)
            .slice(0, limit);
    }

    /**
     * Valider les données d'un template
     */
    function validateTemplateData(data, isUpdate = false) {
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
                const validCategories = ['strength', 'cardio', 'flexibility', 'custom', 'predefined'];
                validated.category = validCategories.includes(data.category) ? 
                    data.category : 'custom';
            }

            // Exercices (obligatoire pour nouveau template)
            if (!isUpdate || data.exercises !== undefined) {
                if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
                    throw new Error('Au moins un exercice requis');
                }
                
                validated.exercises = data.exercises.map((exercise, index) => ({
                    exercise_id: exercise.exercise_id,
                    sets: exercise.sets || [{ reps: 0, weight: 0, duration: 0 }],
                    order: index
                }));
            }

            // Durée estimée
            if (data.estimated_duration !== undefined) {
                validated.estimated_duration = Utils.validateNumber(data.estimated_duration, 15, 180) || 60;
            }

            // Difficulté
            if (data.difficulty !== undefined) {
                const validDifficulties = ['beginner', 'intermediate', 'advanced'];
                validated.difficulty = validDifficulties.includes(data.difficulty) ? 
                    data.difficulty : 'intermediate';
            }

            // Tags
            if (data.tags !== undefined) {
                validated.tags = Array.isArray(data.tags) ? 
                    data.tags.filter(tag => typeof tag === 'string' && tag.trim()) : [];
            }

            // Source
            if (data.source !== undefined) {
                const validSources = ['user', 'predefined', 'session', 'program'];
                validated.source = validSources.includes(data.source) ? 
                    data.source : 'user';
            }

            return validated;
            
        } catch (error) {
            console.error('❌ Erreur validation template :', error);
            return null;
        }
    }

    /**
     * Obtenir les statistiques des templates
     */
    function getStats() {
        const stats = {
            total: templates.length,
            byCategory: {},
            byDifficulty: {},
            bySource: {},
            totalUsage: 0,
            mostUsed: null,
            averageDuration: 0,
            averageExercises: 0
        };

        let totalDuration = 0;
        let totalExercises = 0;

        templates.forEach(template => {
            // Par catégorie
            const category = template.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Par difficulté
            const difficulty = template.difficulty;
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;

            // Par source
            const source = template.source;
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;

            // Statistiques globales
            stats.totalUsage += template.usage_count || 0;
            totalDuration += template.estimated_duration || 0;
            totalExercises += template.exercises ? template.exercises.length : 0;

            // Template le plus utilisé
            if (!stats.mostUsed || template.usage_count > stats.mostUsed.usage_count) {
                stats.mostUsed = template;
            }
        });

        // Moyennes
        if (templates.length > 0) {
            stats.averageDuration = Math.round(totalDuration / templates.length);
            stats.averageExercises = Math.round(totalExercises / templates.length);
        }

        return stats;
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.TEMPLATES) {
            console.log('🔄 Mise à jour des templates détectée');
            loadTemplates();
        }
    }

    /**
     * Vérifier si les templates sont chargés
     */
    function isTemplatesLoaded() {
        return isLoaded;
    }

    /**
     * Obtenir le nombre de templates
     */
    function getCount() {
        return templates.length;
    }

    // Interface publique
    return {
        init,
        loadTemplates,
        createTemplate,
        createTemplateFromSession,
        updateTemplate,
        removeTemplate,
        duplicateTemplate,
        useTemplate,
        getAll,
        getById,
        getByCategory,
        search,
        filter,
        getMostUsed,
        getRecent,
        getFavorites,
        getStats,
        isTemplatesLoaded,
        getCount
    };
})();

// Export global
window.TemplatesModel = TemplatesModel;