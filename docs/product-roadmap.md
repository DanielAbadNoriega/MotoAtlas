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
4. Revisar y cerrar taxonomía de categorías/segmentos de motos como base de catálogo.

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

- Dependencia crítica previa: cierre de taxonomía de segmentos de motos (evitar filtros ambiguos o duplicados).
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

### Tarea P1/P2 — Quick specs avanzadas en ficha de moto

Estado: backlog estratégico / futuro cercano.

Objetivo:
Mejorar `bike-detail__quick-specs` en `#/motos/[moto-id]` para mostrar specs técnicas de forma más visual, modular y escalable.

Zonas relacionadas:
- `src/components/pages/BikeDetailPage/BikeDetailPage.tsx`
- estilos de `BikeDetailPage`
- `ReviewModal` como referencia visual (`.review-modal__aspect-card`)
- posible componente compartido de specs técnicas
- posible mixin/placeholder SCSS común

Alcance visual:
- usar tarjetas técnicas similares a las aspect cards del modal
- evitar copiar CSS de modal directamente
- valorar extracción de componente común:
  - `TechnicalSpecCard`
  - `SpecCard`
  - u otro nombre coherente
- valorar extracción de SCSS común si aplica

Specs a contemplar:
- cilindrada
- potencia
- par
- peso
- altura asiento
- depósito
- precio
- carnet/A2
- quickshifter
- suspensiones
- frenos
- electrónica
- neumáticos
- equipamiento

Reglas:
- no ampliar schema/modelo `Bike` en esta tarea salvo decisión explícita
- si faltan campos, documentar dependencia del futuro Admin catálogo/modelos
- no renderizar `null`/`undefined`
- no crear CSS duplicado acoplado a `ReviewModal`
- mantener accesibilidad

Relación con roadmap:
- conecta con revisión futura UI/SCSS
- conecta con Admin catálogo/modelos
- conecta con datos técnicos avanzados
- puede alimentar mejores fichas, comparador y SEO técnico

## 6. P2 — Plataforma/Admin/Productividad interna

Este bloque agrupa herramientas internas y bases de plataforma necesarias para escalar MotoAtlas sin depender de edición manual.

### Tarea transversal: Taxonomía de segmentos de motos

Estado: en desarrollo / pendiente de auditoría y cierre.

Objetivo:
Cerrar una taxonomía clara de segmentos para que el catálogo sea coherente y escalable.

Categorías esperadas:
- trail
- adventure
- touring
- sport-touring
- naked
- sport
- supersport
- hypernaked
- enduro
- dual-sport
- scrambler
- custom
- cruiser
- retro
- neo-retro
- scooter

Zonas a revisar:
- `supabase/schema.sql`
- `src/shared/motorcycles/motorcycleTaxonomy.ts`
- `src/types/bike.ts`
- `src/features/import/*`
- `scripts/importMotorcycles.ts`
- `src/utils/motorcycleSearch.ts`
- `data/import/motorcycles.json`
- filtros del buscador
- cards/ficha/comparador donde se renderiza segmento

Comprobar:
- no duplicados ambiguos
- labels visibles claros
- iconos coherentes
- filtros funcionando
- mobile sin saturación
- motos actuales bien clasificadas
- schema/TS/importador/UI sincronizados

Resultado esperado:
- taxonomía documentada
- fuente de verdad clara
- preparada para buscador, filtros, comparador, SEO, rankings y landings

Relación con roadmap:
- dependencia del sistema de filtros reutilizable
- dependencia del futuro admin catálogo/modelos
- base para futuras landings SEO por categoría
- debe cerrarse antes de ampliar fuerte el catálogo

### Admin catálogo de modelos

Estado: pendiente.

Objetivo: evitar edición manual de JSON.

Alcance propuesto:
- listado de motos
- búsqueda/filtros
- creación/edición de modelos
- edición de datos técnicos
- edición de fuentes/source
- estado de completitud
- `image_locked` / `description_locked`
- validaciones

### Admin imágenes de modelos

Estado: pendiente.

Alcance propuesto:
- subida/gestión de fotos
- previsualización
- marcar imagen como manual
- bloquear imagen
- normalización/sync mediante backend o edge functions protegidas

Reglas críticas:
- El frontend **NO** ejecuta scripts con claves sensibles.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY`.

### Admin tareas internas seguras

Estado: pendiente.

Alcance propuesto:
- validación de datos incompletos
- dry-run de importaciones/sync
- ejecución de tareas de mantenimiento desde backend protegido
- mostrar resultados en UI admin

### Auth baseline y cuentas de usuario

Estado: parcialmente implementado / pendiente de auditoría de cierre.

Objetivo:
Consolidar autenticación para que reviews, solicitudes de modelos y acciones comunitarias queden asociadas a usuarios reales cuando exista sesión.

Base actual verificada:
- Supabase Auth.
- Login / registro / logout.
- sesión persistente con `AuthProvider` / `useAuth`.
- perfil básico (`profile`).
- rol admin (`isAdmin`).
- rutas `#/login` y `#/registro`.
- admin protegido por sesión + rol.

Pendiente de auditoría:
- verificar que reviews autenticadas guardan `user_id`.
- verificar que solicitudes de modelo pueden asociarse a usuario autenticado.
- verificar que acciones comunitarias usan auth real.
- revisar contrato usuario anónimo vs autenticado.
- confirmar roles `user/admin`.
- confirmar cobertura de tests.

### Control de datos demo por entorno

Estado:
- source policy central: implementada/documentada.
- toggle admin: pendiente futuro.

Contrato:
- producción solo puede mostrar `source='user'`.
- producción nunca debe mostrar `source='seed'` ni `source='mock'`.
- dev/pre con demo activado puede mostrar `source='user'`, `source='seed'`, `source='mock'`.
- dev/pre con demo desactivado debe mostrar solo `source='user'`.

Definiciones:
- `source='user'`: datos reales creados por usuarios.
- `source='seed'`: datos demo controlados insertados mediante SQL.
- `source='mock'`: datos generados desde código/JSON mock.

Reglas:
- la lógica debe permanecer centralizada.
- no duplicar filtros de source en componentes.
- las vistas públicas deben seguir usando solo `status='approved'`.
- `pending`, `hidden` y `rejected` no deben aparecer en vistas públicas.
- cuenta/admin/moderación pueden tener reglas distintas si el contrato lo exige.

Pendiente futuro:
- crear toggle admin “Incluir datos demo”.
- visible solo en dev/pre.
- en producción no visible o sin efecto.
- nunca exponer datos mock/seed en producción pública.

Relación con roadmap:
- conecta con generador de reviews mock realistas.
- conecta con validación visual/maquetación.
- conecta con datos demo seguros.
- conecta con admin/productividad interna.

## 7. P2 — Datos demo / QA visual

### Mejorar generador de reviews mock realistas

Estado:
- pendiente / backlog técnico útil.

Objetivo:
Mejorar el generador de reviews mock para que los datos de prueba parezcan más reales y ayuden a validar maquetación, cards, rankings, garaje, fichas y bloques editoriales de comunidad.

Problema actual (validación de repo):
- el generador actual ya fuerza `pros`/`cons` como arrays y mantiene `source='mock'`, pero la riqueza de contenido todavía es limitada para QA visual exigente;
- hay comentarios cortos o plantillas repetidas en parte del dataset;
- no siempre aparecen combinaciones que estresen la maquetación real (contenido largo/corto, densidad variable, etc.).

Mejoras previstas:
- reducir `pros`/`cons` vacíos en datasets importados o históricos;
- generar comentarios más naturales;
- generar pros/contras coherentes con segmento y tipo de moto;
- ratings variados;
- evitar frases repetidas;
- mantener siempre `source='mock'`;
- permitir limpiar mocks sin tocar reviews reales;
- generar casos variados para validar maquetación:
  - comentarios largos;
  - comentarios cortos;
  - pros/contras múltiples;
  - reviews con aspectos técnicos;
  - variedad de usos: ciudad, viaje, offroad, deportivo, pasajero, diario.

Reglas:
- mantener `source='mock'` en todas las reviews generadas;
- nunca mezclar mocks con `source='user'`;
- la limpieza de mocks no debe afectar reviews reales;
- respetar la política actual de sources por entorno;
- en producción no deben mostrarse datos mock;
- no tocar schema/RLS salvo decisión explícita.

Relación con roadmap:
- ayuda a validar `FeaturedReviewCard`;
- ayuda a validar `MotorcycleGarageCard`;
- ayuda a validar `BikeDetailPage`;
- ayuda a validar rankings y bloques editoriales;
- será útil antes de la revisión global UI/SCSS;
- ayuda a detectar problemas de maquetación antes de tener datos reales suficientes.

Criterios de aceptación futuros:
- mocks siguen marcados como `source='mock'`;
- limpieza de mocks no toca `source='user'`;
- los pros/contras vacíos se reducen notablemente;
- los comentarios tienen variedad suficiente;
- los ratings no son todos iguales;
- hay variedad de segmentos y usos;
- los datos ayudan a probar cards de comunidad, detalle, garaje, rankings y filtros;
- `npm run typecheck` pasa;
- `npm run test` pasa.

## 8. P3/P4 — Capa social futura

Estado: futuro / no implementar dentro del auth baseline.

Objetivo:
Convertir MotoAtlas progresivamente en comunidad con identidad, reputación y actividad social.

Ideas futuras:
- perfiles públicos de usuario
- historial público de reviews
- garaje público o motos favoritas
- seguidores
- notificaciones:
  - respuesta recibida
  - review aprobada/rechazada
  - review marcada como útil
  - actividad en motos seguidas
- gamificación:
  - badges
  - niveles de contribuidor
  - reputación por votos útiles
  - reconocimientos por reviews técnicas completas
  - rankings de colaboradores

Reglas:
- No mezclar capa social con cierre de auth baseline.
- No implementar seguidores/notificaciones/gamificación hasta tener estable:
  - auth baseline
  - reviews asociadas a usuario
  - panel de cuenta
  - moderación
  - contratos de privacidad
- Cuando llegue esta fase, hacer auditoría previa de:
  - privacidad
  - visibilidad de perfiles
  - configuración de notificaciones
  - abuso/spam
  - RGPD/legal

## 9. P3 — Comunidad social / temas por modelo

Estado: backlog estratégico / futuro.

Objetivo:
Crear una capa de discusión abierta por modelo que complemente las reviews estructuradas.

Diferencia de producto:
- Reviews = experiencia estructurada y valorable.
- Temas = conversación abierta, dudas y seguimiento comunitario.

Rutas futuras:
- `#/comunidad/temas` — landing global de temas.
- `#/comunidad/[motorcycleId]` — listado de temas asociados a una moto.
- `#/comunidad/[motorcycleId]/temas/[topicId]` — detalle de tema con respuestas.

Funcionalidades previstas:
1. Crear temas de discusión por modelo.
2. Listar temas en `#/comunidad/[motorcycleId]`.
3. Página detalle de tema con respuestas.
4. Reportar temas y respuestas.
5. Integración con admin de moderación.
6. Landing global `#/comunidad/temas`.

Categorías fijas por modelo:
- Dudas de compra.
- Problemas / averías.
- Mantenimiento.
- Accesorios.
- Neumáticos.
- Rutas / viajes.
- Modificaciones.
- General.

Dependencias recomendadas antes de implementar:
- Auth baseline cerrado.
- Moderación estable.
- Reportes de reviews/respuestas consolidados.
- Admin de moderación preparado.
- Contratos de privacidad definidos.
- Sistema anti-spam básico.

Notas de arquitectura:
- No implementar como foro genérico sin relación con motos.
- Los temas deben estar vinculados a `motorcycleId` cuando correspondan.
- La landing global debe servir para descubrimiento:
  - temas recientes
  - temas populares
  - temas sin responder
  - temas por categoría
- Reportes de temas/respuestas deben reutilizar patrones existentes de reportes/moderación si encajan.
- En el futuro, la IA podría ayudar a:
  - detectar temas duplicados
  - resumir hilos largos
  - extraer problemas comunes
  - alimentar insights por modelo

No implementar ahora:
- seguidores
- notificaciones
- gamificación
- IA real
- sistema completo tipo foro generalista

## 10. P3 — Noticias / contenido editorial

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

## 11. P4 — IA futura

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

## 12. P3/P4 — Revisión global UI/SCSS

Estado: pendiente.

Al cerrar funcionalidades principales:
- auditar CSS muerto
- revisar clases acopladas
- revisar componentes reutilizables
- revisar cards, chips, actions, filtros, formularios y layouts
- convertir patrones repetidos en componentes/mixins/placeholders

## 13. Riesgos y deuda conocida

- flaky test aislado en `AdminPage`.
- doble toggle en el mismo tick sin test explícito dedicado.
- hidratación silenciosa de reportes.
- literal de reporte duplicado.
- filtros actuales todavía no atomizados.
- futura ejecución de scripts desde admin requiere backend seguro.

## 14. Qué NO hacer todavía

- No implementar IA real todavía.
- No ejecutar scripts desde frontend.
- No mezclar cierre de auth baseline con features sociales avanzadas.
- No rehacer todos los filtros antes de cerrar insights si bloquea avance.
- No atomizar replies ahora.
- No automatizar noticias hasta tener datos suficientes.
- No exponer `service role key` en frontend.

## 15. Relación con Trello

- Trello = tablero operativo.
- Este documento = fuente estratégica del repositorio.
- Cuando una idea pase a ejecución, crear tarjeta en Trello.
- Si una idea surge en conversación pero aún no toca ejecutarla, documentarla aquí para no perder contexto.
- Reclasificación aplicada: la tarjeta histórica “Implementar login y cuentas de usuario” queda dentro de **P2 Plataforma/Admin/Productividad interna** como **auth baseline** (parcialmente implementado, pendiente de auditoría de cierre).
- Tarjeta incorporada: “Revisar y cerrar taxonomía de categorías de motos” queda como tarea transversal de **P2 Plataforma/Admin/Productividad interna** y dependencia de filtros/admin/SEO catálogo.
- Tarjeta incorporada: futura funcionalidad “Temas de discusión por modelo” clasificada como **P3 Comunidad social / temas por modelo** (backlog estratégico).
- Tarjeta incorporada: mejora futura de `bike-detail__quick-specs` clasificada como **P1/P2 UX pública + componentes reutilizables**.
- Tarjeta incorporada: “Mejorar generador de reviews mock realistas” clasificada como **P2 Datos demo / QA visual** para soporte de maquetación y validación visual.
- Tarjeta reclasificada: “Controlar datos demo por entorno en comunidad” queda dividida en **source policy implementada** + **toggle admin pendiente P2**.
