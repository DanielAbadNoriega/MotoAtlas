import { useMemo, useState } from 'react';
import { bikes, getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import type { Bike, BikeLicense, BikeSegment } from '../../../types/bike';
import { Button } from '../../ui/Button';
import './SearchPage.scss';

type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'power-desc'
  | 'power-asc'
  | 'weight-asc'
  | 'weight-desc'
  | 'year-desc'
  | 'year-asc';

type SearchFilters = {
  text: string;
  brands: string[];
  segments: BikeSegment[];
  licenses: BikeLicense[];
  minPrice: string;
  maxPrice: string;
  minPower: string;
  maxWeight: string;
  sort: SortOption;
};

const initialFilters: SearchFilters = {
  text: '',
  brands: [],
  segments: [],
  licenses: [],
  minPrice: '',
  maxPrice: '',
  minPower: '',
  maxWeight: '',
  sort: 'price-asc',
};

const segmentLabels: Record<BikeSegment, string> = {
  naked: 'Naked',
  'sport-touring': 'Sport Touring',
  trail: 'Trail',
};

const sortLabels: Record<SortOption, string> = {
  'price-asc': 'Precio: menor a mayor',
  'price-desc': 'Precio: mayor a menor',
  'power-desc': 'Potencia: mayor a menor',
  'power-asc': 'Potencia: menor a mayor',
  'weight-asc': 'Peso: menor a mayor',
  'weight-desc': 'Peso: mayor a menor',
  'year-desc': 'Año: más reciente',
  'year-asc': 'Año: más antiguo',
};

const sortOptions = Object.entries(sortLabels) as [SortOption, string][];
const bikeCatalog: readonly Bike[] = bikes;
const maxCompareSelection = 3;
const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toOptionalNumber(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toggleArrayValue<T extends string>(values: readonly T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sortBikes(results: readonly Bike[], sort: SortOption) {
  return [...results].sort((first, second) => {
    switch (sort) {
      case 'price-desc':
        return second.priceEur - first.priceEur;
      case 'power-desc':
        return second.powerHp - first.powerHp;
      case 'power-asc':
        return first.powerHp - second.powerHp;
      case 'weight-desc':
        return second.wetWeightKg - first.wetWeightKg;
      case 'weight-asc':
        return first.wetWeightKg - second.wetWeightKg;
      case 'year-desc':
        return second.year - first.year;
      case 'year-asc':
        return first.year - second.year;
      case 'price-asc':
      default:
        return first.priceEur - second.priceEur;
    }
  });
}

function getBestUseScore(bike: Bike) {
  const [key, value] = Object.entries(bike.useScores).sort((a, b) => b[1] - a[1])[0];
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    city: 'Ciudad',
    funFactor: 'Diversión',
    offroad: 'Offroad',
    passenger: 'Pasajero',
    sport: 'Sport',
    touring: 'Touring',
  };

  return { label: labels[key] ?? key, value };
}

function SearchField({ filters, onChange }: { filters: SearchFilters; onChange: (next: Partial<SearchFilters>) => void }) {
  return (
    <div className="search-page__search-field">
      <span className="material-symbols-outlined" aria-hidden="true">
        search
      </span>
      <input
        aria-label="Buscar por marca o modelo"
        placeholder="Busca por marca o modelo..."
        type="search"
        value={filters.text}
        onChange={(event) => onChange({ text: event.target.value })}
      />
    </div>
  );
}

function FilterPanel({
  brandOptions,
  filters,
  isOpen,
  onChange,
  onClose,
  onReset,
  segmentOptions,
}: {
  brandOptions: readonly string[];
  filters: SearchFilters;
  isOpen: boolean;
  onChange: (next: Partial<SearchFilters>) => void;
  onClose: () => void;
  onReset: () => void;
  segmentOptions: readonly BikeSegment[];
}) {
  const panelClasses = ['search-page__filters', isOpen ? 'search-page__filters--open' : ''].filter(Boolean).join(' ');

  return (
    <aside className={panelClasses} aria-label="Filtros de búsqueda">
      <div className="search-page__filters-header">
        <h2>Filtros avanzados</h2>
        <button type="button" onClick={onReset}>
          Resetear
        </button>
        <button className="search-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      </div>

      <section className="search-page__filter-group">
        <h3>Marca</h3>
        <div className="search-page__check-list">
          {brandOptions.map((brand) => (
            <label key={brand}>
              <input
                checked={filters.brands.includes(brand)}
                type="checkbox"
                onChange={() => onChange({ brands: toggleArrayValue(filters.brands, brand) })}
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="search-page__filter-group">
        <h3>Segmento</h3>
        <div className="search-page__pill-list">
          {segmentOptions.map((segment) => (
            <button
              className={filters.segments.includes(segment) ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
              key={segment}
              type="button"
              onClick={() => onChange({ segments: toggleArrayValue(filters.segments, segment) })}
            >
              {segmentLabels[segment]}
            </button>
          ))}
        </div>
      </section>

      <section className="search-page__filter-group">
        <h3>Carnet</h3>
        <div className="search-page__pill-list">
          {(['A2', 'A'] satisfies BikeLicense[]).map((license) => (
            <button
              className={filters.licenses.includes(license) ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
              key={license}
              type="button"
              onClick={() => onChange({ licenses: toggleArrayValue(filters.licenses, license) })}
            >
              Carnet {license}
            </button>
          ))}
        </div>
      </section>

      <section className="search-page__filter-group">
        <h3>Rango de precio</h3>
        <div className="search-page__range-grid">
          <label>
            <span>Desde</span>
            <input
              inputMode="numeric"
              min="0"
              placeholder="0"
              type="number"
              value={filters.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              inputMode="numeric"
              min="0"
              placeholder="25000"
              type="number"
              value={filters.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="search-page__filter-group">
        <h3>Datos técnicos</h3>
        <label className="search-page__numeric-filter">
          <span>Potencia mínima</span>
          <input
            inputMode="numeric"
            min="0"
            placeholder="Ej: 90"
            type="number"
            value={filters.minPower}
            onChange={(event) => onChange({ minPower: event.target.value })}
          />
        </label>
        <label className="search-page__numeric-filter">
          <span>Peso máximo</span>
          <input
            inputMode="numeric"
            min="0"
            placeholder="Ej: 220"
            type="number"
            value={filters.maxWeight}
            onChange={(event) => onChange({ maxWeight: event.target.value })}
          />
        </label>
      </section>
    </aside>
  );
}

function BikeResultCard({
  bike,
  isSelected,
  onToggleCompare,
}: {
  bike: Bike;
  isSelected: boolean;
  onToggleCompare: (bike: Bike) => void;
}) {
  const bestUse = getBestUseScore(bike);

  return (
    <article className={isSelected ? 'search-result-card search-result-card--selected' : 'search-result-card'}>
      <div className="search-result-card__media">
        <img src={bike.imageUrl} alt={bike.description} loading="lazy" />
        <div className="search-result-card__badges">
          <span>{segmentLabels[bike.segment]}</span>
          <span>Carnet {bike.license}</span>
        </div>
        <strong>{currencyFormatter.format(bike.priceEur)}</strong>
      </div>

      <div className="search-result-card__body">
        <div className="search-result-card__title-row">
          <div>
            <span>
              {bike.year} · {bike.brand}
            </span>
            <h3>{bike.model}</h3>
          </div>
          <p>{bike.reliabilityReports.reliabilityScore.toFixed(1)}</p>
        </div>

        <div className="search-result-card__specs">
          <div>
            <span>Cilindrada</span>
            <strong>{numberFormatter.format(bike.displacementCc)} cc</strong>
          </div>
          <div>
            <span>Potencia</span>
            <strong>{numberFormatter.format(bike.powerHp)} CV</strong>
          </div>
          <div>
            <span>Peso</span>
            <strong>{numberFormatter.format(bike.wetWeightKg)} kg</strong>
          </div>
          <div>
            <span>Asiento</span>
            <strong>{numberFormatter.format(bike.seatHeightMm)} mm</strong>
          </div>
          <div>
            <span>Depósito</span>
            <strong>{numberFormatter.format(bike.fuelTankLiters)} L</strong>
          </div>
          <div>
            <span>Uso real</span>
            <strong>
              {bestUse.label} {bestUse.value}/10
            </strong>
          </div>
        </div>

        <p className="search-result-card__description">{bike.description}</p>

        <div className="search-result-card__actions">
          <a className="button button--ghost" href={getBikeDetailHash(bike)}>
            Ver ficha
          </a>
          <Button variant={isSelected ? 'secondary' : 'primary'} onClick={() => onToggleCompare(bike)}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {isSelected ? 'check_circle' : 'compare_arrows'}
            </span>
            {isSelected ? 'Seleccionada' : 'Comparar'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function CompareTray({ selectedBikes, onClear, onRemove }: { selectedBikes: readonly Bike[]; onClear: () => void; onRemove: (bikeId: Bike['id']) => void }) {
  if (selectedBikes.length === 0) {
    return null;
  }

  return (
    <div className="search-page__compare-tray" aria-live="polite">
      <div className="search-page__compare-thumbs">
        {selectedBikes.map((bike) => (
          <button key={bike.id} type="button" onClick={() => onRemove(bike.id)} aria-label={`Quitar ${getBikeDisplayName(bike)}`}>
            <img src={bike.imageUrl} alt="" />
          </button>
        ))}
      </div>
      <div>
        <strong>Comparador</strong>
        <span>
          {selectedBikes.length}/{maxCompareSelection} motos seleccionadas
        </span>
      </div>
      <div className={selectedBikes.length >= 2 ? 'search-page__compare-status search-page__compare-status--ready' : 'search-page__compare-status'}>
        {selectedBikes.length >= 2 ? `Listas para comparar (${selectedBikes.length})` : 'Elegí al menos 2 motos'}
      </div>
      <button className="search-page__compare-clear" type="button" onClick={onClear} aria-label="Vaciar comparador">
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}

export function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [selectedBikeIds, setSelectedBikeIds] = useState<Bike['id'][]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState('');

  const brandOptions = useMemo(() => [...new Set(bikeCatalog.map((bike) => bike.brand))].sort(), []);
  const segmentOptions = useMemo(() => [...new Set(bikeCatalog.map((bike) => bike.segment))].sort(), []);

  const updateFilters = (next: Partial<SearchFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const filteredBikes = useMemo(() => {
    const text = normalizeText(filters.text);
    const minPrice = toOptionalNumber(filters.minPrice);
    const maxPrice = toOptionalNumber(filters.maxPrice);
    const minPower = toOptionalNumber(filters.minPower);
    const maxWeight = toOptionalNumber(filters.maxWeight);

    const results = bikeCatalog.filter((bike) => {
      const haystack = normalizeText(`${bike.brand} ${bike.model}`);

      return (
        (!text || haystack.includes(text)) &&
        (filters.brands.length === 0 || filters.brands.includes(bike.brand)) &&
        (filters.segments.length === 0 || filters.segments.includes(bike.segment)) &&
        (filters.licenses.length === 0 || filters.licenses.includes(bike.license)) &&
        (minPrice === undefined || bike.priceEur >= minPrice) &&
        (maxPrice === undefined || bike.priceEur <= maxPrice) &&
        (minPower === undefined || bike.powerHp >= minPower) &&
        (maxWeight === undefined || bike.wetWeightKg <= maxWeight)
      );
    });

    return sortBikes(results, filters.sort);
  }, [filters]);

  const selectedBikes = useMemo(
    () => selectedBikeIds.map((id) => bikeCatalog.find((bike) => bike.id === id)).filter((bike): bike is Bike => bike !== undefined),
    [selectedBikeIds],
  );

  const toggleCompareSelection = (bike: Bike) => {
    setSelectionWarning('');
    setSelectedBikeIds((current) => {
      if (current.includes(bike.id)) {
        return current.filter((id) => id !== bike.id);
      }

      if (current.length >= maxCompareSelection) {
        setSelectionWarning(`Solo podés seleccionar hasta ${maxCompareSelection} motos para comparar.`);
        return current;
      }

      return [...current, bike.id];
    });
  };

  return (
    <main className="search-page" aria-labelledby="search-page-title">
      <section className="search-page__hero">
        <div>
          <span>Catálogo técnico</span>
          <h1 id="search-page-title">Encuentra tu próxima moto</h1>
          <p>
            Filtra por estilo, motor, carnet, uso real y características técnicas para encontrar el equilibrio perfecto
            entre ingeniería y adrenalina.
          </p>
          <SearchField filters={filters} onChange={updateFilters} />
        </div>
      </section>

      <div className="search-page__mobile-filter-trigger">
        <Button variant="ghost" fullWidth onClick={() => setIsFilterPanelOpen(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">
            tune
          </span>
          Filtros avanzados
        </Button>
      </div>

      <section className="search-page__content">
        <FilterPanel
          brandOptions={brandOptions}
          filters={filters}
          isOpen={isFilterPanelOpen}
          onChange={updateFilters}
          onClose={() => setIsFilterPanelOpen(false)}
          onReset={() => {
            setFilters(initialFilters);
            setSelectionWarning('');
          }}
          segmentOptions={segmentOptions}
        />

        <div className="search-page__results">
          <header className="search-page__results-header">
            <div>
              <span>Catálogo</span>
              <h2>{numberFormatter.format(filteredBikes.length)} resultados encontrados</h2>
              <p>Mostrando motos desde el catálogo mock local. Sin backend, sin humo.</p>
            </div>
            <label>
              <span>Ordenar por</span>
              <select value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as SortOption })}>
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </header>

          {selectionWarning ? <p className="search-page__warning">{selectionWarning}</p> : null}

          <div className="search-page__grid">
            {filteredBikes.map((bike) => (
              <BikeResultCard
                bike={bike}
                isSelected={selectedBikeIds.includes(bike.id)}
                key={bike.id}
                onToggleCompare={toggleCompareSelection}
              />
            ))}
          </div>

          {filteredBikes.length === 0 ? (
            <div className="search-page__empty">
              <h2>No hay motos con esos filtros</h2>
              <p>Aflojá algún criterio. Si filtrás como inspector de la NASA, el catálogo se queda seco.</p>
              <Button onClick={() => setFilters(initialFilters)}>Resetear filtros</Button>
            </div>
          ) : null}
        </div>
      </section>

      <CompareTray
        selectedBikes={selectedBikes}
        onClear={() => {
          setSelectedBikeIds([]);
          setSelectionWarning('');
        }}
        onRemove={(bikeId) => setSelectedBikeIds((current) => current.filter((id) => id !== bikeId))}
      />
    </main>
  );
}
