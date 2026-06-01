# Notas UI de MotoAtlas

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

Podio visual: replica el lenguaje del podio de `#/comunidad/rankings` — 3 cards con imagen full-background, overlay, badge numérico `01`/`02`/`03`, score con icono `analytics`, shield de confianza con tooltip (Alta/Media/Baja confianza) y CTA "Ver reviews". La card 01 ocupa la columna central destacada.

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
- en esta fase NO integra acciones comunitarias (Helpful/NotHelpful/Report/Replies) ni handlers no-op.

## Buscador

La ruta `#/buscador` pagina el listado a 9 motos por página. La paginación se calcula después de aplicar búsqueda, filtros y ordenación, mientras el contador conserva el total filtrado.

Los filtros de segmento y carnet comparten labels/iconos con `#/comunidad/reviews`: segmentos principales con Material Symbols y carnet en orden `Carnet A2`, `Carnet A`, `A2 limitable`.

El compare tray del buscador muestra mini-slots de motos seleccionadas y skeletons hasta completar 3 espacios; el summary textual de “x/3 motos seleccionadas” se omite por redundante.

## Ficha de moto — Quick specs (backlog)

Estado: backlog estratégico / futuro cercano.

La ficha `#/motos/[moto-id]` tiene `bike-detail__quick-specs` y se planifica evolucionarla con un patrón visual de tarjetas técnicas más modular, tomando como referencia visual las `.review-modal__aspect-card` de `ReviewModal`, pero **sin copiar ni acoplar CSS** del modal.

Dirección de diseño:
- usar cards técnicas más expresivas para specs clave
- evaluar componente reutilizable (`TechnicalSpecCard` / `SpecCard`)
- evaluar mixin/placeholder SCSS común si aporta reutilización real
- mantener accesibilidad y evitar render de datos faltantes (`null`/`undefined`)

Nota de alcance:
- no ampliar schema/modelo `Bike` dentro de esta tarea sin decisión explícita
- si faltan campos técnicos, queda dependiente del futuro Admin catálogo/modelos

## Datos demo para QA visual (backlog)

Estado: pendiente (P2 técnico).

La validación visual de `FeaturedReviewCard`, `MotorcycleGarageCard`, bloques editoriales y layouts de comunidad depende de mocks que no parezcan texto de relleno repetitivo.

Dirección:
- mejorar realismo de comentarios mock;
- aumentar variedad de longitud/estructura;
- mantener `source='mock'` y limpieza segura sin tocar `source='user'`.

## Comunidad landing

La ruta `#/comunidad` se organiza en hero, Podium rankings, Trending, bloque de dos columnas con Comunidades activas + Reviews recientes y CTAs finales para solicitar modelo o buscar una moto para opinar. El Podium rankings replica visualmente el podio de `#/comunidad/rankings` (mismo lenguaje de cards, shield de confianza y tooltip). `Top Rated` ya no aparece como bloque separado en esta landing. En `Reviews recientes` se usa `FeaturedReviewCard` en modo visual (sin acciones comunitarias conectadas en esta página).

## Comunidad — Rankings

La ruta `#/comunidad/rankings` muestra rankings por categoría con datos reales de reviews aprobadas.

Elementos principales:
- Podio top 3 con imagen, stats y shield de confianza con tooltip visual. **NO se ve afectado por filtros.**
- Grid de 8 categorías (global, daily, travel, sport, a2, power-weight, reliability, passenger).
- Listado técnico con filtros por segmento, carnet y uso. **No usa `<table>`; usa cards/grid responsive.**

**Pendiente:** rediseño mobile avanzado del listado técnico (cards responsive más refinadas).

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

**Filtros:** afectan SOLO al listado técnico (segment, license, use, search). El podio permanece siempre global y sin filtros.

Metodología visible en página menciona datos técnicos, reviews aprobadas y aspectos agregados.

Nota: el score de rankings (0–10 con icono `analytics`) es independiente del rating de reviews individuales (/5 con estrellas).

## Comunidad — Reviews públicas

La ruta `#/comunidad/reviews` funciona como entrada pública a reviews `approved`: los bloques editoriales superiores muestran reviews individuales, mientras `Garaje de la comunidad` agrupa reviews por moto y pagina 9 modelos por página.

El hero de `#/comunidad/reviews` replica el patrón visual del hero oficial de Home: imagen full-bleed con overlay/degradado, texto centrado y CTAs. Usa `src/assets/hero-community.png`.

Debajo del hero hay un bloque editorial separado del garaje filtrable: `Reviews destacadas`, `Últimos reportes` e `Insights en vivo` se calculan desde reviews `approved` cargadas y no dependen de los filtros. Los filtros solo afectan a `Garaje de la comunidad`, que agrupa por `motorcycleId` y calcula rating medio (sobre 5 con estrella), número de reviews, última review en formato corto DD.MM.YY, y uso más repetido. El panel de filtros es apply-on-change en tiempo real; el botón "Aplicar" cierra el panel en mobile. El aside `Insights en vivo` tiene polling suave cada 60 segundos y muestra indicador "Actualizado ahora". Las cards del garaje usan `MotorcycleGarageCard` (componente extraído en `src/components/motorcycles/MotorcycleGarageCard/`), con shield de confianza junto al rating /5 con estrella, tooltip visual (Alta/Media/Baja confianza) y CTAs reducidos "Reviews" y "Ficha técnica". `MotorcycleGarageCard` también se reutiliza en `#/buscador` con acciones compactas para comparar.

**Criterio `Reviews destacadas`:** prioriza utilidad comunitaria (votos `Útil`). Criterio: 1) `helpfulCount` desc, 2) rating desc, 3) comentario más largo, 4) más reciente. Si no hay votos útiles (o fallan las reactions), usa fallback por rating/fecha/completitud — nunca queda vacío. **Los kilómetros declarados NO son criterio** para destacar. `Últimos reportes` es cronológico puro (fecha desc), no usa helpfulCount. Cada bloque editorial deduplica internamente por `motorcycleId`; no hay deduplicación editorial↔garaje.

Los bloques editoriales superiores reutilizan `FeaturedReviewCard` (alias público, rating, metadatos y body expandible con comentario/pros/contras/aspectos cuando existan). El garaje usa cards de moto agrupada con fondo completo, rating medio /5 con estrella y shield de confianza. Los filtros replican el patrón visual del buscador: grupos con botones/chips, rating con estrellas y panel inferior en mobile.

Las `FeaturedReviewCard` de reviews destacadas y últimos reportes tienen acciones comunitarias reales: Helpful, NotHelpful, Report (con formulario) y Reply (con lazy loading por review). `Útil N` se trata como **contador público**: siempre se muestra, pero solo es interactivo cuando hay permiso real (auth + review ajena + no reportada). En no-auth, review propia o review reportada se renderiza en modo pasivo/no interactivo. Si la review es propia, mantiene chip `Propia` en la zona de acciones. `No útil`, `Reportar` y `Responder` no se renderizan cuando no hay permiso real (sin handlers no-op). La mutación de reacciones se consolida con `useReviewReactions` (hook UI-agnóstico) y en esta página se usa con UX silenciosa. El bloqueo de reacciones se calcula desde `reportedReviewIds` (`getMyReviewReports`): si una review ya fue reportada, Helpful/NotHelpful quedan bloqueadas. Al reportar, la reacción previa del usuario se limpia con `clearMyReviewReaction` y la review queda bloqueada para nuevas reacciones. El flujo de reportes se consolida con `useReviewReports` (hook UI-agnóstico); en esta página se usa sin feedback visual adicional en no-auth. Fotos de usuario quedan para fases futuras.

Los filtros de segmento/carnet usan las mismas constantes visuales que el buscador; `Sport` usa `speed`, `Touring` usa `explore` y el carnet se presenta como `Carnet A2`, `Carnet A`, `A2 limitable`.

**Contratos de comportamiento:** Ver `docs/product-behavior-contracts.md` para reglas de FeaturedReviewCard, acciones comunitarias (Helpful/NotHelpful/Report), chip `Propia`, deduplicación editorial y garaje.

## Comunidad por moto — Reviews

La ruta `#/comunidad/[motorcycleId]` reemplaza el slider de `Verified owner reports` por un listado compacto vertical de experiencias aprobadas. Los filtros de esta fase viven en el sidebar (`rating` y `orden`), seguidos por `Problemas comunes e insights`; en mobile pasan a panel responsive y la paginación muestra 5 reviews por página. Usuarios autenticados pueden marcar una review como `Útil` o `No útil`; `Útil` muestra contador público, `No útil` queda como feedback privado sin contador público. Ambas reacciones son mutuamente excluyentes y no se permite autoreacción. Las mutaciones de reacciones se consolidan con `useReviewReactions`, manteniendo la UX propia de esta página (tooltip en no-auth/reportada y `reactionNotice` en error). También pueden reportar reviews ajenas con un motivo controlado; hay un reporte por usuario/review y no se muestra contador público. El reporte usa `useReviewReports` conservando la UX propia de esta página (tooltips en no-auth/success/duplicate y `reactionNotice` en error no duplicado). El pending combinado (`reactionPendingIds + reportPendingIds`) evita dobles envíos incoherentes entre reacciones y reportes. Respuestas, menciones, reportes de respuestas y fotos quedan pendientes.

## Admin — Moderación

Las rutas `#/admin` y `#/admin/moderacion` son privadas para perfiles con `user_profiles.role = admin`. El dashboard admin es mínimo y enlaza a moderación; `#/admin/moderacion` lista reportes de reviews con filtros por estado, motivo y orden.

La moderación separa dos conceptos:
- estado del reporte (`Pendiente`, `Revisado`, `Descartado`, `Resuelto`)
- estado de la review (`Oculta`, `Aprobada`, `Rechazada`)

Los filtros admin adoptan el patrón de `cuenta/reviews`: header/body/footer, iconos Material Symbols y secciones desplegables por grupo (`Estado del reporte`, `Motivo`, `Orden`) con chevron y `aria-expanded`. El panel ya no depende del padding de card heredado; el espaciado se controla solo desde header/body/footer para evitar doble padding y desalineación.

`#/admin/moderacion` pagina el listado de reportes en bloques de 6. El orden/filtros de admin se aplican primero y luego se recorta la página activa; al cambiar filtros o limpiar filtros, la paginación vuelve a la página 1.

Las report cards son plegables por defecto: el header deja visible estado, motivo, reportante y contexto rápido de la review; el detalle (comentario, pros/contras y acciones) se despliega bajo demanda con trigger accesible (`aria-expanded`/`aria-controls`).

Los botones de acciones de moderación tienen hover por intención visual (azul para `Marcar revisado`, rojo para `Descartar`/`Rechazar`, verde para `Resuelto`/`Aprobar`, gris para `Ocultar`) sin heredar hover rojo genérico.

Si el admin actúa sobre la review desde ese reporte, la review cambia de estado y el reporte se marca automáticamente como `action_taken` (visible como `Resuelto`). El tab de respuestas pendientes de moderación está implementado. Avisos al autor y administración completa de solicitudes quedan para fases futuras.

Estado de fase:
- La base de la Fase 2.5 (moderación/admin) está mayoritariamente implementada.
- Lo pendiente es residual y debe entrar por auditoría focal (solicitudes, avisos al autor y cierre de contratos de moderación de respuestas).

## Admin — Reviews por modelo

La ruta `#/admin/reviews` muestra cards agrupadas por `motorcycleId` con imagen, metadatos y CTAs. Cada card muestra:
- `X reviews nuevas` (conteo de reviews con `status = pending` en esa moto).
- `Última review: ...` calculada por la review más reciente del grupo.
- CTAs `Revisar reviews` y `Ver ficha`.

Hay filtros por estado, origen, verificación y orden. El CTA `Revisar reviews` lleva a `#/admin/reviews/[motorcycleId]` donde se pueden gestionar las reviews de esa moto concreto.

`AdminReviewCard` muestra `ReviewAspectSummary` con los aspectos técnicos de cada review. Las acciones disponibles son aprobar, ocultar y rechazar.

La agrupación prioriza motos con reviews pendientes.

## Mi cuenta — Reviews

La ruta `#/cuenta/reviews` funciona como “Mi garaje de reviews”: agrupa las reviews del usuario autenticado por moto, pagina modelos agrupados y aplica filtros sobre marca/modelo, segmento, carnet, rating medio, uso principal y orden. Los filtros replican el patrón visual de `#/comunidad/reviews` con header/body/footer y botones/chips sin selects; en desktop viven dentro del sidebar de cuenta antes del notice y en tablet/mobile usan panel responsive. El CTA `Ver mis reviews` de cada moto apunta al detalle privado `#/cuenta/reviews/[motorcycleId]`.

La ruta `#/cuenta/reviews/[motorcycleId]` muestra solo las reviews propias de una moto concreta. Cada review muestra estado traducido (`Publicada`, `Pendiente`, `Oculta`, `Rechazada`), pros/contras saneados, `ReviewAspectSummary` con aspectos técnicos si existen, contador pasivo de útiles recibidos y CTA hacia reviews públicas.

En `#/cuenta`, el bloque “Mis reviews” agrupa las reviews propias por moto, muestra hasta 3 modelos ordenados por última review y usa una card visual tipo garage con CTAs `Ver mis reviews` y `Ver ficha`.

`AccountReviewCard` mantiene una estructura visual compartida en cuenta y comunidad: imagen izquierda, título + rating en cabecera, metadatos con iconos, acciones inferiores y enlace secundario `Más reviews`. La estructura de autor queda preparada para un badge futuro de reviewer verificado mediante clases dedicadas, sin mostrar badges falsos.

- carga reviews propias mediante RLS y token de sesión.
- filtra en cliente por marca/modelo, estado y uso principal.
- ordena por fecha, rating o kilómetros.
- pagina en frontend a 5 reviews por página.
- usa `AccountReviewsEmptyState` para el estado “sin resultados” con radar CSS y soporte `prefers-reduced-motion`.
- edición, borrado/retirada y panel admin quedan pendientes.


## Páginas de Datos y Legal

Las rutas enlazadas desde el footer ya tienen páginas reales en `src/components/pages/StaticInfoPages/`:

- `#/metodologia` — explica procedencia `api`, `manual`, `estimated`, `user` y `placeholder`.
- `#/fuentes-datos` — resume fuentes externas, revisión manual, comunidad, imágenes y ratings.
- `#/solicitar-modelo` — formulario conectado a `model_requests`; valida marca, modelo y año, y permite envío anónimo o autenticado.
- `#/privacidad` — base inicial de privacidad pendiente de revisión legal final.
- `#/terminos` — base inicial de términos de uso pendiente de revisión legal final.

Estas páginas ignoran header/footer de Stitch y usan el Navbar/Footer reales de MotoAtlas.
