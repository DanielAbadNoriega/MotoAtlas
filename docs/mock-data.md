# Mock reviews (datos de ejemplo)

Este documento explica cómo generar, importar y eliminar reviews mock usadas para pruebas locales y de UI en MotoAtlas.

## ¿Qué son los mocks?

Las `mock reviews` son reviews de ejemplo generadas localmente y marcadas con `source = 'mock'` en la tabla `motorcycle_reviews` en Supabase. Sirven para probar la UI, sliders, badges, filtros y densidad visual sin depender de usuarios reales.

## Riesgos y advertencias

- No subir las claves `SUPABASE_SERVICE_ROLE_KEY` a repositorios públicos.
- Las reviews mock se distinguen por `source = 'mock'`. Eliminar solo esas filas no afectará reviews reales.

## Variables de entorno necesarias

- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_KEY` — API key (usuario) para importaciones de desarrollo
- `SUPABASE_SERVICE_ROLE_KEY` — **clave de servicio** (necesaria para borrar mocks)

## Comandos

- Generar mocks JSON: `npm run mock:reviews:generate -- --count=120 --reset`
- Importar mocks (dry-run por defecto en `npm run import:mock-reviews`): `npm run mock:reviews:import` (usa `SUPABASE_URL` y `SUPABASE_KEY`)
- Borrar mocks (dry-run): `npm run mock:reviews:clear`
- Borrar mocks (aplicar): `npm run mock:reviews:clear:apply` (REQUIERE `SUPABASE_SERVICE_ROLE_KEY`)

## Cómo funciona

- `scripts/generateMockReviews.ts` genera `data/mock/mockReviews.json` con campo `source: 'mock'` y lógica para evitar duplicados locales.
- `scripts/importMockReviews.ts` prepara el payload (normaliza `riding_style`) y evita duplicados ya presentes en Supabase (busca `source='mock'`).
- `scripts/clearMockReviews.ts` borra únicamente rows con `source = 'mock'` (por defecto dry-run).

## SQL a ejecutar en Supabase

El proyecto incluye `supabase/schema.sql` con la siguiente modificación importante (añade la columna `source`):

```sql
alter table if exists public.motorcycle_reviews
  add column if not exists source text not null default 'user' check (source in ('user', 'mock', 'seed', 'import'));
```

Y la policy pública de inserción exige `source = 'user'` para evitar que clientes anónimos inyecten `mock` directamente.

## Flujo recomendado

1. Generar mocks:

```bash
npm run mock:reviews:generate -- --reset --count=120
```

2. Importar a Supabase (dry-run por defecto; para insertar necesitas `SUPABASE_URL` y `SUPABASE_KEY` en el entorno):

```bash
SUPABASE_URL=https://... SUPABASE_KEY=ey... npm run mock:reviews:import
```

3. Ver en UI: abrir `#/comunidad` para la moto correspondiente.

4. Borrar mocks cuando ya no hagan falta (dry-run primero):

```bash
npm run mock:reviews:clear
# si todo OK:
npm run mock:reviews:clear:apply
```

## Regenerar

Si querés regenerar mocks consistentes:

1. `npm run mock:reviews:generate -- --reset --count=120 --seed=YYYYMMDD`
2. `npm run mock:reviews:import`
