# MotoAtlas

MotoAtlas es una interfaz React + TypeScript + Vite para explorar motos, ver fichas técnicas y comparar modelos. La fuente principal de datos puede ser Supabase y `src/data/bikes.ts` queda como fallback temporal.


## Documentación técnica

La documentación exhaustiva de arquitectura y reglas de desarrollo vive en:

- [`docs/architecture.md`](docs/architecture.md)

Esa guía explica estructura, rutas, datos, Supabase, comparador, testing y el checklist obligatorio para añadir funcionalidades.

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

1. Copiá el ejemplo de entorno:

```bash
cp .env.import.example .env.import
```

2. Rellená solo variables server/admin:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

3. Ejecutá el importador:

```bash
npm run import:motos
```

El script valida campos obligatorios, genera payload snake_case compatible con `public.motorcycles` y hace `upsert` usando `id` para evitar duplicados.

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
- Ordenación por precio, potencia, peso y año.
- Selección de motos para comparar, quitar motos y vaciar la cola.
- Límite máximo de 3 motos en buscador, cola y hash del comparador.
- Navegación principal: buscador, comparador desde selección/query params y acciones principales de la home.
- Fallback a `src/data/bikes.ts` si Supabase falla o no hay variables de entorno.
- Integración de App mockeando `motorcycleService` sin Supabase real.
- Comparador dinámico con diseño Stitch: 1/2/3 motos, añadir/quitar, URL sync, best value, technical table, performance bars, fallbacks visuales y empty states.
- Componentes principales:
  - `BikeResultCard`
  - `AdvancedFilters`
  - `CompareDrawer`
  - `BikeDetailPage`
  - `ComparePage`

Los tests no dependen de Supabase real: usan fixtures locales y mocks de `fetch` cuando hace falta validar el servicio.

### Cómo añadir nuevos tests

1. Usá fixtures de `src/test/fixtures/bikes.ts` o agregá datos mínimos ahí.
2. Priorizá queries accesibles:
   - `getByRole`
   - `getByText`
   - `getByLabelText`
3. Evitá assertar clases CSS salvo que estés testeando una variante visual imprescindible.
4. Para lógica pura, preferí tests unitarios en `src/utils/*.test.ts`.
5. Para componentes, renderizá el componente con React Testing Library y simulá usuario con `@testing-library/user-event`.
6. Para Supabase, no pegues a red real: mockeá `fetch` o el servicio.
