let actieveSpeler = 'Lou';
let alleWedstrijden = [];
let uniekeSeizoenen = [];
let geselecteerdSeizoen = 'Alle';

const badgeColors = {
    'U6': { bg: '#fef08a', text: '#713f12' }, 'U7': { bg: '#fed7aa', text: '#7c2d12' }, 'U8': { bg: '#fecaca', text: '#7f1d1d' }, 
    'U9': { bg: '#fbcfe8', text: '#831843' }, 'U10': { bg: '#e9d5ff', text: '#581c87' }, 'U11': { bg: '#c7d2fe', text: '#312e81' }, 
    'U12': { bg: '#bae6fd', text: '#0c4a6e' }, 'U13': { bg: '#99f6e4', text: '#0f766e' }, 'U14': { bg: '#bbf7d0', text: '#14532d' }, 
    'U15': { bg: '#d9f99d', text: '#3f6212' }, 'U16': { bg: '#fde68a', text: '#92400e' }, 'U17': { bg: '#fcd34d', text: '#92400e' }, 
    'Beloften': { bg: '#e2e8f0', text: '#1e293b' }, 'Eerste Ploeg': { bg: '#1e293b', text: '#f9fafb' }, 'Veteranen': { bg: '#9ca3af', text: '#1e293b' },
    'Competitie': { bg: '#e0f2fe', text: '#0369a1' }, 'Toernooi': { bg: '#f3e8ff', text: '#7e22ce' }, 'Vriendschappelijk': { bg: '#dcfce7', text: '#15803d' }, 
    'Thuis': { bg: '#e0e7ff', text: '#3730a3' }, 'Uit': { bg: '#ffedd5', text: '#9a3412' }, 'Standaard': { bg: '#f3f4f6', text: '#4b5563' }
};

function getBadgeHtml(waarde) {
    if (!waarde) return ''; const style = badgeColors[waarde] || badgeColors['Standaard'];
    return `<span style="display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${style.bg}; color: ${style.text}; border: 1px solid ${style.bg}; margin-right: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${waarde}</span>`;
}

window.wisselSpeler = function(evt, speler) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    actieveSpeler = speler;
    if (speler === 'Lou') document.documentElement.style.setProperty('--brand-color', '#F34213');
    else document.documentElement.style.setProperty('--brand-color', '#ef476f');
    geselecteerdSeizoen = 'Alle';
    renderMatchen();
};

window.openVoegToe = function() { window.location.href = 'add-match.html'; };

async function initApp() {
    const container = document.getElementById('match-list');
    container.innerHTML = '<p class="empty-state">Wedstrijden inladen... ⏳</p>';
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').order('datum', { ascending: false });
        if (error) throw error;
        alleWedstrijden = data || [];
        renderMatchen();
    } catch (e) { container.innerHTML = '<p class="empty-state">Fout bij laden van wedstrijden.</p>'; }
}

function renderMatchen() {
    const container = document.getElementById('match-list');
    container.innerHTML = '';
    
    let gefilterd = alleWedstrijden.filter(m => m.speler === actieveSpeler);
    uniekeSeizoenen = [...new Set(gefilterd.map(m => m.seizoen).filter(Boolean))].sort().reverse();
    
    // Seizoensfilter opbouwen
    const filterContainer = document.getElementById('seizoen-filter-container');
    if(filterContainer) {
        let filterHtml = `<button onclick="kiesSeizoen('Alle')" style="padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; border: none; white-space: nowrap; cursor: pointer; transition: all 0.2s; background: ${geselecteerdSeizoen === 'Alle' ? 'var(--brand-color)' : '#f1f5f9'}; color: ${geselecteerdSeizoen === 'Alle' ? '#fff' : '#64748b'};">Alle</button>`;
        uniekeSeizoenen.forEach(s => {
            filterHtml += `<button onclick="kiesSeizoen('${s}')" style="padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; border: none; white-space: nowrap; cursor: pointer; transition: all 0.2s; background: ${geselecteerdSeizoen === s ? 'var(--brand-color)' : '#f1f5f9'}; color: ${geselecteerdSeizoen === s ? '#fff' : '#64748b'};">${s}</button>`;
        });
        filterContainer.innerHTML = filterHtml;
    }

    if (geselecteerdSeizoen !== 'Alle') gefilterd = gefilterd.filter(m => m.seizoen === geselecteerdSeizoen);
    
    if (gefilterd.length === 0) { container.innerHTML = '<p class="empty-state">Nog geen matchen voor dit seizoen.</p>'; return; }

    // --- BEREKEN TOP DASHBOARD STATS ---
    let statsKeeper = 0, statsGoals = 0, statsAssists = 0;
    gefilterd.forEach(m => {
        const isU6 = m.categorie === 'U6';
        if (m.mini_scores && m.mini_scores.length > 0) {
            m.mini_scores.forEach(s => {
                if (s.is_doelman) statsKeeper++;
                if (!isU6) { statsGoals += (s.goals || 0); statsAssists += (s.assists || 0); }
            });
        } else {
            if (m.is_doelman) statsKeeper++;
            if (!isU6) { statsGoals += (m.doelpunten_speler || 0); statsAssists += (m.assists || 0); }
        }
    });

    container.innerHTML += `
        <div style="background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #e5e7eb;">
            <div style="flex: 1; border-right: 1px solid #f1f5f9;">
                <div style="font-size: 20px; font-weight: 800; color: #1e293b;">${gefilterd.length}</div>
                <div style="font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Matchen</div>
            </div>
            <div style="flex: 1; border-right: 1px solid #f1f5f9;">
                <div style="font-size: 20px; font-weight: 800; color: #1e293b;">${statsKeeper}</div>
                <div style="font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Keeper</div>
            </div>
            <div style="flex: 1; border-right: 1px solid #f1f5f9;">
                <div style="font-size: 20px; font-weight: 800; color: #1e293b;">${statsGoals}</div>
                <div style="font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Goals</div>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 20px; font-weight: 800; color: #1e293b;">${statsAssists}</div>
                <div style="font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Assists</div>
            </div>
        </div>
    `;

    // --- RENDER WEDSTRIJDEN ---
    gefilterd.forEach(m => {
        const datumMooi = new Date(m.datum).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
        const isToernooi = m.type_wedstrijd === 'Toernooi';
        const isU6 = m.categorie === 'U6'; 

        let tagsHtml = getBadgeHtml(m.categorie) + getBadgeHtml(m.type_wedstrijd);
        if (!isToernooi) tagsHtml += getBadgeHtml(m.locatie);

        const hasFotos = m.fotos && m.fotos.length > 0;
        const hasVideo = m.fotos && m.fotos.some(f => f.toLowerCase().match(/\.(mp4|mov|mkv|webm)$/));

        let mediaBadge = '';
        if (hasVideo) mediaBadge = `<span style="font-size: 12px;">🎥</span>`;
        else if (hasFotos) mediaBadge = `<span style="font-size: 12px;">📸</span>`;

        let headerHtml = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">${datumMooi} ${mediaBadge}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">${tagsHtml}</div>
                </div>
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #1e293b;">${isToernooi ? m.tegenstander : (m.eigen_ploeg + ' vs ' + m.tegenstander)}</h3>
        `;

        // We bouwen een tijdelijke array, of het nu een nieuwe 'mini_scores' of een oude enkele match is.
        let subMatches = [];
        if (m.mini_scores && m.mini_scores.length > 0) {
            subMatches = m.mini_scores;
        } else {
            // Oude standaardmatch fallback
            subMatches = [{
                tegenstander: m.tegenstander, logo_tegenstander: m.logo_tegenstander,
                thuis: m.score_thuis || 0, uit: m.score_uit || 0,
                goals: m.doelpunten_speler || 0, assists: m.assists || 0, is_doelman: m.is_doelman || false
            }];
        }

        let scoresHtml = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        subMatches.forEach(s => {
            let sTegen = s.tegenstander || m.tegenstander || "Onbekend";
            
            let bgStatus = '#f1f5f9', colorStatus = '#4b5563';
            if (s.thuis > s.uit) { bgStatus = m.locatie === 'Thuis' ? '#ecfdf5' : '#fef2f2'; colorStatus = m.locatie === 'Thuis' ? '#059669' : '#dc2626'; }
            if (s.thuis < s.uit) { bgStatus = m.locatie === 'Thuis' ? '#fef2f2' : '#ecfdf5'; colorStatus = m.locatie === 'Thuis' ? '#dc2626' : '#059669'; }

            let uitslagBlok = '';
            if (isU6) {
                uitslagBlok = `<div style="font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 6px; background: #fef08a; color: #713f12; text-transform: uppercase;">Speelplezier</div>`;
            } else {
                uitslagBlok = `<div style="font-weight: 800; font-size: 13px; padding: 4px 8px; border-radius: 6px; background: ${bgStatus}; color: ${colorStatus};">${s.thuis} - ${s.uit}</div>`;
            }

            let sStats = '';
            if (!isU6 && s.goals > 0) sStats += `⚽ ${s.goals} `;
            if (!isU6 && s.assists > 0) sStats += `👟 ${s.assists} `;
            if (s.is_doelman) sStats += `🧤 `;

            scoresHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                        ${s.logo_tegenstander ? `<img src="${s.logo_tegenstander}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">` : `<div style="width:20px;height:20px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;">🛡️</div>`}
                        <span style="font-size: 13px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sTegen}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 11px; font-weight: 800; color: #64748b;">${sStats}</span>
                        ${uitslagBlok}
                    </div>
                </div>
            `;
        });
        scoresHtml += `</div>`;

        const card = document.createElement('a');
        card.href = `match-detail.html?id=${m.id}`;
        card.style.cssText = "display: block; background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb; transition: transform 0.1s;";
        card.innerHTML = headerHtml + scoresHtml;
        container.appendChild(card);
    });
}

window.kiesSeizoen = function(s) { geselecteerdSeizoen = s; renderMatchen(); }
document.addEventListener('DOMContentLoaded', initApp);
