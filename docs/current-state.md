# MotoAtlas — Estado actual

## Último estado estable

- Rama actual: `feature/motorcycle-garage-card-audit`
- Último bloque validado: MotorcycleGarageCardAction API (componente helper para acciones de footer, SearchPage y BikeDetailPage migrados, consumidores ya no usan classNames internos).
- Tests: 1070 passed
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
- El Podium rankings de `#/comunidad` ya está alineado con `#/comunidad/rankings` para cards compactas: las posiciones 2 y 3 muestran el mismo span de metadatos `año · segmento · cilindrada`.
- `#/comunidad/reviews`: filtros apply-on-change en tiempo real; botón "Aplicar" cierra el panel en mobile; copy "Reviews destacadas" (antes "Destacadas del mes").
- `#/comunidad/reviews` Garaje: `MotorcycleGarageCard` extraído a `src/components/motorcycles/MotorcycleGarageCard/`. Props planas reutilizables (title, imageSource, imageAlt, rating, reviewCount, primaryUseLabel, lastReviewDate, reviewsHref, detailHref). Presentacional sin fetch ni estado. Base para futura reutilización en `#/buscador`.
- `#/comunidad/reviews` `Reviews destacadas`: criterio = utilidad comunitaria (`helpfulCount` desc). Desempates: rating, comentario más largo, más reciente. Kilómetros NO son criterio. Fallback si no hay útiles funciona por rating/fecha. `Últimos reportes`: cronológico puro. Deduplicación interna por `motorcycleId` en cada bloque editorial, sin deduplicación editorial↔garaje.
- `MotorcycleGarageCard` reutilizada en `#/buscador` con `footerActions` para botón de comparar/seleccionada; mantiene presentacionalidad y usa `aria-label="Ver ficha técnica"` en enlace a ficha.
- `MotorcycleGarageCardAction` extraído como helper de acciones de footer: componente presentacional que owning clases internas (`motorcycle-garage-card__action`, `--primary`, `--secondary`, `__compare-action`). SearchPage y BikeDetailPage migrados; consumidores ya no usan classNames internos del componente.
- `#/comunidad/reviews` `FeaturedReviewCard` (reviews destacadas y últimos reportes): acciones comunitarias reales conectadas — HelpfulReviewAction, NotHelpfulReviewAction, ReportReviewAction con ReviewReportForm, y ReviewReplySection con lazy loading. `Útil N` es contador público y se muestra siempre: en auth+review ajena+no reportada es interactivo; en no-auth, review propia o reportada queda pasivo/no interactivo. Chip `Propia` visible en zona de acciones para reviews propias. `No útil`, `Reportar` y `Responder` no se renderizan cuando no hay permiso real (sin no-op silencioso). El botón `Responder` aparece como action chip en `.featured-review-card__actions`; ReviewReplySection usa `inline=true` para que el trigger sea hijo directo de actions y el contenido expandido quede en `.motorcycle-community__replies`. `MotorcycleCommunityPage` mantiene comportamiento original sin `inline`. `isBlocked` deriva de `reportedReviewIds` (hidratado con `getMyReviewReports`), y al reportar se limpia reacción previa con `clearMyReviewReaction`; tras reportar, esa review queda bloqueada para nuevas reacciones.
- Fase A de consolidación P1: utilidades compartidas en `src/shared/reviews/reviewCommunityActions.ts` (`buildReviewAuthContext`, `isOwnReview`, `isDuplicateReviewReportError`, `markReportsByReviewId`, `upsertReactionSummaryInList`, `upsertReactionSummaryById`) reutilizadas por `CommunityReviewsPage` y `MotorcycleCommunityPage` sin introducir hooks.
- `reviewCommunityActions.ts` es capa de helpers puros: no hace fetch, no lee auth directamente y no llama servicios. Mantiene shapes separados de reaction summaries (list para `CommunityReviewsPage`, map para `MotorcycleCommunityPage`).
- Fase B de consolidación P1 cerrada: `src/shared/reviews/useReviewReports.ts` centraliza estado/flujo de reportes (`reportedReviewIds`, `reportForm`, `reportPendingIds`, hidratación con `getMyReviewReports`, guards `unauthenticated | own_review | already_reported`, submit `success | duplicate | blocked | error` y cleanup opcional por callback).
- `CommunityReviewsPage` usa `useReviewReports` en modo UX silenciosa: mantiene no-auth sin acciones falsas y cleanup con `clearMyReviewReaction` + `upsertReactionSummaryInList`.
- `MotorcycleCommunityPage` usa `useReviewReports` conservando UX propia (tooltips no-auth/success/duplicate + `reactionNotice` en error no duplicado), cleanup con `clearMyReviewReaction` + `upsertReactionSummaryById`, y pending combinado (`reactionPendingIds + reportPendingIds`).
- Fase C de consolidación P1 cerrada: `src/shared/reviews/useReviewReactions.ts` centraliza mutaciones Helpful/NotHelpful con guards (`unauthenticated | own_review | reported | pending`), pending por `reviewId` y outcomes (`success | blocked | error`), sin fetch inicial de summaries y sin acoplar feedback/UI.
- `CommunityReviewsPage` usa `useReviewReactions` con UX silenciosa: en success actualiza con `upsertReactionSummaryInList`; `Útil N` se mantiene como contador público visible (pasivo en no-auth/propia/reportada, interactivo solo con permiso real); mantiene orden editorial por `helpfulCount`.
- `MotorcycleCommunityPage` usa `useReviewReactions` conservando UX propia: blocked unauthenticated/reported mapea a tooltip existente, errores a `reactionNotice`, success limpia tooltip/notice y actualiza con `upsertReactionSummaryById`; pending combinado sigue en `reactionPendingIds + reportPendingIds`.
- `TopRatedMotorcyclesPage` (`#/comunidad` y `#/motos-mejor-valoradas`) reutiliza `FeaturedReviewCard` en `RecentReviews` como card visual común: reemplaza cards legacy cuando hay datos, mantiene orden cronológico (fecha desc), límite `slice(0, 3)` y empty state. Fase 4.4 conecta acciones seguras de comunidad: `FeaturedReviewCardCommunityActions` con Helpful/NotHelpful real, `Útil N` público pasivo en no-auth, chip "Propia" en own review, reported bloquea. Report/Reply no cableados en esta fase.

### Admin
- Base de Fase 2.5 mayoritariamente cerrada: rutas `#/admin`, `#/admin/moderacion`, `#/admin/reviews`, `#/admin/reviews/[motorcycleId]` y separación respecto de `#/cuenta`.
- Admin protegido por sesión + rol (`user_profiles.role = admin`).
- Moderación con reportes, filtros/paginación y acciones sobre review; al actuar sobre review desde reporte se marca `action_taken`.
- Tab de respuestas pendientes de moderación implementado con acciones aprobar/ocultar/rechazar.
- Flujo de solicitudes admin disponible, pendiente de auditoría funcional final y contratos de producto.

### Home — FeaturedMachines (sustitución de FeaturedBikes / BikeCard)
- Implementado: nueva sección `FeaturedMachines` en Home.
- `FeaturedBikes` y `BikeCard` fueron eliminados.
- Contrato visual actual:
  - 3 cards: card 1 hero horizontal (16:9), cards 2 y 3 compactas full-background (4:5).
  - Las 3 cards usan imagen full-background con overlay/degradado y contenido superpuesto.
  - Badge numérico `01` / `02` / `03` con text-shadow, separado del título (z-index 3 vs contenido z-index 1).
  - Marca en blanco, modelo en rojo/acento (`$color-accent-container`), text-shadow en título.
  - Features únicas: `Engine` (cc), `Power` (hp), `Torque` (nm).
  - CTAs: `Ver ficha` → `#/motos/[id]`, `Reviews` → `#/comunidad/[id]`.
  - No se muestran km/h, peso, PS, segmento, ADV READY, TC+ EVO, View Configurator.
  - Hover: scale solo en imagen (no en card), sin saltos de layout.
  - Responsive: desktop 2 cols en secondary, tablet 2 cols, mobile stack.
- Tests de `FeaturedMachines`: 9 tests cubriendo render, CTAs, specs y ausencia de textos legacy.

### BikeDetailPage — Reorganización por tabs (Fases 1, 2, 2C, 2C-B, 3A, 3B, 4.1, 4.2, 4.3A, 4.3B, 4.3C, 5.1, 5.2 y 5.3 implementadas)
- tabs accesibles con 4 tabs: Resumen, Especificaciones, Comunidad, Comparar.
- Sin tab Metodología (ya existe `#/metodologia`).
- Tab Resumen activa por defecto.
- Contenido en Resumen: `section.bike-detail__riding` + `section.bike-detail__fit`.
- Fase 1 — estructura tabs + Resumen: **implementada**.
- Fase 2 — `SpecificationsTab`: **implementada**.
   - Componente `SpecificationsTab` con bento grid de `SpecCard`.
   - 8 cards base: Motor (cc), Potencia (HP), Torque (NM), Peso (KG), Altura asiento (MM), Depósito (L), Carnet, Precio.
   - Card electrónica/features: solo features activas (`filter(([, isEnabled]) => isEnabled)`), no renderiza `false`.
   - Card A2: solo si `isA2Compatible` o `isA2LimitedVersion`; muestra badge y versión limitada con `limitedPowerHp`/`originalPowerHp`. Usa icono `license` (no `a2` como key).
   - Precio: `isPendingPrice` → `pendingPriceLabel` ("Precio pendiente de confirmar") si `priceEur <= 0` o `source = placeholder`. Nunca `0 €`.
   - Diseño inspirado en Stitch/specs.html: bento grid, border sutil, hover, adaptado a SCSS/MotoAtlas.
   - Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile.
   - Extended specs dentro del tab: sección `bike-detail__specs-extended` debajo del bento grid con heading `Especificaciones ampliadas` y copy `Detalles técnicos y equipamiento específico del modelo.`
   - Reutiliza `getSpecGroups(bike)` para grupos detallados (Motor & transmisión, Chasis & ergonomía, Mercado & registro).
- Fase 2C — specs detalladas dentro de Especificaciones tab: **implementada**.
   - La vieja `section.bike-detail__specs` (fuera de tabs) fue eliminada del flujo principal.
   - Extended specs vive dentro de `SpecificationsTab`, debajo del bento grid de SpecCards.
   - Heading: `Especificaciones ampliadas`.
   - Copy: `Detalles técnicos y equipamiento específico del modelo.`
   - Grupos: Motor & transmisión, Chasis & ergonomía, Mercado & registro.
- Fase 2C-B — tests de extended specs: **implementada**.
   - 5 tests añadidos cubriendo heading, copy, grupos, invisibilidad antes de abrir tab y ausencia de sección residual.
- Fase 3A — Iconos técnicos compartidos: **implementada**.
   - Nuevo módulo compartido: `src/shared/motorcycles/motorcycleTechnicalIcons.ts`.
   - Exporta: `motorcycleTechnicalIconMap`, `MotorcycleTechnicalIconKey`, `getMotorcycleTechnicalIcon(key)`.
   - Contrato de 18 keys: 8 de specs técnicas (engine, power, torque, weight, seatHeight, fuelTank, license, price) + 10 de aspectos de reviews (ergonomics, consumption, braking, suspension, electronics, aerodynamics, passenger, maintenance, design).
   - `a2` NO es una key del mapa; A2 es variante/estado dentro de `license`. El bloque A2 en SpecificationsTab usa `getMotorcycleTechnicalIcon('license')`.
   - Iconos Material Symbols: `fuelTank → oil_barrel`, `consumption → local_gas_station`, `license → workspace_premium`, etc.
   - Tests dedicados en `src/shared/motorcycles/motorcycleTechnicalIcons.test.ts`.
   - `specIconMap` local eliminado de BikeDetailPage.tsx.
- Fase 3B — Iconos técnicos compartidos en ReviewModal: **implementada**. ReviewModal `technicalAspects` ahora usa `getMotorcycleTechnicalIcon(category)` del módulo compartido. Sin iconos hardcodeados, sin duplicación. `consumption` → `local_gas_station`. `ReviewAspectSummary` no fue migrada (pendiente coordinación futura si aplica).
- Fallbacks documentados:
   - Precio: fallback textual cuando `priceEur <= 0` o `source = placeholder`.
   - Features: solo booleanas `true` se renderizan.
   - A2: bloque condicional con icono de `license`.
- Campos no existentes en modelo: suspensiones, frenos, neumáticos, electrónica avanzada. No se muestran.
- Secciones residuales cerradas:
   - `bike-detail__specs` → eliminada del flujo principal; specs detalladas ahora dentro de Especificaciones tab (Fase 2C).
   - `bike-detail__reliability` → movido a CommunityTab (Fase 4.2).
   - `bike-detail__reviews` → movido a CommunityTab con FeaturedReviewCard compacto (Fases 4.3B/4.3C).
   - `bike-detail__related` → integrado en CompareTab (Fases 5.1/5.2).
- Fase 5.1 — CompareTab local con related bikes: **implementada**.
   - Componente `CompareTab` local en BikeDetailPage.tsx con related bikes (mismo segmento, excluye actual, max 3).
   - Empty state: `Sin modelos relacionados del mismo segmento por ahora.`
- Fase 5.2 — Acciones reales de comparador en CompareTab: **implementada**.
   - Botones reales: `Comparar`, `Ya en comparador`, `Comparador lleno`.
   - Infraestructura de compare queue reutilizada: `loadCompareQueue`, `saveCompareQueue`, `compareQueueMaxSize`, `getNextCompareSelection`.
   - `saveCompareQueue` dispensa el evento de sync automáticamente; no se añade evento custom en BikeDetailPage.
   - Sin botones fake/no-op.
   - Sin ids duplicados en cola; máximo 3 respetado.
- Fase 5.3 — CompareTab con MotorcycleGarageCard: **implementada**.
   - CompareTab ahora usa `MotorcycleGarageCard` directamente para cada related bike.
   - Sin cambios en `MotorcycleGarageCard`; no se añadieron props nuevas.
   - Acciones de comparador inyectadas via `footerActions` (botón Comparar/Ya en comparador/Comparador lleno).
   - Rating y reviewCount usan proxy pattern (reliabilityScore / 2 y reportCount) — no son señal comunitaria real.
   - 8 tests nuevos cubriendo render de MotorcycleGarageCard, estados de botón, persistencia en cola y link Ver ficha.
- Fase 5.3 — Layout cleanup Comunidad: **implementada**.
   - `bike-detail__community-summary` reducido a strip compacto (flex-row, bg surface-dim, padding reducido).
   - Summary muestra: rating medio o "Sin rating", review count o "Sin reviews", confidence shield si hay datos.
   - Reviews limitados a 3 con `reviews.slice(0, 3)`.
   - CTAs movidos al footer de la sección reviews: "Escribir review" + "Ver reviews" → `#/comunidad/[bike.id]`.
   - Header duplicado eliminado.
   - FeaturedReviewCard mantiene `hideImage`, `hideLinks`, acciones seguras sin cambios.
- Plan por fases actualizado:
   - Fase 1: estructura tabs + Resumen — **implementada**.
   - Fase 2: tab Especificaciones — **implementada**.
   - Fase 2C: specs detalladas dentro de Especificaciones tab — **implementada**.
   - Fase 2C-B: tests de specs detalladas — **implementada**.
   - Fase 3A: iconos técnicos compartidos — **implementada**.
   - Fase 3B: iconos técnicos compartidos en ReviewModal — **implementada**.
   - Fase 4.1: tab Comunidad local con mini comunidad summary — **implementada**.
   - Fase 4.2: fiabilidad dentro de CommunityTab — **implementada**.
   - Fase 4.3A: FeaturedReviewCard compact variant — **implementada**.
   - Fase 4.3B: reviews dentro de CommunityTab con FeaturedReviewCard — **implementada**.
   - Fase 4.3C: acciones seguras de comunidad con FeaturedReviewCardCommunityActions — **implementada**.
   - Fase 5.1: CompareTab con related bikes — **implementada**.
   - Fase 5.2: acciones reales de comparador en CompareTab — **implementada**.
   - Fase 5.3: CompareTab con MotorcycleGarageCard + layout cleanup Comunidad — **implementada**.
- Tests: 1070 passed (70 files).

### Auth / testing
- Base de fixtures de auth/perfiles/sesión implementada en `src/test/fixtures/auth.ts`.
- Fuente central con factories y overrides (`createAuthUser`, `createUserProfile`, `createSession`, `createAuthSnapshot`, `createAuthState`).
- Cubre presets de user/admin/no-auth/perfil incompleto/avatar-display_name faltantes.
- `src/test/fixtures/auth.test.ts` valida contrato base de fixtures.
- `src/components/pages/AuthPage/AuthPage.test.tsx` migrado a fixtures centrales (sin Supabase real).

### Catálogo / imágenes
- Pipeline base de imágenes operativo: assets locales por `motorcycle.id` en `public/images/motorcycles/*.webp`.
- Scripts de normalización + sync con dry-run (`normalize:images:*`, `sync:images:*`) documentados y activos.
- Contrato actual de imagen: sincronización de `image_url`/`image_source` y respeto de `image_locked` para no pisar curación manual.

### Taxonomía de segmentos (Fase 0-3.1)
- Fase 0 (auditoría inicial): cerrada.
- Fase 1 (guardrails/tests de contrato): cerrada.
- Fase 2 (saneo puntual inicial de datos): aplicada parcialmente.
- Fase 3 (auditoría de estrategia final de filtros): cerrada.
- Fase 3.1 (formalización canónico vs visible): cerrada.
- Caso saneado en Fase 2:
  - `cfmoto-800mt-x-2025`: `segment` de `naked` a `trail`.
- Decisión recomendada en Fase 3:
  - estrategia **híbrida**: UI pública compacta con `primary + other` + taxonomía canónica de 16 segmentos como fuente de verdad.
- Hallazgo de Fase 3:
  - existe estrategia mixta real entre páginas (compacto en buscador/comunidad/cuenta/admin y 16 explícitas en rankings/top rated).
- Contrato formalizado en Fase 3.1:
  - segmento canónico = `BIKE_SEGMENTS` (16 categorías);
  - grupo visible = `all` + primarios + `other`;
  - `other` es UI-only (no segmento canónico);
  - secundarios mapean a `other`;
  - targets de grupos visibles devuelven solo segmentos canónicos válidos.
- `BikeCard` fue eliminada junto con `FeaturedBikes` tras la migración de Home a `FeaturedMachines`.
- El guardrail de label amigable para segmento ya no aplica a este componente (retirado de la base de código).
- Guardrails implementados:
  - `BIKE_SEGMENTS` exacto (16 categorías esperadas).
  - alineación `BikeSegment` (`src/types/bike.ts`) ↔ `BIKE_SEGMENTS`.
  - alineación enum `motorcycle_segment` (`supabase/schema.sql`) ↔ `BIKE_SEGMENTS`.
  - cobertura de `segmentLabels` para todos los segmentos.
  - validación de `data/import/motorcycles.json` sin segmentos inválidos.
  - contrato de filtros actual `primary + other` con `other` como bucket UI (no segmento real).
- Resultado de quality gate de fase: aprobado con observación no bloqueante (parsing textual en tests sobre `bike.ts`/`schema.sql`, fallo visible si cambia formato).

### Datos demo
- Pipeline mock operativo: generación, importación y limpieza con `source='mock'`.
- Policy por entorno vigente: producción solo `source='user'`; dev/pre puede incluir `seed` y `mock`.
- Backlog P2: mejorar realismo de reviews mock para QA visual (variedad de contenido, menos repetición y mejor cobertura de maquetación).
- Source policy central aplicada en servicios públicos de reviews (`reviewSourcePolicy` + `status='approved'`).
- Pendiente P2: toggle admin “Incluir datos demo” solo para dev/pre.

## Pendiente

- Rediseño mobile avanzado de rankings/listado técnico — **pospuesto a fase global mobile-first**. El responsive actual es funcional y correcto, pero no se invertirá en refinado mobile premium hasta una fase posterior con diseño específico desde Stitch. Mantener responsive usable y sin pantallas rotas.
- BikeDetailPage — reorganización por tabs:
   - Fase 1: estructura tabs + Resumen (riding + fit) — **implementada**.
   - Fase 2: tab Especificaciones (`SpecificationsTab` con bento grid, SpecCard, electronics, A2 condicional, fallbacks de precio) — **implementada**.
   - Fase 2C: specs detalladas dentro de Especificaciones tab — **implementada**.
   - Fase 2C-B: tests de specs detalladas — **implementada**.
   - Fase 3A: iconos técnicos compartidos (`motorcycleTechnicalIcons.ts`, 18 keys, `a2` no es key, A2 usa `license`) — **implementada**.
   - Fase 3B: iconos técnicos compartidos en ReviewModal — **implementada**.
   - Fase 4.1: tab Comunidad local con mini comunidad summary (rating medio, count, confidence shield, empty state) — **implementada**.
   - Fase 4.2: `bike-detail__reliability` dentro de CommunityTab, copy conservadora, common issues solo si `reportCount > 0`, empty state seguro — **implementada**.
   - Fase 4.3A: FeaturedReviewCard compact variant (`hideImage`, `hideLinks`) — **implementada**.
   - Fase 4.3B: `bike-detail__reviews` dentro de CommunityTab con FeaturedReviewCard (`hideImage`, `hideLinks`), sin "Más reviews" / "Ver ficha", MotorcycleReviewCard eliminada — **implementada**.
   - Fase 4.3C: FeaturedReviewCardCommunityActions para acciones seguras, `Útil N` público, no fake/no-op, no-auth sin interacción, own review pasivo, reported bloquea, Reportar solo con handler real, Responder no existe en BikeDetailPage — **implementada**.
   - Fase 5.1: CompareTab local con related bikes (mismo segmento, max 3) — **implementada**.
   - Fase 5.2: acciones reales de comparador en CompareTab (loadCompareQueue, saveCompareQueue, getNextCompareSelection) — **implementada**.
   - Fase 5.3: CompareTab con MotorcycleGarageCard + layout cleanup Comunidad — **implementada**.
   - Sección residual `bike-detail__specs` eliminada; specs detalladas dentro de Especificaciones tab.
   - Sección residual `bike-detail__related` integrada en CompareTab.
   - No se muestran suspensiones/frenos/neumáticos (no existen en modelo Bike).
   - Layout cleanup Comunidad: summary compacto, reviews limitados a 3, CTAs en footer.
   - Refinado visual/global de layout pospuesto a fase futura (después de cerrar funcionalidad core).
- Aspectos agregados en garaje de `#/comunidad/reviews`.
- Deduplicación editorial↔garaje.
- Backlog P1/P2: mejora de `bike-detail__quick-specs` con tarjetas técnicas reutilizables (sin acoplar CSS de `ReviewModal`).
- Backlog P2: mejorar generador de reviews mock realistas para validar cards/layouts con datos más representativos.
- Backlog P2: toggle admin “Incluir datos demo” (en producción no visible/sin efecto).
- Backlog P2: migración incremental de mocks `useAuth` repetidos en tests existentes (Account*, Community*, ReviewModal, StaticInfoPages, Admin*, etc.) sobre la nueva base central de fixtures.
- Backlog P2: auditoría residual de admin/moderación (solicitudes, avisos al autor y cierre de contratos de respuestas).
- Backlog P2: completar saneo puntual de clasificación de datos actuales por segmento (casos dudosos restantes) tras auditoría.
- Backlog P2/P3: unificar criterio cross-page para evitar drift entre vistas compactas y vistas con 16 categorías explícitas.
- Backlog P2/P3: definir thresholds de catálogo para exponer categorías explícitas en UI pública sin saturación mobile.
- Backlog P2/P3: resolver deuda semántica final `trail` vs `adventure` con criterio de producto estable.
- Backlog P1/P2 UI: _(cerrado)_ `FeaturedBikes`/`BikeCard` eliminados; `FeaturedMachines` es la sección actual de Home.
- Backlog P3: `model_requests.segment` sigue como texto libre; evaluar contrato tipado en fase de cierre taxonómico end-to-end.
- Backlog P2/P3: automatización avanzada del pipeline de imágenes (thumbnails, variantes responsive, validación/reportes de calidad y performance) como evolución del pipeline actual.
- Backlog P3/P4: noticias dinámicas y artículos evergreen generados desde datos propios (catálogo/reviews/rankings/comparativas), con fase futura IA asistida y revisión humana obligatoria.
- Backlog P3/P4: engagement sano y retorno de usuario (actividad desde última visita, radar comunitario, motos seguidas, comparativas vivas y reputación técnica útil sin patrones adictivos).
- Backlog P2/P3: personalización de emails de Supabase Auth (auth transaccional con branding MotoAtlas), no bloqueante para MVP.
- Backlog P2/P3: tendencia real basada en histórico temporal de actividad (evolución de rankings/insights/radar, sin claims públicos apoyados en señales débiles).

## En curso

- Cierre completo de taxonomía de segmentos de motos (tarea transversal de plataforma):
  - Fase 2 en curso: saneo puntual (primer ajuste aplicado; quedan casos por auditar).
  - Fase 3 auditoría: cerrada (recomendación híbrida validada).
  - Fase 3.1 cerrada: contrato canónico vs visible formalizado.
  - Fase 4 pendiente: preparación SEO/Admin/landings por categoría.
- ...

## Siguiente paso

- ...

## Decisiones importantes

- Producción solo `source=user`.
- Dev/pre puede incluir `seed` y `mock`.
- Rankings usan reviewCount real y confidence.
- La tarjeta histórica “Implementar login y cuentas de usuario” se reclasifica en roadmap como **Auth baseline** dentro de **P2 Plataforma/Admin/Productividad interna**; capa social avanzada queda para fase futura separada.
- La tarea “Revisar y cerrar taxonomía de categorías de motos” se clasifica como dependencia estratégica previa para filtros reutilizables, admin catálogo y futuras landings SEO por segmento.
- Estado de taxonomía actualizado por fases: Fase 0 y Fase 1 cerradas; Fase 2 parcialmente aplicada; Fase 3 auditoría cerrada con recomendación híbrida; Fase 3.1 cerrada con contrato formal; Fase 4 pendiente.
- La funcionalidad “Temas de discusión por modelo” se clasifica como backlog estratégico **P3** (comunidad social), dependiente de auth baseline, moderación y anti-spam antes de implementación.
- La mejora de quick specs de `BikeDetailPage` se clasifica como **P1/P2 UX pública + componentes reutilizables**, conectada con revisión UI/SCSS y futuro admin de catálogo.
- La mejora del generador de mocks se clasifica como **P2 Datos demo / QA visual** (soporte técnico de maquetación, no feature pública directa).
- “Controlar datos demo por entorno en comunidad” queda reclasificada en dos partes: source policy implementada + toggle admin pendiente.
- Fixtures de usuarios/perfiles para auth quedan como **P2 Auth baseline / Testing / Fixtures** con base central implementada; pendiente residual: migración incremental de mocks repetidos.
- “Fase 2.5 moderación/admin de respuestas” queda reclasificada como base mayoritariamente implementada con pendientes residuales auditables.
- “Automatización avanzada de imágenes” queda clasificada como evolución **P2/P3 Plataforma/Admin** del pipeline actual de imágenes.
- “Noticias dinámicas y artículos desde datos MotoAtlas” queda clasificada como backlog estratégico **P3/P4 Contenido dinámico / SEO / IA futura**.
- “Engagement sano y retorno de usuario” queda clasificada como backlog estratégico **P3/P4 Comunidad / Personalización** con enfoque explícito anti-spam y anti-feed-infinito.
- “Personalización de emails de Supabase Auth” queda clasificada como backlog **P2/P3 Auth / Branding / Emails transaccionales**, sin bloquear cierre de MVP.
- “Tendencia real basada en histórico de actividad” queda clasificada como backlog **P2/P3 Rankings / Analytics / Comunidad viva**.
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
- En buscador, `rating` y `reviewCount` son proxies derivados de `fiabilidad`/`reportCount`, no señal comunitaria real. Riesgo de confusión semántica si se renormalizan sin contrato de producto claro.
- `useReviewReactions` no tiene test explícito para doble toggle en el mismo tick exacto; hay cobertura de pending en request y guard por ref interno.

## Referencias de contratos

- Contratos de comportamiento: `docs/product-behavior-contracts.md`
- Contratos de producto para reviews, acciones comunitarias, FeaturedReviewCard, confianza, rating vs score y deduplicación.
- Roadmap estratégico y backlog de producto: `docs/product-roadmap.md`
