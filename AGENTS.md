# AGENTS.md — MotoAtlas

## Antes de todo

Lee esto completo. No adivines.

## Quality gate (siempre)

```bash
npm run typecheck
npm run test
```

No hacer build, commit ni push salvo orden explícita.

## Lo que NO tocas sin orden explícita

- `supabase/schema.sql` — schema, RLS, policies, grants, auth, roles
- servicios Supabase sensibles (service_role_key, admin endpoints)
- refactors grandes, renombrados masivos, nuevas dependencias, cambios de arquitectura

Admin se protege con `user_profiles.role = 'admin'`. Helper SQL: `public.is_admin()`. Rutas admin protegidas por sesión + rol. Usuarios normales no leen ni modifican datos admin.

## Reglas de alcance por defecto

Salvo indicación explícita, ninguna tarea debe tocar:

- `supabase/schema.sql`
- RLS, policies, grants, auth, roles
- servicios Supabase sensibles
- servicios no relacionados con la tarea
- rutas no relacionadas
- `review_reactions`
- `review_reports`
- lógica admin/moderación no solicitada
- lógica de comunidad no solicitada
- refactors grandes
- renombrados masivos
- nuevas dependencias
- cambios de arquitectura
- build
- commit
- push

Si una tarea requiere tocar alguna de estas zonas, el agente debe indicarlo antes o limitarse a explicar:
- qué archivo/zona habría que tocar
- por qué es necesario
- riesgo
- alternativa más segura

## Tipos de tarea

### UI / SCSS
- prompt corto: propósito + componente/clases/responsive
- NO tocar servicios, schema, ni archivos ajenos
- maqueta nueva → diseñar en Stitch/Gemini primero, después implementar
- seguir patrón visual existente

### Schema / RLS / Auth
- prompt largo y detallado: esquema, policies, ejemplos, casos de uso
- revisar permisos
- actualizar tests de schema

## Patrones UI (reutilizar, no crear nuevos)

- **Filtros**: reutilizar siempre el patrón existente (`account-reviews-page__filter-group` o `admin-page__filter-group`). No crear variantes nuevas. Header/body/footer, chips, Material Symbols, responsive sheet/drawer, `Limpiar filtros` + `Aplicar filtros`. Referencias: `#/cuenta/reviews`, `#/admin/moderacion`, `#/admin/reviews`.
- **Paginación**: usar preferentemente `AccountPagination`. Si una página no usa el componente, replicar el patrón visual validado de paginación con Material Symbols, active/hover/focus/disabled, `aria-label` y `aria-current="page"`. No crear paginadores nuevos.
- **Cards review**: `.account-page__review-summary-card`, `.admin-page__review-summary-card`, compactas por moto
- **Hero admin**: basado en `motorcycle-community__hero` con `MotorcycleImage`, eyebrow `ADMIN STUDIO`, y hero-rating con métricas si aplica. CTAs solo si la página las necesita (ficha, reviews públicas).

## Rutas

- **Cuenta**: `#/cuenta`, `#/cuenta/reviews`, `#/cuenta/reviews/[motorcycleId]`, `#/cuenta/solicitudes`
- **Comunidad**: `#/comunidad`, `#/comunidad/reviews`, `#/comunidad/[motorcycleId]`
- **Admin**: `#/admin`, `#/admin/moderacion`, `#/admin/reviews`, `#/admin/reviews/[motorcycleId]`

## Admin

### `#/admin/moderacion`
- Estados reporte: `pending` | `reviewed` | `dismissed` | `action_taken` → UI: `Resuelto`
- Acciones reporte: Marcar revisado, Descartar, Marcar como resuelto
- Acciones review desde reporte: Aprobar, Ocultar, Rechazar
- Si modificás la review → reporte pasa a `action_taken`

### `#/admin/reviews`
- Cards resumen por modelo, similar a `#/cuenta/reviews`
- Filtros: status, source, verified, orden

### `#/admin/reviews/[motorcycleId]`
- Usa patrón expandible tipo `AdminReportCard`.
- Cada review es una unidad moderable con header/body/footer.
- Header: usuario, estado, rating, source, verified, fecha.
- Body: comentario y pros/contras.
- Footer: acciones Aprobar/Ocultar/Rechazar.
- No crear rows custom aisladas si el patrón `AdminReportCard` encaja mejor.

## Reviews

- Estados: `pending` → Pendiente, `approved` → Publicada, `rejected` → Rechazada, `hidden` → Oculta
- No mostrar `null`. Pros/contras `null` o vacíos no se renderizan.

## Reacciones y reportes (público)

- `Útil N`: contador público
- `No útil` / `Reportar`: sin contador público
- Reportar una review → limpia reacciones previas de ese usuario
- Review reportada → no permite nuevas reacciones de ese usuario
- El autor no puede reaccionar ni reportar su propia review

## Tests

```bash
npm run typecheck
npm run test
```

E2E futuro: Playwright, local/staging, usuarios admin/userA/userB, flujo review→aprobación→reacción→reporte→moderación.

## Referencias rápidas

- `docs/architecture.md` — arquitectura, routing, data model
- `docs/testing-strategy.md` — mocking, edge cases
- `docs/auth.md` — auth, RLS, admin role
- `docs/admin.md` — admin en detalle
- `docs/ui-notes.md` — páginas y componentes
- `docs/codex-guidelines.md` — reglas mínimas Codex/Copilot
- `DESIGN.md` — sistema visual real, patrones UI, componentes y auditorías de diseño

## Plantilla de prompt corto

Usar para tareas que necesitan el contexto completo del proyecto:

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

Uso:
Auditorías de páginas en modo plan.

Debe:
- leer `AGENTS.md`
- leer `DESIGN.md`
- no modificar archivos
- no aplicar fixes
- devolver informe P0/P1/P2
- indicar archivos afectados, problema, por qué importa, cambio recomendado y riesgo
- proponer los 2 o 3 cambios prioritarios

Skills preferentes:
- accessibility
- seo
- frontend-design
- react-best-practices
- typescript-advanced-types
- vitest

No debe usar salvo petición explícita:
- hyperframes
- gsap
- animejs
- lottie
- three
- typegpu
- supabase-postgres-best-practices

### `MotoAtlas-Safe-Builder`

Uso:
Aplicar cambios pequeños y aprobados.

Debe:
- leer `AGENTS.md`
- leer `DESIGN.md`
- respetar reglas de alcance por defecto
- aplicar solo lo pedido
- no hacer refactors grandes
- no crear patrones nuevos si ya existe uno reutilizable
- ejecutar:
  - `npm run typecheck`
  - `npm run test`

Si necesita tocar una zona prohibida por defecto, debe parar y explicar el riesgo antes de hacerlo.

### `MotoAtlas-Supabase-Guard`

Uso:
Cambios explícitos de Supabase/Postgres/RLS.

Debe usarse cuando la tarea pida tocar:
- schema
- RLS
- policies
- grants
- auth
- roles
- tablas nuevas
- servicios relacionados con tablas nuevas

Debe:
- leer `AGENTS.md`
- leer `supabase/schema.sql`
- leer `supabase/schema.test.ts`
- mantener RLS estricta
- aplicar grants mínimos
- no permitir update/delete a usuarios normales salvo petición explícita
- actualizar tests de schema
- ejecutar:
  - `npm run typecheck`
  - `npm run test`

No debe tocar UI, estilos ni rutas salvo petición explícita.

## Skills externas

El proyecto puede usar skills externas de opencode para mejorar accesibilidad, SEO, React, TypeScript, Supabase, Vite y Vitest.

Prioridad de instrucciones:

1. Instrucciones del usuario.
2. `AGENTS.md`.
3. Documentación del repo (`docs/admin.md`, `docs/codex-guidelines.md`, `docs/ui-notes.md`).
4. Skills externas.
5. Preferencias generales del modelo/agente.

Las skills externas deben usarse como apoyo técnico, pero no pueden:
- tocar schema/RLS/Supabase sin permiso explícito;
- hacer build, commit o push salvo indicación;
- introducir dependencias nuevas sin permiso;
- reescribir arquitectura;
- cambiar patrones visuales existentes sin motivo;
- saltarse `npm run typecheck` y `npm run test`.

## Plantillas rápidas

### Auditoría

```text
@MotoAtlas-Page-Auditor

Audita la ruta `#/RUTA` sin modificar archivos.

Modo:
Plan only.

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

Tarea:
...

Alcance:
schema/RLS/servicio/tests relacionados.

No implementar UI todavía.
Ejecuta typecheck y test.
No hagas build, commit ni push.
```

## Skills por tipo de tarea

### Auditoría de páginas
Usar preferentemente:
- accessibility
- seo
- frontend-design
- react-best-practices
- typescript-advanced-types
- vitest

No usar salvo petición explícita:
- gsap
- animejs
- lottie
- three
- typegpu
- hyperframes
- supabase-postgres-best-practices

### Vídeo / demos
Usar:
- hyperframes
- hyperframes-cli
- hyperframes-media
- hyperframes-registry
- remotion-to-hyperframes
- frontend-design
- css-animations

### Supabase / RLS
Usar `supabase-postgres-best-practices` solo cuando el usuario pida explícitamente tocar schema, RLS, policies o queries.