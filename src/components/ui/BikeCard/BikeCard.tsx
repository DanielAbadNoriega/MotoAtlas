import { cardActions } from '../../../data/home';
import type { Bike } from '../../../types/bike';
import { Button } from '../Button';
import './BikeCard.scss';

type BikeCardProps = {
  bike: Bike;
};

export function BikeCard({ bike }: BikeCardProps) {
  return (
    <article className="bike-card">
      <div className="bike-card__media">
        <img src={bike.image} alt={bike.alt} loading="lazy" />
      </div>

      <div className="bike-card__body">
        <div className="bike-card__header">
          <h3>{bike.name}</h3>
          <span>{bike.category}</span>
        </div>

        <dl className="bike-card__specs">
          {bike.specs.map((spec) => (
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
