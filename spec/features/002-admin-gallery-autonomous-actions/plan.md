# 002 · Admin Gallery Autonomous Actions — Plan

## Enfoque técnico

### Decisión central

El estado y handlers de eliminación de galería están actualmente mezclados en `AdminModelFormBody` (1462 líneas). La extracción del hook `useAdminGalleryDelete` es una refactorización conservadora que:

1. **Mueve** estado y handlers a un hook separado
2. **No cambia** el comportamiento visible
3. **No toca** servicios, schema, RLS ni la UI visual
4. **Es independiente** de la descomposición JSX futura

Este enfoque sigue la dirección de refactor establecida en Workstream C: extracción gradual de helpers puros → hooks → componentes presentacionales.

### Archivos que cambian

#### 1. Nuevo archivo: `src/components/pages/AdminPage/useAdminGalleryDelete.ts`

Hook que encapsula:
- Estado: `galleryImages`, `confirmDeleteImage`, `isDeletingGalleryImage`
- Handler `handleConfirmDelete`: llama a `onDeleteGalleryImage` del padre → cover fallback → update state → cleanup modal
- Handler `handleCancelDelete`: limpia `confirmDeleteImage`

#### 2. Modificado: `src/components/pages/AdminPage/AdminModelFormBody.tsx`

- Reemplaza el estado inline de gallery delete por `useAdminGalleryDelete`
- Pasa `onDeleteGalleryImage`, `currentImageUrl`, `currentImageObjectPath` como props al hook
- Recibe `galleryImages`, `setGalleryImages`, `confirmDeleteImage`, `isDeletingGalleryImage`, `handleConfirmDelete`, `handleCancelDelete` desde el hook
- El effect que hace fetch de gallery images sigue en `AdminModelFormBody` (o se mueve al hook si es apropiado)
- El render del `GalleryConfirmDeleteModal` sigue donde está (dentro del return de `AdminModelFormBody`)

#### 3. Modificado (opcional, solo si es trivial): tests existentes de AdminPage

- La sección `describe('gallery delete')` en `AdminPage.test.tsx` puede necesitar ajustes si el refactor cambia la estructura del state
- Si el refactor es transparente (mismo estado, mismo flujo), los tests no necesitan cambios

### Archivos que NO cambian en este slice

- `GalleryConfirmDeleteModal.tsx` — ya existe y no cambia
- `adminMotorcycleGalleryService.ts` — sin cambios
- `adminMotorcycleImageUploadService.ts` — sin cambios
- `adminGalleryImageUtils.ts` — sin cambios
- `useAdminImageManager.ts` — hook separado, sin cambios
- `AdminEditMotorcyclePage.tsx` — sigue pasando `onDeleteGalleryImage` como prop, sin cambios
- `AdminNewModelPage.tsx` — sin cambios (no tiene galería en create mode)
- `AdminPage.scss` — sin cambios
- Schema, RLS, Supabase — sin cambios

### Estrategia de confirmación de eliminación (ya implementada, sin cambios)

1. Click delete → `setConfirmDeleteImage(targetImage)` → modal abierto
2. Escape si modal abierto → `setConfirmDeleteImage(null)` → solo se cierra el modal
3. Cancelar → `handleCancelDelete` → `setConfirmDeleteImage(null)`
4. Confirmar → `handleConfirmDelete(targetImage)`:
   - `setIsDeletingGalleryImage(true)`
   - `await onDeleteGalleryImage(targetImage)` (llamada al handler del padre en AdminEditMotorcyclePage)
   - Si cover actual → `onDraftFieldChange('imageUrl', adminModelTechnicalPlaceholderImage)` + `onDraftCheckboxChange('imageLocked', false)`
   - `setGalleryImages(current => current.filter(...))`
   - `setConfirmDeleteImage(null)`
   - `setGalleryError(null)` (en finally)
   - `setIsDeletingGalleryImage(false)`

### Estrategia de cover fallback (ya implementada, sin cambios)

- `isGalleryImageCurrentCover(galleryImage, currentImageUrl, currentImageObjectPath)` determina si la imagen a eliminar es la portada actual
- Si lo es: se aplica `adminModelTechnicalPlaceholderImage` como nuevo `imageUrl` y `imageLocked = false`
- El fallback es atómico dentro de `handleConfirmDelete`

### Estrategia de tests

1. **Tests existentes de AdminPage gallery delete** — verificar que siguen pasando sin cambios. Estos tests cubren el comportamiento de la UI desde la perspectiva del componente; son complementarios, no duplicados del test del hook.
2. **`useAdminGalleryDelete.test.tsx`** — unit tests del hook con RTL. El hook centraliza lógica de confirm/cancel/delete/fallback/error que no está cubierta por los tests existentes de AdminPage (que prueban a nivel componente). Casos cubiertos:
   - Cancelar limpia `confirmDeleteImage` y `isDeletingGalleryImage`
   - Confirmar llama a `onDeleteGalleryImage` con la imagen correcta
   - Confirmar elimina la imagen de `galleryImages`
   - Confirmar aplica cover fallback cuando la imagen eliminada es la portada actual
   - Fallo de `onDeleteGalleryImage` mantiene la UI en estado consistente
   - `isDeletingGalleryImage` alterna a true durante el delete y vuelve a false tras completarse o fallar
3. **No es necesario** modificar `adminGalleryImageUtils.test.ts` ni `adminMotorcycleGalleryService.test.ts` — no cambian en este slice.

### Orden de implementación

1. Crear `useAdminGalleryDelete.ts` con la interfaz propuesta
2. Integrar el hook en `AdminModelFormBody.tsx`:
   - Importar el hook
   - Reemplazar estado inline por llamada al hook
   - Ajustar las props que se pasan al hook
3. Verificar que el render del `GalleryConfirmDeleteModal` sigue funcionando igual
4. Ejecutar `npm run typecheck` + `npm run test`
5. Verificar tests focalizados de AdminPage gallery delete
6. Si todo pasa → Quality Gate

### Qué debe validar Quality Gate

1. `npm run typecheck` limpio
2. `npm run test` suite completa pasa (esperado: baseline ~1602 tests + tests del hook, 84 files + 1)
3. `git diff --check` limpio
4. Tests focalizados AdminPage gallery delete siguen pasando
5. `useAdminGalleryDelete.test.tsx` pasa todos los casos documentados
6. Comportamiento visible de delete en image manager no ha cambiado
7. No se han introducido cambios en schema, RLS, servicios ni UI visual
