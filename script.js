// Données globales
let fiches = [];
let communes = [];
let scanner = null; // Variable globale pour le scanner Instascan

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
    alert("Impossible de charger les données. Vérifie que fiches.json est accessible.");
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
}

// Sauvegarde l'état dans localStorage
function sauvegarderEtat() {
  const debloquees = fiches.filter(f => f.debloque).map(f => f.id);
  localStorage.setItem('fichesDebloquees', JSON.stringify(debloquees));
}

// Affiche les communes dans le filtre
function afficherCommunes() {
  const select = document.getElementById('filtre-commune');
  if (!select) return;
  select.innerHTML = `
    <option value="">Toutes les communes</option>
    ${communes.map(commune => `<option value="${commune.id}">${commune.nom}</option>`).join('')}
  `;
  select.addEventListener('change', (e) => afficherGalerie(e.target.value));
}

// Affiche les fiches (filtrées si besoin)
function afficherGalerie(communeId = null) {
  const galerie = document.getElementById('galerie');
  if (!galerie) return;

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
      <small>${fiche.commune}</small>
    </div>
  `).join('');
}

// Affiche une fiche dans la modale
function afficherFiche(id) {
  const fiche = fiches.find(f => f.id === id);
  if (!fiche) {
    alert(`Fiche non trouvée : ${id}`);
    return;
  }
  document.getElementById('modal-content').innerHTML = `
    <h2>${fiche.titre}</h2>
    ${fiche.contenu}
    <button class="fermer" onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
  `;
  document.getElementById('modal').classList.add('active');
}

// Démarre le scan avec Instascan
function demarrerScan() {
  const video = document.getElementById('video');
  video.style.display = 'block';

  // Arrête le scanner précédent s'il existe
  if (scanner) {
    scanner.stop();
  }

  // Initialise Instascan
  scanner = new Instascan.Scanner({
    video: video,
    mirror: false, // Désactive le miroir pour les caméras frontales
    backgroundScan: false, // Désactive le scan en arrière-plan
    refractoryPeriod: 5000, // Délai entre deux scans (ms)
    continuous: true // Scan continu
  });

  // Écoute les QR codes scannés
  scanner.addListener('scan', function(content) {
    console.log("QR code scanné :", content);
    scanner.stop(); // Arrête le scanner après un scan réussi

    const id = content.trim();
    const fiche = fiches.find(f => f.id === id);

    if (!fiche) {
      alert(`Aucune fiche trouvée pour l'ID : ${id}`);
      video.style.display = 'none';
      return;
    }

    if (fiche.debloque) {
      alert(`La fiche "${fiche.titre}" est déjà débloquée !`);
    } else {
      fiche.debloque = true;
      sauvegarderEtat();
      afficherGalerie();
      afficherFiche(id);
    }

    video.style.display = 'none';
  });

  // Démarre le scanner
  Instascan.Camera.getCameras()
    .then(cameras => {
      if (cameras.length > 0) {
        // Utilise la caméra arrière par défaut (index 1 si disponible)
        const camera = cameras.length > 1 ? cameras[1] : cameras[0];
        scanner.start(camera);
        console.log("Scanner démarré avec la caméra :", camera.name);
      } else {
        console.error("Aucune caméra trouvée.");
        alert("Aucune caméra détectée. Vérifie tes périphériques.");
        video.style.display = 'none';
      }
    })
    .catch(err => {
      console.error("Erreur Instascan :", err);
      alert("Erreur lors de l'initialisation du scanner. Voir la console.");
      video.style.display = 'none';
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