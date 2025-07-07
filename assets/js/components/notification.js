/**
 * SmartTrack - Gestionnaire de notifications
 * Système de notifications toast moderne et accessible
 */

const NotificationManager = (function() {
    let notifications = [];
    let container = null;
    let isInitialized = false;
    let defaultDuration = DEFAULTS.NOTIFICATION_DURATION;
    let maxNotifications = 5;

    /**
     * Initialiser le gestionnaire de notifications
     */
    function init() {
        try {
            console.log('🔔 Initialisation des notifications...');
            
            createContainer();
            setupEventListeners();
            
            isInitialized = true;
            console.log('✓ Notifications initialisées');
            
        } catch (error) {
            console.error('❌ Erreur initialisation notifications :', error);
        }
    }

    /**
     * Créer le conteneur des notifications
     */
    function createContainer() {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-label', 'Notifications');
        
        container.style.cssText = `
            position: fixed;
            top: var(--space-lg);
            right: var(--space-lg);
            z-index: var(--z-toast);
            pointer-events: none;
            max-width: 400px;
            width: 100%;
        `;
        
        document.body.appendChild(container);
    }

    /**
     * Configurer les listeners d'événements
     */
    function setupEventListeners() {
        // Écouter les événements du système
        if (typeof EventBus !== 'undefined') {
            EventBus.on('notification:show', (data) => {
                show(data.message, data.type, data.duration, data.options);
            });
            
            EventBus.on('notification:clear', clear);
            EventBus.on('notification:clearAll', clearAll);
        }
    }

    /**
     * Afficher une notification
     */
    function show(message, type = NOTIFICATION_TYPES.INFO, duration = defaultDuration, options = {}) {
        if (!isInitialized) {
            init();
        }

        if (!message) {
            console.warn('⚠️ Tentative d\'affichage d\'une notification sans message');
            return null;
        }

        const notification = createNotification(message, type, duration, options);
        
        // Limiter le nombre de notifications
        if (notifications.length >= maxNotifications) {
            removeOldest();
        }
        
        notifications.push(notification);
        container.appendChild(notification.element);
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Auto-suppression
        if (duration > 0) {
            notification.timer = setTimeout(() => {
                remove(notification.id);
            }, duration);
        }
        
        // Émettre événement
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('notification:shown', {
                id: notification.id,
                message,
                type,
                duration
            });
        }
        
        return notification.id;
    }

    /**
     * Créer une notification
     */
    function createNotification(message, type, duration, options) {
        const id = Utils.generateId();
        const element = document.createElement('div');
        
        element.className = `notification notification-${type}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('data-notification-id', id);
        
        // Style CSS
        element.style.cssText = `
            background: var(--surface);
            border: 2px solid var(--${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'});
            border-radius: var(--radius-lg);
            padding: var(--space-lg);
            margin-bottom: var(--space-sm);
            box-shadow: var(--shadow-lg);
            pointer-events: auto;
            transform: translateX(100%);
            opacity: 0;
            transition: all var(--transition-smooth);
            max-width: 100%;
            word-wrap: break-word;
            position: relative;
            overflow: hidden;
        `;
        
        // Couleur de fond selon le type
        const bgColors = {
            [NOTIFICATION_TYPES.SUCCESS]: 'var(--success-light)',
            [NOTIFICATION_TYPES.ERROR]: 'var(--danger-light)',
            [NOTIFICATION_TYPES.WARNING]: 'var(--warning-light)',
            [NOTIFICATION_TYPES.INFO]: 'var(--info-light)'
        };
        
        if (bgColors[type]) {
            element.style.background = bgColors[type];
        }
        
        // Contenu
        const content = createNotificationContent(message, type, options);
        element.appendChild(content);
        
        // Bouton de fermeture si demandé
        if (options.closable !== false) {
            const closeBtn = createCloseButton(() => remove(id));
            element.appendChild(closeBtn);
        }
        
        // Barre de progression si durée définie
        if (duration > 0 && options.showProgress !== false) {
            const progressBar = createProgressBar(duration);
            element.appendChild(progressBar);
        }
        
        return {
            id,
            element,
            type,
            message,
            duration,
            timer: null,
            timestamp: Date.now()
        };
    }

    /**
     * Créer le contenu de la notification
     */
    function createNotificationContent(message, type, options) {
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: var(--space-md);
            margin-right: ${options.closable !== false ? '32px' : '0'};
        `;
        
        // Icône
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.style.cssText = `
            font-size: var(--font-size-xl);
            flex-shrink: 0;
            margin-top: 2px;
        `;
        
        const icons = {
            [NOTIFICATION_TYPES.SUCCESS]: '✅',
            [NOTIFICATION_TYPES.ERROR]: '❌',
            [NOTIFICATION_TYPES.WARNING]: '⚠️',
            [NOTIFICATION_TYPES.INFO]: 'ℹ️'
        };
        
        icon.textContent = options.icon || icons[type] || 'ℹ️';
        
        // Message
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.style.cssText = `
            flex: 1;
            font-size: var(--font-size-base);
            line-height: var(--line-height-normal);
            color: var(--text-primary);
        `;
        
        if (options.html) {
            messageEl.innerHTML = message;
        } else {
            messageEl.textContent = message;
        }
        
        content.appendChild(icon);
        content.appendChild(messageEl);
        
        // Action si fournie
        if (options.action) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'notification-action';
            actionBtn.textContent = options.action.text;
            actionBtn.style.cssText = `
                background: var(--primary);
                color: white;
                border: none;
                padding: var(--space-sm) var(--space-md);
                border-radius: var(--radius-md);
                font-size: var(--font-size-sm);
                cursor: pointer;
                margin-top: var(--space-sm);
                transition: var(--transition-smooth);
            `;
            
            actionBtn.addEventListener('click', () => {
                if (typeof options.action.callback === 'function') {
                    options.action.callback();
                }
                if (options.action.dismiss !== false) {
                    remove(content.closest('.notification').getAttribute('data-notification-id'));
                }
            });
            
            messageEl.appendChild(actionBtn);
        }
        
        return content;
    }

    /**
     * Créer le bouton de fermeture
     */
    function createCloseButton(onClick) {
        const button = document.createElement('button');
        button.className = 'notification-close';
        button.innerHTML = '×';
        button.setAttribute('aria-label', 'Fermer la notification');
        button.style.cssText = `
            position: absolute;
            top: var(--space-sm);
            right: var(--space-sm);
            background: none;
            border: none;
            font-size: var(--font-size-xl);
            color: var(--text-secondary);
            cursor: pointer;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-md);
            transition: var(--transition-smooth);
        `;
        
        button.addEventListener('click', onClick);
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
        
        return button;
    }

    /**
     * Créer la barre de progression
     */
    function createProgressBar(duration) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'notification-progress-container';
        progressContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(0, 0, 0, 0.1);
            overflow: hidden;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress';
        progressBar.style.cssText = `
            height: 100%;
            background: var(--primary);
            width: 100%;
            transform: translateX(-100%);
            animation: notificationProgress ${duration}ms linear forwards;
        `;
        
        // Ajouter l'animation CSS si elle n'existe pas
        if (!document.getElementById('notification-progress-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-progress-styles';
            style.textContent = `
                @keyframes notificationProgress {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        progressContainer.appendChild(progressBar);
        return progressContainer;
    }

    /**
     * Supprimer une notification
     */
    function remove(id) {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return;
        
        // Annuler le timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Animation de sortie
        notification.element.classList.add('hide');
        notification.element.style.transform = 'translateX(100%)';
        notification.element.style.opacity = '0';
        
        // Supprimer après l'animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Supprimer de la liste
            const index = notifications.findIndex(n => n.id === id);
            if (index > -1) {
                notifications.splice(index, 1);
            }
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('notification:removed', { id });
            }
        }, 300);
    }

    /**
     * Supprimer la plus ancienne notification
     */
    function removeOldest() {
        if (notifications.length > 0) {
            remove(notifications[0].id);
        }
    }

    /**
     * Vider toutes les notifications
     */
    function clearAll() {
        notifications.forEach(notification => {
            remove(notification.id);
        });
    }

    /**
     * Vider les notifications d'un type spécifique
     */
    function clear(type = null) {
        if (type) {
            notifications
                .filter(n => n.type === type)
                .forEach(notification => remove(notification.id));
        } else {
            clearAll();
        }
    }

    /**
     * Méthodes raccourcies pour chaque type
     */
    function success(message, duration, options) {
        return show(message, NOTIFICATION_TYPES.SUCCESS, duration, options);
    }

    function error(message, duration, options) {
        return show(message, NOTIFICATION_TYPES.ERROR, duration, options);
    }

    function warning(message, duration, options) {
        return show(message, NOTIFICATION_TYPES.WARNING, duration, options);
    }

    function info(message, duration, options) {
        return show(message, NOTIFICATION_TYPES.INFO, duration, options);
    }

    /**
     * Configurer les paramètres par défaut
     */
    function configure(options = {}) {
        if (options.defaultDuration !== undefined) {
            defaultDuration = options.defaultDuration;
        }
        
        if (options.maxNotifications !== undefined) {
            maxNotifications = options.maxNotifications;
        }
        
        console.log('🔔 Configuration notifications mise à jour');
    }

    /**
     * Obtenir les statistiques
     */
    function getStats() {
        return {
            activeNotifications: notifications.length,
            maxNotifications,
            defaultDuration,
            isInitialized
        };
    }

    /**
     * Obtenir toutes les notifications actives
     */
    function getActive() {
        return notifications.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            duration: n.duration,
            timestamp: n.timestamp
        }));
    }

    // Styles CSS pour mobile
    const mobileStyles = `
        @media (max-width: 768px) {
            .notifications-container {
                top: var(--space-sm) !important;
                right: var(--space-sm) !important;
                left: var(--space-sm) !important;
                max-width: none !important;
            }
            
            .notification {
                margin-bottom: var(--space-xs) !important;
                padding: var(--space-md) !important;
            }
            
            .notification-content {
                font-size: var(--font-size-sm) !important;
            }
        }
    `;
    
    // Ajouter les styles mobile
    if (!document.getElementById('notification-mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-mobile-styles';
        style.textContent = mobileStyles;
        document.head.appendChild(style);
    }

    // Interface publique
    return {
        init,
        show,
        remove,
        clear,
        clearAll,
        success,
        error,
        warning,
        info,
        configure,
        getStats,
        getActive
    };
})();

// Export global
window.NotificationManager = NotificationManager;