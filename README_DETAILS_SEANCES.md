# 📋 Fonctionnalité : Détails des Séances

## 🎯 Objectif

Permettre aux utilisateurs de développer les séances dans l'interface de suivi du programme pour voir les détails complets de chaque séance d'entraînement.

## ✨ Fonctionnalités ajoutées

### 1. **Bouton "Détails" sur chaque séance**
- Bouton discret "📋 Détails" à côté de la durée
- Permet d'ouvrir/fermer les détails sans lancer la séance
- Texte du bouton change en "📋 Masquer" quand ouvert

### 2. **Section de détails complète**
Affiche toutes les informations importantes :

#### 📊 **Métadonnées de la séance**
- Durée en minutes
- Type de séance (Force, Corps entier, Mixte)
- Niveau de difficulté (étoiles ★★★☆☆)
- Nombre d'exercices

#### 💭 **Philosophie de la séance**
- Citation inspirante ou objectif de la séance
- Style visuel distinctif avec gradient

#### 🔥 **Phase d'éveil (échauffement)**
- Durée recommandée
- Liste complète des exercices d'échauffement
- Instructions détaillées

#### ⚔️ **Exercices principaux**
Pour chaque exercice :
- **Nom** et **groupe musculaire ciblé**
- **Résistance recommandée** (badge coloré)
- **Nombre de séries**
- **Répétitions** (souvent "jusqu'à l'échec")
- **Temps de repos** entre séries
- **Conseils techniques** (icône 💡)

## 🎨 Design et UX

### **Styles CSS personnalisés**
- Animations fluides (fadeInUp)
- Palette de couleurs cohérente avec l'app
- Cards pour chaque exercice
- Design responsive mobile

### **Comportement intelligent**
- Un seul détail ouvert par semaine à la fois
- Fermeture automatique des autres détails
- Empêche le conflit avec le clic pour démarrer la séance
- Utilisation de `event.stopPropagation()` pour éviter les conflicts

### **Responsive design**
- Grid adaptatif pour les métadonnées
- Réorganisation automatique sur mobile
- Texte et espacement optimisés

## 🔧 Implémentation technique

### **CSS ajouté**
```css
.session-details { /* Container principal des détails */ }
.session-meta { /* Grid des métadonnées */ }
.session-philosophy { /* Section philosophie avec gradient */ }
.warmup-section { /* Section échauffement */ }
.exercises-section { /* Section exercices principaux */ }
.exercise-card { /* Card individuelle par exercice */ }
.details-toggle-btn { /* Bouton toggle détails */ }
```

### **JavaScript ajouté**
```javascript
actions.toggleSessionDetails(sessionId, weekNumber)  // Toggle détails
actions.renderSessionDetails(seance)                 // Génère HTML
```

### **Modifications HTML**
- Restructuration des `session-item`
- Ajout du bouton détails
- Container pour les détails avec ID unique

## 🎯 Avantages utilisateur

1. **📖 Préparation mentale** : Voir le contenu avant de commencer
2. **🎯 Planification** : Anticiper le matériel et le temps nécessaire
3. **💡 Apprentissage** : Comprendre la logique de chaque exercice
4. **⚡ Efficacité** : Pas besoin de lancer la séance pour voir le contenu
5. **🧘 Motivation** : Lecture de la philosophie pour se motiver

## 🔄 Utilisation

1. **Accéder** : Aller dans "Voir mes statistiques" → Développer une semaine
2. **Découvrir** : Cliquer sur "📋 Détails" à côté d'une séance
3. **Explorer** : Parcourir tous les détails : philosophie, échauffement, exercices
4. **Fermer** : Cliquer sur "📋 Masquer" ou ouvrir une autre séance
5. **Commencer** : Cliquer sur le nom/jour de la séance pour la lancer

## 🚀 Compatibilité

- ✅ Desktop et mobile
- ✅ Tous les programmes existants
- ✅ Compatible avec l'interface existante
- ✅ Aucun impact sur les fonctionnalités existantes

Cette fonctionnalité améliore significativement l'expérience utilisateur en permettant une exploration détaillée du contenu des séances sans perturber le workflow existant.