/**
 * SmartTrack - Module Confetti
 * Système d'animations de confettis pour célébrer les victoires
 */

const ConfettiManager = (function() {
    let isInitialized = false;
    let container = null;
    let activeAnimations = [];

    // Configurations prédéfinies
    const CONFETTI_STYLES = {
        victory: {
            colors: ['#FFD700', '#FF6B35', '#34C759', '#007AFF', '#AF52DE'],
            count: 150,
            duration: 3000,
            spread: 360,
            gravity: 0.8,
            shapes: ['circle', 'square', 'star']
        },
        levelUp: {
            colors: ['#DAA520', '#B22222', '#8B4513', '#FFD700'],
            count: 100,
            duration: 2500,
            spread: 180,
            gravity: 0.6,
            shapes: ['star', 'diamond', 'circle']
        },
        badge: {
            colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#B9F2FF'],
            count: 80,
            duration: 2000,
            spread: 120,
            gravity: 0.7,
            shapes: ['star', 'circle']
        },
        record: {
            colors: ['#FF3B30', '#FF9500', '#FFD700', '#34C759'],
            count: 120,
            duration: 2500,
            spread: 200,
            gravity: 0.9,
            shapes: ['circle', 'triangle', 'star']
        },
        challenge: {
            colors: ['#5856D6', '#AF52DE', '#007AFF', '#34C759'],
            count: 90,
            duration: 2000,
            spread: 150,
            gravity: 0.6,
            shapes: ['circle', 'square']
        },
        streak: {
            colors: ['#FF6B35', '#FFD700', '#34C759'],
            count: 60,
            duration: 1500,
            spread: 90,
            gravity: 0.5,
            shapes: ['circle', 'star']
        }
    };

    /**
     * Initialiser le gestionnaire de confettis
     */
    function init() {
        try {
            console.log('🎉 Initialisation ConfettiManager...');
            
            createContainer();
            setupEventListeners();
            
            isInitialized = true;
            console.log('✓ ConfettiManager initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation ConfettiManager :', error);
        }
    }

    /**
     * Créer le conteneur de confettis
     */
    function createContainer() {
        container = document.createElement('div');
        container.id = 'confetti-container';
        container.className = 'confetti-container';
        
        // Styles inline pour éviter les dépendances CSS
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        
        document.body.appendChild(container);
    }

    /**
     * Configurer les écouteurs d'événements
     */
    function setupEventListeners() {
        if (typeof EventBus !== 'undefined') {
            // Événements de gamification
            EventBus.on('gamification:level-up', (data) => {
                trigger('levelUp', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
                });
            });

            EventBus.on('gamification:badge-unlocked', (data) => {
                trigger('badge', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
                });
            });

            EventBus.on('gamification:challengeCompleted', (data) => {
                trigger('challenge', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
                });
            });

            // Événements de session
            EventBus.on('sessions:live-completed', (data) => {
                trigger('victory', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 4 }
                });
            });

            EventBus.on('sessions:finished', (data) => {
                trigger('victory', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 4 }
                });
            });

            EventBus.on('sessions:newRecord', (data) => {
                trigger('record', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
                });
            });

            EventBus.on('sessions:streakMilestone', (data) => {
                trigger('streak', {
                    source: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
                });
            });

            console.log('✓ Écouteurs confetti configurés');
        }
    }

    /**
     * Déclencher une animation de confettis
     */
    function trigger(style = 'victory', options = {}) {
        if (!isInitialized || !container) {
            console.warn('⚠️ ConfettiManager non initialisé');
            return;
        }

        const config = { ...CONFETTI_STYLES[style] };
        if (!config) {
            console.warn(`⚠️ Style de confetti inconnu : ${style}`);
            return;
        }

        // Fusionner les options
        const finalConfig = {
            ...config,
            ...options,
            source: options.source || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        };

        // Créer l'animation
        const animation = createAnimation(finalConfig);
        activeAnimations.push(animation);

        // Nettoyer après la durée
        setTimeout(() => {
            cleanupAnimation(animation);
        }, finalConfig.duration + 500);

        console.log(`🎉 Confetti ${style} déclenché`);
    }

    /**
     * Créer une animation de confettis
     */
    function createAnimation(config) {
        const animation = {
            id: Date.now() + Math.random(),
            particles: [],
            startTime: performance.now(),
            config
        };

        // Créer les particules
        for (let i = 0; i < config.count; i++) {
            const particle = createParticle(config, i);
            animation.particles.push(particle);
            container.appendChild(particle.element);
        }

        // Démarrer l'animation
        requestAnimationFrame(() => animateParticles(animation));

        return animation;
    }

    /**
     * Créer une particule de confetti
     */
    function createParticle(config, index) {
        const element = document.createElement('div');
        const color = config.colors[index % config.colors.length];
        const shape = config.shapes[index % config.shapes.length];
        const size = Math.random() * 8 + 4; // 4-12px
        
        // Position initiale
        const angle = (Math.random() - 0.5) * config.spread * (Math.PI / 180);
        const velocity = Math.random() * 15 + 10;
        
        const particle = {
            element,
            x: config.source.x,
            y: config.source.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - Math.random() * 10,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            size,
            life: 1.0,
            decay: 1 / (config.duration / 16.67) // 60fps
        };

        // Styles de base
        element.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            pointer-events: none;
            transform: translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg);
        `;

        // Forme spécifique
        applyShape(element, shape);

        return particle;
    }

    /**
     * Appliquer une forme à la particule
     */
    function applyShape(element, shape) {
        switch (shape) {
            case 'circle':
                element.style.borderRadius = '50%';
                break;
            case 'square':
                // Déjà carré par défaut
                break;
            case 'star':
                element.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                break;
            case 'triangle':
                element.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                break;
            case 'diamond':
                element.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                break;
        }
    }

    /**
     * Animer les particules
     */
    function animateParticles(animation) {
        const now = performance.now();
        const elapsed = now - animation.startTime;
        
        if (elapsed >= animation.config.duration) {
            return; // Animation terminée
        }

        // Mettre à jour chaque particule
        animation.particles.forEach(particle => {
            if (particle.life <= 0) return;

            // Physique
            particle.vy += animation.config.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            particle.life -= particle.decay;

            // Friction
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            // Opacité basée sur la vie
            const opacity = Math.max(0, particle.life);

            // Appliquer les transformations
            particle.element.style.transform = 
                `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg)`;
            particle.element.style.opacity = opacity;

            // Cacher les particules hors écran
            if (particle.y > window.innerHeight + 100 || 
                particle.x < -100 || 
                particle.x > window.innerWidth + 100) {
                particle.life = 0;
                particle.element.style.display = 'none';
            }
        });

        // Continuer l'animation
        requestAnimationFrame(() => animateParticles(animation));
    }

    /**
     * Nettoyer une animation terminée
     */
    function cleanupAnimation(animation) {
        if (!animation) return;

        // Supprimer les éléments DOM
        animation.particles.forEach(particle => {
            if (particle.element && particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });

        // Retirer de la liste des animations actives
        const index = activeAnimations.indexOf(animation);
        if (index > -1) {
            activeAnimations.splice(index, 1);
        }
    }

    /**
     * Nettoyer toutes les animations
     */
    function cleanup() {
        activeAnimations.forEach(animation => {
            cleanupAnimation(animation);
        });
        activeAnimations = [];
    }

    /**
     * Créer un confetti personnalisé
     */
    function custom(config) {
        const customConfig = {
            colors: config.colors || ['#FFD700', '#FF6B35', '#34C759'],
            count: config.count || 100,
            duration: config.duration || 2000,
            spread: config.spread || 180,
            gravity: config.gravity || 0.7,
            shapes: config.shapes || ['circle', 'square'],
            source: config.source || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        };

        trigger('custom', customConfig);
    }

    /**
     * Confetti burst rapide
     */
    function burst(position = null) {
        const source = position || { 
            x: window.innerWidth / 2, 
            y: window.innerHeight / 2 
        };

        trigger('victory', {
            source,
            count: 50,
            duration: 1000,
            spread: 120
        });
    }

    /**
     * Obtenir le statut du gestionnaire
     */
    function getStatus() {
        return {
            initialized: isInitialized,
            activeAnimations: activeAnimations.length,
            availableStyles: Object.keys(CONFETTI_STYLES)
        };
    }

    // Interface publique
    return {
        init,
        trigger,
        custom,
        burst,
        cleanup,
        getStatus
    };
})();

// Export global
window.ConfettiManager = ConfettiManager;