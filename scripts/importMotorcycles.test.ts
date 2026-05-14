import { describe, expect, it, vi } from 'vitest';
import seedMotorcycles from '../data/import/motorcycles.json';
import type { SupabaseMotorcycleClient } from '../src/features/import/motorcycleImportTypes';
import { importMotorcycles } from './importMotorcycles';

function createLogger() {
  return { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
}

describe('importMotorcycles script', () => {
  it('valida el JSON inicial y hace upsert por id sin conectar a Supabase real', async () => {
    const select = vi.fn().mockResolvedValue({
      data: seedMotorcycles.map((motorcycle) => ({ id: motorcycle.id })),
      error: null,
    });
    const upsert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ upsert });
    const supabase = { from } as unknown as SupabaseMotorcycleClient;
    const logger = createLogger();

    const result = await importMotorcycles({ logger, rawMotorcycles: seedMotorcycles, supabase });

    expect(result).toMatchObject({
      importedCount: 5,
      invalidCount: 0,
      readCount: 5,
      validCount: 5,
    });
    expect(from).toHaveBeenCalledWith('motorcycles');
    expect(upsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'bmw-f-900-gs-2024' })]), {
      onConflict: 'id',
    });
    expect(select).toHaveBeenCalledWith('id');
    expect(logger.log).toHaveBeenCalledWith('📦 Motos leídas: 5');
    expect(logger.log).toHaveBeenCalledWith('✅ Importadas/actualizadas: 5');
  });

  it('en dry-run no crea cliente ni llama a Supabase', async () => {
    const logger = createLogger();

    const result = await importMotorcycles({ dryRun: true, logger, rawMotorcycles: seedMotorcycles });

    expect(result.importedCount).toBe(0);
    expect(result.validCount).toBe(5);
    expect(logger.log).toHaveBeenCalledWith('🧪 Dry run: validación correcta. No se ha conectado con Supabase.');
  });

  it('rechaza datos incompletos antes del upsert', async () => {
    const logger = createLogger();
    const invalidMotorcycle = { ...seedMotorcycles[0] } as Record<string, unknown>;
    delete invalidMotorcycle.brand;

    await expect(importMotorcycles({ logger, rawMotorcycles: [invalidMotorcycle] })).rejects.toThrow('Importación cancelada');
    expect(logger.error).toHaveBeenCalledWith('❌ Errores: 1');
    expect(logger.error).toHaveBeenCalledWith('- motorcycles[0].brand es obligatorio y debe ser texto no vacío.');
  });
});
