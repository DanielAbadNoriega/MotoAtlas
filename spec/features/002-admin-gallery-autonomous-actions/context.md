# 002 · Admin Gallery Autonomous Actions — Context

## Estado

Activa. Carpetas SDD creadas. Baseline de eliminación confirmada con modal ya implementado en rama cerrada `refactor/admin-gallery-helpers`.

Este slice 002 **no implementa la eliminación desde cero**. El objetivo es consolidar el baseline ya implementado extrayendo la lógica de eliminación de galería a `useAdminGalleryDelete`, encapsulando estado y handlers para que sean testeables de forma independiente. El comportamiento visible no cambia.

## Documentos fuente inspeccionados

- `docs/admin.md` — sección Admin Models Studio, imagen manager, decisiones de producto, deuda técnica, futuro
- `docs/current-workstreams.md` — Workstream C cerrado, objetivo, orden de implementación, target behaviour alcanzado, diferidos
- `spec/constitution/hard-limits.md` — límites 4, 5, 6, 7, 9, 10
- `spec/constitution/roadmap.md` — 002 en "Siguiente"
- `.agents/MotoAtlas-Safe-Builder.md`
- `.agents/MotoAtlas-Quality-Gate.md`
- `.agents/MotoAtlas-Docs-Sync.md`
- `.agents/MotoAtlas-Supabase-Guard.md`

## Código fuente inspeccionado

- `src/components/pages/AdminPage/AdminModelFormBody.tsx` (1462 líneas)
- `src/components/pages/AdminPage/AdminEditMotorcyclePage.tsx`
- `src/components/pages/AdminPage/AdminNewModelPage.tsx`
- `src/components/pages/AdminPage/GalleryConfirmDeleteModal.tsx`
- `src/components/pages/AdminPage/useAdminImageManager.ts`
- `src/components/pages/AdminPage/adminGalleryImageUtils.ts`
- `src/services/adminMotorcycleGalleryService.ts`
- `src/services/adminMotorcycleImageUploadService.ts`
- `src/services/adminMotorcycleGalleryService.test.ts`
- `src/services/adminMotorcycleImageUploadService.test.ts`
- `src/components/pages/AdminPage/useAdminImageManager.test.tsx`
- `src/components/pages/AdminPage/adminGalleryImageUtils.test.ts`
- `src/components/pages/AdminPage/AdminPage.test.tsx` (sección gallery delete)

## Baseline de implementación actual (rama cerrada `refactor/admin-gallery-helpers`)

**Helpers puros extraídos:**
- `adminPageUtils.ts` — dateFormatter, formatDate, getTimestamp, formatPendingReviewCount, getDisplayName, getBrandOptions, isRangePresetActive, normalizeTextList, getCurrentImageOriginLabel, formatFileSize (43 tests)
- `adminGalleryImageUtils.ts` — appendGalleryImage, getNextGallerySortOrder, buildGalleryLibraryImages, getMotorcycleImageObjectPath, helpers de gallery card (85 tests)
- `adminModelPreviewUtils.ts` — preview badges y formateo de preview (19 tests)
- `adminPageConstants.ts` — constantes estáticas, option lists y filter presets
- `adminModelDraftUtils.ts` — transformación/validación de draft

**Hook extraído:**
- `useAdminImageManager.ts` — estado puramente local (9 tests)
  - `isImageManagerOpen`, `imageMode`, handlers de apertura/cierre/modo, `galleriaInfoCardKeys`, `handleToggleGalleryCardInfo`, `resetGalleryInfoCardKeys`

**AdminPage decomposition completa:**
- `AdminPage.tsx` reducida de ~5900 a 13 líneas
- 9 page components extraídos
- `AdminModelFormBody` extraído (1462 líneas)
- `adminSharedUi.tsx` extraído
- Barrel aplanado, zero circular imports

**Gallery confirmed immediate delete (Bloque C — completado en rama cerrada):**
- `GalleryConfirmDeleteModal` creado
- Eliminación inmediata reemplaza pending-delete
- Cover fallback automático cuando se elimina la imagen portada
- Storage cleanup best-effort con guard de path compartido
- Estado deletion: `confirmDeleteImage: AdminMotorcycleGalleryImage | null`, `isDeletingGalleryImage: boolean`
- Dead code removido: `pendingDeleteImageIds` Set/ref, pending-delete handlers, undo UI, badge/clase `--pending-delete`, publish loop de gallery cleanup, 3 utilidades (getActiveGalleryImages, getGalleryImageCleanupObjectPath, isCleanupPathSharedWithActiveImage), 11 tests asociados
- Suite: 1588 tests / 83 files, typecheck clean, git diff --check clean

## Comportamiento actual

### Flujo de eliminación de imagen de galería (ya implementado)

1. Admin abre el image manager modal desde `#/admin/modelos/{motorcycleId}/editar`
2. En la tarjeta de imagen de galería, botón `delete_forever` con `aria-label: "Eliminar imagen de la galería: {altText}"`
3. Click → `setConfirmDeleteImage(targetImage)` — se abre `GalleryConfirmDeleteModal`
4. Modal muestra: backdrop oscuro, header con título "CONFIRMAR ELIMINACIÓN", preview de la imagen, copy de advertencia, actions Cancelar/Eliminar
5. Escape cierra el modal si está abierto (no el image manager)
6. Al confirmar:
   - `handleDeleteGalleryImage(galleryImage)` en AdminEditMotorcyclePage
   - `deleteAdminMotorcycleGalleryImageRecord(galleryImage.id, accessToken)` — eliminación del registro
   - Si el storage path no está compartido con otra imagen de galería → `deleteMotorcycleImage(storagePath, accessToken)` best-effort (try/catch)
   - Si la imagen eliminada era la portada actual → `draft.imageUrl = adminModelTechnicalPlaceholderImage`, `imageLocked = false`
   - `galleryImages` state se actualiza removiendo la imagen
   - Modal se cierra
7. Si falla: `galleryError` se muestra en el modal, UI se mantiene, imagen no se remueve

### Estado relacionado en AdminModelFormBody (1462 líneas)

```typescript
const [galleryImages, setGalleryImages] = useState<readonly AdminMotorcycleGalleryImage[]>([]);
const [confirmDeleteImage, setConfirmDeleteImage] = useState<AdminMotorcycleGalleryImage | null>(null);
const [isDeletingGalleryImage, setIsDeletingGalleryImage] = useState(false);
```

Handlers relacionados (inline en AdminModelFormBody):
- `handleConfirmDelete` — coordina eliminación + cover fallback + update state
- `handleCancelDelete` — limpia confirmDeleteImage
- `handleDeleteGalleryImage` — definido en AdminEditMotorcyclePage (pasado como prop `onDeleteGalleryImage`)

### Servicios

- `adminMotorcycleGalleryService.ts` — CRUD de registros gallery via Supabase REST
- `adminMotorcycleImageUploadService.ts` — upload y delete de archivos en Storage

## Decisiones de producto ya tomadas

1. **Eliminación inmediata confirmada** — pending-delete fue removido. No hay estado diferido ni undo.
2. **Storage cleanup best-effort** — si Storage falla, el gallery record ya se eliminó y la UI queda consistente.
3. **Guard de path compartido** — si otro gallery record activo referencia el mismo Storage path, no se borra el archivo.
4. **Cover fallback seguro** — `motorcycles.image_url` / `draft.imageUrl` nunca queda apuntando a imagen eliminada.
5. **Galería independizada del formulario** — las acciones de galería no dependen de "Publicar modelo".
6. **Decomposición JSX diferida** — la extracción de componentes presentacionales de galería+modal es deuda técnica, no parte de esta feature.

## Riesgos

- **Acoplamiento AdminModelFormBody** — 1462 líneas con estado de galería mezclado con estado de formulario. Extraer lógica de galería a hooks es seguro; tocar el formulario sin necesidad explícita no lo es.
- **Storage cleanup best-effort** — archivos huérfanos pueden quedar en Storage si el delete de Storage falla. Aceptado por producto.
- **Tests de AdminPage** (252-255 tests) — la sección gallery delete tiene tests específicos que dependen de la estructura actual de state y handlers.
- **No mezclar con Workstream E** — la zona de galería admin y la zona de MotoIcon/search son independientes.

## Zonas prohibidas

- `supabase/schema.sql`, RLS, policies, grants — sin MotoAtlas-Supabase-Guard explícito
- `service_role_key`, admin endpoints
- `AuthProvider`, auth behaviour, sesión
- `App.tsx` eager imports de admin
- `AdminPage.tsx` (reducido a 13 líneas, barrel compatibility)
- `adminSharedUi.tsx` — UI compartida ya extraída
- `src/components/layout/Navbar/` — no relacionado
- `src/features/auth/` — no relacionado
- `review_reactions`, `review_reports` — no relacionado
- Workstream E (MotoIcon/search) — zonas distintas, no mezclar

## Preguntas abiertas

1. **¿Qué alcance exacto para el primer slice?** El confirmed delete ya existe. La descomposición JSX es deuda técnica futura según docs/admin.md. Las preguntas son:
   - ¿Extraer `useAdminGalleryDelete` hook es suficiente para el primer slice?
   - ¿O el primer slice debe incluir también la extracción de `AdminModelImageManagerModal` como componente?
   - Recomendación: el primer slice se limita a extraer el hook `useAdminGalleryDelete` que centraliza `confirmDeleteImage`, `isDeletingGalleryImage`, `handleConfirmDelete`, `handleCancelDelete`, `galleryImages`, `setGalleryImages`. Esto no cambia comportamiento visible, solo mueve estado a un hook reusable. La descomposición JSX completa queda como paso separado.

2. **¿Drag-and-drop reorder entra en este scope?** Según `docs/admin.md` y `current-workstreams.md`, reorder es trabajo diferido post-merge. No debe mezclarse con extracción de hooks.

3. **¿Multi-delete batch?** También diferido. Relacionado con reorder pero independiente.

4. **¿Schema/Supabase/RLS necesita cambios?** No. Los servicios existentes (`adminMotorcycleGalleryService`, `adminMotorcycleImageUploadService`) usan Supabase REST con auth de sesión. El contrato de schema no cambia.

## Próximo paso seguro

Extraer `useAdminGalleryDelete` hook que centralice estado y handlers de eliminación de galería, sin cambiar comportamiento visible. Validar que AdminPage tests sigan pasando. Esta es la base técnica necesaria antes de la descomposición JSX completa.

## Baseline de validación actual

- typecheck: limpio
- test: 1588 tests / 83 files (suite completa de la rama cerrada `refactor/admin-gallery-helpers`)
- `git diff --check`: limpio
- Baseline operativos tras merge: 1602 tests / 84 files (Workstream E + C cerrados)
