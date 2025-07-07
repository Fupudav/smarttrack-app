/**
 * SmartTrack - Gestionnaire de modales
 * Système de modales modernes et accessibles
 */

const ModalManager = (function() {
    let modals = [];
    let overlay = null;
    let isInitialized = false;
    let currentModal = null;
    let focusStack = [];

    /**
     * Initialiser le gestionnaire de modales
     */
    function init() {
        try {
            console.log('🔲 Initialisation des modales...');
            
            createOverlay();
            setupEventListeners();
            
            isInitialized = true;
            console.log('✓ Modales initialisées');
            
        } catch (error) {
            console.error('❌ Erreur initialisation modales :', error);
        }
    }

    /**
     * Créer l'overlay de fond
     */
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: var(--z-modal);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-lg);
            box-sizing: border-box;
            opacity: 0;
            visibility: hidden;
            transition: all var(--transition-smooth);
            backdrop-filter: blur(4px);
        `;
        
        document.body.appendChild(overlay);
    }

    /**
     * Configurer les listeners d'événements
     */
    function setupEventListeners() {
        // Clic sur l'overlay pour fermer
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && currentModal && currentModal.dismissible !== false) {
                close();
            }
        });

        // Touches clavier
        document.addEventListener('keydown', handleKeydown);
        
        // Événements du système
        if (typeof EventBus !== 'undefined') {
            EventBus.on('modal:show', (data) => {
                show(data.content, data.options);
            });
            
            EventBus.on('modal:close', close);
            EventBus.on('modal:closeAll', closeAll);
        }
    }

    /**
     * Gérer les touches clavier
     */
    function handleKeydown(e) {
        if (!currentModal) return;
        
        switch (e.key) {
            case 'Escape':
                if (currentModal.dismissible !== false) {
                    close();
                }
                break;
                
            case 'Tab':
                handleTabNavigation(e);
                break;
        }
    }

    /**
     * Gérer la navigation au clavier
     */
    function handleTabNavigation(e) {
        if (!currentModal) return;
        
        const modal = currentModal.element;
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Afficher une modale
     */
    function show(content, options = {}) {
        if (!isInitialized) {
            init();
        }

        // Fermer la modale actuelle si elle existe
        if (currentModal) {
            close();
        }

        const modal = createModal(content, options);
        
        // Sauvegarder le focus actuel
        const activeElement = document.activeElement;
        if (activeElement) {
            focusStack.push(activeElement);
        }
        
        modals.push(modal);
        currentModal = modal;
        overlay.appendChild(modal.element);
        
        // Bloquer le scroll du body
        document.body.style.overflow = 'hidden';
        
        // Afficher l'overlay
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            modal.element.classList.add('show');
            
            // Focus sur le premier élément focusable
            const firstFocusable = modal.element.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            }
        });
        
        // Émettre événement
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('modal:shown', {
                id: modal.id,
                options
            });
        }
        
        return modal.id;
    }

    /**
     * Créer une modale
     */
    function createModal(content, options) {
        const id = Utils.generateId();
        const element = document.createElement('div');
        
        element.className = 'modal';
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        element.setAttribute('data-modal-id', id);
        
        if (options.title) {
            element.setAttribute('aria-labelledby', `modal-title-${id}`);
        }
        
        // Style CSS
        element.style.cssText = `
            background: var(--surface);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            max-width: ${options.width || '600px'};
            max-height: ${options.height || '80vh'};
            width: 100%;
            position: relative;
            overflow: hidden;
            transform: scale(0.9) translateY(50px);
            opacity: 0;
            transition: all var(--transition-smooth);
        `;
        
        // Contenu
        const modalContent = createModalContent(content, options, id);
        element.appendChild(modalContent);
        
        return {
            id,
            element,
            options,
            dismissible: options.dismissible,
            timestamp: Date.now()
        };
    }

    /**
     * Créer le contenu de la modale
     */
    function createModalContent(content, options, id) {
        const container = document.createElement('div');
        container.className = 'modal-content';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        `;
        
        // En-tête si titre ou bouton de fermeture
        if (options.title || options.closable !== false) {
            const header = createModalHeader(options, id);
            container.appendChild(header);
        }
        
        // Corps
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: var(--space-lg);
            ${options.title || options.closable !== false ? 'padding-top: 0;' : ''}
        `;
        
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        } else if (typeof content === 'function') {
            const result = content();
            if (typeof result === 'string') {
                body.innerHTML = result;
            } else if (result instanceof HTMLElement) {
                body.appendChild(result);
            }
        }
        
        container.appendChild(body);
        
        // Pied si actions
        if (options.actions && options.actions.length > 0) {
            const footer = createModalFooter(options.actions);
            container.appendChild(footer);
        }
        
        return container;
    }

    /**
     * Créer l'en-tête de la modale
     */
    function createModalHeader(options, id) {
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--space-lg);
            border-bottom: 2px solid var(--border);
            background: var(--surface-light);
        `;
        
        // Titre
        if (options.title) {
            const title = document.createElement('h2');
            title.id = `modal-title-${id}`;
            title.className = 'modal-title';
            title.textContent = options.title;
            title.style.cssText = `
                margin: 0;
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                color: var(--text-primary);
            `;
            header.appendChild(title);
        }
        
        // Bouton de fermeture
        if (options.closable !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Fermer la modale');
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: var(--font-size-xxl);
                color: var(--text-secondary);
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-md);
                transition: var(--transition-smooth);
                margin-left: var(--space-md);
            `;
            
            closeBtn.addEventListener('click', close);
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.backgroundColor = 'var(--surface-dark)';
            });
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.backgroundColor = 'transparent';
            });
            
            header.appendChild(closeBtn);
        }
        
        return header;
    }

    /**
     * Créer le pied de la modale
     */
    function createModalFooter(actions) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.style.cssText = `
            display: flex;
            gap: var(--space-md);
            justify-content: flex-end;
            padding: var(--space-lg);
            border-top: 2px solid var(--border);
            background: var(--surface-light);
        `;
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `btn btn-${action.type || 'secondary'}`;
            button.textContent = action.text;
            
            if (action.onClick) {
                button.addEventListener('click', () => {
                    const result = action.onClick();
                    if (result !== false && action.dismiss !== false) {
                        close();
                    }
                });
            }
            
            footer.appendChild(button);
        });
        
        return footer;
    }

    /**
     * Fermer la modale actuelle
     */
    function close() {
        if (!currentModal) return;
        
        const modal = currentModal;
        
        // Animation de sortie
        modal.element.classList.remove('show');
        modal.element.style.transform = 'scale(0.9) translateY(50px)';
        modal.element.style.opacity = '0';
        
        // Masquer l'overlay
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        
        // Supprimer après l'animation
        setTimeout(() => {
            if (modal.element.parentNode) {
                modal.element.parentNode.removeChild(modal.element);
            }
            
            // Supprimer de la liste
            const index = modals.findIndex(m => m.id === modal.id);
            if (index > -1) {
                modals.splice(index, 1);
            }
            
            // Restaurer le focus
            if (focusStack.length > 0) {
                const previousFocus = focusStack.pop();
                if (previousFocus && document.body.contains(previousFocus)) {
                    previousFocus.focus();
                }
            }
            
            // Restaurer le scroll
            document.body.style.overflow = '';
            
            currentModal = null;
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('modal:closed', { id: modal.id });
            }
        }, 300);
    }

    /**
     * Fermer toutes les modales
     */
    function closeAll() {
        while (currentModal) {
            close();
        }
    }

    /**
     * Modale de confirmation
     */
    function confirm(message, title = 'Confirmation', options = {}) {
        return new Promise((resolve) => {
            const actions = [
                {
                    text: options.cancelText || 'Annuler',
                    type: 'secondary',
                    onClick: () => resolve(false)
                },
                {
                    text: options.confirmText || 'Confirmer',
                    type: options.confirmType || 'primary',
                    onClick: () => resolve(true)
                }
            ];
            
            show(message, {
                title,
                actions,
                width: '400px',
                dismissible: false,
                ...options
            });
        });
    }

    /**
     * Modale d'alerte
     */
    function alert(message, title = 'Information', options = {}) {
        return new Promise((resolve) => {
            const actions = [
                {
                    text: options.buttonText || 'OK',
                    type: 'primary',
                    onClick: () => resolve(true)
                }
            ];
            
            show(message, {
                title,
                actions,
                width: '400px',
                ...options
            });
        });
    }

    /**
     * Modale de saisie
     */
    function prompt(message, title = 'Saisie', defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = defaultValue;
            input.className = 'form-input';
            input.style.cssText = `
                width: 100%;
                margin-top: var(--space-md);
            `;
            
            const content = document.createElement('div');
            content.innerHTML = message;
            content.appendChild(input);
            
            const actions = [
                {
                    text: options.cancelText || 'Annuler',
                    type: 'secondary',
                    onClick: () => resolve(null)
                },
                {
                    text: options.confirmText || 'Confirmer',
                    type: 'primary',
                    onClick: () => {
                        const value = input.value.trim();
                        resolve(value || null);
                    }
                }
            ];
            
            show(content, {
                title,
                actions,
                width: '400px',
                dismissible: false,
                ...options
            });
            
            // Focus sur l'input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    }

    /**
     * Modale de chargement
     */
    function loading(message = 'Chargement...', options = {}) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            width: 48px;
            height: 48px;
            border: 4px solid var(--border);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto var(--space-md);
        `;
        
        // Ajouter l'animation CSS si elle n'existe pas
        if (!document.getElementById('modal-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        const content = document.createElement('div');
        content.style.textAlign = 'center';
        content.appendChild(spinner);
        
        const text = document.createElement('div');
        text.textContent = message;
        text.style.cssText = `
            font-size: var(--font-size-base);
            color: var(--text-secondary);
        `;
        content.appendChild(text);
        
        return show(content, {
            width: '300px',
            closable: false,
            dismissible: false,
            ...options
        });
    }

    /**
     * Obtenir la modale actuelle
     */
    function getCurrent() {
        return currentModal;
    }

    /**
     * Vérifier si une modale est ouverte
     */
    function isOpen() {
        return currentModal !== null;
    }

    /**
     * Obtenir toutes les modales
     */
    function getAll() {
        return modals.map(m => ({
            id: m.id,
            options: m.options,
            timestamp: m.timestamp
        }));
    }

    /**
     * Obtenir les statistiques
     */
    function getStats() {
        return {
            currentModal: currentModal ? currentModal.id : null,
            totalModals: modals.length,
            focusStackSize: focusStack.length,
            isInitialized
        };
    }

    // Styles CSS pour mobile
    const mobileStyles = `
        @media (max-width: 768px) {
            .modal-overlay {
                padding: var(--space-md) !important;
            }
            
            .modal {
                max-width: 100% !important;
                width: 100% !important;
                max-height: 90vh !important;
                margin: 0 !important;
            }
            
            .modal-header {
                padding: var(--space-md) !important;
            }
            
            .modal-body {
                padding: var(--space-md) !important;
            }
            
            .modal-footer {
                padding: var(--space-md) !important;
                flex-direction: column;
                gap: var(--space-sm) !important;
            }
            
            .modal-footer .btn {
                width: 100%;
            }
        }
    `;
    
    // Ajouter les styles mobile
    if (!document.getElementById('modal-mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-mobile-styles';
        style.textContent = mobileStyles;
        document.head.appendChild(style);
    }

    // Interface publique
    return {
        init,
        show,
        close,
        closeAll,
        confirm,
        alert,
        prompt,
        loading,
        getCurrent,
        isOpen,
        getAll,
        getStats
    };
})();

// Export global
window.ModalManager = ModalManager;