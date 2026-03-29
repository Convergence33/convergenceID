// Attend que le DOM soit entièrement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  let fiches = [];
  let communes = [];
  let scannerActive = false; // Pour éviter les scans multiples

  // Charge les données depuis fiches.json
  async function chargerDonnees() {
    try {
      const response = await fetch('fiches.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      fiches = data.fiches;
      communes = data.communes;
      afficherCommunes();
      afficherGalerie();
      chargerEtat();
    } catch (error) {
      console.error("Erreur de chargement des données :", error);
      alert("Impossible de charger les données. Vérifie que fiches.json est accessible et valide.");
    }
  }

  // Charge l'état des fiches débloquées depuis localStorage
  function chargerEtat() {
    const saved = localStorage.getItem('fichesDebloquees');
    if (saved) {
      try {
        const debloquees = JSON.parse(saved);
        fiches.forEach(f => {
          f.debloque = debloquees.includes(f.id);
        });
      } catch (e) {
        console.error("Erreur lors du chargement de l'état :", e);
      }
    }
  }

  // Sauvegarde l'état des fiches débloquées dans localStorage
  function sauvegarderEtat() {
    const debloquees = fiches.filter(f => f.debloque).map(f => f.id);
    localStorage.setItem('fichesDebloquees', JSON.stringify(debloquees));
  }

  // Affiche les communes dans le filtre
  function afficherCommunes() {
    const select = document.getElementById('filtre-commune');
    if (!select) {
      console.error("Élément filtre-commune non trouvé.");
      return;
    }
    select.innerHTML = `
      <option value="">Toutes les communes</option>
      ${communes.map(commune => `
        <option value="${commune.id}">${commune.nom}</option>
      `).join('')}
    `;
    select.addEventListener('change', (e) => afficherGalerie(e.target.value));
  }

  // Affiche les fiches (filtrées par commune si nécessaire)
  function afficherGalerie(communeId = null) {
    const galerie = document.getElementById('galerie');
    if (!galerie) {
      console.error("Élément galerie non trouvé.");
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

    const modalContent = document.getElementById('modal-content');
    if (!modalContent) {
      console.error("Élément modal-content non trouvé.");
      return;
    }

    modalContent.innerHTML = `
      <h2>${fiche.titre}</h2>
      ${fiche.contenu}
      <button class="fermer" onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
    `;
    document.getElementById('modal').classList.add('active');
  }

  // Démarre le scan de QR code avec ZXing
  function demarrerScan() {
    if (scannerActive) return; // Évite les scans multiples
    scannerActive = true;

    const video = document.getElementById('video');
    if (!video) {
      console.error("Élément vidéo non trouvé.");
      return;
    }

    video.style.display = 'block';

    setTimeout(() => {
      try {
        const codeReader = new ZXing.BrowserQRCodeReader();
        codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
          if (result) {
            video.style.display = 'none';
            scannerActive = false;
            const id = result.text.trim();
            console.log("QR code scanné :", id);

            const fiche = fiches.find(f => f.id === id);
            if (!fiche) {
              console.error(`Aucune fiche trouvée pour l'ID : ${id}`);
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
            }
          }

          if (err) {
            if (!(err instanceof ZXing.NotFoundException)) {
              console.error("Erreur ZXing :", err);
              video.style.display = 'none';
              scannerActive = false;
              alert("Erreur lors du scan. Vérifie les permissions de la caméra ou réessaye.");
            }
            // Ne pas afficher d'erreur pour "QR code non trouvé" (comportement normal)
          }
        });
      } catch (e) {
        console.error("Erreur lors de l'initialisation du scanner :", e);
        video.style.display = 'none';
        scannerActive = false;
        alert("Erreur critique lors de l'initialisation du scanner. Voir la console pour plus de détails.");
      }
    }, 500); // Délai pour laisser le temps à la caméra de s'initialiser
  }

  // Ferme la modale en cliquant hors du contenu
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Associe l'événement au bouton de scan
  const scanButton = document.getElementById('scan-button');
  if (scanButton) {
    scanButton.addEventListener('click', demarrerScan);
  }

  // Charge les données au démarrage
  chargerDonnees();
});