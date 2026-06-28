# spec/ — Spec Driven Development para MotoAtlas

`spec/` es la capa SDD de MotoAtlas: define qué hacer, por qué y dentro de qué límites.

## Fuente de verdad

- **`docs/current-workstreams.md`** — fuente de verdad operativa live. Alcances, riesgos y resultados de workstreams activos viven ahí. **No se sustituye.**
- **`AGENTS.md`** — adaptador de ejecución actual para OpenCode/agentes. **Sin cambios hasta migración posterior.**
- **`.agents/`** — no existe todavía. **No se crea hasta que exista al menos una carpeta de feature real con `context.md` válido.** `.agents/` viene después de SDD sólida y después de la primera feature real. `AGENTS.md` permanece como adaptador de ejecución hasta esa migración.

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

## Flujo para una feature nueva

**Fase 1 — Spec y plan**

1. Verificar que la feature pertenece a `spec/features/NNN-*` según las reglas de roadmap.
2. Crear la carpeta con los 4 archivos obligatorios: `context.md`, `spec.md`, `plan.md`, `tasks.md`.
3. `context.md` debe preservar: source docs, historia de implementación, decisiones, baseline de validación, riesgos, zonas prohibidas, próximo paso seguro.
4. Escribir `spec.md`: qué hace, por qué y criterios de aceptación medibles.
5. Escribir `plan.md`: enfoque técnico y decisiones, respetando `constitution/tech-stack.md` y `hard-limits.md`.
6. Desglosar en `tasks.md` y marcar el progreso.

**Fase 2 — Implementación**

7. Implementar la feature según `plan.md` y `tasks.md`.

**Fase 3 — Quality Gate**

8. Validar: `npm run typecheck` + `npm run test`. La feature no se considera terminada sin ambos passing.

**Fase 4 — Docs Sync y roadmap**

9. Actualizar `spec/constitution/roadmap.md` (mover la feature a "Hecho"). Sincronizar docs si corresponde según las reglas del proyecto.

> Implementación, Quality Gate y Docs Sync son fases separadas por defecto. No combinarlas salvo solicitud explícita.

> La constitución manda: si una feature choca con `mission.md`, `tech-stack.md` o `hard-limits.md`, se replantea la feature, no la constitución.

## Arquitectura de proyecto

Revisiones-wide de arquitectura son **futuro estratégico audit-first**. No son implementación directa. Pertenecen a `spec/features/004-project-architecture-review/` una vez que se activen.

## Workstreams activos

Consultar `docs/current-workstreams.md` para estado live de workstreams.

Regla de coordinación: no lanzar en paralelo tareas que toquen las mismas zonas del repo.
