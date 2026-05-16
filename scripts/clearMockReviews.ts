import { createClient } from '@supabase/supabase-js'

async function run() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY are required')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  // Count mock reviews
  const { data: rows, error: fetchError } = await supabase.from('motorcycle_reviews').select('id,motorcycle_id,user_name', { count: 'exact' }).eq('source', 'mock')
  if (fetchError) {
    console.error('Error fetching mock reviews', fetchError)
    process.exit(1)
  }

  const count = Array.isArray(rows) ? rows.length : 0
  console.log(`Found ${count} mock reviews (source='mock').`)

  if (!apply) {
    console.log('Dry run: no deletions performed. To delete, run with --apply')
    return
  }

  // Perform deletion
  const { error } = await supabase.from('motorcycle_reviews').delete().eq('source', 'mock')
  if (error) {
    console.error('Error deleting mock reviews', error)
    process.exit(1)
  }

  console.log(`Deleted ${count} mock reviews.`)
}

if (import.meta.url === `file://${process.argv[1]}`) run()

export default run
