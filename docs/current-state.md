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
- `#/comunidad/reviews` Garaje: card rediseñada con rating /5 con estrella, shield de confianza (tooltip visual Alta/Media/Baja), meta row compacta (uso, reviews, fecha corta DD.MM.YY), CTAs "Reviews" y "Ficha técnica". Sin Km declarados. Base visual para futura extracción a componente compartido.

### Admin
- ...

### Datos demo
- ...

## Pendiente

- Rediseño mobile avanzado de rankings/listado técnico (cards responsive más refinadas).
- Aspectos agregados en garaje de `#/comunidad/reviews`.
- Posible extracción de `GarageMotorcycleCard` como componente reutilizable para `#/buscador`.
- Deduplicación editorial↔garaje.

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