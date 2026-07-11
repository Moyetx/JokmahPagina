/* Utilidades compartidas */
(function () {
  "use strict";

  const U = {};

  U.$ = (sel, raiz) => (raiz || document).querySelector(sel);
  U.$$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  U.uid = () =>
    (crypto.randomUUID ? crypto.randomUUID()
      : "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10));

  U.esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* URL segura para usar en style="background-image:…" dentro de HTML */
  U.cssUrl = (u) =>
    "url('" + String(u == null ? "" : u).replace(/'/g, "%27").replace(/"/g, "%22") + "')";

  /* Convierte marcas [1], [2]… en llamadas de nota al pie */
  U.marcarNotas = (html) =>
    html.replace(/\[(\d{1,2})\]/g, '<sup class="nota-ref"><a href="#nota-$1">$1</a></sup>');

  /* Texto plano → párrafos HTML escapados, con notas al pie */
  U.parrafos = (texto) =>
    String(texto == null ? "" : texto)
      .trim()
      .split(/\n{2,}/)
      .filter((p) => p.trim())
      .map((p) => "<p>" + U.marcarNotas(U.esc(p)).replace(/\n/g, "<br>") + "</p>")
      .join("");

  /* ---- Fechas ---- */
  U.DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  U.DIAS_CORTO = ["L", "M", "X", "J", "V", "S", "D"];
  U.MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  U.fechaISO = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  };
  U.hoyISO = () => U.fechaISO(new Date());
  U.desdeISO = (iso) => {
    const [a, m, d] = String(iso).split("-").map(Number);
    return new Date(a, (m || 1) - 1, d || 1);
  };
  U.fechaLarga = (iso) => {
    const d = U.desdeISO(iso);
    return U.DIAS[(d.getDay() + 6) % 7] + " " + d.getDate() + " de " + U.MESES[d.getMonth()];
  };
  U.fechaCorta = (iso) => {
    const d = U.desdeISO(iso);
    return d.getDate() + " " + U.MESES[d.getMonth()].slice(0, 3) + ". " + d.getFullYear();
  };

  U.num = (n) => new Intl.NumberFormat("es").format(n || 0);

  /* ---- CSV (separador ; y BOM para que Excel en español lo abra bien) ---- */
  U.csv = (filas) => {
    const celda = (v) => {
      const s = String(v == null ? "" : v);
      return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  };
  U.descargarCSV = (nombre, filas) => {
    U.descargarBlob(nombre, new Blob([U.csv(filas)], { type: "text/csv;charset=utf-8" }));
  };
  U.descargarBlob = (nombre, blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  };

  /* ---- Avisos ---- */
  let avisoTemp = null;
  U.aviso = (msg) => {
    let el = document.querySelector(".aviso-flotante");
    if (!el) {
      el = document.createElement("div");
      el.className = "aviso-flotante";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(avisoTemp);
    avisoTemp = setTimeout(() => el.classList.remove("visible"), 2600);
  };

  /* ---- Hash de contraseña (modo local) ---- */
  U.sha256 = async (texto) => {
    if (crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    /* Reserva simple si no hay contexto seguro (solo modo local de prueba) */
    let h = 0;
    for (let i = 0; i < texto.length; i++) { h = (h * 31 + texto.charCodeAt(i)) >>> 0; }
    return "x" + h.toString(16);
  };

  /* ---- Imágenes ---- */
  U.leerArchivo = (archivo) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(archivo);
    });

  /* Redimensiona para el modo local (en modo online se sube el archivo original) */
  U.comprimirImagen = (archivo, maxLado, calidad) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const esPNG = /png|svg/.test(archivo.type);
        res(c.toDataURL(esPNG ? "image/png" : "image/jpeg", calidad || 0.87));
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(archivo);
    });

  U.debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  window.JUtil = U;
})();
