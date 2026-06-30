# 001 · Search Consumer MotoIcon Migration — Tasks

## Fase 1 — SDD

- [x] Crear carpeta `spec/features/001-search-consumer-motoicon-migration/`
- [x] Poblar `context.md`
- [x] Poblar `spec.md`
- [x] Poblar `plan.md`
- [x] Poblar `tasks.md`

## Fase 2 — Implementación

- [x] Actualizar el render del icono en `src/shared/ui/search/SearchControl.tsx` para usar MotoIcon preservando la prop `icon` y su valor por defecto `'search'`.
- [x] Preservar atributos `aria-hidden` y `focusable` existentes en SearchControl
- [x] Preservar la prop `icon` con su valor por defecto `'search'`
- [x] Evitar scope creep hacia Navbar, AdminPages, filtros o migración global
- [x] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/AccountReviewsPage/AccountReviewsPage.tsx` por `<MotoIcon name="search" .../>`
- [x] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.tsx` por `<MotoIcon name="search" .../>`
- [x] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/CommunityRankingsPage/CommunityRankingsPage.tsx` por `<MotoIcon name="search" .../>`

## Fase 3 — Quality Gate

- [x] `npm run typecheck` — limpio
- [x] `npm run test` — suite completa, **1602 tests, 84 files**, todos correctos
- [x] tests focalizados: `SearchControl.test.tsx` correctos
- [x] tests focalizados: `AccountReviewsPage.test.tsx` correctos
- [x] tests focalizados: `CommunityReviewsPage.test.tsx` correctos
- [x] tests focalizados: `CommunityRankingsPage.test.tsx` correctos
- [x] `git diff --check` — limpio
- [x] Verificar con grep que ningún `<span className="material-symbols-outlined">search</span>` permanece en los cuatro archivos objetivo

## Fase 4 — Docs Sync

- [x] Actualizar `spec/constitution/roadmap.md` — mover 001 de "Siguiente" a "Hecho"
- [x] Sincronizar docs solo si es necesario tras la implementación
