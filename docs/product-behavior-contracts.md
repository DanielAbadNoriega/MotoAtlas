# MotoAtlas — Contratos de comportamiento de producto

Contratos de comportamiento ya definidos. Si una futura atomización, refactor o reutilización los contradice, es regressión — no mejora.

---

## 1. Reviews destacadas

**Contrato:**
- `Reviews destacadas` representa utilidad comunitaria.
- Criterio principal: votos útiles / `helpfulCount`.
- Desempates: rating, comentario/fecha según implementación actual.
- Kilómetros declarados NO son criterio principal.
- Si no hay votos útiles, usar fallback razonable.
- Deduplicar dentro del bloque por `motorcycleId` si hay alternativas.
- No deduplicar contra `Últimos reportes`.
- No deduplicar contra `Garaje de la comunidad`.

**Tests obligatorios:**
- prioriza `helpfulCount`.
- una review con más km no gana si tiene menos útiles.
- fallback sin útiles.
- no repite moto si hay alternativas.
- no afecta garaje.

---

## 2. Últimos reportes

**Contrato:**
- Bloque cronológico.
- Orden principal: fecha descendente.
- No usa `helpfulCount`.
- Deduplicar dentro del bloque por `motorcycleId` si hay alternativas.
- No deduplicar contra `Reviews destacadas`.
- No deduplicar contra garaje.

**Tests obligatorios:**
- orden fecha desc.
- no usa votos útiles como criterio principal.
- no repite moto si hay alternativas.
- no afecta garaje.

---

## 3. Garaje de comunidad

**Contrato:**
- Es sección exploratoria completa.
- Agrupa todas las reviews `approved` por `motorcycleId`.
- No excluye reviews por aparecer en bloques editoriales.
- Filtros solo afectan al garaje.
- Paginación después de filtros.
- Usa `MotorcycleGarageCard`.
- `MotorcycleGarageCard` es presentacional y no hace fetch.

**Tests obligatorios:**
- agrupa todas las reviews aprobadas.
- filtros solo afectan al garaje.
- editoriales no dependen de filtros.
- no muestra `pending`, `hidden` o `rejected`.

---

## 4. Confidence / confianza

**Contrato:**
- Se calcula por volumen absoluto de reviews.
- `>=10` reviews → Alta.
- `>=3` reviews → Media.
- `<3` reviews → Baja.
- No usar percentiles ni comparación relativa.
- Visual: shield con tooltip.
- Producción/dev deben respetar `reviewSourcePolicy`.

**Tests obligatorios:**
- 10 es Alta.
- 3 es Media.
- 2 es Baja.
- no cambia por volumen máximo de otra moto.
- shield/tooltip visible cuando corresponde.

---

## 5. Rating vs score

**Contrato:**
- Rating de reviews:
  - escala /5.
  - usa estrella.
  - representa valoración de usuarios.
- Score de rankings:
  - escala 0–10.
  - usa icono `analytics`.
  - representa índice técnico/comunitario.
- No mezclar iconos ni escalas.

**Tests obligatorios:**
- rating /5 con estrella en cards de review.
- score 0–10 con `analytics` en rankings.
- no mostrar score de ranking como estrellas.

---

## 6. FeaturedReviewCard

**Contrato:**
- Se reutiliza en dos modos:
  - **Modo interactivo** en `#/comunidad/reviews` (`Reviews destacadas` y `Últimos reportes`), con acciones comunitarias reales conectadas desde la página contenedora.
  - **Modo visual** en `TopRatedMotorcyclesPage` (`#/comunidad` y `#/motos-mejor-valoradas`, bloque `Reviews recientes`), sin `actionsSlot`, sin `reportContentSlot` y sin wiring de replies.
- No sustituye globalmente a `AccountReviewCard`.
- Debe mantener imagen visible de la moto.
- Header siempre visible:
  - título
  - metadatos
  - rating
  - trigger de apertura/cierre
- Body desplegable:
  - comentario completo
  - pros completos
  - contras completos
  - `ReviewAspectSummary` si hay aspectos.
- Footer siempre visible:
  - CTAs `Ver ficha` y `Más reviews`.
- En **modo interactivo**:
  - mostrar acciones comunitarias reales (Helpful, NotHelpful, Report, Reply) cuando haya infraestructura real.
  - mostrar chip `Propia` si es review propia.
- En **modo visual**:
  - no renderizar acciones comunitarias falsas ni botones sin lógica real.
- Pros/contras no usan tooltip; se muestran completos dentro del body.
- El header actúa como trigger accesible:
  - `aria-expanded`
  - `aria-controls`
  - chevron Material Symbols.

**Tests obligatorios:**
- body cerrado por defecto.
- header abre/cierra body.
- renderiza comentario completo.
- renderiza pros/contras si tienen contenido real.
- no renderiza pros/contras vacíos, `"null"` o `"undefined"`.
- renderiza `ReviewAspectSummary` si hay aspectos.
- mantiene imagen visible.
- mantiene CTAs.
- en modo visual (TopRated RecentReviews): no renderiza acciones comunitarias falsas y no muestra texto literal `null`/`undefined`.

---

## 7. Acciones comunitarias en reviews

**Contrato:**
- Una review debe poder identificar si es del usuario actual.
- Si es propia:
  - mostrar chip `Propia` cuando la UI lo soporte.
  - el chip va en la zona de acciones, no en el header.
  - usa icono `block`.
  - es pasivo, no botón.
  - no permitir útil.
  - no permitir no útil.
  - no permitir reportar.
  - no permitir responder.
  - nunca llamar servicios de interacción.
- Si no hay sesión:
  - no llamar servicios con auth incompleto.
  - no dejar botones clicables sin efecto.
  - en `#/comunidad/reviews`, no renderizar acciones comunitarias interactivas (Helpful/NotHelpful/Report/Reply) para evitar no-op silencioso.
- Útil y No útil:
  - mutuamente excluyentes.
  - pending bloquea doble click.
- Reportar:
  - no propia.
  - no doble reporte.
  - formulario real.
  - submit con servicio real.
  - al reportar exitosamente, limpiar reacción previa del usuario (`clearMyReviewReaction`).
  - si devuelve duplicado (`"Ya has reportado esta review."`), mantener estado reportado y aplicar cleanup de reacción.
- Estado reportada / bloqueo:
  - `isBlocked` debe derivarse de estado real de reportes (`reportedReviewIds`), no hardcode.
  - si la review ya está reportada por el usuario actual, bloquear Helpful/NotHelpful.
  - tras reportar, no permitir nuevas reacciones sobre esa review.
- Respuestas:
  - integradas con servicio real en `#/comunidad/reviews`.
  - lazy loading por review (no carga todas de golpe, no recarga ya cargadas).
  - filtro: approved visibles, pending propias con badge, no hidden/rejected/pending de otros.
  - submit usa `profile?.displayName`.
  - nota futura: si hay muchas respuestas, valorar minipaginación/límite interno.

**Regla obligatoria:**
- No dejar acciones clicables con handlers no-op.
- Si no hay handler real:
  - no renderizar la acción.
  - o renderizarla claramente deshabilitada con motivo accesible.

**Tests obligatorios:**
- ownership.
- chip `Propia`.
- no autoreacción.
- no autoreporte.
- no handler no-op.
- útil/no útil excluyentes.
- reportar una sola vez.
- reportar limpia reacción previa.
- review reportada bloquea Helpful/NotHelpful.
- branch duplicado (`"Ya has reportado esta review."`) con comportamiento consistente.
- pending disabled.
- no texto literal `null`/`undefined`.

---

## 8. ReviewCommunityActions

**Contrato:**
- Componentes reutilizables extraídos de `MotorcycleCommunityPage`.
- Ubicación: `src/components/reviews/ReviewCommunityActions/`
- Componentes:
  - `HelpfulReviewAction`
  - `NotHelpfulReviewAction`
  - `ReportReviewAction`
  - `ReviewReportForm`
  - `ReviewReplySection`
  - `ReplyConvivenceNotice`
- Son componentes controlados por props.
- No hacen fetch directo.
- No gestionan auth por sí mismos.
- La lógica de negocio vive en la página contenedora.
- `ReviewReplySection` tiene prop `inline?: boolean`. Cuando `inline=true`, el trigger "Responder" se renderiza como hijo directo del slot que lo contiene (ej: `.featured-review-card__actions`) y el contenido expandido (lista/form/toast) queda en `.motorcycle-community__replies`. Sin `inline` (valor por defecto), todo queda envuelto en `.motorcycle-community__replies`.

**Tests obligatorios:**
- render según props.
- callbacks reales.
- pending/disabled.
- accesibilidad.
- sin fetch interno.

---

## 9. Componentes presentacionales

**Contrato:**
- Cards reutilizables como `FeaturedReviewCard` o `MotorcycleGarageCard` deben ser presentacionales.
- No hacen fetch.
- No leen auth.
- No llaman servicios.
- Reciben props/slots.
- La página contenedora controla estado, auth y handlers.

**Tests obligatorios:**
- componente renderiza props.
- contenedor conecta handlers reales.
- no hay fetch en componente presentacional.

---

## 10. Source policy de reviews

**Contrato:**
- Producción solo muestra `source=user`.
- Dev/pre puede mostrar `user + seed + mock`.
- Producción nunca muestra `seed` ni `mock`, aunque haya toggle.
- Los servicios públicos deben usar `reviewSourcePolicy`.

**Tests obligatorios:**
- prod → solo user.
- dev/pre demo on → user, seed, mock.
- dev/pre demo off → user.

---

## 11. SCSS y tokens

**Contrato:**
- No inventar variables SCSS en componentes.
- Usar variables/tokens existentes.
- Antes de usar una variable nueva, buscar equivalente existente.
- Si realmente hace falta un token nuevo, añadirlo al archivo global de variables/tokens y justificarlo.
- No dejar variables no definidas como `$color-tertiary`, `$color-surface-hover`, etc.

**Tests/revisión obligatoria:**
- no hay variables no definidas.
- no hay tokens inventados locales.
- imports SCSS correctos.
- typecheck/test clean.

---

## 12. Regla anti-regresión al atomizar

Antes de extraer o reutilizar un comportamiento:

1. Identificar reglas de ownership.
2. Identificar auth/no auth.
3. Identificar pending states.
4. Identificar servicios reales.
5. Eliminar handlers no-op.
6. Añadir tests de contrato.
7. Ejecutar:
   - `npm run typecheck`
   - `npm run test`

---

## Referencias

- Contratos de producto: `docs/product-behavior-contracts.md` (este archivo)
- Estrategia de testing: `docs/testing-strategy.md`
- Reglas Codex/Copilot: `docs/codex-guidelines.md`
- Notas UI: `docs/ui-notes.md`
- Estado actual: `docs/current-state.md`
