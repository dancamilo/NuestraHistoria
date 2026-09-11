/* ============================================================
   APP.JS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initLockScreen();
  initNav();
  initHeroNames();
  initCounter();
  initGallery();
  initSpotify();

  if (!FIREBASE_LISTO) {
    showFirebaseWarning();
    return;
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

  if (!el) return;

  el.textContent = msg;
  el.hidden = false;

  clearTimeout(toast._t);

  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}


function formatFecha(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function showFirebaseWarning() {
  const bar = document.createElement("div");

  bar.style.cssText =
    "background:#F4D9A3;color:#5C4A1E;padding:10px 20px;text-align:center;font-size:0.85rem;";

  bar.textContent =
    "Configura Firebase en js/firebase-config.js para que las notas, pendientes, sueños y fechas se guarden.";

  document.body.prepend(bar);
}


/* ---------- pantalla de entrada ---------- */

function initLockScreen() {
  const lockScreen = document.getElementById("lockScreen");
  const site = document.getElementById("site");
  const form = document.getElementById("lockForm");
  const input = document.getElementById("lockInput");
  const error = document.getElementById("lockError");

  if (!lockScreen || !site || !form || !input || !error) return;

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

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
    });
  });

  const sections = document.querySelectorAll("section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navAnchors.forEach((a) => {
            a.classList.remove("active");
          });

          const active = document.querySelector(
            `.nav-links a[href="#${entry.target.id}"]`
          );

          if (active) {
            active.classList.add("active");
          }
        }
      });
    },
    {
      rootMargin: "-50% 0px -45% 0px"
    }
  );

  sections.forEach((s) => observer.observe(s));
}


/* ---------- hero ---------- */

function initHeroNames() {
  const heroNombreEl = document.getElementById("heroNombreEl");
  const heroNombreElla = document.getElementById("heroNombreElla");
  const noteAutorEl = document.getElementById("noteAutorEl");
  const noteAutorElla = document.getElementById("noteAutorElla");

  if (heroNombreEl) {
    heroNombreEl.textContent = CONFIG.nombreEl;
  }

  if (heroNombreElla) {
    heroNombreElla.textContent = CONFIG.nombreElla;
  }

  if (noteAutorEl) {
    noteAutorEl.textContent = CONFIG.nombreEl;
    noteAutorEl.value = CONFIG.nombreEl;
  }

  if (noteAutorElla) {
    noteAutorElla.textContent = CONFIG.nombreElla;
    noteAutorElla.value = CONFIG.nombreElla;
  }
}


function initCounter() {
  const inicio = new Date(
    CONFIG.fechaInicio + "T00:00:00"
  );

  const dias = Math.max(
    0,
    Math.floor(
      (Date.now() - inicio.getTime()) / 86400000
    )
  );

  const el = document.getElementById("diasJuntos");

  if (!el) return;

  let n = 0;

  const step = Math.max(
    1,
    Math.floor(dias / 60)
  );

  const timer = setInterval(() => {
    n += step;

    if (n >= dias) {
      n = dias;
      clearInterval(timer);
    }

    el.textContent = n;
  }, 20);
}


/* ============================================================
   GALERÍA
   ============================================================ */

function initGallery() {
  const miniGallery = document.getElementById("miniGallery");
  const openBtn = document.getElementById("openGalleryBtn");
  const modal = document.getElementById("galleryModal");
  const closeBtn = document.getElementById("galleryClose");
  const grid = document.getElementById("galleryGrid");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxDate = document.getElementById("lightboxDate");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  if (
    !miniGallery || !openBtn || !modal || !closeBtn || !grid ||
    !lightbox || !lightboxImg || !lightboxDate ||
    !lightboxClose || !lightboxPrev || !lightboxNext
  ) {
    return;
  }

  const fotos = CONFIG.fotos || [];
  if (fotos.length === 0) return;

  let lightboxIndex = 0;

  function crearThumb(foto) {
    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = foto.src;
    img.alt = "";
    img.loading = "lazy";

    img.addEventListener("error", () => {
      thumb.classList.add("no-image");
    });

    const fecha = document.createElement("span");
    fecha.className = "fecha";
    fecha.textContent = foto.fecha || "";

    thumb.appendChild(img);
    thumb.appendChild(fecha);
    return thumb;
  }

  /* Mini galería: hasta 6 fotos de muestra en la página principal */
  fotos.slice(0, 6).forEach((foto, i) => {
    const thumb = crearThumb(foto);
    thumb.addEventListener("click", () => abrirLightbox(i));
    miniGallery.appendChild(thumb);
  });

  /* Galería completa: todas las fotos */
  fotos.forEach((foto, i) => {
    const thumb = crearThumb(foto);
    thumb.addEventListener("click", () => abrirLightbox(i));
    grid.appendChild(thumb);
  });

  function abrirGaleria() {
    modal.hidden = false;
  }

  function cerrarGaleria() {
    modal.hidden = true;
  }

  openBtn.addEventListener("click", abrirGaleria);
  closeBtn.addEventListener("click", cerrarGaleria);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarGaleria();
  });

  function mostrarFoto() {
    const foto = fotos[lightboxIndex];
    lightboxImg.src = foto.src;
    lightboxDate.textContent = foto.fecha || "";
  }

  function abrirLightbox(i) {
    lightboxIndex = i;
    mostrarFoto();
    lightbox.hidden = false;
  }

  function cerrarLightbox() {
    lightbox.hidden = true;
  }

  function siguienteFoto() {
    lightboxIndex = (lightboxIndex + 1) % fotos.length;
    mostrarFoto();
  }

  function anteriorFoto() {
    lightboxIndex = (lightboxIndex - 1 + fotos.length) % fotos.length;
    mostrarFoto();
  }

  lightboxClose.addEventListener("click", cerrarLightbox);
  lightboxNext.addEventListener("click", siguienteFoto);
  lightboxPrev.addEventListener("click", anteriorFoto);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) cerrarLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") cerrarLightbox();
    if (e.key === "ArrowRight") siguienteFoto();
    if (e.key === "ArrowLeft") anteriorFoto();
  });
}



/* ---------- spotify ---------- */

function initSpotify() {
  const url =
    CONFIG.spotifyPlaylistUrl || "";

  const match =
    url.match(
      /playlist\/([a-zA-Z0-9]+)/
    );

  const id =
    match ? match[1] : "";

  if (!id) return;

  const frame =
    document.getElementById(
      "spotifyFrame"
    );

  if (!frame) return;

  frame.src =
    `https://open.spotify.com/embed/playlist/${id}`;
}


/* ---------- canciones + notificaciones ---------- */

function initSongs() {
  const notifyBtn =
    document.getElementById(
      "notifyPermBtn"
    );

  const addBtn =
    document.getElementById(
      "addSongBtn"
    );

  const log =
    document.getElementById(
      "songLog"
    );

  if (!notifyBtn || !addBtn || !log) {
    return;
  }

  updateNotifyBtn();


  notifyBtn.addEventListener(
    "click",
    async () => {

      if (!("Notification" in window)) {
        toast(
          "Este navegador no soporta notificaciones."
        );

        return;
      }

      try {
        const perm =
          await Notification.requestPermission();

        updateNotifyBtn();

        if (perm === "granted") {
          toast(
            "Notificaciones activadas 💙"
          );
        }

      } catch (error) {

        console.error(
          "ERROR NOTIFICACIONES:",
          error
        );

        toast(
          "No se pudieron activar las notificaciones."
        );
      }
    }
  );


  addBtn.addEventListener(
    "click",
    () => {

      db.collection("songs")
        .add({
          mensaje:
            "Se agregó una canción nueva a la playlist 🎵",

          timestamp:
            firebase.firestore.FieldValue
              .serverTimestamp()
        })
        .then(() => {

          toast(
            "Avisado. La canción quedó en el registro."
          );

        })
        .catch((error) => {

          console.error(
            "ERROR FIREBASE - GUARDAR SONG:",
            error
          );

          toast(
            "No se pudo guardar el registro."
          );
        });
    }
  );


  let primeraCarga = true;


  db.collection("songs")
    .orderBy("timestamp", "desc")
    .limit(20)
    .onSnapshot(
      (snapshot) => {

        log.innerHTML = "";

        snapshot.forEach((doc) => {

          const d = doc.data();

          const li =
            document.createElement(
              "li"
            );

          const fecha =
            d.timestamp &&
            typeof d.timestamp.toDate ===
              "function"
              ? formatFecha(
                  d.timestamp.toDate()
                )
              : "";

          li.textContent =
            `${d.mensaje || ""} — ${fecha}`;

          log.appendChild(li);
        });


        if (primeraCarga) {
          primeraCarga = false;
          return;
        }


        snapshot
          .docChanges()
          .forEach((change) => {

            if (
              change.type === "added" &&
              "Notification" in window &&
              Notification.permission ===
                "granted"
            ) {

              new Notification(
                "Nueva canción 🎵",
                {
                  body:
                    change.doc.data()
                      .mensaje || "",

                  icon: ""
                }
              );
            }
          });
      },
      (error) => {

        console.error(
          "ERROR FIREBASE - SONGS:",
          error
        );

        toast(
          "Error al cargar las canciones: " +
            error.message
        );
      }
    );


  function updateNotifyBtn() {

    if (
      "Notification" in window &&
      Notification.permission ===
        "granted"
    ) {

      notifyBtn.textContent =
        "Notificaciones activadas ✓";

      notifyBtn.disabled = true;
    }
  }
}


/* ---------- timeline ---------- */

function initTimeline() {
  const form =
    document.getElementById(
      "timelineForm"
    );

  const list =
    document.getElementById(
      "timelineList"
    );

  if (!form || !list) return;


  form.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();

      const fecha =
        document.getElementById(
          "timelineFecha"
        ).value;

      const titulo =
        document
          .getElementById(
            "timelineTitulo"
          )
          .value
          .trim();

      if (!fecha || !titulo) {
        return;
      }


      db.collection("timeline")
        .add({
          fecha,
          titulo
        })
        .then(() => {

          form.reset();

          toast(
            "Fecha añadida correctamente 💙"
          );

        })
        .catch((error) => {

          console.error(
            "ERROR FIREBASE - GUARDAR TIMELINE:",
            error
          );

          toast(
            "No se pudo guardar la fecha."
          );
        });
    }
  );


  db.collection("timeline")
    .orderBy("fecha", "asc")
    .onSnapshot(
      (snapshot) => {

        list.innerHTML = "";

        snapshot.forEach((doc) => {

          const d = doc.data();

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "timeline-item";


          const fecha =
            new Date(
              d.fecha + "T00:00:00"
            );


          const dateEl =
            document.createElement(
              "span"
            );

          dateEl.className =
            "timeline-date";

          dateEl.textContent =
            formatFecha(fecha);


          const titleEl =
            document.createElement(
              "span"
            );

          titleEl.className =
            "timeline-title";

          titleEl.textContent =
            d.titulo || "";


          item.append(
            dateEl,
            titleEl
          );

          list.appendChild(item);
        });
      },
      (error) => {

        console.error(
          "ERROR FIREBASE - TIMELINE:",
          error
        );

        toast(
          "Error al cargar la historia: " +
            error.message
        );
      }
    );
}


/* ---------- creciendo juntos ---------- */

function initGrowth() {
  const tituloEl =
    document.getElementById(
      "pageElTitulo"
    );

  const tituloElla =
    document.getElementById(
      "pageEllaTitulo"
    );


  if (tituloEl) {
    tituloEl.textContent =
      CONFIG.nombreEl;
  }


  if (tituloElla) {
    tituloElla.textContent =
      CONFIG.nombreElla;
  }


  document
    .querySelectorAll(
      '#creciendo form[data-persona]'
    )
    .forEach((form) => {

      form.addEventListener(
        "submit",
        (e) => {

          e.preventDefault();

          const persona =
            form.dataset.persona;


          const defecto =
            form
              .querySelector(
                ".growth-defecto"
              )
              .value
              .trim();


          const compromiso =
            form
              .querySelector(
                ".growth-compromiso"
              )
              .value
              .trim();


          if (!defecto || !compromiso) {
            return;
          }


          db.collection("growth")
            .add({
              persona,
              defecto,
              compromiso,

              timestamp:
                firebase.firestore.FieldValue
                  .serverTimestamp()
            })
            .then(() => {

              form.reset();

              toast(
                "Guardado correctamente 💙"
              );

            })
            .catch((error) => {

              console.error(
                "ERROR FIREBASE - GUARDAR GROWTH:",
                error
              );

              toast(
                "No se pudo guardar."
              );
            });
        }
      );
    });


  const listEl =
    document.getElementById(
      "growthListEl"
    );

  const listElla =
    document.getElementById(
      "growthListElla"
    );


  if (!listEl || !listElla) {
    return;
  }


  db.collection("growth")
    .orderBy("timestamp", "asc")
    .onSnapshot(
      (snapshot) => {

        listEl.innerHTML = "";
        listElla.innerHTML = "";


        snapshot.forEach((doc) => {

          const d = doc.data();


          const li =
            document.createElement(
              "li"
            );

          li.className =
            "growth-item";


          const defectoEl =
            document.createElement(
              "span"
            );

          defectoEl.className =
            "defecto";

          defectoEl.textContent =
            d.defecto || "";


          const compromisoEl =
            document.createElement(
              "span"
            );

          compromisoEl.className =
            "compromiso";

          compromisoEl.textContent =
            d.compromiso || "";


          li.append(
            defectoEl,
            compromisoEl
          );


          if (d.persona === "el") {
            listEl.appendChild(li);
          } else {
            listElla.appendChild(li);
          }
        });
      },
      (error) => {

        console.error(
          "ERROR FIREBASE - GROWTH:",
          error
        );

        toast(
          "Error al cargar crecimiento: " +
            error.message
        );
      }
    );
}


/* ---------- sueños ---------- */

function initDreams() {
  const form =
    document.getElementById(
      "dreamForm"
    );

  const list =
    document.getElementById(
      "dreamList"
    );


  if (!form || !list) {
    return;
  }


  form.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();


      const texto =
        document
          .getElementById(
            "dreamInput"
          )
          .value
          .trim();


      if (!texto) {
        return;
      }


      db.collection("dreams")
        .add({
          texto,
          cumplido: false,

          timestamp:
            firebase.firestore.FieldValue
              .serverTimestamp()
        })
        .then(() => {

          form.reset();

          toast(
            "Sueño añadido 💙"
          );

        })
        .catch((error) => {

          console.error(
            "ERROR FIREBASE - GUARDAR DREAM:",
            error
          );

          toast(
            "No se pudo guardar el sueño."
          );
        });
    }
  );


  db.collection("dreams")
    .orderBy("timestamp", "asc")
    .onSnapshot(
      (snapshot) => {

        list.innerHTML = "";


        snapshot.forEach((doc) => {

          const d = doc.data();


          const li =
            document.createElement(
              "li"
            );


          li.className =
            "dream-item" +
            (
              d.cumplido
                ? " achieved"
                : ""
            );


          const input =
            document.createElement(
              "input"
            );

          input.type = "checkbox";

          input.checked =
            d.cumplido === true;


          const span =
            document.createElement(
              "span"
            );

          span.className =
            "dream-text";

          span.textContent =
            d.texto || "";


          input.addEventListener(
            "change",
            (ev) => {

              db.collection("dreams")
                .doc(doc.id)
                .update({
                  cumplido:
                    ev.target.checked
                })
                .then(() => {

                  toast(
                    "Sueño actualizado ✓"
                  );

                })
                .catch((error) => {

                  console.error(
                    "ERROR FIREBASE - ACTUALIZAR DREAM:",
                    error
                  );

                  toast(
                    "No se pudo actualizar el sueño."
                  );
                });
            }
          );


          li.append(
            input,
            span
          );

          list.appendChild(li);
        });
      },
      (error) => {

        console.error(
          "ERROR FIREBASE - DREAMS:",
          error
        );

        toast(
          "Error al cargar los sueños: " +
            error.message
        );
      }
    );
}


/* ---------- notas: pensé en ti ---------- */

function initNotes() {
  const form =
    document.getElementById(
      "noteForm"
    );

  const feed =
    document.getElementById(
      "notesFeed"
    );


  if (!form || !feed) {
    return;
  }


  form.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();


      const texto =
        document
          .getElementById(
            "noteText"
          )
          .value
          .trim();


      const autor =
        document.getElementById(
          "noteAutor"
        ).value;


      if (!texto) {
        return;
      }


      db.collection("notes")
        .add({
          texto,
          autor,

          timestamp:
            firebase.firestore.FieldValue
              .serverTimestamp()
        })
        .then(() => {

          form.reset();

          toast(
            "Mensaje guardado 💙"
          );

        })
        .catch((error) => {

          console.error(
            "ERROR FIREBASE - GUARDAR NOTE:",
            error
          );

          toast(
            "No se pudo guardar el mensaje."
          );
        });
    }
  );


  db.collection("notes")
    .orderBy("timestamp", "desc")
    .limit(50)
    .onSnapshot(
      (snapshot) => {

        feed.innerHTML = "";


        snapshot.forEach((doc) => {

          const d = doc.data();


          const card =
            document.createElement(
              "div"
            );

          card.className =
            "note-card";


          const autorEl =
            document.createElement(
              "span"
            );

          autorEl.className =
            "autor";

          autorEl.textContent =
            d.autor || "";


          const textoEl =
            document.createElement(
              "p"
            );

          textoEl.textContent =
            d.texto || "";


          const fechaEl =
            document.createElement(
              "span"
            );

          fechaEl.className =
            "fecha";


          const fecha =
            d.timestamp &&
            typeof d.timestamp.toDate ===
              "function"
              ? formatFecha(
                  d.timestamp.toDate()
                )
              : "";


          fechaEl.textContent =
            fecha;


          if (d.autor) {
            card.appendChild(
              autorEl
            );
          }


          card.appendChild(
            textoEl
          );

          card.appendChild(
            fechaEl
          );


          feed.appendChild(card);
        });
      },
      (error) => {

        console.error(
          "ERROR FIREBASE - NOTES:",
          error
        );

        toast(
          "Error al cargar los mensajes: " +
            error.message
        );
      }
    );
}


/* ---------- pendientes ---------- */

function initTodos() {
  const form =
    document.getElementById(
      "todoForm"
    );

  const pendingList =
    document.getElementById(
      "todoPending"
    );

  const doneList =
    document.getElementById(
      "todoDone"
    );


  if (
    !form ||
    !pendingList ||
    !doneList
  ) {
    return;
  }


  form.addEventListener(
    "submit",
    (e) => {

      e.preventDefault();


      const texto =
        document
          .getElementById(
            "todoInput"
          )
          .value
          .trim();


      if (!texto) {
        return;
      }


      db.collection("todos")
        .add({
          texto,
          hecho: false,

          timestamp:
            firebase.firestore.FieldValue
              .serverTimestamp()
        })
        .then(() => {

          form.reset();

          toast(
            "Pendiente añadido 💙"
          );

        })
        .catch((error) => {

          console.error(
            "ERROR FIREBASE - GUARDAR TODO:",
            error
          );

          toast(
            "No se pudo guardar el pendiente."
          );
        });
    }
  );


  db.collection("todos")
    .orderBy("timestamp", "asc")
    .onSnapshot(
      (snapshot) => {

        pendingList.innerHTML = "";
        doneList.innerHTML = "";


        snapshot.forEach((doc) => {

          const d = doc.data();


          const li =
            document.createElement(
              "li"
            );


          const check =
            document.createElement(
              "input"
            );

          check.type = "checkbox";

          check.checked =
            d.hecho === true;


          check.addEventListener(
            "change",
            (ev) => {

              db.collection("todos")
                .doc(doc.id)
                .update({
                  hecho:
                    ev.target.checked
                })
                .then(() => {

                  toast(
                    "Pendiente actualizado ✓"
                  );

                })
                .catch((error) => {

                  console.error(
                    "ERROR FIREBASE - ACTUALIZAR TODO:",
                    error
                  );

                  toast(
                    "No se pudo actualizar."
                  );
                });
            }
          );


          const span =
            document.createElement(
              "span"
            );

          span.className =
            "todo-text";

          span.textContent =
            d.texto || "";


          const remove =
            document.createElement(
              "button"
            );

          remove.className =
            "todo-remove";

          remove.textContent =
            "✕";


          remove.addEventListener(
            "click",
            () => {

              db.collection("todos")
                .doc(doc.id)
                .delete()
                .then(() => {

                  toast(
                    "Pendiente eliminado."
                  );

                })
                .catch((error) => {

                  console.error(
                    "ERROR FIREBASE - ELIMINAR TODO:",
                    error
                  );

                  toast(
                    "No se pudo eliminar."
                  );
                });
            }
          );


          li.append(
            check,
            span,
            remove
          );


          if (d.hecho) {
            doneList.appendChild(li);
          } else {
            pendingList.appendChild(li);
          }

        });

      },
      (error) => {

        console.error(
          "ERROR FIREBASE - TODOS:",
          error
        );

        toast(
          "Error al cargar los pendientes: " +
            error.message
        );
      }
    );
}