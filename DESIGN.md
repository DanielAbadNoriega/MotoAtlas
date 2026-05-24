# MotoAtlas — Design System

Documento vivo de diseño basado en el estado actual del código. Sirve como referencia unificada para IA, diseño, implementación y generación futura de vídeos/demos.

> Complementa a `AGENTS.md`. No lo sustituye.  
> `TechnicalPrecision.md` queda como referencia histórica inicial. En caso de conflicto, prevalece el código real y este documento.

---

## 1. Principio de autoridad

Este documento describe el diseño **actual validado** en el código de MotoAtlas.  
Si hay diferencias entre lo descrito aquí y `TechnicalPrecision.md`, **prevalece el código real**.  
Este documento debe actualizarse cuando cambien patrones visuales relevantes, componentes reutilizables o tokens de diseño.

---

## 2. Identidad visual actual

| Atributo | Descripción |
|----------|-------------|
| Personalidad | Premium, técnica, precisa, motera, aspiracional |
| Tono visual | Dark premium, alto contraste, racing red, technical grey |
| Sensación | Cuadro de instrumentos digital de alta gama: funcional, inmediato, disciplinado |
| Inspiración | Ingeniería de alto rendimiento, fibra de carbono, asfalto, spec-sheets |

**Lo que NO es MotoAtlas:**
- UI genérica «startup»
- Exceso de glassmorphism
- Neón cyberpunk
- Clutter visual
- Dashboard empresarial genérico (el admin es premium y sobrio)

---

## 3. Tokens de diseño reales

Extraídos directamente de `src/styles/_variables.scss`

### 3.1 Paleta de color

#### Superficies (dark mode fijo)

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-surface` | `#141313` | Fondo general de página |
| `$color-surface-dim` | `#141313` | Mismo que surface |
| `$color-surface-bright` | `#3a3939` | Estados brillantes/surface elevados |
| `$color-surface-lowest` | `#0e0e0e` | Fondo extremo (inputs, elementos hundidos) |
| `$color-surface-low` | `#1c1b1b` | Fondo secundario (secciones) |
| `$color-surface-container` | `#201f1f` | Cards, contenedores elevación media |
| `$color-surface-container-high` | `#2b2a2a` | Hover states, contenedores elevados |
| `$color-surface-container-highest` | `#353434` | Elementos con máxima elevación |

#### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-on-surface` | `#e5e2e1` | Texto principal |
| `$color-on-surface-variant` | `#c7c6ca` | Texto secundario/metadatos |
| `$color-on-surface-light` | `#ffffff1a` | Texto muy tenue/sombra |

#### Acento (Racing Red)

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-accent` | `#e31837` | Acciones principales, CTAs, highlights, redline |
| `$color-accent-container` | `#d6042f` | Fondos de acción, badges |
| `$color-accent-dark` | `#92001d` | Hover de acciones destructivas |
| `$color-accent-soft` | `rgba(227, 24, 55, 0.12)` | Fondos sutiles de acento |

> El rojo se usa con moderación para mantener impacto. No saturar.

#### Outline

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-outline` | `#909094` | Bordes principales |
| `$color-outline-variant` | `#46474a` | Bordes secundarios, divisores |

#### Error

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-error` | `#ffb4ab` | Texto de error |
| `$color-error-container` | `#93000a` | Fondo de error |

### 3.2 Tipografía

| Rol | Font | Tamaño | Peso | Leading |
|-----|------|--------|------|---------|
| headline-xl | Hanken Grotesk | 64px → 32px (mobile) | 800 → 700 | 1.1 |
| headline-lg | Hanken Grotesk | 40px → 32px | 700 | 1.2 |
| headline-md | Hanken Grotesk | 24px | 700 | 1.3 |
| body-lg | Inter | 18px | 400 | 1.6 |
| body-md | Inter | 16px | 400 | 1.6 |
| label-caps | JetBrains Mono | 12px | 600 | 1.0, letter-spacing 0.1em |

- **Hanken Grotesk** → headlines, títulos. Sharp, engineered feel.
- **Inter** → cuerpo, descripciones, tablas. Legibilidad en tamaños pequeños.
- **JetBrains Mono** → etiquetas técnicas, badges, specs, data points. Refuerza atmósfera «spec-sheet».

### 3.3 Espaciado

| Token | Valor |
|-------|-------|
| Base (`$space-base`) | 8px |
| Gutter (`$space-gutter`) | 24px |
| Section gap (desktop) (`$space-section`) | 120px |
| Section gap (tablet) (`$space-section-tablet`) | 88px |
| Section gap (mobile) (`$space-section-mobile`) | 60px |
| Margin desktop (`$margin-desktop`) | 80px |
| Margin tablet (`$margin-tablet`) | 40px |
| Margin mobile (`$margin-mobile`) | 20px |

### 3.4 Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `$radius-sm` | 2px | Chips técnicos, etiquetas, pills pequeños |
| `$radius-md` | 4px | Botones, inputs |
| `$radius-lg` | 8px | Cards, contenedores medianos |
| `$radius-xl` | 12px | Cards grandes, estados vacíos, heroes, filtros panel |

> Filosofía: radios agresivos y arquitectónicos (precision-cut). Nada «bubbly».

### 3.5 Sombras

| Token | Valor |
|-------|-------|
| `$shadow-card` | `0 18px 48px rgba(0,0,0,0.32)` |
| `$shadow-glass` | `0 18px 60px rgba(0,0,0,0.45)` |
| `$shadow-accent` | `0 0 0 1px rgba(227,24,55,0.26), 0 18px 48px rgba(146,0,29,0.18)` |

### 3.6 Transiciones

| Token | Valor |
|-------|-------|
| `$transition-fast` | 160ms ease |
| `$transition-base` | 240ms ease |
| `$transition-slow` | 500ms ease |

### 3.7 Breakpoints

| Token | Valor |
|-------|-------|
| Mobile | ≤ 767px |
| Tablet | ≤ 1023px |
| Desktop | ≤ 1200px |
| Max-width contenedor | 1440px |

---

## 4. Layout real

### 4.1 Principios generales

- **Desktop**: contenido centrado, max-width 1440px. Side margins 80px. Sidebar + main column donde aplica (cuenta, admin).
- **Tablet**: margins 40px. Sidebar se colapsa a panel responsive (drawer/sheet).
- **Mobile**: margins 20px. Todo apila verticalmente.
- **Hero**: full-width, sin constraint de container. Imagen como background con overlay degradado.
- **Grid real**: no existe un grid CSS abstracto. El layout se maneja con CSS Grid casos-por-caso (dashboard sidebar/main, listados, etc.).

### 4.2 Márgenes y contenedores

Contenedor principal aplicado mediante mixin `@include container;` que implementa:
- max-width: 1440px
- padding-left: $margin-desktop (80px desktop, 40px tablet, 20px mobile)
- padding-right: $margin-desktop
- margin: 0 auto

### 4.3 Espaciado de secciones

- Section gap vertical: 120px desktop, 88px tablet, 60px mobile
- Implementado mediante padding-block en componentes de sección

---

## 5. Componentes y patrones reales

### 5.1 Heroes

#### Variante 1: `CommunityHero` (componente React)
Ubicación: `src/components/ui/CommunityHero/`
- Imagen, eyebrow, título, descripción, acciones
- Usado en: landing comunidad, top-rated, admin dashboard, admin reviews
- Estructura: `hero-media` (imagen), `hero-content` (eyebrow + título + rating/estado), `hero-actions`

#### Variante 2: `motorcycle-community__hero` (patrón SCSS)
Ubicación en múltiples páginas SCSS
- Misma estructura visual que CommunityHero pero sin wrapper React
- Usado en: páginas con hero de moto (comunidad por moto, admin, cuenta)
- Clases base: `hero-media`, `hero-content`, `hero-actions`

**Reglas de héroes:**
- `eyebrow` en `label-caps`, color `$color-accent`
- Título en `headline-xl` (responsive)
- Imagen con `filter: grayscale(0.32) contrast(1.1) opacity(0.64)`
- Overlay degradado: `linear-gradient(180deg, rgba($color-surface-low, 0.7), $color-surface-lowest)`

### 5.2 Filtros

**Patrón único cross-page** (ver AccountReviewsPage.scss, AdminPage.scss, MotorcycleCommunityPage.scss)

Estructura:
```
{page}__filters (panel, --open para visible en mobile)
  backdrop
  header: h2 + close button
  body: filter-groups
    --open: grupo expandido
    toggle: button con aria-expanded, chevron expand_more
    options: chips/botones con --active
  footer: "Limpiar filtros" + "Aplicar filtros"
```

Variantes de option:
- `--pill` (chips)
- `--rating` (estrellas)
- `--sort` (orden)

En desktop viven en sidebar. En mobile son sheet/drawer con backdrop.

**Regla de reutilización:** no crear filtros nuevos si existe este patrón.

### 5.3 Cards de review (públicas)

**`AccountReviewCard`** (reutilizado en cuenta y comunidad):
- Imagen izquierda
- Título + rating en cabecera
- Metadatos con iconos (estilo conducción, meses, km, fecha)
- Acciones inferiores
- Enlace secundario «Más reviews»
- Variante `community`: alias público, oculta estado, metadatos completos
- Variante `communityCompact`: 2 items por sección, mayor densidad

Archivos: `src/components/reviews/AccountReviewCard/`

### 5.4 Cards de review (admin)

#### Patrón para `#/admin/reviews` (garaje admin)
- Cards resumen agrupadas por moto, similar a `.account-page__review-summary-card`
- Base visual de cuenta/garaje: imagen izquierda, título, métricas, contador de reviews pendientes
- Link a detalle de reviews por moto: `#/admin/reviews/[motorcycleId]`
- Archivo: `AdminReviewSummaryCard` en `src/components/pages/AdminReviewsPage/`

#### Patrón para `#/admin/reviews/[motorcycleId]` (detalle de reviews por moto)
- Cards expandibles tipo `AdminReportCard` por cada review individual
- Cada review es una unidad moderable con estructura header/body/footer
- Header plegable: usuario, estado (badge), rating, source badge, verified badge, fecha
- Body: comentario completo, pros y contras (si existen)
- Footer: acciones de moderación (Aprobar/Ocultar/Rechazar, según estado)
- Trigger accesible con `aria-expanded` + `aria-controls` en el header
- Estados: `pending` (Pendiente), `approved` (Publicada), `rejected` (Rechazada), `hidden` (Oculta)
- **No crear cards custom aisladas**: usar `AdminReportCard` cuando corresponda
- Archivo: `AdminReportCard` en `src/components/pages/AdminMotorcycleReviewsPage/`

**Nota**: Ambas páginas reutilizan patrones validados. No inventar variantes visuales nuevas.

### 5.5 Paginación

**`AccountPagination`** en `src/components/pages/AccountPage/`:
- `aria-current="page"` en página activa
- Botones: `<<` `<` páginas `>` `>>`
- Disabled en extremos
- Ventana de 5 páginas visibles
- Iconos Material Symbols
- Clase activa: `account-reviews-page__pagination-current`

### 5.6 Badges / Pills

- `admin-page__status-pill` (estados de review/reporte)
- `admin-page__status-pill--review` con `data-status`
- `admin-moto-reviews__verified-badge` (verificada/no verificada)
- `admin-moto-reviews__source-badge` (origen de review)
- Labels en `label-caps` (JetBrains Mono, 12px, uppercase, letter-spacing)

### 5.7 Botones

- `.button` (componente `src/components/ui/Button/`)
- `.button--ghost` (borde fino, transparente)
- `.account-page__button` (botón primario cuenta/admin)
- `.admin-page__action-button` con modificadores:
  - `--approve` (verde: `#47d16c`)
  - `--hide` (gris: rgba del surface)
  - `--reject` (rojo: `$color-accent`)

### 5.8 Inputs

- Fondo: `rgba($color-surface-lowest, 0.92)`
- Borde: `1px solid rgba($color-outline-variant, 0.62)`
- Placeholder en JetBrains Mono (señal «data-entry»)
- Focus: border-color `rgba($color-accent, 0.58)` + box-shadow `0 0 0 3px rgba($color-accent, 0.16)`

### 5.9 Quick Links y navegación secundaria

Patrones de navegación secundaria en layouts sidebar/main:
- `.account-page__quick-links` (contenedor)
- `.account-page__quick-link` (enlace individual)
- Variantes activas: `account-page__quick-link--active`
- Usado en: `AdminSidebar`, `AccountPrivateSidebar`, y otros paneles laterales
- Archivos: componentes de sidebar en páginas de cuenta y admin

**Nota**: No confundir con cards de contenido. Los quick links son para navegación, no para mostrar datos.

### 5.10 Cards reutilizables de contenido

Componentes de tarjeta reutilizables para mostrar datos:
- `BikeCard` — card de moto para listados (grid, carousel)
- `RouteCard` — card de ruta para secciones editoriales
- `NewsCard` — card de noticia para feeds
- `ReportCard` — card de reporte para admin (listados, detallados)
- `ReportCtaCard` — CTA para reportar reviews (en detalle de review)
Ubicación: `src/components/ui/` para todos

**Nota**: Estos componentes presentan datos, no sirven para navegación. Para enlaces de navegación secundaria, ver patrón Quick Links arriba.

### 5.11 Listados compactos / Rows

- Review rows en admin: `admin-motorcycle-reviews-page__review-card` con `data-row-tone="even|odd"` para alternating.
- Garaje agrupado: cards por `motorcycleId` con imagen, métricas, CTAs.
- Private review rows: `motorcycle-community__owner-report-row` con alternating rows

---

## 6. Patrones por zona

### 6.1 Home (`#/`)
- Hero full-width con imagen, título principal, CTA
- Bloques de contenido editorial: secciones con `SectionHeader`
- Cards de moto, rutas, noticias
- Componentes: FeaturedBikes, RoutesSection, LatestNews, MachineDuel

### 6.2 Buscador (`#/buscador`)
- Listado paginado (9 motos/página)
- Filtros (segmento, carnet) — mismo patrón que comunidad
- Compare tray con 3 slots
- Hero con imagen de versus bikes
- Componentes: ComparisonBikeCard en grid

### 6.3 Comunidad
| Ruta | Patrón |
|------|--------|
| `#/comunidad` | Hero + Podium + Trending + Comunidades activas + Reviews recientes + CTAs |
| `#/comunidad/reviews` | Hero + bloques editoriales (Destacadas, Últimos reportes, Insights) + Garaje filtrable |
| `#/comunidad/[motorcycleId]` | Hero moto + listado compacto reviews aprobadas + sidebar filtros + reacciones |

**Reacciones públicas:** `Útil N` (contador), `No útil` (sin contador), `Reportar`. Mutuamente excluyentes. No auto-reacción.

### 6.4 Cuenta (`#/cuenta`)
| Ruta | Patrón |
|------|--------|
| `#/cuenta` | Dashboard + Mis reviews (garaje compacto, últimas 3) |
| `#/cuenta/reviews` | Garaje filtrable agrupado por moto |
| `#/cuenta/reviews/[motorcycleId]` | Hero moto + listado reviews propias + sidebar cuenta + filtros rating/orden |

Sidebar de cuenta con: perfil, links de navegación, notice/bloque informativo.

### 6.5 Admin
Ver sección 7.

### 6.6 Reviews (global)
- `pending` → Pendiente
- `approved` → Publicada
- `rejected` → Rechazada
- `hidden` → Oculta
- No renderizar `null`. Pros/contras `null` o vacíos no se renderizan.

### 6.7 Páginas de información estática
- Metodología, Fuentes de datos, Solicitar modelo
- Layout: hero + contenido editorial en columnas
- Componentes: SectionHeader, texto fluido

---

## 7. Admin

### 7.1 Estética
- Admin NO es un dashboard empresarial genérico
- Misma identidad premium: dark mode, racing red, tipografía técnica
- Funcional y sobria — sin adornos innecesarios
- Reutiliza layout de cuenta (sidebar/main) cuando aplica

### 7.2 Rutas
| Ruta | Contenido |
|------|-----------|
| `#/admin` | Panel con accesos rápidos y resúmenes |
| `#/admin/moderacion` | Reportes de reviews paginados con filtros |
| `#/admin/reviews` | Garaje admin: reviews agrupadas por modelo |
| `#/admin/reviews/[motorcycleId]` | Reviews de una moto con filtros y acciones |

### 7.3 Estados de reporte
| Backend | UI |
|---------|-----|
| `pending` | Pendiente |
| `reviewed` | Revisado |
| `dismissed` | Descartado |
| `action_taken` | **Resuelto** |

### 7.4 Acciones sobre review (desde moderación)
Si se modifica la review → el reporte pasa a `action_taken`.

### 7.5 Reglas visuales
- Distinguir estados con badges claros (pills con color por estado)
- Acciones con hover por intención: azul (revisar), rojo (descartar/rechazar), verde (aprobar/resolver), gris (ocultar)
- `admin-page__action-group` para agrupar acciones

### 7.6 Componentes específicos de admin
- `AdminReportCard`: card expandible para reportes
- `AdminReviewSummaryCard`: card de garaje para admin reviews
- Badges: `admin-page__status-pill`, `admin-moto-reviews__verified-badge`, `admin-moto-reviews__source-badge`

---

## 8. Reglas de reutilización

Añadir reglas claras para consistencia:

1. **Filtros**: siempre usar el patrón existente (header/body/footer, chips, Material Symbols, sheet/drawer mobile). No crear variantes.
2. **Paginación**: siempre usar `AccountPagination`. No crear paginadores nuevos.
3. **Hero**: siempre full-width con imagen overlay o `CommunityHero`. No crear heroes inline sin fondo.
4. **Cards de review**: siempre `AccountReviewCard` o el patrón de admin expandible. No crear cards review custom aisladas.
5. **Sidebar/Main**: reutilizar layout de cuenta/admin cuando se requiera navegación lateral + contenido principal.
6. **Tipografía**: usar los mixins existentes (`headline-xl`, `label-caps`, etc.). No declarar font-size sueltos.
7. **Colores**: usar exclusivamente las variables SCSS definidas. No hardcodear colores.
8. **Espaciado**: utilizar los tokens de espaciado (`$space-base`, `$space-gutter`, etc.) y márgenes establecidos.
9. **Radius**: usar únicamente `$radius-sm`, `$radius-md`, `$radius-lg`, `$radius-xl`.
10. **Transiciones**: usar `$transition-fast`, `$transition-base`, `$transition-slow`.

---

## 9. Checklist para auditar páginas

Verificar al crear o revisar cualquier página:

- [ ] Hero: full-width con imagen adecuada y overlay
- [ ] h1/headings: jerarquía correcta, uso de tipografía definida
- [ ] Estructura semántica: uso apropiado de header, main, section, nav
- [ ] Filtros: si aplica, seguir patrón existente exactamente
- [ ] Cards/listados: usar componentes reutilizables (AccountReviewCard, BikeCard, etc.)
- [ ] Badges: usar label-caps y colores de estado definidos
- [ ] CTAs: botones con variantes apropiadas (--ghost, --primary, --glass)
- [ ] Paginación: si lista paginada, usar AccountPagination
- [ ] Empty/loading/error: estados manejados con componentes apropiados
- [ ] Foco visible: verificar en navegación teclado
- [ ] Responsive: probar en mobile/tablet/desktop con márgenes correctos
- [ ] SEO title/description: presentes y descriptivos
- [ ] Consistencia: al menos 3 patrones reutilizables usados por página

---

## 10. Guía para vídeo/demo

### 10.1 Qué debe comunicar MotoAtlas
- Es una plataforma **premium y técnica** para moteros exigentes
- No es «otra red social de motos» — es una herramienta de decisión informada
- Comunidad real con reviews verificadas
- Transparencia: metodología clara, fuentes de datos declaradas

### 10.2 Secuencia recomendada
1. **Hero / Home** — identidad visual, full-bleed, tipografía bold, transiciones limpias
2. **Buscador** — filtros rápidos, compare tray, paginación suave
3. **Ficha de moto** — datos técnicos, spec-sheet, rating comunidad
4. **Comunidad / Reviews** — landing, reviews públicas, reacciones (Útil/No útil/Reportar)
5. **Cuenta** — garaje personal, seguimiento de reviews propias, estados
6. **Admin / Moderación** — panel sobrio, filtros, acciones sobre reviews y reportes

### 10.3 Estilo de vídeo
- **Premium**: transiciones cuidadas, timing pausado
- **Técnico**: mostrar datos, filtros, interacciones precisas
- **Cinematográfico**: hero full-width, gradientes, tipografía grande
- **Limpio**: sin overlays de interfaz ruidosos, sin animaciones gratuitas
- **Sin parecer dashboard empresarial**: el admin debe verse premium, no corporativo

### 10.4 Qué evitar
- Overlays de texto excesivos que oculten la héro imagen
- Transiciones rápidas o llamativas
- Mostrar estados de error o loading como foco principal
- Interfaz sobrecargada con elementos decorativos innecesarios
- Paleta de colores que se desvíe del dark premium con racing red

--- 

*Este documento debe tratarse como fuente de verdad para el diseño visual de MotoAtlas. Cualquier discrepancia con el código debe ser reportada y corregida en este documento o en el código, según corresponda.*