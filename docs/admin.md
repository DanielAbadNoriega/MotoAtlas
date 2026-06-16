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

El formulario tiene una sección `Imagen` con modo de selección:

- **URL manual**: input `type="url"` + checkbox `Imagen bloqueada / curada`. Válido para enlazar imágenes ya publicadas.
- **Subir archivo**: file input con accept `image/jpeg,image/png,image/webp`. Validación local de tipo y tamaño (5 MB max). Preview local con `URL.createObjectURL`. Object URL cleanup en unmount/replacement.

**Acción `Subir imagen`:**
- Aparece solo cuando hay un archivo válido seleccionado.
- Sube a Supabase Storage `motorcycle-images` via `uploadMotorcycleImage`.
- Requiere `session.access_token`. Missing token lanza error controlado.
- En create mode usa `draft.modelId.trim()` o fallback `suggestedModelId` como ID de ruta.
- En edit mode usa el `motorcycleId` de la ruta.
- Éxito: `draft.imageUrl = publicUrl`, `draft.imageLocked = true`.
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

**Sin:**
- navegación automática post-publicación
- refactor App-level de catálogo tras create/edit
- A2 fields en draft
- delete/replace cleanup en UI
- WebP conversion opcional

**Futuro:** delete/replace cleanup, navegación automática, refactor App-level, WebP conversion. El set de filtros de `#/admin/modelos/editar` puede refinarse tras uso real; `Calidad de datos` es candidato a eliminación.

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
