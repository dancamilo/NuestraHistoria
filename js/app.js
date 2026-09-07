/* ============================================================
   APP.JS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initLockScreen();
  initNav();
  initHeroNames();
  initCounter();
  initCarousel();
  initSpotify();

  if (!FIREBASE_LISTO) {
    showFirebaseWarning();
    return; // sin Firebase no hay guardado compartido
  }

  initTimeline();
  initGrowth();
  initDreams();
  initSongs();
  initNotes();
  initTodos();
});

/* ---------- utilidades ---------- */
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 3200);
}

function formatFecha(date) {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function showFirebaseWarning() {
  const bar = document.createElement("div");
  bar.style.cssText =
    "background:#F4D9A3;color:#5C4A1E;padding:10px 20px;text-align:center;font-size:0.85rem;";
  bar.textContent =
    "Configura Firebase en js/firebase-config.js para que las notas, pendientes, sueños y fechas se guarden. Mira el README.";
  document.body.prepend(bar);
}

/* ---------- pantalla de entrada ---------- */
function initLockScreen() {
  const lockScreen = document.getElementById("lockScreen");
  const site = document.getElementById("site");
  const form = document.getElementById("lockForm");
  const input = document.getElementById("lockInput");
  const error = document.getElementById("lockError");

  if (localStorage.getItem("accesoConcedido") === "true") {
    lockScreen.remove();
    site.hidden = false;
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value.trim().toLowerCase();
    if (val === CONFIG.claveSecreta.toLowerCase()) {
      localStorage.setItem("accesoConcedido", "true");
      lockScreen.remove();
      site.hidden = false;
    } else {
      error.hidden = false;
      input.value = "";
      input.focus();
    }
  });
}

/* ---------- navegación ---------- */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav-links");
  toggle.addEventListener("click", () => links.classList.toggle("open"));

  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );

  const sections = document.querySelectorAll("section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navAnchors.forEach((a) => a.classList.remove("active"));
          const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (active) active.classList.add("active");
        }
      });
    },
    { rootMargin: "-50% 0px -45% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

/* ---------- hero ---------- */
function initHeroNames() {
  document.getElementById("heroNombreEl").textContent = CONFIG.nombreEl;
  document.getElementById("heroNombreElla").textContent = CONFIG.nombreElla;
  document.getElementById("noteAutorEl").textContent = CONFIG.nombreEl;
  document.getElementById("noteAutorEl").value = CONFIG.nombreEl;
  document.getElementById("noteAutorElla").textContent = CONFIG.nombreElla;
  document.getElementById("noteAutorElla").value = CONFIG.nombreElla;
}

function initCounter() {
  const inicio = new Date(CONFIG.fechaInicio + "T00:00:00");
  const dias = Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 86400000));
  const el = document.getElementById("diasJuntos");
  let n = 0;
  const step = Math.max(1, Math.floor(dias / 60));
  const timer = setInterval(() => {
    n += step;
    if (n >= dias) {
      n = dias;
      clearInterval(timer);
    }
    el.textContent = n;
  }, 20);
}

/* ---------- carrusel ---------- */
function initCarousel() {
  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const fotos = CONFIG.fotos;
  let index = 0;

  fotos.forEach((foto, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.innerHTML = `
      <img src="${foto.src}" alt="${foto.titulo}">
      <div class="slide-caption">
        <span class="titulo">${foto.titulo}</span>
        <span class="fecha">${foto.fecha}</span>
      </div>`;
    const img = slide.querySelector("img");
    img.addEventListener("error", () => slide.classList.add("no-image"));
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(i) {
    index = (i + fotos.length) % fotos.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll(".dot").forEach((d, di) => d.classList.toggle("active", di === index));
  }

  document.getElementById("carouselPrev").addEventListener("click", () => goTo(index - 1));
  document.getElementById("carouselNext").addEventListener("click", () => goTo(index + 1));

  if (fotos.length > 1) {
    setInterval(() => goTo(index + 1), 6000);
  }
}

/* ---------- spotify ---------- */
function initSpotify() {
  const url = CONFIG.spotifyPlaylistUrl || "";
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  const id = match ? match[1] : "";
  if (id) {
    document.getElementById("spotifyFrame").src = `https://open.spotify.com/playlist/6tbcUkbr5lvA3L3pwxZy3f?si=8BZHjz2USdWMdg-mIcfq9Q&utm_source=copy-link`;
  }
}

/* ---------- notificaciones + canciones ---------- */
function initSongs() {
  const notifyBtn = document.getElementById("notifyPermBtn");
  const addBtn = document.getElementById("addSongBtn");
  const log = document.getElementById("songLog");

  updateNotifyBtn();

  notifyBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      toast("Este navegador no soporta notificaciones.");
      return;
    }
    const perm = await Notification.requestPermission();
    updateNotifyBtn();
    if (perm === "granted") toast("Notificaciones activadas 💙");
  });

  addBtn.addEventListener("click", () => {
    db.collection("songs").add({
      mensaje: "Se agregó una canción nueva a la playlist 🎵",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast("Avisado. La canción quedó en el registro.");
  });

  let primeraCarga = true;
  db.collection("songs")
    .orderBy("timestamp", "desc")
    .limit(20)
    .onSnapshot((snapshot) => {
      log.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const li = document.createElement("li");
        const fecha = d.timestamp ? formatFecha(d.timestamp.toDate()) : "";
        li.textContent = `${d.mensaje} — ${fecha}`;
        log.appendChild(li);
      });

      if (primeraCarga) {
        primeraCarga = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && Notification.permission === "granted") {
          new Notification("Nueva canción 🎵", {
            body: change.doc.data().mensaje,
            icon: ""
          });
        }
      });
    });

  function updateNotifyBtn() {
    if ("Notification" in window && Notification.permission === "granted") {
      notifyBtn.textContent = "Notificaciones activadas ✓";
      notifyBtn.disabled = true;
    }
  }
}

/* ---------- timeline ---------- */
function initTimeline() {
  const form = document.getElementById("timelineForm");
  const list = document.getElementById("timelineList");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fecha = document.getElementById("timelineFecha").value;
    const titulo = document.getElementById("timelineTitulo").value.trim();
    if (!fecha || !titulo) return;
    db.collection("timeline").add({ fecha, titulo });
    form.reset();
  });

  db.collection("timeline").orderBy("fecha", "asc").onSnapshot((snapshot) => {
    list.innerHTML = "";
    snapshot.forEach((doc) => {
      const d = doc.data();
      const item = document.createElement("div");
      item.className = "timeline-item";
      const fecha = new Date(d.fecha + "T00:00:00");
      item.innerHTML = `
        <span class="timeline-date">${formatFecha(fecha)}</span>
        <span class="timeline-title">${d.titulo}</span>`;
      list.appendChild(item);
    });
  });
}

/* ---------- creciendo juntos ---------- */
function initGrowth() {
  document.getElementById("pageElTitulo").textContent = CONFIG.nombreEl;
  document.getElementById("pageEllaTitulo").textContent = CONFIG.nombreElla;

  document.querySelectorAll('#creciendo form[data-persona]').forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const persona = form.dataset.persona;
      const defecto = form.querySelector(".growth-defecto").value.trim();
      const compromiso = form.querySelector(".growth-compromiso").value.trim();
      if (!defecto || !compromiso) return;
      db.collection("growth").add({
        persona,
        defecto,
        compromiso,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      form.reset();
    });
  });

  db.collection("growth").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
    const listEl = document.getElementById("growthListEl");
    const listElla = document.getElementById("growthListElla");
    listEl.innerHTML = "";
    listElla.innerHTML = "";
    snapshot.forEach((doc) => {
      const d = doc.data();
      const li = document.createElement("li");
      li.className = "growth-item";
      li.innerHTML = `<span class="defecto">${d.defecto}</span><span class="compromiso">${d.compromiso}</span>`;
      (d.persona === "el" ? listEl : listElla).appendChild(li);
    });
  });
}

/* ---------- sueños ---------- */
function initDreams() {
  const form = document.getElementById("dreamForm");
  const list = document.getElementById("dreamList");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("dreamInput").value.trim();
    if (!texto) return;
    db.collection("dreams").add({
      texto,
      cumplido: false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.reset();
  });

  db.collection("dreams").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
    list.innerHTML = "";
    snapshot.forEach((doc) => {
      const d = doc.data();
      const li = document.createElement("li");
      li.className = "dream-item" + (d.cumplido ? " achieved" : "");
      li.innerHTML = `
        <input type="checkbox" ${d.cumplido ? "checked" : ""}>
        <span class="dream-text">${d.texto}</span>`;
      li.querySelector("input").addEventListener("change", (ev) => {
        db.collection("dreams").doc(doc.id).update({ cumplido: ev.target.checked });
      });
      list.appendChild(li);
    });
  });
}

/* ---------- notas: pensé en ti ---------- */
function initNotes() {
  const form = document.getElementById("noteForm");
  const feed = document.getElementById("notesFeed");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("noteText").value.trim();
    const autor = document.getElementById("noteAutor").value;
    if (!texto) return;
    db.collection("notes").add({
      texto,
      autor,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.reset();
  });

  db.collection("notes")
    .orderBy("timestamp", "desc")
    .limit(50)
    .onSnapshot((snapshot) => {
      feed.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const card = document.createElement("div");
        card.className = "note-card";
        const fecha = d.timestamp ? formatFecha(d.timestamp.toDate()) : "";
        card.innerHTML = `
          ${d.autor ? `<span class="autor">${d.autor}</span>` : ""}
          <p>${d.texto}</p>
          <span class="fecha">${fecha}</span>`;
        feed.appendChild(card);
      });
    });
}

/* ---------- pendientes ---------- */
function initTodos() {
  const form = document.getElementById("todoForm");
  const pendingList = document.getElementById("todoPending");
  const doneList = document.getElementById("todoDone");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("todoInput").value.trim();
    if (!texto) return;
    db.collection("todos").add({
      texto,
      hecho: false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.reset();
  });

  db.collection("todos").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
    pendingList.innerHTML = "";
    doneList.innerHTML = "";
    snapshot.forEach((doc) => {
      const d = doc.data();
      const li = document.createElement("li");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = d.hecho;
      check.addEventListener("change", (ev) => {
        db.collection("todos").doc(doc.id).update({ hecho: ev.target.checked });
      });

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = d.texto;

      const remove = document.createElement("button");
      remove.className = "todo-remove";
      remove.textContent = "✕";
      remove.addEventListener("click", () => db.collection("todos").doc(doc.id).delete());

      li.append(check, span, remove);
      (d.hecho ? doneList : pendingList).appendChild(li);
    });
  });
}