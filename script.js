document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  let fiches = [];
  let communes = [];

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
      console.error("Erreur:", error);
      alert("Erreur de chargement des données.");
    }
  }

  // Charge l'état
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
    select.innerHTML = `
      <option value="">Toutes les communes</option>
      ${communes.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
    `;
    select.addEventListener('change', (e) => afficherGalerie(e.target.value));
  }

  // Affiche les fiches
  function afficherGalerie(communeId = null) {
    const galerie = document.getElementById('galerie');
    const fichesAFiltrer = communeId
      ? fiches.filter(f => f.commune.toLowerCase() === communeId.toLowerCase())
      : fiches;
    galerie.innerHTML = fichesAFiltrer.map(fiche => `
      <div class="fiche ${fiche.debloque ? '' : 'verrouillee'}"
           onclick="${fiche.debloque ? `afficherFiche('${fiche.id}')` : ''}">
        ${fiche.debloque ? `<img src="${fiche.image}" alt="${fiche.titre}">` : '???'}
        <p>${fiche.titre}</p>
      </div>
    `).join('');
  }

  // Affiche une fiche
  function afficherFiche(id) {
    const fiche = fiches.find(f => f.id === id);
    document.getElementById('modal-content').innerHTML = `
      <h2>${fiche.titre}</h2>
      ${fiche.contenu}
      <button onclick="document.getElementById('modal').classList.remove('active')">Fermer</button>
    `;
    document.getElementById('modal').classList.add('active');
  }

  // Gestion du scan
  document.getElementById('scan-button').addEventListener('click', function() {
    const video = document.getElementById('video');
    video.style.display = 'block';

    setTimeout(() => {
      const codeReader = new ZXing.BrowserQRCodeReader();
      codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
        if (result) {
          video.style.display = 'none';
          const id = result.text.trim();
          const fiche = fiches.find(f => f.id === id);
          if (fiche && !fiche.debloque) {
            fiche.debloque = true;
            sauvegarderEtat();
            afficherGalerie();
            afficherFiche(id);
          }
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          video.style.display = 'none';
          alert("Erreur lors du scan.");
        }
      });
    }, 500);
  });

  // Ferme la modale
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });

  // Charge les données au démarrage
  chargerDonnees();
});