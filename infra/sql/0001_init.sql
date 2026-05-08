create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  title text not null,
  notes text,
  visited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  r2_key text not null,
  mime text not null,
  width int,
  height int,
  exif_lat double precision,
  exif_lng double precision,
  exif_taken_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists ai_enrichments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  draft_text text,
  tags jsonb,
  status text not null default 'pending',
  model_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_clerk_user_id on users(clerk_user_id);
create index if not exists idx_trips_owner_id on trips(owner_id);
create index if not exists idx_places_trip_id on places(trip_id);
create index if not exists idx_places_search on places using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(notes,'')));
create index if not exists idx_place_photos_place_id on place_photos(place_id);
