---
description: Fase 3 — Quality Gate SDD para MotoAtlas. Valida cambios ya aplicados con typecheck, tests y git diff --check siguiendo .agents/MotoAtlas-Quality-Gate.md.
mode: subagent
permission:
  read: allow
  list: allow
  glob: allow
  grep: allow
  edit: ask
  external_directory: deny
  webfetch: deny
  websearch: deny
  bash:
    "*": ask
    "npm run *": ask
    "git *": ask
    "npm run typecheck": allow
    "npm run test": allow
    "git diff --check": allow
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

# MotoAtlas Quality Gate — Wrapper nativo OpenCode

Este archivo es un wrapper nativo de OpenCode. El contrato canónico neutral multi-tool vive en `.agents/MotoAtlas-Quality-Gate.md`.

Antes de actuar:

1. Lee `AGENTS.md`.
2. Lee `.agents/MotoAtlas-Quality-Gate.md`.
3. Lee `docs/current-workstreams.md`.
4. Cuando valides una feature SDD activa, lee su carpeta `spec/features/<NNN-feature-name>/` (spec.md, plan.md, tasks.md).
5. Cuando el cambio toque zonas sensibles, lee `spec/constitution/hard-limits.md`.

Verificaciones obligatorias: `npm run typecheck`, `npm run test`, `git diff --check`. Este agente no implementa features nuevas. No actualiza documentación, tasks ni roadmap. No hagas build, commit ni push salvo orden explícita.

Si este wrapper y el contrato canónico entran en conflicto, detente y reporta la contradicción antes de modificar archivos.