# MotoAtlas — Current Workstreams

## Objetivo

Controlar las tareas activas en paralelo para evitar conflictos entre ramas, pérdida de contexto o solapamientos de alcance.

## Reglas

* Máximo 2 tareas activas de código a la vez.
* Cada tarea debe vivir en su propia rama.
* No mezclar tareas que toquen las mismas zonas del repo.
* Las ramas funcionales pueden leer este documento, pero no modificarlo salvo instrucción explícita.
* Toda tarea debe terminar con:

  * `npm run typecheck`
  * `npm run test`
* Si una tarea necesita tocar archivos fuera de alcance, debe detenerse y documentarlo antes de modificar.

## Workstreams activos

### Workstream A — Rediseñar Insights en vivo

Rama:
`feature/community-live-insights`

Estado:

* cerrado / mergeado a main

Objetivo:
Rediseñar el bloque `Insights en vivo` de `#/comunidad/reviews` para sustituir métricas poco útiles por señales de descubrimiento comunitario más relevantes.

Cambios previstos:

* quitar review con más kilómetros;
* quitar rating medio global;
* añadir moto más comentada;
* añadir review más útil;
* añadir segmento más activo;
* añadir uso más activo.

Archivos o zonas permitidas:

* página/componente de `CommunityReviewsPage`;
* helpers locales de cálculo de insights si existen;
* tests de `CommunityReviewsPage` si cambia render/comportamiento;
* docs solo si se pide explícitamente después.

Zonas prohibidas:

* auth;
* admin;
* schema/RLS/Supabase;
* servicios de reportes/reacciones;
* `useReviewReports`;
* `useReviewReactions`;
* filtros reutilizables globales;
* taxonomía;
* buscador;
* cuenta.

Riesgos:

* confundir insights editoriales con rankings reales;
* introducir claims de tendencia sin histórico temporal;
* romper polling suave actual;
* duplicar lógica que debería mantenerse local o documentarse para futura extracción.

Resultado esperado:

* bloque más útil y coherente con roadmap;
* sin tendencia falsa;
* sin `null`/`undefined` visible;
* tests/typecheck limpios.

Último resultado:

* typecheck: clean
* test: 1057 passed (69 files)

Siguiente paso:

* Docs sync aplicada. Workstream cerrado.

---

### Workstream B — Fixtures auth/perfiles

Rama:
`test/auth-fixtures`

Estado:

* cerrado / mergeado a main

Objetivo:
Crear una capa central de fixtures/mocks locales para testear autenticación, perfiles, sesión, roles y futuros permisos sin depender de Supabase real.

Cambios previstos:

* usuario autenticado normal;
* usuario admin;
* usuario sin `display_name`;
* usuario con `avatar_url`;
* usuario sin avatar;
* usuario no autenticado;
* perfil básico completo;
* perfil incompleto;
* sesión mock;
* factories con overrides si encaja.

Archivos o zonas permitidas:

* `src/test/fixtures/*`;
* tests de auth existentes si se migran mocks repetidos;
* tests de Navbar/Login/Register/Mi cuenta si aplica;
* `docs/testing-strategy.md` solo si se pide Docs Sync después.

Zonas prohibidas:

* lógica productiva de auth;
* `AuthProvider` salvo necesidad explícita y aprobada;
* Supabase real;
* schema/RLS;
* comunidad/reviews;
* admin funcional;
* estilos;
* rutas.

Riesgos:

* tocar producción sin necesidad;
* crear fixtures demasiado rígidos;
* duplicar mocks en vez de centralizarlos;
* romper tests existentes por una migración demasiado amplia.

Resultado esperado:

* fixtures centralizados;
* tests existentes siguen pasando;
* menos duplicación futura en mocks de auth;
* sin dependencia de Supabase real.

Último resultado:

* typecheck: OK
* test: OK (66 files, 985 tests)
* main: mergeado y verificado

* mantener como referencia cerrada.
