let chartResultaten = null;
let chartDoelpunten = null;

async function laadStats(speler) {
    // 1. Update de titel bovenaan de pagina dynamisch
    document.getElementById('speler-titel').innerText = `Statistieken ${speler}`;
    
    // 2. Toon de lader, verberg de grafieken
    document.getElementById('loading-msg').style.display = 'block';
    document.getElementById('stats-container').style.display = 'none';

    try {
        const { data, error } = await supabaseClient
            .from('wedstrijden')
            .select('*')
            .eq('speler', speler)
            .order('datum', { ascending: true }); // Chronologisch voor de grafieklijn

        if (error) throw error;

        let win = 0, draw = 0, loss = 0;
        let matchLabels = [];
        let goalsData = [];

        data.forEach(m => {
            // Tel afwezige matchen niet mee in de prestatiegrafieken
            if (m.status === 'Afwezig') return;
            
            const isWin = (m.locatie === 'Thuis' && m.score_thuis > m.score_uit) || 
                          (m.locatie === 'Uit' && m.score_uit > m.score_thuis);
            const isLoss = (m.locatie === 'Thuis' && m.score_thuis < m.score_uit) || 
                           (m.locatie === 'Uit' && m.score_uit < m.score_thuis);
            
            if (isWin) win++;
            else if (isLoss) loss++;
            else draw++;

            // Maak een kort label (max 12 tekens) van de tegenstander
            matchLabels.push(m.tegenstander.substring(0, 12));
            goalsData.push(m.doelpunten_speler || 0);
        });

        // Verberg de lader
        document.getElementById('loading-msg').style.display = 'none';
        
        // Teken de grafieken of toon dat er niets is
        if (data.length > 0) {
            document.getElementById('stats-container').style.display = 'block';
            tekenResultatenChart(win, draw, loss);
            tekenDoelpuntenChart(matchLabels, goalsData);
        } else {
            document.getElementById('loading-msg').innerText = `Nog geen gespeelde wedstrijden voor ${speler}.`;
            document.getElementById('loading-msg').style.display = 'block';
        }

    } catch (err) {
        console.error("Fout bij laden stats:", err);
        document.getElementById('loading-msg').innerText = "Fout bij ophalen van statistieken.";
    }
}

function tekenResultatenChart(w, d, l) {
    const ctx = document.getElementById('resultatenChart').getContext('2d');
    
    // Vernietig oude grafiek als we van speler wisselen
    if (chartResultaten) chartResultaten.destroy();

    chartResultaten = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Winst', 'Gelijk', 'Verlies'],
            datasets: [{
                data: [w, d, l],
                backgroundColor: ['#8EF9F3', '#FFD9CE', '#DB5461'], // Jouw Soft Cyan, Almond Silk, Lobster Pink
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: 'bold', size: 14 } } }
            }
        }
    });
}

function tekenDoelpuntenChart(labels, data) {
    const ctx = document.getElementById('doelpuntenChart').getContext('2d');
    
    // Vernietig oude grafiek als we van speler wisselen
    if (chartDoelpunten) chartDoelpunten.destroy();

    chartDoelpunten = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Goals',
                data: data,
                backgroundColor: '#FFD9CE', // Almond Silk achtergrond
                borderColor: '#DB5461',     // Lobster Pink randje
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { ticks: { font: { family: 'Nunito', size: 10 } } }
            },
            plugins: {
                legend: { display: false } // Geen nutteloze labelbox boven de bar chart
            }
        }
    });
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    laadStats(speler);
};

// Start met het inladen van Lou's stats als de pagina opent
document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));
