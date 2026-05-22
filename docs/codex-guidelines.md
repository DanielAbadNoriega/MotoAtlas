# Codex - Guía rápida para cambios (MotoAtlas)

Breve reglas internas para trabajar con Copilot/Codex en este repo.

- Cambios pequeños y acotados: preferir PRs/edits minimalistas que resuelvan un problema puntual.
- Reutilizar patrones existentes antes de crear nuevos componentes o estilos.
- No tocar schema / RLS / Supabase salvo indicación explícita y con aprobación del equipo.
- No ejecutar build, ni `git commit` ni `git push` salvo cuando se solicite explícitamente.
- Siempre ejecutar y verificar antes de pedir revisión:
  - `npm run typecheck`
  - `npm run test`
- Rutas principales de referencia: `#/cuenta`, `#/comunidad`, `#/admin`.
- Patrones UI a preferir: filtros (panel + sheet en móvil), paginación centralizada, cards (summary + detail), `CommunityHero` para hero compartido.
- Admin: la zona admin está protegida por RLS y el rol en `user_profiles.role = 'admin'` — respetar checks en frontend y backend.
- Prompts para AI:
  - Prompts largos y detallados SOLO para cambios en schema / RLS / auth.
  - Prompts cortos y concretos para UI, SCSS, tests y refactors pequeños.
- Tests: añade/actualiza tests cuando cambies comportamiento; evita cambios que rompan la suite sin justificación.
- Documentá decisiones importantes (arquitectura, bugfixes, convenciones) en `/memories/repo/` o en `docs/`.

Mantener este archivo corto y práctico; actualizar cuando cambien convenciones del equipo.
