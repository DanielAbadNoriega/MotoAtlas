import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Bike, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../../../types/bike';
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
import {
  getBikeA2Badge,
  MOTORCYCLE_DATA_SOURCES,
  segmentLabels,
  type BikeA2Status,
} from '../../../shared/motorcycles/motorcycleTaxonomy';
import {
  getAvailableMotorcycleSegmentFilterOptions,
  getMotorcycleLicenseFilterLabel,
  getMotorcycleSegmentFilterTargetSegments,
  motorcycleLicenseFilterOptions,
} from '../../../shared/filters/motorcycleFilterOptions';
import { getComparatorHashFromBikes, getSearchTextFromRoute } from '../../../shared/routing/routeUtils';
import { getDataQualityLabel, isPendingPrice, pendingPriceLabel } from '../../../shared/dataQuality/dataQualityLabels';
import { AccountPagination } from '../AccountPage/AccountPagination';
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
const SEARCH_RESULTS_PER_PAGE = 9;
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const featureLabels: Record<keyof BikeFeatures, string> = {
  absCornering: 'ABS curva',
  cruiseControl: 'Control crucero',
  heatedGrips: 'Puños calefactables',
  quickshifter: 'Quickshifter',
  ridingModes: 'Modos conducción',
  tractionControl: 'Control tracción',
  tubelessWheels: 'Llantas tubeless',
};

const useLabels: Record<keyof BikeUseScores, string> = {
  beginner: 'Principiante',
  city: 'Ciudad',
  funFactor: 'Diversión',
  offroad: 'Off-road',
  passenger: 'Pasajero',
  sport: 'Deportivo',
  touring: 'Viaje',
};

type RangeField = 'price' | 'power' | 'weight' | 'seatHeight';

type RangePreset = Readonly<{
  field: RangeField;
  label: string;
  max?: string;
  min?: string;
}>;

const mobileRangePresets: Record<RangeField, readonly RangePreset[]> = {
  price: [
    { field: 'price', label: 'Hasta 5.000 €', max: '5000' },
    { field: 'price', label: '5.000 - 10.000 €', min: '5000', max: '10000' },
    { field: 'price', label: '10.000 - 15.000 €', min: '10000', max: '15000' },
    { field: 'price', label: '15.000 - 20.000 €', min: '15000', max: '20000' },
    { field: 'price', label: 'Más de 20.000 €', min: '20000' },
  ],
  power: [
    { field: 'power', label: 'Hasta 47 CV', max: '47' },
    { field: 'power', label: '48 - 75 CV', min: '48', max: '75' },
    { field: 'power', label: '76 - 115 CV', min: '76', max: '115' },
    { field: 'power', label: '116+ CV', min: '116' },
  ],
  weight: [
    { field: 'weight', label: 'Menos de 180 kg', max: '180' },
    { field: 'weight', label: '180 - 210 kg', min: '180', max: '210' },
    { field: 'weight', label: '211 - 240 kg', min: '211', max: '240' },
    { field: 'weight', label: 'Más de 240 kg', min: '240' },
  ],
  seatHeight: [
    { field: 'seatHeight', label: 'Menos de 800 mm', max: '800' },
    { field: 'seatHeight', label: '800 - 850 mm', min: '800', max: '850' },
    { field: 'seatHeight', label: '851 - 900 mm', min: '851', max: '900' },
    { field: 'seatHeight', label: 'Más de 900 mm', min: '900' },
  ],
};

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

type ActiveFilterChip = Readonly<{
  id: string;
  label: string;
  onRemove: () => void;
}>;

function ActiveFilterChips({ chips, compact = false }: { chips: readonly ActiveFilterChip[]; compact?: boolean }) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={compact ? 'search-page__active-filters search-page__active-filters--compact' : 'search-page__active-filters'} aria-label="Filtros activos">
      {chips.map((chip) => (
        <button key={chip.id} type="button" onClick={chip.onRemove} aria-label={`Quitar filtro ${chip.label}`}>
          <span>{chip.label}</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      ))}
    </div>
  );
}

function FilterGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <details className="search-page__filter-group" open>
      <summary>
        <span>{title}</span>
        <span className="material-symbols-outlined" aria-hidden="true">
          expand_more
        </span>
      </summary>
      <div className="search-page__filter-group-body">{children}</div>
    </details>
  );
}

function getRangeFields(field: RangeField) {
  if (field === 'price') {
    return ['minPrice', 'maxPrice'] as const;
  }

  if (field === 'power') {
    return ['minPower', 'maxPower'] as const;
  }

  if (field === 'weight') {
    return ['minWeight', 'maxWeight'] as const;
  }

  return ['minSeatHeight', 'maxSeatHeight'] as const;
}

function isLicenseFilterValue(value: BikeA2Status): value is BikeLicense {
  return value === 'A2' || value === 'A';
}

function RangeFilter({
  field,
  filters,
  max,
  min,
  onChange,
  title,
  unit,
}: {
  field: RangeField;
  filters: SearchFilters;
  max: number;
  min: number;
  onChange: (next: Partial<SearchFilters>) => void;
  title: string;
  unit: string;
}) {
  const [minField, maxField] = getRangeFields(field);
  const currentMin = filters[minField];
  const currentMax = filters[maxField];
  const presets = mobileRangePresets[field];

  const applyPreset = (preset: RangePreset) => {
    const isSelected = currentMin === (preset.min ?? '') && currentMax === (preset.max ?? '');
    onChange({ [minField]: isSelected ? '' : preset.min ?? '', [maxField]: isSelected ? '' : preset.max ?? '' });
  };

  return (
    <>
      <div className="search-page__range-desktop" data-testid={`${field}-range-desktop`}>
        <div className="search-page__range-values">
          <span>{currentMin || min} {unit}</span>
          <span>{currentMax || max} {unit}</span>
        </div>
        <label>
          <span>{title} mínimo</span>
          <input
            aria-label={`${title} mínimo`}
            max={max}
            min={min}
            name={String(minField)}
            type="range"
            value={currentMin || min}
            onChange={(event) => onChange({ [minField]: event.target.value })}
          />
        </label>
        <label>
          <span>{title} máximo</span>
          <input
            aria-label={`${title} máximo`}
            max={max}
            min={min}
            name={String(maxField)}
            type="range"
            value={currentMax || max}
            onChange={(event) => onChange({ [maxField]: event.target.value })}
          />
        </label>
      </div>
      <div className="search-page__range-presets" data-testid={`${field}-range-presets`}>
        {presets.map((preset) => {
          const isSelected = currentMin === (preset.min ?? '') && currentMax === (preset.max ?? '');

          return (
            <button
              className={isSelected ? 'search-page__option-card search-page__option-card--active' : 'search-page__option-card'}
              key={preset.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function AdvancedFilters({
  activeChips = [],
  brandOptions,
  filters,
  isOpen,
  onApply,
  onChange,
  onClose,
  onReset,
  segmentOptions,
}: {
  activeChips?: readonly ActiveFilterChip[];
  brandOptions: readonly string[];
  filters: SearchFilters;
  isOpen: boolean;
  onApply?: () => void;
  onChange: (next: Partial<SearchFilters>) => void;
  onClose: () => void;
  onReset: () => void;
  segmentOptions: readonly BikeSegment[];
}) {
  const panelClasses = ['search-page__filters', isOpen ? 'search-page__filters--open' : ''].filter(Boolean).join(' ');
  const visibleSegmentOptions = useMemo(
    () => getAvailableMotorcycleSegmentFilterOptions(segmentOptions),
    [segmentOptions],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const applyFilters = () => {
    onApply?.();
    onClose();
  };

  return (
    <>
      {isOpen ? <button className="search-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <aside
        className={panelClasses}
        aria-label="Filtros de búsqueda"
        aria-labelledby="search-filters-title"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="search-page__sheet-handle" aria-hidden="true" />
        <div className="search-page__filters-header">
          <h2 id="search-filters-title">Filtros avanzados</h2>
          <button type="button" onClick={onReset}>
            Limpiar filtros
          </button>
          <button className="search-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="search-page__filters-body">
          <ActiveFilterChips chips={activeChips} compact />

          <FilterGroup title="Marca">
            <div className="search-page__brand-grid">
              {brandOptions.map((brand) => {
                const isSelected = filters.brands.includes(brand);

                return (
                  <button
                    className={isSelected ? 'search-page__brand-card search-page__brand-card--active' : 'search-page__brand-card'}
                    key={brand}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ brands: toggleArrayValue(filters.brands, brand) })}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Segmento">
            <div className="search-page__segment-grid">
              {visibleSegmentOptions.map((option) => {
                const targetSegments = getMotorcycleSegmentFilterTargetSegments(option.value, segmentOptions);
                const isSelected = option.value === 'all'
                  ? filters.segments.length === 0
                  : targetSegments.length > 0 && targetSegments.every((segment) => filters.segments.includes(segment));

                const toggleSegment = () => {
                  if (option.value === 'all') {
                    onChange({ segments: [] });
                    return;
                  }

                  const nextSegments = isSelected
                    ? filters.segments.filter((segment) => !targetSegments.includes(segment))
                    : [...filters.segments, ...targetSegments.filter((segment) => !filters.segments.includes(segment))];

                  onChange({ segments: nextSegments });
                };

                return (
                  <button
                    className={isSelected ? 'search-page__option-card search-page__option-card--active' : 'search-page__option-card'}
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={toggleSegment}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {option.icon}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet">
            <div className="search-page__pill-list">
              {motorcycleLicenseFilterOptions.map((option) => {
                if (isLicenseFilterValue(option.value)) {
                  const license = option.value;
                  const isSelected = filters.licenses.includes(license);

                  return (
                    <button
                      className={isSelected ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onChange({ licenses: toggleArrayValue(filters.licenses, license) })}
                    >
                      {option.label}
                    </button>
                  );
                }

                const status = option.value;
                const isSelected = filters.a2Statuses.includes(status);

                return (
                  <button
                    className={isSelected ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ a2Statuses: toggleArrayValue(filters.a2Statuses, status) })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Precio">
            <RangeFilter field="price" filters={filters} min={0} max={30000} onChange={onChange} title="Precio" unit="€" />
          </FilterGroup>

          <FilterGroup title="Potencia">
            <RangeFilter field="power" filters={filters} min={0} max={180} onChange={onChange} title="Potencia" unit="CV" />
          </FilterGroup>

          <FilterGroup title="Peso">
            <RangeFilter field="weight" filters={filters} min={120} max={320} onChange={onChange} title="Peso" unit="kg" />
          </FilterGroup>

          <FilterGroup title="Altura asiento">
            <RangeFilter field="seatHeight" filters={filters} min={720} max={950} onChange={onChange} title="Altura asiento" unit="mm" />
          </FilterGroup>

          <FilterGroup title="Electrónica">
            <div className="search-page__toggle-grid">
              {(Object.entries(featureLabels) as [keyof BikeFeatures, string][]).map(([feature, label]) => {
                const isSelected = filters.equipment.includes(feature);

                return (
                  <button
                    className={isSelected ? 'search-page__toggle-card search-page__toggle-card--active' : 'search-page__toggle-card'}
                    key={feature}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ equipment: toggleArrayValue(filters.equipment, feature) })}
                  >
                    <span>{label}</span>
                    <span aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso recomendado">
            <div className="search-page__pill-list">
              {(Object.entries(useLabels) as [keyof BikeUseScores, string][]).map(([use, label]) => {
                const isSelected = filters.recommendedUses.includes(use);

                return (
                  <button
                    className={isSelected ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
                    key={use}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ recommendedUses: toggleArrayValue(filters.recommendedUses, use) })}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Calidad de datos">
            <div className="search-page__pill-list">
              {MOTORCYCLE_DATA_SOURCES.map((source) => {
                const isSelected = filters.dataSources.includes(source);

                return (
                  <button
                    className={isSelected ? 'search-page__pill search-page__pill--active' : 'search-page__pill'}
                    key={source}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ dataSources: toggleArrayValue(filters.dataSources, source) })}
                  >
                    {getDataQualityLabel(source)}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        </div>

        <footer className="search-page__filters-footer">
          <button type="button" onClick={onReset}>
            Limpiar filtros
          </button>
          <button type="button" onClick={applyFilters}>
            Aplicar filtros
          </button>
        </footer>
      </aside>
    </>
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
    <article className={isSelected ? 'search-result-card search-result-card--selected' : 'search-result-card'} data-testid="search-result-card">
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

  const emptySlotCount = Math.max(0, compareQueueMaxSize - selectedBikes.length);

  return (
    <div className="search-page__compare-tray" aria-label="Comparador flotante" aria-live="polite">
      <div className="search-page__compare-slots">
        {selectedBikes.map((bike) => {
          const displayName = getBikeDisplayName(bike);

          return (
            <article
              className="search-page__compare-slot search-page__compare-slot--filled"
              data-testid="compare-slot-filled"
              key={bike.id}
              title={displayName}
              aria-label={`Moto seleccionada: ${displayName}`}
            >
              <MotorcycleImage motorcycle={bike} decorative />
              <div className="search-page__compare-slot-label">
                <span>{bike.brand}</span>
                <strong>{bike.model}</strong>
              </div>
              <button type="button" onClick={() => onRemove(bike.id)} aria-label={`Quitar ${displayName} del comparador`}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </article>
          );
        })}
        {Array.from({ length: emptySlotCount }, (_, index) => (
          <div className="search-page__compare-slot search-page__compare-slot--empty" data-testid="compare-slot-empty" key={`empty-slot-${index}`} aria-hidden="true">
            <span className="material-symbols-outlined">add</span>
            <span>Añadir</span>
          </div>
        ))}
      </div>

      {selectedBikes.length >= 2 ? (
        <a className="search-page__compare-status search-page__compare-status--ready" href={getComparatorHashFromBikes(selectedBikes)} aria-label={`Comparar (${selectedBikes.length})`}>
          <span>Comparar</span>
          <strong>{selectedBikes.length}</strong>
        </a>
      ) : (
        <div className="search-page__compare-status">Elige al menos 2 motos</div>
      )}

      <button className="search-page__compare-clear" type="button" onClick={onClear} aria-label="Limpiar selección del comparador">
        <span className="material-symbols-outlined" aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}

function formatRangeLabel(prefix: string, minValue: string, maxValue: string, unit: string) {
  if (minValue && maxValue) {
    return `${prefix} ${numberFormatter.format(Number(minValue))} - ${numberFormatter.format(Number(maxValue))} ${unit}`;
  }

  if (minValue) {
    return `${prefix} desde ${numberFormatter.format(Number(minValue))} ${unit}`;
  }

  return `${prefix} hasta ${numberFormatter.format(Number(maxValue))} ${unit}`;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectionWarning, setSelectionWarning] = useState('');
  const isInitialQueueSync = useRef(true);

  const brandOptions = useMemo(() => [...new Set(motorcycles.map((bike) => bike.brand))].sort(), [motorcycles]);
  const segmentOptions = useMemo(() => [...new Set(motorcycles.map((bike) => bike.segment))].sort(), [motorcycles]);

  const updateFilters = (next: Partial<SearchFilters>) => {
    setCurrentPage(1);
    setFilters((current) => ({ ...current, ...next }));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters(initialSearchFilters);
    setSelectionWarning('');
  };

  const activeFilterChips = useMemo<readonly ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.text) {
      chips.push({ id: 'text', label: `Texto: ${filters.text}`, onRemove: () => updateFilters({ text: '' }) });
    }

    filters.brands.forEach((brand) => {
      chips.push({
        id: `brand-${brand}`,
        label: brand,
        onRemove: () => updateFilters({ brands: filters.brands.filter((item) => item !== brand) }),
      });
    });

    filters.segments.forEach((segment) => {
      chips.push({
        id: `segment-${segment}`,
        label: segmentLabels[segment],
        onRemove: () => updateFilters({ segments: filters.segments.filter((item) => item !== segment) }),
      });
    });

    filters.licenses.forEach((license) => {
      chips.push({
        id: `license-${license}`,
        label: getMotorcycleLicenseFilterLabel(license),
        onRemove: () => updateFilters({ licenses: filters.licenses.filter((item) => item !== license) }),
      });
    });

    filters.a2Statuses.forEach((status) => {
      chips.push({
        id: `a2-${status}`,
        label: getMotorcycleLicenseFilterLabel(status),
        onRemove: () => updateFilters({ a2Statuses: filters.a2Statuses.filter((item) => item !== status) }),
      });
    });

    if (filters.minPrice || filters.maxPrice) {
      chips.push({
        id: 'price-range',
        label: formatRangeLabel('Precio', filters.minPrice, filters.maxPrice, '€'),
        onRemove: () => updateFilters({ maxPrice: '', minPrice: '' }),
      });
    }

    if (filters.minPower || filters.maxPower) {
      chips.push({
        id: 'power-range',
        label: formatRangeLabel('Potencia', filters.minPower, filters.maxPower, 'CV'),
        onRemove: () => updateFilters({ maxPower: '', minPower: '' }),
      });
    }

    if (filters.minWeight || filters.maxWeight) {
      chips.push({
        id: 'weight-range',
        label: formatRangeLabel('Peso', filters.minWeight, filters.maxWeight, 'kg'),
        onRemove: () => updateFilters({ maxWeight: '', minWeight: '' }),
      });
    }

    if (filters.minSeatHeight || filters.maxSeatHeight) {
      chips.push({
        id: 'seat-range',
        label: formatRangeLabel('Asiento', filters.minSeatHeight, filters.maxSeatHeight, 'mm'),
        onRemove: () => updateFilters({ maxSeatHeight: '', minSeatHeight: '' }),
      });
    }

    filters.equipment.forEach((feature) => {
      chips.push({
        id: `feature-${feature}`,
        label: featureLabels[feature],
        onRemove: () => updateFilters({ equipment: filters.equipment.filter((item) => item !== feature) }),
      });
    });

    filters.recommendedUses.forEach((use) => {
      chips.push({
        id: `use-${use}`,
        label: useLabels[use],
        onRemove: () => updateFilters({ recommendedUses: filters.recommendedUses.filter((item) => item !== use) }),
      });
    });

    filters.dataSources.forEach((source) => {
      chips.push({
        id: `source-${source}`,
        label: getDataQualityLabel(source),
        onRemove: () => updateFilters({ dataSources: filters.dataSources.filter((item) => item !== source) }),
      });
    });

    return chips;
  }, [filters]);

  useEffect(() => {
    const routeSearchText = getSearchTextFromRoute(routeHash);

    if (!routeSearchText) {
      return;
    }

    setCurrentPage(1);
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
  const totalPages = Math.max(1, Math.ceil(filteredBikes.length / SEARCH_RESULTS_PER_PAGE));
  const paginatedBikes = filteredBikes.slice((currentPage - 1) * SEARCH_RESULTS_PER_PAGE, currentPage * SEARCH_RESULTS_PER_PAGE);

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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          activeChips={activeFilterChips}
          brandOptions={brandOptions}
          filters={filters}
          isOpen={isFilterPanelOpen}
          onChange={updateFilters}
          onApply={() => setSelectionWarning('')}
          onClose={() => setIsFilterPanelOpen(false)}
          onReset={clearFilters}
          segmentOptions={segmentOptions}
        />

        <div className="search-page__results">
          <ActiveFilterChips chips={activeFilterChips} />
          <header className="search-page__results-header">
            <div>
              <span>Catálogo</span>
              <h2>{numberFormatter.format(filteredBikes.length)} resultados encontrados</h2>
              <p>Resultados del catálogo completo de MotoAtlas.</p>
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
            {paginatedBikes.map((bike) => (
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
              <Button onClick={clearFilters}>Resetear filtros</Button>
            </div>
          ) : null}

          <AccountPagination
            ariaLabel="Paginación de motos"
            className="search-page__pagination"
            currentClassName="search-page__pagination-current"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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
