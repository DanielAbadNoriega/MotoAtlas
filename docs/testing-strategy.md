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

Al crear fixtures:

- Usar datos mínimos pero realistas.
- Hacer override por test con factories (`createXFixture`) en vez de duplicar objetos enormes.
- Mantener ids estables y legibles.
- Incluir casos malos cuando el producto debe ser tolerante: imagen vacía, review incompleta, fecha inválida, scores ausentes.

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

### Pendiente menor de cobertura

- Añadir test explícito para branch de reporte duplicado: mensaje `"Ya has reportado esta review."` en `CommunityReviewsPage`.
