/**
 * SmartTrack - Système d'événements global
 * Permet la communication décuplée entre modules
 */

const EventBus = (function() {
    // Stockage des listeners
    let listeners = {};
    let onceListeners = {};
    let isDebugging = false;
    let eventHistory = [];
    const maxHistorySize = 100;

    /**
     * S'abonner à un événement
     */
    function on(eventName, callback, context = null) {
        if (typeof callback !== 'function') {
            console.error('❌ EventBus.on: callback doit être une fonction');
            return;
        }

        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }

        const listener = {
            callback,
            context,
            id: generateListenerId()
        };

        listeners[eventName].push(listener);

        if (isDebugging) {
            console.log(`📢 EventBus: Listener ajouté pour '${eventName}'`);
        }

        // Retourner une fonction pour se désabonner
        return function unsubscribe() {
            off(eventName, listener.id);
        };
    }

    /**
     * S'abonner à un événement une seule fois
     */
    function once(eventName, callback, context = null) {
        if (typeof callback !== 'function') {
            console.error('❌ EventBus.once: callback doit être une fonction');
            return;
        }

        if (!onceListeners[eventName]) {
            onceListeners[eventName] = [];
        }

        const listener = {
            callback,
            context,
            id: generateListenerId()
        };

        onceListeners[eventName].push(listener);

        if (isDebugging) {
            console.log(`📢 EventBus: Listener 'once' ajouté pour '${eventName}'`);
        }

        // Retourner une fonction pour se désabonner
        return function unsubscribe() {
            offOnce(eventName, listener.id);
        };
    }

    /**
     * Se désabonner d'un événement
     */
    function off(eventName, listenerId = null) {
        if (!eventName) {
            // Supprimer tous les listeners
            listeners = {};
            onceListeners = {};
            console.log('📢 EventBus: Tous les listeners supprimés');
            return;
        }

        if (!listenerId) {
            // Supprimer tous les listeners de cet événement
            delete listeners[eventName];
            delete onceListeners[eventName];
            if (isDebugging) {
                console.log(`📢 EventBus: Tous les listeners de '${eventName}' supprimés`);
            }
            return;
        }

        // Supprimer un listener spécifique
        if (listeners[eventName]) {
            listeners[eventName] = listeners[eventName].filter(
                listener => listener.id !== listenerId
            );
            
            if (listeners[eventName].length === 0) {
                delete listeners[eventName];
            }
        }

        if (isDebugging) {
            console.log(`📢 EventBus: Listener ${listenerId} supprimé de '${eventName}'`);
        }
    }

    /**
     * Se désabonner d'un événement 'once'
     */
    function offOnce(eventName, listenerId) {
        if (onceListeners[eventName]) {
            onceListeners[eventName] = onceListeners[eventName].filter(
                listener => listener.id !== listenerId
            );
            
            if (onceListeners[eventName].length === 0) {
                delete onceListeners[eventName];
            }
        }
    }

    /**
     * Émettre un événement
     */
    function emit(eventName, data = null) {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            id: generateEventId()
        };

        // Ajouter à l'historique
        addToHistory(event);

        if (isDebugging) {
            console.log(`📡 EventBus: Émission '${eventName}'`, data);
        }

        let totalListeners = 0;
        let errors = [];

        // Exécuter les listeners permanents
        if (listeners[eventName]) {
            totalListeners += listeners[eventName].length;
            
            for (const listener of listeners[eventName]) {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data, event);
                    } else {
                        listener.callback(data, event);
                    }
                } catch (error) {
                    console.error(`❌ EventBus: Erreur dans listener '${eventName}':`, error);
                    errors.push({ listener: listener.id, error });
                }
            }
        }

        // Exécuter les listeners 'once' et les supprimer
        if (onceListeners[eventName]) {
            totalListeners += onceListeners[eventName].length;
            
            const onceList = [...onceListeners[eventName]];
            delete onceListeners[eventName];
            
            for (const listener of onceList) {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data, event);
                    } else {
                        listener.callback(data, event);
                    }
                } catch (error) {
                    console.error(`❌ EventBus: Erreur dans listener 'once' '${eventName}':`, error);
                    errors.push({ listener: listener.id, error });
                }
            }
        }

        if (isDebugging && totalListeners > 0) {
            console.log(`📢 EventBus: '${eventName}' traité par ${totalListeners} listeners`);
        }

        // Émettre un événement d'erreur si nécessaire
        if (errors.length > 0) {
            setTimeout(() => {
                emit('eventbus:error', {
                    originalEvent: eventName,
                    errors: errors
                });
            }, 0);
        }

        return {
            listenersCount: totalListeners,
            errors: errors
        };
    }

    /**
     * Émettre un événement de manière asynchrone
     */
    function emitAsync(eventName, data = null) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = emit(eventName, data);
                resolve(result);
            }, 0);
        });
    }

    /**
     * Générer un ID unique pour les listeners
     */
    function generateListenerId() {
        return 'listener_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Générer un ID unique pour les événements
     */
    function generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Ajouter un événement à l'historique
     */
    function addToHistory(event) {
        eventHistory.push(event);
        
        // Limiter la taille de l'historique
        if (eventHistory.length > maxHistorySize) {
            eventHistory.shift();
        }
    }

    /**
     * Activer/désactiver le mode debug
     */
    function setDebug(enabled) {
        isDebugging = enabled;
        console.log(`📢 EventBus: Mode debug ${enabled ? 'activé' : 'désactivé'}`);
    }

    /**
     * Obtenir la liste des événements disponibles
     */
    function getEventNames() {
        const allEvents = new Set([
            ...Object.keys(listeners),
            ...Object.keys(onceListeners)
        ]);
        return Array.from(allEvents);
    }

    /**
     * Obtenir le nombre de listeners pour un événement
     */
    function getListenerCount(eventName) {
        let count = 0;
        
        if (listeners[eventName]) {
            count += listeners[eventName].length;
        }
        
        if (onceListeners[eventName]) {
            count += onceListeners[eventName].length;
        }
        
        return count;
    }

    /**
     * Obtenir les statistiques du système d'événements
     */
    function getStats() {
        const stats = {
            totalEvents: getEventNames().length,
            totalListeners: 0,
            totalOnceListeners: 0,
            historySize: eventHistory.length,
            isDebugging: isDebugging,
            events: {}
        };

        // Compter les listeners
        for (const [eventName, eventListeners] of Object.entries(listeners)) {
            stats.totalListeners += eventListeners.length;
            stats.events[eventName] = {
                listeners: eventListeners.length,
                onceListeners: 0
            };
        }

        for (const [eventName, eventListeners] of Object.entries(onceListeners)) {
            stats.totalOnceListeners += eventListeners.length;
            
            if (!stats.events[eventName]) {
                stats.events[eventName] = { listeners: 0, onceListeners: 0 };
            }
            
            stats.events[eventName].onceListeners = eventListeners.length;
        }

        return stats;
    }

    /**
     * Obtenir l'historique des événements
     */
    function getHistory(limit = null) {
        if (limit) {
            return eventHistory.slice(-limit);
        }
        return [...eventHistory];
    }

    /**
     * Vider l'historique des événements
     */
    function clearHistory() {
        eventHistory = [];
        console.log('📢 EventBus: Historique vidé');
    }

    /**
     * Attendre qu'un événement soit émis
     */
    function waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            
            const unsubscribe = once(eventName, (data, event) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve({ data, event });
            });

            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Timeout en attente de l'événement '${eventName}'`));
                }, timeout);
            }
        });
    }

    /**
     * Créer un namespace pour les événements
     */
    function createNamespace(prefix) {
        return {
            on: (eventName, callback, context) => 
                on(`${prefix}:${eventName}`, callback, context),
            
            once: (eventName, callback, context) => 
                once(`${prefix}:${eventName}`, callback, context),
            
            off: (eventName, listenerId) => 
                off(eventName ? `${prefix}:${eventName}` : null, listenerId),
            
            emit: (eventName, data) => 
                emit(`${prefix}:${eventName}`, data),
            
            emitAsync: (eventName, data) => 
                emitAsync(`${prefix}:${eventName}`, data)
        };
    }

    /**
     * Filtrer les événements par pattern
     */
    function filterEvents(pattern) {
        const regex = new RegExp(pattern);
        return eventHistory.filter(event => regex.test(event.name));
    }

    /**
     * Middleware pour intercepter les événements
     */
    let middlewares = [];

    function use(middleware) {
        if (typeof middleware !== 'function') {
            console.error('❌ EventBus.use: middleware doit être une fonction');
            return;
        }
        
        middlewares.push(middleware);
        
        if (isDebugging) {
            console.log('📢 EventBus: Middleware ajouté');
        }
    }

    /**
     * Appliquer les middlewares
     */
    function applyMiddlewares(event) {
        let modifiedEvent = { ...event };
        
        for (const middleware of middlewares) {
            try {
                const result = middleware(modifiedEvent);
                if (result !== undefined) {
                    modifiedEvent = result;
                }
            } catch (error) {
                console.error('❌ EventBus: Erreur dans middleware:', error);
            }
        }
        
        return modifiedEvent;
    }

    // Interface publique
    return {
        on,
        once,
        off,
        emit,
        emitAsync,
        setDebug,
        getEventNames,
        getListenerCount,
        getStats,
        getHistory,
        clearHistory,
        waitFor,
        createNamespace,
        filterEvents,
        use
    };
})();

// Export global
window.EventBus = EventBus;