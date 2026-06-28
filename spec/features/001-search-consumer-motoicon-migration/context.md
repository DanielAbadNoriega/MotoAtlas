# 001 · Search Consumer MotoIcon Migration — Context

## Estado

Próxima a activar.

## Qué es esta feature

Continuación de Workstream E. Migración de los consumidores pendientes de `search` desde `<span className="material-symbols-outlined">search</span>` hacia `<MotoIcon name="search" />` en SearchControl y en las páginas de cuenta, comunidad y rankings.

## Documentos fuente

- `docs/current-workstreams.md` — Workstream E, líneas 214-215, 240
- `spec/constitution/hard-limits.md` — límite 12 (sensibilidad search/filter/AdminPage)
- `spec/constitution/tech-stack.md` — sección Iconos (política transitional)
- `spec/constitution/roadmap.md` — 001 en sección Siguiente

## Historial de implementación

- MotoIcon registry creado con 71 iconos inline SVG
- `search` ya existe en el registry (MotoIcon.tsx, línea 56)
- SearchControl, AccountReviewsPage, CommunityReviewsPage y CommunityRankingsPage siguen usando Material Symbols para el icono de búsqueda
- Los iconos `search` y `explore` en Navbar permanecen intencionalmente pendientes
- El uso de `search` en AdminPages es sensible y fuera de alcance para esta feature

## Baseline de validación actual

- typecheck: limpio
- test: 1616 tests, 84 files (según `docs/current-workstreams.md` Workstream E)
- tests focalizados: SearchControl.test.tsx (3 tests), AccountReviewsPage.test.tsx, CommunityReviewsPage.test.tsx, CommunityRankingsPage.test.tsx

## Decisiones tomadas

- `search` ya está en el MotoIcon registry; no se requiere ninguna entrada nueva en el registry
- `explore` no está en el registry; no es necesario para esta feature
- Navbar `search` y `explore` son intencionadamente pendientes; fuera de alcance
- Las páginas Admin que usan `search` son sensibles; fuera de alcance salvo scope explícito
- Filter icons (`filter_alt`, etc.) son trabajo futuro de Workstream E; no se mezclan con esta migración

## Estado actual

Cuatro consumidores pendientes con `<span className="material-symbols-outlined">search</span>`:

1. `src/shared/ui/search/SearchControl.tsx` — icono vía prop `icon` con valor por defecto `'search'`
2. `src/components/pages/AccountReviewsPage/AccountReviewsPage.tsx` — icono de búsqueda en filtro
3. `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.tsx` — icono de búsqueda en filtro
4. `src/components/pages/CommunityRankingsPage/CommunityRankingsPage.tsx` — icono de búsqueda en filtro

## Riesgos

- SearchControl es un componente compartido; la migración debe preservar su API pública de props
- Los tests de las cuatro páginas no realizan aserciones sobre el icono `search` específico; la migración no debe romperlos
- Filter icons (`filter_alt` y similares) son trabajo futuro; no se mezclan con la migración de search

## Zonas prohibidas

- `src/components/layout/Navbar/Navbar.tsx` — `search` y `explore` en Navbar
- Admin pages (`AdminRequestsPage`, `AdminEditModelsPage`, `AdminReviewsPage`) — uso de search
- `src/components/ui/filters/FilterGroup` / iconos de filtros
- `src/components/motorcycles/MotorcycleGarageCard/MotorcycleGarageCard.tsx` — `explore` decorativo
- MotoIcon registry — no agregar nuevos iconos
- Migraciones globales de iconos

## Siguiente paso seguro

Reemplazar `<span className="material-symbols-outlined">search</span>` por `<MotoIcon name="search" .../>` en los cuatro consumidores, preservando `aria-hidden` y los atributos existentes. Confirmar que la prop `icon` de SearchControl solo recibe valores existentes en el registry antes de migrarla directamente a `MotoIcon`.
