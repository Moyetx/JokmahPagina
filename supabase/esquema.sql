-- ============================================================
-- Jokmah — esquema de base de datos para Supabase
-- Ejecuta este archivo completo en: Supabase → SQL Editor → New query
-- ============================================================

-- ---------- Tablas ----------

create table if not exists public.ajustes (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb
);

create table if not exists public.elementos (
  id text primary key,
  tipo text not null,
  datos jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now()
);

create index if not exists elementos_tipo on public.elementos (tipo, creado);

-- ---------- Seguridad (RLS) ----------
-- Cualquiera puede LEER el contenido público y ESCRIBIR en los buzones.
-- Solo el administrador (usuario autenticado) puede editar el resto.

alter table public.ajustes enable row level security;
alter table public.elementos enable row level security;

drop policy if exists "leer ajustes" on public.ajustes;
create policy "leer ajustes" on public.ajustes
  for select using (true);

drop policy if exists "crear ajustes" on public.ajustes;
create policy "crear ajustes" on public.ajustes
  for insert to authenticated with check (true);

drop policy if exists "actualizar ajustes" on public.ajustes;
create policy "actualizar ajustes" on public.ajustes
  for update to authenticated using (true);

drop policy if exists "leer contenido publico" on public.elementos;
create policy "leer contenido publico" on public.elementos
  for select using (
    tipo in ('secciones', 'preguntas', 'eventos', 'temporadas', 'santoral')
    or auth.role() = 'authenticated'
  );

drop policy if exists "enviar a buzones" on public.elementos;
create policy "enviar a buzones" on public.elementos
  for insert with check (
    tipo in ('buzon', 'quejas', 'registros')
    or auth.role() = 'authenticated'
  );

drop policy if exists "administrar elementos" on public.elementos;
create policy "administrar elementos" on public.elementos
  for update to authenticated using (true);

drop policy if exists "eliminar elementos" on public.elementos;
create policy "eliminar elementos" on public.elementos
  for delete to authenticated using (true);

-- ---------- Contadores (vistas y votos) ----------
-- Función segura: los visitantes solo pueden sumar o restar 1
-- a vistas / likes / dislikes de una pregunta. Nada más.

create or replace function public.ajustar_contador(pregunta text, campo text, delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if campo not in ('vistas', 'likes', 'dislikes') then
    raise exception 'campo no permitido';
  end if;
  if delta not in (-1, 1) then
    raise exception 'delta no permitido';
  end if;
  update public.elementos
     set datos = jsonb_set(
       datos,
       array[campo],
       to_jsonb(greatest(0, coalesce((datos ->> campo)::int, 0) + delta))
     )
   where id = pregunta and tipo = 'preguntas';
end;
$$;

revoke all on function public.ajustar_contador(text, text, int) from public;
grant execute on function public.ajustar_contador(text, text, int) to anon, authenticated;

-- ---------- Imágenes (logo, fondos, laterales) ----------
-- Carpeta pública para leer; solo el administrador sube o borra.

insert into storage.buckets (id, name, public)
values ('imagenes', 'imagenes', true)
on conflict (id) do nothing;

drop policy if exists "imagenes publicas" on storage.objects;
create policy "imagenes publicas" on storage.objects
  for select using (bucket_id = 'imagenes');

drop policy if exists "subir imagenes" on storage.objects;
create policy "subir imagenes" on storage.objects
  for insert to authenticated with check (bucket_id = 'imagenes');

drop policy if exists "reemplazar imagenes" on storage.objects;
create policy "reemplazar imagenes" on storage.objects
  for update to authenticated using (bucket_id = 'imagenes');

drop policy if exists "borrar imagenes" on storage.objects;
create policy "borrar imagenes" on storage.objects
  for delete to authenticated using (bucket_id = 'imagenes');

-- ---------- Contenido inicial ----------
-- Secciones, temporadas litúrgicas y santoral básicos para empezar.
-- (Las preguntas se crean desde el panel de administración.)

insert into public.elementos (id, tipo, datos) values
('tiempo-liturgico', 'secciones', '{"id":"tiempo-liturgico","nombre":"Tiempo Litúrgico","descripcion":"Preguntas ordenadas según el año de la Iglesia: Adviento, Navidad, Cuaresma, Pascua y Tiempo Ordinario.","orden":0,"liturgico":true}'),
('catecismo', 'secciones', '{"id":"catecismo","nombre":"Catecismo","descripcion":"Lo que la Iglesia cree, celebra, vive y reza, explicado desde el Catecismo.","orden":1}'),
('dsi', 'secciones', '{"id":"dsi","nombre":"Doctrina Social","descripcion":"DSI: la enseñanza de la Iglesia sobre la vida en sociedad, el trabajo y la justicia.","orden":2}'),
('teologia-del-cuerpo', 'secciones', '{"id":"teologia-del-cuerpo","nombre":"Teología del Cuerpo","descripcion":"Las catequesis de san Juan Pablo II sobre el amor humano en el plan divino.","orden":3}'),
('derecho-canonico', 'secciones', '{"id":"derecho-canonico","nombre":"Derecho Canónico","descripcion":"Las leyes de la Iglesia y el porqué de sus normas.","orden":4}'),
('teologia', 'secciones', '{"id":"teologia","nombre":"Teología","descripcion":"Fe que busca comprender: Dios, la creación, la gracia y los sacramentos.","orden":5}'),
('patristica', 'secciones', '{"id":"patristica","nombre":"Patrística","descripcion":"Los Padres de la Iglesia: los primeros siglos hablan al presente.","orden":6}'),
('discernimiento', 'secciones', '{"id":"discernimiento","nombre":"Discernimiento","descripcion":"Cómo reconocer la voluntad de Dios en las decisiones de la vida.","orden":7}'),
('liturgia', 'secciones', '{"id":"liturgia","nombre":"Liturgia","descripcion":"El sentido de los ritos, los signos y las celebraciones.","orden":8}'),
('carismas', 'secciones', '{"id":"carismas","nombre":"Carismas","descripcion":"Dones del Espíritu para la edificación de la Iglesia.","orden":9}'),
('santos', 'secciones', '{"id":"santos","nombre":"Santos","descripcion":"Vidas que demuestran que el Evangelio se puede vivir.","orden":10}')
on conflict (id) do nothing;

insert into public.elementos (id, tipo, datos) values
('t-navidad-1', 'temporadas', '{"id":"t-navidad-1","nombre":"Navidad","inicio":"2025-12-25","fin":"2026-01-11","color":"blanco"}'),
('t-ord-1', 'temporadas', '{"id":"t-ord-1","nombre":"Tiempo Ordinario","inicio":"2026-01-12","fin":"2026-02-17","color":"verde"}'),
('t-cuaresma', 'temporadas', '{"id":"t-cuaresma","nombre":"Cuaresma","inicio":"2026-02-18","fin":"2026-04-01","color":"morado"}'),
('t-triduo', 'temporadas', '{"id":"t-triduo","nombre":"Triduo Pascual","inicio":"2026-04-02","fin":"2026-04-04","color":"rojo"}'),
('t-pascua', 'temporadas', '{"id":"t-pascua","nombre":"Pascua","inicio":"2026-04-05","fin":"2026-05-24","color":"blanco"}'),
('t-ord-2', 'temporadas', '{"id":"t-ord-2","nombre":"Tiempo Ordinario","inicio":"2026-05-25","fin":"2026-11-28","color":"verde"}'),
('t-adviento', 'temporadas', '{"id":"t-adviento","nombre":"Adviento","inicio":"2026-11-29","fin":"2026-12-24","color":"morado"}'),
('t-navidad-2', 'temporadas', '{"id":"t-navidad-2","nombre":"Navidad","inicio":"2026-12-25","fin":"2027-01-10","color":"blanco"}')
on conflict (id) do nothing;

insert into public.elementos (id, tipo, datos) values
('s-0101', 'santoral', '{"id":"s-0101","fecha":"01-01","santo":"Santa María, Madre de Dios","nota":"Solemnidad"}'),
('s-0128', 'santoral', '{"id":"s-0128","fecha":"01-28","santo":"Santo Tomás de Aquino","nota":"Doctor de la Iglesia"}'),
('s-0319', 'santoral', '{"id":"s-0319","fecha":"03-19","santo":"San José, esposo de la Virgen","nota":"Solemnidad"}'),
('s-0629', 'santoral', '{"id":"s-0629","fecha":"06-29","santo":"San Pedro y San Pablo","nota":"Solemnidad"}'),
('s-0711', 'santoral', '{"id":"s-0711","fecha":"07-11","santo":"San Benito Abad","nota":"Patrono de Europa"}'),
('s-0716', 'santoral', '{"id":"s-0716","fecha":"07-16","santo":"Nuestra Señora del Carmen","nota":"Memoria"}'),
('s-0722', 'santoral', '{"id":"s-0722","fecha":"07-22","santo":"Santa María Magdalena","nota":"Fiesta"}'),
('s-0725', 'santoral', '{"id":"s-0725","fecha":"07-25","santo":"Santiago Apóstol","nota":"Fiesta"}'),
('s-0731', 'santoral', '{"id":"s-0731","fecha":"07-31","santo":"San Ignacio de Loyola","nota":"Memoria"}'),
('s-0815', 'santoral', '{"id":"s-0815","fecha":"08-15","santo":"Asunción de la Virgen María","nota":"Solemnidad"}'),
('s-1001', 'santoral', '{"id":"s-1001","fecha":"10-01","santo":"Santa Teresa del Niño Jesús","nota":"Doctora de la Iglesia"}'),
('s-1101', 'santoral', '{"id":"s-1101","fecha":"11-01","santo":"Todos los Santos","nota":"Solemnidad"}'),
('s-1208', 'santoral', '{"id":"s-1208","fecha":"12-08","santo":"Inmaculada Concepción","nota":"Solemnidad"}'),
('s-1212', 'santoral', '{"id":"s-1212","fecha":"12-12","santo":"Nuestra Señora de Guadalupe","nota":"Patrona de América"}'),
('s-1225', 'santoral', '{"id":"s-1225","fecha":"12-25","santo":"Natividad del Señor","nota":"Solemnidad"}')
on conflict (id) do nothing;
