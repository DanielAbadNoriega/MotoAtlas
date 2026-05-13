import { featuredBikes } from '../../../data/bikes';
import { homeSections } from '../../../data/home';
import { BikeCard } from '../../ui/BikeCard';
import { SectionHeader } from '../../ui/SectionHeader';
import './FeaturedBikes.scss';

export function FeaturedBikes() {
  return (
    <section className="featured-bikes fade-in" aria-labelledby="featured-bikes-title">
      <SectionHeader content={homeSections.featuredBikes} titleId="featured-bikes-title" />

      <div className="featured-bikes__grid">
        {featuredBikes.map((bike) => (
          <BikeCard bike={bike} key={bike.id} />
        ))}
      </div>
    </section>
  );
}
