-- MotoAtlas Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  create type motorcycle_segment as enum (
    'trail',
    'adventure',
    'touring',
    'sport-touring',
    'naked',
    'sport',
    'supersport',
    'hypernaked',
    'enduro',
    'dual-sport',
    'scrambler',
    'custom',
    'cruiser',
    'retro',
    'neo-retro',
    'scooter'
  );
exception
  when duplicate_object then null;
end $$;

alter type motorcycle_segment add value if not exists 'adventure';
alter type motorcycle_segment add value if not exists 'touring';
alter type motorcycle_segment add value if not exists 'sport';
alter type motorcycle_segment add value if not exists 'supersport';
alter type motorcycle_segment add value if not exists 'hypernaked';
alter type motorcycle_segment add value if not exists 'enduro';
alter type motorcycle_segment add value if not exists 'dual-sport';
alter type motorcycle_segment add value if not exists 'scrambler';
alter type motorcycle_segment add value if not exists 'custom';
alter type motorcycle_segment add value if not exists 'cruiser';
alter type motorcycle_segment add value if not exists 'retro';
alter type motorcycle_segment add value if not exists 'neo-retro';
alter type motorcycle_segment add value if not exists 'scooter';

do $$
begin
  create type motorcycle_license as enum ('A2', 'A');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type motorcycle_engine_type as enum (
    'single-cylinder',
    'parallel-twin',
    'inline-three',
    'inline-four',
    'v-twin',
    'l-twin',
    'boxer-twin'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type motorcycle_data_source as enum ('api', 'manual', 'estimated', 'user', 'placeholder');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.motorcycles (
  id text primary key,
  brand text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  segment motorcycle_segment not null,
  license motorcycle_license not null,
  is_a2_compatible boolean not null default false,
  is_a2_limited_version boolean not null default false,
  limited_power_hp numeric(6, 2) null check (limited_power_hp is null or limited_power_hp > 0),
  original_power_hp numeric(6, 2) null check (original_power_hp is null or original_power_hp > 0),
  engine_type motorcycle_engine_type not null,
  displacement_cc integer not null check (displacement_cc > 0),
  power_hp numeric(6, 2) not null check (power_hp > 0),
  torque_nm numeric(6, 2) not null check (torque_nm > 0),
  wet_weight_kg numeric(6, 2) not null check (wet_weight_kg > 0),
  seat_height_mm integer not null check (seat_height_mm > 0),
  fuel_tank_liters numeric(5, 2) not null check (fuel_tank_liters > 0),
  price_eur integer not null check (price_eur >= 0),
  image_url text not null,
  image_locked boolean not null default false,
  description text not null,
  description_locked boolean not null default false,
  specs_source motorcycle_data_source not null default 'manual',
  price_source motorcycle_data_source not null default 'manual',
  image_source motorcycle_data_source not null default 'manual',
  scores_source motorcycle_data_source not null default 'estimated',
  pros_cons_source motorcycle_data_source not null default 'estimated',
  reliability_source motorcycle_data_source not null default 'estimated',
  use_scores jsonb not null default '{
    "city": 0,
    "touring": 0,
    "offroad": 0,
    "passenger": 0,
    "beginner": 0,
    "sport": 0,
    "funFactor": 0
  }'::jsonb,
  abs_cornering boolean not null default false,
  traction_control boolean not null default false,
  riding_modes boolean not null default false,
  cruise_control boolean not null default false,
  quickshifter boolean not null default false,
  heated_grips boolean not null default false,
  tubeless_wheels boolean not null default false,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  common_issues text[] not null default '{}',
  report_count integer not null default 0 check (report_count >= 0),
  reliability_score numeric(3, 1) not null default 0 check (reliability_score between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.motorcycles
  add column if not exists image_locked boolean not null default false;

alter table if exists public.motorcycles
  add column if not exists description_locked boolean not null default false;

alter table if exists public.motorcycles
  add column if not exists is_a2_compatible boolean not null default false;

alter table if exists public.motorcycles
  add column if not exists is_a2_limited_version boolean not null default false;

alter table if exists public.motorcycles
  add column if not exists limited_power_hp numeric(6, 2) null check (limited_power_hp is null or limited_power_hp > 0);

alter table if exists public.motorcycles
  add column if not exists original_power_hp numeric(6, 2) null check (original_power_hp is null or original_power_hp > 0);

alter table if exists public.motorcycles
  add column if not exists specs_source motorcycle_data_source not null default 'manual';

alter table if exists public.motorcycles
  add column if not exists price_source motorcycle_data_source not null default 'manual';

alter table if exists public.motorcycles
  add column if not exists image_source motorcycle_data_source not null default 'manual';

alter table if exists public.motorcycles
  add column if not exists scores_source motorcycle_data_source not null default 'estimated';

alter table if exists public.motorcycles
  add column if not exists pros_cons_source motorcycle_data_source not null default 'estimated';

alter table if exists public.motorcycles
  add column if not exists reliability_source motorcycle_data_source not null default 'estimated';

create index if not exists motorcycles_brand_idx on public.motorcycles (brand);
create index if not exists motorcycles_segment_idx on public.motorcycles (segment);
create index if not exists motorcycles_license_idx on public.motorcycles (license);
create index if not exists motorcycles_is_a2_compatible_idx on public.motorcycles (is_a2_compatible);
create index if not exists motorcycles_price_eur_idx on public.motorcycles (price_eur);
create index if not exists motorcycles_power_hp_idx on public.motorcycles (power_hp);
create index if not exists motorcycles_wet_weight_kg_idx on public.motorcycles (wet_weight_kg);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_motorcycles_updated_at on public.motorcycles;
create trigger set_motorcycles_updated_at
before update on public.motorcycles
for each row
execute function public.set_updated_at();

alter table public.motorcycles enable row level security;

drop policy if exists "Public motorcycles are readable" on public.motorcycles;
create policy "Public motorcycles are readable"
on public.motorcycles
for select
to anon
using (true);

create table if not exists public.motorcycle_reviews (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id text not null references public.motorcycles(id) on delete cascade,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  riding_style text not null default 'diario' check (riding_style in ('ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario')),
  ownership_months integer null check (ownership_months is null or ownership_months >= 0),
  kilometers integer null check (kilometers is null or kilometers >= 0),
  comment text not null,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  source text not null default 'user' check (source in ('user', 'mock', 'seed', 'import')),
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.motorcycle_reviews
  add column if not exists riding_style text not null default 'diario'
  check (riding_style in ('ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario'));

alter table if exists public.motorcycle_reviews
  add column if not exists verified boolean not null default false;

alter table if exists public.motorcycle_reviews
  add column if not exists source text not null default 'user' check (source in ('user', 'mock', 'seed', 'import'));

create index if not exists motorcycle_reviews_motorcycle_id_idx on public.motorcycle_reviews (motorcycle_id);
create index if not exists motorcycle_reviews_status_idx on public.motorcycle_reviews (status);

drop trigger if exists set_motorcycle_reviews_updated_at on public.motorcycle_reviews;
create trigger set_motorcycle_reviews_updated_at
before update on public.motorcycle_reviews
for each row
execute function public.set_updated_at();

alter table public.motorcycle_reviews enable row level security;

drop policy if exists "Approved motorcycle reviews are readable" on public.motorcycle_reviews;
create policy "Approved motorcycle reviews are readable"
on public.motorcycle_reviews
for select
to anon
using (status = 'approved');

drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;
create policy "Public motorcycle reviews can be created"
on public.motorcycle_reviews
for insert
to anon
with check (
  status = 'pending'
  and motorcycle_id is not null
  and length(trim(user_name)) > 0
  and rating between 1 and 5
  and riding_style in ('ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario')
  and length(trim(comment)) > 0
  and verified = false
  and source = 'user'
);

grant select on public.motorcycle_reviews to anon;
grant insert on public.motorcycle_reviews to anon;

notify pgrst, 'reload schema';
