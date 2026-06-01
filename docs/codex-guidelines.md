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

- SCSS y tokens
  - No inventar variables locales en componentes. Usar tokens existentes de `_variables.scss`.
  - Si hace falta un token nuevo, añadirlo al archivo global con justificación.

- Anti-regresión
  - Ver `docs/product-behavior-contracts.md` antes de extraer o reutilizar comportamiento de reviews, acciones comunitarias o cards.
  - Regla: no dejar acciones clicables con handlers no-op. Si no hay handler real, no renderizar la acción o deshabilitarla claramente.

- Flujo recomendado de agentes
  - Secuencia por defecto: `Auditor → Safe Builder → Quality Gate → Docs Sync`.
  - Excepciones:
    - schema/RLS/Supabase: `MotoAtlas-Supabase-Guard`.
    - auditoría global: `MotoAtlas-Global-Auditor` (si existe) o `MotoAtlas-Page-Auditor` en modo global.
    - polish SCSS/UI: `MotoAtlas-Safe-Builder` + `frontend-design` / `accessibility`.
  - Referencia completa: `docs/agents-runbook.md`.

- Workstreams paralelos
  - Consultar `docs/current-workstreams.md` cuando existan varias ramas activas.
  - No lanzar tareas en paralelo que toquen las mismas zonas (comunidad, buscador, auth, admin, reviews).
  - Frase estándar: "Lee `docs/current-workstreams.md` como contexto de coordinación. No modifiques ese archivo salvo que el prompt lo pida expresamente."

- Modelos (regla rápida)
  - `MiniMax M2.7`: bajo/medio riesgo, tareas mecánicas y docs.
  - `GPT-5.3 Codex`: implementación real, refactors, handlers y tests.
  - `GPT-5.4/GPT-5.5`: auditoría, planificación y arquitectura.
  - Modelos free: solo tareas simples y no críticas.

- Rutas principales (referencia en repo)
  - Cuenta: `#/login` y páginas que usan `account-page`.
  - Comunidad: `#/comunidad`, `#/comunidad/reviews` y fichas `#/comunidad/:id`.
  - Admin: `#/admin`, `#/admin/moderacion`, `#/admin/reviews`.

- Patrones UI a preferir
  - Filtros (panel + sheet en móvil), paginación (`AccountPagination`), cards (summary → detail), hero (ancho completo, `CommunityHero`).

- Flujo para maquetación nueva
  - Diseño → Stitch/Gemini → Codex/Copilot para convertir maqueta a markup y clases; luego PR con typecheck y tests.

- Tests y documentación
  - Añadir/actualizar tests para cambios funcionales.
  - Documentar decisiones importantes en `docs/` o `/memories/repo/`.

Mantener estas reglas cortas; si hay dudas sobre permisos o cambios en backend, preguntar antes de actuar.
