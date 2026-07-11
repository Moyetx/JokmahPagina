/* Calendario litúrgico: vista semanal y mensual, lista de próximos
   eventos y santoral del día. Solo lectura (el admin edita desde su panel). */
(function () {
  "use strict";

  const U = window.JUtil;
  const COLORES = window.JSeed.COLORES_LITURGICOS;

  function colorCss(clave) {
    return (COLORES[clave] || COLORES.verde).css;
  }

  function temporadaDe(iso, temporadas) {
    return temporadas.find((t) => t.inicio <= iso && iso <= t.fin) || null;
  }

  function eventosDe(iso, eventos) {
    return eventos.filter((e) => e.fecha === iso);
  }

  function santosDe(iso, santoral) {
    const md = iso.slice(5);
    return santoral.filter((s) => s.fecha === md || s.fecha === iso);
  }

  /* Lunes de la semana que contiene a la fecha */
  function lunesDe(fecha) {
    const d = new Date(fecha);
    const dif = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dif);
    return d;
  }

  function celdaDia(iso, datos, opciones) {
    const hoy = U.hoyISO();
    const t = temporadaDe(iso, datos.temporadas);
    const evs = eventosDe(iso, datos.eventos);
    const santos = santosDe(iso, datos.santoral);
    const d = U.desdeISO(iso);
    const clases = ["cal-dia"];
    if (iso === hoy) clases.push("es-hoy");
    if (opciones && opciones.fueraDeMes) clases.push("fuera-mes");
    const marcas = evs.slice(0, 3).map((e) =>
      '<span class="cal-marca" style="background:' + colorCss(e.color) + '" title="' + U.esc(e.titulo) + '"></span>'
    ).join("");
    const santo = santos.length
      ? '<span class="cal-santo" title="' + U.esc(santos.map(s => s.santo).join(" · ")) + '">' + U.esc(santos[0].santo) + "</span>"
      : "";
    return (
      '<div class="' + clases.join(" ") + '" data-fecha="' + iso + '"' +
      (t ? ' style="--tinte:' + colorCss(t.color) + '"' : "") + ">" +
      '<span class="cal-num">' + d.getDate() + "</span>" +
      santo +
      (marcas ? '<span class="cal-marcas">' + marcas + "</span>" : "") +
      "</div>"
    );
  }

  function vistaMes(fechaBase, datos) {
    const a = fechaBase.getFullYear(), m = fechaBase.getMonth();
    const primero = new Date(a, m, 1);
    const inicio = lunesDe(primero);
    let html = '<div class="cal-cuadricula mes">';
    html += U.DIAS_CORTO.map((d) => '<span class="cal-cabecera-dia">' + d + "</span>").join("");
    const cursor = new Date(inicio);
    for (let i = 0; i < 42; i++) {
      const iso = U.fechaISO(cursor);
      html += celdaDia(iso, datos, { fueraDeMes: cursor.getMonth() !== m });
      cursor.setDate(cursor.getDate() + 1);
      if (i >= 34 && cursor.getMonth() !== m && cursor.getDay() === 1) break;
    }
    html += "</div>";
    return html;
  }

  function vistaSemana(fechaBase, datos) {
    const inicio = lunesDe(fechaBase);
    let html = '<div class="cal-semana">';
    const cursor = new Date(inicio);
    for (let i = 0; i < 7; i++) {
      const iso = U.fechaISO(cursor);
      const t = temporadaDe(iso, datos.temporadas);
      const evs = eventosDe(iso, datos.eventos);
      const santos = santosDe(iso, datos.santoral);
      const esHoy = iso === U.hoyISO();
      html +=
        '<div class="cal-sem-dia' + (esHoy ? " es-hoy" : "") + '"' +
        (t ? ' style="--tinte:' + colorCss(t.color) + '"' : "") + ">" +
        '<div class="cal-sem-cab"><span class="cal-sem-nombre">' + U.DIAS[i] + "</span>" +
        '<span class="cal-sem-num">' + cursor.getDate() + "</span></div>" +
        (santos.length ? '<p class="cal-sem-santo">' + U.esc(santos.map(s => s.santo).join(" · ")) + "</p>" : "") +
        (evs.length
          ? evs.map((e) =>
              '<p class="cal-sem-evento"><span class="cal-marca" style="background:' + colorCss(e.color) + '"></span>' +
              U.esc(e.titulo) + "</p>").join("")
          : '<p class="cal-sem-vacio">Sin eventos</p>') +
        "</div>";
      cursor.setDate(cursor.getDate() + 1);
    }
    html += "</div>";
    return html;
  }

  function listaProximos(datos, limite) {
    const hoy = U.hoyISO();
    const prox = datos.eventos
      .filter((e) => e.fecha >= hoy)
      .sort((x, y) => x.fecha.localeCompare(y.fecha))
      .slice(0, limite || 6);
    if (!prox.length) return '<p class="suave">No hay eventos próximos en el calendario.</p>';
    return '<ul class="cal-proximos">' + prox.map((e) =>
      "<li><span class=\"cal-marca\" style=\"background:" + colorCss(e.color) + "\"></span>" +
      '<div><span class="cal-prox-fecha">' + U.fechaLarga(e.fecha) + "</span>" +
      '<strong>' + U.esc(e.titulo) + "</strong>" +
      (e.detalle ? '<p class="suave">' + U.esc(e.detalle) + "</p>" : "") +
      "</div></li>"
    ).join("") + "</ul>";
  }

  function santoralHoy(datos) {
    const hoy = U.hoyISO();
    const santos = santosDe(hoy, datos.santoral);
    const t = temporadaDe(hoy, datos.temporadas);
    return (
      '<div class="cal-santoral-hoy"' + (t ? ' style="--tinte:' + colorCss(t.color) + '"' : "") + ">" +
      '<span class="etiqueta-suave">Santoral de hoy · ' + U.fechaLarga(hoy) + "</span>" +
      (santos.length
        ? santos.map((s) =>
            '<p class="cal-santoral-nombre">' + U.esc(s.santo) +
            (s.nota ? ' <span class="suave">— ' + U.esc(s.nota) + "</span>" : "") + "</p>").join("")
        : '<p class="cal-santoral-nombre suave">Feria del tiempo ' + (t ? "de " + U.esc(t.nombre) : "litúrgico") + "</p>") +
      (t ? '<p class="cal-temporada">Tiempo litúrgico: <strong>' + U.esc(t.nombre) + "</strong></p>" : "") +
      "</div>"
    );
  }

  window.JCal = {
    vistaMes, vistaSemana, listaProximos, santoralHoy, temporadaDe, colorCss, santosDe, lunesDe
  };
})();
