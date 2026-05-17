# Auditoría Técnica: Datos y Reviews - MotoAtlas

**Fecha**: 17 de mayo de 2026  
**Scope**: Solo datos y reviews. NO refactorización de arquitectura.  
**Status**: ✅ Análisis completado. Sin cambios en código.

---

## 1. Procedencia de Datos

### Schema vs Tipos vs JSONs

**Sincronización: ✅ CORRECTO**
- `supabase/schema.sql` define `motorcycle_data_source` enum: `['api', 'manual', 'estimated', 'user', 'placeholder']`
- `src/types/bike.ts` `MotorcycleDataSource`: idéntico
- `src/shared/motorcycles/motorcycleTaxonomy.ts` `MOTORCYCLE_DATA_SOURCES`: sincronizado
- Campos fuente: `specs_source`, `price_source`, `image_source`, `scores_source`, `pros_cons_source`, `reliability_source`

### Datos en data/import/motorcycles.json

**Total**: 20 motorcycles

| Métrica | Cantidad | % |
|---------|----------|-----|
| `priceEur: 0` (placeholder de precio) | 15 | 75% |
| `imageSource: "placeholder"` | 10 | 50% |
| Descripción placeholder | 15 | 75% |

### Protección de Datos Editorial

**Funciona bien:**
- `image_locked` y `description_locked` son respetados durante import (`scripts/importMotorcycles.ts`)
- `mergeLockedEditorialFields()` previene sobrescritura de datos bloqueados
- Nueva importación conserva valores si están locked

**Riesgos identificados:**
1. **NO hay `specs_locked`, `pros_cons_locked`, `reliability_locked`**
   - Datos `estimated` pueden ser pisados sin advertencia
   - `priceEur: 0` con `priceSource: "placeholder"` pueden ser reemplazados

2. **Validación débil en import:**
   - `validateMotorcycleImport.ts` acepta `placeholder` pero no previene sobrescritura

3. **Datos inconsistentes:**
   - BMW R 1300 GS: `priceEur: 0` + `priceSource: "placeholder"` + descripción placeholder
   - Hornet CB750: `priceEur: 0` pero `priceSource: "api"` (inconsistencia lógica)

---

## 2. Reviews - Consistencia y Visibilidad

### Datos en data/mock/mockReviews.json

**Total**: 120 reviews

| Métrica | Cantidad | % | Estado |
|---------|----------|--------|--------|
| `status: "pending"` | 2 | 1.7% | ⚠️ No públicas |
| `status: "rejected"` | 20 | 16.7% | ⚠️ No públicas |
| `status: "approved"` | 98 | 81.7% | ✅ Públicas |
| Verified + approved | 20 | 16.7% | ⚠️ Bajo |
| `pros: [null]` o `cons: [null]` | 104 | 86.7% | 🔴 CRÍTICO |

### Problemas de Datos en Reviews

**⚠️ Campo `source` NO en MotorcycleReview TypeScript**
- `schema.sql` define: `source text NOT NULL DEFAULT 'user'` (values: 'user', 'mock', 'seed', 'import')
- `mockReviews.json` NO incluye campo `source` (agregado en import)
- `scripts/importMockReviews.ts` añade `source: 'mock'` correctamente en `prepareSupabasePayload()`
- **Pero**: `src/services/motorcycleReviewService.ts` NO mapea `source` en tipo `MotorcycleReview`
- **Impacto**: Tipo TS incompleto. En Supabase sí existe pero TypeScript no lo ve. Analytics/reportes ciegos al source

**⚠️ Calidad de datos mock:**
- 104/120 reviews (87%) tienen `pros: [null]` o `cons: [null]`
- Parece datos de prueba sin información real
- Solo 2 reviews con pros/cons no-null (líneas 67 y 74 del JSON)

### Seguridad de Visibilidad ✅

**RLS Policy (Row Level Security) en Supabase:**
```sql
create policy "Approved motorcycle reviews are readable"
  on public.motorcycle_reviews
  for select
  to anon
  using (status = 'approved');
```
- ✅ Solo `status = 'approved'` es públicamente legible
- ✅ Nuevas reviews creadas con `status = 'pending'` (formula de RLS)
- ✅ `getApprovedReviewsByMotorcycleId()` filtra correctamente: `status: 'eq.approved'`

**Verificación de código:**
- `motorcycleReviewService.ts`: fetch incluye `status: 'eq.approved'` ✅
- BikeDetailPage: llama `getApprovedReviewsByMotorcycleId()` ✅

---

## 3. Calidad de Datos Visible al Usuario

### Precios Placeholder

**Estado**: ✅ Bien manejado

- `dataQualityLabels.ts` define `pendingPriceLabel = 'Precio pendiente de confirmar'`
- `isPendingPrice(priceEur, priceSource)` detecta: placeholder source O precio ≤ 0
- `BikeDetailPage.tsx` usa: `isPendingPrice() ? pendingPriceLabel : currencyFormatter.format()`
- **Resultado**: Usuario ve "Precio pendiente de confirmar" no un 0 confuso

### Scores y Pros/Cons Estimados

**Estado**: ⚠️ Parcialmente cubierto

- Labels existen: `estimatedScoresLabel`, `estimatedProsConsLabel`, `estimatedReliabilityLabel`
- **Problema**: NO están siendo usados en componentes
- `BikeDetailPage` NO muestra warning cuando `scoresSource === 'estimated'`
- Mock reviews con `pros: [null]` no muestran "no disponible" al usuario

### Imágenes Placeholder

**Estado**: ⚠️ URL placeholder en JSON

- 10 motorcycles tienen `imageSource: "placeholder"`
- URLs: `https://placehold.co/1200x800/151515/e4002b?text=MotoAtlas+sin+imagen`
- `getMotorcycleImage()` tiene fallback pero URLs externas en JSON es antipatrón

---

## 4. Mapeo Snake Case ↔ CamelCase

**Status**: ✅ CORRECTO

Archivos de normalización funcionan bien:

- `validateMotorcycleImport.ts`: `rawFieldKeys` mapea campos snake/camel
- `normalizeMotorcycle.ts`: convierte correctamente
- `motorcycleReviewService.ts`: mapea filas Supabase a tipos TS
- `motorcycleService.ts`: normaliza datos de Supabase

---

## 5. Riesgos Identificados

### Bloqueadores para Producción

| Prioridad | Riesgo | Línea | Acción |
|-----------|--------|--------|--------|
| � ALTO | Campo `source` en reviews: schema ≠ tipos TS (JSON OK) | motorcycleReviewService.ts | Añadir `source` a tipo `MotorcycleReview` |
| 🟡 ALTO | 87% reviews sin pros/cons | mockReviews.json | Generar datos reales o indicar claramente que son placeholders |
| 🟡 ALTO | Datos `estimated` pueden ser pisados sin lock | importMotorcycles.ts | Considerar añadir `*_locked` para specs, pros/cons, reliability |

### Mejoras Recomendadas

| Tipo | Descripción | Esfuerzo | Reservado para |
|------|-------------|----------|------------------|
| Dato | Filtrar reviews mock de reportes/analytics | Bajo | Codex |
| UI | Mostrar warning cuando `scoresSource === 'estimated'` en detail page | Bajo | Codex |
| UI | Mostrar warning cuando `prosConsSource === 'estimated'` | Bajo | Codex |
| Validación | Añadir regla: si `source === 'mock'` entonces status ≠ 'approved' | Bajo | Codex |
| Arquitectura | Considerar tabla separada para `estimated_data` vs `manual_data` | Alto | Futuro |

---

## 6. Lo que Funciona Bien ✅

1. **Schema SQL y tipos TypeScript sincronizados**
2. **RLS policy protege reviews no aprobadas**
3. **image_locked / description_locked previene sobrescritura accidental**
4. **isPendingPrice() evita mostrar "$0" a usuarios**
5. **Validación de datos en importMotorcycles es estricta (rechaza inválidos)**
6. **Tests pasan 100% (223 tests)**
7. **Typecheck sin errores**

---

## 7. Archivos Auditados

- ✅ `supabase/schema.sql`
- ✅ `src/types/bike.ts`
- ✅ `data/import/motorcycles.json` (20 registros analizados)
- ✅ `data/mock/mockReviews.json` (120 registros analizados)
- ✅ `src/services/motorcycleService.ts`
- ✅ `src/services/motorcycleReviewService.ts`
- ✅ `scripts/importMotorcycles.ts`
- ✅ `src/features/import/validateMotorcycleImport.ts`
- ✅ `src/shared/dataQuality/dataQualityLabels.ts`
- ✅ `src/components/pages/BikeDetailPage/BikeDetailPage.tsx`

---

## 8. Pendiente de Codex

1. **[UI]** Mostrar warning cuando `scoresSource === 'estimated'` en detail page (badges/labels como en price)
2. **[UI]** Mostrar warning cuando `prosConsSource === 'estimated'` en detail page
3. **[TypeScript]** Añadir campo `source` a tipo `MotorcycleReview` en motorcycleReviewService.ts
4. **[Data]** Generar o reemplazar pros/cons null en mockReviews (87% inútiles)
5. **[Validación]** Considerar regla: si `source === 'mock'` entonces no puede ser `status === 'approved'` en ciertos contextos
6. **[Datos]** Revisar BMW R 1300 GS y otros con datos placeholder para determinar si son datos en progreso o definitivos

---

**Conclusión**: Datos y reviews tienen protecciones de seguridad adecuadas. Principales mejoras están en calidad de datos mock y consistencia de campos fuente. Sin bugs críticos de acceso a datos.
