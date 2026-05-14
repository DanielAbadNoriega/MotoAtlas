import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { SupabaseMotorcycleClient } from '../src/features/import/motorcycleImportTypes';
import { importMotorcycles } from './importMotorcycles';

const validMotorcycle = seedMotorcycles[0];
const validMotorcycles = [validMotorcycle];

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

function createSupabaseMock(ids = validMotorcycles.map((motorcycle) => motorcycle.id)) {
  const select = vi.fn().mockResolvedValue({
    data: ids.map((id) => ({ id })),
    error: null,
  });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });
  const supabase = { from } as unknown as SupabaseMotorcycleClient;

  return { from, select, supabase, upsert };
}

describe('importMotorcycles script', () => {
  it('valida motos correctas y hace upsert por id sin conectar a Supabase real', async () => {
    const { from, select, supabase, upsert } = createSupabaseMock();
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
    expect(select).toHaveBeenCalledWith('id');
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
    const { from, select, supabase, upsert } = createSupabaseMock([validMotorcycle.id]);
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
    expect(select).toHaveBeenCalledWith('id');
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
});
