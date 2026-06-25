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
* implementación parcial completada (extracción helpers + hook)
* pendiente: eliminación inmediata + galería autónoma
* decisión de producto documentada

Último bloque validado:

**Bloque A — AdminPage refactor conservativo (helpers + hook extraídos).**
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
* suite completa: 1602 tests passing
* typecheck: clean

Objetivo:
Convertir las acciones de galería de imágenes de Admin Models en operaciones independientes del formulario del modelo, y continuar el refactor de `AdminPage.tsx`.

Problema actual:
* El borrado de imágenes de galería usa pending-delete local (`pendingDeleteImageIds` Set).
* Las imágenes marcadas no se eliminan hasta que el admin publica el formulario completo del modelo.
* El botón undo reemplaza al botón "Usar como portada" en la misma posición, lo que resulta confuso.
* La clase `--pending-delete` existe en TSX pero no tiene reglas SCSS — la card no se diferencia visualmente de forma suficiente.
* `AdminPage.tsx` ya está descompuesto (~5900 → 13 líneas), pero el JSX pesado de galería y modal sigue en `AdminModelFormBody`.

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
1. ✅ Extraer helpers puros de galería (completado).
2. Implementar modal de confirmación reutilizable.
3. Reemplazar pending-delete por eliminación inmediata confirmada.
4. Asegurar cover fallback en eliminación inmediata.
5. Remover estado pending-delete + undo + badge + publish logic asociada.
6. Multi-delete batch (después de single delete estable).
7. Drag-and-drop reorder como acción independiente.
8. ✅ AdminPage decomposition completa (~5900→13 líneas, barrel aplanado). JSX pesado de galería+modal sigue en `AdminModelFormBody`.

Refactor direction:
* No combinar refactor grande con cambios de comportamiento destructivo.
* Extracción gradual: helpers puros → hooks → componentes presentacionales.
* ✅ Fase 1 completada: helpers puros extraídos (`adminPageUtils`, `adminGalleryImageUtils`, `adminModelPreviewUtils`, `adminPageConstants`, `adminModelDraftUtils`).
* ✅ Fase 2 completada: hook `useAdminImageManager` con estado local puro extraído.
* ✅ Fase 3 completada: AdminPage decomposition completa (~5900→13 líneas). 9 page components extraídos, barrel aplanado, zero circular imports.
* Pendiente (galería): descomposición JSX de galería + modal en componentes presentacionales:
  - AdminModelImageManagerModal
  - AdminImageGalleryGrid
  - AdminImageGalleryCard
  - AdminModelImageUploadControls
  - AdminGalleryDeleteConfirmationModal
  - hooks adicionales: useAdminModelDraft, useAdminModelGallery, useAdminModelImageUpload, useAdminModelPrimarySync, useAdminModelGalleryDelete, useAdminModelPublish

### Post-gallery technical backlog

La descomposición de AdminPage fue groundwork necesaria, pero no suficiente por sí sola para reducir el eager loading de admin. `App.tsx` sigue importando de forma eager todas las páginas admin (9 páginas + shared UI + utilidades + servicios) en cada visita, incluso si el usuario no es admin. Además, `AdminMotorcycleReviewsPage.tsx` importa `AdminSidebar` desde `../AdminPage` (barrel indirecto) en vez de desde la fuente directa `./adminSharedUi`.

Orden de implementación propuesto (post-galería, no incluir en la tarea actual de galería):
1. Fix imports directos de `AdminSidebar` en `AdminMotorcycleReviewsPage.tsx` para que no pase por el barrel de `AdminPage`.
2. Audit routing en `App.tsx` y renderizado de rutas admin.
3. Implementar `React.lazy()` / dynamic imports solo para rutas admin, diferir carga de todo el bloque admin hasta navegar a `#/admin`.
4. Quality Gate completo (typecheck + test).
5. Architecture review más amplio:
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

Último resultado:
* AdminPage decomposition completa (~5900→13 líneas, barrel aplanado). 1602 tests, typecheck clean, zero circular imports.

Siguiente paso (galería):
* Decidir si implementar helper `updateAdminMotorcycleCover` antes de la eliminación inmediata, o pasar directamente a implementar modal de confirmación (step 2).

Siguiente paso (post-gallery backlog):
* Abordar los 5 items del post-gallery technical backlog (ver sección arriba) una vez completada la galería autónoma.

---

### Workstream E — Landings / Loading / image performance

Rama:
`feature/landings-loading-image-audit`

Estado:
* en implementación activa

Objetivo:
Optimizar la carga inicial de landings clave (Buscador, Comparador, Loading preview) eliminando artefactos visuales bajo redes lentas y dependencias de iconos de fuente externa en componentes críticos de carga.

Implementado:
* LoadingState integrado como estado de carga real en #/buscador cuando getMotorcycles() resuelve.
* LoadingState integrado como estado de carga real en #/comparador cuando getMotorcycles() resuelve.
* isLoading robusto ante fallo de getMotorcycles() vía finally chain.
* LoadingState libre de dependencia Material Symbols: los 6 iconos del loader (motorcycle, groups, manage_search, compare_arrows, sync, bolt) se renderizan como SVG inline, eliminando raw icon text bajo Slow 4G.
* MotoIcon shared registry (`src/shared/ui/icons/MotoIcon.tsx`) creado con 44 iconos inline SVG — ampliado a 64 iconos durante las migraciones de reviews y account/navigation — sin imports de archivos SVG ni dependencia de fuente externa.
* LoadingState migrado de `getIconPath()` helper privado a `<MotoIcon>` component.
* `compare_arrows` y `sync` reemplazados por paths oficiales de Material Symbols desde archivos SVG locales.
* API de MotoIcon endurecida: `name` acepta `MotoIconName | string`, atributos controlados (`viewBox`, `fill`, `aria-hidden`, `focusable`, `role`, `aria-label`) no sobrescribibles por consumidores.
* MotoIcon.test.tsx con 9 tests iniciales, ampliado a 14 tests que cubren el registry completo de 64 iconos.
* ReviewModal migrado de Material Symbols a MotoIcon: 15 iconos reemplazados (check_circle, close, report, shield, star, comment, add, remove, route, arrow_right_alt, aspect icons, etc.).
* ReviewAspectSummary migrado de Material Symbols a MotoIcon: 3 iconos reemplazados + chat→comment.
* ReviewModal usa text_ad para el campo de experiencia/comentario en vez de terminal.
* ReviewAspectSummary resuelve vibration desde MotoIcon (sin fallback a motorcycle para suspension).
* RadarState migrado de Material Symbols a MotoIcon: reemplazado `<span class="material-symbols-outlined">{icon}</span>` por `<MotoIcon>` inline SVG, eliminado `.material-symbols-outlined` y `font-variation-settings` del SCSS.
* `search_off` y `radar` agregados a MotoIcon registry desde SVGs locales oficiales; RadarState por defecto usa `search_off` y consumidores usan `radar` — ambos resuelven sin fallback a motorcycle.
* Review cards/actions migrados de Material Symbols a MotoIcon: FeaturedReviewCard, AccountReviewCard, MotorcycleReviewCard, HelpfulReviewAction, NotHelpfulReviewAction, ReportReviewAction, ReviewReplySection, ReplyConvivenceNotice.
* 14 iconos de review agregados al registry: schedule, speed, calendar_month, block, verified, thumb_up, thumb_down, flag, reply, forum, info, expand_more, expand_less + route/star existentes.
* SCSS de review cards/actions limpiado: selectores `.material-symbols-outlined` reemplazados por reglas `svg` con width/height explícitos y colores restaurados tras QA visual.
* Tests actualizados: los que afirmaban texto raw de Material Symbols ahora verifican SVG/aria-expanded/estructura estable.
* Account action/navigation icons migrados de Material Symbols a MotoIcon:
  * `logout` en AccountSidebar y AccountMotorcycleReviewsPage sidebar.
  * `chevron_left`, `chevron_right`, `keyboard_double_arrow_left`, `keyboard_double_arrow_right` en AccountPagination.
* `search` agregado a MotoIcon registry (sin migrar consumidores — pendiente para fase de filters/search).
* 6 iconos de action/navigation/search agregados al registry: search, logout, chevron_left, chevron_right, keyboard_double_arrow_left, keyboard_double_arrow_right.
* AccountPage.scss actualizado con sizing SVG-friendly para iconos de botones de cuenta.

Archivos o zonas permitidas:
* MotoIcon (shared/ui/icons)
* LoadingState (shared/ui/loading)
* App.tsx (solo isInitialLoading + SearchPage + ComparatorPage wrapping)
* LoadingPreviewPage (si el tipo lo requiere)
* AccountPage (AccountSidebar, AccountPagination, AccountPage.scss)
* AccountMotorcycleReviewsPage (solo sidebar/logout icon)

Zonas prohibidas:
* schema/RLS/Supabase
* admin/auth
* services
* SearchPage (filtros/resultados/empty states)
* package files

Pendiente (próximas fases de migración SVG):
* MotoIcon `search` consumers pendientes: SearchControl, AccountReviewsPage, CommunityRankingsPage, CommunityReviewsPage, AdminPage search usage.
* Filtros de búsqueda/comunidad/cuenta/admin.
* Botones de acción restantes (Navbar, etc.).
* Account action/navigation icons (logout, chevron pagination, double-arrow keyboard nav) completados en esta fase.
* Material Symbols siguen siendo aceptables para iconos decorativos de bajo riesgo donde el retardo de fuente no causa raw text visible.
* Optimización de imágenes como bloque futuro separado (no mezclar con migración SVG).

Riesgos:
* LoadingState SCSS debe mantener `width`/`height` (no `font-size`) para sizing de iconos SVG.
* No migrar Material Symbols globalmente sin auditoría de impacto visual por componente.

Último resultado:
* typecheck: clean
* test: 84 files, 1616 passed
* MotoIcon: 14/14
* AccountPage: 17/17
* AccountMotorcycleReviewsPage: 12/12
* RadarState: 3/3
* ReviewModal: 34/34
* ReviewAspectSummary: 14/14
* Review cards/actions focused: 60 passed (FeaturedReviewCard 41, AccountReviewCard 3, MotorcycleReviewCard 2, MotoIcon 14)
* git diff --check: clean

Siguiente paso:
* Decidir próxima fase de migración SVG: search consumers, filtros o botones de acción restantes.

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
