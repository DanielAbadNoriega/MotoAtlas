# MotoAtlas — Product Roadmap

## 1. Propósito del documento

- Este documento **no sustituye Trello**.
- **Trello** se usa para gestión operativa diaria (ejecución y seguimiento).
- Este roadmap en Markdown es la **fuente estratégica dentro del repositorio**.
- Toda idea importante detectada en conversaciones puede registrarse aquí antes de convertirse en tarea operativa.

## 2. Estado base actual

Implementado (baseline actual):
- Fase A P1: helpers puros `reviewCommunityActions.ts`.
- Fase B P1: `useReviewReports`.
- Fase C P1: `useReviewReactions`.
- `FeaturedReviewCard` reutilizada en comunidad y modo visual.
- `MotorcycleGarageCard` extraída.
- `Útil N` como contador público visible siempre.
- Tests de referencia: `980 passed`.
- Typecheck: clean.

## 3. Foco inmediato recomendado

1. Rediseñar `Insights en vivo`.
2. Reutilizar `MotorcycleGarageCard` en `#/buscador`.
3. Planificar atomización de filtros reutilizables.

## 4. P1 — UX pública / comunidad

### Insights en vivo

Objetivo: convertirlo en un bloque de descubrimiento comunitario.

Pendiente (cambios propuestos):
- Quitar:
  - review con más kilómetros.
  - rating medio global.
- Usar:
  - moto más comentada.
  - review más útil.
  - segmento más activo.
  - uso más activo.
- Mantener formato de lectura rápida de actividad comunitaria.

### MotorcycleGarageCard en buscador

Pendiente (con validación previa):
- Auditar props antes de reemplazar.
- Posibles CTAs:
  - Ver ficha.
  - Comparar.
  - Añadir al comparador.
- No hacer reemplazo bruto sin revisar impacto en UX y datos.

## 5. P1/P2 — Sistema de filtros reutilizable

Estado: pendiente.

- Los filtros actuales son prototipo/de prueba.
- Objetivo: crear un sistema flexible y atomizado.
- Componentes candidatos:
  - `FilterPanel`
  - `FilterGroup`
  - `FilterOption`
  - `FilterChip`
  - `ActiveFiltersBar`
  - `MobileFilterDrawer`
  - `FilterApplyFooter`
- Separar:
  - UI de filtros.
  - lógica de filtrado por dominio.
- Lógica por dominio:
  - `motorcycleSearchFilters`
  - `communityReviewFilters`
  - `adminReportFilters`
  - `accountReviewFilters`
- Resultado esperado: crecimiento sin duplicar UI por página.

## 6. P2 — Admin catálogo / productividad interna

Estado: pendiente.

Objetivo: evitar edición manual de JSON.

Alcance propuesto:
- listado de motos
- búsqueda/filtros
- edición de datos técnicos
- edición de sources
- estado de completitud
- `image_locked` / `description_locked`
- validaciones

## 7. P2 — Admin imágenes y tareas

Estado: pendiente.

Alcance propuesto:
- subida/gestión de fotos de modelos
- previsualización
- marcar imagen como manual
- bloquear imagen
- lanzar tareas de mantenimiento desde admin

Riesgo/nota crítica:
- El frontend **NO** ejecuta scripts con claves sensibles.
- El admin debe llamar a backend/edge functions protegidas.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY`.

## 8. P3 — Noticias / contenido editorial

Estado: pendiente.

Primera fase:
- artículos manuales escritos por el usuario
- basados en reviews externas, pruebas vistas y tendencias

Futuro:
- artículos asistidos por IA
- basados en reviews reales de MotoAtlas

Ejemplos de piezas:
- “Lo que más se repite sobre la F 900 GS”.
- “Puntos fuertes y débiles de la Tracer 9 según propietarios”.

## 9. P4 — IA futura

Estado: pendiente.

Rol esperado de IA:
- moderador asistido
- extractor de datos
- generador de insights
- futuro generador de artículos

Lineamientos:
- proveedor externo por API
- capa propia desacoplada
- `MockProvider` inicial
- salida JSON estructurada
- revisión humana obligatoria

No hacer:
- no llamar a IA desde frontend
- no acoplarse a un proveedor concreto

Arquitectura futura posible:
- `AiProvider`
- `MockProvider`
- `GeminiProvider` / `OpenAIProvider` / `MistralProvider`
- `aiModerationService`
- Supabase Edge Function protegida

## 10. P3/P4 — Revisión global UI/SCSS

Estado: pendiente.

Al cerrar funcionalidades principales:
- auditar CSS muerto
- revisar clases acopladas
- revisar componentes reutilizables
- revisar cards, chips, actions, filtros, formularios y layouts
- convertir patrones repetidos en componentes/mixins/placeholders

## 11. Riesgos y deuda conocida

- flaky test aislado en `AdminPage`.
- doble toggle en el mismo tick sin test explícito dedicado.
- hidratación silenciosa de reportes.
- literal de reporte duplicado.
- filtros actuales todavía no atomizados.
- futura ejecución de scripts desde admin requiere backend seguro.

## 12. Qué NO hacer todavía

- No implementar IA real todavía.
- No ejecutar scripts desde frontend.
- No rehacer todos los filtros antes de cerrar insights si bloquea avance.
- No atomizar replies ahora.
- No automatizar noticias hasta tener datos suficientes.
- No exponer `service role key` en frontend.

## 13. Relación con Trello

- Trello = tablero operativo.
- Este documento = fuente estratégica del repositorio.
- Cuando una idea pase a ejecución, crear tarjeta en Trello.
- Si una idea surge en conversación pero aún no toca ejecutarla, documentarla aquí para no perder contexto.
