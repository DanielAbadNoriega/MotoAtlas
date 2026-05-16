import fs from 'fs/promises'
import path from 'path'

type Motorcycle = { id: string; model?: string; pros?: string[]; cons?: string[] }
type Review = {
  motorcycle_id: string
  user_name: string
  rating: number
  ownership_months: number
  kilometers: number
  comment: string
  pros: string[]
  cons: string[]
  riding_style: string
  status: string
  verified: boolean
  source?: string
}

const RIDING_STYLES = ['touring', 'offroad', 'daily', 'passenger', 'city', 'sport']

const ALLOWED_RIDING_STYLES = ['ciudad', 'viaje', 'offroad', 'deportivo', 'pasajero', 'diario']

function normalizeRidingStyle(style: string): string {
  const s = String(style).toLowerCase()
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
    case 'offroad':
      return 'offroad'
    default:
      return 'ciudad'
  }
}
const ALIASES = [
  'TrailHunter',
  'BoxerRider',
  'CurvasYPuños',
  'RutaLibre',
  'KilometroCero',
  'AceleradorFeliz',
  'PataCorta',
  'DobleEmbrague',
  'MotoMecanica',
  'VientoYRuta'
]

function seededRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)]
}

function weightedChoice(rng: () => number, items: Array<[any, number]>) {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [it, w] of items) {
    if (r < w) return it
    r -= w
  }
  return items[items.length - 1][0]
}

function makeComment(rng: () => number, style: string, months: number, kms: number) {
  const short = [
    'Buena moto, cumplió mis expectativas.',
    'Perfecta para el día a día.',
    'Precio acorde a lo que ofrece.',
    'Aunque pesada, muy estable a velocidad.',
    'Ideal para rutas largas y autopista.'
  ]
  const touring = [
    'La usé en varios viajes de fin de semana, muy cómoda con carga.',
    'Autonomía correcta y par en bajos para subir puertos.',
    'Maletero y parabrisas mejorables, pero el motor empuja mucho.'
  ]
  const offroad = [
    'Se defiende en pistas técnicas, suspensión OK con ajustes.',
    'Neumáticos de serie limitan, cambié por algo más agresivo.',
    'Ligera y maniobrable en zonas rotas.'
  ]
  const city = [
    'Ágil en ciudad, fácil de aparcar y manejable en tráfico.',
    'Consumo bajo en ciudad, perfecto para mixto.',
    'Protección aerodinámica pobre en autopista.'
  ]
  const sport = [
    'Muy divertida, con buen apoyo en curvas.',
    'Suspensión y frenos responden bien en conducción agresiva.',
    'No es cómoda para dos personas en viajes largos.'
  ]
  const passenger = [
    'Mi pareja va cómoda, asientos firmes pero aceptables.',
    'Pocas plazas para equipaje, pero pasajero contento.'
  ]

  const templates: string[] = []
  templates.push(...short)
  if (style === 'touring') templates.push(...touring)
  if (style === 'offroad') templates.push(...offroad)
  if (style === 'city' || style === 'daily') templates.push(...city)
  if (style === 'sport') templates.push(...sport)
  if (style === 'passenger') templates.push(...passenger)

  // Compose variable length comment
  const parts: string[] = []
  const n = Math.max(1, Math.round(rng() * 3))
  for (let i = 0; i < n; i++) parts.push(pick(rng, templates))

  // Add small detail numbers
  if (rng() < 0.6) parts.push(`Llevo ${months} meses y ${Math.round(kms)} km.`)
  if (rng() < 0.2) parts.push('Recomendable si buscas versatilidad.')
  if (rng() < 0.1) parts.push('No la vendería, me ha salido fiable.')

  // Mix length
  return parts.join(' ')
}

export async function generateMockReviews(opts?: {
  count?: number
  seed?: number
  motorcycles?: Motorcycle[]
}): Promise<Review[]> {
  const count = opts?.count ?? 120
  const seed = opts?.seed ?? Date.now()
  const rng = seededRandom(seed)
  const motorcycles = opts?.motorcycles ?? (await loadMotorcycles())
  if (!motorcycles.length) return []

  // Prepare distribution: some bikes get many reviews, many get few
  const bikeIds = motorcycles.map((m) => m.id)

  // choose hotspots
  const hotspotCount = Math.max(3, Math.floor(bikeIds.length * 0.08))
  const hotspots: Set<string> = new Set()
  while (hotspots.size < hotspotCount) hotspots.add(pick(rng, bikeIds))

  const reviews: Review[] = []

  for (let i = 0; i < count; i++) {
    const isHot = rng() < 0.45
    const motorcycle_id = isHot ? pick(rng, Array.from(hotspots)) : pick(rng, bikeIds)
    const riding_style_raw = pick(rng, RIDING_STYLES)
    const riding_style = normalizeRidingStyle(riding_style_raw)

    // months and kms coherent with style
    const ownership_months = Math.max(1, Math.round(1 + rng() * 120))
    const avgMonthly: Record<string, number> = {
      touring: 2000,
      offroad: 500,
      daily: 900,
      passenger: 800,
      city: 600,
      sport: 700
    }
    const avg = avgMonthly[riding_style] ?? 700
    const kilometers = Math.round(ownership_months * (avg * (0.6 + rng() * 1.4)))

    const rating = weightedChoice(rng, [
      [5, 50],
      [4, 30],
      [3, 12],
      [2, 6],
      [1, 2]
    ])

    const verified = rng() < 0.15

    const status = weightedChoice(rng, [
      ['approved', 80],
      ['pending', 15],
      ['rejected', 5]
    ])

    const user_name = pick(rng, ALIASES) + (rng() < 0.25 ? Math.floor(rng() * 900) : '')

    // pick motorcycle pros/cons if available
    const moto = motorcycles.find((m) => m.id === motorcycle_id)
    const prosBase = moto?.pros ?? ['Buen motor', 'Versátil', 'Confortable']
    const consBase = moto?.cons ?? ['Precio', 'Protección']
    const pros = [pick(rng, prosBase)]
    const cons = [pick(rng, consBase)]

    const comment = makeComment(rng, riding_style, ownership_months, kilometers)

    reviews.push({
      motorcycle_id,
      user_name,
      rating,
      ownership_months,
      kilometers,
      comment,
      pros,
      cons,
      riding_style,
      status,
      verified
      , source: 'mock'
    })
  }

  return reviews
}

async function loadMotorcycles(): Promise<Motorcycle[]> {
  const p = path.join(process.cwd(), 'data', 'import', 'motorcycles.json')
  try {
    const raw = await fs.readFile(p, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed.map((m: any) => ({ id: m.id, model: m.model, pros: m.pros, cons: m.cons }))
  } catch (e) {
    return []
  }
}

function signature(r: Review) {
  return `${r.motorcycle_id}|||${r.user_name}|||${r.comment.slice(0,120)}`
}

async function writeMockFile(reviews: Review[], reset = false) {
  const dir = path.join(process.cwd(), 'data', 'mock')
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, 'mockReviews.json')
  if (reset) {
    await fs.writeFile(file, JSON.stringify(reviews, null, 2), 'utf8')
    return { written: reviews.length, merged: 0 }
  }

  let existing: Review[] = []
  try {
    const raw = await fs.readFile(file, 'utf8')
    existing = JSON.parse(raw)
  } catch (e) {
    existing = []
  }

  const seen = new Set(existing.map(signature))
  const toAdd = reviews.filter((r) => !seen.has(signature(r)))
  const merged = existing.concat(toAdd)
  await fs.writeFile(file, JSON.stringify(merged, null, 2), 'utf8')
  return { written: toAdd.length, merged: merged.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI
  ;(async () => {
    const args = process.argv.slice(2)
    const reset = args.includes('--reset')
    const cArg = args.find((a) => a.startsWith('--count='))
    const count = cArg ? parseInt(cArg.split('=')[1], 10) : undefined
    const seedArg = args.find((a) => a.startsWith('--seed='))
    const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : undefined

    const motorcycles = await loadMotorcycles()
    const reviews = await generateMockReviews({ count: count ?? 120, seed, motorcycles })
    const res = await writeMockFile(reviews, reset)
    console.log(`Generated ${reviews.length} mock reviews. Written: ${res.written}. Total in file: ${res.merged}`)
  })()
}

export default generateMockReviews
