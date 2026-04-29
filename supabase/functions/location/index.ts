// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type LocationSuggestion = {
  id: string
  label: string
  mapboxId: string
  latitude: number
  longitude: number
  ancestorMapboxIds: string[]
}

type LocationLookupMode = 'search' | 'profile'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Collect parent feature ids from Geocoding v6 `properties.context` (user narrower than stored coverage). */
function extractAncestorMapboxIds(context: unknown): string[] {
  if (typeof context !== 'object' || context === null) return []
  const seen = new Set<string>()
  for (const value of Object.values(context as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const mid = (value as { mapbox_id?: unknown }).mapbox_id
    if (typeof mid === 'string' && mid.length > 0) seen.add(mid)
  }
  return [...seen]
}

function mapFeatureToSuggestion(feature: unknown, index: number): LocationSuggestion | null {
  if (typeof feature !== 'object' || feature === null) return null
  const f = feature as {
    id?: unknown
    geometry?: { type?: unknown; coordinates?: unknown }
    properties?: Record<string, unknown>
  }
  const props = f.properties ?? {}

  const label =
    typeof props.full_address === 'string'
      ? props.full_address
      : typeof props.name_preferred === 'string'
        ? props.name_preferred
        : typeof props.name === 'string'
          ? props.name
          : null

  if (!label) return null

  const mapboxId =
    f.id !== undefined && f.id !== null
      ? String(f.id)
      : typeof props.mapbox_id === 'string'
        ? props.mapbox_id
        : null

  if (!mapboxId) return null

  const id = mapboxId.length > 0 ? mapboxId : `suggestion-${index}`

  const coords = f.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lon = coords[0]
  const lat = coords[1]
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const ancestorMapboxIds = extractAncestorMapboxIds(props.context)

  return {
    id,
    label,
    mapboxId,
    latitude: lat,
    longitude: lon,
    ancestorMapboxIds,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
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

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const rawQuery = typeof (body as { query?: unknown }).query === 'string' ? (body as { query: string }).query : ''
  const query = rawQuery.trim()
  const rawMode = (body as { mode?: unknown }).mode
  const mode: LocationLookupMode = rawMode === 'profile' ? 'profile' : 'search'

  if (query.length === 0 || query.length < 3) {
    return jsonResponse({ suggestions: [] })
  }

  if (query.includes(';')) {
    return jsonResponse({ error: 'Invalid query' }, 400)
  }

  if (query.length > 256) {
    return jsonResponse({ error: 'Query too long' }, 400)
  }

  const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN')
  if (!mapboxToken) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const params = new URLSearchParams({
    q: query,
    limit: '5',
    access_token: mapboxToken,
  })
  if (mode === 'profile') {
    params.set('permanent', 'true')
  }

  const mapboxUrl = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`

  let mapboxRes: Response
  try {
    mapboxRes = await fetch(mapboxUrl)
  } catch {
    return jsonResponse({ error: 'Geocoding request failed' }, 502)
  }

  if (!mapboxRes.ok) {
    return jsonResponse({ error: 'Geocoding request failed' }, 502)
  }

  let geo: unknown
  try {
    geo = await mapboxRes.json()
  } catch {
    return jsonResponse({ error: 'Invalid geocoding response' }, 502)
  }

  const features =
    typeof geo === 'object' && geo !== null && 'features' in geo && Array.isArray((geo as { features: unknown }).features)
      ? (geo as { features: unknown[] }).features
      : []

  const suggestions = features
    .slice(0, 5)
    .map((feature, index) => mapFeatureToSuggestion(feature, index))
    .filter((s): s is LocationSuggestion => s !== null)

  return jsonResponse({ suggestions })
})
