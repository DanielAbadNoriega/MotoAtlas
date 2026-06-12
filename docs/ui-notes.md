# Notas UI de MotoAtlas

## Nota sobre estrategia mobile

El mobile es una prioridad de uso para MotoAtlas. El responsive actual debe mantenerse funcional y correcto en todas las tareas, sin pantallas rotas en móvil.

**Decisión de producto:** el refinado mobile premium se pospone a una fase futura con diseño específico desde Stitch y enfoque mobile-first. No se invertirá en micro-ajustes mobile complejos salvo bugs claros. Esa fase revisará Home, buscador, comunidad, rankings, reviews, ficha y cuenta como landings independientes, no como adaptación literal de desktop.

## Footer

El footer vive en `src/components/layout/Footer/` y toma su contenido de `src/data/site.ts`.

Estructura actual:

- bloque de marca con descripción y copyright.
- columna `Explorar`: buscador, comparador, comunidad y motos mejor valoradas.
- columna `Datos`: metodología, fuentes de datos y solicitar modelo.
- columna `Legal`: privacidad y términos.
- columna `Social`: enlaces externos placeholder a TikTok, Instagram, YouTube y Facebook.

Las redes sociales son placeholders seguros por ahora y abren en nueva pestaña con `rel="noopener noreferrer"`.


## Landing “Motos mejor valoradas”

La ruta `#/motos-mejor-valoradas` vive en `src/components/pages/TopRatedMotorcyclesPage/`.

Criterio actual del ranking:

- solo cuenta reviews con `status = approved`.
- calcula `averageRating` y `reviewCount` por moto.
- por defecto exige al menos 1 review aprobada.
- si no hay reviews suficientes o los filtros dejan el ranking vacío, muestra empty state técnico.

Podio visual: componente `PodiumCard` compartido extraído en `src/components/rankings/PodiumCard/`. Self-styled con CSS propio (`.podium-card*`), presentacional sin fetch ni auth. API: `bike`, `rank`, `variant`, `scoreLabel`, `confidence`, `confidenceTooltip`, `stats`, `statsAriaLabel`, `meta`, `href`, `ctaLabel`, `loading`, `showConfidence`. El componente es la fuente de estilo de los podios en ambas páginas — los estilos de layout de página (`.top-rated__podium`, `.top-rated__podium-cta`, `.rankings__podium-section`, `.rankings__podium-grid`) permanecen en sus SCSS respectivos.

Filtros disponibles:

- segmento.
- carnet A / A2 compatible.
- mínimo de reviews.
- orden por mejor rating, más reviews, tendencia simple o prioridad A2.

Limitación actual: la tendencia no usa una serie temporal real; es una señal simple basada en rating y volumen de reviews. No se muestran reviews `pending`, `rejected` ni `hidden`.

Bloque `Reviews recientes` en esta página:
- reutiliza `FeaturedReviewCard` (sin tocar su SCSS interno).
- muestra máximo 3 reviews recientes (`slice(0, 3)`) ordenadas por fecha descendente.
- mantiene empty state cuando no hay reviews.
- mantiene CTA de sección `Ver todas las reviews` (`#/comunidad/reviews`) y CTAs de card `Más reviews` / `Ver ficha`.
- Fase 4.4: integra acciones comunitarias seguras con FeaturedReviewCardCommunityActions. Helpful/NotHelpful son reales cuando hay auth + review ajena + no reportada. En no-auth, Útil N queda como contador pasivo. Report/Reply no se renderizan porque no están cableados con flujo real en esta fase.

## Buscador

La ruta `#/buscador` pagina el listado a 9 motos por página. La paginación se calcula después de aplicar búsqueda, filtros y ordenación, mientras el contador conserva el total filtrado.

El hero de Home y el hero de `#/buscador` comparten el shell reutilizable `SearchHero` (`src/components/sections/SearchHero/`), pero la lógica de búsqueda sigue siendo de cada página: Home conserva `HeroSearch` y su submit hacia `#/buscador?q=...`, mientras `SearchPage` mantiene su input de filtro en vivo y su sync con `routeHash`. `SearchHero` no es una variante de `PageHero`; son shells distintos para necesidades distintas y no owning submit, navegación ni filtros.

El wrapper concreto de Home ahora se llama `HomeHero` (`src/components/sections/HomeHero/`) para evitar la ambigüedad del antiguo `Hero`. `HeroSearch` sigue siendo el adapter de comportamiento de Home y reutiliza `SearchControl` (`src/shared/ui/search/`) como input presentacional compartido con `SearchPage`.

`SearchControl` es solo el input visual compartido: soporta uso controlado y no controlado mediante props estándar del `<input>`, pero no conoce `routeHash`, filtros ni navegación. En Home, `HeroSearch` sigue envolviéndolo dentro de un `<form>`; en SearchPage, `SearchField` sigue actuando como adapter controlado del texto de búsqueda.

Dentro de Home se completó además el cleanup de naming local: las clases `hero__search*` del viejo `Hero` pasan a `home-hero__search*`. Al buscar residuos documentales o de CSS, no hay que confundir `search-hero__search` con las clases legacy del Home hero.

Los filtros de segmento y carnet comparten labels/iconos con `#/comunidad/reviews`: segmentos principales con Material Symbols y carnet en orden `Carnet A2`, `Carnet A`, `A2 limitable`.

Los grupos de filtros avanzados (Marca, Segmento, Carnet, Precio, Potencia, Peso, Altura asiento, Electrónica, Uso recomendado, Calidad de datos) usan el componente compartido `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`) que importa sus propios estilos (`./FilterGroup.scss`). El shell del buscador mantiene su `grid-template-columns: minmax(18rem, 4fr) minmax(0px, 8fr);` para distribuir sidebar de filtros y listado de resultados. Tras la migración, los selectores SCSS huérfanos `.search-page__filter-group*` y `.search-page__filter-group-body` fueron eliminados en la rama `feature/filtergroup-residual-scss-cleanup`; los selectores activos de `__brand-grid`, `__segment-grid`, `__pill-list`, `__option-card`, `__toggle-grid` y `__range-*` se preservaron.

Estrategia vigente de segmentos en UI pública:
- se mantiene patrón compacto `primary + other` para evitar saturación en mobile;
- `other` es bucket visual de segmentos secundarios (no segmento canónico real);
- el contrato canónico vs visible ya está formalizado en capa shared de filtros/taxonomía;
- no se abren todavía 16 chips públicos en buscador mientras el catálogo siga con cobertura desigual por segmento.

El compare tray del buscador muestra mini-slots de motos seleccionadas y skeletons hasta completar 3 espacios; el summary textual de “x/3 motos seleccionadas” se omite por redundante. El botón de comparar en SearchPage usa `MotorcycleGarageCardAction` con `isCompareAction` — helper presentacional que owning las clases internas del componente en vez de injectarlas manualmente.

## Comparador — setup hero local

La ruta `#/comparador` mantiene su estado normal para `2/3` motos, pero los estados de preparación ahora comparten un único hero local: `ComparatorSetupHero` dentro de `src/components/pages/ComparatorPage/ComparatorPage.tsx`. No es un shared hero global ni una variante de `PageHero` o `SearchHero`.

Contrato visual actual:
- fondo con `comparisonHeroImage` como media decorativa;
- overlay/gradiente para legibilidad;
- copy y CTAs centradas dentro del hero;
- mismo layout base para `0` y `1` moto seleccionada.

Estados:
- `0` motos: título de setup + CTA `Ir al buscador`.
- `1` moto: mismo hero, pero deja de verse vacío porque muestra la moto seleccionada entre la descripción y `.comparison-detail__empty-actions`.
- `2/3` motos: comparador normal sin cambios.

La card del estado de `1` moto reutiliza la visual language existente del comparador (`comparison-detail__hero-bike`, `comparison-detail__hero-bike--center`, `comparison-detail__data-notes`, `comparison-detail__hero-bike-actions`) e incluye imagen, línea brand/segment/A2, display name, notas de calidad de datos y acciones reales `Ver ficha` / `Quitar`.

Comportamiento asociado:
- `Quitar` limpia la compare queue con `saveCompareQueue([])` y navega de forma segura a `#/comparador`.
- Si hay una moto sugerida para completar la comparación, se mantiene la CTA primaria `Añadir ...`; si no, se conserva `Buscar otra moto`.
- No se introducen acciones fake/no-op en el hero local del comparador.

## Cards legacy — `BikeCard`

Estado: **retirado**.

- `BikeCard` fue eliminado tras la migración de Home a `FeaturedMachines`.
- `FeaturedBikes` también fue eliminado.
- El guardrail de label amigable para segmento ya no aplica a este componente (retirado).

## Home — FeaturedMachines

La sección `FeaturedMachines` vive en `src/components/sections/FeaturedMachines/`.

Estructura visual:
- Card 1: hero horizontal, imagen full-background (16:9), contenido superpuesto abajo.
- Cards 2 y 3: compactas full-background (4:5), imagen ocupando toda la card, contenido superpuesto abajo.
- Las 3 cards comparten gradiente/degradado para legibilidad del texto sobre la imagen.

Elementos por card:
- Badge numérico `01`/`02`/`03` en esquina superior izquierda con text-shadow.
- Título: marca en blanco, modelo en rojo/acento (`$color-accent-container`), text-shadow.
- Specs: `Engine` (cc), `Power` (hp), `Torque` (nm).
- CTAs: `Ver ficha` → `#/motos/[id]`, `Reviews` → `#/comunidad/[id]`.

Features NO permitidas en esta sección:
- km/h, peso, PS, segmento, ADV READY, TC+ EVO, View Configurator.
- Cualquier feature que no sean Engine, Power, Torque.

Contrato visual:
- Imagen: `object-fit: cover` con `position: absolute; inset: 0` (full-background).
- Overlay: gradiente `rgba($color-surface-lowest, 1)` → transparente (de abajo hacia arriba).
- Contenido: `position: absolute; inset: 0` con `z-index` superior al media.
- Badge: `position: absolute; z-index: 3`, no se solapa con título.
- Hover: `transform: scale(1.03)` solo en `<img>`, no en la card.

Responsive:
- Desktop: grid 1 columna (hero) + 2 columnas (compactas).
- Tablet: 2 columnas en secondary.
- Mobile: stack vertical, aspect-ratio 16:9 para compactas.

## Ficha de moto — BikeDetailPage con tabs

Estado: **Fases 1, 2, 2-B, 3, 4 y 5 implementadas**.

La ficha `#/motos/[moto-id]` se reorganiza por tabs para evitar una ficha demasiado larga:

| Tab | Contenido | Estado |
|-----|-----------|--------|
| Resumen | `bike-detail__riding` + `bike-detail__fit` (secciones normalizadas con section/container) | Implementada (Fase 1) |
| Especificaciones | bento grid de SpecCards + specs detalladas como sección hermana (heading `Especificaciones ampliadas`) | Implementada (Fases 2 y 2-B) |
| Comunidad | summary + reliability + reviews como secciones sisters, cada una con section/container propio | Implementada (Fases 3 y 4) |
| Comparar | related bikes con MotorcycleGarageCard + acciones reales de comparador via footerActions | Implementada (Fase 5) |

### Patrón de layout normalizado

Todas las secciones de tabs siguen el mismo patrón:

```html
<section class="bike-detail__section bike-detail__section--contexto bike-detail__nombre">
  <div class="bike-detail__section-container">
    ...contenido...
  </div>
</section>
```

- `.bike-detail__section` → ancho completo (width: 100%).
- `.bike-detail__section-container` → repite `@include container` + `@include section-spacing` para controlar max-width y padding horizontal.
- `.bike-detail__tab-content` → **no es contenedor de ancho**. Solo gestiona el flujo/ritmo vertical de los tabs.
- Objetivo: permitir que los fondos de sección ocupen todo el ancho mientras el contenido interno se alinea con el mismo contenedor.

Secciones Resumen:
- `bike-detail__riding`: `section.bike-detail__section.bike-detail__section--riding.bike-detail__riding` + container interno.
- `bike-detail__fit`: `section.bike-detail__section.bike-detail__section--fit.bike-detail__fit` + container interno.

Secciones Especificaciones:
- `bike-detail__specs-tab`: sección propia (bento grid, SpecCards, electronics, A2, price fallback).
- `bike-detail__specs-extended`: sección hermana, no anidada dentro de specs-tab. `section.bike-detail__section.bike-detail__section--specs-extended.bike-detail__specs-extended` + container interno. Heading `Especificaciones ampliadas` con `aria-labelledby="bike-detail-specs-title"`. Copy restaurada: `Detalles técnicos y equipamiento específico del modelo.`

Secciones Comunidad:
- `bike-detail__community-tab`: summary con `bike-detail__section--community-summary`.
- `bike-detail__reliability`: sección sister, `bike-detail__section--reliability` + container interno.
- `bike-detail__reviews`: sección sister, `bike-detail__section--reviews` + container interno.

Secciones Comparar:
- `bike-detail__compare-tab`: normalizado en ambos estados (empty y con related bikes). `bike-detail__section--compare` + container interno.

### Tab Especificaciones — detalles de implementación:
- `SpecificationsTab`: componente con bento grid de `SpecCard`.
- 8 cards base: Motor (cc), Potencia (HP), Torque (NM), Peso (KG), Altura asiento (MM), Depósito (L), Carnet, Precio.
- Card electrónica/features: solo features activas filtradas con `filter(([, isEnabled]) => isEnabled)`. No renderiza `false`.
- Card A2: solo si `isA2Compatible` o `isA2LimitedVersion`. Muestra badge y versión limitada con `limitedPowerHp`/`originalPowerHp`. Usa icono `getMotorcycleTechnicalIcon('license')` — `a2` no es key independiente.
- Precio: `isPendingPrice` → `pendingPriceLabel` ("Precio pendiente de confirmar") si `priceEur <= 0` o `source = placeholder`. Nunca `0 €`.
- Módulo compartido de iconos técnicos: `src/shared/motorcycles/motorcycleTechnicalIcons.ts` exporta `motorcycleTechnicalIconMap` (18 keys), `MotorcycleTechnicalIconKey`, `getMotorcycleTechnicalIcon`.
- Iconos: `fuelTank → oil_barrel`, `consumption → local_gas_station`, `license → workspace_premium`, etc.
- Diseño inspirado en Stitch/specs.html: bento grid, border sutil, hover, adaptado a SCSS/MotoAtlas.
- Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile.
- No se muestran suspensiones, frenos ni neumáticos (no existen en modelo Bike).
- Sección extendida debajo del bento grid: heading `Especificaciones ampliadas` con copy `Detalles técnicos y equipamiento específico del modelo.` y grupos detallados (Motor & transmisión, Chasis & ergonomía, Mercado & registro).

Decisiones:
- Sin tab Metodología (existe `#/metodologia`).
- Tab Resumen activa por defecto.
- Layout normalizado: cada sección tab ahora es `section.bike-detail__section` full-width con `.bike-detail__section-container` interno que controla max-width y padding. Elimina double-container y permite que los fondos de sección ocupen todo el ancho. Verificado en Quality Gate con typecheck clean y 1088 tests passing.
- `bike-detail__community-summary` reducido a strip compacto. Muestra rating medio o "Sin rating", review count o "Sin reviews", y confidence shield si hay datos. Reviews limitados a 3 con `reviews.slice(0, 3)`. CTAs "Escribir review" y "Ver reviews" en footer de sección reviews (link a `#/comunidad/[bike.id]`). FeaturedReviewCard mantiene `hideImage`, `hideLinks` y acciones seguras sin cambios.
- Precio: fallback textual cuando no hay dato fiable.
- Fiabilidad/problemas: dentro de Comunidad como sección sister, no anidada.
- Mobile: responsive funcional; refinados premium pospuestos a fase mobile-first.
- No duplicar CTA a reviews si ya está en hero de la ficha.
- QA visual pendiente: verificar gap vertical entre `bike-detail__specs-tab` y `bike-detail__specs-extended` en desktop. Si es excesivo, posible follow-up SCSS: `.bike-detail__section--specs-extended .bike-detail__section-container { padding-block-start: 0; }`.

Pendiente:
- Cableado completo de Report/Reply en BikeDetailPage (futuro opcional).
- TopRatedMotorcyclesPage RecentReviews sin cambios en esta fase.
- Refinado visual/global de layout pospuesto a fase futura (después de cerrar funcionalidad core).

Reglas:
- no renderizar `null`/`undefined`; fallbacks controlados.
- no copiar CSS de `ReviewModal`.
- `MotorcycleGarageCard` sigue presentacional.
- no ampliar schema `Bike` salvo decisión explícita.

Secciones residuales cerradas:
- `bike-detail__specs` old → eliminada del flujo principal; specs detalladas dentro de Especificaciones tab (Fase 2C).
- `bike-detail__reliability` → movido a CommunityTab (Fase 4.2).
- `bike-detail__reviews` → movido a CommunityTab con FeaturedReviewCard compacto `hideImage`/`hideLinks` (Fases 4.3B/4.3C).
- `bike-detail__related` → integrado en CompareTab (Fases 5.1/5.2).
- `bike-detail__quick-specs` y `bike-detail__features` parcialmente absorbidas por SpecificationsTab y, en rama `feature/bike-detail-technical-spec-cards`, cerradas con extracción de `TechnicalSpecCard` a `src/components/motorcycles/TechnicalSpecCard/`. El SCSS huérfano de `quick-specs`, `features`, `feature-list` y el `h2` legacy de `__specs` fue eliminado. `SpecCard` local fue reemplazado por `TechnicalSpecCard` shared (presentacional, sin fetch, no conoce `BikeDetailPage`).

## Datos demo para QA visual

Estado: mejora de realismo del generador mock implementada y validada; toggle admin sigue pendiente (P2 técnico).

La validación visual de `FeaturedReviewCard`, `MotorcycleGarageCard`, bloques editoriales, rankings y superficies de ficha ahora cuenta con mocks menos repetitivos y más útiles para stress visual. No es un cambio de UI, sino una mejora del dataset de QA.

Estado actual del generador:
- comentarios con perfiles `short` / `medium` / `long`;
- tono por rating (`positive`, `balanced`, `critical`);
- variedad por uso (`touring`, `offroad`, `daily`, `passenger`, `city`, `sport`) y por segmento;
- `pros`/`cons` con cantidad variable y contexto más realista;
- sanitización para evitar `null` / `undefined` visibles;
- contrato `source='mock'` preservado, sin tocar `source='user'` ni `source='seed'`;
- `data/mock/mockReviews.json` no se regeneró en ese bloque.
- la exposición pública de `seed/mock` ahora pasa por un guard central de entorno/runtime; no es un cambio de UI y el toggle admin sigue pendiente.

## Comunidad landing

La ruta `#/comunidad` se organiza en hero, Podium rankings, Trending, bloque de dos columnas con Comunidades activas + Reviews recientes y CTAs finales para solicitar modelo o buscar una moto para opinar. El Podium rankings replica visualmente el podio de `#/comunidad/rankings` (mismo lenguaje de cards, shield de confianza y tooltip). `Top Rated` ya no aparece como bloque separado en esta landing. En `Reviews recientes` se usa `FeaturedReviewCard` con acciones comunitarias seguras (Fase 4.4): Helpful/NotHelpful reales en auth, Útil N pasivo en no-auth, Report/Reply no cableados.

El hero de `#/comunidad` usa el componente compartido `PageHero` (rama `feature/page-hero-community-base`, Fase A de la unificación de heroes). A partir de esa rama, el hero **ya no muestra CTAs** (`Explorar comunidades`, `Comparar motos`) porque la navegación vivirá en una futura navbar/subnav. La misma prop opcional `variant?: 'community' | 'topRated'` distingue en `TopRatedMotorcyclesPage` entre la renderización de `#/comunidad` (sin CTAs) y `#/motos-mejor-valoradas` (con CTAs preservados). La subnav de comunidad y los enlaces a `#/comunidad/rankings` y `#/comunidad/reviews` se consolidarán en una fase posterior.

Paridad resuelta:
- en `#/comunidad`, las cards de podio en posiciones 2 y 3 ya muestran el mismo span de metadatos que `#/comunidad/rankings`.
- metadato actual de contrato visual en ambos podios: `año · segmento · cilindrada (cc)`.

## Comunidad — Rankings

La ruta `#/comunidad/rankings` muestra rankings por categoría con datos reales de reviews aprobadas.

Elementos principales:
- Podio top 3 con imagen, stats y shield de confianza con tooltip visual. **NO se ve afectado por filtros.**
- Grid de 8 categorías (global, daily, travel, sport, a2, power-weight, reliability, passenger).
- Listado técnico con filtros por segmento, carnet y uso. **No usa `<table>`; usa cards/grid responsive.**

El hero de `#/comunidad/rankings` usa el componente compartido `PageHero` (Fase A). A partir de la rama `feature/page-hero-community-base` el hero **ya no muestra CTAs** (`Explorar rankings`, `Ver comunidad`) porque la navegación vivirá en una futura navbar/subnav.

**Pendiente:** rediseño mobile avanzado del listado técnico (cards responsive más refinadas) — **pospuesto a fase global mobile-first**. El responsive actual es funcional y correcto, pero no se invertirá en refinado mobile premium hasta una fase posterior con diseño específico desde Stitch.

Datos:
- `reviewCount`: conteo real de reviews `approved` por moto.
- `averageRating`: rating medio de reviews aprobadas.
- `confidence`: Alta (≥10 reviews), Media (≥3), Baja (<3).
- `score`: presentado como índice 0–10 (no estrellas); usa icono `analytics`.
- Score interno clampado 0–100; score visible clampado 0–10.

Confidence shield:
- Visual: shield con colores (high=verde, medium=ámbar, low=gris).
- Tooltip propio en hover/focus: "Alta confianza", "Media confianza", "Baja confianza".
- No usa `title` nativo del navegador.

Aspectos técnicos:
- Se cargan batch desde `motorcycle_review_aspects` via `getReviewAspectsByReviewIds`.
- Se agregan por `motorcycleId` y `category` contando positive/negative.
- Score de aspecto: `(positive - negative) / total`.
- Pesos por categoría definidos en `RANKING_ASPECT_WEIGHTS`.
- Ajuste escalonado por confianza: 35% (<3), 70% (3-9), 100% (≥10).

**Filtros:** afectan SOLO al listado técnico (segment, license, use, search). El podio permanece siempre global y sin filtros. El componente `PodiumCard` es compartido entre `TopRatedMotorcyclesPage` (`#/motos-mejor-valoradas`) y `CommunityRankingsPage` (`#/comunidad/rankings`), lo que garantiza paridad visual entre ambas rutas. La prop `showConfidence` permite controlar la visibilidad del shield de confianza directamente; tiene tests unitarios dedicados.

Nota de estrategia taxonómica:
- esta vista puede exponer segmentos canónicos explícitos (`BIKE_SEGMENTS`) para análisis técnico;
- convive con vistas públicas compactas (`primary + other`) respaldadas por contrato formal canónico vs visible;
- la diferencia está documentada y su criterio cross-page queda pendiente de armonización futura.

Metodología visible en página menciona datos técnicos, reviews aprobadas y aspectos agregados.

Nota: el score de rankings (0–10 con icono `analytics`) es independiente del rating de reviews individuales (/5 con estrellas).

## Comunidad — Reviews públicas

La ruta `#/comunidad/reviews` funciona como entrada pública a reviews `approved`: los bloques editoriales superiores muestran reviews individuales, mientras `Garaje de la comunidad` agrupa reviews por moto y pagina 9 modelos por página.

El hero de `#/comunidad/reviews` usa el shared `PageHero` desde la rama `feature/page-hero-community-reviews` (Fase B), y la rama `feature/page-hero-purity-cleanup` limpia su implementación para mantener `PageHero.scss` puro. La página pasa `className="community-reviews-page__hero"` sin añadir props nuevas a la API TypeScript; `CommunityReviewsPage.scss` es dueña del full-bleed, doble gradient, filtro local, contenido centrado y `fade-in`. Se conserva `src/assets/hero-community.png`. Ya no muestra los CTAs `Explorar reviews` ni `Buscar moto para opinar`, porque la navegación comunitaria vivirá en una futura navbar/subnav.

Debajo del hero hay un bloque editorial separado del garaje filtrable: `Reviews destacadas`, `Últimos reportes` e `Insights en vivo` se calculan desde reviews `approved` cargadas y no dependen de los filtros. Los filtros solo afectan a `Garaje de la comunidad`, que agrupa por `motorcycleId` y calcula rating medio (sobre 5 con estrella), número de reviews, última review en formato corto DD.MM.YY, y uso más repetido. El panel de filtros es apply-on-change en tiempo real; el botón "Aplicar" cierra el panel en mobile. El aside `Insights en vivo` (kicker "Pulso de la comunidad · Actividad reciente") muestra 4 signals comunitarios con copy conservadora: "Moto más comentada" (moto con más reviews), "Review más útil" (mayor `helpfulCount`), "Segmento más activo" (label friendly de `segmentLabels`) y "Uso más activo" (label friendly de `accountReviewRidingStyleLabels`). Subtítulo: "Señales según reviews aprobadas, no en tiempo real." Polling suave cada 60 segundos, footer "Datos aproximados · {refreshLabel} · Según reviews aprobadas". No se renderizan: review con más kilómetros, rating medio global, ni datos sensibles de usuario. Si en el futuro product copy decide renombrar el h2 a "Pulso de la comunidad", será un cambio puntual con su propio test. Las cards del garaje usan `MotorcycleGarageCard` (componente extraído en `src/components/motorcycles/MotorcycleGarageCard/`), con shield de confianza junto al rating /5 con estrella, tooltip visual (Alta/Media/Baja confianza) y CTAs reducidos "Reviews" y "Ficha técnica". `MotorcycleGarageCard` también se reutiliza en `#/buscador` con acciones compactas para comparar.

El Podio rankings de `#/comunidad` ahora usa `PodiumCard` compartido con `#/comunidad/rankings` y `#/motos-mejor-valoradas`. Paridad visual garantizada: ambos podios usan el mismo componente self-styled con CSS propio. Estilos de layout de página (`.top-rated__podium`, `.rankings__podium-grid`, etc.) permanecen en las páginas; los estilos de card interna son responsabilidad del componente.

**Criterio `Reviews destacadas`:** prioriza utilidad comunitaria (votos `Útil`). Criterio: 1) `helpfulCount` desc, 2) rating desc, 3) comentario más largo, 4) más reciente. Si no hay votos útiles (o fallan las reactions), usa fallback por rating/fecha/completitud — nunca queda vacío. **Los kilómetros declarados NO son criterio** para destacar. `Últimos reportes` es cronológico puro (fecha desc), no usa helpfulCount. Cada bloque editorial deduplica internamente por `motorcycleId`; no hay deduplicación editorial↔garaje.

Los bloques editoriales superiores reutilizan `FeaturedReviewCard` (alias público, rating, metadatos y body expandible con comentario/pros/contras/aspectos cuando existan). El garaje usa cards de moto agrupada con fondo completo, rating medio /5 con estrella y shield de confianza. Los filtros replican el patrón visual del buscador: grupos con botones/chips, rating con estrellas y panel inferior en mobile. Los grupos de filtro (Segmento, Carnet, Rating, Uso principal, Orden) usan el componente compartido `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`) que importa sus propios estilos (`./FilterGroup.scss`).

Las `FeaturedReviewCard` de reviews destacadas y últimos reportes tienen acciones comunitarias reales: Helpful, NotHelpful, Report (con formulario) y Reply (con lazy loading por review). `Útil N` se trata como **contador público**: siempre se muestra, pero solo es interactivo cuando hay permiso real (auth + review ajena + no reportada). En no-auth, review propia o review reportada se renderiza en modo pasivo/no interactivo. Si la review es propia, mantiene chip `Propia` en la zona de acciones. `No útil`, `Reportar` y `Responder` no se renderizan cuando no hay permiso real (sin handlers no-op). La mutación de reacciones se consolida con `useReviewReactions` (hook UI-agnóstico) y en esta página se usa con UX silenciosa. El bloqueo de reacciones se calcula desde `reportedReviewIds` (`getMyReviewReports`): si una review ya fue reportada, Helpful/NotHelpful quedan bloqueadas. Al reportar, la reacción previa del usuario se limpia con `clearMyReviewReaction` y la review queda bloqueada para nuevas reacciones. El flujo de reportes se consolida con `useReviewReports` (hook UI-agnóstico); en esta página se usa sin feedback visual adicional en no-auth. Fotos de usuario quedan para fases futuras.

Los filtros de segmento/carnet usan las mismas constantes visuales que el buscador; `Sport` usa `speed`, `Touring` usa `explore` y el carnet se presenta como `Carnet A2`, `Carnet A`, `A2 limitable`.

Nota de alcance taxonómico:
- en comunidad/reviews se mantiene UX compacta `primary + other`;
- esta decisión queda respaldada por contrato formal (canónico 16 + visible compacto);
- no abrir 16 categorías explícitas en chips públicos hasta tener mayor cobertura de catálogo y thresholds definidos.

**Contratos de comportamiento:** Ver `docs/product-behavior-contracts.md` para reglas de FeaturedReviewCard, acciones comunitarias (Helpful/NotHelpful/Report), chip `Propia`, deduplicación editorial y garaje.

## Comunidad por moto — Reviews

La ruta `#/comunidad/[motorcycleId]` reemplaza el slider de `Verified owner reports` por un listado compacto vertical de experiencias aprobadas. Los filtros de esta fase viven en el sidebar (`rating` y `orden`), seguidos por `Problemas comunes e insights`; en mobile pasan a panel responsive y la paginación muestra 5 reviews por página. Los grupos de filtro (Rating, Orden) usan el componente compartido `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`) que importa sus propios estilos (`./FilterGroup.scss`). `FilterOptionButton` y `FilterRatingStars` locales se preservan para mantener los selectores `__filter-option*`, `__filter-stars` y `__filter-star--filled` activos y dar estilos premium a los chips con icono y a las estrellas de rating. Usuarios autenticados pueden marcar una review como `Útil` o `No útil`; `Útil` muestra contador público, `No útil` queda como feedback privado sin contador público. Ambas reacciones son mutuamente excluyentes y no se permite autoreacción. Las mutaciones de reacciones se consolidan con `useReviewReactions`, manteniendo la UX propia de esta página (tooltip en no-auth/reportada y `reactionNotice` en error). También pueden reportar reviews ajenas con un motivo controlado; hay un reporte por usuario/review y no se muestra contador público. El reporte usa `useReviewReports` conservando la UX propia de esta página (tooltips en no-auth/success/duplicate y `reactionNotice` en error no duplicado). El pending combinado (`reactionPendingIds + reportPendingIds`) evita dobles envíos incoherentes entre reacciones y reportes. Respuestas, menciones, reportes de respuestas y fotos quedan pendientes.

Auditoría Auth: esta página conserva intencionalmente una excepción frente al patrón pasivo de otras superficies públicas. En no-auth renderiza `Útil`, `No útil` y `Reportar` como acciones clicables con tooltip de login; los hooks bloquean antes de red. No es una mutación falsa, pero queda como inconsistencia UX P3 a armonizar.

## Admin — Moderación

Las rutas `#/admin` y `#/admin/moderacion` son privadas para perfiles con `user_profiles.role = admin`. El dashboard admin es mínimo y enlaza a moderación; `#/admin/moderacion` lista reportes de reviews con filtros por estado, motivo y orden.

La moderación separa dos conceptos:
- estado del reporte (`Pendiente`, `Revisado`, `Descartado`, `Resuelto`)
- estado de la review (`Oculta`, `Aprobada`, `Rechazada`)

Los filtros admin adoptan el patrón de `cuenta/reviews`: header/body/footer, iconos Material Symbols y secciones desplegables por grupo (`Estado del reporte`, `Motivo`, `Orden`) con chevron nativo de `<details>`/`<summary>`. El panel ya no depende del padding de card heredado; el espaciado se controla solo desde header/body/footer para evitar doble padding y desalineación.

Los filtros admin usan los componentes compartidos `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`) y `FilterOptionButton` (`src/shared/ui/filters/FilterOptionButton.tsx`), con `classPrefix="admin-page"` para preservar las clases SCSS `admin-page__filter-option` y `admin-page__filter-option--active`. El estado abierto/cerrado lo gestiona nativamente el `<details>` del `FilterGroup`; admin preserva el initial state original usando `defaultOpen` (primera sección abierta por defecto, resto cerradas). Los iconos Material Symbols por opción, los labels, el estado activo, `aria-label` con prefijo del grupo, `aria-pressed` y el `onClick` con `onChange({ key: value })` se preservan. La lógica de admin (report status, report reason, moderation sort, review status, origin/source, segment, verification, license, riding style, requests filters, paginación con reset al cambiar filtros, acciones de moderación y auth gate) no cambia.

`#/admin/moderacion` pagina el listado de reportes en bloques de 6. El orden/filtros de admin se aplican primero y luego se recorta la página activa; al cambiar filtros o limpiar filtros, la paginación vuelve a la página 1.

Las report cards son plegables por defecto: el header deja visible estado, motivo, reportante y contexto rápido de la review; el detalle (comentario, pros/contras y acciones) se despliega bajo demanda con trigger accesible (`aria-expanded`/`aria-controls`).

Los botones de acciones de moderación tienen hover por intención visual (azul para `Marcar revisado`, rojo para `Descartar`/`Rechazar`, verde para `Resuelto`/`Aprobar`, gris para `Ocultar`) sin heredar hover rojo genérico.

Si el admin actúa sobre la review desde ese reporte, la review cambia de estado y el reporte se marca automáticamente como `action_taken` (visible como `Resuelto`). El tab de respuestas pendientes de moderación está implementado. Avisos al autor y cierre de contratos de respuestas quedan para fases futuras. `#/admin/solicitudes` ya fue auditado (ver bloque dedicado más abajo).

Estado de fase:
- La base de la Fase 2.5 (moderación/admin) está mayoritariamente implementada.
- Lo pendiente es residual y debe entrar por auditoría focal (avisos al autor y cierre de contratos de moderación de respuestas). `#/admin/solicitudes` ya cuenta con auditoría funcional en rama `feature/admin-requests-audit`.

## Admin — Reviews por modelo

La ruta `#/admin/reviews` muestra cards agrupadas por `motorcycleId` con imagen, metadatos y CTAs. Cada card muestra:
- `X reviews nuevas` (conteo de reviews con `status = pending` en esa moto).
- `Última review: ...` calculada por la review más reciente del grupo.
- CTAs `Revisar reviews` y `Ver ficha`.

Hay filtros por estado, origen, verificación y orden. El CTA `Revisar reviews` lleva a `#/admin/reviews/[motorcycleId]` donde se pueden gestionar las reviews de esa moto concreto.

`AdminReviewCard` muestra `ReviewAspectSummary` con los aspectos técnicos de cada review. Las acciones disponibles son aprobar, ocultar y rechazar.

La agrupación prioriza motos con reviews pendientes.

## Admin — Solicitudes de modelos

La ruta `#/admin/solicitudes` es privada para perfiles con `user_profiles.role = admin` y se apoya en `AdminGate` igual que el resto de rutas admin. La rama `feature/admin-requests-audit` dejó la UI auditada funcionalmente y la rama `feature/admin-requests-phase-1` aplicó la Fase 1 de cierre funcional sin tocar schema/RLS. Quality Gate: typecheck clean, 1117 tests passing (72 files).

Ruta y layout:
- hash route `#/admin/solicitudes`.
- hero admin basado en `motorcycle-community__hero` con eyebrow `ADMIN STUDIO`, título `Solicitudes de modelos`, descripción `Gestiona las solicitudes de nuevos modelos enviadas por la comunidad.` y chip del admin activo (`verified_user` + `getDisplayName`).
- body con `account-page admin-page` y `admin-page__layout` (sidebar + main).

Sidebar admin (reutilizado, `AdminRequestsFilterSidebar`):
- quick links a Panel admin (`#/admin`), Moderación (`#/admin/moderacion`), Reviews (`#/admin/reviews`), Solicitudes (`#/admin/solicitudes`, marcada como activa) y Mi cuenta (`#/cuenta`).
- header de filtros con título `Filtros`, botón `Limpiar filtros` (deshabilitado cuando no hay filtros activos; al activarlo resetea a página 1) y botón `close` accesible (`Cerrar filtros de solicitudes`).
- cuerpo de filtros con búsqueda `Buscar por marca o modelo` (input `type="search"`, icono `search` Material Symbols), grupo `Estado` (abierto por defecto), grupo `Origen` y grupo `Fecha de creación` (cerrados por defecto).
- footer con `Limpiar filtros` y `Aplicar filtros` (este último cierra el panel/drawer en mobile).
- el sidebar se monta como sheet/drawer responsive con backdrop y `Escape` para cerrar en mobile; desktop lo muestra permanente.

Filtros disponibles (multi-select):
- `Estado` (multi): Todas, Pendientes, Revisadas, Aprobadas, Rechazadas (iconos `apps` / `pending` / `fact_check` / `task_alt` / `cancel`). Combinables entre sí.
- `Origen` (multi): Todas, Usuario, Admin, Import (iconos `apps` / `person` / `shield_person` / `cloud_upload`). Combinables entre sí.
- Búsqueda libre por marca o modelo.
- `Fecha de creación`: inputs `type="date"` Desde / Hasta. El admin puede fijar solo uno de los dos; si fija ambos, el servicio interpreta `createdFrom` como `T00:00:00.000Z` y `createdTo` como `T23:59:59.999Z` (día completo, no se excluyen solicitudes del día final). Los inputs llevan `min`/`max` cruzados para evitar invertir el rango.
- Los filtros usan `FilterGroup` + `FilterOptionButton` compartidos con `classPrefix="admin-page"`.

Regla `Todas` consistente en multi-select:
- `Todas` significa "sin filtro". `aria-pressed=true` solo si el grupo está vacío.
- Al click en `Todas` se vacía la selección del grupo correspondiente.
- Al activar un valor específico (`Pendientes`, `Rechazadas`, `Usuario`, `Import`, etc.) mientras `Todas` está activo, `Todas` se desactiva automáticamente.
- La lista de chips en el backend se traduce a `in.(...)` cuando hay varios valores, `eq.X` cuando hay uno solo y se omite cuando el array está vacío (lo que se representa en el UI con `Todas` activo).

Summary de resultados (`admin-page__results-summary`, `aria-live="polite"`):
- Se muestra solo cuando hay resultados cargados.
- Copy conservador basado en el dataset cargado por la página, no en totales del backend:
  - `X solicitudes cargadas` (sustantivo en plural para `X !== 1`, en singular para `1`).
  - Si hay pendientes: `· Y pendientes` (con sufijo `-s` salvo cuando `Y === 1`).
  - Si la paginación tiene más de una página: `· Mostrando A-B` con el rango visible actual.
- No se renderiza cuando la lista está vacía (ahí toma el relevo el empty state).

Paginación:
- Tamaño: 10 elementos por página (`REQUESTS_PER_PAGE`), consistente con el patrón admin de reportes.
- Componente compartido `AccountPagination` (mismo usado en `#/admin/moderacion`) con `ariaLabel="Paginación de solicitudes admin"` y clase `admin-page__pagination`.
- Cambiar los valores reales de filtros/búsqueda/fechas resetea automáticamente a página 1, incluso al sustituir una selección por otra con la misma cantidad de elementos.
- Si hay una sola página no se renderiza el paginador (el componente retorna `null`).
- Cambiar de página colapsa las cards expandidas.

Listado de solicitudes (`AdminRequestCard`):
- patrón expandible tipo `admin-page__report-card` con `admin-page__report-card--expanded` cuando está abierto. Header accesible con `aria-expanded`/`aria-controls`, badge de estado (`admin-page__status-pill` con `data-status`), título `Marca Modelo Año` y línea de reportero `@usuario · fecha`.
- Detalle expandido (`admin-page__request-detail`) en grid responsive:
  - grid de 2 columnas con `Marca` y `Modelo`.
  - grid de 3 columnas con `Año` (o `No especificado`), `Segmento` (o `No especificado`) y `Origen` (etiqueta mapeada desde `requestSourceLabels`).
  - campos full-width opcionales: `Usuario` (si hay `userName`/`userId`), `Email de contacto` (si hay `contactEmail`), `Página oficial o fuente` (con link externo `target="_blank" rel="noopener noreferrer"` e icono `open_in_new`) y `Comentario` con estilo `--comment`.
- Fecha formateada con `Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })`; si el valor es inválido se muestra `Fecha pendiente`.
- Acciones admin en footer (`admin-page__action-group` con `h3` `Gestionar solicitud`):
  - `Marcar revisada` (`admin-page__action-button--reviewed`).
  - `Aprobar` (`admin-page__action-button--approve`).
  - `Rechazar` (`admin-page__action-button--reject`).
  - Cada acción queda `disabled` cuando ya coincide con el estado actual de la solicitud o cuando hay una acción pendiente (`pendingAction` por id de solicitud).
- El click en una acción dispara `updateModelRequestStatus` con feedback: `Solicitud marcada como revisada.` / `Solicitud aprobada.` / `Solicitud rechazada.`, o `No se pudo completar la acción sobre la solicitud.` en error.

Estados de carga y feedback:
- hero con chip admin (loading-safe).
- aviso de éxito: `role="status"` con el copy de acción completada.
- error: `account-page__empty-state--error` con icono `error`, mensaje y botón `Reintentar` que vuelve a llamar a `getAllModelRequests`.
- loading: `admin-page__loading` con copy `Cargando solicitudes...`.
- empty state: `account-page__empty-state` con icono `fact_check` y copy `No hay solicitudes con estos filtros.`.

Validación defensiva de `segment` en `#/solicitar-modelo`:
- El formulario público sigue usando el selector de `BIKE_SEGMENTS` con las 16 categorías canónicas (no se reemplazó por un input libre).
- `createModelRequest` normaliza un `segment` vacío o compuesto solo por espacios a `null`, rechaza un valor no vacío fuera de `BIKE_SEGMENTS` antes de llamar a red y preserva un segmento canónico válido en el payload.
- Esto blinda el endpoint público sin tocar el selector canónico del form ni cambiar el comportamiento visible por defecto.

Limitaciones actuales (Fase 1 cerrada, pendientes para Fase 2/3/4 sin cambios estructurales de schema):
- sin `motorcycle_id` que vincule la solicitud a una moto creada.
- sin `in_review`, `duplicate` o `created` en el enum de estados actual.
- sin notas internas ni motivo de rechazo visible para el solicitante.
- sin creación de moto a partir de solicitud aprobada.
- sin notificaciones al solicitante (cualquier vía futura debe pasar por backend/edge/email, nunca con `service role key` en frontend).
- sin detección de duplicados (`brand` + `model` + `year`).
- sin acciones en lote sobre múltiples solicitudes.

## Mi cuenta — Reviews

La ruta `#/cuenta/reviews` funciona como “Mi garaje de reviews”: agrupa las reviews del usuario autenticado por moto, pagina modelos agrupados y aplica filtros sobre marca/modelo, segmento, carnet, rating medio, uso principal y orden. Los filtros usan el componente compartido `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`) que importa sus propios estilos (`./FilterGroup.scss`); no requiere que la página cargue sus estilos. Los filtros replican el patrón visual de `#/comunidad/reviews` con header/body/footer y botones/chips sin selects; en desktop viven dentro del sidebar de cuenta antes del notice y en tablet/mobile usan panel responsive. El CTA `Ver mis reviews` de cada moto apunta al detalle privado `#/cuenta/reviews/[motorcycleId]`.

La ruta `#/cuenta/reviews/[motorcycleId]` muestra solo las reviews propias de una moto concreta. Cada review muestra estado traducido (`Publicada`, `Pendiente`, `Oculta`, `Rechazada`), pros/contras saneados, `ReviewAspectSummary` con aspectos técnicos si existen, contador pasivo de útiles recibidos y CTA hacia reviews públicas. Los filtros de rating y orden usan el componente compartido `FilterGroup` (`src/shared/ui/filters/FilterGroup.tsx`).

En `#/cuenta`, el bloque “Mis reviews” agrupa las reviews propias por moto, muestra hasta 3 modelos ordenados por última review y usa una card visual tipo garage con CTAs `Ver mis reviews` y `Ver ficha`.

`AccountReviewCard` mantiene una estructura visual compartida en cuenta y comunidad: imagen izquierda, título + rating en cabecera, metadatos con iconos, acciones inferiores y enlace secundario `Más reviews`. La estructura de autor queda preparada para un badge futuro de reviewer verificado mediante clases dedicadas, sin mostrar badges falsos.

- carga reviews propias mediante RLS y token de sesión.
- filtra en cliente por marca/modelo, estado y uso principal.
- ordena por fecha, rating o kilómetros.
- pagina en frontend a 5 reviews por página.
- usa `AccountReviewsEmptyState` para el estado “sin resultados” con radar CSS y soporte `prefers-reduced-motion`.
- edición, borrado/retirada y panel admin quedan pendientes.

## Auth y envío de reviews

`ReviewModal` queda **auth-only** desde la rama `feature/review-auth-only-contract`. El CTA `Escribir review` se sigue renderizando en `#/motos/[id]` (Comunidad tab) y en `#/comunidad/[motorcycleId]` (hero + empty state), pero para usuarios no autenticados:

- el botón recibe `aria-disabled="true"` y un estilo locked (filter grayscale 0.15, opacity 0.78, cursor not-allowed) sin perder foco/click.
- al pulsarlo se muestra un hint `Inicia sesión para escribir una review.` con `aria-live="polite"` y `role="status"` durante ~4s; el modal no se abre y la RPC `create_motorcycle_review_with_aspects` no se invoca.
- el contador `Útil N` y las replies `approved` siguen visibles y pasivos para no-auth (sin acción).

El componente compartido `AuthRequiredAction` (`src/shared/ui/auth/AuthRequiredAction.tsx` + `AuthRequiredAction.scss`) encapsula este patrón con un timeout cleanup en `useEffect`. Cada consumidor pasa un `hintId` único (vía `useId()`) para mantener `aria-controls`/`id` correctos y permitir que el hint sea anunciado por tecnología de asistencia al activarse.

No se ha añadido cross-link a `#/login` en el hint para mantener el cambio mínimo: el copy dirige al usuario y la fase global de unificación Hero/CTAs consolidará el patrón de cross-link real entre CTA bloqueado y ruta de login.

`createReview` no debe invocarse en este camino: ni `ReviewModal` ni la RPC se exponen al usuario anónimo. El envío anónimo previo al cambio fallaba en la red (RPC exige `auth.uid()`) y quedaba como gap de producto; ahora el camino se cierra en UI de forma explícita y testeable.

Las rutas de cuenta muestran estados privados controlados sin sesión y cargan datos solo con `user.id` + `session.access_token`. Las rutas admin exigen sesión + rol admin; no se habilitan solo por estar autenticado.


## Páginas de Datos y Legal

Las rutas enlazadas desde el footer ya tienen páginas reales en `src/components/pages/StaticInfoPages/`:

- `#/metodologia` — explica procedencia `api`, `manual`, `estimated`, `user` y `placeholder`.
- `#/fuentes-datos` — resume fuentes externas, revisión manual, comunidad, imágenes y ratings.
- `#/solicitar-modelo` — formulario conectado a `model_requests`; valida marca, modelo y año, y permite envío anónimo o autenticado.
- `#/privacidad` — base inicial de privacidad pendiente de revisión legal final.
- `#/terminos` — base inicial de términos de uso pendiente de revisión legal final.

Estas páginas ignoran header/footer de Stitch y usan el Navbar/Footer reales de MotoAtlas.

---

## PageHero — base normalizada de heroes de comunidad/admin

Componente compartido `src/components/ui/PageHero/PageHero.tsx` introducido en la rama `feature/page-hero-community-base` (Fase A de la unificación de heroes). Replica la estructura del antiguo `CommunityHero` con API mínima:

- `titleId` (requerido): id del `<h1>` para `aria-labelledby` del `<main>` padre.
- `title` (requerido): el `<h1>`.
- `eyebrow?` (opcional): label uppercase con `label-caps` y color `$color-accent`. Si no se pasa, no se renderiza.
- `description?` (opcional): `<p>` con `body-lg`. Si no se pasa, no se renderiza.
- `imageSrc?` (opcional): URL de imagen de fondo full-bleed. Filtros `grayscale(0.32) contrast(1.1)`, opacidad 0.64 y overlay degradado vertical replicando el patrón del antiguo `CommunityHero`.
- `imageAlt?` (opcional): alt para la imagen. Si no se pasa, la imagen queda decorativa (`aria-hidden="true"`).
- `className?` (opcional): clase adicional aplicada a la `<section>`. Las páginas admin lo usan para mantener `admin-page__community-hero admin-page__hero` y conservar el SCSS contextual.
- `children?` (opcional): slot para contenido extra al final del `__content`. Las páginas admin inyectan el chip de admin activo.
- `actions?` (opcional): array de `PageHeroAction` (`{ href?, onClick?, label }`) que renderiza un grupo de CTAs con estilo `:first-child` como primary auto-aplicado.

Migraciones ya completadas en Fases A/B:
- 4 páginas admin (Dashboard, Reviews, Requests, Moderation): reemplazan `CommunityHero` por `PageHero` sin cambio visual.
- `CommunityRankingsPage` (`#/comunidad/rankings`): migra a `PageHero` y **quita las CTAs del hero** (`Explorar rankings`, `Ver comunidad`).
- `TopRatedMotorcyclesPage` (renderiza `#/comunidad` y `#/motos-mejor-valoradas`): nueva prop opcional `variant?: 'community' | 'topRated'`. En `variant="community"` el hero queda sin CTAs; en `variant="topRated"` se preservan `Explorar comunidades` y `Comparar motos`. `App.tsx` pasa `variant` según la ruta activa.
- `CommunityReviewsPage` (`#/comunidad/reviews`, rama `feature/page-hero-community-reviews`, Fase B): reemplaza el hero local por `PageHero` y elimina sus CTAs.

`PageHero` cubre los heroes editoriales/comunidad/admin donde el patrón encaja; `SearchHero` cubre el shell de búsqueda de Home + `#/buscador`. Son componentes distintos y no deben mezclarse en una sola abstracción.

`CommunityHero` (`src/components/ui/CommunityHero/CommunityHero.tsx`) se reconvirtió en **thin wrapper deprecated** de `PageHero` para mantener compatibilidad con importadores externos. Su SCSS (`CommunityHero.scss`) queda en el repo pero ya no es referenciado por el wrapper ni por consumidores activos; se eliminará cuando se complete la migración de consumidores externos (si los hubiera).

La limpieza post-Fase B no amplía la API TypeScript de `PageHero`: el `className` existente permite que el styling contextual viva en la página consumidora (`.community-reviews-page__hero`) sin dejar selectores page-specific dentro de `PageHero.scss`. Así se preservan doble gradient, `fade-in`, filtro de imagen y alineación centrada sin generalizar props visuales.

Pendiente para fases futuras (no incluido en este cambio):
- Revisar solo heroes simples adicionales que encajen de manera natural en un shell compartido; no forzar `PageHero` donde no encaja.
- `BikeDetailPage` y `MotorcycleCommunityPage` quedan fuera por decisión de producto: sus heroes son específicos y no deben documentarse como migraciones pendientes.
- `AccountPage` y páginas estáticas quedan como posibles candidatos de auditoría futura si el alcance se reabre.
- Decidir `HeroAction` system (rama `feature/hero-cta-audit` ya documentó la dirección).
- Consolidar variantes del `Button` shared con la tabla de la fase 13.1 de `product-roadmap.md`.
- Mobile-first de Fase 13b con validación visual en Stitch.

---

## Backlog futuro: Unificación de Hero, CTAs y Button System

Estado: **pendiente / no implementado**.

No es implementación. Es documentación de una tarea futura de pulido UI/SCSS.

**Objetivo:**
- Unificar estilos base de Hero en MotoAtlas.
- Crear patrones reutilizables de CTA/button/action.
- Reducir duplicación de estilos page-specific.
- Acelerar futuras fases de pulido con coherencia visual.

**Alcance futuro (no ahora):**

1. **Auditoría de implementaciones actuales de Hero:**
   - Identificar las variantes simples que puedan compartir un shell sin forzar una abstracción global.
   - Documentar qué tienen en común y qué varía por contexto.

2. **Definición de patrón/base compartidos:**
   - `PageHero`: shell editorial/comunidad/admin.
   - `SearchHero`: shell de búsqueda para Home + `#/buscador`.
   - `HeroAction`, `CtaGroup`, `Button`, `ActionLink`, `IconAction` siguen como futuras piezas posibles si hay una necesidad real.
   - Permitir variantes contextuales sin replicar estructuras completas.
   - No ampliar `PageHero` para cubrir casos que no encajan naturalmente.

3. **Normalización de grupos de CTA por página:**
   - Home, Buscador, Comunidad, Rankings, Reviews, Cuenta y Admin donde aplique.
   - Mantener flexibilidad para diferencias contextuales legítimas.

4. **Sistema de variantes de botón/acción a documentar:**
   - `primary`, `secondary`, `ghost`, `glass`, `glass-primary`, `glass-secondary`, `danger`, `success`, `link`.
   - Definir la semántica de cada variante y cuándo usar cada una.
   - No crear implementación todavía; solo documentar la intención.

5. **Convenciones de iconos para acciones comunes (dirección futura):**
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

   Estas convenciones son **dirección futura**, no implementación actual.

**Reglas:**
- No implementar ahora.
- No migrar heroes actuales.
- No rediseñar el sitio completo.
- No tocar código fuente, tests, SCSS, rutas, schema/RLS o Supabase.
- Documentar como backlog P3/P4 UI/SCSS.
- Mantener responsive funcional actual.
- Dejar lugar para diferencias contextuales por página.
- La fase mobile-first premium permanece como esfuerzo separado posterior a esta unificación.
