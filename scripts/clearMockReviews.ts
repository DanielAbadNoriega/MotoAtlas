import { createClient } from '@supabase/supabase-js'

type Logger = Pick<Console, 'error' | 'log'>

type SupabaseQueryResult<T> = Promise<{ data?: T | null; error?: unknown }>

type SupabaseTableClient = {
  select: (columns: string, options?: { count?: 'exact' }) => { eq: (column: string, value: string) => SupabaseQueryResult<unknown[]> }
  delete: () => { eq: (column: string, value: string) => Promise<{ error?: unknown }> }
}

type SupabaseLikeClient = {
  from: (table: 'motorcycle_reviews') => SupabaseTableClient
}

type ClearMockReviewsOptions = {
  apply?: boolean
  env?: NodeJS.ProcessEnv
  logger?: Logger
  supabase?: SupabaseLikeClient
}

type ClearMockReviewsResult = {
  apply: boolean
  deleted: number
  found: number
}

function getSupabaseFromEnv(env: NodeJS.ProcessEnv): SupabaseLikeClient {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY are required')
  }

  return createClient(url, key) as unknown as SupabaseLikeClient
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function clearMockReviews(options: ClearMockReviewsOptions = {}): Promise<ClearMockReviewsResult> {
  const apply = options.apply ?? false
  const logger = options.logger ?? console
  const supabase = options.supabase ?? getSupabaseFromEnv(options.env ?? process.env)

  const { data: rows, error: fetchError } = await supabase
    .from('motorcycle_reviews')
    .select('id,motorcycle_id,user_name', { count: 'exact' })
    .eq('source', 'mock')

  if (fetchError) {
    throw new Error(`Error fetching mock reviews: ${getErrorMessage(fetchError)}`)
  }

  const count = Array.isArray(rows) ? rows.length : 0
  logger.log(`Found ${count} mock reviews (source='mock').`)

  if (!apply) {
    logger.log('Dry run: no deletions performed. To delete, run with --apply')
    return { apply, deleted: 0, found: count }
  }

  const { error } = await supabase.from('motorcycle_reviews').delete().eq('source', 'mock')
  if (error) {
    throw new Error(`Error deleting mock reviews: ${getErrorMessage(error)}`)
  }

  logger.log(`Deleted ${count} mock reviews.`)
  return { apply, deleted: count, found: count }
}

async function run() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')

  try {
    await clearMockReviews({ apply })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) run()

export default clearMockReviews
