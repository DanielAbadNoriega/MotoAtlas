import { describe, expect, it, vi } from 'vitest';
import { bikeFixtures } from '../src/test/fixtures/bikes';
import { MOTORCYCLE_IMAGE_FALLBACK_URL } from '../src/shared/images/getMotorcycleImage';
import { getMotorcycleLocalImageFileName, getMotorcycleLocalImageUrl, syncMotorcycleImages } from './syncMotorcycleImages';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

function createSupabaseMock() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  const inFilter = vi.fn().mockResolvedValue({ data: [], error: null });
  const select = vi.fn().mockReturnValue({ in: inFilter });
  const from = vi.fn().mockReturnValue({ select, update });

  return { eq, from, inFilter, select, supabase: { from }, update };
}

describe('syncMotorcycleImages', () => {
  it('genera naming local obligatorio en webp', () => {
    expect(getMotorcycleLocalImageFileName(bikeFixtures[0])).toBe('bmw-f-900-gs-2024.webp');
    expect(getMotorcycleLocalImageUrl(bikeFixtures[0])).toBe('/images/motorcycles/bmw-f-900-gs-2024.webp');
  });

  it('detecta imagen local y fallback sin conectar en dry-run', async () => {
    const logger = createLogger();
    const result = await syncMotorcycleImages({
      dryRun: true,
      existingRows: [],
      logger,
      motorcycles: bikeFixtures.slice(0, 2),
      readLocalImage: vi.fn().mockImplementation((filePath: string) => Promise.resolve(filePath.includes('bmw-f-900-gs'))),
    });

    expect(result).toMatchObject({ detectedLocalCount: 1, fallbackCount: 1, updatedCount: 0 });
    expect(result.updates).toEqual([
      expect.objectContaining({ image_source: 'manual', image_url: '/images/motorcycles/bmw-f-900-gs-2024.webp' }),
      expect.objectContaining({ image_source: 'placeholder', image_url: MOTORCYCLE_IMAGE_FALLBACK_URL }),
    ]);
    expect(logger.log).toHaveBeenCalledWith('🧪 Dry run: no se ha actualizado Supabase.');
  });

  it('no sobrescribe image_locked=true', async () => {
    const logger = createLogger();
    const result = await syncMotorcycleImages({
      dryRun: true,
      existingRows: [{ id: bikeFixtures[0].id, image_locked: true, image_url: 'https://manual.example.com/bmw.jpg' }],
      logger,
      motorcycles: bikeFixtures.slice(0, 1),
      readLocalImage: vi.fn().mockResolvedValue(true),
    });

    expect(result.lockedCount).toBe(1);
    expect(result.updates).toHaveLength(0);
    expect(logger.log).toHaveBeenCalledWith(`🔒 image_url protegido: ${bikeFixtures[0].id}`);
  });

  it('actualiza Supabase con payload manual o placeholder cuando no es dry-run', async () => {
    const { eq, supabase, update } = createSupabaseMock();

    const result = await syncMotorcycleImages({
      existingRows: [],
      motorcycles: bikeFixtures.slice(0, 1),
      readLocalImage: vi.fn().mockResolvedValue(true),
      supabase,
    });

    expect(result.updatedCount).toBe(1);
    expect(update).toHaveBeenCalledWith({ image_source: 'manual', image_url: '/images/motorcycles/bmw-f-900-gs-2024.webp' });
    expect(eq).toHaveBeenCalledWith('id', bikeFixtures[0].id);
  });
});
