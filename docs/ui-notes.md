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

Filtros disponibles:

- segmento.
- carnet A / A2 compatible.
- mínimo de reviews.
- orden por mejor rating, más reviews, tendencia simple o prioridad A2.

Limitación actual: la tendencia no usa una serie temporal real; es una señal simple basada en rating y volumen de reviews. No se muestran reviews `pending`, `rejected` ni `hidden`.

## Buscador

La ruta `#/buscador` pagina el listado a 9 motos por página. La paginación se calcula después de aplicar búsqueda, filtros y ordenación, mientras el contador conserva el total filtrado.

Los filtros de segmento y carnet comparten labels/iconos con `#/comunidad/reviews`: segmentos principales con Material Symbols y carnet en orden `Carnet A2`, `Carnet A`, `A2 limitable`.

El compare tray del buscador muestra mini-slots de motos seleccionadas y skeletons hasta completar 3 espacios; el summary textual de “x/3 motos seleccionadas” se omite por redundante.

## Comunidad landing

La ruta `#/comunidad` se organiza en hero, Podium rankings, Trending, bloque de dos columnas con Comunidades activas + Reviews recientes y CTAs finales para solicitar modelo o buscar una moto para opinar. `Top Rated` ya no aparece como bloque separado en esta landing.

## Comunidad — Reviews públicas

La ruta `#/comunidad/reviews` funciona como entrada pública a reviews `approved`: los bloques editoriales superiores muestran reviews individuales, mientras `Garaje de la comunidad` agrupa reviews por moto y pagina 9 modelos por página.

El hero de `#/comunidad/reviews` replica el patrón visual del hero oficial de Home: imagen full-bleed con overlay/degradado, texto centrado y CTAs. Usa `src/assets/hero-community.png`.

Debajo del hero hay un bloque editorial separado del garaje filtrable: `Destacadas del mes`, `Últimos reportes` e `Insights en vivo` se calculan desde reviews `approved` cargadas y no dependen de los filtros. Los filtros solo afectan a `Garaje de la comunidad`, que agrupa por `motorcycleId` y calcula rating medio, número de reviews, última review, uso más repetido y kilómetros declarados. El aside `Insights en vivo` usa un panel técnico compacto inspirado en `comunidad-reviews.html`, con iconos Material Symbols y datos reales calculados.

Los bloques editoriales reutilizan `AccountReviewCard`: `community` muestra alias público, rating, metadatos y oculta estado; `communityCompact` muestra 2 items por sección con densidad mayor. `Garaje de la comunidad` usa cards de moto agrupada con fondo completo, CTAs `Ver reviews` y `Ver ficha`. Los filtros replican el patrón visual del buscador: grupos con botones/chips, rating con estrellas y panel inferior en mobile. Likes/dislikes, debate/respuestas y fotos de usuario quedan para fases futuras.

Los filtros de segmento/carnet usan las mismas constantes visuales que el buscador; `Sport` usa `speed`, `Touring` usa `explore` y el carnet se presenta como `Carnet A2`, `Carnet A`, `A2 limitable`.

## Comunidad por moto — Reviews

La ruta `#/comunidad/[motorcycleId]` muestra las reviews aprobadas en un slider horizontal con scroll/snap. En mobile cada card ocupa el ancho útil disponible para evitar overflow global y mantener lectura cómoda.

## Mi cuenta — Reviews

La ruta `#/cuenta/reviews` funciona como “Mi garaje de reviews”: agrupa las reviews del usuario autenticado por moto, pagina modelos agrupados y aplica filtros sobre marca/modelo, segmento, carnet, rating medio, uso principal y orden. Los filtros replican el patrón visual de `#/comunidad/reviews` con header/body/footer y botones/chips sin selects; en desktop viven dentro del sidebar de cuenta antes del notice y en tablet/mobile usan panel responsive. El detalle privado por moto queda pendiente para `#/cuenta/reviews/[motorcycleId]`.

En `#/cuenta`, el bloque “Mis reviews” agrupa las reviews propias por moto, muestra hasta 3 modelos ordenados por última review y usa una card visual tipo garage con CTAs `Ver mis reviews` y `Ver ficha`. El detalle filtrado por moto queda pendiente para una futura ruta `#/cuenta/reviews/[motorcycleId]`.

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
