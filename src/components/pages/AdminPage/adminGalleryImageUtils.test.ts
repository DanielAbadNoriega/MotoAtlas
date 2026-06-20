import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';
import {
  appendGalleryImage,
  buildGalleryLibraryImages,
  getMotorcycleImageObjectPath,
  galleryImageMatchesImage,
  getNextGallerySortOrder,
  isGalleryImageCurrentCover,
  isImageBackedByGalleryRecord,
  getActiveGalleryImages,
  getGalleryImageCleanupObjectPath,
  isCleanupPathSharedWithActiveImage,
  formatGalleryImageDate,
  getGalleryImageAssetName,
  getGalleryImageSourceLabel,
  getGalleryImageCardTitle,
  getGalleryImageCardEyebrow,
  getGalleryImageCardFacts,
  type AdminModelLibraryImage,
  type GalleryImageCardFact,
} from './adminGalleryImageUtils';

import { adminModelTechnicalPlaceholderImage } from './adminGalleryImageUtils';

const mockGalleryImage = (overrides: Partial<AdminMotorcycleGalleryImage> = {}): AdminMotorcycleGalleryImage => ({
  id: 'img-1',
  motorcycleId: 'moto-1',
  url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg',
  storagePath: 'moto-1/abc.jpg',
  altText: null,
  isPrimary: false,
  sortOrder: 1,
  source: 'manual',
  createdBy: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getMotorcycleImageObjectPath', () => {
  it('returns null for empty string', () => {
    expect(getMotorcycleImageObjectPath('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(getMotorcycleImageObjectPath('   ')).toBeNull();
  });

  it('returns null for non-storage URL', () => {
    expect(getMotorcycleImageObjectPath('/images/local/cat.jpg')).toBeNull();
  });

  it('returns null for external URL outside configured origin', () => {
    expect(getMotorcycleImageObjectPath('https://example.com/image.jpg')).toBeNull();
  });

  it('extracts object path from Supabase storage URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const url = 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg';
    expect(getMotorcycleImageObjectPath(url)).toBe('moto-1/abc.jpg');
  });

  it('returns null for path without slash', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const url = 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/flatfile.jpg';
    const result = getMotorcycleImageObjectPath(url);
    expect(result).toBeNull();
  });

  it('returns null for path with double-dot traversal', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const url = 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/../secret/key.jpg';
    const result = getMotorcycleImageObjectPath(url);
    expect(result).toBeNull();
  });
});

describe('galleryImageMatchesImage', () => {
  it('matches by exact URL', () => {
    const image = mockGalleryImage({ url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg' });
    expect(galleryImageMatchesImage(image, image.url)).toBe(true);
  });

  it('matches by storagePath', () => {
    const image = mockGalleryImage({ storagePath: 'moto-1/abc.jpg' });
    expect(galleryImageMatchesImage(image, 'https://other.url/img.jpg', 'moto-1/abc.jpg')).toBe(true);
  });

  it('matches by derived object path from URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const image = mockGalleryImage({
      url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg',
      storagePath: null,
    });
    expect(galleryImageMatchesImage(image, 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const image = mockGalleryImage({
      url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg',
      storagePath: 'moto-1/abc.jpg',
    });
    expect(galleryImageMatchesImage(image, '/images/local/other.jpg')).toBe(false);
  });

  it('returns false when imageObjectPath is null and URLs differ', () => {
    const image = mockGalleryImage({ url: '/images/local/a.jpg' });
    expect(galleryImageMatchesImage(image, '/images/local/b.jpg')).toBe(false);
  });
});

describe('isGalleryImageCurrentCover', () => {
  it('returns true when gallery image URL matches cover URL', () => {
    const image = mockGalleryImage({ url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/cover.jpg' });
    expect(isGalleryImageCurrentCover(image, image.url)).toBe(true);
  });

  it('returns true when storagePath matches cover object path', () => {
    const image = mockGalleryImage({ storagePath: 'moto-1/cover.jpg' });
    expect(isGalleryImageCurrentCover(image, 'https://any.url/img.jpg', 'moto-1/cover.jpg')).toBe(true);
  });

  it('returns false when no match found', () => {
    const image = mockGalleryImage({ url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/other.jpg' });
    expect(isGalleryImageCurrentCover(image, 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/cover.jpg')).toBe(false);
  });
});

describe('isImageBackedByGalleryRecord', () => {
  it('returns false for empty gallery', () => {
    expect(isImageBackedByGalleryRecord('https://example.com/img.jpg', [])).toBe(false);
  });

  it('returns false for empty imageUrl', () => {
    const images = [mockGalleryImage()];
    expect(isImageBackedByGalleryRecord('', images)).toBe(false);
  });

  it('returns true when URL matches a gallery image URL', () => {
    const images = [mockGalleryImage({ url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/match.jpg' })];
    expect(isImageBackedByGalleryRecord('https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/match.jpg', images)).toBe(true);
  });

  it('returns true when storagePath matches', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const images = [mockGalleryImage({ storagePath: 'moto-1/abc.jpg' })];
    expect(isImageBackedByGalleryRecord('https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg', images)).toBe(true);
  });

  it('returns true when derived object path matches gallery image URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const images = [mockGalleryImage({
      url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg',
      storagePath: null,
    })];
    expect(isImageBackedByGalleryRecord('https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg', images)).toBe(true);
  });

  it('returns false when no gallery image matches', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const images = [mockGalleryImage({
      url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/abc.jpg',
      storagePath: 'moto-1/abc.jpg',
    })];
    expect(isImageBackedByGalleryRecord('/images/local/placeholder.jpg', images)).toBe(false);
  });
});

describe('getActiveGalleryImages', () => {
  it('returns all images when no pending deletes', () => {
    const images = [mockGalleryImage({ id: 'a' }), mockGalleryImage({ id: 'b' })];
    expect(getActiveGalleryImages(images, [])).toEqual(images);
  });

  it('filters out pending-delete images', () => {
    const images = [
      mockGalleryImage({ id: 'a' }),
      mockGalleryImage({ id: 'b' }),
      mockGalleryImage({ id: 'c' }),
    ];
    const result = getActiveGalleryImages(images, ['a', 'c']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('returns empty array when all images pending delete', () => {
    const images = [mockGalleryImage({ id: 'a' })];
    expect(getActiveGalleryImages(images, ['a'])).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(getActiveGalleryImages([], [])).toHaveLength(0);
  });
});

describe('getGalleryImageCleanupObjectPath', () => {
  it('returns storagePath when present', () => {
    const image = mockGalleryImage({ storagePath: 'moto-1/cleanup.jpg' });
    expect(getGalleryImageCleanupObjectPath(image)).toBe('moto-1/cleanup.jpg');
  });

  it('returns derived object path when storagePath is null', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const image = mockGalleryImage({
      url: 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/derived.jpg',
      storagePath: null,
    });
    expect(getGalleryImageCleanupObjectPath(image)).toBe('moto-1/derived.jpg');
  });

  it('returns null when no storagePath and URL yields no object path', () => {
    const image = mockGalleryImage({ url: '/images/local/manual.jpg', storagePath: null });
    expect(getGalleryImageCleanupObjectPath(image)).toBeNull();
  });
});

describe('isCleanupPathSharedWithActiveImage', () => {
  it('returns true when active image has matching storagePath', () => {
    const activeImages = [mockGalleryImage({ storagePath: 'moto-1/shared.jpg' })];
    expect(isCleanupPathSharedWithActiveImage('moto-1/shared.jpg', activeImages)).toBe(true);
  });

  it('returns true when active image URL matches via derived path', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    const url = 'https://project.supabase.co/storage/v1/object/public/motorcycle-images/moto-1/shared.jpg';
    const activeImages = [mockGalleryImage({ url, storagePath: null })];
    expect(isCleanupPathSharedWithActiveImage('moto-1/shared.jpg', activeImages)).toBe(true);
  });

  it('returns false when no active image matches', () => {
    const activeImages = [mockGalleryImage({ storagePath: 'moto-1/different.jpg' })];
    expect(isCleanupPathSharedWithActiveImage('moto-1/other.jpg', activeImages)).toBe(false);
  });

  it('returns false for empty active list', () => {
    expect(isCleanupPathSharedWithActiveImage('moto-1/some.jpg', [])).toBe(false);
  });
});

describe('getGalleryImageSourceLabel', () => {
  it('returns Importación for api source', () => {
    expect(getGalleryImageSourceLabel('api')).toBe('Importación');
  });

  it('returns Manual for manual source', () => {
    expect(getGalleryImageSourceLabel('manual')).toBe('Manual');
  });

  it('returns Usuario for user source', () => {
    expect(getGalleryImageSourceLabel('user')).toBe('Usuario');
  });

  it('returns Estimado for estimated source', () => {
    expect(getGalleryImageSourceLabel('estimated')).toBe('Estimado');
  });

  it('returns Placeholder for placeholder source', () => {
    expect(getGalleryImageSourceLabel('placeholder')).toBe('Placeholder');
  });

  it('returns Manual for unknown source', () => {
    expect(getGalleryImageSourceLabel('unknown' as never)).toBe('Manual');
  });
});

describe('formatGalleryImageDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatGalleryImageDate('2025-01-05T10:00:00.000Z');
    expect(result).toBe('05 ene 2025');
  });

  it('returns Fecha pendiente for invalid date', () => {
    expect(formatGalleryImageDate('not-a-date')).toBe('Fecha pendiente');
  });

  it('returns Fecha pendiente for empty string', () => {
    expect(formatGalleryImageDate('')).toBe('Fecha pendiente');
  });

  it('formats December date correctly', () => {
    const result = formatGalleryImageDate('2024-12-25T00:00:00.000Z');
    expect(result).toBe('25 dic 2024');
  });
});

describe('getGalleryImageAssetName', () => {
  it('extracts filename from URL path', () => {
    expect(getGalleryImageAssetName('https://example.com/path/to/image.webp')).toBe('image.webp');
  });

  it('decodes URI-encoded filename', () => {
    expect(getGalleryImageAssetName('https://example.com/path/to/im%C3%A1gen.webp')).toBe('imágen.webp');
  });

  it('strips query string', () => {
    expect(getGalleryImageAssetName('https://example.com/path/image.webp?w=800&q=75')).toBe('image.webp');
  });

  it('returns null for empty string', () => {
    expect(getGalleryImageAssetName('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(getGalleryImageAssetName('   ')).toBeNull();
  });

  it('returns null for root path', () => {
    expect(getGalleryImageAssetName('/')).toBeNull();
  });

  it('returns segment from local relative path', () => {
    expect(getGalleryImageAssetName('moto-1/filename.jpg')).toBe('filename.jpg');
  });
});

describe('getGalleryImageCardTitle', () => {
  it('uses altText when present', () => {
    expect(getGalleryImageCardTitle('BMW lateral', false, 'gallery', 'bmw.webp')).toBe('BMW lateral');
  });

  it('uses trimmed altText', () => {
    expect(getGalleryImageCardTitle('  BMW lateral  ', false, 'gallery', 'bmw.webp')).toBe('BMW lateral');
  });

  it('returns placeholder title for placeholder kind', () => {
    expect(getGalleryImageCardTitle(null, true, 'placeholder', null)).toBe('Placeholder técnico MotoAtlas');
  });

  it('returns persisted title for persisted kind', () => {
    expect(getGalleryImageCardTitle(null, false, 'persisted', null)).toBe('Portada guardada');
  });

  it('returns draft title for draft kind', () => {
    expect(getGalleryImageCardTitle(null, false, 'draft', null)).toBe('Portada en edición');
  });

  it('uses assetName as fallback for gallery kind', () => {
    expect(getGalleryImageCardTitle(null, false, 'gallery', 'frontal.jpg')).toBe('frontal.jpg');
  });

  it('returns default title when no altText and no assetName', () => {
    expect(getGalleryImageCardTitle(null, false, 'gallery', null)).toBe('Imagen disponible');
  });

  it('empty altText falls through to kind-based logic', () => {
    expect(getGalleryImageCardTitle('', false, 'persisted', null)).toBe('Portada guardada');
  });
});

describe('getGalleryImageCardEyebrow', () => {
  it('returns Fallback técnico for placeholder option', () => {
    expect(getGalleryImageCardEyebrow(true, false, 'placeholder')).toBe('Fallback técnico');
  });

  it('returns Registro persistido for gallery record', () => {
    expect(getGalleryImageCardEyebrow(false, true, 'gallery')).toBe('Registro persistido');
  });

  it('returns Referencia guardada for persisted kind', () => {
    expect(getGalleryImageCardEyebrow(false, false, 'persisted')).toBe('Referencia guardada');
  });

  it('returns Cobertura activa for draft kind', () => {
    expect(getGalleryImageCardEyebrow(false, false, 'draft')).toBe('Cobertura activa');
  });

  it('returns Cobertura activa for gallery without record', () => {
    expect(getGalleryImageCardEyebrow(false, false, 'gallery')).toBe('Cobertura activa');
  });
});

describe('getGalleryImageCardFacts', () => {
  const galleryImage = mockGalleryImage({
    source: 'api',
    sortOrder: 2,
    createdAt: '2025-03-15T10:00:00.000Z',
  });

  it('includes Archivo fact when assetName present', () => {
    const facts = getGalleryImageCardFacts('abc.jpg', galleryImage);
    expect(facts.find((f) => f.label === 'Archivo')?.value).toBe('abc.jpg');
  });

  it('omits Archivo fact when assetName is null', () => {
    const facts = getGalleryImageCardFacts(null, galleryImage);
    expect(facts.find((f) => f.label === 'Archivo')).toBeUndefined();
  });

  it('includes Fuente, Orden, Alta facts when galleryImage present', () => {
    const facts = getGalleryImageCardFacts('abc.jpg', galleryImage);
    expect(facts.find((f) => f.label === 'Fuente')?.value).toBe('Importación');
    expect(facts.find((f) => f.label === 'Orden')?.value).toBe('#2');
    expect(facts.find((f) => f.label === 'Alta')?.value).toBe('15 mar 2025');
  });

  it('returns empty array when no assetName and no galleryImage', () => {
    const facts = getGalleryImageCardFacts(null, null);
    expect(facts).toHaveLength(0);
  });

  it('returns empty array when galleryImage is undefined', () => {
    const facts = getGalleryImageCardFacts(null, undefined);
    expect(facts).toHaveLength(0);
  });
});

describe('appendGalleryImage', () => {
  it('appends a new image to an empty list', () => {
    const image = mockGalleryImage({ id: 'a', sortOrder: 1, createdAt: '2025-01-01T00:00:00.000Z' });
    const result = appendGalleryImage([], image);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('replaces existing image with same id', () => {
    const existing = mockGalleryImage({ id: 'a', sortOrder: 1, url: '/images/old.jpg', createdAt: '2025-01-01T00:00:00.000Z' });
    const updated = mockGalleryImage({ id: 'a', sortOrder: 1, url: '/images/new.jpg', createdAt: '2025-01-01T00:00:00.000Z' });
    const result = appendGalleryImage([existing], updated);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('/images/new.jpg');
  });

  it('sorts by sortOrder ascending', () => {
    const first = mockGalleryImage({ id: 'a', sortOrder: 0, createdAt: '2025-01-01T00:00:00.000Z' });
    const second = mockGalleryImage({ id: 'b', sortOrder: 2, createdAt: '2025-01-01T00:00:00.000Z' });
    const third = mockGalleryImage({ id: 'c', sortOrder: 1, createdAt: '2025-01-01T00:00:00.000Z' });
    const result = appendGalleryImage([first, second], third);
    expect(result.map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by createdAt when sortOrder ties', () => {
    const earlier = mockGalleryImage({ id: 'a', sortOrder: 1, createdAt: '2025-01-01T00:00:00.000Z' });
    const later = mockGalleryImage({ id: 'b', sortOrder: 1, createdAt: '2025-06-01T00:00:00.000Z' });
    const result = appendGalleryImage([later], earlier);
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('getNextGallerySortOrder', () => {
  it('returns 0 for empty list', () => {
    expect(getNextGallerySortOrder([])).toBe(0);
  });

  it('returns max sortOrder + 1', () => {
    const images = [
      mockGalleryImage({ id: 'a', sortOrder: 0 }),
      mockGalleryImage({ id: 'b', sortOrder: 5 }),
      mockGalleryImage({ id: 'c', sortOrder: 2 }),
    ];
    expect(getNextGallerySortOrder(images)).toBe(6);
  });

  it('handles single image', () => {
    const images = [mockGalleryImage({ id: 'a', sortOrder: 3 })];
    expect(getNextGallerySortOrder(images)).toBe(4);
  });
});

describe('buildGalleryLibraryImages', () => {
  it('returns only placeholder when no images are provided', () => {
    const result = buildGalleryLibraryImages([], '', '', new Map());
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('placeholder');
    expect(result[0].url).toBe(adminModelTechnicalPlaceholderImage);
  });

  it('includes all gallery images with kind gallery', () => {
    const images = [
      mockGalleryImage({ id: 'a', url: '/images/gallery/a.jpg' }),
      mockGalleryImage({ id: 'b', url: '/images/gallery/b.jpg' }),
    ];
    const result = buildGalleryLibraryImages(images, '', '', new Map());
    expect(result).toHaveLength(3);
    expect(result.filter((e) => e.kind === 'gallery')).toHaveLength(2);
    expect(result.find((e) => e.url === '/images/gallery/a.jpg')?.galleryImage?.id).toBe('a');
    expect(result.find((e) => e.url === '/images/gallery/b.jpg')?.galleryImage?.id).toBe('b');
  });

  it('includes persisted image when provided', () => {
    const result = buildGalleryLibraryImages([], '/images/persisted.jpg', '', new Map());
    const persisted = result.find((e) => e.kind === 'persisted');
    expect(persisted).toBeDefined();
    expect(persisted?.url).toBe('/images/persisted.jpg');
  });

  it('includes draft image when provided', () => {
    const result = buildGalleryLibraryImages([], '', '/images/draft.jpg', new Map());
    const draft = result.find((e) => e.kind === 'draft');
    expect(draft).toBeDefined();
    expect(draft?.url).toBe('/images/draft.jpg');
  });

  it('deduplicates by URL (gallery image same as persisted)', () => {
    const images = [mockGalleryImage({ id: 'a', url: '/images/shared.jpg' })];
    const result = buildGalleryLibraryImages(images, '/images/shared.jpg', '', new Map());
    const galleryEntries = result.filter((e) => e.kind === 'gallery');
    const persistedEntries = result.filter((e) => e.kind === 'persisted');
    expect(galleryEntries).toHaveLength(1);
    expect(persistedEntries).toHaveLength(0);
  });

  it('deduplicates by URL (draft same as gallery)', () => {
    const images = [mockGalleryImage({ id: 'a', url: '/images/shared.jpg' })];
    const result = buildGalleryLibraryImages(images, '', '/images/shared.jpg', new Map());
    const galleryEntries = result.filter((e) => e.kind === 'gallery');
    const draftEntries = result.filter((e) => e.kind === 'draft');
    expect(galleryEntries).toHaveLength(1);
    expect(draftEntries).toHaveLength(0);
  });

  it('deduplicates by URL (persisted same as draft)', () => {
    const result = buildGalleryLibraryImages([], '/images/shared.jpg', '/images/shared.jpg', new Map());
    const persistedEntries = result.filter((e) => e.kind === 'persisted');
    const draftEntries = result.filter((e) => e.kind === 'draft');
    expect(persistedEntries).toHaveLength(1);
    expect(draftEntries).toHaveLength(0);
  });

  it('assigns stable keys via key map across calls', () => {
    const keyMap = new Map<string, string>();
    const images = [mockGalleryImage({ id: 'a', url: '/images/a.jpg' })];

    const firstResult = buildGalleryLibraryImages(images, '', '', keyMap);
    const secondResult = buildGalleryLibraryImages(images, '', '', keyMap);

    expect(firstResult[0].key).toBe(secondResult[0].key);
    expect(firstResult[0].key).toMatch(/^lib-/);
  });

  it('assigns different keys within the same map for different URLs', () => {
    const keyMap = new Map<string, string>();
    const images = [
      mockGalleryImage({ id: 'a', url: '/images/a.jpg' }),
      mockGalleryImage({ id: 'b', url: '/images/b.jpg' }),
    ];

    const result = buildGalleryLibraryImages(images, '', '', keyMap);
    const keys = result.filter((e) => e.kind === 'gallery').map((e) => e.key);

    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[0]).toBe('lib-0');
    expect(keys[1]).toBe('lib-1');
  });

  it('preserves composition order: gallery, persisted, draft, placeholder', () => {
    const images = [mockGalleryImage({ id: 'a', url: '/images/gallery.jpg' })];
    const result = buildGalleryLibraryImages(images, '/images/persisted.jpg', '/images/draft.jpg', new Map());

    expect(result).toHaveLength(4);
    expect(result[0].kind).toBe('gallery');
    expect(result[1].kind).toBe('persisted');
    expect(result[2].kind).toBe('draft');
    expect(result[3].kind).toBe('placeholder');
  });

  it('trims whitespace from URLs for deduplication', () => {
    const result = buildGalleryLibraryImages([], '  /images/trimmed.jpg  ', '', new Map());
    expect(result.find((e) => e.url === '/images/trimmed.jpg')).toBeDefined();
    expect(result.find((e) => e.url === '  /images/trimmed.jpg  ')).toBeUndefined();
  });
});
