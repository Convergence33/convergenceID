let fiches = [];
let communes = [];
let scanner = null;

// Charge les données
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
    JSON.parse(saved).forEach(id => {
      const fiche = fiches.find(f => f.id === id);
      if (fiche) fiche.debloque = true;
    });
  }
}

// Sauvegarde l'état
function sauvegarderEtat() {
  const debloquees = fiches.filter(f => f.debloque).map(f => f.id);
  localStorage.setItem('fichesDebloquees', JSON.stringify(debloquees));
}

// Affiche les communes
function afficherCommunes() {
  const select = document.getElementById('filtre-commune');
  if (select) {
    select.innerHTML = `
      <option value="">Toutes les communes</option>
      ${communes.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
    `;
    select.addEventListener('change', (e) => afficherGalerie(e.target.value));
  }
}

// Affiche les fiches
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
    </div>
  `).join('');
}

// Affiche une fiche
function afficherFiche(id) {
  const fiche = fiches.find(f => f.id === id);
  if (!fiche) return;
  document.getElementById('modal-content').innerHTML = `
    <h2>${fiche.titre}</h2>
    ${fiche.contenu}
    <button onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
  `;
  document.getElementById('modal').classList.add('active');
}

// Démarre le scan avec Instascan
function demarrerScan() {
  const video = document.getElementById('video');
  if (!video) return;
  video.style.display = 'block';

  // Arrête le scanner précédent s'il existe
  if (scanner) scanner.stop();

  // Vérifie que Instascan est chargé
  if (typeof Instascan === 'undefined') {
    alert("Instascan n'est pas chargé. Vérifie la connexion Internet ou recharge la page.");
    video.style.display = 'none';
    return;
  }

  scanner = new Instascan.Scanner({ video: video });
  scanner.addListener('scan', function(content) {
    const id = content.trim();
    const fiche = fiches.find(f => f.id === id);
    if (fiche && !fiche.debloque) {
      fiche.debloque = true;
      sauvegarderEtat();
      afficherGalerie();
      afficherFiche(id);
    }
    scanner.stop();
    video.style.display = 'none';
  });

  Instascan.Camera.getCameras()
    .then(cameras => {
      if (cameras.length > 0) {
        scanner.start(cameras[cameras.length - 1]); // Utilise la dernière caméra (souvent la caméra arrière)
      } else {
        alert("Aucune caméra détectée.");
        video.style.display = 'none';
      }
    })
    .catch(err => {
      console.error("Erreur Instascan :", err);
      alert("Erreur lors de l'initialisation du scanner.");
      video.style.display = 'none';
    });
}

// Ferme la modale
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
  chargerDonnees();
});