import { supabase } from '@/lib/supabaseClient'
import type { SearchCard } from '@/features/search/search.types'
import { toSearchCard } from '@/features/search/search.types'

export async function fetchSearchCards(): Promise<SearchCard[]> {
  const { data, error } = await supabase
    .from('professional_search_cards_enriched')
    .select(
      'professional_id,first_name,last_name,profile_photo_url,location_locality,location_region,country_code,specialties,rating_avg,rating_count',
    )

  if (error) {
    throw error
  }

  if (!data) {
    return []
  }

  return data.map(toSearchCard).filter((card): card is SearchCard => card !== null)
}
