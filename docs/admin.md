# Panel Admin — MotoAtlas

## Rutas existentes

| Ruta | Descripción |
|------|-------------|
| `#/admin` | Landing admin con accesos rápidos |
| `#/admin/moderacion` | Moderación de reportes y respuestas |
| `#/admin/reviews` | Garaje: reviews agrupadas por modelo |
| `#/admin/reviews/[motorcycleId]` | Reviews de una moto concreta |
| `#/admin/modelos` | Hub de gestión de modelos |
| `#/admin/modelos/nuevo` | Creación de nuevo modelo (UI-only scaffold) |
| `#/admin/modelos/editar` | Búsqueda/selección de modelos para editar (UI-only) |
| `#/admin/modelos/[motorcycleId]/editar` | Formulario de edición de modelo (UI-only, prefilled desde la moto seleccionada) |

Protección:
- Acceso restringido a usuarios con `user_profiles.role === 'admin'` (comprobado por `useAuth` y RLS en backend).

## `#/admin/moderacion`

Dos tabs:

**Tab reportes (`review_reports`):**
- Lista paginada de reportes con filtros: estado, motivo, orden.
- `AdminReportCard` muestra: estado reporte, motivo, reportante, fecha, review original con `comment`, `pros`, `cons` y `ReviewAspectSummary`.
- Acciones sobre reporte: marcar revisado, descartar, resolver.
- Acciones sobre review desde el reporte: aprobar, ocultar, rechazar.
- Al modificar la review, el reporte pasa a `action_taken`.

**Tab respuestas (`review_replies`):**
- Lista de respuestas pendientes de moderación.
- `AdminReplyCard` muestra: autor de respuesta, fecha, review original con `comment`, `pros`, `cons` y `ReviewAspectSummary`.
- Acciones: aprobar, ocultar, rechazar.

**Orden y filtros:**
- `created_at.desc` (Más recientes) o `created_at.asc` (Más antiguos).
- Cuando `Estado = Todos`, no hay agrupación artificial por estado pending; se mezclan todos por fecha.
- Filtros por estado concreto (`pending`, `approved`, `rejected`, `hidden`) y por motivo.

## Admin Models Studio

### `#/admin/modelos`

Hub admin de navegación con submenú `Modelos` en el sidebar: `Vista general`, `Nuevo modelo`, `Editar modelo`.

### `#/admin/modelos/nuevo`

Scaffold UI-only de alta de modelo. Hero preview estilo `BikeDetailPage`, secciones Stitch colapsables con tooltips, footer de acciones locales (Descartar, Guardar, Vista previa, Publicar). Sin persistencia real.

### `#/admin/modelos/editar` (UI-only)

Selección y búsqueda de modelos existentes para editar. **Sin persistencia, ni servicios.**

**Layout:**
- AccountReviewsPage-style sidebar con panel de filtros responsive (sheet/drawer en mobile, permanente en desktop)
- Main content: grids de cards admin con paginación `AccountPagination`

**Filtros (10 grupos):**
- Marca (text-only, multi-select)
- Segmento (iconos alineados con `motorcycleSegmentFilterOptions`: `bolt`/`speed`/`route`/`terrain`/`construction`/`two_wheeler`/`explore`; secundarios con `more_horiz`)
- Carnet (sin iconos inventados, etiquetas del contrato compartido: `Carnet A2`, `Carnet A`)
- Precio, Potencia, Peso, Altura asiento (rangos predefinidos)
- Electrónica (icono `memory` vía `getMotorcycleTechnicalIcon`)
- Uso recomendado (text-only)
- Calidad de datos (text-only)
- Búsqueda libre por marca o modelo

**Cards:**
- `AdminModelEditCard`: estructuralmente alineada con `AccountReviewMotorcycleSummaryCard` (imagen, overlay, h2, brand/year metadata). CTA `Editar modelo` hacia `#/admin/modelos/{motorcycleId}/editar`.
- Las cards reciben `motorcycles` resueltos desde App (`AdminEditModelsPage({ motorcycles })`), alineando imágenes con SearchPage/MotorcycleGarageCard.
- `MotorcycleImage` recibe el bike directamente sin forzar `getMotorcycleLocalImageUrl`.

### `#/admin/modelos/[motorcycleId]/editar` (UI-only)

Formulario de edición de modelo que reutiliza `AdminModelFormBody` (misma estructura visual/estructural que `#/admin/modelos/nuevo`). Campos prefilled desde la moto seleccionada vía `motorcycles.find()` (resueltos desde App).

**Copy del edit mode:**
- title: `Editar modelo`
- description: `Actualiza los datos disponibles de este modelo.`
- status/kicker: `Editando {brand} {model} {year}`
- heading interno: `Workspace de edición`

**Footer (4 acciones locales):**
- Descartar cambios (resetea al draft original)
- Guardar borrador (local)
- Vista previa (local)
- Publicar modelo (local)

**Sin:**
- create/update services
- schema/RLS/Supabase changes
- upload/storage

**Futuro:** Fase 5 (persistencia/seguridad), Fase 6 (image workflow). El set de filtros de `#/admin/modelos/editar` puede refinarse tras uso real; `Calidad de datos` es candidato a eliminación.

## `#/admin/reviews`

Agrupa reviews por `motorcycleId`:
- Tarjetas resumen por moto: pending count, última review, rating medio.
- Filtros: estado, origen, verificación, orden.
- Filtrado en memoria en frontend.
- CTA a ficha de moto y link para revisar reviews en comunidad.

## Estados

| Entidad | Estados |
|---------|---------|
| Reviews | `pending`, `approved`, `rejected`, `hidden` |
| Reportes | `pending`, `reviewed`, `dismissed`, `action_taken` (UI: "Resuelto") |
| Respuestas | `pending`, `approved`, `hidden`, `rejected` |

## Acciones disponibles

Sobre reportes:
- `reviewed` — marcar como revisado.
- `dismissed` — descartar reporte.
- `action_taken` — marcar como resuelto.

Sobre reviews (desde reporte):
- `hidden` — ocultar la review.
- `approved` — aprobar/publicar la review.
- `rejected` — rechazar la review.

Sobre respuestas:
- `approved` — aprobar respuesta.
- `hidden` — ocultar respuesta.
- `rejected` — rechazar respuesta.

## Componentes reutilizados

- `AdminReportCard` — usa `ReviewAspectSummary` para mostrar aspectos técnicos de la review original.
- `AdminReplyCard` — usa `ReviewAspectSummary` para mostrar aspectos técnicos de la review asociada a la respuesta.
- `ReviewAspectSummary` — ubicado en `src/components/reviews/ReviewAspectSummary/`.

## Pendiente / notas futuras

- Notificaciones/avisos automáticos al autor de la review cuando se actúe sobre su review.
- Añadir pruebas E2E para flujos críticos de administración.
