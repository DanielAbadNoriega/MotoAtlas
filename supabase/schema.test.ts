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
});
