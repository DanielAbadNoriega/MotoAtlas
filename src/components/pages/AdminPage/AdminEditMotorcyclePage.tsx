import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../features/auth';
import { updateAdminMotorcycle } from '../../../services/adminMotorcycleService';
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
import {
  buildSuggestedModelId,
  cloneAdminModelDraft,
  createDraftFromBike,
  draftToUpdatePayload,
  validateAdminModelDraftForPublish,
  type AdminModelDraft,
  type AdminModelDraftField,
  type AdminModelFeatureKey,
} from './adminModelDraftUtils';
import { AdminModelFormBody } from './AdminModelFormBody';
import { AdminModelsWorkspace } from './AdminModelsWorkspace';
import type { Bike, MotorcycleDataSource } from '../../../types/bike';

type OnMotorcyclesChange = (bike: Bike) => void;

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
