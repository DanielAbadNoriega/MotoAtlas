-- MotoAtlas Supabase schema
-- Run this in Supabase SQL Editor.

do $$
begin
  create type motorcycle_segment as enum ('trail', 'naked', 'sport-touring');
exception
  when duplicate_object then null;
end $$;

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

create table if not exists public.motorcycles (
  id text primary key,
  brand text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  segment motorcycle_segment not null,
  license motorcycle_license not null,
  engine_type motorcycle_engine_type not null,
  displacement_cc integer not null check (displacement_cc > 0),
  power_hp numeric(6, 2) not null check (power_hp > 0),
  torque_nm numeric(6, 2) not null check (torque_nm > 0),
  wet_weight_kg numeric(6, 2) not null check (wet_weight_kg > 0),
  seat_height_mm integer not null check (seat_height_mm > 0),
  fuel_tank_liters numeric(5, 2) not null check (fuel_tank_liters > 0),
  price_eur integer not null check (price_eur >= 0),
  image_url text not null,
  description text not null,
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

create index if not exists motorcycles_brand_idx on public.motorcycles (brand);
create index if not exists motorcycles_segment_idx on public.motorcycles (segment);
create index if not exists motorcycles_license_idx on public.motorcycles (license);
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
