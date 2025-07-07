/**
 * SmartTrack - Contrôleur Photos
 * Orchestration de la gestion des photos de progression
 */

const PhotosController = (function() {
    let isInitialized = false;
    let maxFileSize = 10 * 1024 * 1024; // 10MB
    let allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    let compressionQuality = 0.8;

    /**
     * Initialiser le contrôleur
     */
    function init() {
        try {
            console.log('📸 Initialisation PhotosController...');
            
            // Écouter les événements de navigation
            if (typeof EventBus !== 'undefined') {
                EventBus.on('router:route-changed', handleRouteChange);
                EventBus.on('photos:upload-photo', handleUploadPhoto);
                EventBus.on('photos:delete-photo', handleDeletePhoto);
                EventBus.on('photos:update-photo', handleUpdatePhoto);
                EventBus.on('photos:create-comparison', handleCreateComparison);
                EventBus.on('photos:compress-image', handleCompressImage);
                EventBus.on('session:session-completed', handleSessionCompleted);
            }
            
            isInitialized = true;
            console.log('✓ PhotosController initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation PhotosController :', error);
            throw error;
        }
    }

    /**
     * Gérer le changement de route
     */
    async function handleRouteChange(data) {
        try {
            if (data.route === 'photos') {
                console.log('📸 Navigation vers Photos');
                
                // Initialiser la vue si nécessaire
                if (typeof PhotosView !== 'undefined') {
                    await PhotosView.render();
                } else {
                    console.error('❌ PhotosView non disponible');
                }
            }
        } catch (error) {
            console.error('❌ Erreur navigation Photos :', error);
        }
    }

    /**
     * Gérer l'upload de photo
     */
    async function handleUploadPhoto(photoData) {
        try {
            console.log('📸 Upload photo :', photoData);
            
            const { file, metadata = {} } = photoData;
            
            // Valider le fichier
            const validation = validatePhotoFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            
            // Compresser l'image si nécessaire
            const processedFile = await processImageFile(file);
            
            // Créer les données de photo
            const photoRecord = await createPhotoRecord(processedFile, metadata);
            
            // Sauvegarder via le modèle
            if (typeof PhotosModel !== 'undefined') {
                const savedPhoto = await PhotosModel.addPhoto(photoRecord);
                
                // Notifier l'upload
                EventBus.emit('photos:photo-uploaded', { photo: savedPhoto });
                
                // Intégration gamification
                await handlePhotoUploadReward(savedPhoto);
                
                return { success: true, photo: savedPhoto };
                
            } else {
                throw new Error('PhotosModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur upload photo :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur upload photo : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer la suppression de photo
     */
    async function handleDeletePhoto(data) {
        try {
            console.log('🗑️ Suppression photo :', data);
            
            const { photoId, confirmation = false } = data;
            
            // Demander confirmation si non fournie
            if (!confirmation) {
                const confirmed = await showDeleteConfirmation(photoId);
                if (!confirmed) return { success: false, cancelled: true };
            }
            
            // Supprimer via le modèle
            if (typeof PhotosModel !== 'undefined') {
                const deletedPhoto = await PhotosModel.deletePhoto(photoId);
                
                // Nettoyer le stockage des fichiers
                await cleanupPhotoFiles(deletedPhoto);
                
                // Notifier la suppression
                EventBus.emit('photos:photo-deleted', { photoId, photo: deletedPhoto });
                
                return { success: true };
                
            } else {
                throw new Error('PhotosModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur suppression photo :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur suppression photo : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer la mise à jour de photo
     */
    async function handleUpdatePhoto(data) {
        try {
            console.log('✏️ Mise à jour photo :', data);
            
            const { photoId, updates } = data;
            
            // Valider les mises à jour
            const validation = validatePhotoUpdates(updates);
            if (!validation.isValid) {
                throw new Error(`Validation échouée : ${validation.errors.join(', ')}`);
            }
            
            // Mettre à jour via le modèle
            if (typeof PhotosModel !== 'undefined') {
                const updatedPhoto = await PhotosModel.updatePhoto(photoId, updates);
                
                // Notifier la mise à jour
                EventBus.emit('photos:photo-updated', { photo: updatedPhoto });
                
                return { success: true, photo: updatedPhoto };
                
            } else {
                throw new Error('PhotosModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur mise à jour photo :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur mise à jour photo : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer la création de comparaison
     */
    async function handleCreateComparison(data) {
        try {
            console.log('⚖️ Création comparaison :', data);
            
            const { photoIds, comparisonType = 'side-by-side', options = {} } = data;
            
            if (!photoIds || photoIds.length < 2) {
                throw new Error('Au moins 2 photos sont requises pour une comparaison');
            }
            
            // Récupérer les photos
            if (typeof PhotosModel !== 'undefined') {
                const photos = await Promise.all(
                    photoIds.map(id => PhotosModel.getPhoto(id))
                );
                
                // Vérifier que toutes les photos existent
                const missingPhotos = photos.filter(photo => !photo);
                if (missingPhotos.length > 0) {
                    throw new Error('Une ou plusieurs photos sont introuvables');
                }
                
                // Créer la comparaison
                const comparison = {
                    id: Date.now().toString(),
                    type: comparisonType,
                    photos: photos.filter(Boolean),
                    options,
                    created_at: Date.now(),
                    analysis: await analyzePhotoProgression(photos.filter(Boolean))
                };
                
                // Sauvegarder la comparaison
                await PhotosModel.saveComparison(comparison);
                
                // Notifier la création
                EventBus.emit('photos:comparison-created', { comparison });
                
                // Intégration gamification
                await handleComparisonReward(comparison);
                
                return { success: true, comparison };
                
            } else {
                throw new Error('PhotosModel non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur création comparaison :', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.error(`Erreur création comparaison : ${error.message}`);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer la compression d'image
     */
    async function handleCompressImage(data) {
        try {
            const { file, quality = compressionQuality, maxWidth = 1920, maxHeight = 1080 } = data;
            
            return await compressImage(file, {
                quality,
                maxWidth,
                maxHeight
            });
            
        } catch (error) {
            console.error('❌ Erreur compression image :', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer la fin de session (photo automatique optionnelle)
     */
    async function handleSessionCompleted(data) {
        try {
            const { session, photos_enabled = false } = data;
            
            if (!photos_enabled) return;
            
            // Proposer de prendre une photo de progression
            await showProgressPhotoSuggestion(session);
            
        } catch (error) {
            console.error('❌ Erreur suggestion photo :', error);
        }
    }

    /**
     * Valider un fichier photo
     */
    function validatePhotoFile(file) {
        if (!file) {
            return { isValid: false, error: 'Aucun fichier sélectionné' };
        }
        
        // Vérifier le type
        if (!allowedFormats.includes(file.type)) {
            return { 
                isValid: false, 
                error: `Format non supporté. Utilisez : ${allowedFormats.join(', ')}` 
            };
        }
        
        // Vérifier la taille
        if (file.size > maxFileSize) {
            return { 
                isValid: false, 
                error: `Fichier trop volumineux. Maximum : ${formatFileSize(maxFileSize)}` 
            };
        }
        
        return { isValid: true };
    }

    /**
     * Traiter un fichier image
     */
    async function processImageFile(file) {
        try {
            // Créer une miniature
            const thumbnail = await createThumbnail(file, 300, 300);
            
            // Compresser l'image principale si nécessaire
            let processedFile = file;
            if (file.size > 2 * 1024 * 1024) { // Si > 2MB
                const compressed = await compressImage(file);
                if (compressed.success) {
                    processedFile = compressed.file;
                }
            }
            
            return {
                original: file,
                compressed: processedFile,
                thumbnail: thumbnail
            };
            
        } catch (error) {
            console.error('❌ Erreur traitement image :', error);
            return { original: file, compressed: file, thumbnail: null };
        }
    }

    /**
     * Créer un enregistrement photo
     */
    async function createPhotoRecord(processedFile, metadata) {
        const { original, compressed, thumbnail } = processedFile;
        
        // Convertir les fichiers en URLs de données
        const mainUrl = await fileToDataUrl(compressed);
        const thumbnailUrl = thumbnail ? await fileToDataUrl(thumbnail) : null;
        
        // Extraire les métadonnées EXIF si disponibles
        const exifData = await extractExifData(original);
        
        return {
            id: Date.now().toString(),
            title: metadata.title || '',
            type: metadata.type || 'front',
            url: mainUrl,
            thumbnail: thumbnailUrl,
            file_size: compressed.size,
            original_size: original.size,
            weight: metadata.weight || null,
            body_part: metadata.body_part || '',
            notes: metadata.notes || '',
            progress_marker: metadata.progress_marker || false,
            camera_info: exifData.camera || null,
            created_at: Date.now(),
            updated_at: Date.now()
        };
    }

    /**
     * Compresser une image
     */
    async function compressImage(file, options = {}) {
        const {
            quality = compressionQuality,
            maxWidth = 1920,
            maxHeight = 1080
        } = options;
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculer les nouvelles dimensions
                let { width, height } = calculateDimensions(
                    img.width, img.height, maxWidth, maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // Dessiner l'image redimensionnée
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        
                        resolve({
                            success: true,
                            file: compressedFile,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            compressionRatio: (1 - blob.size / file.size).toFixed(2)
                        });
                    } else {
                        resolve({ success: false, error: 'Échec de la compression' });
                    }
                }, file.type, quality);
            };
            
            img.onerror = () => {
                resolve({ success: false, error: 'Erreur de chargement de l\'image' });
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Créer une miniature
     */
    async function createThumbnail(file, maxWidth = 300, maxHeight = 300) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const { width, height } = calculateDimensions(
                    img.width, img.height, maxWidth, maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(thumbnailFile);
                    } else {
                        resolve(null);
                    }
                }, file.type, 0.7);
            };
            
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Calculer les dimensions redimensionnées
     */
    function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // Redimensionner proportionnellement
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }

    /**
     * Convertir un fichier en URL de données
     */
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Extraire les métadonnées EXIF
     */
    async function extractExifData(file) {
        try {
            // Implémentation simplifiée
            // Dans un vrai projet, utiliser une bibliothèque EXIF
            return {
                camera: null,
                date: new Date(file.lastModified),
                size: { width: null, height: null }
            };
        } catch (error) {
            console.warn('⚠️ Impossible d\'extraire les données EXIF :', error);
            return {};
        }
    }

    /**
     * Analyser la progression entre photos
     */
    async function analyzePhotoProgression(photos) {
        try {
            if (photos.length < 2) return null;
            
            // Trier par date
            const sortedPhotos = photos.sort((a, b) => a.created_at - b.created_at);
            const firstPhoto = sortedPhotos[0];
            const lastPhoto = sortedPhotos[sortedPhotos.length - 1];
            
            const analysis = {
                timespan: lastPhoto.created_at - firstPhoto.created_at,
                photos_count: photos.length,
                weight_change: null,
                consistency_score: calculateConsistencyScore(sortedPhotos),
                suggestions: []
            };
            
            // Analyse du poids
            if (firstPhoto.weight && lastPhoto.weight) {
                analysis.weight_change = lastPhoto.weight - firstPhoto.weight;
                
                if (Math.abs(analysis.weight_change) > 0.5) {
                    analysis.suggestions.push({
                        type: 'weight_change',
                        message: analysis.weight_change > 0 ? 
                            'Prise de poids détectée' : 
                            'Perte de poids détectée'
                    });
                }
            }
            
            // Suggestions de régularité
            if (analysis.consistency_score < 0.7) {
                analysis.suggestions.push({
                    type: 'consistency',
                    message: 'Essayez de prendre des photos plus régulièrement'
                });
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Erreur analyse progression :', error);
            return null;
        }
    }

    /**
     * Calculer un score de régularité
     */
    function calculateConsistencyScore(photos) {
        if (photos.length < 3) return 1.0;
        
        const intervals = [];
        for (let i = 1; i < photos.length; i++) {
            intervals.push(photos[i].created_at - photos[i-1].created_at);
        }
        
        const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - averageInterval, 2);
        }, 0) / intervals.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / averageInterval;
        
        // Score inversé : plus la variation est faible, meilleur est le score
        return Math.max(0, 1 - coefficientOfVariation);
    }

    /**
     * Valider les mises à jour de photo
     */
    function validatePhotoUpdates(updates) {
        const errors = [];
        
        if (updates.title && updates.title.length > 100) {
            errors.push('Le titre ne peut pas dépasser 100 caractères');
        }
        
        if (updates.notes && updates.notes.length > 1000) {
            errors.push('Les notes ne peuvent pas dépasser 1000 caractères');
        }
        
        if (updates.weight && (updates.weight < 0 || updates.weight > 1000)) {
            errors.push('Le poids doit être entre 0 et 1000 kg');
        }
        
        if (updates.type && !['front', 'side', 'back', 'face', 'custom'].includes(updates.type)) {
            errors.push('Type de photo invalide');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Nettoyer les fichiers d'une photo supprimée
     */
    async function cleanupPhotoFiles(photo) {
        try {
            // Dans un environnement réel, supprimer les fichiers du stockage
            // Ici, les URLs de données sont automatiquement nettoyées par le garbage collector
            console.log('🧹 Nettoyage fichiers photo :', photo.id);
        } catch (error) {
            console.error('❌ Erreur nettoyage fichiers :', error);
        }
    }

    /**
     * Afficher une confirmation de suppression
     */
    async function showDeleteConfirmation(photoId) {
        return new Promise((resolve) => {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '🗑️ Supprimer la photo',
                    content: `
                        <div class="confirmation-content">
                            <p>Êtes-vous sûr de vouloir supprimer cette photo ?</p>
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
                resolve(confirm('Êtes-vous sûr de vouloir supprimer cette photo ?'));
            }
        });
    }

    /**
     * Afficher une suggestion de photo de progression
     */
    async function showProgressPhotoSuggestion(session) {
        try {
            if (typeof ModalManager !== 'undefined') {
                ModalManager.show({
                    title: '📸 Photo de progression',
                    content: `
                        <div class="photo-suggestion">
                            <div class="suggestion-icon">📸</div>
                            <h4>Documenter votre progression ?</h4>
                            <p>Vous venez de terminer une excellente séance !</p>
                            <p>C'est le moment idéal pour prendre une photo et suivre votre évolution.</p>
                        </div>
                    `,
                    actions: [
                        { 
                            text: 'Plus tard', 
                            type: 'secondary', 
                            handler: () => ModalManager.hide()
                        },
                        { 
                            text: 'Prendre une photo', 
                            type: 'primary', 
                            handler: () => {
                                ModalManager.hide();
                                if (typeof PhotosView !== 'undefined') {
                                    PhotosView.showAddPhotoModal();
                                }
                            }
                        }
                    ]
                });
            }
        } catch (error) {
            console.error('❌ Erreur suggestion photo :', error);
        }
    }

    /**
     * Gérer les récompenses pour l'upload de photo
     */
    async function handlePhotoUploadReward(photo) {
        try {
            // Gagner de l'XP pour l'upload
            if (typeof GamificationModel !== 'undefined') {
                await GamificationModel.addExperience(5, 'photo_upload');
                
                // Vérifier les badges liés aux photos
                await GamificationModel.checkPhotoUploadBadges();
            }
            
        } catch (error) {
            console.error('❌ Erreur récompenses photo :', error);
        }
    }

    /**
     * Gérer les récompenses pour les comparaisons
     */
    async function handleComparisonReward(comparison) {
        try {
            // Gagner de l'XP pour la comparaison
            if (typeof GamificationModel !== 'undefined') {
                await GamificationModel.addExperience(10, 'photo_comparison');
                
                // Badge spécial pour la première comparaison
                const photoStats = await PhotosModel.getPhotosStats();
                if (photoStats.comparisons_count === 1) {
                    await GamificationModel.unlockBadge('first_comparison');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur récompenses comparaison :', error);
        }
    }

    /**
     * Formater la taille de fichier
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Obtenir les paramètres de configuration
     */
    function getConfiguration() {
        return {
            maxFileSize,
            allowedFormats,
            compressionQuality
        };
    }

    /**
     * Mettre à jour la configuration
     */
    function updateConfiguration(config) {
        if (config.maxFileSize) maxFileSize = config.maxFileSize;
        if (config.allowedFormats) allowedFormats = config.allowedFormats;
        if (config.compressionQuality) compressionQuality = config.compressionQuality;
    }

    /**
     * Obtenir l'état d'initialisation
     */
    function getInitializationStatus() {
        return {
            isInitialized,
            maxFileSize,
            allowedFormats,
            compressionQuality
        };
    }

    // Interface publique
    return {
        init,
        handleUploadPhoto,
        handleDeletePhoto,
        handleUpdatePhoto,
        handleCreateComparison,
        handleCompressImage,
        validatePhotoFile,
        compressImage,
        createThumbnail,
        getConfiguration,
        updateConfiguration,
        getInitializationStatus
    };
})();

// Export global
window.PhotosController = PhotosController;