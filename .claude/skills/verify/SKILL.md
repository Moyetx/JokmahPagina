---
name: verify
description: Cómo verificar este sitio estático (Jokmah) de extremo a extremo en un navegador.
---

# Verificación del sitio Jokmah

Sitio estático sin build. Servir y recorrer con Playwright:

```bash
python3 -m http.server 8321 --bind 127.0.0.1 &   # desde la raíz del repo
# npm install playwright  (usa el Chromium de /opt/pw-browsers, no descargar)
# chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })
```

Flujos que importan (todos en modo local, localStorage limpio = contexto nuevo):

1. `index.html`: aparece el modal de visitante; rellenar nombre/edad/estado lo cierra
   y crea un registro.
2. Portada: secciones en columnas, calendario (conmutar Semana/Mes, navegar),
   santoral del día, buzones (enviar pregunta anónima y sugerencia).
3. `#/seccion/catecismo` → abrir pregunta → formato corto; conmutar a
   "Respuesta larga" → deben verse las 7 partes de la Suma (Cuestión, Artículo,
   Objeciones, En cambio, Solución, Respuesta a las objeciones, Notas).
4. Botones Descargar PNG/JPG disparan un download (imagen 1080×1920; se puede
   generar directo con `window.JHistoria.dibujar(pregunta, ajustes)`).
5. Like/dislike: +1 exacto, cambiar de voto revierte el anterior (cuidado con el
   doble conteo: el adaptador local devuelve copias profundas a propósito).
6. `admin.html`: primera vez pide crear contraseña; clave errónea da error visible.
   Crear pregunta con 2 etiquetas → debe aparecer en ambas secciones públicas sin
   duplicarse. El buzón del admin muestra lo enviado y "Descargar CSV" produce un
   CSV con BOM y separador `;`.

Nota del sandbox: la petición a fonts.googleapis.com falla con
`ERR_CONNECTION_RESET` (el navegador no pasa por el proxy). Es del entorno, no
del sitio: ignorar ese error de consola.
