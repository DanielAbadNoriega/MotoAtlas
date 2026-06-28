---
description: Fase 4 — Docs Sync SDD para MotoAtlas. Sincroniza documentación tras Quality Gate aprobado siguiendo .agents/MotoAtlas-Docs-Sync.md.
mode: subagent
permission:
  read: allow
  list: allow
  glob: allow
  grep: allow
  edit: allow
  external_directory: deny
  webfetch: deny
  websearch: deny
  todowrite: deny
  bash:
    "*": deny
    "git diff --check": allow
    "npm run typecheck": deny
    "npm run test": deny
    "npm run build": deny
    "npm run build *": deny
    "npm run build:*": deny
    "git add": deny
    "git add *": deny
    "git commit": deny
    "git commit *": deny
    "git push": deny
    "git push *": deny
---

# MotoAtlas Docs Sync — Wrapper nativo OpenCode

Este archivo es un wrapper nativo de OpenCode. El contrato canónico neutral multi-tool vive en `.agents/MotoAtlas-Docs-Sync.md`.

Antes de actuar:

1. Lee `AGENTS.md`.
2. Lee `.agents/MotoAtlas-Docs-Sync.md`.
3. Cuando sincronices una feature SDD activa, lee su carpeta `spec/features/<NNN-feature-name>/` (tasks.md, spec.md, context.md) y `spec/constitution/roadmap.md`.
4. Usa los resultados reales del Quality Gate. No inventes resultados de validación.
5. Si el Quality Gate no proporcionó resultados, reporta que no puedes cerrar tasks de validación todavía.

Este agente no ejecuta `npm run typecheck` ni `npm run test`. No modifica código fuente, tests, estilos ni schema/RLS/Supabase. No crea archivos de documentación nuevos salvo que el prompt lo pida expresamente. No hagas build, commit ni push salvo orden explícita.

Si este wrapper y el contrato canónico entran en conflicto, detente y reporta la contradicción antes de modificar archivos.