/* Panel de administración */
(function () {
  "use strict";

  const U = window.JUtil;
  const Store = window.JStore;
  const SEED = window.JSeed;
  const COLORES = SEED.COLORES_LITURGICOS;

  const D = {
    ajustes: null,
    secciones: [],
    preguntas: [],
    eventos: [],
    temporadas: [],
    santoral: [],
    santos: [],
    buzon: [],
    quejas: [],
    registros: [],
    usuarios: []
  };

  let tabActual = "resumen";
  const contenido = () => U.$("#admin-contenido");

  /* ================= Acceso ================= */

  async function iniciar() {
    await Store.init();
    if (Store.esAdmin()) return abrirPanel();
    dibujarAcceso();
  }

  function dibujarAcceso() {
    const acceso = U.$("#admin-acceso");
    const esLocal = Store.modo === "local";
    acceso.innerHTML =
      '<div class="acceso-telon"><form class="acceso-caja" id="form-acceso">' +
      '<span class="etiqueta-suave">' + (esLocal ? "Modo local (pruebas)" : "Modo online") + "</span>" +
      "<h1>Administración</h1>" +
      '<p class="suave" style="font-size:14px">' +
      (esLocal
        ? "Entra con tu usuario y contraseña de administrador."
        : "Entra con el correo y la contraseña del administrador (Supabase Auth).") +
      "</p>" +
      (esLocal
        ? '<label class="campo"><span>Usuario</span><input name="usuario" required autocomplete="username"></label>'
        : '<label class="campo"><span>Correo</span><input name="usuario" type="email" required autocomplete="username"></label>') +
      '<label class="campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>' +
      '<p class="error" id="acceso-error"></p>' +
      '<button class="boton" style="width:100%">Entrar</button>' +
      (esLocal && Store.usaClaveInicial()
        ? '<p class="suave" style="font-size:12.5px;margin:14px 0 0;background:var(--papel-2);border:1px solid var(--borde-suave);border-radius:10px;padding:10px 14px">Primera vez: usuario <strong>admin</strong>, contraseña <strong>Jokmah2026</strong>. Cámbiala en cuanto entres (pestaña Administradores).</p>'
        : "") +
      '<p class="suave centro" style="font-size:12.5px;margin:16px 0 0"><a href="index.html">Volver al sitio</a></p>' +
      "</form></div>";

    U.$("#form-acceso").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const error = U.$("#acceso-error");
      error.textContent = "";
      const ok = await Store.entrar(String(f.get("usuario") || ""), String(f.get("clave")));
      if (!ok) { error.textContent = "Acceso incorrecto. Inténtalo de nuevo."; return; }
      acceso.innerHTML = "";
      abrirPanel();
    });
  }

  async function abrirPanel() {
    U.$("#admin-acceso").innerHTML = "";
    U.$("#admin-marco").hidden = false;
    await cargarTodo();
    U.$("#admin-nombre").textContent = D.ajustes.nombre;
    U.$("#admin-logo").innerHTML = D.ajustes.logo
      ? '<img src="' + U.esc(D.ajustes.logo) + '" alt="">'
      : U.esc(D.ajustes.nombre.charAt(0));

    U.$("#admin-nav").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-tab]");
      if (!b) return;
      U.$$("#admin-nav button").forEach((x) => x.classList.remove("activo"));
      b.classList.add("activo");
      tabActual = b.dataset.tab;
      dibujarTab();
    });
    U.$("#boton-salir").addEventListener("click", async () => {
      await Store.salir();
      location.reload();
    });
    dibujarTab();
  }

  async function cargarTodo() {
    const [ajustes, secciones, preguntas, eventos, temporadas, santoral, santos, buzon, quejas, registros, usuarios] =
      await Promise.all([
        Store.getAjustes(),
        Store.listar("secciones"), Store.listar("preguntas"),
        Store.listar("eventos"), Store.listar("temporadas"), Store.listar("santoral"),
        Store.listar("santos"),
        Store.listar("buzon"), Store.listar("quejas"), Store.listar("registros"),
        Store.listar("usuarios")
      ]);
    D.ajustes = ajustes;
    D.secciones = secciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    D.preguntas = preguntas;
    D.eventos = eventos.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    D.temporadas = temporadas.sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
    D.santoral = santoral.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    D.santos = santos.sort((a, b) => String(a.fiesta || "").localeCompare(String(b.fiesta || "")));
    D.usuarios = usuarios.sort((a, b) => String(a.creado || "").localeCompare(String(b.creado || "")));
    D.buzon = buzon.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    D.quejas = quejas.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    D.registros = registros.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  function dibujarTab() {
    const mapa = {
      resumen: tabResumen, preguntas: tabPreguntas, secciones: tabSecciones,
      buzon: tabBuzon, quejas: tabQuejas, registros: tabRegistros,
      calendario: tabCalendario, santoral: tabSantoral, fichas: tabFichas,
      apariencia: tabApariencia, ajustes: tabAjustes, administradores: tabAdministradores
    };
    (mapa[tabActual] || tabResumen)();
  }

  function cabecera(titulo, descripcion, extra) {
    return "<h1>" + titulo + "</h1><p class=\"descripcion\">" + descripcion + "</p>" + (extra || "");
  }

  const fechaTabla = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? U.esc(iso) : d.toLocaleDateString("es") + " " + d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  };

  /* ================= Resumen ================= */

  function tabResumen() {
    const vistas = D.preguntas.reduce((s, p) => s + (p.vistas || 0), 0);
    const likes = D.preguntas.reduce((s, p) => s + (p.likes || 0), 0);
    const dislikes = D.preguntas.reduce((s, p) => s + (p.dislikes || 0), 0);

    const indicadores = [
      ["Preguntas publicadas", D.preguntas.filter((p) => p.publicada !== false).length],
      ["Consultas totales", vistas],
      ["A favor", likes],
      ["En contra", dislikes],
      ["Visitantes", D.registros.length],
      ["Mensajes en buzones", D.buzon.length + D.quejas.length]
    ].map(([e, v]) =>
      '<div class="indicador"><span class="etiqueta">' + e + '</span><div class="valor">' + U.num(v) + "</div></div>"
    ).join("");

    const top = D.preguntas.slice().sort((a, b) => (b.vistas || 0) - (a.vistas || 0)).slice(0, 8);
    const maxV = Math.max(1, ...top.map((p) => p.vistas || 0));
    const barrasVistas = top.map((p) =>
      '<div class="fila-barra"><span class="nombre" title="' + U.esc(p.pregunta) + '">' + U.esc(p.pregunta) + "</span>" +
      '<div class="pista-barra"><div class="barra" style="width:' + Math.round((p.vistas || 0) / maxV * 100) + '%"></div>' +
      '<span class="cifra">' + U.num(p.vistas || 0) + "</span></div></div>"
    ).join("");

    const valoradas = D.preguntas.slice()
      .sort((a, b) => ((b.likes || 0) + (b.dislikes || 0)) - ((a.likes || 0) + (a.dislikes || 0)))
      .slice(0, 8);
    const maxLD = Math.max(1, ...valoradas.map((p) => Math.max(p.likes || 0, p.dislikes || 0)));
    const barrasVotos = valoradas.map((p) =>
      '<div class="fila-barra"><span class="nombre" title="' + U.esc(p.pregunta) + '">' + U.esc(p.pregunta) + "</span>" +
      '<div class="doble-barra">' +
      '<div class="pista-barra"><div class="barra positiva" style="width:' + Math.round((p.likes || 0) / maxLD * 100) + '%"></div><span class="cifra">' + U.num(p.likes || 0) + "</span></div>" +
      '<div class="pista-barra"><div class="barra negativa" style="width:' + Math.round((p.dislikes || 0) / maxLD * 100) + '%"></div><span class="cifra">' + U.num(p.dislikes || 0) + "</span></div>" +
      "</div></div>"
    ).join("");

    contenido().innerHTML =
      cabecera("Resumen", "El estado del sitio de un vistazo: consultas, valoraciones y participación.") +
      '<div class="fila-indicadores">' + indicadores + "</div>" +
      '<div class="panel-grafico"><h3>Preguntas más consultadas</h3>' +
      '<p class="subtitulo">Número de consultas acumuladas por pregunta.</p>' +
      (top.length ? barrasVistas : '<p class="suave">Aún no hay datos.</p>') + "</div>" +
      '<div class="panel-grafico"><h3>Valoraciones</h3>' +
      '<p class="subtitulo">Votos de los visitantes en cada pregunta.</p>' +
      '<div class="leyenda"><span><i style="background:var(--verde-dato)"></i>A favor</span>' +
      '<span><i style="background:var(--terracota)"></i>En contra</span></div>' +
      (valoradas.length ? barrasVotos : '<p class="suave">Aún no hay datos.</p>') + "</div>" +
      '<div class="barra-acciones"><button class="boton secundario mini" id="csv-stats">Descargar estadísticas (CSV)</button></div>';

    U.$("#csv-stats").addEventListener("click", () => {
      U.descargarCSV("estadisticas.csv", [
        ["Pregunta", "Consultas", "A favor", "En contra", "Secciones"],
        ...D.preguntas.map((p) => [
          p.pregunta, p.vistas || 0, p.likes || 0, p.dislikes || 0,
          (p.etiquetas || []).map(nombreSeccion).join(", ")
        ])
      ]);
    });
  }

  const nombreSeccion = (id) => {
    const s = D.secciones.find((x) => x.id === id);
    return s ? s.nombre : id;
  };

  /* ================= Preguntas ================= */

  function tabPreguntas(editar) {
    if (editar !== undefined) return editorPregunta(editar);

    const filas = D.preguntas.map((p) =>
      '<div class="fila-admin"><div class="info">' +
      "<strong>" + U.esc(p.pregunta) + "</strong>" +
      '<p class="suave">' +
      ((p.etiquetas || []).map(nombreSeccion).join(" · ") || "Sin etiquetas") +
      " — " + U.num(p.vistas || 0) + " consultas</p></div>" +
      (p.publicada === false ? '<span class="insignia apagada">Borrador</span>' : '<span class="insignia">Publicada</span>') +
      '<div class="acciones">' +
      '<button class="boton secundario mini" data-editar="' + p.id + '">Editar</button>' +
      '<button class="boton peligro mini" data-borrar="' + p.id + '">Eliminar</button>' +
      "</div></div>"
    ).join("");

    contenido().innerHTML =
      cabecera("Preguntas", "Crea y edita las preguntas del sitio. Las etiquetas colocan una misma pregunta en varias secciones sin tener que duplicarla.") +
      '<div class="barra-acciones"><button class="boton" id="nueva-pregunta">Nueva pregunta</button></div>' +
      '<div class="lista-admin">' + (filas || '<p class="vacio">No hay preguntas todavía.</p>') + "</div>";

    U.$("#nueva-pregunta").addEventListener("click", () => tabPreguntas(null));
    U.$$("[data-editar]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabPreguntas(D.preguntas.find((p) => p.id === b.dataset.editar))));
    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta pregunta de forma definitiva?")) return;
        await Store.borrar("preguntas", b.dataset.borrar);
        D.preguntas = D.preguntas.filter((p) => p.id !== b.dataset.borrar);
        U.aviso("Pregunta eliminada.");
        tabPreguntas();
      }));
  }

  function filaDinamica(nombre, valor, alto) {
    return (
      '<div class="fila-dinamica">' +
      (alto
        ? '<textarea data-lista="' + nombre + '" rows="3">' + U.esc(valor || "") + "</textarea>"
        : '<input data-lista="' + nombre + '" value="' + U.esc(valor || "") + '">') +
      '<button type="button" class="quitar" title="Quitar">&times;</button></div>'
    );
  }

  function bloqueDinamico(id, nombre, titulo, pista, valores, alto) {
    return (
      '<label class="campo" style="margin-bottom:6px"><span>' + titulo + "</span></label>" +
      (pista ? '<p class="pista">' + pista + "</p>" : "") +
      '<div class="lista-dinamica" id="' + id + '">' +
      (valores && valores.length ? valores.map((v) => filaDinamica(nombre, v, alto)).join("") : filaDinamica(nombre, "", alto)) +
      "</div>" +
      '<button type="button" class="boton secundario mini" data-anadir="' + id + '" data-nombre="' + nombre + '" data-alto="' + (alto ? 1 : 0) + '">Añadir otra</button>'
    );
  }

  function leerLista(form, nombre) {
    return U.$$('[data-lista="' + nombre + '"]', form).map((el) => el.value.trim()).filter(Boolean);
  }

  function editorPregunta(p) {
    const nuevo = !p;
    p = p || {
      id: "", pregunta: "", etiquetas: [], tiempo: null, publicada: true,
      vistas: 0, likes: 0, dislikes: 0, creada: new Date().toISOString(),
      corta: { respuesta: "", fuentes: [] },
      larga: { cuestionNum: "", cuestionTitulo: "", articuloNum: "", articuloTitulo: "", objeciones: [], enCambio: "", solucion: "", respuestas: [], notas: [] }
    };
    const c = p.corta || {}, l = p.larga || {};

    const chips = D.secciones.map((s) =>
      '<button type="button" class="chip' + ((p.etiquetas || []).includes(s.id) ? " activo" : "") + '" data-etiqueta="' + s.id + '">' +
      U.esc(s.nombre) + "</button>").join("");

    const opcionesTiempo = '<option value="">— Ninguno —</option>' + SEED.TIEMPOS.map((t) =>
      '<option value="' + t.id + '"' + (p.tiempo === t.id ? " selected" : "") + ">" + t.nombre + "</option>").join("");

    contenido().innerHTML =
      cabecera(nuevo ? "Nueva pregunta" : "Editar pregunta",
        "Rellena el formato corto siempre; el largo sigue la estructura de la Suma Teológica. En los textos puedes usar marcas [1], [2]… que enlazan con las notas al pie.") +
      '<form class="editor" id="form-pregunta">' +
      '<label class="campo"><span>Pregunta</span><input name="pregunta" required value="' + U.esc(p.pregunta) + '" placeholder="¿…?"></label>' +
      '<label class="campo" style="margin-bottom:6px"><span>Etiquetas (secciones donde aparece)</span></label>' +
      '<p class="pista">Una pregunta con varias etiquetas aparece en varias secciones sin duplicarse.</p>' +
      '<div class="etiquetas-conmutables">' + chips + "</div>" +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Tiempo litúrgico (opcional)</span><select name="tiempo">' + opcionesTiempo + "</select></label>" +
      '<label class="campo"><span>Estado</span><select name="publicada"><option value="1"' + (p.publicada !== false ? " selected" : "") + '>Publicada</option><option value="0"' + (p.publicada === false ? " selected" : "") + ">Borrador (oculta)</option></select></label>" +
      "</div>" +
      '<hr class="separador-suave"><h3>Formato corto</h3>' +
      '<label class="campo"><span>Respuesta corta</span><textarea name="respuestaCorta" rows="5" required>' + U.esc(c.respuesta || "") + "</textarea></label>" +
      bloqueDinamico("lista-fuentes", "fuente", "Fuentes", "Una por línea: cita bíblica, número del Catecismo, documento…", c.fuentes, false) +
      '<hr class="separador-suave"><h3>Formato largo (Suma Teológica)</h3>' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Número de cuestión</span><input name="cuestionNum" value="' + U.esc(l.cuestionNum || "") + '" placeholder="1"></label>' +
      '<label class="campo"><span>Título de la cuestión</span><input name="cuestionTitulo" value="' + U.esc(l.cuestionTitulo || "") + '" placeholder="Sobre…"></label>' +
      '<label class="campo"><span>Número de artículo</span><input name="articuloNum" value="' + U.esc(l.articuloNum || "") + '" placeholder="1"></label>' +
      '<label class="campo"><span>Título del artículo</span><input name="articuloTitulo" value="' + U.esc(l.articuloTitulo || "") + '" placeholder="¿…?"></label>' +
      "</div>" +
      bloqueDinamico("lista-objeciones", "objecion", "Objeciones", "«Parece que…»: las dificultades contra la respuesta.", l.objeciones, true) +
      '<label class="campo" style="margin-top:16px"><span>En cambio (sed contra)</span><textarea name="enCambio" rows="3">' + U.esc(l.enCambio || "") + "</textarea></label>" +
      '<label class="campo"><span>Solución (respondo diciendo que…)</span><textarea name="solucion" rows="7">' + U.esc(l.solucion || "") + "</textarea></label>" +
      bloqueDinamico("lista-respuestas", "respuesta", "Respuesta a las objeciones", "En el mismo orden que las objeciones.", l.respuestas, true) +
      "<div style='height:14px'></div>" +
      bloqueDinamico("lista-notas", "nota", "Notas al pie", "La nota 1 corresponde a la marca [1] en el texto.", l.notas, false) +
      '<hr class="separador-suave">' +
      '<div class="barra-acciones">' +
      '<button class="boton" type="submit">' + (nuevo ? "Crear pregunta" : "Guardar cambios") + "</button>" +
      '<button class="boton secundario" type="button" id="cancelar-pregunta">Volver</button>' +
      "</div></form>";

    const form = U.$("#form-pregunta");

    form.addEventListener("click", (ev) => {
      const chip = ev.target.closest("[data-etiqueta]");
      if (chip) { chip.classList.toggle("activo"); return; }
      const anadir = ev.target.closest("[data-anadir]");
      if (anadir) {
        const cont = U.$("#" + anadir.dataset.anadir);
        cont.insertAdjacentHTML("beforeend", filaDinamica(anadir.dataset.nombre, "", anadir.dataset.alto === "1"));
        return;
      }
      const quitar = ev.target.closest(".quitar");
      if (quitar) quitar.closest(".fila-dinamica").remove();
    });

    U.$("#cancelar-pregunta").addEventListener("click", () => tabPreguntas());

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(form);
      const etiquetas = U.$$("[data-etiqueta].activo", form).map((x) => x.dataset.etiqueta);
      if (!etiquetas.length && !confirm("No marcaste ninguna etiqueta: la pregunta no aparecerá en ninguna sección. ¿Guardar igualmente?")) return;
      const q = Object.assign({}, p, {
        pregunta: String(f.get("pregunta")).trim(),
        etiquetas,
        tiempo: String(f.get("tiempo")) || null,
        publicada: f.get("publicada") === "1",
        corta: {
          respuesta: String(f.get("respuestaCorta")).trim(),
          fuentes: leerLista(form, "fuente")
        },
        larga: {
          cuestionNum: String(f.get("cuestionNum")).trim(),
          cuestionTitulo: String(f.get("cuestionTitulo")).trim(),
          articuloNum: String(f.get("articuloNum")).trim(),
          articuloTitulo: String(f.get("articuloTitulo")).trim(),
          objeciones: leerLista(form, "objecion"),
          enCambio: String(f.get("enCambio")).trim(),
          solucion: String(f.get("solucion")).trim(),
          respuestas: leerLista(form, "respuesta"),
          notas: leerLista(form, "nota")
        }
      });
      if (!q.id) q.id = U.uid();
      await Store.guardar("preguntas", q);
      const i = D.preguntas.findIndex((x) => x.id === q.id);
      if (i >= 0) D.preguntas[i] = q; else D.preguntas.push(q);
      U.aviso("Pregunta guardada.");
      tabPreguntas();
    });
  }

  /* ================= Secciones ================= */

  function tabSecciones(editar) {
    const filas = D.secciones.map((s) =>
      '<div class="fila-admin"><div class="info">' +
      "<strong>" + U.esc(s.nombre) + (s.liturgico ? ' <span class="insignia">Litúrgica</span>' : "") + "</strong>" +
      '<p class="suave">' + U.esc(s.descripcion || "") + "</p></div>" +
      '<span class="suave" style="font-size:13px">' +
      D.preguntas.filter((p) => (p.etiquetas || []).includes(s.id)).length + " preguntas</span>" +
      '<div class="acciones">' +
      '<button class="boton secundario mini" data-editar="' + s.id + '">Editar</button>' +
      '<button class="boton peligro mini" data-borrar="' + s.id + '">Eliminar</button>' +
      "</div></div>"
    ).join("");

    const s = editar || null;
    const formulario = editar === undefined ? "" :
      '<form class="editor" id="form-seccion">' +
      "<h3>" + (s ? "Editar sección" : "Nueva sección") + "</h3>" +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Nombre</span><input name="nombre" required value="' + U.esc(s ? s.nombre : "") + '"></label>' +
      '<label class="campo"><span>Orden</span><input name="orden" type="number" value="' + (s ? (s.orden || 0) : D.secciones.length) + '"></label>' +
      "</div>" +
      '<label class="campo"><span>Descripción</span><textarea name="descripcion" rows="2">' + U.esc(s ? s.descripcion || "" : "") + "</textarea></label>" +
      '<label class="campo"><span><input type="checkbox" name="liturgico" style="width:auto;margin-right:8px"' + (s && s.liturgico ? " checked" : "") + ">Sección por tiempo litúrgico (muestra filtros de Adviento, Cuaresma…)</span></label>" +
      '<div class="barra-acciones">' +
      '<button class="boton" type="submit">Guardar</button>' +
      '<button class="boton secundario" type="button" id="cancelar-seccion">Cancelar</button>' +
      "</div></form>";

    contenido().innerHTML =
      cabecera("Secciones", "Las columnas temáticas del sitio. Puedes añadir, modificar o eliminar; las preguntas se asignan con etiquetas desde su editor.") +
      '<div class="barra-acciones"><button class="boton" id="nueva-seccion">Nueva sección</button></div>' +
      formulario +
      '<div class="lista-admin">' + (filas || '<p class="vacio">No hay secciones.</p>') + "</div>";

    U.$("#nueva-seccion").addEventListener("click", () => tabSecciones(null));
    U.$$("[data-editar]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabSecciones(D.secciones.find((x) => x.id === b.dataset.editar))));
    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        const sec = D.secciones.find((x) => x.id === b.dataset.borrar);
        const n = D.preguntas.filter((p) => (p.etiquetas || []).includes(sec.id)).length;
        if (!confirm('¿Eliminar la sección "' + sec.nombre + '"?' + (n ? " Sus " + n + " preguntas no se borran: solo pierden esta etiqueta." : ""))) return;
        await Store.borrar("secciones", sec.id);
        for (const p of D.preguntas) {
          if ((p.etiquetas || []).includes(sec.id)) {
            p.etiquetas = p.etiquetas.filter((e) => e !== sec.id);
            await Store.guardar("preguntas", p);
          }
        }
        D.secciones = D.secciones.filter((x) => x.id !== sec.id);
        U.aviso("Sección eliminada.");
        tabSecciones();
      }));

    const form = U.$("#form-seccion");
    if (form) {
      U.$("#cancelar-seccion").addEventListener("click", () => tabSecciones());
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const f = new FormData(form);
        const nuevo = {
          id: s ? s.id : String(f.get("nombre")).trim().toLowerCase()
            .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || U.uid(),
          nombre: String(f.get("nombre")).trim(),
          descripcion: String(f.get("descripcion")).trim(),
          orden: Number(f.get("orden")) || 0,
          liturgico: !!f.get("liturgico")
        };
        await Store.guardar("secciones", nuevo);
        const i = D.secciones.findIndex((x) => x.id === nuevo.id);
        if (i >= 0) D.secciones[i] = nuevo; else D.secciones.push(nuevo);
        D.secciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        U.aviso("Sección guardada.");
        tabSecciones();
      });
    }
  }

  /* ================= Buzones y registros ================= */

  function tablaConCSV(opciones) {
    const { titulo, descripcion, coleccion, columnas, filaDatos, csvNombre, vacio } = opciones;
    const datos = D[coleccion];
    contenido().innerHTML =
      cabecera(titulo, descripcion) +
      '<div class="barra-acciones">' +
      '<button class="boton secundario mini" id="descargar-csv">Descargar CSV</button>' +
      '<span class="suave" style="font-size:13px">' + datos.length + " registros</span></div>" +
      (datos.length
        ? '<div class="panel-grafico envoltura-tabla"><table class="tabla"><thead><tr>' +
          columnas.map((c) => "<th>" + c + "</th>").join("") + "<th></th></tr></thead><tbody>" +
          datos.map((d) =>
            "<tr>" + filaDatos(d).map((v, i) =>
              '<td class="' + (i === filaDatos(d).length - 1 ? "celda-mensaje" : "") + '">' + U.esc(v) + "</td>").join("") +
            '<td><button class="boton peligro mini" data-borrar="' + d.id + '">Borrar</button></td></tr>'
          ).join("") + "</tbody></table></div>"
        : '<p class="vacio">' + vacio + "</p>");

    U.$("#descargar-csv").addEventListener("click", () => {
      U.descargarCSV(csvNombre, [columnas, ...datos.map(filaDatos)]);
    });
    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Borrar este registro?")) return;
        await Store.borrar(coleccion, b.dataset.borrar);
        D[coleccion] = D[coleccion].filter((x) => x.id !== b.dataset.borrar);
        dibujarTab();
      }));
  }

  function tabBuzon() {
    tablaConCSV({
      titulo: "Buzón de preguntas",
      descripcion: "Las preguntas anónimas que dejan los visitantes. Descárgalas en CSV para trabajarlas y conviértelas en preguntas publicadas.",
      coleccion: "buzon",
      columnas: ["Fecha", "Firma", "Tema", "Pregunta"],
      filaDatos: (d) => [fechaTabla(d.fecha), d.nombre || "Anónimo", d.seccion || "", d.mensaje || ""],
      csvNombre: "buzon-preguntas.csv",
      vacio: "El buzón está vacío por ahora."
    });
  }

  function tabQuejas() {
    tablaConCSV({
      titulo: "Quejas y sugerencias",
      descripcion: "Lo que la comunidad quiere decirte. También se puede descargar en CSV.",
      coleccion: "quejas",
      columnas: ["Fecha", "Tipo", "Mensaje"],
      filaDatos: (d) => [fechaTabla(d.fecha), d.tipo || "", d.mensaje || ""],
      csvNombre: "quejas-sugerencias.csv",
      vacio: "No hay quejas ni sugerencias todavía."
    });
  }

  function tabRegistros() {
    tablaConCSV({
      titulo: "Visitantes",
      descripcion: "La ficha ligera que rellenan los visitantes al entrar: nombre o apodo, edad y estado.",
      coleccion: "registros",
      columnas: ["Fecha", "Nombre o apodo", "Edad", "Estado"],
      filaDatos: (d) => [fechaTabla(d.fecha), d.nombre || "", d.edad || "", d.estado || ""],
      csvNombre: "visitantes.csv",
      vacio: "Nadie se ha presentado todavía."
    });
  }

  /* ================= Calendario ================= */

  const opcionesColor = (sel) => Object.keys(COLORES).map((k) =>
    '<option value="' + k + '"' + (sel === k ? " selected" : "") + ">" + COLORES[k].nombre + "</option>").join("");

  function tabCalendario(editarEvento, editarTemporada) {
    const e = editarEvento || null;
    const t = editarTemporada || null;

    const formEvento = editarEvento === undefined ? "" :
      '<form class="editor" id="form-evento"><h3>' + (e ? "Editar evento" : "Nuevo evento") + "</h3>" +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Fecha</span><input name="fecha" type="date" required value="' + U.esc(e ? e.fecha : "") + '"></label>' +
      '<label class="campo"><span>Color litúrgico</span><select name="color">' + opcionesColor(e ? e.color : "verde") + "</select></label>" +
      "</div>" +
      '<label class="campo"><span>Título</span><input name="titulo" required value="' + U.esc(e ? e.titulo : "") + '"></label>' +
      '<label class="campo"><span>Detalle (opcional)</span><input name="detalle" value="' + U.esc(e ? e.detalle || "" : "") + '"></label>' +
      '<div class="barra-acciones"><button class="boton" type="submit">Guardar</button>' +
      '<button class="boton secundario" type="button" data-cancelar>Cancelar</button></div></form>';

    const formTemporada = editarTemporada === undefined ? "" :
      '<form class="editor" id="form-temporada"><h3>' + (t ? "Editar temporada" : "Nueva temporada") + "</h3>" +
      '<p class="pista">Las temporadas tiñen el calendario con el color del tiempo litúrgico (Adviento, Cuaresma…). Fechas manuales: ajústalas cada año.</p>' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Nombre</span><input name="nombre" required value="' + U.esc(t ? t.nombre : "") + '"></label>' +
      '<label class="campo"><span>Color</span><select name="color">' + opcionesColor(t ? t.color : "verde") + "</select></label>" +
      '<label class="campo"><span>Inicio</span><input name="inicio" type="date" required value="' + U.esc(t ? t.inicio : "") + '"></label>' +
      '<label class="campo"><span>Fin</span><input name="fin" type="date" required value="' + U.esc(t ? t.fin : "") + '"></label>' +
      "</div>" +
      '<div class="barra-acciones"><button class="boton" type="submit">Guardar</button>' +
      '<button class="boton secundario" type="button" data-cancelar>Cancelar</button></div></form>';

    const filasEventos = D.eventos.map((ev) =>
      '<div class="fila-admin"><span class="punto-color" style="background:' + (COLORES[ev.color] ? COLORES[ev.color].css : "#999") + '"></span>' +
      '<div class="info"><strong>' + U.esc(ev.titulo) + "</strong>" +
      '<p class="suave">' + U.fechaLarga(ev.fecha) + " " + U.desdeISO(ev.fecha).getFullYear() +
      (ev.detalle ? " — " + U.esc(ev.detalle) : "") + "</p></div>" +
      '<div class="acciones"><button class="boton secundario mini" data-editar-evento="' + ev.id + '">Editar</button>' +
      '<button class="boton peligro mini" data-borrar-evento="' + ev.id + '">Eliminar</button></div></div>'
    ).join("");

    const filasTemporadas = D.temporadas.map((tp) =>
      '<div class="fila-admin"><span class="punto-color" style="background:' + (COLORES[tp.color] ? COLORES[tp.color].css : "#999") + '"></span>' +
      '<div class="info"><strong>' + U.esc(tp.nombre) + "</strong>" +
      '<p class="suave">Del ' + U.fechaCorta(tp.inicio) + " al " + U.fechaCorta(tp.fin) + "</p></div>" +
      '<div class="acciones"><button class="boton secundario mini" data-editar-temporada="' + tp.id + '">Editar</button>' +
      '<button class="boton peligro mini" data-borrar-temporada="' + tp.id + '">Eliminar</button></div></div>'
    ).join("");

    contenido().innerHTML =
      cabecera("Calendario litúrgico", "Un calendario manual: tú decides los eventos y las temporadas que tiñen los días. En el sitio se ve por semana o por mes, con la lista de lo que sigue.") +
      '<div class="barra-acciones">' +
      '<button class="boton" id="nuevo-evento">Nuevo evento</button>' +
      '<button class="boton dorado" id="nueva-temporada">Nueva temporada</button></div>' +
      formEvento + formTemporada +
      "<h3 style='margin:18px 0 12px'>Eventos</h3>" +
      '<div class="lista-admin">' + (filasEventos || '<p class="vacio">Sin eventos.</p>') + "</div>" +
      "<h3 style='margin:26px 0 12px'>Temporadas litúrgicas</h3>" +
      '<div class="lista-admin">' + (filasTemporadas || '<p class="vacio">Sin temporadas definidas.</p>') + "</div>";

    U.$("#nuevo-evento").addEventListener("click", () => tabCalendario(null, undefined));
    U.$("#nueva-temporada").addEventListener("click", () => tabCalendario(undefined, null));
    U.$$("[data-cancelar]", contenido()).forEach((b) => b.addEventListener("click", () => tabCalendario()));

    U.$$("[data-editar-evento]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabCalendario(D.eventos.find((x) => x.id === b.dataset.editarEvento), undefined)));
    U.$$("[data-borrar-evento]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este evento?")) return;
        await Store.borrar("eventos", b.dataset.borrarEvento);
        D.eventos = D.eventos.filter((x) => x.id !== b.dataset.borrarEvento);
        tabCalendario();
      }));
    U.$$("[data-editar-temporada]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabCalendario(undefined, D.temporadas.find((x) => x.id === b.dataset.editarTemporada))));
    U.$$("[data-borrar-temporada]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta temporada?")) return;
        await Store.borrar("temporadas", b.dataset.borrarTemporada);
        D.temporadas = D.temporadas.filter((x) => x.id !== b.dataset.borrarTemporada);
        tabCalendario();
      }));

    const fe = U.$("#form-evento");
    if (fe) fe.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(fe);
      const nuevo = {
        id: e ? e.id : U.uid(),
        fecha: String(f.get("fecha")),
        titulo: String(f.get("titulo")).trim(),
        detalle: String(f.get("detalle")).trim(),
        color: String(f.get("color"))
      };
      await Store.guardar("eventos", nuevo);
      const i = D.eventos.findIndex((x) => x.id === nuevo.id);
      if (i >= 0) D.eventos[i] = nuevo; else D.eventos.push(nuevo);
      D.eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
      U.aviso("Evento guardado.");
      tabCalendario();
    });

    const ft = U.$("#form-temporada");
    if (ft) ft.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(ft);
      const nuevo = {
        id: t ? t.id : U.uid(),
        nombre: String(f.get("nombre")).trim(),
        inicio: String(f.get("inicio")),
        fin: String(f.get("fin")),
        color: String(f.get("color"))
      };
      if (nuevo.fin < nuevo.inicio) { U.aviso("La fecha de fin es anterior al inicio."); return; }
      await Store.guardar("temporadas", nuevo);
      const i = D.temporadas.findIndex((x) => x.id === nuevo.id);
      if (i >= 0) D.temporadas[i] = nuevo; else D.temporadas.push(nuevo);
      D.temporadas.sort((a, b) => a.inicio.localeCompare(b.inicio));
      U.aviso("Temporada guardada.");
      tabCalendario();
    });
  }

  /* ================= Santoral ================= */

  function tabSantoral(editar) {
    const s = editar || null;
    const form = editar === undefined ? "" :
      '<form class="editor" id="form-santo"><h3>' + (s ? "Editar santo" : "Añadir al santoral") + "</h3>" +
      '<p class="pista">La fecha se repite cada año (día y mes).</p>' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Fecha</span><input name="fecha" type="date" required value="' +
      U.esc(s ? "2026-" + s.fecha : "") + '"></label>' +
      '<label class="campo"><span>Nota (memoria, fiesta…)</span><input name="nota" value="' + U.esc(s ? s.nota || "" : "") + '"></label>' +
      "</div>" +
      '<label class="campo"><span>Santo o celebración</span><input name="santo" required value="' + U.esc(s ? s.santo : "") + '"></label>' +
      '<label class="campo"><span>Ficha completa (opcional)</span><select name="santoId">' +
      '<option value="">— Sin ficha —</option>' +
      D.santos.map((x) => '<option value="' + x.id + '"' + (s && s.santoId === x.id ? " selected" : "") + ">" + U.esc(x.nombre) + "</option>").join("") +
      "</select></label>" +
      '<p class="pista">Si la fiesta de una ficha coincide con esta fecha, el enlace se crea solo; el selector es para casos especiales.</p>' +
      '<div class="barra-acciones"><button class="boton" type="submit">Guardar</button>' +
      '<button class="boton secundario" type="button" data-cancelar>Cancelar</button></div></form>';

    const filas = D.santoral.map((x) => {
      const [m, d] = String(x.fecha).split("-").map(Number);
      return (
        '<div class="fila-admin"><div class="info"><strong>' + U.esc(x.santo) + "</strong>" +
        '<p class="suave">' + d + " de " + (U.MESES[m - 1] || "?") + (x.nota ? " — " + U.esc(x.nota) : "") + "</p></div>" +
        '<div class="acciones"><button class="boton secundario mini" data-editar="' + x.id + '">Editar</button>' +
        '<button class="boton peligro mini" data-borrar="' + x.id + '">Eliminar</button></div></div>'
      );
    }).join("");

    contenido().innerHTML =
      cabecera("Santoral", "El santo del día que se muestra junto al calendario. Añade los que celebren en tu comunidad.") +
      '<div class="barra-acciones"><button class="boton" id="nuevo-santo">Añadir santo</button></div>' +
      form +
      '<div class="lista-admin">' + (filas || '<p class="vacio">El santoral está vacío.</p>') + "</div>";

    U.$("#nuevo-santo").addEventListener("click", () => tabSantoral(null));
    U.$$("[data-cancelar]", contenido()).forEach((b) => b.addEventListener("click", () => tabSantoral()));
    U.$$("[data-editar]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabSantoral(D.santoral.find((x) => x.id === b.dataset.editar))));
    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta entrada del santoral?")) return;
        await Store.borrar("santoral", b.dataset.borrar);
        D.santoral = D.santoral.filter((x) => x.id !== b.dataset.borrar);
        tabSantoral();
      }));

    const fs = U.$("#form-santo");
    if (fs) fs.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(fs);
      const nuevo = {
        id: s ? s.id : U.uid(),
        fecha: String(f.get("fecha")).slice(5),
        santo: String(f.get("santo")).trim(),
        nota: String(f.get("nota")).trim(),
        santoId: String(f.get("santoId")) || null
      };
      await Store.guardar("santoral", nuevo);
      const i = D.santoral.findIndex((x) => x.id === nuevo.id);
      if (i >= 0) D.santoral[i] = nuevo; else D.santoral.push(nuevo);
      D.santoral.sort((a, b) => a.fecha.localeCompare(b.fecha));
      U.aviso("Santoral actualizado.");
      tabSantoral();
    });
  }

  /* ================= Fichas de santos ================= */

  function tabFichas(editar) {
    if (editar !== undefined) return editorFicha(editar);

    const filas = D.santos.map((s) => {
      const [m, d] = String(s.fiesta || "").split("-").map(Number);
      return (
        '<div class="fila-admin"><div class="info"><strong>' + U.esc(s.nombre) + "</strong>" +
        '<p class="suave">' + (s.titulo ? U.esc(s.titulo) + " — " : "") +
        (m ? "fiesta el " + d + " de " + U.MESES[m - 1] : "sin fiesta asignada") +
        " — " + ((s.imagenes || []).length) + " imágenes</p></div>" +
        '<div class="acciones"><button class="boton secundario mini" data-editar="' + s.id + '">Editar</button>' +
        '<button class="boton peligro mini" data-borrar="' + s.id + '">Eliminar</button></div></div>'
      );
    }).join("");

    contenido().innerHTML =
      cabecera("Fichas de santos", "La vista completa de cada santo: galería de imágenes, historia, milagros atribuidos, frases, obras y más. Se enlazan solas con el santoral cuando la fiesta coincide.") +
      '<div class="barra-acciones"><button class="boton" id="nueva-ficha">Nueva ficha</button>' +
      '<a class="boton secundario mini" href="index.html#/santos" target="_blank" rel="noopener">Ver la galería pública</a></div>' +
      '<div class="lista-admin">' + (filas || '<p class="vacio">Aún no hay fichas de santos.</p>') + "</div>";

    U.$("#nueva-ficha").addEventListener("click", () => tabFichas(null));
    U.$$("[data-editar]", contenido()).forEach((b) =>
      b.addEventListener("click", () => tabFichas(D.santos.find((x) => x.id === b.dataset.editar))));
    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta ficha de santo?")) return;
        await Store.borrar("santos", b.dataset.borrar);
        D.santos = D.santos.filter((x) => x.id !== b.dataset.borrar);
        U.aviso("Ficha eliminada.");
        tabFichas();
      }));
  }

  function editorFicha(s) {
    const nuevo = !s;
    s = s || {
      id: "", nombre: "", titulo: "", fiesta: "", nacimiento: "", fallecimiento: "",
      patronazgo: "", biografia: "", milagros: [], frases: [], obras: [], extra: "", imagenes: []
    };
    const imagenes = (s.imagenes || []).slice();

    contenido().innerHTML =
      cabecera(nuevo ? "Nueva ficha de santo" : "Editar ficha", "Rellena solo lo que tengas: los bloques vacíos no se muestran en el sitio.") +
      '<form class="editor" id="form-ficha">' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Nombre</span><input name="nombre" required value="' + U.esc(s.nombre) + '" placeholder="San…"></label>' +
      '<label class="campo"><span>Título</span><input name="titulo" value="' + U.esc(s.titulo || "") + '" placeholder="Mártir, doctora de la Iglesia…"></label>' +
      '<label class="campo"><span>Fiesta (se repite cada año)</span><input name="fiesta" type="date" value="' + U.esc(s.fiesta ? "2026-" + s.fiesta : "") + '"></label>' +
      '<label class="campo"><span>Patronazgo</span><input name="patronazgo" value="' + U.esc(s.patronazgo || "") + '"></label>' +
      '<label class="campo"><span>Nacimiento</span><input name="nacimiento" value="' + U.esc(s.nacimiento || "") + '" placeholder="Lugar, año"></label>' +
      '<label class="campo"><span>Fallecimiento</span><input name="fallecimiento" value="' + U.esc(s.fallecimiento || "") + '" placeholder="Lugar, fecha"></label>' +
      "</div>" +
      '<hr class="separador-suave"><h3>Galería de imágenes</h3>' +
      '<p class="pista">La primera imagen es el retrato principal. En modo online se suben en calidad original.</p>' +
      '<div class="galeria-editor" id="galeria-editor"></div>' +
      '<input type="file" accept="image/*" multiple hidden id="archivos-ficha">' +
      '<button type="button" class="boton secundario mini" id="subir-imagenes">Añadir imágenes</button>' +
      '<hr class="separador-suave"><h3>Contenido</h3>' +
      '<label class="campo"><span>Su historia</span><textarea name="biografia" rows="8" placeholder="Separa los párrafos con una línea en blanco.">' + U.esc(s.biografia || "") + "</textarea></label>" +
      bloqueDinamico("lista-milagros", "milagro", "Milagros atribuidos", "Uno por recuadro.", s.milagros, true) +
      "<div style='height:14px'></div>" +
      bloqueDinamico("lista-frases", "frase", "Frases", "Sus palabras, una por recuadro.", s.frases, true) +
      "<div style='height:14px'></div>" +
      bloqueDinamico("lista-obras", "obra", "Obras", "Escritos, fundaciones, legado…", s.obras, true) +
      '<label class="campo" style="margin-top:16px"><span>Para saber más (opcional)</span><textarea name="extra" rows="3">' + U.esc(s.extra || "") + "</textarea></label>" +
      '<hr class="separador-suave">' +
      '<div class="barra-acciones">' +
      '<button class="boton" type="submit">' + (nuevo ? "Crear ficha" : "Guardar cambios") + "</button>" +
      '<button class="boton secundario" type="button" id="cancelar-ficha">Volver</button>' +
      "</div></form>";

    const form = U.$("#form-ficha");
    const galeria = U.$("#galeria-editor");

    function pintarGaleria() {
      galeria.innerHTML = imagenes.length
        ? imagenes.map((img, i) =>
            '<div class="galeria-editor-item" style="background-image:' + U.cssUrl(img) + '">' +
            (i === 0 ? '<span class="insignia" style="position:absolute;top:6px;left:6px">Principal</span>' : "") +
            '<button type="button" class="quitar" data-imagen="' + i + '" title="Quitar">&times;</button></div>'
          ).join("")
        : '<p class="suave" style="font-size:13px;margin:0">Sin imágenes todavía.</p>';
      U.$$("[data-imagen]", galeria).forEach((b) =>
        b.addEventListener("click", () => { imagenes.splice(Number(b.dataset.imagen), 1); pintarGaleria(); }));
    }
    pintarGaleria();

    const entrada = U.$("#archivos-ficha");
    U.$("#subir-imagenes").addEventListener("click", () => entrada.click());
    entrada.addEventListener("change", async () => {
      const archivos = Array.from(entrada.files || []);
      if (!archivos.length) return;
      const boton = U.$("#subir-imagenes");
      boton.disabled = true;
      for (let i = 0; i < archivos.length; i++) {
        boton.textContent = "Subiendo " + (i + 1) + " de " + archivos.length + "…";
        try {
          imagenes.push(await Store.subirImagen(archivos[i], "santos"));
        } catch (e) {
          U.aviso("No se pudo subir una imagen: " + (e.message || e));
        }
      }
      entrada.value = "";
      boton.disabled = false;
      boton.textContent = "Añadir imágenes";
      pintarGaleria();
    });

    form.addEventListener("click", (ev) => {
      const anadir = ev.target.closest("[data-anadir]");
      if (anadir) {
        U.$("#" + anadir.dataset.anadir).insertAdjacentHTML("beforeend",
          filaDinamica(anadir.dataset.nombre, "", anadir.dataset.alto === "1"));
        return;
      }
      const quitar = ev.target.closest(".fila-dinamica .quitar");
      if (quitar) quitar.closest(".fila-dinamica").remove();
    });

    U.$("#cancelar-ficha").addEventListener("click", () => tabFichas());

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(form);
      const ficha = Object.assign({}, s, {
        nombre: String(f.get("nombre")).trim(),
        titulo: String(f.get("titulo")).trim(),
        fiesta: String(f.get("fiesta")).slice(5),
        patronazgo: String(f.get("patronazgo")).trim(),
        nacimiento: String(f.get("nacimiento")).trim(),
        fallecimiento: String(f.get("fallecimiento")).trim(),
        biografia: String(f.get("biografia")).trim(),
        milagros: leerLista(form, "milagro"),
        frases: leerLista(form, "frase"),
        obras: leerLista(form, "obra"),
        extra: String(f.get("extra")).trim(),
        imagenes
      });
      if (!ficha.id) ficha.id = U.uid();
      await Store.guardar("santos", ficha);
      const i = D.santos.findIndex((x) => x.id === ficha.id);
      if (i >= 0) D.santos[i] = ficha; else D.santos.push(ficha);
      D.santos.sort((a, b) => String(a.fiesta || "").localeCompare(String(b.fiesta || "")));
      U.aviso("Ficha guardada.");
      tabFichas();
    });
  }

  /* ================= Administradores ================= */

  function tabAdministradores() {
    if (Store.modo !== "local") {
      contenido().innerHTML =
        cabecera("Administradores", "En modo online los administradores son usuarios de Supabase: cualquiera de ellos puede crear otros desde el panel de Supabase en un minuto.") +
        '<div class="editor"><h3>Añadir otro administrador</h3>' +
        '<ol style="line-height:1.9;padding-left:20px;margin:0 0 8px">' +
        "<li>Entra en <strong>supabase.com</strong> con la cuenta del proyecto.</li>" +
        "<li>Abre <strong>Authentication → Users → Add user → Create new user</strong>.</li>" +
        "<li>Escribe el correo y una contraseña fuerte y marca <strong>Auto Confirm User</strong>.</li>" +
        "<li>Esa persona ya puede entrar en <code>admin.html</code> con esas credenciales.</li></ol>" +
        '<p class="pista">Por seguridad no actives el registro público (Sign ups) en Supabase: cualquier usuario autenticado tiene permisos de administración sobre el contenido.</p></div>' +
        '<div class="editor"><h3>Tu cuenta</h3>' +
        '<p class="suave" style="font-size:14px">Sesión iniciada como <strong>' + U.esc((Store.usuarioActual() || {}).nombre || "") + "</strong>.</p>" +
        '<div class="barra-acciones"><button class="boton secundario mini" id="cambiar-clave-nube">Cambiar mi contraseña</button></div></div>';
      const b = U.$("#cambiar-clave-nube");
      b.addEventListener("click", async () => {
        const nueva = prompt("Nueva contraseña (mínimo 8 caracteres):");
        if (!nueva || nueva.length < 8) { if (nueva !== null) U.aviso("Demasiado corta."); return; }
        const ok = await Store.cambiarClave(null, nueva);
        U.aviso(ok ? "Contraseña actualizada." : "No se pudo cambiar la contraseña.");
      });
      return;
    }

    const actual = Store.usuarioActual() || {};
    const filas = D.usuarios.map((u) =>
      '<div class="fila-admin"><div class="info"><strong>' + U.esc(u.usuario) +
      (u.id === actual.id ? ' <span class="insignia">Tú</span>' : "") + "</strong>" +
      '<p class="suave">Creado el ' + fechaTabla(u.creado).split(" ")[0] + "</p></div>" +
      '<div class="acciones">' +
      (u.id === actual.id
        ? '<button class="boton secundario mini" data-clave="' + u.id + '">Cambiar mi contraseña</button>'
        : '<button class="boton peligro mini" data-borrar="' + u.id + '">Eliminar</button>') +
      "</div></div>"
    ).join("");

    contenido().innerHTML =
      cabecera("Administradores", "Los usuarios que pueden entrar a este panel en este navegador. Cualquier administrador puede crear otros." +
        (Store.usaClaveInicial() ? " Atención: la cuenta admin conserva la contraseña inicial; cámbiala ahora." : "")) +
      '<form class="editor" id="form-usuario"><h3>Nuevo administrador</h3>' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Usuario</span><input name="usuario" required minlength="3" maxlength="30" placeholder="nombre corto, sin espacios"></label>' +
      '<label class="campo"><span>Contraseña</span><input name="clave" type="password" required minlength="6"></label>' +
      "</div>" +
      '<div class="barra-acciones"><button class="boton" type="submit">Crear administrador</button></div></form>' +
      '<div class="lista-admin">' + filas + "</div>" +
      '<p class="pista" style="margin-top:16px">Nota del modo local: estos usuarios viven en este navegador. En el sitio publicado con Supabase, los administradores se gestionan desde Supabase (esta pestaña te lo explica al estar en modo online).</p>';

    U.$("#form-usuario").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const usuario = String(f.get("usuario")).trim().toLowerCase().replace(/\s+/g, "");
      if (D.usuarios.some((u) => u.usuario === usuario)) { U.aviso("Ese usuario ya existe."); return; }
      const nuevo = {
        id: U.uid(),
        usuario,
        hash: await U.sha256(String(f.get("clave"))),
        creado: new Date().toISOString()
      };
      await Store.guardar("usuarios", nuevo);
      D.usuarios.push(nuevo);
      U.aviso("Administrador «" + usuario + "» creado.");
      tabAdministradores();
    });

    U.$$("[data-borrar]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        if (D.usuarios.length <= 1) { U.aviso("Debe quedar al menos un administrador."); return; }
        const u = D.usuarios.find((x) => x.id === b.dataset.borrar);
        if (!confirm("¿Eliminar al administrador «" + u.usuario + "»?")) return;
        await Store.borrar("usuarios", u.id);
        D.usuarios = D.usuarios.filter((x) => x.id !== u.id);
        U.aviso("Administrador eliminado.");
        tabAdministradores();
      }));

    U.$$("[data-clave]", contenido()).forEach((b) =>
      b.addEventListener("click", async () => {
        const nueva = prompt("Nueva contraseña (mínimo 6 caracteres):");
        if (!nueva || nueva.length < 6) { if (nueva !== null) U.aviso("Demasiado corta."); return; }
        await Store.cambiarClave(b.dataset.clave, nueva);
        const u = D.usuarios.find((x) => x.id === b.dataset.clave);
        if (u) u.hash = await U.sha256(nueva);
        U.aviso("Contraseña actualizada.");
        tabAdministradores();
      }));
  }

  /* ================= Apariencia ================= */

  function zonaImagen(id, titulo, valor, pista, esLogo) {
    return (
      '<div class="zona-imagen" id="zona-' + id + '">' +
      '<div class="vista-previa' + (esLogo ? " logo-previa" : "") + '"' +
      (valor ? ' style="background-image:' + U.cssUrl(valor) + '"' : "") + ">" +
      (valor ? "" : "Sin imagen") + "</div>" +
      "<strong style='font-size:14px'>" + titulo + "</strong>" +
      '<p class="suave" style="font-size:12.5px;margin:4px 0 10px">' + pista + "</p>" +
      '<input type="file" accept="image/*" hidden id="archivo-' + id + '">' +
      '<div style="display:flex;gap:8px;justify-content:center">' +
      '<button class="boton secundario mini" data-subir="' + id + '">Subir imagen</button>' +
      (valor ? '<button class="boton peligro mini" data-quitar="' + id + '">Quitar</button>' : "") +
      "</div></div>"
    );
  }

  function tabApariencia() {
    const a = D.ajustes;
    contenido().innerHTML =
      cabecera("Apariencia", "Decora el sitio con un fondo de pantalla y dos imágenes verticales laterales. En modo online las imágenes se suben a Supabase en su calidad original.") +
      '<div class="rejilla-apariencia">' +
      zonaImagen("fondo", "Fondo de pantalla", a.fondo, "Se muestra detrás de todo el contenido, con un velo para que el texto respire.", false) +
      zonaImagen("lateralIzq", "Lateral izquierda", a.lateralIzq, "Imagen vertical decorativa (pantallas grandes).", false) +
      zonaImagen("lateralDer", "Lateral derecha", a.lateralDer, "Imagen vertical decorativa (pantallas grandes).", false) +
      "</div>" +
      '<div class="editor" style="margin-top:22px"><h3>Intensidad del velo</h3>' +
      '<p class="pista">Cuanto más bajo, más se ve el fondo. Solo aplica si hay fondo de pantalla.</p>' +
      '<input type="range" id="velo" min="0.55" max="1" step="0.05" value="' + (a.veloFondo != null ? a.veloFondo : 0.9) + '" style="width:min(360px,100%)">' +
      "</div>";

    conectarZonas(["fondo", "lateralIzq", "lateralDer"], { fondo: "fondo", lateralIzq: "lateral", lateralDer: "lateral" }, tabApariencia);

    U.$("#velo").addEventListener("change", async (ev) => {
      D.ajustes.veloFondo = Number(ev.target.value);
      await Store.setAjustes({ veloFondo: D.ajustes.veloFondo });
      U.aviso("Velo actualizado.");
    });
  }

  function conectarZonas(campos, usos, refrescar) {
    campos.forEach((campo) => {
      const botonSubir = U.$('[data-subir="' + campo + '"]');
      const entrada = U.$("#archivo-" + campo);
      if (botonSubir) botonSubir.addEventListener("click", () => entrada.click());
      if (entrada) entrada.addEventListener("change", async () => {
        const archivo = entrada.files[0];
        if (!archivo) return;
        botonSubir.disabled = true;
        botonSubir.textContent = "Subiendo…";
        try {
          const url = await Store.subirImagen(archivo, usos[campo] || "imagen");
          D.ajustes[campo] = url;
          await Store.setAjustes({ [campo]: url });
          U.aviso("Imagen guardada.");
          refrescar();
        } catch (e) {
          U.aviso("No se pudo subir la imagen: " + (e.message || e));
          botonSubir.disabled = false;
          botonSubir.textContent = "Subir imagen";
        }
      });
      const botonQuitar = U.$('[data-quitar="' + campo + '"]');
      if (botonQuitar) botonQuitar.addEventListener("click", async () => {
        D.ajustes[campo] = null;
        await Store.setAjustes({ [campo]: null });
        U.aviso("Imagen retirada.");
        refrescar();
      });
    });
  }

  /* ================= Ajustes ================= */

  function tabAjustes() {
    const a = D.ajustes;
    const filasRedes = (a.redes && a.redes.length ? a.redes : [{ nombre: "", url: "" }]).map((r) =>
      '<div class="fila-dinamica">' +
      '<input data-red-nombre placeholder="Red (Instagram, YouTube…)" value="' + U.esc(r.nombre || "") + '" style="max-width:220px">' +
      '<input data-red-url placeholder="https://…" value="' + U.esc(r.url || "") + '">' +
      '<button type="button" class="quitar" title="Quitar">&times;</button></div>'
    ).join("");

    contenido().innerHTML =
      cabecera("Ajustes del sitio", "El nombre, el logo, la misión, el objetivo y las redes del grupo." +
        (Store.modo === "local" ? " Estás en modo local: los cambios viven solo en este navegador." : " Estás en modo online: los cambios se publican para todos.")) +
      '<form class="editor" id="form-ajustes">' +
      '<div class="dos-columnas">' +
      '<label class="campo"><span>Nombre del grupo</span><input name="nombre" required value="' + U.esc(a.nombre) + '"></label>' +
      '<label class="campo"><span>Lema</span><input name="lema" value="' + U.esc(a.lema || "") + '"></label>' +
      "</div>" +
      '<label class="campo"><span>Misión</span><textarea name="mision" rows="4">' + U.esc(a.mision || "") + "</textarea></label>" +
      '<label class="campo"><span>Objetivo</span><textarea name="objetivo" rows="4">' + U.esc(a.objetivo || "") + "</textarea></label>" +
      '<label class="campo" style="margin-bottom:6px"><span>Redes sociales</span></label>' +
      '<div class="lista-dinamica" id="lista-redes">' + filasRedes + "</div>" +
      '<button type="button" class="boton secundario mini" id="anadir-red">Añadir red</button>' +
      '<hr class="separador-suave">' +
      '<div class="barra-acciones"><button class="boton" type="submit">Guardar ajustes</button></div>' +
      "</form>" +
      '<div class="rejilla-apariencia" style="margin-bottom:22px">' +
      zonaImagen("logo", "Logo del grupo", a.logo, "Cuadrado o circular; se muestra en la cabecera, la portada y las imágenes descargables.", true) +
      "</div>" +
      (Store.modo === "local"
        ? '<div class="editor"><h3>Zona local</h3>' +
          '<p class="pista">Herramientas del modo de pruebas de este navegador. Los usuarios y contraseñas se gestionan en la pestaña Administradores.</p>' +
          '<div class="barra-acciones">' +
          '<button class="boton peligro mini" id="reiniciar-datos">Restaurar datos de ejemplo</button>' +
          "</div></div>"
        : "");

    const form = U.$("#form-ajustes");
    form.addEventListener("click", (ev) => {
      const q = ev.target.closest(".quitar");
      if (q) q.closest(".fila-dinamica").remove();
    });
    U.$("#anadir-red").addEventListener("click", () => {
      U.$("#lista-redes").insertAdjacentHTML("beforeend",
        '<div class="fila-dinamica"><input data-red-nombre placeholder="Red" style="max-width:220px">' +
        '<input data-red-url placeholder="https://…">' +
        '<button type="button" class="quitar">&times;</button></div>');
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = new FormData(form);
      const redes = U.$$(".fila-dinamica", U.$("#lista-redes")).map((fila) => ({
        nombre: U.$("[data-red-nombre]", fila).value.trim(),
        url: U.$("[data-red-url]", fila).value.trim()
      })).filter((r) => r.nombre || r.url);
      const nuevos = {
        nombre: String(f.get("nombre")).trim() || "Mi grupo",
        lema: String(f.get("lema")).trim(),
        mision: String(f.get("mision")).trim(),
        objetivo: String(f.get("objetivo")).trim(),
        redes
      };
      Object.assign(D.ajustes, nuevos);
      await Store.setAjustes(nuevos);
      U.$("#admin-nombre").textContent = nuevos.nombre;
      U.aviso("Ajustes guardados.");
    });

    conectarZonas(["logo"], { logo: "logo" }, tabAjustes);

    const reiniciar = U.$("#reiniciar-datos");
    if (reiniciar) reiniciar.addEventListener("click", async () => {
      if (!confirm("Esto borra TODO el contenido local y vuelve a los datos de ejemplo. ¿Continuar?")) return;
      await Store.reiniciarDatos();
      location.reload();
    });
  }

  iniciar();
})();
