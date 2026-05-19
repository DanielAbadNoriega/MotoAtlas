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

describe('Supabase public motorcycle schema', () => {
  it('permite leer motos públicas también con sesión autenticada', () => {
    expect(schemaSql).toContain('create policy "Public motorcycles are readable"');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.motorcycles to anon, authenticated;');
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

  it('contiene una policy de INSERT anónima estricta para reviews pending sin user_id', () => {
    expect(schemaSql).toContain('drop policy if exists "Public can insert pending motorcycle reviews" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('drop policy if exists "Anonymous motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Anonymous motorcycle reviews can be created"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to anon');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain('motorcycle_id is not null');
    expect(schemaSql).toContain('user_id is null');
    expect(schemaSql).toContain('length(trim(user_name)) > 0');
    expect(schemaSql).toContain('rating between 1 and 5');
    expect(schemaSql).toContain('length(trim(comment)) > 0');
    expect(schemaSql).toContain('verified = false');
    expect(schemaSql).toContain("source = 'user'");
    expect(schemaSql).not.toContain('create policy "Public can insert pending motorcycle reviews"');
  });

  it('contiene una policy de INSERT autenticada estricta con user_id = auth.uid()', () => {
    expect(schemaSql).toContain('drop policy if exists "Authenticated motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Authenticated motorcycle reviews can be created"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain('motorcycle_id is not null');
    expect(schemaSql).toContain('user_id = auth.uid()');
    expect(schemaSql).toContain('length(trim(user_name)) > 0');
    expect(schemaSql).toContain('rating between 1 and 5');
    expect(schemaSql).toContain('length(trim(comment)) > 0');
    expect(schemaSql).toContain('verified = false');
    expect(schemaSql).toContain("source = 'user'");
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

describe('Supabase user_profiles auth schema', () => {
  it('crea tabla de perfiles con role user/admin y default user', () => {
    expect(schemaSql).toContain('create table if not exists public.user_profiles');
    expect(schemaSql).toContain('id uuid primary key references auth.users(id) on delete cascade');
    expect(schemaSql).toContain("role text not null default 'user' check (role in ('user', 'admin'))");
  });

  it('crea perfil automáticamente al registrarse un usuario', () => {
    expect(schemaSql).toContain('create or replace function public.handle_new_user_profile()');
    expect(schemaSql).toContain('security definer');
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
    expect(schemaSql).toContain("status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'rejected'))");
    expect(schemaSql).toContain("source text not null default 'user' check (source in ('user', 'admin', 'import'))");
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
    expect(normalizedSchemaSql).not.toMatch(/grant\s+(update|delete)\s+on\s+(?:table\s+)?public\.model_requests\s+to\s+(anon|authenticated)/);
    expect(schemaSql).toContain('revoke all on table public.model_requests from anon;');
    expect(schemaSql).toContain('revoke all on table public.model_requests from authenticated;');
    expect(grants).toEqual([
      'grant insert on public.model_requests to anon, authenticated;',
      'grant select on public.model_requests to authenticated;',
    ]);
  });
});

describe('Supabase schema reload', () => {
  it('recarga PostgREST después de aplicar políticas', () => {
    expect(schemaSql).toContain("notify pgrst, 'reload schema';");
  });
});
