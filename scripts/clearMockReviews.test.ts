import { describe, expect, it, vi } from 'vitest'
import { clearMockReviews } from './clearMockReviews'

function createSupabaseMock(rows = [{ id: 'review-1' }]) {
  const selectEq = vi.fn().mockResolvedValue({ data: rows, error: null })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const select = vi.fn(() => ({ eq: selectEq }))
  const deleteMock = vi.fn(() => ({ eq: deleteEq }))
  const from = vi.fn(() => ({ delete: deleteMock, select }))

  return {
    client: { from },
    deleteEq,
    deleteMock,
    from,
    select,
    selectEq,
  }
}

function createLogger() {
  return { error: vi.fn(), log: vi.fn() }
}

describe('clearMockReviews', () => {
  it('hace dry-run por defecto y no borra reviews', async () => {
    const supabase = createSupabaseMock([{ id: 'review-1' }, { id: 'review-2' }])
    const logger = createLogger()

    const result = await clearMockReviews({ logger, supabase: supabase.client })

    expect(result).toEqual({ apply: false, deleted: 0, found: 2 })
    expect(supabase.from).toHaveBeenCalledWith('motorcycle_reviews')
    expect(supabase.select).toHaveBeenCalledWith('id,motorcycle_id,user_name', { count: 'exact' })
    expect(supabase.selectEq).toHaveBeenCalledWith('source', 'mock')
    expect(supabase.deleteMock).not.toHaveBeenCalled()
    expect(logger.log).toHaveBeenCalledWith('Dry run: no deletions performed. To delete, run with --apply')
  })

  it('con --apply borra solo reviews con source mock', async () => {
    const supabase = createSupabaseMock([{ id: 'review-1' }])
    const logger = createLogger()

    const result = await clearMockReviews({ apply: true, logger, supabase: supabase.client })

    expect(result).toEqual({ apply: true, deleted: 1, found: 1 })
    expect(supabase.deleteMock).toHaveBeenCalledTimes(1)
    expect(supabase.deleteEq).toHaveBeenCalledWith('source', 'mock')
    expect(logger.log).toHaveBeenCalledWith('Deleted 1 mock reviews.')
  })

  it('propaga errores de lectura sin conectar a Supabase real', async () => {
    const selectEq = vi.fn().mockResolvedValue({ data: null, error: new Error('fallo select') })
    const supabase = {
      from: vi.fn(() => ({
        delete: vi.fn(),
        select: vi.fn(() => ({ eq: selectEq })),
      })),
    }

    await expect(clearMockReviews({ logger: createLogger(), supabase })).rejects.toThrow('Error fetching mock reviews: fallo select')
  })
})
