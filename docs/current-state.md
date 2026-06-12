# MotoAtlas — Estado actual

## Último estado estable

- Rama actual: `feature/demo-data-environment-guard`
- Último bloque validado: **guard centralizado de entorno/runtime para demo data** con Quality Gate aprobado. `src/shared/env/runtimeEnvironment.ts` centraliza la decisión de entorno y expone `getRuntimeEnvironment()`, `isProductionEnvironment()`, `isPreviewEnvironment()`, `isDevelopmentEnvironment()` y `canUseDemoData()`. `reviewSourcePolicy` ya no decide desde `import.meta.env.PROD` y delega la selección de sources al guard compartido.
- Alcance validado: producción permanece production-safe (`['user']`), development/preview solo exponen `seed/mock` cuando el guard lo permite y un `VITE_APP_ENV` inválido/desconocido cae a comportamiento seguro de producción. No se tocaron UI/app, schema/RLS/Supabase policies, scripts mock ni `data/mock/mockReviews.json`.
- Tests: 1132 passed (74 files)
- Typecheck: clean
- `git diff --check`: clean
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
- `#/admin/solicitudes` **Fase 1 implementada** (rama `feature/admin-requests-phase-1`, sin cambios de schema/RLS) sobre la base auditada en `feature/admin-requests-audit`. Capacidades verificadas:
  - sidebar admin con quick links a Panel admin, Moderación, Reviews, Solicitudes, Mi cuenta.
  - filtros laterales con `FilterGroup` + `FilterOptionButton` (`classPrefix="admin-page"`), `aria-pressed` y `aria-label` por opción: `Estado` (Todas, Pendientes, Revisadas, Aprobadas, Rechazadas), `Origen` (Todas, Usuario, Admin, Import) y búsqueda libre por marca o modelo. Botones `Limpiar filtros` y `Aplicar filtros` replicando el patrón visual de filtros admin.
  - **multi-select de `Estado` y `Origen`**: el admin puede combinar varios estados o varios orígenes a la vez; `Todas` significa "sin filtro" y limpia los específicos al activarse; al activar un valor concreto, `Todas` se desactiva automáticamente.
  - **filtro por rango de fechas** (`Fecha de creación`) con inputs `type="date"` Desde/Hasta; fecha enviada al backend como `YYYY-MM-DD` interpretada como día completo (`createdFrom` → `T00:00:00.000Z`, `createdTo` → `T23:59:59.999Z`); `min`/`max` cruzados para evitar invertir el rango.
  - cards expandibles con detalle de Marca, Modelo, Año, Segmento, Origen, Usuario, Email de contacto, Página oficial/fuente y Comentario.
  - badge de estado (`Pendiente` / `Revisada` / `Aprobada` / `Rechazada`) y fecha en formato `DD MMM YYYY` (`es-ES`).
  - **summary** con `aria-live="polite"` que muestra total cargado, pendientes y rango visible (`X solicitudes cargadas · Y pendientes · Mostrando A-B`); texto conservador sobre el dataset cargado, no sobre totales backend.
  - **paginación** de 10 elementos por página con `AccountPagination`; cambiar los valores reales de filtros/búsqueda/fechas resetea a página 1; todo cambio de página colapsa las cards expandidas; si hay una sola página no se renderiza el paginador.
  - acciones `Marcar revisada`, `Aprobar`, `Rechazar` (deshabilitadas si la solicitud ya está en ese estado o hay una acción en curso) con feedback de éxito/error.
  - RLS vigente verificada en auditoría: anon insert solo `pending`/`user`/`user_id null`; authenticated insert solo con `user_id = auth.uid()`; authenticated users leen solo sus propias solicitudes; admins leen todas; admins actualizan solo `status`.
  - **validación defensiva de `segment`** en `createModelRequest`: vacío/espacios se normaliza a `null`; un valor no vacío fuera de `BIKE_SEGMENTS` se rechaza antes de llamar a red; un segmento canónico válido se preserva (no rompe el selector canónico del form público).
- Rutas paralelas verificadas: `#/solicitar-modelo` (envío público, anónimo o autenticado) y `#/cuenta/solicitudes` (consulta autenticada del propio usuario con paginación 8 + CTA `Solicitar otro modelo` como card visual).
- Gaps residuales (Fase 2/3/4, fuera de alcance de Fase 1): sin `motorcycle_id` para vincular a moto del catálogo, sin nuevos estados (`in_review`, `duplicate`, `created`), sin creación de moto a partir de solicitud aprobada, sin notificaciones al solicitante, sin detección de duplicados por `brand`+`model`+`year`, sin acciones en lote, sin notas internas / motivo de rechazo visible al solicitante.

### Comparador
- `ComparatorPage` usa `ComparatorSetupHero` como único setup hero local para los estados de preparación del comparador.
- El estado de `0` motos y el de `1` moto comparten el mismo fondo hero con `comparisonHeroImage`, copy centrado y CTAs centradas.
- Estado `0` motos: CTA real `Ir al buscador` hacia el flujo actual de búsqueda.
- Estado `1` moto: el hero ya no queda vacío; muestra una card compacta de la moto seleccionada entre la descripción y las acciones, reutilizando `comparison-detail__hero-bike`, `comparison-detail__hero-bike--center`, `comparison-detail__data-notes` y `comparison-detail__hero-bike-actions`. La card incluye imagen, línea brand/segment/A2, display name, notas de calidad de datos, `Ver ficha` y `Quitar`.
- `Quitar` vacía la compare queue con `saveCompareQueue([])` y navega de forma segura a `#/comparador`.
- El estado de `2/3` motos seleccionadas mantiene intacto el comparador dinámico normal.

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

### BikeDetailPage — Reorganización por tabs + Layout normalization (Fases 1–5 implementadas)
- tabs accesibles con 4 tabs: Resumen, Especificaciones, Comunidad, Comparar.
- Sin tab Metodología (ya existe `#/metodologia`).
- Tab Resumen activa por defecto.
- Contenido en Resumen: `section.bike-detail__riding` + `section.bike-detail__fit` (normalizados con section/container).
- Fase 1 — estructura tabs + Resumen: **implementada**.
- Fase 2 — `SpecificationsTab` con bento grid de `SpecCard`: **implementada**.
   - 8 cards base: Motor (cc), Potencia (HP), Torque (NM), Peso (KG), Altura asiento (MM), Depósito (L), Carnet, Precio.
   - Card electrónica/features: solo features activas (`filter(([, isEnabled]) => isEnabled)`), no renderiza `false`.
   - Card A2: solo si `isA2Compatible` o `isA2LimitedVersion`; muestra badge y versión limitada con `limitedPowerHp`/`originalPowerHp`. Usa icono `license` (no `a2` como key).
   - Precio: `isPendingPrice` → `pendingPriceLabel` ("Precio pendiente de confirmar") si `priceEur <= 0` o `source = placeholder`. Nunca `0 €`.
   - Diseño inspirado en Stitch/specs.html: bento grid, border sutil, hover, adaptado a SCSS/MotoAtlas.
   - Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile.
- Fase 2C — specs detalladas dentro de Especificaciones tab: **implementada**.
   - Heading: `Especificaciones ampliadas`.
   - Copy: `Detalles técnicos y equipamiento específico del modelo.` (restaurada tras split P2-B).
   - Grupos: Motor & transmisión, Chasis & ergonomía, Mercado & registro.
- Fase 2C-B — tests de extended specs: **implementada**.
   - 5 tests cubriendo heading, copy, grupos, invisibilidad antes de abrir tab y ausencia de sección residual.
- Fase 2-B — split specs-extended en sección hermana: **implementada**.
   - `bike-detail__specs-extended` ahora es sibling de `bike-detail__specs-tab`, no anidado dentro.
   - Cada sección tiene su propio `.bike-detail__section-container`.
   - `aria-labelledby="bike-detail-specs-title"` preservado.
- Fase 3A — Iconos técnicos compartidos: **implementada**.
   - Nuevo módulo compartido: `src/shared/motorcycles/motorcycleTechnicalIcons.ts`.
   - Exporta: `motorcycleTechnicalIconMap`, `MotorcycleTechnicalIconKey`, `getMotorcycleTechnicalIcon(key)`.
   - Contrato de 18 keys: 8 de specs técnicas + 10 de aspectos de reviews.
   - `a2` NO es una key del mapa; A2 es variante/estado dentro de `license`.
- Fase 3B — Iconos técnicos compartidos en ReviewModal: **implementada**.
- Layout normalization (P1–P5): **implementada**.
   - Patrón unificado en todos los tabs:

     ```html
     <section class="bike-detail__section bike-detail__section--contexto existing-class">
       <div class="bike-detail__section-container">
         ...contenido...
       </div>
     </section>
     ```

   - `.bike-detail__section` → ancho completo (width: 100%).
   - `.bike-detail__section-container` → `@include container` + `@include section-spacing` para cada sección.
   - `.bike-detail__tab-content` → **no es contenedor de ancho**. Solo gestiona flujo/ritmo vertical.
   - Resumen: `bike-detail__riding` y `bike-detail__fit` como secciones sisters con container propio.
   - Especificaciones: `bike-detail__specs-tab` y `bike-detail__specs-extended` como secciones sisters, cada una con container propio.
   - Comunidad: `bike-detail__community-tab` (summary), `bike-detail__reliability` y `bike-detail__reviews` como secciones sisters, cada una con container propio.
   - Comparar: `bike-detail__compare-tab` normalizado (empty y normal state) con container interno.
- Calidad verificada: Quality Gate limpio (typecheck clean, 1088 tests passed).
- QA visual pendiente: verificar gap vertical entre specs-tab y specs-extended en desktop. Si es excesivo, posible follow-up SCSS mínimo.
- Secciones residuales cerradas:
   - `bike-detail__specs` → eliminada del flujo principal.
   - `bike-detail__reliability` → sección sister en Comunidad.
   - `bike-detail__reviews` → sección sister en Comunidad.
   - `bike-detail__related` → integrado en CompareTab.

### Filtros reutilizables — `FilterGroup` y `FilterOptionButton` compartidos

- Componentes compartidos extraídos en `src/shared/ui/filters/`:
  - `FilterGroup.tsx` + `FilterGroup.scss` (self-styled, con `import './FilterGroup.scss'` directo).
  - `FilterOptionButton.tsx` con `classPrefix` configurable que mantiene la convención de prefijos por página (`admin-page`, `account-reviews-page`, `community-reviews-page`, `motorcycle-community`).
- `FilterGroup.test.tsx`: 5 tests directos (título, children, `defaultOpen` expandido/colapsado, icono Material Symbols).
- Migraciones completadas al `FilterGroup` compartido:
  - `AccountReviewsPage` (`#/cuenta/reviews`): filtros de marca/modelo, segmento, carnet, rating medio, uso principal y orden.
  - `AccountMotorcycleReviewsPage` (`#/cuenta/reviews/[motorcycleId]`): filtros de rating y orden (preserva `FilterOptionButton` y `FilterRatingStars` locales para option/star/grid activos).
  - `CommunityReviewsPage` (`#/comunidad/reviews`): grupos Segmento, Carnet, Rating, Uso principal, Orden.
  - `SearchPage` (`#/buscador`): 10 grupos (Marca, Segmento, Carnet, Precio, Potencia, Peso, Altura asiento, Electrónica, Uso recomendado, Calidad de datos).
  - `MotorcycleCommunityPage` (`#/comunidad/[motorcycleId]`): grupos Rating y Orden. Preserva `FilterOptionButton` y `FilterRatingStars` locales para option/star activos.
  - `AdminPage` (`#/admin`, `#/admin/moderacion`, `#/admin/reviews`, `#/admin/solicitudes`): 12 grupos/call sites usan `FilterGroup` + `FilterOptionButton` con `classPrefix="admin-page"`. Grupos: `Estado del reporte`, `Motivo`, `Orden` (moderación); `Estado`, `Origen`, `Segmento`, `Verificadas`, `Carnet`, `Uso principal`, `Orden` (reviews por modelo); `Estado`, `Origen` (solicitudes).
  - `AdminMotorcycleReviewsPage` (`#/admin/reviews/[motorcycleId]`): `Estado` y `Orden` usan `FilterGroup` + `FilterOptionButton` con `classPrefix="admin-page"`.
- Componentes locales de admin eliminados: `AdminFilterGroup`, `AdminFilterOptionButton`, `FilterChipButton`. Admin conserva su lógica de dominio: report status, report reason, moderation sort, review status, origin/source, segment, verification, license, riding style, requests filters, paginación con reset, acciones de moderación, auth gate.
- Limpieza residual SCSS:
  - Rama `feature/filtergroup-residual-scss-cleanup` (SearchPage y CommunityReviewsPage): eliminados `.search-page__filter-group*`, `.search-page__filter-group-body`, `.community-reviews-page__filter-group*` y `.community-reviews-page__filter-group-body` huérfanos; selectores activos preservados. Corrección de layout aceptada por producto en `SearchPage.scss`: `grid-template-columns: minmax(18rem, 4fr) minmax(0px, 8fr);`. `.account-reviews-page__filter-group*` preservado por riesgo de override contextual.
  - Rama `feature/motorcycle-community-filtergroup` (MotorcycleCommunityPage): eliminados `.motorcycle-community__filter-group*` y `.motorcycle-community__filter-group-body` huérfanos; selectores activos (`__rating-grid`, `__sort-grid`, `__filter-option*`, `__filter-stars`, `__filter-star--filled`) preservados.
  - Rama `feature/admin-filtergroup-normalization` (AdminPage y AdminMotorcycleReviewsPage): eliminados `admin-page__filter-group`, `admin-page__filter-group-toggle`, `admin-page__filter-group-body`, `admin-page__filter-group--open` (wrapper de grupo) y `admin-page__filter-options--pills` + `admin-page__filter-option--pill*` (variantes pill nunca usadas). Preservados: `admin-page__filter-options` (grid 2-col, layout genuino de admin), `admin-page__filter-option`, `admin-page__filter-option--active`, icon styles y media query mobile con `grid-template-columns: 1fr`. `FilterGroup.scss` sigue siendo dueño único de `.filter-group`, `.filter-group__summary`, `.filter-group__title`, `.filter-group__icon`, `.filter-group__body`.
- Estado: la onda de migración reusable a `FilterGroup` + `FilterOptionButton` compartidos está **completa** incluyendo admin. No hay filtros admin que dependan de wrappers locales.
- Decisión histórica documentada: la rama `feature/admin-filtergroup-audit` recomendó inicialmente no migrar admin. Esa decisión fue superada por la decisión de producto posterior (rama `feature/admin-filtergroup-normalization`) que sí normalizó admin al shared. La justificación de la auditoría inicial se conserva en `docs/product-roadmap.md` como contexto histórico, no como estado vigente.

### Auth / testing
- Auth baseline auditado end-to-end: anonymous navega y puede solicitar modelo; account/admin requieren sesión; admin requiere además `profile.role = admin`.
- Reviews autenticadas obtienen `user_id` desde `auth.uid()` en la RPC; solicitudes, reacciones y reportes usan token + `user_id` y RLS valida ownership.
- Cuenta carga reviews/solicitudes propias con token y mantiene estados controlados sin sesión, durante carga o con auth incompleto.
- Gap P1 cerrado (rama `feature/review-auth-only-contract`): `Escribir review` queda auth-only. El CTA sigue visible con `aria-disabled="true"` para anónimos; al pulsarlo se muestra un hint en vez de abrir `ReviewModal` o llamar a la RPC. `Útil N` y replies siguen visibles y pasivos.
- Gaps P2: transición de perfil en `onAuthStateChange`, alias visible enviado desde cliente, smoke RLS/privilegios efectivos en staging.
- Base de fixtures de auth/perfiles/sesión implementada en `src/test/fixtures/auth.ts`.
- Fuente central con factories y overrides (`createAuthUser`, `createUserProfile`, `createSession`, `createAuthSnapshot`, `createAuthState`).
- Cubre presets de user/admin/no-auth/perfil incompleto/avatar-display_name faltantes.
- `src/test/fixtures/auth.test.ts` valida contrato base de fixtures.
- `src/components/pages/AuthPage/AuthPage.test.tsx` migrado a fixtures centrales (sin Supabase real).
- Adopción actual: 1 de 11 suites con mock de `useAuth` consume fixtures centrales; quedan 10 suites con `mockAuth` local.

### Catálogo / imágenes
- Pipeline base de imágenes operativo: assets locales por `motorcycle.id` en `public/images/motorcycles/*.webp`.
- Scripts de normalización + sync con dry-run (`normalize:images:*`, `sync:images:*`) documentados y activos.
- Contrato actual de imagen: sincronización de `image_url`/`image_source` y respeto de `image_locked` para no pisar curación manual.

### Taxonomía de segmentos (Fase 0-3.1) — base cerrada

- Fase 0 (auditoría inicial): cerrada.
- Fase 1 (guardrails/tests de contrato): cerrada.
- Fase 2 (saneo puntual inicial de datos): aplicada parcialmente. Caso saneado: `cfmoto-800mt-x-2025` `segment` de `naked` a `trail`.
- Fase 3 (auditoría de estrategia final de filtros): cerrada.
- Fase 3.1 (formalización canónico vs visible): cerrada.
- **Fase 2 extendida (cierre de taxonomía base, rama `feature/motorcycle-taxonomy-closure`):**
  - `BIKE_SEGMENTS` (`src/shared/motorcycles/motorcycleTaxonomy.ts`) confirmado como fuente única de verdad de los 16 segmentos.
  - `segmentIcons` añadido al mismo módulo para centralizar label e icono por segmento (antes los iconos vivían dispersos en `motorcycleSegmentFilterOptions` con prefijo `community-reviews-page__`).
  - `validateMotorcycleImport` ahora rechaza explícitamente segmentos fuera de la taxonomía canónica y el valor `other` (que es bucket UI, no segmento real).
  - Decisiones operativas de clasificación documentadas en `docs/taxonomy-decisions.md` (incluye la regla de oro para distinguir `trail` vs `adventure` con la lista actual de motos de Fase 2).
  - Guardrails reforzados en `motorcycleTaxonomy.contract.test.ts` con cobertura de iconos.
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
  - cobertura de `segmentLabels` y `segmentIcons` para todos los segmentos.
  - `validateMotorcycleImport` rechaza segmentos fuera de la taxonomía y `other`.
  - validación de `data/import/motorcycles.json` sin segmentos inválidos.
  - contrato de filtros actual `primary + other` con `other` como bucket UI (no segmento real).
- Resultado de quality gate de fase: aprobado. Pendiente de Fase 4 SEO/Admin/landings.

### Datos demo
- Pipeline mock operativo: generación, importación y limpieza con `source='mock'`.
- Mejora de realismo implementada y validada en `scripts/generateMockReviews.ts`: comentarios `short` / `medium` / `long`, menos repetición, tono por rating, variedad de usos y pools por segmento para estresar mejor la QA visual de `FeaturedReviewCard`, `MotorcycleGarageCard`, `BikeDetailPage`, rankings y bloques editoriales.
- `pros`/`cons` mock ahora salen con cantidad variable, mezcla de contexto de moto + pools contextuales y sanitización para evitar `null` / `undefined` visibles.
- `data/mock/mockReviews.json` se dejó intencionalmente sin regenerar en ese bloque.
- Policy por entorno vigente: producción solo `source='user'`; dev/pre puede incluir `seed` y `mock` únicamente a través del guard central `runtimeEnvironment` + `reviewSourcePolicy`.
- Source policy central aplicada en servicios públicos de reviews (`reviewSourcePolicy` + `status='approved'`) sin tocar el filtro público por estado aprobado.
- Pendiente P2: toggle admin “Incluir datos demo” solo para dev/pre, todavía sin UI ni persistencia local.

## Pendiente

- Rediseño mobile avanzado de rankings/listado técnico — **pospuesto a fase global mobile-first**. El responsive actual es funcional y correcto, pero no se invertirá en refinado mobile premium hasta una fase posterior con diseño específico desde Stitch. Mantener responsive usable y sin pantallas rotas.
- BikeDetailPage — reorganización por tabs + layout normalization:
   - Fase 1: estructura tabs + Resumen (riding + fit) — **implementada**.
   - Fase 2: tab Especificaciones (`SpecificationsTab` con bento grid, SpecCard, electronics, A2 condicional, fallbacks de precio) — **implementada**.
   - Fase 2-B: split specs-extended como sección hermana de specs-tab — **implementada**.
   - Fase 2C: specs detalladas dentro de Especificaciones tab — **implementada**.
   - Fase 2C-B: tests de specs detalladas — **implementada**.
   - Fase 3A: iconos técnicos compartidos (`motorcycleTechnicalIcons.ts`, 18 keys, `a2` no es key, A2 usa `license`) — **implementada**.
   - Fase 3B: iconos técnicos compartidos en ReviewModal — **implementada**.
   - Fase 4: tab Comunidad con summary + reliability + reviews como secciones sisters (cada una con `.bike-detail__section-container` propio) — **implementada**.
   - Fase 5: tab Comparar normalizado (empty y normal state, cada uno con container interno) — **implementada**.
   - Layout normalization P1–P5: patrón unificado `section.bike-detail__section + .bike-detail__section-container` aplicado a todos los tabs. Quality Gate limpio (typecheck clean, 1088 tests passed).
   - Sección residual `bike-detail__specs` eliminada.
   - No se muestran suspensiones/frenos/neumáticos (no existen en modelo Bike).
   - QA visual pendiente: verificar gap vertical entre specs-tab y specs-extended en desktop. Si es excesivo, posible follow-up SCSS mínimo.
   - Refinado visual/global de layout pospuesto a fase futura (después de cerrar funcionalidad core).
- Aspectos agregados en garaje de `#/comunidad/reviews`.
- Deduplicación editorial↔garaje.
- Backlog P1/P2 (cerrado): mejora de `bike-detail__quick-specs` con tarjetas técnicas reutilizables (sin acoplar CSS de `ReviewModal`). Implementado en rama `feature/bike-detail-technical-spec-cards` con extracción de `TechnicalSpecCard` a `src/components/motorcycles/TechnicalSpecCard/`.
- Backlog P1/P2: refactor admin focal — completado como parte de la normalización al shared `FilterGroup` + `FilterOptionButton` (rama `feature/admin-filtergroup-normalization`). Los wrappers `AdminFilterGroup` y `FilterChipButton` fueron eliminados y el HTML crudo duplicado de `AdminMotorcycleReviewsPage` quedó consolidado al usar `FilterGroup` + `FilterOptionButton` compartidos.
- Backlog P2: toggle admin “Incluir datos demo” (en producción no visible/sin efecto).
- Backlog P2: migración incremental de mocks `useAuth` repetidos en tests existentes (Account*, Community*, ReviewModal, StaticInfoPages, Admin*, etc.) sobre la nueva base central de fixtures.
- Backlog P1 Auth (cerrado a nivel UI): la rama `feature/review-auth-only-contract` cerró el contrato de `Escribir review` con auth-only + hint no-auth. La fase de producto queda abierta si en el futuro se decide habilitar reviews anónimas (requeriría RPC y RLS anónimos revisados).
- Backlog P2 Auth: representar resolución de perfil en cambios de sesión, validar/derivar alias server-side y ejecutar smoke real de RLS/privilegios en staging.
- Backlog P2: auditoría residual de admin/moderación (avisos al autor y cierre de contratos de respuestas). `#/admin/solicitudes` ya fue auditado y la **Fase 1** quedó implementada en rama `feature/admin-requests-phase-1` (multi-select, date range, paginación, summary, validación defensiva de `segment`) sin cambios de schema.
- Backlog P2: completar saneo puntual de clasificación de datos actuales por segmento (casos dudosos restantes) tras auditoría.
- Backlog P2/P3: unificar criterio cross-page para evitar drift entre vistas compactas y vistas con 16 categorías explícitas.
- Backlog P2/P3: definir thresholds de catálogo para exponer categorías explícitas en UI pública sin saturación mobile.
- Backlog P2/P3: resolver deuda semántica final `trail` vs `adventure` con criterio de producto estable.
- Backlog P1/P2 UI: _(cerrado)_ `FeaturedBikes`/`BikeCard` eliminados; `FeaturedMachines` es la sección actual de Home.
- Backlog P3 (cerrado a nivel de servicio): `createModelRequest` valida `segment` contra `BIKE_SEGMENTS` y rechaza payloads manipulados con valores fuera del canónico. El form público `#/solicitar-modelo` siempre usó el selector de las 16 categorías canónicas. Pendiente real, si se decide en una fase futura, es forzar `segment` a nivel de schema con un enum o check constraint para que ni siquiera payloads con rol de servicio puedan colar valores fuera de la taxonomía.
- Backlog P2/P3: automatización avanzada del pipeline de imágenes (thumbnails, variantes responsive, validación/reportes de calidad y performance) como evolución del pipeline actual.
- Backlog P3/P4: noticias dinámicas y artículos evergreen generados desde datos propios (catálogo/reviews/rankings/comparativas), con fase futura IA asistida y revisión humana obligatoria.
- Backlog P3/P4: engagement sano y retorno de usuario (actividad desde última visita, radar comunitario, motos seguidas, comparativas vivas y reputación técnica útil sin patrones adictivos).
- Backlog P2/P3: personalización de emails de Supabase Auth (auth transaccional con branding MotoAtlas), no bloqueante para MVP.
- Backlog P2/P3: tendencia real basada en histórico temporal de actividad (evolución de rankings/insights/radar, sin claims públicos apoyados en señales débiles).

## En curso

- Taxonomía de segmentos de motos (tarea transversal de plataforma): base cerrada. Fases 0, 1, 2, 2 extendida, 3 y 3.1 finalizadas; ver bloque "Taxonomía de segmentos" más arriba.
- Backlog de Fase 4 (futuro, fuera de alcance del cierre base):
  - SEO/landings por categoría.
  - Admin catálogo de modelos con 16 categorías explícitas.
  - Decisión final `trail` vs `adventure` con contrato de producto (criterio operativo ya documentado en `docs/taxonomy-decisions.md` para no romper en el interim).
- ...

## Siguiente paso

- ...

## Decisiones importantes

- Producción solo `source=user`.
- Dev/pre puede incluir `seed` y `mock`.
- Rankings usan reviewCount real y confidence.
- La tarjeta histórica “Implementar login y cuentas de usuario” queda como **Auth baseline auditado** dentro de **P2 Plataforma/Admin/Productividad interna**; sus gaps P1/P2 deben cerrarse antes de capa social avanzada.
- La tarea “Revisar y cerrar taxonomía de categorías de motos” se clasifica como dependencia estratégica previa para filtros reutilizables, admin catálogo y futuras landings SEO por segmento.
- Estado de taxonomía actualizado por fases: Fases 0, 1, 2, 2 extendida (cierre de taxonomía base), 3 y 3.1 cerradas; Fase 4 (SEO/Admin/landings) pendiente.
- La funcionalidad “Temas de discusión por modelo” se clasifica como backlog estratégico **P3** (comunidad social), dependiente de auth baseline, moderación y anti-spam antes de implementación.
- La mejora de quick specs de `BikeDetailPage` (clasificación original **P1/P2 UX pública + componentes reutilizables**) queda **cerrada** en rama `feature/bike-detail-technical-spec-cards` con extracción de `TechnicalSpecCard`.
- La mejora del generador de mocks se clasifica como **P2 Datos demo / QA visual** (soporte técnico de maquetación, no feature pública directa).
- “Controlar datos demo por entorno en comunidad” queda reclasificada en dos partes: source policy implementada + toggle admin pendiente.
- Fixtures de usuarios/perfiles para auth quedan como **P2 Auth baseline / Testing / Fixtures** con base central implementada; pendiente residual: migración incremental de mocks repetidos.
- “Fase 2.5 moderación/admin de respuestas” queda reclasificada como base mayoritariamente implementada con pendientes residuales auditables.
- La rama `feature/admin-requests-audit` queda registrada como **auditoría funcional de `#/admin/solicitudes`** sin diffs.
- La rama `feature/admin-requests-phase-1` queda registrada como **cierre funcional Fase 1** sobre la base auditada: multi-select de `Estado` y `Origen`, filtro por rango de fechas (`createdFrom`/`createdTo` con interpretación de día completo), paginación 10/página con `AccountPagination`, summary de pendientes y validación defensiva de `segment` en `createModelRequest`. Sin cambios de schema/RLS. Fase 2 (vincular a admin catálogo), Fase 3 (notificaciones) y Fase 4 (duplicados/analítica) permanecen como fases futuras con dependencia explícita de decisión de schema.
- La rama `feature/review-auth-only-contract` queda registrada como **contrato auth-only para `Escribir review`**: el CTA sigue visible, pero con `aria-disabled="true"`, foco/click conservados, y al pulsarlo se muestra el hint `Inicia sesión para escribir una review.` (~4s) en lugar de abrir `ReviewModal` o llamar a la RPC. Implementado vía componente compartido `AuthRequiredAction` en `BikeDetailPage` Comunidad tab y en `MotorcycleCommunityPage` (hero + empty). Sin cambios de schema/RLS/auth.
- La rama `feature/admin-requests-phase-1` queda registrada como **cierre funcional Fase 1** sobre la base auditada: multi-select de `Estado` y `Origen`, filtro por rango de fechas (`createdFrom`/`createdTo` con interpretación de día completo), paginación 10/página con `AccountPagination`, summary de pendientes y validación defensiva de `segment` en `createModelRequest`. Sin cambios de schema/RLS. Fase 2 (vincular a admin catálogo), Fase 3 (notificaciones) y Fase 4 (duplicados/analítica) permanecen como fases futuras con dependencia explícita de decisión de schema.
- “Automatización avanzada de imágenes” queda clasificada como evolución **P2/P3 Plataforma/Admin** del pipeline actual de imágenes.
- “Noticias dinámicas y artículos desde datos MotoAtlas” queda clasificada como backlog estratégico **P3/P4 Contenido dinámico / SEO / IA futura**.
- “Engagement sano y retorno de usuario” queda clasificada como backlog estratégico **P3/P4 Comunidad / Personalización** con enfoque explícito anti-spam y anti-feed-infinito.
- “Personalización de emails de Supabase Auth” queda clasificada como backlog **P2/P3 Auth / Branding / Emails transaccionales**, sin bloquear cierre de MVP.
- “Tendencia real basada en histórico de actividad” queda clasificada como backlog **P2/P3 Rankings / Analytics / Comunidad viva**.
- La rama `feature/page-hero-community-base` queda registrada como **Fase A de la unificación de heroes/CTAs**: base normalizada `PageHero` (Fase A), `CommunityHero` reusado como wrapper deprecated. Las acciones del hero de `#/comunidad` y `#/comunidad/rankings` se removieron porque la navegación vivirá en una futura navbar/subnav. La **Fase B** queda implementada en `feature/page-hero-community-reviews`: `CommunityReviewsPage` migra su hero local a `PageHero` y elimina sus CTAs. La rama `feature/page-hero-purity-cleanup` completa la limpieza posterior: `PageHero.scss` ya no conoce páginas concretas y el tratamiento visual de `#/comunidad/reviews` vive bajo `.community-reviews-page__hero` en `CommunityReviewsPage.scss`. La fase 13.1 de `product-roadmap.md` ya no plantea `BikeDetailPage` ni `MotorcycleCommunityPage` como migraciones pendientes: esos heroes siguen siendo exclusivos por decisión de producto. Si en el futuro se reabre ese alcance, será como auditoría de casos simples adicionales, no como obligación de migración masiva. `HeroAction`/`Button` siguen como backlog aparte.
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
- `ReviewModal` ya no es invocable por anónimos: el CTA en `BikeDetailPage` Comunidad tab y en `MotorcycleCommunityPage` (hero + empty) usa `AuthRequiredAction` con `aria-disabled="true"` cuando no hay sesión. La regresión queda cubierta por el test `muestra el hint de login al pulsar "Escribir review" sin sesión y no abre el modal`.
- `onAuthStateChange` no reactiva `isLoading` mientras resuelve perfil; puede existir estado transitorio autenticado sin rol resuelto.
- El alias público de una review autenticada llega como `p_user_name` desde cliente; no debe usarse como identidad confiable para reputación sin hardening server-side.
- Falta smoke controlado contra staging para verificar RLS y privilegios efectivos de funciones `security definer`.

## Referencias de contratos

- Contratos de comportamiento: `docs/product-behavior-contracts.md`
- Contratos de producto para reviews, acciones comunitarias, FeaturedReviewCard, confianza, rating vs score y deduplicación.
- Roadmap estratégico y backlog de producto: `docs/product-roadmap.md`
