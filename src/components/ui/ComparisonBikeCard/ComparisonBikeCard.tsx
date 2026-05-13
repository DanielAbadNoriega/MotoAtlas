import type { ComparisonBike } from '../../../types/bike';
import './ComparisonBikeCard.scss';

type ComparisonBikeCardProps = {
  bike: ComparisonBike;
};

export function ComparisonBikeCard({ bike }: ComparisonBikeCardProps) {
  return (
    <article className={`comparison-bike-card comparison-bike-card--${bike.accent}`}>
      <img src={bike.image} alt={bike.alt} loading="lazy" />
      <h3>{bike.name}</h3>
      <p>{bike.subtitle}</p>

      <dl>
        {bike.specs.map((spec) => (
          <div key={spec.label}>
            <dt>{spec.label}</dt>
            <dd>{spec.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
