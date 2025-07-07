/**
 * SmartTrack - Module des utilitaires
 * Fonctions helper utilisées dans toute l'application
 */

const Utils = (function() {

    /**
     * Valider un nombre dans une plage
     */
    function validateNumber(value, min = 0, max = Infinity) {
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return Math.max(min, Math.min(max, num));
    }

    /**
     * Valider une chaîne de caractères
     */
    function validateString(value, minLength = 0, maxLength = Infinity) {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        if (trimmed.length < minLength || trimmed.length > maxLength) return null;
        return trimmed;
    }

    /**
     * Formater une durée en secondes vers un format lisible
     */
    function formatDuration(seconds) {
        if (!seconds || seconds < 0) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Parser une durée formatée vers des secondes
     */
    function parseDuration(timeString) {
        if (!timeString || typeof timeString !== 'string') return 0;
        
        const parts = timeString.split(':').map(p => parseInt(p, 10));
        
        if (parts.length === 2) {
            // MM:SS
            return (parts[0] * 60) + parts[1];
        } else if (parts.length === 3) {
            // HH:MM:SS
            return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        }
        
        return 0;
    }

    /**
     * Formater une date
     */
    function formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            },
            medium: { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            }
        };
        
        return d.toLocaleDateString('fr-FR', options[format] || options.short);
    }

    /**
     * Formater un nombre avec séparateurs
     */
    function formatNumber(number, decimals = 0) {
        if (number === null || number === undefined || isNaN(number)) return '0';
        
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    /**
     * Calculer le pourcentage
     */
    function calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    /**
     * Générer un ID unique
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Debounce une fonction
     */
    function debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Throttle une fonction
     */
    function throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone d'un objet
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => deepClone(item));
        if (typeof obj === 'object') {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = deepClone(obj[key]);
            });
            return copy;
        }
    }

    /**
     * Comparer deux objets
     */
    function isEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return false;
        if (typeof obj1 !== typeof obj2) return false;
        
        if (typeof obj1 === 'object') {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            
            if (keys1.length !== keys2.length) return false;
            
            for (const key of keys1) {
                if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) {
                    return false;
                }
            }
            
            return true;
        }
        
        return obj1 === obj2;
    }

    /**
     * Mélanger un tableau
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Grouper un tableau par une propriété
     */
    function groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    /**
     * Trier un tableau par plusieurs critères
     */
    function sortBy(array, ...criteria) {
        return array.sort((a, b) => {
            for (const criterion of criteria) {
                let aVal, bVal, desc = false;
                
                if (typeof criterion === 'string') {
                    aVal = a[criterion];
                    bVal = b[criterion];
                } else if (typeof criterion === 'function') {
                    aVal = criterion(a);
                    bVal = criterion(b);
                } else if (criterion.key) {
                    aVal = a[criterion.key];
                    bVal = b[criterion.key];
                    desc = criterion.desc || false;
                }
                
                if (aVal < bVal) return desc ? 1 : -1;
                if (aVal > bVal) return desc ? -1 : 1;
            }
            return 0;
        });
    }

    /**
     * Calculer la moyenne d'un tableau
     */
    function average(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, num) => acc + (Number(num) || 0), 0);
        return sum / numbers.length;
    }

    /**
     * Calculer la médiane d'un tableau
     */
    function median(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }

    /**
     * Capitaliser la première lettre
     */
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Slugifier une chaîne
     */
    function slugify(str) {
        if (!str) return '';
        
        return str
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    /**
     * Échapper du HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Trouquer un texte
     */
    function truncate(str, length = 50, ending = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length - ending.length) + ending;
    }

    /**
     * Vérifier si on est sur mobile
     */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Vérifier si on est sur tablet
     */
    function isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    /**
     * Vérifier si on est sur desktop
     */
    function isDesktop() {
        return window.innerWidth > 1024;
    }

    /**
     * Obtenir les paramètres de l'URL
     */
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Créer une URL avec paramètres
     */
    function buildUrl(base, params = {}) {
        const url = new URL(base, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            }
        });
        return url.toString();
    }

    /**
     * Télécharger un fichier
     */
    function downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Lire un fichier
     */
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Redimensionner une image
     */
    function resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculer les nouvelles dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Convertir un fichier en base64
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Vibrer si supporté
     */
    function vibrate(pattern = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Copier du texte dans le presse-papier
     */
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            console.error('Erreur copie presse-papier:', error);
            return false;
        }
    }

    /**
     * Obtenir la couleur d'un muscle group
     */
    function getMuscleGroupColor(muscleGroup) {
        const colors = {
            'echauffement': '#FF9500',
            'biceps': '#007AFF',
            'triceps': '#34C759',
            'epaules': '#FF3B30',
            'dos': '#5856D6',
            'pectoraux': '#AF52DE',
            'jambes': '#FF2D92',
            'autres': '#8E8E93'
        };
        return colors[muscleGroup] || colors['autres'];
    }

    /**
     * Obtenir l'icône d'un type d'exercice
     */
    function getExerciseTypeIcon(type) {
        const icons = {
            'strength': '💪',
            'cardio': '❤️',
            'elastics': '🔗',
            'bodyweight': '🤸',
            'stretching': '🧘'
        };
        return icons[type] || '🏋️';
    }

    /**
     * Calculer le niveau XP
     */
    function calculateLevel(totalXp) {
        return Math.floor(totalXp / GAMIFICATION_CONFIG.XP_PER_LEVEL) + 1;
    }

    /**
     * Calculer l'XP restant pour le niveau suivant
     */
    function getXpForNextLevel(totalXp) {
        const currentLevel = calculateLevel(totalXp);
        const xpForCurrentLevel = (currentLevel - 1) * GAMIFICATION_CONFIG.XP_PER_LEVEL;
        const xpInCurrentLevel = totalXp - xpForCurrentLevel;
        return GAMIFICATION_CONFIG.XP_PER_LEVEL - xpInCurrentLevel;
    }

    /**
     * Animation de spring
     */
    function spring(element, targetScale = 1.05, duration = 300) {
        if (!element) return;
        
        const originalTransform = element.style.transform;
        
        element.style.transform = `scale(${targetScale})`;
        element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
        
        setTimeout(() => {
            element.style.transform = originalTransform;
            setTimeout(() => {
                element.style.transition = '';
            }, duration);
        }, duration / 2);
    }

    /**
     * Créer un élément DOM avec attributs
     */
    function createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    // Interface publique
    return {
        validateNumber,
        validateString,
        formatDuration,
        parseDuration,
        formatDate,
        formatNumber,
        calculatePercentage,
        generateId,
        debounce,
        throttle,
        deepClone,
        isEqual,
        shuffleArray,
        groupBy,
        sortBy,
        average,
        median,
        capitalize,
        slugify,
        escapeHtml,
        truncate,
        isMobile,
        isTablet,
        isDesktop,
        getUrlParams,
        buildUrl,
        downloadFile,
        readFile,
        resizeImage,
        fileToBase64,
        vibrate,
        copyToClipboard,
        getMuscleGroupColor,
        getExerciseTypeIcon,
        calculateLevel,
        getXpForNextLevel,
        spring,
        createElement
    };
})();

// Export global
window.Utils = Utils;