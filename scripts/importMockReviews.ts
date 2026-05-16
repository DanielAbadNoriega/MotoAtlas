import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

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
}

export function prepareSupabasePayload(reviews: Review[]) {
  function normalizeRidingStyle(style: string) {
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

  return reviews.map((r) => ({
    motorcycle_id: r.motorcycle_id,
    user_name: r.user_name,
    rating: r.rating,
    ownership_months: r.ownership_months,
    kilometers: r.kilometers,
    comment: r.comment,
    pros: r.pros,
    cons: r.cons,
    riding_style: normalizeRidingStyle(r.riding_style),
    status: r.status,
    verified: r.verified,
    created_at: new Date().toISOString()
  }))
}

async function loadMocks(): Promise<Review[]> {
  const p = path.join(process.cwd(), 'data', 'mock', 'mockReviews.json')
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw)
}

async function run() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry-run') || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY

  const reviews = await loadMocks()
  const payload = prepareSupabasePayload(reviews)

  console.log(`Prepared ${payload.length} rows for import. Dry run: ${dry}`)

  if (dry) return

  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_KEY!
  const supabase = createClient(url, key)

  const chunkSize = 100
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize)
    const { error } = await supabase.from('motorcycle_reviews').insert(chunk)
    if (error) {
      console.error('Insert error', error)
      process.exit(1)
    }
    console.log(`Inserted ${chunk.length} rows`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) run()

export default prepareSupabasePayload
