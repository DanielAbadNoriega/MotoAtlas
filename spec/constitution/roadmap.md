# MotoAtlas — Roadmap SDD

## Propósito

Este archivo es el índice de planificación SDD. `docs/current-workstreams.md` permanece como fuente de verdad operativa live.

El trabajo completado es baseline histórico. El trabajo activo/pendiente/futuro estratégico recibirá carpetas `spec/features/NNN-*` con `context.md`, `spec.md`, `plan.md` y `tasks.md` cuando corresponda.

## Hecho / baseline histórico ✅

Solo índice breve. No copiar contenido completo de workstreams.

- **MotoIcon registry** — 71 iconos inline SVG, registry centralizado en `src/shared/ui/icons/MotoIcon.tsx`
- **Migraciones críticas de iconos** — LoadingState, ReviewModal, ReviewAspectSummary, RadarState, review cards/actions (FeaturedReviewCard, AccountReviewCard, MotorcycleReviewCard, HelpfulReviewAction, NotHelpfulReviewAction, ReportReviewAction, ReviewReplySection, ReplyConvivenceNotice), account action/navigation (logout, pagination), Navbar, ScrollToTopButton
- **AdminPage decomposition** — reducida de ~5900 líneas a ~13 líneas; 9 page components extraídos; barrel aplanado; zero circular imports
- **Auth fixtures** — factories centralizadas de auth/perfiles/sesión para tests
- **Community Pulse / live insights** — signals accionables, ratings veraces, sin tendencias falsas
- **FilterGroup normalization** — UI reusable de filtros compartida entre cuenta/comunidad/buscador/admin
- **BikeDetailPage tabs** — Resumen, Especificaciones, Comunidad, Comparar; SpecCards técnicas
- **FeaturedMachines** — sección Home sin legacy FeaturedBikes/BikeCard
- **Taxonomy base** — 16 segmentos canónicos, bucket UI `other`, guardrails de validación

*Baseline operativo actual: 1616 tests, 84 archivos. Fuente: `docs/current-workstreams.md` Workstream E.*

## Siguiente 🔜

Trabajo inmediato que merece carpetas `spec/features/NNN-*` futuras.

`001-search-consumer-motoicon-migration` — P1

- Continuación Workstream E
- Migrar consumidores pendientes de `search` a MotoIcon: SearchControl, AccountReviewsPage, CommunityRankingsPage, CommunityReviewsPage
- `search` y `explore` en Navbar intencionalmente pendientes
- AdminPage search usage es sensible y requiere alcance separado
- Depende del baseline MotoIcon registry (71 iconos)
- Requiere context.md antes de implementar

`002-admin-gallery-autonomous-actions` — P1

- Continuación Workstream C
- Eliminación inmediata confirmada con modal en lugar de pending-delete atado a publish
- Cover fallback seguro
- Drag-and-drop reorder / acción primary como pasos siguientes en la secuencia
- Depende del baseline AdminPage decomposition
- Requiere context.md antes de implementar

## Backlog / ideas 💡

Trabajo futuro que debe recibir SDD framing cuando se active.

`003-image-optimization-pipeline` — P2

- WebP conversion, thumbnails, dimensiones, validación, optimización Lighthouse
- Mantener separado de migración SVG/MotoIcon
- Probable dependencia de flujos estables de galería/upload admin

`005-playwright-e2e-smoke-tests` — P2/P3

- Smoke tests, responsive checks, flujos admin contra staging
- No reemplaza baseline Vitest/RTL
- Covered en `docs/testing-strategy.md`

`006-mobile-first-premium-redesign` — P3

- Rediseño premium mobile-first por landing/página
- Cada landing requiere scope independiente
- No es redesign visual global dentro de tareas no relacionadas

## Futuro estratégico 🧭

`004-project-architecture-review` — P2, audit-first

- Evaluación de estructura actual y recomendación de dirección arquitectónica
- Opciones posibles: separación MVC-inspired, arquitectura feature-based, clean separation UI/hooks/services u otro enfoque adecuado
- **No es implementación-ready.** Sin refactor hasta que auditoría, spec y plan sean aprobados
- Los eager imports de admin en App.tsx y el lazy-loading de rutas admin pertenecen aquí o a spec de arquitectura/lazy-loading dedicada, no a trabajo no relacionado

## Reglas de creación de features

Solo trabajo activo, próximo, backlog importante o estratégico-futuro recibe carpeta de feature.

Trabajo completado queda como baseline/historia salvo que una feature nueva lo necesite referenciar en context.md.

Toda carpeta `spec/features/NNN-*` futura debe incluir:

- `context.md` — source docs, historia de implementación, decisiones, baseline de validación, riesgos, zonas prohibidas, próximo paso seguro
- `spec.md` — comportamiento y criterios de aceptación
- `plan.md` — enfoque técnico y fases
- `tasks.md` — checklist de implementación

## Relación con otros documentos

- `docs/current-workstreams.md` — fuente de verdad operativa live
- `docs/product-roadmap.md` — referencia estratégica de producto
- `spec/constitution/roadmap.md` — índice de planificación SDD
- `spec/constitution/hard-limits.md` — gobernanza de zonas sensibles
- `spec/features/NNN-*` — carpetas creadas solo cuando una feature se activa o necesita SDD framing
