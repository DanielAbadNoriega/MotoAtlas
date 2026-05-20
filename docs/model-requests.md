# Solicitudes de modelos

`#/solicitar-modelo` guarda solicitudes en `public.model_requests`.

- Las solicitudes anónimas están permitidas con `user_id = null`.
- Las solicitudes autenticadas guardan `user_id = auth.uid()`.
- `official_url` es opcional y permite aportar una página oficial o fuente para verificación.
- El estado inicial siempre es `pending` y `source = user`.
- Los usuarios autenticados solo pueden leer sus propias solicitudes.
- `#/cuenta` muestra un resumen compacto: hasta dos solicitudes recientes y una acción para solicitar otro modelo.
- `#/cuenta/solicitudes` muestra todas las solicitudes autenticadas asociadas al usuario, con búsqueda, estado, ordenación y paginación frontend.
- La paginación de `#/cuenta/solicitudes` usa 8 solicitudes reales por página más 1 CTA “Solicitar otro modelo” como última card visual; ese CTA no cuenta como solicitud ni afecta filtros, totales o pendientes.
- Las solicitudes anónimas no aparecen en cuenta porque tienen `user_id = null`.
- Las solicitudes no tienen imágenes de moto hasta que se convierten en fichas reales del catálogo.
- Edición de solicitudes, panel admin, notificaciones y filtros avanzados por fecha quedan para fases posteriores.
