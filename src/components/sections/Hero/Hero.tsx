import type { FormEvent } from 'react';
import heroMotorcycle from '../../../assets/Hero Motorcycle.png';
import { heroContent } from '../../../data/home';
import './Hero.scss';
import { HeroSearch } from './HeroSearch';

export function Hero() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__background" aria-hidden="true">
        <img src={heroMotorcycle} alt="" />
        <span />
      </div>

      <div className="hero__content fade-in">
        <h1 id="hero-title">{heroContent.title}</h1>
        <HeroSearch content={heroContent.search} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
