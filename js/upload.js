const STANDAARD_EIGEN_PLOEG = "KV Kester Gooik";
let bekendeTegenstanders = [];
let geselecteerdBestaandLogo = null;
let bestaandEigenLogo = null;
let bestaandeFotos = []; 

// --- CUSTOM PIN TOETSENBORD LOGICA ---
let currentPin = '';

window.addPinDigit = function(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDots();
        if (currentPin.length === 4) setTimeout(verifyPin, 150); 
    }
};

window.removePinDigit = function() {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDots();
    }
};

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    if (!dots.length) return; 
    dots.forEach((dot, index) => {
        dot.classList.remove('error'); 
        if (index < currentPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
    });
}

function verifyPin() {
    if (currentPin === "0204") {
        ontgrendelNieuweMatch();
    } else {
        const dotsContainer = document.getElementById('pin-dots');
        const dots = document.querySelectorAll('.pin-dot');
        if (dotsContainer) {
            dotsContainer.classList.add('shake');
            dots.forEach(dot => { dot.classList.add('error'); dot.classList.remove('filled'); });
            setTimeout(() => {
                dotsContainer.classList.remove('shake');
                currentPin = '';
                updatePinDots(); 
            }, 400);
        }
    }
}

window.checkPin = function() {
    const pin = document.getElementById('pincode-input').value;
    if(pin === "0204") ontgrendelNieuweMatch();
    else { const err = document.getElementById('pin-error'); if(err) err.style.display = 'block'; }
};

async function ontgrendelNieuweMatch() {
    document.getElementById('pin-screen').style.display = "none";
    document.getElementById('form-screen').style.display = "block";
    document.getElementById('datum').valueAsDate = new Date();
    
    try { await haalPloegenOp(); } catch(e) { console.warn(e); }

    const opgeslagenPloeg = localStorage.getItem('laatsteEigenPloeg');
    bestaandEigenLogo = localStorage.getItem('laatsteEigenLogo');
    
    if (opgeslagenPloeg) { document.getElementById('eigen_ploeg').value = opgeslagenPloeg; } 
    else { document.getElementById('eigen_ploeg').value = STANDAARD_EIGEN_PLOEG; }
    
    addScoreRow();
    toggleWedstrijdType();
}

// --- AUTO-UNLOCK BIJ BEWERKEN ---
document.addEventListener('DOMContentLoaded', async () => {
    setupAutocomplete();
    
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        document.getElementById('pin-screen').style.display = "none";
        document.getElementById('form-screen').style.display = "block";
        
        try { await haalPloegenOp(); } catch(e) { console.warn(e); }
        await laadWedstrijdVoorBewerken(editId);
    }
    
    const pinInput = document.getElementById('pincode-input');
    if (pinInput) pinInput.addEventListener("keypress", function(e) { if (e.key === "Enter") { e.preventDefault(); window.checkPin(); } });
});

// --- STANDAARD MATCH LOGICA ---
window.checkTegenstanderLogo = function() {
    const container = document.getElementById('global-logo-tegenstander-container');
    if(!container) return;
    const type = document.getElementById('type_wedstrijd').value;
    if (type === 'Toernooi') { container.style.display = 'none'; return; }

    const inputVal = document.getElementById('tegenstander').value.toLowerCase().trim();
    const match = bekendeTegenstanders.find(p => p.naam.toLowerCase() === inputVal);
    
    if (match && match.logo) { container.style.display = 'none'; geselecteerdBestaandLogo = match.logo; } 
    else if (inputVal !== "") { container.style.display = 'block'; geselecteerdBestaandLogo = null; } 
    else { container.style.display = 'none'; geselecteerdBestaandLogo = null; }
};

window.toggleWedstrijdType = function() {
    const type = document.getElementById('type_wedstrijd').value;
    const isToernooi = (type === 'Toernooi');
    document.getElementById('label-tegenstander').innerText = isToernooi ? 'Naam Toernooi (bv. Tornooi Galmaarden)' : 'Tegenstander';
    document.getElementById('tegenstander').placeholder = isToernooi ? 'Typ toernooinaam...' : 'Typ om te zoeken in ploegen...';
    document.querySelectorAll('.row-tegenstander-container').forEach(el => { el.style.display = isToernooi ? 'block' : 'none'; });
    checkTegenstanderLogo();
};

window.addScoreRow = function(eigen = '', tegen = '', doelman = false, goals = 0, assists = 0, rowTegenstander = '', rowLogo = '', minuten = '', geel = 0, rood = 0) {
    const wrapper = document.getElementById('mini-scores-wrapper');
    const row = document.createElement('div');
    row.className = 'score-row-item';
    row.style.width = "100%"; 
    
    const isToernooi = document.getElementById('type_wedstrijd') && document.getElementById('type_wedstrijd').value === 'Toernooi';
    const displayStyle = isToernooi ? 'block' : 'none';

    row.innerHTML = `
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Uitslag & Details</span>
                <button type="button" onclick="this.closest('.score-row-item').remove()" style="background: #fef2f2; color: #dc2626; border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s;">✕</button>
            </div>

            <div class="row-tegenstander-container" style="display: ${displayStyle}; margin-bottom: 20px;">
                <label style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Tegenstander</label>
                <input type="text" class="row-tegenstander-input" placeholder="Typ ploegnaam..." value="${rowTegenstander}" data-logo="${rowLogo}" autocomplete="off" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e5e7eb; font-weight: 600; font-size: 14px; background: #f8fafc;">
            </div>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <label style="font-size: 10px; font-weight: 800; color: #111827; display: block; margin-bottom: 6px; text-transform: uppercase; text-align: center;">Eigen Ploeg</label>
                    <input type="number" class="mini-score-eigen" min="0" value="${eigen}" required style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 22px; font-weight: 800; color: #111827; background: #f8fafc;">
                </div>
                <div style="font-weight: 800; color: #94a3b8; font-size: 16px; margin-top: 18px;">-</div>
                <div style="flex: 1;">
                    <label style="font-size: 10px; font-weight: 800; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; text-align: center;">Tegenstander</label>
                    <input type="number" class="mini-score-tegen" min="0" value="${tegen}" required style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; font-size: 22px; font-weight: 800; color: #111827; background: #f8fafc;">
                </div>
            </div>

            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                    <label style="display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;">
                        <input type="checkbox" class="mini-score-doelman" ${doelman ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #111827; cursor: pointer;"> 
                        Speelde als Keeper
                    </label>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Minuten</label>
                        <input type="number" class="mini-score-minuten" min="0" placeholder="0" value="${minuten}" style="width: 60px; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 14px; background: #fff;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="font-size: 10px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase;">Goals</label>
                        <input type="number" class="mini-score-goals" min="0" value="${goals}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 16px; background: #fff;">
                    </div>
                    <div>
                        <label style="font-size: 10px; font-weight: 700; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase;">Assists</label>
                        <input type="number" class="mini-score-assists" min="0" value="${assists}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 16px; background: #fff;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="font-size: 10px; font-weight: 700; color: #ca8a04; display: block; margin-bottom: 6px; text-transform: uppercase;">Geel 🟨</label>
                        <input type="number" class="mini-score-geel" min="0" value="${geel}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #fef08a; text-align: center; font-weight: 700; font-size: 16px; background: #fefce8; color: #854d0e;">
                    </div>
                    <div>
                        <label style="font-size: 10px; font-weight: 700; color: #dc2626; display: block; margin-bottom: 6px; text-transform: uppercase;">Rood 🟥</label>
                        <input type="number" class="mini-score-rood" min="0" value="${rood}" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; text-align: center; font-weight: 700; font-size: 16px; background: #fef2f2; color: #991b1b;">
                    </div>
                </div>
            </div>
        </div>
    `;
    wrapper.appendChild(row);

    const rowInput = row.querySelector('.row-tegenstander-input');
    setupRowAutocomplete(rowInput);
};

function setupRowAutocomplete(input) {
    let lijst = document.createElement('div'); lijst.className = 'autocomplete-items'; input.parentNode.appendChild(lijst);
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim(); lijst.innerHTML = ''; this.dataset.logo = ''; 
        if (!val) { lijst.style.display = 'none'; return; }
        const matches = bekendeTegenstanders.filter(p => p.naam.toLowerCase().includes(val));
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(p => {
                const div = document.createElement('div'); div.className = 'autocomplete-item';
                div.innerHTML = `${p.logo ? `<img src="${p.logo}" class="autocomplete-logo">` : `🛡️`} ${p.naam}`;
                div.addEventListener('mousedown', function(e) { e.preventDefault(); input.value = p.naam; input.dataset.logo = p.logo || ''; lijst.style.display = 'none'; });
                lijst.appendChild(div);
            });
        } else { lijst.style.display = 'none'; }
    });
    input.addEventListener('blur', () => { setTimeout(() => lijst.style.display = 'none', 200); });
}

async function laadWedstrijdVoorBewerken(id) {
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
            document.querySelector('header h1').innerText = "✏️ Match Bewerken";
            document.getElementById('speler').value = data.speler;
            document.getElementById('datum').value = data.datum;
            document.getElementById('type_wedstrijd').value = data.type_wedstrijd || 'Competitie';
            document.getElementById('tegenstander').value = data.tegenstander;
            document.getElementById('locatie').value = data.locatie;
            document.getElementById('eigen_ploeg').value = data.eigen_ploeg || STANDAARD_EIGEN_PLOEG;
            document.getElementById('categorie').value = data.categorie || 'U6';
            document.getElementById('match_format').value = data.match_format || '2v2';
            if (data.opmerking) document.getElementById('opmerking').value = data.opmerking;
            
            toggleWedstrijdType();

            const wrapper = document.getElementById('mini-scores-wrapper');
            wrapper.innerHTML = ''; 
            
            const isThuisGlobal = data.locatie === 'Thuis';

            if (data.mini_scores && data.mini_scores.length > 0) {
                data.mini_scores.forEach(s => {
                    const eigen = isThuisGlobal ? s.thuis : s.uit;
                    const tegen = isThuisGlobal ? s.uit : s.thuis;
                    addScoreRow(eigen, tegen, s.is_doelman, s.goals, s.assists, s.tegenstander, s.logo_tegenstander, s.minuten || '', s.geel || 0, s.rood || 0);
                });
            } else {
                const eigen = isThuisGlobal ? (data.score_thuis || 0) : (data.score_uit || 0);
                const tegen = isThuisGlobal ? (data.score_uit || 0) : (data.score_thuis || 0);
                addScoreRow(eigen, tegen, data.is_doelman, data.doelpunten_speler, data.assists);
            }

            geselecteerdBestaandLogo = data.logo_tegenstander; bestaandEigenLogo = data.logo_eigen_ploeg || null;
            checkTegenstanderLogo(); bestaandeFotos = data.fotos || [];
            document.getElementById('matchForm').dataset.editId = data.id;
            document.querySelector('.submit-btn').innerText = "Wijzigingen Opslaan";
        }
    } catch (err) { console.error("Fout:", err); }
}

async function haalPloegenOp() {
    const uniekePloegenMap = new Map();
    try {
        const { data: ploegenData } = await supabaseClient.from('ploegen').select('naam, logo_url');
        if (ploegenData) ploegenData.forEach(p => uniekePloegenMap.set(p.naam.trim().toLowerCase(), { naam: p.naam.trim(), logo: p.logo_url }));
    } catch (err) {}
    try {
        const { data: matchData } = await supabaseClient.from('wedstrijden').select('tegenstander, logo_tegenstander');
        if (matchData) {
            matchData.forEach(m => {
                if (!m.tegenstander) return;
                const naam = m.tegenstander.trim().toLowerCase();
                if (!uniekePloegenMap.has(naam)) uniekePloegenMap.set(naam, { naam: m.tegenstander.trim(), logo: m.logo_tegenstander });
                else if (!uniekePloegenMap.get(naam).logo && m.logo_tegenstander) uniekePloegenMap.get(naam).logo = m.logo_tegenstander;
            });
        }
    } catch (err) {}
    
    bekendeTegenstanders = Array.from(uniekePloegenMap.values());
    if(document.getElementById('tegenstander')) {
        const isToernooi = document.getElementById('type_wedstrijd') && document.getElementById('type_wedstrijd').value === 'Toernooi';
        if(!isToernooi) document.getElementById('tegenstander').placeholder = `Typ om te zoeken in ${bekendeTegenstanders.length} ploeg(en)...`;
    }
}

function setupAutocomplete() {
    const input = document.getElementById('tegenstander');
    if (!input) return;
    let lijst = document.getElementById('autocomplete-lijst');
    if (!lijst) { lijst = document.createElement('div'); lijst.id = 'autocomplete-lijst'; lijst.className = 'autocomplete-items'; input.parentNode.style.position = 'relative'; input.parentNode.insertBefore(lijst, input.nextSibling); }
    const fileInput = document.getElementById('logo_tegenstander');
    
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim(); lijst.innerHTML = ''; geselecteerdBestaandLogo = null;
        if (!val) { lijst.style.display = 'none'; return; }
        const matches = bekendeTegenstanders.filter(p => p.naam.toLowerCase().includes(val));
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(p => {
                const div = document.createElement('div'); div.className = 'autocomplete-item';
                div.innerHTML = `${p.logo ? `<img src="${p.logo}" class="autocomplete-logo">` : `🛡️`} ${p.naam}`;
                div.addEventListener('mousedown', function(e) { e.preventDefault(); input.value = p.naam; if (p.logo) { geselecteerdBestaandLogo = p.logo; } lijst.style.display = 'none'; checkTegenstanderLogo(); });
                lijst.appendChild(div);
            });
        } else { lijst.style.display = 'none'; }
    });
    input.addEventListener('blur', () => { setTimeout(() => lijst.style.display = 'none', 200); });
    if (fileInput) fileInput.addEventListener('change', function() { geselecteerdBestaandLogo = null; });
}

function berekenSeizoen(datumString) {
    const datum = new Date(datumString);
    const jaar = datum.getFullYear();
    const maand = datum.getMonth() + 1;
    return maand >= 7 ? `${jaar.toString().slice(-2)}-${(jaar + 1).toString().slice(-2)}` : `${(jaar - 1).toString().slice(-2)}-${jaar.toString().slice(-2)}`;
}

async function uploadBestandNaarSupabase(bestand, mapNaam) {
    const bestandsNaam = `${mapNaam}/${Date.now()}-${bestand.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data, error } = await supabaseClient.storage.from('media').upload(bestandsNaam, bestand);
    if (error) return null;
    const { data: publicUrlData } = supabaseClient.storage.from('media').getPublicUrl(bestandsNaam);
    return publicUrlData.publicUrl;
}

window.saveMatch = async function() {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "Bezig met valideren... ⏳"; submitBtn.disabled = true;

    const scoreRows = document.querySelectorAll('.score-row-item');
    const speelLocatie = document.getElementById('locatie').value;
    let validatieFout = null;

    scoreRows.forEach((row, index) => {
        const eigenScore = parseInt(row.querySelector('.mini-score-eigen').value) || 0;
        const g = parseInt(row.querySelector('.mini-score-goals').value) || 0;
        if (g > eigenScore) validatieFout = `Fout in Match ${index + 1}: Je speler kan geen ${g} goals maken als de eigen ploeg er maar ${eigenScore} scoort!`;
    });

    if (validatieFout) { alert(validatieFout); submitBtn.innerText = "Opslaan"; submitBtn.disabled = false; return; }

    try {
        const isToernooi = document.getElementById('type_wedstrijd').value === 'Toernooi';
        const logoBestandTegenstander = document.getElementById('logo_tegenstander') ? document.getElementById('logo_tegenstander').files[0] : null;
        const fotoBestanden = document.getElementById('fotos').files;
        
        let logoTegenUrl = geselecteerdBestaandLogo; 
        if (!isToernooi && logoBestandTegenstander) { submitBtn.innerText = "Logo tegen uploaden..."; logoTegenUrl = await uploadBestandNaarSupabase(logoBestandTegenstander, 'logos'); }
        
        let logoEigenUrl = bestaandEigenLogo; 
        let fotoUrls = bestaandeFotos; 

        if (fotoBestanden.length > 0) {
            const compressieOpties = { maxSizeMB: 2, maxWidthOrHeight: 2560, useWebWorker: true, initialQuality: 0.9 };
            
            for (let i = 0; i < fotoBestanden.length; i++) {
                const file = fotoBestanden[i];
                const isVideo = file.type.startsWith('video/');
                
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > 50) {
                    throw new Error(`Bestand is te groot (${fileSizeMB.toFixed(1)}MB). Maximaal 50MB toegestaan.`);
                }

                submitBtn.innerText = `Media ${i + 1}/${fotoBestanden.length}...`;

                let uploadFile = file;
                let folder = 'actiefotos';

                // Video's NIET door de fotocompressor sturen
                if (isVideo) {
                    folder = 'videos';
                } else {
                    uploadFile = await imageCompression(file, compressieOpties);
                }

                const url = await uploadBestandNaarSupabase(uploadFile, folder);
                if (url) fotoUrls.push(url);
            }
        }

        submitBtn.innerText = "Gegevens opslaan...";
        let miniScoresArray = []; let wasDoelmanOoit = false;
        const globalTegenstander = document.getElementById('tegenstander').value;

        scoreRows.forEach(row => {
            const eigenScore = parseInt(row.querySelector('.mini-score-eigen').value) || 0;
            const tegenScore = parseInt(row.querySelector('.mini-score-tegen').value) || 0;
            const isD = row.querySelector('.mini-score-doelman').checked;
            const g = parseInt(row.querySelector('.mini-score-goals').value) || 0;
            const a = parseInt(row.querySelector('.mini-score-assists').value) || 0;
            
            const minStr = row.querySelector('.mini-score-minuten').value;
            const min = minStr !== '' ? parseInt(minStr) : null;
            const geel = parseInt(row.querySelector('.mini-score-geel').value) || 0;
            const rood = parseInt(row.querySelector('.mini-score-rood').value) || 0;
            
            const t = (speelLocatie === 'Thuis') ? eigenScore : tegenScore;
            const u = (speelLocatie === 'Thuis') ? tegenScore : eigenScore;

            let subNaam = globalTegenstander; let subLogo = logoTegenUrl;
            if (isToernooi) { const subInput = row.querySelector('.row-tegenstander-input'); if(subInput) { subNaam = subInput.value || "Onbekend"; subLogo = subInput.dataset.logo || null; } }

            miniScoresArray.push({ thuis: t, uit: u, is_doelman: isD, goals: g, assists: a, tegenstander: subNaam, logo_tegenstander: subLogo, minuten: min, geel: geel, rood: rood });
            if(isD) wasDoelmanOoit = true;
        });

        const datumVal = document.getElementById('datum').value;
        const spelerVal = document.getElementById('speler').value;
        const editId = document.getElementById('matchForm').dataset.editId;
        const ingevuldeEigenPloeg = document.getElementById('eigen_ploeg').value;
        let opmerkingVeld = document.getElementById('opmerking');
        
        const matchData = {
            id: editId ? editId : datumVal.replace(/-/g, '') + '-' + spelerVal.toLowerCase() + '-' + Date.now(),
            speler: spelerVal, datum: datumVal, seizoen: berekenSeizoen(datumVal), tegenstander: globalTegenstander, 
            locatie: speelLocatie, status: "Meegedaan", opmerking: opmerkingVeld ? opmerkingVeld.value : null,
            type_wedstrijd: document.getElementById('type_wedstrijd').value, eigen_ploeg: ingevuldeEigenPloeg,
            logo_eigen_ploeg: logoEigenUrl, categorie: document.getElementById('categorie').value,
            match_format: document.getElementById('match_format').value, mini_scores: miniScoresArray, is_doelman: wasDoelmanOoit,
            score_thuis: 0, score_uit: 0, doelpunten_speler: 0, assists: 0, logo_tegenstander: logoTegenUrl, fotos: fotoUrls
        };

        const { error } = await supabaseClient.from('wedstrijden').upsert([matchData]);
        if (error) throw error;

        localStorage.setItem('laatsteEigenPloeg', ingevuldeEigenPloeg);
        if (logoEigenUrl) localStorage.setItem('laatsteEigenLogo', logoEigenUrl);

        alert(editId ? "Match succesvol bijgewerkt!" : "Match succesvol opgeslagen!");
        window.location.href = "index.html";
    } catch (err) { alert("Fout: " + err.message); submitBtn.innerText = "Opslaan"; submitBtn.disabled = false; }
};
