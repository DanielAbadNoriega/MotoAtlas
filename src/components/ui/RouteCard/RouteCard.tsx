import type { Route, RouteCopy } from '../../../types/route';
import './RouteCard.scss';

type RouteCardProps = {
  copy: RouteCopy;
  route: Route;
};

export function RouteCard({ copy, route }: RouteCardProps) {
  return (
    <article className="route-card">
      <div className="route-card__media">
        <img src={route.image} alt={route.alt} loading="lazy" />
        <span>
          {copy.difficultyLabel}: {route.difficulty}
        </span>
      </div>

      <h3>{route.title}</h3>
      <p>
        {route.location} • {route.distance}
      </p>

      <div className="route-card__progress" aria-hidden="true">
        <span style={{ width: `${route.progress}%` }} />
      </div>
    </article>
  );
}
