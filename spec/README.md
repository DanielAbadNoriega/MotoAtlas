# spec/ — Spec Driven Development para MotoAtlas

`spec/` es la capa SDD de MotoAtlas: define qué hacer, por qué y dentro de qué límites.

## Fuente de verdad

- **`docs/current-workstreams.md`** — fuente de verdad operativa live. Alcances, riesgos y resultados de workstreams activos viven ahí. **No se sustituye.**
- **`AGENTS.md`** — adaptador de ejecución actual para OpenCode/agentes. **Sin cambios hasta migración posterior.**
- **`.agents/`** — ya existe como biblioteca de agentes específicos de MotoAtlas. Los agentes participan en handovers SDD y deben respetar `spec/` y las carpetas de feature activas. Durante el trabajo de fundación SDD no se crean agentes nuevos por defecto.

## Constitución SDD

```
spec/
├── constitution/              ← reglas estables del proyecto
│   ├── hard-limits.md       ← límites no negociables (zona sensitive)
│   ├── mission.md           ← qué construimos y para quién
│   ├── tech-stack.md        ← tecnologías, convenciones, límites técnicos
│   └── roadmap.md           ← índice de features (baseline, next, backlog)
└── features/                 ← carpetas de features activas/pendientes/futuras
    └── <NNN-feature-name>/   ← reemplazar con número y nombre real
        ├── context.md       ← traceability (OBLIGATORIO)
        ├── spec.md          ← comportamiento + criterios de aceptación
        ├── plan.md          ← enfoque técnico + fases
        └── tasks.md         ← checklist de implementación
```

`<NNN-feature-name>` es un placeholder documental. Se reemplaza por el número y nombre real de la feature. **No debe existir ninguna carpeta física de placeholder bajo `spec/features/` antes de que la feature esté activa.**

## Carpetas de features

Solo reciben carpetas `spec/features/NNN-*` el trabajo:

- **activo** — feature en implementación
- **próximo** — próximo a activar, con spec/plan aprobado
- **backlog importante** — necesita SDD framing antes de implementar
- **futuro estratégico** — requiere auditoría primero, no implementación directa

El trabajo completado **no recibe carpetas de feature**. Queda como baseline histórico en `spec/constitution/roadmap.md`.

## Flujo multiagente para una feature SDD

Este flujo no utiliza orquestadores genéricos externos. MotoAtlas emplea su propia capa SDD en `spec/` y agentes especializados en `.agents/`. La revisión humana y el commit manual forman parte del flujo.

### Fase 1 — SDD / Spec y plan

Carpeta de feature con los 4 archivos obligatorios:

1. `context.md` — source docs, historia de implementación, decisiones, baseline de validación, riesgos, zonas prohibidas, próximo paso seguro.
2. `spec.md` — qué hace, por qué y criterios de aceptación medibles.
3. `plan.md` — enfoque técnico y decisiones, respetando `constitution/tech-stack.md` y `hard-limits.md`.
4. `tasks.md` — checklist de implementación con fases.

### Fase 2 — Implementación

- **Agente:** `.agents/MotoAtlas-Safe-Builder.md`
- Implementa solo el alcance definido en la carpeta de feature.
- Por defecto no cierra la feature de forma completa.
- Feedback rápido: `npm run typecheck`, `npm run test`, `git diff --check`.
- No actualiza documentación, tasks ni roadmap salvo que el prompt lo pida de forma explícita.

### Fase 3 — Quality Gate

- **Agente:** `.agents/MotoAtlas-Quality-Gate.md`
- Verificaciones obligatorias: `npm run typecheck`, `npm run test`, `git diff --check`.
- Valida contra `spec.md` y `tasks.md` cuando existe una feature SDD activa.
- Modifica archivos solo si falla typecheck/test o hay un bug evidente directamente relacionado.
- No actualiza documentación, tasks ni roadmap.

### Fase 4 — Docs Sync

- **Agente:** `.agents/MotoAtlas-Docs-Sync.md`
- Ocurre después de un Quality Gate aprobado.
- Marca tasks como completadas solo cuando están respaldadas por resultados reales.
- Actualiza `spec/constitution/roadmap.md` solo tras validación completa.
- No inventa resultados de validación.

### Revisión humana

- Revisión del bloque cerrado.
- Commit manual.
- Coordinación con `docs/current-workstreams.md` según regla de coordinación.

> Implementación, Quality Gate y Docs Sync son fases separadas por defecto. No combinarlas salvo solicitud explícita.

> La constitución manda: si una feature choca con `mission.md`, `tech-stack.md` o `hard-limits.md`, se replantea la feature, no la constitución.

## Agentes de soporte

No participan en todo handover de feature por defecto. Se invocan según el tipo de cambio:

- **`.agents/MotoAtlas-Page-Auditor.md`** — auditoría y propuesta de mejora de rutas. Audit/proposal only. No implementa.
- **`.agents/MotoAtlas-Supabase-Guard.md`** — guard de Supabase/RLS/auth/roles cuando el cambio toca zonas sensibles del backend. Especializado. No se convierte en agente de implementación general.

## Arquitectura de proyecto

Revisiones-wide de arquitectura son **futuro estratégico audit-first**. No son implementación directa. Pertenecen a `spec/features/004-project-architecture-review/` una vez que se activen.

## Workstreams activos

Consultar `docs/current-workstreams.md` para estado live de workstreams.

Regla de coordinación: no lanzar en paralelo tareas que toquen las mismas zonas del repo.
