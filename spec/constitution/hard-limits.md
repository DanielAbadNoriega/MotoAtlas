# MotoAtlas — SDD Hard Limits

## Propósito

Este archivo define los límites no negociables para toda tarea SDD, prompt de OpenCode y flujo de agente. Si una tarea necesita cruzar un límite aquí listado, debe detenerse, reportar y esperar aprobación explícita antes de modificar archivos.

## Regla principal

Si tu tarea necesita tocar una zona etiquetada como límite duro, **detente antes de modificar cualquier archivo**. Reporta qué archivo, por qué zona, qué cambio se necesita y propón una tarea/rama/agente dedicado. No actúes sin aprobación.

## Límites no negociables

### 1. Supabase schema / RLS / auth / roles

- `supabase/schema.sql`
- schemas, RLS policies, grants, auth rules, roles y permisos admin
- Helper SQL `public.is_admin()` y protecciones asociadas
- **No tocar sin flujo MotoAtlas-Supabase-Guard explícito.**

### 2. Secrets y claves privilegiadas

- `service_role_key`, admin endpoints, credenciales de servidor con privilegios
- Nunca commitear, exponer ni loguear credenciales sensibles
- `.env.import` y `.env.local` están en gitignore por diseño

### 3. AuthProvider y comportamiento de auth

- `src/features/auth/AuthProvider.tsx`
- Comportamiento de sesión, resolución de roles, checks de admin
- **No cambiar sin aprobación explícita y flujo de guard dedicado.**

### 4. Baseline de descomposición AdminPage

- `src/components/pages/AdminPage/AdminPage.tsx` es un archivo de compatibilidad (~13 líneas).
- 9 page components extraídos a archivos individuales
- `index.ts` barrel aplanado, zero circular imports
- **Esta descomposición es baseline completado. No revertir, no fusionar, no reorganizar salvo solicitud explícita.**

### 5. Admin shared UI e imports

- `src/components/pages/AdminPage/adminSharedUi.tsx`
- No reintroducir cadenas de barrel/import antiguas
- No fusionar UI compartida extraída de vuelta a la estructura AdminPage original

### 6. Seguridad del schema/servicio de galería admin

- `public.motorcycle_images`
- Servicios de galería `adminMotorcycleGalleryService`, `adminMotorcycleImageUploadService`
- Contratos de schema/RLS/servicio de galería son sensibles
- **No cambiar RLS/policies ni contratos de servicio de forma oportunista.**

### 7. App.tsx eager imports de admin

- Tema de arquitectura conocido post-galería
- `App.tsx` importa eager todas las páginas admin en cada visita
- **No "arreglar" los eager imports de admin de App.tsx dentro de trabajo no relacionado. Esto requiere spec de arquitectura/lazy-loading dedicada.**

### 8. AdminMotorcycleReviewsPage / AdminSidebar import concerns

- Tema de arquitectura conocido post-galería
- Las dependencias entre páginas de cuenta/admin y `AdminSidebar` deben mantenerse explícitas y no reintroducir cadenas de barrel/import antiguas.
- **No arreglar de forma oportunista salvo que esté explícitamente en alcance.**

### 9. Refactors grandes y cambios de arquitectura

- Renombrados masivos, adiciones de dependencias, cambios de packages, reescrituras de arquitectura, reorganizaciones de archivos/carpetas
- **Requieren aprobación explícita del usuario antes de tocar código.**

### 10. Mezcla de workstreams

- Workstream C (galería admin + descomposición AdminPage) y Workstream E (Landings / MotoIcon) tocan zonas distintas
- **No mezclar ambos en la misma rama de implementación salvo solicitud explícita.**

### 11. Mezcla de fases

- Implementación, calidad/validación y documentación son fases separadas
- **No combinarlas salvo solicitud explícita.** Secuencia por defecto: Auditor → Safe Builder → Quality Gate → Docs Sync

### 12. Sensibilidad de search/filter/AdminPage

- Consumidores de `search` (SearchControl, AccountReviewsPage, CommunityRankingsPage, CommunityReviewsPage) y filtros son trabajo pendiente de Workstream E
- El uso de search en AdminPage es sensible y debe tener alcance separado
- **No migrar search de AdminPage como parte de trabajo genérico de search/filtros salvo solicitud explícita.**

### 13. Separación de optimización de imágenes

- Optimización de imágenes (WebP, thumbnails, pipeline de rendimiento) es un bloque futuro separado
- **No mezclar trabajo de WebP/thumbnails/performance con migración SVG/MotoIcon.**

### 14. Seguridad de packages y dependencias

- No modificar archivos de package ni agregar dependencias sin aprobación explícita

### 15. Separación producción / demo data

- Producción no debe exponer ni depender de mock/seed/demo data
- El comportamiento de demo data debe permanecer environment-aware (`runtimeEnvironment`)

## Qué hacer si un límite se cruza

1. **Detente** antes de modificar cualquier archivo
2. **Reporta** el archivo o zona exacta que necesita cambio
3. **Explica** por qué el cambio es necesario
4. **Propón** una tarea/rama/agente dedicado para abordarlo
5. **Espera** aprobación explícita antes de continuar

## Relación con otros documentos

- `docs/current-workstreams.md` — fuente de verdad operativa live. Alcances, riesgos y resultados de workstreams activos viven ahí.
- `spec/constitution/hard-limits.md` — contrato de seguridad SDD estable. Todo feature `context.md` futuro debe referenciarlo cuando se aproxime a una zona sensible.
- `AGENTS.md` — adaptador de ejecución actual. Permanece sin cambios hasta migración posterior.
- `spec/constitution/mission.md`, `tech-stack.md`, `roadmap.md` — constitución SDD fundacional.

---

*Este archivo es inmutable salvo decisión explícita. Para ampliar límites, abrir RFC antes de tocar código.*
