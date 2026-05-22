# Codex / Copilot — Reglas mínimas (MotoAtlas)

Breve y práctica: reglas mínimas para usar Codex/Copilot en este repo.

- Alcance
  - No tocar schema / RLS / Supabase salvo indicación explícita.
  - Admin protegido por RLS: `user_profiles.role = 'admin'`.

- Operaciones
  - No ejecutar build, `git commit` ni `git push` salvo indicación explícita.
  - Antes de pedir review siempre ejecutar:
    - `npm run typecheck`
    - `npm test`

- Prompts
  - UI / SCSS: prompts cortos y concretos (1–2 frases: propósito + componente/clases/responsive).
  - Schema / RLS / Auth: prompts largos y detallados (incluye esquema, políticas, ejemplos y casos de uso).

- Reutilizar patrones
  - Reusar componentes y estilos existentes (ej.: `CommunityHero`, `AccountPagination`, `admin-page__filters`, `account-page__card`).
  - Preferir patrones ya usados antes que introducir nuevos paradigmas.

- Rutas principales (referencia en repo)
  - Cuenta: `#/login` y páginas que usan `account-page`.
  - Comunidad: `#/motos` y fichas `#/motos/:id`.
  - Admin: `#/admin`, `#/admin/moderacion`, `#/admin/reviews`.

- Patrones UI a preferir
  - Filtros (panel + sheet en móvil), paginación (`AccountPagination`), cards (summary → detail), hero (ancho completo, `CommunityHero`).

- Flujo para maquetación nueva
  - Diseño → Stitch/Gemini → Codex/Copilot para convertir maqueta a markup y clases; luego PR con typecheck y tests.

- Tests y documentación
  - Añadir/actualizar tests para cambios funcionales.
  - Documentar decisiones importantes en `docs/` o `/memories/repo/`.

Mantener estas reglas cortas; si hay dudas sobre permisos o cambios en backend, preguntar antes de actuar.
