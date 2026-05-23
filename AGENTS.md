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

- **Filtros**: `#/cuenta/reviews`, `#/admin/moderacion`, `#/admin/reviews` — header/body/footer, secciones desplegables, chips, Material Symbols, responsive sheet/drawer, `Limpiar filtros` + `Aplicar filtros`
- **Paginación**: `.community-reviews-page__pagination` — Material Symbols, active/hover/focus/disabled, `aria-label`, `aria-current="page"`
- **Cards review**: `.account-page__review-summary-card`, `.admin-page__review-summary-card`, compactas por moto
- **Hero admin**: basado en `CommunityHero`, full-width bajo navbar, sin CTAs salvo indicación

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
- Similar a `#/cuenta/reviews/[motorcycleId]`
- Primero layout/listado/filtros. Acciones admin aparte.

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
