# MotoAtlas — Misión

## Qué construimos

MotoAtlas es una plataforma de descubrimiento, comparación y comunidad motera. Permite a los usuarios explorar fichas técnicas reales, comparar modelos lado a lado y acceder a reviews verificadas de la comunidad. El catálogo prioriza datos técnicos precisos y transparencia sobre el origen de cada información.

Las piezas centrales del producto son: buscador y comparador de motos, fichas técnicas detalladas con specs y ratings comunitarios, comunidad de reviews con reacciones y reportes, y gestión de modelos y herramientas internas para operadores internos.

## Para quién

**Usuario principal:** motero exigente que busca información técnica real para decidir entre modelos. Compara con criterio, no con marketing.

**Usuario secundario:** motero que quiere descubrir tendencias comunitarias, leer experiencias de otros riders y construir su garaje personal de motos conocidas.

**Operadores internos:** administradores que gestionan el catálogo y moderan contenido. Son usuarios de tooling interno, no el público objetivo de la plataforma.

## Principios

- **Claridad técnica sobre ruido de marketing.** Datos de spec-sheet, no slogans.
- **Identidad premium sin artificios.** Dark mode, racing red, tipografía técnica. Sin glassmorphism excesivo ni neón cyberpunk.
- **Datos reales con fallbacks explícitos.** Si no hay dato, lo decimos; no inventamos ni ocultamos.
- **Mejora progresiva por workstreams acotados.** Sin megarefactor en una misma rama.
- **Cambios seguros.** Implementación → Quality Gate → Docs Sync como secuencia obligatoria.
- **Calidad accesible.** Responsive, navegación por teclado, contenido semántico.
- **Sin refactors desligados.** No mezclar cambios no relacionados con el trabajo pedido.

## Qué NO es

- **No es un marketplace genérico de vehículos.** MotoAtlas no procesa ventas ni transacciones.
- **No es un producto donde mock/demo-data reemplace datos reales.** El fallback existe; no es el objetivo.
- **No es una red social sin valor técnico.** Reviews con aspectos técnicos, no likes vacíos.
- **No es un lugar para cambios descontrolados de schema, auth o admin.** Estas áreas requieren flujo dedicado con guard explícito (ver `spec/constitution/hard-limits.md`).
- **No es un proyecto donde refactors no relacionados se mezclen en trabajo de feature.** Cada tarea tiene alcance; lo que está fuera, no se toca.
