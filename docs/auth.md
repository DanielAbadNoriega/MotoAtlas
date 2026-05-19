# Autenticación MotoAtlas

MotoAtlas usa Supabase Auth con email y contraseña desde el frontend, siempre con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La `service_role_key` queda reservada para scripts/backend y no se usa en la app.

## Estructura

- `src/shared/supabase/supabaseClient.ts` crea un único cliente Supabase reutilizable con sesión persistente.
- `src/features/auth/authService.ts` encapsula `signIn`, `signUp`, `signOut`, sesión actual y lectura básica de perfil.
- `src/features/auth/AuthProvider.tsx` expone `useAuth()` con `user`, `session`, `profile`, `isAuthenticated`, `isLoading`, `isAdmin`, `signIn`, `signUp`, `signOut` y `refreshProfile`.
- `src/components/pages/AuthPage/` contiene login y registro.
- `src/components/pages/AccountPage/` contiene `#/cuenta`.

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

## Reviews

- `user_name` sigue siendo el alias visible en la web.
- `user_id` solo vincula la review con la cuenta autenticada y queda `null` en reviews anónimas.
- Toda review creada desde el formulario público entra como `status = pending`, `verified = false` y `source = user`.
- Mi cuenta muestra reviews propias del usuario, incluyendo `pending`, `rejected` y `hidden`.
- Las reviews `approved` siguen siendo públicas; las no aprobadas solo son visibles para su propietario.
- Esta asociación prepara futuras funciones: “Mis reviews”, edición de reviews propias, moderación admin y reputación.

## No implementado todavía

- Solicitar modelo persistido en backend.
- Panel admin.
- Perfiles públicos, seguidores, notificaciones o gamificación.
