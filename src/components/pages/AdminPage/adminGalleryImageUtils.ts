import { MOTORCYCLE_IMAGE_BUCKET } from '../../../services/adminMotorcycleImageUploadService';
import type { AdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';
import type { MotorcycleDataSource } from '../../../types/bike';

export const adminModelTechnicalPlaceholderImage = '/images/placeholders/motorcycle-technical-pending.jpg';

export type AdminModelLibraryImage = Readonly<{
  key: string;
  url: string;
  kind: 'gallery' | 'draft' | 'persisted' | 'placeholder';
  galleryImage?: AdminMotorcycleGalleryImage;
}>;

const motorcycleImageBucketPublicPath = `/storage/v1/object/public/${MOTORCYCLE_IMAGE_BUCKET}/`;

function getConfiguredMotorcycleImageOrigin(): string | null {
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl, window.location.origin).origin;
  } catch {
    return null;
  }
}

function isSafeMotorcycleImageObjectPath(objectPath: string): boolean {
  if (!objectPath) {
    return false;
  }

  if (objectPath.startsWith('/')) {
    return false;
  }

  if (objectPath.includes('..')) {
    return false;
  }

  return objectPath.includes('/');
}

export function getMotorcycleImageObjectPath(imageUrl: string): string | null {
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl) return null;

  const configuredOrigin = getConfiguredMotorcycleImageOrigin();
  const isAbsoluteHttpUrl = /^https?:\/\//i.test(trimmedUrl);

  try {
    const parsedUrl = new URL(trimmedUrl, window.location.origin);

    if (!isAbsoluteHttpUrl && (!configuredOrigin || configuredOrigin !== window.location.origin)) {
      return null;
    }

    if (parsedUrl.origin !== window.location.origin && configuredOrigin && parsedUrl.origin !== configuredOrigin) {
      return null;
    }

    if (!parsedUrl.pathname.startsWith(motorcycleImageBucketPublicPath)) {
      return null;
    }

    const objectPath = decodeURIComponent(parsedUrl.pathname.slice(motorcycleImageBucketPublicPath.length));
    return isSafeMotorcycleImageObjectPath(objectPath) ? objectPath : null;
  } catch {
    if (!trimmedUrl.startsWith(motorcycleImageBucketPublicPath)) {
      return null;
    }

    const objectPath = decodeURIComponent(trimmedUrl.slice(motorcycleImageBucketPublicPath.length));
    return isSafeMotorcycleImageObjectPath(objectPath) ? objectPath : null;
  }
}

export function galleryImageMatchesImage(
  galleryImage: AdminMotorcycleGalleryImage,
  imageUrl: string,
  imageObjectPath?: string | null,
): boolean {
  if (galleryImage.url === imageUrl) {
    return true;
  }

  if (imageObjectPath && galleryImage.storagePath && galleryImage.storagePath === imageObjectPath) {
    return true;
  }

  if (imageObjectPath) {
    const galleryObjectPath = getMotorcycleImageObjectPath(galleryImage.url);
    if (galleryObjectPath && galleryObjectPath === imageObjectPath) {
      return true;
    }
  }

  return false;
}

export function isGalleryImageCurrentCover(
  galleryImage: AdminMotorcycleGalleryImage,
  currentImageUrl: string,
  currentImageObjectPath?: string | null,
): boolean {
  return galleryImageMatchesImage(galleryImage, currentImageUrl, currentImageObjectPath);
}

export function isImageBackedByGalleryRecord(
  imageUrl: string,
  galleryImages: readonly AdminMotorcycleGalleryImage[],
): boolean {
  if (!imageUrl || galleryImages.length === 0) {
    return false;
  }

  const trimmedUrl = imageUrl.trim();

  if (galleryImages.some((image) => image.url === trimmedUrl)) {
    return true;
  }

  const imageObjectPath = getMotorcycleImageObjectPath(trimmedUrl);
  if (!imageObjectPath) {
    return false;
  }

  return galleryImages.some(
    (image) => (image.storagePath && image.storagePath === imageObjectPath)
      || getMotorcycleImageObjectPath(image.url) === imageObjectPath,
  );
}

export function getActiveGalleryImages(
  galleryImages: readonly AdminMotorcycleGalleryImage[],
  pendingDeleteIds: readonly string[],
): readonly AdminMotorcycleGalleryImage[] {
  if (pendingDeleteIds.length === 0) {
    return galleryImages;
  }

  return galleryImages.filter((img) => !pendingDeleteIds.includes(img.id));
}

export function getGalleryImageCleanupObjectPath(
  galleryImage: AdminMotorcycleGalleryImage,
): string | null {
  return galleryImage.storagePath || getMotorcycleImageObjectPath(galleryImage.url);
}

export function isCleanupPathSharedWithActiveImage(
  objectPath: string,
  activeGalleryImages: readonly AdminMotorcycleGalleryImage[],
): boolean {
  return activeGalleryImages.some(
    (img) => (img.storagePath && img.storagePath === objectPath)
      || getMotorcycleImageObjectPath(img.url) === objectPath,
  );
}

export function getGalleryImageSourceLabel(source: MotorcycleDataSource): string {
  switch (source) {
    case 'api':
      return 'Importación';
    case 'manual':
      return 'Manual';
    case 'user':
      return 'Usuario';
    case 'estimated':
      return 'Estimado';
    case 'placeholder':
      return 'Placeholder';
    default:
      return 'Manual';
  }
}

export function formatGalleryImageDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha pendiente';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

export function getGalleryImageAssetName(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const withoutQuery = trimmedValue.split(/[?#]/, 1)[0] ?? trimmedValue;
  const segments = withoutQuery.split('/').filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;

  if (!lastSegment) {
    return null;
  }

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

type GalleryImageKind = 'gallery' | 'draft' | 'persisted' | 'placeholder';

export function getGalleryImageCardTitle(
  altText: string | null | undefined,
  isPlaceholderOption: boolean,
  kind: GalleryImageKind,
  assetName: string | null,
): string {
  return altText?.trim()
    || (isPlaceholderOption
      ? 'Placeholder técnico MotoAtlas'
      : kind === 'persisted'
        ? 'Portada guardada'
        : kind === 'draft'
          ? 'Portada en edición'
          : assetName
            || 'Imagen disponible');
}

export function getGalleryImageCardEyebrow(
  isPlaceholderOption: boolean,
  isGalleryRecord: boolean,
  kind: GalleryImageKind,
): string {
  return isPlaceholderOption
    ? 'Fallback técnico'
    : isGalleryRecord
      ? 'Registro persistido'
      : kind === 'persisted'
        ? 'Referencia guardada'
        : 'Cobertura activa';
}

export type GalleryImageCardFact = { label: string; value: string };

export function getGalleryImageCardFacts(
  assetName: string | null,
  galleryImage: AdminMotorcycleGalleryImage | null | undefined,
): ReadonlyArray<GalleryImageCardFact> {
  return [
    assetName ? { label: 'Archivo', value: assetName } : null,
    galleryImage ? { label: 'Fuente', value: getGalleryImageSourceLabel(galleryImage.source) } : null,
    galleryImage ? { label: 'Orden', value: `#${galleryImage.sortOrder}` } : null,
    galleryImage ? { label: 'Alta', value: formatGalleryImageDate(galleryImage.createdAt) } : null,
  ].filter(Boolean) as ReadonlyArray<GalleryImageCardFact>;
}

export function buildGalleryLibraryImages(
  galleryImages: readonly AdminMotorcycleGalleryImage[],
  persistedImageUrl: string,
  currentImageUrl: string,
  stableKeyMap: Map<string, string>,
): readonly AdminModelLibraryImage[] {
  const entries = new Map<string, AdminModelLibraryImage>();

  const getStableKey = (url: string): string => {
    const existing = stableKeyMap.get(url);
    if (existing) {
      return existing;
    }
    const nextKey = `lib-${stableKeyMap.size}`;
    stableKeyMap.set(url, nextKey);
    return nextKey;
  };

  const registerImage = (entry: AdminModelLibraryImage) => {
    const trimmedUrl = entry.url.trim();
    if (!trimmedUrl || entries.has(trimmedUrl)) {
      return;
    }

    entries.set(trimmedUrl, {
      ...entry,
      key: getStableKey(trimmedUrl),
      url: trimmedUrl,
    });
  };

  galleryImages.forEach((image) => {
    registerImage({
      key: `gallery-${image.id}`,
      url: image.url,
      kind: 'gallery',
      galleryImage: image,
    });
  });

  if (persistedImageUrl) {
    registerImage({
      key: 'persisted-model-image',
      url: persistedImageUrl,
      kind: 'persisted',
    });
  }

  if (currentImageUrl) {
    registerImage({
      key: 'draft-current-image',
      url: currentImageUrl,
      kind: 'draft',
    });
  }

  registerImage({
    key: 'technical-placeholder-image',
    url: adminModelTechnicalPlaceholderImage,
    kind: 'placeholder',
  });

  return [...entries.values()];
}
