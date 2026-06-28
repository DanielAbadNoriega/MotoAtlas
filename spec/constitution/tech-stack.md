# MotoAtlas — Tech Stack y convenciones

## Propósito

Este archivo resume el baseline técnico que toda feature SDD debe respetar. No sustituye a `docs/architecture.md`, `docs/testing-strategy.md`, `DESIGN.md` ni `AGENTS.md`; es la vista consolidada para referencia rápida.

## Tecnologías

- **Frontend:** React 19 + TypeScript 6 + Vite 8
- **Estilos:** SCSS modular por componente/página, dark-only
- **Tests:** Vitest + React Testing Library + jsdom
- **Datos:** Supabase (PostgreSQL) como fuente principal; `src/data/bikes.ts` como fallback offline
- **Auth:** Supabase Auth (email/password), `AuthProvider` + `useAuth()`
- **Routing:** custom hash routing (`#/ruta`). Sin React Router. Helper central: `src/shared/routing/routeUtils.ts`
- **Servicios:** raw `fetch()` a Supabase REST (no supabase-js client en frontend). `@supabase/supabase-js` solo en `authService.ts`
- **Iconos:** MotoIcon (inline SVG registry para iconos críticos); Material Symbols puede existir aún en zonas de bajo riesgo o pendientes

Versiones exactas: ver `package.json`, no adivinar.

## Archivos y módulos clave

- `src/App.tsx` — entry point, routing, catálogo en memoria
- `src/components/pages/` — páginas principales (SearchPage, BikeDetailPage, ComparatorPage, AccountPage, AdminPage, CommunityPage, etc.)
- `src/components/ui/` — componentes compartidos (LoadingState, RadarState, AccountPagination, CommunityHero, etc.)
- `src/shared/` — utilities, routing, SEO, images, reviews, icons
- `src/features/auth/AuthProvider.tsx` — contexto de auth y perfil
- `src/services/` — capa de datos (motorcycleService, motorcycleReviewService, adminMotorcycleService, etc.)
- `src/styles/` — tokens, mixins, placeholders, globals
- `src/types/` — TypeScript types (bike.ts, etc.)
- `src/utils/` — lógica pura (compareQueue, motorcycleSearch, etc.)
- `src/test/fixtures/` — fixtures de bikes, reviews y auth
- `supabase/schema.sql` — schema, RLS, policies, funciones
- `docs/` — documentación de referencia (architecture, testing, admin, auth, etc.)
- `spec/` — SDD layer (constitución + features)

## Comandos y validación

Validación obligatoria en toda tarea de implementación:

```bash
npm run typecheck
npm run test
```

Flags complementarios cuando corresponde:

```bash
npm run test:watch    # durante desarrollo
npm run test:coverage # cobertura
git diff --check      # sin errores de whitespace
```

Regla: implementación → Quality Gate → Docs Sync son fases separadas por defecto. Las tareas de solo documentación suelen requerir solo `git diff --check` salvo pedido explícito.

## Modelo de datos y dominio

- **Motorcycle** (`Bike`): identidad (id, brand, model, year), clasificación (segment, license, engineType), specs (displacementCc, powerHp, torqueNm, wetWeightKg, seatHeightMm, fuelTankLiters, priceEur), contenido (imageUrl, description, pros, cons), scoring, features, reliabilityReports
- **Specs protegidas:** `image_locked`, `description_locked`, `specs_source`, `price_source`, `image_source`, `scores_source`, `pros_cons_source`, `reliability_source`
- **A2:** `is_a2_compatible`, `is_a2_limited_version`, `limited_power_hp`, `original_power_hp`
- **Reviews:** `motorcycle_reviews` + `motorcycle_review_aspects` + `review_reactions` + `review_replies`
- **Gallery admin:** `motorcycle_images` (metadata paralela, no sustituye el contrato single-image de `motorcycles.image_url`)
- **Reports:** `review_reports` con estados `pending | reviewed | dismissed | action_taken`
- **User profiles:** `user_profiles` con `role` (user/admin), `display_name`, `avatar_url`
- **Demo/mock data:** separado de producción via `runtimeEnvironment`; producción nunca depende de mock data

Detalle completo: `docs/architecture.md` + `docs/motorcycle-data-inventory.md`

## Convenciones de implementación

- **TypeScript:** strict, typed data contracts donde están documentados
- **SCSS:** `@use` para imports de variables/mixins/placeholders. No `@import`. Tokens centralizados en `src/styles/`
- **Cambios acotados:** cada tarea tiene alcance; no tocar zonas no relacionadas
- **Sin refactors desligados:** renombrados masivos, reorganizaciones o cambios de arquitectura requieren aprobación explícita
- **Servicios:** raw fetch a Supabase REST. No supabase-js client en frontend (salvo auth)
- **Fallbacks explícitos:** todo dato que puede no existir debe tener fallback claro (ej: `motorcycle-technical-pending.jpg`)
- **No modificar packages/dependencias** sin aprobación explícita
- **Tests:** toda feature nueva incluye tests; no se considera terminada sin `typecheck + test` limpios
- **Rutas:** usar helpers de `routeUtils.ts`; no construir hashes/comparadores a mano
- **Accesibilidad:** preferír `getByRole`, `getByLabelText`, `getByText`; evitar aserciones sobre clases CSS

## Iconos

**Política transitional:**

- MotoIcon (`src/shared/ui/icons/MotoIcon.tsx`) es el registry SVG inline para iconos críticos de loading, reviews, account y navegación
- 71 iconos ya migrados a MotoIcon
- `search` y `explore` en Navbar intencionalmente mantienen Material Symbols pending consumidores
- Filtros, search consumers y AdminPage search son trabajo pendiente de Workstream E
- Material Symbols siguen siendo aceptables para iconos decorativos de bajo riesgo donde el delay de fuente no causa raw text visible

**No hacer:** migraciones globales de iconos sin spec/plan dedicado.

## Estilo visual

- **Identidad:** dark premium, alto contraste, racing red (#e31837), technical grey
- **Tipografía:** Hanken Grotesk (headlines), Inter (body), JetBrains Mono (labels técnicos/badges)
- **Tokens:** espaciado base 8px, radii 2/4/8/12px, transiciones 160/240/500ms
- **Layout:** max-width 1440px, margins 80/40/20px (desktop/tablet/mobile), section gap 120/88/60px
- **Responsive:** mobile-first en lógica, desktop-first en layout principal
- **Accesibilidad:** semántico, navegación por teclado, `aria-*` donde corresponde
- **Reutilización:** tokens y mixins del sistema visual; no inventar colores o tamaños sueltos

Detalle completo: `DESIGN.md`

## Límites técnicos

Para límites verbatim, ver `spec/constitution/hard-limits.md`.

Zonas sensibles que toda feature debe respetar:

- Schema, RLS, policies, grants, auth y roles de Supabase
- `service_role_key` y credenciales privilegiadas
- `AuthProvider` y comportamiento de sesión
- Baseline de descomposición de AdminPage (~5900→13 líneas, no revertir)
- Schema y servicios de galería admin (`public.motorcycle_images`, `adminMotorcycleGalleryService`)
- App.tsx eager imports de admin (tema de arquitectura post-galería, no arreglar de forma oportunista)
- Dependencias y packages (no agregar sin aprobación)
- Mezcla de workstreams o fases sin solicitud explícita

## Relación con otros documentos

- `spec/constitution/hard-limits.md` — contrato de seguridad SDD (límites verbatim)
- `spec/constitution/mission.md` — misión y principios de producto
- `spec/constitution/roadmap.md` — estado de features (índice, no historia operativa)
- `docs/architecture.md` — referencia técnica profunda (620 líneas)
- `docs/testing-strategy.md` — referencia de testing y convenios
- `DESIGN.md` — sistema visual, tokens, patrones UI
- `docs/current-workstreams.md` — fuente de verdad operativa live
- `AGENTS.md` — adaptador de ejecución actual (sin cambios en esta fase)
