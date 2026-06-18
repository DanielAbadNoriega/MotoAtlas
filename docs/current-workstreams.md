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

### Workstream C — Gallery independent actions + AdminPage refactor (backlog)

Rama:
(ninguna — backlog documentado)

Estado:
* pendiente de implementación
* auditoría completada
* decisión de producto documentada

Objetivo:
Convertir las acciones de galería de imágenes de Admin Models en operaciones independientes del formulario del modelo, y comenzar el refactor de `AdminPage.tsx` que ha crecido demasiado.

Problema actual:
* El borrado de imágenes de galería usa pending-delete local (`pendingDeleteImageIds` Set).
* Las imágenes marcadas no se eliminan hasta que el admin publica el formulario completo del modelo.
* El botón undo reemplaza al botón "Usar como portada" en la misma posición, lo que resulta confuso.
* La clase `--pending-delete` existe en TSX pero no tiene reglas SCSS — la card no se diferencia visualmente de forma suficiente.
* `AdminPage.tsx` es demasiado grande y difícil de modificar con seguridad.

Target behavior:
* Click `delete_forever` → modal de confirmación → aplicar eliminación inmediata.
* No más "pending hasta publicar".
* Cover actual: si se elimina la imagen que es portada, el modal debe advertir y aplicar placeholder al confirmar.
* `motorcycles.image_url` / `draft.imageUrl` nunca debe quedar apuntando a una imagen eliminada.
* Drag-and-drop reorder debe persistir independientemente.
* La galería debe ser un subsistema autónomo, no un side-effect del formulario.

Current-cover safety:
* `updateAdminMotorcycle` existe pero puede no ser ideal para updates aislados de cover.
* Antes de implementar, verificar si se necesita un helper `updateAdminMotorcycleCover(motorcycleId, { imageUrl, imageLocked }, token)`.
* Preferir PATCH minimalista a payload completo para no pisar campos no relacionados.

Order de implementación propuesta:
1. Extraer helpers puros de galería (sin cambios de comportamiento).
2. Implementar modal de confirmación reutilizable.
3. Reemplazar pending-delete por eliminación inmediata confirmada.
4. Asegurar cover fallback en eliminación inmediata.
5. Remover estado pending-delete + undo + badge + publish logic asociada.
6. Multi-delete batch (después de single delete estable).
7. Drag-and-drop reorder como acción independiente.
8. Refactor extracción de hooks → componentes.

Refactor direction:
* No combinar refactor grande con cambios de comportamiento destructivo.
* Extracción gradual: helpers puros → hooks → componentes presentacionales.
* Descomposición propuesta:
  - AdminModelImageManagerModal
  - AdminImageGalleryGrid
  - AdminImageGalleryCard
  - AdminImageUploadControls
  - AdminGalleryDeleteConfirmationModal
  - hooks: useAdminModelDraft, useAdminModelGallery, useAdminModelImageUpload, useAdminModelPrimarySync, useAdminModelGalleryDelete, useAdminModelPublish

Archivos o zonas permitidas:
* AdminPage.tsx
* AdminPage.scss
* AdminPage.test.tsx
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
* No iniciar refactor de AdminPage hasta tener los tests de regresión actuales (1415 tests).
* No combinar refactor con cambios de comportamiento de galería.

Último resultado:
* Auditoría completada y documentada.

Siguiente paso:
* Decidir si implementar helper `updateAdminMotorcycleCover` antes de la eliminación inmediata.

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
