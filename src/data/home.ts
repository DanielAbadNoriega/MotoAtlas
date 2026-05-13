import type {
  CardActionContent,
  HeroContent,
  MachineDuelContent,
  ReportCtaContent,
  SectionHeaderContent,
} from '../types/content';

export const heroContent = {
  title: 'La Enciclopedia del Motero Técnico',
  search: {
    label: 'Buscar modelos',
    placeholder: 'Busca modelos, marcas...',
    submitLabel: 'Buscar',
  },
} satisfies HeroContent;

export const homeSections = {
  featuredBikes: {
    kicker: 'Catálogo 2024',
    title: 'Máquinas destacadas',
    actionLabel: 'Ver todo',
  },
  latestNews: {
    title: 'Últimas noticias',
  },
  reliabilityReports: {
    title: 'Informe de fiabilidad',
  },
  routes: {
    kicker: 'Explora',
    title: 'Rutas que inspiran',
    actionLabel: 'Mapa completo',
  },
} satisfies Record<string, SectionHeaderContent>;

export const machineDuelContent = {
  header: {
    title: 'Duelo de Máquinas',
    description: 'Compara especificaciones técnicas puras cara a cara.',
  },
  versusLabel: 'VS',
  actionLabel: 'Iniciar comparativa detallada',
} satisfies MachineDuelContent;

export const reportCta = {
  title: '¿Tenés problemas técnicos?',
  actionLabel: 'Enviar reporte',
} satisfies ReportCtaContent;

export const cardActions = {
  compareLabel: 'Comparar',
} satisfies CardActionContent;
