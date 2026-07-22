// Hulpfunctie om te bepalen of een match gewonnen is door het team
function isGewonnen(match) {
    if (match.locatie === 'Thuis' && match.score_thuis > match.score_uit) return true;
    if (match.locatie === 'Uit' && match.score_uit > match.score_thuis) return true;
    return false;
}

// Hoofdfunctie om data te berekenen en te tonen
async function laadStatistieken(spelerNaam) {
    const container = document.getElementById('stats-container');
    container.innerHTML = '<p class="empty-state">Data analyseren... ⏳</p>';
    document.getElementById('speler-titel').innerText = `Statistieken ${spelerNaam}`;

    try {
        const { data: matchen, error } = await supabaseClient
            .from('wedstrijden')
            .select('*')
            .eq('speler', spelerNaam);

        if (error) throw error;

        if (matchen.length === 0) {
            container.innerHTML = `<p class="empty-state">${spelerNaam} heeft nog geen wedstrijden gespeeld.</p>`;
            return;
        }

        // 1. Data filteren
        const matchenMet = matchen.filter(m => m.status === 'Meegedaan');
        const matchenZonder = matchen.filter(m => m.status === 'Afwezig');

        const winstMet = matchenMet.filter(isGewonnen).length;
        const winstZonder = matchenZonder.filter(isGewonnen).length;

        // 2. Percentages berekenen (beveiligd tegen delen door nul)
        const winPercMet = matchenMet.length > 0 ? Math.round((winstMet / matchenMet.length) * 100) : 0;
        const winPercZonder = matchenZonder.length > 0 ? Math.round((winstZonder / matchenZonder.length) * 100) : 0;

        // 3. Doelpunten berekenen
        const totaalDoelpunten = matchenMet.reduce((som, match) => som + (match.doelpunten_speler || 0), 0);
        const gemDoelpunten = matchenMet.length > 0 ? (totaalDoelpunten / matchenMet.length).toFixed(1) : 0;

        // 4. HTML Dashboard opbouwen
        container.innerHTML = `
            <div class="stats-grid">
                <!-- Winst met speler -->
                <div class="stat-box">
                    <span class="stat-value">${winPercMet}%</span>
                    <span class="stat-label">Winst met ${spelerNaam}</span>
                    <span style="display:block; margin-top:5px; font-size:11px; color:#999;">(${winstMet} van de ${matchenMet.length} gewonnen)</span>
                </div>

                <!-- Winst zonder speler -->
                <div class="stat-box dark">
                    <span class="stat-value">${winPercZonder}%</span>
                    <span class="stat-label">Winst zonder ${spelerNaam}</span>
                    <span style="display:block; margin-top:5px; font-size:11px; color:#999;">(${winstZonder} van de ${matchenZonder.length} gewonnen)</span>
                </div>

                <!-- Aanvallende stats -->
                <div class="stat-box gold stat-full-width">
                    <span class="stat-value">${totaalDoelpunten}</span>
                    <span class="stat-label">Totaal Doelpunten</span>
                </div>

                <div class="stat-box">
                    <span class="stat-value">${gemDoelpunten}</span>
                    <span class="stat-label">Gemiddeld / Match</span>
                </div>

                <div class="stat-box">
                    <span class="stat-value">${matchen.length}</span>
                    <span class="stat-label">Totaal Gespeeld Team</span>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Fout bij statistieken:", error);
        container.innerHTML = '<p class="empty-state">Kon statistieken niet berekenen.</p>';
    }
}

// Functie voor de tabbladen
window.wisselSpeler = function(evt, spelerNaam) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');

    // Laad direct de juiste data
    laadStatistieken(spelerNaam);
}

// Start direct met Lou als de pagina laadt
document.addEventListener('DOMContentLoaded', () => {
    laadStatistieken('Lou');
});