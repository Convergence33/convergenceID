// Données globales
let fiches = [];
let communes = [];

// Charge les données depuis fiches.json
async function chargerDonnees() {
  try {
    const response = await fetch('fiches.json');
    const data = await response.json();
    fiches = data.fiches;
    communes = data.communes;
    afficherCommunes(); // Affiche le filtre des communes
    afficherGalerie();  // Affiche toutes les fiches
    chargerEtat();      // Charge l'état des fiches débloquées
  } catch (error) {
    console.error("Erreur de chargement des données :", error);
    alert("Impossible de charger les données. Vérifie que fiches.json est accessible.");
  }
}

// Charge l'état des fiches débloquées depuis localStorage
function chargerEtat() {
  const saved = localStorage.getItem('fichesDebloquees');
  if (saved) {
    const debloquees = JSON.parse(saved);
    fiches.forEach(f => {
      f.debloque = debloquees.includes(f.id);
    });
  }
}

// Sauvegarde l'état des fiches débloquées dans localStorage
function sauvegarderEtat() {
  const debloquees = fiches.filter(f => f.debloque).map(f => f.id);
  localStorage.setItem('fichesDebloquees', JSON.stringify(debloquees));
  console.log("État sauvegardé :", debloquees);
}

// Affiche le filtre des communes
function afficherCommunes() {
  const select = document.getElementById('filtre-commune');
  if (!select) {
    console.error("Élément filtre-commune non trouvé dans le HTML.");
    return;
  }
  select.innerHTML = `
    <option value="">Toutes les communes</option>
    ${communes.map(commune => `
      <option value="${commune.id}">${commune.nom}</option>
    `).join('')}
  `;
  select.addEventListener('change', (e) => {
    afficherGalerie(e.target.value); // Filtre les fiches par commune
  });
}

// Affiche les fiches (filtrées par commune si nécessaire)
function afficherGalerie(communeId = null) {
  const galerie = document.getElementById('galerie');
  if (!galerie) {
    console.error("Élément galerie non trouvé dans le HTML.");
    return;
  }

  const fichesAFiltrer = communeId
    ? fiches.filter(fiche => fiche.commune.toLowerCase() === communeId.toLowerCase())
    : fiches;

  galerie.innerHTML = fichesAFiltrer.map(fiche => `
    <div class="fiche ${fiche.debloque ? '' : 'verrouillee'}"
         onclick="${fiche.debloque ? `afficherFiche('${fiche.id}')` : ''}">
      ${fiche.debloque ?
        `<img src="${fiche.image}" alt="${fiche.titre}" loading="lazy">` :
        '<div style="width:100px;height:100px;background:#ddd;border-radius:5px;display:flex;align-items:center;justify-content:center;">???</div>'}
      <p>${fiche.titre}</p>
      <small>${fiche.commune}</small>
    </div>
  `).join('');
}

// Affiche une fiche dans une modale
function afficherFiche(id) {
  const fiche = fiches.find(f => f.id === id);
  if (!fiche) {
    console.error(`Fiche non trouvée pour l'ID : ${id}`);
    alert(`Aucune fiche trouvée pour l'ID : ${id}`);
    return;
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) {
    console.error("Élément modal ou modal-content non trouvé dans le HTML.");
    return;
  }

  modalContent.innerHTML = `
    <h2>${fiche.titre}</h2>
    ${fiche.contenu}
    <button class="fermer" onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
  `;
  modal.classList.add('active');
}

// Démarre le scan de QR code
function demarrerScan() {
  const video = document.getElementById('video');
  video.style.display = 'block';
  const scanner = new Instascan.Scanner({ video: video });
  scanner.addListener('scan', function(content) {
    console.log("QR code scanné :", content);
    // Traite le contenu du QR code ici
    scanner.stop();
    video.style.display = 'none';
  });
  Instascan.Camera.getCameras().then(function(cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[0]);
    } else {
      alert("Aucune caméra trouvée.");
    }
  });
}

// Ferme la modale en cliquant hors du contenu
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
  chargerDonnees(); // Charge les données au démarrage
});