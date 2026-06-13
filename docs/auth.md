# Autenticación MotoAtlas

MotoAtlas usa Supabase Auth con email y contraseña desde el frontend, siempre con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La `service_role_key` queda reservada para scripts/backend y no se usa en la app.

## Estado del baseline

Auditoría de cierre completada en `feature/auth-baseline-audit`.

- Baseline funcional: login, registro, logout, sesión persistente, perfil básico, cuenta privada y admin por rol.
- Ownership funcional y protegido por RLS para reviews, solicitudes, reacciones y reportes.
- Sin cambios de schema/RLS/auth durante la auditoría.
- El baseline puede considerarse auditado, pero NO habilita todavía capa social/gamificación: quedan gaps P1/P2 documentados al final.

## Estructura

- `src/shared/supabase/supabaseClient.ts` crea un único cliente Supabase reutilizable con sesión persistente.
- `src/features/auth/authService.ts` encapsula `signIn`, `signUp`, `signOut`, sesión actual y lectura básica de perfil.
- `src/features/auth/AuthProvider.tsx` expone `useAuth()` con `user`, `session`, `profile`, `isAuthenticated`, `isLoading`, `isAdmin`, `signIn`, `signUp`, `signOut` y `refreshProfile`.
- `src/components/pages/AuthPage/` contiene login y registro.
- Las páginas `Account*` contienen `#/cuenta`, `#/cuenta/reviews`, `#/cuenta/reviews/[motorcycleId]` y `#/cuenta/solicitudes`.
- `AdminGate` protege las rutas de `AdminPage`; `AdminMotorcycleReviewsPage` aplica el mismo chequeo explícito de sesión + rol.

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
- Rutas de cuenta con datos, reviews y solicitudes propias.
- Lectura pública de motos, reviews `approved`, aspectos aprobados, replies aprobadas y contador `helpful`.
- Reviews autenticadas asociadas a `auth.uid()` mediante `motorcycle_reviews.user_id`.
- Solicitudes de modelos anónimas o autenticadas persistidas en `model_requests`.
- Reacciones/reportes autenticados asociados al usuario y con autoreacción/autoreporte bloqueados en UI/hook + RLS.
- Panel admin protegido por sesión, `profile.role === 'admin'` y policies basadas en `public.is_admin()`.

## Contratos por rol

### Anónimo

- Puede navegar páginas públicas.
- Puede leer reviews `approved`, sus contadores `helpful` y replies `approved`.
- Puede enviar solicitudes de modelo; quedan con `user_id = null`.
- No puede acceder a cuenta/admin ni mutar reacciones/reportes.
- En `CommunityReviewsPage`, `BikeDetailPage` y `TopRatedMotorcyclesPage`, `Útil N` queda pasivo y no aparecen acciones sin permiso.
- `MotorcycleCommunityPage` conserva una excepción UX: muestra acciones clicables que responden con tooltip de login, pero los hooks bloquean antes de red.
- **Escribir review está cerrado a anónimos** (rama `feature/review-auth-only-contract`): el CTA `Escribir review` sigue visible, queda marcado con `aria-disabled="true"`, no es un `disabled` real para poder recibir foco/click, y al pulsarlo muestra un hint `Inicia sesión para escribir una review.` durante ~4s en lugar de abrir `ReviewModal` ni llamar a la RPC `create_motorcycle_review_with_aspects`. La implementación vive en el componente compartido `AuthRequiredAction` (`src/shared/ui/auth/AuthRequiredAction.tsx`) y se aplica a `#/motos/[id]` (Comunidad tab) y a `#/comunidad/[motorcycleId]` (hero + empty state).

### Usuario autenticado

- Puede acceder a cuenta y leer sus propias reviews/solicitudes usando token de sesión.
- Reviews autenticadas quedan asociadas al usuario desde `auth.uid()` dentro de la RPC.
- Solicitudes autenticadas envían `user_id` y RLS exige `user_id = auth.uid()`.
- Puede reaccionar/reportar reviews ajenas; no puede reaccionar/reportar las propias.
- No puede elevar su `role`: los grants de perfil solo permiten editar `display_name` y `avatar_url`.

### Admin

- Requiere sesión + `isAdmin`; no alcanza con estar autenticado.
- `isAdmin` deriva de `profile?.role === 'admin'`.
- Las mutations admin quedan limitadas por RLS/policies basadas en `public.is_admin()` y grants de columnas `status`.

## Reviews

- `user_name` es el alias visible en la web.
- `user_id` vincula la review con la cuenta autenticada.
- Toda review aceptada entra como `status = pending`, `verified = false` y `source = user`.
- Mi cuenta muestra reviews propias del usuario, incluyendo `pending`, `rejected` y `hidden`.
- Las reviews `approved` son públicas; las no aprobadas solo son visibles para su propietario.
- El formulario usa la RPC atómica `create_motorcycle_review_with_aspects`, que inserta review + aspectos, obtiene `user_id` desde `auth.uid()` y deriva `user_name` desde `public.user_profiles.display_name`.
- **Escribir review es auth-only** (rama `feature/review-auth-only-contract`): el CTA en `BikeDetailPage` (Comunidad tab) y `MotorcycleCommunityPage` (hero + empty) está cerrado para anónimos. Los usuarios autenticados abren `ReviewModal` con flujo normal; los anónimos ven el botón con `aria-disabled="true"`, focus/click disponibles, y al pulsarlo aparece el hint `Inicia sesión para escribir una review.` durante ~4s sin abrir el modal ni llamar a la RPC. No se ha introducido un CTA a `#/login` para mantener el cambio mínimo: el hint textual ya dirige al usuario, y el patrón real de cross-link a login se consolidará en la fase global de unificación de Hero/CTAs.
- `ReviewModal` ahora añade una defensa local coherente con ese contrato: si el modal se abriese inesperadamente sin `reviewAuthContext`, el submit no llama `createReviewWithAspects` y muestra `Inicia sesión para escribir una review.`. Esto NO habilita reviews anónimas ni cambia RPC/RLS/schema/Supabase; la prevención normal sigue en `AuthRequiredAction` y wrappers equivalentes.
- El alias mostrado sigue saliendo del `display_name` del perfil y no es editable en UI. A nivel server-side, `p_user_name` se mantiene en la firma de la RPC solo por compatibilidad, pero ya no controla la identidad visible final: la RPC deriva el alias desde `public.user_profiles.display_name` y usa fallback `Usuario MotoAtlas` si el valor es nulo o blanco.
- Smoke desplegado aprobado: el comportamiento efectivo en staging confirmó que `anon` no puede hacer INSERT directo ni ejecutar la RPC, que `authenticated` sí puede crear la review por la RPC, que el spoof de `p_user_name` no gana, que el owner puede leer su review `pending` y que la review solo pasa a lectura pública tras aprobación admin.

## Aspectos técnicos

El formulario de review permite valorar aspectos técnicos con +/−:

```ts
type MotorcycleReviewAspectCategory =
  | 'engine' | 'ergonomics' | 'consumption' | 'braking' | 'suspension'
  | 'electronics' | 'aerodynamics' | 'passenger' | 'maintenance'
  | 'price' | 'weight' | 'design';

type MotorcycleReviewAspectSentiment = 'positive' | 'negative';
```

Cada aspecto puede incluir un comentario opcional. Se muestran en la review via `ReviewAspectSummary`.

## Admin

- El rol admin vive en `public.user_profiles.role`; usuarios normales no pueden insertar ni actualizar `role`.
- `#/admin` muestra un dashboard mínimo con enlace a `#/admin/moderacion`.
- `#/admin/moderacion` permite revisar reportes, actualizar su estado y ocultar/aprobar/rechazar reviews reportadas.
- Las acciones admin se protegen también con RLS: policies admin consultan `user_profiles.role = 'admin'` y los grants de update quedan acotados a `status`.

## Loading y resolución de perfil

- La carga inicial es segura: `AuthProvider` mantiene `isLoading=true` hasta resolver sesión + perfil.
- Cuenta/admin muestran estados controlados mientras `isLoading`.
- Las páginas privadas no consultan servicios sin `user.id` y `session.access_token`.
- Hardening aplicado: `onAuthStateChange` ya representa la resolución de perfil como loading; `AuthProvider` no expone el nuevo snapshot autenticado antes de que `getUserProfile()` termine, `isAdmin` sigue derivando del `profile.role` resuelto y `authTransitionRef` ignora resoluciones async obsoletas.

## Alineación RLS

- Ownership principal está alineado: `user_id = auth.uid()` para inserts/lecturas propias y restricciones de autoreacción/autoreporte.
- El frontend filtra por `user_id`, pero RLS sigue siendo la frontera de seguridad real.
- El admin usa `public.is_admin()` y grants mínimos por columna.
- La creación de reviews autenticadas ya no admite INSERT directo en `public.motorcycle_reviews` para `anon`/`authenticated`: la ruta de creación es la RPC `create_motorcycle_review_with_aspects`.
- `public.motorcycle_reviews` sigue least-privilege: `anon` conserva `SELECT` público, `authenticated` conserva `SELECT` y `UPDATE(status)` para el flujo de moderación protegido por RLS/admin, y no hay grants amplios de `INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` para roles cliente.
- `EXECUTE` sobre `create_motorcycle_review_with_aspects` quedó restringido a `authenticated`; `public` y `anon` quedan revocados explícitamente.
- El smoke de staging ya confirmó el contrato de creación de reviews por comportamiento desplegado. Limitación aceptada: la introspección SQL directa vía `information_schema` / `pg_policies` no estuvo disponible sobre el surface HTTP expuesto, así que esta validación quedó cerrada por flujos `anon` / `authenticated` / `admin`, no por auditoría SQL remota.
- **Hardening pendiente:** verificar privilegios efectivos de otras funciones `security definer` y, si se necesita un nivel más profundo, abrir un patrón separado de auditoría SQL remota segura para staging.

## No implementado todavía

- Avisos al autor cuando una review reportada cambia de estado.
- Perfiles públicos, seguidores, notificaciones o gamificación.
- Flujo UI de recuperación de contraseña/cuenta.
- Personalización de templates de emails de Supabase Auth (confirmación/recuperación) con branding MotoAtlas; backlog futuro no bloqueante para MVP.

## Backlog técnico de testing (auth baseline)

Implementado (base):
- Capa central de fixtures/mocks en `src/test/fixtures/auth.ts` para `user`/`profile`/`session` y estado auth.
- Factories con overrides (`createAuthUser`, `createUserProfile`, `createSession`, `createAuthSnapshot`, `createAuthState`).
- Cobertura base de fixtures en `src/test/fixtures/auth.test.ts`.
- Migración incremental ya aplicada en `src/components/pages/AuthPage/AuthPage.test.tsx`, `src/components/pages/StaticInfoPages/StaticInfoPages.test.tsx`, `src/components/pages/AccountRequestsPage/AccountRequestsPage.test.tsx`, `src/components/pages/AccountPage/AccountPage.test.tsx`, `src/components/pages/AccountReviewsPage/AccountReviewsPage.test.tsx`, `src/components/pages/AccountMotorcycleReviewsPage/AccountMotorcycleReviewsPage.test.tsx`, `src/components/pages/AdminMotorcycleReviewsPage/AdminMotorcycleReviewsPage.test.tsx`, `src/components/pages/AdminPage/AdminPage.test.tsx`, `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.test.tsx`, `src/components/pages/MotorcycleCommunityPage/MotorcycleCommunityPage.test.tsx`, `src/components/reviews/ReviewModal/ReviewModal.test.tsx` y `src/features/auth/AuthProvider.test.tsx`.
- Adopción actual: 12 suites usan fixtures auth centrales; la migración account-level ya quedó completa, la migración admin quedó cubierta en `AdminMotorcycleReviewsPage.test.tsx` y `AdminPage.test.tsx`, la migración community quedó cubierta en `CommunityReviewsPage.test.tsx` y `MotorcycleCommunityPage.test.tsx`, `ReviewModal.test.tsx` ya quedó cubierto y `AuthProvider.test.tsx` cerró la última área pendiente. La migración de auth fixtures se considera completa.
- Cobertura de rama `feature/review-auth-only-contract`: el test `abre ReviewModal desde "Escribir review" cuando hay sesión` prueba el camino autenticado, y `muestra el hint de login al pulsar "Escribir review" sin sesión y no abre el modal` cubre el camino no-auth con `aria-disabled="true"`, visibilidad del hint y aserción de que `createReview` no se llama.

Pendiente residual (post-migración):
- Mantener la cobertura incremental ya cerrada sin volver a introducir objetos auth inline repetidos.
- Mantener y extender la cobertura añadida sobre transición `onAuthStateChange`, loading de perfil y protección contra resoluciones async obsoletas cuando aparezcan nuevas ramas de auth.
- Mantener como pendiente solo la validación más amplia de otras superficies sensibles de auth/RLS y de privilegios efectivos de otras funciones `security definer`; la creación de reviews ya quedó validada por smoke de comportamiento en staging.

## Plan recomendado

1. **Fase 1 — contrato auth local cerrado:** `feature/review-auth-only-contract` cerró el CTA auth-only con hint no-auth, `fix/review-modal-auth-contract` cerró el contrato local UI/test del modal, el hardening de `AuthProvider` cerró la transición de perfil/loading y el hardening server-side ya cerró la identidad visible de reviews autenticadas.
2. **Fase 2 — validación/hardening:** el smoke de RLS/roles para creación de reviews ya quedó aprobado; el siguiente paso técnico recomendado es la verificación más amplia de privilegios efectivos de funciones `security definer`.
3. **Fase 3 — foundation de cuenta/social:** recuperación de cuenta, privacidad y contratos de identidad pública posteriores.
4. **Fase 4 — recién entonces:** perfiles públicos, gamificación y notificaciones.
