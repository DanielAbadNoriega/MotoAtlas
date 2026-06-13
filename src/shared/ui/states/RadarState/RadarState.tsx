import { useId } from 'react';
import './RadarState.scss';

type RadarStateProps = Readonly<{
  actionLabel?: string;
  className?: string;
  description?: string;
  icon?: string;
  onAction?: () => void;
  title?: string;
  titleId?: string;
}>;

export function RadarState({
  actionLabel = 'Limpiar filtros',
  className = '',
  description = 'Prueba a cambiar los filtros para encontrar lo que necesitas.',
  icon = 'search_off',
  onAction,
  title = 'No hay reviews con estos filtros',
  titleId,
}: RadarStateProps) {
  const generatedTitleId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;
  const rootClassName = ['radar-state', className].filter(Boolean).join(' ');

  return (
    <section className={rootClassName} aria-labelledby={resolvedTitleId}>
      <div className="radar-state__visual" aria-hidden="true" data-testid="reviews-empty-radar">
        <div className="radar-state__glow" />
        <div className="radar-state__radar">
          <div className="radar-state__ring radar-state__ring--outer" data-testid="reviews-empty-radar-ring" />
          <div className="radar-state__ring radar-state__ring--inner" data-testid="reviews-empty-radar-ring" />
          <div className="radar-state__sweep" data-testid="reviews-empty-radar-sweep" />
          <span className="radar-state__marker radar-state__marker--top" data-testid="reviews-empty-radar-marker" />
          <span className="radar-state__marker radar-state__marker--bottom" data-testid="reviews-empty-radar-marker" />
          <span className="radar-state__marker radar-state__marker--left" data-testid="reviews-empty-radar-marker" />
          <span className="radar-state__marker radar-state__marker--right" data-testid="reviews-empty-radar-marker" />
          <span className="radar-state__icon material-symbols-outlined">{icon}</span>
        </div>
      </div>

      <div className="radar-state__content">
        <h2 id={resolvedTitleId}>{title}</h2>
        <p>{description}</p>
        {onAction ? (
          <button className="radar-state__action" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
