import type { UnderConstructionPageProps } from './UnderConstructionPage';

export const noticiasContent: UnderConstructionPageProps = {
  statusLabel: 'Status: Offline / Maintenance',
  title: 'Esta sección está en boxes',
  description:
    'MotoAtlas está construyendo esta ruta con datos técnicos verificados y una experiencia de alta fidelidad. Preferimos la precisión a la velocidad.',
  primaryCta: {
    label: 'Volver al inicio',
    href: '#/',
    variant: 'primary',
  },
  secondaryCtas: [
    {
      label: 'Explorar catálogo',
      href: '#/buscador',
      variant: 'secondary',
    },
    {
      label: 'Unirse a la comunidad',
      href: '#/comunidad',
      variant: 'secondary',
    },
  ],
  roadmap: {
    heading: 'Hoja de ruta',
    cards: [
      {
        title: 'Noticias y lanzamientos',
        description: 'Cobertura técnica de las últimas novedades del sector.',
      },
      {
        title: 'Rutas y telemetría',
        description: 'Análisis de rendimiento en trayectos reales con datos GPS.',
      },
      {
        title: 'Eventos del sector',
        description: 'Calendario detallado de salones y competiciones clave.',
      },
    ],
  },
  trustMessage: 'Sin secciones vacías, sin datos de relleno. Crecemos por fases.',
};
