import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemaSql = readFileSync('supabase/schema.sql', 'utf8');
const normalizedSchemaSql = schemaSql.replace(/\s+/g, ' ').toLowerCase();

function getUserProfilesGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.user_profiles\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getModelRequestsGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.model_requests\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getReviewReactionsGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.review_reactions\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getMotorcycleReviewsGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getReviewReportsGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getReviewRepliesGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.review_replies\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getMotorcycleImagesGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.motorcycle_images\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getReviewAspectsGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.motorcycle_review_aspects\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

function getMotorcyclesGrantStatements() {
  return (schemaSql.match(/grant\s+[^;]+\s+on\s+(?:table\s+)?public\.motorcycles\s+to\s+[^;]+;/gi) ?? [])
    .map((statement) => statement.replace(/\s+/g, ' ').trim().toLowerCase());
}

describe('Supabase public motorcycle schema', () => {
  it('permite leer motos públicas también con sesión autenticada', () => {
    expect(schemaSql).toContain('create policy "Public motorcycles are readable"');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.motorcycles to anon, authenticated;');
  });

  it('permite a admins autenticados actualizar motos mediante policy is_admin', () => {
    expect(schemaSql).toContain('alter table public.motorcycles enable row level security;');
    expect(schemaSql).toContain('drop policy if exists "Admins can update motorcycles" on public.motorcycles;');
    expect(schemaSql).toContain('create policy "Admins can update motorcycles"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain('with check (public.is_admin())');
  });

  it('concede permisos de actualización solo a nivel de columna y no abre escritura a anon ni no-admin', () => {
    const grants = getMotorcyclesGrantStatements();

    expect(grants).toEqual([
      'grant select on public.motorcycles to anon, authenticated;',
      'grant update ( brand, model, year, description, description_locked, segment, license, engine_type, displacement_cc, power_hp, torque_nm, wet_weight_kg, seat_height_mm, fuel_tank_liters, price_eur, price_source, image_url, image_source, image_locked, specs_source, scores_source, pros_cons_source, reliability_source, abs_cornering, traction_control, riding_modes, cruise_control, quickshifter, heated_grips, tubeless_wheels, is_a2_compatible, is_a2_limited_version, limited_power_hp, original_power_hp ) on public.motorcycles to authenticated;',
    ]);

    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.motorcycles\s+to\s+anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.motorcycles\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+insert\s+on\s+(?:table\s+)?public\.motorcycles\s+to\s+(anon|authenticated)/);
  });
});

describe('Supabase motorcycle_reviews RLS schema', () => {
  it('incluye user_id nullable referenciado a auth.users con borrado set null', () => {
    expect(schemaSql).toContain('user_id uuid null references auth.users(id) on delete set null');
    expect(schemaSql).toContain('add column if not exists user_id uuid null');
    expect(schemaSql).toContain('add constraint motorcycle_reviews_user_id_fkey');
    expect(schemaSql).toContain('foreign key (user_id) references auth.users(id) on delete set null');
    expect(schemaSql).toContain('create index if not exists motorcycle_reviews_user_id_idx');
  });

  it('elimina cualquier policy de INSERT directo a motorcycle_reviews', () => {
    expect(schemaSql).toContain('drop policy if exists "Public can insert pending motorcycle reviews" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('drop policy if exists "Anonymous motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).not.toContain('create policy "Public can insert pending motorcycle reviews"');
    expect(schemaSql).toContain('drop policy if exists "Authenticated motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(normalizedSchemaSql).not.toMatch(/create policy\s+"Anonymous motorcycle reviews can be created"\s+on public\.motorcycle_reviews\s+for insert/i);
    expect(normalizedSchemaSql).not.toMatch(/create policy\s+"Authenticated motorcycle reviews can be created"\s+on public\.motorcycle_reviews\s+for insert/i);
    expect(normalizedSchemaSql).not.toMatch(/create policy\s+"Public motorcycle reviews can be created"\s+on public\.motorcycle_reviews\s+for insert/i);
  });

  it('contiene una policy de SELECT pública solo para reviews approved', () => {
    expect(schemaSql).toContain('drop policy if exists "Approved motorcycle reviews are readable" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Approved motorcycle reviews are readable"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain("using (status = 'approved')");
  });

  it('permite que usuarios autenticados lean sus propias reviews no públicas', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can read own motorcycle reviews" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Users can read own motorcycle reviews"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
  });

  it('permite a admins leer todas las reviews y actualizar solo status', () => {
    const grants = getMotorcycleReviewsGrantStatements();

    expect(schemaSql).toContain('drop policy if exists "Admins can read all motorcycle reviews" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Admins can read all motorcycle reviews"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can update motorcycle review status" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Admins can update motorcycle review status"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain('with check (');
    expect(schemaSql).toContain('public.is_admin()');
    expect(schemaSql).toContain("status in ('pending', 'approved', 'rejected', 'hidden')");

    expect(grants).toEqual([
      'grant select on public.motorcycle_reviews to anon, authenticated;',
      'grant update (status) on public.motorcycle_reviews to authenticated;',
    ]);

    expect(normalizedSchemaSql).toContain('revoke insert, update, delete, truncate, references, trigger on public.motorcycle_reviews from anon;');
    expect(normalizedSchemaSql).toContain('revoke insert, update, delete, truncate, references, trigger on public.motorcycle_reviews from authenticated;');
    expect(normalizedSchemaSql).not.toMatch(/grant\s+insert\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+truncate\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+references\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+trigger\s+on\s+(?:table\s+)?public\.motorcycle_reviews\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toContain('grant update (comment) on public.motorcycle_reviews to authenticated;');
  });

  it('no abre lectura total de motorcycle_reviews pendientes a anon', () => {
    expect(normalizedSchemaSql).not.toMatch(/on public\.motorcycle_reviews for select to anon\b[^;]*using \(true\)/);
    expect(normalizedSchemaSql).not.toMatch(/on public\.motorcycle_reviews for select to anon, authenticated\b[^;]*using \(true\)/);
    expect(normalizedSchemaSql).not.toContain("using (status in ('pending', 'approved', 'rejected', 'hidden'))");
  });

  it('incluye hidden como status válido', () => {
    expect(schemaSql).toContain("check (status in ('pending', 'approved', 'rejected', 'hidden'))");
    expect(schemaSql).toContain('drop constraint if exists motorcycle_reviews_status_check');
    expect(schemaSql).toContain('add constraint motorcycle_reviews_status_check');
  });

  it('incluye verified con default false para no marcar reviews públicas sin dato real', () => {
    expect(schemaSql).toContain('verified boolean not null default false');
    expect(schemaSql).toContain('add column if not exists verified boolean not null default false');
  });
});

describe('Supabase review_reactions schema', () => {
  it('crea tabla de reacciones útiles con claves, checks e índices esperados', () => {
    expect(schemaSql).toContain('create table if not exists public.review_reactions');
    expect(schemaSql).toContain('id uuid primary key default gen_random_uuid()');
    expect(schemaSql).toContain('review_id uuid not null references public.motorcycle_reviews(id) on delete cascade');
    expect(schemaSql).toContain('user_id uuid not null references auth.users(id) on delete cascade');
    expect(schemaSql).toContain("type text not null default 'helpful'");
    expect(schemaSql).toContain('created_at timestamptz not null default now()');

    expect(schemaSql).toContain('drop constraint if exists review_reactions_type_check');
    expect(schemaSql).toContain('add constraint review_reactions_type_check');
    expect(schemaSql).toContain("check (type in ('helpful', 'not_helpful'))");

    expect(schemaSql).toContain('review_reactions_review_id_user_id_type_key');
    expect(schemaSql).toContain('from pg_constraint');
    expect(schemaSql).toContain("conrelid = 'public.review_reactions'::regclass");
    expect(schemaSql).toContain('add constraint review_reactions_review_id_user_id_type_key');
    expect(schemaSql).toContain('unique (review_id, user_id, type)');
    expect(schemaSql).toContain('review_reactions_review_id_user_id_key');
    expect(schemaSql).toContain('add constraint review_reactions_review_id_user_id_key');
    expect(schemaSql).toContain('unique (review_id, user_id)');

    expect(schemaSql).toMatch(
      /create index if not exists review_reactions_review_id_idx\s+on public\.review_reactions \(review_id\);/
    );

    expect(schemaSql).toMatch(
      /create index if not exists review_reactions_user_id_idx\s+on public\.review_reactions \(user_id\);/
    );
  });

  it('activa RLS y permite lectura de helpful para contadores públicos', () => {
    expect(schemaSql).toContain('alter table public.review_reactions enable row level security;');
    expect(schemaSql).toContain('drop policy if exists "Helpful review reactions are readable" on public.review_reactions;');
    expect(schemaSql).toContain('create policy "Helpful review reactions are readable"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain("using (type = 'helpful')");
    expect(normalizedSchemaSql).not.toMatch(/for select\s+to anon, authenticated\s+using \(type in \('helpful', 'not_helpful'\)\)/);
    expect(normalizedSchemaSql).not.toMatch(/for select\s+to anon\b[^;]*not_helpful/);
  });

  it('permite a usuarios autenticados leer sus propias reacciones privadas sin abrir not_helpful públicamente', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can read own review reactions" on public.review_reactions;');
    expect(schemaSql).toContain('create policy "Users can read own review reactions"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
  });

  it('solo permite insertar reacciones propias helpful/not_helpful a usuarios autenticados y evita autoreacción', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can create own helpful reaction" on public.review_reactions;');
    expect(schemaSql).toContain('drop policy if exists "Users can create own review reaction" on public.review_reactions;');
    expect(schemaSql).toContain('create policy "Users can create own review reaction"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('user_id = auth.uid()');
    expect(schemaSql).toContain("type in ('helpful', 'not_helpful')");
    expect(schemaSql).toContain('not exists (');
    expect(schemaSql).toContain('motorcycle_reviews.id = review_reactions.review_id');
    expect(schemaSql).toContain('motorcycle_reviews.user_id = auth.uid()');
  });

  it('solo permite borrar reacciones propias y no concede update a usuarios normales', () => {
    const grants = getReviewReactionsGrantStatements();

    expect(schemaSql).toContain('drop policy if exists "Users can delete own helpful reaction" on public.review_reactions;');
    expect(schemaSql).toContain('drop policy if exists "Users can delete own review reaction" on public.review_reactions;');
    expect(schemaSql).toContain('create policy "Users can delete own review reaction"');
    expect(schemaSql).toContain('for delete');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
    expect(schemaSql).toContain('revoke all on table public.review_reactions from anon;');
    expect(schemaSql).toContain('revoke all on table public.review_reactions from authenticated;');
    expect(grants).toEqual([
      'grant select on public.review_reactions to anon, authenticated;',
      'grant insert (review_id, user_id, type) on public.review_reactions to authenticated;',
      'grant delete on public.review_reactions to authenticated;',
    ]);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.review_reactions\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/on public\.review_reactions for update to authenticated/);
  });
});

describe('Supabase review_reports schema', () => {
  it('crea tabla de reportes con claves, checks e índices esperados', () => {
    expect(schemaSql).toContain('create table if not exists public.review_reports');
    expect(schemaSql).toContain('id uuid primary key default gen_random_uuid()');
    expect(schemaSql).toContain('review_id uuid not null references public.motorcycle_reviews(id) on delete cascade');
    expect(schemaSql).toContain('user_id uuid not null references auth.users(id) on delete cascade');
    expect(schemaSql).toContain('reason text not null');
    expect(schemaSql).toContain('comment text null');
    expect(schemaSql).toContain("status text not null default 'pending'");
    expect(schemaSql).toContain('created_at timestamptz not null default now()');
    expect(schemaSql).toContain('updated_at timestamptz not null default now()');

    expect(schemaSql).toContain('drop constraint if exists review_reports_reason_check');
    expect(schemaSql).toContain('add constraint review_reports_reason_check');
    expect(schemaSql).toContain("check (reason in ('spam', 'offensive', 'false_information', 'harassment', 'other'))");
    expect(schemaSql).toContain('drop constraint if exists review_reports_status_check');
    expect(schemaSql).toContain('add constraint review_reports_status_check');
    expect(schemaSql).toContain("check (status in ('pending', 'reviewed', 'dismissed', 'action_taken'))");

    expect(schemaSql).toContain('review_reports_review_id_user_id_key');
    expect(schemaSql).toContain("conrelid = 'public.review_reports'::regclass");
    expect(schemaSql).toContain('unique (review_id, user_id)');
    expect(schemaSql).toMatch(/create index if not exists review_reports_review_id_idx\s+on public\.review_reports \(review_id\);/);
    expect(schemaSql).toMatch(/create index if not exists review_reports_user_id_idx\s+on public\.review_reports \(user_id\);/);
    expect(schemaSql).toMatch(/create index if not exists review_reports_status_idx\s+on public\.review_reports \(status\);/);
    expect(schemaSql).toMatch(/create index if not exists review_reports_created_at_idx\s+on public\.review_reports \(created_at\);/);
  });

  it('crea trigger updated_at para reportes', () => {
    expect(schemaSql).toContain('drop trigger if exists set_review_reports_updated_at on public.review_reports;');
    expect(schemaSql).toContain('create trigger set_review_reports_updated_at');
    expect(schemaSql).toContain('before update on public.review_reports');
    expect(schemaSql).toContain('execute function public.set_updated_at();');
  });

  it('activa RLS, permite leer solo reportes propios y no abre lectura pública', () => {
    expect(schemaSql).toContain('alter table public.review_reports enable row level security;');
    expect(schemaSql).toContain('drop policy if exists "Users can read own review reports" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Users can read own review reports"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
    expect(normalizedSchemaSql).not.toMatch(/on public\.review_reports for select to anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/on public\.review_reports for select to anon, authenticated\b/);
  });

  it('solo permite insertar reportes propios pending y evita autoreporte', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can create own review report" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Users can create own review report"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('user_id = auth.uid()');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain("reason in ('spam', 'offensive', 'false_information', 'harassment', 'other')");
    expect(schemaSql).toContain('review_id is not null');
    expect(schemaSql).toContain('not exists (');
    expect(schemaSql).toContain('motorcycle_reviews.id = review_reports.review_id');
    expect(schemaSql).toContain('motorcycle_reviews.user_id = auth.uid()');
  });

  it('permite administración por rol y usa grants mínimos sin delete', () => {
    const grants = getReviewReportsGrantStatements();

    expect(schemaSql).toContain('drop policy if exists "Admins can read all review reports" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Admins can read all review reports"');
    expect(schemaSql).toContain('drop policy if exists "Admins can update review report status" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Admins can update review report status"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain("status in ('pending', 'reviewed', 'dismissed', 'action_taken')");
    expect(schemaSql).toContain('revoke all on table public.review_reports from anon;');
    expect(schemaSql).toContain('revoke all on table public.review_reports from authenticated;');
    expect(grants).toEqual([
      'grant select on public.review_reports to authenticated;',
      'grant insert (review_id, user_id, reason, comment, status) on public.review_reports to authenticated;',
      'grant update (status) on public.review_reports to authenticated;',
    ]);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+select\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+anon/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toContain('grant update (reason, comment) on public.review_reports to authenticated;');
    expect(normalizedSchemaSql).not.toMatch(/on public\.review_reports for delete to authenticated/);
  });
});

describe('Supabase user_profiles auth schema', () => {
  it('permite a admins leer y actualizar estados de reportes sin abrir permisos a usuarios normales', () => {
    const grants = getReviewReportsGrantStatements();

    expect(schemaSql).toContain('drop policy if exists "Admins can read all review reports" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Admins can read all review reports"');
    expect(schemaSql).toContain('on public.review_reports');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can update review report status" on public.review_reports;');
    expect(schemaSql).toContain('create policy "Admins can update review report status"');
    expect(schemaSql).toContain('on public.review_reports');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain('with check (');
    expect(schemaSql).toContain('public.is_admin()');
    expect(schemaSql).toContain("status in ('pending', 'reviewed', 'dismissed', 'action_taken')");

    expect(schemaSql).toContain('revoke all on table public.review_reports from anon;');
    expect(schemaSql).toContain('revoke all on table public.review_reports from authenticated;');

    expect(grants).toEqual([
      'grant select on public.review_reports to authenticated;',
      'grant insert (review_id, user_id, reason, comment, status) on public.review_reports to authenticated;',
      'grant update (status) on public.review_reports to authenticated;',
    ]);

    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+anon/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.review_reports\s+to\s+(anon|authenticated)/);
  });
  it('crea tabla de perfiles con role user/admin y default user', () => {
    expect(schemaSql).toContain('create table if not exists public.user_profiles');
    expect(schemaSql).toContain('id uuid primary key references auth.users(id) on delete cascade');
    expect(schemaSql).toContain("role text not null default 'user' check (role in ('user', 'admin'))");
  });

  it('crea perfil automáticamente al registrarse un usuario', () => {
    expect(schemaSql).toContain('create or replace function public.handle_new_user_profile()');
    expect(schemaSql).toContain('security definer');
    expect(schemaSql).toContain('set search_path = public');
    expect(schemaSql).toContain("new.raw_user_meta_data ->> 'display_name'");
    expect(schemaSql).toContain("new.raw_user_meta_data ->> 'avatar_url'");
    expect(schemaSql).toContain("'user'");
    expect(schemaSql).not.toContain("new.raw_user_meta_data ->> 'role'");
    expect(schemaSql).toContain('revoke execute on function public.handle_new_user_profile() from public;');
    expect(schemaSql).toContain('revoke execute on function public.handle_new_user_profile() from anon;');
    expect(normalizedSchemaSql).not.toMatch(/grant\s+execute\s+on\s+function\s+public\.handle_new_user_profile\(\)\s+to\s+(?:public|anon|authenticated)/i);
    expect(schemaSql).toContain('drop trigger if exists on_auth_user_created_profile on auth.users;');
    expect(schemaSql).toContain('create trigger on_auth_user_created_profile');
    expect(schemaSql).toContain('after insert on auth.users');
  });

  it('activa RLS y limita lectura/escritura al propio perfil', () => {
    expect(schemaSql).toContain('alter table public.user_profiles enable row level security;');
    expect(schemaSql).toContain('create policy "Users can read own profile"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (auth.uid() = id)');
    expect(schemaSql).toContain('create policy "Users can insert own profile"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain("with check (auth.uid() = id and role = 'user')");
    expect(schemaSql).toContain('create policy "Users can update own editable profile"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('with check (auth.uid() = id)');
  });

  it('permite lectura total de perfiles solo a admins', () => {
    expect(schemaSql).toContain('create or replace function public.is_admin()');
    expect(schemaSql).toContain('returns boolean');
    expect(schemaSql).toContain('security definer');
    expect(schemaSql).toContain('set search_path = public');
    expect(schemaSql).toContain('revoke execute on function public.is_admin() from public;');
    expect(schemaSql).toContain('revoke execute on function public.is_admin() from anon;');
    expect(schemaSql).toContain('grant execute on function public.is_admin() to authenticated;');
    expect(normalizedSchemaSql).not.toMatch(/grant\s+execute\s+on\s+function\s+public\.is_admin\(\)\s+to\s+anon/i);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+execute\s+on\s+function\s+public\.is_admin\(\)\s+to\s+public/i);

    expect(schemaSql).toContain('drop policy if exists "Admins can read all profiles" on public.user_profiles;');
    expect(schemaSql).toContain('create policy "Admins can read all profiles"');
    expect(schemaSql).toContain('on public.user_profiles');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');

    expect(normalizedSchemaSql).not.toMatch(/on public\.user_profiles for select to anon\b/);
  });

  it('revoca permisos amplios y solo permite editar campos seguros', () => {
    const grants = getUserProfilesGrantStatements();

    expect(schemaSql).toContain('revoke all on table public.user_profiles from anon;');
    expect(schemaSql).toContain('revoke all on table public.user_profiles from authenticated;');
    expect(grants).toEqual([
      'grant select on table public.user_profiles to authenticated;',
      'grant insert (id, display_name, avatar_url) on public.user_profiles to authenticated;',
      'grant update (display_name, avatar_url) on public.user_profiles to authenticated;',
    ]);
  });

  it('no concede permisos directos peligrosos sobre user_profiles', () => {
    expect(normalizedSchemaSql).not.toMatch(/grant\s+[^;]*\bon\s+(?:table\s+)?public\.user_profiles\s+to\s+anon\b/);
    expect(normalizedSchemaSql).not.toContain('grant update (role) on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant insert (role) on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant update (id) on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant insert (id, display_name, avatar_url, role) on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant update (display_name, avatar_url, role) on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant select, insert on public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant all on table public.user_profiles to authenticated;');
    expect(normalizedSchemaSql).not.toContain('grant all on table public.user_profiles to anon;');
  });
});

describe('Supabase model_requests schema', () => {
  it('crea tabla de solicitudes con user_id nullable y checks de estado/origen', () => {
    expect(schemaSql).toContain('create table if not exists public.model_requests');
    expect(schemaSql).toContain('user_id uuid null references auth.users(id) on delete set null');
    expect(schemaSql).toContain('brand text not null check (length(trim(brand)) > 0)');
    expect(schemaSql).toContain('model text not null check (length(trim(model)) > 0)');
    expect(schemaSql).toContain('year integer not null check (year between 1900 and 2100)');
    expect(schemaSql).toContain('official_url text null');
    expect(schemaSql).toContain('add column if not exists official_url text null');
    expect(schemaSql).toContain('add column if not exists user_name text');
    expect(schemaSql).toContain("status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'rejected'))");
    expect(schemaSql).toContain("source text not null default 'user' check (source in ('user', 'admin', 'import'))");
  });

  it('añade columna user_name nullable con constraint de no vacío si no null', () => {
    expect(schemaSql).toContain('add column if not exists user_name text');
    expect(schemaSql).toContain('drop constraint if exists model_requests_user_name_check');
    expect(schemaSql).toContain('add constraint model_requests_user_name_check');
    expect(schemaSql).toContain('check (user_name is null or length(trim(user_name)) > 0)');
  });

  it('crea índices y trigger updated_at para model_requests', () => {
    expect(schemaSql).toContain('create index if not exists model_requests_user_id_idx on public.model_requests (user_id);');
    expect(schemaSql).toContain('create index if not exists model_requests_status_idx on public.model_requests (status);');
    expect(schemaSql).toContain('create index if not exists model_requests_created_at_idx on public.model_requests (created_at);');
    expect(schemaSql).toContain('create index if not exists model_requests_brand_model_year_idx on public.model_requests (brand, model, year);');
    expect(schemaSql).toContain('drop trigger if exists set_model_requests_updated_at on public.model_requests;');
    expect(schemaSql).toContain('create trigger set_model_requests_updated_at');
    expect(schemaSql).toContain('execute function public.set_updated_at();');
  });

  it('activa RLS y permite inserts anónimos estrictos', () => {
    expect(schemaSql).toContain('alter table public.model_requests enable row level security;');
    expect(schemaSql).toContain('create policy "Anonymous model requests can be created"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to anon');
    expect(schemaSql).toContain('user_id is null');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain("source = 'user'");
    expect(schemaSql).toContain('length(trim(brand)) > 0');
    expect(schemaSql).toContain('length(trim(model)) > 0');
    expect(schemaSql).toContain('year between 1900 and 2100');
  });

  it('permite inserts autenticados solo para auth.uid y lectura propia', () => {
    expect(schemaSql).toContain('create policy "Authenticated model requests can be created"');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('user_id = auth.uid()');
    expect(schemaSql).toContain('create policy "Users can read own model requests"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
  });

  it('no abre SELECT público total ni update/delete para model_requests', () => {
    const grants = getModelRequestsGrantStatements();

    expect(normalizedSchemaSql).not.toMatch(/on public\.model_requests for select to anon\b[^;]*using \(true\)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.model_requests\s+to\s+(?:anon|authenticated)/);
    expect(schemaSql).toContain('revoke all on table public.model_requests from anon;');
    expect(schemaSql).toContain('revoke all on table public.model_requests from authenticated;');
    expect(grants).toEqual([
      'grant insert on public.model_requests to anon, authenticated;',
      'grant select on public.model_requests to authenticated;',
      'grant update (status) on public.model_requests to authenticated;',
    ]);
  });

  it('añade policy admin select para model_requests usando public.is_admin()', () => {
    expect(schemaSql).toContain('create policy "Admins can read all model requests"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('using (public.is_admin())');
  });

  it('añade policy admin update para model_requests protegida por is_admin y status', () => {
    expect(schemaSql).toContain('create policy "Admins can update model request status"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toMatch(/with check \([\s\S]*?public\.is_admin\(\)[\s\S]*?and status in \('pending', 'reviewed', 'approved', 'rejected'\)[\s\S]*?\);/);
    const updateMatch = schemaSql.match(/grant\s+update\s+\(status\)\s+on\s+public\.model_requests\s+to\s+authenticated/i);
    expect(updateMatch).toBeTruthy();
    expect(schemaSql).not.toMatch(/grant\s+update\s+on\s+public\.model_requests\s+(?!\()/);
  });

  it('no permite delete ni update amplio para model_requests desde cliente', () => {
    expect(normalizedSchemaSql).not.toMatch(/create\s+policy[^;]+for\s+delete\s+on\s+public\.model_requests/i);
    const fullUpdateOnModel = normalizedSchemaSql.match(/grant\s+update\s+on\s+public\.model_requests\s+to\s+(?:anon|authenticated)/gi);
    expect(fullUpdateOnModel).toBeNull();
  });
});

describe('Supabase review_replies schema', () => {
  it('crea tabla de respuestas con claves, checks e índices esperados', () => {
    expect(schemaSql).toContain('create table if not exists public.review_replies');
    expect(schemaSql).toContain('id uuid primary key default gen_random_uuid()');
    expect(schemaSql).toContain('review_id uuid not null references public.motorcycle_reviews(id) on delete cascade');
    expect(schemaSql).toContain('user_id uuid not null references auth.users(id) on delete cascade');
    expect(schemaSql).toContain('comment text not null');
    expect(schemaSql).toContain('user_name text not null');
    expect(schemaSql).toContain("status text not null default 'pending'");
    expect(schemaSql).toContain('created_at timestamptz not null default now()');
    expect(schemaSql).toContain('updated_at timestamptz not null default now()');

    expect(schemaSql).toContain('drop constraint if exists review_replies_status_check');
    expect(schemaSql).toContain('add constraint review_replies_status_check');
    expect(schemaSql).toContain("check (status in ('pending', 'approved', 'hidden', 'rejected'))");

    expect(schemaSql).toMatch(/create index if not exists review_replies_review_id_idx\s+on public\.review_replies \(review_id\);/);
    expect(schemaSql).toMatch(/create index if not exists review_replies_user_id_idx\s+on public\.review_replies \(user_id\);/);
    expect(schemaSql).toMatch(/create index if not exists review_replies_status_idx\s+on public\.review_replies \(status\);/);

    expect(schemaSql).toContain('drop constraint if exists review_replies_comment_check');
    expect(schemaSql).toContain('add constraint review_replies_comment_check');
    expect(schemaSql).toContain('check (length(trim(comment)) > 0)');

    expect(schemaSql).toContain('drop constraint if exists review_replies_user_name_check');
    expect(schemaSql).toContain('add constraint review_replies_user_name_check');
    expect(schemaSql).toContain('check (length(trim(user_name)) > 0)');

    expect(schemaSql).toContain('alter column user_name drop default');
  });

  it('incluye trigger updated_at para review_replies', () => {
    expect(schemaSql).toContain('drop trigger if exists set_review_replies_updated_at on public.review_replies;');
    expect(schemaSql).toContain('create trigger set_review_replies_updated_at');
    expect(schemaSql).toContain('before update on public.review_replies');
    expect(schemaSql).toContain('execute function public.set_updated_at();');
  });

  it('activa RLS, permite leer respuestas approved públicamente y propias con sesión', () => {
    expect(schemaSql).toContain('alter table public.review_replies enable row level security;');
    expect(schemaSql).toContain('drop policy if exists "Approved review replies are readable" on public.review_replies;');
    expect(schemaSql).toContain('create policy "Approved review replies are readable"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain("using (status = 'approved')");
    expect(normalizedSchemaSql).not.toMatch(/on public\.review_replies for select to anon, authenticated\b[^;]*using \(true\)/);

    expect(schemaSql).toContain('drop policy if exists "Users can read own review replies" on public.review_replies;');
    expect(schemaSql).toContain('create policy "Users can read own review replies"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (user_id = auth.uid())');
  });

  it('solo permite insertar respuestas propias pending con user_name, valida review no propia y existe', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can create own review reply" on public.review_replies;');
    expect(schemaSql).toContain('drop policy if exists "Authenticated users can create review reply" on public.review_replies;');
    expect(schemaSql).toContain('create policy "Users can create own review reply"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('user_id = auth.uid()');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain('review_id is not null');
    expect(schemaSql).toContain('length(trim(comment)) > 0');
    expect(schemaSql).toContain('length(trim(user_name)) > 0');
    expect(schemaSql).toContain('exists (');
    expect(schemaSql).toContain('from public.motorcycle_reviews');
    expect(schemaSql).toContain('motorcycle_reviews.id = review_replies.review_id');
    expect(schemaSql).toContain('motorcycle_reviews.user_id is null');
    expect(schemaSql).toContain('motorcycle_reviews.user_id <> auth.uid()');
  });

  it('usa grants mínimos sin update/delete para usuarios normales', () => {
    const grants = getReviewRepliesGrantStatements();

    expect(schemaSql).toContain('revoke all on table public.review_replies from anon;');
    expect(schemaSql).toContain('revoke all on table public.review_replies from authenticated;');
    expect(grants).toEqual([
      'grant select on public.review_replies to anon, authenticated;',
      'grant insert (review_id, user_id, user_name, comment) on public.review_replies to authenticated;',
      'grant update (status) on public.review_replies to authenticated;',
    ]);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.review_replies\s+to\s+(anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.review_replies\s+to\s+anon/);
    expect(normalizedSchemaSql).not.toContain('grant update (comment) on public.review_replies to authenticated;');
  });

  it('incluye policies admin para leer y actualizar status de respuestas', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can read all review replies" on public.review_replies;');
    expect(schemaSql).toContain('create policy "Admins can read all review replies"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can update review reply status" on public.review_replies;');
    expect(schemaSql).toContain('create policy "Admins can update review reply status"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain("status in ('pending', 'approved', 'hidden', 'rejected')");
  });
});

describe('Supabase motorcycle_review_aspects schema', () => {
  it('crea tabla de aspectos con campos, constraints e índices esperados', () => {
    expect(schemaSql).toContain('create table if not exists public.motorcycle_review_aspects');
    expect(schemaSql).toContain('id uuid primary key default gen_random_uuid()');
    expect(schemaSql).toContain('review_id uuid not null references public.motorcycle_reviews(id) on delete cascade');
    expect(schemaSql).toContain('category text not null');
    expect(schemaSql).toContain('sentiment text not null');
    expect(schemaSql).toContain('comment text');
    expect(schemaSql).toContain('created_at timestamptz not null default now()');
    expect(schemaSql).toContain('updated_at timestamptz not null default now()');

    expect(schemaSql).toContain('drop constraint if exists motorcycle_review_aspects_category_check');
    expect(schemaSql).toContain('add constraint motorcycle_review_aspects_category_check');
    expect(schemaSql).toContain("check (category in ('engine', 'ergonomics', 'consumption', 'braking', 'suspension', 'electronics', 'aerodynamics', 'passenger', 'maintenance', 'price', 'weight', 'design'))");

    expect(schemaSql).toContain('drop constraint if exists motorcycle_review_aspects_sentiment_check');
    expect(schemaSql).toContain('add constraint motorcycle_review_aspects_sentiment_check');
    expect(schemaSql).toContain("check (sentiment in ('positive', 'negative'))");

    expect(schemaSql).toContain('drop constraint if exists motorcycle_review_aspects_comment_check');
    expect(schemaSql).toContain('add constraint motorcycle_review_aspects_comment_check');
    expect(schemaSql).toContain('check (comment is null or length(trim(comment)) > 0)');

    expect(schemaSql).toMatch(/if not exists\s*\(\s*select 1\s+from pg_constraint\s+where conname = 'motorcycle_review_aspects_review_id_category_key'/);
    expect(schemaSql).toContain('unique (review_id, category)');
  });

  it('crea índices para review_id, category y sentiment', () => {
    expect(schemaSql).toMatch(/create index if not exists motorcycle_review_aspects_review_id_idx\s+on public\.motorcycle_review_aspects \(review_id\);/);
    expect(schemaSql).toMatch(/create index if not exists motorcycle_review_aspects_category_idx\s+on public\.motorcycle_review_aspects \(category\);/);
    expect(schemaSql).toMatch(/create index if not exists motorcycle_review_aspects_sentiment_idx\s+on public\.motorcycle_review_aspects \(sentiment\);/);
  });

  it('incluye trigger updated_at para aspectos', () => {
    expect(schemaSql).toContain('drop trigger if exists set_motorcycle_review_aspects_updated_at on public.motorcycle_review_aspects;');
    expect(schemaSql).toContain('create trigger set_motorcycle_review_aspects_updated_at');
    expect(schemaSql).toContain('before update on public.motorcycle_review_aspects');
    expect(schemaSql).toContain('execute function public.set_updated_at();');
  });

  it('activa RLS para aspectos de reviews', () => {
    expect(schemaSql).toContain('alter table public.motorcycle_review_aspects enable row level security;');
  });

  it('permite SELECT público solo para aspectos de reviews approved', () => {
    expect(schemaSql).toContain('drop policy if exists "Approved motorcycle review aspects are readable" on public.motorcycle_review_aspects;');
    expect(schemaSql).toContain('create policy "Approved motorcycle review aspects are readable"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain('using (');
    expect(schemaSql).toContain('exists (');
    expect(schemaSql).toContain('motorcycle_reviews.id = motorcycle_review_aspects.review_id');
    expect(schemaSql).toContain("motorcycle_reviews.status = 'approved'");
    expect(normalizedSchemaSql).not.toMatch(/on public\.motorcycle_review_aspects for select to anon, authenticated\b[^;]*using \(true\)/);
  });

  it('permite SELECT propio al autor de la review autenticado', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can read own review aspects" on public.motorcycle_review_aspects;');
    expect(schemaSql).toContain('create policy "Users can read own review aspects"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (');
    expect(schemaSql).toContain('exists (');
    expect(schemaSql).toContain('motorcycle_reviews.id = motorcycle_review_aspects.review_id');
    expect(schemaSql).toContain('motorcycle_reviews.user_id = auth.uid()');
  });

  it('permite INSERT de aspectos solo al autor de la review autenticado', () => {
    expect(schemaSql).toContain('drop policy if exists "Users can insert own review aspects" on public.motorcycle_review_aspects;');
    expect(schemaSql).toContain('create policy "Users can insert own review aspects"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('with check (');
    expect(schemaSql).toContain('exists (');
    expect(schemaSql).toContain('motorcycle_reviews.id = motorcycle_review_aspects.review_id');
    expect(schemaSql).toContain('motorcycle_reviews.user_id = auth.uid()');
  });

  it('usa grants mínimos sin delete/update amplios para aspectos', () => {
    const grants = getReviewAspectsGrantStatements();

    expect(schemaSql).toContain('revoke all on table public.motorcycle_review_aspects from anon;');
    expect(schemaSql).toContain('revoke all on table public.motorcycle_review_aspects from authenticated;');
    expect(grants).toEqual([
      'grant select on public.motorcycle_review_aspects to anon, authenticated;',
      'grant insert (review_id, category, sentiment, comment) on public.motorcycle_review_aspects to authenticated;',
    ]);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.motorcycle_review_aspects\s+to\s+(?:anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.motorcycle_review_aspects\s+to\s+(?:anon|authenticated)/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+insert\s+on\s+(?:table\s+)?public\.motorcycle_review_aspects\s+to\s+anon/);
  });

  it('incluye policy admin SELECT para aspectos usando is_admin()', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can read all motorcycle review aspects" on public.motorcycle_review_aspects;');
    expect(schemaSql).toContain('create policy "Admins can read all motorcycle review aspects"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (public.is_admin())');
  });
});

describe('Supabase create_motorcycle_review_with_aspects RPC function', () => {
  it('crea la función RPC con signature correcta', () => {
    expect(schemaSql).toContain('create or replace function public.create_motorcycle_review_with_aspects(');
    expect(schemaSql).toContain('p_motorcycle_id text');
    expect(schemaSql).toContain('p_user_name text');
    expect(schemaSql).toContain('p_rating integer');
    expect(schemaSql).toContain('p_riding_style text');
    expect(schemaSql).toContain('p_ownership_months integer');
    expect(schemaSql).toContain('p_kilometers integer');
    expect(schemaSql).toContain('p_comment text');
    expect(schemaSql).toContain('p_pros text[]');
    expect(schemaSql).toContain('p_cons text[]');
    expect(schemaSql).toContain('p_aspects jsonb');
  });

  it('retorna motorcycle_reviews y usa security definer con search_path public', () => {
    expect(schemaSql).toContain('returns public.motorcycle_reviews');
    expect(schemaSql).toContain('language plpgsql');
    expect(schemaSql).toContain('security definer');
    expect(schemaSql).toContain('set search_path = public');
  });

  it('usa auth.uid() para user_id, rechaza user_id arbitrario y requiere autenticación', () => {
    expect(schemaSql).toContain('v_user_id := auth.uid()');
    expect(schemaSql).not.toMatch(/insert into public\.motorcycle_reviews[\s\S]*user_id\s*=\s*p_user_id/);
    expect(schemaSql).toContain("raise exception 'Authentication required.'");
  });

  it('deriva user_name desde user_profiles.display_name del auth.uid()', () => {
    expect(schemaSql).toMatch(/select\s+display_name\s+into\s+v_profile_display_name\s+from\s+public\.user_profiles\s+where\s+id\s*=\s*v_user_id;/);
    expect(schemaSql).toMatch(/v_review_user_name\s*:=\s*coalesce\(\s*nullif\(trim\(v_profile_display_name\),\s*''\),\s*'Usuario MotoAtlas'\s*\)/);
  });

  it('no confía en p_user_name como identidad visible final', () => {
    expect(schemaSql).toContain('p_user_name text');
    expect(schemaSql).not.toContain("raise exception 'user_name es obligatorio.'");
    expect(schemaSql).not.toMatch(/insert into public\.motorcycle_reviews[\s\S]*trim\(p_user_name\)/);
    expect(schemaSql).toMatch(/insert\s+into\s+public\.motorcycle_reviews[\s\S]*user_name[\s\S]*values\s*\([\s\S]*v_review_user_name,/);
  });

  it('valida motorcycle_id obligatorio y que existe', () => {
    expect(schemaSql).toContain("raise exception 'motorcycle_id es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'Motocicleta no encontrada.'");
  });

  it('valida rating entre 1 y 5', () => {
    expect(schemaSql).toContain('raise exception \'rating debe ser un entero entre 1 y 5.\'');
  });

  it('valida riding_style con valores permitidos', () => {
    expect(schemaSql).toContain("raise exception 'riding_style es obligatorio y debe ser uno de: ciudad, viaje, offroad, deportivo, pasajero, diario.'");
  });

  it('valida comment no vacío', () => {
    expect(schemaSql).toContain("raise exception 'comment es obligatorio.'");
  });

  it('valida aspects: sentiment solo positive o negative', () => {
    expect(schemaSql).toContain("raise exception 'Sentimiento inválido: %.', v_aspect->>'sentiment'");
    expect(schemaSql).toMatch(/v_aspect->>'sentiment'\s+not\s+in\s*\('positive',\s*'negative'\)/);
  });

  it('valida aspects: category dentro de las 12 categorías permitidas', () => {
    expect(schemaSql).toContain("raise exception 'Categoría inválida: %.', v_aspect->>'category'");
    expect(schemaSql).toMatch(/v_aspect->>'category'\s+not\s+in\s*\('engine',\s*'ergonomics',\s*'consumption',\s*'braking',\s*'suspension',\s*'electronics',\s*'aerodynamics',\s*'passenger',\s*'maintenance',\s*'price',\s*'weight',\s*'design'\)/);
  });

  it('valida comment de aspect no puede ser solo espacios', () => {
    expect(schemaSql).toContain("raise exception 'El comentario del aspecto no puede ser solo espacios.'");
  });

  it('inserta aspectos con el review_id recién creado y devuelve una única review', () => {
    expect(schemaSql).toMatch(/insert into public\.motorcycle_review_aspects\s*\(\s*review_id,\s*category,\s*sentiment,\s*comment\s*\)\s*values\s*\(\s*v_review_id/);
    expect(schemaSql).toContain('returning id into v_review_id');
    expect(schemaSql).toMatch(/select\s+\*\s+into\s+v_review\s+from\s+public\.motorcycle_reviews\s+where\s+id\s*=\s*v_review_id/);
    expect(schemaSql).toContain('return v_review');
    expect(schemaSql).not.toMatch(/return query select/);
  });

  it('concede execute solo a authenticated con revokes explícitos previos', () => {
    expect(schemaSql).toContain('revoke execute on function public.create_motorcycle_review_with_aspects(');
    expect(schemaSql).toMatch(/revoke execute on function public\.create_motorcycle_review_with_aspects\([^)]+\) from public;/);
    expect(schemaSql).toMatch(/revoke execute on function public\.create_motorcycle_review_with_aspects\([^)]+\) from anon;/);
    expect(schemaSql).toContain('grant execute on function public.create_motorcycle_review_with_aspects(');
    expect(schemaSql).toMatch(/grant execute on function public\.create_motorcycle_review_with_aspects\([^)]+\) to authenticated;/);
    expect(schemaSql).not.toMatch(/grant execute on function public\.create_motorcycle_review_with_aspects\([^)]+\) to anon;/);
  });

  it('inserta review con status pending y source user', () => {
    expect(schemaSql).toMatch(/'user',\s*false,\s*'pending'/);
  });
});

describe('Supabase create_admin_motorcycle RPC function', () => {
  it('crea la función RPC con signature correcta y retorno motorcycles', () => {
    expect(schemaSql).toContain('create or replace function public.create_admin_motorcycle(');
    expect(schemaSql).toContain('p_id text');
    expect(schemaSql).toContain('p_brand text');
    expect(schemaSql).toContain('p_model text');
    expect(schemaSql).toContain('p_year integer');
    expect(schemaSql).toContain('p_description text');
    expect(schemaSql).toContain('p_segment motorcycle_segment');
    expect(schemaSql).toContain('p_license motorcycle_license');
    expect(schemaSql).toContain('p_engine_type motorcycle_engine_type');
    expect(schemaSql).toContain('p_displacement_cc integer');
    expect(schemaSql).toContain('p_power_hp numeric');
    expect(schemaSql).toContain('p_torque_nm numeric');
    expect(schemaSql).toContain('p_wet_weight_kg numeric');
    expect(schemaSql).toContain('p_seat_height_mm integer');
    expect(schemaSql).toContain('p_fuel_tank_liters numeric');
    expect(schemaSql).toContain('p_price_eur integer');
    expect(schemaSql).toContain('p_image_url text');
    expect(schemaSql).toContain('p_description_locked boolean default false');
    expect(schemaSql).toContain('p_image_locked boolean default false');
    expect(schemaSql).toContain('p_price_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_image_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_specs_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_scores_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_pros_cons_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_reliability_source motorcycle_data_source default');
    expect(schemaSql).toContain('p_abs_cornering boolean default false');
    expect(schemaSql).toContain('p_traction_control boolean default false');
    expect(schemaSql).toContain('p_riding_modes boolean default false');
    expect(schemaSql).toContain('p_cruise_control boolean default false');
    expect(schemaSql).toContain('p_quickshifter boolean default false');
    expect(schemaSql).toContain('p_heated_grips boolean default false');
    expect(schemaSql).toContain('p_tubeless_wheels boolean default false');
    expect(schemaSql).toContain('p_is_a2_compatible boolean default false');
    expect(schemaSql).toContain('p_is_a2_limited_version boolean default false');
    expect(schemaSql).toContain('p_limited_power_hp numeric default null');
    expect(schemaSql).toContain('p_original_power_hp numeric default null');
  });

  it('retorna motorcycles y usa security definer con search_path public', () => {
    expect(schemaSql).toContain('returns public.motorcycles');
    expect(schemaSql).toContain('language plpgsql');
    expect(schemaSql).toContain('security definer');
    expect(schemaSql).toContain('set search_path = public');
  });

  it('valida que el caller sea admin mediante public.is_admin()', () => {
    expect(schemaSql).toContain('if not public.is_admin() then');
    expect(schemaSql).toContain("raise exception 'Only admins can create motorcycles.'");
  });

  it('valida campos obligatorios no vacíos', () => {
    expect(schemaSql).toContain("raise exception 'id es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'brand es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'model es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'description es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'image_url es obligatorio.'");
    expect(schemaSql).toContain("raise exception 'id no puede contener espacios.'");
  });

  it('inserta en public.motorcycles con returning *', () => {
    expect(schemaSql).toMatch(/insert into public\.motorcycles\s*\(/);
    expect(schemaSql).toContain('returning * into v_motorcycle');
    expect(schemaSql).toContain('return v_motorcycle');
    expect(schemaSql).not.toMatch(/return query select/);
  });

  it('revoca execute de public y anon, concede solo a authenticated', () => {
    expect(schemaSql).toContain('revoke execute on function public.create_admin_motorcycle(');
    expect(schemaSql).toMatch(/revoke execute on function public\.create_admin_motorcycle\([^)]+\) from public;/);
    expect(schemaSql).toMatch(/revoke execute on function public\.create_admin_motorcycle\([^)]+\) from anon;/);
    expect(schemaSql).toContain('grant execute on function public.create_admin_motorcycle(');
    expect(schemaSql).toMatch(/grant execute on function public\.create_admin_motorcycle\([^)]+\) to authenticated;/);
    expect(schemaSql).not.toMatch(/grant execute on function public\.create_admin_motorcycle\([^)]+\) to anon;/);
  });

  it('no expone INSERT grants directos en public.motorcycles a anon ni authenticated', () => {
    expect(normalizedSchemaSql).not.toMatch(/grant\s+insert\s+on\s+(?:table\s+)?public\.motorcycles\s+to\s+(anon|authenticated)/);
  });

  it('no agrega INSERT RLS policy en public.motorcycles', () => {
    expect(normalizedSchemaSql).not.toMatch(/create\s+policy[^;]+on\s+public\.motorcycles[^;]+\bfor\s+insert\b/);
  });
});

describe('Supabase motorcycle_images gallery schema', () => {
  it('crea la tabla public.motorcycle_images con columnas esperadas', () => {
    expect(schemaSql).toContain('create table if not exists public.motorcycle_images');
    expect(schemaSql).toContain('id uuid primary key default gen_random_uuid()');
    expect(schemaSql).toContain('motorcycle_id text not null references public.motorcycles(id) on delete cascade');
    expect(schemaSql).toContain('url text not null check (length(trim(url)) > 0)');
    expect(schemaSql).toContain('storage_path text null check (');
    expect(schemaSql).toContain('alt_text text');
    expect(schemaSql).toContain('is_primary boolean not null default false');
    expect(schemaSql).toContain('sort_order integer not null default 0 check (sort_order >= 0)');
    expect(schemaSql).toContain("source public.motorcycle_data_source not null default 'manual'");
    expect(schemaSql).toContain('created_by uuid null references auth.users(id) on delete set null');
    expect(schemaSql).toContain('created_at timestamptz not null default now()');
    expect(schemaSql).toContain('updated_at timestamptz not null default now()');
  });

  it('mantiene storage_path nullable pero con constraint segura', () => {
    expect(schemaSql).toContain('storage_path text null check (');
    expect(schemaSql).toContain('storage_path is null');
    expect(schemaSql).toContain('length(trim(storage_path)) > 0');
    expect(schemaSql).toContain('storage_path = trim(storage_path)');
    expect(schemaSql).toContain("position('..' in storage_path) = 0");
  });

  it('mantiene created_by nullable para backfills o datos históricos futuros', () => {
    expect(schemaSql).toContain('created_by uuid null references auth.users(id) on delete set null');
  });

  it('usa motorcycle_data_source y referencia motorcycles con cascade delete', () => {
    expect(schemaSql).toContain("source public.motorcycle_data_source not null default 'manual'");
    expect(schemaSql).toContain('motorcycle_id text not null references public.motorcycles(id) on delete cascade');
  });

  it('crea índices y unique partial index para la primaria por moto', () => {
    expect(schemaSql).toContain('create index if not exists motorcycle_images_motorcycle_id_idx on public.motorcycle_images (motorcycle_id);');
    expect(schemaSql).toContain('create index if not exists motorcycle_images_motorcycle_id_sort_order_idx on public.motorcycle_images (motorcycle_id, sort_order);');
    expect(schemaSql).toContain('create unique index if not exists motorcycle_images_one_primary_per_motorcycle');
    expect(schemaSql).toContain('on public.motorcycle_images (motorcycle_id)');
    expect(schemaSql).toContain('where is_primary = true;');
  });

  it('incluye trigger updated_at reutilizando public.set_updated_at()', () => {
    expect(schemaSql).toContain('drop trigger if exists set_motorcycle_images_updated_at on public.motorcycle_images;');
    expect(schemaSql).toContain('create trigger set_motorcycle_images_updated_at');
    expect(schemaSql).toContain('before update on public.motorcycle_images');
    expect(schemaSql).toContain('execute function public.set_updated_at();');
  });

  it('activa RLS y no usa using (true) para lectura pública', () => {
    expect(schemaSql).toContain('alter table public.motorcycle_images enable row level security;');
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle images are readable" on public.motorcycle_images;');
    expect(schemaSql).toContain('create policy "Public motorcycle images are readable"');
    expect(schemaSql).toContain('on public.motorcycle_images');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain('from public.motorcycles m');
    expect(schemaSql).toContain('where m.id = motorcycle_images.motorcycle_id');
    expect(normalizedSchemaSql).not.toMatch(/on public\.motorcycle_images for select to anon, authenticated\b[^;]*using \(true\)/);
  });

  it('usa policies admin con public.is_admin() para select/insert/update/delete', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can read all motorcycle images" on public.motorcycle_images;');
    expect(schemaSql).toContain('create policy "Admins can read all motorcycle images"');
    expect(schemaSql).toContain('using (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can insert motorcycle images" on public.motorcycle_images;');
    expect(schemaSql).toContain('create policy "Admins can insert motorcycle images"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('with check (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can update motorcycle images" on public.motorcycle_images;');
    expect(schemaSql).toContain('create policy "Admins can update motorcycle images"');
    expect(schemaSql).toContain('for update');
    expect(schemaSql).toContain('using (public.is_admin())');
    expect(schemaSql).toContain('with check (public.is_admin())');

    expect(schemaSql).toContain('drop policy if exists "Admins can delete motorcycle images" on public.motorcycle_images;');
    expect(schemaSql).toContain('create policy "Admins can delete motorcycle images"');
    expect(schemaSql).toContain('for delete');
  });

  it('aplica grants mínimos y no bypassa RLS para escritura no admin', () => {
    const grants = getMotorcycleImagesGrantStatements();

    expect(schemaSql).toContain('revoke all on table public.motorcycle_images from anon;');
    expect(schemaSql).toContain('revoke all on table public.motorcycle_images from authenticated;');
    expect(grants).toEqual([
      'grant select on public.motorcycle_images to anon, authenticated;',
      'grant insert (motorcycle_id, url, storage_path, alt_text, is_primary, sort_order, source, created_by) on public.motorcycle_images to authenticated;',
      'grant update (motorcycle_id, url, storage_path, alt_text, is_primary, sort_order, source) on public.motorcycle_images to authenticated;',
      'grant delete on public.motorcycle_images to authenticated;',
    ]);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+insert\s+on\s+(?:table\s+)?public\.motorcycle_images\s+to\s+anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/grant\s+update\s+on\s+(?:table\s+)?public\.motorcycle_images\s+to\s+anon\b/);
  });

  it('mantiene intacto el contrato single-image de motorcycles', () => {
    expect(schemaSql).toContain('image_url text not null');
    expect(schemaSql).toContain('image_locked boolean not null default false');
    expect(schemaSql).toContain("image_source motorcycle_data_source not null default 'manual'");
  });
});

describe('Supabase motorcycle image storage', () => {
  it('define el bucket motorcycle-images como público con límite de 5 MB y tipos MIME permitidos', () => {
    expect(schemaSql).toContain("insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)");
    expect(schemaSql).toContain("'motorcycle-images'");
    expect(schemaSql).toContain("true");
    expect(schemaSql).toContain("5242880");
    expect(schemaSql).toContain("array['image/jpeg', 'image/png', 'image/webp']");
    expect(schemaSql).toContain("on conflict (id) do nothing");
  });

  it('permite SELECT público en storage.objects para motorcycle-images', () => {
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle images are readable" on storage.objects;');
    expect(schemaSql).toContain('create policy "Public motorcycle images are readable"');
    expect(schemaSql).toContain('on storage.objects for select');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain("using (bucket_id = 'motorcycle-images')");
  });

  it('restringe INSERT en storage.objects a admins autenticados via public.is_admin()', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can upload motorcycle images" on storage.objects;');
    expect(schemaSql).toContain('create policy "Admins can upload motorcycle images"');
    expect(schemaSql).toContain('on storage.objects for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('public.is_admin()');
    expect(schemaSql).toContain("bucket_id = 'motorcycle-images'");
  });

  it('restringe UPDATE en storage.objects a admins autenticados via public.is_admin()', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can update motorcycle images" on storage.objects;');
    expect(schemaSql).toContain('create policy "Admins can update motorcycle images"');
    expect(schemaSql).toContain('on storage.objects for update');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('public.is_admin()');
    expect(schemaSql).toContain("bucket_id = 'motorcycle-images'");
  });

  it('restringe DELETE en storage.objects a admins autenticados via public.is_admin()', () => {
    expect(schemaSql).toContain('drop policy if exists "Admins can delete motorcycle images" on storage.objects;');
    expect(schemaSql).toContain('create policy "Admins can delete motorcycle images"');
    expect(schemaSql).toContain('on storage.objects for delete');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('public.is_admin()');
    expect(schemaSql).toContain("bucket_id = 'motorcycle-images'");
  });

  it('no expone INSERT/UPDATE/DELETE en storage.objects a anon ni authenticated sin admin', () => {
    // No policy grants write to anon
    expect(normalizedSchemaSql).not.toMatch(/on storage\.objects for insert to anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/on storage\.objects for update to anon\b/);
    expect(normalizedSchemaSql).not.toMatch(/on storage\.objects for delete to anon\b/);
    // No policy grants write to all authenticated without admin guard
    const insertAuthPolicies = normalizedSchemaSql.match(/on storage\.objects for insert to authenticated[^;]*with check[^;]*bucket_id\s*=\s*'motorcycle-images'[^;]*public\.is_admin\(\)/g);
    expect(insertAuthPolicies).not.toBeNull();
    expect(insertAuthPolicies?.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Supabase schema reload', () => {
  it('recarga PostgREST después de aplicar políticas', () => {
    expect(schemaSql).toContain("notify pgrst, 'reload schema';");
  });
});
