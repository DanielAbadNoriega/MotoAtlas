# MotoAtlas — Product Roadmap

## 1. Propósito del documento

- Este documento **no sustituye Trello**.
- **Trello** se usa para gestión operativa diaria (ejecución y seguimiento).
- Este roadmap en Markdown es la **fuente estratégica dentro del repositorio**.
- Toda idea importante detectada en conversaciones puede registrarse aquí antes de convertirse en tarea operativa.

## 2. Estado base actual

Implementado (baseline actual):
- Fase A P1: helpers puros `reviewCommunityActions.ts`.
- Fase B P1: `useReviewReports`.
- Fase C P1: `useReviewReactions`.
- `FeaturedReviewCard` reutilizada en comunidad y modo visual.
- `MotorcycleGarageCard` extraída.
- `Útil N` como contador público visible siempre.
- Tests de referencia: `1117 passed`.
- Typecheck: clean.
- Rama estable más reciente: `feature/auth-baseline-audit` (auditoría de cierre Auth, solo documentación; sin cambios de schema/RLS/auth).

## 3. Foco inmediato recomendado

1. Rediseñar `Updates en vivo`.
2. Cerrar documentación/QA visual de filtros reutilizables y avanzar con la siguiente prioridad.
3. Revisar y cerrar taxonomía de categorías/segmentos de motos como base de catálogo.

## 4. P1 — UX pública / comunidad

### Insights en vivo

Estado: **implementado / cerrado** (rama `feature/live-insights-redesign`).

Objetivo cumplido: convertirlo en un bloque de descubrimiento comunitario.

Implementado:
- Quitados los weak metrics que proponía la lista de cambios:
  - `review con más kilómetros` (estaba en `SortOption` de garaje, no en insights; ya no se renderiza como insight).
  - `rating medio global` (nunca estuvo en insights; confirmado no presente).
- Reemplazados por los 4 signals comunitarios:
  - **Moto más comentada**: moto con más reviews aprobadas en el dataset cargado (orden secundario por `latestReviewAt` y nombre).
  - **Review más útil**: review con mayor `helpfulCount` (orden secundario por `rating`, fecha y nombre).
  - **Segmento más activo**: segmento canónico con más reviews, mostrado con label friendly de `segmentLabels`.
  - **Uso más activo**: `ridingStyle` con más reviews, mostrado con label friendly de `accountReviewRidingStyleLabels`.
- Conservador de datos: solo se alimenta de reviews `approved` (no `pending`/`rejected`/`hidden`). Polling suave cada 60 segundos. Copy del footer: "Datos aproximados · {refreshLabel} · Según reviews aprobadas" (sin reclamar realtime).
- Subtítulo/kicker reforzado: "Pulso de la comunidad · Actividad reciente" + subtítulo "Señales según reviews aprobadas, no en tiempo real".
- Título h2 preservado como "Insights en vivo" (compatibilidad con tests y otros consumidores); si en el futuro product copy decide renombrar a "Pulso de la comunidad" como h2, será un cambio puntual con su propio test.
- `Radar MotoAtlas / Pulso de la Comunidad` permanece como backlog P3/P4 (sección más ambiciosa con más señales y métricas). Este rediseño es el paso mínimo viable hacia esa dirección.

### Home — Reemplazo de `FeaturedBikes` / `BikeCard` (legacy temporal)

Estado: **implementado / cerrado**.

Objetivo:
- sustituir la sección legacy de Home (`FeaturedBikes` + `BikeCard`) por `FeaturedMachines`.

Implementado:
- `FeaturedMachines` es la nueva sección de Home.
- `FeaturedBikes` y `BikeCard` fueron eliminados.
- Contrato visual:
  - 3 cards: card 1 hero (16:9), cards 2 y 3 compactas full-background (4:5).
  - Imagen full-background con overlay/degradado en las 3 cards.
  - Badge `01`/`02`/`03` con text-shadow, sin solape con título.
  - Marca en blanco, modelo en rojo/acento.
  - Features: `Engine` (cc), `Power` (hp), `Torque` (nm).
  - CTAs: `Ver ficha` → `#/motos/[id]`, `Reviews` → `#/comunidad/[id]`.
  - Sin km/h, peso, PS, segmento, ADV READY, TC+ EVO, View Configurator.
  - Hover: scale en imagen, no en card.

Tests de referencia: `1012 passed`.

### Paridad visual de Podium rankings (`#/comunidad` vs `#/comunidad/rankings`)

Estado: implementado / cerrado.

Objetivo:
- alinear contenido entre ambos podios para evitar drift visual/semántico.

Aplicado:
- en `#/comunidad`, las podium cards 2 y 3 ya muestran el mismo span de metadatos que `#/comunidad/rankings` (`año · segmento · cilindrada`).

Nota de contrato actual:
- el metadato actual de podio es `año · segmento · cilindrada (cc)`.
- si en el futuro se quiere cambiar a potencia, debe abrirse como mejora UI separada con decisión explícita de producto.

### MotorcycleGarageCard en buscador

Estado: **implementado / cerrado**.

Implementado:
- `SearchPage` reutiliza `MotorcycleGarageCard` con adaptador local.
- `MotorcycleGarageCard` flexibilizada con `footerActions?: ReactNode`.
- `MotorcycleGarageCardAction` extraído como API formal de acciones de footer: owning clases internas (`motorcycle-garage-card__action`, `--primary`, `--secondary`, `__compare-action`). SearchPage y BikeDetailPage usan este helper en vez de injectar classNames manualmente.
- `MotorcycleGarageCard` sigue presentacional.
- Enlaces `Reviews` y `Ficha` operativos; `Ficha` mantiene `aria-label="Ver ficha técnica"`.
- Acciones compactas con patrón glass local `%motorcycle-garage-card-glass-action`.

Nota residual (señal comunitaria real):
- En buscador, `rating` y `reviewCount` derivan de `fiabilidad`/`reportCount`, no de señal comunitaria real.
- Este dato proviene de specs estáticas del importador, no de reviews aprobadas.
- Si en el futuro se renormalizan estos campos sin contrato de producto, podría generar confusión semántica.
- Queda pendiente como riesgo/no-bloqueante documentado.

## 5. P1/P2 — Sistema de filtros reutilizable

Estado: **implementado / cerrado en su fase de normalización base**.

La onda de migración a filtros compartidos está completa. La base reusable ya existe: el wrapper de grupo (`FilterGroup`) y el botón de opción (`FilterOptionButton`) están normalizados en `src/shared/ui/filters/` y son los componentes canónicos para nuevas páginas que necesiten filtros. La lógica de filtrado por dominio (search, community, admin, account) sigue viviendo en cada página o capa de dominio — el cambio solo normalizó la UI.

Trabajo futuro en filtros queda en el terreno de polish incremental (consolidación visual, unificación de CSS entre páginas, paneles completos si aportan valor), no en una nueva onda de migración base.

### Componentes compartidos implementados

- `src/shared/ui/filters/FilterGroup.tsx` + `FilterGroup.scss` — `<details>`/`<summary>` con `defaultOpen` configurable. Self-styled (`import './FilterGroup.scss'` directo).
- `src/shared/ui/filters/FilterOptionButton.tsx` — botón de opción con `classPrefix` configurable. Mantiene la convención de prefijos por página.
- `src/shared/ui/filters/FilterGroup.test.tsx` — 5 tests directos (título, children, `defaultOpen` expandido/colapsado, icono con Material Symbols).

### Páginas migradas al shared

- `AccountReviewsPage` (`#/cuenta/reviews`): filtros de marca/modelo, segmento, carnet, rating medio, uso principal y orden.
- `AccountMotorcycleReviewsPage` (`#/cuenta/reviews/[motorcycleId]`): filtros de rating y orden.
- `CommunityReviewsPage` (`#/comunidad/reviews`): grupos Segmento, Carnet, Rating, Uso principal, Orden.
- `SearchPage` (`#/buscador`): 10 grupos (Marca, Segmento, Carnet, Precio, Potencia, Peso, Altura asiento, Electrónica, Uso recomendado, Calidad de datos).
- `MotorcycleCommunityPage` (`#/comunidad/[motorcycleId]`): grupos Rating y Orden.
- `AdminPage` (`#/admin/moderacion`, `#/admin/reviews`, `#/admin/solicitudes`): 12 grupos/call sites con `classPrefix="admin-page"`.
- `AdminMotorcycleReviewsPage` (`#/admin/reviews/[motorcycleId]`): Estado y Orden con `classPrefix="admin-page"`.

### Componentes que quedan intencionalmente locales

`FilterOptionButton` y `FilterRatingStars` locales se preservan en `AccountReviewsPage`, `AccountMotorcycleReviewsPage`, `CommunityReviewsPage` y `MotorcycleCommunityPage` para mantener activos `__filter-option*`, `__filter-stars` y `__filter-star--filled`. No se migran al shared en este ciclo porque implicaría unificación de SCSS que excede el alcance de la normalización admin. Queda como polish futuro opcional, no como bloqueador.

Componentes `FilterPanel`, `ActiveFiltersBar`, `MobileFilterDrawer`, `FilterApplyFooter` permanecen como candidatos de polish si en el futuro se quiere elevar la experiencia de filtros (paneles completos, chips activos agregados, drawers mobile-first), no como pendientes del ciclo de normalización.

### Lógica de filtrado por dominio (sin cambio)

- `motorcycleSearchFilters`
- `communityReviewFilters`
- `adminReportFilters` / `adminReviewFilters`
- `accountReviewFilters`

Estas piezas siguen viviendo en cada página o capa de dominio. El ciclo de normalización solo tocó la UI reusable.

### Limpieza SCSS ya hecha

Resumen consolidado de las 3 limpiezas (no se repite el detalle completo arriba):

- Rama `feature/filtergroup-residual-scss-cleanup`: selectores huérfanos `__filter-group*` eliminados en `SearchPage.scss` y `CommunityReviewsPage.scss`. Selectores activos preservados. Corrección de layout en `SearchPage.scss:115` aceptada por producto.
- Rama `feature/motorcycle-community-filtergroup`: selectores huérfanos `__filter-group*` eliminados en `MotorcycleCommunityPage.scss`. Selectores activos (`__rating-grid`, `__sort-grid`, `__filter-option*`, `__filter-stars`, `__filter-star--filled`) preservados.
- Rama `feature/admin-filtergroup-normalization`: selectores huérfanos `admin-page__filter-group*` y `admin-page__filter-options--pills` + `admin-page__filter-option--pill*` eliminados. Preservados: `admin-page__filter-options` (grid 2-col), `admin-page__filter-option`, `admin-page__filter-option--active`, icon styles. `FilterGroup.scss` sigue siendo dueño único del wrapper.

### Contexto histórico (superseded)

La rama `feature/admin-filtergroup-audit` recomendó inicialmente no migrar admin al `FilterGroup` compartido. Razones registradas: estado abierto/cerrado controlado externamente, genéricos tipados, icono por opción, accesibilidad estricta (`inert` + `aria-hidden`), grids por grupo, y tests atando estructura concreta. **Esta decisión quedó superada** por la decisión de producto posterior de la rama `feature/admin-filtergroup-normalization`, que sí normalizó admin al shared. Admin ya no usa `AdminFilterGroup`, `AdminFilterOptionButton` ni `FilterChipButton`. La auditoría inicial se conserva aquí solo como contexto histórico; el estado vigente es el de la normalización final.

### Quality Gate de la normalización

- `npm run typecheck` → clean.
- `npm run test` → 1097 / 1097 pasando (baseline histórico de ese cierre).

### BikeDetailPage — Reorganización por tabs

Estado: **Fases 1, 2, 2C, 2C-B, 3A, 3B, 4.1, 4.2, 4.3A, 4.3B, 4.3C, 5.1, 5.2 y 5.3 implementadas**.

Decisión de producto:
- La `BikeDetailPage` actual se mantiene como base.
- El objetivo no es rediseñar toda la landing, sino reorganizar secciones existentes en tabs.
- Solo la pestaña `Especificaciones` usará diseño nuevo de Stitch tipo "Ficha Técnica Rápida".
- El resto de tabs reutilizarán secciones existentes con ajustes progresivos.
- Se trabaja por fases para evitar megatarea.
- Sin tab `Metodología` (existe `#/metodologia`).

Ruta afectada: `#/motos/[moto-id]`

Tabs definitivas:
1. `Resumen` — secciones riding + fit (existentes).
2. `Especificaciones` — diseño técnico premium desde Stitch (nuevo).
3. `Comunidad` — mini resumen + reliability + reviews adaptadas.
4. `Comparar` — related + MotorcycleGarageCard + acciones comparador.

Estado por fase:
1. **Fase 1 — Estructura de tabs + tab Resumen**: implementada. tabs accesibles (4), Resumen activo por defecto, riding + fit movidos a Resumen.
2. **Fase 2 — Tab Especificaciones**: **implementada**.
   - Componente `SpecificationsTab` con bento grid de `SpecCard`.
   - 8 cards base: Motor (cc), Potencia (HP), Torque (NM), Peso (KG), Altura asiento (MM), Depósito (L), Carnet, Precio.
   - Card electrónica: solo features activas filtradas con `filter(([, isEnabled]) => isEnabled)`, no renderiza `false`.
   - Card A2: solo si `isA2Compatible` o `isA2LimitedVersion`; muestra badge y versión limitada. Usa icono `license` (no `a2` como key independiente).
   - Precio: `isPendingPrice` → `pendingPriceLabel` si `priceEur <= 0` o `source = placeholder`. Nunca `0 €`.
   - Diseño inspirado en Stitch/specs.html: bento grid, border sutil, hover, adaptado a SCSS/MotoAtlas.
   - No se muestran suspensiones/frenos/neumáticos (no existen en modelo Bike).
   - Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile.
3. **Fase 2C — Specs detalladas dentro de Especificaciones tab**: **implementada**.
   - La vieja `section.bike-detail__specs` fue eliminada del flujo principal.
   - Extended specs vive dentro de `SpecificationsTab`, debajo del bento grid de SpecCards.
   - Heading: `Especificaciones ampliadas`.
   - Copy: `Detalles técnicos y equipamiento específico del modelo.`
   - Grupos: Motor & transmisión, Chasis & ergonomía, Mercado & registro.
   - Reutiliza `getSpecGroups(bike)` existente.
4. **Fase 2C-B — Tests de specs detalladas**: **implementada**.
   - 5 tests añadidos cubriendo heading, copy, grupos detallados, invisibilidad antes de abrir tab y ausencia de sección residual.
5. **Fase 3A — Iconos técnicos compartidos**: **implementada**.
   - Módulo compartido: `src/shared/motorcycles/motorcycleTechnicalIcons.ts`.
   - Exporta: `motorcycleTechnicalIconMap` (18 keys), `MotorcycleTechnicalIconKey`, `getMotorcycleTechnicalIcon(key)`.
   - Keys de specs: engine, power, torque, weight, seatHeight, fuelTank, license, price.
   - Keys de aspectos de reviews: ergonomics, consumption, braking, suspension, electronics, aerodynamics, passenger, maintenance, design.
   - `a2` NO es una key; A2 es variante/estado dentro de `license`. El bloque A2 usa `getMotorcycleTechnicalIcon('license')`.
   - Tests dedicados en `src/shared/motorcycles/motorcycleTechnicalIcons.test.ts`.
   - `specIconMap` local eliminado de BikeDetailPage.tsx.
6. **Fase 3B — Migración de iconos en ReviewModal/review form**: implementada. `technicalAspects` ahora usa `getMotorcycleTechnicalIcon(category)` del módulo compartido. Sin iconos hardcodeados. `consumption` → `local_gas_station`. `ReviewAspectSummary` pendiente de coordinación futura si aplica.
7. **Fase 4 — Tab Comunidad** (implementada en sub-fases):

   - **4.1 — Tab Comunidad local**: tab local creada en BikeDetailPage, placeholder eliminado, mini comunidad summary con average rating, review count, confidence shield y empty state seguro.
   - **4.2 — Fiabilidad dentro de la pestaña**: `bike-detail__reliability` movido a CommunityTab, copy conservadora, common issues solo si `reportCount > 0`, empty state seguro ("Sin reportes de fiabilidad todavía.").
   - **4.3A — Compact variant de FeaturedReviewCard**: soporte de props `hideImage` y `hideLinks`, defaults preservan comportamiento existente.
   - **4.3B — Reviews dentro de la pestaña**: `bike-detail__reviews` movido a CommunityTab, usa FeaturedReviewCard con `hideImage` + `hideLinks`, sin "Más reviews" / "Ver ficha", "Escribir review" abre ReviewModal, MotorcycleReviewCard eliminada de BikeDetailPage.
   - **4.3C — Acciones de comunidad seguras en BikeDetailPage**: `FeaturedReviewCardCommunityActions` extraída, `Útil N` visible como contador público, sin acciones falsas/no-op, no-auth: `Útil N` pasivo sin "No útil" ni "Reportar" ni "Responder", own review: `Útil N` pasivo + chip "Propia", reported bloquea reacciones, `Reportar` no renderiza sin handler real, `Responder` no existe en BikeDetailPage.
   - **4.4 — Acciones seguras en RecentReviews de `#/comunidad`**: TopRatedMotorcyclesPage conecta `FeaturedReviewCardCommunityActions` con Helpful/NotHelpful real, `Útil N` público pasivo en no-auth, chip "Propia" en own review, reported bloquea. Report/Reply no cableados en esta fase. `getReviewReactionSummary` mocked en tests.

   Pendiente de Fase 4:
   - Cableado completo de Report/Reply en BikeDetailPage (si se desea en el futuro).
   - Cableado completo de Report/Reply en TopRatedMotorcyclesPage RecentReviews (si se desea en el futuro).

   Reglas de Fase 4:
   - Sin acciones fake/no-op en la ficha de moto.
   - `Útil N` es contador público siempre visible.
   - No-auth: interacción nula con reacciones.
   - Reported review bloquea reacciones del usuario.
   - `Reportar` solo renderiza si existe handler real.
   - `Responder` no renderiza en BikeDetailPage hasta tener flujo completo.
8. **Fase 5.1 — CompareTab local con related bikes**: **implementada**.
    - Componente `CompareTab` local en BikeDetailPage.tsx.
    - Related bikes (mismo segmento, excluye actual, max 3) dentro del tab Comparar.
    - Empty state: `Sin modelos relacionados del mismo segmento por ahora.`
9. **Fase 5.2 — Acciones reales de comparador en CompareTab**: **implementada**.
    - Botones reales: `Comparar`, `Ya en comparador`, `Comparador lleno`.
    - Infraestructura de compare queue reutilizada: `loadCompareQueue`, `saveCompareQueue`, `compareQueueMaxSize`, `getNextCompareSelection`.
    - `saveCompareQueue` dispensa el evento de sync automáticamente; no se añade evento custom en BikeDetailPage.
    - Sin botones fake/no-op.
    - Sin ids duplicados en cola; máximo 3 respetado.
10. **Fase 5.3 — CompareTab con MotorcycleGarageCard**: **implementada**.
    - CompareTab ahora usa `MotorcycleGarageCard` directamente para cada related bike.
    - Sin cambios en `MotorcycleGarageCard`; no se añadieron props nuevas.
    - Acciones de comparador inyectadas via `footerActions` (botón Comparar/Ya en comparador/Comparador lleno).
    - Rating y reviewCount usan proxy pattern (reliabilityScore / 2 y reportCount) — no son señal comunitaria real.
    - 8 tests nuevos cubriendo render de MotorcycleGarageCard, estados de botón, persistencia en cola y link Ver ficha.

Reglas transversales:
- no ampliar schema/modelo `Bike` salvo decisión explícita.
- no renderizar `null`/`undefined`; usar fallbacks controlados.
- no copiar CSS de `ReviewModal`.
- `FeaturedReviewCard` en Comunidad: sin imagen, sin CTAs redundantes, acciones seguras (no fake/no-op).
- `FeaturedReviewCardCommunityActions`: componente reutilizable para acciones de comunidad en FeaturedReviewCard.
- `MotorcycleGarageCard` sigue presentacional en Comparar: las acciones se inyectan mediante footerActions y la lógica de compare queue permanece en BikeDetailPage.
- Mobile: responsive funcional, refinados premium pospuestos a fase mobile-first.

Riesgos documentados:
- Precio delicado por promociones/variantes; fallback `Precio pendiente` si no hay dato fiable.
- Fiabilidad/problemas frecuentes requiere contrato de datos claro antes de claims fuertes.
- `FeaturedReviewCard` debe adaptarse sin acciones falsas.
- Fase 5 comparador no debe duplicar lógica existente de compare queue.

Relación con roadmap:
- conecta con revisión global UI/SCSS (fase 13 P3/P4).
- conecta con sistema de filtros reutilizable.
- conecta con Admin catálogo/modelos (faltas de datos).
- puede alimentar mejor comparador y SEO técnico.
- fase mobile-first independiente posterior.

Secciones residuales cerradas:
- `bike-detail__specs` old → eliminada del flujo principal; specs detalladas dentro de Especificaciones tab (Fase 2C).
- `bike-detail__reliability` → movido a CommunityTab (Fase 4.2).
- `bike-detail__reviews` → movido a CommunityTab (Fases 4.3B/4.3C).
- `bike-detail__related` → integrado en CompareTab (Fases 5.1/5.2).
- `bike-detail__quick-specs` y `bike-detail__features` → parcialmente absorbidas por SpecificationsTab y, en rama `feature/bike-detail-technical-spec-cards`, cerradas con extracción de `TechnicalSpecCard` a `src/components/motorcycles/TechnicalSpecCard/`.

## 6. P2 — Plataforma/Admin/Productividad interna

Este bloque agrupa herramientas internas y bases de plataforma necesarias para escalar MotoAtlas sin depender de edición manual.

### Tarea transversal: Taxonomía de segmentos de motos

Estado: base cerrada (F0/F1/F2/F3/F3.1). Fase 4 SEO/Admin/landings queda pendiente como fase futura separada.

Fases de cierre (estado actualizado):
- Fase 0 — Auditoría inicial: **cerrada**.
- Fase 1 — Guardrails/tests de contrato: **cerrada**.
- Fase 2 — Saneo puntual de datos y clasificaciones dudosas: **aplicada** (caso `cfmoto-800mt-x-2025` corregido en su día; criterio operativo `trail` vs `adventure` documentado en `docs/taxonomy-decisions.md`).
- Fase 3 — Auditoría de estrategia final de filtros: **cerrada**.
- Fase 3.1 — Formalización de estrategia final (`canónico vs visible`) y criterios de exposición: **cerrada**.
- Fase 2 extendida — Cierre de taxonomía base (rama `feature/motorcycle-taxonomy-closure`):
  - `BIKE_SEGMENTS` confirmado como fuente única de verdad de los 16 segmentos.
  - `segmentIcons` añadido al mismo módulo compartido para centralizar label e icono por segmento.
  - `validateMotorcycleImport` rechaza explícitamente segmentos fuera de la taxonomía canónica y el bucket UI `other`.
  - Decisiones operativas (incluida la regla para `trail` vs `adventure`) documentadas en `docs/taxonomy-decisions.md`.
  - Guardrails reforzados en `motorcycleTaxonomy.contract.test.ts` (cobertura de iconos, dataset, schema, TS, labels).
- Fase 4 — SEO/Admin/landings por categoría: **pendiente** (futuro, no se aborda en este ciclo).

Caso aplicado en Fase 2:
- `cfmoto-800mt-x-2025`: `segment` corregido de `naked` a `trail` por warning explícito del merge report (modelo apuntaba a `trail/adventure`).
- La frontera semántica `trail` vs `adventure` queda como deuda de producto para Fase 4 (criterio operativo documentado en `docs/taxonomy-decisions.md` para evitar reclasificaciones a futuro sin evidencia clara).

Resultado de Fase 3 (auditoría):
- Recomendación estratégica: **híbrida**.
- Mantener ahora UI pública compacta con `primary + other`.
- Conservar taxonomía canónica de 16 segmentos como fuente de verdad.
- No abrir 16 chips públicos en buscador/comunidad/cuenta/admin hasta tener cobertura de catálogo suficiente y criterios claros de UX.
- Hallazgo clave: hoy ya existe estrategia mixta (compacto en varias vistas y 16 explícitas en rankings), por lo que Fase 3.1 debe cerrar ese drift de forma deliberada.

Implementado en Fase 3.1:
- Contrato formal `segmento canónico` vs `grupo visible`.
- Segmento canónico: 16 `BIKE_SEGMENTS`.
- Grupo visible: `all`, segmentos primarios y `other`.
- `other` formalizado como bucket UI-only (no segmento real).
- Mapping formalizado:
  - primarios → sí mismos;
  - secundarios → `other`;
  - grupos visibles → targets canónicos válidos.
- Estrategia compacta reusable centralizada sin abrir 16 chips públicos.
- Guardrail UI legacy aplicado en `BikeCard`:
  - evita render de slug crudo (`bike.segment`);
  - muestra label amigable desde `segmentLabels` con fallback controlado.

Pendiente de Fase 4:
- admin catálogo con 16 categorías explícitas;
- landings SEO por categoría;
- decisión final `trail` vs `adventure` con contrato de producto (criterio operativo ya documentado en `docs/taxonomy-decisions.md` para no romper en el interim).

Objetivo:
Cerrar una taxonomía clara de segmentos para que el catálogo sea coherente y escalable.

Categorías esperadas:
- trail
- adventure
- touring
- sport-touring
- naked
- sport
- supersport
- hypernaked
- enduro
- dual-sport
- scrambler
- custom
- cruiser
- retro
- neo-retro
- scooter

Zonas a revisar:
- `supabase/schema.sql`
- `src/shared/motorcycles/motorcycleTaxonomy.ts`
- `src/types/bike.ts`
- `src/features/import/*`
- `scripts/importMotorcycles.ts`
- `src/utils/motorcycleSearch.ts`
- `data/import/motorcycles.json`
- filtros del buscador
- cards/ficha/comparador donde se renderiza segmento

Comprobar:
- no duplicados ambiguos
- labels visibles claros
- iconos coherentes
- filtros funcionando
- mobile sin saturación
- motos actuales bien clasificadas
- schema/TS/importador/UI sincronizados

Resultado esperado:
- taxonomía documentada
- fuente de verdad clara
- preparada para buscador, filtros, comparador, SEO, rankings y landings

Relación con roadmap:
- dependencia del sistema de filtros reutilizable
- dependencia del futuro admin catálogo/modelos
- base para futuras landings SEO por categoría
- debe cerrarse antes de ampliar fuerte el catálogo

Guardrails ya implementados en Fase 1:
- contrato de 16 categorías esperadas en `BIKE_SEGMENTS`.
- alineación de `BikeSegment` y enum SQL `motorcycle_segment`.
- cobertura de `segmentLabels`.
- validación de dataset sin segmentos inválidos.
- contrato de filtros actual `primary + other` (`other` como bucket UI, no segmento real).

### Admin catálogo de modelos

Estado: pendiente.

Objetivo: evitar edición manual de JSON.

Alcance propuesto:
- listado de motos
- búsqueda/filtros
- creación/edición de modelos
- edición de datos técnicos
- edición de fuentes/source
- estado de completitud
- `image_locked` / `description_locked`
- validaciones

### Admin imágenes de modelos

Estado: pendiente.

Alcance propuesto:
- subida/gestión de fotos
- previsualización
- marcar imagen como manual
- bloquear imagen
- normalización/sync mediante backend o edge functions protegidas

Reglas críticas:
- El frontend **NO** ejecuta scripts con claves sensibles.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY`.

### Automatización avanzada del pipeline de imágenes

Estado:
- backlog estratégico / futuro.

Objetivo:
Evolucionar el pipeline actual de imágenes para mejorar rendimiento, SEO, maquetación responsive y escalabilidad del catálogo.

Base actual:
- imágenes locales por `motorcycle.id`;
- normalización a WebP;
- sync de `image_url` / `image_source`;
- respeto de `image_locked`;
- dry-run en scripts de normalización/sync.

Mejoras previstas:
- generar thumbnails;
- generar variantes desktop/mobile;
- optimización Lighthouse;
- validación de dimensiones;
- compresión avanzada;
- detectar imágenes mal nombradas;
- detectar imágenes sin correspondencia con `motorcycle.id`;
- marcar correctamente `image_source`;
- proteger `image_locked`;
- generar reportes de imágenes pendientes, inválidas o mejorables.

Reglas:
- no sobrescribir imágenes con `image_locked=true`;
- no degradar imágenes manuales curadas;
- no ejecutar tareas pesadas/sensibles desde frontend público;
- mantener dry-run antes de aplicar cambios;
- cualquier ejecución desde admin debe pasar por backend/edge functions protegidas;
- nunca exponer `SUPABASE_SERVICE_ROLE_KEY`.

Relación con roadmap:
- conecta con Admin imágenes de modelos;
- conecta con Admin catálogo/modelos;
- conecta con rendimiento/Lighthouse;
- conecta con SEO técnico;
- conecta con revisión global UI/SCSS;
- prepara catálogo escalable con imágenes consistentes.

Criterios de aceptación futuros:
- thumbnails generados correctamente;
- variantes desktop/mobile disponibles si se decide implementarlas;
- dimensiones inválidas reportadas;
- imágenes mal nombradas detectadas;
- `image_source` coherente;
- `image_locked` respetado siempre;
- Lighthouse no empeora y, si procede, mejora;
- `npm run typecheck` pasa;
- `npm run test` pasa.

### Admin tareas internas seguras

Estado: pendiente.

Alcance propuesto:
- validación de datos incompletos
- dry-run de importaciones/sync
- ejecución de tareas de mantenimiento desde backend protegido
- mostrar resultados en UI admin

### Admin/moderación base

Estado:
- mayoritariamente implementado / pendiente de auditoría residual.

Implementado:
- rutas admin separadas de cuenta;
- admin protegido por sesión + rol;
- dashboard admin base (`#/admin`);
- `#/admin/moderacion`;
- reportes de reviews;
- estados de reporte;
- acciones sobre reviews desde reportes;
- `#/admin/reviews`;
- agrupación de reviews por moto;
- `#/admin/reviews/[motorcycleId]`;
- acciones aprobar/ocultar/rechazar;
- tab de respuestas pendientes de moderación.

`#/admin/solicitudes` (rama `feature/admin-requests-audit`):
- **auditado** funcionalmente. Sin cambios de código. Typecheck clean, 1097 tests passing.
- Capacidades ya implementadas y verificadas en auditoría:
  - ruta `#/admin/solicitudes` operativa y separada de cuenta.
  - admin protegido por sesión + rol (`isAdmin`).
  - listado de solicitudes con `getAllModelRequests` (autenticado como admin).
  - filtros laterales `Estado` (Todas, Pendientes, Revisadas, Aprobadas, Rechazadas), `Origen` (Todas, Usuario, Admin, Import) y búsqueda libre por marca o modelo.
  - sidebar admin con quick links a Panel admin, Moderación, Reviews, Solicitudes, Mi cuenta.
  - cards expandibles (`AdminRequestCard`) con detalle de Marca, Modelo, Año, Segmento, Origen, Usuario, Email de contacto, Página oficial/fuente y Comentario.
  - badge de estado (`Pendiente`, `Revisada`, `Aprobada`, `Rechazada`) y fecha en formato `DD MMM YYYY` (`es-ES`).
  - acciones admin: `Marcar revisada`, `Aprobar`, `Rechazar` (deshabilitadas si la solicitud ya está en ese estado o si hay una acción en curso).
  - update de estado a través de `updateModelRequestStatus` con feedback de éxito/error.
  - RLS vigente verificada: anon insert solo `pending`/`user`/`user_id null`; authenticated insert solo con `user_id = auth.uid()`; authenticated users leen solo sus propias solicitudes; admins leen todas; admins actualizan solo `status`.
- Rutas paralelas verificadas:
  - `#/solicitar-modelo` para envío público (anónimo o autenticado).
  - `#/cuenta/solicitudes` para que el usuario autenticado vea sus propias solicitudes.
- Gaps detectados en auditoría (no son bloqueantes en ese momento; varios quedaron cerrados en Fase 1 descrita más abajo):
  - sin paginación específica de admin (la lista se carga completa y se renderiza de forma lineal; el contrato backend actual no exige paginación).
  - sin filtro por rango de fechas.
  - sin contador dedicado de pendientes en hero/lista.
  - sin detección de duplicados (mismo `brand`+`model`+`year`).
  - sin `in_review`, `duplicate`, `created` en el enum de estados actual.
  - sin `motorcycle_id` que vincule la solicitud a una moto creada.
  - sin notas internas o motivo de rechazo visibles para el solicitante.
  - sin flujo de creación de moto a partir de solicitud aprobada.
  - sin notificaciones al solicitante.
  - `segment` sin validación defensiva contra `BIKE_SEGMENTS` en el service (el form público ya usaba el selector canónico, pero el endpoint no rechazaba payloads manipulados).
  - sin acciones en lote sobre múltiples solicitudes.

`#/admin/solicitudes` — Fase 1 (rama `feature/admin-requests-phase-1`):
- Estado: **implementada / cerrada** (sin cambios de schema/RLS).
- Mejoras funcionales aplicadas sobre la base auditada:
  - **Filtros multi-select** de `Estado` y `Origen`: el admin puede combinar varios estados o varios orígenes a la vez. La opción `Todas` se mantiene y significa "sin filtro"; al click en `Todas` se limpian los específicos; al activar un estado/origen específico, `Todas` se desactiva.
  - **Filtro por rango de fechas** (`createdFrom` / `createdTo`) con dos inputs `type="date"`. La fecha se interpreta como día completo (`YYYY-MM-DD`): `createdFrom` se envía como `T00:00:00.000Z` y `createdTo` como `T23:59:59.999Z` para evitar excluir solicitudes del día final. Inputs vinculados con `min`/`max` para evitar invertir el rango.
  - **Paginación** de la lista con `REQUESTS_PER_PAGE = 10` (consistente con patrón admin de reportes) usando el componente compartido `AccountPagination`. Cambiar filtros/búsqueda/fechas resetea automáticamente a página 1. Si el dataset cabe en una sola página no se renderiza el paginador.
  - **Summary** (`admin-page__results-summary`) con `aria-live="polite"` que muestra total cargado, pendientes y rango visible. Etiqueta `solicitudes cargadas` (no "totales" ni claims de backend), porque refleja el dataset cargado por la página, no el total absoluto de la base.
  - **Validación defensiva de `segment` en el service** (`createModelRequest`): un valor vacío o compuesto solo por espacios se normaliza a `null`; un valor no vacío fuera de `BIKE_SEGMENTS` se rechaza antes de llamar a red; un segmento canónico válido se preserva en el payload. Esto blinda el endpoint público sin romper el selector nativo de `#/solicitar-modelo` (que ya usa las 16 categorías canónicas).
- Servicio (`src/services/modelRequestService.ts`):
  - `ModelRequestFilters` extendidos con `statuses?: readonly ModelRequestStatus[]`, `sources?: readonly ModelRequestSource[]`, `createdFrom?: string`, `createdTo?: string`. Compatibilidad mantenida con los filtros singulares legacy (`status`, `source`) si llegan solos.
  - `getAllModelRequests` aplica `in.(...)` cuando hay varios valores y `eq.X` cuando hay uno solo. Arrays vacíos omiten el filtro. Date range se traduce a `created_at.gte.X` / `created_at.lte.X` (o `and=(created_at.gte.X,created_at.lte.Y)` cuando hay ambos). Inputs inválidos se ignoran sin error.
  - Sanitización interna con `sanitizeAdminStatuses` / `sanitizeAdminSources` para tolerar valores inesperados.
- Quality Gate: `npm run typecheck` clean, `npm run test` 1117 / 1117 pasando.
- Pendientes fuera de alcance de Fase 1 (Fase 2/3/4 sin cambios estructurales):
  - `motorcycle_id` para vincular solicitud con moto del catálogo (requiere decisión de schema).
  - nuevos estados `in_review`, `duplicate`, `created` (requieren migración).
  - creación de moto a partir de solicitud aprobada.
  - notificaciones al solicitante (backend/edge/email, sin service role key en frontend).
  - detección de duplicados por `brand`+`model`+`year` con índice si se decide.
  - acciones en lote (bulk) sobre múltiples solicitudes.
  - notas internas y motivo de rechazo visibles para el solicitante.
- Admin catálogo de modelos (P2) se mantiene como fase futura separada y solo convergerá con solicitudes a partir de Fase 2.

Pendientes residuales (no asociados a la auditoría de solicitudes):
- avisos al autor;
- auditoría específica de moderación de respuestas:
  - aprobar/ocultar/rechazar respuestas;
  - reportes de respuestas si existen;
  - estados de respuestas;
  - permisos admin;
  - cobertura de tests.

Reglas:
- no reabrir la Fase 2.5 como greenfield;
- cualquier mejora admin debe empezar con auditoría focal;
- no tocar RLS/schema/admin sin decisión explícita;
- mantener separación mental y de rutas:
  - `#/cuenta` usuario normal;
  - `#/admin` administración.

### Auth baseline y cuentas de usuario

Estado: auditoría de cierre completada / baseline funcional con gaps P1/P2 previos a capa social.

Objetivo:
Consolidar autenticación para que reviews, solicitudes de modelos y acciones comunitarias queden asociadas a usuarios reales cuando exista sesión.

Base verificada:
- Supabase Auth.
- Login / registro / logout.
- sesión persistente con `AuthProvider` / `useAuth`.
- perfil básico (`profile`).
- rol admin (`isAdmin`).
- rutas `#/login` y `#/registro`.
- admin protegido por sesión + rol.
- reviews autenticadas vinculadas por `auth.uid()` desde RPC; solicitudes/reacciones/reportes alineados con `user_id` + RLS.
- cuenta lee reviews/solicitudes propias con token; anonymous puede navegar y solicitar modelo, pero no interactuar ni acceder a cuenta/admin.
- roles `user/admin` confirmados; `isAdmin` deriva de perfil y RLS usa `public.is_admin()`.

Gaps detectados antes de social/gamificación:
- **P1:** `ReviewModal` siempre usa `create_motorcycle_review_with_aspects`, RPC autenticada; el envío anónimo efectivo falla aunque schema, `createReview` y el test mockeado sugieren que está permitido. Requiere decisión sobre aspectos anónimos antes de tocar código/schema.
- **P2:** `onAuthStateChange` no representa con `isLoading` la resolución asíncrona de perfil; puede haber estado transitorio `profile=null`/`isAdmin=false`.
- **P2:** el alias de review autenticada se pasa como `p_user_name` desde cliente; antes de identidad pública/reputación debe derivarse o validarse server-side.
- **P2:** smoke E2E/RLS real en staging y auditoría de privilegios efectivos de funciones `security definer`.
- **P2:** migración incremental de 10 suites con `mockAuth` local a fixtures centrales.
- **P3 polish:** armonizar no-auth pasivo entre páginas; `MotorcycleCommunityPage` conserva acciones clicables con tooltip y bloqueo antes de red.

Plan recomendado:
1. cerrar decisión/tests de review anónima, transición de perfil y hardening verificable;
2. migrar fixtures + smoke staging;
3. preparar recuperación de cuenta, identidad y privacidad;
4. solo después habilitar capa social/gamificación/notificaciones.

### Personalización de emails de Supabase Auth

Estado:
- backlog futuro / no bloqueante para MVP.

Objetivo:
Personalizar los correos automáticos de Supabase Auth para que encajen con la identidad visual de MotoAtlas y ofrezcan una experiencia más cuidada desde el registro, confirmación y recuperación de cuenta.

Emails a contemplar:
- confirmación de cuenta;
- recuperación de contraseña;
- magic link si se usa en el futuro;
- otros correos transaccionales de auth si Supabase los permite.

Requisitos:
- textos en castellano;
- tono claro, premium y coherente con MotoAtlas;
- diseño dark/premium inspirado en la marca;
- jerarquía clara: logo/nombre, mensaje principal, CTA, texto de ayuda y aviso de seguridad;
- compatible con clientes de email;
- respetar las limitaciones HTML/CSS de Supabase Auth templates.

Flujo recomendado:
1. diseñar primero la propuesta visual en Google Stitch;
2. revisar estilo, copy y jerarquía;
3. adaptar después con Codex/OpenCode a HTML email compatible;
4. validar limitaciones reales de Supabase Auth;
5. probar confirmación, recuperación y enlaces en entorno seguro.

Reglas:
- no bloquear MVP por esta tarea;
- no introducir lógica de auth nueva solo por personalizar emails;
- no incluir datos sensibles innecesarios en el email;
- no depender de CSS complejo no soportado por clientes de correo;
- no usar assets externos inestables;
- mantener fallback legible si el cliente de correo bloquea estilos o imágenes.

Relación con roadmap:
- conecta con Auth baseline;
- conecta con identidad visual premium de MotoAtlas;
- conecta con futura capa social/comunidad;
- mejora confianza del usuario en registro, recuperación y acceso.

Criterios de aceptación futuros:
- email de confirmación personalizado y probado;
- email de recuperación personalizado y probado;
- textos en castellano revisados;
- HTML compatible con Supabase Auth;
- enlaces de auth funcionando correctamente;
- diseño legible en clientes de correo comunes;
- no se rompe el flujo de login/registro/recuperación;
- `npm run typecheck` pasa;
- `npm run test` pasa si hay cambios en repo.

### Fixtures de usuarios y perfiles para tests de auth

Estado:
- implementado parcialmente / base de fixtures central implementada.

Objetivo:
Crear fixtures y mocks locales para testear autenticación, roles, perfiles, Mi cuenta y acciones asociadas a usuario sin depender de Supabase real.

Implementado (base):
- fuente central en `src/test/fixtures/auth.ts`;
- factories con overrides (`createAuthUser`, `createUserProfile`, `createSession`, `createAuthSnapshot`, `createAuthState`);
- fixtures de referencia para:
  - usuario autenticado normal;
  - usuario admin;
  - usuario sin `display_name`;
  - usuario con `avatar_url`;
  - usuario sin avatar;
  - usuario no autenticado;
  - perfil básico completo;
  - perfil incompleto;
  - sesión mock;
- cobertura de contrato en `src/test/fixtures/auth.test.ts`;
- migración inicial en `src/components/pages/AuthPage/AuthPage.test.tsx`.

Pendiente residual:
- migrar de forma incremental mocks `useAuth` repetidos en otros tests (Account*, Community*, ReviewModal, StaticInfoPages, Admin*), sin refactor masivo.

Debe seguir cubriendo fixtures para:
- usuario autenticado normal;
- usuario admin;
- usuario sin `display_name`;
- usuario con `avatar_url`;
- usuario sin avatar;
- usuario no autenticado;
- perfil básico completo;
- perfil incompleto;
- sesión mock.

Áreas que deben poder testearse:
- `AuthProvider`;
- `useAuth`;
- Navbar con/sin sesión;
- Login;
- Register;
- Mi cuenta;
- rutas protegidas;
- admin protegido por rol;
- reviews asociadas a usuario;
- futuras acciones comunitarias con permisos.

Reglas:
- no depender de Supabase real en tests;
- no usar claves reales;
- mantener fixtures pequeños, estables y legibles;
- usar factories con overrides cuando sea posible;
- separar usuario, perfil y sesión para poder componer casos;
- evitar duplicar mocks de auth por test;
- preparar casos para user/admin/no-auth.

Relación con roadmap:
- ayuda a cerrar auditoría de auth baseline;
- prepara futuras pruebas de capa social;
- reduce fragilidad en tests de cuenta/admin/reviews;
- facilita validar roles y permisos.

Criterios de aceptación futuros:
- existe y se mantiene una fuente clara de fixtures de auth/perfiles/sesión;
- tests pueden simular usuario normal, admin y no autenticado;
- tests pueden simular perfiles incompletos;
- migración incremental de suites clave sin romper cobertura;
- `AuthProvider`/Navbar/Login/Register/Mi cuenta pueden testearse sin Supabase real;
- `npm run typecheck` pasa;
- `npm run test` pasa.

### Control de datos demo por entorno

Estado:
- source policy central: implementada/documentada.
- toggle admin: pendiente futuro.

Contrato:
- producción solo puede mostrar `source='user'`.
- producción nunca debe mostrar `source='seed'` ni `source='mock'`.
- dev/pre con demo activado puede mostrar `source='user'`, `source='seed'`, `source='mock'`.
- dev/pre con demo desactivado debe mostrar solo `source='user'`.

Definiciones:
- `source='user'`: datos reales creados por usuarios.
- `source='seed'`: datos demo controlados insertados mediante SQL.
- `source='mock'`: datos generados desde código/JSON mock.

Reglas:
- la lógica debe permanecer centralizada.
- no duplicar filtros de source en componentes.
- las vistas públicas deben seguir usando solo `status='approved'`.
- `pending`, `hidden` y `rejected` no deben aparecer en vistas públicas.
- cuenta/admin/moderación pueden tener reglas distintas si el contrato lo exige.

Pendiente futuro:
- crear toggle admin “Incluir datos demo”.
- visible solo en dev/pre.
- en producción no visible o sin efecto.
- nunca exponer datos mock/seed en producción pública.

Relación con roadmap:
- conecta con generador de reviews mock realistas.
- conecta con validación visual/maquetación.
- conecta con datos demo seguros.
- conecta con admin/productividad interna.

## 7. P2 — Datos demo / QA visual

### Mejorar generador de reviews mock realistas

Estado:
- pendiente / backlog técnico útil.

Objetivo:
Mejorar el generador de reviews mock para que los datos de prueba parezcan más reales y ayuden a validar maquetación, cards, rankings, garaje, fichas y bloques editoriales de comunidad.

Problema actual (validación de repo):
- el generador actual ya fuerza `pros`/`cons` como arrays y mantiene `source='mock'`, pero la riqueza de contenido todavía es limitada para QA visual exigente;
- hay comentarios cortos o plantillas repetidas en parte del dataset;
- no siempre aparecen combinaciones que estresen la maquetación real (contenido largo/corto, densidad variable, etc.).

Mejoras previstas:
- reducir `pros`/`cons` vacíos en datasets importados o históricos;
- generar comentarios más naturales;
- generar pros/contras coherentes con segmento y tipo de moto;
- ratings variados;
- evitar frases repetidas;
- mantener siempre `source='mock'`;
- permitir limpiar mocks sin tocar reviews reales;
- generar casos variados para validar maquetación:
  - comentarios largos;
  - comentarios cortos;
  - pros/contras múltiples;
  - reviews con aspectos técnicos;
  - variedad de usos: ciudad, viaje, offroad, deportivo, pasajero, diario.

Reglas:
- mantener `source='mock'` en todas las reviews generadas;
- nunca mezclar mocks con `source='user'`;
- la limpieza de mocks no debe afectar reviews reales;
- respetar la política actual de sources por entorno;
- en producción no deben mostrarse datos mock;
- no tocar schema/RLS salvo decisión explícita.

Relación con roadmap:
- ayuda a validar `FeaturedReviewCard`;
- ayuda a validar `MotorcycleGarageCard`;
- ayuda a validar `BikeDetailPage`;
- ayuda a validar rankings y bloques editoriales;
- será útil antes de la revisión global UI/SCSS;
- ayuda a detectar problemas de maquetación antes de tener datos reales suficientes.

Criterios de aceptación futuros:
- mocks siguen marcados como `source='mock'`;
- limpieza de mocks no toca `source='user'`;
- los pros/contras vacíos se reducen notablemente;
- los comentarios tienen variedad suficiente;
- los ratings no son todos iguales;
- hay variedad de segmentos y usos;
- los datos ayudan a probar cards de comunidad, detalle, garaje, rankings y filtros;
- `npm run typecheck` pasa;
- `npm run test` pasa.

## 8. P3/P4 — Capa social futura

Estado: futuro / no implementar dentro del auth baseline.

Objetivo:
Convertir MotoAtlas progresivamente en comunidad con identidad, reputación y actividad social.

Ideas futuras:
- perfiles públicos de usuario
- historial público de reviews
- garaje público o motos favoritas
- seguidores
- notificaciones:
  - respuesta recibida
  - review aprobada/rechazada
  - review marcada como útil
  - actividad en motos seguidas
- gamificación:
  - badges
  - niveles de contribuidor
  - reputación por votos útiles
  - reconocimientos por reviews técnicas completas
  - rankings de colaboradores

Reglas:
- No mezclar capa social con cierre de auth baseline.
- No implementar seguidores/notificaciones/gamificación hasta tener estable:
  - auth baseline
  - reviews asociadas a usuario
  - panel de cuenta
  - moderación
  - contratos de privacidad
- Cuando llegue esta fase, hacer auditoría previa de:
  - privacidad
  - visibilidad de perfiles
  - configuración de notificaciones
  - abuso/spam
  - RGPD/legal

## 9. P3 — Comunidad social / temas por modelo

Estado: backlog estratégico / futuro.

Objetivo:
Crear una capa de discusión abierta por modelo que complemente las reviews estructuradas.

Diferencia de producto:
- Reviews = experiencia estructurada y valorable.
- Temas = conversación abierta, dudas y seguimiento comunitario.

Rutas futuras:
- `#/comunidad/temas` — landing global de temas.
- `#/comunidad/[motorcycleId]` — listado de temas asociados a una moto.
- `#/comunidad/[motorcycleId]/temas/[topicId]` — detalle de tema con respuestas.

Funcionalidades previstas:
1. Crear temas de discusión por modelo.
2. Listar temas en `#/comunidad/[motorcycleId]`.
3. Página detalle de tema con respuestas.
4. Reportar temas y respuestas.
5. Integración con admin de moderación.
6. Landing global `#/comunidad/temas`.

Categorías fijas por modelo:
- Dudas de compra.
- Problemas / averías.
- Mantenimiento.
- Accesorios.
- Neumáticos.
- Rutas / viajes.
- Modificaciones.
- General.

Dependencias recomendadas antes de implementar:
- Auth baseline cerrado.
- Moderación estable.
- Reportes de reviews/respuestas consolidados.
- Admin de moderación preparado.
- Contratos de privacidad definidos.
- Sistema anti-spam básico.

Notas de arquitectura:
- No implementar como foro genérico sin relación con motos.
- Los temas deben estar vinculados a `motorcycleId` cuando correspondan.
- La landing global debe servir para descubrimiento:
  - temas recientes
  - temas populares
  - temas sin responder
  - temas por categoría
- Reportes de temas/respuestas deben reutilizar patrones existentes de reportes/moderación si encajan.
- En el futuro, la IA podría ayudar a:
  - detectar temas duplicados
  - resumir hilos largos
  - extraer problemas comunes
  - alimentar insights por modelo

No implementar ahora:
- seguidores
- notificaciones
- gamificación
- IA real
- sistema completo tipo foro generalista

## 10. P3/P4 — Engagement sano y retorno de usuario

Estado:
- backlog estratégico / futuro.

Principio de producto:
No se busca crear adicción ni un feed infinito. Se busca crear bucles sanos de retorno basados en utilidad real, reconocimiento de aportaciones, cambios relevantes y comunidad motera viva.

Idea central:
El usuario debe sentir que MotoAtlas cambia con su actividad y con la actividad de otros usuarios.

Líneas futuras:

### 1. Desde tu última visita

Mostrar al usuario cambios relevantes desde su última sesión:
- tu review fue aprobada;
- tu review recibió votos útiles;
- una moto de tu garaje recibió nuevas reviews;
- una moto que sigues subió o bajó en rankings;
- una comparativa guardada cambió;
- nuevas reviews publicadas en modelos que sigues;
- tu solicitud de modelo fue revisada.

Dependencias:
- auth baseline cerrado;
- reviews asociadas a usuario;
- cuenta estable;
- sistema de actividad/eventos;
- contratos de privacidad.

### 2. Radar MotoAtlas / Pulso de la Comunidad

Evolución futura de los insights y actividad comunitaria:
- reviews recientes;
- motos que están subiendo;
- modelos más comentados;
- comparativas calientes;
- solicitudes populares;
- opiniones destacadas;
- segmentos más activos;
- usos más activos;
- “La Semana MotoAtlas”.

Relación con el foco actual:
- conecta con rediseño de `Insights en vivo`;
- conecta con artículos dinámicos data-driven;
- conecta con rankings y comunidad.

### Tendencia real basada en histórico de actividad (P2/P3)

Estado:
- backlog estratégico / futuro.

Objetivo:
Sustituir la tendencia simple actual por una señal real basada en histórico temporal y actividad reciente de la comunidad.

Problema actual:
- la tendencia actual no usa serie temporal real;
- puede servir como aproximación visual, pero no debe interpretarse como crecimiento real;
- para rankings, artículos dinámicos y Radar MotoAtlas hace falta una señal más sólida.

Posibles señales futuras:
- crecimiento de reviews por periodo;
- incremento de rating medio por periodo;
- volumen reciente de reviews aprobadas;
- visitas recientes a ficha;
- comparaciones recientes;
- favoritos/guardados;
- motos seguidas;
- solicitudes de modelo;
- actividad en temas/comunidad;
- interacciones útiles en reviews;
- cambios de posición en ranking por semana/mes.

Fases recomendadas:
1. Auditoría de datos disponibles:
   - revisar qué eventos existen ya;
   - revisar si hay timestamps suficientes;
   - revisar si hay datos de visitas/comparaciones/favoritos;
   - no inventar tendencia si no hay señal real.
2. Señal mínima basada en reviews:
   - reviews aprobadas recientes;
   - crecimiento de número de reviews;
   - variación de rating medio;
   - ventana temporal simple: últimos 7/30/90 días.
3. Señal avanzada de actividad:
   - comparaciones;
   - guardados/favoritos;
   - visitas;
   - motos seguidas;
   - solicitudes;
   - actividad comunitaria.
4. Integración UI:
   - mostrar etiquetas como “Tendencia al alza”, “Nueva entrada”, “Muy comentada” u “Opinión dividida” solo cuando estén justificadas por datos reales;
   - evitar claims falsos o exagerados.

Reglas:
- no presentar tendencia como real si se basa en aproximación sin histórico;
- no usar mocks/seed para claims públicos de producción;
- documentar claramente la ventana temporal usada;
- mantener separación entre rating, score, confianza y tendencia;
- no mezclar visitas personales con métricas públicas sin privacidad clara;
- si se usan eventos de usuario, revisar privacidad/RGPD;
- no implementar tracking invasivo.

Relación con roadmap:
- conecta con rediseño de `Insights en vivo`;
- conecta con `Radar MotoAtlas / Pulso de la Comunidad`;
- conecta con rankings;
- conecta con artículos data-driven;
- conecta con engagement sano;
- conecta con futuras comparativas vivas;
- puede alimentar SEO y descubrimiento.

Criterios de aceptación futuros:
- existe una fuente clara de datos temporales;
- la tendencia usa ventanas temporales documentadas;
- tests cubren casos sin histórico, histórico insuficiente y crecimiento real;
- UI no muestra tendencia falsa cuando faltan datos;
- producción no usa mocks/seed para claims de tendencia;
- `npm run typecheck` pasa;
- `npm run test` pasa.

### 3. Mi garaje / motos seguidas

Permitir que el usuario marque motos como:
- la tengo;
- la he tenido;
- la quiero;
- la estoy comparando;
- la probé;
- la sigo.

Uso futuro:
- personalización;
- notificaciones suaves;
- “Desde tu última visita”;
- artículos relevantes;
- rankings personalizados;
- actividad de modelos seguidos.

Dependencias:
- auth baseline;
- perfiles/cuenta;
- privacidad;
- modelo de datos para garaje/saved motorcycles/followed motorcycles.

### 4. Comparativas vivas

Crear comparativas con lectura comunitaria:
- “BMW F900GS vs Aprilia Tuareg 660: la comunidad opina”.
- “MT-09 vs Street Triple: cuál gusta más a propietarios”.
- “CFMoto 800MT-X vs Ténéré 700: datos, precio y percepción”.

Pueden basarse en:
- specs técnicas;
- reviews agregadas;
- rankings;
- votos/comparaciones populares;
- opiniones de propietarios.

Relación:
- conecta con comparador;
- conecta con artículos dinámicos;
- conecta con IA futura;
- conecta con SEO.

### 5. Notificaciones suaves

Notificaciones controladas por el usuario:
- review aprobada;
- alguien marcó tu review como útil;
- solicitud revisada;
- nuevas reviews de una moto seguida;
- nueva actividad en tu garaje;
- nuevo artículo sobre una moto seguida.

Reglas:
- sin spam;
- preferencias configurables;
- no enviar notificaciones sin consentimiento;
- respetar privacidad/RGPD.

### 6. Reputación técnica

Gamificación sana basada en prestigio útil:
- reviewer fiable;
- experto en trail;
- experto en naked;
- propietario verificado;
- colaborador técnico;
- veterano MotoAtlas.

Debe basarse en:
- reviews aprobadas;
- votos útiles;
- aportaciones aceptadas;
- datos corregidos;
- experiencia de largo plazo;
- especialización por segmento.

Reglas:
- no puntos vacíos;
- no recompensas engañosas;
- no fomentar spam de reviews;
- reputación ligada a calidad y utilidad.

Dependencias generales:
- auth baseline cerrado;
- cuenta y reviews propias estables;
- moderación sólida;
- sistema anti-spam;
- privacidad y preferencias;
- suficientes datos reales de comunidad.

No implementar ahora:
- feed infinito;
- notificaciones reales;
- reputación pública;
- seguidores;
- automatismos agresivos;
- rankings de usuarios sin reglas de calidad.

Relación con roadmap:
- conecta con capa social futura;
- conecta con noticias/artículos data-driven;
- conecta con IA futura;
- conecta con rankings;
- conecta con reviews, solicitudes y comparador;
- refuerza la idea de MotoAtlas como comunidad viva.

## 11. P3 — Noticias / contenido editorial

Estado: pendiente.

Primera fase:
- artículos manuales escritos por el usuario
- basados en reviews externas, pruebas vistas y tendencias

Futuro:
- artículos asistidos por IA
- basados en reviews reales de MotoAtlas

Ejemplos de piezas:
- “Lo que más se repite sobre la F 900 GS”.
- “Puntos fuertes y débiles de la Tracer 9 según propietarios”.

### Noticias dinámicas y artículos generados desde datos MotoAtlas

Estado:
- backlog estratégico / futuro.

Principio de producto:
MotoAtlas no se centrará en noticias genéricas de actualidad. La sección de artículos debe orientarse a contenido útil, evergreen, SEO y descubrimiento de motos basado en datos propios.

Fuentes futuras de contenido:
- especificaciones técnicas;
- reviews de usuarios;
- puntuaciones de comunidad;
- comparativas populares;
- patrones de búsqueda;
- motos más guardadas o comparadas;
- motos más solicitadas;
- datos por carnet;
- datos por uso;
- datos por segmento;
- datos por ergonomía/altura si se incorporan de forma voluntaria y segura.

Ejemplos de artículos:
- “Mejores motos A2 según la comunidad”.
- “Trails más recomendadas para viajar”.
- “Naked más divertidas para ciudad”.
- “Motos con mejor relación peso/potencia”.
- “Modelos con más reviews de propietarios”.
- “Comparativas más populares”.
- “Motos más solicitadas por usuarios”.
- “Motos mejor valoradas por usuarios de menos de 1,73 m” (solo con dato suficiente y contrato de privacidad/consentimiento adecuado).

Fases recomendadas:
1. Manual/editorial:
   - artículos escritos por el usuario;
   - basados en catálogo, reviews externas observadas y criterio editorial.
2. Data generated:
   - artículos generados desde datos internos;
   - rankings, comparativas, reviews agregadas, solicitudes y patrones de búsqueda.
3. AI assisted:
   - IA como asistente de resumen, estructura y redacción;
   - siempre con revisión humana antes de publicar.

Futuro modelo de datos propuesto:
- `articles`
  - `id`
  - `slug`
  - `title`
  - `subtitle`
  - `excerpt`
  - `content`
  - `category`
  - `tags`
  - `related_motorcycle_ids`
  - `source_type`
  - `status`
  - `created_at`
  - `updated_at`
  - `published_at`

`source_type`:
- `manual`
- `data_generated`
- `community_generated`
- `ai_assisted`

Requisitos previos:
- catálogo más amplio;
- reviews suficientes;
- testing fuerte;
- taxonomía cerrada;
- SEO base;
- admin/editorial;
- moderación y datos de comunidad estables;
- criterios de privacidad claros si se usan datos personales/ergonómicos.

Reglas:
- no implementar generación automática sin revisión humana;
- no publicar datos débiles como si fueran conclusiones sólidas;
- no crear artículos basados en mocks/seed en producción;
- no usar datos sensibles como altura sin contrato claro de privacidad y consentimiento;
- diferenciar contenido manual, generado por datos, generado por comunidad y asistido por IA;
- mantener trazabilidad de fuentes internas.

Relación con roadmap:
- conecta con IA futura;
- conecta con SEO técnico;
- conecta con rankings;
- conecta con taxonomía de segmentos;
- conecta con admin/editorial;
- conecta con reviews y comparador;
- puede convertirse en una fuente importante de tráfico orgánico.

## 12. P4 — IA futura

Estado: pendiente.

Rol esperado de IA:
- moderador asistido
- extractor de datos
- generador de insights
- futuro generador de artículos

Lineamientos:
- proveedor externo por API
- capa propia desacoplada
- `MockProvider` inicial
- salida JSON estructurada
- revisión humana obligatoria

No hacer:
- no llamar a IA desde frontend
- no acoplarse a un proveedor concreto

Arquitectura futura posible:
- `AiProvider`
- `MockProvider`
- `GeminiProvider` / `OpenAIProvider` / `MistralProvider`
- `aiModerationService`
- Supabase Edge Function protegida

## 13. P3/P4 — Revisión global UI/SCSS

Estado: pendiente.

Al cerrar funcionalidades principales:
- auditar CSS muerto
- revisar clases acopladas
- revisar componentes reutilizables
- revisar cards, chips, actions, filtros, formularios y layouts
- convertir patrones repetidos en componentes/mixins/placeholders

### 13.1 Backlog: Unificación de Hero, CTAs y Button System

Estado: **Fases A/B implementadas** (ramas `feature/page-hero-community-base` y `feature/page-hero-community-reviews`) y `SearchHero` ya extraído como shell paralelo para Home + `#/buscador`. Fase C/D siguen como backlog, pero ya no significan “migrar todos los heroes”.

No es implementación. Es una tarea de documentación y planificación futura.

**Objetivo:**
- Unificar estilos base de Hero en MotoAtlas.
- Crear patrones reutilizables de CTA/button/action.
- Reducir duplicación de estilos page-specific.
- Acelerar futuras fases de pulido de páginas con coherencia visual.

**Alcance por fases:**

**Fase A — implementada** (rama `feature/page-hero-community-base`):
- Auditoría de implementaciones de Hero (rama `feature/hero-cta-audit`): inventario de 11 patrones distintos, 4 sistemas de botón, 2 reusos cross-page feos.
- Componente compartido `PageHero` (`src/components/ui/PageHero/`) con API mínima: `titleId`, `title`, `eyebrow?`, `description?`, `imageSrc?`, `imageAlt?`, `className?`, `children?`, `actions?`. Replica la estructura del antiguo `CommunityHero`.
- Migración de los 6 consumidores simples: 4 páginas admin (Dashboard, Reviews, Requests, Moderation) sin cambio visual; `CommunityRankingsPage` con remoción de CTAs del hero; `TopRatedMotorcyclesPage` con nueva prop `variant?: 'community' | 'topRated'` que quita CTAs en `#/comunidad` y las preserva en `#/motos-mejor-valoradas`.
- Remoción de CTAs del hero en `#/comunidad` y `#/comunidad/rankings` porque la navegación vivirá en una futura navbar/subnav.
- `CommunityHero` reusado como thin wrapper deprecated de `PageHero` para mantener compatibilidad con importadores externos.
- Sin cambios de schema/RLS/auth/routes.

**Fase B — implementada** (rama `feature/page-hero-community-reviews`):
- `CommunityReviewsPage` (`#/comunidad/reviews`) migra su hero local a `PageHero`.
- No se amplía la API TypeScript: la fase inicial reutiliza `className`, y la limpieza posterior en `feature/page-hero-purity-cleanup` deja `PageHero.scss` sin selectores page-specific. El tratamiento visual queda movido a `CommunityReviewsPage.scss` bajo `className="community-reviews-page__hero"` para conservar `hero-community.png`, full-bleed, doble gradient, filtro, `fade-in` y contenido centrado.
- Se eliminan los CTAs `Explorar reviews` y `Buscar moto para opinar`; la navegación comunitaria vivirá en una futura navbar/subnav.
- Sin cambios en otros heroes, bloques editoriales, filtros, garaje, insights, acciones de reviews, schema/RLS/auth/routes.

**Nota de implementación actual:**
- `SearchHero` (`src/components/sections/SearchHero/`) se extrajo como shell reusable para Home y `#/buscador`, separado de `PageHero`. Comparte estructura visual de hero orientado a búsqueda, pero no contiene submit, route hash, filtros ni navegación: la lógica de búsqueda sigue siendo page-owned.
- Seguimiento posterior validado en `feature/search-control-unification`: el antiguo wrapper `Hero` de Home se renombra a `HomeHero`, y `SearchControl` (`src/shared/ui/search/`) pasa a ser el input presentacional compartido entre `HeroSearch` (Home) y `SearchField` (SearchPage). Ambos siguen siendo adapters de comportamiento; la lógica de búsqueda continúa en cada página.
- El cleanup de naming de Home queda cerrado en esa misma rama: `hero__search*` pasa a `home-hero__search*` sin alterar el comportamiento del submit de Home ni el live filtering de SearchPage.

**Fase C — revisión acotada / no forzar migraciones:**
- Revisar solo heroes simples que encajen naturalmente en un shell compartido existente, sin forzar a todas las páginas a `PageHero`.
- `PageHero` queda como shell de comunidad/admin donde el patrón encaja; `SearchHero` ya cubre Home + `#/buscador`.
- `BikeDetailPage` y `MotorcycleCommunityPage` quedan fuera por decisión de producto: sus heroes son específicos y no deben convertirse en objetivos de migración en este backlog.
- `AccountPage` y páginas estáticas solo quedan como candidatos de auditoría futura si el producto reabre ese alcance; no son migraciones obligatorias en esta fase.
- Si aparece deuda cross-page de clases de hero, resolverla solo cuando haya un shell compartido natural; no abrir una abstracción más grande por adelantado.

**Fase D — pendiente:**
- Decidir `HeroAction` system con tipos de acción diferenciados (anchor, button, `AuthRequiredAction`-aware).
- Sistema de variantes de botón/acción a documentar:
  - `primary`, `secondary`, `ghost`, `glass`, `glass-primary`, `glass-secondary`, `danger`, `success`, `link`.
  - Definir la semántica de cada variante y cuándo usar cada una.
- Consolidar con la tabla del backlog ya documentada.
- Mobile-first de Fase 13b con validación visual en Stitch.

**Convenciones de iconos para acciones comunes (dirección futura, sin cambios en esta fase):**
| Acción | Icono |
|--------|-------|
| Reviews | `rate_review` |
| Ficha | `description` o `two_wheeler` |
| Comparar | `compare_arrows` |
| Escribir review | `edit` |
| Ver más | `arrow_forward` |
| Solicitar modelo | `add_circle` |
| Comunidad | `groups` |
| Ranking / analytics | `analytics` |

Estas convenciones son **dirección futura**, no implementación actual. Los iconos actuales pueden no seguirlas todavía.

**Reglas:**
- No rediseñar el sitio completo en esta tarea.
- No tocar código fuente fuera de las zonas permitidas por fase.
- Mantener responsive funcional actual en cada paso.
- Dejar lugar para diferencias contextuales legítimas por página.
- La fase mobile-first premium (sección 13b) permanece como esfuerzo separado posterior a esta unificación.

**Conexión con roadmap:**
- Conecta con sección 13 (revisión global UI/SCSS) como subtarea específica dentro de esa fase.
- Conecta con P1/P2 UX pública + componentes reutilizables (filtros atomizados, ya cerrados; mejora de quick specs cerrada en rama `feature/bike-detail-technical-spec-cards` con `TechnicalSpecCard`).
- Conecta con fase mobile-first (sección 13b) una vez cerrada la unificación base.
- No bloquea funcionalidades core actuales.

## 13b. P3/P4 — Fase mobile-first (futura)

Estado: pospuesto / no inmediato.

Decisión de producto:
- El mobile debe ser usable y responsive correcto en todas las tareas actuales.
- No se invertirá en refinado mobile premium hasta una fase posterior.
- Esa fase abordará rediseño de landings desde Stitch con enfoque mobile-first, no simplemente adaptar desktop.

Objetivo:
- Rediseño mobile de landings: Home, buscador, comunidad, rankings, reviews, ficha y cuenta.
- Criterio: experiencia mobile específica, ligera y cuidada, no reducción literal de desktop.
- Diseño previo en Stitch antes de implementar.

Alcance previsto:
- Revisar layouts desktop→mobile con perspectiva mobile-first.
- Identificar páginas que resultan pesadas o con jerarquía poco clara en móvil.
- Posibles mejoras de navegación, jerarquía, cards y contenido para móvil.
- No es solo adaptar breakpoints, es repensar la experiencia móvil.

Reglas actuales para mobile:
- Mantener responsive funcional y correcto en todas las tareas.
- No dejar pantallas rotas en móvil.
- No invertir en micro-ajustes mobile complejos salvo bugs claros.
- Reservar fase global con diseño específico para mobile premium.

## 14. Riesgos y deuda conocida

- flaky test aislado en `AdminPage`.
- doble toggle en el mismo tick sin test explícito dedicado.
- hidratación silenciosa de reportes.
- literal de reporte duplicado.
- quedan `FilterOptionButton` y `FilterRatingStars` locales en algunas páginas de cuenta/comunidad/motorcycle community; el wrapper `FilterGroup` y el `FilterOptionButton` compartido ya están normalizados, pero la unificación completa de SCSS entre páginas es polish futuro opcional.
- futura ejecución de scripts desde admin requiere backend seguro.
- el formulario `ReviewModal` no cumple hoy el contrato anónimo que permiten schema/servicio REST: la RPC usada exige autenticación.
- `onAuthStateChange` puede exponer transitoriamente usuario autenticado con perfil aún no resuelto.
- identidad visible de reviews autenticadas todavía depende de `p_user_name` enviado por cliente.
- los tests estáticos de schema no prueban privilegios efectivos ni RLS real desplegada; falta smoke controlado de staging.

## 15. Qué NO hacer todavía

- No implementar IA real todavía.
- No ejecutar scripts desde frontend.
- No mezclar cierre de auth baseline con features sociales avanzadas.
- No rehacer todos los filtros antes de cerrar insights si bloquea avance.
- No atomizar replies ahora.
- No automatizar noticias hasta tener datos suficientes.
- No exponer `service role key` en frontend.

## 16. Relación con Trello

- Trello = tablero operativo.
- Este documento = fuente estratégica del repositorio.
- Cuando una idea pase a ejecución, crear tarjeta en Trello.
- Si una idea surge en conversación pero aún no toca ejecutarla, documentarla aquí para no perder contexto.
- Reclasificación aplicada: la tarjeta histórica “Implementar login y cuentas de usuario” queda dentro de **P2 Plataforma/Admin/Productividad interna** como **auth baseline auditado**, con gaps P1/P2 explícitos previos a capa social.
- Tarjeta incorporada: “Revisar y cerrar taxonomía de categorías de motos” queda como tarea transversal de **P2 Plataforma/Admin/Productividad interna** y dependencia de filtros/admin/SEO catálogo.
- Tarjeta incorporada: futura funcionalidad “Temas de discusión por modelo” clasificada como **P3 Comunidad social / temas por modelo** (backlog estratégico).
- Tarjeta incorporada y cerrada: mejora de `bike-detail__quick-specs` clasificada como **P1/P2 UX pública + componentes reutilizables** y resuelta en rama `feature/bike-detail-technical-spec-cards` con extracción de `TechnicalSpecCard` a `src/components/motorcycles/TechnicalSpecCard/`.
- Tarjeta incorporada: “Mejorar generador de reviews mock realistas” clasificada como **P2 Datos demo / QA visual** para soporte de maquetación y validación visual.
- Tarjeta reclasificada: “Controlar datos demo por entorno en comunidad” queda dividida en **source policy implementada** + **toggle admin pendiente P2**.
- Tarjeta actualizada: “Crear fixtures de usuarios y perfiles para tests de auth” queda **parcialmente implementada** (base central + migración incremental pendiente) dentro de **P2 Auth baseline / Testing / Fixtures**.
- Tarjeta reclasificada: “Fase 2.5 moderación/admin de respuestas” queda como **admin/moderación base mayoritariamente cerrada** con auditoría residual.
- Tarjeta incorporada: “Automatización avanzada de imágenes” clasificada como evolución **P2/P3 Plataforma/Admin** del pipeline actual (no greenfield).
- Idea histórica incorporada: “Noticias dinámicas y artículos generados desde datos MotoAtlas” clasificada como **P3/P4 Contenido dinámico / SEO / IA futura** (backlog estratégico, no implementación inmediata).
- Idea histórica incorporada: “Engagement sano y retorno de usuario” clasificada como **P3/P4 Comunidad / Personalización / Engagement sano** (backlog estratégico, no implementación inmediata).
- Tarea futura incorporada: “Personalizar emails de Supabase Auth” clasificada como **P2/P3 Auth / Branding / Emails transaccionales** (backlog futuro, no bloqueante para MVP).
- Tarea futura incorporada: “Implementar tendencia real basada en histórico de actividad” clasificada como **P2/P3 Rankings / Analytics / Comunidad viva** (backlog estratégico, no implementación inmediata).
