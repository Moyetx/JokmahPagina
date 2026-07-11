# Jokmah — página del grupo juvenil

Sitio de preguntas y respuestas de formación católica para un grupo juvenil.
Sin frameworks ni compilación: HTML, CSS y JavaScript puros, listos para
publicar en cualquier hosting estático gratuito.

## Qué incluye

**Sitio público** (`index.html`)
- Portada con logo, nombre, lema, misión y objetivo del grupo.
- Secciones temáticas en columnas (Catecismo, DSI, Teología del Cuerpo,
  Derecho Canónico, Teología, Patrística, Discernimiento, Liturgia, Carismas,
  Santos) más una sección especial por **Tiempo Litúrgico** con filtros por
  Adviento, Navidad, Cuaresma, Pascua, Triduo y Ordinario.
- Cada pregunta tiene **dos formatos** con un conmutador:
  - **Corto**: pregunta, respuesta y fuentes, con descarga de una imagen
    vertical 1080×1920 (PNG o JPG) lista para historias de Instagram.
  - **Largo**: la estructura de la *Suma Teológica* — Cuestión, Artículo,
    Objeciones, En cambio, Solución, Respuesta a las objeciones y notas al
    pie enlazadas con marcas [1], [2]…
- Votos a favor / en contra y contador de consultas por pregunta.
- **Buzón de preguntas anónimas** y buzón de **quejas y sugerencias**.
- **Calendario litúrgico manual** con vista de semana y de mes, temporadas
  que tiñen los días con su color litúrgico, lista de "lo que sigue" y
  **santoral del día**.
- Ficha ligera de visitante al entrar (nombre o apodo, edad y estado:
  laico, sacerdote, seminarista, monja…), sin registro formal.
- Decorable con fondo de pantalla e imágenes verticales laterales.

**Panel de administración** (`admin.html`)
- Editor de preguntas con los dos formatos y **etiquetas** que colocan una
  misma pregunta en varias secciones sin duplicarla.
- Alta, edición y borrado de secciones.
- Estadísticas: consultas totales, preguntas más consultadas y votos.
- Buzones y registro de visitantes con **descarga en CSV**.
- Gestión del calendario, temporadas litúrgicas y santoral.
- Apariencia: fondo, laterales e intensidad del velo.
- Ajustes: nombre, lema, logo, misión, objetivo y redes sociales.

## Probarlo en tu computadora

No requiere instalación. Con Python:

```bash
python3 -m http.server 8080
```

y abre http://localhost:8080 (el admin en http://localhost:8080/admin.html;
la primera vez te pedirá crear una contraseña). En este modo local los datos
se guardan en tu navegador.

## Publicarlo online

Sigue la guía paso a paso en **[DESPLIEGUE.md](DESPLIEGUE.md)**:
hosting gratuito (GitHub Pages / Netlify / Vercel) + base de datos gratuita
(Supabase) para que preguntas, buzones, imágenes y estadísticas sean
compartidos por todos los visitantes.

## Estructura

```
index.html            Sitio público
admin.html            Panel de administración
css/estilos.css       Diseño (tokens, portada, secciones, Suma, calendario…)
css/admin.css         Diseño del panel
js/config.js          Credenciales de Supabase (vacío = modo local)
js/util.js            Utilidades (fechas, CSV, imágenes, avisos)
js/seed.js            Datos de ejemplo y catálogos (estados, tiempos, colores)
js/store.js           Capa de datos: localStorage o Supabase, misma API
js/calendario.js      Calendario semanal/mensual, próximos y santoral
js/historia.js        Imagen 1080×1920 para historias (canvas → PNG/JPG)
js/app.js             Lógica del sitio público
js/admin.js           Lógica del panel
supabase/esquema.sql  Tablas, seguridad y contenido inicial para Supabase
DESPLIEGUE.md         Guía de despliegue gratuita paso a paso
```
