(function(){
  if(!window.actions || !window.appState){
    console.error('SmartTrack: actions or appState non trouvés');
    return;
  }
  const actions = window.actions;
  const appState = window.appState;

  // Rendu des semaines avec accordéon de détails
  actions.renderProgramWeeks = function(container, program){
    container.innerHTML = '';
    if(!program.seances){
      container.innerHTML = '<p>Aucune séance définie pour ce programme</p>';
      return;
    }
    // Grouper les séances par semaine
    const semaines = {};
    program.seances.forEach(seance=>{
      if(!semaines[seance.semaine]) semaines[seance.semaine] = [];
      semaines[seance.semaine].push(seance);
    });

    Object.entries(semaines).forEach(([semaine,seances])=>{
      const seancesRealisees = (appState.currentProgram?.seances_realisees||[]).map(s=>s.seance_id);
      const seancesCompletees = seances.filter(s=>seancesRealisees.includes(s.id)).length;
      let progression = seances.length ? Math.round((seancesCompletees/seances.length)*100) : 0;
      if(isNaN(progression) || !isFinite(progression)) progression = 0;

      const weekDiv = document.createElement('div');
      weekDiv.className = 'week-accordion';
      weekDiv.innerHTML = `
        <div class="week-header" onclick="actions.toggleWeek(${semaine})">
          <div>
            <div class="week-title">Semaine ${semaine}</div>
            <div class="week-progress">${seancesCompletees}/${seances.length} séances (${progression}%)</div>
          </div>
          <div style="font-size:18px;">▼</div>
        </div>
        <div class="week-content" id="week-${semaine}">
          ${seances.map(seance=>{
            const isCompleted = seancesRealisees.includes(seance.id);
            const statusClass = isCompleted ? 'completed' : 'pending';
            const statusIcon = isCompleted ? '✅' : (seance.jour<=3 ? '🟡' : '⭕');
            return `
              <div class="session-item ${statusClass}" onclick=\"actions.toggleSessionDetails('${seance.id}')\">
                <div>
                  <div class="session-day">Jour ${seance.jour}</div>
                  <div class="session-name">${seance.nom}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="session-duration">${seance.duree_minutes} min</div>
                  <div class="session-status ${statusClass}">${statusIcon}</div>
                  <div class="session-arrow">▼</div>
                </div>
              </div>
              <div class="session-details" id="details-${seance.id}">
                ${seance.exercices.map(ex=>`
                  <div class=\"session-detail-exercise\">
                    <span>${ex.nom}</span>
                    <span>${ex.repetitions || (ex.series + ' séries')}</span>
                  </div>`).join('')}
                <div style="text-align:right;margin-top:8px;">
                  <button class="quick-action-btn quick-action-primary" onclick=\"actions.chargerSeance('${seance.id}')\">Démarrer</button>
                </div>
              </div>`;
          }).join('')}
        </div>`;
      container.appendChild(weekDiv);
    });
  };

  // Basculer l'affichage des détails d'une séance
  actions.toggleSessionDetails = function(seanceId){
    const details = document.getElementById(`details-${seanceId}`);
    if(!details) return;
    const header = details.previousElementSibling;
    const arrow = header.querySelector('.session-arrow');
    if(details.classList.contains('active')){
      details.classList.remove('active');
      arrow.textContent = '▼';
    }else{
      details.classList.add('active');
      arrow.textContent = '▲';
    }
  };

  console.log('program.js chargé – renderProgramWeeks et toggleSessionDetails surchargés');
})();