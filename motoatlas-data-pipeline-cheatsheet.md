# MotoAtlas — Guía rápida del pipeline de motos

Esta guía resume el flujo de datos de motos en MotoAtlas para no perderme entre archivos generados, reportes y comandos.

---

## 1. Archivos principales

### `data/import/motorcycleSeedList.json`

Lista de motos que queremos buscar en la API.

Ejemplo:

```json
{
  "brand": "BMW",
  "model": "F 900 GS",
  "year": 2024
}
```

Este archivo NO se importa a Supabase.

Sirve como lista de objetivos para:

```bash
npm run fetch:motos
```

---

### `data/import/motorcycles.json`

Catálogo principal editable.

Este es el archivo importante.

El importador lee este archivo cuando ejecuto:

```bash
npm run import:motos:check
npm run import:motos
```

Si una moto está aquí y pasa validación, puede acabar en Supabase.

---

## 2. Fetch desde API

Comando:

```bash
npm run fetch:motos
```

Lee:

```txt
data/import/motorcycleSeedList.json
```

Genera:

```txt
data/import/motorcycles.generated.json
data/import/motorcycles.fetch-report.json
```

---

### `motorcycles.generated.json`

Contiene motos generadas desde API que han pasado validación mínima.

NO sustituye automáticamente a `motorcycles.json`.

Debe revisarse.

---

### `motorcycles.fetch-report.json`

Informe del fetch.

Sirve para ver:

* seeds procesadas
* motos encontradas
* motos fallidas
* campos ausentes
* warnings
* errores por modelo

No se corrige manualmente salvo casos muy excepcionales.

Es un reporte, no una fuente de datos.

---

## 3. Merge seguro

Comando:

```bash
npm run merge:motos
```

Lee:

```txt
data/import/motorcycles.json
data/import/motorcycles.generated.json
```

Genera:

```txt
data/import/motorcycles.merged.json
data/import/motorcycles.merge-report.json
```

---

### `motorcycles.merged.json`

Resultado final propuesto del catálogo después de fusionar:

```txt
motorcycles.json + motorcycles.generated.json
```

Aquí puedo revisar cómo quedaría el catálogo final.

Este archivo todavía NO se importa a Supabase.

---

### `motorcycles.merge-report.json`

Informe del merge.

Sirve para ver:

* motos añadidas
* motos conservadas
* motos descartadas
* duplicados
* campos protegidos
* datos no degradados
* warnings de datos sospechosos
* placeholders
* posibles incoherencias

No se corrige manualmente.

Se usa como guía para saber qué revisar.

---

## 4. Revisión manual

Después de:

```bash
npm run merge:motos
```

Debo revisar:

```txt
data/import/motorcycles.merge-report.json
data/import/motorcycles.merged.json
```

Especialmente:

* motos añadidas
* precios a 0
* imágenes placeholder
* descripciones placeholder
* segmentos sospechosos
* potencias sospechosas
* pesos sospechosos
* pros/cons vacíos
* reliabilityScore 0

---

## 5. ¿Dónde corrijo los datos?

### Si el problema está en una moto nueva generada por API

Corregir preferentemente en:

```txt
data/import/motorcycles.generated.json
```

Luego volver a ejecutar:

```bash
npm run merge:motos
```

Así el `merged` se regenera limpio.

---

### Si el problema está en una moto que ya existía en el catálogo principal

Corregir en:

```txt
data/import/motorcycles.json
```

Luego volver a ejecutar:

```bash
npm run merge:motos
```

---

### Si solo quiero probar una corrección rápida antes de aplicar

Puedo corregir en:

```txt
data/import/motorcycles.merged.json
```

Pero cuidado:

si vuelvo a ejecutar:

```bash
npm run merge:motos
```

puede regenerar el archivo y perder mis cambios.

---

## 6. Aplicar el merge

Cuando `motorcycles.merged.json` esté revisado:

```bash
npm run merge:motos -- --apply
```

o:

```bash
npm run merge:motos:apply
```

Esto sustituye:

```txt
data/import/motorcycles.json
```

por el contenido validado de:

```txt
data/import/motorcycles.merged.json
```

Antes de aplicar, comprobar que el script no regenere el merged desde cero y pise cambios manuales.

Si hay duda, revisar el comportamiento del script.

---

## 7. Validar antes de Supabase

Después de aplicar el merge:

```bash
npm run import:motos:check
```

Debe salir:

```txt
Inválidas: 0
```

Si hay inválidas, no importar.

---

## 8. Importar a Supabase

Solo cuando el check esté bien:

```bash
npm run import:motos
```

Esto hace upsert en Supabase.

---

## 9. Flujo completo recomendado

```bash
npm run fetch:motos

npm run merge:motos

# revisar:
# data/import/motorcycles.generated.json
# data/import/motorcycles.merge-report.json
# data/import/motorcycles.merged.json

npm run merge:motos -- --apply

npm run import:motos:check

npm run import:motos
```

---

## 10. Repair auxiliar

El repair es otro flujo distinto.

Se usa cuando `motorcycles.json` ya tiene motos con campos técnicos inválidos.

Comando:

```bash
npm run repair:motos
```

Genera:

```txt
data/import/motorcycles.repaired.json
data/import/motorcycles.repair-report.json
```

---

### `motorcycles.repaired.json`

Versión reparada propuesta.

No sustituye automáticamente a `motorcycles.json`.

---

### `motorcycles.repair-report.json`

Informe de reparación.

Sirve para saber:

* qué motos estaban mal
* qué campos se repararon
* qué campos siguen pendientes
* qué errores quedan

---

## 11. Resumen mental

```txt
motorcycleSeedList.json
        ↓
npm run fetch:motos
        ↓
motorcycles.generated.json
motorcycles.fetch-report.json
        ↓
npm run merge:motos
        ↓
motorcycles.merged.json
motorcycles.merge-report.json
        ↓
revisión manual
        ↓
npm run merge:motos -- --apply
        ↓
motorcycles.json
        ↓
npm run import:motos:check
npm run import:motos
        ↓
Supabase
```

Repair auxiliar:

```txt
motorcycles.json con campos malos
        ↓
npm run repair:motos
        ↓
motorcycles.repaired.json
motorcycles.repair-report.json
```

---

## 12. Regla de oro

Nunca importar a Supabase directamente desde archivos generados sin revisar.

Orden correcto:

```txt
generar → revisar report → corregir → merge → validar → importar
```

````

---

## Qué haría ahora en tu caso

Ahora mismo tienes que revisar:

```txt
data/import/motorcycles.merge-report.json
````

pero **no editarlo**.

Después mira las 5 motos añadidas en:

```txt
data/import/motorcycles.merged.json
```

Si ves errores en esas nuevas motos, lo ideal es corregirlos en:

```txt
data/import/motorcycles.generated.json
```

y luego volver a ejecutar:

```bash
npm run merge:motos
```

Cuando el `merged` esté bien, entonces:

```bash
npm run merge:motos -- --apply
npm run import:motos:check
npm run import:motos
```
