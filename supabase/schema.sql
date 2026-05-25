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
to anon, authenticated
using (true);

grant select on public.motorcycles to anon, authenticated;

create table if not exists public.motorcycle_reviews (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id text not null references public.motorcycles(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
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
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
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

alter table if exists public.motorcycle_reviews
  add column if not exists user_id uuid null;

do $$
begin
  alter table public.motorcycle_reviews
    add constraint motorcycle_reviews_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

alter table if exists public.motorcycle_reviews
  drop constraint if exists motorcycle_reviews_status_check;

alter table if exists public.motorcycle_reviews
  add constraint motorcycle_reviews_status_check
  check (status in ('pending', 'approved', 'rejected', 'hidden'));

create index if not exists motorcycle_reviews_motorcycle_id_idx on public.motorcycle_reviews (motorcycle_id);
create index if not exists motorcycle_reviews_status_idx on public.motorcycle_reviews (status);
create index if not exists motorcycle_reviews_user_id_idx on public.motorcycle_reviews (user_id);

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
to anon, authenticated
using (status = 'approved');

drop policy if exists "Users can read own motorcycle reviews" on public.motorcycle_reviews;
create policy "Users can read own motorcycle reviews"
on public.motorcycle_reviews
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can insert pending motorcycle reviews" on public.motorcycle_reviews;
drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;
drop policy if exists "Anonymous motorcycle reviews can be created" on public.motorcycle_reviews;
drop policy if exists "Authenticated motorcycle reviews can be created" on public.motorcycle_reviews;
create policy "Anonymous motorcycle reviews can be created"
on public.motorcycle_reviews
for insert
to anon
with check (
  status = 'pending'
  and motorcycle_id is not null
  and user_id is null
  and length(trim(user_name)) > 0
  and rating between 1 and 5
  and riding_style in ('ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario')
  and length(trim(comment)) > 0
  and verified = false
  and source = 'user'
);

create policy "Authenticated motorcycle reviews can be created"
on public.motorcycle_reviews
for insert
to authenticated
with check (
  status = 'pending'
  and motorcycle_id is not null
  and user_id = auth.uid()
  and length(trim(user_name)) > 0
  and rating between 1 and 5
  and riding_style in ('ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario')
  and length(trim(comment)) > 0
  and verified = false
  and source = 'user'
);

grant select on public.motorcycle_reviews to anon, authenticated;
grant insert on public.motorcycle_reviews to anon, authenticated;
grant update (status) on public.motorcycle_reviews to authenticated;

create table if not exists public.review_reactions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.motorcycle_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'helpful',
  created_at timestamptz not null default now()
);

alter table if exists public.review_reactions
  drop constraint if exists review_reactions_type_check;

alter table if exists public.review_reactions
  add constraint review_reactions_type_check
  check (type in ('helpful', 'not_helpful'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_reactions_review_id_user_id_type_key'
      and conrelid = 'public.review_reactions'::regclass
  ) then
    alter table public.review_reactions
      add constraint review_reactions_review_id_user_id_type_key
      unique (review_id, user_id, type);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_reactions_review_id_user_id_key'
      and conrelid = 'public.review_reactions'::regclass
  ) then
    alter table public.review_reactions
      add constraint review_reactions_review_id_user_id_key
      unique (review_id, user_id);
  end if;
end $$;

create index if not exists review_reactions_review_id_idx
on public.review_reactions (review_id);

create index if not exists review_reactions_user_id_idx
on public.review_reactions (user_id);

alter table public.review_reactions enable row level security;

drop policy if exists "Helpful review reactions are readable" on public.review_reactions;
create policy "Helpful review reactions are readable"
on public.review_reactions
for select
to anon, authenticated
using (type = 'helpful');

drop policy if exists "Users can read own review reactions" on public.review_reactions;
create policy "Users can read own review reactions"
on public.review_reactions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own helpful reaction" on public.review_reactions;
drop policy if exists "Users can create own review reaction" on public.review_reactions;
create policy "Users can create own review reaction"
on public.review_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and type in ('helpful', 'not_helpful')
  and not exists (
    select 1
    from public.motorcycle_reviews
    where motorcycle_reviews.id = review_reactions.review_id
      and motorcycle_reviews.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own helpful reaction" on public.review_reactions;
drop policy if exists "Users can delete own review reaction" on public.review_reactions;
create policy "Users can delete own review reaction"
on public.review_reactions
for delete
to authenticated
using (user_id = auth.uid());

revoke all on table public.review_reactions from anon;
revoke all on table public.review_reactions from authenticated;

grant select on public.review_reactions to anon, authenticated;
grant insert (review_id, user_id, type) on public.review_reactions to authenticated;
grant delete on public.review_reactions to authenticated;

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.motorcycle_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  comment text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.review_reports
  add column if not exists comment text null;

alter table if exists public.review_reports
  add column if not exists status text not null default 'pending';

alter table if exists public.review_reports
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.review_reports
  drop constraint if exists review_reports_reason_check;

alter table if exists public.review_reports
  add constraint review_reports_reason_check
  check (reason in ('spam', 'offensive', 'false_information', 'harassment', 'other'));

alter table if exists public.review_reports
  drop constraint if exists review_reports_status_check;

alter table if exists public.review_reports
  add constraint review_reports_status_check
  check (status in ('pending', 'reviewed', 'dismissed', 'action_taken'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_reports_review_id_user_id_key'
      and conrelid = 'public.review_reports'::regclass
  ) then
    alter table public.review_reports
      add constraint review_reports_review_id_user_id_key
      unique (review_id, user_id);
  end if;
end $$;

create index if not exists review_reports_review_id_idx
on public.review_reports (review_id);

create index if not exists review_reports_user_id_idx
on public.review_reports (user_id);

create index if not exists review_reports_status_idx
on public.review_reports (status);

create index if not exists review_reports_created_at_idx
on public.review_reports (created_at);

drop trigger if exists set_review_reports_updated_at on public.review_reports;
create trigger set_review_reports_updated_at
before update on public.review_reports
for each row
execute function public.set_updated_at();

alter table public.review_reports enable row level security;

drop policy if exists "Users can read own review reports" on public.review_reports;
create policy "Users can read own review reports"
on public.review_reports
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own review report" on public.review_reports;
create policy "Users can create own review report"
on public.review_reports
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and reason in ('spam', 'offensive', 'false_information', 'harassment', 'other')
  and review_id is not null
  and not exists (
    select 1
    from public.motorcycle_reviews
    where motorcycle_reviews.id = review_reports.review_id
      and motorcycle_reviews.user_id = auth.uid()
  )
);

revoke all on table public.review_reports from anon;
revoke all on table public.review_reports from authenticated;

grant select on public.review_reports to authenticated;
grant insert (review_id, user_id, reason, comment, status) on public.review_reports to authenticated;
grant update (status) on public.review_reports to authenticated;

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.motorcycle_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  comment text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.review_replies
  drop constraint if exists review_replies_status_check;

alter table if exists public.review_replies
  add constraint review_replies_status_check
  check (status in ('pending', 'approved', 'hidden', 'rejected'));

alter table if exists public.review_replies
  drop constraint if exists review_replies_comment_check;

alter table if exists public.review_replies
  add constraint review_replies_comment_check
  check (length(trim(comment)) > 0);

alter table if exists public.review_replies
  drop constraint if exists review_replies_user_name_check;

alter table if exists public.review_replies
  add constraint review_replies_user_name_check
  check (length(trim(user_name)) > 0);

alter table if exists public.review_replies
  alter column user_name drop default;

create index if not exists review_replies_review_id_idx
on public.review_replies (review_id);

create index if not exists review_replies_user_id_idx
on public.review_replies (user_id);

create index if not exists review_replies_status_idx
on public.review_replies (status);

drop trigger if exists set_review_replies_updated_at on public.review_replies;
create trigger set_review_replies_updated_at
before update on public.review_replies
for each row
execute function public.set_updated_at();

alter table public.review_replies enable row level security;

drop policy if exists "Approved review replies are readable" on public.review_replies;
create policy "Approved review replies are readable"
on public.review_replies
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Users can read own review replies" on public.review_replies;
create policy "Users can read own review replies"
on public.review_replies
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own review reply" on public.review_replies;
drop policy if exists "Authenticated users can create review reply" on public.review_replies;
create policy "Users can create own review reply"
on public.review_replies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and review_id is not null
  and length(trim(comment)) > 0
  and length(trim(user_name)) > 0
  and exists (
    select 1
    from public.motorcycle_reviews
    where motorcycle_reviews.id = review_replies.review_id
      and (
        motorcycle_reviews.user_id is null
        or motorcycle_reviews.user_id <> auth.uid()
      )
  )
);

revoke all on table public.review_replies from anon;
revoke all on table public.review_replies from authenticated;

grant select on public.review_replies to anon, authenticated;
grant insert (review_id, user_id, user_name, comment) on public.review_replies to authenticated;
grant update (status) on public.review_replies to authenticated;

notify pgrst, 'reload schema';

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  avatar_url text null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), ''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.user_profiles;
create policy "Admins can read all profiles"
on public.user_profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id and role = 'user');

drop policy if exists "Users can update own editable profile" on public.user_profiles;
create policy "Users can update own editable profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from authenticated;

grant select on table public.user_profiles to authenticated;
grant insert (id, display_name, avatar_url) on public.user_profiles to authenticated;
grant update (display_name, avatar_url) on public.user_profiles to authenticated;

drop policy if exists "Admins can read all motorcycle reviews" on public.motorcycle_reviews;
create policy "Admins can read all motorcycle reviews"
on public.motorcycle_reviews
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update motorcycle review status" on public.motorcycle_reviews;
create policy "Admins can update motorcycle review status"
on public.motorcycle_reviews
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'approved', 'rejected', 'hidden')
);

drop policy if exists "Admins can read all review reports" on public.review_reports;
create policy "Admins can read all review reports"
on public.review_reports
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update review report status" on public.review_reports;
create policy "Admins can update review report status"
on public.review_reports
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'reviewed', 'dismissed', 'action_taken')
);

drop policy if exists "Admins can read all review replies" on public.review_replies;
create policy "Admins can read all review replies"
on public.review_replies
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update review reply status" on public.review_replies;
create policy "Admins can update review reply status"
on public.review_replies
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'approved', 'hidden', 'rejected')
);

create table if not exists public.model_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  brand text not null check (length(trim(brand)) > 0),
  model text not null check (length(trim(model)) > 0),
  year integer not null check (year between 1900 and 2100),
  segment text null,
  contact_email text null,
  official_url text null,
  comment text null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'rejected')),
  source text not null default 'user' check (source in ('user', 'admin', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.model_requests
  add column if not exists official_url text null;

create index if not exists model_requests_user_id_idx on public.model_requests (user_id);
create index if not exists model_requests_status_idx on public.model_requests (status);
create index if not exists model_requests_created_at_idx on public.model_requests (created_at);
create index if not exists model_requests_brand_model_year_idx on public.model_requests (brand, model, year);

drop trigger if exists set_model_requests_updated_at on public.model_requests;
create trigger set_model_requests_updated_at
before update on public.model_requests
for each row
execute function public.set_updated_at();

alter table public.model_requests enable row level security;

drop policy if exists "Anonymous model requests can be created" on public.model_requests;
create policy "Anonymous model requests can be created"
on public.model_requests
for insert
to anon
with check (
  user_id is null
  and status = 'pending'
  and source = 'user'
  and length(trim(brand)) > 0
  and length(trim(model)) > 0
  and year between 1900 and 2100
);

drop policy if exists "Authenticated model requests can be created" on public.model_requests;
create policy "Authenticated model requests can be created"
on public.model_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and source = 'user'
  and length(trim(brand)) > 0
  and length(trim(model)) > 0
  and year between 1900 and 2100
);

drop policy if exists "Users can read own model requests" on public.model_requests;
create policy "Users can read own model requests"
on public.model_requests
for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.model_requests from anon;
revoke all on table public.model_requests from authenticated;

grant insert on public.model_requests to anon, authenticated;
grant select on public.model_requests to authenticated;

notify pgrst, 'reload schema';
