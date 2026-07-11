# Guía de despliegue (todo gratis y online)

Esta página funciona en dos modos:

| Modo | Qué necesita | Para qué sirve |
|---|---|---|
| **Local (pruebas)** | Nada: abre la página y listo | Probar el diseño y el panel admin. Los datos viven solo en tu navegador: los visitantes **no** ven tus cambios. |
| **Online (producción)** | Una cuenta gratuita en Supabase | Todo queda guardado en internet: preguntas, buzones, registros, estadísticas e imágenes, compartido entre todos los visitantes. |

Para el sitio real necesitas **dos piezas gratuitas**:

1. **Hosting de la página** (los archivos HTML/CSS/JS) → GitHub Pages, Netlify o Vercel.
2. **Base de datos + imágenes** → Supabase (plan gratuito).

---

## Paso 1 — Base de datos en Supabase (10 minutos)

1. Entra en [supabase.com](https://supabase.com) y crea una cuenta gratuita (puedes usar tu cuenta de GitHub).
2. Crea un proyecto nuevo (elige la región más cercana). Guarda la contraseña que te pida, aunque no la usaremos a diario.
3. En el menú lateral abre **SQL Editor → New query**, copia TODO el contenido del archivo [`supabase/esquema.sql`](supabase/esquema.sql) de este repositorio, pégalo y pulsa **Run**. Esto crea las tablas, las reglas de seguridad, la carpeta de imágenes y el contenido inicial (secciones, temporadas litúrgicas y santoral).
4. Crea el usuario administrador: **Authentication → Users → Add user → Create new user**. Pon tu correo y una contraseña fuerte, y marca **Auto Confirm User**. Con ese correo y contraseña entrarás en `admin.html`.
5. Copia tus claves: **Project Settings → API**. Necesitas dos cosas:
   - **Project URL** (algo como `https://abcdefg.supabase.co`)
   - **anon public key** (una clave larga; es la clave *pública*, está bien que vaya en el código)
6. Abre el archivo `js/config.js` de este repositorio y pega ambas:

```js
window.JOKMAH_CONFIG = {
  supabaseUrl: "https://abcdefg.supabase.co",
  supabaseAnonKey: "eyJhbGciOi..."
};
```

7. Guarda, haz commit y sube el cambio. Desde ese momento la página funciona en modo online.

> **Importante (plan gratuito de Supabase):** si el proyecto pasa ~1 semana sin ninguna visita, Supabase lo pausa. No se pierde nada: entras al panel de Supabase y lo reactivas con un clic. Con que la página reciba visitas de vez en cuando, nunca se pausa.

---

## Paso 2 — Publicar la página

### Opción A: GitHub Pages (recomendada: ya tienes el código en GitHub)

1. En GitHub abre el repositorio → **Settings → Pages**.
2. En **Source** elige *Deploy from a branch*, selecciona la rama principal (`main`) y la carpeta `/ (root)`. Guarda.
3. En un par de minutos tu página estará en `https://TU-USUARIO.github.io/JokmahPagina/`.
4. El panel admin queda en `https://TU-USUARIO.github.io/JokmahPagina/admin.html`.

GitHub Pages es gratis, no se "duerme" nunca y aguanta perfectamente el tráfico de un grupo juvenil. No hay que compilar nada: la página es HTML/CSS/JS puro.

### Opción B: Netlify

1. Entra en [netlify.com](https://netlify.com) con tu cuenta de GitHub.
2. **Add new site → Import an existing project** → elige este repositorio.
3. No pongas comando de build ni carpeta de publicación especial (déjalo en la raíz). Deploy.
4. Te da una URL `https://loquesea.netlify.app` (puedes cambiar el nombre). Cada push a la rama publica automáticamente.

### Opción C: Vercel

Igual que Netlify: [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio → Deploy sin configuración.

Cualquiera de las tres es gratuita y estable para páginas estáticas. Si algún día quieres dominio propio (`www.tugrupo.org`), las tres lo permiten gratis (el dominio sí se paga aparte, ~10 USD/año).

---

## ¿Dónde se guarda el CSV del buzón?

No hay un archivo CSV "viviendo" en un servidor: **los mensajes del buzón se guardan como filas en la base de datos de Supabase** (tabla `elementos`, tipo `buzon`), que es más seguro y no se corrompe. Cuando quieras el CSV:

1. Entra en `admin.html` → pestaña **Buzón de preguntas** (o **Quejas y sugerencias**, **Visitantes**, **Resumen**).
2. Pulsa **Descargar CSV**. El archivo se genera al momento con todos los mensajes y se descarga a tu computadora, listo para abrir en Excel (acentos incluidos).

Lo mismo aplica a los registros de visitantes y a las estadísticas.

---

## Resumen del flujo diario

- Los jóvenes entran a la página, se presentan (nombre, edad, estado), leen preguntas, votan y dejan preguntas anónimas.
- Tú entras a `admin.html` con tu correo y contraseña de Supabase.
- Revisas el buzón, conviertes las mejores preguntas en fichas (formato corto + formato Suma), las etiquetas en sus secciones y las publicas.
- Actualizas el calendario y el santoral cuando haga falta.
- Descargas los CSV cuando quieras llevar registro o trabajar sin conexión.

## Problemas frecuentes

- **"Hice cambios en el admin y nadie los ve"** → estás en modo local (config.js vacío). Completa el Paso 1.
- **"No puedo entrar al admin en modo online"** → verifica que creaste el usuario en Supabase con *Auto Confirm User* marcado.
- **"La página no carga datos"** → puede que Supabase haya pausado el proyecto por inactividad; entra a supabase.com y pulsa *Restore*.
- **"Quiero borrar los datos de prueba de mi navegador"** → admin → Ajustes del sitio → *Restaurar datos de ejemplo*.
