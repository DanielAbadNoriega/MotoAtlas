import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { getBrowseSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import './ComparatorPage.scss';

type ComparatorPageProps = {
  bikes: readonly Bike[];
};

type UseScoreKey = keyof Bike['useScores'];

type SpecRow = Readonly<{
  label: string;
  getValue: (bike: Bike) => string;
  lowerIsBetter?: boolean;
  getNumber?: (bike: Bike) => number;
}>;

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const segmentLabels: Record<Bike['segment'], string> = {
  naked: 'Naked',
  'sport-touring': 'Sport Touring',
  trail: 'Trail',
};

const useScoreLabels: Record<UseScoreKey, string> = {
  beginner: 'Principiante',
  city: 'Ciudad',
  funFactor: 'Diversión',
  offroad: 'Off-road',
  passenger: 'Pasajero',
  sport: 'Sport',
  touring: 'Touring',
};

const specRows = [
  {
    label: 'Precio estimado',
    getValue: (bike) => currencyFormatter.format(bike.priceEur),
    getNumber: (bike) => bike.priceEur,
    lowerIsBetter: true,
  },
  {
    label: 'Potencia',
    getValue: (bike) => `${numberFormatter.format(bike.powerHp)} CV`,
    getNumber: (bike) => bike.powerHp,
  },
  {
    label: 'Par máximo',
    getValue: (bike) => `${numberFormatter.format(bike.torqueNm)} Nm`,
    getNumber: (bike) => bike.torqueNm,
  },
  {
    label: 'Peso lleno',
    getValue: (bike) => `${numberFormatter.format(bike.wetWeightKg)} kg`,
    getNumber: (bike) => bike.wetWeightKg,
    lowerIsBetter: true,
  },
  {
    label: 'Altura asiento',
    getValue: (bike) => `${numberFormatter.format(bike.seatHeightMm)} mm`,
    getNumber: (bike) => bike.seatHeightMm,
    lowerIsBetter: true,
  },
  { label: 'Cilindrada', getValue: (bike) => `${numberFormatter.format(bike.displacementCc)} cc` },
  { label: 'Depósito', getValue: (bike) => `${numberFormatter.format(bike.fuelTankLiters)} L` },
  { label: 'Carnet', getValue: (bike) => `Carnet ${bike.license}` },
  { label: 'Segmento', getValue: (bike) => segmentLabels[bike.segment] },
] satisfies readonly SpecRow[];

const scoreKeys: readonly UseScoreKey[] = ['city', 'touring', 'offroad', 'passenger', 'beginner', 'sport', 'funFactor'];

function getOverallScore(bike: Bike) {
  const scores = Object.values(bike.useScores);
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function getBestByScore(bikes: readonly Bike[], key: UseScoreKey) {
  return [...bikes].sort((first, second) => second.useScores[key] - first.useScores[key])[0];
}

function getBestForSpec(row: SpecRow, bikes: readonly Bike[]) {
  if (!row.getNumber) {
    return undefined;
  }

  return [...bikes].sort((first, second) => {
    const firstValue = row.getNumber?.(first) ?? 0;
    const secondValue = row.getNumber?.(second) ?? 0;

    return row.lowerIsBetter ? firstValue - secondValue : secondValue - firstValue;
  })[0];
}

function scoreWidth(score: number) {
  return `${Math.max(0, Math.min(score, 10)) * 10}%`;
}

function EmptyComparator() {
  return (
    <main className="comparator-page comparator-page--empty">
      <section className="comparator-page__empty">
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

export function ComparatorPage({ bikes }: ComparatorPageProps) {
  if (bikes.length < 2) {
    return <EmptyComparator />;
  }

  const sortedByOverall = [...bikes].sort((first, second) => getOverallScore(second) - getOverallScore(first));
  const overallWinner = sortedByOverall[0];

  return (
    <main className="comparator-page" aria-labelledby="comparator-page-title">
      <section className="comparator-page__hero">
        <a className="comparator-page__back" href={getBrowseSearchHash()}>
          ← Volver al buscador
        </a>
        <span>Technical comparison</span>
        <h1 id="comparator-page-title">Comparativa de selección</h1>
        <p>
          {bikes.length} motos en la mesa. Acá no hay magia: datos técnicos, uso real y reportes para decidir con criterio.
        </p>
      </section>

      <section className="comparator-page__lineup" aria-label="Motos comparadas">
        {bikes.map((bike, index) => (
          <article key={bike.id}>
            <div className="comparator-page__lineup-media">
              <img src={bike.imageUrl} alt={bike.description} />
              <span>#{index + 1}</span>
            </div>
            <div>
              <span>{segmentLabels[bike.segment]}</span>
              <h2>{getBikeDisplayName(bike)}</h2>
              <p>{bike.description}</p>
              <strong>{getOverallScore(bike).toFixed(1)} overall</strong>
              <a href={getBikeDetailHash(bike)}>Ver ficha completa</a>
            </div>
          </article>
        ))}
      </section>

      <section className="comparator-page__verdict" aria-labelledby="comparator-verdict-title">
        <div>
          <span>Veredicto rápido</span>
          <h2 id="comparator-verdict-title">La más equilibrada ahora mismo</h2>
          <p>
            Por media de uso real, la referencia es <strong>{getBikeDisplayName(overallWinner)}</strong>. No significa que sea la
            mejor para todo: significa que gana en el balance global de esta cola.
          </p>
        </div>
        <ol>
          {sortedByOverall.map((bike) => (
            <li key={bike.id}>
              <span>{getBikeDisplayName(bike)}</span>
              <strong>{getOverallScore(bike).toFixed(1)}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="comparator-page__table" aria-labelledby="comparator-table-title">
        <h2 id="comparator-table-title">Registro técnico</h2>
        <div>
          <table>
            <thead>
              <tr>
                <th>Dato</th>
                {bikes.map((bike) => (
                  <th key={bike.id}>{getBikeDisplayName(bike)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specRows.map((row) => {
                const bestBike = getBestForSpec(row, bikes);

                return (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {bikes.map((bike) => (
                      <td className={bestBike?.id === bike.id ? 'comparator-page__winner-cell' : ''} key={bike.id}>
                        {row.getValue(bike)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="comparator-page__scores" aria-labelledby="comparator-scores-title">
        <div>
          <span>Uso real</span>
          <h2 id="comparator-scores-title">Dónde gana cada una</h2>
        </div>

        <div className="comparator-page__score-grid">
          {scoreKeys.map((key) => {
            const bestBike = getBestByScore(bikes, key);

            return (
              <article key={key}>
                <header>
                  <h3>{useScoreLabels[key]}</h3>
                  <span>Gana {getBikeDisplayName(bestBike)}</span>
                </header>
                {bikes.map((bike) => (
                  <div className="comparator-page__score-row" key={bike.id}>
                    <div>
                      <span>{getBikeDisplayName(bike)}</span>
                      <strong>{bike.useScores[key].toFixed(1)}</strong>
                    </div>
                    <div aria-hidden="true">
                      <span style={{ width: scoreWidth(bike.useScores[key]) }} />
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
