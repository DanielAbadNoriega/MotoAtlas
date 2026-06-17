# Estrategia de testing de MotoAtlas

MotoAtlas debe poder crecer sin romper buscador, comparador, fichas, reviews ni el pipeline de datos. La prioridad es probar comportamiento real de usuario y contratos de datos, no píxeles ni clases CSS.

Estado actual de suite:
- `1349` tests passing (78 files). Quality Gate vigente: `typecheck` clean + `git diff --check` clean.
- Focused checks validados más recientes:
  - `src/components/pages/AdminPage/AdminPage.test.tsx` → gallery modal connection tests (read-only gallery fetch, loading, error, empty states).
  - `src/services/adminMotorcycleGalleryService.test.ts` + `supabase/schema.test.ts` → 2 files / 102 tests passing (gallery schema + service foundation).
  - suite completa → `1349` tests passing.

## Stack actual

- Vitest como runner unitario y de integración ligera.
- React Testing Library para componentes React.
- Jest DOM para aserciones accesibles.
- jsdom para simular navegador.
- Fixtures locales para no depender de Supabase real.

Comandos obligatorios antes de cerrar cualquier tarea:

```bash
npm run typecheck
npm run test
```

## Qué cubrimos con Vitest + Testing Library

- Lógica pura: filtros, ordenación, cola de comparador, rutas, SEO, calidad de datos, normalizadores e importadores.
- Componentes clave: buscador, ficha, comparador, reviews, comunidad y navbar.
- Servicios frontend contra Supabase con `fetch` mockeado.
- Scripts de datos con dependencias inyectadas o filesystem temporal, nunca Supabase real.
- Estados vacíos, errores controlados y fallbacks de imagen/datos.

## Qué dejamos para Playwright/E2E futuro

- Flujos completos entre páginas con scroll real y navegación hash en navegador.
- Responsive visual desktop/tablet/mobile con capturas pequeñas y revisadas.
- Validación de modales/drawers con foco real y bloqueo de scroll en navegador.
- Smoke test contra entorno staging de Supabase/Vercel, con datos de prueba controlados.
- Flujos completos de login/registro/logout/admin contra staging controlado; los tests unitarios actuales usan mocks y no validan RLS desplegada.

## Admin Models Studio — gallery schema + service foundation

Cobertura vigente:
- `supabase/schema.test.ts` valida la base de `public.motorcycle_images`: columnas esperadas, `storage_path` nullable pero seguro, `created_by` nullable, FK con cascade delete, `source` sobre `public.motorcycle_data_source`, índices por `motorcycle_id` y `(motorcycle_id, sort_order)`, unique partial index para una sola primaria y RLS/grants conservadores;
- `src/services/adminMotorcycleGalleryService.test.ts` cubre el servicio REST tipado `adminMotorcycleGalleryService`: GET con filtro `motorcycle_id` y orden `sort_order.asc,created_at.asc`, POST/PATCH/DELETE con headers `apikey` + Bearer token, `Prefer: return=representation` en writes, mapping snake_case ↔ camelCase y preservación de `storagePath` / `createdBy` nullables;
- los tests verifican errores controlados por env/token faltante y surfacing de errores API;
- también fijan el contrato de que el servicio gestiona **solo metadata DB** y no importa/llama `adminMotorcycleImageUploadService`, no sube archivos y no borra objetos de Storage;
- el contrato single-image actual sigue intacto: `motorcycles.image_url`, `image_locked` e `image_source` no se modifican desde este servicio.

Estado actual:
- el image manager modal ya consume `adminMotorcycleGalleryService` en edit mode: carga imágenes reales con estados de carga, error, vacío y grid de galería;
- la galería sigue siendo de solo lectura: no se pueden crear records desde uploads, seleccionar primaria, reordenar ni borrar desde el modal;
- no hay thumbnails demo, arrays fake ni mock gallery cards;
- el contrato single-image (`motorcycles.image_url`) sigue intacto como imagen primaria para cards, buscador, ficha y fallbacks.

## Convenciones para nuevos tests

1. Probar comportamiento observable: `getByRole`, `getByLabelText`, `getByText` y navegación real por `href`/hash.
2. Evitar snapshots grandes. Si un snapshot parece útil, probablemente falta una aserción semántica mejor.
3. Evitar acoplarse a clases CSS. Se permite solo para elementos sin semántica accesible, como backdrop de modal.
4. No mockear tanto que el test deje de parecerse al producto. El mock debe respetar el contrato real.
5. Cada botón con acción necesita test de esa acción.
6. Cada navegación nueva necesita test de destino.
7. Cada filtro nuevo necesita test de aplicación y de eliminación si genera chip activo.
8. Cada página nueva necesita al menos render y una interacción principal.
9. Los tests deben funcionar offline y no depender de datos reales de Supabase.
10. No relajar aserciones existentes para que pase un cambio; si falla, entender la causa.

## Fixtures reutilizables

- `src/test/fixtures/bikes.ts`: catálogo reducido de motos para buscador, ficha y comparador.
- `src/test/fixtures/reviews.ts`: generadores de reviews aprobadas, pendientes, rechazadas y ocultas para comunidad/reviews.
- `src/test/fixtures/auth.ts`: fuente central de auth/perfiles/sesión para tests de autenticación y permisos.

### Fixtures de auth/perfiles/sesión (estado actual)

Implementado (base):
- factories con overrides:
  - `createAuthUser(overrides?)`
  - `createUserProfile(overrides?)`
  - `createSession(overrides?)`
  - `createAuthSnapshot(overrides?)`
  - `createAuthState(overrides?)`
- fixtures predefinidos:
  - user normal/admin/no-auth
  - perfil básico y perfil incompleto
  - variantes sin `display_name` y sin avatar
  - sesión mock
- cobertura base en `src/test/fixtures/auth.test.ts`.
- primer uso migrado en `src/components/pages/AuthPage/AuthPage.test.tsx`.
- nuevo uso migrado en batch 1: `src/components/pages/StaticInfoPages/StaticInfoPages.test.tsx`.
- nuevo uso migrado en batch 2: `src/components/pages/AccountRequestsPage/AccountRequestsPage.test.tsx`.
- nuevo uso migrado en batch 3: `src/components/pages/AccountPage/AccountPage.test.tsx`.
- nuevo uso migrado en batch 4: `src/components/pages/AccountReviewsPage/AccountReviewsPage.test.tsx`.
- nuevo uso migrado en batch 5: `src/components/pages/AccountMotorcycleReviewsPage/AccountMotorcycleReviewsPage.test.tsx`.
- nuevo uso migrado en batch 6: `src/components/pages/AdminMotorcycleReviewsPage/AdminMotorcycleReviewsPage.test.tsx`.
- nuevo uso migrado en batch 7: `src/components/pages/AdminPage/AdminPage.test.tsx`.
- nuevo uso migrado en batch 8: `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.test.tsx`.
- nuevo uso migrado en batch 9: `src/components/pages/MotorcycleCommunityPage/MotorcycleCommunityPage.test.tsx`.
- nuevo uso migrado en batch 10: `src/components/reviews/ReviewModal/ReviewModal.test.tsx`.
- nuevo uso migrado en batch 11: `src/features/auth/AuthProvider.test.tsx`.
- adopción auditada: 12 suites ya usan fixtures centrales (`AuthPage.test.tsx`, `StaticInfoPages.test.tsx`, `AccountRequestsPage.test.tsx`, `AccountPage.test.tsx`, `AccountReviewsPage.test.tsx`, `AccountMotorcycleReviewsPage.test.tsx`, `AdminMotorcycleReviewsPage.test.tsx`, `AdminPage.test.tsx`, `CommunityReviewsPage.test.tsx`, `MotorcycleCommunityPage.test.tsx`, `ReviewModal.test.tsx` y `AuthProvider.test.tsx`); la migración account-level quedó completa en batch 5, la migración admin quedó cubierta en sus dos suites, la migración community quedó cubierta en sus dos suites, el modal ya quedó cubierto y la migración total de auth fixtures quedó cerrada, sin áreas pendientes con `mockAuth`/mocks locales de `useAuth`.

Pendiente residual (no bloqueante):
- smoke complementario opcional del signup público directo cuando cese el rate limit `429` de Supabase email; la creación de reviews y el hardening `SECURITY DEFINER` conocido ya quedaron aprobados en staging.

### Cobertura de schema/RLS y `SECURITY DEFINER`

`supabase/schema.test.ts` (`1` file / `66` tests passing) ya cubre el hardening server-side de creación de reviews y el endurecimiento de privilegios `EXECUTE` en funciones `SECURITY DEFINER` conocidas:

- ausencia de policies/grants de INSERT directo sobre `public.motorcycle_reviews` para `anon`/`authenticated`;
- contrato least-privilege de `public.motorcycle_reviews` (`anon`: `SELECT`; `authenticated`: `SELECT` + `UPDATE(status)` solo por grant de columna);
- derivación server-side de `user_name` desde `public.user_profiles.display_name` con fallback `Usuario MotoAtlas`;
- `p_user_name` preservado en la firma de la RPC solo por compatibilidad, sin capacidad de spoofear la identidad visible;
- `EXECUTE` de `create_motorcycle_review_with_aspects` revocado a `public`/`anon` y concedido solo a `authenticated`;
- `public.is_admin()` con `SECURITY DEFINER`, `set search_path = public`, `REVOKE EXECUTE` explícito para `public` y `anon`, y `GRANT EXECUTE` solo para `authenticated`;
- `public.handle_new_user_profile()` con `SECURITY DEFINER`, `set search_path = public`, `REVOKE EXECUTE` explícito para `public` y `anon`, sin grant cliente directo;
- `public.handle_new_user_profile()` fija `role = 'user'` y no confía un `role` entrante desde metadata.

### Validación de staging / comportamiento desplegado

Smoke aprobado en staging para creación de reviews y para el hardening `SECURITY DEFINER` conocido:

- `anon` no pudo hacer `INSERT` directo sobre `public.motorcycle_reviews`;
- `authenticated` no pudo hacer `INSERT` directo sobre `public.motorcycle_reviews`;
- `anon` no pudo ejecutar `create_motorcycle_review_with_aspects`;
- `authenticated` sí pudo crear la review por RPC;
- la review creada tomó `user_id` desde `auth.uid()`, `user_name` desde `public.user_profiles.display_name`, usó fallback `Usuario MotoAtlas` cuando correspondía y mantuvo `status='pending'`, `source='user'`, `verified=false`;
- el owner pudo leer su review `pending`;
- el público no vio la review hasta aprobación admin;
- un no-admin no pudo aprobar su propia review;
- un admin sí pudo hacer `UPDATE(status)`, pero no un patch amplio de `comment`;
- creación controlada de usuario en `auth.users` vía Admin API disparó correctamente `public.handle_new_user_profile()`, creó fila en `public.user_profiles`, conservó `display_name` / `avatar_url` y fijó `role='user'`;
- el intento de spoofear `role='admin'` vía metadata quedó bloqueado;
- `rpc/is_admin` devolvió `401` para `anon`, `false` para auth no-admin y `true` para admin;
- `handle_new_user_profile()` no apareció expuesta como RPC PostgREST normal para `anon`/`authenticated` (surface observada: `404`).

Limitación documentada:
- no se añadió cobertura Playwright/E2E automatizada nueva;
- `Vitest` sigue cubriendo el contrato SQL local en `supabase/schema.test.ts`;
- el smoke de staging validó comportamiento desplegado por flujos HTTP/privilegios y por creación controlada vía Admin API, porque la introspección directa de `information_schema` / `pg_policies` no estaba disponible sobre el surface HTTP expuesto;
- el flujo exacto de signup público no se pudo repetir durante este smoke por rate limit `429` de Supabase email, así que queda solo como re-check opcional cuando ese límite se libere.

Al crear fixtures:

- Usar datos mínimos pero realistas.
- Hacer override por test con factories en vez de duplicar objetos enormes.
- Mantener ids estables y legibles.
- Mantener API pequeña y componible (sin abstracciones complejas).
- Migrar por archivo para minimizar riesgo (evitar refactor masivo de toda la suite).
- Incluir casos malos cuando el producto debe ser tolerante: imagen vacía, review incompleta, fecha inválida, scores ausentes.
- Para QA visual de comunidad/ficha/garaje, cubrir también combinaciones realistas: comentarios largos/cortos, pros/contras múltiples, ratings variados y estilos de uso diversos.

Reglas de seguridad para auth fixtures:
- Nunca usar Supabase real ni claves reales.
- Mantener tests 100% locales con mocks/fixtures deterministas.

## Contratos de taxonomía de segmentos (Fase 1)

Cobertura implementada:
- `src/shared/motorcycles/motorcycleTaxonomy.contract.test.ts`
  - valida `BIKE_SEGMENTS` con lista exacta de 16 categorías esperadas;
  - valida alineación con `BikeSegment` (`src/types/bike.ts`);
  - valida alineación con enum `motorcycle_segment` (`supabase/schema.sql`);
  - valida cobertura completa de `segmentLabels`;
  - valida que `data/import/motorcycles.json` no tenga segmentos inválidos.
- `src/shared/filters/motorcycleFilterOptions.test.ts`
  - protege la estrategia actual de filtros por segmento: `primary + other`;
  - documenta explícitamente que `other` es bucket de UI (no segmento real);
  - valida mapping `segmento canónico` → `grupo visible`;
  - valida primarios → sí mismos y secundarios → `other`;
  - valida que los targets de grupos visibles son segmentos canónicos;
  - valida targets y visibilidad condicional de `other` según segmentos disponibles.
  - valida ausencia de grupos vacíos en opciones disponibles (salvo `all`).
- `src/components/sections/FeaturedMachines/FeaturedMachines.test.tsx`
  - valida render de `Featured Machines` (título de sección con aria-labelledby).
  - valida render del slogan `Built for riders, ranked by character`.
  - valida 3 cards con badges `01`/`02`/`03`.
  - valida specs `Engine`, `Power`, `Torque` en las 3 cards.
  - valida CTAs `Ver ficha` → `#/motos/[id]` y `Reviews` → `#/comunidad/[id]`.
  - valida ausencia de km/h, kg, PS, segmento en cada card.
  - valida ausencia de `null`/`undefined` en specs.
  - valida datos reales (primera moto BMW F 900 GS).

Regla de contrato actual:
- Los tests de dataset no fallan si hay segmentos esperados todavía ausentes en datos; solo fallan por segmentos inválidos.

Riesgo menor conocido:
- Parte del contrato parsea `src/types/bike.ts` y `supabase/schema.sql` con regex/texto. Si cambia mucho el formato, el test puede requerir ajuste, pero el fallo es visible y explícito.

## BikeDetailPage tabs (Fases 1, 2, 2C, 2C-B, 3A, 3B, 4.1, 4.2, 4.3A, 4.3B, 4.3C, 5.1, 5.2 y 5.3)

Cobertura implementada:
- roles ARIA correctos (`tablist`, `tab`, `tabpanel`).
- 4 tabs renders: Resumen, Especificaciones, Comunidad, Comparar.
- Tab Resumen activa por defecto.
- Contenido de Resumen: `section.bike-detail__riding` + `section.bike-detail__fit`.
- Sin `null`/`undefined` en contenido de tabs.
- Sin tab Metodología.

Fase 2 — Cobertura de SpecificationsTab:
- labels técnicos: MOTOR, POTENCIA, TORQUE, PESO, ALTURA ASIENTO, DEPÓSITO, CARNET, PRECIO BASE.
- valores correctos para cilindrada (895 cc), potencia (105 HP), torque (93 NM), peso (219 KG).
- ausencia de campos inexistentes: no se muestran suspensiones, frenos ni neumáticos.
- features activas: ABS en curva, Quickshifter renderizadas; Puños calefactables no renderizada (false).
- A2 condicional: bloque COMPARABILIDAD A2 con "Limitada a 47.6 CV (orig. 80 CV)" para fixture A2; no aparece para moto no A2.
- precio pendiente: texto "Precio pendiente de confirmar" cuando `priceEur = 0` y `priceSource = placeholder`; nunca `0 €`.

Fase 2C — Cobertura de specs detalladas dentro de Especificaciones tab:
- heading `Especificaciones ampliadas` visible al abrir el tab.
- copy `Detalles técnicos y equipamiento específico del modelo.` visible.
- grupos detallados: `Motor & transmisión`, `Chasis & ergonomía`, `Mercado & registro` dentro del tab.
- specs detalladas NO visibles antes de abrir Especificaciones tab (tab inactivo).
- sección residual `bike-detail__specs` eliminada del flujo principal de `<main>`.

Fase 2C-B — Cobertura de tests añadidos:
- 5 tests nuevos cubren heading, copy, grupos, invisibilidad antes de abrir tab y ausencia de sección residual.

Fase 3A — Cobertura de motorcycleTechnicalIcons:
- mapa con 18 keys: 8 de specs (engine, power, torque, weight, seatHeight, fuelTank, license, price) + 10 de aspectos de reviews (ergonomics, consumption, braking, suspension, electronics, aerodynamics, passenger, maintenance, design).
- `a2` NO es key del mapa (A2 es variante dentro de `license`).
- `getMotorcycleTechnicalIcon` devuelve icono correcto para cada key validada.
- test explícito de ausencia de `a2` en el mapa.
- type prevents invalid keys at compile time.

Fase 3B — Cobertura implementada:
- ReviewModal usa `getMotorcycleTechnicalIcon` en `technicalAspects` para todos los iconos técnicos; sin iconos hardcodeados en el array.
- `consumption` → `local_gas_station` vía `getMotorcycleTechnicalIcon('consumption')`.
- `ReviewAspectSummary` queda pendiente de coordinación futura si aplica.

Fase 4.1 — Cobertura implementada:
- CommunityTab: tab local creada en BikeDetailPage.
- Mini comunidad summary: average rating, review count, confidence shield.
- Empty state seguro cuando no hay datos.

Fase 4.2 — Cobertura implementada:
- `bike-detail__reliability` dentro de CommunityTab.
- Copy conservadora, common issues solo si `reportCount > 0`.
- Empty state seguro: "Sin reportes de fiabilidad todavía." cuando no hay datos.

Fase 4.3A — Cobertura implementada:
- FeaturedReviewCard compact variant: props `hideImage` y `hideLinks`.
- Defaults preservan comportamiento existente en otras páginas.

Fase 4.3B — Cobertura implementada:
- `bike-detail__reviews` dentro de CommunityTab.
- Usa FeaturedReviewCard con `hideImage` + `hideLinks`.
- Sin "Más reviews" / "Ver ficha" en BikeDetailPage Community tab.
- MotorcycleReviewCard eliminada de BikeDetailPage.
- "Escribir review" abre ReviewModal.

Fase 4.3C — Cobertura implementada:
- FeaturedReviewCardCommunityActions: acciones seguras en BikeDetailPage.
- `Útil N` visible como contador público siempre.
- No-auth: `Útil N` pasivo, sin "No útil" ni "Reportar" ni "Responder".
- Own review: `Útil N` pasivo + chip "Propia".
- Reported review: reacciones bloqueadas.
- `Reportar` no renderiza sin handler real.
- `Responder` no existe en BikeDetailPage.
- Sin handlers no-op.

Fase 5.1 — Cobertura implementada:
- CompareTab visible al abrir tab Comparar.
- Related bikes (mismo segmento, excluye actual, max 3) dentro del tab.
- Empty state: `Sin modelos relacionados del mismo segmento por ahora.`

Fase 5.2 — Cobertura implementada:
- Botones reales: `Comparar`, `Ya en comparador`, `Comparador lleno`.
- Infraestructura de compare queue reutilizada (loadCompareQueue, saveCompareQueue, compareQueueMaxSize, getNextCompareSelection).
- Sin botones fake/no-op.
- Sin ids duplicados en cola; máximo 3 respetado.

Fase 5.3 — Cobertura implementada:
- CompareTab usa `MotorcycleGarageCard` directamente para cada related bike.
- `MotorcycleGarageCard` renderiza sin cambios en props ni SCSS.
- Acciones de comparador inyectadas via `footerActions` (botón Comparar/Ya en comparador/Comparador lleno).
- Related bikes solo visibles tras abrir tab Comparar.
- Enlace `Ver ficha` operativo en cada card.
- Click en `Comparar` persiste bike id en cola.
- Doble click no duplica id en cola.
- `Ya en comparador`: botón deshabilitado cuando la moto ya está en cola.
- `Comparador lleno`: botón deshabilitado cuando la cola alcanza máximo (3).
- Rating y reviewCount usan proxy pattern (reliabilityScore / 2 y reportCount) — no son señal comunitaria real.
- Layout cleanup Comunidad: summary reducido a strip compacto, reviews limitados a 3, CTAs movidos al footer de la sección reviews. Gaps de cobertura aceptados para max 3/hideLinks si no están tests explícitos.

Pendiente de cobertura (fases siguientes):
- Cableado completo de Report/Reply en BikeDetailPage (futuro opcional).
- RecentReviews en CommunityLandingPage (antes `TopRatedMotorcyclesPage`) ahora con acciones seguras (Fase 4.4): Helpful/NotHelpful real en auth, `Útil N` pasivo en no-auth, Report/Reply no cableados.

Pendiente recomendado (post Fase 3.1):
- añadir tests cross-page para evitar drift entre:
  - vistas compactas (`Search`, `CommunityReviews`, `AccountReviews`, `Admin`);
  - vistas con exposición explícita de segmentos (`TopRated`, `CommunityRankings`).

## ComparatorPage — contrato del setup hero

Contrato vigente a preservar en tests del comparador:
- `0` motos seleccionadas → setup hero local con CTA `Ir al buscador`.
- `1` moto seleccionada → mismo `ComparatorSetupHero` con card de moto seleccionada dentro del hero y acciones reales de `Añadir ...` / `Buscar otra moto` / `Quitar` según corresponda.
- La card de la moto seleccionada debe exponer imagen, línea brand/segment/A2, display name, notas de calidad de datos y las acciones `Ver ficha` y `Quitar`.
- `Quitar` debe vaciar la compare queue y llevar al estado seguro `#/comparador`.
- `2/3` motos seleccionadas → comparador dinámico normal, sin pasar por el setup hero.
- `ComparatorSetupHero` debe tratarse como componente local de página: no probarlo ni documentarlo como abstracción global de hero.

Guía de aserción:
- Preferir asserts por heading, copy y acciones visibles; no acoplar los tests a clases internas salvo que no exista alternativa semántica.
- Cuando haya una moto sugerida para completar la comparación, validar la CTA `Añadir ...`; si no la hay, validar `Buscar otra moto` como primary path.

## Scripts de mock reviews — contrato de testing

Cobertura vigente para `scripts/generateMockReviews.test.ts`:
- las reviews generadas preservan `source: 'mock'`;
- no se generan entradas con `source: 'user'` ni `source: 'seed'`;
- `rating` permanece dentro de `1..5`;
- `pros` y `cons` siguen siendo arrays válidos y no vacíos;
- hay variedad observable de comentarios `short` / `medium` / `long`;
- el texto user-facing no expone `null` ni `undefined`;
- la generación seeded sigue siendo determinista cuando se repite la misma `seed`;
- `prepareSupabasePayload` sigue recibiendo un shape compatible con importación.

Cobertura validada en Quality Gate:
- `scripts/generateMockReviews.test.ts` + `scripts/clearMockReviews.test.ts` pasando (`2` files / `7` tests).
- `data/mock/mockReviews.json` no se regenera por defecto durante la validación.

## Cómo mockear Supabase y fetch

Servicios frontend:

```ts
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
```

Scripts Node:

- Preferir inyección de dependencias (`supabase`, `logger`, `env`, filesystem temporal).
- No crear clientes reales en tests.
- No usar claves reales.
- Verificar payload y filtros (`source = mock`, `status = pending`, etc.).

## Cómo mockear localStorage y rutas

`src/test/setupTests.ts` limpia `localStorage`, restaura mocks y resetea `history` tras cada test. Si un test necesita estado previo:

```ts
localStorage.setItem('motoatlas.compareQueue', JSON.stringify(['id-1', 'id-2']));
window.location.hash = '#/comparador?bikes=id-1,id-2';
```

Siempre limpiar o confiar en `setupTests` para aislamiento.

## Admin Models Studio — image cleanup hardening + image manager modal refactor

Cobertura vigente:
- preview actual renderiza cuando `draft.imageUrl` existe, tanto en create como en edit;
- una imagen persistida de Storage en edit mode **no** se elimina físicamente al quitarla del formulario;
- una imagen subida durante la sesión sí puede borrarse inmediatamente antes del publish;
- al reemplazar una imagen persistida del bucket, el objeto viejo se limpia solo tras `updateAdminMotorcycle` exitoso;
- un fallo de publish/update no elimina la imagen persistida vieja;
- URLs manuales externas, assets locales `/images/...` y el placeholder `motorcycle-technical-pending.jpg` nunca llaman a `deleteMotorcycleImage`;
- una URL de Storage de otro proyecto Supabase no dispara cleanup destructivo;
- si la URL final resuelve al mismo object path que la imagen persistida original, el cleanup se omite;
- el cleanup fallido después de un publish exitoso es no bloqueante y no revierte el publish;
- `Descartar cambios` limpia estado local de selected file / session upload para no dejar reuploads accidentales pendientes.

**Image manager modal refactor** (implementado, sin cambios de schema/RLS):
- la preview a nivel formulario y el botón "Gestionar imágenes" permanecen fuera del modal;
- el modal contiene los controles single-image existentes: modo URL manual, modo upload archivo, input image URL, checkbox imageLocked, file input / trigger visual, preview archivo seleccionado, botón upload, alertas de validación/error;
- el modal usa dark premium admin layout inspirado en referencia Stitch gallery: tonal surfaces, thin borders, SCSS scoped `admin-model__...`, sin Tailwind copiado, sin leakage global;
- "Guardar cambios" solo cierra el modal y mantiene cambios en draft; no publica;
- **la galería de solo lectura ya está conectada**: el modal consume `adminMotorcycleGalleryService` en edit mode, carga imágenes reales con estados de carga/error/vacío/grid y renderiza `url`, `altText`, `isPrimary`, `source` y `sortOrder`;
- no hay datos falsos de galería, no hay thumbnails demo, no hay arrays demo de imágenes, no hay mock gallery cards;
- el contrato single-image (`motorcycles.image_url`, `image_locked`, `image_source`) sigue siendo la imagen primaria usada por cards, buscador, ficha y fallbacks;
- la creación de gallery records desde uploads, selección de primaria, reorden y borrado coordinado quedan para fases posteriores.

Comportamiento preservado por tests:
- explicit `Subir imagen`;
- auto-upload antes de publicar;
- imagen ya subida no se re-sube;
- `imageLocked = true` tras upload exitoso;
- custom file input;
- Section Radar;
- navegación post-publish y sync del catálogo en memoria a nivel `App.tsx`.

## Riesgos a vigilar

- Reviews: `pending` se inserta públicamente, pero solo `approved` se muestra. `rejected` y `hidden` no deben aparecer en UI pública.
- Comparador: URL y localStorage deben mantenerse sincronizados sin superar 3 motos.
- Datos: los scripts de fetch/merge/import no deben degradar imágenes locales, descripciones curadas ni specs críticas.
- Fallbacks: precio `0` no es precio real; imagen placeholder no debe venderse como imagen real.

## Criterio de cierre de tareas

Una tarea no está terminada si no pasan:

```bash
npm run typecheck
npm run test
```

Si queda un hueco que pertenece a E2E o necesita decisión de producto, se documenta explícitamente en el resumen final.

## Contratos de producto — testing

Ver `docs/product-behavior-contracts.md` para contratos de comportamiento de producto.

Cuando se reutilicen acciones comunitarias o cards de reviews, los tests deben validar:
- ownership (review propia vs ajena).
- auth/no auth (sesión presente o no).
- no-auth sin acciones clicables falsas/no-op.
- no-auth muestra `Útil N` como elemento pasivo (sin botón de voto).
- review propia muestra `Útil N` pasivo y chip `Propia`.
- útil/no útil mutuamente excluyentes.
- reportar una sola vez por usuario.
- reportar limpia reacción previa del usuario.
- review reportada bloquea Helpful/NotHelpful (`isBlocked` derivado de estado real).
- no autoreacción ni autoreporte.
- pending states bloquean interacción.
- ausencia de handlers no-op.
- no texto literal `null`/`undefined`.
- filtros solo afectan la sección que deben afectar.
- deduplicación dentro de cada bloque editorial, no entre bloques.
- si `FeaturedReviewCard` se usa en modo visual (sin infraestructura de acciones), confirmar explícitamente ausencia de botones Helpful/NotHelpful/Report/Reply y mantener CTAs reales.

Cobertura actual relevante:

- Baseline validado actual del proyecto: `1349` tests passing (78 files). Quality Gate aprobado con `typecheck` clean y `git diff --check` clean.
- Cobertura Admin Models Studio persistencia:
  - `src/components/pages/AdminPage/AdminPage.test.tsx` → cobertura de create publish, edit publish, validation errors (modeloId vacío, modeloId con espacios, sin marca, año inválido, imageUrl local aceptada, potencia inválida en edit), auth guard, acciones locales, service mocks, navegación post-publicación y sync App-level del catálogo en memoria.
  - `src/services/adminMotorcycleService.test.ts` → `19` tests cubriendo create/update success, error handling, payload validation.
  - Admin create/edit publish validan que el servicio no se llama cuando la validación falla.
  - Edit publish no requiere modeloId; create sí.
  - Hardening adicional de cleanup de imagen: `src/components/pages/AdminPage/AdminPage.test.tsx` + `src/services/adminMotorcycleImageUploadService.test.ts` cubren delete seguro por tipo de URL/origen, cleanup diferido post-publish y reset de estado local.

- `CommunityReviewsPage` valida que en no-auth `Útil N` siga visible en modo pasivo y que no aparezcan acciones falsas (`No útil`, `Reportar`, `Responder`).
- `CommunityReviewsPage` valida la Fase B de `PageHero`: conserva `hero-community.png`, mantiene `h1` + `aria-labelledby` y no renderiza los CTAs retirados `Explorar reviews` / `Buscar moto para opinar`. La limpieza posterior de pureza no cambia el contrato visible: solo mueve el styling contextual fuera de `PageHero.scss`.
- `CommunityReviewsPage` cubre el contrato actual de `Pulso de la Comunidad`: heading visible con `Comunidad`, tooltip accesible, footer `Datos aproximados · {refreshLabel} · Según reviews aprobadas` y ausencia del CTA `Ver todas las métricas`.
- `CommunityReviewsPage` valida los insights accionables: `Moto más comentada` y `Moto mejor valorada` se renderizan como links semánticos a `#/comunidad/{motorcycleId}` con accessible name `Ver reviews de ...`.
- `CommunityReviewsPage` documenta el reemplazo de `Review más útil` por `Moto mejor valorada`, asegura rating veraz en escala `/5` y verifica que no aparezcan claims falsos de tendencia o crecimiento (`trending`, `peak`, `sube`, `crece`).
- `SearchPage` valida el shell compartido `SearchHero` de forma observable: el hero renderiza la imagen `comparison-hero.png`, mantiene el heading/description visibles y el filtro de texto sigue siendo page-owned. Evitar tests que dependan del SCSS como fuente de verdad.
- `SearchControl` ya tiene tests unitarios dedicados: input accesible por label y compatibilidad con props estándar controladas/no controladas. `HeroSearch` y `SearchField` deben seguir probándose por comportamiento, no por detalles internos ni clases del input compartido.
- El contrato del Home hero sigue siendo de comportamiento: submit desde `HeroSearch` → navegación a `#/buscador?q=...`. El contrato del buscador sigue siendo de comportamiento: `SearchField` controlado + live filtering + sync con `routeHash`.
- En checks de residuos, evitar grep broad por `hero__search` sin contexto porque `search-hero__search` puede dar falsos positivos aunque el cleanup de `home-hero__search*` esté correcto.
- `BikeDetailPage` y `MotorcycleCommunityPage` quedan fuera de la unificación de hero: no forman parte de la matriz de pruebas de `PageHero` ni `SearchHero` porque sus heroes son exclusivos por decisión de producto.
- `CommunityReviewsPage` cubre explícitamente el branch de reporte duplicado (`"Ya has reportado esta review."`) y verifica bloqueo posterior + cleanup de reacción.
- `MotorcycleCommunityPage` mantiene cobertura de reportes con UX propia: tooltip no-auth, success/duplicate, cleanup de reacción y bloqueo posterior de Helpful/NotHelpful.
- `ReviewModal.test.tsx` ya NO trata el submit no-auth como camino exitoso soportado: el modal conserva el flujo autenticado como camino principal y, si se abre inesperadamente sin sesión, bloquea el submit antes del servicio y muestra el error `Inicia sesión para escribir una review.` sin llamar a `createReviewWithAspects`.
- `src/shared/ui/states/RadarState/RadarState.test.tsx` cubre el contrato base del estado compartido: defaults, props custom (`title`, `description`, `actionLabel`, `icon`), ausencia de acción sin `onAction`, callback al pulsar la acción, `aria-labelledby` mediante `titleId` y los test ids del radar (`reviews-empty-radar`, rings, sweep y markers).
- `AccountReviewsEmptyState.test.tsx` conserva la cobertura del wrapper de compatibilidad sobre `RadarState` y `AccountReviewsPage.test.tsx` mantiene el contrato observable del primer consumidor sin tocar la lógica de filtros/datos.
- `CommunityLandingPage.test.tsx` sigue cubriendo el segundo consumidor real de `RadarState`: preserva el copy `Aún no hay suficientes datos de comunidad.`, mantiene los links secundarios de página y valida que `Limpiar filtros` resetea el estado vacío y recupera el podio cuando había filtros activos dentro de `#/comunidad`.
- El focused check de remoción de ruta documenta que `#/motos-mejor-valoradas` ya no resuelve a la landing de comunidad, que el hash eliminado cae al home público según el fallback actual del router, que el sitemap no incluye `/motos-mejor-valoradas` y que `#/comunidad` sigue cubierto como ruta activa.
- El focused check de rename documenta que `#/comunidad` sigue renderizando la landing comunitaria bajo `CommunityLandingPage`, sin reintroducir `#/motos-mejor-valoradas` ni cambiar el comportamiento del hero, el podio o `RadarState`.
- `CommunityRankingsPage.test.tsx` añade el tercer consumidor real de `RadarState` para el empty state técnico filtrado: valida `Sin resultados`, el texto `No hay resultados para los filtros seleccionados.`, la desaparición de `Listado técnico de rankings` y que no aparezca `Limpiar filtros`. El comportamiento sin acción sigue cubierto principalmente por el contrato compartido de `RadarState`, no por una duplicación page-level.
- `src/shared/env/runtimeEnvironment.test.ts` valida el guard central de entorno/demo data: producción nunca habilita demo data, `VITE_ENABLE_DEMO_DATA='true'` no rompe esa protección, preview/development solo habilitan demo cuando corresponde y un `VITE_APP_ENV` inválido cae a comportamiento production-safe.
- `src/services/adminMotorcycleImageUploadService.test.ts` cubre el servicio de upload/delete de imágenes:
  - validaciones de seguridad: env vars, access token, motorcycleId (vacío, `/`, `..`, espacios), file type no soportado, file size > 5 MB.
  - éxito con extensión preservada: jpeg → `.jpg`, png → `.png`, webp → `.webp`.
  - headers: anon key + Bearer token + Content-Type correcto.
  - URL pública retornada según plantilla esperada.
  - error HTTP controlado (401, etc.) y error de red.
  - UUID hardening: `globalThis.crypto.randomUUID()` cuando disponible, `globalThis.crypto = {}` (sin randomUUID), `globalThis.crypto = undefined` (completamente ausente). Fallback Math.random genera UUID v4 válido.
  - `deleteMotorcycleImage`: validaciones (token, objectPath vacío, `..`, `/` inicial, sin directorio), DELETE con headers correctos, success void, error HTTP, error de red.
- `src/shared/reviews/reviewSourcePolicy.test.ts` valida el contrato delegado al guard central: producción devuelve solo `user`; demo habilitado devuelve `user/seed/mock`; demo deshabilitado vuelve a solo `user`; el contrato ya no depende directamente de `import.meta.env.PROD`.
- `src/components/pages/AdminPage/AdminPage.test.tsx` cubre el toggle admin de datos demo: solo se renderiza cuando el runtime lo permite, el click persiste `motoatlas.includeDemoData`, la preferencia local se hidrata al volver a montar y producción oculta el control aunque exista `localStorage` o `VITE_ENABLE_DEMO_DATA='true'`.
- El contrato del toggle sigue siendo de comportamiento y no de implementación interna: validar visibilidad, persistencia local y delegación al guard central; evitar duplicar en tests la lógica de `reviewSourcePolicy` dentro del componente admin.
- `src/shared/reviews/useReviewReactions.test.tsx` cubre el hook compartido de reacciones:
  - blocked (`unauthenticated`, `own_review`, `reported`, `pending`)
  - success/error de Helpful y NotHelpful
  - pending entra/sale y evita doble request durante la request
- Focused Quality Gate del batch 1 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/StaticInfoPages/StaticInfoPages.test.tsx` → `2` files / `16` tests passing.
- Focused Quality Gate del batch 2 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AccountRequestsPage/AccountRequestsPage.test.tsx` → `2` files / `19` tests passing.
- Focused Quality Gate del batch 3 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AccountPage/AccountPage.test.tsx` → `2` files / `21` tests passing.
- Focused Quality Gate del batch 4 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AccountReviewsPage/AccountReviewsPage.test.tsx` → `2` files / `14` tests passing.
- Focused Quality Gate del batch 5 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AccountMotorcycleReviewsPage/AccountMotorcycleReviewsPage.test.tsx` → `2` files / `16` tests passing.
- Focused Quality Gate del batch 6 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AdminMotorcycleReviewsPage/AdminMotorcycleReviewsPage.test.tsx` → `2` files / `29` tests passing.
- Focused Quality Gate del batch 7 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/AdminPage/AdminPage.test.tsx` → `2` files / `79` tests passing.
- Focused Quality Gate del batch 8 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.test.tsx` → `2` files / `80` tests passing.
- Focused Quality Gate del batch 9 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/pages/MotorcycleCommunityPage/MotorcycleCommunityPage.test.tsx` → `2` files / `52` tests passing.
- Focused Quality Gate del batch 10 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/components/reviews/ReviewModal/ReviewModal.test.tsx` → `2` files / `37` tests passing.
- Focused Quality Gate del batch 11 de auth fixtures: `src/test/fixtures/auth.test.ts` + `src/features/auth/AuthProvider.test.tsx` → `2` files / `7` tests passing.
- Focused Quality Gate del hardening de profile/loading en `AuthProvider`: `src/test/fixtures/auth.test.ts` + `src/features/auth/AuthProvider.test.tsx` → `2` files / `9` tests passing.
- Focused Quality Gate del cleanup auth-only de `ReviewModal`: `src/test/fixtures/auth.test.ts` + `src/components/reviews/ReviewModal/ReviewModal.test.tsx` → `2` files / `38` tests passing.
- Aprendizaje de migración: mover una suite a fixtures centrales no debe alterar la forma del escenario original; si el test legacy tenía `profile: null`, no hay que introducir un `profile` por comodidad porque cambia el `authContext` derivado.
- `createUserProfile()` solo debe entrar cuando la suite legacy ya tenía profile real; no se usa para “mejorar” un escenario que antes validaba `profile: null`.
- Los defaults de fixture no deben pisar mocks de función específicos del test: por ejemplo, `signOutMock` debe seguir siendo el spy efectivo cuando el caso cubre logout.
- En suites account-level, el estado autenticado por defecto también es parte del contrato legacy: si la suite arrancaba autenticada, la migración a fixtures debe conservar eso exactamente.
- En suites admin, el cuidado extra es preservar `isAdmin`, `profile.role`, `user`, `session`, `isAuthenticated`, estados de loading/error y los spies locales (`signIn`, `signUp`, `signOut`, `refreshProfile`) sin que los defaults de fixture “mejoren” el escenario legacy.
- En suites admin amplias como `AdminPage.test.tsx`, hay que preservar además los overrides parciales sensibles sin tocar áreas conocidas como la paginación/flaky si no fallan por la migración.
- En suites community como `CommunityReviewsPage.test.tsx`, el estado no-auth por defecto también forma parte del contrato legacy: `Útil N` debe seguir siendo pasivo, no deben aparecer acciones falsas sin sesión, y las ramas de own review / reported review / duplicate report / cleanup de report-reaction y orden editorial no deben variar por la migración.
- En `MotorcycleCommunityPage.test.tsx`, la migración a fixtures también debe respetar que la UX no-auth es DIFERENTE: las acciones pueden seguir siendo clicables para mostrar tooltip de login mientras los hooks bloquean antes de red; no hay que forzar el patrón pasivo de `CommunityReviewsPage`, y deben conservarse own review, reported review, duplicate report, cleanup, pending states y reaction notice/tooltips.
- En `ReviewModal.test.tsx`, la suite ya quedó alineada con el contrato auth-only real: preservar envío autenticado, validaciones, aspectos técnicos, accesibilidad del modal, close/cancel y mocks de `createReviewWithAspects`, pero sin volver a representar el submit no-auth como camino exitoso soportado.
- En `AuthProvider.test.tsx`, los fixtures centrales deben usarse solo como data factories de `user/session/profile`: `AuthProvider` sigue siendo la implementación bajo test, `createAuthState` no entra en esta suite y no se inyecta ningún estado tipo `AuthContext` para bypass de bootstrap, profile resolution o cleanup de `onAuthStateChange`. El hardening validado añade además cobertura para loading durante la transición auth, derivación de `isAdmin` solo tras resolver `profile.role`, limpieza inmediata en sign-out y protección contra resoluciones async obsoletas.
- Regla complementaria: `createUserProfile()` solo debe entrar cuando el test legacy ya tenía un perfil real; en suites account-level como `AccountRequestsPage`, eso preserva el contrato original sin reintroducir objetos inline.
- `src/shared/reviews/useReviewReports.test.tsx` cubre el hook compartido de reportes:
  - hidratación con auth + ids normalizados
  - guards (`unauthenticated`, `own_review`, `already_reported`)
  - submit outcomes (`success`, `duplicate`, `blocked`, `error`)
  - pending (`reportPendingIds`)
  - `cleanupError` sin romper outcomes de éxito/duplicado
- `src/shared/reviews/reviewCommunityActions.test.ts` cubre helpers puros compartidos:
  - `buildReviewAuthContext`
  - `isOwnReview`
  - `isDuplicateReviewReportError`
  - `markReportsByReviewId`
  - `upsertReactionSummaryInList`
  - `upsertReactionSummaryById`
- `src/components/pages/CommunityLandingPage/CommunityLandingPage.test.tsx` cubre paridad de metadatos en podio de `#/comunidad`:
  - las cards compactas 2 y 3 mantienen visible en DOM el span `año · segmento · cilindrada`.
- `src/components/pages/AdminPage/AdminPage.test.tsx` cubre image upload flow + custom file input + Section Radar en Admin Models Studio:
  - modo URL manual: publish no llama a `uploadMotorcycleImage`.
  - modo upload: auto-upload antes de create publish y antes de edit publish.
  - create payload usa URL pública retornada y `imageLocked: true`.
  - edit payload usa URL pública retornada y `imageLocked: true`.
  - auto-upload failure previene create/update calls.
  - missing access token previene upload y publish.
  - explicit `Subir imagen` + publish posterior no re-upload (assert `toHaveBeenCalledTimes(1)`).
  - creación/fallback de `modelId` para la ruta de upload.
  - auto-upload usa `motorcycleId` de ruta en edit mode.
  - create publish success navega a `#/motos/{createdBike.id}` y edit publish success navega a `#/motos/{motorcycleId}` solo tras éxito real del servicio.
  - validation failure, upload failure y service failure no navegan.
  - `App.tsx` + `AdminPage` cubren el sync App-level del catálogo en memoria: replace inmutable por `id` existente o append inmutable para una moto nueva, sin refresh completo del navegador.
  - custom file input UI cubierto por tests de render general de AdminPage (el input oculto + label estilizado se renderizan correctamente).
  - Section Radar: el sticky bar con marcadores numerados se renderiza en el form; el scroll-to-section vía `scrollIntoView` se prueba como comportamiento observable en los tests de navegación de AdminPage.
  - Section progress indicators: el tracking de completitud por sección se deriva de `validateAdminModelDraftForPublish` y se renderiza condicionalmente según el estado del draft.

Pendiente/riesgo menor:
- Existe reporte de flaky aislado en `AdminPage` (`no muestra paginación cuando hay 6 reportes o menos`); no se observó relación con consolidación de reacciones.
- No hay test explícito para doble toggle en el mismo tick exacto; el hook usa ref interno y hay cobertura de pending en request.
- La detección de reporte duplicado depende de un literal; si backend cambia el mensaje, debe actualizarse helper + test.
- En hidratación de reportes, el hook compartido absorbe errores silenciosamente; si producto requiere feedback específico en UI, hay que añadir cobertura + contrato explícito por contenedor.
