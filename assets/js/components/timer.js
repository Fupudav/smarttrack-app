/**
 * SmartTrack - Module Timer
 * Gère les chronomètres et comptes à rebours
 */

const TimerComponent = (function() {
    let timers = {};
    let isInitialized = false;

    /**
     * Initialiser le module timer
     */
    function init() {
        console.log('⏱️ Initialisation du TimerComponent...');
        isInitialized = true;
        console.log('✓ TimerComponent initialisé');
    }

    /**
     * Créer un nouveau timer
     */
    function create(id, options = {}) {
        if (timers[id]) {
            console.warn(`⚠️ Timer ${id} existe déjà`);
            return timers[id];
        }

        const timer = {
            id,
            startTime: null,
            elapsed: 0,
            interval: null,
            isPaused: false,
            isRunning: false,
            onUpdate: options.onUpdate || null,
            onComplete: options.onComplete || null,
            duration: options.duration || null,
            countDown: options.countDown || false
        };

        timers[id] = timer;
        return timer;
    }

    /**
     * Démarrer un timer
     */
    function start(id) {
        const timer = timers[id];
        if (!timer) {
            console.error(`❌ Timer ${id} non trouvé`);
            return;
        }

        if (timer.isRunning) {
            console.warn(`⚠️ Timer ${id} déjà en cours`);
            return;
        }

        timer.startTime = Date.now() - timer.elapsed;
        timer.isRunning = true;
        timer.isPaused = false;

        timer.interval = setInterval(() => {
            updateTimer(id);
        }, 100);

        console.log(`▶️ Timer ${id} démarré`);
    }

    /**
     * Mettre à jour un timer
     */
    function updateTimer(id) {
        const timer = timers[id];
        if (!timer || !timer.isRunning) return;

        timer.elapsed = Date.now() - timer.startTime;

        if (timer.countDown && timer.duration) {
            const remaining = timer.duration - timer.elapsed;
            
            if (remaining <= 0) {
                stop(id);
                if (timer.onComplete) {
                    timer.onComplete();
                }
                return;
            }

            if (timer.onUpdate) {
                timer.onUpdate(remaining);
            }
        } else {
            if (timer.onUpdate) {
                timer.onUpdate(timer.elapsed);
            }
        }
    }

    /**
     * Arrêter un timer
     */
    function stop(id) {
        const timer = timers[id];
        if (!timer) return;

        if (timer.interval) {
            clearInterval(timer.interval);
            timer.interval = null;
        }

        timer.isRunning = false;
        timer.isPaused = false;
        console.log(`⏹️ Timer ${id} arrêté`);
    }

    /**
     * Mettre en pause un timer
     */
    function pause(id) {
        const timer = timers[id];
        if (!timer || !timer.isRunning) return;

        if (timer.interval) {
            clearInterval(timer.interval);
            timer.interval = null;
        }

        timer.isRunning = false;
        timer.isPaused = true;
        console.log(`⏸️ Timer ${id} mis en pause`);
    }

    /**
     * Reprendre un timer
     */
    function resume(id) {
        const timer = timers[id];
        if (!timer || !timer.isPaused) return;

        start(id);
        console.log(`▶️ Timer ${id} repris`);
    }

    /**
     * Réinitialiser un timer
     */
    function reset(id) {
        const timer = timers[id];
        if (!timer) return;

        stop(id);
        timer.elapsed = 0;
        timer.startTime = null;
        console.log(`🔄 Timer ${id} réinitialisé`);
    }

    /**
     * Obtenir le temps écoulé
     */
    function getElapsed(id) {
        const timer = timers[id];
        return timer ? timer.elapsed : 0;
    }

    /**
     * Détruire un timer
     */
    function destroy(id) {
        stop(id);
        delete timers[id];
        console.log(`🗑️ Timer ${id} détruit`);
    }

    /**
     * Détruire tous les timers
     */
    function destroyAll() {
        Object.keys(timers).forEach(id => destroy(id));
        console.log('🗑️ Tous les timers détruits');
    }

    /**
     * Obtenir les statistiques
     */
    function getStats() {
        return {
            totalTimers: Object.keys(timers).length,
            activeTimers: Object.values(timers).filter(t => t.isRunning).length,
            pausedTimers: Object.values(timers).filter(t => t.isPaused).length,
            isInitialized
        };
    }

    // Interface publique
    return {
        init,
        create,
        start,
        stop,
        pause,
        resume,
        reset,
        getElapsed,
        destroy,
        destroyAll,
        getStats
    };
})();

// Export global
window.TimerComponent = TimerComponent;