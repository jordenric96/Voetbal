// js/upload.js

// Functie voor afwezigheid (stond eerst in de HTML)
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

// Algemene upload functie voor één bestand naar Supabase
async function uploadBestandNaarSupabase(bestand, mapNaam) {
    const bestandsNaam = `${mapNaam}/${Date.now()}-${bestand.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    const { data, error } = await supabaseClient.storage
        .from('media') // De naam van jouw bucket
        .upload(bestandsNaam, bestand);

    if (error) {
        console.error("Fout bij uploaden:", error);
        return null;
    }
    
    // Vraag de publieke URL op van de geüploade foto
    const { data: publicUrlData } = supabaseClient.storage.from('media').getPublicUrl(bestandsNaam);
    return publicUrlData.publicUrl;
}

// De hoofdfunctie gekoppeld aan de "Opslaan" knop
window.saveMatch = async function() {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerText = "Bezig met opslaan... ⏳";
    submitBtn.disabled = true;

    try {
        const logoBestand = document.getElementById('logo_tegenstander').files[0];
        const fotoBestanden = document.getElementById('fotos').files;
        
        let logoUrl = null;
        let fotoUrls = [];

        // 1. Logo uploaden (indien geselecteerd)
        if (logoBestand) {
            logoUrl = await uploadBestandNaarSupabase(logoBestand, 'logos');
        }

        // 2. Foto's comprimeren en uploaden
        if (fotoBestanden.length > 0) {
            const compressieOpties = {
                maxSizeMB: 0.5, // Maximaal 500kb per foto
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            for (let i = 0; i < fotoBestanden.length; i++) {
                submitBtn.innerText = `Foto ${i + 1}/${fotoBestanden.length} comprimeren...`;
                const gecomprimeerdeFoto = await imageCompression(fotoBestanden[i], compressieOpties);
                
                submitBtn.innerText = `Foto ${i + 1}/${fotoBestanden.length} uploaden...`;
                const url = await uploadBestandNaarSupabase(gecomprimeerdeFoto, 'actiefotos');
                if (url) fotoUrls.push(url);
            }
        }

        // 3. Data structureren
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
            score_thuis: parseInt(document.getElementById('score_thuis').value) || 0,
            score_uit: parseInt(document.getElementById('score_uit').value) || 0,
            doelpunten_speler: parseInt(document.getElementById('doelpunten').value) || 0,
            kaarten: {
                geel: parseInt(document.getElementById('geel').value) || 0,
                rood: parseInt(document.getElementById('rood').value) || 0
            },
            logo_tegenstander: logoUrl,
            fotos: fotoUrls
        };

        // 4. Naar database sturen
        const { error } = await supabaseClient
            .from('wedstrijden')
            .insert([matchData]);

        if (error) throw error;

        // Succes! Reset formulier en ga terug
        alert("Match succesvol opgeslagen!");
        window.location.href = "index.html";

    } catch (err) {
        console.error(err);
        alert("Er is iets misgegaan: " + err.message);
        submitBtn.innerText = "Opslaan";
        submitBtn.disabled = false;
    }
};

// Startdatum vandaag
document.addEventListener('DOMContentLoaded', () => {
    const datumVeld = document.getElementById('datum');
    if (datumVeld) datumVeld.valueAsDate = new Date();
});