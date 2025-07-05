# Diagnostic et Corrections SmartTrack

## Problèmes identifiés

### 1. Barre d'onglets manquante en bas
**Symptôme** : La barre de navigation avec les onglets (Forge, Bataille, Arsenal, etc.) n'apparaît plus en bas de l'écran.

**Causes possibles** :
- Problème CSS avec `position: fixed` ou `z-index`
- Élément masqué par `display: none` ou `visibility: hidden`
- Problème JavaScript empêchant l'affichage

**Solutions** :
1. Vérifier le CSS de `.nav-bar` (ligne 708-720)
2. S'assurer que l'élément HTML `<nav class="nav-bar">` est présent (ligne 5647)
3. Vérifier qu'aucun script ne masque la barre

### 2. Suivi détaillé affiche une page vide
**Symptôme** : Le bouton "📊 Suivi détaillé" mène à une page vide.

**Cause** : La fonction `renderProgramTracking()` vérifie si `appState.currentProgram` existe. Si ce n'est pas le cas, elle affiche "Aucun programme actif".

**Solution** : Vérifier l'état du programme actuel et corriger la logique.

## Corrections à appliquer

### Correction 1 : Forcer l'affichage de la barre de navigation

```css
/* Amélioration de la barre de navigation pour éviter qu'elle disparaisse */
.nav-bar {
    background: var(--surface) !important;
    border-top: 1px solid var(--border);
    padding: 10px 0;
    display: flex !important;
    justify-content: space-around;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    z-index: 1001 !important;
    box-shadow: 0 -2px 10px var(--shadow);
    visibility: visible !important;
    opacity: 1 !important;
}
```

### Correction 2 : Améliorer la fonction de suivi des programmes

```javascript
// Correction pour l'affichage du suivi détaillé
actions.renderProgramTracking = function() {
    const screen = document.getElementById('screen-program-tracking');
    
    if (!appState.currentProgram) {
        // Vérifier s'il y a des programmes disponibles
        const hasPrograms = appState.programs && appState.programs.length > 0;
        
        screen.innerHTML = `
            <div class="header">
                <button class="btn btn-small btn-secondary" onclick="actions.showScreen('dashboard')">← Retour</button>
                <h1>Suivi de Programme</h1>
                <div></div>
            </div>
            <div class="card" style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                <h3>Aucun programme actif</h3>
                <p style="margin: 16px 0;">
                    ${hasPrograms ? 
                        'Vous avez des programmes disponibles. Sélectionnez-en un pour commencer le suivi.' : 
                        'Créez ou choisissez un programme pour commencer votre suivi d\'entraînement.'}
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
                    <button class="btn btn-primary" onclick="actions.showScreen('programmes')">
                        🏆 Voir les programmes
                    </button>
                    ${hasPrograms ? `
                        <button class="btn btn-secondary" onclick="actions.selectFirstAvailableProgram()">
                            ⚡ Sélectionner un programme
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        return;
    }

    // Reste du code pour afficher le programme actuel...
    // [Le code existant continue ici]
};
```

### Correction 3 : Fonction de débogage pour diagnostiquer

```javascript
// Fonction de diagnostic pour vérifier l'état de l'application
actions.diagnostic = function() {
    console.log('=== DIAGNOSTIC SMARTTRACK ===');
    console.log('État de l\'application:', appState);
    console.log('Programme actuel:', appState.currentProgram);
    console.log('Programmes disponibles:', appState.programs);
    console.log('Barre de navigation visible:', document.querySelector('.nav-bar')?.style.display);
    console.log('Écran actuel:', document.querySelector('.screen.active')?.id);
    
    // Vérifier si la barre de navigation est masquée
    const navBar = document.querySelector('.nav-bar');
    if (navBar) {
        console.log('Barre navigation - display:', getComputedStyle(navBar).display);
        console.log('Barre navigation - position:', getComputedStyle(navBar).position);
        console.log('Barre navigation - z-index:', getComputedStyle(navBar).zIndex);
    } else {
        console.log('❌ Barre de navigation non trouvée dans le DOM');
    }
    
    return {
        navBarVisible: navBar && getComputedStyle(navBar).display !== 'none',
        currentProgram: appState.currentProgram,
        programsCount: appState.programs?.length || 0,
        currentScreen: document.querySelector('.screen.active')?.id
    };
};
```

## Instructions de réparation

1. **Vérifiez la barre de navigation** :
   - Ouvrez les outils de développement (F12)
   - Tapez `actions.diagnostic()` dans la console
   - Vérifiez si la barre est présente et visible

2. **Forcez l'affichage de la barre** :
   - Si elle n'est pas visible, ajoutez le CSS de correction ci-dessus
   - Ou exécutez ce code dans la console :
   ```javascript
   const navBar = document.querySelector('.nav-bar');
   if (navBar) {
       navBar.style.display = 'flex';
       navBar.style.position = 'fixed';
       navBar.style.bottom = '0';
       navBar.style.zIndex = '1001';
   }
   ```

3. **Vérifiez l'état des programmes** :
   - Tapez `console.log(appState.currentProgram)` dans la console
   - Si null, vérifiez `appState.programs` pour voir les programmes disponibles

4. **Rechargez la page** :
   - Après avoir appliqué les corrections, rechargez la page
   - Vérifiez que la barre de navigation est revenue

## Test de validation

Pour confirmer que les corrections fonctionnent :

1. La barre d'onglets doit être visible en bas
2. Le bouton "Suivi détaillé" doit soit :
   - Afficher le suivi du programme actuel
   - Ou proposer de sélectionner un programme avec un message informatif

Ces corrections devraient résoudre les problèmes que vous rencontrez.