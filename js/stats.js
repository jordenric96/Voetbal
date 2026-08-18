async function laadStats(speler) {
    const container = document.getElementById('stats-container');
    const loader = document.getElementById('loading-msg');
    
    loader.style.display = 'block';
    container.style.display = 'none';

    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('speler', speler).order('datum', { ascending: false });
        if (error) throw error;

        let veldMatches = 0; let veldWins = 0; let veldGoals = 0; let veldAssists = 0;
        let keeperMatches = 0; let keeperWins = 0; let cleanSheets = 0; let goalsAgainst = 0; let keeperGoals = 0; 
        let teamGoalsTotale = 0; let totaalWins = 0; let totaalDraws = 0; let totaalLosses = 0;
        let vormLijst = []; 

        data.forEach(m => {
            if (m.mini_scores && m.mini_scores.length > 0) {
                m.mini_scores.forEach(score => {
                    const isThuis = m.locatie === 'Thuis';
                    const eigenScore = isThuis ? score.thuis : score.uit;
                    const tegenScore = isThuis ? score.uit : score.thuis;
                    
                    teamGoalsTotale += eigenScore;
                    const isWin = eigenScore > tegenScore;
                    const isDraw = eigenScore === tegenScore;
                    const isLoss = eigenScore < tegenScore;

                    if (isWin) totaalWins++;
                    if (isDraw) totaalDraws++;
                    if (isLoss) totaalLosses++;

                    vormLijst.push(isWin ? 'W' : (isDraw ? 'D' : 'L'));

                    if (score.is_doelman) {
                        keeperMatches++;
                        if (isWin) keeperWins++;
                        if (tegenScore === 0) cleanSheets++; 
                        goalsAgainst += tegenScore;
                        keeperGoals += (score.goals || 0);
                    } else {
                        veldMatches++;
                        if (isWin) veldWins++;
                        veldGoals += (score.goals || 0);
                        veldAssists += (score.assists || 0);
                    }
                });
            }
        });

        loader.style.display = 'none';
        let totaalMiniMatches = veldMatches + keeperMatches;

        if (totaalMiniMatches === 0) {
            container.innerHTML = `<div class="empty-state">Nog geen stats voor ${speler}.</div>`;
            container.style.display = 'block';
            return;
        }

        const winPercVeld = veldMatches > 0 ? Math.round((veldWins / veldMatches) * 100) : 0;
        const gemGoalsVeld = veldMatches > 0 ? (veldGoals / veldMatches).toFixed(1) : 0;
        const winPercKeeper = keeperMatches > 0 ? Math.round((keeperWins / keeperMatches) * 100) : 0;
        const gemTegenGoals = keeperMatches > 0 ? (goalsAgainst / keeperMatches).toFixed(1) : 0;
        
        const totaalInbreng = veldGoals + veldAssists + keeperGoals;
        const teambelangPerc = teamGoalsTotale > 0 ? Math.round((totaalInbreng / teamGoalsTotale) * 100) : 0;

        const laatste5 = vormLijst.slice(0, 5).reverse();
        let vormHtml = '';
        laatste5.forEach(result => {
            if (result === 'W') vormHtml += `<span style="background: #ecfdf5; color:#059669; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">W</span>`;
            else if (result === 'D') vormHtml += `<span style="background: #f1f5f9; color:#64748b; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">G</span>`;
            else vormHtml += `<span style="background: #fef2f2; color:#dc2626; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">V</span>`;
        });
        if(laatste5.length === 0) vormHtml = `<span style="font-size:12px; color:#9ca3af;">Geen data</span>`;

        // Styling componenten
        const cardStyle = "background: #fff; padding: 20px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);";
        const titleStyle = "font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px 0;";
        const statBoxStyle = "background: #f8fafc; padding: 15px; border-radius: 12px;";

        let html = '';

        // TOTAAL DOELPUNTEN GRAFIEK
        const totaleGoalsNum = veldGoals + keeperGoals;
        const goalBarW = Math.min((totaleGoalsNum / 30) * 100, 100); // 30 is max voor de grafiek

        html += `
            <div style="${cardStyle}">
                <h3 style="${titleStyle}">Seizoen Productiviteit</h3>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <span style="font-size: 36px; font-weight: 800; color: #111827; line-height: 1;">${totaleGoalsNum}</span>
                    <span style="font-size: 12px; font-weight: 700; color: #64748b; padding-bottom: 4px;">Goals</span>
                </div>
                <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 20px; overflow: hidden;">
                    <div style="width: ${goalBarW}%; height: 100%; background: #111827; border-radius: 4px; transition: width 1s ease;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <span style="font-size: 24px; font-weight: 800; color: #4b5563; line-height: 1;">${veldAssists}</span>
                    <span style="font-size: 12px; font-weight: 700; color: #64748b;">Assists</span>
                </div>
            </div>
        `;

        // VORM & TEAMBELANG
        html += `
            <div style="${cardStyle}">
                <h3 style="${titleStyle}">Vorm & Impact</h3>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                        ${vormHtml}
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 20px; font-weight: 800; color: #111827;">${teambelangPerc}%</span>
                        <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Teambelang</span>
                    </div>
                </div>
            </div>
        `;

        // VELDSPELER
        if (veldMatches > 0) {
            html += `
                <div style="${cardStyle}">
                    <h3 style="${titleStyle}">Veldspeler</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="${statBoxStyle}">
                            <span style="font-size: 22px; font-weight: 800; color: #111827; display: block;">${winPercVeld}%</span>
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Winst</span>
                        </div>
                        <div style="${statBoxStyle}">
                            <span style="font-size: 22px; font-weight: 800; color: #111827; display: block;">${gemGoalsVeld}</span>
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Goals/Match</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // DOELMAN
        if (keeperMatches > 0) {
            html += `
                <div style="${cardStyle}">
                    <h3 style="${titleStyle}">Doelman</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div style="${statBoxStyle}">
                            <span style="font-size: 22px; font-weight: 800; color: #111827; display: block;">${cleanSheets}</span>
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Clean Sheets</span>
                        </div>
                        <div style="${statBoxStyle}">
                            <span style="font-size: 22px; font-weight: 800; color: #111827; display: block;">${goalsAgainst}</span>
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Tegengoals</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        container.style.display = 'block';

    } catch (err) {
        loader.innerText = "Fout bij ophalen.";
        loader.style.display = 'block';
    }
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    laadStats(speler);
};

document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));
