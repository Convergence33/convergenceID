// Données (seront chargées depuis fiches.json)
let fiches = [];
let communes = [];

// Charge les données depuis fiches.json
async function chargerDonnees() {
  try {
    const response = await fetch('fiches.json');
    const data = await response.json();
    fiches = data.fiches;
    communes = data.communes;
    afficherCommunes();
    afficherGalerie();
    chargerEtat();
  } catch (error) {
    console.error("Erreur de chargement :", error);
    alert("Impossible de charger les données. Vérifie que fiches.json existe et est valide.");
  }
}

// Charge l'état depuis localStorage
function chargerEtat() {
  const saved = localStorage.getItem('fichesDebloquees');
  if (saved) {
    const debloquees = JSON.parse(saved);
    fiches.forEach(f => {
      f.debloque = debloquees.includes(f.id);
    });
  }
  afficherGalerie(); // Rafraîchit l'affichage après chargement
}

// Sauvegarde l'état
function sauvegarderEtat() {
  const debloquees = fiches.filter(f => f.debloque).map(f => f.id);
  localStorage.setItem('fichesDebloquees', JSON.stringify(debloquees));
  console.log("État sauvegardé :", debloquees); // Log pour débogage
}

// Affiche les communes dans le filtre
function afficherCommunes() {
  const select = document.getElementById('filtre-commune');
  select.innerHTML = `
    <option value="">Toutes les communes</option>
    ${communes.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
  `;
  select.addEventListener('change', (e) => afficherGalerie(e.target.value));
}

// Affiche la galerie (filtrée si besoin)
function afficherGalerie(communeId = null) {
  const galerie = document.getElementById('galerie');
  const fichesAFiltrer = communeId
    ? fiches.filter(f => f.commune.toLowerCase() === communeId.toLowerCase())
    : fiches;
  galerie.innerHTML = fichesAFiltrer.map(fiche => `
    <div class="fiche ${fiche.debloque ? '' : 'verrouillee'}"
         onclick="${fiche.debloque ? `afficherFiche('${fiche.id}')` : ''}">
      ${fiche.debloque ?
        `<img src="${fiche.image}" alt="${fiche.titre}" loading="lazy">` :
        '<div style="width:100px;height:100px;background:#ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;">???</div>'}
      <p>${fiche.titre}</p>
    </div>
  `).join('');
}

// Affiche une fiche dans la modale
function afficherFiche(id) {
  const fiche = fiches.find(f => f.id === id);
  document.getElementById('modal-content').innerHTML = `
    <h2>${fiche.titre}</h2>
    ${fiche.contenu}
    <button class="fermer" onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
  `;
  document.getElementById('modal').classList.add('active');
}

// Démarre le scan de QR code
function demarrerScan() {
  const video = document.getElementById('video');
  video.style.display = 'block';
  const codeReader = new ZXing.BrowserQRCodeReader();

  codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
    if (result) {
      video.style.display = 'none';
      const id = result.text.trim(); // Supprime les espaces éventuels
      console.log("QR code scanné :", id); // Log pour débogage

      const fiche = fiches.find(f => f.id === id);
      if (!fiche) {
        console.error("Fiche non trouvée pour l'ID :", id);
        alert(`Aucune fiche ne correspond à l'ID "${id}". Vérifie le QR code.`);
        return;
      }

      if (fiche.debloque) {
        alert(`La fiche "${fiche.titre}" est déjà débloquée !`);
      } else {
        fiche.debloque = true;
        sauvegarderEtat();
        afficherGalerie();
        afficherFiche(id);
        console.log("Fiche débloquée :", fiche.titre); // Log de confirmation
      }
    }

    if (err) {
      video.style.display = 'none';
      if (!(err instanceof ZXing.NotFoundException)) {
        console.error("Erreur de scan :", err);
        alert("Erreur lors du scan. Réessaye ou vérifie les permissions de la caméra.");
      }
      // Ne pas afficher d'erreur pour "QR code non trouvé" (comportement normal)
    }
  });
}

// Ferme la modale en cliquant hors du contenu
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('active');
  }
});

// Initialisation
chargerDonnees();