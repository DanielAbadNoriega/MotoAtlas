# MotoAtlas — Workflow OpenCode / Codex

## Regla principal

No mezclar fases en un mismo prompt salvo petición explícita.

## Fase 1 — Implementation

Usar `@.agents/MotoAtlas-Safe-Builder.md`.

- Aplicar solo el cambio pedido.
- Mantener alcance chico y acotado.
- No actualizar documentación salvo pedido explícito.
- No build, commit ni push.
- Puede correr `npm run typecheck` y `npm run test` como feedback rápido.
- Ese feedback **no reemplaza** la validación formal.

## Fase 2 — Quality / validation

Usar `@.agents/MotoAtlas-Quality-Gate.md`.

- Es la validación formal del cambio.
- Ejecutar `npm run typecheck`.
- Ejecutar `npm run test`.
- Ejecutar `git diff --check` y greps relevantes cuando el prompt lo pida.
- No actualizar documentación.
- No implementar features nuevas.
- No modificar archivos por defecto; solo fixes mínimos si typecheck/tests fallan o si hay un bug evidente directamente relacionado.

## Fase 3 — Documentation

Usar `@.agents/MotoAtlas-Docs-Sync.md`.

- Ejecutar solo después de la validación.
- Actualizar docs para reflejar el estado realmente implementado y aprobado.
- No modificar `src/`, tests ni schema/RLS/Supabase.
- No repetir `npm run typecheck` / `npm run test` por defecto.
- Puede registrar el resultado ya validado del Quality Gate.
- Puede correr checks livianos de consistencia documental si hacen falta.
