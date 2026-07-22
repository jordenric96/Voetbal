const STANDAARD_EIGEN_PLOEG = "KV Kester Gooik";
let bekendeTegenstanders = [];
let geselecteerdBestaandLogo = null;
let bestaandEigenLogo = null;
let bestaandeFotos = []; 

window.checkPin = async function() {
    const pin = document.getElementById('pincode-input').value;
    if (pin === "0204") {
        document.getElementById('pin-screen').style.display = "none";
        document.getElementById('form-screen').style.display = "block";
        document.getElementById('datum').valueAsDate = new Date();
        document.getElementById('tegenstander').placeholder = "Ploegen laden... ⏳";
        
        await haalPloegenOp();

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            await laadWedstrijdVoorBewerken(editId);
        } else {
            // NIEUWE MATCH: Haal het geheugen van de telefoon op!
            const opgeslagenPloeg = localStorage.getItem('laatsteEigenPloeg');
            const opgeslagenLogo = localStorage.getItem('laatsteEigenLogo');
            
            if (opgeslagenPloeg) {
                document.getElementById('eigen_ploeg').value = opgeslagenPloeg;
            } else {
                document.getElementById('eigen_ploeg').value = STANDAARD_EIGEN_PLOEG;
            }

            if (opgeslagenLogo) {
                bestaandEigenLogo = opgeslagenLogo;
                const eigenLogoStatus = document.getElementById('logo-eigen-gevonden-status');
                if (eigenLogoStatus) eigenLogoStatus.style.display = 'block';
            }
            
            addScoreRow();
        }
    } else {
        const pinError = document.getElementById('pin-error');
        if (pinError) pinError.style.display = "block";
        document.getElementById('pincode-input').value = ""; 
    }
};

window.addScoreRow = function(thuis = '', uit = '', doelman = false, goals = 0, assists = 0) {
    const wrapper = document.getElementById('mini-scores-wrapper');
    const row = document.createElement('div');
    row.className = 'score-row-item';
    row.style.width = "100%"; 
    row.style.boxSizing = "border-box";
    
    row.innerHTML = `
        <!-- HEADER MET VERWIJDER KNOP -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--almond-silk); width: 100%;">
            <label style="font-size: 13px; font-weight: 900; color: var(--space-indigo); text-transform: uppercase; letter-spacing: 1px;">Wedstrijd</label>
            <button type="button" class="remove-score-btn" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0;" onclick="this.closest('.score-row-item').remove()">✖</button>
        </div>

        <!-- SCORE INPUTS (GROOT EN DUIDELIJK) -->
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; width: 100%;">
            <div style="flex: 1; text-align: center;">
                <label style="font-size: 10px; font-weight: 900; color: var(--rebecca-purple); display: block; margin-bottom: 6px; text-transform: uppercase;">Thuis</label>
                <input type="number" class="mini-score-thuis" min="0" value="${thuis}" required style="width: 100%; padding: 12px; border-radius: 10px; border: 2px solid var(--almond-silk); text-align: center; font-size: 18px; font-weight: 900; color: var(--space-indigo); box-sizing: border-box;">
            </div>
            <div style="font-weight: 900; color: var(--space-indigo); font-size: 24px; margin-top: 15px;">-</div>
            <div style="flex: 1; text-align: center;">
                <label style="font-size: 10px; font-weight: 900; color: var(--rebecca-purple); display: block; margin-bottom: 6px; text-transform: uppercase;">Uit</label>
                <input type="number" class="mini-score-uit" min="0" value="${uit}" required style="width: 100%; padding: 12px; border-radius: 10px; border: 2px solid var(--almond-silk); text-align: center; font-size: 18px; font-weight: 900; color: var(--space-indigo); box-sizing: border-box;">
            </div>
        </div>

        <!-- STATISTIEKEN VELD (KEEPER, GOALS, ASSISTS) -->
        <div style="background: #fff; padding: 15px; border-radius: 12px; border: 1px solid var(--almond-silk); width: 100%; box-sizing: border-box;">
            
            <label style="font-size: 13px; font-weight: 900; display: flex; align-items: center; cursor: pointer; color: var(--space-indigo); margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #eee;">
                <input type="checkbox" class="mini-score-doelman" ${doelman ? 'checked' : ''} style="margin-right: 12px; width: 20px; height: 20px; accent-color: var(--rebecca-purple);"> 
                🧤 Speelde als Doelman
            </label>
            
            <div style="display: flex; justify-content: space-around; align-items: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <span style="font-size: 12px; font-weight: 900; color: var(--rebecca-purple);">⚽ Goals</span>
                    <input type="number" class="mini-score-goals" min="0" value="${goals}" style="width: 65px; padding: 10px; border-radius: 8px; border: 2px solid #eee; text-align: center; font-weight: 900; font-size: 16px; color: var(--space-indigo);">
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <span style="font-size: 12px; font-weight: 900; color: var(--rebecca-purple);">👟 Assists</span>
                    <input type="number" class="mini-score-assists" min="0" value="${assists}" style="width: 65px; padding: 10px; border-radius: 8px; border: 2px solid #eee; text-align: center; font-weight: 900; font-size: 16px; color: var(--space-indigo);">
                </div>
            </div>
        </div>
    `;
    wrapper.appendChild(row);
};

async function laadWedstrijdVoorBewerken(id) {
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
            document.querySelector('header h1').innerText = "✏️ Match Bewerken";
            document.getElementById('speler').value = data.speler;
            document.getElementById('datum').value = data.datum;
            document.getElementById('tegenstander').value = data.tegenstander;
            document.getElementById('locatie').value = data.locatie;
            document.getElementById('eigen_ploeg').value = data.eigen_ploeg || STANDAARD_EIGEN_PLOEG;
            document.getElementById('categorie').value = data.categorie || 'U6';
            document.getElementById('match_format').value = data.match_format || '2v2';
            if (data.opmerking) document.getElementById('opmerking').value = data.opmerking;
            
            const wrapper = document.getElementById('mini-scores-wrapper');
            wrapper.innerHTML = ''; 
            if (data.mini_scores && data.mini_scores.length > 0) {
                data.mini_scores.forEach(s => addScoreRow(s.thuis, s.uit, s.is_doelman, s.goals, s.assists));
            } else {
                addScoreRow(data.score_thuis || 0, data.score_uit || 0, data.is_doelman, data.doelpunten_speler, data.assists);
            }

            geselecteerdBestaandLogo = data.logo_tegenstander; 
            
            if (data.logo_eigen_ploeg) {
                bestaandEigenLogo = data.logo_eigen_ploeg;
                const eigenLogoStatus = document.getElementById('logo-eigen-gevonden-status');
                if (eigenLogoStatus) eigenLogoStatus.style.display = 'block';
            }

            bestaandeFotos = data.fotos || [];
            document.getElementById('matchForm').dataset.editId = data.id;
            document.querySelector('.submit-btn').innerText = "Wijzigingen Opslaan";
        }
    } catch (err) { console.error("Fout:", err); }
}

async function haalPloegenOp() {
    try {
        const { data } = await supabaseClient.from('wedstrijden').select('tegenstander, logo_tegenstander');
        const uniekePloegenMap = new Map();
        if (data) {
            data.forEach(m => {
                if (!m.tegenstander) return;
                const naam = m.tegenstander.trim().toLowerCase();
                if (!uniekePloegenMap.has(naam)) uniekePloegenMap.set(naam, { naam: m.tegenstander.trim(), logo: m.logo_tegenstander });
                else if (!uniekePloegenMap.get(naam).logo && m.logo_tegenstander) uniekePloegenMap.get(naam).logo = m.logo_tegenstander;
            });
        }
        bekendeTegenstanders = Array.from(uniekePloegenMap.values());
        document.getElementById('tegenstander').placeholder = `Typ om te zoeken in ${bekendeTegenstanders.length} bekende ploeg(en)...`;
    } catch (err) {}
}

function setupAutocomplete() {
    const input = document.getElementById('tegenstander');
    if (!input) return;
    let lijst = document.getElementById('autocomplete-lijst');
    if (!lijst) {
        lijst = document.createElement('div'); lijst.id = 'autocomplete-lijst'; lijst.className = 'autocomplete-items';
        input.parentNode.style.position = 'relative'; input.parentNode.insertBefore(lijst, input.nextSibling);
    }
    const fileInput = document.getElementById('logo_tegenstander');
    const logoStatus = document.getElementById('logo-gevonden-status');
    
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        lijst.innerHTML = ''; geselecteerdBestaandLogo = null; if (logoStatus) logoStatus.style.display = 'none';
        if (!val) { lijst.style.display = 'none'; return; }
        const matches = bekendeTegenstanders.filter(p => p.naam.toLowerCase().includes(val));
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(p => {
                const div = document.createElement('div'); div.className = 'autocomplete-item';
                div.innerHTML = `${p.logo ? `<img src="${p.logo}" class="autocomplete-logo">` : `<div class="autocomplete-logo">🛡️</div>`} ${p.naam}`;
                div.addEventListener('mousedown', function(e) {
                    e.preventDefault(); input.value = p.naam; 
                    if (p.logo) { geselecteerdBestaandLogo = p.logo; if (logoStatus) logoStatus.style.display = 'block'; }
                    lijst.style.display = 'none'; 
                });
                lijst.appendChild(div);
            });
        } else { lijst.style.display = 'none'; }
    });
    document.addEventListener('click', function (e) { if (e.target !== input && e.target !== lijst) lijst.style.display = 'none'; });
    if (fileInput) fileInput.addEventListener('change', function() { geselecteerdBestaandLogo = null; if (logoStatus) logoStatus.style.display = 'none'; });
    
    // Verberg het 'gevonden' vinkje als de gebruiker toch handmatig een nieuw logo uploadt
    const eigenFileInput = document.getElementById('logo_eigen_ploeg');
    const eigenLogoStatus = document.getElementById('logo-eigen-gevonden-status');
    if (eigenFileInput) eigenFileInput.addEventListener('change', function() { bestaandEigenLogo = null; if(eigenLogoStatus) eigenLogoStatus.style.display = 'none'; });
}

document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('pincode-input');
    if (pinInput) pinInput.addEventListener("keypress", function(e) { if (e.key === "Enter") { e.preventDefault(); window.checkPin(); } });
    setupAutocomplete();
});

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
    submitBtn.innerText = "Bezig met valideren... ⏳"; 
    submitBtn.disabled = true;

    // 1. BEVEILIGING: VALIDATIE VAN DE DOELPUNTEN
    const scoreRows = document.querySelectorAll('.score-row-item');
    const speelLocatie = document.getElementById('locatie').value;
    let validatieFout = null;

    scoreRows.forEach((row, index) => {
        const t = parseInt(row.querySelector('.mini-score-thuis').value) || 0;
        const u = parseInt(row.querySelector('.mini-score-uit').value) || 0;
        const g = parseInt(row.querySelector('.mini-score-goals').value) || 0;
        
        // Welke score is van de eigen ploeg?
        const eigenScore = (speelLocatie === 'Thuis') ? t : u;

        if (g > eigenScore) {
            validatieFout = `Fout in Match ${index + 1}: Je speler kan geen ${g} goals maken als de eigen ploeg er maar ${eigenScore} scoort!`;
        }
    });

    if (validatieFout) {
        alert(validatieFout);
        submitBtn.innerText = "Opslaan";
        submitBtn.disabled = false;
        return; // STOP DE UPLOAD
    }

    // 2. DOORGAAN MET UPLOADEN ALS ALLES KLOPT
    try {
        const logoBestandTegenstander = document.getElementById('logo_tegenstander').files[0];
        const logoBestandEigen = document.getElementById('logo_eigen_ploeg').files[0];
        const fotoBestanden = document.getElementById('fotos').files;
        
        let logoTegenUrl = geselecteerdBestaandLogo; 
        if (logoBestandTegenstander) { submitBtn.innerText = "Logo tegen uploaden..."; logoTegenUrl = await uploadBestandNaarSupabase(logoBestandTegenstander, 'logos'); }
        
        let logoEigenUrl = bestaandEigenLogo;
        if (logoBestandEigen) { submitBtn.innerText = "Eigen logo uploaden..."; logoEigenUrl = await uploadBestandNaarSupabase(logoBestandEigen, 'logos'); }

        let fotoUrls = bestaandeFotos; 
        if (fotoBestanden.length > 0) {
            const compressieOpties = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            for (let i = 0; i < fotoBestanden.length; i++) {
                submitBtn.innerText = `Foto ${i + 1}/${fotoBestanden.length}...`;
                const gecomprimeerdeFoto = await imageCompression(fotoBestanden[i], compressieOpties);
                const url = await uploadBestandNaarSupabase(gecomprimeerdeFoto, 'actiefotos');
                if (url) fotoUrls.push(url);
            }
        }

        submitBtn.innerText = "Gegevens opslaan...";
        let miniScoresArray = [];
        let totaalThuis = 0, totaalUit = 0, totaalGoals = 0, totaalAssists = 0;
        let wasDoelmanOoit = false;
        
        scoreRows.forEach(row => {
            const t = parseInt(row.querySelector('.mini-score-thuis').value) || 0;
            const u = parseInt(row.querySelector('.mini-score-uit').value) || 0;
            const isD = row.querySelector('.mini-score-doelman').checked;
            const g = parseInt(row.querySelector('.mini-score-goals').value) || 0;
            const a = parseInt(row.querySelector('.mini-score-assists').value) || 0;
            miniScoresArray.push({ thuis: t, uit: u, is_doelman: isD, goals: g, assists: a });
            totaalThuis += t; totaalUit += u; totaalGoals += g; totaalAssists += a;
            if(isD) wasDoelmanOoit = true;
        });

        const datumVal = document.getElementById('datum').value;
        const spelerVal = document.getElementById('speler').value;
        const editId = document.getElementById('matchForm').dataset.editId;
        const ingevuldeEigenPloeg = document.getElementById('eigen_ploeg').value;
        
        let opmerkingVeld = document.getElementById('opmerking');
        
        const matchData = {
            id: editId ? editId : datumVal.replace(/-/g, '') + '-' + spelerVal.toLowerCase() + '-' + Date.now(),
            speler: spelerVal,
            datum: datumVal,
            seizoen: berekenSeizoen(datumVal),
            tegenstander: document.getElementById('tegenstander').value,
            locatie: speelLocatie,
            status: "Meegedaan",
            opmerking: opmerkingVeld ? opmerkingVeld.value : null,
            
            eigen_ploeg: ingevuldeEigenPloeg,
            logo_eigen_ploeg: logoEigenUrl,
            categorie: document.getElementById('categorie').value,
            match_format: document.getElementById('match_format').value,
            
            mini_scores: miniScoresArray,
            is_doelman: wasDoelmanOoit,
            score_thuis: totaalThuis,
            score_uit: totaalUit,
            doelpunten_speler: totaalGoals,
            assists: totaalAssists,
            logo_tegenstander: logoTegenUrl,
            fotos: fotoUrls
        };

        const { error } = await supabaseClient.from('wedstrijden').upsert([matchData]);
        if (error) throw error;

        // 3. ONTHOUD DE EIGEN PLOEG VOOR DE VOLGENDE KEER!
        localStorage.setItem('laatsteEigenPloeg', ingevuldeEigenPloeg);
        if (logoEigenUrl) {
            localStorage.setItem('laatsteEigenLogo', logoEigenUrl);
        }

        alert(editId ? "Match succesvol bijgewerkt!" : "Match succesvol opgeslagen!");
        window.location.href = "index.html";
    } catch (err) { alert("Fout: " + err.message); submitBtn.innerText = "Opslaan"; submitBtn.disabled = false; }
};