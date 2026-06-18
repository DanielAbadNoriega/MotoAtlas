import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AdminMotorcycleGalleryImage } from '../../../services/adminMotorcycleGalleryService';
import {
  getMotorcycleImageObjectPath,
  galleryImageMatchesImage,
  isGalleryImageCurrentCover,
  isImageBackedByGalleryRecord,
  getActiveGalleryImages,
  getGalleryImageCleanupObjectPath,
  isCleanupPathSharedWithActiveImage,
} from './adminGalleryImageUtils';

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
