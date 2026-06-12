import type { FormEvent } from 'react';
import heroMotorcycle from '../../../assets/Hero Motorcycle.png';
import { heroContent } from '../../../data/home';
import { getSearchHashWithText } from '../../../shared/routing/routeUtils';
import { SearchHero } from '../SearchHero';
import './HomeHero.scss';
import { HeroSearch } from './HeroSearch';

export function HomeHero() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchText = String(formData.get('model-search') ?? '');

    window.location.hash = getSearchHashWithText(searchText);
  };

  return (
    <div id="top">
      <SearchHero
        className="home-hero"
        eyebrow="ENCICLOPEDIA TÉCNICA MOTERA"
        imageAlt=""
        imageSrc={heroMotorcycle}
        title={heroContent.title}
        titleId="hero-title"
      >
        <HeroSearch content={heroContent.search} onSubmit={handleSubmit} />
      </SearchHero>
    </div>
  );
}
