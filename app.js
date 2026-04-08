const fiches = [
  { id: "fiche1", titre: "Carte 1", image: "images/carte1.webp", unlocked: false },
  { id: "fiche2", titre: "Carte 2", image: "images/carte2.webp", unlocked: false },
  { id: "fiche3", titre: "Carte 3", image: "images/carte3.webp", unlocked: false }
];

// sauvegarde
function sauvegarder() {
  localStorage.setItem("fiches", JSON.stringify(fiches));
}

// chargement
function charger() {
  const data = localStorage.getItem("fiches");
  if (data) {
    const parsed = JSON.parse(data);
    parsed.forEach(p => {
      const fiche = fiches.find(f => f.id === p.id);
      if (fiche) fiche.unlocked = p.unlocked;
    });
  }
}

// affichage
function afficherFiches() {
  const container = document.getElementById("fiches");
  container.innerHTML = "";

  fiches.forEach(fiche => {
    const div = document.createElement("div");
    div.className = "fiche";

    if (!fiche.unlocked) {
      div.classList.add("locked");
      div.innerHTML = "🔒 Verrouillée";
    } else {
      div.innerHTML = `
        <h3>${fiche.titre}</h3>
        <img src="${fiche.image}">
      `;

      div.onclick = () => {
        window.location.href = `fiche.html?id=${fiche.id}`;
      };
    }

    container.appendChild(div);
  });
}

// déblocage
function debloquerFiche(id) {
  const fiche = fiches.find(f => f.id === id);

  if (fiche && !fiche.unlocked) {
    fiche.unlocked = true;
    sauvegarder();
    afficherFiches();
    alert("Fiche débloquée ! 🎉");
  }
}

// scanner (au clic)
let scannerStarted = false;

function initScanner() {
  document.getElementById("scan-btn").addEventListener("click", () => {

    if (scannerStarted) return;

    document.getElementById("reader").style.display = "block";

    const qr = new Html5Qrcode("reader");

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        debloquerFiche(decodedText);
      }
    );

    scannerStarted = true;
  });
}

// init
window.onload = () => {
  charger();
  afficherFiches();
  initScanner();
};