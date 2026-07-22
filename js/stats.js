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

        // 1. Variabelen klaarzetten
        let totaalTeamMatchen = data.length;
        
        let matchenMetSpeler = 0;
        let winstMetSpeler = 0;
        
        let matchenZonderSpeler = 0;
        let winstZonderSpeler = 0;
        
        let totaalGoals = 0;
        let totaalAssists = 0;

        // 2. Data analyseren
        data.forEach(m => {
            const isWin = (m.locatie === 'Thuis' && m.score_thuis > m.score_uit) || 
                          (m.locatie === 'Uit' && m.score_uit > m.score_thuis);

            if (m.status === 'Afwezig') {
                matchenZonderSpeler++;
                if (isWin) winstZonderSpeler++;
            } else {
                matchenMetSpeler++;
                totaalGoals += (m.doelpunten_speler || 0);
                totaalAssists += (m.assists || 0);
                if (isWin) winstMetSpeler++;
            }
        });

        loader.style.display = 'none';

        if (totaalTeamMatchen === 0) {
            loader.innerText = `Nog geen gespeelde wedstrijden voor ${speler}.`;
            loader.style.display = 'block';
            return;
        }

        // 3. Wiskunde toepassen
        const winPercMet = matchenMetSpeler > 0 ? Math.round((winstMetSpeler / matchenMetSpeler) * 100) : 0;
        const winPercZonder = matchenZonderSpeler > 0 ? Math.round((winstZonderSpeler / matchenZonderSpeler) * 100) : 0;
        const gemGoals = matchenMetSpeler > 0 ? (totaalGoals / matchenMetSpeler).toFixed(1) : 0;
        const gemAssists = matchenMetSpeler > 0 ? (totaalAssists / matchenMetSpeler).toFixed(1) : 0;

        // 4. HTML opbouwen met de Premium CSS classes (identiek aan je screenshot)
        container.innerHTML = `
            <div class="stat-box">
                <span class="stat-value">${winPercMet}%</span>
                <span class="stat-label">Winst met ${speler.toUpperCase()}</span>
                <p style="font-size:10px; margin-top:5px; color:var(--rebecca-purple); opacity:0.6; font-weight:900;">(${winstMetSpeler} / ${matchenMetSpeler} gew)</p>
            </div>
            
            <div class="stat-box dark">
                <span class="stat-value">${winPercZonder}%</span>
                <span class="stat-label">Winst zonder ${speler.toUpperCase()}</span>
                <p style="font-size:10px; margin-top:5px; color:var(--almond-silk); opacity:0.7; font-weight:900;">(${winstZonderSpeler} / ${matchenZonderSpeler} gew)</p>
            </div>
            
            <div class="stat-box gold">
                <span class="stat-value">${totaalGoals}</span>
                <span class="stat-label">Goals</span>
            </div>
            
            <div class="stat-box gold">
                <span class="stat-value">${totaalAssists}</span>
                <span class="stat-label">Assists</span>
            </div>
            
            <div class="stat-box">
                <span class="stat-value">${gemGoals}</span>
                <span class="stat-label">Gem. Goals</span>
            </div>
            
            <div class="stat-box">
                <span class="stat-value">${gemAssists}</span>
                <span class="stat-label">Gem. Assists</span>
            </div>
            
            <div class="stat-box dark stat-full-width">
                <span class="stat-value">${totaalTeamMatchen}</span>
                <span class="stat-label">Totaal Gespeelde Matchen (Team)</span>
            </div>
        `;
        
        container.style.display = 'grid';

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