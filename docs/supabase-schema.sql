-- ============================================================
-- SCHEMA para Te-incluye / Incluyeme en Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- PROYECTOS
create table if not exists proyectos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  tag         text,
  fecha       date,
  image       text,
  destacado   boolean default false,
  created_at  timestamptz default now()
);

-- RECURSOS
create table if not exists recursos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  tag         text,
  direccion   text,
  telefono    text,
  horario     text,
  destacado   boolean default false,
  created_at  timestamptz default now()
);

-- GALERÍA
create table if not exists galeria (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  categoria   text,
  url         text,
  fecha       date,
  destacado   boolean default false,
  type        text,        -- 'video' | null
  provider    text,        -- 'youtube' | 'vimeo' | 'facebook' | null
  video_id    text,
  video_url   text,
  created_at  timestamptz default now()
);

-- VIDEOS
create table if not exists videos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  categoria   text,
  provider    text,        -- 'youtube' | 'vimeo' | 'facebook'
  video_url   text,
  video_id    text,
  thumbnail   text,
  duration    text,
  fecha       date,
  destacado   boolean default false,
  created_at  timestamptz default now()
);

-- CONTENIDO (hero, stats, featured) — una sola fila con id='main'
create table if not exists contenido (
  id   text primary key,   -- siempre 'main'
  data jsonb not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Lectura pública, escritura solo autenticados
-- ============================================================

alter table proyectos enable row level security;
alter table recursos  enable row level security;
alter table galeria   enable row level security;
alter table videos    enable row level security;
alter table contenido enable row level security;

-- Lectura pública (anon puede leer)
create policy "public read proyectos" on proyectos for select using (true);
create policy "public read recursos"  on recursos  for select using (true);
create policy "public read galeria"   on galeria   for select using (true);
create policy "public read videos"    on videos    for select using (true);
create policy "public read contenido" on contenido for select using (true);

-- Escritura solo para usuarios autenticados
create policy "auth write proyectos" on proyectos for all using (auth.role() = 'authenticated');
create policy "auth write recursos"  on recursos  for all using (auth.role() = 'authenticated');
create policy "auth write galeria"   on galeria   for all using (auth.role() = 'authenticated');
create policy "auth write videos"    on videos    for all using (auth.role() = 'authenticated');
create policy "auth write contenido" on contenido for all using (auth.role() = 'authenticated');
