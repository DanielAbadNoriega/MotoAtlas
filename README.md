# MotoAtlas

MotoAtlas es una interfaz React + TypeScript + Vite para explorar motos, ver fichas técnicas y comparar modelos. La fuente principal de datos puede ser Supabase y `src/data/bikes.ts` queda como fallback temporal.


## Documentación técnica

La documentación exhaustiva de arquitectura y reglas de desarrollo vive en:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/motorcycle-data-inventory.md`](docs/motorcycle-data-inventory.md)

Estas guías explican estructura, rutas, datos, Supabase, comparador, testing, calidad de datos y el checklist obligatorio para ampliar el modelo.

## Regla obligatoria para nuevas funcionalidades

A partir de ahora, toda nueva funcionalidad debe incluir sus tests correspondientes:

- botón con acción → test de la acción
- navegación nueva → test del destino
- lógica de filtrado, selección o comparación → unit test
- página nueva → test de render + interacción principal

Una tarea no se considera terminada si no pasan:

```bash
npm run test
npm run typecheck
```


## Importación inicial a Supabase

El seed inicial vive en `data/import/motorcycles.json`.

1. Copia el ejemplo de entorno:

```bash
cp .env.import.example .env.import
```

2. Rellena solo variables server/admin:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

3. Ejecuta el importador:

```bash
npm run import:motos
```

El script valida campos obligatorios, genera payload snake_case compatible con `public.motorcycles` y hace `upsert` usando `id` para evitar duplicados.

El seed también guarda metadatos editoriales:

- `imageLocked` / `descriptionLocked`: protegen imagen y descripción manual ante futuras importaciones.
- `isA2Compatible`, `isA2LimitedVersion`, `limitedPowerHp`, `originalPowerHp`: distinguen A2 real, A2 limitable y solo A.
- `specsSource`, `priceSource`, `imageSource`, `scoresSource`, `prosConsSource`, `reliabilitySource`: procedencia `api`, `manual`, `estimated`, `user` o `placeholder`.

Reglas clave: si `priceEur = 0`, `priceSource` debe ser `placeholder`; si la imagen cae al fallback, `imageSource` debe ser `placeholder`.

### Reparación y enriquecimiento de JSON

`data/import/motorcycles.json` es la fuente editable. Si el validador detecta specs técnicas inválidas, usa:

```bash
npm run repair:motos
```

El flujo no inventa datos críticos y no sobrescribe el JSON fuente. Genera:

- `data/import/motorcycles.repaired.json`
- `data/import/motorcycles.repair-report.json`

Pasos recomendados:

1. Ejecuta `npm run repair:motos` con `API_NINJAS_KEY` en `.env.import`.
2. Revisa manualmente `motorcycles.repair-report.json`.
3. Si los datos son fiables, copia los campos reparados a `motorcycles.json`.
4. Valida:

```bash
npm run import:motos:check
```

5. Importa a Supabase solo cuando el check esté limpio:

```bash
npm run import:motos
```

Si necesitas subir solo las válidas de forma consciente:

```bash
npm run import:motos -- --allow-partial
```

### Catálogo real y enriquecimiento opcional

`data/import/motorcycleSeedList.json` contiene la lista editorial de modelos a enriquecer. Ahora cubre 80 motos reales recientes de segmentos trail, adventure, naked, sport-touring, sport, touring, enduro, dual-sport, cruiser, scrambler y neo-retro.

Para generar un JSON enriquecido sin sobrescribir la fuente manual:

```bash
npm run fetch:motos
```

Si no existe `API_NINJAS_KEY`, el script sale con un mensaje claro y no rompe el flujo.

### Fallback de imágenes

Las motos sin imagen real usan:

```txt
public/images/placeholders/motorcycle-technical-pending.jpg
```

La lógica está centralizada en `src/shared/images/getMotorcycleImage.ts` y se renderiza con overlay `TECHNICAL IMAGE PENDING`.

Las imágenes locales estables van en:

```txt
public/images/motorcycles/{motorcycle.id}.webp
```

Ejemplo:

```txt
public/images/motorcycles/bmw-f-900-gs-2024.webp
```

Para normalizar imágenes raw descargadas manualmente:

```txt
data/import/raw-images/{motorcycle.id}.jpg
```

Ejecuta primero un check sin escribir:

```bash
npm run normalize:images:check
```

Y luego genera los `.webp` optimizados:

```bash
npm run normalize:images
```

Si necesitas regenerar una imagen existente:

```bash
npm run normalize:images -- --overwrite
```

El script genera WebP 1600x900, `fit: cover`, calidad 82 y sin metadata innecesaria. Después de normalizar, `sync:images` detecta automáticamente esas imágenes.

Para comprobar qué imagen local o placeholder se aplicaría:

```bash
npm run sync:images:check
```

Para sincronizar `image_url` e `image_source` en Supabase:

```bash
npm run sync:images
```

Regla crítica: si `image_locked = true`, el script NO sobrescribe la imagen manual.

### SEO inicial

La app soporta rutas limpias además del hash routing de desarrollo:

- `/motos/[slug]`
- `/comparador/[slug-vs-slug]`

El comparador conserva compatibilidad con `#/comparador?bikes=id1,id2,id3` y con rutas legacy de `#/comparativas/...`, pero redirige la experiencia al comparador dinámico.

Para regenerar archivos públicos básicos:

```bash
npm run seo:sitemap
```

Genera:

- `public/sitemap.xml`
- `public/robots.txt`

Los meta tags, canonical, Open Graph y JSON-LD viven centralizados en `src/shared/seo/seoUtils.ts`.

### Reviews sin login

Las reviews entran como `pending` por defecto y solo se muestran cuando están `approved`.

## Datos mock para pruebas

Se añadieron utilidades para generar, importar y limpiar reviews mock. Ver: [docs/mock-data.md](docs/mock-data.md)

Estados de moderación:

- `pending`: enviada correctamente, pendiente de revisión. No es visible públicamente.
- `approved`: revisada y visible en ficha/comunidad.
- `rejected`: reservada para moderación futura; no es visible públicamente.

El badge “Review verificada” solo se muestra si la review trae `verified = true`. Las inserciones públicas anónimas quedan con `verified = false`.

Servicio:

```txt
src/services/motorcycleReviewService.ts
```

La ficha de moto muestra:

- promedio de rating
- número de reviews aprobadas
- listado de reviews aprobadas
- formulario básico de envío

Seguridad: no uses `VITE_SUPABASE_ANON_KEY` para importar. La service role key va solo en `.env.import` local; `.env.import` y `.env.local` están ignorados por Git.

## Testing

La base de testing usa:

- Vitest
- React Testing Library
- Jest DOM
- jsdom
- fixtures locales en `src/test/fixtures/bikes.ts`

### Ejecutar tests

```bash
npm run test
```

Modo watch durante desarrollo:

```bash
npm run test:watch
```

Cobertura:

```bash
npm run test:coverage
```

### Qué cubren actualmente

- Filtrado de motos por texto, marca, modelo, segmento, carnet, precio, potencia mínima y peso máximo.
- Compatibilidad A2 real/limitable, badges A2/A2 LIMITABLE/A y procedencia de datos.
- Ordenación por precio, potencia, peso y año.
- Selección de motos para comparar, quitar motos y vaciar la cola.
- Límite máximo de 3 motos en buscador, cola y hash del comparador.
- Navegación principal: buscador, comparador desde selección/query params y acciones principales de la home.
- Fallback a `src/data/bikes.ts` si Supabase falla o no hay variables de entorno.
- Integración de App mockeando `motorcycleService` sin Supabase real.
- Comparador dinámico con diseño Stitch: 1/2/3 motos, añadir/quitar, URL sync, best value, technical table, performance bars, fallbacks visuales y empty states.
- Rutas limpias, slugs, meta tags, JSON-LD, sitemap y robots.
- Sincronización de imágenes locales sin Supabase real y sin sobrescribir `image_locked`.
- Reviews básicas: creación pendiente, lectura de aprobadas, agregados de rating y validación sin Supabase real.
- Componentes principales:
  - `BikeResultCard`
  - `AdvancedFilters`
  - `CompareDrawer`
  - `BikeDetailPage`
  - `ComparePage`

Los tests no dependen de Supabase real: usan fixtures locales y mocks de `fetch` cuando hace falta validar el servicio.

### Cómo añadir nuevos tests

1. Usa fixtures de `src/test/fixtures/bikes.ts` o añade datos mínimos ahí.
2. Prioriza queries accesibles:
   - `getByRole`
   - `getByText`
   - `getByLabelText`
3. Evita assertar clases CSS salvo que estés probando una variante visual imprescindible.
4. Para lógica pura, prefiere tests unitarios en `src/utils/*.test.ts` o `src/shared/**/*.test.ts`.
5. Para componentes, renderiza el componente con React Testing Library y simula usuario con `@testing-library/user-event`.
6. Para Supabase, no conectes a red real: mockea `fetch` o el servicio.
