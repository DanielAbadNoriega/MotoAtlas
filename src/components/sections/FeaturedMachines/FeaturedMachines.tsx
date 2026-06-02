import { featuredBikes } from '../../../data/bikes';
import { getMotorcycleImage } from '../../../shared/images/getMotorcycleImage';
import type { Bike } from '../../../types/bike';
import './FeaturedMachines.scss';

type FeaturedMachine = Pick<Bike, 'id' | 'brand' | 'model' | 'displacementCc' | 'powerHp' | 'torqueNm' | 'imageUrl' | 'description'>;

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-ES').format(value);
}

function formatSpec(value: number | undefined | null, unit: string) {
  if (value == null) return null;
  return `${formatNumber(value)} ${unit}`;
}

function splitBikeName(name: string) {
  const parts = name.split(' ');
  if (parts.length <= 1) return { brand: name, model: '' };
  return { brand: parts[0], model: parts.slice(1).join(' ') };
}

type CardProps = {
  bike: FeaturedMachine;
  badge: string;
  variant: 'hero' | 'compact';
};

function FeaturedMachineCard({ bike, badge, variant }: CardProps) {
  const image = getMotorcycleImage(bike);
  const { brand, model } = splitBikeName(`${bike.brand} ${bike.model}`);
  const engine = formatSpec(bike.displacementCc, 'CC');
  const power = formatSpec(bike.powerHp, 'HP');
  const torque = formatSpec(bike.torqueNm, 'NM');
  const specs = [
    { label: 'Engine', value: engine },
    { label: 'Power', value: power },
    { label: 'Torque', value: torque },
  ].filter((s): s is { label: string; value: string } => s.value !== null);

  return (
    <article className={`featured-machine-card featured-machine-card--${variant}`}>
      <div className="featured-machine-card__media">
        <img
          alt={image.altText}
          src={image.imageUrl}
        />
      </div>

      <div className="featured-machine-card__badge" aria-hidden="true">
        <span className="featured-machine-card__badge-number">{badge}</span>
        <span className="featured-machine-card__badge-line" />
      </div>

      <div className="featured-machine-card__content">
        <h3 className="featured-machine-card__title">
          <span className="featured-machine-card__title-brand">{brand}</span>
          {model && <span className="featured-machine-card__title-model">{model}</span>}
        </h3>

        <dl className="featured-machine-card__specs">
          {specs.map((spec) => (
            <div className="featured-machine-card__spec" key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="featured-machine-card__actions">
          <a className="button button--ghost" href={`#/motos/${bike.id}`}>
            Ver ficha
          </a>
          <a className="button button--primary" href={`#/comunidad/${bike.id}`}>
            Reviews
          </a>
        </div>
      </div>
    </article>
  );
}

export function FeaturedMachines() {
  const machines = featuredBikes as readonly FeaturedMachine[];

  return (
    <section className="featured-machines fade-in" aria-labelledby="featured-machines-title">
      <header className="featured-machines__header">
        <div className="featured-machines__kicker">
          <span className="featured-machines__kicker-line" aria-hidden="true" />
          <span className="featured-machines__kicker-text">Built for riders, ranked by character</span>
        </div>
        <h2 id="featured-machines-title" className="featured-machines__title">Featured Machines</h2>
      </header>

      <div className="featured-machines__grid">
        <div className="featured-machines__primary">
          <FeaturedMachineCard bike={machines[0]} badge="01" variant="hero" />
        </div>
        <div className="featured-machines__secondary">
          <FeaturedMachineCard bike={machines[1]} badge="02" variant="compact" />
          <FeaturedMachineCard bike={machines[2]} badge="03" variant="compact" />
        </div>
      </div>
    </section>
  );
}