# MotoAtlas — documentación técnica

Este documento explica la aplicación para que una persona —o una IA— pueda tocar MotoAtlas sin romper el flujo principal.

## 1. Stack

- React
- TypeScript
- Vite
- SCSS modular por componente/página
- Supabase como fuente principal de datos
- `src/data/bikes.ts` como fallback temporal
- Vitest + React Testing Library para tests

## 2. Principios obligatorios

### Quality gate

Una tarea no se considera terminada si no pasan:

```bash
npm run test
npm run typecheck
```

No se ejecuta build salvo que se pida explícitamente.

### Tests obligatorios para nueva funcionalidad

Toda nueva funcionalidad debe traer tests en la misma entrega:

- Botón con acción → test de la acción.
- Navegación nueva → test del destino o `href` esperado.
- Lógica de filtrado, selección, ordenación o comparación → unit test de la lógica.
- Página nueva → al menos:
  - test de render principal
  - test de interacción principal
- Integración con Supabase → mock de red o del servicio; nunca depender de Supabase real en tests.

### SCSS y sistema visual

Tokens y patrones reutilizables viven en:

```txt
src/styles/_variables.scss
src/styles/_mixins.scss
src/styles/_placeholders.scss
src/styles/_typography.scss
src/styles/_components.scss
src/styles/globals.scss
```

Patrones disponibles:

- `technical-card`
- `glass-panel`
- `technical-badge`
- `red-accent-border`
- `image-overlay`
- `mono-label`
- `section-title`
- `primary-button`
- `secondary-button`

Regla: antes de crear otra variante BEM específica, comprobar si el patrón encaja como mixin/placeholder. El objetivo no es “hacer CSS genérico por hacerlo”, sino evitar repetir tarjetas, badges, glass panels y overlays por cada página.

### Estilo de tests

- Preferir queries accesibles:
  - `getByRole`
  - `getByLabelText`
  - `getByText`
- Evitar tests frágiles basados en clases CSS.
- Usar fixtures locales en `src/test/fixtures/bikes.ts`.
- Para lógica pura, extraer a `src/utils/*` y testear sin React.
- Para UI, renderizar con React Testing Library y simular usuario con `@testing-library/user-event`.

## 3. Estructura relevante

```txt
src/
  App.tsx
  components/
    layout/
    pages/
      SearchPage/
      BikeDetailPage/
      ComparatorPage/
      ComparisonDetailPage/
    sections/
    ui/
  data/
    bikes.ts
    comparisons.ts
    home.ts
    site.ts
  services/
    motorcycleService.ts
    motorcycleReviewService.ts
  shared/
    images/
      getMotorcycleImage.ts
    reviews/
      reviewCommunityActions.ts
      useReviewReports.ts
      useReviewReactions.ts
      reviewSourcePolicy.ts
      reviewUtils.ts
      topRatedMotorcycles.ts
      communityRankings.ts
      communityUtils.ts
    routing/
      routeUtils.ts
    seo/
      seoUtils.ts
  styles/
  test/
    fixtures/bikes.ts
    setupTests.ts
  types/
    bike.ts
    comparison.ts
  utils/
    compareQueue.ts
    motorcycleSearch.ts
supabase/
  schema.sql
scripts/
  fetchMotorcyclesFromApi.ts
  importMotorcycles.ts
  repairMotorcycleData.ts
  syncMotorcycleImages.ts
  generateSeoFiles.ts
```

## 4. Modelo de datos

El dominio principal es `Bike`, definido en `src/types/bike.ts`.

Inventario vivo de campos, procedencia, obligatoriedad y usos:

```txt
docs/motorcycle-data-inventory.md
```

Campos importantes:

- identidad: `id`, `brand`, `model`, `year`
- clasificación: `segment`, `license`, `engineType`
- specs: `displacementCc`, `powerHp`, `torqueNm`, `wetWeightKg`, `seatHeightMm`, `fuelTankLiters`, `priceEur`
- contenido: `imageUrl`, `description`, `pros`, `cons`
- scoring: `useScores`
- equipamiento: `features`
- comunidad/fiabilidad: `reliabilityReports`

## 5. Fuente de datos

### Servicio

`src/services/motorcycleService.ts` expone:

```ts
getMotorcycles(): Promise<MotorcycleServiceResult>
```

Flujo:

1. Lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Si faltan variables, devuelve fallback local (`bikeCatalog`).
3. Si existen, consulta Supabase REST:
   - `GET /rest/v1/motorcycles?select=*&order=brand.asc,model.asc`
4. Mapea filas snake_case de Supabase al modelo `Bike` camelCase.
5. Si Supabase falla, devuelve fallback local.

### Fallback

`src/data/bikes.ts` sigue existiendo como fuente temporal offline. No debe borrarse hasta que Supabase tenga seed, tests y entorno estable.

### Imágenes de motos

La resolución de imágenes está centralizada en:

```txt
src/shared/images/getMotorcycleImage.ts
```

Reglas:

- Si `imageUrl` / `image_url` es válida, se usa esa imagen.
- Si está vacía, es `null`/`undefined`, tiene una URL inválida o apunta a un placeholder conocido, se usa:

```txt
public/images/placeholders/motorcycle-technical-pending.jpg
```

- El componente visual `MotorcycleImage` añade el overlay `TECHNICAL IMAGE PENDING`.
- El `alt` de fallback debe indicar el modelo: `Imagen técnica pendiente de [marca modelo]`.
- No duplicar esta lógica en páginas o cards: reutilizar el helper/componente.

### Supabase

El schema vive en `supabase/schema.sql`.

La tabla principal es `public.motorcycles`.

Segmentos soportados: `trail`, `adventure`, `touring`, `sport-touring`, `naked`, `sport`, `supersport`, `hypernaked`, `enduro`, `dual-sport`, `scrambler`, `custom`, `cruiser`, `retro`, `neo-retro`, `scooter`.

### Taxonomía de segmentos (estado de cierre)

Estado actual: en desarrollo / pendiente de auditoría y cierre final.

Fuente de verdad funcional (debe permanecer sincronizada):
- `supabase/schema.sql` (enum `motorcycle_segment`)
- `src/types/bike.ts` (`BikeSegment`)
- `src/shared/motorcycles/motorcycleTaxonomy.ts` (`BIKE_SEGMENTS`, labels)
- `src/features/import/*` y `scripts/importMotorcycles.ts` (normalización/validación/import)
- `src/utils/motorcycleSearch.ts` + filtros UI (buscador/rankings/admin/comparador/ficha)

Regla de arquitectura:
- No crecer catálogo ni abrir landings SEO por categoría sin cerrar primero la taxonomía y su sincronización end-to-end (schema, tipos, importador y UI).

Campos añadidos al núcleo:

- A2: `is_a2_compatible`, `is_a2_limited_version`, `limited_power_hp`, `original_power_hp`.
- Protección editorial: `image_locked`, `description_locked`.
- Procedencia/calidad: `specs_source`, `price_source`, `image_source`, `scores_source`, `pros_cons_source`, `reliability_source`.

La tabla secundaria `public.motorcycle_reviews` permite reviews sin login todavía. Las nuevas reviews entran como `pending`; solo `approved` es legible por `anon`. `rejected` queda reservado para moderación futura y no se muestra públicamente. El campo `verified` existe con `false` por defecto y la inserción pública anónima no puede marcarlo como `true`.

RLS está activo:

- `motorcycles`: lectura pública para `anon`.
- `motorcycle_reviews`: lectura pública solo de aprobadas e inserción pública solo con `status = 'pending'`.

Variables necesarias en `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```


### Importación inicial de motos

Archivos:

- `data/import/motorcycles.json` — seed JSON inicial en formato dominio `Bike` camelCase.
- `data/import/motorcycleSeedList.json` — lista editable de modelos para enriquecer desde API.
- `scripts/importMotorcycles.ts` — importador Node/tsx.
- `scripts/fetchMotorcyclesFromApi.ts` — genera `motorcycles.generated.json` desde API Ninjas si hay clave.
- `scripts/repairMotorcycleData.ts` — intenta reparar specs técnicas inválidas sin sobrescribir el seed.
- `.env.import.example` — plantilla segura para variables admin.

Comando:

```bash
npm run import:motos
```

Validación sin conectar con Supabase:

```bash
npm run import:motos:check
```

Importación parcial explícita:

```bash
npm run import:motos -- --allow-partial
```

Variables del importador:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
API_NINJAS_KEY=opcional-para-fetch-y-repair
```

Reglas:

- El importador usa `SUPABASE_SERVICE_ROLE_KEY`, nunca `VITE_SUPABASE_ANON_KEY`.
- `.env.import` y `.env.local` deben permanecer fuera de Git.
- El JSON se valida antes de insertar: campos top-level, `useScores`, `features`, `pros`, `cons` y `reliabilityReports`.
- Los campos técnicos críticos (`displacementCc`, `powerHp`, `torqueNm`, `wetWeightKg`, `seatHeightMm`, `fuelTankLiters`) deben ser números mayores que 0.
- `priceEur` puede ser `0` solo como placeholder explícito y se reporta como aviso.
- Si `priceEur = 0`, `price_source` se fuerza a `placeholder`.
- Si la imagen cae al helper de fallback, `image_source` se fuerza a `placeholder`.
- Si una moto existente en Supabase tiene `image_locked = true`, el importador conserva `image_url`.
- Si tiene `description_locked = true`, conserva `description`.
- El payload se transforma a snake_case para `public.motorcycles`.
- El `upsert` usa `id` como `onConflict` para evitar duplicados.
- Los tests del importador mockean Supabase; no conectan a la base real.

#### Reparación de JSON

Cuando `npm run import:motos:check` detecte motos inválidas:

```bash
npm run repair:motos
```

El script:

1. Lee `data/import/motorcycles.json`.
2. Detecta campos técnicos a `0`, `null`, `undefined`, `N/A` o sin número útil.
3. Busca en API Ninjas con variantes:
   - marca + modelo + año
   - marca + modelo sin año
   - marca + primera parte del modelo
   - marca + cilindrada detectada
   - variantes sin acentos, sin guiones y sin sufijos
4. Reemplaza solo campos inválidos.
5. Mantiene los datos válidos aunque la API devuelva otro valor.
6. Genera:

```txt
data/import/motorcycles.repaired.json
data/import/motorcycles.repair-report.json
```

No sobrescribe `motorcycles.json`. Hay que revisar el reporte y copiar manualmente los cambios fiables.

#### Catálogo ampliado

`data/import/motorcycleSeedList.json` es la lista editorial de modelos que puede alimentar `fetch:motos`. Actualmente contiene 80 motos reales recientes de los segmentos prioritarios:

- trail / adventure
- naked / sport / sport-touring / touring
- enduro / dual-sport
- cruiser / scrambler / neo-retro

El script `fetch:motos` deduplica seeds por marca, modelo y año antes de consultar la API externa. Nunca sobrescribe `motorcycles.json`; escribe un generado revisable.

#### Imágenes locales

El pipeline estable de imágenes usa:

```txt
public/images/motorcycles/{motorcycle.id}.webp
```

Ejemplo:

```txt
public/images/motorcycles/bmw-f-900-gs-2024.webp
```

Comandos:

```bash
npm run normalize:images:check
npm run normalize:images
npm run sync:images:check
npm run sync:images
```

`normalizeMotorcycleImages.ts`:

1. Lee imágenes raw desde `data/import/raw-images/`.
2. El nombre del raw debe coincidir con `motorcycle.id` (`bmw-f-900-gs-2024.jpg`).
3. Ignora archivos que no sean imagen.
4. Avisa si el id no existe en `motorcycles.json`.
5. Genera WebP 1600x900, `fit: cover`, calidad 82 y sin metadata.
6. No sobrescribe si ya existe salvo `--overwrite`.
7. `--dry-run` muestra input, validez y output esperado sin escribir.

`syncMotorcycleImages.ts`:

1. Lee las motos del JSON de importación.
2. Busca el `.webp` local esperado por `motorcycle.id`.
3. Si existe, prepara `image_url = /images/motorcycles/...` e `image_source = manual`.
4. Si no existe, prepara el fallback técnico e `image_source = placeholder`.
5. Si Supabase tiene `image_locked = true`, no sobrescribe `image_url`.
6. En tests se mockea Supabase; nunca se conecta a la base real.

### Upload de imágenes desde Admin Models Studio

El admin puede subir imágenes para modelos del catálogo via Supabase Storage.

**Bucket:**
- `motorcycle-images` — bucket público para imágenes del catálogo.
- Public read: cualquiera puede leer objetos.
- Admin-only insert/update/delete: verificado via RLS policies con `public.is_admin()`.
- Límite: 5 MB por archivo.
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`.

**Servicio:**
```txt
src/services/adminMotorcycleImageUploadService.ts
```

Funciones:
- `uploadMotorcycleImage(file, motorcycleId, accessToken)`: sube un archivo a `{motorcycleId}/{uuid}.{extension}`, retorna URL pública.
- `deleteMotorcycleImage(objectPath, accessToken)`: elimina un objeto del bucket cuando el object path ya fue validado como seguro.

**Arquitectura:**
- No usa `supabase-js` ni `service_role_key`. Usa fetch directo a Supabase Storage REST.
- Autenticación: `apikey` (anon key) + `Authorization: Bearer {accessToken}` (sesión del admin).
- MIME to extension mapping: `image/jpeg → .jpg`, `image/png → .png`, `image/webp → .webp`.
- UUIDs generados con `globalThis.crypto?.randomUUID?.()`. Fallback local UUID v4 con `Math.random`.
- Object path: `{motorcycleId}/{uuid}.{extension}`.
- Public URL: `{supabaseUrl}/storage/v1/object/public/motorcycle-images/{objectPath}`.
- No hay conversión/compresión de imagen. El archivo se sube tal cual.

**Flujo en UI:**
- Modo `URL manual`: input `type="url"`, checkbox `imageLocked`.
- Modo `Subir archivo`: file input custom MotoAtlas-styled (label estilizado + filename visible) + preview + botón `Subir imagen`.
- `Subir imagen` → `uploadMotorcycleImage` → `draft.imageUrl = publicUrl` + `draft.imageLocked = true`.
- `Publicar modelo` con archivo pendiente → auto-upload → publish con URL retornada.
- Si existe `draft.imageUrl`, create/edit muestran preview actual de imagen.
- Una imagen persistida de Storage en edit mode puede quitarse del formulario sin borrado físico inmediato.
- Una imagen subida en la sesión actual puede eliminarse inmediatamente antes del publish.
- Si edit reemplaza una imagen persistida del bucket, el cleanup del objeto viejo se ejecuta **solo después** de un publish/update exitoso y nunca bloquea/revierte ese publish si falla el cleanup.
- URLs manuales, assets locales `/images/...` y `motorcycle-technical-pending.jpg` nunca llaman a `deleteMotorcycleImage`.
- La detección destructiva acepta únicamente URLs del proyecto Supabase configurado y object paths válidos/seguros; URLs de otro proyecto/dominio quedan fuera del cleanup.
- `imageLocked` protege la imagen curada contra sobrescritura en futuras sincronizaciones.
- Tras publish exitoso, create navega a `#/motos/{createdBike.id}` y edit navega a `#/motos/{motorcycleId}`.
- `App.tsx` mantiene el catálogo resuelto en estado local y expone `handleMotorcyclesChange`: si el servicio devuelve una moto existente, la reemplaza inmutablemente por `id`; si devuelve una nueva, la agrega con append inmutable.
- No se introdujo store global nuevo: el sync post-publish vive en estado local de `App.tsx` y evita refresh completo del navegador.
- No se introdujeron cambios de schema/RLS/Supabase SQL para este hardening; toda la lógica vive en la UI admin y en el servicio Storage existente.

**Image manager modal refactor (implementado):**
- La preview a nivel formulario y el botón "Gestionar imágenes" permanecen **fuera del modal**.
- El modal contiene los controles single-image existentes: modo URL manual, modo upload archivo, input image URL, checkbox `imageLocked`, file input / trigger visual, preview archivo seleccionado, botón upload, alertas de validación/error.
- El modal usa **dark premium admin layout** inspirado en referencia Stitch gallery: tonal surfaces, thin borders, SCSS scoped `admin-model__...`, sin Tailwind copiado, sin leakage global.
- "Guardar cambios" **solo cierra el modal y mantiene cambios en draft**; no publica.
- **Galería conectada con creación de records**: el modal carga imágenes desde `getAdminMotorcycleGalleryImages` en edit mode. Edit mode explicit upload sube a Storage y crea un `motorcycle_images` record. Create mode crea el record tras publish exitoso. URLs manuales y locales no crean records. Un guard evita Storage delete de imágenes respaldadas por gallery records.
- **Gallery card visual polish + stable ordering**: las cards usan flip `rotateY`, info por botón no hover, multi-info simultáneo, header compacto. El orden de librería es estable vía keys URL-based con `useRef<Map<string, string>>` — seleccionar portada no reordena las cards. Cover fallback seguro a `motorcycle-technical-pending.jpg`.
- El **contrato backend single-image** (`motorcycles.image_url`, `image_locked`, `image_source`) sigue siendo el dueño de la imagen primaria que usan cards, buscador, ficha y fallbacks. `motorcycle_images` es una capa paralela de galería adicional.

**Galería — flujo de eliminación (pending-delete):**
- Estado local `pendingDeleteImageIds: ReadonlySet<string>` en `AdminEditMotorcycleSection`.
- Reflejado a `pendingDeleteImageIdsRef` para consumo desde `handlePublish`.
- `handlePendingDeleteGalleryImage`: agrega ID al Set. Si coincide con portada actual (por URL exacta, storagePath o path derivado), resetea `draft.imageUrl` al placeholder y desbloquea la imagen.
- `handleUndoPendingDelete`: quita ID del Set. No restaura cover automáticamente.
- UI: card con clase `--pending-delete`, badge `delete_outline`, botón undo reemplaza al botón "Usar como portada".
- Publish: (1) sincroniza `isPrimary` (currentPrimary desde lista completa, matchingRecord desde activas, orden: unset → set), (2) itera pending-images: `deleteAdminMotorcycleGalleryImageRecord` + `deleteMotorcycleImage` con de-duplicación de paths.
- **Decisión de producto:** reemplazar pending-delete por eliminación inmediata con modal de confirmación, independiente del formulario del modelo. La galería debe ser un subsistema autónomo.
- **Riesgo técnico:** `updateAdminMotorcycle` puede no ser ideal para actualizaciones aisladas de cover. Evaluar helper `updateAdminMotorcycleCover(motorcycleId, { imageUrl, imageLocked }, token)` antes de implementar eliminación inmediata.
- **Refactor de AdminPage:** el archivo ha crecido demasiado. Se recomienda extraer hooks y componentes (ver `docs/admin.md` para descomposición propuesta).

**Section Radar en UI:**
- Barra de navegación sticky entre hero y formulario con marcadores numerados y tracks de progreso por sección.
- Navegación con `scrollIntoView` (sin hash anchors ni IntersectionObserver).
- Scroll horizontal en mobile, glass strip sticky.

**Persistencia:**
- `motorcycles.image_url` almacena la URL pública de la imagen subida y sigue siendo el campo fuente para la imagen primaria actual en UI.
- `motorcycles.image_locked` almacena el flag de protección.
- `motorcycles.image_source` se mantiene según el pipeline existente.
- `motorcycle_images` no sustituye ese contrato: añade una capa paralela de metadata de galería que el modal admin ya consume y alimenta desde uploads.

## 6. Routing

La app mantiene hash routing para desarrollo y compatibilidad, pero también entiende rutas limpias SEO.

Rutas actuales:

- `#/buscador` — buscador/catálogo.
- `#/buscador?compare=<bikeId>` — abre buscador y añade una moto al comparador.
- `#/buscador?browse=1` — abre buscador limpio para navegar, sin añadir motos.
- `#/motos/:id|slug` — ficha detalle de moto.
- `/motos/:slug` — ficha detalle SEO-friendly.
- `#/comparador?bikes=id1,id2,id3` — comparador dinámico legacy compatible.
- `#/comparador/:slug-vs-slug?bikes=id1,id2,id3` — comparador dinámico SEO con IDs explícitos.
- `/comparador/:slug-vs-slug` — comparador SEO-friendly resolviendo motos por slug.
- `#/comparativas/...` — ruta legacy: se resuelve al comparador dinámico, no al flujo editorial antiguo.
- `#/noticias` — página de construcción reusable para rutas públicas planificadas pero no implementadas.

Helpers centrales:

```txt
src/shared/routing/routeUtils.ts
```

Regla: no construir slugs o hashes del comparador a mano dentro de componentes. Usa `getBikeSeoSlug`, `getComparatorHashFromBikes` y helpers relacionados.

## 7. Páginas

### SearchPage

Archivo: `src/components/pages/SearchPage/SearchPage.tsx`

Responsabilidades:

- mostrar catálogo
- búsqueda por texto
- filtros avanzados
- ordenación
- selección de motos para comparar
- renderizar `CompareDrawer`

Componentes exportados para tests:

- `BikeResultCard`
- `AdvancedFilters`
- `CompareDrawer`

La lógica de filtrado/orden/selección NO debe vivir dentro de la UI si crece. Está extraída en:

```txt
src/utils/motorcycleSearch.ts
```

### BikeDetailPage

Archivo: `src/components/pages/BikeDetailPage/BikeDetailPage.tsx`

Responsabilidades:

- ficha técnica completa de una moto
- CTA `Comparar en buscador`
- CTA `Ver más motos`
- reviews aprobadas y formulario de nueva review pendiente
- rivales del mismo segmento
- estado `Moto no encontrada`

Regla importante:

- `Comparar en buscador` usa `#/buscador?compare=<id>`.
- `Ver más motos` usa `#/buscador?browse=1` y NO debe añadir nada al comparador.
- Las reviews nuevas se envían con `status = pending`; la UI solo lista reviews aprobadas.

Backlog P1/P2 (documentado en roadmap):
- evolucionar `bike-detail__quick-specs` hacia tarjetas técnicas reutilizables
- referencia visual: `.review-modal__aspect-card` (`ReviewModal`) sin copiar CSS acoplado
- si el patrón se consolida, extraer componente (`TechnicalSpecCard`/`SpecCard`) y soporte SCSS compartido (mixin/placeholder) sin duplicación

### ComparatorPage / ComparePage

Archivo: `src/components/pages/ComparatorPage/ComparatorPage.tsx`

Responsabilidades:

- comparar 2 o 3 motos seleccionadas
- mostrar lineup
- veredicto rápido
- tabla técnica
- scores de uso real

Exporta alias `ComparePage` desde `src/components/pages/ComparatorPage/index.ts` para que los tests usen el nombre del concepto.

### ComparisonDetailPage

Archivo: `src/components/pages/ComparisonDetailPage/ComparisonDetailPage.tsx`

Queda como referencia visual/legacy de Stitch. La navegación pública de `#/comparativas/...` ya debe acabar en `ComparatorPage` para conservar votación, añadir/quitar motos, URL sync y datos dinámicos.

### UnderConstructionPage

Archivo: `src/components/pages/UnderConstructionPage/UnderConstructionPage.tsx`

Página reusable para rutas públicas planificadas pero no implementadas. Sustituye el redirect silencioso a Home por una página honesta que explica el estado del desarrollo.

Props configurables desde `underConstructionContent.ts`:

- `title`, `description` — texto principal del hero.
- `imageSrc?` — imagen de fondo (default: `building-page-placeholder.png`).
- `statusLabel?` — badge técnico opcional.
- `primaryCta`, `secondaryCtas?` — acciones del hero.
- `children?` — contenido extra opcional (cards, links, formularios, etc.).
- `trustMessage?` — mensaje de principios de producto.

El componente mantiene estructura semántica con `<main aria-labelledby>`, media decorativa oculta (`aria-hidden="true"`) y un slot genérico `children` renderizado en `.under-construction__extra`. El contenido adicional se inyecta desde fuera: `src/components/pages/UnderConstructionPage/UnderConstructionCardSection.tsx` es un componente presentacional opcional para secciones de tarjetas, pero el slot acepta cualquier ReactNode. El diseño es coherente con el sistema visual MotoAtlas (dark premium, racing red, tipografía técnica).

Primera consumidora:
- `#/noticias` — configurada en `noticiasContent` con `UnderConstructionCardSection` como children.

No es una página de error 404. Es un patrón de confianza para rutas futuras.

## 8. Comparador y cola

Archivo: `src/utils/compareQueue.ts`

Responsabilidades:

- máximo 3 motos
- persistencia en `localStorage`
- creación de hashes de navegación:
  - `getCompareSearchHash`
  - `getBrowseSearchHash`
  - `getComparatorHash`
- parseo de ids desde hash

Importante:

La cola no valida contra `bikeCatalog`, porque Supabase puede devolver IDs que no existen en el fallback local.


### Comparador dinámico visual Stitch

Archivo principal: `src/components/pages/ComparatorPage/ComparatorPage.tsx`.

La ruta `#/comparador?bikes=id1,id2,id3` usa las motos cargadas por `motorcycleService` desde Supabase y, si falla, desde `bikes.ts` como fallback. El diseño visual reutiliza las clases de `ComparisonDetailPage.scss`: NO se rehizo la estética de Stitch.

Lógica reusable:

- `src/features/compare/compareUtils.ts`

Responsabilidades:

- parsear ids de `#/comparador?bikes=...`
- limitar a 3 motos e informar ids ignorados
- resolver ids contra catálogo dinámico
- construir view model de comparación:
  - hero/title
  - vote summary
  - highlights y best value
  - technical registry
  - performance bars
  - pros/cons
  - common issues
  - video analysis
  - final verdict
- generar hashes para añadir/quitar motos y sincronizar URL

Reglas:

- Soporta 2 o 3 motos para comparar; con 1 moto muestra un estado específico para añadir otra.
- Si llegan más de 3, se ignoran extras y se muestra aviso discreto.
- Quitar o añadir motos modifica `window.location.hash`; la ruta es la fuente de verdad.
- La cola actual también se guarda en `localStorage` para que `Añadir otra moto` preserve la selección al volver al buscador.
- Si faltan `pros`, `cons`, `commonIssues`, `useScores`, `imageUrl` o `reliabilityScore`, muestra fallbacks limpios: `Sin datos disponibles`, imagen placeholder, score 0 o `N/D`.
- Los tests mockean datos con fixtures, nunca Supabase real.

## 9. SEO técnico

Helpers centrales:

```txt
src/shared/seo/seoUtils.ts
```

Responsabilidades:

- `title`
- `meta description`
- Open Graph
- canonical
- JSON-LD para moto, reviews y aggregate rating
- sitemap
- robots.txt

Script:

```bash
npm run seo:sitemap
```

Genera:

```txt
public/sitemap.xml
public/robots.txt
```

Reglas:

- No duplicar lógica SEO dentro de páginas.
- Las fichas usan datos de `Bike`.
- El comparador genera title/description desde las motos seleccionadas.
- Las rutas legacy siguen funcionando, pero las rutas limpias son la forma preparada para SEO.

## 10. Reviews y aspectos técnicos

### Servicio

```txt
src/services/motorcycleReviewService.ts
```

Funciones:

- `createReview` — crea review vía RPC atómica `create_motorcycle_review_with_aspects`
- `createReviewWithAspects` — crea review + aspects en una operación
- `getApprovedReviewsByMotorcycleId` — reviews aprobadas para una moto (filtra por `source` según entorno)
- `getApprovedCommunityReviews` — todas las reviews aprobadas públicas (filtra por `source` según entorno)
- `getReviewsByUserId` — reviews del usuario autenticado (sin filtro `source`, usa `user_id` directo)
- `getReviewAspectsByReviewIds` — aspectos técnicos por reviewIds

Tablas:

```txt
public.motorcycle_reviews
public.motorcycle_review_aspects
public.review_replies
public.review_reactions
```

### Aspectos técnicos (motorcycle_review_aspects)

Cada review puede tener aspectos técnicos opcionales:

```ts
type MotorcycleReviewAspectCategory =
  | 'engine' | 'ergonomics' | 'consumption' | 'braking' | 'suspension'
  | 'electronics' | 'aerodynamics' | 'passenger' | 'maintenance'
  | 'price' | 'weight' | 'design';

type MotorcycleReviewAspectSentiment = 'positive' | 'negative';
```

Estructura:

- `review_id` — FK a `motorcycle_reviews.id`
- `category` — uno de los 12 valores arriba
- `sentiment` — `positive` | `negative`
- `comment` — opcional, matiz del usuario

Los aspectos se muestran vía `ReviewAspectSummary` (`src/components/reviews/ReviewAspectSummary/`):

- Pills positivas (categoría + tooltip si hay comment)
- Pills negativas (categoría + tooltip si hay comment)
- Reutilizado en: `OwnerReportRow`, `PrivateReviewRow`, `AdminReviewCard`, `AdminReportCard`, `AdminReplyCard`

### RPC atómica

`create_motorcycle_review_with_aspects` inserta review + aspectos en una sola operación transaccional:

- Requiere usuario autenticado (`auth.uid()`)
- No acepta `user_id` desde el cliente
- Solo `authenticated` puede ejecutarla
- `user_id` se infiere de `auth.uid()`

### Source policy

Helper: `src/shared/reviews/reviewSourcePolicy.ts`

Regla:

| Entorno | `demoEnabled` | Sources permitidos |
|---------|--------------|---------------------|
| Producción | cualquier | `['user']` |
| Dev/pre | `true` / undefined | `['user', 'seed', 'mock']` |
| Dev/pre | `false` | `['user']` |

Aplicado en:

- `getApprovedReviewsByMotorcycleId`
- `getApprovedCommunityReviews`

No aplica en: `getReviewsByUserId` (cuenta), admin, moderación.

### Reglas generales

- Inserción pública solo con `status = pending`
- Lectura pública solo de `status = approved` + sources permitidos por entorno
- `riding_style` obligatorio: `ciudad`, `viaje`, `offroad`, `deportivo`, `pasajero`, `diario`
- El promedio y contador se calculan con `src/shared/reviews/reviewUtils.ts`
- `verified` solo puede ser `true` si lo marca un admin; inserciones públicas son `false`
- `source` campo: `user` (real), `seed` (SQL demo), `mock` (script/JSON), `import` (importador masivo)

### Helpers puros compartidos de acciones comunitarias (Fase A P1)

Archivo:

```txt
src/shared/reviews/reviewCommunityActions.ts
```

Objetivo:
- Compartir lógica pura entre `CommunityReviewsPage` y `MotorcycleCommunityPage` sin extraer todavía un hook monolítico.

Reglas:
- No depende de React.
- No hace fetch.
- No lee auth/context directamente.
- No llama servicios.
- Mantiene dos shapes de summaries:
  - lista (`upsertReactionSummaryInList`)
  - map/record (`upsertReactionSummaryById`)

Nota de riesgo:
- `isDuplicateReviewReportError` depende del literal `"Ya has reportado esta review."` para el caso duplicado.

### Hook compartido de reportes comunitarios (Fase B P1)

Archivo:

```txt
src/shared/reviews/useReviewReports.ts
```

Objetivo:
- Consolidar flujo de reportes (`reportedReviewIds`, `reportForm`, `reportPendingIds`, hidratación, guards y submit outcomes) sin mezclar UI.

Reglas:
- Hook UI-agnóstico: no lee `useAuth`, no renderiza UI, no toca replies.
- No decide feedback visual de cada página (tooltip/notice/copy).
- No gestiona Helpful/NotHelpful, salvo cleanup opcional vía callback `onClearReactionAfterReport`.
- No fuerza un shape único de reaction summaries; cada contenedor mantiene su helper:
  - `CommunityReviewsPage` → `upsertReactionSummaryInList`
  - `MotorcycleCommunityPage` → `upsertReactionSummaryById`

Integraciones actuales:
- `CommunityReviewsPage` usa el hook con UX silenciosa (sin acciones no-auth falsas/no-op).
- `MotorcycleCommunityPage` usa el hook conservando UX propia (tooltips + `reactionNotice`) y pending combinado (`reactionPendingIds + reportPendingIds`).

Riesgo residual:
- En hidratación (`getMyReviewReports`) los errores se absorben silenciosamente; si se requiere notice explícito, hay que extender contrato/cobertura.

### Hook compartido de reacciones comunitarias (Fase C P1)

Archivo:

```txt
src/shared/reviews/useReviewReactions.ts
```

Objetivo:
- Consolidar mutaciones Helpful/NotHelpful (guards + pending + outcomes) sin mezclar UI ni fetch de summaries.

Reglas:
- Hook UI-agnóstico: no lee `useAuth`, no renderiza UI, no decide copy/tooltips/notices.
- No hace fetch inicial de reaction summaries.
- No toca reportes ni replies.
- No actualiza summaries externas; cada contenedor mantiene su shape:
  - `CommunityReviewsPage` → `upsertReactionSummaryInList`
  - `MotorcycleCommunityPage` → `upsertReactionSummaryById`
- Outcomes del hook:
  - `success` (incluye `summary`)
  - `blocked` (`unauthenticated | own_review | reported | pending`)
  - `error`

Integraciones actuales:
- `CommunityReviewsPage`: UX silenciosa; `Útil N` siempre visible como contador público (pasivo en no-auth/propia/reportada).
- `MotorcycleCommunityPage`: UX con tooltip/notice propia; pending combinado (`reactionPendingIds + reportPendingIds`).

Riesgo residual:
- No hay test explícito para doble toggle en el mismo tick exacto; la mitigación actual usa guard por ref interno y cobertura de pending durante request.

## 11. Testing actual

Configuración:

- `vitest.config.ts`
- `src/test/setupTests.ts`

Fixtures:

- `src/test/fixtures/bikes.ts`

Tests actuales:

- `src/utils/motorcycleSearch.test.ts`
- `src/utils/compareQueue.test.ts`
- `src/features/compare/compareUtils.test.ts`
- `src/services/motorcycleService.test.ts`
- `src/App.test.tsx`
- `scripts/importMotorcycles.test.ts`
- `scripts/syncMotorcycleImages.test.ts`
- `scripts/generateSeoFiles.test.ts`
- `src/components/pages/SearchPage/SearchPage.test.tsx`
- `src/components/pages/BikeDetailPage/BikeDetailPage.test.tsx`
- `src/components/pages/ComparatorPage/ComparatorPage.test.tsx`
- `src/shared/routing/routeUtils.test.ts`
- `src/shared/seo/seoUtils.test.ts`
- `src/shared/reviews/reviewUtils.test.ts`

## 12. Cómo añadir una funcionalidad nueva

Checklist obligatorio:

1. Identificar si hay lógica pura.
2. Extraerla a `src/utils/*` si se puede testear sin React.
3. Añadir tests unitarios para la lógica.
4. Si hay UI, añadir test de componente o página.
5. Si hay navegación, assertar `href` o flujo de navegación.
6. Si toca Supabase, mockear servicio/fetch.
7. Ejecutar:

```bash
npm run test
npm run typecheck
```

8. Actualizar esta documentación si cambia arquitectura, rutas, datos o flujo.

## 13. Qué NO hacer sin decisión explícita

- No añadir login todavía.
- No depender de Supabase real en tests.
- No eliminar `bikes.ts` mientras siga siendo fallback.
- No crear botones sin acción real.
- No crear rutas sin test.
- No cambiar contrato de `Bike` sin actualizar schema, servicio, fixtures y tests.
