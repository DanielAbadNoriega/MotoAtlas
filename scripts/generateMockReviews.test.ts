import { describe, it, expect } from 'vitest'
import generateMockReviews from './generateMockReviews'
import { prepareSupabasePayload } from './importMockReviews'

const SAMPLE_MOTORCYCLES = [
  {
    id: 'bmw-f-900-gs-2024',
    brand: 'BMW',
    model: 'F 900 GS',
    segment: 'trail',
    pros: ['Motor elástico y con mucho par', 'Buen equilibrio carretera/pista', 'Ergonomía trail seria'],
    cons: ['Precio final sube con paquetes', 'Depósito más pequeño que rivales viajeras', 'Altura intimidante para novatos'],
  },
  {
    id: 'yamaha-mt-09-2024',
    brand: 'Yamaha',
    model: 'MT-09',
    segment: 'naked',
    pros: ['Motor con muchísimo carácter', 'Muy divertida en carretera', 'Electrónica bastante completa'],
    cons: ['Protección aerodinámica mínima', 'Suspensión seca si el piso está roto', 'Asiento mejorable'],
  },
  {
    id: 'honda-forza-750-2024',
    brand: 'Honda',
    model: 'Forza 750',
    segment: 'scooter',
    pros: ['Muy práctica a diario', 'Buen hueco y protección', 'Consumo contenido'],
    cons: ['Precio elevado', 'Algo voluminosa en parado', 'Suspensión trasera seca'],
  },
  {
    id: 'kawasaki-zx-6r-2024',
    brand: 'Kawasaki',
    model: 'ZX-6R',
    segment: 'supersport',
    pros: ['Frenada potente', 'Precisión en curva', 'Motor muy excitante arriba'],
    cons: ['Postura exigente', 'Uso diario sacrificado', 'Calor notable'],
  },
  {
    id: 'bmw-k-1600-gt-2024',
    brand: 'BMW',
    model: 'K 1600 GT',
    segment: 'touring',
    pros: ['Motor finísimo', 'Mucho confort a alta velocidad', 'Buen confort para dos'],
    cons: ['Peso muy alto en parado', 'Precio alto con extras', 'Aparatosa en ciudad'],
  },
] as const

describe('generateMockReviews', () => {
  it('genera la cantidad pedida con campos válidos y source mock', async () => {
    const reviews = await generateMockReviews({ count: 120, seed: 12345, motorcycles: [...SAMPLE_MOTORCYCLES] })
    expect(reviews).toHaveLength(120)

    const allowed = new Set(['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario'])
    const allowedStatuses = new Set(['pending', 'approved', 'rejected'])

    for (const r of reviews) {
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(5)
      expect(allowed.has(r.riding_style)).toBe(true)
      expect(allowedStatuses.has(r.status)).toBe(true)
      expect(r.source).toBe('mock')
      expect(typeof r.comment).toBe('string')
      expect(r.comment.trim().length).toBeGreaterThan(0)
      expect(r.comment).not.toMatch(/\b(null|undefined)\b/i)
      expect(Array.isArray(r.pros)).toBe(true)
      expect(Array.isArray(r.cons)).toBe(true)
      expect(r.pros.length).toBeGreaterThan(0)
      expect(r.cons.length).toBeGreaterThan(0)
      expect(r.pros.join(' ')).not.toMatch(/\b(null|undefined)\b/i)
      expect(r.cons.join(' ')).not.toMatch(/\b(null|undefined)\b/i)
    }

    const styles = new Set(reviews.map((r) => r.riding_style))
    expect(styles.size).toBeGreaterThanOrEqual(4)

    const distinctBikes = new Set(reviews.map((r) => r.motorcycle_id))
    expect(distinctBikes.size).toBeGreaterThanOrEqual(5)

    const verifiedCount = reviews.filter((r) => r.verified).length
    const ratio = verifiedCount / reviews.length
    expect(ratio).toBeGreaterThan(0.05)
    expect(ratio).toBeLessThan(0.3)
  })

  it('genera comentarios y listas con variedad útil para QA visual', async () => {
    const reviews = await generateMockReviews({ count: 180, seed: 20240612, motorcycles: [...SAMPLE_MOTORCYCLES] })

    const lengths = reviews.map((r) => r.comment.length)
    const shortCount = lengths.filter((len) => len < 170).length
    const mediumCount = lengths.filter((len) => len >= 170 && len <= 320).length
    const longCount = lengths.filter((len) => len > 320).length

    expect(shortCount).toBeGreaterThan(0)
    expect(mediumCount).toBeGreaterThan(0)
    expect(longCount).toBeGreaterThan(0)

    const uniqueComments = new Set(reviews.map((r) => r.comment))
    expect(uniqueComments.size).toBeGreaterThan(50)

    const prosLengths = new Set(reviews.map((r) => r.pros.length))
    const consLengths = new Set(reviews.map((r) => r.cons.length))
    expect(prosLengths.size).toBeGreaterThan(1)
    expect(consLengths.size).toBeGreaterThan(1)

    expect(reviews.some((r) => r.rating <= 2)).toBe(true)
    expect(reviews.some((r) => r.rating === 3)).toBe(true)
    expect(reviews.some((r) => r.rating >= 4)).toBe(true)
  })

  it('mantiene salida determinista cuando se usa la misma seed', async () => {
    const a = await generateMockReviews({ count: 40, seed: 777, motorcycles: [...SAMPLE_MOTORCYCLES] })
    const b = await generateMockReviews({ count: 40, seed: 777, motorcycles: [...SAMPLE_MOTORCYCLES] })
    expect(a).toEqual(b)
  })

  it('prepareSupabasePayload crea filas compatibles', async () => {
    const reviews = await generateMockReviews({ count: 20, seed: 54321, motorcycles: [...SAMPLE_MOTORCYCLES] })
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
