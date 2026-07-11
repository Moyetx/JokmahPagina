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
    tipo in ('secciones', 'preguntas', 'eventos', 'temporadas', 'santoral', 'santos')
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

insert into public.elementos (id, tipo, datos) values
('santo-benito', 'santos', '{"id":"santo-benito","nombre":"San Benito de Nursia","titulo":"Abad, patrono de Europa","fiesta":"07-11","nacimiento":"Nursia (Italia), hacia el año 480","fallecimiento":"Montecasino, 21 de marzo de 547","patronazgo":"Europa, monjes, estudiantes, agonizantes; invocado contra el veneno y las tentaciones","biografia":"Nació en Nursia, en la Umbría italiana, hacia el año 480, en una familia acomodada que lo envió a estudiar a Roma. La decadencia moral de la ciudad lo empujó a dejarlo todo: se retiró a una cueva en Subiaco, donde vivió tres años como ermitaño, aprendiendo en la soledad el arte de buscar a Dios.\n\nSu fama de santidad atrajo discípulos, y con ellos fue fundando pequeños monasterios. Hacia el año 529 se estableció en la cima de Montecasino, donde levantó la abadía que se convertiría en cuna del monacato occidental y escribió su Regla: un camino de vida sobrio y equilibrado, resumido en el lema «Ora et labora», reza y trabaja.\n\nBenito comprendió que Europa no se reconstruiría con las armas sino con la oración, el trabajo y la hospitalidad: sus monjes desecaron pantanos, copiaron manuscritos, enseñaron a cultivar la tierra y guardaron encendida la lámpara de la fe mientras caía el Imperio romano. Murió de pie, sostenido por sus discípulos, con las manos alzadas en oración, el 21 de marzo de 547.\n\nSan Pablo VI lo proclamó patrono de Europa en 1964, reconociendo que el continente le debe buena parte de su alma.","milagros":["En Vicovaro, unos monjes descontentos intentaron envenenarlo; al bendecir la copa con la señal de la cruz, esta se quebró en pedazos como golpeada por una piedra.","San Gregorio Magno narra que un cuervo acudía cada día a recibir pan de su mano, y que por orden del santo se llevó un pan envenenado que le habían enviado para matarlo.","Por su oración brotó agua en la cima rocosa de un monte para tres monasterios que carecían de ella, y el hierro de una hoz hundido en el lago volvió a la superficie y se unió solo al mango.","Vio en éxtasis el alma de su hermana, santa Escolástica, subir al cielo en forma de paloma tres días después de su última conversación."],"frases":["Ora et labora: reza y trabaja.","Que a Cristo no antepongan absolutamente nada, y que Él nos conduzca a todos juntos a la vida eterna. (Regla, cap. 72)","Escucha, hijo, los preceptos del maestro e inclina el oído de tu corazón. (Regla, prólogo)","El ocio es enemigo del alma. (Regla, cap. 48)"],"obras":["La Regla de los monjes (Regula monachorum), fundamento del monacato de Occidente.","La abadía de Montecasino y los doce monasterios de Subiaco.","La red monástica benedictina que conservó la fe y la cultura clásica durante los siglos oscuros."],"extra":"Su medalla, con la cruz y las iniciales «Vade retro satana», es uno de los sacramentales más difundidos de la Iglesia. Su hermana gemela, santa Escolástica, fundó la rama femenina de la familia benedictina.","imagenes":[]}'),
('santo-teresa-lisieux', 'santos', '{"id":"santo-teresa-lisieux","nombre":"Santa Teresa del Niño Jesús","titulo":"Virgen, carmelita, doctora de la Iglesia","fiesta":"10-01","nacimiento":"Alenzón (Francia), 2 de enero de 1873","fallecimiento":"Lisieux, 30 de septiembre de 1897","patronazgo":"Misiones, misioneros, enfermos de tuberculosis, Francia","biografia":"Teresa Martin nació en Alenzón en 1873, la menor de nueve hermanos, hija de los santos Luis Martin y Celia Guérin. Perdió a su madre a los cuatro años y creció envuelta en una fe doméstica cálida y exigente a la vez.\n\nA los quince años, tras pedírselo al mismo papa León XIII en una audiencia, entró en el Carmelo de Lisieux. Allí vivió nueve años ocultos, sin nada exterior que contar: su grandeza fue descubrir el «caminito» de la infancia espiritual, la confianza total en el amor misericordioso de Dios, hecha de fidelidad en lo pequeño.\n\nEnferma de tuberculosis, atravesó al final de su vida una noche oscura de la fe que ofreció por los que no creen. Murió a los veinticuatro años diciendo: «Dios mío, os amo». Su autobiografía, Historia de un alma, publicada tras su muerte, recorrió el mundo.\n\nFue canonizada en 1925 y proclamada doctora de la Iglesia por san Juan Pablo II en 1997: la doctora de la ciencia del amor.","milagros":["La «lluvia de rosas»: innumerables gracias y curaciones atribuidas a su intercesión desde su muerte, que ella misma había prometido: «Pasaré mi cielo haciendo el bien sobre la tierra».","La curación súbita de la hermana Luisa de San Germán (1915) y la de Gabrielle Trimusi (1923), reconocidas para su beatificación y canonización.","De niña, a los diez años, fue curada de una grave enfermedad al ver sonreír la imagen de la Virgen: la «sonrisa de la Virgen» del 13 de mayo de 1883."],"frases":["Mi vocación es el amor: en el corazón de la Iglesia, mi Madre, yo seré el amor.","Todo es gracia.","Quiero pasar mi cielo haciendo el bien sobre la tierra.","La santidad no está en tal o cual práctica: consiste en una disposición del corazón que nos hace humildes y pequeños en los brazos de Dios."],"obras":["Historia de un alma (manuscritos autobiográficos A, B y C).","Cartas, poesías y recreaciones piadosas escritas en el Carmelo.","El «caminito» de infancia espiritual, propuesto a toda la Iglesia como camino de santidad."],"extra":"Es copatrona de las misiones junto a san Francisco Javier sin haber salido nunca de su convento. Sus padres, Luis y Celia Martin, son el primer matrimonio canonizado conjuntamente.","imagenes":[]}')
on conflict (id) do nothing;
