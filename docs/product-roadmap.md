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
- Tests de referencia: `1005 passed`.
- Typecheck: clean.

## 3. Foco inmediato recomendado

1. Rediseñar `Updates en vivo`.
2. Planificar atomización de filtros reutilizables.
3. Revisar y cerrar taxonomía de categorías/segmentos de motos como base de catálogo.

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

### Home — Reemplazo de `FeaturedBikes` / `BikeCard` (legacy temporal)

Estado: backlog UI/SCSS (futuro cercano).

Objetivo:
- sustituir la sección legacy de Home (`FeaturedBikes` + `BikeCard`) por un patrón de podio/cards alineado con `#/comunidad` y `#/comunidad/rankings`.

Notas:
- hoy `BikeCard` se usa de forma efectiva vía `FeaturedBikes` en Home;
- el guardrail de label amigable queda vigente mientras exista el componente;
- `BikeCard` no debería seguir evolucionándose salvo mantenimiento mínimo hasta su retirada.

### Paridad visual de Podium rankings (`#/comunidad` vs `#/comunidad/rankings`)

Estado: implementado / cerrado.

Objetivo:
- alinear contenido entre ambos podios para evitar drift visual/semántico.

Aplicado:
- en `#/comunidad`, las podium cards 2 y 3 ya muestran el mismo span de metadatos que `#/comunidad/rankings` (`año · segmento · cilindrada`).

Nota de contrato actual:
- el metadato actual de podio es `año · segmento · cilindrada (cc)`.
- si en el futuro se quiere cambiar a potencia, debe abrirse como mejora UI separada con decisión explícita de producto.

### MotorcycleGarageCard en buscador

Estado: **implementado / cerrado**.

Implementado:
- `SearchPage` reutiliza `MotorcycleGarageCard` con adaptador local.
- `MotorcycleGarageCard` flexibilizada con `footerActions?: ReactNode`.
- Botón `Comparar/Seleccionada` inyectado desde `SearchPage` dentro de `.motorcycle-garage-card__actions`.
- `MotorcycleGarageCard` sigue presentacional.
- Enlaces `Reviews` y `Ficha` operativos; `Ficha` mantiene `aria-label="Ver ficha técnica"`.
- Acciones compactas con patrón glass local `%motorcycle-garage-card-glass-action`.

Nota residual (señal comunitaria real):
- En buscador, `rating` y `reviewCount` derivan de `fiabilidad`/`reportCount`, no de señal comunitaria real.
- Este dato proviene de specs estáticas del importador, no de reviews aprobadas.
- Si en el futuro se renormalizan estos campos sin contrato de producto, podría generar confusión semántica.
- Queda pendiente como riesgo/no-bloqueante documentado.

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

Estado: cierre por fases en progreso (F0/F1 cerradas; F2 parcialmente aplicada; F3 auditoría cerrada; F3.1 cerrada; F4 pendiente).

Fases de cierre (estado actualizado):
- Fase 0 — Auditoría inicial: **cerrada**.
- Fase 1 — Guardrails/tests de contrato: **cerrada**.
- Fase 2 — Saneo puntual de datos y clasificaciones dudosas: **parcialmente aplicada**.
- Fase 3 — Auditoría de estrategia final de filtros: **cerrada**.
- Fase 3.1 — Formalización de estrategia final (`canónico vs visible`) y criterios de exposición: **cerrada**.
- Fase 4 — Preparación SEO/Admin/landings por categoría: **pendiente**.

Caso aplicado en Fase 2:
- `cfmoto-800mt-x-2025`: `segment` corregido de `naked` a `trail` por warning explícito del merge report (modelo apuntaba a `trail/adventure`).
- La frontera semántica `trail` vs `adventure` queda como deuda de producto para Fase 4.

Resultado de Fase 3 (auditoría):
- Recomendación estratégica: **híbrida**.
- Mantener ahora UI pública compacta con `primary + other`.
- Conservar taxonomía canónica de 16 segmentos como fuente de verdad.
- No abrir 16 chips públicos en buscador/comunidad/cuenta/admin hasta tener cobertura de catálogo suficiente y criterios claros de UX.
- Hallazgo clave: hoy ya existe estrategia mixta (compacto en varias vistas y 16 explícitas en rankings), por lo que Fase 3.1 debe cerrar ese drift de forma deliberada.

Implementado en Fase 3.1:
- Contrato formal `segmento canónico` vs `grupo visible`.
- Segmento canónico: 16 `BIKE_SEGMENTS`.
- Grupo visible: `all`, segmentos primarios y `other`.
- `other` formalizado como bucket UI-only (no segmento real).
- Mapping formalizado:
  - primarios → sí mismos;
  - secundarios → `other`;
  - grupos visibles → targets canónicos válidos.
- Estrategia compacta reusable centralizada sin abrir 16 chips públicos.
- Guardrail UI legacy aplicado en `BikeCard`:
  - evita render de slug crudo (`bike.segment`);
  - muestra label amigable desde `segmentLabels` con fallback controlado.

Pendiente de Fase 4:
- admin catálogo con 16 categorías explícitas;
- landings SEO por categoría;
- decisión final `trail` vs `adventure` con contrato de producto.

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

Guardrails ya implementados en Fase 1:
- contrato de 16 categorías esperadas en `BIKE_SEGMENTS`.
- alineación de `BikeSegment` y enum SQL `motorcycle_segment`.
- cobertura de `segmentLabels`.
- validación de dataset sin segmentos inválidos.
- contrato de filtros actual `primary + other` (`other` como bucket UI, no segmento real).

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

### Automatización avanzada del pipeline de imágenes

Estado:
- backlog estratégico / futuro.

Objetivo:
Evolucionar el pipeline actual de imágenes para mejorar rendimiento, SEO, maquetación responsive y escalabilidad del catálogo.

Base actual:
- imágenes locales por `motorcycle.id`;
- normalización a WebP;
- sync de `image_url` / `image_source`;
- respeto de `image_locked`;
- dry-run en scripts de normalización/sync.

Mejoras previstas:
- generar thumbnails;
- generar variantes desktop/mobile;
- optimización Lighthouse;
- validación de dimensiones;
- compresión avanzada;
- detectar imágenes mal nombradas;
- detectar imágenes sin correspondencia con `motorcycle.id`;
- marcar correctamente `image_source`;
- proteger `image_locked`;
- generar reportes de imágenes pendientes, inválidas o mejorables.

Reglas:
- no sobrescribir imágenes con `image_locked=true`;
- no degradar imágenes manuales curadas;
- no ejecutar tareas pesadas/sensibles desde frontend público;
- mantener dry-run antes de aplicar cambios;
- cualquier ejecución desde admin debe pasar por backend/edge functions protegidas;
- nunca exponer `SUPABASE_SERVICE_ROLE_KEY`.

Relación con roadmap:
- conecta con Admin imágenes de modelos;
- conecta con Admin catálogo/modelos;
- conecta con rendimiento/Lighthouse;
- conecta con SEO técnico;
- conecta con revisión global UI/SCSS;
- prepara catálogo escalable con imágenes consistentes.

Criterios de aceptación futuros:
- thumbnails generados correctamente;
- variantes desktop/mobile disponibles si se decide implementarlas;
- dimensiones inválidas reportadas;
- imágenes mal nombradas detectadas;
- `image_source` coherente;
- `image_locked` respetado siempre;
- Lighthouse no empeora y, si procede, mejora;
- `npm run typecheck` pasa;
- `npm run test` pasa.

### Admin tareas internas seguras

Estado: pendiente.

Alcance propuesto:
- validación de datos incompletos
- dry-run de importaciones/sync
- ejecución de tareas de mantenimiento desde backend protegido
- mostrar resultados en UI admin

### Admin/moderación base

Estado:
- mayoritariamente implementado / pendiente de auditoría residual.

Implementado:
- rutas admin separadas de cuenta;
- admin protegido por sesión + rol;
- dashboard admin base (`#/admin`);
- `#/admin/moderacion`;
- reportes de reviews;
- estados de reporte;
- acciones sobre reviews desde reportes;
- `#/admin/reviews`;
- agrupación de reviews por moto;
- `#/admin/reviews/[motorcycleId]`;
- acciones aprobar/ocultar/rechazar;
- tab de respuestas pendientes de moderación.

Pendientes residuales:
- completar o auditar `#/admin/solicitudes` (flujo final y contratos de producto);
- avisos al autor;
- administración completa de solicitudes (auditoría funcional final);
- auditoría específica de moderación de respuestas:
  - aprobar/ocultar/rechazar respuestas;
  - reportes de respuestas si existen;
  - estados de respuestas;
  - permisos admin;
  - cobertura de tests.

Reglas:
- no reabrir la Fase 2.5 como greenfield;
- cualquier mejora admin debe empezar con auditoría focal;
- no tocar RLS/schema/admin sin decisión explícita;
- mantener separación mental y de rutas:
  - `#/cuenta` usuario normal;
  - `#/admin` administración.

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

### Personalización de emails de Supabase Auth

Estado:
- backlog futuro / no bloqueante para MVP.

Objetivo:
Personalizar los correos automáticos de Supabase Auth para que encajen con la identidad visual de MotoAtlas y ofrezcan una experiencia más cuidada desde el registro, confirmación y recuperación de cuenta.

Emails a contemplar:
- confirmación de cuenta;
- recuperación de contraseña;
- magic link si se usa en el futuro;
- otros correos transaccionales de auth si Supabase los permite.

Requisitos:
- textos en castellano;
- tono claro, premium y coherente con MotoAtlas;
- diseño dark/premium inspirado en la marca;
- jerarquía clara: logo/nombre, mensaje principal, CTA, texto de ayuda y aviso de seguridad;
- compatible con clientes de email;
- respetar las limitaciones HTML/CSS de Supabase Auth templates.

Flujo recomendado:
1. diseñar primero la propuesta visual en Google Stitch;
2. revisar estilo, copy y jerarquía;
3. adaptar después con Codex/OpenCode a HTML email compatible;
4. validar limitaciones reales de Supabase Auth;
5. probar confirmación, recuperación y enlaces en entorno seguro.

Reglas:
- no bloquear MVP por esta tarea;
- no introducir lógica de auth nueva solo por personalizar emails;
- no incluir datos sensibles innecesarios en el email;
- no depender de CSS complejo no soportado por clientes de correo;
- no usar assets externos inestables;
- mantener fallback legible si el cliente de correo bloquea estilos o imágenes.

Relación con roadmap:
- conecta con Auth baseline;
- conecta con identidad visual premium de MotoAtlas;
- conecta con futura capa social/comunidad;
- mejora confianza del usuario en registro, recuperación y acceso.

Criterios de aceptación futuros:
- email de confirmación personalizado y probado;
- email de recuperación personalizado y probado;
- textos en castellano revisados;
- HTML compatible con Supabase Auth;
- enlaces de auth funcionando correctamente;
- diseño legible en clientes de correo comunes;
- no se rompe el flujo de login/registro/recuperación;
- `npm run typecheck` pasa;
- `npm run test` pasa si hay cambios en repo.

### Fixtures de usuarios y perfiles para tests de auth

Estado:
- implementado parcialmente / base de fixtures central implementada.

Objetivo:
Crear fixtures y mocks locales para testear autenticación, roles, perfiles, Mi cuenta y acciones asociadas a usuario sin depender de Supabase real.

Implementado (base):
- fuente central en `src/test/fixtures/auth.ts`;
- factories con overrides (`createAuthUser`, `createUserProfile`, `createSession`, `createAuthSnapshot`, `createAuthState`);
- fixtures de referencia para:
  - usuario autenticado normal;
  - usuario admin;
  - usuario sin `display_name`;
  - usuario con `avatar_url`;
  - usuario sin avatar;
  - usuario no autenticado;
  - perfil básico completo;
  - perfil incompleto;
  - sesión mock;
- cobertura de contrato en `src/test/fixtures/auth.test.ts`;
- migración inicial en `src/components/pages/AuthPage/AuthPage.test.tsx`.

Pendiente residual:
- migrar de forma incremental mocks `useAuth` repetidos en otros tests (Account*, Community*, ReviewModal, StaticInfoPages, Admin*), sin refactor masivo.

Debe seguir cubriendo fixtures para:
- usuario autenticado normal;
- usuario admin;
- usuario sin `display_name`;
- usuario con `avatar_url`;
- usuario sin avatar;
- usuario no autenticado;
- perfil básico completo;
- perfil incompleto;
- sesión mock.

Áreas que deben poder testearse:
- `AuthProvider`;
- `useAuth`;
- Navbar con/sin sesión;
- Login;
- Register;
- Mi cuenta;
- rutas protegidas;
- admin protegido por rol;
- reviews asociadas a usuario;
- futuras acciones comunitarias con permisos.

Reglas:
- no depender de Supabase real en tests;
- no usar claves reales;
- mantener fixtures pequeños, estables y legibles;
- usar factories con overrides cuando sea posible;
- separar usuario, perfil y sesión para poder componer casos;
- evitar duplicar mocks de auth por test;
- preparar casos para user/admin/no-auth.

Relación con roadmap:
- ayuda a cerrar auditoría de auth baseline;
- prepara futuras pruebas de capa social;
- reduce fragilidad en tests de cuenta/admin/reviews;
- facilita validar roles y permisos.

Criterios de aceptación futuros:
- existe y se mantiene una fuente clara de fixtures de auth/perfiles/sesión;
- tests pueden simular usuario normal, admin y no autenticado;
- tests pueden simular perfiles incompletos;
- migración incremental de suites clave sin romper cobertura;
- `AuthProvider`/Navbar/Login/Register/Mi cuenta pueden testearse sin Supabase real;
- `npm run typecheck` pasa;
- `npm run test` pasa.

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

## 10. P3/P4 — Engagement sano y retorno de usuario

Estado:
- backlog estratégico / futuro.

Principio de producto:
No se busca crear adicción ni un feed infinito. Se busca crear bucles sanos de retorno basados en utilidad real, reconocimiento de aportaciones, cambios relevantes y comunidad motera viva.

Idea central:
El usuario debe sentir que MotoAtlas cambia con su actividad y con la actividad de otros usuarios.

Líneas futuras:

### 1. Desde tu última visita

Mostrar al usuario cambios relevantes desde su última sesión:
- tu review fue aprobada;
- tu review recibió votos útiles;
- una moto de tu garaje recibió nuevas reviews;
- una moto que sigues subió o bajó en rankings;
- una comparativa guardada cambió;
- nuevas reviews publicadas en modelos que sigues;
- tu solicitud de modelo fue revisada.

Dependencias:
- auth baseline cerrado;
- reviews asociadas a usuario;
- cuenta estable;
- sistema de actividad/eventos;
- contratos de privacidad.

### 2. Radar MotoAtlas / Pulso de la Comunidad

Evolución futura de los insights y actividad comunitaria:
- reviews recientes;
- motos que están subiendo;
- modelos más comentados;
- comparativas calientes;
- solicitudes populares;
- opiniones destacadas;
- segmentos más activos;
- usos más activos;
- “La Semana MotoAtlas”.

Relación con el foco actual:
- conecta con rediseño de `Insights en vivo`;
- conecta con artículos dinámicos data-driven;
- conecta con rankings y comunidad.

### Tendencia real basada en histórico de actividad (P2/P3)

Estado:
- backlog estratégico / futuro.

Objetivo:
Sustituir la tendencia simple actual por una señal real basada en histórico temporal y actividad reciente de la comunidad.

Problema actual:
- la tendencia actual no usa serie temporal real;
- puede servir como aproximación visual, pero no debe interpretarse como crecimiento real;
- para rankings, artículos dinámicos y Radar MotoAtlas hace falta una señal más sólida.

Posibles señales futuras:
- crecimiento de reviews por periodo;
- incremento de rating medio por periodo;
- volumen reciente de reviews aprobadas;
- visitas recientes a ficha;
- comparaciones recientes;
- favoritos/guardados;
- motos seguidas;
- solicitudes de modelo;
- actividad en temas/comunidad;
- interacciones útiles en reviews;
- cambios de posición en ranking por semana/mes.

Fases recomendadas:
1. Auditoría de datos disponibles:
   - revisar qué eventos existen ya;
   - revisar si hay timestamps suficientes;
   - revisar si hay datos de visitas/comparaciones/favoritos;
   - no inventar tendencia si no hay señal real.
2. Señal mínima basada en reviews:
   - reviews aprobadas recientes;
   - crecimiento de número de reviews;
   - variación de rating medio;
   - ventana temporal simple: últimos 7/30/90 días.
3. Señal avanzada de actividad:
   - comparaciones;
   - guardados/favoritos;
   - visitas;
   - motos seguidas;
   - solicitudes;
   - actividad comunitaria.
4. Integración UI:
   - mostrar etiquetas como “Tendencia al alza”, “Nueva entrada”, “Muy comentada” u “Opinión dividida” solo cuando estén justificadas por datos reales;
   - evitar claims falsos o exagerados.

Reglas:
- no presentar tendencia como real si se basa en aproximación sin histórico;
- no usar mocks/seed para claims públicos de producción;
- documentar claramente la ventana temporal usada;
- mantener separación entre rating, score, confianza y tendencia;
- no mezclar visitas personales con métricas públicas sin privacidad clara;
- si se usan eventos de usuario, revisar privacidad/RGPD;
- no implementar tracking invasivo.

Relación con roadmap:
- conecta con rediseño de `Insights en vivo`;
- conecta con `Radar MotoAtlas / Pulso de la Comunidad`;
- conecta con rankings;
- conecta con artículos data-driven;
- conecta con engagement sano;
- conecta con futuras comparativas vivas;
- puede alimentar SEO y descubrimiento.

Criterios de aceptación futuros:
- existe una fuente clara de datos temporales;
- la tendencia usa ventanas temporales documentadas;
- tests cubren casos sin histórico, histórico insuficiente y crecimiento real;
- UI no muestra tendencia falsa cuando faltan datos;
- producción no usa mocks/seed para claims de tendencia;
- `npm run typecheck` pasa;
- `npm run test` pasa.

### 3. Mi garaje / motos seguidas

Permitir que el usuario marque motos como:
- la tengo;
- la he tenido;
- la quiero;
- la estoy comparando;
- la probé;
- la sigo.

Uso futuro:
- personalización;
- notificaciones suaves;
- “Desde tu última visita”;
- artículos relevantes;
- rankings personalizados;
- actividad de modelos seguidos.

Dependencias:
- auth baseline;
- perfiles/cuenta;
- privacidad;
- modelo de datos para garaje/saved motorcycles/followed motorcycles.

### 4. Comparativas vivas

Crear comparativas con lectura comunitaria:
- “BMW F900GS vs Aprilia Tuareg 660: la comunidad opina”.
- “MT-09 vs Street Triple: cuál gusta más a propietarios”.
- “CFMoto 800MT-X vs Ténéré 700: datos, precio y percepción”.

Pueden basarse en:
- specs técnicas;
- reviews agregadas;
- rankings;
- votos/comparaciones populares;
- opiniones de propietarios.

Relación:
- conecta con comparador;
- conecta con artículos dinámicos;
- conecta con IA futura;
- conecta con SEO.

### 5. Notificaciones suaves

Notificaciones controladas por el usuario:
- review aprobada;
- alguien marcó tu review como útil;
- solicitud revisada;
- nuevas reviews de una moto seguida;
- nueva actividad en tu garaje;
- nuevo artículo sobre una moto seguida.

Reglas:
- sin spam;
- preferencias configurables;
- no enviar notificaciones sin consentimiento;
- respetar privacidad/RGPD.

### 6. Reputación técnica

Gamificación sana basada en prestigio útil:
- reviewer fiable;
- experto en trail;
- experto en naked;
- propietario verificado;
- colaborador técnico;
- veterano MotoAtlas.

Debe basarse en:
- reviews aprobadas;
- votos útiles;
- aportaciones aceptadas;
- datos corregidos;
- experiencia de largo plazo;
- especialización por segmento.

Reglas:
- no puntos vacíos;
- no recompensas engañosas;
- no fomentar spam de reviews;
- reputación ligada a calidad y utilidad.

Dependencias generales:
- auth baseline cerrado;
- cuenta y reviews propias estables;
- moderación sólida;
- sistema anti-spam;
- privacidad y preferencias;
- suficientes datos reales de comunidad.

No implementar ahora:
- feed infinito;
- notificaciones reales;
- reputación pública;
- seguidores;
- automatismos agresivos;
- rankings de usuarios sin reglas de calidad.

Relación con roadmap:
- conecta con capa social futura;
- conecta con noticias/artículos data-driven;
- conecta con IA futura;
- conecta con rankings;
- conecta con reviews, solicitudes y comparador;
- refuerza la idea de MotoAtlas como comunidad viva.

## 11. P3 — Noticias / contenido editorial

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

### Noticias dinámicas y artículos generados desde datos MotoAtlas

Estado:
- backlog estratégico / futuro.

Principio de producto:
MotoAtlas no se centrará en noticias genéricas de actualidad. La sección de artículos debe orientarse a contenido útil, evergreen, SEO y descubrimiento de motos basado en datos propios.

Fuentes futuras de contenido:
- especificaciones técnicas;
- reviews de usuarios;
- puntuaciones de comunidad;
- comparativas populares;
- patrones de búsqueda;
- motos más guardadas o comparadas;
- motos más solicitadas;
- datos por carnet;
- datos por uso;
- datos por segmento;
- datos por ergonomía/altura si se incorporan de forma voluntaria y segura.

Ejemplos de artículos:
- “Mejores motos A2 según la comunidad”.
- “Trails más recomendadas para viajar”.
- “Naked más divertidas para ciudad”.
- “Motos con mejor relación peso/potencia”.
- “Modelos con más reviews de propietarios”.
- “Comparativas más populares”.
- “Motos más solicitadas por usuarios”.
- “Motos mejor valoradas por usuarios de menos de 1,73 m” (solo con dato suficiente y contrato de privacidad/consentimiento adecuado).

Fases recomendadas:
1. Manual/editorial:
   - artículos escritos por el usuario;
   - basados en catálogo, reviews externas observadas y criterio editorial.
2. Data generated:
   - artículos generados desde datos internos;
   - rankings, comparativas, reviews agregadas, solicitudes y patrones de búsqueda.
3. AI assisted:
   - IA como asistente de resumen, estructura y redacción;
   - siempre con revisión humana antes de publicar.

Futuro modelo de datos propuesto:
- `articles`
  - `id`
  - `slug`
  - `title`
  - `subtitle`
  - `excerpt`
  - `content`
  - `category`
  - `tags`
  - `related_motorcycle_ids`
  - `source_type`
  - `status`
  - `created_at`
  - `updated_at`
  - `published_at`

`source_type`:
- `manual`
- `data_generated`
- `community_generated`
- `ai_assisted`

Requisitos previos:
- catálogo más amplio;
- reviews suficientes;
- testing fuerte;
- taxonomía cerrada;
- SEO base;
- admin/editorial;
- moderación y datos de comunidad estables;
- criterios de privacidad claros si se usan datos personales/ergonómicos.

Reglas:
- no implementar generación automática sin revisión humana;
- no publicar datos débiles como si fueran conclusiones sólidas;
- no crear artículos basados en mocks/seed en producción;
- no usar datos sensibles como altura sin contrato claro de privacidad y consentimiento;
- diferenciar contenido manual, generado por datos, generado por comunidad y asistido por IA;
- mantener trazabilidad de fuentes internas.

Relación con roadmap:
- conecta con IA futura;
- conecta con SEO técnico;
- conecta con rankings;
- conecta con taxonomía de segmentos;
- conecta con admin/editorial;
- conecta con reviews y comparador;
- puede convertirse en una fuente importante de tráfico orgánico.

## 12. P4 — IA futura

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

## 13. P3/P4 — Revisión global UI/SCSS

Estado: pendiente.

Al cerrar funcionalidades principales:
- auditar CSS muerto
- revisar clases acopladas
- revisar componentes reutilizables
- revisar cards, chips, actions, filtros, formularios y layouts
- convertir patrones repetidos en componentes/mixins/placeholders

## 14. Riesgos y deuda conocida

- flaky test aislado en `AdminPage`.
- doble toggle en el mismo tick sin test explícito dedicado.
- hidratación silenciosa de reportes.
- literal de reporte duplicado.
- filtros actuales todavía no atomizados.
- futura ejecución de scripts desde admin requiere backend seguro.

## 15. Qué NO hacer todavía

- No implementar IA real todavía.
- No ejecutar scripts desde frontend.
- No mezclar cierre de auth baseline con features sociales avanzadas.
- No rehacer todos los filtros antes de cerrar insights si bloquea avance.
- No atomizar replies ahora.
- No automatizar noticias hasta tener datos suficientes.
- No exponer `service role key` en frontend.

## 16. Relación con Trello

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
- Tarjeta actualizada: “Crear fixtures de usuarios y perfiles para tests de auth” queda **parcialmente implementada** (base central + migración incremental pendiente) dentro de **P2 Auth baseline / Testing / Fixtures**.
- Tarjeta reclasificada: “Fase 2.5 moderación/admin de respuestas” queda como **admin/moderación base mayoritariamente cerrada** con auditoría residual.
- Tarjeta incorporada: “Automatización avanzada de imágenes” clasificada como evolución **P2/P3 Plataforma/Admin** del pipeline actual (no greenfield).
- Idea histórica incorporada: “Noticias dinámicas y artículos generados desde datos MotoAtlas” clasificada como **P3/P4 Contenido dinámico / SEO / IA futura** (backlog estratégico, no implementación inmediata).
- Idea histórica incorporada: “Engagement sano y retorno de usuario” clasificada como **P3/P4 Comunidad / Personalización / Engagement sano** (backlog estratégico, no implementación inmediata).
- Tarea futura incorporada: “Personalizar emails de Supabase Auth” clasificada como **P2/P3 Auth / Branding / Emails transaccionales** (backlog futuro, no bloqueante para MVP).
- Tarea futura incorporada: “Implementar tendencia real basada en histórico de actividad” clasificada como **P2/P3 Rankings / Analytics / Comunidad viva** (backlog estratégico, no implementación inmediata).
