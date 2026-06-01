# Estrategia de testing de MotoAtlas

MotoAtlas debe poder crecer sin romper buscador, comparador, fichas, reviews ni el pipeline de datos. La prioridad es probar comportamiento real de usuario y contratos de datos, no píxeles ni clases CSS.

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
- Flujos de login/admin cuando existan.

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

Pendiente residual (no bloqueante):
- migración incremental de `mockAuth` repetidos en otros tests (Account*, Community*, ReviewModal, StaticInfoPages, Admin*).

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
  - valida targets y visibilidad condicional de `other` según segmentos disponibles.

Regla de contrato actual:
- Los tests de dataset no fallan si hay segmentos esperados todavía ausentes en datos; solo fallan por segmentos inválidos.

Riesgo menor conocido:
- Parte del contrato parsea `src/types/bike.ts` y `supabase/schema.sql` con regex/texto. Si cambia mucho el formato, el test puede requerir ajuste, pero el fallo es visible y explícito.

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

Pendiente/riesgo menor:
- Existe reporte de flaky aislado en `AdminPage` (`no muestra paginación cuando hay 6 reportes o menos`); no se observó relación con consolidación de reacciones.
- No hay test explícito para doble toggle en el mismo tick exacto; el hook usa ref interno y hay cobertura de pending en request.
- La detección de reporte duplicado depende de un literal; si backend cambia el mensaje, debe actualizarse helper + test.
- En hidratación de reportes, el hook compartido absorbe errores silenciosamente; si producto requiere feedback específico en UI, hay que añadir cobertura + contrato explícito por contenedor.
