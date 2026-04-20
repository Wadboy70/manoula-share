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
  country_code: string | null
  location_label: string | null
  location_input_text: string | null
  mapbox_id: string | null
  latitude: number | null
  longitude: number | null
  service_radius_km: number | null
  specialties: string[] | null
}

/** Wire format returned to the SPA (camelCase) — keep in sync with `SearchCard` in the app. */
interface SearchCard {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  countryCode: string | null
  locationLabel: string | null
  locationInputText: string | null
  mapboxId: string | null
  latitude: number | null
  longitude: number | null
  serviceRadiusKm: number | null
  specialties: string[]
}

function toSearchCard(row: ProfessionalSearchCardRow): SearchCard | null {
  if (row.professional_id === null) return null

  return {
    professionalId: row.professional_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    countryCode: row.country_code,
    locationLabel: row.location_label,
    locationInputText: row.location_input_text,
    mapboxId: row.mapbox_id,
    latitude: row.latitude,
    longitude: row.longitude,
    serviceRadiusKm: row.service_radius_km,
    specialties: row.specialties ?? [],
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
      'professional_id,first_name,last_name,profile_photo_url,country_code,location_label,location_input_text,mapbox_id,latitude,longitude,service_radius_km,specialties',
    )

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const rows = (data ?? []) as ProfessionalSearchCardRow[]
  const cards = rows.map(toSearchCard).filter((card): card is SearchCard => card !== null)

  return jsonResponse({ cards })
})
