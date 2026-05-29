# MotoAtlas — Estado actual

## Último estado estable

- Rama actual:
- Último bloque cerrado:
- Tests:
- Typecheck:
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
- `#/comunidad/reviews` `FeaturedReviewCard` (reviews destacadas y últimos reportes): acciones comunitarias reales conectadas — HelpfulReviewAction, NotHelpfulReviewAction, ReportReviewAction con ReviewReportForm, y ReviewReplySection con lazy loading. Chip `Propia` visible en zona de acciones para reviews propias. El botón `Responder` aparece como action chip en `.featured-review-card__actions`; ReviewReplySection usa `inline=true` para que el trigger sea hijo directo de actions y el contenido expandido quede en `.motorcycle-community__replies`. `MotorcycleCommunityPage` mantiene comportamiento original sin `inline`.

### Admin
- ...

### Datos demo
- ...

## Pendiente

- Rediseño mobile avanzado de rankings/listado técnico (cards responsive más refinadas).
- Aspectos agregados en garaje de `#/comunidad/reviews`.
- Deduplicación editorial↔garaje.
- Reutilización de `MotorcycleGarageCard` en `#/buscador` (pendiente, aún no aplicada).

## En curso

- ...

## Siguiente paso

- ...

## Decisiones importantes

- Producción solo `source=user`.
- Dev/pre puede incluir `seed` y `mock`.
- Rankings usan reviewCount real y confidence.
- ...

## No tocar sin decisión explícita

- schema/RLS
- rutas
- admin/cuenta si la tarea es comunidad
- ...

## Riesgos pendientes

- Tendencia no usa serie temporal real.
- Insights en vivo con polling cada 60s (sin Supabase Realtime).

## Referencias de contratos

- Contratos de comportamiento: `docs/product-behavior-contracts.md`
- Contratos de producto para reviews, acciones comunitarias, FeaturedReviewCard, confianza, rating vs score y deduplicación.