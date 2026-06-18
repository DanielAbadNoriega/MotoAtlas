import { MOTORCYCLE_IMAGE_BUCKET } from '../../../services/adminMotorcycleImageUploadService';
import type { AdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';

export const adminModelTechnicalPlaceholderImage = '/images/placeholders/motorcycle-technical-pending.jpg';

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
