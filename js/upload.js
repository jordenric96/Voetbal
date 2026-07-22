// Variabelen voor de autocomplete
let bekendeTegenstanders = [];
let geselecteerdBestaandLogo = null;

// 1. PINCODE LOGICA
window.checkPin = async function() {
    const pin = document.getElementById('pincode-input').value;
    
    if (pin === "0204") {
        document.getElementById('pin-screen').style.display = "none";
        document.getElementById('form-screen').style.display = "block";
        document.getElementById('datum').valueAsDate = new Date();
        
        // Zodra ingelogd: start met ophalen van eerdere tegenstanders op de achtergrond!
        await haalPloegenOp();
        setupAutocomplete();
    } else {
        document.getElementById('pin-error').style.display = "block";
        document.getElementById('pincode-input').value = ""; 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('pincode-input');
    if (pinInput) {
        pinInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                window.checkPin();
            }
        });
    }
});

// ==========================================
// 2. AUTOCOMPLETE LOGICA
// ==========================================

// Haal unieke tegenstanders + hun laatst bekende logo op
async function haalPloegenOp() {
    try {
        const { data, error } = await supabaseClient.from('wedstrijden').select('tegenstander, logo_tegenstander');
        if (error) throw error;

        // Slim ontdubbelen: We willen elke ploeg maar 1 keer tonen
        const uniekePloegenMap = new Map();
        data.forEach(match => {
            if (!match.tegenstander) return;
            const naamClean = match.tegenstander.trim();
            const naamLower = naamClean.toLowerCase();
            
            if (!uniekePloegenMap.has(naamLower)) {
                uniekePloegenMap.set(naamLower, { naam: naamClean, logo: match.logo_tegenstander });
            } else {
                // Als we hem al kenden maar toen geen logo hadden, en nu wel: update het logo
                if (!uniekePloegenMap.get(naamLower).logo && match.logo_tegenstander) {
                    uniekePloegenMap.get(naamLower).logo = match.logo_tegenstander;
                }
            }
        });
        
        // Zet om naar een simpele lijst
        bekendeTegenstanders = Array.from(uniekePloegenMap.values());
    } catch (err) {
        console.error("Fout bij ophalen tegenstanders:", err);
    }
}

function setupAutocomplete() {
    const input = document.getElementById('tegenstander');
    const lijst = document.getElementById('autocomplete-lijst');
    const fileInput = document.getElementById('logo_tegenstander');
    const logoStatus = document.getElementById('logo-gevonden-status');
    
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        lijst.innerHTML = '';
        
        // Reset logo bij elke toetsaanslag
        geselecteerdBestaandLogo = null; 
        logoStatus.style.display = 'none';

        if (!val) {
            lijst.style.display = 'none';
            return;
        }

        // Zoek naar matchende ploegen (bv. "Len" vindt "KFC Lennik")
        const matches = bekendeTegenstanders.filter(ploeg => ploeg.naam.toLowerCase().includes(val));
        
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(ploeg => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                
                // Laat een schildje zien als we geen logo hebben in de database
                const logoHtml = ploeg.logo ? `<img src="${ploeg.logo}" class="autocomplete-logo">` : `<div class="autocomplete-logo">🛡️</div>`;
                
                div.innerHTML = `${logoHtml} ${ploeg.naam}`;
                
                // Wat gebeurt er als we op een optie klikken?
                div.addEventListener('click', function() {
                    input.value = ploeg.naam; // Vul exact de juiste naam in
                    if (ploeg.logo) {
                        geselecteerdBestaandLogo = ploeg.logo; // Bewaar logo in het geheugen
                        logoStatus.style.display = 'block'; // Toon de groene "✅ Bekend logo" tekst
                    }
                    lijst.style.display = 'none'; // Verberg de lijst weer
                });
                lijst.appendChild(div);
            });
        } else {
            lijst.style.display = 'none';
        }
    });

    // Verberg lijst als we ergens anders klikken
    document.addEventListener('click', function (e) {
        if (e.target !== input) {
            lijst.style.display = 'none';
        }
    });
    
    // Als de gebruiker toch zélf een nieuw bestand kiest, overschrijven we de logica
    fileInput.addEventListener('change', function() {
        geselecteerdBestaandLogo = null;
        logoStatus.style.display = 'none';
    });
}

// ==========================================
// 3. OVERIGE FUNCTIES (Afwezigheid, Seizoen, Uploads)
// ==========================================

window.toggleKaarten = function() {
    const blok = document.getElementById('kaarten_blok');
    const checkbox = document.getElementById('heeft_kaarten');
    if (checkbox.checked) {
        blok.style.display = 'flex';
    } else {
        blok.style.display = 'none';
        // Zet terug op 0 als je het vinkje weer uitzet
        document.getElementById('geel').value = 0;
        document.getElementById('rood').value = 0;
    }
};

function berekenSeizoen(datumString) {
    if (!datumString) return "Onbekend";
    const datum = new Date(datumString);
    const jaar = datum.getFullYear();
    const maand = datum.getMonth() + 1;
    if (maand >= 7) {
        return `${jaar.toString().slice(-2)}-${(jaar + 1).toString().slice(-2)}`;
    } else {
        return `${(jaar - 1).toString().slice(-2)}-${jaar.toString().slice(-2)}`;
    }
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
    submitBtn.innerText = "Bezig met opslaan... ⏳";
    submitBtn.disabled = true;

    try {
        const logoBestand = document.getElementById('logo_tegenstander').files[0];
        const fotoBestanden = document.getElementById('fotos').files;
        
        // --- DE MAGIE: Gebruik geselecteerdBestaandLogo als basis! ---
        let logoUrl = geselecteerdBestaandLogo; 

        // Upload een nieuw logo als de gebruiker dat toch specifiek vraagt
        if (logoBestand) {
            submitBtn.innerText = "Nieuw logo uploaden...";
            logoUrl = await uploadBestandNaarSupabase(logoBestand, 'logos');
        }

        let fotoUrls = [];
        if (fotoBestanden.length > 0) {
            const compressieOpties = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            for (let i = 0; i < fotoBestanden.length; i++) {
                submitBtn.innerText = `Foto ${i + 1}/${fotoBestanden.length} uploaden...`;
                const gecomprimeerdeFoto = await imageCompression(fotoBestanden[i], compressieOpties);
                const url = await uploadBestandNaarSupabase(gecomprimeerdeFoto, 'actiefotos');
                if (url) fotoUrls.push(url);
            }
        }

        submitBtn.innerText = "Gegevens opslaan...";
        const datumVal = document.getElementById('datum').value;
        const spelerVal = document.getElementById('speler').value;
        
        const matchData = {
            id: datumVal.replace(/-/g, '') + '-' + spelerVal.toLowerCase(),
            speler: spelerVal,
            datum: datumVal,
            seizoen: berekenSeizoen(datumVal),
            type_wedstrijd: document.getElementById('type_wedstrijd').value,
            tegenstander: document.getElementById('tegenstander').value,
            locatie: document.getElementById('locatie').value,
            status: document.getElementById('status').value,
            reden_afwezig: document.getElementById('status').value === 'Afwezig' ? document.getElementById('reden_afwezig').value : null,
            weer: document.getElementById('weer').value,
            ondergrond: document.getElementById('ondergrond').value,
            score_thuis: parseInt(document.getElementById('score_thuis').value) || 0,
            score_uit: parseInt(document.getElementById('score_uit').value) || 0,
            doelpunten_speler: parseInt(document.getElementById('doelpunten').value) || 0,
            assists: parseInt(document.getElementById('assists').value) || 0,
            kaarten: {
                geel: parseInt(document.getElementById('geel').value) || 0,
                rood: parseInt(document.getElementById('rood').value) || 0
            },
            logo_tegenstander: logoUrl,
            fotos: fotoUrls
        };

        const { error } = await supabaseClient.from('wedstrijden').insert([matchData]);
        if (error) throw error;

        alert("Match succesvol opgeslagen!");
        window.location.href = "index.html";

    } catch (err) {
        console.error(err);
        alert("Er is iets misgegaan: " + err.message);
        submitBtn.innerText = "Opslaan";
        submitBtn.disabled = false;
    }
};