import { Fragment, useState } from 'react';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import {
  buildCompareViewModel,
  getBestBikeForSpec,
  getCompareHashAfterAdding,
  getCompareHashAfterRemoving,
  getFirstAddableBike,
  scoreWidth,
} from '../../../features/compare/compareUtils';
import { getBrowseSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import { Button } from '../../ui/Button';
import '../ComparisonDetailPage/ComparisonDetailPage.scss';

type ComparatorPageProps = {
  bikes: readonly Bike[];
  ignoredBikeCount?: number;
  missingBikeCount?: number;
  motorcycles?: readonly Bike[];
};

const numberFormatter = new Intl.NumberFormat('es-ES');

function navigateToHash(hash: string) {
  if (typeof window !== 'undefined') {
    window.location.hash = hash;
  }
}

function EmptyComparator() {
  return (
    <main className="comparison-detail comparison-detail--empty">
      <section className="comparison-detail__empty">
        <span>Comparador</span>
        <h1>Seleccioná al menos 2 motos</h1>
        <p>El comparador necesita una cola real. Andá al buscador y elegí entre 2 y 3 motos.</p>
        <a className="button button--primary" href={getBrowseSearchHash()}>
          Ir al buscador
        </a>
      </section>
    </main>
  );
}

export function ComparatorPage({ bikes, ignoredBikeCount = 0, missingBikeCount = 0, motorcycles = [] }: ComparatorPageProps) {
  const [voteMessage, setVoteMessage] = useState('');

  if (bikes.length < 2) {
    return <EmptyComparator />;
  }

  const comparison = buildCompareViewModel(bikes);
  const currentIds = comparison.bikes.map((bike) => bike.id);
  const addableBike = getFirstAddableBike(comparison.bikes, motorcycles);
  const hasThreeBikes = comparison.bikes.length === 3;

  return (
    <main className="comparison-detail" aria-labelledby="comparison-detail-title">
      <section className="comparison-detail__hero">
        <a className="comparison-detail__back" href={getBrowseSearchHash()}>
          ← Volver al buscador
        </a>

        <div className="comparison-detail__intro">
          <p>Technical registry</p>
          <h1 id="comparison-detail-title">{comparison.title}</h1>
          <span>
            {comparison.bikes.length} motos seleccionadas desde datos dinámicos. Misma estética, ahora con una cola real.
          </span>
        </div>

        {ignoredBikeCount > 0 ? (
          <p className="comparison-detail__notice" role="alert">
            Se ignoraron {ignoredBikeCount} moto(s) extra: el comparador admite un máximo de 3.
          </p>
        ) : null}
        {missingBikeCount > 0 ? (
          <p className="comparison-detail__notice" role="alert">
            {missingBikeCount} moto(s) de la URL no existen en el catálogo cargado.
          </p>
        ) : null}

        <div className={hasThreeBikes ? 'comparison-detail__duel comparison-detail__duel--three' : 'comparison-detail__duel'}>
          {comparison.entries.map((entry, index) => (
            <Fragment key={entry.bike.id}>
              <article
                className={[
                  'comparison-detail__hero-bike',
                  index === 0 ? 'comparison-detail__hero-bike--left' : '',
                  index === comparison.entries.length - 1 ? 'comparison-detail__hero-bike--right' : '',
                  hasThreeBikes && index === 1 ? 'comparison-detail__hero-bike--center' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <img src={entry.bike.imageUrl} alt={entry.bike.description} />
                <div>
                  <span>
                    {entry.bike.brand} · {entry.bike.segment}
                  </span>
                  <h2>{entry.displayName}</h2>
                  <div className="comparison-detail__hero-bike-actions">
                    <a href={getBikeDetailHash(entry.bike)}>Ver ficha</a>
                    <button
                      type="button"
                      onClick={() => navigateToHash(getCompareHashAfterRemoving(currentIds, entry.bike.id))}
                      aria-label={`Quitar ${entry.displayName} de la comparativa`}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>

              {index < comparison.entries.length - 1 ? (
                <div className="comparison-detail__vs" aria-hidden="true">
                  <span>VS</span>
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="comparison-detail__actions">
          <Button onClick={() => setVoteMessage(`Voto registrado para ${getBikeDisplayName(comparison.finalVerdict.winnerBike)}.`)}>
            Votar ganadora
          </Button>
          {comparison.bikes.map((bike) => (
            <a className="button button--ghost" href={getBikeDetailHash(bike)} key={bike.id}>
              Ficha {bike.brand}
            </a>
          ))}
          {addableBike ? (
            <Button variant="secondary" onClick={() => navigateToHash(getCompareHashAfterAdding(currentIds, addableBike.id))}>
              Añadir {getBikeDisplayName(addableBike)}
            </Button>
          ) : (
            <a className="button button--secondary" href={getBrowseSearchHash()}>
              Añadir otra moto
            </a>
          )}
        </div>
        {voteMessage ? <p className="comparison-detail__status" role="status">{voteMessage}</p> : null}
      </section>

      <section className="comparison-detail__vote" aria-labelledby="comparison-vote-title">
        <div>
          <h2 id="comparison-vote-title">¿Cuál elegirías?</h2>
          <p>
            Lectura dinámica basada en {numberFormatter.format(comparison.voteSummary.totalVotes)} señales mock de comunidad y
            puntuaciones de uso real.
          </p>
          <blockquote>
            “{comparison.voteSummary.topComment}”
            <cite>{comparison.voteSummary.topCommentAuthor}</cite>
          </blockquote>
        </div>

        <div className="comparison-detail__vote-results">
          <div className="comparison-detail__vote-bar" aria-label="Resultado de votos dinámico">
            {comparison.voteSummary.segments.map((segment, index) => {
              const Tag = index === 0 ? 'span' : 'strong';

              return (
                <Tag
                  key={segment.bike.id}
                  style={{ flex: `0 0 ${segment.percent}%`, width: `${segment.percent}%` }}
                >
                  {segment.percent}% · {segment.displayName}
                </Tag>
              );
            })}
          </div>
          <p>
            Total de votos: {numberFormatter.format(comparison.voteSummary.totalVotes)} · Margen de error:{' '}
            {comparison.voteSummary.marginOfErrorPercent}%
          </p>
        </div>
      </section>

      <section className="comparison-detail__verdicts" aria-label="Highlights dinámicos">
        {comparison.highlights.map((highlight) => (
          <article key={highlight.id}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {highlight.icon}
            </span>
            <strong>{highlight.badgeLabel}</strong>
            <h2>{highlight.title}</h2>
            <p>{highlight.description}</p>
            <footer>{getBikeDisplayName(highlight.winnerBike)}</footer>
          </article>
        ))}
      </section>

      <section className="comparison-detail__registry" aria-labelledby="comparison-registry-title">
        <h2 id="comparison-registry-title">Technical Registry</h2>
        <div className="comparison-detail__spec-table">
          <table>
            <thead>
              <tr>
                <th>Specification</th>
                {comparison.bikes.map((bike) => (
                  <th key={bike.id}>{getBikeDisplayName(bike)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.specRows.map((spec) => {
                const winner = getBestBikeForSpec(spec, comparison.bikes);

                return (
                  <tr key={spec.id}>
                    <td>{spec.label}</td>
                    {comparison.bikes.map((bike) => (
                      <td className={winner?.id === bike.id ? 'comparison-detail__winner-cell' : ''} key={bike.id}>
                        {spec.getValue(bike)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="comparison-detail__scores" aria-labelledby="comparison-scores-title">
        <h2 id="comparison-scores-title">Rendimiento por categoría</h2>
        <div className="comparison-detail__score-grid">
          {comparison.performanceRows.map((row) => (
            <article key={row.id}>
              <header>
                <span>{row.label}</span>
                <strong>Gana {getBikeDisplayName(row.winnerBike)}</strong>
              </header>
              <div className="comparison-detail__score-rows">
                {row.scores.map((score) => (
                  <div className="comparison-detail__score-row" key={score.bike.id}>
                    <footer>
                      <span>{score.displayName}</span>
                      <span>{score.value.toFixed(1)}/10</span>
                    </footer>
                    <div
                      className="comparison-detail__score-track"
                      role="progressbar"
                      aria-label={`${row.label} ${score.displayName}`}
                      aria-valuemin={0}
                      aria-valuemax={10}
                      aria-valuenow={score.value}
                    >
                      <strong style={{ width: scoreWidth(score.value) }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={hasThreeBikes ? 'comparison-detail__pros-cons comparison-detail__pros-cons--three' : 'comparison-detail__pros-cons'}
        aria-label="Puntos fuertes y puntos a mejorar"
      >
        {comparison.bikes.map((bike) => (
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
          <p>Common issues generados desde los reportes de fiabilidad de cada moto.</p>
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

      <section className="comparison-detail__final-verdict" aria-labelledby="comparison-final-title">
        <div>
          <span>Final verdict</span>
          <h2 id="comparison-final-title">{comparison.finalVerdict.title}</h2>
          <p>{comparison.finalVerdict.description}</p>
        </div>
        <ol>
          {comparison.finalVerdict.ranking.map((entry) => (
            <li key={entry.bike.id}>
              <span>{entry.displayName}</span>
              <strong>{entry.overallScore.toFixed(1)}</strong>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
