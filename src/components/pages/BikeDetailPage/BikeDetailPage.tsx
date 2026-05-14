import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import { getBrowseSearchHash, getCompareSearchHash } from '../../../utils/compareQueue';
import type { Bike } from '../../../types/bike';
import './BikeDetailPage.scss';

type BikeDetailPageProps = {
  bike?: Bike;
  motorcycles: readonly Bike[];
};

type UseScoreKey = keyof Bike['useScores'];
type FeatureKey = keyof Bike['features'];

type DetailSpec = Readonly<{
  label: string;
  value: string;
}>;

type DetailSpecGroup = Readonly<{
  title: string;
  items: readonly DetailSpec[];
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

const engineTypeLabels: Record<Bike['engineType'], string> = {
  'boxer-twin': 'Bicilíndrico bóxer',
  'inline-four': 'Cuatro en línea',
  'inline-three': 'Tres en línea',
  'l-twin': 'Bicilíndrico en L',
  'parallel-twin': 'Bicilíndrico paralelo',
  'single-cylinder': 'Monocilíndrico',
  'v-twin': 'Bicilíndrico en V',
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

const featureLabels: Record<FeatureKey, string> = {
  absCornering: 'ABS en curva',
  cruiseControl: 'Control crucero',
  heatedGrips: 'Puños calefactables',
  quickshifter: 'Quickshifter',
  ridingModes: 'Modos de conducción',
  tractionControl: 'Control de tracción',
  tubelessWheels: 'Llantas tubeless',
};

const segmentProfile: Record<Bike['segment'], string> = {
  naked: 'Para pilotos que priorizan agilidad, respuesta directa y una moto viva en ciudad y carreteras de curvas.',
  'sport-touring': 'Para viajar rápido con protección, estabilidad y prestaciones sin renunciar al ritmo deportivo.',
  trail: 'Para quien quiere una moto polivalente: viajar, cargar equipaje y salir del asfalto con margen real.',
};

function getUseScoreEntries(bike: Bike) {
  return Object.entries(bike.useScores) as [UseScoreKey, number][];
}

function getFeatureEntries(bike: Bike) {
  return Object.entries(bike.features) as [FeatureKey, boolean][];
}

function clampScore(score: number) {
  return Math.max(0, Math.min(score, 10));
}

function scorePercent(score: number) {
  return `${clampScore(score) * 10}%`;
}

function getOverallScore(bike: Bike) {
  const scores = Object.values(bike.useScores);
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function getBestUse(bike: Bike) {
  const [key, value] = getUseScoreEntries(bike).sort((first, second) => second[1] - first[1])[0];
  return { label: useScoreLabels[key], value };
}

function getReliabilityLevel(score: number) {
  if (score >= 8.5) {
    return 'Excelente';
  }

  if (score >= 7.5) {
    return 'Muy buena';
  }

  if (score >= 6.5) {
    return 'Correcta';
  }

  return 'A vigilar';
}

function getSpecGroups(bike: Bike): readonly DetailSpecGroup[] {
  return [
    {
      title: 'Motor & transmisión',
      items: [
        { label: 'Tipo', value: engineTypeLabels[bike.engineType] },
        { label: 'Cilindrada', value: `${numberFormatter.format(bike.displacementCc)} cc` },
        { label: 'Potencia máxima', value: `${numberFormatter.format(bike.powerHp)} CV` },
        { label: 'Par máximo', value: `${numberFormatter.format(bike.torqueNm)} Nm` },
      ],
    },
    {
      title: 'Chasis & ergonomía',
      items: [
        { label: 'Peso en orden de marcha', value: `${numberFormatter.format(bike.wetWeightKg)} kg` },
        { label: 'Altura de asiento', value: `${numberFormatter.format(bike.seatHeightMm)} mm` },
        { label: 'Depósito', value: `${numberFormatter.format(bike.fuelTankLiters)} L` },
        { label: 'Segmento', value: segmentLabels[bike.segment] },
      ],
    },
    {
      title: 'Mercado & registro',
      items: [
        { label: 'Carnet', value: `Carnet ${bike.license}` },
        { label: 'Año', value: String(bike.year) },
        { label: 'Precio estimado', value: currencyFormatter.format(bike.priceEur) },
        { label: 'Reportes comunidad', value: numberFormatter.format(bike.reliabilityReports.reportCount) },
      ],
    },
  ];
}

function NotFoundDetail() {
  return (
    <main className="bike-detail bike-detail--not-found">
      <section className="bike-detail__not-found">
        <span>404</span>
        <h1>Moto no encontrada</h1>
        <p>Ese registro no existe en el catálogo mock actual.</p>
        <a className="button button--primary" href="#/buscador">
          Volver al buscador
        </a>
      </section>
    </main>
  );
}

export function BikeDetailPage({ bike, motorcycles }: BikeDetailPageProps) {
  if (!bike) {
    return <NotFoundDetail />;
  }

  const bikeName = getBikeDisplayName(bike);
  const overallScore = getOverallScore(bike);
  const bestUse = getBestUse(bike);
  const enabledFeatures = getFeatureEntries(bike).filter(([, isEnabled]) => isEnabled);
  const relatedBikes = motorcycles.filter((item) => item.segment === bike.segment && item.id !== bike.id).slice(0, 3);

  return (
    <main className="bike-detail" aria-labelledby="bike-detail-title">
      <header className="bike-detail__hero">
        <div className="bike-detail__hero-media" aria-hidden="true">
          <img src={bike.imageUrl} alt="" />
        </div>

        <div className="bike-detail__hero-content">
          <a className="bike-detail__back" href="#/buscador">
            ← Volver al catálogo
          </a>

          <div className="bike-detail__badges">
            <span>{segmentLabels[bike.segment]}</span>
            <span>Carnet {bike.license}</span>
            <span>{bike.year}</span>
          </div>

          <h1 id="bike-detail-title">
            {bike.brand} <strong>{bike.model}</strong>
          </h1>
          <p>{bike.description}</p>

          <div className="bike-detail__hero-specs" aria-label="Datos principales">
            <div>
              <span>Potencia</span>
              <strong>
                {numberFormatter.format(bike.powerHp)} <small>CV</small>
              </strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>
                {numberFormatter.format(bike.wetWeightKg)} <small>kg</small>
              </strong>
            </div>
            <div>
              <span>Motor</span>
              <strong>
                {numberFormatter.format(bike.displacementCc)} <small>cc</small>
              </strong>
            </div>
            <div>
              <span>Precio</span>
              <strong>{currencyFormatter.format(bike.priceEur)}</strong>
            </div>
          </div>

          <div className="bike-detail__actions">
            <a className="button button--primary" href={getCompareSearchHash(bike)}>
              Comparar en buscador
            </a>
            <a className="button button--ghost" href={getBrowseSearchHash()}>
              Ver más motos
            </a>
          </div>
        </div>
      </header>

      <section className="bike-detail__quick-specs" aria-label="Ficha rápida">
        <article>
          <span>Arquitectura</span>
          <strong>{engineTypeLabels[bike.engineType]}</strong>
          <span className="material-symbols-outlined" aria-hidden="true">
            settings_input_component
          </span>
        </article>
        <article>
          <span>Par máximo</span>
          <strong>{numberFormatter.format(bike.torqueNm)} Nm</strong>
          <span className="material-symbols-outlined" aria-hidden="true">
            bolt
          </span>
        </article>
        <article>
          <span>Altura asiento</span>
          <strong>{numberFormatter.format(bike.seatHeightMm)} mm</strong>
          <span className="material-symbols-outlined" aria-hidden="true">
            height
          </span>
        </article>
        <article>
          <span>Depósito</span>
          <strong>{numberFormatter.format(bike.fuelTankLiters)} L</strong>
          <span className="material-symbols-outlined" aria-hidden="true">
            local_gas_station
          </span>
        </article>
      </section>

      <section className="bike-detail__features" aria-labelledby="bike-detail-features-title">
        <div>
          <span>Electronics suite</span>
          <h2 id="bike-detail-features-title">Equipamiento destacado</h2>
        </div>
        <div className="bike-detail__feature-list">
          {enabledFeatures.length > 0 ? (
            enabledFeatures.map(([feature]) => <span key={feature}>{featureLabels[feature]}</span>)
          ) : (
            <span>Equipamiento electrónico básico</span>
          )}
        </div>
      </section>

      <section className="bike-detail__riding" aria-labelledby="bike-detail-riding-title">
        <div className="bike-detail__score-card">
          <span>Riding profile</span>
          <h2 id="bike-detail-riding-title">Perfil dinámico</h2>
          <p>Nuestra lectura técnica basada en uso real, ergonomía y enfoque de segmento.</p>
          <strong>{overallScore.toFixed(1)}</strong>
          <small>Overall performance</small>
        </div>

        <div className="bike-detail__score-list">
          {getUseScoreEntries(bike).map(([key, value]) => (
            <div className="bike-detail__score-row" key={key}>
              <div>
                <span>{useScoreLabels[key]}</span>
                <strong>{value.toFixed(1)}</strong>
              </div>
              <div aria-hidden="true">
                <span style={{ width: scorePercent(value) }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bike-detail__fit" aria-labelledby="bike-detail-fit-title">
        <h2 id="bike-detail-fit-title">¿Es esta moto para vos?</h2>
        <div className="bike-detail__fit-grid">
          <article>
            <span className="material-symbols-outlined" aria-hidden="true">
              person_pin
            </span>
            <h3>El perfil</h3>
            <p>{segmentProfile[bike.segment]}</p>
          </article>
          <article>
            <span className="material-symbols-outlined" aria-hidden="true">
              explore
            </span>
            <h3>Mejor uso</h3>
            <p>
              Destaca en <strong>{bestUse.label}</strong> con {bestUse.value.toFixed(1)}/10 dentro del catálogo.
            </p>
          </article>
          <article>
            <span className="material-symbols-outlined" aria-hidden="true">
              add_circle
            </span>
            <h3>Fortalezas</h3>
            <ul>
              {bike.pros.map((pro) => (
                <li key={pro}>{pro}</li>
              ))}
            </ul>
          </article>
          <article>
            <span className="material-symbols-outlined" aria-hidden="true">
              do_not_disturb_on
            </span>
            <h3>Limitaciones</h3>
            <ul>
              {bike.cons.map((con) => (
                <li key={con}>{con}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="bike-detail__reliability" aria-labelledby="bike-detail-reliability-title">
        <div>
          <h2 id="bike-detail-reliability-title">Lo que los catálogos no te cuentan</h2>
          <p>Reportes mock de comunidad técnica para detectar patrones de uso y mantenimiento.</p>
          <div className="bike-detail__reliability-index">
            <strong>{Math.round(bike.reliabilityReports.reliabilityScore * 10)}</strong>
            <span>
              Reliability index · {getReliabilityLevel(bike.reliabilityReports.reliabilityScore)} ·{' '}
              {numberFormatter.format(bike.reliabilityReports.reportCount)} reportes
            </span>
          </div>
        </div>

        <div className="bike-detail__issues">
          {bike.reliabilityReports.commonIssues.map((issue, index) => (
            <article key={issue}>
              <span>{index === 0 ? 'A vigilar' : 'Reporte frecuente'}</span>
              <p>{issue}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bike-detail__specs" aria-labelledby="bike-detail-specs-title">
        <h2 id="bike-detail-specs-title">Especificaciones detalladas</h2>
        <div className="bike-detail__spec-groups">
          {getSpecGroups(bike).map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <dl>
                {group.items.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="bike-detail__related" aria-labelledby="bike-detail-related-title">
        <div>
          <h2 id="bike-detail-related-title">Rivales del mismo segmento</h2>
          <p>Para comparar con criterio: mismo uso, distinta ejecución.</p>
        </div>

        <div className="bike-detail__related-list">
          {relatedBikes.map((relatedBike) => (
            <article key={relatedBike.id}>
              <img src={relatedBike.imageUrl} alt={relatedBike.description} loading="lazy" />
              <span>{segmentLabels[relatedBike.segment]}</span>
              <h3>{getBikeDisplayName(relatedBike)}</h3>
              <dl>
                <div>
                  <dt>Potencia</dt>
                  <dd>{numberFormatter.format(relatedBike.powerHp)} CV</dd>
                </div>
                <div>
                  <dt>Peso</dt>
                  <dd>{numberFormatter.format(relatedBike.wetWeightKg)} kg</dd>
                </div>
              </dl>
              <a href={getBikeDetailHash(relatedBike)}>Ver ficha</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
