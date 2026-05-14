# MotoAtlas

MotoAtlas es una interfaz React + TypeScript + Vite para explorar motos, ver fichas técnicas y comparar modelos. La fuente principal de datos puede ser Supabase y `src/data/bikes.ts` queda como fallback temporal.

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

- Filtrado de motos por texto, marca, segmento y carnet.
- Ordenación por precio, potencia, peso y año.
- Selección de motos para comparar.
- Límite máximo de 3 motos en el comparador.
- Fallback a `src/data/bikes.ts` si Supabase falla o no hay variables de entorno.
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
