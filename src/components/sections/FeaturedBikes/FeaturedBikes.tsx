import { featuredBikes } from '../../../data/bikes';
import { BikeCard } from '../../ui/BikeCard';
import { Button } from '../../ui/Button';
import './FeaturedBikes.scss';

export function FeaturedBikes() {
  return (
    <section className="featured-bikes fade-in" aria-labelledby="featured-bikes-title">
      <div className="featured-bikes__header">
        <div>
          <span className="section-kicker">Catálogo 2024</span>
          <h2 className="section-title" id="featured-bikes-title">
            Máquinas destacadas
          </h2>
        </div>
        <Button variant="ghost">Ver todo</Button>
      </div>

      <div className="featured-bikes__grid">
        {featuredBikes.map((bike) => (
          <BikeCard bike={bike} key={bike.id} />
        ))}
      </div>
    </section>
  );
}
