// Functie om te wisselen tussen Lou en Noé (Bestaand)
function openTab(evt, spelerNaam) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(spelerNaam).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Functie om de wedstrijden uit Supabase te halen
async function laadWedstrijden() {
    const container = document.getElementById('wedstrijden-container-lou');
    container.innerHTML = '<p class="empty-state">Wedstrijden ophalen... ⏳</p>';

    try {
        // Haal alle wedstrijden van Lou op, gesorteerd op datum (nieuwste bovenaan)
        const { data: matchen, error } = await supabaseClient
            .from('wedstrijden')
            .select('*')
            .eq('speler', 'Lou')
            .order('datum', { ascending: false });

        if (error) throw error;

        // Als er geen wedstrijden zijn
        if (matchen.length === 0) {
            container.innerHTML = '<p class="empty-state">Nog geen wedstrijden gespeeld dit seizoen.</p>';
            return;
        }

        // Maak de container leeg
        container.innerHTML = '';

        // Loop door elke wedstrijd en maak er een HTML-kaartje van
        matchen.forEach(match => {
            // Bepaal of het winst, verlies of gelijk was voor de teamkleuren
            let resultaatClass = 'draw';
            if (match.locatie === 'Thuis') {
                if (match.score_thuis > match.score_uit) resultaatClass = 'win';
                else if (match.score_thuis < match.score_uit) resultaatClass = 'loss';
            } else {
                if (match.score_uit > match.score_thuis) resultaatClass = 'win';
                else if (match.score_uit < match.score_thuis) resultaatClass = 'loss';
            }

            // Datum mooi formatteren (bijv. "12 Sep 2026")
            const datumOpties = { day: 'numeric', month: 'short', year: 'numeric' };
            const datumMooi = new Date(match.datum).toLocaleDateString('nl-BE', datumOpties);

            // Bepaal of er een logo is, anders tonen we een schild-icoontje
            const logoHtml = match.logo_tegenstander 
                ? `<img src="${match.logo_tegenstander}" class="match-logo" alt="Logo">`
                : `<div class="match-logo">🛡️</div>`;

            // Bouw de HTML voor het kaartje (verwijst straks naar match-detail.html)
            const matchCard = document.createElement('a');
            matchCard.href = `match-detail.html?id=${match.id}`;
            matchCard.className = `match-card ${resultaatClass}`;
            
            matchCard.innerHTML = `
                ${logoHtml}
                <div class="match-info">
                    <h3>${match.tegenstander} (${match.locatie})</h3>
                    <p>${datumMooi} • ${match.type_wedstrijd}</p>
                    ${match.status === 'Afwezig' ? `<p style="color:#e74c3c; font-weight:bold; margin-top:3px;">Afwezig: ${match.reden_afwezig}</p>` : ''}
                </div>
                <div class="match-score">
                    ${match.score_thuis} - ${match.score_uit}
                </div>
            `;

            container.appendChild(matchCard);
        });

    } catch (error) {
        console.error("Fout bij het ophalen:", error);
        container.innerHTML = '<p class="empty-state">Er ging iets mis met het ophalen van de data.</p>';
    }
}

// Zodra de HTML is ingeladen, voer dan direct de functie uit
document.addEventListener('DOMContentLoaded', () => {
    laadWedstrijden();
});