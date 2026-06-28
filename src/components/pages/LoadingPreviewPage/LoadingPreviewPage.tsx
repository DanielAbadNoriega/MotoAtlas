import { Fragment, useState } from 'react';
import { LoadingState } from '../../../shared/ui/loading/LoadingState';
import type { LoadingStateProps } from '../../../shared/ui/loading/LoadingState';
import heroImage from '../../../assets/hero-comunity.png';
import comparisonHero from '../../../assets/comparison-hero.png';
import versusBikes from '../../../assets/versus-bikes.png';
import homeHero from '../../../assets/Hero Motorcycle.png';
import './LoadingPreviewPage.scss';

type Scenario = {
  label: string;
  props: LoadingStateProps;
};

const PAGE_SCENARIOS: Scenario[] = [
  {
    label: 'Home',
    props: {
      eyebrow: 'MotoAtlas',
      title: 'Preparando MotoAtlas',
      message: 'Estamos cargando datos técnicos, comunidad y comparativas para montar tu experiencia.',
      icon: 'motorcycle',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'Home + Hero',
    props: {
      eyebrow: 'MotoAtlas',
      title: 'Preparando MotoAtlas',
      message: 'Estamos cargando datos técnicos, comunidad y comparativas para montar tu experiencia.',
      icon: 'motorcycle',
      variant: 'page',
      size: 'lg',
      backgroundImage: homeHero,
    },
  },
  {
    label: 'Comunidad',
    props: {
      eyebrow: 'Comunidad',
      title: 'Preparando comunidad',
      message: 'Estamos sincronizando reviews, confianza y actividad reciente.',
      icon: 'groups',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'Comunidad + Hero',
    props: {
      eyebrow: 'Comunidad',
      title: 'Preparando comunidad',
      message: 'Estamos sincronizando reviews, confianza y actividad reciente.',
      icon: 'groups',
      variant: 'page',
      size: 'lg',
      backgroundImage: heroImage,
    },
  },
  {
    label: 'Buscador',
    props: {
      eyebrow: 'Buscador técnico',
      title: 'Preparando buscador',
      message: 'Estamos organizando modelos, filtros y datos técnicos para afinar la búsqueda.',
      icon: 'manage_search',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'Buscador + Hero',
    props: {
      eyebrow: 'Buscador técnico',
      title: 'Preparando buscador',
      message: 'Estamos organizando modelos, filtros y datos técnicos para afinar la búsqueda.',
      icon: 'manage_search',
      variant: 'page',
      size: 'lg',
      backgroundImage: comparisonHero,
    },
  },
  {
    label: 'Comparador',
    props: {
      eyebrow: 'Comparador',
      title: 'Preparando comparativa',
      message: 'Estamos alineando especificaciones, rendimiento y datos clave entre modelos.',
      icon: 'compare_arrows',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'Comparador + Hero',
    props: {
      eyebrow: 'Comparador',
      title: 'Preparando comparativa',
      message: 'Estamos alineando especificaciones, rendimiento y datos clave entre modelos.',
      icon: 'compare_arrows',
      variant: 'page',
      size: 'lg',
      backgroundImage: versusBikes,
    },
  },
];

const TECH_SCENARIOS: Scenario[] = [
  {
    label: 'Section loading',
    props: {
      eyebrow: 'Sección',
      title: 'Cargando sección',
      message: 'Estamos preparando este bloque de contenido.',
      icon: 'sync',
      variant: 'section',
      size: 'md',
    },
  },
  {
    label: 'Inline loading',
    props: {
      eyebrow: 'Sincronizando',
      title: 'Cargando',
      message: 'Preparando datos técnicos.',
      icon: 'bolt',
      variant: 'inline',
      size: 'sm',
    },
  },
];

const SCENARIOS = [...PAGE_SCENARIOS, ...TECH_SCENARIOS];

const PAGE_COUNT = PAGE_SCENARIOS.length;

export function LoadingPreviewPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SCENARIOS[activeIndex];

  return (
    <div className="loading-preview">
      <div className="loading-preview__toolbar">
        <h1 className="loading-preview__title">Loading preview</h1>
        <p className="loading-preview__note">Ruta temporal para revisar estados de carga.</p>
        <div className="loading-preview__nav" role="group" aria-label="Escenarios de carga">
          {SCENARIOS.map((scenario, index) => (
            <Fragment key={scenario.label}>
              {index === PAGE_COUNT && <span className="loading-preview__divider" role="separator" />}
              <button
                type="button"
                className={`loading-preview__button${index === activeIndex ? ' loading-preview__button--active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                {scenario.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="loading-preview__stage" key={activeIndex}>
        <LoadingState {...active.props} />
      </div>
    </div>
  );
}
