import { cardActions } from '../../../data/home';
import { getBikeCardSpecs, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { getCompareSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import { MotorcycleImage } from '../MotorcycleImage';
import './BikeCard.scss';

type BikeCardProps = {
  bike: Bike;
};

export function BikeCard({ bike }: BikeCardProps) {
  const specs = getBikeCardSpecs(bike);
  const segmentLabel = segmentLabels[bike.segment] ?? 'Segmento desconocido';

  return (
    <article className="bike-card">
      <div className="bike-card__media">
        <MotorcycleImage motorcycle={bike} loading="lazy" />
      </div>

      <div className="bike-card__body">
        <div className="bike-card__header">
          <h3>{getBikeDisplayName(bike)}</h3>
          <span>{segmentLabel}</span>
        </div>

        <dl className="bike-card__specs">
          {specs.map((spec) => (
            <div className="bike-card__spec" key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="bike-card__actions">
          <a className="button button--ghost" href={getBikeDetailHash(bike)}>
            Ver ficha
          </a>
          <a className="button button--primary" href={getCompareSearchHash(bike)}>
            {cardActions.compareLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
