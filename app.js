// =========================
// DONNEES DES FICHES
// =========================

const fiches = [
  {
    id: "fiche1",
    titre: "Historique",
    image: "images/carte1.webp",
    unlocked: false
  },
  {
    id: "fiche2",
    titre: "Carte 2",
    image: "images/carte2.webp",
    unlocked: false
  },
  {
    id: "fiche3",
    titre: "Carte 3",
    image: "images/carte3.webp",
    unlocked: false
  },
  {
    id: "fiche4",
    titre: "Carte 4",
    image: "images/carte4.webp",
    unlocked: false
  },
  {
    id: "fiche5",
    titre: "Carte 5",
    image: "images/carte5.webp",
    unlocked: false
  },
  {
    id: "fiche6",
    titre: "Carte 6",
    image: "images/carte6.webp",
    unlocked: false
  }
];


// =========================
// SAUVEGARDE
// =========================

function sauvegarder() {
  localStorage.setItem("fiches", JSON.stringify(fiches));
}


// =========================
// CHARGEMENT
// =========================

function charger() {

  const data = localStorage.getItem("fiches");

  if (data) {

    const parsed = JSON.parse(data);

    parsed.forEach(p => {

      const fiche = fiches.find(f => f.id === p.id);

      if (fiche) {
        fiche.unlocked = p.unlocked;
      }

    });
  }
}


// =========================
// AFFICHAGE DES CARTES
// =========================

function afficherFiches() {

  const container = document.getElementById("fiches");

  if (!container) return;

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

        window.location.href =
          `fiche.html?id=${fiche.id}`;

      };
    }


    container.appendChild(div);

  });
}


// =========================
// DEBLOCAGE
// =========================

function debloquerFiche(id) {

  const fiche = fiches.find(f => f.id === id);


  if (fiche && !fiche.unlocked) {

    fiche.unlocked = true;

    sauvegarder();

    afficherFiches();

    alert("Fiche débloquée ! 🎉");

  }
}


// =========================
// SCANNER QR CODE
// =========================

let scannerStarted = false;
let qr = null;


function initScanner() {


  const btn = document.getElementById("scan-btn");
  const reader = document.getElementById("reader");


  if (!btn || !reader) return;



  btn.addEventListener("click", () => {


    if (!scannerStarted) {


      reader.style.display = "block";


      setTimeout(() => {

        reader.classList.add("show");

      }, 10);



      qr = new Html5Qrcode("reader");



      qr.start(

        {
          facingMode: "environment"
        },

        {
          fps: 10,
          qrbox: 250
        },


        (decodedText) => {

          debloquerFiche(decodedText);

        }

      );



      btn.innerHTML = "❌ Masquer la caméra";

      scannerStarted = true;



    } else {



      qr.stop()
      .then(() => {


        reader.classList.remove("show");


        setTimeout(() => {

          reader.style.display = "none";

        },300);



        btn.innerHTML = "📷 Scanner une fiche";

        scannerStarted = false;


      });

    }


  });

}


// =========================
// RESET APPLICATION
// =========================

function initReset() {


  const resetBtn = document.getElementById("reset-btn");


  if (!resetBtn) return;



  resetBtn.addEventListener("click", () => {


    const confirmReset =
      confirm("Réinitialiser toutes les fiches ?");


    if (confirmReset) {


      localStorage.removeItem("fiches");

      location.reload();

    }


  });

}


// =========================
// INSTALLATION PWA
// =========================

let deferredPrompt = null;


function initInstallation() {


  const installBtn =
    document.getElementById("install-btn");


  if (!installBtn) return;



  window.addEventListener(
    "beforeinstallprompt",
    (event) => {


      event.preventDefault();


      deferredPrompt = event;


      installBtn.style.display = "block";


      console.log(
        "✅ PWA installable détectée"
      );


    }
  );



  installBtn.addEventListener(
    "click",
    async () => {


      if (!deferredPrompt) return;


      deferredPrompt.prompt();


      await deferredPrompt.userChoice;


      deferredPrompt = null;


      installBtn.style.display = "none";


    }
  );

}


// =========================
// SERVICE WORKER
// =========================

function initServiceWorker() {


  if ("serviceWorker" in navigator) {


    window.addEventListener(
      "load",
      () => {


        navigator.serviceWorker
        .register("./sw.js")


        .then(() => {

          console.log(
            "✅ Service Worker enregistré"
          );

        })


        .catch(error => {

          console.error(
            "Erreur Service Worker :",
            error
          );

        });


      }
    );

  }

}



// =========================
// INITIALISATION
// =========================

window.onload = () => {


  charger();

  afficherFiches();

  initScanner();

  initReset();

  initInstallation();

  initServiceWorker();


};