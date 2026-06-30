# 002 · Admin Gallery Autonomous Actions — Tasks

## Fase 1 — SDD / Spec y plan

- [x] Crear carpeta `spec/features/002-admin-gallery-autonomous-actions/`
- [x] Poblar `context.md`
- [x] Poblar `spec.md`
- [x] Poblar `plan.md`
- [x] Poblar `tasks.md`

## Fase 2 — Implementación

- [ ] Crear `src/components/pages/AdminPage/useAdminGalleryDelete.ts` con el hook que encapsula estado y handlers de eliminación de galería
- [ ] Crear `src/components/pages/AdminPage/useAdminGalleryDelete.test.tsx` con unit tests del hook: cancel, confirm, cover fallback, error handling, isDeletingGalleryImage toggle
- [ ] Integrar `useAdminGalleryDelete` en `AdminModelFormBody.tsx` reemplazando el estado inline (`galleryImages`, `confirmDeleteImage`, `isDeletingGalleryImage`) y handlers relacionados (`handleConfirmDelete`, `handleCancelDelete`)
- [ ] Verificar que `AdminEditMotorcyclePage` sigue pasando `onDeleteGalleryImage` como prop sin cambios
- [ ] Verificar que `AdminNewModelPage` no requiere cambios (create mode sin galería)
- [ ] Verificar que el render del `GalleryConfirmDeleteModal` sigue funcionando igual
- [ ] Ejecutar `npm run typecheck` — limpio
- [ ] Ejecutar `npm run test` — suite completa pasa
- [ ] Verificar tests focalizados de AdminPage gallery delete

## Fase 3 — Quality Gate

- [ ] `npm run typecheck` — limpio
- [ ] `npm run test` — suite completa pasa (baseline ~1602 tests + tests del hook)
- [ ] tests focalizados: `AdminPage.test.tsx` gallery delete section correctos
- [ ] tests de `useAdminGalleryDelete.test.tsx` — correctos
- [ ] `git diff --check` — limpio
- [ ] Verificar que no hay cambios en servicios, schema, RLS ni UI visual
- [ ] Verificar que el comportamiento visible de delete en image manager no ha cambiado

## Fase 4 — Docs Sync

- [ ] Actualizar `spec/constitution/roadmap.md` — marcar 002 como completado/baseline histórico
- [ ] Sincronizar `docs/current-workstreams.md` solo si esta feature está explícitamente listada y necesita sync de estado
- [ ] Actualizar `docs/admin.md` si hay deuda técnica que haya cambiado de estado tras la extracción del hook
