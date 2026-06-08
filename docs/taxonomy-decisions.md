# MotoAtlas — Decisiones de taxonomía de segmentos

Este documento cierra las decisiones operativas de clasificación que respaldan el contrato canónico de 16 segmentos en `BIKE_SEGMENTS` y la taxonomía SQL `motorcycle_segment`.

## Estado

La base de la taxonomía está cerrada. La fuente de verdad es `src/shared/motorcycles/motorcycleTaxonomy.ts` (`BIKE_SEGMENTS`) y se valida con el test de contrato `src/shared/motorcycles/motorcycleTaxonomy.contract.test.ts`. Fases 0, 1, 3 y 3.1 cerradas. Fase 2 (saneo puntual) aplicada. Fase 4 (SEO/Admin/landings) queda como fase futura y no se aborda aquí.

## Criterios generales de clasificación

- `trail`: motos de uso mixto con enfoque offroad ligero a moderado, peso contenido y llantas de radio medio/alto. Pensadas para caminos no asfaltados sin llegar a enduro extremo.
- `adventure`: orientación touring/larga distancia con offroad como capacidad secundaria. Mayor peso, depósitos grandes, ergonomía touring y equipamiento completo. Si una moto puede hacer un viaje largo con carga, entra aquí.
- `enduro`: especializado offroad técnico. Más ligero que trail/adventure, suspensión de largo recorrido y ergonomía de pie.
- `dual-sport`: concepto intermedio con enfoque legal/urbano pero con capacidad offroad real. Licencia y matriculación en mente.
- `sport-touring`: sport con ergonomía más cómoda y capacidad de carga para viaje. Mayor autonomía y protección que `sport`.
- `touring`: viaje puro. Prioriza confort del piloto y pasajero sobre cualquier otra cosa.
- `naked` / `hypernaked`: carenado mínimo o nulo. `hypernaked` se reserva para potencias altas con orientación muy deportiva.
- `sport` / `supersport`: carenado completo y orientación claramente deportiva. `supersport` se reserva para el extremo (>150 hp aprox., con énfasis en circuito).
- `scrambler`: estética offroad con base de moto urbana o naked. No necesariamente trail real.
- `cruiser` / `custom`: ergonomía relajada y estética cruiser. `custom` se reserva para modificaciones/preparaciones explícitas.
- `retro` / `neo-retro`: estética clásica con tecnología actual. `neo-retro` se reserva para reinterpretaciones modernas de plataformas clásicas.
- `scooter`: plataforma con plataforma plana y motor generalmente pequeño orientado a ciudad.

## Distinción `trail` vs `adventure` (deuda histórica de Fase 2)

Reglas operativas para evitar reclasificaciones a futuro sin evidencia clara:

- Una moto entra en `trail` cuando su enfoque principal es offroad ligero, peso contenido y autonomía media.
- Una moto entra en `adventure` cuando la promesa de producto es viaje largo con capacidad offroad, no al revés.
- Si una moto concreta está documentada como trail/adventure por su marca (ej. Transalp, Africa Twin, Ténéré 700, Tuareg 660, Multistrada, DesertX, V-Strom 800DE, Tiger, KLR, Himalayan), la clasificación actual de Fase 2 se mantiene como contrato:
  - `trail`: Ténéré 700, Tuareg 660, Transalp, Africa Twin, V-Strom 800DE, Tiger 900, KLR 650, Himalayan 450.
  - `adventure`: R 1300 GS, F 900 GS, DesertX, Multistrada V2, KTM 890 Adventure R, 800MT-X.
- Las reclasificaciones entre `trail` y `adventure` solo se aplican con evidencia técnica explícita (peso, depósito, suspensión, recorrido) o decisión editorial del fabricante en su naming oficial. No se cambia por feedback comunitario aislado.
- El script `mergeGeneratedMotorcycles.ts` ya reporta como sospechoso cualquier modelo con keywords trail/adventure que termine clasificado como `naked` (ej. CFMoto 800MT-X naked). Esa señal se preserva como guardrail.

## Decisión sobre `trail/adventure` para Fase 4

La frontera semántica entre `trail` y `adventure` queda como decisión de producto para Fase 4. Mientras tanto, la regla anterior sirve de contrato operativo. Cualquier ampliación del catálogo debe respetar la lista canónica de 16 segmentos y, ante duda entre `trail` y `adventure`, etiquetar como `trail` salvo evidencia clara de producto adventure.

## Capas y zonas a no romper

- Schema SQL: `motorcycle_segment` enum con los 16 valores. No añadir valores sin actualizar simultáneamente `BikeSegment` y `BIKE_SEGMENTS`.
- TypeScript: `BikeSegment` en `src/types/bike.ts` debe permanecer alineado con `BIKE_SEGMENTS`.
- Importers: `validateMotorcycleImport` y `normalizeMotorcycle` validan contra la misma fuente de verdad. Cualquier nueva validación de segmentos usa `isBikeSegment` o `BIKE_SEGMENTS`.
- UI pública compacta: `motorcyclePrimarySegmentFilters` y `motorcycleSegmentFilterOptions` exponen el subset compacto. `other` se mantiene como bucket UI-only y nunca se acepta como valor de `bike.segment` real.
- Datasets: `data/import/motorcycles.json` y derivados deben contener solo valores canónicos. El test de contrato falla si se introduce un segmento fuera de la lista.

## Guardrails activos

- `src/shared/motorcycles/motorcycleTaxonomy.contract.test.ts` valida alineación de `BIKE_SEGMENTS`, `BikeSegment`, enum SQL, `segmentLabels`, `segmentIcons` y dataset.
- `src/shared/filters/motorcycleFilterOptions.test.ts` valida la estrategia canónico vs visible y que `other` no sea nunca `BikeSegment`.
- `src/features/import/validateMotorcycleImport.test.ts` cubre rechazo de segmentos inválidos y de `other`.
- `scripts/mergeGeneratedMotorcycles.ts` reporta segmentos sospechosos en el merge report.
