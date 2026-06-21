# Panel Admin — MotoAtlas

## Rutas existentes

| Ruta | Descripción |
|------|-------------|
| `#/admin` | Landing admin con accesos rápidos |
| `#/admin/moderacion` | Moderación de reportes y respuestas |
| `#/admin/reviews` | Garaje: reviews agrupadas por modelo |
| `#/admin/reviews/[motorcycleId]` | Reviews de una moto concreta |
| `#/admin/modelos` | Hub de gestión de modelos |
| `#/admin/modelos/nuevo` | Creación de nuevo modelo (persiste con `createAdminMotorcycle`) |
| `#/admin/modelos/editar` | Búsqueda/selección de modelos para editar |
| `#/admin/modelos/[motorcycleId]/editar` | Formulario de edición de modelo (persiste con `updateAdminMotorcycle`, prefilled desde la moto seleccionada) |

Protección:
- Acceso restringido a usuarios con `user_profiles.role === 'admin'` (comprobado por `useAuth` y RLS en backend).

## `#/admin/moderacion`

Dos tabs:

**Tab reportes (`review_reports`):**
- Lista paginada de reportes con filtros: estado, motivo, orden.
- `AdminReportCard` muestra: estado reporte, motivo, reportante, fecha, review original con `comment`, `pros`, `cons` y `ReviewAspectSummary`.
- Acciones sobre reporte: marcar revisado, descartar, resolver.
- Acciones sobre review desde el reporte: aprobar, ocultar, rechazar.
- Al modificar la review, el reporte pasa a `action_taken`.

**Tab respuestas (`review_replies`):**
- Lista de respuestas pendientes de moderación.
- `AdminReplyCard` muestra: autor de respuesta, fecha, review original con `comment`, `pros`, `cons` y `ReviewAspectSummary`.
- Acciones: aprobar, ocultar, rechazar.

**Orden y filtros:**
- `created_at.desc` (Más recientes) o `created_at.asc` (Más antiguos).
- Cuando `Estado = Todos`, no hay agrupación artificial por estado pending; se mezclan todos por fecha.
- Filtros por estado concreto (`pending`, `approved`, `rejected`, `hidden`) y por motivo.

## Admin Models Studio

### `#/admin/modelos`

Hub admin de navegación con submenú `Modelos` en el sidebar: `Vista general`, `Nuevo modelo`, `Editar modelo`.

### `#/admin/modelos/nuevo`

Creación de nuevo modelo con persistencia real vía `createAdminMotorcycle`. Hero preview estilo `BikeDetailPage`, secciones Stitch colapsables con tooltips, footer de acciones locales (Descartar, Guardar, Vista previa, Publicar). Validación cliente compartida (`validateAdminModelDraftForPublish`) antes de publicar: modeloId obligatorio y sin espacios, marca, modelo, descripción, segmento, carnet, tipo de motor, año, cilindrada, potencia, torque, peso, altura asiento, depósito, precio, imagen URL (obligatoria + formato `/` o `http(s)://`).

### `#/admin/modelos/editar`

Selección y búsqueda de modelos existentes para editar.

**Layout:**
- AccountReviewsPage-style sidebar con panel de filtros responsive (sheet/drawer en mobile, permanente en desktop)
- Main content: grids de cards admin con paginación `AccountPagination`

**Filtros (10 grupos):**
- Marca (text-only, multi-select)
- Segmento (iconos alineados con `motorcycleSegmentFilterOptions`: `bolt`/`speed`/`route`/`terrain`/`construction`/`two_wheeler`/`explore`; secundarios con `more_horiz`)
- Carnet (sin iconos inventados, etiquetas del contrato compartido: `Carnet A2`, `Carnet A`)
- Precio, Potencia, Peso, Altura asiento (rangos predefinidos)
- Electrónica (icono `memory` vía `getMotorcycleTechnicalIcon`)
- Uso recomendado (text-only)
- Calidad de datos (text-only)
- Búsqueda libre por marca o modelo

**Cards:**
- `AdminModelEditCard`: estructuralmente alineada con `AccountReviewMotorcycleSummaryCard` (imagen, overlay, h2, brand/year metadata). CTA `Editar modelo` hacia `#/admin/modelos/{motorcycleId}/editar`.
- Las cards reciben `motorcycles` resueltos desde App (`AdminEditModelsPage({ motorcycles })`), alineando imágenes con SearchPage/MotorcycleGarageCard.
- `MotorcycleImage` recibe el bike directamente sin forzar `getMotorcycleLocalImageUrl`.

### `#/admin/modelos/[motorcycleId]/editar`

Formulario de edición de modelo que reutiliza `AdminModelFormBody` (misma estructura visual/estructural que `#/admin/modelos/nuevo`). Campos prefilled desde la moto seleccionada vía `motorcycles.find()` (resueltos desde App). Persiste cambios con `updateAdminMotorcycle` tras validación cliente compartida. Edit NO valida modeloId (solo create).

**Copy del edit mode:**
- title: `Editar modelo`
- description: `Actualiza los datos disponibles de este modelo.`
- status/kicker: `Editando {brand} {model} {year}`
- heading interno: `Workspace de edición`

**Footer (4 acciones):**
- Descartar cambios (resetea al draft original)
- Guardar borrador (local)
- Vista previa (local)
- Publicar modelo (persiste con `updateAdminMotorcycle`)

**Validación cliente aplicada (create y edit):**
- `validateAdminModelDraftForPublish` compartida entre ambos flujos.
- Create valida modeloId obligatorio y sin espacios.
- Edit omite validación de modeloId.
- Imágenes locales `/images/...` aceptadas.
- Image URL obligatoria para publish (tanto en URL manual como upload mode).

**Sección de imagen del modelo:**

El formulario tiene una sección `Imagen` con modo de selección (`role="radiogroup"` con botones `role="radio"` y `aria-checked`):

- **URL manual**: input `type="url"` + checkbox `Imagen bloqueada / curada`. Válido para enlazar imágenes ya publicadas.
- **Subir archivo**: file input con accept `image/jpeg,image/png,image/webp`. Validación local de tipo y tamaño (5 MB max). Preview local con `URL.createObjectURL`. Object URL cleanup en unmount/replacement. El native file input button fue reemplazado por un control custom MotoAtlas-styled con `Seleccionar archivo` como trigger visual y el nombre del archivo seleccionado visible.
- **Imagen actual**: cuando `draft.imageUrl` existe, create y edit muestran una preview actual del modelo.
- **Quitar imagen del formulario**: si la imagen actual ya estaba persistida en Storage o viene de una URL manual/local, el admin puede quitarla del formulario o reemplazarla, pero no se borra físicamente en ese momento.
- **Eliminar imagen actual**: si la imagen fue subida en la sesión actual y todavía no quedó persistida en el modelo, sí puede eliminarse inmediatamente desde Storage antes de publicar.
- **Cleanup seguro al reemplazar**: si una edición reemplaza una imagen persistida del bucket, el objeto viejo se limpia solo después de un publish/update exitoso. Si el publish falla, la imagen vieja no se elimina.
- **Protecciones**: URLs manuales externas, assets locales `/images/...` y el placeholder `motorcycle-technical-pending.jpg` son reemplazables, pero nunca se borran físicamente desde la UI admin. Además, solo se consideran borrables URLs del proyecto Supabase configurado con object paths seguros.

**Image manager modal (refactor):**

- La preview a nivel formulario y el botón "Gestionar imágenes" permanecen **fuera del modal**.
- El modal contiene los controles single-image existentes: modo URL manual, modo upload archivo, input image URL, checkbox `imageLocked`, file input / trigger visual, preview archivo seleccionado, botón upload, alertas de validación/error.
- El modal usa **dark premium admin layout** inspirado en referencia Stitch gallery: tonal surfaces, thin borders, SCSS scoped `admin-model__...`, sin Tailwind copiado, sin leakage global.
- "Guardar cambios" **solo cierra el modal y mantiene cambios en draft**; no publica.
- **Galería conectada con creación de records**: el modal carga imágenes desde `getAdminMotorcycleGalleryImages` en edit mode. El upload explícito en edit mode sube a Storage y crea un registro en `motorcycle_images` (`isPrimary: false`, `source: 'manual'`), que se añade al estado local. En create mode, el record se crea tras publish exitoso. URLs manuales y assets locales no crean records. Un guard evita borrar de Storage imágenes que ya tienen gallery record.
- **Gallery card visual polish**: cards minimalistas con icon-only/current-cover indicators, tooltips accesibles `aria-label`. Info panel controlado por botón (no hover). Múltiples cards pueden mostrar info simultáneamente (`galleriaInfoCardKeys: Set<string>`). Flip card con `rotateY` (revolving-door), no `rotateX`. `prefers-reduced-motion` respetado. Header compacto (gap, padding, helper copy reducidos). Metadata compacta.
- **Stable library ordering**: bug de reorden visual al seleccionar portada corregido con keys estables por URL via `useRef<Map<string, string>>`. Cada URL recibe un key React estable (`lib-0`, `lib-1`, ...) en su primera aparición, reutilizado en todos los renders. `persisted` registrado antes que `draft` para que cuando ambas URLs coinciden, el label sea `Portada guardada` en vez de `Portada en edición`. El cambio es React reconciliation únicamente — no muta gallery state ni `sortOrder`. `currentImagePreviewUrl` sigue siendo la fuente de verdad de la portada activa; no depende del orden de galería.
- **Cover fallback**: si se elimina la portada actual, se aplica `/images/placeholders/motorcycle-technical-pending.jpg` como fallback seguro.
- El **contrato backend single-image** (`motorcycles.image_url`, `image_locked`, `image_source`) sigue siendo el dueño de la imagen primaria que usan cards, buscador, ficha y fallbacks. `motorcycle_images` es una capa paralela de galería adicional.

**Acción `Subir imagen`:**
- Aparece solo cuando hay un archivo válido seleccionado.
- Texto cambia a `Subiendo imagen...` durante upload. Deshabilitado durante upload o sin handler.
- Sube a Supabase Storage `motorcycle-images` via `uploadMotorcycleImage`.
- Requiere `session.access_token`. Missing token lanza error controlado.
- En create mode usa `draft.modelId.trim()` o fallback `suggestedModelId` como ID de ruta.
- En edit mode usa el `motorcycleId` de la ruta.
- Éxito: `draft.imageUrl = publicUrl`, `draft.imageLocked = true`. Status: `Imagen subida correctamente.`
- Error: `role="alert"` con mensaje. Preview y archivo se conservan para retry.
- No persiste el modelo (no llama a create/update).

**Auto-upload al publicar:**
- Si el admin hace clic en `Publicar modelo` con un archivo seleccionado pero no subido:
  - El archivo se sube automáticamente primero.
  - La URL pública retornada se usa en el payload de create/update.
  - `imageLocked` se fuerza a `true`.
  - Si la subida falla, el publish no se ejecuta.
- Si el archivo ya fue subido explícitamente, no se vuelve a subir.
- Si está en modo URL manual, no se intenta subir.

**Navegación y sync tras publicar:**
- Create success: el admin navega a `#/motos/{createdBike.id}`.
- Edit success: el admin navega a `#/motos/{motorcycleId}`.
- La navegación ocurre solo después del éxito real del servicio.
- Fallos de validación, upload o servicio no navegan.
- `App.tsx` sincroniza el catálogo en memoria sin refresh completo: reemplaza inmutablemente la moto existente por `id` o hace append si la moto creada es nueva.

**Section Radar (Stitch-inspired):**
- Barra de navegación sticky entre el hero y el formulario.
- Marcadores numerados (01–N) para cada sección del formulario.
- Tracks de progreso verticales a la izquierda de cada marcador, con relleno rojo proporcional a la completitud de campos requeridos de esa sección.
- Fondo glass translúcido con efecto sticky al hacer scroll.
- Scroll horizontal en mobile si las secciones no entran en el viewport.
- No usa hash anchors ni modifica la URL. El scroll a sección es puramente JS (`scrollIntoView` con offset).
- No hay tracking activo de sección actual (sin IntersectionObserver por ahora).

**Implementado (gallery actions):**
- **Pending-delete local state**: marcar imágenes de galería para eliminación diferida hasta publicar el formulario. Estado local en `pendingDeleteImageIds` (Set), sincronizado a ref para publish.
- **Undo**: deshacer pending-delete por imagen. Reemplaza el botón "Usar como portada" en la misma posición.
- **Badge pending-delete**: badge `delete_outline` + clase `--pending-delete` en la card.
- **Primary sync**: al publicar, se unsetea `isPrimary` de la imagen eliminada (si era primaria) antes de setear la nueva, y se borra el pending-delete en orden correcto.
- **Storage cleanup seguro**: borrado de Storage con de-duplicación de paths y guards (otro registro activo comparte el path, portada actual lo usa).
- **Delete button visual style**: icono `delete_forever`, posicionado left-bottom, estilo stage button con hint destructivo sutil (`$color-error`).
- **Card back info scroll/wrapping**: `overflow-y: auto` en back face y card-info, `overflow-wrap: break-word` en valores de metadata.

**Sin:**
- A2 fields en draft
- selección de primaria desde la galería (solo desde card action button)
- reorden drag-and-drop
- eliminación inmediata independiente del formulario
- WebP conversion opcional
- IntersectionObserver active section tracking

**Decisión de producto:** la galería de imágenes debe independizarse del formulario del modelo. Las acciones de galería (eliminar, reordenar) no deben depender de "Publicar modelo". El pending-delete actual es un paso intermedio que será reemplazado por confirmación inmediata con modal. Ver `docs/current-workstreams.md` — Workstream C.

**Futuro:**
1. Reemplazar pending-delete por eliminación inmediata con modal de confirmación.
2. Drag-and-drop reorder con persistencia independiente.
3. Multi-delete batch desde selección múltiple.
4. Card back info simplificada (solo nombre, fecha; remover source y orden de la card normal).
5. Refactor de AdminPage en componentes más pequeños (ver debajo).
6. Elección de primaria desde la galería.
7. WebP conversion opcional, IntersectionObserver active section tracking.
8. El set de filtros de `#/admin/modelos/editar` puede refinarse tras uso real; `Calidad de datos` es candidato a eliminación.

**Deuda técnica — refactor de AdminPage:**
`AdminPage.tsx` ha crecido hasta ser difícil de modificar con seguridad. Refactor en progreso:
- Extracción gradual: ✅ helpers puros → ✅ hooks → ⬜ componentes presentacionales.
- No combinar refactor con cambios de comportamiento destructivo.

**✅ Fase 1 completada — Helpers puros extraídos:**
- `src/components/pages/AdminPage/adminPageUtils.ts` — dateFormatter, formatDate, getTimestamp, formatPendingReviewCount, getDisplayName, getBrandOptions, isRangePresetActive, normalizeTextList, getCurrentImageOriginLabel, formatFileSize (43 tests)
- `src/components/pages/AdminPage/adminGalleryImageUtils.ts` — appendGalleryImage, getNextGallerySortOrder, buildGalleryLibraryImages, getMotorcycleImageObjectPath, helpers de gallery card (85 tests)
- `src/components/pages/AdminPage/adminModelPreviewUtils.ts` — preview badges y formateo de preview (19 tests)
- `src/components/pages/AdminPage/adminPageConstants.ts` — constantes estáticas, option lists y filter presets
- `src/components/pages/AdminPage/adminModelDraftUtils.ts` — transformación/validación de draft

**✅ Fase 2 completada — Hook extraído (límite conservativo):**
- `src/components/pages/AdminPage/useAdminImageManager.ts` — estado puramente local (9 tests)
- `isImageManagerOpen`, `imageMode`, handlers de apertura/cierre/modo, `galleriaInfoCardKeys`, `handleToggleGalleryCardInfo`, `resetGalleryInfoCardKeys`
- Decisión: detener extracción aquí. Los 13 estados de imagen restantes en `AdminModelFormBody` están acoplados a service calls, async flows, refs, upload/delete/gallery/publish o Storage cleanup.

**⬜ Pendiente — Descomposición JSX en componentes presentacionales:**
  - `AdminModelImageManagerModal`
  - `AdminImageGalleryGrid`
  - `AdminImageGalleryCard`
  - `AdminImageUploadControls`
  - `AdminGalleryDeleteConfirmationModal`
  - hooks adicionales: `useAdminModelDraft`, `useAdminModelGallery`, `useAdminModelImageUpload`, `useAdminModelPrimarySync`, `useAdminModelGalleryDelete`, `useAdminModelPublish`

## `#/admin/reviews`

Agrupa reviews por `motorcycleId`:
- Tarjetas resumen por moto: pending count, última review, rating medio.
- Filtros: estado, origen, verificación, orden.
- Filtrado en memoria en frontend.
- CTA a ficha de moto y link para revisar reviews en comunidad.

## Estados

| Entidad | Estados |
|---------|---------|
| Reviews | `pending`, `approved`, `rejected`, `hidden` |
| Reportes | `pending`, `reviewed`, `dismissed`, `action_taken` (UI: "Resuelto") |
| Respuestas | `pending`, `approved`, `hidden`, `rejected` |

## Acciones disponibles

Sobre reportes:
- `reviewed` — marcar como revisado.
- `dismissed` — descartar reporte.
- `action_taken` — marcar como resuelto.

Sobre reviews (desde reporte):
- `hidden` — ocultar la review.
- `approved` — aprobar/publicar la review.
- `rejected` — rechazar la review.

Sobre respuestas:
- `approved` — aprobar respuesta.
- `hidden` — ocultar respuesta.
- `rejected` — rechazar respuesta.

## Componentes reutilizados

- `AdminReportCard` — usa `ReviewAspectSummary` para mostrar aspectos técnicos de la review original.
- `AdminReplyCard` — usa `ReviewAspectSummary` para mostrar aspectos técnicos de la review asociada a la respuesta.
- `ReviewAspectSummary` — ubicado en `src/components/reviews/ReviewAspectSummary/`.

## Pendiente / notas futuras

- Notificaciones/avisos automáticos al autor de la review cuando se actúe sobre su review.
- Añadir pruebas E2E para flujos críticos de administración.
- Galería multi-imagen completa: la lectura está conectada, los records se crean desde uploads admin, las gallery cards tienen polish visual y el orden es estable. El borrado está implementado como pending-delete diferido (depende de publicación del formulario). La decisión de producto es migrar a eliminación inmediata con modal de confirmación (ver Workstream C en `docs/current-workstreams.md`).
- Refactor de `AdminPage.tsx`: el archivo ha crecido demasiado. Se recomienda extracción gradual de helpers → hooks → componentes antes de agregar más lógica de galería.
