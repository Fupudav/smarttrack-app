# 🏆 Module Programmes de Fitness - SmartTrack

## Vue d'ensemble

Le module de programmes de fitness avec élastiques a été entièrement intégré à SmartTrack. Il permet aux utilisateurs de suivre des programmes d'entraînement structurés avec une progression automatique et un suivi détaillé.

## Fonctionnalités Implémentées

### 🎯 Navigation et Interface

- **Nouvel onglet "Programmes"** dans la navigation principale
- **Architecture à onglets** : Programmes prédéfinis / Mes programmes
- **Sous-onglets** : "Une longue histoire vers la gloire" / Autres programmes
- **Navigation intuitive** avec retour et boutons contextuels

### 📚 Programmes Prédéfinis

#### Structure "Une longue histoire vers la gloire"
- **25 programmes** organisés par difficulté :
  - 🔰 **DÉBUTANT** (5 programmes, 6-8 semaines)
  - ⚔️ **INTERMÉDIAIRE** (5 programmes, 8-12 semaines)  
  - 🏺 **AVANCÉ** (5 programmes, 12-26 semaines)
  - 👑 **LÉGENDE** (5 programmes, 26+ semaines)
  - 🎯 **SPÉCIFIQUE** (5 programmes, durées variables)

#### Programme Disponible : "FORGE DU NOVICE"
- **6 semaines** de progression
- **6 séances par semaine**
- **36 séances totales** détaillées
- **Exercices complets** avec répétitions, séries, temps de repos
- **Progression linéaire** des charges

### 🎮 Gestion des Programmes

#### Présentation de Programme
- **Page détaillée** avec objectifs, équipement, conseils
- **Aperçu du planning** (première semaine)
- **Progression attendue** avec statistiques
- **Bouton "Suivre ce programme"** pour démarrer

#### Sélection de Date
- **Modal de démarrage** avec calendrier
- **Calcul automatique** de la date de fin
- **Aperçu de la durée** et nombre de séances

### 📊 Suivi de Progression

#### Écran Programme Suivi
- **Barre de progression globale** (% séances réalisées)
- **Informations détaillées** : semaine actuelle, jours restants
- **Accordéon par semaine** avec séances détaillées
- **États visuels** : complété ✅, en cours 🟡, à venir ⭕

#### Widget Dashboard
- **Affichage sur l'accueil** si programme actif
- **Progression en temps réel**
- **Accès rapide** : Suivi détaillé / Prochaine séance

### ⚡ Intégration Séances

#### Chargement Automatique
- **Clic sur séance** → chargement automatique dans l'onglet Séance
- **Exercices pré-configurés** avec séries/répétitions du programme
- **Progression des charges** selon l'algorithme choisi

#### Suivi Automatique
- **Marquage automatique** des séances effectuées
- **Mise à jour progression** en temps réel
- **Notification de progression** (25%, 50%, 75%, 100%)

### 🔧 Algorithmes de Progression

#### Types Disponibles
- **Linéaire** : +2.5kg/semaine
- **Par paliers** : +5kg toutes les 2 semaines  
- **Adaptative** : basée sur le RPE (Rate of Perceived Exertion)

#### Configuration
- **Modal paramètres** accessible depuis l'écran suivi
- **Notifications** activables/désactivables
- **Jours d'entraînement** personnalisables

### 💾 Persistance des Données

#### Sauvegarde Automatique
- **Programme actuel** sauvegardé en localStorage
- **Progression des séances** conservée
- **Paramètres utilisateur** persistants
- **Préférences onglets** mémorisées

#### Structure de Données
- **PREDEFINED_PROGRAMS** : base des programmes
- **appState.currentProgram** : programme en cours
- **ProgressionManager** : gestion des algorithmes

## Architecture Technique

### Nouveaux Écrans
- `screen-programmes` : Liste des programmes
- `screen-program-details` : Détails d'un programme
- `screen-program-tracking` : Suivi du programme actif

### Nouvelles Fonctions Actions
- `switchProgramTab()` : Navigation onglets
- `showProgramDetails()` : Affichage détails
- `startProgram()` : Démarrage programme
- `chargerSeance()` : Chargement séance
- `calculerProgression()` : Calcul progression
- `renderProgramTracking()` : Rendu suivi

### Styles CSS Ajoutés
- `.program-tabs`, `.program-card` : Interface programmes
- `.week-accordion`, `.session-item` : Accordéon semaines
- `.progress-bar`, `.progress-fill` : Barres progression
- **Responsive design** adapté mobile

## État Actuel

### ✅ Fonctionnel
- Navigation complète entre tous les écrans
- Programme "FORGE DU NOVICE" entièrement opérationnel
- Suivi de progression en temps réel
- Intégration avec l'onglet Séance
- Widget dashboard dynamique
- Persistance des données

### 🔒 "Bientôt Disponible"
- 24 autres programmes (titre + description)
- Programmes personnalisés (interface préparée)
- Import/Export de programmes
- Statistiques avancées de programme

## Utilisation

1. **Aller dans l'onglet "Programmes"**
2. **Sélectionner "FORGE DU NOVICE"** dans la catégorie Débutant
3. **Cliquer "Suivre ce programme"**
4. **Choisir une date de début**
5. **Confirmer le démarrage**
6. **Accéder au suivi** via l'écran Programme Suivi
7. **Cliquer sur une séance** pour la charger automatiquement
8. **Effectuer la séance** normalement dans l'onglet Séance
9. **Progression automatique** du programme

## Prochaines Étapes

1. **Développer les 24 autres programmes** avec séances détaillées
2. **Ajouter la création de programmes personnalisés**
3. **Implémenter les statistiques avancées**
4. **Système de notifications push**
5. **Partage de programmes entre utilisateurs**

Le module est entièrement fonctionnel et prêt pour utilisation avec le programme "FORGE DU NOVICE" comme programme pilote.