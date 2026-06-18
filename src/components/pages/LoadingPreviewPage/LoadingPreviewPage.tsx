import { useState } from 'react';
import { LoadingState } from '../../../shared/ui/loading/LoadingState';
import type { LoadingStateProps } from '../../../shared/ui/loading/LoadingState';
import heroImage from '../../../assets/hero-comunity.png';
import './LoadingPreviewPage.scss';

type Scenario = {
  label: string;
  props: LoadingStateProps;
};

const SCENARIOS: Scenario[] = [
  {
    label: 'General',
    props: {
      eyebrow: 'MotoAtlas',
      title: 'Preparando MotoAtlas',
      message: 'Estamos cargando datos técnicos, comunidad y telemetría visual.',
      icon: 'motorcycle',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'General + Hero',
    props: {
      eyebrow: 'MotoAtlas',
      title: 'Preparando MotoAtlas',
      message: 'Estamos cargando datos técnicos, comunidad y telemetría visual.',
      icon: 'motorcycle',
      variant: 'page',
      size: 'lg',
      backgroundImage: heroImage,
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
    label: 'Catálogo',
    props: {
      eyebrow: 'Catálogo técnico',
      title: 'Cargando catálogo',
      message: 'Estamos organizando modelos, especificaciones y comparativas.',
      icon: 'manage_search',
      variant: 'section',
      size: 'md',
    },
  },
  {
    label: 'Cuenta',
    props: {
      eyebrow: 'Espacio personal',
      title: 'Preparando tu espacio personal',
      message: 'Un momento, estamos organizando tu historial de piloto y actividad.',
      icon: 'account_circle',
      variant: 'page',
      size: 'lg',
    },
  },
  {
    label: 'Rutas',
    props: {
      eyebrow: 'Rutas',
      title: 'Calculando ruta',
      message: 'Estamos preparando trazado, puntos clave y contexto de conducción.',
      icon: 'route',
      variant: 'section',
      size: 'md',
    },
  },
  {
    label: 'Inline',
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
            <button
              key={scenario.label}
              type="button"
              className={`loading-preview__button${index === activeIndex ? ' loading-preview__button--active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      <div className="loading-preview__stage" key={activeIndex}>
        <LoadingState {...active.props} />
      </div>
    </div>
  );
}
