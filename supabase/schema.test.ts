import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemaSql = readFileSync('supabase/schema.sql', 'utf8');

describe('Supabase public motorcycle schema', () => {
  it('permite leer motos públicas también con sesión autenticada', () => {
    expect(schemaSql).toContain('create policy "Public motorcycles are readable"');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.motorcycles to anon, authenticated;');
  });
});

describe('Supabase motorcycle_reviews RLS schema', () => {
  it('contiene una policy de INSERT pública estricta para reviews pending', () => {
    expect(schemaSql).toContain('drop policy if exists "Public can insert pending motorcycle reviews" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Public motorcycle reviews can be created"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to anon, authenticated');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain('motorcycle_id is not null');
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
    expect(schemaSql).toContain('using (auth.uid() = id)');
    expect(schemaSql).toContain('create policy "Users can insert own profile"');
    expect(schemaSql).toContain("with check (auth.uid() = id and role = 'user')");
    expect(schemaSql).toContain('create policy "Users can update own editable profile"');
  });

  it('revoca permisos amplios y solo permite editar campos seguros', () => {
    expect(schemaSql).toContain('revoke all on table public.user_profiles from anon;');
    expect(schemaSql).toContain('revoke all on table public.user_profiles from authenticated;');
    expect(schemaSql).toContain('grant select on table public.user_profiles to authenticated;');
    expect(schemaSql).toContain('grant insert (id, display_name, avatar_url) on public.user_profiles to authenticated;');
    expect(schemaSql).toContain('grant update (display_name, avatar_url) on public.user_profiles to authenticated;');
    expect(schemaSql).not.toContain('grant update (role) on public.user_profiles to authenticated;');
    expect(schemaSql).not.toContain('grant select, insert on public.user_profiles to authenticated;');
  });
});

describe('Supabase schema reload', () => {
  it('recarga PostgREST después de aplicar políticas', () => {
    expect(schemaSql).toContain("notify pgrst, 'reload schema';");
  });
});
