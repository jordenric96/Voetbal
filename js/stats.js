// HET KLEUREN BREIN VOOR STATS
const badgeColors = {
    'U6': { bg: '#fef08a', text: '#713f12' }, 
    'U7': { bg: '#fed7aa', text: '#7c2d12' }, 
    'U8': { bg: '#fecaca', text: '#7f1d1d' }, 
    'U9': { bg: '#fbcfe8', text: '#831843' }, 
    'U10': { bg: '#e9d5ff', text: '#581c87' }, 
    'U11': { bg: '#c7d2fe', text: '#312e81' }, 
    'U12': { bg: '#bae6fd', text: '#0c4a6e' }, 
    'U13': { bg: '#99f6e4', text: '#0f766e' }, 
    'U14': { bg: '#bbf7d0', text: '#14532d' }, 
    'U15': { bg: '#d9f99d', text: '#3f6212' }, 
    'U16': { bg: '#fef08a', text: '#713f12' }, 
    'U17': { bg: '#fed7aa', text: '#7c2d12' }, 
    'Competitie': { bg: '#e0f2fe', text: '#0369a1' }, 
    'Toernooi': { bg: '#f3e8ff', text: '#7e22ce' }, 
    'Vriendschappelijk': { bg: '#dcfce7', text: '#15803d' }, 
    'Standaard': { bg: '#f3f4f6', text: '#4b5563' } 
};

// FILTER STATE
let actieveSpeler = 'Lou';
let filterCategorie = null;
let filterType = null;
let alleMatchenDB = [];

function toggleFilter() {
    document.getElementById('filter-panel').classList.toggle('open');
}

function resetFilters() {
    filterCategorie = null; filterType = null;
    document.getElementById('filter-panel').classList.remove('open');
    renderStats(); buildFilterUI();
}

function setFilter(soort, waarde) {
    if (soort === 'cat') filterCategorie = (filterCategorie === waarde) ? null : waarde;
    if (soort === 'type') filterType = (filterType === waarde) ? null : waarde;
    renderStats(); buildFilterUI();
}

function buildFilterUI() {
    const catContainer = document.getElementById('filter-chips-leeftijd');
    const typeContainer = document.getElementById('filter-chips-type');
    if(!catContainer || !typeContainer) return;
    
    catContainer.innerHTML = ''; typeContainer.innerHTML = '';

    const leeftijden = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13'];
    const types = ['Competitie', 'Toernooi', 'Vriendschappelijk'];

    leeftijden.forEach(cat => {
        const style = badgeColors[cat] || badgeColors['Standaard'];
        const isActive = filterCategorie === cat ? 'active' : '';
        catContainer.innerHTML += `<div class="filter-chip ${isActive}" onclick="setFilter('cat', '${cat}')" style="background: ${style.bg}; color: ${style.text}; border-color: ${isActive ? style.text : 'transparent'};">${cat}</div>`;
    });

    types.forEach(type => {
        const style = badgeColors[type] || badgeColors['Standaard'];
        const isActive = filterType === type ? 'active' : '';
        typeContainer.innerHTML += `<div class="filter-chip ${isActive}" onclick="setFilter('type', '${type}')" style="background: ${style.bg}; color: ${style.text}; border-color: ${isActive ? style.text : 'transparent'};">${type}</div>`;
    });

    let indText = "Alle";
    if(filterCategorie && filterType) indText = `${filterCategorie} & ${filterType}`;
    else if(filterCategorie) indText = filterCategorie;
    else if(filterType) indText = filterType;
    document.getElementById('filter-indicator').innerText = indText;
}

async function laadStats(speler) {
    actieveSpeler = speler;
    const loader = document.getElementById('loading-msg');
    const container = document.getElementById('stats-container');
    
    loader.style.display = 'block';
    container.style.display = 'none';

    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('speler', speler).order('datum', { ascending: false });
        if (error) throw error;
        
        alleMatchenDB = data;
        buildFilterUI();
        renderStats();

    } catch (err) {
        loader.innerText = "Fout bij ophalen.";
        loader.style.display = 'block';
    }
}

function renderStats() {
    const loader = document.getElementById('loading-msg');
    const container = document.getElementById('stats-container');

    // Toepassen van de filters op de data!
    let data = alleMatchenDB;
    if (filterCategorie) data = data.filter(m => m.categorie === filterCategorie);
    if (filterType) data = data.filter(m => m.type_wedstrijd === filterType);

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
        container.innerHTML = `<div class="empty-state">Geen statistieken gevonden voor deze filter.</div>`;
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

    const cardStyle = "background: #fff; padding: 20px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);";
    const titleStyle = "font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px 0;";
    const statBoxStyle = "background: #f8fafc; padding: 15px; border-radius: 12px;";

    let html = '';

    const totaleGoalsNum = veldGoals + keeperGoals;
    const goalBarW = Math.min((totaleGoalsNum / 30) * 100, 100); 

    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Productiviteit</h3>
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

    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Vorm & Impact</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">${vormHtml}</div>
                <div style="text-align: right;">
                    <span style="display: block; font-size: 20px; font-weight: 800; color: #111827;">${teambelangPerc}%</span>
                    <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Teambelang</span>
                </div>
            </div>
        </div>
    `;

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
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    laadStats(speler);
};

document.addEventListener('DOMContentLoaded', () => laadStats('Lou'));
