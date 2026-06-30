# 002 · Admin Gallery Autonomous Actions — Spec

## Feature purpose

Este slice consolida el baseline ya implementado de eliminación autónoma de galería extrayendo la lógica de eliminación a `useAdminGalleryDelete`. El comportamiento visible no cambia: confirmed immediate delete con `GalleryConfirmDeleteModal`, cover fallback y storage cleanup best-effort ya están implementados y funcionan correctamente.

La feature extrae el estado (`galleryImages`, `confirmDeleteImage`, `isDeletingGalleryImage`) y los handlers (`handleConfirmDelete`, `handleCancelDelete`) del componente `AdminModelFormBody` (1462 líneas) a un hook reutilizable, de forma que la lógica de eliminación quede encapsulada y sea testeable de forma independiente.

## User/admin behaviour

1. Admin abre `#/admin/modelos/{motorcycleId}/editar`
2. Click en "Gestionar imágenes" → se abre `AdminModelImageManagerModal` (o sección de imagen)
3. Admin clickea `delete_forever` en una tarjeta de galería → se abre `GalleryConfirmDeleteModal`
4. Admin confirma o cancela la eliminación
5. Si confirma y la imagen era la portada → `draft.imageUrl` se resetea a placeholder y `imageLocked` a false
6. Si confirma → gallery record se elimina inmediatamente, storage cleanup best-effort
7. Si falla → error visible en el modal, UI se mantiene

Este comportamiento está **ya implementado**. Esta spec no lo cambia.

## In-scope behaviour para el primer slice de implementación

### Objetivo del slice

Extraer `useAdminGalleryDelete` hook que:
- Gestione el estado: `galleryImages`, `setGalleryImages`, `confirmDeleteImage`, `isDeletingGalleryImage`
- Encapsule los handlers: `handleConfirmDelete`, `handleCancelDelete`
- Reciba como parámetros: `onDeleteGalleryImage` (del padre), `currentImageUrl`, `currentImageObjectPath`, `onDraftFieldChange`, `onDraftCheckboxChange`
- Exponga: `{ galleryImages, confirmDeleteImage, isDeletingGalleryImage, handleConfirmDelete, handleCancelDelete, setGalleryImages }`
- Se importe y use en `AdminModelFormBody` sin cambios en el comportamiento visible

### Responsabilidades del hook extraído

- Mantener `galleryImages` como estado local del hook
- `handleConfirmDelete` coordina: llamada a `onDeleteGalleryImage` del padre → cover fallback si aplica → update de `galleryImages` → cleanup del modal
- `handleCancelDelete` limpia `confirmDeleteImage`
- No realiza llamadas directas a Supabase (delega en `onDeleteGalleryImage`)
- El `accessToken` se pasa desde el padre via `onDeleteGalleryImage` closure

### Comportamiento preservado (no cambia)

- Galería conectada: `getAdminMotorcycleGalleryImages` se sigue llamando desde `AdminModelFormBody` (effect de fetch)
- Upload: `uploadMotorcycleImage` no cambia
- Storage delete: `deleteMotorcycleImage` no cambia
- Modal de confirmación: `GalleryConfirmDeleteModal` no cambia
- Cover fallback: `adminModelTechnicalPlaceholderImage` como fallback sigue igual
- Guard de path compartido: `isGalleryImageCurrentCover` y `getMotorcycleImageObjectPath` se siguen usando en `AdminEditMotorcyclePage`
- Navegación: ninguna

## Out-of-scope behaviour

- **Decomposición JSX de `AdminModelImageManagerModal`** — es deuda técnica diferida post-merge. Esta spec no extrae componentes presentacionales.
- **Drag-and-drop reorder** — diferido post-merge, no se mezcla.
- **Multi-delete batch** — diferido, no se mezcla.
- **Cambios en schema Supabase** — no necesarios.
- **Cambios en RLS/policies** — no necesarios.
- **Cambios en servicios** — `adminMotorcycleGalleryService` y `adminMotorcycleImageUploadService` no se modifican.
- **Cambios en `GalleryConfirmDeleteModal`** — el modal ya existe y funciona.
- **Cambios en `useAdminImageManager`** — hook separado que gestiona apertura/cierre del modal y modo de upload/URL, no relacionado con delete.

## Acceptance criteria

1. `useAdminGalleryDelete` hook existe en `src/components/pages/AdminPage/`
2. El hook recibe los parámetros documentados y expone la interfaz documentada
3. `AdminModelFormBody` importa y usa `useAdminGalleryDelete` en lugar del estado inline relacionado con delete de galería
4. `AdminEditMotorcyclePage` sigue pasando `onDeleteGalleryImage` como prop (contrato existente)
5. `AdminNewModelPage` no cambia (no tiene galería en create mode)
6. Comportamiento visible: confirmed immediate delete con modal + cover fallback + storage cleanup best-effort se preserva exactamente
7. `npm run typecheck` limpio
8. `npm run test` — suite completa pasa (esperado: ~1602 tests, 84 files baseline; el test del hook añadetests adicionales)
9. Tests focalizados de AdminPage gallery delete: siguen pasando sin modificaciones
10. `useAdminGalleryDelete.test.tsx` existe y cubre los casos críticos del hook:
    - Cancelar limpia `confirmDeleteImage`
    - Confirmar llama a `onDeleteGalleryImage`
    - Confirmar elimina la imagen de `galleryImages`
    - Confirmar aplica cover fallback cuando la imagen eliminada es la portada actual
    - Fallo mantiene la UI en estado consistente
    - `isDeletingGalleryImage` alterna correctamente durante el delete asíncrono

## Non-goals

- No cambiar la UX de eliminación de galería
- No cambiar cómo se selecciona la imagen portada
- No cambiar el flujo de upload de imágenes
- No cambiar el contrato de servicios con Supabase
- No extraer componentes presentacionales de la UI de galería

## Safety/accessibility expectations

- El modal de confirmación sigue siendo accesible: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- El `aria-label` del botón de eliminar en cada tarjeta sigue siendo `Eliminar imagen de la galería: {altText}`
- El estado `isProcessing` deshabilita los botones durante la eliminación
- Escape sigue cerrando el modal de confirmación primero (no el image manager)
- El hook no introduce estado nuevo que afecte a la accesibilidad

## API del hook (propuesta)

```typescript
// useAdminGalleryDelete.ts

type UseAdminGalleryDeleteProps = {
  onDeleteGalleryImage: (galleryImage: AdminMotorcycleGalleryImage) => Promise<void>;
  currentImageUrl: string;
  currentImageObjectPath: string | null;
  onDraftFieldChange: (field: 'imageUrl', value: string) => void;
  onDraftCheckboxChange: (field: 'imageLocked', value: boolean) => void;
};

type UseAdminGalleryDeleteReturn = {
  galleryImages: readonly AdminMotorcycleGalleryImage[];
  setGalleryImages: React.Dispatch<React.SetStateAction<readonly AdminMotorcycleGalleryImage[]>>;
  confirmDeleteImage: AdminMotorcycleGalleryImage | null;
  isDeletingGalleryImage: boolean;
  handleConfirmDelete: (targetImage: AdminMotorcycleGalleryImage) => Promise<void>;
  handleCancelDelete: () => void;
};
```
