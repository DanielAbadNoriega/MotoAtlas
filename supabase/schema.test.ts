import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemaSql = readFileSync('supabase/schema.sql', 'utf8');

describe('Supabase motorcycle_reviews RLS schema', () => {
  it('contiene una policy de INSERT anon para reviews pending', () => {
    expect(schemaSql).toContain('drop policy if exists "Public motorcycle reviews can be created" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Public motorcycle reviews can be created"');
    expect(schemaSql).toContain('for insert');
    expect(schemaSql).toContain('to anon');
    expect(schemaSql).toContain("status = 'pending'");
    expect(schemaSql).toContain('and verified = false');
  });

  it('contiene una policy de SELECT anon solo para reviews approved', () => {
    expect(schemaSql).toContain('drop policy if exists "Approved motorcycle reviews are readable" on public.motorcycle_reviews;');
    expect(schemaSql).toContain('create policy "Approved motorcycle reviews are readable"');
    expect(schemaSql).toContain('for select');
    expect(schemaSql).toContain('to anon');
    expect(schemaSql).toContain("using (status = 'approved')");
  });

  it('recarga PostgREST después de aplicar políticas', () => {
    expect(schemaSql).toContain("notify pgrst, 'reload schema';");
  });

  it('incluye verified con default false para no marcar reviews públicas sin dato real', () => {
    expect(schemaSql).toContain('verified boolean not null default false');
    expect(schemaSql).toContain('add column if not exists verified boolean not null default false');
  });

  it('permite hidden como estado de moderación no público', () => {
    expect(schemaSql).toContain("status in ('pending', 'approved', 'rejected', 'hidden')");
  });

  it('crea user_profiles con roles user/admin y default user', () => {
    expect(schemaSql).toContain('create table if not exists public.user_profiles');
    expect(schemaSql).toContain("role text not null default 'user' check (role in ('user', 'admin'))");
    expect(schemaSql).toContain('id uuid primary key references auth.users(id) on delete cascade');
  });

  it('crea trigger de perfil al registrar usuario', () => {
    expect(schemaSql).toContain('create or replace function public.handle_new_user_profile()');
    expect(schemaSql).toContain('security definer');
    expect(schemaSql).toContain('create trigger on_auth_user_created_profile');
    expect(schemaSql).toContain("new.raw_user_meta_data ->> 'display_name'");
  });

  it('incluye policies RLS de perfiles y evita update de role por grants de columnas', () => {
    expect(schemaSql).toContain('alter table public.user_profiles enable row level security;');
    expect(schemaSql).toContain('create policy "Users can read own profile"');
    expect(schemaSql).toContain('to authenticated');
    expect(schemaSql).toContain('using (auth.uid() = id)');
    expect(schemaSql).toContain('create policy "Users can update own editable profile"');
    expect(schemaSql).toContain('grant update (display_name, avatar_url) on public.user_profiles to authenticated;');
    expect(schemaSql).not.toContain('grant update (role) on public.user_profiles');
  });

});
