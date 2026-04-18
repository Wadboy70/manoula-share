// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type LocationSuggestion = { id: string; label: string }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function mapFeatureToSuggestion(feature: unknown, index: number): LocationSuggestion | null {
  if (typeof feature !== 'object' || feature === null) return null
  const f = feature as { id?: unknown; properties?: Record<string, unknown> }
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

  const id =
    f.id !== undefined && f.id !== null
      ? String(f.id)
      : typeof props.mapbox_id === 'string'
        ? props.mapbox_id
        : `suggestion-${index}`

  return { id, label }
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
