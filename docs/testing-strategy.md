# Estrategia de testing de MotoAtlas

MotoAtlas debe poder crecer sin romper buscador, comparador, fichas, reviews ni el pipeline de datos. La prioridad es probar comportamiento real de usuario y contratos de datos, no píxeles ni clases CSS.

Estado actual de suite:
- `1119` tests passing (72 files).

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
- adopción auditada: 11 suites mockean `useAuth`; solo `AuthPage.test.tsx` usa la fixture central y quedan 10 suites con `mockAuth` local.

Pendiente residual (no bloqueante):
- migración incremental de `mockAuth` repetidos en otros tests (Account*, Community*, ReviewModal, StaticInfoPages, Admin*).
- integración realista que detecte el conflicto `ReviewModal` no-auth → RPC autenticada.
- transición `onAuthStateChange` mientras el perfil/rol todavía se resuelve.
- smoke E2E de RLS/roles y privilegios efectivos de funciones `security definer` en staging.

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
- RecentReviews en TopRatedMotorcyclesPage ahora con acciones seguras (Fase 4.4): Helpful/NotHelpful real en auth, `Útil N` pasivo en no-auth, Report/Reply no cableados.

Pendiente recomendado (post Fase 3.1):
- añadir tests cross-page para evitar drift entre:
  - vistas compactas (`Search`, `CommunityReviews`, `AccountReviews`, `Admin`);
  - vistas con exposición explícita de segmentos (`TopRated`, `CommunityRankings`).

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

- `CommunityReviewsPage` valida que en no-auth `Útil N` siga visible en modo pasivo y que no aparezcan acciones falsas (`No útil`, `Reportar`, `Responder`).
- `CommunityReviewsPage` cubre explícitamente el branch de reporte duplicado (`"Ya has reportado esta review."`) y verifica bloqueo posterior + cleanup de reacción.
- `MotorcycleCommunityPage` mantiene cobertura de reportes con UX propia: tooltip no-auth, success/duplicate, cleanup de reacción y bloqueo posterior de Helpful/NotHelpful.
- `ReviewModal.test.tsx` mockea como exitoso el envío no-auth, pero producción llama a una RPC que exige `auth.uid()`; es un gap de integración P1, no evidencia de soporte anónimo efectivo.
- `src/shared/reviews/reviewSourcePolicy.test.ts` valida contrato por entorno: producción solo `user`; dev/pre con demo activo incluye `seed/mock`; dev/pre con demo inactivo vuelve a solo `user`.
- `src/shared/reviews/useReviewReactions.test.tsx` cubre el hook compartido de reacciones:
  - blocked (`unauthenticated`, `own_review`, `reported`, `pending`)
  - success/error de Helpful y NotHelpful
  - pending entra/sale y evita doble request durante la request
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
- `src/components/pages/TopRatedMotorcyclesPage/TopRatedMotorcyclesPage.test.tsx` cubre paridad de metadatos en podio de `#/comunidad`:
  - las cards compactas 2 y 3 mantienen visible en DOM el span `año · segmento · cilindrada`.

Pendiente/riesgo menor:
- Existe reporte de flaky aislado en `AdminPage` (`no muestra paginación cuando hay 6 reportes o menos`); no se observó relación con consolidación de reacciones.
- No hay test explícito para doble toggle en el mismo tick exacto; el hook usa ref interno y hay cobertura de pending en request.
- La detección de reporte duplicado depende de un literal; si backend cambia el mensaje, debe actualizarse helper + test.
- En hidratación de reportes, el hook compartido absorbe errores silenciosamente; si producto requiere feedback específico en UI, hay que añadir cobertura + contrato explícito por contenedor.
