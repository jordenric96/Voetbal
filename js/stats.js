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

        data.forEach(m => {
            if (m.mini_scores) {
                m.mini_scores.forEach(score => {
                    const isThuis = m.locatie === 'Thuis';
                    const eigenScore = isThuis ? score.thuis : score.uit;
                    const tegenScore = isThuis ? score.uit : score.thuis;
                    
                    teamGoalsTotale += eigenScore;
                    const isWin = eigenScore > tegenScore;
                    const isDraw = eigenScore === tegenScore;
                    const isLoss = eigenScore < tegenScore;

                    if (isWin) totaalWins++; if (isDraw) totaalDraws++; if (isLoss) totaalLosses++;

                    if (score.is_doelman) {
                        keeperMatches++; if (isWin) keeperWins++; if (tegenScore === 0) cleanSheets++; 
                        goalsAgainst += tegenScore; keeperGoals += (score.goals || 0);
                    } else {
                        veldMatches++; if (isWin) veldWins++;
                        veldGoals += (score.goals || 0); veldAssists += (score.assists || 0);
                    }
                });
            }
        });

        loader.style.display = 'none';
        let totaalMiniMatches = veldMatches + keeperMatches;
        if (totaalMiniMatches === 0) {
            container.innerHTML = `<div class="empty-state">Nog geen stats voor ${speler}.</div>`;
            container.style.display = 'block'; return;
        }

        const winPercTotaal = Math.round((totaalWins / totaalMiniMatches) * 100);
        const totaalGoals = veldGoals + keeperGoals;

        // Visual Graph Logic (Max goals is 20 for a full bar, adjusts dynamically)
        const goalBar = Math.min((totaalGoals / 20) * 100, 100);
        const assistBar = Math.min((veldAssists / 15) * 100, 100);
        const winBar = winPercTotaal;

        let html = `
            <div class="card" style="padding: 24px 20px;">
                <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 20px 0; color: var(--primary);">Seizoen Prestaties</h2>
                
                <!-- Goals Bar -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Doelpunten</span>
                        <span style="font-size: 14px; font-weight: 800;">${totaalGoals}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${goalBar}%; height: 100%; background: var(--brand); border-radius: 4px;"></div>
                    </div>
                </div>

                <!-- Assists Bar -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Assists</span>
                        <span style="font-size: 14px; font-weight: 800;">${veldAssists}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${assistBar}%; height: 100%; background: #38bdf8; border-radius: 4px;"></div>
                    </div>
                </div>

                <!-- Winst Bar -->
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Win Percentage</span>
                        <span style="font-size: 14px; font-weight: 800;">${winPercTotaal}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${winBar}%; height: 100%; background: var(--accent-win); border-radius: 4px;"></div>
                    </div>
                </div>
            </div>

            <!-- Team Balans Kaart -->
            <div class="card" style="display: flex; justify-content: space-between; text-align: center; padding: 20px;">
                <div style="flex: 1;">
                    <span style="display: block; font-size: 24px; font-weight: 800; color: var(--accent-win);">${totaalWins}</span>
                    <span style="font-size: 10px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Winst</span>
                </div>
                <div style="width: 1px; background: #e2e8f0;"></div>
                <div style="flex: 1;">
                    <span style="display: block; font-size: 24px; font-weight: 800; color: var(--accent-draw);">${totaalDraws}</span>
                    <span style="font-size: 10px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Gelijk</span>
                </div>
                <div style="width: 1px; background: #e2e8f0;"></div>
                <div style="flex: 1;">
                    <span style="display: block; font-size: 24px; font-weight: 800; color: var(--accent-loss);">${totaalLosses}</span>
                    <span style="font-size: 10px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Verlies</span>
                </div>
            </div>
        `;

        if (keeperMatches > 0) {
            html += `
                <div class="card" style="padding: 24px 20px;">
                    <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 15px 0; color: var(--primary);">Keeper Statistieken</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                            <span style="display: block; font-size: 24px; font-weight: 800;">${cleanSheets}</span>
                            <span style="font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Clean Sheets</span>
                        </div>
                        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                            <span style="display: block; font-size: 24px; font-weight: 800;">${goalsAgainst}</span>
                            <span style="font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase;">Tegengoals</span>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        container.style.display = 'block';
    } catch (err) {
        loader.innerText = "Fout bij ophalen."; loader.style.display = 'block';
    }
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active'); laadStats(speler);
};

document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));
