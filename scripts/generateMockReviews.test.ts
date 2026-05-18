import { describe, it, expect } from 'vitest'
import generateMockReviews from './generateMockReviews'
import { prepareSupabasePayload } from './importMockReviews'

describe('generateMockReviews', () => {
  it('genera al menos 100 reviews y con campos válidos', async () => {
    const reviews = await generateMockReviews({ count: 120, seed: 12345 })
    expect(reviews.length).toBeGreaterThanOrEqual(100)

    const ratings = reviews.map((r) => r.rating)
    for (const rt of ratings) expect(rt).toBeGreaterThanOrEqual(1)
    for (const rt of ratings) expect(rt).toBeLessThanOrEqual(5)

    const styles = new Set(reviews.map((r) => r.riding_style))
    expect(styles.size).toBeGreaterThanOrEqual(3)

    const allowed = new Set(['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario'])
    const allowedStatuses = new Set(['pending', 'approved', 'rejected'])
    for (const r of reviews) {
      expect(allowed.has(r.riding_style)).toBe(true)
      expect(allowedStatuses.has(r.status)).toBe(true)
    }

    const nonEmptyComments = reviews.filter((r) => typeof r.comment === 'string' && r.comment.trim().length > 0)
    expect(nonEmptyComments.length).toBe(reviews.length)

    // distribution: al menos 5 motos diferentes con reviews
    const distinctBikes = new Set(reviews.map((r) => r.motorcycle_id))
    expect(distinctBikes.size).toBeGreaterThanOrEqual(5)

    // verified ratio approx 15%
    const verifiedCount = reviews.filter((r) => r.verified).length
    const ratio = verifiedCount / reviews.length
    expect(ratio).toBeGreaterThan(0.05)
    expect(ratio).toBeLessThan(0.3)

    // all generated reviews must be marked as mock
    for (const r of reviews) {
      expect(r.source).toBe('mock')
    }
  })

  it('prepareSupabasePayload crea filas compatibles', async () => {
    const reviews = await generateMockReviews({ count: 20, seed: 54321 })
    const payload = prepareSupabasePayload(reviews as any)
    expect(payload.length).toBe(20)
    for (const row of payload) {
      expect(row).toHaveProperty('motorcycle_id')
      expect(row).toHaveProperty('user_name')
      expect(row).toHaveProperty('rating')
      expect(row).toHaveProperty('ownership_months')
      expect(row).toHaveProperty('kilometers')
      expect(row).toHaveProperty('comment')
      expect(row).toHaveProperty('status')
      expect(typeof row.rating).toBe('number')
      expect(row.source).toBe('mock')
      expect(['pending', 'approved', 'rejected']).toContain(row.status)
      expect(['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario']).toContain(row.riding_style)
      expect(typeof row.verified).toBe('boolean')
    }
  })
})
