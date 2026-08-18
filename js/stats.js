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
    'U16': { bg: '#fde68a', text: '#92400e' }, 
    'U17': { bg: '#fcd34d', text: '#92400e' }, 
    'Beloften': { bg: '#e2e8f0', text: '#1e293b' },
    'Eerste Ploeg': { bg: '#111827', text: '#f9fafb' },
    'Veteranen': { bg: '#9ca3af', text: '#111827' },
    'Competitie': { bg: '#e0f2fe', text: '#0369a1' }, 
    'Toernooi': { bg: '#f3e8ff', text: '#7e22ce' }, 
    'Vriendschappelijk': { bg: '#dcfce7', text: '#15803d' }, 
    'Standaard': { bg: '#f3f4f6', text: '#4b5563' } 
};

let actieveSpeler = 'Lou';
let filterCategorie = null;
let filterType = null;
let alleMatchenDB = [];

function toggleFilter() { document.getElementById('filter-panel').classList.toggle('open'); }
function resetFilters() { filterCategorie = null; filterType = null; document.getElementById('filter-panel').classList.remove('open'); renderStats(); buildFilterUI(); }
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

    const actieveCategorieen = [...new Set(alleMatchenDB.map(m => m.categorie).filter(Boolean))].sort((a, b) => {
        const numA = parseInt(a.replace('U', '')) || 999;
        const numB = parseInt(b.replace('U', '')) || 999;
        return numA - numB;
    });
    const actieveTypes = [...new Set(alleMatchenDB.map(m => m.type_wedstrijd).filter(Boolean))].sort();

    actieveCategorieen.forEach(cat => {
        const style = badgeColors[cat] || badgeColors['Standaard'];
        const isActive = filterCategorie === cat ? 'active' : '';
        catContainer.innerHTML += `<div class="filter-chip ${isActive}" onclick="setFilter('cat', '${cat}')" style="background: ${style.bg}; color: ${style.text}; border-color: ${isActive ? style.text : 'transparent'};">${cat}</div>`;
    });

    actieveTypes.forEach(type => {
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
    loader.style.display = 'block'; container.style.display = 'none';

    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('speler', speler).order('datum', { ascending: false });
        if (error) throw error;
        alleMatchenDB = data;
        buildFilterUI(); renderStats();
    } catch (err) { loader.innerText = "Fout bij ophalen."; loader.style.display = 'block'; }
}

function renderStats() {
    const loader = document.getElementById('loading-msg');
    const container = document.getElementById('stats-container');

    let data = alleMatchenDB;
    if (filterCategorie) data = data.filter(m => m.categorie === filterCategorie);
    if (filterType) data = data.filter(m => m.type_wedstrijd === filterType);

    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state">Geen statistieken gevonden voor deze filter.</div>`;
        container.style.display = 'block'; loader.style.display = 'none'; return;
    }

    let allGames = [];
    
    let veldMatches = 0; let veldWins = 0; let veldGoals = 0; let veldAssists = 0;
    let keeperMatches = 0; let keeperWins = 0; let cleanSheets = 0; let goalsAgainst = 0; let keeperGoals = 0; 
    let totaalWins = 0; let totaalDraws = 0; let totaalLosses = 0;
    let thuisGames = 0, thuisWins = 0, thuisLosses = 0, thuisDraws = 0;
    let uitGames = 0, uitWins = 0, uitLosses = 0, uitDraws = 0;
    let oppStats = {};

    // NIEUWE VARIABELEN
    let hattricks = 0; let braces = 0; // Tweeklappers
    let totaalMinuten = 0; let totaalGeel = 0; let totaalRood = 0;

    data.forEach(m => {
        if (m.mini_scores && m.mini_scores.length > 0) {
            m.mini_scores.forEach(score => {
                const isThuis = m.locatie === 'Thuis';
                const eigenScore = isThuis ? score.thuis : score.uit;
                const tegenScore = isThuis ? score.uit : score.thuis;
                const tegenstanderNaam = score.tegenstander || m.tegenstander || "Onbekend";
                const isWin = eigenScore > tegenScore;
                const isDraw = eigenScore === tegenScore;
                const isLoss = eigenScore < tegenScore;
                const margin = eigenScore - tegenScore;
                
                const scoreGoals = score.goals || 0;
                
                // Extra berekeningen
                if (scoreGoals === 2) braces++;
                if (scoreGoals >= 3) hattricks++;
                totaalMinuten += (score.minuten || 0);
                totaalGeel += (score.geel || 0);
                totaalRood += (score.rood || 0);

                allGames.push({
                    datumMooi: new Date(m.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }),
                    tegenstander: tegenstanderNaam,
                    eigenScore: eigenScore, tegenScore: tegenScore,
                    isWin: isWin, isDraw: isDraw, isLoss: isLoss,
                    margin: margin, goals: scoreGoals
                });

                if (isWin) totaalWins++;
                if (isDraw) totaalDraws++;
                if (isLoss) totaalLosses++;

                if (isThuis) { thuisGames++; if (isWin) thuisWins++; if (isLoss) thuisLosses++; if (isDraw) thuisDraws++; } 
                else { uitGames++; if (isWin) uitWins++; if (isLoss) uitLosses++; if (isDraw) uitDraws++; }

                if (!oppStats[tegenstanderNaam]) oppStats[tegenstanderNaam] = { count: 0, wins: 0, draws: 0, losses: 0 };
                oppStats[tegenstanderNaam].count++;
                if (isWin) oppStats[tegenstanderNaam].wins++;
                if (isDraw) oppStats[tegenstanderNaam].draws++;
                if (isLoss) oppStats[tegenstanderNaam].losses++;

                if (score.is_doelman) {
                    keeperMatches++;
                    if (isWin) keeperWins++;
                    if (tegenScore === 0) cleanSheets++; 
                    goalsAgainst += tegenScore;
                    keeperGoals += scoreGoals;
                } else {
                    veldMatches++;
                    if (isWin) veldWins++;
                    veldGoals += scoreGoals;
                    veldAssists += (score.assists || 0);
                }
            });
        }
    });

    let biggestWin = null, biggestLoss = null, maxGoalsGame = null;
    allGames.forEach(g => {
        if (g.isWin) { if (!biggestWin || g.margin > biggestWin.margin) biggestWin = g; }
        if (g.isLoss) { if (!biggestLoss || g.margin < biggestLoss.margin) biggestLoss = g; }
        if (g.goals > 0) { if (!maxGoalsGame || g.goals > maxGoalsGame.goals) maxGoalsGame = g; }
    });

    let currentStreak = 0, maxStreak = 0;
    let currentStreakMatches = [], bestStreakMatches = [];
    let allGamesChronological = [...allGames].reverse();
    allGamesChronological.forEach(g => {
        if (g.isWin) {
            currentStreak++; currentStreakMatches.push(g);
            if (currentStreak > maxStreak) { maxStreak = currentStreak; bestStreakMatches = [...currentStreakMatches]; }
        } else { currentStreak = 0; currentStreakMatches = []; }
    });

    let mostPlayedOpp = null, maxPlayed = 0;
    for (let opp in oppStats) {
        if (oppStats[opp].count > maxPlayed) { maxPlayed = oppStats[opp].count; mostPlayedOpp = { name: opp, ...oppStats[opp] }; }
    }

    let vormLijst = allGames.slice(0, 5).map(g => g.isWin ? 'W' : (g.isDraw ? 'D' : 'L')).reverse();
    let vormHtml = '';
    vormLijst.forEach(result => {
        if (result === 'W') vormHtml += `<span style="background: #ecfdf5; color:#059669; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">W</span>`;
        else if (result === 'D') vormHtml += `<span style="background: #f1f5f9; color:#64748b; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">G</span>`;
        else vormHtml += `<span style="background: #fef2f2; color:#dc2626; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:10px; font-weight:800; margin-right:6px;">V</span>`;
    });
    if(vormLijst.length === 0) vormHtml = `<span style="font-size:12px; color:#9ca3af;">Geen data</span>`;

    loader.style.display = 'none';
    const cardStyle = "background: #fff; padding: 20px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);";
    const titleStyle = "font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px 0;";
    const statBoxStyle = "background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9;";

    let html = '';
    const totaleGoalsNum = veldGoals + keeperGoals;
    let totaalMiniMatches = veldMatches + keeperMatches;
    
    // G/A Ratio (Directe goal contributie per gespeelde match)
    const goalContribRatio = totaalMiniMatches > 0 ? ((totaleGoalsNum + veldAssists) / totaalMiniMatches).toFixed(2) : "0.00";

    // CARD 1: PRODUCTIVITEIT
    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Productiviteit</h3>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
                <div style="flex: 1; border-right: 1px solid #e2e8f0;">
                    <span style="font-size: 36px; font-weight: 800; color: #111827; line-height: 1; display: block;">${totaleGoalsNum}</span>
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Goals</span>
                </div>
                <div style="flex: 1; padding-left: 20px;">
                    <span style="font-size: 36px; font-weight: 800; color: #4b5563; line-height: 1; display: block;">${veldAssists}</span>
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assists</span>
                </div>
            </div>
            
            <h3 style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 15px 0 10px 0; border-top: 1px solid #f1f5f9; padding-top: 15px;">Vorm (Laatste 5)</h3>
            <div style="display: flex; align-items: center;">${vormHtml}</div>
        </div>
    `;

    // CARD NIEUW: GEVAAR VOOR DOEL (Hattricks & Contributie)
    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Gevaar voor het doel</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div style="${statBoxStyle}; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <span style="font-size: 28px; font-weight: 800; color: #111827; line-height: 1; margin-bottom: 4px;">${goalContribRatio}</span>
                    <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: center;">G/A Ratio<br>(Betrokken bij x goals per match)</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="${statBoxStyle}; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Hat-tricks (3+)</span>
                        <span style="font-size: 18px; font-weight: 800; color: #111827;">${hattricks}</span>
                    </div>
                    <div style="${statBoxStyle}; padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Tweeklappers</span>
                        <span style="font-size: 18px; font-weight: 800; color: #111827;">${braces}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // CARD NIEUW: DISCIPLINE & INZET
    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Discipline & Speeltijd</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div style="${statBoxStyle}; text-align: center; padding: 15px 10px;">
                    <span style="font-size: 24px; font-weight: 800; color: #111827; display: block; margin-bottom: 4px;">${totaalMinuten}'</span>
                    <span style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Gespeeld</span>
                </div>
                <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; text-align: center; padding: 15px 10px;">
                    <span style="font-size: 24px; font-weight: 800; color: #a16207; display: block; margin-bottom: 4px;">${totaalGeel}</span>
                    <span style="font-size: 9px; font-weight: 800; color: #854d0e; text-transform: uppercase;">Geel 🟨</span>
                </div>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; text-align: center; padding: 15px 10px;">
                    <span style="font-size: 24px; font-weight: 800; color: #b91c1c; display: block; margin-bottom: 4px;">${totaalRood}</span>
                    <span style="font-size: 9px; font-weight: 800; color: #991b1b; text-transform: uppercase;">Rood 🟥</span>
                </div>
            </div>
        </div>
    `;

    // CARD REEKSEN & RECORDS
    let streakDetailHtml = '';
    if (maxStreak > 0) {
        bestStreakMatches.forEach(m => {
            streakDetailHtml += `<div style="padding: 4px 0; border-bottom: 1px solid #e2e8f0;">• ${m.eigenScore}-${m.tegenScore} vs <b>${m.tegenstander}</b></div>`;
        });
    }

    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Records</h3>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                <div style="${statBoxStyle}">
                    <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight:800; display:block; margin-bottom: 4px;">Langste Winstreeks</span>
                    <div style="font-size: 24px; font-weight: 800; color: #059669; margin-bottom: 6px;">${maxStreak} Matchen</div>
                    <div style="font-size: 10px; color: #64748b; max-height: 100px; overflow-y: auto;">
                        ${maxStreak > 0 ? streakDetailHtml : 'Nog geen reeks.'}
                    </div>
                </div>

                <div style="${statBoxStyle}; border-left: 3px solid #059669;">
                    <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight:800; display:block; margin-bottom: 2px;">Grootste Overwinning</span>
                    ${biggestWin ? `
                        <div style="font-size: 16px; font-weight: 800; color: #111827;">${biggestWin.eigenScore} - ${biggestWin.tegenScore} vs ${biggestWin.tegenstander}</div>
                        <span style="font-size: 10px; color: #94a3b8;">${biggestWin.datumMooi}</span>
                    ` : '<span style="font-size: 12px; color: #94a3b8;">Geen overwinning geregistreerd.</span>'}
                </div>

                <div style="${statBoxStyle}; border-left: 3px solid #dc2626;">
                    <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight:800; display:block; margin-bottom: 2px;">Zwaarste Verlies</span>
                    ${biggestLoss ? `
                        <div style="font-size: 16px; font-weight: 800; color: #111827;">${biggestLoss.eigenScore} - ${biggestLoss.tegenScore} vs ${biggestLoss.tegenstander}</div>
                        <span style="font-size: 10px; color: #94a3b8;">${biggestLoss.datumMooi}</span>
                    ` : '<span style="font-size: 12px; color: #94a3b8;">Geen verlies geregistreerd.</span>'}
                </div>

                <div style="${statBoxStyle}; border-left: 3px solid #111827;">
                    <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight:800; display:block; margin-bottom: 2px;">Persoonlijk Record (Meeste Goals)</span>
                    ${maxGoalsGame ? `
                        <div style="font-size: 16px; font-weight: 800; color: #111827;">${maxGoalsGame.goals} Goals gescoord</div>
                        <span style="font-size: 10px; color: #94a3b8;">Tegen ${maxGoalsGame.tegenstander} (${maxGoalsGame.datumMooi})</span>
                    ` : '<span style="font-size: 12px; color: #94a3b8;">Nog niet gescoord.</span>'}
                </div>
            </div>
        </div>
    `;

    // CARD THUIS VS UIT
    const thuisWinPerc = thuisGames > 0 ? Math.round((thuisWins / thuisGames) * 100) : 0;
    const uitWinPerc = uitGames > 0 ? Math.round((uitWins / uitGames) * 100) : 0;
    
    html += `
        <div style="${cardStyle}">
            <h3 style="${titleStyle}">Thuisvoordeel (Locatie Ratio)</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="${statBoxStyle}">
                    <span style="font-size: 10px; font-weight: 800; color: #3730a3; display: block; margin-bottom: 4px; text-transform: uppercase;">Thuis</span>
                    <span style="font-size: 24px; font-weight: 800; color: #111827; display: block;">${thuisWinPerc}% <span style="font-size: 12px; color: #64748b;">Winst</span></span>
                    <span style="font-size: 10px; font-weight: 600; color: #94a3b8;">${thuisWins}W - ${thuisDraws}G - ${thuisLosses}V<br>(${thuisGames} matchen)</span>
                </div>
                <div style="${statBoxStyle}">
                    <span style="font-size: 10px; font-weight: 800; color: #9a3412; display: block; margin-bottom: 4px; text-transform: uppercase;">Uit / Verplaatsing</span>
                    <span style="font-size: 24px; font-weight: 800; color: #111827; display: block;">${uitWinPerc}% <span style="font-size: 12px; color: #64748b;">Winst</span></span>
                    <span style="font-size: 10px; font-weight: 600; color: #94a3b8;">${uitWins}W - ${uitDraws}G - ${uitLosses}V<br>(${uitGames} matchen)</span>
                </div>
            </div>
        </div>
    `;

    // CARD AARTSRIVAAL
    if (mostPlayedOpp) {
        html += `
            <div style="${cardStyle}">
                <h3 style="${titleStyle}">Aartsrivaal</h3>
                <div style="${statBoxStyle}">
                    <span style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase;">Vaakst Gespeeld Tegen</span>
                    <span style="font-size: 18px; font-weight: 800; color: #111827; display: block;">${mostPlayedOpp.name}</span>
                    <span style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 4px; display: block;">${mostPlayedOpp.count} Keer ontmoet</span>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #111827;">
                        Balans: <span style="color:#059669;">${mostPlayedOpp.wins} W</span> - <span style="color:#64748b;">${mostPlayedOpp.draws} G</span> - <span style="color:#dc2626;">${mostPlayedOpp.losses} V</span>
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
