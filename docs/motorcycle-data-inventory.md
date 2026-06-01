# MotoAtlas — inventario vivo de datos de motos

Este documento explica qué datos maneja MotoAtlas, de dónde pueden venir y dónde se usan. Es la referencia antes de ampliar el modelo: si un campo no está aquí, todavía no forma parte del contrato estable.

## Procedencia de datos

| Valor | Texto de UX | Uso interno |
| --- | --- | --- |
| `api` | Dato técnico | Dato obtenido desde API externa y normalizado. |
| `manual` | Revisado | Dato revisado o introducido editorialmente. |
| `estimated` | Estimado | Dato calculado o aproximado hasta revisión. |
| `user` | Comunidad | Dato procedente de reviews/reportes de usuarios. |
| `placeholder` | Pendiente de confirmar | Hueco controlado; no debe parecer dato final. |

Regla UX: no mostrar `PLACEHOLDER` al usuario final. Usar textos como “Precio pendiente de confirmar”, “Valoración estimada” o “Fiabilidad estimada”.

## Campos actuales del modelo Motorcycle/Bike

| Campo dominio | Campo Supabase | Tipo | Obligatorio | Procedencia habitual | Buscador | Ficha | Comparador | SEO | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | `id` | `text` | Sí | manual | Sí | Sí | Sí | Sí | Identificador estable para rutas, upsert y selección. |
| `brand` | `brand` | `text` | Sí | api/manual | Sí | Sí | Sí | Sí | Se usa en búsqueda textual, filtros y slugs. |
| `model` | `model` | `text` | Sí | api/manual | Sí | Sí | Sí | Sí | Se usa en búsqueda textual, títulos y slugs. |
| `year` | `year` | `integer` | Sí | api/manual | Sí | Sí | Sí | Sí | Ordenación y contexto del modelo. |
| `segment` | `segment` | enum | Sí | manual | Sí | Sí | Sí | Sí | Valores en `BIKE_SEGMENTS`. Filtro principal. |
| `license` | `license` | enum | Sí | manual | Sí | Sí | Sí | No | Compatibilidad de carnet base: `A2` o `A`. |
| `isA2Compatible` | `is_a2_compatible` | `boolean` | Sí | manual | Sí | Sí | Sí | No | Filtro real A2. |
| `isA2LimitedVersion` | `is_a2_limited_version` | `boolean` | Sí | manual | Sí | Sí | Sí | No | Badge `A2 LIMITABLE`. |
| `limitedPowerHp` | `limited_power_hp` | `numeric?` | No | manual | No | Sí | Sí | No | Potencia de versión limitada si aplica. |
| `originalPowerHp` | `original_power_hp` | `numeric?` | No | manual/api | No | Sí | Sí | No | Potencia original antes de limitar. |
| `engineType` | `engine_type` | enum | Sí | api/manual | No | Sí | Sí | Sí | Arquitectura del motor. |
| `displacementCc` | `displacement_cc` | `integer` | Sí | api/manual | Sí | Sí | Sí | Sí | Campo técnico crítico: debe ser > 0. |
| `powerHp` | `power_hp` | `numeric` | Sí | api/manual | Sí | Sí | Sí | Sí | Filtro/ordenación por potencia. Debe ser > 0. |
| `torqueNm` | `torque_nm` | `numeric` | Sí | api/manual | No | Sí | Sí | Sí | Debe ser > 0. |
| `wetWeightKg` | `wet_weight_kg` | `numeric` | Sí | api/manual | Sí | Sí | Sí | Sí | Filtro/ordenación por peso. Debe ser > 0. |
| `seatHeightMm` | `seat_height_mm` | `integer` | Sí | api/manual | No | Sí | Sí | No | Debe ser > 0. |
| `fuelTankLiters` | `fuel_tank_liters` | `numeric` | Sí | api/manual | No | Sí | Sí | No | Debe ser > 0. |
| `priceEur` | `price_eur` | `integer` | Sí | manual/placeholder | Sí | Sí | Sí | Sí | Puede ser 0 solo como pendiente; UX: “Precio pendiente de confirmar”. |
| `imageUrl` | `image_url` | `text` | Sí | manual/placeholder | Sí | Sí | Sí | Sí | Si falta, usar fallback técnico centralizado. |
| `description` | `description` | `text` | Sí | manual/placeholder | Sí | Sí | Sí | Sí | Texto editorial de ficha y meta description. |
| `useScores.city` | `use_scores.city` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 de ciudad. |
| `useScores.touring` | `use_scores.touring` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 de viaje/confort. |
| `useScores.offroad` | `use_scores.offroad` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 fuera de asfalto. |
| `useScores.passenger` | `use_scores.passenger` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 pasajero/carga. |
| `useScores.beginner` | `use_scores.beginner` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 facilidad para principiantes. |
| `useScores.sport` | `use_scores.sport` | `number` | Sí | estimated/manual | No | Sí | Sí | No | Puntuación 0-10 conducción deportiva. |
| `useScores.funFactor` | `use_scores.funFactor` | `number` | Sí | estimated/manual | Sí | Sí | Sí | No | También se usa para “Uso real” en cards. |
| `features` | columnas booleanas | Sí | manual/estimated | No | Sí | No | No | ABS, modos, control tracción, etc. |
| `pros` | `pros` | `text[]` | Sí | manual/estimated | No | Sí | Sí | No | Si falta, mostrar “Sin datos disponibles”. |
| `cons` | `cons` | `text[]` | Sí | manual/estimated | No | Sí | Sí | No | Si falta, mostrar “Sin datos disponibles”. |
| `reliabilityReports.commonIssues` | `common_issues` | `text[]` | Sí | user/estimated | No | Sí | Sí | No | Problemas comunes. Si falta, fallback limpio. |
| `reliabilityReports.reportCount` | `report_count` | `integer` | Sí | user/estimated | No | Sí | Sí | No | Volumen de señales/reportes. |
| `reliabilityReports.reliabilityScore` | `reliability_score` | `numeric` | Sí | user/estimated | No | Sí | Sí | Sí | Score 0-10; si es estimado, mostrar nota discreta. |
| `imageLocked` | `image_locked` | `boolean` | Sí | manual | No | No | No | No | Protege imagen manual ante importaciones. |
| `descriptionLocked` | `description_locked` | `boolean` | Sí | manual | No | No | No | No | Protege descripción manual ante importaciones. |
| `specsSource` | `specs_source` | enum | Sí | api/manual | No | No | Dev | No | Calidad/procedencia de specs. |
| `priceSource` | `price_source` | enum | Sí | manual/placeholder | Sí | Sí | Sí | Sí | Si `placeholder`, usar texto pendiente. |
| `imageSource` | `image_source` | enum | Sí | manual/placeholder | Sí | Sí | Sí | Sí | Si `placeholder`, overlay técnico de imagen. |
| `scoresSource` | `scores_source` | enum | Sí | estimated/manual | No | Sí | Sí | No | Si `estimated`, nota “Valoración estimada”. |
| `prosConsSource` | `pros_cons_source` | enum | Sí | estimated/manual/user | No | Sí | Sí | No | No mostrar badge grande. |
| `reliabilitySource` | `reliability_source` | enum | Sí | estimated/user | No | Sí | Sí | Sí | Si `estimated`, nota discreta. |

## Taxonomía de segmentos (estado actual)

Estado: en desarrollo / pendiente de auditoría y cierre.

Segmentos esperados del contrato:
- `trail`
- `adventure`
- `touring`
- `sport-touring`
- `naked`
- `sport`
- `supersport`
- `hypernaked`
- `enduro`
- `dual-sport`
- `scrambler`
- `custom`
- `cruiser`
- `retro`
- `neo-retro`
- `scooter`

Fuente de verdad coordinada:
- `supabase/schema.sql` (`motorcycle_segment`)
- `src/types/bike.ts` (`BikeSegment`)
- `src/shared/motorcycles/motorcycleTaxonomy.ts` (`BIKE_SEGMENTS` + labels)

Validación operativa mínima:
- evitar duplicados ambiguos
- mantener labels/iconos coherentes
- asegurar filtros funcionales (desktop/mobile)
- verificar clasificación de motos existentes
- mantener sincronización schema/TS/importador/UI

## Campos de reviews

| Campo dominio | Campo Supabase | Obligatorio | Uso |
| --- | --- | --- | --- |
| `id` | `id` | Sí | Identificador de review. |
| `motorcycleId` | `motorcycle_id` | Sí | Relación con moto. |
| `userName` | `user_name` | Sí | Alias mostrado en ficha/comunidad. Si faltase por datos antiguos, la UI muestra “Usuario MotoAtlas”. |
| `rating` | `rating` | Sí | Rating 1-5; se usa en promedio y JSON-LD. |
| `ridingStyle` | `riding_style` | Sí | Uso principal declarado: ciudad, viaje, offroad, deportivo, pasajero o diario. |
| `ownershipMonths` | `ownership_months` | No | Contexto de uso real. |
| `kilometers` | `kilometers` | No | Contexto de uso real. |
| `comment` | `comment` | Sí | Texto de la opinión. |
| `pros` | `pros` | No | Pros aportados por usuario. |
| `cons` | `cons` | No | Contras aportados por usuario. |
| `verified` | `verified` | No | Preparado para reviews verificadas. Por defecto `false`; no se muestra badge si no hay dato real. |
| `status` | `status` | Sí | `pending` = pendiente de moderación, `approved` = visible públicamente, `rejected` = futuro/no visible. |

## Campos pendientes futuros

| Campo futuro | Motivo | Posibles usos |
| --- | --- | --- |
| `consumption_l_100` | Consumo homologado/real. | Ficha, comparador, SEO, coste de uso. |
| `range_km` | Autonomía estimada. | Comparador touring/adventure. |
| `front_wheel_size` | Medida rueda delantera. | Comparador trail/enduro. |
| `rear_wheel_size` | Medida rueda trasera. | Comparador trail/enduro. |
| `ground_clearance_mm` | Altura libre al suelo. | Comparador offroad. |
| `maintenance_interval_km` | Intervalo de mantenimiento. | Coste de propiedad. |
| `top_speed_kmh` | Velocidad máxima. | Sport/sport-touring. |
| `power_to_weight` | Relación potencia/peso. | Ordenación y comparador. Puede calcularse. |
| `brand_country` | País de marca. | SEO/ficha editorial. |
| `cooling_type` | Refrigeración. | Ficha técnica. |
| `recommended_use` | Uso recomendado editorial. | Buscador guiado y SEO. |

## Checklist para ampliar modelo de datos

1. Actualizar `supabase/schema.sql` con columna, tipo, check constraints e índices si aplica.
2. Actualizar tipos TypeScript en `src/types/bike.ts`.
3. Actualizar importador y payload Supabase en `src/features/import/*` y `scripts/importMotorcycles.ts`.
4. Actualizar normalización y validación, evitando placeholders silenciosos en campos críticos.
5. Actualizar fixtures en `src/test/fixtures/bikes.ts` y datos JSON si corresponde.
6. Actualizar tests unitarios, componentes y servicios.
7. Actualizar UI si el campo se muestra, filtra, ordena o compara.
8. Actualizar SEO/JSON-LD si el campo afecta title, description, schema o sitemap.
9. Actualizar este inventario vivo.
