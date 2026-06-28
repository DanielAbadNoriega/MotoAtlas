# 001 · Search Consumer MotoIcon Migration — Tasks

## Fase 1 — SDD

- [x] Crear carpeta `spec/features/001-search-consumer-motoicon-migration/`
- [x] Poblar `context.md`
- [x] Poblar `spec.md`
- [x] Poblar `plan.md`
- [x] Poblar `tasks.md`

## Fase 2 — Implementación

- [ ] Actualizar el render del icono en `src/shared/ui/search/SearchControl.tsx` para usar MotoIcon preservando la prop `icon` y su valor por defecto `'search'`.
- [ ] Preservar atributos `aria-hidden` y `focusable` existentes en SearchControl
- [ ] Preservar la prop `icon` con su valor por defecto `'search'`
- [ ] Evitar scope creep hacia Navbar, AdminPages, filtros o migración global
- [ ] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/AccountReviewsPage/AccountReviewsPage.tsx` por `<MotoIcon name="search" .../>`
- [ ] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.tsx` por `<MotoIcon name="search" .../>`
- [ ] Reemplazar `<span className="material-symbols-outlined">search</span>` en `src/components/pages/CommunityRankingsPage/CommunityRankingsPage.tsx` por `<MotoIcon name="search" .../>`

## Fase 3 — Quality Gate

- [ ] `npm run typecheck` — limpio
- [ ] `npm run test` — suite completa, 1616 tests, 84 files, todos correctos
- [ ] tests focalizados: `SearchControl.test.tsx` correctos
- [ ] tests focalizados: `AccountReviewsPage.test.tsx` correctos
- [ ] tests focalizados: `CommunityReviewsPage.test.tsx` correctos
- [ ] tests focalizados: `CommunityRankingsPage.test.tsx` correctos
- [ ] `git diff --check` — limpio
- [ ] Verificar con grep que ningún `<span className="material-symbols-outlined">search</span>` permanece en los cuatro archivos objetivo

## Fase 4 — Docs Sync

- [ ] Actualizar `spec/constitution/roadmap.md` — mover 001 de "Siguiente" a "Hecho", solo tras implementación y validación completas
- [ ] Sincronizar docs solo si es necesario tras la implementación
