# Mock reviews y datos demo

Este documento explica cómo generar, importar y eliminar reviews mock/seed usadas para pruebas locales y de UI en MotoAtlas.

## Fuentes de datos demo

MotoAtlas distingue tres tipos de datos no reales:

| Source | Origen | Uso |
|--------|--------|-----|
| `source = 'user'` | Datos reales de usuarios | Producción |
| `source = 'seed'` | Datos demo controlados insertados por SQL | Dev/pre con demo activo |
| `source = 'mock'` | Datos generados por scripts/JSON | Dev/pre con demo activo |

El campo `source` está en `motorcycle_reviews.source` y se filtra por entorno vía `reviewSourcePolicy`.

## source policy

`src/shared/reviews/reviewSourcePolicy.ts` define qué sources se ven en cada entorno:

```ts
getAllowedReviewSources({ isProduction: true })           // ['user']
getAllowedReviewSources({ isProduction: false })         // ['user', 'seed', 'mock']
getAllowedReviewSources({ isProduction: false, demoEnabled: false }) // ['user']
```

**Regla:** Producción nunca muestra `seed` ni `mock`, aunque `demoEnabled` sea `true`.

## Seed SQL

El proyecto incluye:

```txt
supabase/seeds/review_aspects_seed.sql
```

- Reviews aprobadas con aspectos técnicos para datos visuales demo.
- UUIDs fijos con `ON CONFLICT` para ser idempotente.
- Verifica que el `motorcycle_id` exista antes de insertar.
- No ejecutar en producción.

## Scripts de mock (legacy)

Antes de tener `reviewSourcePolicy`, los mocks se generaban con scripts. Sigue disponible:

```bash
npm run mock:reviews:generate -- --count=120 --reset
npm run mock:reviews:import
npm run mock:reviews:clear
npm run mock:reviews:clear:apply
```

Estos scripts generan/importan datos con `source = 'mock'`.

## Backlog P2 — mocks más realistas para QA visual

Estado: pendiente / backlog técnico útil.

Objetivo:
Subir la calidad del dataset mock para validar mejor maquetación y estados visuales antes de tener volumen real suficiente.

Ya implementado (verificado):
- `scripts/generateMockReviews.ts` fuerza `source: 'mock'`.
- `scripts/importMockReviews.ts` mantiene `source: 'mock'` en payload.
- `scripts/clearMockReviews.ts` borra solo `source='mock'`.
- existe variación de ratings y estilos de uso base.

Pendiente de mejora:
- enriquecer variedad semántica de comentarios para reducir repetición.
- aumentar casos de estrés visual (comentarios muy largos/cortos, combinaciones de pros/contras más amplias).
- mejorar coherencia segmento/tipo de moto en pros y contras.
- contemplar generación opcional de aspectos técnicos para pruebas visuales avanzadas.

## Riesgos y advertencias

- No subir `SUPABASE_SERVICE_ROLE_KEY` a repositorios públicos.
- Las reviews con `source = 'mock'` se eliminan por ese filtro; no afectan `user` ni `seed`.
- La policy de inserción pública exige `source = 'user'` para evitar inyección directa de mocks desde el cliente.

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
