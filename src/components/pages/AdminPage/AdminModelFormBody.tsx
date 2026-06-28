import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MutableRefObject, type ReactNode } from 'react';
import { useAuth } from '../../../features/auth';
import {
  getAdminMotorcycleGalleryImages,
  type AdminMotorcycleGalleryImage,
} from '../../../services/adminMotorcycleGalleryService';
import {
  adminModelTechnicalPlaceholderImage,
  appendGalleryImage,
  buildGalleryLibraryImages,
  getGalleryImageAssetName,
  getGalleryImageCardEyebrow,
  getGalleryImageCardFacts,
  getGalleryImageCardTitle,
  getMotorcycleImageObjectPath,
  getNextGallerySortOrder,
  isGalleryImageCurrentCover,
  type AdminModelLibraryImage,
} from './adminGalleryImageUtils';
import {
  ADMIN_ACCEPTED_MIME_TYPES,
  ADMIN_MAX_FILE_SIZE,
  adminModelEngineTypeOptions,
  adminModelFeatureOptions,
  adminModelPreviewPlaceholderImage,
  sectionNavItems,
} from './adminPageConstants';
import {
  type AdminModelDraft,
  type AdminModelDraftField,
  type AdminModelFeatureKey,
} from './adminModelDraftUtils';
import {
  formatPreviewNumber,
  formatPreviewPrice,
  getPreviewBadgeIcon,
  getPreviewBadgeLabel,
} from './adminModelPreviewUtils';
import {
  formatFileSize,
  getCurrentImageOriginLabel,
} from './adminPageUtils';
import { useAdminImageManager } from './useAdminImageManager';
import { GalleryConfirmDeleteModal } from './GalleryConfirmDeleteModal';
import { getMotorcycleTechnicalIcon } from '../../../shared/motorcycles/motorcycleTechnicalIcons';
import { MotorcycleImage } from '../../ui/MotorcycleImage';
import { BIKE_LICENSES, BIKE_SEGMENTS, segmentLabels } from '../../../shared/motorcycles/motorcycleTaxonomy';
import type { MotorcycleDataSource } from '../../../types/bike';
import '../AccountPage/AccountPage.scss';
import './AdminPage.scss';

type AdminModelSectionProps = Readonly<{
  children: ReactNode;
  description?: string;
  id: string;
  technicalTitle: string;
}>;

function AdminModelSection({ children, description, id, technicalTitle }: AdminModelSectionProps) {
  return (
    <details className="admin-page__model-section" id={id} open>
      <summary className="admin-page__model-section-header">
        <div className="admin-page__model-section-heading">
          <span className="admin-page__model-section-line" aria-hidden="true" />
          <div className="admin-page__model-section-title-group">
            <span className="admin-page__model-section-expand-icon" aria-hidden="true">
              <span className="material-symbols-outlined">expand_more</span>
            </span>
            <h2>{technicalTitle}</h2>
            {description ? (
              <span className="admin-page__model-section-tooltip-wrapper">
                <button
                  type="button"
                  className="admin-page__model-section-info-btn"
                  aria-label={`Más información sobre ${technicalTitle}`}
                >
                  <span aria-hidden="true">i</span>
                </button>
                <span className="admin-page__model-section-tooltip" role="tooltip">
                  {description}
                </span>
              </span>
            ) : null}
          </div>
          <span className="admin-page__model-section-line" aria-hidden="true" />
        </div>
      </summary>
      <div className="admin-page__model-section-body">{children}</div>
    </details>
  );
}

type AdminModelInfoTooltipProps = Readonly<{
  ariaLabel: string;
  description: string;
}>;

function AdminModelInfoTooltip({ ariaLabel, description }: AdminModelInfoTooltipProps) {
  return (
    <span className="admin-page__model-field-tooltip-wrapper">
      <button type="button" className="admin-page__model-section-info-btn" aria-label={ariaLabel}>
        <span aria-hidden="true">i</span>
      </button>
      <span className="admin-page__model-section-tooltip" role="tooltip">
        {description}
      </span>
    </span>
  );
}

function AdminModelHeroPreview({ draft }: Readonly<{ draft: AdminModelDraft }>) {
  const brandLabel = (draft.brand ?? '').trim() || 'Marca';
  const modelLabel = (draft.model ?? '').trim() || 'Modelo';
  const description = (draft.description ?? '').trim() || 'Descripción pendiente de completar';
  const previewImageSrc = (draft.imageUrl ?? '').trim() || adminModelPreviewPlaceholderImage;
  const previewTitle = `${brandLabel} ${modelLabel}`;

  return (
    <section className="admin-page__model-preview" aria-labelledby="admin-model-preview-title">
      <div className="admin-page__model-preview-hero">
        <div className="admin-page__model-preview-media">
          <img src={previewImageSrc} alt={`Preview local de ${previewTitle}`} />
        </div>

        <div className="admin-page__model-preview-content">
          <span className="admin-page__model-preview-chip">Preview local</span>

          <div className="admin-page__model-preview-badges">
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">{getPreviewBadgeIcon(draft.segment)}</span>
              <span className="admin-page__model-preview-badge-text">{getPreviewBadgeLabel(draft.segment)}</span>
            </span>
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('license')}</span>
              <span className="admin-page__model-preview-badge-text">{draft.license || 'Carnet pendiente'}</span>
            </span>
            <span className="admin-page__model-preview-badge">
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              <span className="admin-page__model-preview-badge-text">{draft.year.trim() || 'Año pendiente'}</span>
            </span>
          </div>

          <h2 id="admin-model-preview-title">
            {brandLabel} <strong>{modelLabel}</strong>
          </h2>
          <p>{description}</p>

          <div className="admin-page__model-preview-specs" role="group" aria-label="Datos principales del preview">
            <div>
              <span>Potencia</span>
              <strong>{formatPreviewNumber(draft.powerHp, 'CV')}</strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>{formatPreviewNumber(draft.wetWeightKg, 'kg')}</strong>
            </div>
            <div>
              <span>Motor</span>
              <strong>{formatPreviewNumber(draft.displacementCc, 'cc')}</strong>
            </div>
            <div>
              <span>Precio</span>
              <strong>{formatPreviewPrice(draft.priceEur, draft.pricePending)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type AdminModelFormBodyProps = Readonly<{
  draft: AdminModelDraft;
  suggestedModelId: string;
  localStatus: string;
  persistedImageLocked?: boolean;
  persistedImageUrl?: string;
  onDraftFieldChange: (field: AdminModelDraftField, value: string) => void;
  onDraftCheckboxChange: (field: 'pricePending' | 'imageLocked', value: boolean) => void;
  onFeatureToggle: (feature: AdminModelFeatureKey, checked: boolean) => void;
  onDiscardChanges: () => void;
  onLocalAction: (message: string) => void;
  onPublish?: (autoUploadedUrl?: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onCreateGalleryRecord?: (input: {
    motorcycleId: string;
    url: string;
    storagePath: string;
    isPrimary: boolean;
    sortOrder: number;
    source: MotorcycleDataSource;
  }) => Promise<AdminMotorcycleGalleryImage>;
  onPersistedImageGalleryStateChange?: (isGalleryBacked: boolean) => void;
  onDeleteImage?: (objectPath: string) => Promise<void>;
  onDeleteGalleryImage?: (galleryImage: AdminMotorcycleGalleryImage) => Promise<void>;
  galleryImagesRef?: MutableRefObject<readonly AdminMotorcycleGalleryImage[]>;
  saving?: boolean;
  toolbarKicker: string;
  workspaceHeading: string;
  workspaceHeadingId: string;
  formLabel: string;
}>;

export function AdminModelFormBody({
  draft,
  suggestedModelId,
  localStatus,
  persistedImageLocked = false,
  persistedImageUrl = '',
  onDraftFieldChange,
  onDraftCheckboxChange,
  onFeatureToggle,
  onDiscardChanges,
  onLocalAction,
  onPublish,
  onUploadImage,
  onCreateGalleryRecord,
  onPersistedImageGalleryStateChange,
  onDeleteImage,
  onDeleteGalleryImage,
  galleryImagesRef,
  saving,
  toolbarKicker,
  workspaceHeading,
  workspaceHeadingId,
  formLabel,
}: AdminModelFormBodyProps) {
  const {
    isImageManagerOpen,
    setIsImageManagerOpen,
    openImageManager,
    closeImageManager,
    imageMode,
    selectUrlMode,
    selectUploadMode,
    galleryInfoCardKeys,
    handleToggleGalleryCardInfo,
    resetGalleryInfoCardKeys,
  } = useAdminImageManager();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<readonly AdminMotorcycleGalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryBackedUploadUrls, setGalleryBackedUploadUrls] = useState<readonly string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<AdminMotorcycleGalleryImage | null>(null);
  const [isDeletingGalleryImage, setIsDeletingGalleryImage] = useState(false);
  const stableLibraryKeyRef = useRef<Map<string, string>>(new Map());
  const { session, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetSelectedUploadState = useCallback(() => {
    setSelectedFile(null);
    setPreviewBlobUrl(null);
    setHasUploadedImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      return;
    }

    if (!ADMIN_ACCEPTED_MIME_TYPES.includes(file.type)) {
      setFileError('Tipo de archivo no soportado. Usa: JPEG, PNG o WebP.');
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      setHasUploadedImage(false);
      return;
    }

    if (file.size > ADMIN_MAX_FILE_SIZE) {
      setFileError('El archivo supera el límite de 5 MB.');
      setSelectedFile(null);
      setPreviewBlobUrl(null);
      setHasUploadedImage(false);
      return;
    }

    setHasUploadedImage(false);
    setUploadStatus(null);
    const blobUrl = URL.createObjectURL(file);
    setPreviewBlobUrl(blobUrl);
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    const url = previewBlobUrl;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewBlobUrl]);

  // Handle Escape key: confirmation modal cancels first, then image manager
  useEffect(() => {
    if (!isImageManagerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmDeleteImage) {
          setConfirmDeleteImage(null);
          setGalleryError(null);
        } else {
          setIsImageManagerOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageManagerOpen, confirmDeleteImage]);

  // Fetch gallery images when modal opens in edit mode
  useEffect(() => {
    if (!isImageManagerOpen) {
      setGalleryLoading(false);
      setGalleryError(null);
      resetGalleryInfoCardKeys();
      stableLibraryKeyRef.current.clear();
      return;
    }

    if (!draft.modelId.trim()) {
      return;
    }

    let cancelled = false;
    setGalleryLoading(true);
    setGalleryError(null);

    getAdminMotorcycleGalleryImages(draft.modelId, session?.access_token)
      .then((images) => {
        if (!cancelled) {
          setGalleryImages(images);
          setGalleryLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGalleryError(error instanceof Error ? error.message : 'Error al cargar la galería');
          setGalleryLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isImageManagerOpen, draft.modelId, session?.access_token, resetGalleryInfoCardKeys]);

  const [isUploading, setIsUploading] = useState(false);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [sessionUploadedImageUrl, setSessionUploadedImageUrl] = useState<string | null>(null);
  const [isDeletingCurrentImage, setIsDeletingCurrentImage] = useState(false);

  const maybeCreateGalleryRecordForUpload = useCallback(async (publicUrl: string) => {
    const trimmedModelId = draft.modelId.trim();
    const storagePath = getMotorcycleImageObjectPath(publicUrl);

    if (!onCreateGalleryRecord || !trimmedModelId || !storagePath) {
      return { galleryImage: null, warningMessage: null };
    }

    const existingImage = galleryImages.find((image) =>
      image.url === publicUrl || (image.storagePath && image.storagePath === storagePath),
    );

    if (existingImage) {
      setGalleryBackedUploadUrls((currentUrls) => (
        currentUrls.includes(publicUrl) ? currentUrls : [...currentUrls, publicUrl]
      ));

      return { galleryImage: existingImage, warningMessage: null };
    }

    try {
      const galleryImage = await onCreateGalleryRecord({
        motorcycleId: trimmedModelId,
        url: publicUrl,
        storagePath,
        isPrimary: false,
        sortOrder: getNextGallerySortOrder(galleryImages),
        source: 'manual',
      });

      const nextGalleryImages = appendGalleryImage(galleryImages, galleryImage);
      setGalleryImages(nextGalleryImages);
      if (galleryImagesRef) {
        galleryImagesRef.current = nextGalleryImages;
      }
      setGalleryBackedUploadUrls((currentUrls) => (
        currentUrls.includes(publicUrl) ? currentUrls : [...currentUrls, publicUrl]
      ));

      return { galleryImage, warningMessage: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error al registrar la imagen en la galería.';
      return {
        galleryImage: null,
        warningMessage: `Imagen subida correctamente, pero no se pudo registrar en la galería. ${reason}`,
      };
    }
  }, [draft.modelId, galleryImages, onCreateGalleryRecord]);

  const handleImageUpload = useCallback(async () => {
    if (!onUploadImage || !selectedFile) return;

    setIsUploading(true);
    setFileError(null);

    try {
      const publicUrl = await onUploadImage(selectedFile);
      setHasUploadedImage(true);
      setSessionUploadedImageUrl(publicUrl);
      onDraftFieldChange('imageUrl', publicUrl);
      onDraftCheckboxChange('imageLocked', true);
      const { warningMessage } = await maybeCreateGalleryRecordForUpload(publicUrl);
      setUploadStatus({
        type: warningMessage ? 'warning' : 'success',
        message: warningMessage ?? 'Imagen subida correctamente y añadida a la galería.',
      });
      resetSelectedUploadState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir la imagen.';
      setFileError(message);
    } finally {
      setIsUploading(false);
    }
  }, [
    maybeCreateGalleryRecordForUpload,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onUploadImage,
    resetSelectedUploadState,
    selectedFile,
  ]);

  const handlePublishWithAutoUpload = useCallback(async () => {
    if (!onPublish) return;

    if (selectedFile && onUploadImage && !hasUploadedImage) {
      setIsUploading(true);
      setFileError(null);

      try {
        const publicUrl = await onUploadImage(selectedFile);
        setHasUploadedImage(true);
        setSessionUploadedImageUrl(publicUrl);
        onDraftFieldChange('imageUrl', publicUrl);
        onDraftCheckboxChange('imageLocked', true);
        const { warningMessage } = await maybeCreateGalleryRecordForUpload(publicUrl);
        if (warningMessage) {
          onLocalAction(warningMessage);
        }
        resetSelectedUploadState();
        setIsUploading(false);
        await onPublish(publicUrl);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al subir la imagen.';
        setFileError(message);
        resetSelectedUploadState();
        setIsUploading(false);
        return;
      }
    }

    await onPublish();
  }, [
    hasUploadedImage,
    maybeCreateGalleryRecordForUpload,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onLocalAction,
    onPublish,
    onUploadImage,
    resetSelectedUploadState,
    selectedFile,
  ]);

  const currentImageUrl = draft.imageUrl.trim();
  const persistedImageUrlTrimmed = persistedImageUrl.trim();
  const currentImageObjectPath = getMotorcycleImageObjectPath(currentImageUrl);
  const currentImageIsStorageAsset = Boolean(currentImageObjectPath);
  const persistedImageObjectPath = getMotorcycleImageObjectPath(persistedImageUrlTrimmed);

  useEffect(() => {
    if (!currentImageUrl || (persistedImageUrlTrimmed && currentImageUrl === persistedImageUrlTrimmed)) {
      setSessionUploadedImageUrl(null);
    }
  }, [currentImageUrl, persistedImageUrlTrimmed]);

  const currentImageHasGalleryRecord = Boolean(
    currentImageUrl
    && (
      galleryBackedUploadUrls.includes(currentImageUrl)
      || galleryImages.some((image) => image.url === currentImageUrl)
    ),
  );

  useEffect(() => {
    if (!onPersistedImageGalleryStateChange) {
      return;
    }

    const isGalleryBacked = Boolean(
      persistedImageUrlTrimmed
      && galleryImages.some((image) => (
        image.url === persistedImageUrlTrimmed
        || (persistedImageObjectPath && image.storagePath === persistedImageObjectPath)
      )),
    );

    onPersistedImageGalleryStateChange(isGalleryBacked);
  }, [
    galleryImages,
    onPersistedImageGalleryStateChange,
    persistedImageObjectPath,
    persistedImageUrlTrimmed,
  ]);

  useEffect(() => {
    if (galleryImagesRef) {
      galleryImagesRef.current = galleryImages;
    }
  }, [galleryImages, galleryImagesRef]);

  const currentImageIsSessionUpload = Boolean(
    currentImageObjectPath
    && sessionUploadedImageUrl
    && currentImageUrl === sessionUploadedImageUrl,
  ) && !currentImageHasGalleryRecord;

  const handleRemoveCurrentImage = useCallback(async () => {
    const restorePersistedImage = currentImageIsSessionUpload
      && persistedImageUrlTrimmed
      && persistedImageUrlTrimmed !== currentImageUrl;
    const nextImageUrl = restorePersistedImage ? persistedImageUrlTrimmed : adminModelTechnicalPlaceholderImage;
    const nextImageLocked = restorePersistedImage ? persistedImageLocked : false;

    if (!currentImageUrl) return;

    if (!currentImageIsSessionUpload || !onDeleteImage || !currentImageObjectPath) {
      onDraftFieldChange('imageUrl', nextImageUrl);
      onDraftCheckboxChange('imageLocked', nextImageLocked);
      setUploadStatus(null);
      onLocalAction('Imagen quitada del formulario.');
      return;
    }

    setIsDeletingCurrentImage(true);
    setFileError(null);

    try {
      await onDeleteImage(currentImageObjectPath);
      onDraftFieldChange('imageUrl', nextImageUrl);
      onDraftCheckboxChange('imageLocked', nextImageLocked);
      setUploadStatus(null);
      setSessionUploadedImageUrl(null);
      resetSelectedUploadState();
      onLocalAction('Imagen eliminada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la imagen.';
      setFileError(message);
    } finally {
      setIsDeletingCurrentImage(false);
    }
  }, [
    currentImageIsSessionUpload,
    currentImageObjectPath,
    currentImageUrl,
    onDeleteImage,
    onDraftCheckboxChange,
    onDraftFieldChange,
    onLocalAction,
    persistedImageLocked,
    persistedImageUrlTrimmed,
    resetSelectedUploadState,
  ]);

  const handleConfirmDelete = useCallback(async (targetImage: AdminMotorcycleGalleryImage) => {
    if (!onDeleteGalleryImage) return;

    setIsDeletingGalleryImage(true);

    try {
      await onDeleteGalleryImage(targetImage);

      if (isGalleryImageCurrentCover(targetImage, currentImageUrl, currentImageObjectPath)) {
        onDraftFieldChange('imageUrl', adminModelTechnicalPlaceholderImage);
        onDraftCheckboxChange('imageLocked', false);
      }

      setGalleryImages((current) => current.filter((img) => img.id !== targetImage.id));
      setConfirmDeleteImage(null);
      setGalleryError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la imagen.';
      setGalleryError(message);
    } finally {
      setIsDeletingGalleryImage(false);
    }
  }, [onDeleteGalleryImage, currentImageUrl, currentImageObjectPath, onDraftFieldChange, onDraftCheckboxChange]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteImage(null);
    setGalleryError(null);
  }, []);

  const handleDiscardChangesClick = useCallback(() => {
    setFileError(null);
    setSessionUploadedImageUrl(null);
    setGalleryBackedUploadUrls([]);
    setIsDeletingCurrentImage(false);
    resetSelectedUploadState();
    onDiscardChanges();
  }, [onDiscardChanges, resetSelectedUploadState]);

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (el instanceof HTMLDetailsElement && !el.open) {
      el.open = true;
    }
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function getSectionProgress(sectionId: string): number {
    switch (sectionId) {
      case 'admin-model-section-identity': {
        const filled = [draft.brand, draft.model, draft.year, draft.description].filter(Boolean).length;
        return filled / 4;
      }
      case 'admin-model-section-classification': {
        const filled = [draft.segment, draft.license].filter(Boolean).length;
        return filled / 2;
      }
      case 'admin-model-section-engine': {
        const fields = [draft.engineType, draft.displacementCc, draft.powerHp, draft.torqueNm, draft.wetWeightKg, draft.seatHeightMm, draft.fuelTankLiters];
        return fields.filter(Boolean).length / fields.length;
      }
      case 'admin-model-section-electronics': {
        const checked = Object.values(draft.features).filter(Boolean).length;
        return checked / Object.keys(draft.features).length;
      }
      case 'admin-model-section-market': {
        return draft.priceEur ? 1 : 0;
      }
      case 'admin-model-section-image': {
        const hasImage = draft.imageUrl || selectedFile || hasUploadedImage;
        return hasImage ? 1 : 0;
      }
      case 'admin-model-section-sources': {
        const fields = [draft.officialUrl, draft.sourceNotes, draft.internalNotes];
        return fields.filter(Boolean).length / fields.length;
      }
      default:
        return 0;
    }
  }

  const imageModalBadge = [draft.brand.trim(), draft.model.trim(), draft.year.trim()]
    .filter(Boolean)
    .join(' · ');
  const currentImagePreviewUrl = currentImageUrl || '';
  const currentImageOriginLabel = getCurrentImageOriginLabel(currentImagePreviewUrl);
  const currentImageStatusLabel = currentImagePreviewUrl
    ? (draft.imageLocked ? 'Portada bloqueada' : 'Portada activa')
    : 'Sin portada';
  const currentImageSupportCopy = currentImagePreviewUrl
    ? 'Esta imagen sigue siendo la portada activa que usa el modelo en el flujo actual.'
    : 'Define una imagen principal desde URL manual o archivo local para preparar la portada del modelo.';
  const libraryImages = useMemo(
    () => buildGalleryLibraryImages(galleryImages, persistedImageUrlTrimmed, currentImagePreviewUrl, stableLibraryKeyRef.current),
    [currentImagePreviewUrl, galleryImages, persistedImageUrlTrimmed],
  );

  const handleUseLibraryImageAsCover = useCallback((nextImageUrl: string) => {
    onDraftFieldChange('imageUrl', nextImageUrl);
    setFileError(null);
    setUploadStatus(null);
    setSelectedFile(null);
    setPreviewBlobUrl(null);
    setHasUploadedImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onDraftFieldChange]);

  return (
    <section className="admin-page__model-studio" aria-labelledby={workspaceHeadingId}>
      <header className="admin-page__model-toolbar">
          <span className="admin-page__model-toolbar-kicker">{toolbarKicker}</span>
          <h2 id={workspaceHeadingId}>{workspaceHeading}</h2>
      </header>

      <AdminModelHeroPreview draft={draft} />

      <nav className="admin-page__section-radar" aria-label="Secciones del formulario">
        <ul className="admin-page__section-radar-list">
          {sectionNavItems.map((item) => {
            const progress = getSectionProgress(item.id);
            const progressPct = Math.round(progress * 100);
            return (
              <li key={item.id} className="admin-page__section-radar-item">
                <button
                  type="button"
                  className="admin-page__section-radar-btn"
                  aria-label={`${item.label}, ${progressPct}% completado`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <span className="admin-page__section-radar-index" aria-hidden="true">{item.index}</span>
                  <span className="admin-page__section-radar-track" aria-hidden="true">
                    <span className="admin-page__section-radar-fill" style={{ height: `${progressPct}%` }} />
                  </span>
                  <span className="admin-page__section-radar-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <form className="admin-page__model-form" aria-label={formLabel} onSubmit={(event) => event.preventDefault()}>
        <AdminModelSection
          id="admin-model-section-identity"
          technicalTitle="01. MODELO"
          description="Base de naming y copy inicial para alimentar el preview local antes de decidir persistencia o validación real."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-brand">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">branding_watermark</span>
                Marca
              </span>
              <input id="admin-model-brand" aria-label="Marca" type="text" value={draft.brand} onChange={(event) => onDraftFieldChange('brand', event.target.value)} placeholder="BMW" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-name">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">two_wheeler</span>
                Modelo
              </span>
              <input id="admin-model-name" aria-label="Modelo" type="text" value={draft.model} onChange={(event) => onDraftFieldChange('model', event.target.value)} placeholder="F 900 GS" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-year">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                Año
              </span>
              <input id="admin-model-year" aria-label="Año" type="number" min="1900" max="2100" value={draft.year} onChange={(event) => onDraftFieldChange('year', event.target.value)} placeholder="2026" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-id">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">tag</span>
                ID sugerido
                <AdminModelInfoTooltip
                  ariaLabel="Más información sobre ID sugerido"
                  description={`Sugerencia automática: ${suggestedModelId || 'marca-modelo-2026'}`}
                />
              </span>
              <input id="admin-model-id" aria-label="ID sugerido" type="text" value={draft.modelId} onChange={(event) => onDraftFieldChange('modelId', event.target.value)} placeholder={suggestedModelId || 'marca-modelo-2026'} />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-description">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">article</span>
                Descripción
              </span>
              <textarea id="admin-model-description" aria-label="Descripción" rows={4} value={draft.description} onChange={(event) => onDraftFieldChange('description', event.target.value)} placeholder="Resumen técnico/editorial del modelo para el hero público." />
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-classification"
          technicalTitle="02. CLASIFICACION"
          description="Define la taxonomía base y el carnet objetivo antes de empezar a cargar números o copy técnico."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-segment">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">category</span>
                Segmento
              </span>
              <select id="admin-model-segment" aria-label="Segmento" value={draft.segment} onChange={(event) => onDraftFieldChange('segment', event.target.value)}>
                <option value="">Seleccionar segmento</option>
                {BIKE_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>{segmentLabels[segment]}</option>
                ))}
              </select>
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-license">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('license')}</span>
                Carnet
              </span>
              <select id="admin-model-license" aria-label="Carnet" value={draft.license} onChange={(event) => onDraftFieldChange('license', event.target.value)}>
                <option value="">Seleccionar carnet</option>
                {BIKE_LICENSES.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-engine"
          technicalTitle="03. MOTOR & RENDIMIENTO"
          description="Bloque local de specs principales para alimentar el preview tipo ficha y preparar el contrato técnico futuro."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-engine-type">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">memory</span>
                Tipo de motor
              </span>
              <select id="admin-model-engine-type" aria-label="Tipo de motor" value={draft.engineType} onChange={(event) => onDraftFieldChange('engineType', event.target.value)}>
                <option value="">Seleccionar arquitectura</option>
                {adminModelEngineTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-displacement">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('engine')}</span>
                Cilindrada (cc)
              </span>
              <input id="admin-model-displacement" aria-label="Cilindrada (cc)" type="number" min="0" value={draft.displacementCc} onChange={(event) => onDraftFieldChange('displacementCc', event.target.value)} placeholder="895" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-power">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('power')}</span>
                Potencia (hp)
              </span>
              <input id="admin-model-power" aria-label="Potencia (hp)" type="number" min="0" step="0.1" value={draft.powerHp} onChange={(event) => onDraftFieldChange('powerHp', event.target.value)} placeholder="105" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-torque">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('torque')}</span>
                Torque (nm)
              </span>
              <input id="admin-model-torque" aria-label="Torque (nm)" type="number" min="0" step="0.1" value={draft.torqueNm} onChange={(event) => onDraftFieldChange('torqueNm', event.target.value)} placeholder="93" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-weight">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('weight')}</span>
                Peso (kg)
              </span>
              <input id="admin-model-weight" aria-label="Peso (kg)" type="number" min="0" step="0.1" value={draft.wetWeightKg} onChange={(event) => onDraftFieldChange('wetWeightKg', event.target.value)} placeholder="219" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-seat-height">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('seatHeight')}</span>
                Altura asiento (mm)
              </span>
              <input id="admin-model-seat-height" aria-label="Altura asiento (mm)" type="number" min="0" value={draft.seatHeightMm} onChange={(event) => onDraftFieldChange('seatHeightMm', event.target.value)} placeholder="870" />
            </label>

            <label className="admin-page__model-field" htmlFor="admin-model-fuel-tank">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('fuelTank')}</span>
                Depósito (l)
              </span>
              <input id="admin-model-fuel-tank" aria-label="Depósito (l)" type="number" min="0" step="0.1" value={draft.fuelTankLiters} onChange={(event) => onDraftFieldChange('fuelTankLiters', event.target.value)} placeholder="14.5" />
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-electronics"
          technicalTitle="04. ELECTRONICA & EQUIPAMIENTO"
          description="Selección local de features típicas para revisar el layout de toggles antes de mapearlas al backend real."
        >
          <div className="admin-page__model-checkbox-grid">
            {adminModelFeatureOptions.map((feature) => (
              <label className="admin-page__model-checkbox" key={feature.key}>
                <input type="checkbox" checked={draft.features[feature.key]} onChange={(event) => onFeatureToggle(feature.key, event.target.checked)} />
                <span>{feature.label}</span>
              </label>
            ))}
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-market"
          technicalTitle="05. PRECIO"
          description="Campos locales para validar copy, fallback de precio pendiente y decisiones de presentación antes de tocar persistencia."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field" htmlFor="admin-model-price">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">{getMotorcycleTechnicalIcon('price')}</span>
                Precio (€)
              </span>
              <input id="admin-model-price" type="number" min="0" value={draft.priceEur} onChange={(event) => onDraftFieldChange('priceEur', event.target.value)} placeholder="13990" />
            </label>

            <label className="admin-page__model-checkbox admin-page__model-checkbox--inline">
              <input type="checkbox" checked={draft.pricePending} onChange={(event) => onDraftCheckboxChange('pricePending', event.target.checked)} />
              <span>Marcar precio como pendiente</span>
            </label>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-image"
          technicalTitle="06. IMAGEN"
          description="Gestioná la imagen actual del modelo y prepará un reemplazo antes de publicar."
        >
          <div className="admin-page__model-field-grid">
            {currentImageUrl ? (
              <section className="admin-page__model-image-preview admin-page__model-field--full" aria-label="Imagen actual del modelo">
                <div className="admin-page__model-image-preview-copy">
                  <strong>Imagen actual</strong>
                  <p>
                    {currentImageIsSessionUpload
                      ? 'Imagen subida en este borrador. Puedes eliminarla o reemplazarla antes de publicar.'
                      : currentImageIsStorageAsset
                        ? 'Imagen guardada en el modelo. Puedes quitarla del formulario o reemplazarla antes de publicar.'
                        : 'Imagen activa en el formulario. Puedes reemplazarla o quitarla antes de publicar.'}
                  </p>
                </div>
                <div className="admin-page__model-image-preview-media">
                  <img src={currentImageUrl} alt="Imagen actual del modelo" />
                  <button
                    type="button"
                    className="admin-page__model-image-preview-delete"
                    aria-label={currentImageIsSessionUpload ? 'Eliminar imagen actual' : 'Quitar imagen del formulario'}
                    disabled={isDeletingCurrentImage}
                    onClick={handleRemoveCurrentImage}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {currentImageIsSessionUpload ? 'delete' : 'close'}
                    </span>
                    {isDeletingCurrentImage
                      ? 'Eliminando...'
                      : currentImageIsSessionUpload
                        ? 'Eliminar'
                        : 'Quitar'}
                  </button>
                </div>
              </section>
            ) : (
              <section className="admin-page__model-image-preview admin-page__model-image-preview--empty admin-page__model-field--full" aria-label="Imagen actual del modelo">
                <div className="admin-page__model-image-preview-copy">
                  <strong>Imagen no disponible</strong>
                  <p>Elige una URL o sube un archivo para continuar con el formulario.</p>
                </div>
              </section>
            )}
            <div className="admin-model__image-manager-trigger admin-page__model-field--full">
              <button
                type="button"
                className="account-page__button account-page__button--glass admin-page__model-action-button admin-model__image-manager-button"
                onClick={openImageManager}
              >
                Gestionar imágenes
              </button>
            </div>
          </div>
        </AdminModelSection>

        <AdminModelSection
          id="admin-model-section-sources"
          technicalTitle="07. FUENTES & NOTAS"
          description="Campos de referencia local para preparar fuentes, URL oficial y notas editoriales antes de definir servicios reales."
        >
          <div className="admin-page__model-field-grid">
            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-official-url">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">link</span>
                URL oficial
              </span>
              <input id="admin-model-official-url" type="url" value={draft.officialUrl} onChange={(event) => onDraftFieldChange('officialUrl', event.target.value)} placeholder="https://www.marca.com/modelo" />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-source-notes">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">source_environment</span>
                Notas de fuente
              </span>
              <textarea id="admin-model-source-notes" rows={3} value={draft.sourceNotes} onChange={(event) => onDraftFieldChange('sourceNotes', event.target.value)} placeholder="API, ficha oficial, manual interno, revisión editorial..." />
            </label>

            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-internal-notes">
              <span className="admin-page__model-label">
                <span className="material-symbols-outlined" aria-hidden="true">note_stack</span>
                Notas internas
              </span>
              <textarea id="admin-model-internal-notes" rows={4} value={draft.internalNotes} onChange={(event) => onDraftFieldChange('internalNotes', event.target.value)} placeholder="Pendientes de copy, dudas de specs, checks para QA visual..." />
            </label>
          </div>
        </AdminModelSection>

        <footer className="admin-page__model-actions" aria-label="Acciones del borrador">
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button admin-page__model-action-button--discard" onClick={handleDiscardChangesClick}>
            <span className="material-symbols-outlined" aria-hidden="true">undo</span>
            Descartar cambios
          </button>
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" onClick={() => onLocalAction('Borrador local actualizado.')}>
            <span className="material-symbols-outlined" aria-hidden="true">save</span>
            Guardar borrador
          </button>
          <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" onClick={() => onLocalAction('Vista previa actualizada.')}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            Vista previa
          </button>
          <button type="button" className="account-page__button admin-page__model-action-button admin-page__model-action-button--primary" disabled={saving || isUploading} onClick={handlePublishWithAutoUpload}>
            <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
            {isUploading ? 'Subiendo imagen previa...' : 'Publicar modelo'}
          </button>
        </footer>
      </form>
      
      {localStatus ? (
        <p className="admin-page__model-status" role="status" aria-live="polite">{localStatus}</p>
      ) : null}

      {isImageManagerOpen && (
        <div className="admin-model__image-modal-backdrop">
          <div className="admin-model__image-modal" role="dialog" aria-modal="true" aria-labelledby="image-manager-title">
            <header className="admin-model__image-modal-header">
              <div className="admin-model__image-modal-title-group">
                <span className="admin-model__image-modal-kicker">ADMIN IMAGE STUDIO</span>
                <h2 id="image-manager-title">Galería de imágenes</h2>
                {imageModalBadge ? (
                  <span className="admin-model__image-modal-badge">{imageModalBadge}</span>
                ) : null}
                <p className="admin-model__image-modal-subtitle">Visualiza la galería de imágenes y gestiona la imagen principal del modelo.</p>
              </div>
              <button
                type="button"
                className="admin-model__image-modal-close"
                aria-label="Cerrar gestor de imágenes"
                onClick={closeImageManager}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </header>
            <div className="admin-model__image-modal-body">
              <div className="admin-model__image-modal-workspace">
                <section className="admin-model__image-modal-primary-panel" aria-label="Portada activa del modelo">
                  <header className="admin-model__image-modal-primary-header">
                      <p className="admin-model__image-modal-section-label">{currentImageStatusLabel}</p>
                      <h3>Imagen principal del modelo</h3>
                  </header>

                  {currentImagePreviewUrl ? (
                    <div className="admin-model__image-modal-primary-card">
                      <div className="admin-model__image-modal-primary-media">
                        <img src={currentImagePreviewUrl} alt="Portada activa del modelo" loading="lazy" />
                        <div className="admin-model__image-modal-primary-media-overlay">
                          <span className="admin-model__image-modal-primary-chip">
                            <span className="material-symbols-outlined" aria-hidden="true">imagesmode</span>
                            {currentImageOriginLabel}
                          </span>
                          {draft.imageLocked ? (
                            <span className="admin-model__image-modal-primary-chip admin-model__image-modal-primary-chip--locked">
                              <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                              Bloqueada
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="admin-model__image-modal-primary-copy">
                        <p>{currentImageSupportCopy}</p>
                        <dl className="admin-model__image-modal-primary-meta">
                          <div>
                            <dt>Origen</dt>
                            <dd>{currentImageOriginLabel}</dd>
                          </div>
                          <div>
                            <dt>Estado</dt>
                            <dd>{draft.imageLocked ? 'Curada manualmente' : 'Editable'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-model__image-modal-primary-card admin-model__image-modal-primary-card--empty">
                      <span className="material-symbols-outlined" aria-hidden="true">image_search</span>
                      <div>
                        <strong>Sin portada definida</strong>
                        <p>{currentImageSupportCopy}</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="admin-model__image-modal-library" aria-label="Biblioteca visual del modelo">
                  <header className="admin-model__image-modal-gallery-header">
                    <div className="admin-model__image-modal-gallery-title-group">
                      <p className="admin-model__image-modal-section-label">Biblioteca visual</p>
                      <p className="admin-model__image-modal-helper">Selecciona una imagen como portada activa.</p>
                    </div>
                    <span className="admin-model__image-modal-gallery-count">{libraryImages.length}</span>
                  </header>

                  {!draft.modelId.trim() ? (
                    <div className="admin-model__image-modal-placeholder">
                      <span className="material-symbols-outlined" aria-hidden="true">imagesmode</span>
                      <div>
                        <strong>Galería persistente pendiente</strong>
                        <p>Cuando el modelo exista se cargarán aquí sus imágenes persistidas. Mientras tanto, puedes preparar la portada con la biblioteca disponible.</p>
                      </div>
                    </div>
                  ) : null}

                  {galleryLoading ? (
                    <div className="admin-model__image-modal-loading" role="status" aria-live="polite">
                      <span className="material-symbols-outlined" aria-hidden="true">sync</span>
                      <div>
                        <strong>Cargando galería</strong>
                        <p>Cargando galería de imágenes...</p>
                      </div>
                    </div>
                  ) : null}

                  {galleryError ? (
                    <div className="admin-model__image-modal-error" role="alert">
                      <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                      <div>
                        <strong>No se pudo cargar la galería</strong>
                        <p>{galleryError}</p>
                      </div>
                    </div>
                  ) : null}

                  {libraryImages.length === 0 ? (
                    <div className="admin-model__image-modal-empty">
                      <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
                      <div>
                        <strong>Sin imágenes disponibles</strong>
                        <p>Aún no hay recursos visuales listos para reutilizar como portada.</p>
                      </div>
                    </div>
                  ) : (
                    <section className="admin-model__image-modal-gallery" aria-label="Galería de imágenes del modelo">
                      <div className="admin-model__image-modal-gallery-grid">
                        {libraryImages.map((image) => {
                          const galleryImage = image.galleryImage;
                          const isCurrentCover = currentImagePreviewUrl === image.url;
                          const isOriginalPersisted = persistedImageUrlTrimmed === image.url;
                          const isPlaceholderOption = adminModelTechnicalPlaceholderImage === image.url;
                          const isGalleryRecord = Boolean(galleryImage);
                          const isInfoOpen = galleryInfoCardKeys.has(image.key);
                          const assetName = getGalleryImageAssetName(galleryImage?.storagePath || image.url);
                          const cardTitle = getGalleryImageCardTitle(galleryImage?.altText ?? null, isPlaceholderOption, image.kind, assetName);
                          const cardEyebrow = getGalleryImageCardEyebrow(isPlaceholderOption, isGalleryRecord, image.kind);
                          const cardFacts = getGalleryImageCardFacts(assetName, galleryImage);
                          const actionLabel = isCurrentCover ? `Portada actual: ${cardTitle}` : `Usar como portada: ${cardTitle}`;

                          const cardClassName = 'admin-model__image-modal-gallery-card'
                            + (isInfoOpen ? ' admin-model__image-modal-gallery-card--info-open' : '');

                          return (
                            <article
                              key={image.key}
                              className={cardClassName}
                              aria-label={cardTitle}
                              data-library-image-url={image.url}
                            >
                              <button
                                type="button"
                                className="admin-model__image-modal-gallery-card-action"
                                aria-label={actionLabel}
                                title={isCurrentCover ? 'Portada actual' : 'Usar como portada'}
                                disabled={isCurrentCover}
                                onClick={() => handleUseLibraryImageAsCover(image.url)}
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  {isCurrentCover ? 'check_circle' : 'wallpaper'}
                                </span>
                              </button>
                              <div className="admin-model__image-modal-gallery-card-stage">
                                <div className="admin-model__image-modal-gallery-card-face admin-model__image-modal-gallery-card-face--front">
                                  <div className="admin-model__image-modal-gallery-card-media">
                                    <img src={image.url} alt={cardTitle} loading="lazy" />
                                    <div className="admin-model__image-modal-gallery-card-overlays">
                                      <div className="admin-model__image-modal-gallery-card-badge-column">
                                        <span className="admin-model__image-modal-gallery-card-handle-slot material-symbols-outlined" aria-hidden="true">drag_indicator</span>
                                        <div className="admin-model__image-modal-gallery-card-badges">
                                          {isCurrentCover ? (
                                            <span
                                              className="admin-model__image-modal-gallery-card-badge admin-model__image-modal-gallery-card-badge--current"
                                              role="img"
                                              aria-label="Portada actual"
                                              title="Portada actual"
                                            >
                                              <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
                                            </span>
                                          ) : null}
                                          {galleryImage?.isPrimary ? (
                                            <span
                                              className="admin-model__image-modal-gallery-card-badge admin-model__image-modal-gallery-card-badge--primary"
                                              role="img"
                                              aria-label="Principal en galería"
                                              title="Principal en galería"
                                            >
                                              <span className="material-symbols-outlined" aria-hidden="true">star</span>
                                            </span>
                                          ) : null}
                                          {isOriginalPersisted && !isCurrentCover ? (
                                            <span
                                              className="admin-model__image-modal-gallery-card-badge"
                                              role="img"
                                              aria-label="Imagen persistida del modelo"
                                              title="Imagen persistida del modelo"
                                            >
                                              <span className="material-symbols-outlined" aria-hidden="true">history</span>
                                            </span>
                                          ) : null}
                                          {isPlaceholderOption ? (
                                            <span
                                              className="admin-model__image-modal-gallery-card-badge"
                                              role="img"
                                              aria-label="Placeholder técnico"
                                              title="Placeholder técnico"
                                            >
                                              <span className="material-symbols-outlined" aria-hidden="true">construction</span>
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="admin-model__image-modal-gallery-card-actions-row">
                                    {isGalleryRecord && !isPlaceholderOption ? (
                                      <button
                                        type="button"
                                        className="admin-model__image-modal-gallery-card-delete-btn"
                                        aria-label={`Eliminar imagen de la galería: ${cardTitle}`}
                                        title="Eliminar imagen de la galería"
                                        onClick={() => setConfirmDeleteImage(galleryImage!)}
                                      >
                                        <span className="material-symbols-outlined" aria-hidden="true">delete_forever</span>
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="admin-model__image-modal-gallery-card-info-toggle"
                                      aria-label={`Ver detalles de ${cardTitle}`}
                                      aria-expanded={isInfoOpen}
                                      title="Ver detalles"
                                      onClick={() => handleToggleGalleryCardInfo(image.key)}
                                    >
                                      <span className="material-symbols-outlined" aria-hidden="true">info</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="admin-model__image-modal-gallery-card-face admin-model__image-modal-gallery-card-face--back">
                                  <div className="admin-model__image-modal-gallery-card-info">
                                    <p className="admin-model__image-modal-gallery-card-eyebrow">{cardEyebrow}</p>
                                    <h4>{cardTitle}</h4>
                                    {cardFacts.length > 0 ? (
                                      <dl className="admin-model__image-modal-gallery-card-facts">
                                        {cardFacts.map((fact) => (
                                          <div key={`${image.key}-${fact.label}`}>
                                            <dt>{fact.label}</dt>
                                            <dd title={fact.value}>{fact.value}</dd>
                                          </div>
                                        ))}
                                      </dl>
                                    ) : (
                                      <p className="admin-model__image-modal-gallery-card-note">
                                        Selecciona esta imagen para actualizar la portada activa del formulario.
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="admin-model__image-modal-gallery-card-info-toggle admin-model__image-modal-gallery-card-info-toggle--back"
                                    aria-label={`Ocultar detalles de ${cardTitle}`}
                                    aria-expanded={isInfoOpen}
                                    title="Volver a la imagen"
                                    onClick={() => handleToggleGalleryCardInfo(image.key)}
                                  >
                                    <span className="material-symbols-outlined" aria-hidden="true">image</span>
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </section>

                <div className="admin-model__image-modal-controls">
                  <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--selector" aria-labelledby="image-manager-source-title">
                    <div className="admin-model__image-modal-control-header">
                      <p id="image-manager-source-title" className="admin-model__image-modal-control-title">Fuente principal</p>
                      <p className="admin-model__image-modal-helper">Elige si vas a curar la portada con una URL manual o con un archivo local.</p>
                    </div>
                    <div className="admin-page__model-field admin-page__model-field--full" role="group" aria-label="Modo de selección de imagen">
                      <div className="container-actions admin-model__image-modal-mode-switch" role="radiogroup" aria-label="Modo de selección de imagen">
                        <button className="account-page__button account-page__button--glass admin-page__model-action-button" type="button" role="radio" aria-checked={imageMode === 'url'} onClick={selectUrlMode}>
                          URL manual
                        </button>
                        <button className="account-page__button account-page__button--glass admin-page__model-action-button" type="button" role="radio" aria-checked={imageMode === 'upload'} onClick={selectUploadMode}>
                          Subir archivo
                        </button>
                      </div>
                    </div>
                    {fileError ? (
                      <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--alert">
                        <p role="alert" className="admin-page__model-field admin-page__model-field--full">{fileError}</p>
                      </section>
                    ) : null}

                    {imageMode === 'url' ? (
                      <>
                        <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--url" aria-labelledby="image-manager-url-title">
                          <div className="admin-model__image-modal-control-header">
                            <p id="image-manager-url-title" className="admin-model__image-modal-control-title">URL principal</p>
                            <p className="admin-model__image-modal-helper">Usa una ruta curada del catálogo o una URL externa válida para preparar la portada.</p>
                          </div>
                          <div className="admin-page__model-field-grid">
                            <label className="admin-page__model-field admin-page__model-field--full" htmlFor="admin-model-image-url">
                              <span className="admin-page__model-label">
                                <span className="material-symbols-outlined" aria-hidden="true">link_2</span>
                                Image URL
                              </span>
                              <input id="admin-model-image-url" aria-label="Image URL" type="url" value={draft.imageUrl} onChange={(event) => onDraftFieldChange('imageUrl', event.target.value)} placeholder="https://.../motorcycle.webp" />
                            </label>
                          </div>
                        </section>

                        <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--lock" aria-labelledby="image-manager-lock-title">
                          <div className="admin-model__image-modal-control-header">
                            <p id="image-manager-lock-title" className="admin-model__image-modal-control-title">Bloqueo y curación</p>
                            <p className="admin-model__image-modal-helper">Fija esta portada manual cuando no quieras que futuras sincronizaciones la sustituyan.</p>
                          </div>
                          <label className="admin-page__model-checkbox admin-page__model-checkbox--inline">
                            <input type="checkbox" checked={draft.imageLocked} onChange={(event) => onDraftCheckboxChange('imageLocked', event.target.checked)} />
                            <span className="content">
                              Imagen bloqueada / curada
                              <AdminModelInfoTooltip
                                ariaLabel="Más información sobre imagen bloqueada"
                                description="Evita que futuras sincronizaciones automáticas sustituyan esta imagen curada manualmente."
                              />
                            </span>
                          </label>
                        </section>
                      </>
                    ) : (
                      <section className="admin-model__image-modal-control-panel admin-model__image-modal-control-panel--upload" aria-labelledby="image-manager-upload-title">
                        <div className="admin-model__image-modal-control-header">
                          <p id="image-manager-upload-title" className="admin-model__image-modal-control-title">Carga local</p>
                          <p className="admin-model__image-modal-helper">Selecciona un archivo JPG, PNG o WebP para previsualizarlo y subirlo cuando el borrador esté listo.</p>
                        </div>
                        <div className="admin-page__model-field-grid">
                          <div className="admin-page__model-field admin-page__model-field--full">
                            <span className="admin-page__model-label">
                              <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                              Seleccionar imagen del modelo
                            </span>
                            <div className="admin-page__image-file-control">
                              <input ref={fileInputRef} id="admin-model-image-file" type="file" className="admin-page__image-file-input" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar imagen del modelo" onChange={handleFileSelect} />
                              <label htmlFor="admin-model-image-file" className="admin-page__image-file-trigger">
                                <span className="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
                                Seleccionar imagen
                              </label>
                              <span className="admin-page__image-file-name" aria-live="polite">
                                {selectedFile ? `${selectedFile.name} - ${formatFileSize(selectedFile.size)}` : 'Ningún archivo seleccionado'}
                              </span>
                            </div>
                          </div>

                          {previewBlobUrl && selectedFile ? (
                            <div className="admin-page__model-image-preview admin-page__model-field--full">
                              <div className="admin-page__model-image-preview-media admin-page__model-image-preview-media--candidate">
                                <img src={previewBlobUrl} alt="Previsualización local del archivo seleccionado" />
                              </div>
                              <div className="admin-page__model-image-preview-copy">
                                <strong>Archivo seleccionado</strong>
                                <p>{selectedFile.name} — {formatFileSize(selectedFile.size)}</p>
                              </div>
                              <button type="button" className="account-page__button account-page__button--glass admin-page__model-action-button" disabled={isUploading || !onUploadImage} onClick={handleImageUpload}>
                                <span className="material-symbols-outlined" aria-hidden="true">cloud_upload</span>
                                {isUploading ? 'Subiendo imagen...' : 'Subir imagen'}
                              </button>
                            </div>
                          ) : null}

                          {uploadStatus ? (
                            <div className="admin-page__model-image-upload-status admin-page__model-field--full" role={uploadStatus.type === 'warning' ? 'alert' : 'status'} aria-live="polite">
                              <span className="material-symbols-outlined" aria-hidden="true">
                                {uploadStatus.type === 'success' ? 'check_circle' : 'warning'}
                              </span>
                              <span>{uploadStatus.message}</span>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    )}
                  </section>

                  <p className="admin-model__image-modal-note">La biblioteca permite reutilizar imágenes como portada. La gestión avanzada de galería llegará en una fase posterior.</p>
                </div>
              </div>
            </div>
            <footer className="admin-model__image-modal-footer">
              <button
                type="button"
                className="account-page__button account-page__button--glass"
                onClick={closeImageManager}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="account-page__button"
                onClick={closeImageManager}
              >
                Guardar cambios
              </button>
            </footer>
          </div>
        </div>
      )}
      {confirmDeleteImage && (
        <GalleryConfirmDeleteModal
          imageUrl={confirmDeleteImage.url}
          imageTitle={getGalleryImageCardTitle(
            confirmDeleteImage.altText,
            false,
            'gallery',
            getGalleryImageAssetName(confirmDeleteImage.storagePath || confirmDeleteImage.url),
          )}
          isProcessing={isDeletingGalleryImage}
          onConfirm={() => handleConfirmDelete(confirmDeleteImage)}
          onCancel={handleCancelDelete}
        >
          Eliminar imagen de galería
        </GalleryConfirmDeleteModal>
      )}
    </section>
  );
}
