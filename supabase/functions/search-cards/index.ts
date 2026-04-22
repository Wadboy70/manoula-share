// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ServiceWire = {
  id: number
  title: string
  deliveryMode: string
  priceCents: number | null
  currencyCode: string
  specialtyLabel: string | null
}

/** View row shape (snake_case) — keep in sync with `professional_search_cards_enriched` select list. */
interface ProfessionalSearchCardRow {
  professional_id: number | null
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  country_code: string | null
  location_label: string | null
  mapbox_id: string | null
  latitude: number | null
  longitude: number | null
  offers_remote: boolean | null
  offers_in_home: boolean | null
  offers_provider_location: boolean | null
  specialties: string[] | null
  services: unknown
}

/** Wire format returned to the SPA (camelCase) — keep in sync with `SearchCard` in the app. */
interface SearchCard {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  countryCode: string | null
  locationLabel: string | null
  mapboxId: string | null
  latitude: number | null
  longitude: number | null
  offersRemote: boolean
  offersInHome: boolean
  offersProviderLocation: boolean
  specialties: string[]
  services: ServiceWire[]
}

function parseServiceFromJson(entry: unknown): ServiceWire | null {
  if (typeof entry !== 'object' || entry === null) return null
  const o = entry as Record<string, unknown>
  const idRaw = o.id
  const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN
  if (!Number.isFinite(id)) return null
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  if (!title) return null
  const deliveryRaw = o.delivery_mode ?? o.deliveryMode
  const deliveryMode = typeof deliveryRaw === 'string' ? deliveryRaw : 'unknown'
  const priceRaw = o.price_cents ?? o.priceCents
  const priceCents =
    typeof priceRaw === 'number' && Number.isFinite(priceRaw)
      ? priceRaw
      : null
  const currencyRaw = o.currency_code ?? o.currencyCode
  const currencyCode =
    typeof currencyRaw === 'string' && currencyRaw.trim() !== '' ? currencyRaw : 'GBP'
  const specRaw = o.specialty_label ?? o.specialtyLabel
  const specialtyLabel =
    typeof specRaw === 'string' && specRaw.trim() !== '' ? specRaw.trim() : null
  return { id, title, deliveryMode, priceCents, currencyCode, specialtyLabel }
}

function parseServicesFromRow(raw: unknown): ServiceWire[] {
  if (!Array.isArray(raw)) return []
  const out: ServiceWire[] = []
  for (const item of raw) {
    const parsed = parseServiceFromJson(item)
    if (parsed) out.push(parsed)
  }
  return out
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
    mapboxId: row.mapbox_id,
    latitude: row.latitude,
    longitude: row.longitude,
    offersRemote: row.offers_remote ?? false,
    offersInHome: row.offers_in_home ?? false,
    offersProviderLocation: row.offers_provider_location ?? false,
    specialties: row.specialties ?? [],
    services: parseServicesFromRow(row.services),
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
      'professional_id,first_name,last_name,profile_photo_url,country_code,location_label,mapbox_id,latitude,longitude,offers_remote,offers_in_home,offers_provider_location,specialties,services',
    )

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const rows = (data ?? []) as ProfessionalSearchCardRow[]
  const cards = rows.map(toSearchCard).filter((card): card is SearchCard => card !== null)

  return jsonResponse({ cards })
})
