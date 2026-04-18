// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** View row shape (snake_case) — keep in sync with `professional_search_cards_enriched` select list. */
interface ProfessionalSearchCardRow {
  professional_id: number | null
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  service_area: string | null
  location_locality: string | null
  location_region: string | null
  country_code: string | null
  specialties: string[] | null
  rating_avg: number | null
  rating_count: number | null
}

/** Wire format returned to the SPA (camelCase) — keep in sync with `SearchCard` in the app. */
interface SearchCard {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  serviceArea: string | null
  locationLocality: string | null
  locationRegion: string | null
  countryCode: string | null
  specialties: string[]
  ratingAvg: number | null
  ratingCount: number | null
}

function toSearchCard(row: ProfessionalSearchCardRow): SearchCard | null {
  if (row.professional_id === null) return null

  return {
    professionalId: row.professional_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    serviceArea: row.service_area,
    locationLocality: row.location_locality,
    locationRegion: row.location_region,
    countryCode: row.country_code,
    specialties: row.specialties ?? [],
    ratingAvg: row.rating_avg,
    ratingCount: row.rating_count,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await supabase
    .from('professional_search_cards_enriched')
    .select(
      'professional_id,first_name,last_name,profile_photo_url,service_area,location_locality,location_region,country_code,specialties,rating_avg,rating_count',
    )

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const rows = (data ?? []) as ProfessionalSearchCardRow[]
  const cards = rows.map(toSearchCard).filter((card): card is SearchCard => card !== null)

  return jsonResponse({ cards })
})
