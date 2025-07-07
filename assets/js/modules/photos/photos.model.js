/**
 * SmartTrack - Modèle Photos
 * Gestion des photos de progression
 */

const PhotosModel = (function() {
    let photos = [];
    let isLoaded = false;

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('📸 Initialisation du modèle Photos...');
            
            await loadPhotos();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('storage:saved', handleStorageUpdate);
                EventBus.on('photos:reload', loadPhotos);
            }
            
            console.log(`✓ Modèle Photos initialisé (${photos.length} photos)`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Photos :', error);
            throw error;
        }
    }

    /**
     * Charger toutes les photos
     */
    async function loadPhotos() {
        try {
            const data = await Storage.get(STORAGE_KEYS.PHOTOS);
            photos = data || [];
            isLoaded = true;
            
            // Trier par date décroissante
            photos.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Émettre événement de chargement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('photos:loaded', { count: photos.length });
            }
            
            return photos;
            
        } catch (error) {
            console.error('❌ Erreur chargement photos :', error);
            photos = [];
            return [];
        }
    }

    /**
     * Sauvegarder les photos
     */
    async function savePhotos() {
        try {
            await Storage.set(STORAGE_KEYS.PHOTOS, photos);
            
            // Émettre événement de sauvegarde
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('photos:saved', { count: photos.length });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde photos :', error);
            return false;
        }
    }

    /**
     * Ajouter une nouvelle photo
     */
    async function addPhoto(photoData) {
        try {
            // Valider les données
            const validatedData = validatePhotoData(photoData);
            if (!validatedData) {
                throw new Error('Données de photo invalides');
            }

            // Créer la photo
            const newPhoto = {
                id: Utils.generateId(),
                ...validatedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Ajouter à la liste
            photos.unshift(newPhoto);
            
            // Sauvegarder
            await savePhotos();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('photos:added', { photo: newPhoto });
            }
            
            return newPhoto;
            
        } catch (error) {
            console.error('❌ Erreur ajout photo :', error);
            throw error;
        }
    }

    /**
     * Prendre une photo avec la caméra
     */
    async function capturePhoto(options = {}) {
        try {
            // Vérifier si l'API Camera est disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('API Caméra non disponible');
            }

            // Créer un élément video temporaire
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Demander l'accès à la caméra
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: options.width || 1280 },
                    height: { ideal: options.height || 720 },
                    facingMode: options.facingMode || 'user'
                }
            });

            video.srcObject = stream;
            video.play();

            // Attendre que la vidéo soit prête
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Configurer le canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Capturer l'image
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Arrêter la caméra
            stream.getTracks().forEach(track => track.stop());

            // Convertir en blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', options.quality || 0.8);
            });

            // Convertir en data URL
            const dataUrl = await blobToDataUrl(blob);

            return {
                dataUrl,
                width: canvas.width,
                height: canvas.height,
                size: blob.size
            };
            
        } catch (error) {
            console.error('❌ Erreur capture photo :', error);
            throw error;
        }
    }

    /**
     * Ajouter une photo depuis un fichier
     */
    async function addPhotoFromFile(file, photoData = {}) {
        try {
            // Valider le fichier
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Fichier image requis');
            }

            // Vérifier la taille (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('Image trop volumineuse (max 5MB)');
            }

            // Redimensionner si nécessaire
            const processedImage = await processImage(file, {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.8
            });

            // Créer les données de la photo
            const data = {
                ...photoData,
                image: processedImage.dataUrl,
                originalSize: file.size,
                processedSize: processedImage.size,
                width: processedImage.width,
                height: processedImage.height,
                fileName: file.name,
                fileType: file.type
            };

            return await addPhoto(data);
            
        } catch (error) {
            console.error('❌ Erreur ajout photo depuis fichier :', error);
            throw error;
        }
    }

    /**
     * Mettre à jour une photo
     */
    async function updatePhoto(id, updatedData) {
        try {
            const index = photos.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Photo non trouvée');
            }

            // Valider les nouvelles données
            const validatedData = validatePhotoData(updatedData, true);
            if (!validatedData) {
                throw new Error('Données de photo invalides');
            }

            // Mettre à jour la photo
            const originalPhoto = photos[index];
            photos[index] = {
                ...originalPhoto,
                ...validatedData,
                updated_at: new Date().toISOString()
            };

            // Sauvegarder
            await savePhotos();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('photos:updated', { 
                    photo: photos[index],
                    original: originalPhoto 
                });
            }
            
            return photos[index];
            
        } catch (error) {
            console.error('❌ Erreur modification photo :', error);
            throw error;
        }
    }

    /**
     * Supprimer une photo
     */
    async function removePhoto(id) {
        try {
            const index = photos.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Photo non trouvée');
            }

            // Supprimer la photo
            const removedPhoto = photos.splice(index, 1)[0];
            
            // Sauvegarder
            await savePhotos();
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('photos:removed', { photo: removedPhoto });
            }
            
            return removedPhoto;
            
        } catch (error) {
            console.error('❌ Erreur suppression photo :', error);
            throw error;
        }
    }

    /**
     * Obtenir toutes les photos
     */
    function getAll() {
        if (!isLoaded) {
            console.warn('⚠️ Photos non chargées, retour d\'un tableau vide');
            return [];
        }
        return [...photos];
    }

    /**
     * Obtenir une photo par ID
     */
    function getById(id) {
        return photos.find(photo => photo.id === id) || null;
    }

    /**
     * Obtenir les photos par type
     */
    function getByType(type) {
        return photos.filter(photo => photo.type === type);
    }

    /**
     * Obtenir les photos par période
     */
    function getByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return photos.filter(photo => {
            const photoDate = new Date(photo.date);
            return photoDate >= start && photoDate <= end;
        });
    }

    /**
     * Obtenir les photos récentes
     */
    function getRecent(limit = 10) {
        return photos.slice(0, limit);
    }

    /**
     * Rechercher des photos
     */
    function search(query) {
        if (!query || query.trim() === '') {
            return getAll();
        }

        const lowerQuery = query.toLowerCase().trim();
        
        return photos.filter(photo => {
            return (
                photo.title.toLowerCase().includes(lowerQuery) ||
                (photo.description && photo.description.toLowerCase().includes(lowerQuery)) ||
                photo.type.toLowerCase().includes(lowerQuery) ||
                (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            );
        });
    }

    /**
     * Filtrer les photos
     */
    function filter(criteria = {}) {
        let filtered = [...photos];

        // Filtre par type
        if (criteria.type && criteria.type !== 'all') {
            filtered = filtered.filter(p => p.type === criteria.type);
        }

        // Filtre par période
        if (criteria.startDate) {
            const start = new Date(criteria.startDate);
            filtered = filtered.filter(p => new Date(p.date) >= start);
        }
        if (criteria.endDate) {
            const end = new Date(criteria.endDate);
            filtered = filtered.filter(p => new Date(p.date) <= end);
        }

        // Filtre par tag
        if (criteria.tag) {
            filtered = filtered.filter(p => 
                p.tags && p.tags.includes(criteria.tag)
            );
        }

        // Recherche textuelle
        if (criteria.search) {
            const query = criteria.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        // Tri
        if (criteria.sortBy) {
            switch (criteria.sortBy) {
                case 'date-desc':
                    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'date-asc':
                    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case 'title':
                    filtered.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'type':
                    filtered.sort((a, b) => a.type.localeCompare(b.type));
                    break;
                default:
                    // Tri par défaut : date décroissante
                    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        }

        return filtered;
    }

    /**
     * Créer une comparaison de photos
     */
    function createComparison(photoIds) {
        try {
            if (!Array.isArray(photoIds) || photoIds.length < 2) {
                throw new Error('Au moins 2 photos requises pour la comparaison');
            }

            const comparisonPhotos = photoIds.map(id => getById(id)).filter(p => p);
            
            if (comparisonPhotos.length !== photoIds.length) {
                throw new Error('Une ou plusieurs photos non trouvées');
            }

            // Trier par date
            comparisonPhotos.sort((a, b) => new Date(a.date) - new Date(b.date));

            const comparison = {
                id: Utils.generateId(),
                photos: comparisonPhotos,
                firstPhoto: comparisonPhotos[0],
                lastPhoto: comparisonPhotos[comparisonPhotos.length - 1],
                timespan: calculateTimespan(comparisonPhotos[0].date, comparisonPhotos[comparisonPhotos.length - 1].date),
                created_at: new Date().toISOString()
            };

            return comparison;
            
        } catch (error) {
            console.error('❌ Erreur création comparaison :', error);
            throw error;
        }
    }

    /**
     * Obtenir les progressions automatiques
     */
    function getProgressions() {
        // Grouper par type
        const byType = {};
        photos.forEach(photo => {
            if (!byType[photo.type]) {
                byType[photo.type] = [];
            }
            byType[photo.type].push(photo);
        });

        const progressions = [];

        // Créer des progressions pour chaque type
        Object.keys(byType).forEach(type => {
            const typePhotos = byType[type].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (typePhotos.length >= 2) {
                progressions.push({
                    type,
                    photos: typePhotos,
                    count: typePhotos.length,
                    firstDate: typePhotos[0].date,
                    lastDate: typePhotos[typePhotos.length - 1].date,
                    timespan: calculateTimespan(typePhotos[0].date, typePhotos[typePhotos.length - 1].date)
                });
            }
        });

        return progressions.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    }

    /**
     * Calculer la durée entre deux dates
     */
    function calculateTimespan(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Même jour';
        } else if (diffDays < 7) {
            return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} mois`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);
            if (remainingMonths > 0) {
                return `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois`;
            } else {
                return `${years} an${years > 1 ? 's' : ''}`;
            }
        }
    }

    /**
     * Traiter une image (redimensionner, compresser)
     */
    async function processImage(file, options = {}) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const image = new Image();

            image.onload = function() {
                // Calculer les nouvelles dimensions
                let { width, height } = calculateDimensions(
                    image.width, 
                    image.height, 
                    options.maxWidth || 1920, 
                    options.maxHeight || 1080
                );

                // Configurer le canvas
                canvas.width = width;
                canvas.height = height;

                // Dessiner l'image redimensionnée
                context.drawImage(image, 0, 0, width, height);

                // Convertir en blob
                canvas.toBlob(
                    (blob) => {
                        blobToDataUrl(blob).then(dataUrl => {
                            resolve({
                                dataUrl,
                                width,
                                height,
                                size: blob.size
                            });
                        });
                    },
                    'image/jpeg',
                    options.quality || 0.8
                );
            };

            image.onerror = reject;
            image.src = URL.createObjectURL(file);
        });
    }

    /**
     * Calculer les dimensions avec ratio
     */
    function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        // Redimensionner si nécessaire
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
     * Convertir un blob en data URL
     */
    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Valider les données d'une photo
     */
    function validatePhotoData(data, isUpdate = false) {
        try {
            const validated = {};

            // Titre (obligatoire)
            if (!isUpdate || data.title !== undefined) {
                validated.title = Utils.validateString(data.title, 1, 100);
                if (!validated.title) {
                    throw new Error('Titre invalide (1-100 caractères requis)');
                }
            }

            // Image (obligatoire pour nouvelle photo)
            if (!isUpdate || data.image !== undefined) {
                if (!isUpdate && (!data.image || !data.image.startsWith('data:image/'))) {
                    throw new Error('Image requise');
                }
                if (data.image) {
                    validated.image = data.image;
                }
            }

            // Date
            if (data.date !== undefined) {
                validated.date = data.date || new Date().toISOString();
            } else if (!isUpdate) {
                validated.date = new Date().toISOString();
            }

            // Type
            if (data.type !== undefined) {
                const validTypes = ['front', 'side', 'back', 'pose', 'measurement', 'other'];
                validated.type = validTypes.includes(data.type) ? data.type : 'other';
            } else if (!isUpdate) {
                validated.type = 'other';
            }

            // Description
            if (data.description !== undefined) {
                validated.description = Utils.validateString(data.description, 0, 500) || '';
            }

            // Tags
            if (data.tags !== undefined) {
                validated.tags = Array.isArray(data.tags) ? 
                    data.tags.filter(tag => typeof tag === 'string' && tag.trim()) : [];
            }

            // Poids
            if (data.weight !== undefined) {
                validated.weight = Utils.validateNumber(data.weight, 30, 300);
            }

            // Mesures corporelles
            if (data.measurements !== undefined && typeof data.measurements === 'object') {
                validated.measurements = {};
                const validMeasurements = ['chest', 'waist', 'hips', 'biceps', 'thighs'];
                validMeasurements.forEach(measure => {
                    if (data.measurements[measure] !== undefined) {
                        validated.measurements[measure] = Utils.validateNumber(data.measurements[measure], 20, 200);
                    }
                });
            }

            // Métadonnées techniques
            if (data.width !== undefined) validated.width = data.width;
            if (data.height !== undefined) validated.height = data.height;
            if (data.originalSize !== undefined) validated.originalSize = data.originalSize;
            if (data.processedSize !== undefined) validated.processedSize = data.processedSize;
            if (data.fileName !== undefined) validated.fileName = data.fileName;
            if (data.fileType !== undefined) validated.fileType = data.fileType;

            return validated;
            
        } catch (error) {
            console.error('❌ Erreur validation photo :', error);
            return null;
        }
    }

    /**
     * Obtenir les statistiques des photos
     */
    function getStats() {
        const stats = {
            total: photos.length,
            byType: {},
            totalSize: 0,
            averageSize: 0,
            oldestDate: null,
            newestDate: null,
            hasProgressions: false
        };

        if (photos.length === 0) {
            return stats;
        }

        let totalSize = 0;
        const dates = [];

        photos.forEach(photo => {
            // Par type
            const type = photo.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Taille
            if (photo.processedSize) {
                totalSize += photo.processedSize;
            }

            // Dates
            if (photo.date) {
                dates.push(new Date(photo.date));
            }
        });

        // Taille totale et moyenne
        stats.totalSize = totalSize;
        stats.averageSize = Math.round(totalSize / photos.length);

        // Dates extrêmes
        if (dates.length > 0) {
            dates.sort((a, b) => a - b);
            stats.oldestDate = dates[0].toISOString();
            stats.newestDate = dates[dates.length - 1].toISOString();
        }

        // Progressions possibles
        stats.hasProgressions = Object.values(stats.byType).some(count => count >= 2);

        return stats;
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.PHOTOS) {
            console.log('🔄 Mise à jour des photos détectée');
            loadPhotos();
        }
    }

    // Interface publique
    return {
        init,
        loadPhotos,
        addPhoto,
        capturePhoto,
        addPhotoFromFile,
        updatePhoto,
        removePhoto,
        getAll,
        getById,
        getByType,
        getByDateRange,
        getRecent,
        search,
        filter,
        createComparison,
        getProgressions,
        getStats
    };
})();

// Export global
window.PhotosModel = PhotosModel;