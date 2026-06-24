import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import adminHeroImage from '../../../assets/hero-admin.png';
import { useAuth } from '../../../features/auth';
import { getBikeDisplayName } from '../../../data/bikes';
import {
  createAdminMotorcycle,
  updateAdminMotorcycle,
  type AdminMotorcycleCreatePayload,
  type AdminMotorcycleUpdatePayload,
} from '../../../services/adminMotorcycleService';
import { deleteMotorcycleImage, uploadMotorcycleImage } from '../../../services/adminMotorcycleImageUploadService';
import {
  createAdminMotorcycleGalleryImage,
  deleteAdminMotorcycleGalleryImageRecord,
  getAdminMotorcycleGalleryImages,
  updateAdminMotorcycleGalleryImage,
  type AdminMotorcycleGalleryImage,
} from '../../../services/adminMotorcycleGalleryService';
import {
  getActiveGalleryImages,
  getGalleryImageCleanupObjectPath,
  getMotorcycleImageObjectPath,
  isCleanupPathSharedWithActiveImage,
  isImageBackedByGalleryRecord,
} from './adminGalleryImageUtils';

import { BIKE_SEGMENTS, segmentIcons, segmentLabels, MOTORCYCLE_DATA_SOURCES } from '../../../shared/motorcycles/motorcycleTaxonomy';
import { dataQualityLabels, getDataQualityLabel } from '../../../shared/dataQuality/dataQualityLabels';

import { getMotorcycleTechnicalIcon } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import { normalizeText } from '../../../utils/motorcycleSearch';
import {
  buildSuggestedModelId,
  cloneAdminModelDraft,
  createDraftFromBike,
  draftToCreatePayload,
  draftToUpdatePayload,
  validateAdminModelDraftForPublish,
  type AdminModelDraft,
  type AdminModelDraftField,
  type AdminModelFeatureKey,
} from './adminModelDraftUtils';
import {
  adminModelsEditSegmentIcon,
  featureLabels,
  ITEMS_PER_PAGE,
  powerPresets,
  pricePresets,
  seatHeightPresets,
  sortOptions,
  useLabels,
  weightPresets,
  type AdminFilterOption,
  type RangeFilterPreset,
} from './adminPageConstants';
import {
  getBrandOptions,
  getDisplayName,
  isRangePresetActive,
} from './adminPageUtils';
import { FilterGroup } from '../../../shared/ui/filters/FilterGroup';
import { FilterOptionButton } from '../../../shared/ui/filters/FilterOptionButton';
import { PageHero } from '../../ui/PageHero';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { AccountPagination } from '../AccountPage/AccountPagination';
import { type AdminQuickLinksModelsItem } from '../AccountPage/AccountQuickLinksNav';
import { AdminGate, AdminSidebar, AdminDemoDataToggle } from './adminSharedUi';
import { AdminModelFormBody } from './AdminModelFormBody';
import { AdminRequestsPage } from './AdminRequestsPage';
import { AdminReviewsPage } from './AdminReviewsPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';
import type { Bike, BikeEngineType, BikeFeatures, BikeLicense, BikeSegment, BikeUseScores, MotorcycleDataSource } from '../../../types/bike';


const emptyAdminModelDraft: AdminModelDraft = {
  brand: '',
  model: '',
  year: '',
  description: '',
  modelId: '',
  segment: '',
  license: '',
  engineType: '',
  displacementCc: '',
  powerHp: '',
  torqueNm: '',
  wetWeightKg: '',
  seatHeightMm: '',
  fuelTankLiters: '',
  priceEur: '',
  pricePending: true,
  imageUrl: '',
  imageLocked: false,
  officialUrl: '',
  sourceNotes: '',
  internalNotes: '',
  features: {
    absCornering: false,
    tractionControl: false,
    ridingModes: false,
    cruiseControl: false,
    quickshifter: false,
    heatedGrips: false,
    tubelessWheels: false,
  },
};

function AdminModelsWorkspace({
  activeModelsItem,
  children,
  description,
  sidebarContent,
  title,
  titleId,
}: Readonly<{
  activeModelsItem: AdminQuickLinksModelsItem;
  children: ReactNode;
  description: string;
  sidebarContent?: ReactNode;
  title: string;
  titleId: string;
}>) {
  const { profile, user } = useAuth();

  return (
    <AdminGate>
      <PageHero
        className="admin-page__community-hero admin-page__hero"
        titleId={titleId}
        imageSrc={adminHeroImage}
        eyebrow="ADMIN STUDIO"
        title={title}
        description={description}
      >
        <div className="admin-page__hero-meta">
          <div className="admin-page__admin-chip" aria-label="Administrador activo">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {getDisplayName(profile?.displayName, user?.email)}
          </div>
        </div>
      </PageHero>

      <main className="account-page admin-page" aria-labelledby={titleId}>
        <section className="account-page__dashboard admin-page__layout">
          <AdminSidebar active="models" activeModelsItem={activeModelsItem}>
            {sidebarContent}
            <AdminDemoDataToggle />
          </AdminSidebar>
          <div className="account-page__main">{children}</div>
        </section>
      </main>
    </AdminGate>
  );
}

export function AdminModelsPage() {
  return (
    <AdminModelsWorkspace
      activeModelsItem="overview"
      description="Gestiona las fichas técnicas del catálogo MotoAtlas."
      title="Estudio de modelos"
      titleId="admin-models-title"
    >
      <section className="admin-page__dashboard-grid" aria-labelledby="admin-models-cards-title">
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">precision_manufacturing</span>
          <h2 id="admin-models-cards-title">Workspace futuro</h2>
          <p>Este hub reúne los accesos iniciales para preparar el alta y la edición del catálogo sin activar todavía formularios, búsqueda ni persistencia.</p>
        </article>
        <article className="account-page__card admin-page__summary-card admin-page__summary-card--muted">
          <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
          <h2>Nuevo modelo</h2>
          <p>Aquí arrancará el futuro flujo de alta interna del catálogo.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/nuevo">Abrir placeholder</a>
        </article>
        <article className="account-page__card admin-page__summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Editar modelo existente</h2>
          <p>Busca y selecciona una moto del catálogo para abrir su ficha interna de edición.</p>
          <a className="account-page__button account-page__button--glass" href="#/admin/modelos/editar">Seleccionar modelo</a>
        </article>
      </section>
    </AdminModelsWorkspace>
  );
}


type OnMotorcyclesChange = (bike: Bike) => void;

export function AdminNewModelPage({ onMotorcyclesChange: onMotorcyclesChangeProp }: Readonly<{ onMotorcyclesChange?: OnMotorcyclesChange }> = {}) {
  const [draft, setDraft] = useState<AdminModelDraft>(emptyAdminModelDraft);
  const [localStatus, setLocalStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [sessionUploadedStorageImageUrl, setSessionUploadedStorageImageUrl] = useState<string | null>(null);
  const [hasCreatedGalleryRecordForSessionUpload, setHasCreatedGalleryRecordForSessionUpload] = useState(false);

  const { session, user } = useAuth();

  const suggestedModelId = useMemo(() => buildSuggestedModelId(draft), [draft]);

  const handleDraftFieldChange = useCallback((field: AdminModelDraftField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleDraftCheckboxChange = useCallback((field: 'pricePending' | 'imageLocked', value: boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleFeatureToggle = useCallback((feature: AdminModelFeatureKey, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      features: {
        ...current.features,
        [feature]: checked,
      },
    }));
  }, []);

  const handleLocalAction = useCallback((message: string) => {
    setLocalStatus(message);
    if (message !== 'Publicación pendiente de persistencia.') {
      setPublishError('');
    }
  }, []);

  const handleDiscardChanges = useCallback(() => {
    setDraft(emptyAdminModelDraft);
    setLocalStatus('Cambios descartados.');
    setPublishError('');
    setSessionUploadedStorageImageUrl(null);
    setHasCreatedGalleryRecordForSessionUpload(false);
  }, []);

  const handlePublish = useCallback(async (autoUploadedUrl?: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      setPublishError('No hay sesión activa para publicar.');
      return;
    }

    const effectiveDraft = autoUploadedUrl
      ? { ...draft, imageUrl: autoUploadedUrl, imageLocked: true }
      : draft;

    const validation = validateAdminModelDraftForPublish(effectiveDraft, { mode: 'create', modelId: suggestedModelId });
    if (!validation.isValid) {
      setPublishError(validation.message);
      setLocalStatus(validation.message);
      return;
    }

    setSaving(true);
    setPublishError('');
    setLocalStatus('Publicando modelo...');

    try {
      const payload = draftToCreatePayload(effectiveDraft, suggestedModelId);
      const createdBike = await createAdminMotorcycle(payload, accessToken);
      let publishStatus = 'Modelo publicado correctamente.';
      const currentImageUrl = effectiveDraft.imageUrl.trim();
      const uploadedStorageObjectPath = sessionUploadedStorageImageUrl
        && currentImageUrl === sessionUploadedStorageImageUrl
        && !hasCreatedGalleryRecordForSessionUpload
        ? getMotorcycleImageObjectPath(sessionUploadedStorageImageUrl)
        : null;

      if (uploadedStorageObjectPath) {
        try {
          await createAdminMotorcycleGalleryImage({
            motorcycleId: createdBike.id,
            url: currentImageUrl,
            storagePath: uploadedStorageObjectPath,
            isPrimary: true,
            sortOrder: 0,
            source: 'manual',
            createdBy: user?.id ?? null,
          }, accessToken);
          setHasCreatedGalleryRecordForSessionUpload(true);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'No se pudo registrar la imagen en la galería.';
          publishStatus = `Modelo publicado correctamente. La imagen se subió, pero no se pudo registrar en la galería. ${reason}`;
        }
      }

      setLocalStatus(publishStatus);
      onMotorcyclesChangeProp?.(createdBike);
      window.location.hash = `#/motos/${createdBike.id}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al publicar el modelo.';
      setPublishError(message);
      setLocalStatus(message);
    } finally {
      setSaving(false);
    }
  }, [
    draft,
    hasCreatedGalleryRecordForSessionUpload,
    onMotorcyclesChangeProp,
    sessionUploadedStorageImageUrl,
    session?.access_token,
    suggestedModelId,
    user?.id,
  ]);

  const handleUploadImage = useCallback(async (file: File) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    const resolvedId = draft.modelId.trim() || suggestedModelId;

    if (!resolvedId) {
      throw new Error('El ID del modelo es obligatorio para subir la imagen.');
    }

    const publicUrl = await uploadMotorcycleImage(file, resolvedId, accessToken);
    setSessionUploadedStorageImageUrl(publicUrl);
    setHasCreatedGalleryRecordForSessionUpload(false);
    return publicUrl;
  }, [draft.modelId, suggestedModelId, session?.access_token]);

  const handleDeleteImage = useCallback(async (objectPath: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para eliminar la imagen.');
    }

    await deleteMotorcycleImage(objectPath, accessToken);
  }, [session?.access_token]);

  return (
    <AdminModelsWorkspace
      activeModelsItem="new"
      description="Crea, revisa y completa fichas técnicas del catálogo MotoAtlas."
      title="Nuevo modelo"
      titleId="admin-models-new-title"
    >
      {publishError ? <p className="admin-page__model-status admin-page__model-status--error" role="alert">{publishError}</p> : null}
      <AdminModelFormBody
        draft={draft}
        suggestedModelId={suggestedModelId}
        localStatus={localStatus}
        onDraftFieldChange={handleDraftFieldChange}
        onDraftCheckboxChange={handleDraftCheckboxChange}
        onFeatureToggle={handleFeatureToggle}
        onDiscardChanges={handleDiscardChanges}
        onLocalAction={handleLocalAction}
        onPublish={handlePublish}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
        saving={saving}
        toolbarKicker="Borrador local"
        workspaceHeading="Workspace de creación"
        workspaceHeadingId="admin-models-new-workspace-title"
        formLabel="Formulario de nuevo modelo"
        />
    </AdminModelsWorkspace>
  );
}

type AdminModelsEditFilters = {
  searchText: string;
  selectedBrands: string[];
  selectedSegments: BikeSegment[];
  selectedLicenses: BikeLicense[];
  minPrice: string;
  maxPrice: string;
  minPower: string;
  maxPower: string;
  minWeight: string;
  maxWeight: string;
  minSeatHeight: string;
  maxSeatHeight: string;
  equipment: (keyof BikeFeatures)[];
  recommendedUses: (keyof BikeUseScores)[];
  dataSources: MotorcycleDataSource[];
};

function AdminModelsEditFiltersPanel({
  filters,
  isOpen,
  brandOptions,
  onApplyFilters,
  onChange,
  onClearFilters,
  onClose,
}: Readonly<{
  filters: AdminModelsEditFilters;
  isOpen: boolean;
  brandOptions: readonly string[];
  onApplyFilters: () => void;
  onChange: (next: Partial<AdminModelsEditFilters>) => void;
  onClearFilters: () => void;
  onClose: () => void;
}>) {
  const hasActiveFilters = filters.searchText.length > 0
    || filters.selectedBrands.length > 0
    || filters.selectedSegments.length > 0
    || filters.selectedLicenses.length > 0
    || filters.minPrice.length > 0
    || filters.maxPrice.length > 0
    || filters.minPower.length > 0
    || filters.maxPower.length > 0
    || filters.minWeight.length > 0
    || filters.maxWeight.length > 0
    || filters.minSeatHeight.length > 0
    || filters.maxSeatHeight.length > 0
    || filters.equipment.length > 0
    || filters.recommendedUses.length > 0
    || filters.dataSources.length > 0;
  const panelClasses = ['admin-page__filters', isOpen ? 'admin-page__filters--open' : ''].filter(Boolean).join(' ');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
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

  return (
    <>
      {isOpen ? <button className="admin-page__filters-backdrop" type="button" onClick={onClose} aria-label="Cerrar filtros" /> : null}
      <section
        className={panelClasses}
        aria-label="Filtros de modelos"
        aria-modal={isOpen ? 'true' : undefined}
        role={isOpen ? 'dialog' : undefined}
      >
        <div className="admin-page__sheet-handle" aria-hidden="true" />
        <div className="admin-page__filters-header">
          <h2 id="admin-edit-models-filters-title">Filtros</h2>
          <button type="button" onClick={onClearFilters} disabled={!hasActiveFilters}>Limpiar filtros</button>
          <button className="admin-page__filters-close" type="button" onClick={onClose} aria-label="Cerrar filtros">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="admin-page__filters-body">
          <label className="admin-page__search" htmlFor="admin-edit-models-search">
            Buscar por marca o modelo
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              id="admin-edit-models-search"
              type="search"
              value={filters.searchText}
              onChange={(event) => onChange({ searchText: event.target.value })}
              placeholder="Buscar por marca o modelo…"
            />
          </label>

          <FilterGroup title="Marca">
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedBrands.length === 0}
                ariaLabel="Marca: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => onChange({ selectedBrands: [] })}
              />
              {brandOptions.map((brand) => (
                <FilterOptionButton
                  active={filters.selectedBrands.includes(brand)}
                  ariaLabel={`Marca: ${brand}`}
                  classPrefix="admin-page"
                  key={brand}
                  label={brand}
                  onClick={() => {
                    onChange({
                      selectedBrands: filters.selectedBrands.includes(brand)
                        ? filters.selectedBrands.filter((b) => b !== brand)
                        : [...filters.selectedBrands, brand],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Segmento">
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedSegments.length === 0}
                ariaLabel="Segmento: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ selectedSegments: [] })}
              />
              {BIKE_SEGMENTS.map((segment) => (
                <FilterOptionButton
                  active={filters.selectedSegments.includes(segment)}
                  ariaLabel={`Segmento: ${segmentLabels[segment]}`}
                  classPrefix="admin-page"
                  icon={adminModelsEditSegmentIcon[segment] ?? 'more_horiz'}
                  key={segment}
                  label={segmentLabels[segment]}
                  onClick={() => {
                    onChange({
                      selectedSegments: filters.selectedSegments.includes(segment)
                        ? filters.selectedSegments.filter((s) => s !== segment)
                        : [...filters.selectedSegments, segment],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Carnet" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.selectedLicenses.length === 0}
                ariaLabel="Carnet: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ selectedLicenses: [] })}
              />
              <FilterOptionButton
                active={filters.selectedLicenses.includes('A2')}
                ariaLabel="Carnet: Carnet A2"
                classPrefix="admin-page"
                label="Carnet A2"
                onClick={() => {
                  onChange({
                    selectedLicenses: filters.selectedLicenses.includes('A2')
                      ? filters.selectedLicenses.filter((l) => l !== 'A2')
                      : [...filters.selectedLicenses, 'A2'],
                  });
                }}
              />
              <FilterOptionButton
                active={filters.selectedLicenses.includes('A')}
                ariaLabel="Carnet: Carnet A"
                classPrefix="admin-page"
                label="Carnet A"
                onClick={() => {
                  onChange({
                    selectedLicenses: filters.selectedLicenses.includes('A')
                      ? filters.selectedLicenses.filter((l) => l !== 'A')
                      : [...filters.selectedLicenses, 'A'],
                  });
                }}
              />
            </div>
          </FilterGroup>

          <FilterGroup title="Precio" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minPrice === '' && filters.maxPrice === ''}
                ariaLabel="Precio: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minPrice: '', maxPrice: '' })}
              />
              {pricePresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minPrice, filters.maxPrice, preset)}
                  ariaLabel={`Precio: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minPrice, filters.maxPrice, preset)) {
                      onChange({ minPrice: '', maxPrice: '' });
                    } else {
                      onChange({ minPrice: preset.min, maxPrice: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Potencia" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minPower === '' && filters.maxPower === ''}
                ariaLabel="Potencia: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minPower: '', maxPower: '' })}
              />
              {powerPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minPower, filters.maxPower, preset)}
                  ariaLabel={`Potencia: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minPower, filters.maxPower, preset)) {
                      onChange({ minPower: '', maxPower: '' });
                    } else {
                      onChange({ minPower: preset.min, maxPower: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Peso" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minWeight === '' && filters.maxWeight === ''}
                ariaLabel="Peso: Todos"
                classPrefix="admin-page"
                icon="apps"
                label="Todos"
                onClick={() => onChange({ minWeight: '', maxWeight: '' })}
              />
              {weightPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minWeight, filters.maxWeight, preset)}
                  ariaLabel={`Peso: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minWeight, filters.maxWeight, preset)) {
                      onChange({ minWeight: '', maxWeight: '' });
                    } else {
                      onChange({ minWeight: preset.min, maxWeight: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Altura asiento" defaultOpen={false}>
            <div className="admin-page__filter-options">
              <FilterOptionButton
                active={filters.minSeatHeight === '' && filters.maxSeatHeight === ''}
                ariaLabel="Altura asiento: Todas"
                classPrefix="admin-page"
                icon="apps"
                label="Todas"
                onClick={() => onChange({ minSeatHeight: '', maxSeatHeight: '' })}
              />
              {seatHeightPresets.map((preset) => (
                <FilterOptionButton
                  active={isRangePresetActive(filters.minSeatHeight, filters.maxSeatHeight, preset)}
                  ariaLabel={`Altura asiento: ${preset.label}`}
                  classPrefix="admin-page"
                  key={preset.key}
                  label={preset.label}
                  onClick={() => {
                    if (isRangePresetActive(filters.minSeatHeight, filters.maxSeatHeight, preset)) {
                      onChange({ minSeatHeight: '', maxSeatHeight: '' });
                    } else {
                      onChange({ minSeatHeight: preset.min, maxSeatHeight: preset.max });
                    }
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Electrónica" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {(Object.keys(featureLabels) as (keyof BikeFeatures)[]).map((feature) => (
                <FilterOptionButton
                  active={filters.equipment.includes(feature)}
                  ariaLabel={`Electrónica: ${featureLabels[feature]}`}
                  classPrefix="admin-page"
                  icon={getMotorcycleTechnicalIcon('electronics')}
                  key={feature}
                  label={featureLabels[feature]}
                  onClick={() => {
                    onChange({
                      equipment: filters.equipment.includes(feature)
                        ? filters.equipment.filter((f) => f !== feature)
                        : [...filters.equipment, feature],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Uso recomendado" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {(Object.keys(useLabels) as (keyof BikeUseScores)[]).map((use) => (
                <FilterOptionButton
                  active={filters.recommendedUses.includes(use)}
                  ariaLabel={`Uso: ${useLabels[use]}`}
                  classPrefix="admin-page"
                  key={use}
                  label={useLabels[use]}
                  onClick={() => {
                    onChange({
                      recommendedUses: filters.recommendedUses.includes(use)
                        ? filters.recommendedUses.filter((u) => u !== use)
                        : [...filters.recommendedUses, use],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Calidad de datos" defaultOpen={false}>
            <div className="admin-page__filter-options">
              {MOTORCYCLE_DATA_SOURCES.map((source) => (
                <FilterOptionButton
                  active={filters.dataSources.includes(source)}
                  ariaLabel={`Calidad de datos: ${dataQualityLabels[source]}`}
                  classPrefix="admin-page"
                  icon="fact_check"
                  key={source}
                  label={dataQualityLabels[source]}
                  onClick={() => {
                    onChange({
                      dataSources: filters.dataSources.includes(source)
                        ? filters.dataSources.filter((s) => s !== source)
                        : [...filters.dataSources, source],
                    });
                  }}
                />
              ))}
            </div>
          </FilterGroup>
        </div>

        <footer className="admin-page__filters-footer">
          <button type="button" onClick={onClearFilters} disabled={!hasActiveFilters}>Limpiar filtros</button>
          <button type="button" onClick={onApplyFilters}>Aplicar filtros</button>
        </footer>
      </section>
    </>
  );
}

export function AdminEditModelsPage({ motorcycles }: Readonly<{ motorcycles: readonly Bike[] }>) {
  const [searchText, setSearchText] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<BikeSegment[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<BikeLicense[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPower, setMinPower] = useState('');
  const [maxPower, setMaxPower] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minSeatHeight, setMinSeatHeight] = useState('');
  const [maxSeatHeight, setMaxSeatHeight] = useState('');
  const [equipment, setEquipment] = useState<(keyof BikeFeatures)[]>([]);
  const [recommendedUses, setRecommendedUses] = useState<(keyof BikeUseScores)[]>([]);
  const [dataSources, setDataSources] = useState<MotorcycleDataSource[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const brandOptions = useMemo(() => getBrandOptions(motorcycles), [motorcycles]);

  const filters = useMemo<AdminModelsEditFilters>(() => ({
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
  }), [
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
  ]);

  const filteredBikes = useMemo(() => {
    const normalizedText = normalizeText(searchText);

    return motorcycles.filter((bike) => {
      if (normalizedText && !normalizeText(`${bike.brand} ${bike.model}`).includes(normalizedText)) {
        return false;
      }

      if (selectedBrands.length > 0 && !selectedBrands.includes(bike.brand)) {
        return false;
      }

      if (selectedSegments.length > 0 && !selectedSegments.includes(bike.segment)) {
        return false;
      }

      if (selectedLicenses.length > 0 && !selectedLicenses.includes(bike.license)) {
        return false;
      }

      if (minPrice !== '' || maxPrice !== '') {
        const price = bike.priceEur;
        if (minPrice !== '' && price < Number(minPrice)) return false;
        if (maxPrice !== '' && price > Number(maxPrice)) return false;
      }

      if (minPower !== '' || maxPower !== '') {
        const power = bike.powerHp;
        if (minPower !== '' && power < Number(minPower)) return false;
        if (maxPower !== '' && power > Number(maxPower)) return false;
      }

      if (minWeight !== '' || maxWeight !== '') {
        const weight = bike.wetWeightKg;
        if (minWeight !== '' && weight < Number(minWeight)) return false;
        if (maxWeight !== '' && weight > Number(maxWeight)) return false;
      }

      if (minSeatHeight !== '' || maxSeatHeight !== '') {
        const seatHeight = bike.seatHeightMm;
        if (minSeatHeight !== '' && seatHeight < Number(minSeatHeight)) return false;
        if (maxSeatHeight !== '' && seatHeight > Number(maxSeatHeight)) return false;
      }

      if (equipment.length > 0 && !equipment.every((feature) => bike.features[feature])) {
        return false;
      }

      if (recommendedUses.length > 0 && !recommendedUses.some((use) => bike.useScores[use] >= 7)) {
        return false;
      }

      if (dataSources.length > 0) {
        const bikeDataSources: (MotorcycleDataSource | undefined)[] = [
          bike.specsSource,
          bike.priceSource,
          bike.imageSource,
          bike.scoresSource,
          bike.prosConsSource,
          bike.reliabilitySource,
        ];
        if (!dataSources.some((source) => bikeDataSources.includes(source))) {
          return false;
        }
      }

      return true;
    });
  }, [
    searchText,
    selectedBrands,
    selectedSegments,
    selectedLicenses,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minWeight,
    maxWeight,
    minSeatHeight,
    maxSeatHeight,
    equipment,
    recommendedUses,
    dataSources,
    motorcycles,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredBikes.length / ITEMS_PER_PAGE));
  const paginatedBikes = useMemo(
    () => filteredBikes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, filteredBikes],
  );

  const hasActiveFilters = searchText.length > 0
    || selectedBrands.length > 0
    || selectedSegments.length > 0
    || selectedLicenses.length > 0
    || minPrice.length > 0
    || maxPrice.length > 0
    || minPower.length > 0
    || maxPower.length > 0
    || minWeight.length > 0
    || maxWeight.length > 0
    || minSeatHeight.length > 0
    || maxSeatHeight.length > 0
    || equipment.length > 0
    || recommendedUses.length > 0
    || dataSources.length > 0;

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedBrands([]);
    setSelectedSegments([]);
    setSelectedLicenses([]);
    setMinPrice('');
    setMaxPrice('');
    setMinPower('');
    setMaxPower('');
    setMinWeight('');
    setMaxWeight('');
    setMinSeatHeight('');
    setMaxSeatHeight('');
    setEquipment([]);
    setRecommendedUses([]);
    setDataSources([]);
  }, []);

  const updateFilters = useCallback((next: Partial<AdminModelsEditFilters>) => {
    if (next.searchText !== undefined) setSearchText(next.searchText);
    if (next.selectedBrands !== undefined) setSelectedBrands(next.selectedBrands);
    if (next.selectedSegments !== undefined) setSelectedSegments(next.selectedSegments);
    if (next.selectedLicenses !== undefined) setSelectedLicenses(next.selectedLicenses);
    if (next.minPrice !== undefined) setMinPrice(next.minPrice);
    if (next.maxPrice !== undefined) setMaxPrice(next.maxPrice);
    if (next.minPower !== undefined) setMinPower(next.minPower);
    if (next.maxPower !== undefined) setMaxPower(next.maxPower);
    if (next.minWeight !== undefined) setMinWeight(next.minWeight);
    if (next.maxWeight !== undefined) setMaxWeight(next.maxWeight);
    if (next.minSeatHeight !== undefined) setMinSeatHeight(next.minSeatHeight);
    if (next.maxSeatHeight !== undefined) setMaxSeatHeight(next.maxSeatHeight);
    if (next.equipment !== undefined) setEquipment(next.equipment);
    if (next.recommendedUses !== undefined) setRecommendedUses(next.recommendedUses);
    if (next.dataSources !== undefined) setDataSources(next.dataSources);
    setCurrentPage(1);
  }, []);

  return (
    <AdminModelsWorkspace
      activeModelsItem="edit"
      description="Busca una moto del catálogo y abre su ficha interna de edición."
      title="Seleccionar modelo para editar"
      titleId="admin-models-edit-title"
      sidebarContent={(
        <AdminModelsEditFiltersPanel
          brandOptions={brandOptions}
          filters={filters}
          isOpen={isFilterPanelOpen}
          onApplyFilters={() => setIsFilterPanelOpen(false)}
          onChange={updateFilters}
          onClearFilters={clearFilters}
          onClose={() => setIsFilterPanelOpen(false)}
        />
      )}
    >
      <div className="admin-page__edit-models">
        <div className="admin-page__mobile-filter-trigger">
          <button type="button" onClick={() => setIsFilterPanelOpen(true)}>
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            Filtros
          </button>
        </div>

        {filteredBikes.length > 0 ? (
          <>
            <p className="admin-page__results-summary" aria-live="polite">
              {filteredBikes.length === 1
                ? '1 modelo encontrado'
                : `${filteredBikes.length} modelos encontrados`}
            </p>

            <div className="admin-page__edit-grid">
              {paginatedBikes.map((bike) => (
                <AdminModelEditCard bike={bike} key={bike.id} />
              ))}
            </div>

            {totalPages > 1 ? (
              <AccountPagination
                ariaLabel="Paginación de edición de modelos"
                className="admin-page__pagination"
                currentClassName="admin-page__pagination-current"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
        ) : (
          <article className="account-page__empty-state">
            <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
            <h3>No hay modelos que coincidan con los filtros.</h3>
            {hasActiveFilters ? (
              <button className="account-page__button" type="button" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : (
              <p>El catálogo no contiene modelos todavía.</p>
            )}
          </article>
        )}
      </div>
    </AdminModelsWorkspace>
  );
}

export function AdminEditMotorcyclePage({ motorcycleId, motorcycles, onMotorcyclesChange: onMotorcyclesChangeProp }: Readonly<{ motorcycleId: string | undefined; motorcycles: readonly Bike[]; onMotorcyclesChange?: OnMotorcyclesChange }>) {
  const originalDraft = useMemo(() => {
    if (!motorcycleId) {
      return undefined;
    }

    const bike = motorcycles.find((b) => b.id === motorcycleId);
    return bike ? createDraftFromBike(bike) : undefined;
  }, [motorcycleId, motorcycles]);

  const [draft, setDraft] = useState<AdminModelDraft | undefined>(originalDraft);
  const [localStatus, setLocalStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [persistedImageHasGalleryRecord, setPersistedImageHasGalleryRecord] = useState(false);
  const galleryImagesRef = useRef<readonly AdminMotorcycleGalleryImage[]>([]);
  const pendingDeleteImageIdsRef = useRef<readonly string[]>([]);
  const initializedMotorcycleIdRef = useRef<string | undefined>(motorcycleId);

  const { session, user } = useAuth();

  useEffect(() => {
    const previousMotorcycleId = initializedMotorcycleIdRef.current;
    const didMotorcycleChange = previousMotorcycleId !== motorcycleId;

    if (!motorcycleId) {
      initializedMotorcycleIdRef.current = undefined;
      setPersistedImageHasGalleryRecord(false);
      if (draft) {
        setDraft(undefined);
      }
      return;
    }

    if (didMotorcycleChange) {
      initializedMotorcycleIdRef.current = motorcycleId;
      setLocalStatus('');
      setPublishError('');
      setSaving(false);
      setPersistedImageHasGalleryRecord(false);
      setDraft(originalDraft ? cloneAdminModelDraft(originalDraft) : undefined);
      return;
    }

    if (!draft && originalDraft) {
      setDraft(cloneAdminModelDraft(originalDraft));
    }
  }, [draft, motorcycleId, originalDraft]);

  const suggestedModelId = useMemo(() => draft ? buildSuggestedModelId(draft) : '', [draft]);

  const handleDraftFieldChange = useCallback((field: AdminModelDraftField, value: string) => {
    setDraft((current) => current ? ({ ...current, [field]: value }) : current);
  }, []);

  const handleDraftCheckboxChange = useCallback((field: 'pricePending' | 'imageLocked', value: boolean) => {
    setDraft((current) => current ? ({ ...current, [field]: value }) : current);
  }, []);

  const handleFeatureToggle = useCallback((feature: AdminModelFeatureKey, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        features: {
          ...current.features,
          [feature]: checked,
        },
      };
    });
  }, []);

  const handleLocalAction = useCallback((message: string) => {
    setLocalStatus(message);
    if (message !== 'Publicación pendiente de persistencia.') {
      setPublishError('');
    }
  }, []);

  const handleDiscardChanges = useCallback(() => {
    if (originalDraft) {
      setDraft(cloneAdminModelDraft(originalDraft));
      setLocalStatus('Cambios descartados.');
      setPublishError('');
    }
  }, [originalDraft]);

  const handlePublish = useCallback(async (autoUploadedUrl?: string) => {
    if (!draft) return;

    const accessToken = session?.access_token;

    if (!accessToken) {
      setPublishError('No hay sesión activa para publicar.');
      return;
    }

    const effectiveDraft = autoUploadedUrl
      ? { ...draft, imageUrl: autoUploadedUrl, imageLocked: true }
      : draft;

    const validation = validateAdminModelDraftForPublish(effectiveDraft, { mode: 'edit' });
    if (!validation.isValid) {
      setPublishError(validation.message);
      setLocalStatus(validation.message);
      return;
    }

    setSaving(true);
    setPublishError('');
    setLocalStatus('Publicando modelo...');

    try {
      const payload = draftToUpdatePayload(effectiveDraft);
      const updatedBike = await updateAdminMotorcycle(motorcycleId!, payload, accessToken);
      const originalPersistedImageUrl = originalDraft?.imageUrl.trim() ?? '';
      const originalPersistedObjectPath = getMotorcycleImageObjectPath(originalPersistedImageUrl);
      const nextImageUrl = effectiveDraft.imageUrl.trim();
      const nextImageObjectPath = getMotorcycleImageObjectPath(nextImageUrl);

      const refImages = galleryImagesRef.current;
      const galleryImageList = refImages.length > 0
        ? refImages
        : await getAdminMotorcycleGalleryImages(motorcycleId!, accessToken);

      if (refImages.length === 0 && galleryImageList.length > 0) {
        galleryImagesRef.current = galleryImageList;
      }

      const pendingDeleteIds = pendingDeleteImageIdsRef?.current ?? [];
      const activeGalleryImages = getActiveGalleryImages(galleryImageList, pendingDeleteIds);

      const originalIsGalleryBacked = persistedImageHasGalleryRecord
        || (galleryImageList.length > 0
          && originalPersistedImageUrl.length > 0
          && isImageBackedByGalleryRecord(originalPersistedImageUrl, galleryImageList));

      if (
        originalPersistedObjectPath
        && nextImageUrl
        && nextImageUrl !== originalPersistedImageUrl
        && nextImageObjectPath !== originalPersistedObjectPath
        && !originalIsGalleryBacked
      ) {
        void deleteMotorcycleImage(originalPersistedObjectPath, accessToken).catch(() => undefined);
      }

      // Primary sync: currentPrimary from full list (incl. pending-delete), matchingRecord from active only
      if (activeGalleryImages.length > 0) {
        const draftImageUrl = effectiveDraft.imageUrl.trim();
        if (draftImageUrl) {
          const currentPrimary = galleryImageList.find((img) => img.isPrimary);
          const matchingRecord = activeGalleryImages.find((img) => img.url === draftImageUrl);
          const needsUnsetPrimary = currentPrimary && (!matchingRecord || matchingRecord.id !== currentPrimary.id);
          const needsSetPrimary = matchingRecord && !matchingRecord.isPrimary;

          if (needsUnsetPrimary) {
            await updateAdminMotorcycleGalleryImage(currentPrimary!.id, { isPrimary: false }, accessToken);
          }

          if (needsSetPrimary) {
            await updateAdminMotorcycleGalleryImage(matchingRecord!.id, { isPrimary: true }, accessToken);
          }
        }
      }

      // Apply pending gallery deletes: gallery record + safe Storage cleanup (de-duplicated)
      if (pendingDeleteIds.length > 0) {
        const pendingImages = galleryImageList.filter((img) => pendingDeleteIds.includes(img.id));
        const processedCleanupPaths = new Set<string>();

        for (const pendingImage of pendingImages) {
          await deleteAdminMotorcycleGalleryImageRecord(pendingImage.id, accessToken);

          const pendingObjectPath = getGalleryImageCleanupObjectPath(pendingImage);

          if (pendingObjectPath && !processedCleanupPaths.has(pendingObjectPath)) {
            processedCleanupPaths.add(pendingObjectPath);

            const isSharedWithActiveImage = isCleanupPathSharedWithActiveImage(pendingObjectPath, activeGalleryImages);

            const isUsedByCurrentCover = nextImageObjectPath === pendingObjectPath;

            if (!isSharedWithActiveImage && !isUsedByCurrentCover) {
              await deleteMotorcycleImage(pendingObjectPath, accessToken);
            }
          }
        }
      }

      setLocalStatus('Modelo actualizado correctamente.');
      onMotorcyclesChangeProp?.(updatedBike);
      window.location.hash = `#/motos/${motorcycleId}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al publicar el modelo.';
      setPublishError(message);
      setLocalStatus(message);
    } finally {
      setSaving(false);
    }
  }, [draft, motorcycleId, onMotorcyclesChangeProp, originalDraft?.imageUrl, pendingDeleteImageIdsRef, persistedImageHasGalleryRecord, session?.access_token, updateAdminMotorcycleGalleryImage]);

  const handleUploadImage = useCallback(async (file: File) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    return uploadMotorcycleImage(file, motorcycleId!, accessToken);
  }, [motorcycleId, session?.access_token]);

  const handleCreateGalleryRecord = useCallback(async ({
    motorcycleId: targetMotorcycleId,
    url,
    storagePath,
    isPrimary,
    sortOrder,
    source,
  }: {
    motorcycleId: string;
    url: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
    source: MotorcycleDataSource;
  }) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para registrar la imagen en la galería.');
    }

    return createAdminMotorcycleGalleryImage({
      motorcycleId: targetMotorcycleId,
      url,
      storagePath,
      isPrimary,
      sortOrder,
      source,
      createdBy: user?.id ?? null,
    }, accessToken);
  }, [session?.access_token, user?.id]);

  const handleDeleteImage = useCallback(async (objectPath: string) => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No hay sesión activa para eliminar la imagen.');
    }

    await deleteMotorcycleImage(objectPath, accessToken);
  }, [session?.access_token]);

  const isDraftLoading = Boolean(
    motorcycleId
    && !draft
    && (motorcycles.length === 0 || Boolean(originalDraft)),
  );

  if (!motorcycleId) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Seleccionar modelo para editar"
        title="Modelo no encontrado"
        titleId="admin-models-edit-notfound-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Modelo no encontrado</h2>
          <p>No se encontró un modelo con el identificador especificado.</p>
          <a className="account-page__button" href="#/admin/modelos/editar">Volver a selección de modelos</a>
        </article>
      </AdminModelsWorkspace>
    );
  }

  if (isDraftLoading) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Preparando edición del modelo..."
        title="Cargando modelo..."
        titleId="admin-models-edit-loading-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">progress_activity</span>
          <h2>Cargando modelo...</h2>
          <p>Preparando edición del modelo...</p>
        </article>
      </AdminModelsWorkspace>
    );
  }

  if (!originalDraft || !draft) {
    return (
      <AdminModelsWorkspace
        activeModelsItem="edit"
        description="Seleccionar modelo para editar"
        title="Modelo no encontrado"
        titleId="admin-models-edit-notfound-title"
      >
        <article className="account-page__empty-state">
          <span className="account-page__empty-icon material-symbols-outlined" aria-hidden="true">edit_note</span>
          <h2>Modelo no encontrado</h2>
          <p>No se encontró un modelo con el identificador especificado.</p>
          <a className="account-page__button" href="#/admin/modelos/editar">Volver a selección de modelos</a>
        </article>
      </AdminModelsWorkspace>
    );
  }

  const safeDraft = draft;
  const kickerText = `Editando ${safeDraft.brand} ${safeDraft.model} ${safeDraft.year}`;

  return (
    <AdminModelsWorkspace
      activeModelsItem="edit"
      description="Actualiza los datos disponibles de este modelo."
      title="Editar modelo"
      titleId="admin-models-edit-title"
    >
      {publishError ? <p className="admin-page__model-status admin-page__model-status--error" role="alert">{publishError}</p> : null}
      <AdminModelFormBody
        key={motorcycleId}
        draft={safeDraft}
        suggestedModelId={suggestedModelId}
        localStatus={localStatus}
        persistedImageLocked={originalDraft.imageLocked}
        persistedImageUrl={originalDraft.imageUrl}
        onDraftFieldChange={handleDraftFieldChange}
        onDraftCheckboxChange={handleDraftCheckboxChange}
        onFeatureToggle={handleFeatureToggle}
        onDiscardChanges={handleDiscardChanges}
        onLocalAction={handleLocalAction}
        onPublish={handlePublish}
        onUploadImage={handleUploadImage}
        onCreateGalleryRecord={handleCreateGalleryRecord}
        onPersistedImageGalleryStateChange={setPersistedImageHasGalleryRecord}
        onDeleteImage={handleDeleteImage}
        galleryImagesRef={galleryImagesRef}
        pendingDeleteImageIdsRef={pendingDeleteImageIdsRef}
        saving={saving}
        toolbarKicker={kickerText}
        workspaceHeading="Workspace de edición"
        workspaceHeadingId="admin-models-edit-workspace-title"
        formLabel="Formulario de edición de modelo"
      />
    </AdminModelsWorkspace>
  );
}

type AdminModelEditCardProps = Readonly<{
  bike: Bike;
}>;

function AdminModelEditCard({ bike }: AdminModelEditCardProps) {
  const displayName = getBikeDisplayName(bike);
  const editHref = `#/admin/modelos/${bike.id}/editar`;

  return (
    <article className="admin-page__model-edit-summary-card" data-testid="admin-model-edit-summary-card" aria-label={displayName}>
      <MotorcycleImage decorative className="admin-page__model-edit-summary-image" motorcycle={bike} />
      <div className="admin-page__model-edit-summary-overlay" aria-hidden="true" />

      <div className="admin-page__model-edit-summary-content">
        <header className="admin-page__model-edit-summary-header">
          <h2 className="admin-page__model-edit-summary-title">
            <span className='bike-brand'>{bike.brand}</span>
            <span className='bike-model'>{bike.model}</span>
          </h2>
        </header>

        <ul className="admin-page__model-edit-summary-meta" aria-label="Detalles del modelo">
          <li><span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>{bike.year}</li>
        </ul>


        <footer className="admin-page__model-edit-summary-actions">
          <a href={editHref} aria-label={`Editar modelo ${displayName}`}>
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
            Editar modelo
          </a>
        </footer>
      </div>
    </article>
  );
}





export { AdminModerationPage } from './AdminModerationPage';
export { AdminRequestsPage } from './AdminRequestsPage';
export { AdminReviewsPage } from './AdminReviewsPage';
export { AdminDashboardPage } from './AdminDashboardPage';
export { AdminSidebar } from './adminSharedUi';