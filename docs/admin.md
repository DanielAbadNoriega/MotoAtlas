# Panel Admin — MotoAtlas

Rutas existentes:
- `#/admin` — Panel de administración.
- `#/admin/moderacion` — Moderación de reportes de reviews.
- `#/admin/reviews` — Garaje admin: reviews agrupadas por modelo.

Protección:
- Acceso restringido a usuarios con `user_profiles.role === 'admin'` (comprobado por `useAuth` y RLS en backend).

Qué hace cada ruta:
- `#/admin`:
  - Landing del admin con accesos rápidos a moderación y reviews.
  - Muestra resúmenes y enlaces a secciones (no ejecuta moderación por sí misma).

- `#/admin/moderacion`:
  - Lista paginada de `review reports` (reportes enviados por usuarios sobre reviews).
  - Filtros (estado, motivo, orden) y panel de filtros responsive.
  - Detalle expandible por reporte con acciones para: marcar revisado, descartar, marcar como resuelto.
  - Si el reporte incluye la review, permite acciones sobre la review (ocultar, aprobar, rechazar).

- `#/admin/reviews`:
  - Agrupa reviews por `motorcycleId` y muestra tarjetas resumen por moto (pendientes y última review).
  - Filtros por estado de review, origen, verificación y orden. Filtrado en memoria en frontend.
  - CTA a ficha de moto y link para revisar las reviews de esa moto.

Estados relevantes:
- Reviews: `pending`, `approved`, `rejected`, `hidden`.
- Reportes: `pending`, `reviewed`, `dismissed`, `action_taken` (se muestra en UI como "Resuelto").

Acciones disponibles:
- Sobre reportes:
  - `reviewed` — marcar como revisado.
  - `dismissed` — descartar reporte.
  - `action_taken` — marcar como resuelto (UI: "Resuelto").

- Sobre reviews (cuando el reporte incluye review):
  - `hidden` — ocultar la review.
  - `approved` — aprobar/publicar la review.
  - `rejected` — rechazar la review.

Pendientes / notas futuras:
- Navegación directa a reviews por moto: `#/admin/reviews/[moto-id]`.
- Implementar panel de "admin solicitudes" (solicitudes de modelos) dentro del admin.
- Notificaciones/avisos automáticos al autor de la review cuando se actúe sobre su review.
- Añadir pruebas E2E para flujos críticos de administración (filtrado, acciones y permisos).

Resumen:
Panel admin protege acciones críticas con rol `admin`, centraliza moderación de reportes y revisión de reviews agrupadas por moto. Las acciones son irreversibles desde la UI (según infra actual), y los filtros son client-side en `#/admin/reviews`.
