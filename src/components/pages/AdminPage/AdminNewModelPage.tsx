import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../../features/auth';
import { createAdminMotorcycle } from '../../../services/adminMotorcycleService';
import { deleteMotorcycleImage, uploadMotorcycleImage } from '../../../services/adminMotorcycleImageUploadService';
import { createAdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';
import { getMotorcycleImageObjectPath } from './adminGalleryImageUtils';
import {
  buildSuggestedModelId,
  draftToCreatePayload,
  validateAdminModelDraftForPublish,
  type AdminModelDraft,
  type AdminModelDraftField,
  type AdminModelFeatureKey,
} from './adminModelDraftUtils';
import { AdminModelsWorkspace } from './AdminModelsWorkspace';
import { AdminModelFormBody } from './AdminModelFormBody';
import type { Bike } from '../../../types/bike';

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
