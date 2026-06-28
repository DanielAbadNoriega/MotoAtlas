---
description: Fase 2 — Implementación SDD para MotoAtlas. Aplica cambios pequeños y acotados siguiendo el contrato neutral en .agents/MotoAtlas-Safe-Builder.md.
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

# MotoAtlas Safe Builder — Wrapper nativo OpenCode

Este archivo es un wrapper nativo de OpenCode. El contrato canónico neutral multi-tool vive en `.agents/MotoAtlas-Safe-Builder.md`.

Antes de actuar:

1. Lee `AGENTS.md`.
2. Lee `.agents/MotoAtlas-Safe-Builder.md`.
3. Lee `spec/README.md`.
4. Lee `spec/constitution/hard-limits.md`.
5. Lee `docs/current-workstreams.md`.
6. Cuando trabajes sobre una feature SDD activa, lee su carpeta `spec/features/<NNN-feature-name>/`.

Cumple el contrato canónico completo. Este wrapper solo añade modo y permisos nativos de OpenCode. Los checks de feedback rápido (`npm run typecheck`, `npm run test`, `git diff --check`) no reemplazan la Fase 3 — Quality Gate. No hagas build, commit ni push salvo orden explícita.

Si este wrapper y el contrato canónico entran en conflicto, detente y reporta la contradicción antes de modificar archivos.