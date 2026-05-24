# MotoAtlas — Design System

Documento vivo de diseño. Sirve como referencia unificada para IA, diseño,
implementación y generación futura de vídeos/demos.

> Complementa a `AGENTS.md`. No lo sustituye.

---

## 1. Identidad visual

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

---

## 2. Tokens de diseño

### 2.1 Paleta de color

#### Superficies (dark mode fijo)

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-surface-dim` | `#141313` | Fondo general de página |
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

#### Acento (Racing Red)

| Token | Hex | Uso |
|-------|-----|-----|
| `$color-accent` | `#e31837` | Acciones principales, CTAs, highlights, redline |
| `$color-accent-container` | `#d6042f` | Fondos de acción, badges |
| `$color-accent-dark` | `#92001d` | Hover de acciones destructivas |
| `$color-accent-soft` | `rgba(227,24,55,0.12)` | Fondos sutiles de acento |

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

### 2.2 Tipografía

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

### 2.3 Espaciado

| Token | Valor |
|-------|-------|
| Base | 8px |
| Gutter | 24px |
| Section gap (desktop) | 120px |
| Section gap (tablet) | 88px |
| Section gap (mobile) | 60px |
| Margin desktop | 80px |
| Margin tablet | 40px |
| Margin mobile | 20px |

### 2.4 Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `$radius-sm` | 2px | Chips técnicos, etiquetas |
| `$radius-md` | 4px | Botones, inputs |
| `$radius-lg` | 8px | Cards, contenedores medianos |
| `$radius-xl` | 12px | Cards grandes, estados vacíos, heroes |

> Filosofía: radios agresivos y arquitectónicos (precision-cut). Nada «bubbly».

### 2.5 Sombras

| Token | Valor |
|-------|-------|
| `$shadow-card` | `0 18px 48px rgba(0,0,0,0.32)` |
| `$shadow-glass` | `0 18px 60px rgba(0,0,0,0.45)` |
| `$shadow-accent` | `0 0 0 1px rgba(227,24,55,0.26), 0 18px 48px rgba(146,0,29,0.18)` |

### 2.6 Transiciones

| Token | Valor |
|-------|-------|
| `$transition-fast` | 160ms ease |
| `$transition-base` | 240ms ease |
| `$transition-slow` | 500ms ease |

### 2.7 Breakpoints

| Token | Valor |
|-------|-------|
| Mobile | ≤ 767px |
| Tablet | ≤ 1023px |
| Desktop | ≤ 1200px |
| Max-width contenedor | 1440px |

---

## 3. Layout

- **Desktop**: contenido centrado, max-width 1440px. Side margins 80px. Sidebar + main column donde aplica (cuenta, admin).
- **Tablet**: margins 40px. Sidebar se colapsa a panel responsive (drawer/sheet).
- **Mobile**: margins 20px. Todo apila verticalmente.
- **Hero**: full-width, sin constraint de container. Imagen como background con overlay degradado.
- **Grid real**: no existe un grid CSS abstracto. El layout se maneja con CSS Grid casos-por-caso (dashboard sidebar/main, listados, etc.).

---

## 4. Componentes

### 4.1 Heroes

Dos variantes:

- **`CommunityHero`** (componente React en `src/components/ui/CommunityHero/`): imagen, eyebrow, título, descripción, acciones. Usado en landing comunidad, top-rated.
- **`motorcycle-community__hero`** (clases SCSS, markup directo): usado en páginas con hero de moto (comunidad por moto, admin, cuenta). Sin componente React wrapper. Misma estructura visual: `hero-media` (imagen), `hero-content` (eyebrow + título + rating/estado), `hero-actions`.

Regla: `eyebrow` en `label-caps`, color `$color-accent`. Título en `headline-xl`. Imagen con `filter: grayscale(0.32) contrast(1.1) opacity(0.64)`.

### 4.2 Filtros

Patrón único cross-page. Estructura:

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

Variantes de option: `--pill` (chips), `--rating` (estrellas), `--sort` (orden).

En desktop viven en sidebar. En mobile son sheet/drawer con backdrop.

Archivos SCSS de referencia: `AdminPage.scss`, `AccountReviewsPage.scss`, `MotorcycleCommunityPage.scss`.

### 4.3 Cards de review (públicas)

**`AccountReviewCard`** (reutilizado en cuenta y comunidad):
- Imagen izquierda
- Título + rating en cabecera
- Metadatos con iconos (estilo conducción, meses, km, fecha)
- Acciones inferiores
- Enlace secundario «Más reviews»
- Variante `community`: alias público, oculta estado, metadatos completos
- Variante `communityCompact`: 2 items por sección, mayor densidad

Archivos: `src/components/reviews/AccountReviewCard/`.

### 4.4 Cards de review (admin)

- Misma base visual, con expansión accordion
- Header: username + verified badge + status pill + source badge + rating + metadata
- Chevron `expand_more` decorativo con rotación 180deg
- Expansión: comentario, pros/contras, acciones admin (Aprobar/Ocultar/Rechazar)
- Trigger accesible con `aria-expanded` + `aria-controls`
- Estados: `pending` (Pendiente), `approved` (Publicada), `rejected` (Rechazada), `hidden` (Oculta)

Archivos: `src/components/pages/AdminMotorcycleReviewsPage/`.

### 4.5 Paginación

**`AccountPagination`** en `src/components/pages/AccountPage/`:
- `aria-current="page"` en página activa
- Botones: `<<` `<` páginas `>` `>>`
- Disabled en extremos
- Ventana de 5 páginas visibles
- Iconos Material Symbols

### 4.6 Badges / Pills

- `admin-page__status-pill` (estados de review/reporte)
- `admin-page__status-pill--review` con `data-status`
- `admin-moto-reviews__verified-badge` (verificada/no verificada)
- `admin-moto-reviews__source-badge` (origen de review)
- Labels en `label-caps` (JetBrains Mono, 12px, uppercase, letter-spacing)

### 4.7 Botones

- `.button` (componente `src/components/ui/Button/`)
- `.button--ghost` (borde fino, transparente)
- `.account-page__button` (botón primario cuenta/admin)
- `.admin-page__action-button` con modificadores: `--approve` (verde), `--hide` (gris), `--reject` (rojo)

### 4.8 Inputs

- Fondo `#000000` (surface-lowest)
- Borde 1px solid `$color-outline-variant`
- Placeholder en JetBrains Mono (señal «data-entry»)

### 4.9 Quick Links

En `src/components/ui/`:
- `BikeCard` — card de moto para listados
- `RouteCard` — card de ruta
- `NewsCard` — card de noticia
- `ReportCard` — card de reporte (admin)
- `ReportCtaCard` — CTA para reportar

### 4.10 Listados compactos / Rows

- Review rows en admin: `admin-motorcycle-reviews-page__review-card` con `data-row-tone="even|odd"` para alternating.
- Garaje agrupado: cards por `motorcycleId` con imagen, métricas, CTAs.

---

## 5. Patrones por zona

### 5.1 Home (`#/`)
- Hero full-width con imagen, título principal, CTA
- Bloques de contenido editorial: secciones con `SectionHeader`
- Cards de moto, rutas, noticias

### 5.2 Buscador (`#/buscador`)
- Listado paginado (9 motos/página)
- Filtros (segmento, carnet) — mismo patrón que comunidad
- Compare tray con 3 slots

### 5.3 Comunidad

| Ruta | Patrón |
|------|--------|
| `#/comunidad` | Hero + Podium + Trending + Comunidades activas + Reviews recientes + CTAs |
| `#/comunidad/reviews` | Hero + bloques editoriales (Destacadas, Últimos reportes, Insights) + Garaje filtrable |
| `#/comunidad/[motorcycleId]` | Hero moto + listado compacto reviews aprobadas + sidebar filtros + reacciones |

**Reacciones públicas**: `Útil N` (contador), `No útil` (sin contador), `Reportar`. Mutuamente excluyentes. No auto-reacción.

### 5.4 Cuenta (`#/cuenta`)

| Ruta | Patrón |
|------|--------|
| `#/cuenta` | Dashboard + Mis reviews (garaje compacto, últimas 3) |
| `#/cuenta/reviews` | Garaje filtrable agrupado por moto |
| `#/cuenta/reviews/[motorcycleId]` | Hero moto + listado reviews propias + sidebar cuenta + filtros rating/orden |

Sidebar de cuenta con: perfil, links de navegación, notice/bloque informativo.

### 5.5 Admin

Ver sección 6.

### 5.6 Reviews (global)

- `pending` → Pendiente
- `approved` → Publicada
- `rejected` → Rechazada
- `hidden` → Oculta
- No renderizar `null`. Pros/contras `null` o vacíos no se renderizan.

---

## 6. Reglas de Admin

### 6.1 Estética

- Admin NO es un dashboard empresarial genérico
- Misma identidad premium: dark mode, racing red, tipografía técnica
- Funcional y sobria — sin adornos innecesarios
- Reutiliza layout de cuenta (sidebar/main) cuando aplica

### 6.2 Rutas

| Ruta | Contenido |
|------|-----------|
| `#/admin` | Panel con accesos rápidos y resúmenes |
| `#/admin/moderacion` | Reportes de reviews paginados con filtros |
| `#/admin/reviews` | Garaje admin: reviews agrupadas por modelo |
| `#/admin/reviews/[motorcycleId]` | Reviews de una moto con filtros y acciones |

### 6.3 Estados de reporte

| Backend | UI |
|---------|-----|
| `pending` | Pendiente |
| `reviewed` | Revisado |
| `dismissed` | Descartado |
| `action_taken` | **Resuelto** |

### 6.4 Acciones sobre review (desde moderación)

Si se modifica la review → el reporte pasa a `action_taken`.

### 6.5 Reglas visuales

- Distinguir estados con badges claros (pills con color por estado)
- Acciones con hover por intención: azul (revisar), rojo (descartar/rechazar), verde (aprobar/resolver), gris (ocultar)
- `admin-page__action-group` para agrupar acciones

---

## 7. Reglas para generar nuevas pantallas

1. **Reutilizar patrones existentes** antes de crear nuevos. Buscar en `docs/ui-notes.md` y en componentes existentes.
2. **No crear estilos visuales aislados**. Los nuevos componentes deben usar variables SCSS existentes y seguir la convención BEM del proyecto.
3. **Mantener contraste**. Dark mode fijo, texto claro sobre fondo oscuro. Verificar ratio 4.5:1 para texto normal.
4. **Cuidar responsive**. Margenes: 80px → 40px → 20px. Section gap: 120px → 88px → 60px.
5. **Filtros**: siempre usar el patrón existente (header/body/footer, chips, Material Symbols, sheet/drawer mobile). No crear variantes.
6. **Paginación**: siempre usar `AccountPagination`. No crear paginadores nuevos.
7. **Hero**: siempre full-width con imagen overlay o `CommunityHero`. No crear heroes inline sin fondo.
8. **Cards de review**: siempre `AccountReviewCard` o el patrón de admin expandible. No crear cards review custom aisladas.
9. **Tipografía**: usar los mixins existentes (`headline-xl`, `label-caps`, etc.). No declarar font-size sueltos.

---

## 8. Guía para vídeos / demos

### 8.1 Qué debe comunicar MotoAtlas

- Es una plataforma **premium y técnica** para moteros exigentes
- No es «otra red social de motos» — es una herramienta de decisión informada
- Comunidad real con reviews verificadas
- Transparencia: metodología clara, fuentes de datos declaradas

### 8.2 Secuencia recomendada

1. **Hero / Home** — identidad visual, full-bleed, tipografía bold, transiciones limpias
2. **Buscador** — filtros rápidos, compare tray, paginación suave
3. **Ficha de moto** — datos técnicos, spec-sheet, rating comunidad
4. **Comunidad / Reviews** — landing, reviews públicas, reacciones (Útil/No útil/Reportar)
5. **Cuenta** — garaje personal, seguimiento de reviews propias, estados
6. **Admin / Moderación** — panel sobrio, filtros, acciones sobre reviews y reportes

### 8.3 Estilo de vídeo

- **Premium**: transiciones cuidadas, timing pausado
- **Técnico**: mostrar datos, filtros, interacciones precisas
- **Cinematográfico**: hero full-width, gradientes, tipografía grande
- **Limpio**: sin overlays de interfaz ruidosos, sin animaciones gratuitas
- **Sin parecer dashboard empresarial**: el admin debe verse premium, no corporativo

---

## 9. Actualización del documento

`DESIGN.md` debe actualizarse cuando se añadan:
- Nuevos patrones visuales relevantes (no bugs ni tweaks menores)
- Nuevos componentes reutilizables
- Cambios en tokens de diseño
- Nuevas zonas o rutas con layout propio

No actualizar por:
- Cambios de contenido
- Correcciones de bugs
- Refactors internos sin impacto visual

Este documento no sustituye a `AGENTS.md`. `AGENTS.md` tiene las reglas de
ejecución (qué no tocar, cómo testear, rutas protegidas). `DESIGN.md` tiene
el «cómo se ve y por qué».
