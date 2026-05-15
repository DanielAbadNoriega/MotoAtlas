import { useEffect, useMemo, useRef, useState } from 'react';
import { getBikeDetailHash, getBikeDisplayName } from '../../../data/bikes';
import {
  clearIncomingCompareHash,
  compareQueueMaxSize,
  getIncomingCompareIdsFromHash,
  isBrowseSearchHash,
  loadCompareQueue,
  mergeCompareQueue,
  saveCompareQueue,
} from '../../../utils/compareQueue';
import type { Bike, BikeLicense, BikeSegment } from '../../../types/bike';
import {
  filterMotorcycles,
  getNextCompareSelection,
  initialSearchFilters,
  toggleArrayValue,
  type SearchFilters,
  type SortOption,
} from '../../../utils/motorcycleSearch';
import { Button } from '../../ui/Button';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { getBikeA2Badge, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { getComparatorHashFromBikes, getSearchTextFromRoute } from '../../../shared/routing/routeUtils';
import { isPendingPrice, pendingPriceLabel } from '../../../shared/dataQuality/dataQualityLabels';
import './SearchPage.scss';

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
const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

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
        id="motorcycle-search-text"
        name="motorcycle-search-text"
        placeholder="Busca por marca o modelo..."
        type="search"
        value={filters.text}
        onChange={(event) => onChange({ text: event.target.value })}
      />
    </div>
  );
}

export function AdvancedFilters({
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
                name="brands"
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
              id="min-price"
              inputMode="numeric"
              min="0"
              name="minPrice"
              placeholder="0"
              type="number"
              value={filters.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              id="max-price"
              inputMode="numeric"
              min="0"
              name="maxPrice"
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
            id="min-power"
            inputMode="numeric"
            min="0"
            name="minPower"
            placeholder="Ej: 90"
            type="number"
            value={filters.minPower}
            onChange={(event) => onChange({ minPower: event.target.value })}
          />
        </label>
        <label className="search-page__numeric-filter">
          <span>Peso máximo</span>
          <input
            id="max-weight"
            inputMode="numeric"
            min="0"
            name="maxWeight"
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

export function BikeResultCard({
  bike,
  isSelected,
  onToggleCompare,
}: {
  bike: Bike;
  isSelected: boolean;
  onToggleCompare: (bike: Bike) => void;
}) {
  const bestUse = getBestUseScore(bike);
  const a2Badge = getBikeA2Badge(bike);
  const hasPendingPrice = isPendingPrice(bike.priceEur, bike.priceSource);

  return (
    <article className={isSelected ? 'search-result-card search-result-card--selected' : 'search-result-card'}>
      <div className="search-result-card__media">
        <MotorcycleImage motorcycle={bike} loading="lazy" />
        <div className="search-result-card__badges">
          <span>{segmentLabels[bike.segment]}</span>
          <span>{a2Badge.label}</span>
        </div>
        <strong className={hasPendingPrice ? 'search-result-card__price search-result-card__price--pending' : 'search-result-card__price'}>
          {hasPendingPrice ? pendingPriceLabel : currencyFormatter.format(bike.priceEur)}
        </strong>
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

export function CompareDrawer({ selectedBikes, onClear, onRemove }: { selectedBikes: readonly Bike[]; onClear: () => void; onRemove: (bikeId: Bike['id']) => void }) {
  if (selectedBikes.length === 0) {
    return null;
  }

  return (
    <div className="search-page__compare-tray" aria-live="polite">
      <div className="search-page__compare-thumbs">
        {selectedBikes.map((bike) => (
          <button key={bike.id} type="button" onClick={() => onRemove(bike.id)} aria-label={`Quitar ${getBikeDisplayName(bike)}`}>
            <MotorcycleImage motorcycle={bike} decorative />
          </button>
        ))}
      </div>
      <div>
        <strong>Comparador</strong>
        <span>
          {selectedBikes.length}/{compareQueueMaxSize} motos seleccionadas
        </span>
      </div>
      {selectedBikes.length >= 2 ? (
        <a className="search-page__compare-status search-page__compare-status--ready" href={getComparatorHashFromBikes(selectedBikes)}>
          Comparar ahora ({selectedBikes.length})
        </a>
      ) : (
        <div className="search-page__compare-status">Elige al menos 2 motos</div>
      )}
      <button className="search-page__compare-clear" type="button" onClick={onClear} aria-label="Vaciar comparador">
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}

type SearchPageProps = {
  motorcycles: readonly Bike[];
  routeHash: string;
};

export function SearchPage({ motorcycles, routeHash }: SearchPageProps) {
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...initialSearchFilters,
    text: getSearchTextFromRoute(routeHash),
  }));
  const [selectedBikeIds, setSelectedBikeIds] = useState<Bike['id'][]>(() =>
    isBrowseSearchHash(routeHash) ? [] : loadCompareQueue(),
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState('');
  const isInitialQueueSync = useRef(true);

  const brandOptions = useMemo(() => [...new Set(motorcycles.map((bike) => bike.brand))].sort(), [motorcycles]);
  const segmentOptions = useMemo(() => [...new Set(motorcycles.map((bike) => bike.segment))].sort(), [motorcycles]);

  const updateFilters = (next: Partial<SearchFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  useEffect(() => {
    const routeSearchText = getSearchTextFromRoute(routeHash);

    if (!routeSearchText) {
      return;
    }

    setFilters((current) => (current.text === routeSearchText ? current : { ...current, text: routeSearchText }));
  }, [routeHash]);

  useEffect(() => {
    if (isInitialQueueSync.current) {
      isInitialQueueSync.current = false;

      if (isBrowseSearchHash(routeHash) && selectedBikeIds.length === 0) {
        return;
      }
    }

    saveCompareQueue(selectedBikeIds);
  }, [routeHash, selectedBikeIds]);

  useEffect(() => {
    const incomingIds = getIncomingCompareIdsFromHash(routeHash);

    if (incomingIds.length === 0) {
      return;
    }

    setSelectedBikeIds((current) => {
      const { queue, rejectedIds } = mergeCompareQueue(current, incomingIds);

      setSelectionWarning(
        rejectedIds.length > 0
          ? `La cola ya tiene ${compareQueueMaxSize} motos. Quita una antes de añadir otra.`
          : '',
      );

      return queue;
    });

    clearIncomingCompareHash(routeHash);
  }, [routeHash]);

  const filteredBikes = useMemo(() => filterMotorcycles(motorcycles, filters), [filters, motorcycles]);

  const selectedBikes = useMemo(
    () => selectedBikeIds.map((id) => motorcycles.find((bike) => bike.id === id)).filter((bike): bike is Bike => bike !== undefined),
    [motorcycles, selectedBikeIds],
  );

  const toggleCompareSelection = (bike: Bike) => {
    setSelectionWarning('');
    setSelectedBikeIds((current) => {
      const nextSelection = getNextCompareSelection(current, bike.id);

      if (nextSelection.isLimitReached) {
        setSelectionWarning(`Solo puedes seleccionar hasta ${compareQueueMaxSize} motos para comparar.`);
      }

      return nextSelection.selectedIds;
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
        <AdvancedFilters
          brandOptions={brandOptions}
          filters={filters}
          isOpen={isFilterPanelOpen}
          onChange={updateFilters}
          onClose={() => setIsFilterPanelOpen(false)}
          onReset={() => {
            setFilters(initialSearchFilters);
            setSelectionWarning('');
          }}
          segmentOptions={segmentOptions}
        />

        <div className="search-page__results">
          <header className="search-page__results-header">
            <div>
              <span>Catálogo</span>
              <h2>{numberFormatter.format(filteredBikes.length)} resultados encontrados</h2>
              <p>Mostrando motos desde Supabase o fallback local si la conexión falla.</p>
            </div>
            <label>
              <span>Ordenar por</span>
              <select id="search-sort" name="sort" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as SortOption })}>
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
              <p>Relaja algún criterio. Si filtras como inspector de la NASA, el catálogo se queda seco.</p>
              <Button onClick={() => setFilters(initialSearchFilters)}>Resetear filtros</Button>
            </div>
          ) : null}
        </div>
      </section>

      <CompareDrawer
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
