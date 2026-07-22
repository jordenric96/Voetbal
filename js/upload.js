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
        
        // Zodra ingelogd: start met ophalen van eerdere tegenstanders!
        document.getElementById('tegenstander').placeholder = "Ploegen laden... ⏳";
        await haalPloegenOp();
    } else {
        document.getElementById('pin-error').style.display = "block";
        document.getElementById('pincode-input').value = ""; 
    }
};

// ==========================================
// 2. AUTOCOMPLETE LOGICA
// ==========================================
async function haalPloegenOp() {
    try {
        const { data, error } = await supabaseClient
            .from('wedstrijden')
            .select('tegenstander, logo_tegenstander');
            
        if (error) {
            alert("Fout bij ophalen ploegen: " + error.message);
            throw error;
        }

        const uniekePloegenMap = new Map();
        
        if (data && data.length > 0) {
            data.forEach(match => {
                if (!match.tegenstander) return;
                const naamClean = match.tegenstander.trim();
                const naamLower = naamClean.toLowerCase();
                
                if (!uniekePloegenMap.has(naamLower)) {
                    uniekePloegenMap.set(naamLower, { naam: naamClean, logo: match.logo_tegenstander });
                } else {
                    if (!uniekePloegenMap.get(naamLower).logo && match.logo_tegenstander) {
                        uniekePloegenMap.get(naamLower).logo = match.logo_tegenstander;
                    }
                }
            });
        }
        
        bekendeTegenstanders = Array.from(uniekePloegenMap.values());
        
        // VISUELE CHECK: Laat in het vakje zien hoeveel ploegen hij kent!
        document.getElementById('tegenstander').placeholder = `Typ om te zoeken in ${bekendeTegenstanders.length} bekende ploeg(en)...`;
        
    } catch (err) {
        console.error("Fout bij ophalen tegenstanders:", err);
        document.getElementById('tegenstander').placeholder = "Kon ploegen niet laden.";
    }
}

function setupAutocomplete() {
    const input = document.getElementById('tegenstander');
    const lijst = document.getElementById('autocomplete-lijst');
    const fileInput = document.getElementById('logo_tegenstander');
    const logoStatus = document.getElementById('logo-gevonden-status');
    
    input.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        lijst.innerHTML = '';
        geselecteerdBestaandLogo = null; 
        logoStatus.style.display = 'none';

        if (!val) {
            lijst.style.display = 'none';
            return;
        }

        const matches = bekendeTegenstanders.filter(ploeg => ploeg.naam.toLowerCase().includes(val));
        
        if (matches.length > 0) {
            lijst.style.display = 'block';
            matches.forEach(ploeg => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                
                const logoHtml = ploeg.logo 
                    ? `<img src="${ploeg.logo}" class="autocomplete-logo">` 
                    : `<div class="autocomplete-logo">🛡️</div>`;
                
                div.innerHTML = `${logoHtml} ${ploeg.naam}`;
                
                // Muisklik op een ploeg
                div.addEventListener('mousedown', function(e) {
                    e.preventDefault(); // Voorkomt dat het toetsenbord sluit voor de klik registreert
                    input.value = ploeg.naam; 
                    if (ploeg.logo) {
                        geselecteerdBestaandLogo = ploeg.logo; 
                        logoStatus.style.display = 'block'; 
                    }
                    lijst.style.display = 'none'; 
                });
                lijst.appendChild(div);
            });
        } else {
            lijst.style.display = 'none';
        }
    });

    // Verberg lijst als we ergens anders klikken
    input.addEventListener('blur', function () {
        // Kleine vertraging zodat de klik op het lijstje eerst kan registreren
        setTimeout(() => { lijst.style.display = 'none'; }, 150);
    });
    
    fileInput.addEventListener('change', function() {
        geselecteerdBestaandLogo = null;
        logoStatus.style.display = 'none';
    });
}

// Start de setup zodra de pagina inlaadt
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
    setupAutocomplete();
});

// ==========================================
// 3. OVERIGE FUNCTIES
// ==========================================
window.toggleAfwezig = function() {
    const status = document.getElementById('status').value;
    const redenBlok = document.getElementById('reden_afwezig_blok');
    if (status === 'Afwezig') {
        redenBlok.style.display = 'block';
    } else {
        redenBlok.style.display = 'none';
        document.getElementById('reden_afwezig').value = '';
    }
};

window.toggleKaarten = function() {
    const blok = document.getElementById('kaarten_blok');
    const checkbox = document.getElementById('heeft_kaarten');
    if (checkbox.checked) {
        blok.style.display = 'flex';
    } else {
        blok.style.display = 'none';
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
        
        let logoUrl = geselecteerdBestaandLogo; 

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
            // Uniek ID met toevoeging van Date.now() zodat deze nooit dubbel is
            id: datumVal.replace(/-/g, '') + '-' + spelerVal.toLowerCase() + '-' + Date.now(),
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