/*
 * Configuración de conexión.
 *
 * MODO LOCAL (por defecto): deja los dos campos vacíos. Los datos se guardan
 * en el navegador (localStorage). Sirve para probar el sitio, pero cada
 * visitante ve su propia copia: los cambios del admin NO llegan a los demás.
 *
 * MODO ONLINE (producción): crea un proyecto gratuito en https://supabase.com,
 * ejecuta el archivo supabase/esquema.sql en el editor SQL del proyecto y pega
 * aquí la URL y la clave "anon public" (Settings → API). Con esto, preguntas,
 * buzones, registros, imágenes y estadísticas quedan guardados online para
 * todos los visitantes. Guía completa: DESPLIEGUE.md
 */
window.JOKMAH_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
