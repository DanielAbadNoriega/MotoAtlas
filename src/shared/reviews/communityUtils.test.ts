import { describe, it, expect } from 'vitest'
import { getInitialsSafe, getMostCommonRidingStyleSafe, getTopCommunityItemsSafe, normalizeRidingStyleSafe } from './communityUtils'
import type { MotorcycleReview } from '../../services/motorcycleReviewService'

const emptyReview = {
  id: '1',
  motorcycleId: 'm1',
  userName: null as unknown as string,
  rating: 4,
  ridingStyle: undefined as unknown as any,
  ownershipMonths: null,
  kilometers: null,
  comment: '',
  pros: null as unknown as any,
  cons: null as unknown as any,
  verified: false,
  status: 'approved' as const,
  createdAt: '',
  updatedAt: '',
} as MotorcycleReview

describe('communityUtils null-safety', () => {
  it('initials fallback when userName null', () => {
    expect(getInitialsSafe(null)).toBe('UM') // Usuario MotoAtlas -> UM
    expect(getInitialsSafe('')).toBe('UM')
    expect(getInitialsSafe('Juan Pérez')).toBe('JP')
  })

  it('normalize riding style maps variants and defaults', () => {
    expect(normalizeRidingStyleSafe('touring')).toBe('viaje')
    expect(normalizeRidingStyleSafe('city')).toBe('ciudad')
    expect(normalizeRidingStyleSafe(undefined)).toBe('diario')
    expect(normalizeRidingStyleSafe('offroad')).toBe('offroad')
  })

  it('getMostCommonRidingStyleSafe handles missing styles and empty lists', () => {
    expect(getMostCommonRidingStyleSafe([])).toBe('Pendiente')
    const reviews: MotorcycleReview[] = [emptyReview]
    expect(getMostCommonRidingStyleSafe(reviews)).toBe('Diario')
  })

  it('getTopCommunityItemsSafe handles null arrays', () => {
    const reviews: MotorcycleReview[] = [
      { ...emptyReview, pros: null as unknown as any },
      { ...emptyReview, pros: ['Buen motor', null as unknown as any, ''] },
    ]

    const pros = getTopCommunityItemsSafe(reviews, 'pros')
    expect(Array.isArray(pros)).toBe(true)
    expect(pros.length).toBeGreaterThanOrEqual(1)
    expect(pros[0].label).toBe('Buen motor')
  })
})
