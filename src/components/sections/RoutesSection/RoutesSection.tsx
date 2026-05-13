import { homeSections } from '../../../data/home';
import { routeCopy, routes } from '../../../data/routes';
import { RouteCard } from '../../ui/RouteCard';
import { SectionHeader } from '../../ui/SectionHeader';
import './RoutesSection.scss';

export function RoutesSection() {
  return (
    <section className="routes-section fade-in" id="rutas" aria-labelledby="routes-title">
      <SectionHeader content={homeSections.routes} titleId="routes-title" />

      <div className="routes-section__grid">
        {routes.map((route) => (
          <RouteCard copy={routeCopy} route={route} key={route.id} />
        ))}
      </div>
    </section>
  );
}
