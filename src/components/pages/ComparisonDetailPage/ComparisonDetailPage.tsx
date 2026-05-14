import { defaultBikeComparison } from '../../../data/comparisons';
import { getBikeById, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import type { Bike } from '../../../types/bike';
import type { BikeComparison, ComparisonScore } from '../../../types/comparison';
import { Button } from '../../ui/Button';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import './ComparisonDetailPage.scss';

type ComparisonDetailPageProps = {
  comparison?: BikeComparison;
  motorcycles?: readonly Bike[];
};

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const specs = [
  { label: 'Engine Type', getValue: (bike: Bike) => bike.engineType },
  { label: 'Displacement', getValue: (bike: Bike) => `${numberFormatter.format(bike.displacementCc)} cc` },
  { label: 'Max Power', getValue: (bike: Bike) => `${numberFormatter.format(bike.powerHp)} HP` },
  { label: 'Max Torque', getValue: (bike: Bike) => `${numberFormatter.format(bike.torqueNm)} Nm` },
  { label: 'Wet Weight', getValue: (bike: Bike) => `${numberFormatter.format(bike.wetWeightKg)} kg` },
  { label: 'Seat Height', getValue: (bike: Bike) => `${numberFormatter.format(bike.seatHeightMm)} mm` },
  { label: 'Fuel Tank', getValue: (bike: Bike) => `${numberFormatter.format(bike.fuelTankLiters)} L` },
  { label: 'Est. Price', getValue: (bike: Bike) => currencyFormatter.format(bike.priceEur) },
] satisfies readonly { label: string; getValue: (bike: Bike) => string }[];

function clampScore(score: number) {
  return Math.max(0, Math.min(score, 10));
}

function scoreWidth(score: number) {
  return `${clampScore(score) * 10}%`;
}

function getScoreWinner(score: ComparisonScore, leftBike: Bike, rightBike: Bike) {
  if (score.leftScore === score.rightScore) {
    return 'Empate técnico';
  }

  return score.leftScore > score.rightScore ? getBikeDisplayName(leftBike) : getBikeDisplayName(rightBike);
}

function resolveBike(id: Bike['id'], motorcycles: readonly Bike[]) {
  return motorcycles.find((bike) => bike.id === id) ?? getBikeById(id);
}

export function ComparisonDetailPage({ comparison = defaultBikeComparison, motorcycles = [] }: ComparisonDetailPageProps) {
  const [leftHeroBike, rightHeroBike] = comparison.bikes;
  const leftBike = resolveBike(leftHeroBike.bikeId, motorcycles);
  const rightBike = resolveBike(rightHeroBike.bikeId, motorcycles);
  const leftBikeName = getBikeDisplayName(leftBike);
  const rightBikeName = getBikeDisplayName(rightBike);

  return (
    <main className="comparison-detail" aria-labelledby="comparison-detail-title">
      <section className="comparison-detail__hero">
        <a className="comparison-detail__back" href="#top">
          ← Volver a la home
        </a>

        <div className="comparison-detail__intro">
          <p>Technical registry</p>
          <h1 id="comparison-detail-title">{comparison.title}</h1>
          <span>{comparison.subtitle}</span>
        </div>

        <div className="comparison-detail__duel">
          <article className="comparison-detail__hero-bike comparison-detail__hero-bike--left">
            <MotorcycleImage motorcycle={leftBike} />
            <div>
              <span>{leftHeroBike.tagline}</span>
              <h2>{leftBikeName}</h2>
            </div>
          </article>

          <div className="comparison-detail__vs" aria-hidden="true">
            <span>VS</span>
          </div>

          <article className="comparison-detail__hero-bike comparison-detail__hero-bike--right">
            <MotorcycleImage motorcycle={rightBike} />
            <div>
              <span>{rightHeroBike.tagline}</span>
              <h2>{rightBikeName}</h2>
            </div>
          </article>
        </div>

        <div className="comparison-detail__actions">
          <Button>Votar ganadora</Button>
          <a className="button button--ghost" href={getBikeDetailHash(leftBike)}>
            Ficha {leftBike.brand}
          </a>
          <a className="button button--ghost" href={getBikeDetailHash(rightBike)}>
            Ficha {rightBike.brand}
          </a>
          <a className="button button--secondary" href="#/buscador">
            Añadir otra moto
          </a>
        </div>
      </section>

      <section className="comparison-detail__vote" aria-labelledby="comparison-vote-title">
        <div>
          <h2 id="comparison-vote-title">¿Cuál elegirías?</h2>
          <p>
            Nuestra comunidad ha hablado. Basado en{' '}
            {numberFormatter.format(comparison.voteSummary.totalVotes)} votos verificados.
          </p>
          <blockquote>
            “{comparison.voteSummary.topComment}”
            <cite>{comparison.voteSummary.topCommentAuthor}</cite>
          </blockquote>
        </div>

        <div className="comparison-detail__vote-results">
          <div className="comparison-detail__vote-bar" aria-hidden="true">
            <span style={{ width: `${comparison.voteSummary.leftPercent}%` }}>
              {comparison.voteSummary.leftPercent}% · {leftBikeName}
            </span>
            <strong>
              {rightBikeName} · {comparison.voteSummary.rightPercent}%
            </strong>
          </div>
          <p>
            Total de votos: {numberFormatter.format(comparison.voteSummary.totalVotes)} · Margen de error:{' '}
            {comparison.voteSummary.marginOfErrorPercent}%
          </p>
        </div>
      </section>

      <section className="comparison-detail__verdicts" aria-label="Veredictos rápidos">
        {comparison.verdicts.map((verdict) => {
          const winner = resolveBike(verdict.winnerBikeId, motorcycles);

          return (
            <article key={verdict.id}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {verdict.icon}
              </span>
              <strong>Ganadora</strong>
              <h2>{verdict.title}</h2>
              <p>{verdict.description}</p>
              <footer>{getBikeDisplayName(winner)}</footer>
            </article>
          );
        })}
      </section>

      <section className="comparison-detail__registry" aria-labelledby="comparison-registry-title">
        <h2 id="comparison-registry-title">Technical Registry</h2>
        <div className="comparison-detail__spec-table">
          <table>
            <thead>
              <tr>
                <th>Specification</th>
                <th>{leftBikeName}</th>
                <th>{rightBikeName}</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.label}>
                  <td>{spec.label}</td>
                  <td>{spec.getValue(leftBike)}</td>
                  <td>{spec.getValue(rightBike)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="comparison-detail__scores" aria-labelledby="comparison-scores-title">
        <h2 id="comparison-scores-title">Rendimiento por categoría</h2>
        <div className="comparison-detail__score-grid">
          {comparison.scores.map((score) => (
            <article key={score.id}>
              <header>
                <span>{score.label}</span>
                <strong>{getScoreWinner(score, leftBike, rightBike)}</strong>
              </header>
              <div className="comparison-detail__score-track" aria-hidden="true">
                <span style={{ width: scoreWidth(score.leftScore) }} />
                <strong style={{ width: scoreWidth(score.rightScore) }} />
              </div>
              <footer>
                <span>
                  {leftBike.brand}: {score.leftScore}/10
                </span>
                <span>
                  {rightBike.brand}: {score.rightScore}/10
                </span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-detail__pros-cons" aria-label="Puntos fuertes y puntos a mejorar">
        {[leftBike, rightBike].map((bike) => (
          <article key={bike.id}>
            <h2>{getBikeDisplayName(bike)}</h2>
            <div>
              <section>
                <h3>Puntos fuertes</h3>
                <ul>
                  {bike.pros.map((pro) => (
                    <li key={pro}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        check_circle
                      </span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>A mejorar</h3>
                <ul>
                  {bike.cons.map((con) => (
                    <li key={con}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        cancel
                      </span>
                      {con}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        ))}
      </section>

      <section className="comparison-detail__reports" aria-labelledby="comparison-reports-title">
        <div className="comparison-detail__section-heading">
          <h2 id="comparison-reports-title">Lo que los catálogos no cuentan</h2>
          <p>Reportes reales de usuarios sobre problemas y detalles de uso diario.</p>
        </div>
        <div className="comparison-detail__report-grid">
          {comparison.reports.map((report) => (
            <article className={`comparison-detail__report comparison-detail__report--${report.severity.toLowerCase()}`} key={report.id}>
              <header>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {report.icon}
                </span>
                <strong>{report.severity} severidad</strong>
              </header>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              <footer>{numberFormatter.format(report.reportCount)} reportes confirmados</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-detail__videos" aria-labelledby="comparison-videos-title">
        <h2 id="comparison-videos-title">Análisis en vídeo</h2>
        <div className="comparison-detail__video-grid">
          {comparison.videos.map((video) => (
            <article key={video.id}>
              <div>
                <img src={video.imageUrl} alt={video.alt} loading="lazy" />
                <span className="material-symbols-outlined" aria-hidden="true">
                  play_circle
                </span>
                <strong>{video.duration}</strong>
              </div>
              <h3>{video.title}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
