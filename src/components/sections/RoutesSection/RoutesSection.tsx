import { routes } from '../../../data/routes';
import { Button } from '../../ui/Button';
import { RouteCard } from '../../ui/RouteCard';
import './RoutesSection.scss';

export function RoutesSection() {
  return (
    <section className="routes-section fade-in" id="rutas" aria-labelledby="routes-title">
      <div className="routes-section__header">
        <div>
          <span className="section-kicker">Explora</span>
          <h2 className="section-title" id="routes-title">
            Rutas que inspiran
          </h2>
        </div>
        <Button variant="ghost">Mapa completo</Button>
      </div>

      <div className="routes-section__grid">
        {routes.map((route) => (
          <RouteCard route={route} key={route.id} />
        ))}
      </div>
    </section>
  );
}
