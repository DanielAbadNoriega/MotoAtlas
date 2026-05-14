export const MOTORCYCLE_IMAGE_FALLBACK_URL = '/images/placeholders/motorcycle-technical-pending.jpg';
export const MOTORCYCLE_IMAGE_FALLBACK_LABEL = 'TECHNICAL IMAGE PENDING';

export type MotorcycleImageSource = Readonly<{
  brand?: unknown;
  description?: unknown;
  image?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  model?: unknown;
  name?: unknown;
}>;

export type MotorcycleImageResult = Readonly<{
  altText: string;
  imageUrl: string;
  isFallback: boolean;
  reason?: 'empty' | 'invalid-url' | 'known-placeholder' | 'load-error' | 'forced';
}>;

type GetMotorcycleImageOptions = Readonly<{
  forceFallback?: boolean;
  reason?: MotorcycleImageResult['reason'];
}>;

function cleanText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getCandidateImageUrl(source: MotorcycleImageSource) {
  return cleanText(source.imageUrl) ?? cleanText(source.image_url) ?? cleanText(source.image);
}

function getDisplayName(source: MotorcycleImageSource) {
  const explicitName = cleanText(source.name);
  const brand = cleanText(source.brand);
  const model = cleanText(source.model);
  const brandModel = [brand, model].filter(Boolean).join(' ').trim();

  return explicitName ?? (brandModel || 'la moto');
}

function hasInvalidPlaceholderSignature(imageUrl: string) {
  const normalizedUrl = imageUrl.toLowerCase().replace(/[+_-]+/g, ' ');

  return (
    normalizedUrl.includes('placehold.co') ||
    normalizedUrl.includes('placeholder') ||
    normalizedUrl.includes('sin imagen') ||
    normalizedUrl.includes('sin image') ||
    normalizedUrl.includes('no image') ||
    normalizedUrl.startsWith('data:image/svg+xml')
  );
}

function isValidImageUrl(imageUrl: string) {
  if (imageUrl.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'blob:';
  } catch {
    return false;
  }
}

function getInvalidReason(imageUrl: string | undefined): MotorcycleImageResult['reason'] | undefined {
  if (!imageUrl) {
    return 'empty';
  }

  if (hasInvalidPlaceholderSignature(imageUrl)) {
    return 'known-placeholder';
  }

  if (!isValidImageUrl(imageUrl)) {
    return 'invalid-url';
  }

  return undefined;
}

export function getMotorcycleFallbackAlt(source: MotorcycleImageSource) {
  return `Imagen técnica pendiente de ${getDisplayName(source)}`;
}

export function getMotorcycleImage(
  source: MotorcycleImageSource,
  options: GetMotorcycleImageOptions = {},
): MotorcycleImageResult {
  const candidateImageUrl = getCandidateImageUrl(source);
  const forcedReason = options.forceFallback ? options.reason ?? 'forced' : undefined;
  const invalidReason = forcedReason ?? getInvalidReason(candidateImageUrl);

  if (invalidReason) {
    return {
      altText: getMotorcycleFallbackAlt(source),
      imageUrl: MOTORCYCLE_IMAGE_FALLBACK_URL,
      isFallback: true,
      reason: invalidReason,
    };
  }

  const description = cleanText(source.description);
  const displayName = getDisplayName(source);

  return {
    altText: description ?? `Imagen de ${displayName}`,
    imageUrl: candidateImageUrl!,
    isFallback: false,
  };
}
