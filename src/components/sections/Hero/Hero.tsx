import type { FormEvent } from 'react';
import heroMotorcycle from '../../../assets/Hero Motorcycle.png';
import { Button } from '../../ui/Button';
import './Hero.scss';

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
        <h1 id="hero-title">La Enciclopedia del Motero Técnico</h1>

        <form className="hero__search" onSubmit={handleSubmit} role="search">
          <label className="hero__search-label" htmlFor="model-search">
            Buscar modelos
          </label>
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
          <input
            id="model-search"
            name="model-search"
            placeholder="Busca modelos, marcas o cilindradas..."
            type="search"
          />
          <Button type="submit" className="hero__search-button">
            Buscar
          </Button>
        </form>
      </div>
    </section>
  );
}
