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

El compare tray del buscador muestra mini-slots de motos seleccionadas y skeletons hasta completar 3 espacios; el summary textual de “x/3 motos seleccionadas” se omite por redundante.

## Comunidad landing

La ruta `#/comunidad` se organiza en hero, Podium rankings, Radar de la comunidad, bloque de dos columnas con Comunidades activas + Reviews recientes y CTAs finales para solicitar modelo o buscar una moto para opinar. `Top Rated` ya no aparece como bloque separado en esta landing.

## Comunidad por moto — Reviews

La ruta `#/comunidad/[motorcycleId]` muestra las reviews aprobadas en un slider horizontal con scroll/snap. En mobile cada card ocupa el ancho útil disponible para evitar overflow global y mantener lectura cómoda.

## Mi cuenta — Reviews

La ruta `#/cuenta/reviews` muestra todas las reviews asociadas al usuario autenticado.

En `#/cuenta`, el bloque “Mis reviews” reutiliza la misma card visual en variante compacta y muestra solo las 3 reviews más recientes (`created_at desc`) con enlace a `#/cuenta/reviews`.

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
