let bekendeTegenstanders = [];
let geselecteerdBestaandLogo = null;
let bestaandEigenLogo = null;
let bestaandeFotos = []; 

// 1. PINCODE LOGICA
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
            // Als we een nieuwe match maken, zet alvast 1 leeg uitslag-rijtje klaar
            addScoreRow();
        }
    } else {
        document.getElementById('pin-error').style.display = "block";
        document.getElementById('pincode-input').value = ""; 
    }
};

// 2. DYNAMISCHE MINI-SCORES (Toernooivorm toevoegen)
window.addScoreRow = function(thuis = '', uit = '') {
    const wrapper = document.getElementById('mini-scores-wrapper');
    const row = document.createElement('div');
    row.className = 'score-row-item';
    row.innerHTML = `
        <div style="flex: 1;">
            <label style="font-size: 10px; color: var(--space-indigo);">Thuis</label>
            <input type="number" class="mini-score-thuis" min="0" value="${thuis}" required style="width: 100%; padding: 8px; border-radius: 8px; border: 2px solid var(--almond-silk);">
        </div>
        <div style="font-weight: 900; color: var(--space-indigo); margin-top: 15px;">-</div>
        <div style="flex: 1;">
            <label style="font-size: 10px; color: var(--space-indigo);">Uit</label>
            <input type="number" class="mini-score-uit" min="0" value="${uit}" required style="width: 100%; padding: 8px; border-radius: 8px; border: 2px solid var(--almond-silk);">
        </div>
        <button type="button" class="remove-score-btn" onclick="this.parentElement.remove()" style="margin-top: 15px;">X</button>
    `;
    wrapper.appendChild(row);
};

// 3. BEWERKEN LOGICA
async function laadWedstrijdVoorBewerken(id) {
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
            document.querySelector('header h1').innerText = "✏️ Match Bewerken";
            
            // Standaard velden
            document.getElementById('speler').value = data.speler;
            document.getElementById('datum').value = data.datum;
            document.getElementById('tegenstander').value = data.tegenstander;
            document.getElementById('locatie').value = data.locatie;
            document.getElementById('status').value = data.status;
            window.toggleAfwezig();
            if (data.reden_afwezig) document.getElementById('reden_afwezig').value = data.reden_afwezig;
            document.getElementById('doelpunten').value = data.doelpunten_speler || 0;
            document.getElementById('assists').value = data.assists || 0;

            // Nieuwe U6 / Versie 2.0 velden invullen
            document.getElementById('eigen_ploeg').value = data.eigen_ploeg || '';
            document.getElementById('categorie').value = data.categorie || 'U6';
            document.getElementById('match_format').value = data.match_format || '2v2';
            document.getElementById('is_doelman').checked = data.is_doelman || false;
            
            // Mini scores inladen (of terugvallen op de oude enkele score)
            const wrapper = document.getElementById('mini-scores-wrapper');
            wrapper.innerHTML = ''; 
            if (data.mini_scores && data.mini_scores.length > 0) {
                data.mini_scores.forEach(score => addScoreRow(score.thuis, score.uit));
            } else if (data.score_thuis !== null && data.score_uit !== null) {
                addScoreRow(data.score_thuis, data.score_uit);
            } else {
                addScoreRow();
            }

            // Onthoud logo's en foto's
            geselecteerdBestaandLogo = data.logo_tegenstander; 
            bestaandEigenLogo = data.logo_eigen_ploeg;
            bestaandeFotos = data.fotos || [];
            
            document.getElementById('matchForm').dataset.editId = data.id;
            document.querySelector('.submit-btn').innerText = "Wijzigingen Opslaan";
        }
    } catch (err) {
        console.error("Fout bij laden bewerking:", err);
    }
}

// 4. AUTOCOMPLETE TEGENSTANDER
async function haalPloegenOp() {
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('tegenstander, logo_tegenstander');
        if (error) throw error;

        const uniekePloegenMap = new Map();
        if (data && data.length > 0) {
            data.forEach(match => {
                if (!match.tegenstander) return;
                const naamClean = match.tegenstander.trim();
                const naamLower = naamClean.toLowerCase();
                if (!uniekePloegenMap.has(naamLower)) {
                    uniekePloegenMap.set(naamLower, { naam: naamClean, logo: match.logo_tegenstander });
                } else if (!uniekePloegenMap.get(naamLower).logo && match.logo_tegenstander) {
                    uniekePloegenMap.get(naamLower).logo = match.logo_tegenstander;
                }
            });
        }
        bekendeTegenstanders = Array.from(uniekePloegenMap.values());
        document.getElementById('tegenstander').placeholder = `Typ om te zoeken in ${bekendeTegenstanders.length} bekende ploeg(en)...`;
    } catch (err) {
        document.getElementById('tegenstander').placeholder = "Kon ploegen niet laden.";
    }
}

function setupAutocomplete() {
    const input = document.getElementById('tegenstander');
    if (!input) return;

    let lijst = document.getElementById('autocomplete-lijst');
    if (!lijst) {
        lijst = document.createElement('div');
        lijst.id = 'autocomplete-lijst';
        lijst.className = 'autocomplete-items';
        input.parentNode.style.position = 'relative'; 
        input.parentNode.insertBefore(lijst, input.nextSibling);
    }

    const fileInput = document.getElementById('logo_tegenstander');
    const logoStatus = document.getElementById('logo-gevonden-status');
    
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        lijst.innerHTML = '';
        geselecteerdBestaandLogo = null; 
        if (logoStatus) logoStatus.style.display = 'none';

        if (!val) { lijst.style.display = 'none'; return; }

        const matches = bekendeTegenstanders.filter(ploeg => ploeg.naam.toLowerCase().includes(val));
        
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(ploeg => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                const logoHtml = ploeg.logo ? `<img src="${ploeg.logo}" class="autocomplete-logo">` : `<div class="autocomplete-logo">🛡️</div>`;
                div.innerHTML = `${logoHtml} ${ploeg.naam}`;
                div.addEventListener('mousedown', function(e) {
                    e.preventDefault(); 
                    input.value = ploeg.naam; 
                    if (ploeg.logo) { geselecteerdBestaandLogo = ploeg.logo; if (logoStatus) logoStatus.style.display = 'block'; }
                    lijst.style.display = 'none'; 
                });
                lijst.appendChild(div);
            });
        } else {
            lijst.style.display = 'none';
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target !== input && e.target !== lijst) lijst.style.display = 'none';
    });
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            geselecteerdBestaandLogo = null;
            if (logoStatus) logoStatus.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('pincode-input');
    if (pinInput) {
        pinInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") { event.preventDefault(); window.checkPin(); }
        });
    }
    setupAutocomplete();
});

window.toggleAfwezig = function() {
    const status = document.getElementById('status').value;
    const redenBlok = document.getElementById('reden_afwezig_blok');
    if (status === 'Afwezig') { redenBlok.style.display = 'block'; } else { redenBlok.style.display = 'none'; document.getElementById('reden_afwezig').value = ''; }
};

function berekenSeizoen(datumString) {
    if (!datumString) return "Onbekend";
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

// 5. OPSLAAN NAAR DE DATABASE
window.saveMatch = async function() {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "Bezig met opslaan... ⏳";
    submitBtn.disabled = true;

    try {
        const logoBestandTegenstander = document.getElementById('logo_tegenstander').files[0];
        const logoBestandEigen = document.getElementById('logo_eigen_ploeg').files[0];
        const fotoBestanden = document.getElementById('fotos').files;
        
        let logoTegenUrl = geselecteerdBestaandLogo; 
        if (logoBestandTegenstander) {
            submitBtn.innerText = "Logo tegenstander uploaden...";
            logoTegenUrl = await uploadBestandNaarSupabase(logoBestandTegenstander, 'logos');
        }

        let logoEigenUrl = bestaandEigenLogo;
        if (logoBestandEigen) {
            submitBtn.innerText = "Logo eigen ploeg uploaden...";
            logoEigenUrl = await uploadBestandNaarSupabase(logoBestandEigen, 'logos');
        }

        let fotoUrls = bestaandeFotos; 
        if (fotoBestanden.length > 0) {
            const compressieOpties = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            for (let i = 0; i < fotoBestanden.length; i++) {
                submitBtn.innerText = `Foto ${i + 1}/${fotoBestanden.length} uploaden...`;
                const gecomprimeerdeFoto = await imageCompression(fotoBestanden[i], compressieOpties);
                const url = await uploadBestandNaarSupabase(gecomprimeerdeFoto, 'actiefotos');
                if (url) fotoUrls.push(url);
            }
        }

        // Verzamel alle mini-scores uit het formulier
        const scoreRows = document.querySelectorAll('.score-row-item');
        let miniScoresArray = [];
        let totaalThuis = 0;
        let totaalUit = 0;
        
        scoreRows.forEach(row => {
            const t = parseInt(row.querySelector('.mini-score-thuis').value) || 0;
            const u = parseInt(row.querySelector('.mini-score-uit').value) || 0;
            miniScoresArray.push({ thuis: t, uit: u });
            totaalThuis += t;
            totaalUit += u;
        });

        submitBtn.innerText = "Gegevens opslaan...";
        const datumVal = document.getElementById('datum').value;
        const spelerVal = document.getElementById('speler').value;
        const editId = document.getElementById('matchForm').dataset.editId;
        
        const matchData = {
            id: editId ? editId : datumVal.replace(/-/g, '') + '-' + spelerVal.toLowerCase() + '-' + Date.now(),
            speler: spelerVal,
            datum: datumVal,
            seizoen: berekenSeizoen(datumVal),
            type_wedstrijd: document.getElementById('match_format').value === 'Competitie' ? 'Competitie' : 'Toernooi', 
            tegenstander: document.getElementById('tegenstander').value,
            locatie: document.getElementById('locatie').value,
            status: document.getElementById('status').value,
            reden_afwezig: document.getElementById('status').value === 'Afwezig' ? document.getElementById('reden_afwezig').value : null,
            
            // Versie 2.0 velden
            eigen_ploeg: document.getElementById('eigen_ploeg').value,
            logo_eigen_ploeg: logoEigenUrl,
            categorie: document.getElementById('categorie').value,
            match_format: document.getElementById('match_format').value,
            is_doelman: document.getElementById('is_doelman').checked,
            mini_scores: miniScoresArray,
            
            // Fallback voor oude functionaliteit
            score_thuis: totaalThuis,
            score_uit: totaalUit,
            
            doelpunten_speler: parseInt(document.getElementById('doelpunten').value) || 0,
            assists: parseInt(document.getElementById('assists').value) || 0,
            logo_tegenstander: logoTegenUrl,
            fotos: fotoUrls
        };

        const { error } = await supabaseClient.from('wedstrijden').upsert([matchData]);
        if (error) throw error;

        alert(editId ? "Match succesvol bijgewerkt!" : "Match succesvol opgeslagen!");
        window.location.href = "index.html";

    } catch (err) {
        alert("Er is iets misgegaan: " + err.message);
        submitBtn.innerText = "Opslaan";
        submitBtn.disabled = false;
    }
};