# Correctifs pour les bugs SmartTrack

## Analyse des problèmes identifiés

### 1. 🔔 Notifications de badges et niveaux qui réapparaissent + Niveau non conservé

**Problème :** Les notifications de badges et de niveaux réapparaissent à chaque ouverture de l'application, et le niveau n'est pas conservé correctement.

**Cause :** Le système ne sauvegarde pas l'état des notifications déjà affichées et il y a un problème dans le calcul/sauvegarde du niveau.

**Solution :**
- Ajouter un système de suivi des notifications déjà affichées
- Corriger la logique de sauvegarde du niveau
- Ajouter une vérification pour éviter les notifications en double

### 2. 📱 Problème d'onglets qui apparaissent à droite + Menu déroulant ne se ferme pas

**Problème :** Les onglets apparaissent brièvement à droite avant de se centrer, et les menus déroulants ne se ferment pas automatiquement.

**Cause :** Problème de CSS avec les transitions et manque de fermeture automatique des menus.

**Solution :**
- Corriger les transitions CSS des onglets
- Ajouter la fermeture automatique des menus contextuels

### 3. 🔄 Chevauchement des onglets dans statistiques/analytics

**Problème :** Les onglets se chevauchent dans la section statistiques et analytics.

**Cause :** CSS mal configuré pour les onglets, manque de responsive design.

**Solution :**
- Corriger le CSS des onglets analytics
- Améliorer la responsivité

### 4. 📸 Photos qui ne vont pas dans la galerie

**Problème :** Les photos ajoutées restent bloquées dans le sélecteur et ne vont pas dans la galerie.

**Cause :** Problème dans la gestion des fichiers photos et leur intégration dans la galerie.

**Solution :**
- Corriger la logique de traitement des photos
- Améliorer la gestion des fichiers

### 5. ⬆️ Icône de remontée qui cache les onglets

**Problème :** Quand on scrolle vers le bas, l'icône de remontée cache les onglets de navigation.

**Cause :** Z-index mal configuré ou problème de positionnement.

**Solution :**
- Ajuster le positionnement et z-index
- Créer un bouton scroll-to-top bien positionné

### 6. 🏗️ Créateur de programme : Interface mal conçue

**Problème :** 
- Boîtes de sélection mal centrées
- Jours manquants (seulement Lundi, Mardi, Mercredi)
- Navigation pas optimale
- Design UX à revoir

**Cause :** Interface mal conçue avec des problèmes de layout et de données.

**Solution :**
- Refaire complètement l'interface du créateur de programme
- Ajouter tous les jours de la semaine
- Améliorer l'UX avec des dialogues fixes

### 7. 📊 Page vide dans "Mes statistiques"

**Problème :** La page "Mes statistiques" est vide.

**Cause :** Problème dans le rendu des statistiques ou données manquantes.

**Solution :**
- Corriger la logique de rendu des statistiques
- Ajouter une gestion des cas vides

---

## Correctifs détaillés

### Correctif 1 : Système de notifications amélioré

```javascript
// Ajout d'un système de suivi des notifications
const notificationSystem = {
    shownNotifications: new Set(),
    
    // Marquer une notification comme affichée
    markAsShown(type, id) {
        const key = `${type}_${id}`;
        this.shownNotifications.add(key);
        localStorage.setItem('smarttrack_shown_notifications', JSON.stringify([...this.shownNotifications]));
    },
    
    // Vérifier si une notification a déjà été affichée
    hasBeenShown(type, id) {
        const key = `${type}_${id}`;
        return this.shownNotifications.has(key);
    },
    
    // Charger les notifications déjà affichées
    loadShownNotifications() {
        const saved = localStorage.getItem('smarttrack_shown_notifications');
        if (saved) {
            this.shownNotifications = new Set(JSON.parse(saved));
        }
    }
};

// Modifier la fonction de notification de level up
actions.showLevelUpNotification = function(newLevel, reason) {
    const notificationId = `level_${newLevel}_${Date.now()}`;
    
    // Vérifier si cette notification de niveau a déjà été affichée
    if (notificationSystem.hasBeenShown('level', newLevel)) {
        return;
    }
    
    // Marquer comme affichée
    notificationSystem.markAsShown('level', newLevel);
    
    // Afficher la notification (code existant)
    const title = getTitleForLevel(newLevel);
    // ... reste du code
};

// Modifier la fonction de notification de badge
actions.showBadgeUnlockNotification = function(badges) {
    badges.forEach((badge, index) => {
        // Vérifier si ce badge a déjà été notifié
        if (notificationSystem.hasBeenShown('badge', badge.id)) {
            return;
        }
        
        // Marquer comme affiché
        notificationSystem.markAsShown('badge', badge.id);
        
        setTimeout(() => {
            // Afficher la notification (code existant)
            // ... reste du code
        }, index * 1000);
    });
};
```

### Correctif 2 : Amélioration des onglets et menus

```css
/* Correction des transitions d'onglets */
.tab-content {
    display: none;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
}

.tab-content.active {
    display: block;
    opacity: 1;
    transform: translateX(0);
}

/* Amélioration des onglets analytics */
.analytics-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 2px;
}

.analytics-tabs .tab-btn {
    flex: 1;
    min-width: 120px;
    padding: 12px 16px;
    font-size: 14px;
    white-space: nowrap;
    border-radius: 8px;
    background: var(--background);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
}

.analytics-tabs .tab-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.analytics-tabs .tab-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
}

/* Responsive pour les onglets */
@media (max-width: 768px) {
    .analytics-tabs {
        flex-wrap: wrap;
    }
    
    .analytics-tabs .tab-btn {
        min-width: 100px;
        font-size: 12px;
        padding: 8px 12px;
    }
}
```

```javascript
// Correction de la fermeture automatique des menus
actions.switchAnalyticsTab = function(tab) {
    // Fermer tous les menus contextuels
    this.closeContextualMenus();
    
    // Masquer tous les onglets
    document.querySelectorAll('.analytics-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    document.querySelector(`.analytics-tabs .tab-btn[onclick*="${tab}"]`).classList.add('active');
    
    // Masquer tout le contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Afficher le contenu correspondant
    document.getElementById(`tab-analytics-${tab}`).classList.add('active');
    
    // Charger le contenu spécifique
    this.loadAnalyticsContent(tab);
};
```

### Correctif 3 : Bouton scroll-to-top bien positionné

```css
/* Bouton scroll-to-top */
.scroll-to-top {
    position: fixed;
    bottom: 80px; /* Au-dessus de la barre de navigation */
    right: 20px;
    width: 50px;
    height: 50px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000; /* Inférieur aux modales mais supérieur au contenu */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.scroll-to-top.visible {
    opacity: 1;
    visibility: visible;
}

.scroll-to-top:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

/* S'assurer que la navigation reste visible */
.nav-bar {
    z-index: 1001;
}
```

```javascript
// Gestion du bouton scroll-to-top
function initScrollToTop() {
    // Créer le bouton
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.title = 'Remonter en haut';
    scrollBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.body.appendChild(scrollBtn);
    
    // Gérer la visibilité
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', initScrollToTop);
```

### Correctif 4 : Amélioration de la gestion des photos

```javascript
// Correction de la gestion des photos
actions.handlePhotoUpload = function(files) {
    const validFiles = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            this.showNotification(`❌ ${file.name} n'est pas une image valide`, 'error');
            continue;
        }
        
        if (file.size > maxSize) {
            this.showNotification(`❌ ${file.name} est trop volumineux (max 5MB)`, 'error');
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    // Traiter chaque fichier
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Ajouter à la galerie
            this.addPhotoToGallery(imageData, file.name);
            
            // Sauvegarder dans les données
            this.savePhotoData(imageData, file.name);
        };
        reader.readAsDataURL(file);
    });
    
    this.showNotification(`📸 ${validFiles.length} photo(s) ajoutée(s) à la galerie`, 'success');
};

// Nouvelle fonction pour ajouter à la galerie
actions.addPhotoToGallery = function(imageData, fileName) {
    const gallery = document.getElementById('photos-gallery');
    if (!gallery) return;
    
    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo-item';
    photoDiv.innerHTML = `
        <img src="${imageData}" alt="${fileName}" class="photo-thumbnail">
        <div class="photo-actions">
            <button class="btn btn-small btn-danger" onclick="actions.deletePhoto('${fileName}')">
                🗑️
            </button>
        </div>
    `;
    
    gallery.appendChild(photoDiv);
};

// Fonction pour sauvegarder les données photo
actions.savePhotoData = function(imageData, fileName) {
    if (!appState.photos) {
        appState.photos = [];
    }
    
    appState.photos.push({
        id: Date.now(),
        name: fileName,
        data: imageData,
        date: new Date().toISOString(),
        size: imageData.length
    });
    
    this.saveData();
};
```

### Correctif 5 : Refonte complète du créateur de programme

```html
<!-- Nouveau créateur de programme amélioré -->
<div id="screen-program-creator" class="screen">
    <div class="header">
        <button class="btn btn-small btn-secondary" onclick="actions.showScreen('programmes')">← Retour</button>
        <h1>🏗️ Créateur de Programmes</h1>
        <button class="btn btn-small btn-primary" onclick="actions.saveCustomProgram()" id="save-program-btn">💾 Sauvegarder</button>
    </div>

    <!-- Informations du programme -->
    <div class="card">
        <h3>📋 Informations du programme</h3>
        <div class="program-info-grid">
            <div class="input-group">
                <label>Nom du programme *</label>
                <input type="text" id="program-name" class="input" placeholder="Mon programme personnalisé" maxlength="50">
            </div>
            <div class="input-group">
                <label>Description</label>
                <textarea id="program-description" class="input" placeholder="Description du programme" rows="3"></textarea>
            </div>
        </div>
        
        <div class="program-params-grid">
            <div class="input-group">
                <label>Durée (semaines) *</label>
                <input type="number" id="program-duration" class="input" min="1" max="52" value="4">
            </div>
            <div class="input-group">
                <label>Séances par semaine *</label>
                <input type="number" id="program-frequency" class="input" min="1" max="7" value="3">
            </div>
            <div class="input-group">
                <label>Niveau</label>
                <select id="program-level" class="select">
                    <option value="beginner">🔰 Débutant</option>
                    <option value="intermediate">⚔️ Intermédiaire</option>
                    <option value="advanced">🏺 Avancé</option>
                    <option value="expert">👑 Expert</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Sélection des jours -->
    <div class="card">
        <h3>📅 Jours d'entraînement</h3>
        <div class="days-selector">
            <div class="day-item" data-day="monday">
                <input type="checkbox" id="day-monday" class="checkbox">
                <label for="day-monday">Lundi</label>
            </div>
            <div class="day-item" data-day="tuesday">
                <input type="checkbox" id="day-tuesday" class="checkbox">
                <label for="day-tuesday">Mardi</label>
            </div>
            <div class="day-item" data-day="wednesday">
                <input type="checkbox" id="day-wednesday" class="checkbox">
                <label for="day-wednesday">Mercredi</label>
            </div>
            <div class="day-item" data-day="thursday">
                <input type="checkbox" id="day-thursday" class="checkbox">
                <label for="day-thursday">Jeudi</label>
            </div>
            <div class="day-item" data-day="friday">
                <input type="checkbox" id="day-friday" class="checkbox">
                <label for="day-friday">Vendredi</label>
            </div>
            <div class="day-item" data-day="saturday">
                <input type="checkbox" id="day-saturday" class="checkbox">
                <label for="day-saturday">Samedi</label>
            </div>
            <div class="day-item" data-day="sunday">
                <input type="checkbox" id="day-sunday" class="checkbox">
                <label for="day-sunday">Dimanche</label>
            </div>
        </div>
    </div>

    <!-- Sélection des exercices -->
    <div class="card">
        <h3>💪 Exercices du programme</h3>
        <div class="exercise-selection">
            <button class="btn btn-primary" onclick="actions.openExerciseDialog()">
                ➕ Ajouter un exercice
            </button>
            <div id="selected-exercises" class="selected-exercises-list">
                <!-- Exercices sélectionnés -->
            </div>
        </div>
    </div>

    <!-- Paramètres avancés -->
    <div class="card">
        <h3>⚙️ Paramètres</h3>
        <div class="advanced-params">
            <div class="input-group">
                <label>Progression automatique</label>
                <div class="checkbox-group">
                    <input type="checkbox" id="auto-progression" class="checkbox" checked>
                    <label for="auto-progression">Augmenter automatiquement la charge</label>
                </div>
            </div>
            <div class="input-group">
                <label>Repos entre séries (secondes)</label>
                <input type="number" id="rest-sets" class="input" value="90" min="30" max="300">
            </div>
            <div class="input-group">
                <label>Repos entre exercices (secondes)</label>
                <input type="number" id="rest-exercises" class="input" value="120" min="60" max="600">
            </div>
        </div>
    </div>

    <!-- Aperçu -->
    <div class="card">
        <h3>👁️ Aperçu du programme</h3>
        <div id="program-preview" class="program-preview">
            <p>Configurez votre programme pour voir l'aperçu</p>
        </div>
    </div>
</div>
```

```css
/* Styles améliorés pour le créateur de programme */
.program-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.program-params-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.days-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin: 16px 0;
}

.day-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--background);
    border-radius: 8px;
    border: 1px solid var(--border);
    transition: all 0.3s ease;
}

.day-item:hover {
    background: var(--primary-light);
    border-color: var(--primary);
}

.day-item input[type="checkbox"]:checked + label {
    color: var(--primary);
    font-weight: bold;
}

.selected-exercises-list {
    margin-top: 16px;
    display: grid;
    gap: 8px;
}

.selected-exercise-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--background);
    border-radius: 8px;
    border: 1px solid var(--border);
}

.advanced-params {
    display: grid;
    gap: 16px;
}

@media (max-width: 768px) {
    .program-info-grid {
        grid-template-columns: 1fr;
    }
    
    .days-selector {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

### Correctif 6 : Correction des statistiques vides

```javascript
// Correction de l'affichage des statistiques
actions.loadMyStats = function() {
    const statsContainer = document.getElementById('my-stats-content');
    
    if (!statsContainer) {
        console.error('Container des statistiques non trouvé');
        return;
    }
    
    // Vérifier s'il y a des données
    if (!appState.sessions || appState.sessions.length === 0) {
        statsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>Aucune donnée disponible</h3>
                <p>Commencez par faire quelques séances d'entraînement pour voir vos statistiques.</p>
                <button class="btn btn-primary" onclick="actions.showScreen('preparation')">
                    🚀 Commencer une séance
                </button>
            </div>
        `;
        return;
    }
    
    // Calculer les statistiques
    const stats = this.calculateUserStats();
    
    // Afficher les statistiques
    statsContainer.innerHTML = `
        <div class="stats-summary">
            <div class="stat-card">
                <div class="stat-value">${stats.totalSessions}</div>
                <div class="stat-label">Séances totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.currentStreak}</div>
                <div class="stat-label">Série actuelle</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalVolume}kg</div>
                <div class="stat-label">Volume total</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avgSessionTime}min</div>
                <div class="stat-label">Temps moyen</div>
            </div>
        </div>
        
        <div class="stats-charts">
            <div class="card">
                <h3>📈 Progression mensuelle</h3>
                <canvas id="monthly-progress-chart"></canvas>
            </div>
            
            <div class="card">
                <h3>💪 Répartition par groupe musculaire</h3>
                <canvas id="muscle-distribution-chart"></canvas>
            </div>
        </div>
    `;
    
    // Initialiser les graphiques
    this.initializeStatsCharts();
};

// Calculer les statistiques utilisateur
actions.calculateUserStats = function() {
    const sessions = appState.sessions || [];
    
    return {
        totalSessions: sessions.length,
        currentStreak: this.getCurrentStreak(),
        totalVolume: this.calculateTotalVolume(),
        avgSessionTime: this.calculateAvgSessionTime(),
        favoriteExercises: this.getFavoriteExercises(),
        progressionTrend: this.getProgressionTrend()
    };
};
```

---

## Instructions d'application

1. **Ordre d'application :** Appliquez les correctifs dans l'ordre suivant :
   - Correctif 1 (notifications)
   - Correctif 2 (onglets)
   - Correctif 3 (scroll-to-top)
   - Correctif 4 (photos)
   - Correctif 5 (créateur de programme)
   - Correctif 6 (statistiques)

2. **Tests recommandés :**
   - Testez chaque correctif individuellement
   - Vérifiez la compatibilité mobile
   - Testez avec et sans données existantes

3. **Sauvegarde :** Créez une sauvegarde avant d'appliquer les correctifs.

4. **Déploiement :** Testez d'abord en local, puis déployez en production.

---

## Améliorations UX supplémentaires

### Animations fluides
```css
/* Animations globales améliorées */
* {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px var(--shadow-elevated);
}
```

### Indicateurs de chargement
```javascript
// Système d'indicateurs de chargement
const loadingSystem = {
    show(message = 'Chargement...') {
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(loader);
    },
    
    hide() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.remove();
        }
    }
};
```

Ces correctifs devraient résoudre tous les problèmes que vous avez mentionnés et améliorer significativement l'expérience utilisateur de votre application SmartTrack.