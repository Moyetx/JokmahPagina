/* Capa de datos: una sola API con dos modos.
   - Modo local: todo en localStorage (pruebas; cada navegador ve su copia).
   - Modo online: Supabase (tablas ajustes/elementos, Storage para imágenes,
     Auth para el administrador). Se activa rellenando js/config.js. */
(function () {
  "use strict";

  const U = window.JUtil;
  const SEED = window.JSeed;
  const COLECCIONES = ["secciones", "preguntas", "eventos", "temporadas", "santoral", "santos", "buzon", "quejas", "registros", "usuarios"];
  const PUBLICAS = ["secciones", "preguntas", "eventos", "temporadas", "santoral", "santos"];

  /* ---------------- Modo local ---------------- */

  const CLAVE = "jokmah-datos";

  const Local = {
    modo: "local",
    _datos: null,

    async init() {
      try {
        this._datos = JSON.parse(localStorage.getItem(CLAVE));
      } catch (e) { this._datos = null; }
      if (!this._datos || !this._datos.colecciones) {
        this._datos = {
          ajustes: JSON.parse(JSON.stringify(SEED.ajustes)),
          colecciones: {}
        };
      }
      /* Completa colecciones que falten (datos guardados por versiones previas) */
      let cambio = false;
      COLECCIONES.forEach((k) => {
        if (!this._datos.colecciones[k]) {
          this._datos.colecciones[k] = JSON.parse(JSON.stringify(SEED[k] || []));
          cambio = true;
        }
      });
      /* Migración: la contraseña única antigua pasa a ser el usuario "admin" */
      if (this._datos.ajustes.adminHash) {
        const us = this._datos.colecciones.usuarios;
        if (us.length === 1 && us[0].hash === SEED.HASH_INICIAL) {
          us[0].hash = this._datos.ajustes.adminHash;
        }
        delete this._datos.ajustes.adminHash;
        cambio = true;
      }
      if (cambio) this._guardar();
    },

    _guardar() {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(this._datos));
      } catch (e) {
        U.aviso("Sin espacio en el navegador: usa imágenes más ligeras o el modo online.");
      }
    },

    async getAjustes() {
      return Object.assign({}, SEED.ajustes, this._datos.ajustes);
    },
    async setAjustes(a) {
      this._datos.ajustes = Object.assign({}, this._datos.ajustes, a);
      this._guardar();
    },

    async listar(kind) {
      /* Copia profunda: la interfaz puede mutar lo que recibe sin
         tocar los datos guardados (los contadores van por contar()). */
      return JSON.parse(JSON.stringify(this._datos.colecciones[kind] || []));
    },
    async guardar(kind, item) {
      const col = this._datos.colecciones[kind] || (this._datos.colecciones[kind] = []);
      if (!item.id) item.id = U.uid();
      const i = col.findIndex((x) => x.id === item.id);
      if (i >= 0) col[i] = item; else col.push(item);
      this._guardar();
      return item;
    },
    async borrar(kind, id) {
      const col = this._datos.colecciones[kind] || [];
      this._datos.colecciones[kind] = col.filter((x) => x.id !== id);
      this._guardar();
    },

    async contar(preguntaId, campo, delta) {
      const p = (this._datos.colecciones.preguntas || []).find((x) => x.id === preguntaId);
      if (p) {
        p[campo] = Math.max(0, (p[campo] || 0) + delta);
        this._guardar();
      }
    },

    async subirImagen(archivo, uso) {
      const limites = { logo: 640, fondo: 2000, lateral: 1400 };
      return U.comprimirImagen(archivo, limites[uso] || 1600, 0.87);
    },

    /* Administradores locales: usuarios con contraseña (hash) en este navegador. */
    async entrar(usuario, clave) {
      const h = await U.sha256(clave);
      const u = this._datos.colecciones.usuarios
        .find((x) => x.usuario === String(usuario).trim() && x.hash === h);
      if (!u) return false;
      sessionStorage.setItem("jokmah-admin", u.id);
      return true;
    },
    async salir() { sessionStorage.removeItem("jokmah-admin"); },
    esAdmin() { return !!sessionStorage.getItem("jokmah-admin"); },
    usuarioActual() {
      const id = sessionStorage.getItem("jokmah-admin");
      const u = this._datos.colecciones.usuarios.find((x) => x.id === id);
      return u ? { id: u.id, nombre: u.usuario } : null;
    },
    async cambiarClave(id, nueva) {
      const u = this._datos.colecciones.usuarios.find((x) => x.id === id);
      if (!u) return false;
      u.hash = await U.sha256(nueva);
      this._guardar();
      return true;
    },
    usaClaveInicial() {
      return this._datos.colecciones.usuarios
        .some((u) => u.usuario === "admin" && u.hash === SEED.HASH_INICIAL);
    },

    async reiniciarDatos() {
      localStorage.removeItem(CLAVE);
      await this.init();
    }
  };

  /* ---------------- Modo online (Supabase) ---------------- */

  const Nube = {
    modo: "online",
    _sb: null,
    _sesion: null,

    async init() {
      const cfg = window.JOKMAH_CONFIG;
      await cargarLibreria();
      this._sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data } = await this._sb.auth.getSession();
      this._sesion = data && data.session;
      this._sb.auth.onAuthStateChange((_ev, sesion) => { this._sesion = sesion; });
    },

    async getAjustes() {
      const { data } = await this._sb.from("ajustes").select("valor").eq("clave", "sitio").maybeSingle();
      return Object.assign({}, SEED.ajustes, (data && data.valor) || {});
    },
    async setAjustes(a) {
      const actual = await this.getAjustes();
      delete actual.adminHash;
      const valor = Object.assign({}, actual, a);
      const { error } = await this._sb.from("ajustes").upsert({ clave: "sitio", valor });
      if (error) throw error;
    },

    async listar(kind) {
      const { data, error } = await this._sb
        .from("elementos").select("id,datos").eq("tipo", kind).order("creado", { ascending: true });
      if (error) {
        if (!PUBLICAS.includes(kind)) return [];
        throw error;
      }
      return (data || []).map((f) => Object.assign({}, f.datos, { id: f.id }));
    },
    async guardar(kind, item) {
      if (!item.id) item.id = U.uid();
      const { error } = await this._sb
        .from("elementos").upsert({ id: item.id, tipo: kind, datos: item });
      if (error) throw error;
      return item;
    },
    async borrar(kind, id) {
      const { error } = await this._sb.from("elementos").delete().eq("id", id).eq("tipo", kind);
      if (error) throw error;
    },

    async contar(preguntaId, campo, delta) {
      await this._sb.rpc("ajustar_contador", { pregunta: preguntaId, campo, delta });
    },

    async subirImagen(archivo, uso) {
      const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
      const ruta = uso + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const { error } = await this._sb.storage.from("imagenes")
        .upload(ruta, archivo, { upsert: true, cacheControl: "31536000" });
      if (error) throw error;
      return this._sb.storage.from("imagenes").getPublicUrl(ruta).data.publicUrl;
    },

    async entrar(usuario, clave) {
      const { data, error } = await this._sb.auth.signInWithPassword({ email: usuario, password: clave });
      if (error) return false;
      this._sesion = data.session;
      return true;
    },
    async salir() { await this._sb.auth.signOut(); this._sesion = null; },
    esAdmin() { return !!this._sesion; },
    usuarioActual() {
      const u = this._sesion && this._sesion.user;
      return u ? { id: u.id, nombre: u.email } : null;
    },
    async cambiarClave(_id, nueva) {
      const { error } = await this._sb.auth.updateUser({ password: nueva });
      return !error;
    },
    usaClaveInicial() { return false; },

    async reiniciarDatos() { /* no aplica en modo online */ }
  };

  function cargarLibreria() {
    if (window.supabase) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      s.onload = res;
      s.onerror = () => rej(new Error("No se pudo cargar la librería de Supabase"));
      document.head.appendChild(s);
    });
  }

  /* ---------------- Selección de modo ---------------- */

  const cfg = window.JOKMAH_CONFIG || {};
  const Store = (cfg.supabaseUrl && cfg.supabaseAnonKey) ? Nube : Local;

  /* Guardas de interacción del visitante (una vez por navegador) */
  Store.interacciones = {
    _leer() {
      try { return JSON.parse(localStorage.getItem("jokmah-marcas")) || {}; }
      catch (e) { return {}; }
    },
    _escribir(m) { localStorage.setItem("jokmah-marcas", JSON.stringify(m)); },
    yaVisto(id) { return !!this._leer()["v:" + id]; },
    marcarVisto(id) { const m = this._leer(); m["v:" + id] = 1; this._escribir(m); },
    voto(id) { return this._leer()["voto:" + id] || null; },
    marcarVoto(id, valor) {
      const m = this._leer();
      if (valor) m["voto:" + id] = valor; else delete m["voto:" + id];
      this._escribir(m);
    }
  };

  window.JStore = Store;
})();
