-- CineMatch: esquema do banco (Supabase / PostgreSQL)
-- Cole no SQL Editor do Supabase e execute uma vez.

-- ========== Perfis ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  bio text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== Preferências (onboarding) ==========
create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content_type text not null default 'both' check (content_type in ('movie','tv','both')),
  genres text[] not null default '{}',
  styles text[] not null default '{}',
  duration text not null default 'any' check (duration in ('short','medium','long','any')),
  status_pref text not null default 'any' check (status_pref in ('finished','new','any')),
  favorites jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ========== Biblioteca (status, favoritos, nota) ==========
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text not null,
  poster_path text,
  year integer,
  genre_ids integer[] not null default '{}',
  runtime_min integer,
  status text check (status in ('want','watching','watched','dropped')),
  is_favorite boolean not null default false,
  rating numeric(3,1) check (rating >= 0 and rating <= 10),
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);
create index if not exists library_items_user_idx on public.library_items (user_id, status);

-- ========== Listas personalizadas (fase 2: telas) ==========
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  list_id uuid not null references public.lists(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie','tv')),
  title text not null,
  poster_path text,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (list_id, tmdb_id, media_type)
);

-- ========== Progresso de episódios (fase 2: telas) ==========
create table if not exists public.episode_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamptz not null default now(),
  primary key (user_id, tv_id, season_number, episode_number)
);

-- ========== Segurança (RLS): cada usuário só acessa os próprios dados ==========
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.library_items enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.episode_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "preferences_all_own" on public.preferences;
create policy "preferences_all_own" on public.preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "library_all_own" on public.library_items;
create policy "library_all_own" on public.library_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lists_all_own" on public.lists;
create policy "lists_all_own" on public.lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "list_items_all_own" on public.list_items;
create policy "list_items_all_own" on public.list_items for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = auth.uid()));

drop policy if exists "episodes_all_own" on public.episode_progress;
create policy "episodes_all_own" on public.episode_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
