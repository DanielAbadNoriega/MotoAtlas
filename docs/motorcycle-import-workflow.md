# Flujo seguro de datos de motos

MotoAtlas separa claramente generación, revisión local e importación a Supabase. La regla base es: **ningún script automático debe pisar el catálogo curado sin revisión humana**.

## 1. Generar datos desde API

```bash
npm run fetch:motos
```

Genera, cuando hay `API_NINJAS_KEY` en `.env.import`:

- `data/import/motorcycles.generated.json`
- `data/import/motorcycles.fetch-report.json`

`fetch:motos` no importa nada a Supabase y no modifica `data/import/motorcycles.json`.

El generated solo incluye motos técnicamente válidas. Si una seed falla por specs críticas ausentes (`displacementCc`, `powerHp`, etc.), se registra en el reporte y el proceso continúa.

## 2. Fusionar de forma segura

```bash
npm run merge:motos
```

Genera:

- `data/import/motorcycles.merged.json`
- `data/import/motorcycles.merge-report.json`

`merge:motos` no importa nada a Supabase y, por defecto, **no sobrescribe** `data/import/motorcycles.json`.

Reglas principales:

- Conserva motos existentes por `id`.
- Añade solo motos nuevas válidas.
- Descarta motos generadas inválidas.
- No degrada datos curados: no cambia manual/user por api/estimated/placeholder, no cambia valores reales por `0`, no reemplaza pros/contras útiles por arrays vacíos y no reemplaza fiabilidad útil por score/reportCount `0`.
- Respeta `imageLocked`, `descriptionLocked`, imágenes manuales/user y descripciones no-placeholder.
- Protege siempre imágenes locales reales (`/images/motorcycles/*.webp`) frente a placeholders (`placehold.co`, `/images/placeholders/*` o fallback técnico). Si el catálogo quedó con placeholder pero existe una imagen local por `id`, la recupera en `motorcycles.merged.json` y lo registra en el reporte.
- Reporta placeholders y datos sospechosos para revisión manual.

Los warnings no bloquean el merge porque una moto puede ser técnicamente válida pero editorialmente pobre. Aun así, **hay que revisar siempre** `motorcycles.merge-report.json` antes de aplicar.

## 3. Aplicar al catálogo principal

Solo tras revisar `motorcycles.merged.json` y `motorcycles.merge-report.json`:

```bash
npm run merge:motos -- --apply
```

o:

```bash
npm run merge:motos:apply
```

Con `--apply`, el script valida de nuevo el merge completo y entonces reemplaza `data/import/motorcycles.json`.

## 4. Validar importación Supabase sin escribir

```bash
npm run import:motos:check
```

Esto valida el catálogo principal contra el formato Supabase, pero no conecta ni escribe datos reales.

## 5. Importar a Supabase

Solo cuando el catálogo esté revisado:

```bash
npm run import:motos
```

`import:motos` usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde `.env.import`. No uses claves `VITE_*` para scripts de importación.

## Resumen rápido

```bash
npm run fetch:motos
npm run merge:motos
# revisar motorcycles.merged.json y motorcycles.merge-report.json
npm run merge:motos -- --apply
npm run import:motos:check
npm run import:motos
```

## Qué significan los warnings

- `priceEur = 0`: precio pendiente de revisión.
- Imagen placeholder/placehold: falta imagen local real.
- Descripción placeholder: falta contenido editorial.
- Pros/contras vacíos: faltan datos editoriales o comunitarios.
- Reliability score/report count `0`: falta fiabilidad revisada.
- `features` todo en `false`: puede ser falta de datos, no ausencia real.
- Sources `estimated`/`placeholder`: dato no curado.
- Segmento/potencia/peso sospechoso: revisar manualmente antes de publicar/importar.
