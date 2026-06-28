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

### Workstream C — Gallery independent actions + AdminPage refactor (completado)

Rama:
`refactor/admin-gallery-helpers` (cerrado — funcionalidad implementada)

Estado:
* **Bloque C (confirmed immediate delete)** completado.
* GalleryConfirmDeleteModal implementado.
* Confirmed-delete flow reemplazó pending-delete.
* Cover fallback automático.
* Storage hardening (try/catch best-effort + path shared guard).
* Dead code eliminado: `pendingDeleteImageIds` Set/ref, pending-delete handlers, undo UI, badge/clase `--pending-delete`, publish loop de gallery cleanup, 3 utilidades (`getActiveGalleryImages`, `getGalleryImageCleanupObjectPath`, `isCleanupPathSharedWithActiveImage`) + 11 tests.
* Queda fuera del alcance de esta rama (diferido post-merge): drag-and-drop reorder, multi-delete batch, JSX decomposition de galería+modal.

Último bloque validado:

**Bloque A — Extracción inicial de helpers + hook de AdminPage.**
* helpers puros extraídos a `adminPageUtils.ts` + `adminGalleryImageUtils.ts` + `adminModelPreviewUtils.ts` + `adminPageConstants.ts` + `adminModelDraftUtils.ts` (147 tests nuevos combinados)
* hook `useAdminImageManager` extraído con estado puramente local (9 tests)
* AdminPage tests: 255/255
* typecheck: clean, `git diff --check`: clean

**Bloque B — AdminPage decomposition completa (~5900 → 13 líneas).**
* 9 page components extraídos a archivos individuales (AdminModerationPage, AdminRequestsPage, AdminReviewsPage, AdminDashboardPage, AdminModelsWorkspace, AdminModelsPage, AdminNewModelPage, AdminEditModelsPage, AdminEditMotorcyclePage)
* `AdminModelFormBody` extraído (1462 líneas)
* `AdminGate`, `AdminSidebar`, `ReviewStatusBadge`, `AdminDemoDataToggle` → `adminSharedUi.tsx`
* 5 utility modules extraídos (adminPageUtils, adminPageConstants, adminGalleryImageUtils, adminModelDraftUtils, adminModelPreviewUtils)
* hook `useAdminImageManager` extraído
* `index.ts` barrel aplanado: exports directos desde archivos individuales, eliminando cadena `index.ts → AdminPage.tsx → archivos`
* `AdminPage.tsx` reducido a 13 líneas (compatibilidad barrel para `AdminPage.test.tsx`)
* sin imports circulares
* suite completa: 1602 tests passing (hito intermedio — antes de confirmed-delete y +14 tests)
* typecheck: clean

**Bloque C — Confirmed immediate delete.**
* Botón `delete_forever` → `GalleryConfirmDeleteModal` (backdrop + header + image preview + warning copy + Cancelar/Eliminar).
* Confirmación: (1) `deleteAdminMotorcycleGalleryImageRecord(id, token)` elimina el registro. (2) `deleteMotorcycleImage(path, token)` best-effort con try/catch — si Storage falla, el gallery record se eliminó igual y la UI queda consistente. (3) Path compartido: si otro gallery record activo referencia el mismo Storage path, no se borra.
* Cover fallback: si la imagen eliminada era la portada actual, `draft.imageUrl` se resetea a placeholder con `imageLocked = false`.
* Escape: si el modal está abierto, Escape cierra el modal primero (no el image manager).
* Prop pattern: `onDeleteGalleryImage: (motorcycleId, galleryImageId, storagePath) ⇒ void`.
* Sin estado diferido ni pending-delete. Eliminación inmediata.
* Dead code removido: estado `pendingDeleteImageIds` (Set + ref), `handlePendingDeleteGalleryImage`, `handleUndoPendingDelete`, badge/clase `--pending-delete`, publish gallery deletion loop, 3 utilidades (`getActiveGalleryImages`, `getGalleryImageCleanupObjectPath`, `isCleanupPathSharedWithActiveImage`), 11 tests asociados.
* AdminPage tests: 252/252.
* Suite completa: 1588 tests / 83 files.
* `GalleryConfirmDeleteModal` componente creado.
* typecheck: clean, `git diff --check`: clean.

Objetivo:
Convertir las acciones de galería de imágenes de Admin Models en operaciones independientes del formulario del modelo, y continuar el refactor de `AdminPage.tsx`.

Target behavior (alcanzado):
* Click `delete_forever` → `GalleryConfirmDeleteModal` → eliminación inmediata.
* Cover actual: si se elimina la imagen que es portada, el modal advierte y aplica placeholder al confirmar.
* `motorcycles.image_url` / `draft.imageUrl` nunca queda apuntando a una imagen eliminada.
* Drag-and-drop reorder debe persistir independientemente (pendiente).

Order de implementación (implementado en esta rama):
1. ✅ Extraer helpers puros de galería.
2. ✅ Implementar modal de confirmación reutilizable.
3. ✅ Reemplazar pending-delete por eliminación inmediata confirmada.
4. ✅ Asegurar cover fallback en eliminación inmediata.
5. ✅ Remover estado pending-delete + undo + badge + publish logic asociada.
6. ✅ AdminPage decomposition completa (~5900→13 líneas, barrel aplanado).
7. ⬜ Multi-delete batch (diferido post-merge).
8. ⬜ Drag-and-drop reorder (diferido post-merge).

Refactor direction (implementado en esta rama):
* No combinar refactor grande con cambios de comportamiento destructivo.
* Extracción gradual: helpers puros → hooks → componentes presentacionales.
* ✅ Fase 1 completada: helpers puros extraídos (`adminPageUtils`, `adminGalleryImageUtils`, `adminModelPreviewUtils`, `adminPageConstants`, `adminModelDraftUtils`).
* ✅ Fase 2 completada: hook `useAdminImageManager` con estado local puro extraído.
* ✅ Fase 3 completada: AdminPage decomposition completa (~5900→13 líneas). 9 page components extraídos, barrel aplanado, zero circular imports.
* Descomposición JSX de galería+modal en componentes presentacionales queda como trabajo diferido (post-merge), no implementado en esta rama.

### Backlog diferido (post-merge)

La descomposición de AdminPage fue groundwork necesaria, pero no suficiente por sí sola para reducir el eager loading de admin. `App.tsx` sigue importando de forma eager todas las páginas admin (9 páginas + shared UI + utilidades + servicios) en cada visita, incluso si el usuario no es admin. Nota: `AdminMotorcycleReviewsPage.tsx` ya importa `AdminSidebar` directamente desde `../AdminPage/adminSharedUi`, no a través del barrel de `AdminPage` (fix aplicado en esta rama).

Orden de implementación propuesto (post-merge con landings):
1. Audit routing en `App.tsx` y renderizado de rutas admin.
2. Implementar `React.lazy()` / dynamic imports solo para rutas admin, diferir carga de todo el bloque admin hasta navegar a `#/admin`.
3. Quality Gate completo (typecheck + test).
4. Architecture review más amplio:
   - separar presentation de logic donde corresponda;
   - revisar feature/module boundaries;
   - reducir responsabilidades mezcladas en page components;
   - evaluar estructura feature-based, boundaries MVC-inspired o clean separation UI/hooks/services;
   - usar Codex para el trabajo de arquitectura serio.

Riesgos del backlog:
* El eager import de admin en `App.tsx` afecta tanto dev (más transforms ESM en cada cambio) como producción (admin code en bundle base).
* `React.lazy()` introduce un split point que requiere test de carga asíncrona.
* El architecture review post-lazy-loading debe ser deliberado y no mezclarse con la implementación de lazy loading.

Archivos o zonas permitidas:
* AdminPage.tsx
* AdminPage.scss
* AdminPage.test.tsx
* archivos extraídos en `src/components/pages/AdminPage/` (admin*Utils.ts, useAdmin*.ts)
* docs (solo si se pide explícitamente después)

Zonas prohibidas:
* services (salvo helper de cover si es necesario)
* schema/RLS/Supabase
* auth/roles/policies
* review_reactions, review_reports
* comunidad
* buscador
* cuenta
* App routing
* AuthProvider
* package files

Riesgos:
* Fallo parcial si Storage delete falla tras gallery record delete (archivo huérfano aceptable).
* `updateAdminMotorcycle` puede pisar campos del modelo si se usa para cover update aislado.
* No combinar refactor con cambios de comportamiento de galería.

Último resultado (branch closure):
* AdminPage decomposition completa (~5900→13 líneas, barrel aplanado). Gallery confirmed delete implementado con `GalleryConfirmDeleteModal`. `AdminSidebar` import directo fijado.
* Quality Gate final de rama: 1588 tests / 83 files, typecheck clean, `git diff --check` clean.
* Rama `refactor/admin-gallery-helpers` implementation-complete, lista para merge/sincronización con landings.
* No incluye landings ni capa SDD/spec/features.
* **Guardrails:** no refactorizar/revertir/reorganizar `src/components/pages/AdminPage/` salvo necesidad explícita. No reintroducir imports desde páginas extraídas de vuelta a través de `./AdminPage` (barrel). Los helpers extraídos viven en `admin*`/`useAdmin*` dentro del mismo directorio.

Siguiente paso:
* Merge/sync con landings.
* Construir capa SDD/spec/features sobre el estado real combinado post-merge.
* Luego abordar backlog diferido: `React.lazy()` admin routes, architecture review, Quality Gate post-merge.

---

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
* test: suite completa al cierre

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
* test: suite completa al cierre
* main: mergeado y verificado

* mantener como referencia cerrada.
