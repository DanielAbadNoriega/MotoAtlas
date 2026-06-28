# 001 · Search Consumer MotoIcon Migration — Spec

## Estado

Próxima a activar.

## Qué hace

Reemplaza los usos pendientes de `<span className="material-symbols-outlined">search</span>` por `<MotoIcon name="search" />` en SearchControl y en las páginas de cuenta, comunidad y rankings.

## Por qué existe

Eliminar la dependencia de Material Symbols para el icono de búsqueda en los filtros de las páginas de usuario. El icono `search` ya existe en el MotoIcon registry. Esta migración es continuación directa de Workstream E y aplica la política transitional de iconos definida en la constitución SDD.

## Consumidores dentro de alcance

| Consumidor | Archivo |
|---|---|
| SearchControl | `src/shared/ui/search/SearchControl.tsx` |
| AccountReviewsPage | `src/components/pages/AccountReviewsPage/AccountReviewsPage.tsx` |
| CommunityReviewsPage | `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.tsx` |
| CommunityRankingsPage | `src/components/pages/CommunityRankingsPage/CommunityRankingsPage.tsx` |

## Criterios de aceptación

- [ ] SearchControl usa MotoIcon para el icono `search` sin romper su API pública (`icon` prop, valor por defecto `'search'`)
- [ ] AccountReviewsPage usa MotoIcon para el icono de búsqueda en su filtro
- [ ] CommunityReviewsPage usa MotoIcon para el icono de búsqueda en su filtro
- [ ] CommunityRankingsPage usa MotoIcon para el icono de búsqueda en su filtro
- [ ] Ningún `<span className="material-symbols-outlined">search</span>` permanece en los cuatro archivos objetivo
- [ ] No hay scope creep hacia Navbar, AdminPages, filtros o migración global de iconos
- [ ] typecheck limpio en Quality Gate posterior
- [ ] test suite completa en verde en Quality Gate posterior

## Fuera de alcance

- Navbar `search` y `explore` — intencionalmente pendientes
- AdminPages (`AdminRequestsPage`, `AdminEditModelsPage`, `AdminReviewsPage`) — sensibles, requieren scope separado
- MotoIcon registry — no agregar nuevos iconos
- Iconos de filtros (`filter_alt`, etc.) — trabajo futuro de Workstream E
- `explore` en MotorcycleGarageCard — decorativo, fuera de alcance
- Migraciones globales de iconos
