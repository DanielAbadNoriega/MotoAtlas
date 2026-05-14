import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { SupabaseMotorcycleClient } from '../src/features/import/motorcycleImportTypes';
import { importMotorcycles } from './importMotorcycles';

const validMotorcycle = seedMotorcycles[0];
const validMotorcycles = [validMotorcycle];

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

function createSupabaseMock({
  existingMotorcycles = [],
  ids = validMotorcycles.map((motorcycle) => motorcycle.id),
}: {
  existingMotorcycles?: readonly {
    description: string;
    description_locked: boolean;
    id: string;
    image_locked: boolean;
    image_url: string;
  }[];
  ids?: readonly string[];
} = {}) {
  const upsertSelect = vi.fn().mockResolvedValue({
    data: ids.map((id) => ({ id })),
    error: null,
  });
  const upsert = vi.fn().mockReturnValue({ select: upsertSelect });
  const inFilter = vi.fn().mockResolvedValue({
    data: existingMotorcycles,
    error: null,
  });
  const select = vi.fn().mockReturnValue({ in: inFilter });
  const from = vi.fn().mockReturnValue({ select, upsert });
  const supabase = { from } as unknown as SupabaseMotorcycleClient;

  return { from, inFilter, select, supabase, upsert, upsertSelect };
}

describe('importMotorcycles script', () => {
  it('valida motos correctas y hace upsert por id sin conectar a Supabase real', async () => {
    const { from, inFilter, select, supabase, upsert, upsertSelect } = createSupabaseMock();
    const logger = createLogger();

    const result = await importMotorcycles({ logger, rawMotorcycles: validMotorcycles, supabase });

    expect(result).toMatchObject({
      allowPartial: false,
      importedCount: 1,
      invalidCount: 0,
      readCount: 1,
      skippedCount: 0,
      validCount: 1,
    });
    expect(from).toHaveBeenCalledWith('motorcycles');
    expect(upsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: validMotorcycle.id })]), {
      onConflict: 'id',
    });
    expect(select).toHaveBeenCalledWith('id,image_url,image_source,description,image_locked,description_locked');
    expect(inFilter).toHaveBeenCalledWith('id', [validMotorcycle.id]);
    expect(upsertSelect).toHaveBeenCalledWith('id');
    expect(logger.log).toHaveBeenCalledWith('📦 Motos leídas: 1');
    expect(logger.log).toHaveBeenCalledWith('✅ Importadas/actualizadas: 1');
  });

  it('en dry-run con datos válidos no crea cliente ni llama a Supabase', async () => {
    const logger = createLogger();

    const result = await importMotorcycles({ dryRun: true, logger, rawMotorcycles: validMotorcycles });

    expect(result.importedCount).toBe(0);
    expect(result.validCount).toBe(1);
    expect(logger.log).toHaveBeenCalledWith('🧪 Dry run: validación ejecutada. No se ha conectado con Supabase.');
  });

  it('en dry-run con inválidas no conecta a Supabase', async () => {
    const { from, upsert, supabase } = createSupabaseMock();
    const logger = createLogger();
    const invalidMotorcycle = { ...validMotorcycle, displacementCc: 0 };

    await expect(importMotorcycles({ dryRun: true, logger, rawMotorcycles: [invalidMotorcycle], supabase })).rejects.toThrow(
      'Importación cancelada',
    );
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('sin allow-partial no hace upsert si hay inválidas', async () => {
    const { from, upsert, supabase } = createSupabaseMock();
    const logger = createLogger();
    const invalidMotorcycle = { ...validMotorcycle, displacementCc: null };

    await expect(importMotorcycles({ logger, rawMotorcycles: [validMotorcycle, invalidMotorcycle], supabase })).rejects.toThrow(
      'Importación cancelada',
    );
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('❌ Motos inválidas: 1');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('campo: displacement_cc | valor recibido: null | motivo: displacement_cc es obligatorio y debe ser numérico.'),
    );
  });

  it('con allow-partial importa solo las válidas', async () => {
    const { from, upsertSelect, supabase, upsert } = createSupabaseMock({ ids: [validMotorcycle.id] });
    const logger = createLogger();
    const invalidMotorcycle = { ...validMotorcycle, id: 'invalid-displacement', displacementCc: 0 };

    const result = await importMotorcycles({
      allowPartial: true,
      logger,
      rawMotorcycles: [validMotorcycle, invalidMotorcycle],
      supabase,
    });

    expect(result).toMatchObject({
      allowPartial: true,
      importedCount: 1,
      invalidCount: 1,
      skippedCount: 1,
      validCount: 1,
    });
    expect(from).toHaveBeenCalledWith('motorcycles');
    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({ id: validMotorcycle.id })], { onConflict: 'id' });
    expect(upsertSelect).toHaveBeenCalledWith('id');
    expect(logger.warn).toHaveBeenCalledWith('⏭️ --allow-partial activo: se saltan 1 moto(s) inválida(s).');
  });

  it('rechaza datos incompletos antes del upsert y muestra detalle útil', async () => {
    const logger = createLogger();
    const invalidMotorcycle = { ...validMotorcycle } as Record<string, unknown>;
    delete invalidMotorcycle.brand;

    await expect(importMotorcycles({ logger, rawMotorcycles: [invalidMotorcycle] })).rejects.toThrow('Importación cancelada');
    expect(logger.error).toHaveBeenCalledWith('❌ Motos inválidas: 1');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('campo: brand | valor recibido: undefined | motivo: brand es obligatorio y debe ser texto no vacío.'),
    );
  });

  it('mantiene la imagen existente cuando image_locked está activo', async () => {
    const lockedImageUrl = 'https://manual.example.com/editorial.jpg';
    const { supabase, upsert } = createSupabaseMock({
      existingMotorcycles: [
        {
          description: validMotorcycle.description,
          description_locked: false,
          id: validMotorcycle.id,
          image_locked: true,
          image_url: lockedImageUrl,
        },
      ],
    });
    const logger = createLogger();

    await importMotorcycles({
      logger,
      rawMotorcycles: [{ ...validMotorcycle, imageUrl: 'https://api.example.com/new.jpg' }],
      supabase,
    });

    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({ image_locked: true, image_url: lockedImageUrl })], {
      onConflict: 'id',
    });
    expect(logger.log).toHaveBeenCalledWith(`🔒 image_url protegido: ${validMotorcycle.id}`);
  });

  it('mantiene la descripción existente cuando description_locked está activo', async () => {
    const lockedDescription = 'Descripción editorial escrita a mano.';
    const { supabase, upsert } = createSupabaseMock({
      existingMotorcycles: [
        {
          description: lockedDescription,
          description_locked: true,
          id: validMotorcycle.id,
          image_locked: false,
          image_url: validMotorcycle.imageUrl,
        },
      ],
    });
    const logger = createLogger();

    await importMotorcycles({
      logger,
      rawMotorcycles: [{ ...validMotorcycle, description: 'Descripción externa nueva.' }],
      supabase,
    });

    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({ description: lockedDescription, description_locked: true })], {
      onConflict: 'id',
    });
    expect(logger.log).toHaveBeenCalledWith(`🔒 description protegida: ${validMotorcycle.id}`);
  });

  it('actualiza imagen y descripción cuando no están protegidas', async () => {
    const { supabase, upsert } = createSupabaseMock({
      existingMotorcycles: [
        {
          description: 'Descripción anterior.',
          description_locked: false,
          id: validMotorcycle.id,
          image_locked: false,
          image_url: 'https://manual.example.com/old.jpg',
        },
      ],
    });
    const logger = createLogger();

    await importMotorcycles({
      logger,
      rawMotorcycles: [
        {
          ...validMotorcycle,
          description: 'Descripción API actualizada.',
          imageUrl: 'https://api.example.com/new.jpg',
        },
      ],
      supabase,
    });

    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          description: 'Descripción API actualizada.',
          description_locked: false,
          image_locked: false,
          image_url: 'https://api.example.com/new.jpg',
        }),
      ],
      { onConflict: 'id' },
    );
  });
});
