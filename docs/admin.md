# Panel Admin — MotoAtlas

## Rutas existentes

| Ruta | Descripción |
|------|-------------|
| `#/admin` | Landing admin con accesos rápidos |
| `#/admin/moderacion` | Moderación de reportes y respuestas |
| `#/admin/reviews` | Garaje: reviews agrupadas por modelo |
| `#/admin/reviews/[motorcycleId]` | Reviews de una moto concreta |

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
