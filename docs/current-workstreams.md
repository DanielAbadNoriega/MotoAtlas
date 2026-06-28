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
* MotoIcon shared registry (`src/shared/ui/icons/MotoIcon.tsx`) creado con 44 iconos inline SVG — ampliado a 71 iconos durante las migraciones de reviews, account/navigation y Navbar/global navigation — sin imports de archivos SVG ni dependencia de fuente externa.
* LoadingState migrado de `getIconPath()` helper privado a `<MotoIcon>` component.
* `compare_arrows` y `sync` reemplazados por paths oficiales de Material Symbols desde archivos SVG locales.
* API de MotoIcon endurecida: `name` acepta `MotoIconName | string`, atributos controlados (`viewBox`, `fill`, `aria-hidden`, `focusable`, `role`, `aria-label`) no sobrescribibles por consumidores.
* MotoIcon.test.tsx con 9 tests iniciales, ampliado a 14 tests que cubren el registry completo de 71 iconos.
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
* Navbar/global navigation icons migrados de Material Symbols a MotoIcon: NavIcon helper migrado a `<MotoIcon>` para todos los iconos scoped (`account_circle`, `person`, `menu`, `hub`, `article`, `home`, `compare_arrows`, `chevron_right`, `close`, `expand_more`, `logout`). `search` y `explore` quedan intencionalmente como Material Symbols.
* ScrollToTopButton migrado de Material Symbols a `<MotoIcon name="arrow_upward">`.
* 7 iconos agregados al registry para Navbar/global navigation: account_circle, arrow_upward, article, home, hub, menu, person.
* Navbar.scss actualizado con selectores SVG duales (`.material-symbols-outlined` + `svg`) para mantener apariencia visual en signin button, drawer links, hover/focus/aria-current states y mobile bottom nav.
* SCSS de ScrollToTopButton no requirió cambios (sizing vía props de componente).

Archivos o zonas permitidas:
* MotoIcon (shared/ui/icons)
* LoadingState (shared/ui/loading)
* App.tsx (solo isInitialLoading + SearchPage + ComparatorPage wrapping)
* LoadingPreviewPage (si el tipo lo requiere)
* AccountPage (AccountSidebar, AccountPagination, AccountPage.scss)
* AccountMotorcycleReviewsPage (solo sidebar/logout icon)
* Navbar (Navbar.tsx, Navbar.scss, Navbar.test.tsx)
* ScrollToTopButton (ScrollToTopButton.tsx, ScrollToTopButton.scss)

Zonas prohibidas:
* schema/RLS/Supabase
* admin/auth
* services
* SearchPage (filtros/resultados/empty states)
* package files

Pendiente (próximas fases de migración SVG):
* MotoIcon `search` consumers pendientes: SearchControl, AccountReviewsPage, CommunityRankingsPage, CommunityReviewsPage, AdminPage search usage.
* Filtros de búsqueda/comunidad/cuenta/admin.
* Iconos decorativos de bajo riesgo (Footer social links, etc.) — opcional, aceptan Material Symbols.
* Material Symbols siguen siendo aceptables para iconos decorativos de bajo riesgo donde el retardo de fuente no causa raw text visible.
* Optimización de imágenes como bloque futuro separado (no mezclar con migración SVG).

Riesgos:
* LoadingState SCSS debe mantener `width`/`height` (no `font-size`) para sizing de iconos SVG.
* No migrar Material Symbols globalmente sin auditoría de impacto visual por componente.

Último resultado:
* typecheck: clean
* test: 84 files, 1616 passed
* MotoIcon: 14/14
* Navbar: 13/13
* ScrollToTopButton: sin test enfocado (comportamiento preservado)
* AccountPage: 17/17
* AccountMotorcycleReviewsPage: 12/12
* RadarState: 3/3
* ReviewModal: 34/34
* ReviewAspectSummary: 14/14
* Review cards/actions focused: 60 passed (FeaturedReviewCard 41, AccountReviewCard 3, MotorcycleReviewCard 2, MotoIcon 14)
* git diff --check: clean

Siguiente paso:
* Decidir próxima fase de migración SVG: search consumers o filtros.

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
