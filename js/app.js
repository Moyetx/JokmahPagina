/* Sitio público */
(function () {
  "use strict";

  const U = window.JUtil;
  const Store = window.JStore;
  const Cal = window.JCal;
  const SEED = window.JSeed;

  const estado = {
    ajustes: null,
    secciones: [],
    preguntas: [],
    eventos: [],
    temporadas: [],
    santoral: [],
    santos: [],
    calVista: "semana",
    calFecha: new Date(),
    filtroTiempo: null
  };

  const vista = U.$("#vista");

  /* ---------------- Arranque ---------------- */

  async function iniciar() {
    try {
      await Store.init();
      await cargarDatos();
    } catch (e) {
      vista.innerHTML =
        '<div class="vacio bloque"><p>No se pudieron cargar los datos.</p><p class="suave">' +
        U.esc(e.message || e) + "</p></div>";
      return;
    }
    aplicarDecoracion();
    prepararNavegacion();
    window.addEventListener("hashchange", enrutar);
    enrutar();
    pedirDatosVisitante();
  }

  async function cargarDatos() {
    const [ajustes, secciones, preguntas, eventos, temporadas, santoral, santos] = await Promise.all([
      Store.getAjustes(),
      Store.listar("secciones"),
      Store.listar("preguntas"),
      Store.listar("eventos"),
      Store.listar("temporadas"),
      Store.listar("santoral"),
      Store.listar("santos")
    ]);
    estado.ajustes = ajustes;
    estado.secciones = secciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    estado.preguntas = preguntas.filter((p) => p.publicada !== false);
    estado.eventos = eventos;
    estado.temporadas = temporadas;
    estado.santoral = santoral;
    estado.santos = santos.sort((a, b) => String(a.fiesta || "").localeCompare(String(b.fiesta || "")));
  }

  function aplicarDecoracion() {
    const a = estado.ajustes;
    document.title = a.nombre + " — " + (a.lema || "Grupo juvenil");
    U.$("#marca-nombre").textContent = a.nombre;
    U.$("#marca-lema").textContent = a.lema || "";
    U.$("#pie-nombre").textContent = a.nombre;
    U.$("#pie-lema").textContent = a.lema || "";

    const logo = U.$("#marca-logo");
    logo.innerHTML = a.logo ? '<img src="' + U.esc(a.logo) + '" alt="">' : U.esc(a.nombre.charAt(0));

    if (a.fondo) {
      document.body.style.setProperty("--fondo-imagen", 'url("' + a.fondo + '")');
      document.body.style.setProperty("--velo", String(a.veloFondo != null ? a.veloFondo : 0.9));
      document.body.classList.add("con-fondo");
    } else {
      document.body.classList.remove("con-fondo");
      document.body.style.removeProperty("--fondo-imagen");
    }
    [["izquierda", a.lateralIzq], ["derecha", a.lateralDer]].forEach(([lado, img]) => {
      const el = U.$(".decor-lateral." + lado);
      if (img) {
        el.hidden = false;
        el.style.backgroundImage = 'url("' + img + '")';
        requestAnimationFrame(() => el.classList.add("visible"));
      } else {
        el.hidden = true;
        el.classList.remove("visible");
      }
    });

    const redes = (a.redes || []).filter((r) => r.url);
    U.$("#pie-redes").innerHTML = redes.length
      ? redes.map((r) =>
          '<a href="' + U.esc(r.url) + '" target="_blank" rel="noopener">' + iconoRed(r.nombre) + U.esc(r.nombre) + "</a>"
        ).join("")
      : '<span class="suave" style="font-size:13.5px">Pronto compartiremos nuestras redes.</span>';
  }

  function iconoRed(nombre) {
    const n = String(nombre || "").toLowerCase();
    const trazo = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if (n.includes("insta")) return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg>';
    if (n.includes("you")) return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10 9.3l5 2.7-5 2.7z" fill="currentColor" stroke="none"/></svg>';
    if (n.includes("whats")) return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><path d="M4.6 19.4L5.5 16A8 8 0 1 1 8.6 18.7z"/><path d="M9.3 9.2c.6 2.3 2.4 4.1 4.7 4.7l.9-1.3 2 .9c-.2 1.5-1.5 2.2-2.9 1.8-3-.8-5.3-3.1-6.1-6.1-.4-1.4.3-2.7 1.8-2.9l.9 2z"/></svg>';
    if (n.includes("face")) return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V2.8h-2.6A3.9 3.9 0 0 0 10.5 6.7v1.8H8.2v2.9h2.3V21h3.5v-9.6h2.6l.5-2.9z"/></svg>';
    if (n.includes("tik")) return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><path d="M9.5 8.7v7.1a3.2 3.2 0 1 1-3.2-3.2M9.5 3h3.2c.3 2.7 2 4.4 4.8 4.7v3.1c-1.8 0-3.4-.6-4.8-1.6v6.6a6.3 6.3 0 1 1-6.4-6.3"/></svg>';
    return '<svg width="15" height="15" viewBox="0 0 24 24" ' + trazo + '><path d="M10 14a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1"/><path d="M14 10a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></svg>';
  }

  function prepararNavegacion() {
    const nav = U.$("#nav-principal");
    const botonMenu = U.$("#boton-menu");
    botonMenu.addEventListener("click", () => {
      const abierto = nav.classList.toggle("abierto");
      botonMenu.setAttribute("aria-expanded", String(abierto));
    });
    nav.addEventListener("click", (ev) => {
      const enlace = ev.target.closest("a[data-ancla]");
      nav.classList.remove("abierto");
      if (!enlace) return;
      ev.preventDefault();
      const ancla = enlace.dataset.ancla;
      if (location.hash && location.hash !== "#/") {
        location.hash = "#/";
        setTimeout(() => desplazarA(ancla), 80);
      } else {
        desplazarA(ancla);
      }
    });
  }

  function desplazarA(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- Enrutado ---------------- */

  function enrutar() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const partes = hash.split("/").filter(Boolean);
    window.scrollTo({ top: 0 });
    if (partes[0] === "seccion" && partes[1]) return dibujarSeccion(decodeURIComponent(partes[1]));
    if (partes[0] === "pregunta" && partes[1]) return dibujarPregunta(decodeURIComponent(partes[1]));
    if (partes[0] === "santos") return dibujarSantos();
    if (partes[0] === "santo" && partes[1]) return dibujarSanto(decodeURIComponent(partes[1]));
    dibujarInicio();
  }

  function activarRevelado() {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    U.$$(".revelar", vista).forEach((el) => obs.observe(el));
  }

  /* ---------------- Portada ---------------- */

  function dibujarInicio() {
    const a = estado.ajustes;
    vista.innerHTML =
      seccionPortada(a) +
      seccionSecciones() +
      seccionCalendario() +
      seccionBuzones();
    dibujarCalendario();
    conectarBuzones();
    activarRevelado();
  }

  function seccionPortada(a) {
    return (
      '<section class="portada" id="inicio">' +
      '<div class="portada-logo revelar">' +
      (a.logo ? '<img src="' + U.esc(a.logo) + '" alt="Logo de ' + U.esc(a.nombre) + '">' : U.esc(a.nombre.charAt(0))) +
      "</div>" +
      '<h1 class="revelar">' + U.esc(a.nombre) + "</h1>" +
      '<p class="lema revelar">' + U.esc(a.lema || "") + "</p>" +
      '<div class="filigrana revelar" aria-hidden="true"><span></span></div>' +
      '<div class="mision-objetivo">' +
      '<article class="tarjeta revelar"><span class="etiqueta-suave">Nuestra misión</span>' +
      '<div class="texto-editable">' + U.parrafos(a.mision) + "</div></article>" +
      '<article class="tarjeta revelar"><span class="etiqueta-suave">Nuestro objetivo</span>' +
      '<div class="texto-editable">' + U.parrafos(a.objetivo) + "</div></article>" +
      "</div></section>"
    );
  }

  function contarPreguntas(seccionId) {
    return estado.preguntas.filter((p) => (p.etiquetas || []).includes(seccionId)).length;
  }

  function seccionSecciones() {
    const cartas = estado.secciones.map((s) => {
      const n = contarPreguntas(s.id);
      return (
        '<a class="carta-seccion revelar' + (s.liturgico ? " liturgica" : "") + '" href="#/seccion/' + encodeURIComponent(s.id) + '">' +
        "<h3>" + U.esc(s.nombre) + "</h3>" +
        "<p>" + U.esc(s.descripcion || "") + "</p>" +
        '<span class="contador">' + n + (n === 1 ? " pregunta" : " preguntas") + "</span>" +
        "</a>"
      );
    }).join("");
    return (
      '<section class="bloque" id="secciones">' +
      '<div class="bloque-titulo"><h2>Secciones</h2></div>' +
      '<div class="rejilla-secciones">' + (cartas || '<p class="vacio">Aún no hay secciones.</p>') + "</div>" +
      "</section>"
    );
  }

  /* ---------------- Calendario ---------------- */

  function seccionCalendario() {
    return (
      '<section class="bloque" id="calendario">' +
      '<div class="bloque-titulo"><h2>Calendario litúrgico</h2></div>' +
      '<div class="panel-calendario revelar" id="panel-calendario"></div>' +
      "</section>"
    );
  }

  function dibujarCalendario() {
    const panel = U.$("#panel-calendario");
    if (!panel) return;
    const f = estado.calFecha;
    const esMes = estado.calVista === "mes";
    const datos = { eventos: estado.eventos, temporadas: estado.temporadas, santoral: estado.santoral, santos: estado.santos };
    let titulo = esMes
      ? U.MESES[f.getMonth()] + " " + f.getFullYear()
      : "semana del " + Cal.lunesDe(f).getDate() + " de " + U.MESES[Cal.lunesDe(f).getMonth()];
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    panel.innerHTML =
      '<div class="cal-barra">' +
      '<span class="cal-titulo">' + titulo + "</span>" +
      '<div class="cal-controles">' +
      '<button class="boton secundario mini" data-cal="antes" aria-label="Anterior">&#8249;</button>' +
      '<button class="boton secundario mini" data-cal="hoy">Hoy</button>' +
      '<button class="boton secundario mini" data-cal="despues" aria-label="Siguiente">&#8250;</button>' +
      '<div class="conmutador" data-activo="' + (esMes ? 1 : 0) + '" style="margin:0 0 0 8px">' +
      '<div class="pastilla"></div>' +
      '<button data-cal="semana" class="' + (esMes ? "" : "activo") + '">Semana</button>' +
      '<button data-cal="mes" class="' + (esMes ? "activo" : "") + '">Mes</button>' +
      "</div></div></div>" +
      (esMes ? Cal.vistaMes(f, datos) : Cal.vistaSemana(f, datos)) +
      '<div class="cal-inferior">' +
      '<div><span class="etiqueta-suave">Lo que sigue</span>' + Cal.listaProximos(datos, 6) + "</div>" +
      Cal.santoralHoy(datos) +
      "</div>";

    panel.querySelectorAll("[data-cal]").forEach((b) => {
      b.addEventListener("click", () => {
        const acc = b.dataset.cal;
        const d = new Date(estado.calFecha);
        if (acc === "hoy") estado.calFecha = new Date();
        else if (acc === "semana" || acc === "mes") estado.calVista = acc;
        else {
          const paso = acc === "antes" ? -1 : 1;
          if (estado.calVista === "mes") d.setMonth(d.getMonth() + paso);
          else d.setDate(d.getDate() + paso * 7);
          estado.calFecha = d;
        }
        dibujarCalendario();
      });
    });
  }

  /* ---------------- Buzones ---------------- */

  function seccionBuzones() {
    const opciones = estado.secciones.map((s) =>
      '<option value="' + U.esc(s.nombre) + '">' + U.esc(s.nombre) + "</option>").join("");
    return (
      '<section class="bloque" id="buzon">' +
      '<div class="bloque-titulo"><h2>Buzones</h2></div>' +
      '<div class="rejilla-buzones">' +
      '<form class="tarjeta revelar" id="form-buzon">' +
      '<span class="etiqueta-suave">Buzón de preguntas anónimas</span>' +
      '<p class="suave" style="font-size:14px">¿Hay algo que siempre quisiste preguntar? Escríbelo aquí. Nadie sabrá que fuiste tú, y la respuesta podrá aparecer publicada en alguna sección.</p>' +
      '<label class="campo"><span>Tu pregunta</span><textarea name="mensaje" required placeholder="Escribe tu pregunta con confianza"></textarea></label>' +
      '<label class="campo"><span>Tema (opcional)</span><select name="seccion"><option value="">No lo sé / otro</option>' + opciones + "</select></label>" +
      '<label class="campo"><span>Firma (opcional)</span><input name="nombre" placeholder="Anónimo" maxlength="60"></label>' +
      '<button class="boton" type="submit">Enviar pregunta</button>' +
      "</form>" +
      '<form class="tarjeta revelar" id="form-quejas">' +
      '<span class="etiqueta-suave">Quejas y sugerencias</span>' +
      '<p class="suave" style="font-size:14px">Este espacio también es tuyo: dinos qué mejorar, qué tema quieres que tratemos o qué no te gustó.</p>' +
      '<label class="campo"><span>Tipo</span><select name="tipo"><option value="Sugerencia">Sugerencia</option><option value="Queja">Queja</option></select></label>' +
      '<label class="campo"><span>Tu mensaje</span><textarea name="mensaje" required placeholder="Cuéntanos"></textarea></label>' +
      '<button class="boton dorado" type="submit">Enviar</button>' +
      "</form>" +
      "</div></section>"
    );
  }

  function conectarBuzones() {
    const fb = U.$("#form-buzon");
    if (fb) fb.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = new FormData(fb);
      await Store.guardar("buzon", {
        nombre: String(d.get("nombre") || "").trim() || "Anónimo",
        seccion: String(d.get("seccion") || ""),
        mensaje: String(d.get("mensaje") || "").trim(),
        fecha: new Date().toISOString()
      });
      fb.reset();
      U.aviso("Tu pregunta llegó al buzón. Gracias por preguntar.");
    });
    const fq = U.$("#form-quejas");
    if (fq) fq.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = new FormData(fq);
      await Store.guardar("quejas", {
        tipo: String(d.get("tipo") || "Sugerencia"),
        mensaje: String(d.get("mensaje") || "").trim(),
        fecha: new Date().toISOString()
      });
      fq.reset();
      U.aviso("Recibido. Gracias por ayudarnos a mejorar.");
    });
  }

  /* ---------------- Sección ---------------- */

  function dibujarSeccion(id) {
    const s = estado.secciones.find((x) => x.id === id);
    if (!s) { vista.innerHTML = '<div class="vacio bloque">Esta sección no existe.</div>'; return; }

    let preguntas = estado.preguntas.filter((p) => (p.etiquetas || []).includes(id));
    let chips = "";
    if (s.liturgico) {
      chips = '<div class="chips">' +
        '<button class="chip' + (estado.filtroTiempo ? "" : " activo") + '" data-tiempo="">Todos</button>' +
        SEED.TIEMPOS.map((t) =>
          '<button class="chip' + (estado.filtroTiempo === t.id ? " activo" : "") + '" data-tiempo="' + t.id + '">' + t.nombre + "</button>"
        ).join("") + "</div>";
      if (estado.filtroTiempo) preguntas = preguntas.filter((p) => p.tiempo === estado.filtroTiempo);
    }

    vista.innerHTML =
      '<nav class="miga"><a href="#/">Inicio</a><span>/</span><span>' + U.esc(s.nombre) + "</span></nav>" +
      '<section class="bloque" style="padding-top:18px">' +
      "<h1>" + U.esc(s.nombre) + "</h1>" +
      '<p class="suave" style="max-width:640px">' + U.esc(s.descripcion || "") + "</p>" +
      chips +
      '<div class="lista-preguntas">' +
      (preguntas.length
        ? preguntas.map(cartaPregunta).join("")
        : '<div class="vacio">Todavía no hay preguntas aquí. Puedes dejar la tuya en el <a href="#/" data-ir-buzon>buzón anónimo</a>.</div>') +
      "</div></section>";

    U.$$("[data-tiempo]", vista).forEach((b) =>
      b.addEventListener("click", () => {
        estado.filtroTiempo = b.dataset.tiempo || null;
        dibujarSeccion(id);
      }));
    const irBuzon = U.$("[data-ir-buzon]", vista);
    if (irBuzon) irBuzon.addEventListener("click", () => setTimeout(() => desplazarA("buzon"), 80));
    activarRevelado();
  }

  function cartaPregunta(p) {
    const nombresEtiquetas = (p.etiquetas || [])
      .map((e) => { const s = estado.secciones.find((x) => x.id === e); return s ? s.nombre : null; })
      .filter(Boolean).join(" · ");
    return (
      '<a class="carta-pregunta revelar" href="#/pregunta/' + encodeURIComponent(p.id) + '">' +
      "<h3>" + U.esc(p.pregunta) + "</h3>" +
      '<div class="meta">' +
      "<span>" + U.num(p.vistas) + " consultas</span><span class=\"sep\">·</span>" +
      "<span>" + U.num(p.likes) + " a favor</span>" +
      (nombresEtiquetas ? '<span class="sep">·</span><span>' + U.esc(nombresEtiquetas) + "</span>" : "") +
      "</div></a>"
    );
  }

  /* ---------------- Detalle de pregunta ---------------- */

  async function dibujarPregunta(id) {
    const p = estado.preguntas.find((x) => x.id === id);
    if (!p) { vista.innerHTML = '<div class="vacio bloque">Esta pregunta no existe o fue retirada.</div>'; return; }

    if (!Store.interacciones.yaVisto(id)) {
      Store.interacciones.marcarVisto(id);
      p.vistas = (p.vistas || 0) + 1;
      Store.contar(id, "vistas", 1).catch(() => {});
    }

    const origen = estado.secciones.find((s) => (p.etiquetas || []).includes(s.id));
    const formatoGuardado = sessionStorage.getItem("jokmah-formato") || "corta";

    vista.innerHTML =
      '<nav class="miga"><a href="#/">Inicio</a><span>/</span>' +
      (origen ? '<a href="#/seccion/' + encodeURIComponent(origen.id) + '">' + U.esc(origen.nombre) + "</a><span>/</span>" : "") +
      "<span>Pregunta</span></nav>" +
      '<article class="detalle-pregunta">' +
      '<header class="detalle-cab">' +
      "<h1>" + U.esc(p.pregunta) + "</h1>" +
      '<div class="conmutador" id="conmutador-formato" data-activo="' + (formatoGuardado === "larga" ? 1 : 0) + '">' +
      '<div class="pastilla"></div>' +
      '<button data-formato="corta" class="' + (formatoGuardado === "larga" ? "" : "activo") + '">Respuesta corta</button>' +
      '<button data-formato="larga" class="' + (formatoGuardado === "larga" ? "activo" : "") + '">Respuesta larga</button>' +
      "</div></header>" +
      '<div id="panel-formato"></div>' +
      '<div class="valoracion" id="valoracion"></div>' +
      '<p class="centro suave" style="font-size:13px">' + U.num(p.vistas) + " consultas</p>" +
      "</article>";

    const panel = U.$("#panel-formato");
    const pintarFormato = (f) => {
      sessionStorage.setItem("jokmah-formato", f);
      panel.innerHTML = f === "larga" ? htmlFormatoLargo(p) : htmlFormatoCorto(p);
      panel.querySelectorAll("[data-descarga]").forEach((b) =>
        b.addEventListener("click", async () => {
          b.disabled = true;
          const original = b.textContent;
          b.textContent = "Generando imagen…";
          try { await window.JHistoria.descargar(p, estado.ajustes, b.dataset.descarga); }
          catch (e) { U.aviso("No se pudo generar la imagen."); }
          b.disabled = false;
          b.textContent = original;
        }));
    };

    const conmutador = U.$("#conmutador-formato");
    conmutador.querySelectorAll("[data-formato]").forEach((b) =>
      b.addEventListener("click", () => {
        conmutador.querySelectorAll("button").forEach((x) => x.classList.remove("activo"));
        b.classList.add("activo");
        conmutador.dataset.activo = b.dataset.formato === "larga" ? 1 : 0;
        pintarFormato(b.dataset.formato);
      }));

    pintarFormato(formatoGuardado);
    pintarValoracion(p);
  }

  function htmlFormatoCorto(p) {
    const fuentes = (p.corta && p.corta.fuentes || []).filter(Boolean);
    return (
      '<div class="panel-formato"><div class="formato-corto">' +
      '<div class="respuesta">' + U.parrafos(p.corta && p.corta.respuesta) + "</div>" +
      (fuentes.length
        ? '<div class="fuentes"><h4>Fuentes</h4><ul>' + fuentes.map((f) => "<li>" + U.esc(f) + "</li>").join("") + "</ul></div>"
        : "") +
      '<div class="acciones-historia">' +
      '<button class="boton mini" data-descarga="png">Descargar PNG</button>' +
      '<button class="boton secundario mini" data-descarga="jpeg">Descargar JPG</button>' +
      '<p class="nota">Imagen vertical lista para compartir en historias.</p>' +
      "</div></div></div>"
    );
  }

  function htmlFormatoLargo(p) {
    const l = p.larga || {};
    const objeciones = (l.objeciones || []).filter(Boolean);
    const respuestas = (l.respuestas || []).filter(Boolean);
    const notas = (l.notas || []).filter(Boolean);
    return (
      '<div class="panel-formato"><div class="formato-suma">' +
      '<p class="suma-cuestion">Cuestión ' + U.esc(l.cuestionNum || "") + "</p>" +
      '<h2 class="suma-cuestion-titulo">' + U.esc(l.cuestionTitulo || "") + "</h2>" +
      '<p class="suma-articulo">Artículo ' + U.esc(l.articuloNum || "") + "</p>" +
      '<h3 class="suma-articulo-titulo">' + U.esc(l.articuloTitulo || p.pregunta) + "</h3>" +
      '<div class="suma-separador" aria-hidden="true"><span></span></div>' +
      (objeciones.length
        ? '<div class="suma-parte"><h4>Objeciones</h4>' +
          objeciones.map((o, i) =>
            '<div class="suma-objecion"><p><strong>Objeción ' + (i + 1) + ".</strong> " +
            U.marcarNotas(U.esc(o)) + "</p></div>").join("") + "</div>"
        : "") +
      (l.enCambio
        ? '<div class="suma-parte suma-encambio"><h4>En cambio</h4>' + U.parrafos(l.enCambio) + "</div>"
        : "") +
      (l.solucion
        ? '<div class="suma-parte suma-solucion"><h4>Solución</h4>' + U.parrafos(l.solucion) + "</div>"
        : "") +
      (respuestas.length
        ? '<div class="suma-parte"><h4>Respuesta a las objeciones</h4>' +
          respuestas.map((r, i) =>
            '<div class="suma-respuesta"><p><strong>A la objeción ' + (i + 1) + ".</strong> " +
            U.marcarNotas(U.esc(r)) + "</p></div>").join("") + "</div>"
        : "") +
      (notas.length
        ? '<div class="suma-notas"><h4>Notas</h4><ol>' +
          notas.map((n, i) => '<li id="nota-' + (i + 1) + '">' + U.esc(n) + "</li>").join("") + "</ol></div>"
        : "") +
      "</div></div>"
    );
  }

  function pintarValoracion(p) {
    const cont = U.$("#valoracion");
    const voto = Store.interacciones.voto(p.id);
    const pulgar = (abajo) =>
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' +
      (abajo ? ' style="transform:rotate(180deg)"' : "") +
      '><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM7 11l4.2-7.5A2 2 0 0 1 14.6 5l-.8 4H19a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 20H7"/></svg>';
    cont.innerHTML =
      '<span>¿Te sirvió esta respuesta?</span>' +
      '<button class="boton-voto positivo' + (voto === "like" ? " activo" : "") + '" data-voto="like">' +
      pulgar(false) + "<span>" + U.num(p.likes) + "</span></button>" +
      '<button class="boton-voto negativo' + (voto === "dislike" ? " activo" : "") + '" data-voto="dislike">' +
      pulgar(true) + "<span>" + U.num(p.dislikes) + "</span></button>";

    cont.querySelectorAll("[data-voto]").forEach((b) =>
      b.addEventListener("click", async () => {
        const tipo = b.dataset.voto;
        const actual = Store.interacciones.voto(p.id);
        const campo = (t) => (t === "like" ? "likes" : "dislikes");
        if (actual === tipo) {
          Store.interacciones.marcarVoto(p.id, null);
          p[campo(tipo)] = Math.max(0, (p[campo(tipo)] || 0) - 1);
          Store.contar(p.id, campo(tipo), -1).catch(() => {});
        } else {
          if (actual) {
            p[campo(actual)] = Math.max(0, (p[campo(actual)] || 0) - 1);
            Store.contar(p.id, campo(actual), -1).catch(() => {});
          }
          Store.interacciones.marcarVoto(p.id, tipo);
          p[campo(tipo)] = (p[campo(tipo)] || 0) + 1;
          Store.contar(p.id, campo(tipo), 1).catch(() => {});
        }
        pintarValoracion(p);
      }));
  }

  /* ---------------- Santos ---------------- */

  function fiestaTexto(mmdd) {
    const [m, d] = String(mmdd || "").split("-").map(Number);
    return m && d ? d + " de " + U.MESES[m - 1] : "";
  }

  function retratoSanto(s) {
    if (s.imagenes && s.imagenes.length) return s.imagenes[0];
    const inicial = (s.nombre || "S").replace(/^(San |Santa |Santo |Beato |Beata )/i, "").charAt(0).toUpperCase();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#6f1d33"/><stop offset="1" stop-color="#2c0c15"/></linearGradient></defs>' +
      '<rect width="600" height="750" fill="url(#g)"/>' +
      '<circle cx="300" cy="330" r="150" fill="none" stroke="#d9b36a" stroke-opacity=".55" stroke-width="3"/>' +
      '<text x="300" y="385" font-family="Georgia,serif" font-size="150" fill="#d9b36a" text-anchor="middle">' + inicial + "</text>" +
      '<rect x="24" y="24" width="552" height="702" fill="none" stroke="#d9b36a" stroke-opacity=".35" stroke-width="2"/>' +
      "</svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function dibujarSantos() {
    const cartas = estado.santos.map((s) =>
      '<a class="carta-santo revelar" href="#/santo/' + encodeURIComponent(s.id) + '">' +
      '<span class="carta-santo-retrato" style="background-image:' + U.cssUrl(retratoSanto(s)) + '"></span>' +
      '<span class="carta-santo-texto"><strong>' + U.esc(s.nombre) + "</strong>" +
      (s.titulo ? '<small>' + U.esc(s.titulo) + "</small>" : "") +
      (s.fiesta ? '<span class="carta-santo-fiesta">' + fiestaTexto(s.fiesta) + "</span>" : "") +
      "</span></a>"
    ).join("");

    vista.innerHTML =
      '<nav class="miga"><a href="#/">Inicio</a><span>/</span><span>Santos</span></nav>' +
      '<section class="bloque" style="padding-top:18px">' +
      "<h1>Fichas de santos</h1>" +
      '<p class="suave" style="max-width:640px">Vidas que demuestran que el Evangelio se puede vivir: su historia, sus milagros, sus palabras y sus obras.</p>' +
      (cartas
        ? '<div class="rejilla-santos">' + cartas + "</div>"
        : '<div class="vacio">Todavía no hay fichas de santos publicadas.</div>') +
      "</section>";
    activarRevelado();
  }

  function dibujarSanto(id) {
    const s = estado.santos.find((x) => x.id === id);
    if (!s) { vista.innerHTML = '<div class="vacio bloque">Esta ficha no existe o fue retirada.</div>'; return; }

    const datosVida = [
      ["Fiesta", fiestaTexto(s.fiesta)],
      ["Nacimiento", s.nacimiento],
      ["Fallecimiento", s.fallecimiento],
      ["Patronazgo", s.patronazgo]
    ].filter((d) => d[1]);

    const galeria = (s.imagenes || []).map((img, i) =>
      '<button class="santo-miniatura" data-imagen="' + i + '" style="background-image:' + U.cssUrl(img) + '" aria-label="Ampliar imagen ' + (i + 1) + '"></button>'
    ).join("");

    const bloque = (titulo, html) =>
      html ? '<section class="santo-bloque revelar"><h2>' + titulo + "</h2>" + html + "</section>" : "";

    vista.innerHTML =
      '<nav class="miga"><a href="#/">Inicio</a><span>/</span><a href="#/santos">Santos</a><span>/</span><span>' + U.esc(s.nombre) + "</span></nav>" +
      '<article class="ficha-santo">' +
      '<header class="santo-cabecera revelar">' +
      '<div class="santo-retrato" style="background-image:' + U.cssUrl(retratoSanto(s)) + '"></div>' +
      '<div class="santo-presentacion">' +
      "<h1>" + U.esc(s.nombre) + "</h1>" +
      (s.titulo ? '<p class="santo-titulo">' + U.esc(s.titulo) + "</p>" : "") +
      (datosVida.length
        ? '<dl class="santo-datos">' + datosVida.map((d) =>
            "<div><dt>" + d[0] + "</dt><dd>" + U.esc(d[1]) + "</dd></div>").join("") + "</dl>"
        : "") +
      "</div></header>" +
      (galeria
        ? '<section class="santo-bloque revelar"><h2>Galería</h2><div class="santo-galeria">' + galeria + "</div></section>"
        : "") +
      bloque("Su historia", s.biografia ? U.parrafos(s.biografia) : "") +
      bloque("Milagros atribuidos",
        (s.milagros || []).filter(Boolean).length
          ? '<ul class="santo-lista">' + s.milagros.filter(Boolean).map((m) => "<li>" + U.esc(m) + "</li>").join("") + "</ul>"
          : "") +
      bloque("Sus palabras",
        (s.frases || []).filter(Boolean).length
          ? s.frases.filter(Boolean).map((f) => '<blockquote class="santo-frase">' + U.esc(f) + "</blockquote>").join("")
          : "") +
      bloque("Obras",
        (s.obras || []).filter(Boolean).length
          ? '<ul class="santo-lista">' + s.obras.filter(Boolean).map((o) => "<li>" + U.esc(o) + "</li>").join("") + "</ul>"
          : "") +
      bloque("Para saber más", s.extra ? U.parrafos(s.extra) : "") +
      "</article>";

    U.$$(".santo-miniatura", vista).forEach((b) =>
      b.addEventListener("click", () => abrirVisor(s.imagenes, Number(b.dataset.imagen))));
    activarRevelado();
  }

  function abrirVisor(imagenes, indice) {
    const capa = U.$("#capa-modales");
    let i = indice;
    const pintar = () => {
      capa.innerHTML =
        '<div class="telon visor" role="dialog" aria-modal="true" aria-label="Galería de imágenes">' +
        '<img class="visor-imagen" src="' + U.esc(imagenes[i]) + '" alt="">' +
        (imagenes.length > 1
          ? '<button class="visor-flecha izquierda" aria-label="Anterior">&#8249;</button>' +
            '<button class="visor-flecha derecha" aria-label="Siguiente">&#8250;</button>'
          : "") +
        '<button class="visor-cerrar" aria-label="Cerrar">&times;</button>' +
        '<span class="visor-contador">' + (i + 1) + " / " + imagenes.length + "</span>" +
        "</div>";
      U.$(".visor-cerrar", capa).addEventListener("click", cerrar);
      capa.firstChild.addEventListener("click", (ev) => { if (ev.target === capa.firstChild) cerrar(); });
      const izq = U.$(".visor-flecha.izquierda", capa);
      const der = U.$(".visor-flecha.derecha", capa);
      if (izq) izq.addEventListener("click", () => { i = (i - 1 + imagenes.length) % imagenes.length; pintar(); });
      if (der) der.addEventListener("click", () => { i = (i + 1) % imagenes.length; pintar(); });
    };
    const teclas = (ev) => {
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft" && imagenes.length > 1) { i = (i - 1 + imagenes.length) % imagenes.length; pintar(); }
      if (ev.key === "ArrowRight" && imagenes.length > 1) { i = (i + 1) % imagenes.length; pintar(); }
    };
    const cerrar = () => { capa.innerHTML = ""; document.removeEventListener("keydown", teclas); };
    document.addEventListener("keydown", teclas);
    pintar();
  }

  /* ---------------- Ficha del visitante ---------------- */

  function pedirDatosVisitante() {
    if (localStorage.getItem("jokmah-visitante")) return;
    const capa = U.$("#capa-modales");
    const opciones = SEED.ESTADOS.map((e) => "<option>" + e + "</option>").join("");
    capa.innerHTML =
      '<div class="telon"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-bienvenida">' +
      '<span class="etiqueta-suave">Bienvenido</span>' +
      '<h2 id="titulo-bienvenida">Antes de pasar, dinos quién eres</h2>' +
      '<p class="suave">Sin registros ni contraseñas: solo queremos saber quién nos visita para servirte mejor.</p>' +
      '<form id="form-visitante">' +
      '<label class="campo"><span>Nombre o apodo</span><input name="nombre" required maxlength="60" placeholder="¿Cómo te llamamos?"></label>' +
      '<label class="campo"><span>Edad</span><input name="edad" type="number" min="5" max="120" required placeholder="Tu edad"></label>' +
      '<label class="campo"><span>Estado</span><select name="estado">' + opciones + "</select></label>" +
      '<button class="boton" type="submit" style="width:100%">Entrar</button>' +
      "</form></div></div>";

    U.$("#form-visitante").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = new FormData(ev.target);
      const ficha = {
        nombre: String(d.get("nombre") || "").trim(),
        edad: Number(d.get("edad")) || null,
        estado: String(d.get("estado") || ""),
        fecha: new Date().toISOString()
      };
      localStorage.setItem("jokmah-visitante", JSON.stringify(ficha));
      capa.innerHTML = "";
      U.aviso("Bienvenido, " + ficha.nombre + ".");
      try { await Store.guardar("registros", Object.assign({}, ficha)); } catch (e) { /* sin conexión */ }
    });
  }

  iniciar();
})();
