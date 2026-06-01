# MotoAtlas — Estado actual

## Último estado estable

- Rama actual:
- Último bloque cerrado: Fase C (P1) — consolidación de reacciones comunitarias
- Tests: 980 passed
- Typecheck: clean
- Último commit:

## Implementado

### Comunidad
- Rankings con `reviewCount` real, `averageRating` y `confidence` (Alta/Media/Baja).
- Ajuste de score mediante aspectos técnicos (`motorcycle_review_aspects`) por categoría.
- Pesos por categoría: global, daily, travel, sport, a2, power-weight, reliability, passenger.
- Factor de confianza: <3 reviews 35%, 3-9 reviews 70%, ≥10 reviews 100%.
- Score interno clampado 0–100; score visible clampado 0–10 (índice, no estrellas). Usa icono `analytics`.
- Confidence visible como shield con tooltip: Alta confianza, Media confianza, Baja confianza.
- Shield con colores: high=verde, medium=ámbar, low=gris.
- Podio principal prioriza confidence high: si hay 3 high, usa solo high; si faltan, rellena con medium y luego low.
- Podio NO usa filtros de la página (filtros solo afectan al listado técnico).
- Listado técnico ya no usa `<table>`; usa cards/grid responsive con columnas alineadas en desktop.
- Filtros afectan solo al listado técnico: segment, license, use, search.
- El Podium rankings de `#/comunidad` replica el lenguaje visual del podio de `#/comunidad/rankings`: mismo patrón de cards, shield y tooltip.
- `#/comunidad/reviews`: filtros apply-on-change en tiempo real; botón "Aplicar" cierra el panel en mobile; copy "Reviews destacadas" (antes "Destacadas del mes").
- `#/comunidad/reviews` Garaje: `MotorcycleGarageCard` extraído a `src/components/motorcycles/MotorcycleGarageCard/`. Props planas reutilizables (title, imageSource, imageAlt, rating, reviewCount, primaryUseLabel, lastReviewDate, reviewsHref, detailHref). Presentacional sin fetch ni estado. Base para futura reutilización en `#/buscador`.
- `#/comunidad/reviews` `Reviews destacadas`: criterio = utilidad comunitaria (`helpfulCount` desc). Desempates: rating, comentario más largo, más reciente. Kilómetros NO son criterio. Fallback si no hay útiles funciona por rating/fecha. `Últimos reportes`: cronológico puro. Deduplicación interna por `motorcycleId` en cada bloque editorial, sin deduplicación editorial↔garaje.
- `#/comunidad/reviews` `FeaturedReviewCard` (reviews destacadas y últimos reportes): acciones comunitarias reales conectadas — HelpfulReviewAction, NotHelpfulReviewAction, ReportReviewAction con ReviewReportForm, y ReviewReplySection con lazy loading. `Útil N` es contador público y se muestra siempre: en auth+review ajena+no reportada es interactivo; en no-auth, review propia o reportada queda pasivo/no interactivo. Chip `Propia` visible en zona de acciones para reviews propias. `No útil`, `Reportar` y `Responder` no se renderizan cuando no hay permiso real (sin no-op silencioso). El botón `Responder` aparece como action chip en `.featured-review-card__actions`; ReviewReplySection usa `inline=true` para que el trigger sea hijo directo de actions y el contenido expandido quede en `.motorcycle-community__replies`. `MotorcycleCommunityPage` mantiene comportamiento original sin `inline`. `isBlocked` deriva de `reportedReviewIds` (hidratado con `getMyReviewReports`), y al reportar se limpia reacción previa con `clearMyReviewReaction`; tras reportar, esa review queda bloqueada para nuevas reacciones.
- Fase A de consolidación P1: utilidades compartidas en `src/shared/reviews/reviewCommunityActions.ts` (`buildReviewAuthContext`, `isOwnReview`, `isDuplicateReviewReportError`, `markReportsByReviewId`, `upsertReactionSummaryInList`, `upsertReactionSummaryById`) reutilizadas por `CommunityReviewsPage` y `MotorcycleCommunityPage` sin introducir hooks.
- `reviewCommunityActions.ts` es capa de helpers puros: no hace fetch, no lee auth directamente y no llama servicios. Mantiene shapes separados de reaction summaries (list para `CommunityReviewsPage`, map para `MotorcycleCommunityPage`).
- Fase B de consolidación P1 cerrada: `src/shared/reviews/useReviewReports.ts` centraliza estado/flujo de reportes (`reportedReviewIds`, `reportForm`, `reportPendingIds`, hidratación con `getMyReviewReports`, guards `unauthenticated | own_review | already_reported`, submit `success | duplicate | blocked | error` y cleanup opcional por callback).
- `CommunityReviewsPage` usa `useReviewReports` en modo UX silenciosa: mantiene no-auth sin acciones falsas y cleanup con `clearMyReviewReaction` + `upsertReactionSummaryInList`.
- `MotorcycleCommunityPage` usa `useReviewReports` conservando UX propia (tooltips no-auth/success/duplicate + `reactionNotice` en error no duplicado), cleanup con `clearMyReviewReaction` + `upsertReactionSummaryById`, y pending combinado (`reactionPendingIds + reportPendingIds`).
- Fase C de consolidación P1 cerrada: `src/shared/reviews/useReviewReactions.ts` centraliza mutaciones Helpful/NotHelpful con guards (`unauthenticated | own_review | reported | pending`), pending por `reviewId` y outcomes (`success | blocked | error`), sin fetch inicial de summaries y sin acoplar feedback/UI.
- `CommunityReviewsPage` usa `useReviewReactions` con UX silenciosa: en success actualiza con `upsertReactionSummaryInList`; `Útil N` se mantiene como contador público visible (pasivo en no-auth/propia/reportada, interactivo solo con permiso real); mantiene orden editorial por `helpfulCount`.
- `MotorcycleCommunityPage` usa `useReviewReactions` conservando UX propia: blocked unauthenticated/reported mapea a tooltip existente, errores a `reactionNotice`, success limpia tooltip/notice y actualiza con `upsertReactionSummaryById`; pending combinado sigue en `reactionPendingIds + reportPendingIds`.
- `TopRatedMotorcyclesPage` (`#/comunidad` y `#/motos-mejor-valoradas`) reutiliza `FeaturedReviewCard` en `RecentReviews` como card visual común: reemplaza cards legacy cuando hay datos, mantiene orden cronológico (fecha desc), límite `slice(0, 3)` y empty state. En esta fase no conecta Helpful/NotHelpful/Report/Replies ni renderiza acciones falsas/no-op.

### Admin
- ...

### Datos demo
- Pipeline mock operativo: generación, importación y limpieza con `source='mock'`.
- Policy por entorno vigente: producción solo `source='user'`; dev/pre puede incluir `seed` y `mock`.
- Backlog P2: mejorar realismo de reviews mock para QA visual (variedad de contenido, menos repetición y mejor cobertura de maquetación).
- Source policy central aplicada en servicios públicos de reviews (`reviewSourcePolicy` + `status='approved'`).
- Pendiente P2: toggle admin “Incluir datos demo” solo para dev/pre.

## Pendiente

- Rediseño mobile avanzado de rankings/listado técnico (cards responsive más refinadas).
- Aspectos agregados en garaje de `#/comunidad/reviews`.
- Deduplicación editorial↔garaje.
- Reutilización de `MotorcycleGarageCard` en `#/buscador` (pendiente, aún no aplicada).
- Backlog P1/P2: mejora de `bike-detail__quick-specs` con tarjetas técnicas reutilizables (sin acoplar CSS de `ReviewModal`).
- Backlog P2: mejorar generador de reviews mock realistas para validar cards/layouts con datos más representativos.
- Backlog P2: toggle admin “Incluir datos demo” (en producción no visible/sin efecto).
- Backlog P2: crear fixtures de auth/perfiles/sesión para tests (user/admin/no-auth) y reducir mocks repetidos por archivo.

## En curso

- Auditoría y cierre de taxonomía de segmentos de motos (tarea transversal de plataforma): consolidar fuente de verdad y sincronización entre schema/TS/importador/UI.
- ...

## Siguiente paso

- ...

## Decisiones importantes

- Producción solo `source=user`.
- Dev/pre puede incluir `seed` y `mock`.
- Rankings usan reviewCount real y confidence.
- La tarjeta histórica “Implementar login y cuentas de usuario” se reclasifica en roadmap como **Auth baseline** dentro de **P2 Plataforma/Admin/Productividad interna**; capa social avanzada queda para fase futura separada.
- La tarea “Revisar y cerrar taxonomía de categorías de motos” se clasifica como dependencia estratégica previa para filtros reutilizables, admin catálogo y futuras landings SEO por segmento.
- La funcionalidad “Temas de discusión por modelo” se clasifica como backlog estratégico **P3** (comunidad social), dependiente de auth baseline, moderación y anti-spam antes de implementación.
- La mejora de quick specs de `BikeDetailPage` se clasifica como **P1/P2 UX pública + componentes reutilizables**, conectada con revisión UI/SCSS y futuro admin de catálogo.
- La mejora del generador de mocks se clasifica como **P2 Datos demo / QA visual** (soporte técnico de maquetación, no feature pública directa).
- “Controlar datos demo por entorno en comunidad” queda reclasificada en dos partes: source policy implementada + toggle admin pendiente.
- Crear fixtures de usuarios/perfiles para auth queda como **P2 Auth baseline / Testing / Fixtures** para reforzar auditoría de cierre de auth.
- ...

## No tocar sin decisión explícita

- schema/RLS
- rutas
- admin/cuenta si la tarea es comunidad
- ...

## Riesgos pendientes

- Tendencia no usa serie temporal real.
- Insights en vivo con polling cada 60s (sin Supabase Realtime).
- El branch de duplicado en reportes depende del literal `"Ya has reportado esta review."`; si cambia el mensaje backend, hay que ajustar la detección.
- En fallo de hidratación de reportes (`getMyReviewReports`), `useReviewReports` absorbe el error de forma silenciosa; en `MotorcycleCommunityPage` puede perderse el notice específico de ese edge case.
- Posible flaky test aislado en Admin (`no muestra paginación cuando hay 6 reportes o menos`), sin evidencia de relación con Fase C.
- `useReviewReactions` no tiene test explícito para doble toggle en el mismo tick exacto; hay cobertura de pending en request y guard por ref interno.

## Referencias de contratos

- Contratos de comportamiento: `docs/product-behavior-contracts.md`
- Contratos de producto para reviews, acciones comunitarias, FeaturedReviewCard, confianza, rating vs score y deduplicación.
- Roadmap estratégico y backlog de producto: `docs/product-roadmap.md`
