import { Fragment, useEffect, useState } from 'react';
import comparisonHeroImage from '../../../assets/versus-bikes.png';
import { getBikeDetailHash } from '../../../data/bikes';
import {
  buildCompareViewModel,
  getBestBikeForSpec,
  getBikeBrandLabel,
  getBikeCons,
  getBikePros,
  getBikeA2Label,
  getBikeDataQualityNotes,
  getBikeSegmentLabel,
  getSafeBikeDisplayName,
  getFirstAddableBike,
  scoreWidth,
} from '../../../features/compare/compareUtils';
import { getBrowseSearchHash, getModifyComparisonSearchHash, saveCompareQueue } from '../../../utils/compareQueue';
import { getComparatorHashFromBikes } from '../../../shared/routing/routeUtils';
import type { Bike } from '../../../types/bike';
import { Button } from '../../ui/Button';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
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

function getCompareHashForIds(ids: readonly Bike['id'][], motorcycles: readonly Bike[]) {
  const bikes = ids
    .map((id) => motorcycles.find((motorcycle) => motorcycle.id === id))
    .filter((motorcycle): motorcycle is Bike => Boolean(motorcycle));

  return bikes.length === ids.length ? getComparatorHashFromBikes(bikes) : `#/comparador?bikes=${ids.join(',')}`;
}

function persistAndNavigateToComparison(ids: readonly Bike['id'][], motorcycles: readonly Bike[]) {
  saveCompareQueue(ids);
  navigateToHash(getCompareHashForIds(ids, motorcycles));
}

function EmptyComparator() {
  return (
    <main className="comparison-detail comparison-detail--empty">
      <section className="comparison-detail__empty">
        <span>Comparador</span>
        <h1>Selecciona al menos 2 motos</h1>
        <p>Selecciona hasta 3 motos para comparar ficha técnica, prestaciones y valoración de la comunidad.</p>
        <a className="button button--primary" href={getBrowseSearchHash()}>
          Ir al buscador
        </a>
      </section>
    </main>
  );
}


function OneBikeComparator({ bike, motorcycles }: { bike: Bike; motorcycles: readonly Bike[] }) {
  const addableBike = getFirstAddableBike([bike], motorcycles);
  const displayName = getSafeBikeDisplayName(bike);

  return (
    <main className="comparison-detail comparison-detail--empty">
      <section className="comparison-detail__empty">
        <span>Comparador</span>
        <h1>Añade otra moto para comparar</h1>
        <p>{displayName} ya está en la cola. Añade una segunda moto para activar el comparador dinámico.</p>
        {addableBike ? (
          <div className="comparison-detail__empty-actions">
            <button
              className="button button--primary"
              type="button"
              onClick={() => persistAndNavigateToComparison([bike.id, addableBike.id], motorcycles)}
              aria-label={`Añadir ${getSafeBikeDisplayName(addableBike)} a la comparativa`}
            >
              Añadir {getSafeBikeDisplayName(addableBike)}
            </button>
            <a className="button button--secondary" href={getModifyComparisonSearchHash()} onClick={() => saveCompareQueue([bike.id])}>
              Buscar otra moto
            </a>
          </div>
        ) : (
          <a className="button button--primary" href={getModifyComparisonSearchHash()} onClick={() => saveCompareQueue([bike.id])}>
            Buscar otra moto
          </a>
        )}
      </section>
    </main>
  );
}

function DataList({ icon, items }: { icon: 'cancel' | 'check_circle'; items: readonly string[] }) {
  if (items.length === 0) {
    return (
      <ul>
        <li>
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
          Sin datos disponibles
        </li>
      </ul>
    );
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <span className="material-symbols-outlined" aria-hidden="true">
            {icon}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ComparatorPage({ bikes, ignoredBikeCount = 0, missingBikeCount = 0, motorcycles = [] }: ComparatorPageProps) {
  const [voteMessage, setVoteMessage] = useState('');
  const [selectedVoteBikeId, setSelectedVoteBikeId] = useState<Bike['id'] | undefined>();
  const queueIds = bikes.map((bike) => bike.id);

  useEffect(() => {
    if (queueIds.length > 0) {
      saveCompareQueue(queueIds);
    }
  }, [queueIds.join('|')]);

  if (bikes.length === 0) {
    return <EmptyComparator />;
  }

  if (bikes.length === 1) {
    return <OneBikeComparator bike={bikes[0]} motorcycles={motorcycles} />;
  }

  const comparison = buildCompareViewModel(bikes);
  const currentIds = comparison.bikes.map((bike) => bike.id);
  const addableBike = getFirstAddableBike(comparison.bikes, motorcycles);
  const hasThreeBikes = comparison.bikes.length === 3;
  const selectedVoteBike =
    comparison.bikes.find((bike) => bike.id === selectedVoteBikeId) ?? comparison.finalVerdict.winnerBike;

  return (
    <main className="comparison-detail" aria-labelledby="comparison-detail-title">
      <section className="comparison-detail__hero">
        <div className="comparison-detail__hero-media" aria-hidden="true">
          <img src={comparisonHeroImage} alt="" />
        </div>
        <a className="comparison-detail__back" href={getBrowseSearchHash()}>
          ← Volver al buscador
        </a>

        <div className="comparison-detail__intro">
          <p>Technical registry</p>
          <h1 id="comparison-detail-title">{comparison.title}</h1>
          <span>Compara ficha técnica, prestaciones y valoración de la comunidad en una vista clara y directa.</span>
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

        <div
          className={hasThreeBikes ? 'comparison-detail__duel comparison-detail__duel--three' : 'comparison-detail__duel'}
          aria-label="Duelo de motos seleccionadas"
        >
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
                <MotorcycleImage motorcycle={entry.bike} />
                <div>
                  <span>
                    {getBikeBrandLabel(entry.bike)} · {getBikeSegmentLabel(entry.bike)} · {getBikeA2Label(entry.bike)}
                  </span>
                  <h2>{entry.displayName}</h2>
                  <div className="comparison-detail__data-notes" aria-label={`Calidad de datos de ${entry.displayName}`}>
                    {getBikeDataQualityNotes(entry.bike).map((note) => (
                      <small key={note.id} title={note.description}>{note.label}</small>
                    ))}
                  </div>
                  <div className="comparison-detail__hero-bike-actions">
                    <a href={getBikeDetailHash(entry.bike)} aria-label={`Ver ficha de ${entry.displayName}`}>Ver ficha</a>
                    <button
                      type="button"
                      onClick={() => persistAndNavigateToComparison(currentIds.filter((id) => id !== entry.bike.id), motorcycles)}
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
          <div className="comparison-detail__vote-choice" role="group" aria-label="Elige tu ganadora">
            {comparison.bikes.map((bike) => {
              const isSelected = selectedVoteBike.id === bike.id;

              return (
                <button
                  aria-pressed={isSelected}
                  className={isSelected ? 'comparison-detail__vote-option comparison-detail__vote-option--active' : 'comparison-detail__vote-option'}
                  key={bike.id}
                  type="button"
                  onClick={() => setSelectedVoteBikeId(bike.id)}
                >
                  {getSafeBikeDisplayName(bike)}
                </button>
              );
            })}
          </div>
          <Button onClick={() => setVoteMessage(`Voto registrado para ${getSafeBikeDisplayName(selectedVoteBike)}.`)}>
            Votar {getBikeBrandLabel(selectedVoteBike)}
          </Button>
          {comparison.bikes.map((bike) => (
            <a className="button button--ghost" href={getBikeDetailHash(bike)} key={bike.id} aria-label={`Ver ficha de ${getSafeBikeDisplayName(bike)}`}>
              Ficha {getBikeBrandLabel(bike)}
            </a>
          ))}
          {addableBike ? (
            <>
              <Button variant="secondary" onClick={() => persistAndNavigateToComparison([...currentIds, addableBike.id], motorcycles)} aria-label={`Añadir ${getSafeBikeDisplayName(addableBike)} a la comparativa`}>
                Añadir {getSafeBikeDisplayName(addableBike)}
              </Button>
              <a className="button button--ghost" href={getModifyComparisonSearchHash()} onClick={() => saveCompareQueue(currentIds)}>
                Elegir otra moto
              </a>
            </>
          ) : (
            <a className="button button--secondary" href={getModifyComparisonSearchHash()} onClick={() => saveCompareQueue(currentIds)}>
              Modificar comparativa
            </a>
          )}
        </div>
        {voteMessage ? <p className="comparison-detail__status" role="status">{voteMessage}</p> : null}
      </section>

      <section className="comparison-detail__vote" aria-labelledby="comparison-vote-title">
        <div>
          <h2 id="comparison-vote-title">¿Cuál elegirías?</h2>
          <p>
            Basado en {numberFormatter.format(comparison.voteSummary.totalVotes)} valoraciones de la comunidad y datos de uso real.
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
            <footer>{getSafeBikeDisplayName(highlight.winnerBike)}</footer>
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
                  <th key={bike.id}>{getSafeBikeDisplayName(bike)}</th>
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
                <strong>Gana {getSafeBikeDisplayName(row.winnerBike)}</strong>
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
            <h2>{getSafeBikeDisplayName(bike)}</h2>
            <div>
              <section>
                <h3>Puntos fuertes</h3>
                <DataList icon="check_circle" items={getBikePros(bike)} />
              </section>
              <section>
                <h3>A mejorar</h3>
                <DataList icon="cancel" items={getBikeCons(bike)} />
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
        <h2 id="comparison-videos-title">Análisis destacados</h2>
        <div className="comparison-detail__video-grid">
          {comparison.videos.map((video) => (
            <article key={video.id}>
              <div>
                <MotorcycleImage motorcycle={video.bike} alt={video.alt} loading="lazy" />
              </div>
              <h3>{video.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-detail__final-verdict" aria-labelledby="comparison-final-title">
        <div>
          <span>Veredicto final</span>
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
