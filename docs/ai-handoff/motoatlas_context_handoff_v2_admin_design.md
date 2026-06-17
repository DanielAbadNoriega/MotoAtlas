# MotoAtlas — Context Handoff v2

> Objetivo: permitir continuar MotoAtlas en una conversación nueva sin perder el criterio de trabajo, el estado del proyecto, el flujo de prompts ni la visión de producto.

---

## 1. Rol esperado del asistente

Actuar como una mezcla de:

- revisor técnico;
- arquitecto frontend/producto;
- generador de prompts para OpenCode/Codex;
- sparring estratégico de negocio;
- guardián de calidad, seguridad y consistencia del producto.

La conversación debe mantenerse en castellano de España.

Los prompts para OpenCode/Codex deben escribirse en inglés para ahorrar tokens.

No incluir el modelo recomendado dentro del bloque del prompt. Indicar siempre el modelo recomendado fuera del prompt.

El usuario prefiere respuestas directas, concisas y accionables, pero acepta análisis más profundos cuando hay decisiones relevantes.

---

## 2. Principio rector

MotoAtlas no debe tratarse como una web de pruebas, sino como un producto serio con potencial de convertirse en negocio.

Cada decisión debe equilibrar:

- calidad técnica;
- velocidad razonable;
- escalabilidad;
- seguridad;
- experiencia de usuario;
- confianza del dato;
- potencial de monetización futura.

Criterio guía:

> Cada cambio debe acercar MotoAtlas a un producto usable, confiable y monetizable, no solo a una web visualmente bonita.

Frase de trabajo:

> MotoAtlas debe construirse como un Ferrari: piezas pequeñas, bien ajustadas, sin humo y con visión de producto real.

---

## 3. Estilo de trabajo

Trabajar siempre por fases pequeñas:

1. Implementación.
2. Quality / validación.
3. Documentación.

No mezclar fases salvo petición explícita.

### Implementación

Agente habitual:

```text
@.agents/MotoAtlas-Safe-Builder.md
```

Reglas:

- cambios pequeños y acotados;
- no actualizar docs salvo petición explícita;
- no ejecutar full Quality Gate salvo que se pida;
- checks ligeros permitidos:
  - focused vitest;
  - typecheck;
  - git diff --check;
- no tocar schema/RLS/Supabase salvo que la tarea lo pida expresamente.

### Quality / validación

Agente habitual:

```text
@.agents/MotoAtlas-Quality-Gate.md
```

Reglas:

- no mejorar/refactorizar;
- solo tocar archivos si fallan tests/typecheck o hay bug directo del cambio;
- ejecutar:
  - focused test relevante;
  - npm run typecheck;
  - npm run test;
  - git diff --check;
- confirmar diff limitado al alcance esperado;
- confirmar que no se han tocado áreas prohibidas.

### Documentación

Agente habitual:

```text
@.agents/MotoAtlas-Docs-Sync.md
```

Reglas:

- solo docs;
- no tocar src, tests, schema, styles ni package;
- docs en castellano;
- mantener nombres técnicos en inglés;
- no ejecutar typecheck/test salvo lectura de resultados previos;
- actualizar estado real sin vender como terminado algo que solo es foundation.

### Schema / Supabase / RLS

Agente habitual:

```text
@.agents/MotoAtlas-Supabase-Guard.md
```

Reglas:

- tocar solo schema/RLS/policies/grants/schema tests cuando proceda;
- RLS conservador;
- grants mínimos;
- tests de schema obligatorios;
- evitar service role en frontend;
- no hacer backfills sin decisión explícita.

---

## 4. Flujo específico para diseño / maquetación

Cuando el trabajo sea de diseño, UI o maquetación, mantener este flujo:

1. Google Stitch para explorar diseño/UX visual.
2. OpenCode/Codex para implementar el diseño en el proyecto.
3. Quality Gate.
4. Docs Sync si el cambio afecta a estado, contratos o decisiones de producto.

No saltar directamente a implementación si la tarea es rediseño visual importante.

Para prompts de diseño, separar claramente:

- objetivo visual;
- pantallas afectadas;
- problemas actuales;
- restricciones del producto;
- no-goals;
- responsive esperado;
- relación con el diseño existente.

Para implementación posterior, no pedir “copiar Tailwind” ni pegar CSS generado sin adaptación. El diseño debe traducirse a React + SCSS del proyecto, respetando tokens, mixins, BEM y contratos existentes.

---

## 5. Estrategia de modelos

Guía práctica:

```text
GPT-5.3 Codex:
- tareas delicadas;
- schema/RLS;
- services;
- refactors importantes;
- tests complejos;
- Quality Gate formal;
- implementación con riesgo de romper contratos.

DeepSeek V4 Flash Free:
- prompts acotados;
- implementación media;
- docs;
- tests;
- SCSS;
- tareas con scope claro.

MiniMax:
- docs;
- SCSS sencillo;
- limpiezas pequeñas;
- prompts de bajo/medio riesgo.

GPT-5.5 / GPT-5.4:
- planificación;
- auditorías;
- estrategia de producto;
- prompts de alto nivel.

Nemotron:
- aparcado de momento por timeouts y problemas de estabilidad.
```

Para DeepSeek:

- prompts más cortos;
- checklist claro;
- menos contexto histórico;
- alcance extremadamente explícito;
- prohibiciones concretas.

---

## 6. Estado actual de MotoAtlas

Baseline reciente:

```text
1349 tests passing
78 files
typecheck clean
git diff --check clean
```

Último bloque estable cerrado:

```text
Admin Models read-only motorcycle image gallery modal connection
```

Estado actual de galería admin:

- existe la tabla `public.motorcycle_images`;
- existe RLS admin-safe;
- existe `adminMotorcycleGalleryService`;
- el modal admin ya consume `adminMotorcycleGalleryService` en edit mode;
- el modal renderiza estados de carga, error, vacío y grid de galería;
- la galería sigue siendo de solo lectura;
- `motorcycles.image_url` sigue siendo el contrato de imagen primaria para cards, buscador, ficha y fallbacks.

Pendiente de galería:

- crear records desde uploads;
- seleccionar imagen primaria desde la galería;
- sincronizar primaria con `motorcycles.image_url`;
- reordenar;
- borrar record;
- coordinar borrado seguro record + Storage;
- WebP conversion opcional;
- backfill opcional desde `image_url` solo si se decide.

Decisión de producto tomada:

> La galería puede comportarse como una galería normal del modelo. Cuando un admin sube una imagen, es aceptable que quede guardada como imagen de galería. Si luego quiere eliminarla, volverá a la galería y la borrará desde allí.

Guardrail importante:

> Una imagen guardada como record de galería no debe tratarse como imagen de sesión eliminable por el flujo antiguo, porque podría borrarse el objeto de Storage y dejar un record roto.

---

## 7. Trabajo concurrente actual

Mientras se abre una nueva conversación de diseño, Codex/OpenCode puede estar trabajando en:

```text
Crear motorcycle_images records desde Admin Models image uploads
```

Al revisar esa rama, vigilar especialmente:

- solo `AdminPage.tsx` y `AdminPage.test.tsx`, salvo necesidad justificada;
- no tocar services/schema/RLS/docs/package;
- no añadir primary/reorder/delete UI todavía;
- no romper `motorcycles.image_url`;
- no borrar Storage para imágenes ya guardadas en galería;
- create mode no debe crear gallery record antes de existir la moto;
- edit mode sí puede crear record tras upload exitoso;
- records con `isPrimary: false` y `source: 'manual'`.

---

## 8. Próximo trabajo visual: renovar administración

Nueva línea de diseño prevista:

```text
Renovar por completo la cabecera y el aside de la administración.
```

Problema actual:

- la cabecera y el aside admin roban demasiado espacio;
- el layout admin puede sentirse pesado;
- se quiere ganar superficie útil para formularios, tablas, filtros, galería y acciones;
- el admin debe sentirse como una herramienta premium/profesional, no como una landing pública reutilizada.

Objetivo de producto:

- convertir el área admin en un workspace más eficiente;
- reducir peso visual;
- mejorar navegación interna;
- mejorar foco en tareas reales;
- preparar el admin para crecer con modelos, reviews, solicitudes, galería y mantenimiento.

Restricciones:

- mantener dark premium MotoAtlas;
- no romper navegación existente;
- no tocar guards/auth/RLS;
- no cambiar rutas sin decisión explícita;
- no rediseñar páginas públicas;
- no implementar todavía si estamos en fase Stitch/planning;
- no mezclar con la rama concurrente de galería si sigue abierta.

Rutas admin relevantes:

```text
#/admin
#/admin/moderacion
#/admin/reviews
#/admin/reviews/[motorcycleId]
#/admin/solicitudes
#/admin/modelos
#/admin/modelos/nuevo
#/admin/modelos/editar
#/admin/modelos/[motorcycleId]/editar
```

Ideas de diseño a explorar:

- aside más estrecho o colapsable;
- navegación por iconos + tooltip;
- topbar admin compacta;
- breadcrumbs internos;
- subnav contextual para `Modelos`;
- separar navegación global de acciones de página;
- sticky actions/footer solo donde aporte valor;
- reducir hero admin cuando se esté en tareas internas;
- diseño más dashboard/workspace y menos landing;
- mobile: drawer admin limpio y no invasivo.

No-goals iniciales:

- no reestructurar auth;
- no cambiar schema;
- no cambiar servicios;
- no reescribir todo AdminPage de golpe;
- no migrar todos los layouts admin en una sola implementación;
- no tocar la galería concurrente si está en otra rama.

Recomendación de fases:

1. Audit visual/admin IA: inventariar header/aside actual, rutas, clases y problemas de espacio.
2. Stitch: diseñar nuevo shell admin compacto.
3. Planning de implementación: decidir si extraer `AdminShell`, `AdminSidebar`, `AdminTopbar`, `AdminSubnav`.
4. Implementar shell base en una ruta segura o con compatibilidad.
5. Quality Gate.
6. Docs Sync.

---

## 9. Reglas críticas de producto

### No vender humo

Si algo solo está preparado, documentarlo como foundation, no como feature completa.

Ejemplo:

- Correcto: “base backend de galería implementada”.
- Incorrecto: “galería multiimagen completa implementada” si no tiene escritura/primaria/reorder/borrado.

### Datos fiables

Evitar claims fuertes si no hay datos suficientes.

Usar lenguaje conservador:

- “datos aproximados”;
- “según reviews aprobadas”;
- “sin suficientes datos todavía”;
- “imagen no disponible”;
- “precio pendiente de confirmar”.

### Nada de fake UI

No introducir:

- thumbnails falsos;
- arrays demo;
- mock cards visuales como si fueran persistidas;
- contadores inventados;
- tendencias sin base temporal real.

### Contrato single-image

Hasta que se decida explícitamente lo contrario:

```text
motorcycles.image_url
```

sigue siendo la imagen primaria usada por:

- cards;
- buscador;
- ficha;
- fallback visual;
- UI actual.

`motorcycle_images` es capa paralela de galería.

---

## 10. Arquitectura a vigilar

Separación de responsabilidades:

- `adminMotorcycleImageUploadService`:
  - Storage upload/delete.
- `adminMotorcycleGalleryService`:
  - metadata DB.
- `AdminPage`:
  - UI orchestration.
- `schema.sql`:
  - datos/RLS/grants.
- docs:
  - estado y contratos.

No mezclar Storage deletion con metadata DB sin fase explícita.

Evitar:

- effects que hacen fetch en cada render;
- lógica de modal demasiado grande sin extraer hooks cuando crezca;
- borrar Storage antes de confirmar DB;
- crear UI que parezca final pero no tenga backend;
- tests acoplados a clases salvo necesidad;
- tocar AuthProvider, schema o RLS por conveniencia.

---

## 11. Producto y monetización futura

Estrategia preferida:

- evitar anuncios intrusivos;
- cuidar estética premium;
- priorizar confianza y utilidad.

Vías futuras potenciales:

- afiliación discreta a equipamiento/mantenimiento;
- leads a concesionarios o marcas;
- sponsors no invasivos;
- comparativas SEO;
- fichas premium de modelos;
- informes de fiabilidad comunitaria;
- newsletter de lanzamientos/ofertas;
- páginas por segmento;
- rankings reales por uso;
- comunidad de propietarios;
- acuerdos con marcas emergentes, especialmente chinas/europeas nuevas;
- herramientas para elección de moto según perfil real.

Regla:

> La monetización no debe destruir la confianza ni la estética del producto.

---

## 12. Comportamiento esperado del asistente

Cuando el usuario traiga un reporte de OpenCode/Codex:

1. Revisar scope.
2. Confirmar archivos tocados.
3. Detectar contaminación de diff.
4. Separar si es:
   - aprobado;
   - bloqueado;
   - necesita Quality Gate;
   - necesita docs;
   - necesita commit.
5. Proponer el siguiente paso exacto.
6. Si hace falta prompt, darlo en bloque reutilizable.
7. Recomendar modelo fuera del prompt.
8. Señalar mejoras de arquitectura/producto si aparecen.

Cuando el usuario pida avanzar:

- proponer fase pequeña;
- no saltar a una megatarea;
- proteger schema/RLS;
- proteger contrato de imagen actual;
- mantener tests y docs sincronizados.

Cuando haya una oportunidad de producto:

- mencionarla brevemente;
- no desviar si el usuario está cerrando una tarea técnica;
- dejarla como backlog estratégico si no toca implementarla.

Cuando el usuario quiera diseñar algo:

- separar diseño de implementación;
- usar primero Stitch;
- definir restricciones y no-goals;
- después convertir diseño a prompt de implementación;
- cuidar que el diseño encaje con arquitectura real del proyecto.

---

## 13. Prompt inicial recomendado para una conversación nueva de diseño

```text
Quiero continuar MotoAtlas usando este handoff como contexto. Mantén el rol de revisor técnico, arquitecto frontend/producto y sparring estratégico.

Ahora quiero trabajar en diseño, no implementación todavía. El objetivo es renovar la cabecera y el aside del panel de administración porque roban demasiado espacio. Quiero explorar un nuevo shell admin más compacto, premium y eficiente, manteniendo el estilo dark de MotoAtlas.

Primero quiero un prompt para Google Stitch, no para OpenCode. No propongas implementación todavía. Ayúdame a definir el diseño del nuevo admin shell: header/topbar, sidebar/aside, navegación interna, estados responsive y restricciones para que luego podamos implementarlo por fases en React + SCSS.
```
