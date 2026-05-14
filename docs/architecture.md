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
```

## 4. Modelo de datos

El dominio principal es `Bike`, definido en `src/types/bike.ts`.

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

### Supabase

El schema vive en `supabase/schema.sql`.

La tabla principal es `public.motorcycles`.

RLS está activo y solo existe policy pública de lectura para `anon`. No hay login ni escrituras desde frontend todavía.

Variables necesarias en `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 6. Routing

La app usa hash routing simple en `src/App.tsx`.

Rutas actuales:

- `#/buscador` — buscador/catálogo.
- `#/buscador?compare=<bikeId>` — abre buscador y añade una moto al comparador.
- `#/buscador?browse=1` — abre buscador limpio para navegar, sin añadir motos.
- `#/motos/:id` — ficha detalle de moto.
- `#/comparador?bikes=id1,id2,id3` — comparador dinámico.
- `#/comparativas/bmw-f-900-gs-vs-aprilia-tuareg-660` — comparativa editorial fija.

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
- rivales del mismo segmento
- estado `Moto no encontrada`

Regla importante:

- `Comparar en buscador` usa `#/buscador?compare=<id>`.
- `Ver más motos` usa `#/buscador?browse=1` y NO debe añadir nada al comparador.

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

Es una comparativa editorial fija, no el comparador dinámico. Actualmente compara BMW F 900 GS vs Aprilia Tuareg 660.

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

## 9. Testing actual

Configuración:

- `vitest.config.ts`
- `src/test/setupTests.ts`

Fixtures:

- `src/test/fixtures/bikes.ts`

Tests actuales:

- `src/utils/motorcycleSearch.test.ts`
- `src/utils/compareQueue.test.ts`
- `src/services/motorcycleService.test.ts`
- `src/App.test.tsx`
- `src/components/pages/SearchPage/SearchPage.test.tsx`
- `src/components/pages/BikeDetailPage/BikeDetailPage.test.tsx`
- `src/components/pages/ComparatorPage/ComparatorPage.test.tsx`

## 10. Cómo añadir una funcionalidad nueva

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

## 11. Qué NO hacer sin decisión explícita

- No añadir login todavía.
- No depender de Supabase real en tests.
- No eliminar `bikes.ts` mientras siga siendo fallback.
- No crear botones sin acción real.
- No crear rutas sin test.
- No cambiar contrato de `Bike` sin actualizar schema, servicio, fixtures y tests.
