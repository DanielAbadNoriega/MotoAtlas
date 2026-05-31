# AGENTS.md — MotoAtlas

Lee esto completo. No adivines.

## Quality gate

```bash
npm run typecheck
npm run test
```

No build/commit/push sin orden explícita.

## Lo que NO tocas sin orden explícita

- `supabase/schema.sql` — schema, RLS, policies, grants, auth, roles
- `service_role_key`, admin endpoints
- refactors grandes, renombrados masivos, nuevas dependencias, cambios de arquitectura

Admin protegido con `user_profiles.role = 'admin'`. Helper SQL: `public.is_admin()`. Rutas admin protegidas por sesión + rol.

## Reglas de alcance por defecto

Salvo indicación explícita, ninguna tarea debe tocar zonas no relacionadas con la tarea. En particular:
- schema/RLS/auth
- `review_reactions`, `review_reports`
- lógica admin/moderación/comunidad no solicitada
- servicios, rutas, UI no relacionados
- refactors, renombrados, nuevas dependencias, cambios de arquitectura

Si necesitás tocar una zona prohibida, explicá antes qué archivo, por qué, riesgo y alternativa más segura.

## Architecture essentials

- **Stack**: React 19 + TypeScript 6 + Vite 8 + SCSS (dark-only) + Vitest 4
- **Routing**: custom hash routing (`#/ruta`). NO React Router. `src/shared/routing/routeUtils.ts` + `useAppRoute()` in `App.tsx`.
- **Auth**: Supabase Auth (email/password). `AuthProvider` → `useAuth()`: `user`, `session`, `profile`, `isAdmin`.
- **SCSS**: `@use` imports from `_variables.scss`, `_mixins.scss`, `_placeholders.scss`, `_typography.scss`, `_components.scss`. No `@import`.
- **Icons**: Material Symbols via `<span class="material-symbols-outlined">icon_name</span>`.
- **Data service**: `src/services/motorcycleService.ts` fetches Supabase REST with raw `fetch()` (NOT supabase-js client), maps snake_case→camelCase, falls back to `src/data/bikes.ts`. All services (`motorcycleReviewService`, `reviewReactionService`, etc.) follow the same fetch-to-REST pattern.
- **Supabase client** (`@supabase/supabase-js`) only used for auth operations in `authService.ts`.
- **Env vars**: `VITE_SUPABASE_*` in `.env.local` for client. `SUPABASE_*` in `.env.import` for scripts. Both gitignored.
- **Image resolver**: `src/shared/images/getMotorcycleImage.ts`. Fallback: `public/images/placeholders/motorcycle-technical-pending.jpg`.
- **Entrypoint**: `src/main.tsx` → `<App />` → `useAppRoute()` renders the matching page component.

## Rutas

- **Catálogo**: `#/buscador`, `#/buscador?q=texto`, `#/buscador?compare=id`, `#/buscador?browse=1`
- **Ficha**: `#/motos/:id-o-slug`
- **Comparador**: `#/comparador?bikes=id1,id2,id3`, `#/comparador/:slug-vs-slug?bikes=...`
- **Comunidad**: `#/comunidad`, `#/comunidad/reviews`, `#/comunidad/:id-o-slug`
- **Top**: `#/motos-mejor-valoradas`
- **Cuenta**: `#/cuenta`, `#/cuenta/reviews`, `#/cuenta/reviews/:id`, `#/cuenta/solicitudes`
- **Admin**: `#/admin`, `#/admin/moderacion`, `#/admin/reviews`, `#/admin/reviews/:id`
- **Auth**: `#/login`, `#/registro`
- **Info**: `/metodologia`, `/fuentes-datos`, `/solicitar-modelo`, `/privacidad`, `/terminos`

No construir rutas/comparadores a mano. Usar helpers de `src/shared/routing/routeUtils.ts`.

## Admin

### `#/admin/moderacion`
- Estados reporte: `pending` | `reviewed` | `dismissed` | `action_taken` (UI: `Resuelto`)
- Acciones reporte: Marcar revisado, Descartar, Resuelto
- Acciones review desde reporte: Aprobar, Ocultar, Rechazar
- Modificar la review → reporte pasa a `action_taken`

### `#/admin/reviews`
- Cards resumen por modelo, filtros status/source/verified/orden

### `#/admin/reviews/[motorcycleId]`
- Patrón expandible tipo `AdminReportCard`. Header (usuario/estado/rating/source/verified/fecha), Body (comentario + pros/contras), Footer (Aprobar/Ocultar/Rechazar).
- No crear rows custom si `AdminReportCard` encaja.

## Reviews

- Estados: `pending` → Pendiente, `approved` → Publicada, `rejected` → Rechazada, `hidden` → Oculta
- Pros/contras `null` o vacíos no se renderizan.
- Reviews sin login: `user_id = null`, `source = 'user'`, `status = 'pending'`.
- Reviews autenticadas: vinculadas a `auth.uid()`.
- `riding_style` obligatorio: `ciudad|viaje|offroad|deportivo|pasajero|diario`.

## Reacciones y reportes (público)

- `Útil N`: contador público
- `No útil` / `Reportar`: sin contador público
- Reportar una review → limpia reacciones previas de ese usuario
- Review reportada → no permite nuevas reacciones de ese usuario
- El autor no puede reaccionar ni reportar su propia review

## Testing

```bash
npm run typecheck
npm run test:watch    # durante desarrollo
npm run test:coverage # cobertura
```

- **Framework**: Vitest + React Testing Library + jsdom
- **Setup**: `src/test/setupTests.ts` limpia `localStorage`, restaura mocks, unstubs envs, resetea URL tras cada `afterEach`.
- **Fixtures**: `src/test/fixtures/bikes.ts`, `src/test/fixtures/reviews.ts`
- **Patterns**:
  - Preferir `getByRole`, `getByLabelText`, `getByText`. Evitar aserciones sobre clases CSS.
  - Lógica pura → `src/utils/*.test.ts` o `src/shared/**/*.test.ts`
  - Componentes → RTL + `@testing-library/user-event`
  - Supabase → mockear `fetch` o el servicio. NUNCA conectar a Supabase real.
  - localStorage → `localStorage.setItem()` antes del test; `setupTests` limpia automáticamente.
  - Rutas → `window.location.hash = '#/ruta'`; `setupTests` resetea a `/`.
  - Snapshots grandes → evitarlos; probablemente falta una aserción semántica mejor.

## Patrones UI (reutilizar, no crear nuevos)

- **Filtros**: `account-reviews-page__filter-group` o `admin-page__filter-group`. Header/body/footer, chips, Material Symbols, responsive sheet/drawer, `Limpiar filtros` + `Aplicar filtros`.
- **Paginación**: preferir `AccountPagination`. Material Symbols, `aria-label`, `aria-current="page"`. No crear paginadores nuevos.
- **Review cards**: `.account-page__review-summary-card`, `.admin-page__review-summary-card`.
- **Admin hero**: basado en `motorcycle-community__hero` con `MotorcycleImage`, eyebrow `ADMIN STUDIO`.

## Data commands

### Import pipeline (ordenado)
```bash
npm run fetch:motos                  # API Ninjas → motorcycles.generated.json
npm run merge:motos                  # merge generado → reporte (dry)
npm run merge:motos -- --apply       # aplicar merge a motorcycles.json
npm run import:motos:check           # validar sin conectar Supabase
npm run import:motos                 # upsert a Supabase
npm run import:motos -- --allow-partial  # saltar inválidas
npm run repair:motos                 # reparar specs inválidas en JSON
```

### Imágenes
```bash
npm run normalize:images:check       # dry run
npm run normalize:images             # raw → webp 1600x900
npm run normalize:images -- --overwrite  # regenerar existentes
npm run sync:images:check            # dry run
npm run sync:images                  # actualizar Supabase image_url
```

### Mock reviews
```bash
npm run mock:reviews:generate        # generar JSON
npm run mock:reviews:import          # importar a Supabase
npm run mock:reviews:clear           # dry-run clear
npm run mock:reviews:clear:apply     # borrar realmente
```

### SEO
```bash
npm run seo:sitemap                  # genera sitemap.xml + robots.txt
```

Regla crítica: scripts usan `SUPABASE_SERVICE_ROLE_KEY` de `.env.import`, NUNCA `VITE_SUPABASE_ANON_KEY`.

## Referencias rápidas

- `docs/architecture.md` — arquitectura, routing, data model (620 líneas, lo más completo)
- `docs/testing-strategy.md` — mocking, edge cases, convenciones
- `docs/auth.md` — auth, RLS, admin role
- `docs/admin.md` — admin en detalle
- `docs/ui-notes.md` — páginas y componentes
- `docs/codex-guidelines.md` — reglas mínimas Codex/Copilot
- `docs/agents-runbook.md` — runbook operativo de agentes, skills y modelos
- `docs/motorcycle-data-inventory.md` — inventario de campos Bike
- `docs/motorcycle-import-workflow.md` — flujo importación
- `docs/mock-data.md` — utilidades mock reviews
- `DESIGN.md` — sistema visual, tokens, patrones UI

## Plantilla de prompt corto

```
Lee AGENTS.md.

Tarea:
...
Objetivo:
...
No tocar:
...
Requisitos:
...

Ejecuta:
- npm run typecheck
- npm run test

No hagas build, commit ni push.
```

## Agentes internos

### `MotoAtlas-Page-Auditor`

Auditorías de páginas en modo plan. Debe leer AGENTS.md + DESIGN.md, no modificar archivos, devolver informe P0/P1/P2 con archivos afectados, problema, cambio recomendado y riesgo. Skills preferentes: accessibility, seo, frontend-design, react-best-practices, typescript-advanced-types, vitest. No usar hyperframes/gsap/animejs/lottie/three/typegpu/supabase-postgres-best-practices sin orden explícita.

### `MotoAtlas-Safe-Builder`

Aplica cambios pequeños aprobados. Lee AGENTS.md + DESIGN.md, respeta alcance por defecto. Ejecuta typecheck + test. No crear patrones nuevos si existe uno reutilizable.

### `MotoAtlas-Supabase-Guard`

Cambios explícitos de schema/RLS. Debe leer AGENTS.md + `supabase/schema.sql` + `supabase/schema.test.ts`. Mantener RLS estricta, grants mínimos, update/delete solo admin. Actualizar tests de schema. No tocar UI.

### `MotoAtlas-Quality-Gate`

Verificación final después de cambios ya aplicados. Debe leer AGENTS.md, leer DESIGN.md si afecta UI, ejecutar `npm run typecheck` y `npm run test`, y no modificar archivos salvo fallo de typecheck/test o bug evidente directamente relacionado con el cambio revisado.

Debe revisar:
- alcance del cambio
- permisos/RLS si aplica
- servicios si aplica
- UI si aplica
- tests

Se usa para confirmar que un bloque queda cerrado antes de seguir.

### `MotoAtlas-Docs-Sync`

Sincronización documental tras cambios ya aprobados. Se usa **después** de un `MotoAtlas-Quality-Gate` aprobado para alinear docs con el estado real implementado.

Reglas de uso:
- cuándo usarlo: cambios funcionales aprobados que afectan comportamiento, arquitectura, testing o flujos.
- cuándo NO usarlo: para implementar features, corregir bugs de app o tocar schema/RLS.
- modelo recomendado: `MiniMax M2.7` para actualización mecánica de docs; `GPT-5.3 Codex` cuando haya contradicciones o decisiones documentales más delicadas.
- no tocar: código fuente, tests, estilos, schema/RLS/Supabase.

## Runbook operativo (agentes/skills/modelos)

Secuencia oficial por defecto:

```txt
Auditor → Safe Builder → Quality Gate → Docs Sync
```

Excepciones:
- Supabase/RLS → `MotoAtlas-Supabase-Guard`
- Auditoría global → `MotoAtlas-Global-Auditor` (cuando exista) o `MotoAtlas-Page-Auditor` en modo global controlado
- CSS/UI polish → `MotoAtlas-Safe-Builder` + skills `frontend-design` / `accessibility`

Detalle completo en `docs/agents-runbook.md`.

## Skills externas

Prioridad: 1. usuario, 2. AGENTS.md, 3. docs del repo, 4. skills externas, 5. preferencias del modelo.

Skills externas NO pueden: tocar schema/RLS sin permiso, hacer build/commit/push, introducir dependencias, reescribir arquitectura, cambiar patrones visuales, saltarse typecheck+test.

Usar `supabase-postgres-best-practices` solo cuando la tarea pida explícitamente tocar schema/RLS/queries.

## Plantillas rápidas

### Auditoría
```text
@MotoAtlas-Page-Auditor

Audita la ruta `#/RUTA` sin modificar archivos.
Modo: Plan only.
Devuelve informe P0/P1/P2.
No apliques cambios.
```

### Aplicación segura
```text
@MotoAtlas-Safe-Builder

Aplica solo los cambios aprobados de la auditoría de `#/RUTA`.
Respeta las reglas de alcance por defecto.
Ejecuta typecheck y test.
No hagas build, commit ni push.
```

### Supabase/RLS
```text
@MotoAtlas-Supabase-Guard

Tarea: ...
Alcance: schema/RLS/servicio/tests relacionados.
No implementar UI todavía.
Ejecuta typecheck y test.
No hagas build, commit ni push.
```

### Quality Gate
```text
@MotoAtlas-Quality-Gate

Valida el bloque recién aplicado.
Ejecuta typecheck y test.
No agregues features.
No hagas build, commit ni push.
```

### Docs Sync
```text
@MotoAtlas-Docs-Sync

Sincroniza docs tras Quality Gate aprobado.
No toques código/tests/estilos/schema.
Ejecuta typecheck y test.
No hagas build, commit ni push.
```
