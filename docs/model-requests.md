# Solicitudes de modelos

`#/solicitar-modelo` guarda solicitudes en `public.model_requests`.

- Las solicitudes anónimas están permitidas con `user_id = null`.
- Las solicitudes autenticadas guardan `user_id = auth.uid()`.
- El estado inicial siempre es `pending` y `source = user`.
- Los usuarios autenticados solo pueden leer sus propias solicitudes.
- “Mis solicitudes”, panel admin y notificaciones quedan para fases posteriores.
