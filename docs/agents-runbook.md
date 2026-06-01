# MotoAtlas — Runbook operativo de agentes, skills y modelos

Runbook oficial para elegir **qué agente**, **qué skills** y **qué modelo** usar según el tipo de tarea.

## 1) Inventario de agentes internos

| Agente | Propósito | Cuándo usarlo | Cuándo NO usarlo | Modelo recomendado |
|---|---|---|---|---|
| `MotoAtlas-Page-Auditor` | Auditoría frontend por ruta (P0/P1/P2) | Antes de implementar cambios en una página/ruta | Para implementar código | `GPT-5.4` / `GPT-5.5` |
| `MotoAtlas-Safe-Builder` | Implementación segura y acotada | Cambios aprobados, alcance claro | Cambios de schema/RLS no pedidos | `GPT-5.3 Codex` |
| `MotoAtlas-Quality-Gate` | Verificación final del bloque | Después de implementar un bloque | Para construir features nuevas | `GPT-5.3 Codex` |
| `MotoAtlas-Supabase-Guard` | Cambios schema/RLS/policies/grants | Solo cuando la tarea pide DB/RLS explícito | UI/estilos/rutas no relacionadas | `GPT-5.3 Codex` / `GPT-5.5` |
| `MotoAtlas-Docs-Sync` | Sincronización documental post-cambio y roadmap | Después de `Quality Gate` aprobado o para actualizar estrategia/backlog documental | Código fuente/tests/estilos/schema | `MiniMax M2.7` (mecánico) / `GPT-5.3 Codex` (contradicciones) |

## 2) Secuencia oficial

```txt
Auditor → Safe Builder → Quality Gate → Docs Sync
```

Excepciones:
- **Supabase/RLS** → `MotoAtlas-Supabase-Guard`
- **Auditoría global** → `MotoAtlas-Global-Auditor` (si existe) o `MotoAtlas-Page-Auditor` en modo global
- **SCSS/UI polish** → `MotoAtlas-Safe-Builder` + skills `frontend-design` y `accessibility`

## 3) Matriz tarea → agente → skills → modelo

| Tipo de tarea | Agente recomendado | Skills útiles | Modelo recomendado |
|---|---|---|---|
| Implementación segura | `MotoAtlas-Safe-Builder` | `typescript-advanced-types`, `react-best-practices`, `vite` | `GPT-5.3 Codex` |
| Quality Gate | `MotoAtlas-Quality-Gate` | `vitest`, `accessibility` (si UI) | `GPT-5.3 Codex` |
| Docs Sync / roadmap | `MotoAtlas-Docs-Sync` | `vitest` (referencia de estrategia), `seo` (si aplica) | `MiniMax M2.7` / `GPT-5.3 Codex` |
| Auditoría de página | `MotoAtlas-Page-Auditor` | `accessibility`, `seo`, `frontend-design`, `vitest` | `GPT-5.4/5.5` |
| Auditoría global | `MotoAtlas-Global-Auditor` (recomendado) o `Page-Auditor` modo global | `accessibility`, `seo`, `react-best-practices`, `composition-patterns` | `GPT-5.4/5.5` |
| SCSS/UI polish | `MotoAtlas-Safe-Builder` | `frontend-design`, `accessibility` | `GPT-5.3 Codex` |
| Refactor delicado | `MotoAtlas-Safe-Builder` | `composition-patterns`, `typescript-advanced-types`, `react-best-practices` | `GPT-5.3 Codex` / `GPT-5.5` |
| Schema/RLS/Supabase | `MotoAtlas-Supabase-Guard` | `supabase-postgres-best-practices`, `vitest` | `GPT-5.3 Codex` / `GPT-5.5` |
| Testing | `MotoAtlas-Safe-Builder` + `MotoAtlas-Quality-Gate` | `vitest` | `GPT-5.3 Codex` |
| Limpieza CSS muerto | `MotoAtlas-Page-Auditor` → `MotoAtlas-Safe-Builder` | `frontend-design`, `accessibility` | `GPT-5.4/5.5` (audit) + `GPT-5.3` (apply) |
| Consolidación de componentes | `MotoAtlas-Page-Auditor` → `MotoAtlas-Safe-Builder` | `composition-patterns`, `typescript-advanced-types` | `GPT-5.4/5.5` (plan) + `GPT-5.3` (apply) |
| Tareas mecánicas | `MotoAtlas-Docs-Sync` o `MotoAtlas-Safe-Builder` | según tarea | `MiniMax M2.7` |
| Tareas sensibles (contratos, auth, RLS, moderación) | agente específico de dominio + `Quality-Gate` | `vitest`, `supabase-postgres-best-practices` | `GPT-5.3 Codex` / `GPT-5.5` |

## 4) Reglas de modelos

- **MiniMax M2.7**: bajo/medio riesgo, docs, limpiezas pequeñas y tareas mecánicas.
- **GPT-5.3 Codex**: implementación real, refactors, handlers, tests y cierres de bloque.
- **GPT-5.4 / GPT-5.5**: auditoría, planificación y decisiones de arquitectura.
- **Modelos free**: solo tareas simples/no críticas. No usar para cambios sensibles.

## 5) Skills: core vs opcionales

### Core MotoAtlas (uso frecuente)
- `accessibility`
- `seo`
- `frontend-design`
- `vitest`
- `vite`
- `typescript-advanced-types`
- `react-best-practices`
- `composition-patterns`
- `supabase-postgres-best-practices` (solo cuando aplique DB/RLS)

### Opcionales / infrautilizadas en flujo normal de MotoAtlas
Skills HyperFrames/video/animación (`hyperframes`, `hyperframes-cli`, `hyperframes-media`, `hyperframes-registry`, `remotion-to-hyperframes`, `animejs`, `gsap`, `lottie`, `three`, `typegpu`, `waapi`, `tailwind`, `css-animations`, `contribute-catalog`).

Usarlas solo si el proyecto entra en flujos de video/animación.

## 6) Estado operativo de skills y mirrors

- `.agents/skills/`: fuente principal.
- `.claude/skills/`: **mirror por symlinks** de `.agents/skills` (no catálogo separado).

## 7) Pendientes recomendados

1. Actualizar skill `vitest` (referencia 3.x) al estado real del proyecto (`Vitest 4.1.6`).
2. Crear/documentar `MotoAtlas-Global-Auditor`.
3. Endurecer checklist de `MotoAtlas-Supabase-Guard`.
4. Añadir verificación de contratos críticos de reviews dentro de `MotoAtlas-Quality-Gate`.
5. Valorar `MotoAtlas-SCSS-Auditor`.
6. Valorar `MotoAtlas-Review-Contracts-Gate`.
