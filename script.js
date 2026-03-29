// Déclaration UNIQUE de la variable fiches
let fiches = [];

// Charge les données
async function chargerDonnees() {
  try {
    const response = await fetch('fiches.json');
    const data = await response.json();
    fiches = data.fiches;
    afficherGalerie();
    chargerEtat();
  } catch (error) {
    console.error("Erreur de chargement :", error);
  }
}

// Affiche les fiches
function afficherGalerie() {
  const galerie = document.getElementById('galerie');
  galerie.innerHTML = fiches.map(fiche => `
    <div class="fiche" onclick="afficherFiche('${fiche.id}')">
      <img src="${fiche.image}" alt="${fiche.titre}">
      <p>${fiche.titre}</p>
    </div>
  `).join('');
}

// Autres fonctions (demarrerScan, afficherFiche, etc.)...