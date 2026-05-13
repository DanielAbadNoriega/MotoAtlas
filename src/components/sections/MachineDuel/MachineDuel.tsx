import { duelBikes } from '../../../data/bikes';
import type { ComparisonBike } from '../../../types/bike';
import { Button } from '../../ui/Button';
import './MachineDuel.scss';

function DuelBikeCard({ bike }: { bike: ComparisonBike }) {
  return (
    <article className={`machine-duel__card machine-duel__card--${bike.accent}`}>
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

export function MachineDuel() {
  return (
    <section className="machine-duel fade-in" id="comparativas" aria-labelledby="machine-duel-title">
      <div className="machine-duel__inner">
        <header className="machine-duel__intro">
          <h2 id="machine-duel-title">Duelo de Máquinas</h2>
          <p>
            Compara especificaciones técnicas puras cara a cara para tomar la decisión definitiva.
          </p>
        </header>

        <div className="machine-duel__grid">
          <DuelBikeCard bike={duelBikes[0]} />

          <div className="machine-duel__vs" aria-hidden="true">
            <span>VS</span>
          </div>

          <DuelBikeCard bike={duelBikes[1]} />
        </div>

        <div className="machine-duel__actions">
          <Button variant="secondary">Iniciar comparativa detallada</Button>
        </div>
      </div>
    </section>
  );
}
