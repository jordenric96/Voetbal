// js/upload.js

// 1. PINCODE LOGICA
window.checkPin = function() {
    const pin = document.getElementById('pincode-input').value;
    
    // Jouw geheime code (pas dit getal aan naar wens)
    if (pin === "0204") {
        document.getElementById('pin-screen').style.display = "none";
        document.getElementById('form-screen').style.display = "block";
        // Zet datum automatisch op vandaag nadat ontgrendeld is
        document.getElementById('datum').valueAsDate = new Date();
    } else {
        document.getElementById('pin-error').style.display = "block";
        document.getElementById('pincode-input').value = ""; // Maak veld leeg
    }
};

// Laat "Enter" toets ook werken voor de pincode
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

// Functie voor afwezigheid
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

// Upload functie
async function uploadBestandNaarSupabase(bestand, mapNaam) {
    const bestandsNaam = `${mapNaam}/${Date.now()}-${bestand.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    const { data, error } = await supabaseClient.storage
        .from('media')
        .upload(bestandsNaam, bestand);

    if (error) {
        console.error("Fout bij uploaden:", error);
        return null;
    }
    
    const { data: publicUrlData } = supabaseClient.storage.from('media').getPublicUrl(bestandsNaam);
    return publicUrlData.publicUrl;
}

// Data opslaan
window.saveMatch = async function() {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "Bezig met opslaan... ⏳";
    submitBtn.disabled = true;

    try {
        const logoBestand = document.getElementById('logo_tegenstander').files[0];
        const fotoBestanden = document.getElementById('fotos').files;
        
        let logoUrl = null;
        let fotoUrls = [];

        if (logoBestand) {
            submitBtn.innerText = "Logo uploaden...";
            logoUrl = await uploadBestandNaarSupabase(logoBestand, 'logos');
        }

        if (fotoBestanden.length > 0) {
            const compressieOpties = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

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
            
            // Nieuwe velden voor omstandigheden
            weer: document.getElementById('weer').value,
            ondergrond: document.getElementById('ondergrond').value,
            
            score_thuis: parseInt(document.getElementById('score_thuis').value) || 0,
            score_uit: parseInt(document.getElementById('score_uit').value) || 0,
            
            doelpunten_speler: parseInt(document.getElementById('doelpunten').value) || 0,
            // Nieuw veld voor assists
            assists: parseInt(document.getElementById('assists').value) || 0,
            
            kaarten: {
                geel: parseInt(document.getElementById('geel').value) || 0,
                rood: parseInt(document.getElementById('rood').value) || 0
            },
            logo_tegenstander: logoUrl,
            fotos: fotoUrls
        };

        const { error } = await supabaseClient
            .from('wedstrijden')
            .insert([matchData]);

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