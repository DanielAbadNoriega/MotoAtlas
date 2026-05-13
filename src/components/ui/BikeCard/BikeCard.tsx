import { cardActions } from '../../../data/home';
import { getBikeCardSpecs, getBikeDisplayName } from '../../../data/bikes';
import type { Bike } from '../../../types/bike';
import { Button } from '../Button';
import './BikeCard.scss';

type BikeCardProps = {
  bike: Bike;
};

export function BikeCard({ bike }: BikeCardProps) {
  const specs = getBikeCardSpecs(bike);

  return (
    <article className="bike-card">
      <div className="bike-card__media">
        <img src={bike.imageUrl} alt={bike.description} loading="lazy" />
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

        <Button fullWidth>{cardActions.compareLabel}</Button>
      </div>
    </article>
  );
}
