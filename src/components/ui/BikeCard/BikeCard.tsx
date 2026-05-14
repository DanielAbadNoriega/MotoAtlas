import { cardActions } from '../../../data/home';
import { getBikeCardSpecs, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { getCompareSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import { MotorcycleImage } from '../MotorcycleImage';
import './BikeCard.scss';

type BikeCardProps = {
  bike: Bike;
};

export function BikeCard({ bike }: BikeCardProps) {
  const specs = getBikeCardSpecs(bike);

  return (
    <article className="bike-card">
      <div className="bike-card__media">
        <MotorcycleImage motorcycle={bike} loading="lazy" />
      </div>

      <div className="bike-card__body">
        <div className="bike-card__header">
          <h3>{getBikeDisplayName(bike)}</h3>
          <span>{bike.segment}</span>
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
