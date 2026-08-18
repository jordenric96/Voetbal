async function laadStats(speler) {
    const container = document.getElementById('stats-container');
    const loader = document.getElementById('loading-msg');
    
    loader.style.display = 'block';
    container.style.display = 'none';

    try {
        // Haal alle matchen op (automatisch van nieuw naar oud gesorteerd)
        const { data, error } = await supabaseClient
            .from('wedstrijden')
            .select('*')
            .eq('speler', speler)
            .order('datum', { ascending: false });

        if (error) throw error;

        // Veldspeler Stats
        let veldMatches = 0; let veldWins = 0; let veldGoals = 0; let veldAssists = 0;

        // Doelman Stats
        let keeperMatches = 0; let keeperWins = 0; let cleanSheets = 0; let goalsAgainst = 0;
        let keeperGoals = 0; // Want bij U6 scoren keepers soms ook!

        // Nieuwe Pro Stats: Teambelang & Balans
        let teamGoalsTotale = 0;
        let totaalWins = 0; let totaalDraws = 0; let totaalLosses = 0;
        let vormLijst = []; // Voor de Laatste 5 matchen

        // Data analyseren
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

                    // Vorm opslaan (W, D of L)
                    vormLijst.push(isWin ? 'W' : (isDraw ? 'D' : 'L'));

                    if (score.is_doelman) {
                        keeperMatches++;
                        if (isWin) keeperWins++;
                        if (tegenScore === 0) cleanSheets++; 
                        goalsAgainst += tegenScore;
                        keeperGoals += (score.goals || 0); // Scoren als keeper
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
            loader.innerHTML = `<div class="empty-state-noe"><h2>Geen stats</h2><p style="color: var(--rebecca-purple); font-weight:700;">Nog geen gespeelde wedstrijden voor ${speler}.</p></div>`;
            loader.style.display = 'block';
            return;
        }

        // --- BEREKENINGEN ---
        const winPercVeld = veldMatches > 0 ? Math.round((veldWins / veldMatches) * 100) : 0;
        const gemGoalsVeld = veldMatches > 0 ? (veldGoals / veldMatches).toFixed(1) : 0;
        
        const winPercKeeper = keeperMatches > 0 ? Math.round((keeperWins / keeperMatches) * 100) : 0;
        const gemTegenGoals = keeperMatches > 0 ? (goalsAgainst / keeperMatches).toFixed(1) : 0;
        
        const winPercTotaal = Math.round((totaalWins / totaalMiniMatches) * 100);
        
        // Teambelang: Bij hoeveel % van de teamgoals was hij betrokken?
        const totaalInbreng = veldGoals + veldAssists + keeperGoals;
        const teambelangPerc = teamGoalsTotale > 0 ? Math.round((totaalInbreng / teamGoalsTotale) * 100) : 0;

        // Vormcurve (laatste 5 matchen, nieuwste rechts)
        const laatste5 = vormLijst.slice(0, 5).reverse();
        let vormHtml = '';
        laatste5.forEach(result => {
            if (result === 'W') vormHtml += `<span style="background: #25D366; color:#fff; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:bold; margin:0 3px;">W</span>`;
            else if (result === 'D') vormHtml += `<span style="background: #a0aec0; color:#fff; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:bold; margin:0 3px;">G</span>`;
            else vormHtml += `<span style="background: var(--lobster-pink); color:#fff; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:bold; margin:0 3px;">V</span>`;
        });
        if(laatste5.length === 0) vormHtml = `<span style="font-size:12px; color:var(--almond-silk);">Nog geen data</span>`;

        // Styling variabelen
        const gridStyle = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';
        const titleStyle = 'color: var(--space-indigo); font-size: 16px; margin: 0 0 15px; font-weight: 900; display: flex; align-items: center; gap: 8px; border-bottom: 2px dashed var(--almond-silk); padding-bottom: 10px;';
        const cardStyle = 'background: #fff; padding: 20px; border-radius: 16px; margin-bottom: 25px; box-shadow: var(--card-shadow); border: 1px solid var(--almond-silk);';
        const boxStyle = 'background: var(--bg-color); padding: 15px; border-radius: 12px; text-align: center;';

        let html = '';

        // --- 1. HERO SECTIE & VORM ---
        html += `
            <div style="background: var(--space-indigo); padding: 30px 20px; border-radius: 16px; margin-bottom: 25px; color: #fff; text-align: center; box-shadow: 0 10px 20px rgba(23, 23, 56, 0.15);">
                <h2 style="margin: 0 0 5px 0; font-size: 22px; font-weight: 900;">Seizoen Overzicht</h2>
                <p style="margin: 0 0 25px 0; font-size: 12px; color: var(--almond-silk); text-transform: uppercase; letter-spacing: 1px;">Totale Inbreng</p>
                
                <div style="display: flex; justify-content: space-around; align-items: flex-end; margin-bottom: 25px;">
                    <div style="flex: 1;">
                        <span style="font-size: 36px; font-weight: 900; color: var(--soft-cyan); display: block; line-height: 1;">${veldGoals + keeperGoals}</span>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Goals</span>
                    </div>
                    <div style="flex: 1; padding-bottom: 5px; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1);">
                        <span style="font-size: 22px; font-weight: 900; color: #fff; display: block; line-height: 1; margin-bottom: 4px;">${totaalMiniMatches}</span>
                        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--almond-silk); font-weight: 800;">Matchen</span>
                    </div>
                    <div style="flex: 1;">
                        <span style="font-size: 36px; font-weight: 900; color: var(--lobster-pink); display: block; line-height: 1;">${veldAssists}</span>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Assists</span>
                    </div>
                </div>

                <!-- Vormcurve & Aandeel -->
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; text-align: left;">
                    <div>
                        <span style="display: block; font-size: 10px; color: var(--almond-silk); text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Vorm (Laatste 5)</span>
                        <div>${vormHtml}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 10px; color: var(--almond-silk); text-transform: uppercase; font-weight: bold; margin-bottom: 2px;">Teambelang</span>
                        <span style="font-size: 16px; font-weight: 900; color: var(--soft-cyan);">${teambelangPerc}%</span>
                    </div>
                </div>
            </div>
        `;

        // --- 2. SECTIE VELDSPELER ---
        if (veldMatches > 0) {
            html += `
                <div style="${cardStyle}">
                    <h3 style="${titleStyle}">👟 Als Veldspeler</h3>
                    <div style="${gridStyle}">
                        <div style="${boxStyle}">
                            <span style="font-size: 22px; font-weight: 900; color: var(--space-indigo); display: block;">${winPercVeld}%</span>
                            <span style="font-size: 11px; font-weight: 900; color: var(--rebecca-purple); text-transform: uppercase;">Winst</span>
                            <p style="font-size:9px; color:var(--space-indigo); opacity:0.6; margin: 4px 0 0 0; font-weight: bold;">(${veldWins} gew. van ${veldMatches})</p>
                        </div>
                        <div style="${boxStyle}">
                            <span style="font-size: 22px; font-weight: 900; color: var(--space-indigo); display: block;">${gemGoalsVeld}</span>
                            <span style="font-size: 11px; font-weight: 900; color: var(--rebecca-purple); text-transform: uppercase;">Goals/Match</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- 3. SECTIE DOELMAN (Verschijnt pas als keeperMatches > 0 !!) ---
        if (keeperMatches > 0) {
            html += `
                <div style="${cardStyle}">
                    <h3 style="${titleStyle}">🧤 Als Doelman</h3>
                    <div style="${gridStyle}; margin-bottom: 12px;">
                        <div style="${boxStyle} background: var(--soft-cyan); color: var(--space-indigo);">
                            <span style="font-size: 22px; font-weight: 900; display: block;">${cleanSheets}</span>
                            <span style="font-size: 11px; font-weight: 900; text-transform: uppercase;">Clean Sheets</span>
                        </div>
                        <div style="${boxStyle} background: var(--space-indigo); color: #fff;">
                            <span style="font-size: 22px; font-weight: 900; display: block;">${goalsAgainst}</span>
                            <span style="font-size: 11px; font-weight: 900; color: var(--almond-silk); text-transform: uppercase;">Tegengoals</span>
                        </div>
                    </div>
                    <div style="${gridStyle}">
                        <div style="${boxStyle}">
                            <span style="font-size: 22px; font-weight: 900; color: var(--space-indigo); display: block;">${winPercKeeper}%</span>
                            <span style="font-size: 11px; font-weight: 900; color: var(--rebecca-purple); text-transform: uppercase;">Winst</span>
                            <p style="font-size:9px; color:var(--space-indigo); opacity:0.6; margin: 4px 0 0 0; font-weight: bold;">(${keeperWins} gew. van ${keeperMatches})</p>
                        </div>
                        <div style="${boxStyle}">
                            <span style="font-size: 22px; font-weight: 900; color: var(--space-indigo); display: block;">${gemTegenGoals}</span>
                            <span style="font-size: 11px; font-weight: 900; color: var(--rebecca-purple); text-transform: uppercase;">Tegen/Match</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- 4. SECTIE ALGEMENE IMPACT & BALANS ---
        html += `
            <div style="${cardStyle} border-color: var(--rebecca-purple); padding: 0; overflow: hidden;">
                <div style="background: var(--rebecca-purple); color: #fff; padding: 20px; text-align: center;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900; margin-bottom: 5px; color: var(--almond-silk); display:block;">Balans Overzicht</span>
                    
                    <div style="display: flex; justify-content: center; gap: 15px; margin: 15px 0;">
                        <div style="text-align: center;">
                            <span style="display:block; font-size: 20px; font-weight: 900;">${totaalWins}</span>
                            <span style="font-size: 9px; text-transform: uppercase; color: #25D366; font-weight: bold;">Winst</span>
                        </div>
                        <div style="text-align: center;">
                            <span style="display:block; font-size: 20px; font-weight: 900;">${totaalDraws}</span>
                            <span style="font-size: 9px; text-transform: uppercase; color: #a0aec0; font-weight: bold;">Gelijk</span>
                        </div>
                        <div style="text-align: center;">
                            <span style="display:block; font-size: 20px; font-weight: 900;">${totaalLosses}</span>
                            <span style="font-size: 9px; text-transform: uppercase; color: var(--lobster-pink); font-weight: bold;">Verlies</span>
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; font-weight: bold;">Totaal Winstpercentage: <span style="color: var(--soft-cyan); font-size: 14px;">${winPercTotaal}%</span></span>
                    </div>
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

document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));
