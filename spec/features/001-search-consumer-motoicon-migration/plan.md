# 001 · Search Consumer MotoIcon Migration — Plan

## Estrategia

Migración directa: reemplazar el span Material Symbols por MotoIcon en los cuatro consumidores. Sin cambios de layout, sin cambios de API pública, sin nuevas entradas del registry. El icono `search` ya existe en el MotoIcon registry.

## Archivos previstos para la implementación

1. `src/shared/ui/search/SearchControl.tsx`
2. `src/components/pages/AccountReviewsPage/AccountReviewsPage.tsx`
3. `src/components/pages/CommunityReviewsPage/CommunityReviewsPage.tsx`
4. `src/components/pages/CommunityRankingsPage/CommunityRankingsPage.tsx`

## Preparación de MotoIcon

El icono `search` ya existe en el registry (MotoIcon.tsx, línea 56). No se requiere ninguna entrada nueva en el registry.

## Guardrail de API de SearchControl

SearchControl tiene una prop `icon` con valor por defecto `'search'`. La implementación futura debe:

- Preservar la prop `icon` con su valor por defecto `'search'`
- Si se sustituye `{icon}` directamente por `<MotoIcon name={icon} />`, confirmar que todos los valores posibles de `icon` existan en el registry, o limitar la migración de forma segura al caso `search`
- No cambiar la firma del componente ni el nombre de las props existentes

## Notas de accesibilidad

- Preservar `aria-hidden="true"` donde el icono es decorativo (el input asociado tiene el label)
- Preservar `focusable` si y solo si el icono era intencionalmente focusable antes
- No añadir nuevos atributos de accesibilidad salvo que existieran previamente
- Los labels accesibles de los inputs de búsqueda no se ven afectados por este cambio

## Notas de SCSS/layout

Los estilos de posicionamiento y tamaño del icono ya fueron migrados en Workstream E para otros iconos. Verificar que los selectores `.material-symbols-outlined` en los archivos objetivo no aplican estilos específicos al icono de search. No se esperan cambios de layout.

## Orden de implementación

1. SearchControl (componente compartido, referenciado por páginas)
2. AccountReviewsPage
3. CommunityReviewsPage
4. CommunityRankingsPage

## Decisiones

- Se preserva `aria-hidden="true"` para mantener accesibilidad
- Se preserva `className` y dimensiones originales del span
- SearchControl mantiene su prop `icon` con valor por defecto `'search'`; no cambia su API pública
- No se añaden nuevos atributos de accesibilidad
