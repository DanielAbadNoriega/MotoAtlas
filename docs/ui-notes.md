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


## Páginas de Datos y Legal

Las rutas enlazadas desde el footer ya tienen páginas reales en `src/components/pages/StaticInfoPages/`:

- `#/metodologia` — explica procedencia `api`, `manual`, `estimated`, `user` y `placeholder`.
- `#/fuentes-datos` — resume fuentes externas, revisión manual, comunidad, imágenes y ratings.
- `#/solicitar-modelo` — formulario local preparado; valida marca, modelo y año, pero todavía no persiste en backend.
- `#/privacidad` — base inicial de privacidad pendiente de revisión legal final.
- `#/terminos` — base inicial de términos de uso pendiente de revisión legal final.

Estas páginas ignoran header/footer de Stitch y usan el Navbar/Footer reales de MotoAtlas.
