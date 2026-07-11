/* Genera una imagen vertical 1080x1920 (formato historia de Instagram)
   con la pregunta, la respuesta corta y las fuentes, descargable en PNG o JPG. */
(function () {
  "use strict";

  const U = window.JUtil;
  const ANCHO = 1080, ALTO = 1920, MARGEN = 96;

  function ajustarLineas(ctx, texto, maxAncho) {
    const lineas = [];
    String(texto || "").split(/\n+/).forEach((parrafo) => {
      const palabras = parrafo.trim().split(/\s+/).filter(Boolean);
      if (!palabras.length) { lineas.push(""); return; }
      let linea = palabras[0];
      for (let i = 1; i < palabras.length; i++) {
        const prueba = linea + " " + palabras[i];
        if (ctx.measureText(prueba).width <= maxAncho) linea = prueba;
        else { lineas.push(linea); linea = palabras[i]; }
      }
      lineas.push(linea);
      lineas.push("");
    });
    while (lineas.length && lineas[lineas.length - 1] === "") lineas.pop();
    return lineas;
  }

  function dibujarLineas(ctx, lineas, x, y, alto) {
    lineas.forEach((l) => {
      if (l) ctx.fillText(l, x, y);
      y += l ? alto : Math.round(alto * 0.55);
    });
    return y;
  }

  function separador(ctx, y) {
    const cx = ANCHO / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(217,179,106,.75)";
    ctx.fillStyle = "rgba(217,179,106,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 140, y); ctx.lineTo(cx - 26, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 26, y); ctx.lineTo(cx + 140, y); ctx.stroke();
    ctx.save();
    ctx.translate(cx, y); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.restore();
  }

  function cargarImagen(src) {
    return new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  async function dibujar(pregunta, ajustes) {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('700 64px "Cormorant Garamond"'),
      document.fonts.load('600 40px "Cormorant Garamond"'),
      document.fonts.load('400 36px "Work Sans"'),
      document.fonts.load('500 30px "Work Sans"')
    ]).catch(() => {});

    const c = document.createElement("canvas");
    c.width = ANCHO; c.height = ALTO;
    const ctx = c.getContext("2d");

    /* Fondo: degradado vino profundo con brillo superior */
    const deg = ctx.createLinearGradient(0, 0, 0, ALTO);
    deg.addColorStop(0, "#511526");
    deg.addColorStop(0.5, "#3b0f1c");
    deg.addColorStop(1, "#22080f");
    ctx.fillStyle = deg;
    ctx.fillRect(0, 0, ANCHO, ALTO);
    const brillo = ctx.createRadialGradient(ANCHO / 2, 240, 60, ANCHO / 2, 240, 900);
    brillo.addColorStop(0, "rgba(217,179,106,.16)");
    brillo.addColorStop(1, "rgba(217,179,106,0)");
    ctx.fillStyle = brillo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    /* Marco fino dorado */
    ctx.strokeStyle = "rgba(217,179,106,.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(52, 52, ANCHO - 104, ALTO - 104);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const maxTexto = ANCHO - MARGEN * 2 - 60;

    /* Cabecera: logo opcional + nombre del grupo */
    let y = 190;
    if (ajustes.logo) {
      const logo = await cargarImagen(ajustes.logo);
      if (logo) {
        const r = 82;
        ctx.save();
        ctx.beginPath(); ctx.arc(ANCHO / 2, 210, r, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(logo, ANCHO / 2 - r, 210 - r, r * 2, r * 2);
        ctx.restore();
        ctx.strokeStyle = "rgba(217,179,106,.8)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ANCHO / 2, 210, r + 4, 0, Math.PI * 2); ctx.stroke();
        y = 370;
      }
    }
    ctx.fillStyle = "#d9b36a";
    ctx.font = '500 34px "Work Sans"';
    const nombre = (ajustes.nombre || "").toUpperCase().split("").join("  ");
    ctx.fillText(nombre, ANCHO / 2, y);
    y += 26;
    ctx.strokeStyle = "rgba(217,179,106,.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ANCHO / 2 - 130, y); ctx.lineTo(ANCHO / 2 + 130, y);
    ctx.stroke();

    /* Cuerpo: se ajusta el tamaño hasta que quepa */
    const fuentes = (pregunta.corta && pregunta.corta.fuentes || []).filter(Boolean);
    const topeInferior = ALTO - 170 - (fuentes.length ? 60 + fuentes.length * 40 : 0);
    let tamP = 66, tamR = 38;
    let lineasP, lineasR, altoBloque;

    for (let intento = 0; intento < 14; intento++) {
      ctx.font = '700 ' + tamP + 'px "Cormorant Garamond"';
      lineasP = ajustarLineas(ctx, pregunta.pregunta, maxTexto);
      ctx.font = '400 ' + tamR + 'px "Work Sans"';
      lineasR = ajustarLineas(ctx, (pregunta.corta && pregunta.corta.respuesta) || "", maxTexto);
      altoBloque =
        lineasP.length * Math.round(tamP * 1.18) + 110 +
        lineasR.filter(Boolean).length * Math.round(tamR * 1.52) +
        (lineasR.length - lineasR.filter(Boolean).length) * Math.round(tamR * 0.8);
      if (y + 90 + altoBloque <= topeInferior) break;
      tamP = Math.max(40, tamP - 4);
      tamR = Math.max(26, tamR - 2);
    }

    let cy = y + 90 + Math.max(0, Math.round((topeInferior - y - 90 - altoBloque) / 2));

    ctx.fillStyle = "#f6ecd9";
    ctx.font = '700 ' + tamP + 'px "Cormorant Garamond"';
    cy = dibujarLineas(ctx, lineasP, ANCHO / 2, cy, Math.round(tamP * 1.18));

    cy += 46;
    separador(ctx, cy - 14);
    cy += 52;

    ctx.fillStyle = "#e8dcc4";
    ctx.font = '400 ' + tamR + 'px "Work Sans"';
    cy = dibujarLineas(ctx, lineasR, ANCHO / 2, cy, Math.round(tamR * 1.52));

    /* Fuentes al pie */
    if (fuentes.length) {
      let fy = ALTO - 150 - fuentes.length * 40;
      ctx.fillStyle = "rgba(217,179,106,.95)";
      ctx.font = '500 26px "Work Sans"';
      ctx.fillText("F U E N T E S", ANCHO / 2, fy);
      fy += 46;
      ctx.fillStyle = "rgba(232,220,196,.82)";
      ctx.font = '400 27px "Work Sans"';
      fuentes.forEach((f) => {
        let t = f;
        while (ctx.measureText(t).width > maxTexto && t.length > 8) t = t.slice(0, -2);
        if (t !== f) t += "…";
        ctx.fillText(t, ANCHO / 2, fy);
        fy += 40;
      });
    }

    /* Pie */
    ctx.fillStyle = "rgba(217,179,106,.55)";
    ctx.font = '400 24px "Work Sans"';
    ctx.fillText((ajustes.lema || ajustes.nombre || "").toUpperCase(), ANCHO / 2, ALTO - 84);

    return c;
  }

  async function descargar(pregunta, ajustes, formato) {
    const canvas = await dibujar(pregunta, ajustes);
    const esPng = formato === "png";
    const nombre = "pregunta-" +
      String(pregunta.pregunta || "historia").toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) +
      (esPng ? ".png" : ".jpg");
    return new Promise((res) => {
      canvas.toBlob((blob) => {
        U.descargarBlob(nombre, blob);
        res(true);
      }, esPng ? "image/png" : "image/jpeg", 0.92);
    });
  }

  window.JHistoria = { dibujar, descargar };
})();
