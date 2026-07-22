async function laadStats(speler) {
    const container = document.getElementById('stats-container');
    const loader = document.getElementById('loading-msg');
    
    loader.style.display = 'block';
    container.style.display = 'none';

    try {
        const { data, error } = await supabaseClient
            .from('wedstrijden')
            .select('*')
            .eq('speler', speler);

        if (error) throw error;

        // 1. Variabelen voor Algemeen & Afwezig
        let teamMatchdays = 0;
        let absentMatchdays = 0;
        let absentWins = 0;

        // 2. Variabelen voor Veldspeler
        let veldMatches = 0;
        let veldWins = 0;
        let veldGoals = 0;
        let veldAssists = 0;

        // 3. Variabelen voor Doelman
        let keeperMatches = 0;
        let keeperWins = 0;
        let cleanSheets = 0;
        let goalsAgainst = 0;

        // 4. Data analyseren
        data.forEach(m => {
            teamMatchdays++;

            // ALS HIJ AFWEZIG WAS
            if (m.status === 'Afwezig') {
                absentMatchdays++;
                // Check of de ploeg toen gewonnen heeft (oude methode)
                const isWin = (m.locatie === 'Thuis' && m.score_thuis > m.score_uit) || 
                              (m.locatie === 'Uit' && m.score_uit > m.score_thuis);
                if (isWin) absentWins++;
                return; // Stop met deze match en ga naar de volgende
            }

            // ALS HIJ MEE SPEELDE (Mini-matches uitlezen)
            if (m.mini_scores && m.mini_scores.length > 0) {
                m.mini_scores.forEach(score => {
                    const isThuis = m.locatie === 'Thuis';
                    const eigenScore = isThuis ? score.thuis : score.uit;
                    const tegenScore = isThuis ? score.uit : score.thuis;
                    
                    const isWin = eigenScore > tegenScore;

                    if (score.is_doelman) {
                        // KEEPER STATS
                        keeperMatches++;
                        if (isWin) keeperWins++;
                        if (tegenScore === 0) cleanSheets++; // De nul gehouden!
                        goalsAgainst += tegenScore;
                    } else {
                        // VELDSPELER STATS
                        veldMatches++;
                        if (isWin) veldWins++;
                        veldGoals += (score.goals || 0);
                        veldAssists += (score.assists || 0);
                    }
                });
            } else {
                // Fallback voor hele oude wedstrijden zonder mini-scores
                const isThuis = m.locatie === 'Thuis';
                const eigenScore = isThuis ? m.score_thuis : m.score_uit;
                const tegenScore = isThuis ? m.score_uit : m.score_thuis;
                const isWin = eigenScore > tegenScore;

                if (m.is_doelman) {
                    keeperMatches++;
                    if (isWin) keeperWins++;
                    if (tegenScore === 0) cleanSheets++;
                    goalsAgainst += tegenScore;
                } else {
                    veldMatches++;
                    if (isWin) veldWins++;
                    veldGoals += (m.doelpunten_speler || 0);
                    veldAssists += (m.assists || 0);
                }
            }
        });

        loader.style.display = 'none';

        if (teamMatchdays === 0) {
            loader.innerText = `Nog geen geregistreerde gegevens voor ${speler}.`;
            loader.style.display = 'block';
            return;
        }

        // 5. Wiskunde & Gemiddeldes toepassen
        const winPercVeld = veldMatches > 0 ? Math.round((veldWins / veldMatches) * 100) : 0;
        const gemGoalsVeld = veldMatches > 0 ? (veldGoals / veldMatches).toFixed(1) : 0;
        
        const winPercKeeper = keeperMatches > 0 ? Math.round((keeperWins / keeperMatches) * 100) : 0;
        const gemTegenGoals = keeperMatches > 0 ? (goalsAgainst / keeperMatches).toFixed(1) : 0;
        
        const winPercZonder = absentMatchdays > 0 ? Math.round((absentWins / absentMatchdays) * 100) : 0;
        const totaalMiniMatches = veldMatches + keeperMatches;
        const totaalMiniWins = veldWins + keeperWins;
        const winPercTotaal = totaalMiniMatches > 0 ? Math.round((totaalMiniWins / totaalMiniMatches) * 100) : 0;

        // 6. Prachtige HTML opbouwen met Grid-systemen
        const gridStyle = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px;';
        const titleStyle = 'color: var(--space-indigo); margin: 10px 0 15px; font-weight: 900; border-bottom: 2px solid var(--almond-silk); padding-bottom: 5px;';

        let html = '';

        // --- SECTIE 1: VELDSPELER ---
        if (veldMatches > 0) {
            html += `
                <h3 style="${titleStyle}">👟 Als Veldspeler</h3>
                <div style="${gridStyle}">
                    <div class="stat-box gold"><span class="stat-value">${veldGoals}</span><span class="stat-label">Goals</span></div>
                    <div class="stat-box gold"><span class="stat-value">${veldAssists}</span><span class="stat-label">Assists</span></div>
                    
                    <div class="stat-box"><span class="stat-value">${winPercVeld}%</span><span class="stat-label">Winst</span><p style="font-size:9px; color:var(--rebecca-purple); opacity:0.6; font-weight:900; margin-top:4px;">(${veldWins}/${veldMatches} gew)</p></div>
                    <div class="stat-box"><span class="stat-value">${gemGoalsVeld}</span><span class="stat-label">Gem. Goals/Match</span></div>
                </div>
            `;
        }

        // --- SECTIE 2: DOELMAN ---
        if (keeperMatches > 0) {
            html += `
                <h3 style="${titleStyle}">🧤 Als Doelman</h3>
                <div style="${gridStyle}">
                    <div class="stat-box" style="background: var(--soft-cyan); border:none; color: var(--space-indigo);"><span class="stat-value">${cleanSheets}</span><span class="stat-label">Clean Sheets (De Nul!)</span></div>
                    <div class="stat-box dark"><span class="stat-value">${goalsAgainst}</span><span class="stat-label">Tegengoals</span></div>
                    
                    <div class="stat-box"><span class="stat-value">${winPercKeeper}%</span><span class="stat-label">Winst</span><p style="font-size:9px; color:var(--rebecca-purple); opacity:0.6; font-weight:900; margin-top:4px;">(${keeperWins}/${keeperMatches} gew)</p></div>
                    <div class="stat-box"><span class="stat-value">${gemTegenGoals}</span><span class="stat-label">Gem. Tegen/Match</span></div>
                </div>
            `;
        }

        // --- SECTIE 3: ALGEMENE IMPACT ---
        html += `
            <h3 style="${titleStyle}">📊 Algemene Impact</h3>
            <div style="${gridStyle}">
                <div class="stat-box" style="grid-column: 1 / -1; border-bottom-color: var(--rebecca-purple);">
                    <span class="stat-value">${winPercTotaal}%</span>
                    <span class="stat-label">Totaal Winstpercentage (Met ${speler})</span>
                </div>
                
                <div class="stat-box dark">
                    <span class="stat-value">${winPercZonder}%</span>
                    <span class="stat-label">Winst ZONDER ${speler}</span>
                    <p style="font-size:9px; color:var(--almond-silk); opacity:0.7; font-weight:900; margin-top:4px;">(${absentWins}/${absentMatchdays} gew)</p>
                </div>
                
                <div class="stat-box" style="background: #fff; border: 1px solid var(--almond-silk);">
                    <span class="stat-value" style="font-size: 20px;">${totaalMiniMatches}</span>
                    <span class="stat-label">Gespeelde Uitslagen</span>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        container.style.display = 'block';

    } catch (err) {
        console.error("Fout bij laden stats:", err);
        loader.innerText = "Fout bij ophalen van statistieken.";
        loader.style.display = 'block';
    }
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    laadStats(speler);
};

// Start met het inladen van Lou's stats
document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));