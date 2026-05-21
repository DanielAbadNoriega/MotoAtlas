# Autenticación MotoAtlas

MotoAtlas usa Supabase Auth con email y contraseña desde el frontend, siempre con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La `service_role_key` queda reservada para scripts/backend y no se usa en la app.

## Estructura

- `src/shared/supabase/supabaseClient.ts` crea un único cliente Supabase reutilizable con sesión persistente.
- `src/features/auth/authService.ts` encapsula `signIn`, `signUp`, `signOut`, sesión actual y lectura básica de perfil.
- `src/features/auth/AuthProvider.tsx` expone `useAuth()` con `user`, `session`, `profile`, `isAuthenticated`, `isLoading`, `isAdmin`, `signIn`, `signUp`, `signOut` y `refreshProfile`.
- `src/components/pages/AuthPage/` contiene login y registro.
- `src/components/pages/AccountPage/` contiene `#/cuenta`.
- `src/components/pages/AdminPage/` contiene `#/admin` y `#/admin/moderacion`, protegidas por `useAuth().isAdmin`.

## Supabase

`public.user_profiles` guarda datos mínimos:

- `id` vinculado a `auth.users(id)`.
- `display_name`.
- `avatar_url`.
- `role`, preparado para `user` y `admin`, con default `user`.

RLS:

- usuarios autenticados pueden leer su propio perfil.
- usuarios autenticados pueden crear su propio perfil como `user`.
- usuarios autenticados solo tienen grant de update sobre `display_name` y `avatar_url`; no sobre `role`.
- un trigger crea el perfil al registrarse usando `raw_user_meta_data.display_name`.

## Implementado

- Login con email/password.
- Registro con alias, email y contraseña.
- Cierre de sesión.
- Sesión persistente vía Supabase Auth.
- Navbar con estado de usuario.
- `#/cuenta` con datos básicos y listado de reviews propias.
- Reviews anónimas permitidas con `user_id = null`.
- Reviews autenticadas asociadas a `auth.uid()` mediante `motorcycle_reviews.user_id`.
- Solicitudes de modelos anónimas o autenticadas persistidas en `model_requests`.
- Panel admin mínimo para moderación de reportes de reviews, protegido por `user_profiles.role = admin`.

## Reviews

- `user_name` sigue siendo el alias visible en la web.
- `user_id` solo vincula la review con la cuenta autenticada y queda `null` en reviews anónimas.
- Toda review creada desde el formulario público entra como `status = pending`, `verified = false` y `source = user`.
- Mi cuenta muestra reviews propias del usuario, incluyendo `pending`, `rejected` y `hidden`.
- Las reviews `approved` siguen siendo públicas; las no aprobadas solo son visibles para su propietario.
- Esta asociación prepara futuras funciones: edición de reviews propias, avisos al autor y reputación.

## Admin

- El rol admin vive en `public.user_profiles.role`; usuarios normales no pueden insertar ni actualizar `role`.
- `#/admin` muestra un dashboard mínimo con enlace a `#/admin/moderacion`.
- `#/admin/moderacion` permite revisar reportes, actualizar su estado y ocultar/aprobar/rechazar reviews reportadas.
- Las acciones admin se protegen también con RLS: policies admin consultan `user_profiles.role = 'admin'` y los grants de update quedan acotados a `status`.

## No implementado todavía

- Panel admin completo de reviews agrupadas.
- Panel admin de solicitudes/modelos.
- Avisos al autor cuando una review reportada cambia de estado.
- Perfiles públicos, seguidores, notificaciones o gamificación.
