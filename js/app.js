// Functie om te wisselen tussen Lou en Noé
function openTab(evt, spelerNaam) {
    // 1. Verberg alle tab-content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // 2. Verwijder de 'active' stijl van alle knoppen
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. Toon de gekozen speler tab
    document.getElementById(spelerNaam).classList.add('active');

    // 4. Maak de aangeklikte knop visueel actief
    evt.currentTarget.classList.add('active');
}