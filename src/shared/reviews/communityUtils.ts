import type { MotorcycleReview } from '../../services/motorcycleReviewService'

const ridingStyleLabels: Record<string, string> = {
  ciudad: 'Ciudad',
  deportivo: 'Deportivo',
  diario: 'Diario',
  offroad: 'Off-road',
  pasajero: 'Pasajero',
  viaje: 'Viaje',
}

const ALLOWED = new Set(Object.keys(ridingStyleLabels))

export function normalizeRidingStyleSafe(value: unknown): string {
  const s = String(value ?? '').toLowerCase()
  if (ALLOWED.has(s)) return s
  // map common variants
  switch (s) {
    case 'touring':
      return 'viaje'
    case 'commuting':
    case 'daily':
      return 'diario'
    case 'sport':
      return 'deportivo'
    case 'city':
      return 'ciudad'
    case 'passenger':
      return 'pasajero'
    default:
      return 'diario'
  }
}

export function getInitialsSafe(name?: string | null) {
  const cleanName = (name ?? '').toString().trim() || 'Usuario MotoAtlas'
  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getMostCommonRidingStyleSafe(reviews: readonly MotorcycleReview[]) {
  const counts: Record<string, number> = { ciudad: 0, deportivo: 0, diario: 0, offroad: 0, pasajero: 0, viaje: 0 }
  for (const review of reviews ?? []) {
    const style = normalizeRidingStyleSafe((review as any)?.ridingStyle)
    counts[style] = (counts[style] ?? 0) + 1
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const [style, count] = entries[0]
  return count > 0 ? ridingStyleLabels[style] ?? 'Pendiente' : 'Pendiente'
}

export function getTopCommunityItemsSafe(reviews: readonly MotorcycleReview[], field: 'pros' | 'cons') {
  const counts = new Map<string, number>()

  for (const review of reviews ?? []) {
    const items = (review as any)?.[field] ?? []
    if (!Array.isArray(items)) continue

    for (const rawItem of items) {
      const item = String(rawItem ?? '').trim()
      if (!item) continue
      counts.set(item, (counts.get(item) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }))
}
