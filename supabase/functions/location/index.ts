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
  placeId: string
  latitude: number
  longitude: number
  countryCode: string
  ancestorPlaceIds: string[]
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type GeoapifyAutocompleteItem = {
  place_id?: unknown
  lat?: unknown
  lon?: unknown
  formatted?: unknown
  country_code?: unknown
  city?: unknown
  result_type?: unknown
}

type GeoapifyAutocompleteResponse = {
  results?: GeoapifyAutocompleteItem[]
}

type GeoapifySearchResponse = {
  results?: { place_id?: unknown }[]
}

function parseCountryCode(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length < 2) return null
  return raw.slice(0, 2).toUpperCase()
}

async function fetchCityPlaceId(city: string, countryCode: string, apiKey: string): Promise<string | null> {
  const params = new URLSearchParams({
    apiKey,
    text: city,
    format: 'json',
    limit: '1',
    type: 'city',
    filter: `countrycode:${countryCode.toLowerCase()}`,
  })
  let res: Response
  try {
    res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`)
  } catch {
    return null
  }
  if (!res.ok) return null
  let data: GeoapifySearchResponse
  try {
    data = (await res.json()) as GeoapifySearchResponse
  } catch {
    return null
  }
  const first = data.results?.[0]
  const pid = first?.place_id
  return typeof pid === 'string' && pid.length > 0 ? pid : null
}

const cityCountryKey = (city: string, cc: string) => `${city.toLowerCase()}\t${cc}`

/** Resolve city-level Geoapify place_id once per distinct (city, country) for ancestor matching. */
async function enrichAncestorPlaceIds(
  items: GeoapifyAutocompleteItem[],
  apiKey: string,
): Promise<string[][]> {
  const ancestorLists: string[][] = items.map(() => [])
  const indicesByKey = new Map<string, number[]>()
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const mainId = typeof item.place_id === 'string' ? item.place_id.trim() : ''
    const city = typeof item.city === 'string' ? item.city.trim() : ''
    const cc = parseCountryCode(item.country_code)
    const rt = typeof item.result_type === 'string' ? item.result_type : ''
    if (!mainId || !city || !cc) continue
    if (rt === 'city' || rt === 'country' || rt === 'state') continue
    const k = cityCountryKey(city, cc)
    const arr = indicesByKey.get(k) ?? []
    arr.push(i)
    indicesByKey.set(k, arr)
  }

  const resolved = new Map<string, string | null>()
  await Promise.all(
    [...indicesByKey.entries()].map(async ([k, indices]) => {
      const first = items[indices[0]]
      const city = typeof first?.city === 'string' ? first.city.trim() : ''
      const cc = parseCountryCode(first?.country_code)
      if (!city || !cc) return
      const pid = await fetchCityPlaceId(city, cc, apiKey)
      resolved.set(k, pid)
    }),
  )

  for (const [k, indices] of indicesByKey) {
    const cityPid = resolved.get(k) ?? null
    for (const idx of indices) {
      const item = items[idx]
      const mainId = typeof item.place_id === 'string' ? item.place_id.trim() : ''
      if (cityPid && cityPid !== mainId) ancestorLists[idx] = [cityPid]
    }
  }
  return ancestorLists
}

function mapItemToSuggestion(
  item: GeoapifyAutocompleteItem,
  index: number,
  ancestorPlaceIds: string[],
): LocationSuggestion | null {
  const placeId = typeof item.place_id === 'string' ? item.place_id.trim() : ''
  if (!placeId) return null

  const label =
    typeof item.formatted === 'string' && item.formatted.trim() !== ''
      ? item.formatted.trim()
      : typeof item.city === 'string' && item.city.trim() !== ''
        ? item.city.trim()
        : null
  if (!label) return null

  const latRaw = item.lat
  const lonRaw = item.lon
  const lat = typeof latRaw === 'number' ? latRaw : typeof latRaw === 'string' ? Number(latRaw) : NaN
  const lon = typeof lonRaw === 'number' ? lonRaw : typeof lonRaw === 'string' ? Number(lonRaw) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const countryCode = parseCountryCode(item.country_code)
  if (!countryCode) return null

  const id = placeId.length > 0 ? placeId : `suggestion-${index}`

  return {
    id,
    label,
    placeId,
    latitude: lat,
    longitude: lon,
    countryCode,
    ancestorPlaceIds,
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
  if (query.length === 0 || query.length < 3) {
    return jsonResponse({ suggestions: [] })
  }

  if (query.includes(';')) {
    return jsonResponse({ error: 'Invalid query' }, 400)
  }

  if (query.length > 256) {
    return jsonResponse({ error: 'Query too long' }, 400)
  }

  const geoapifyKey = Deno.env.get('GEOAPIFY_API_KEY')
  if (!geoapifyKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const params = new URLSearchParams({
    text: query,
    limit: '5',
    format: 'json',
    apiKey: geoapifyKey,
  })
  // Prefer UK results first (ISO alpha-2 `gb`); Geoapify still returns other countries after the biased set.
  // See https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/#api — Location Bias → countrycode.
  params.set('bias', 'countrycode:gb')

  const autocompleteUrl = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`

  let geoRes: Response
  try {
    geoRes = await fetch(autocompleteUrl)
  } catch {
    return jsonResponse({ error: 'Geocoding request failed' }, 502)
  }

  if (!geoRes.ok) {
    return jsonResponse({ error: 'Geocoding request failed' }, 502)
  }

  let geo: unknown
  try {
    geo = await geoRes.json()
  } catch {
    return jsonResponse({ error: 'Invalid geocoding response' }, 502)
  }

  const parsed = geo as GeoapifyAutocompleteResponse
  const rawItems = Array.isArray(parsed.results) ? parsed.results.slice(0, 5) : []

  let ancestorLists: string[][] = rawItems.map(() => [])
  if (rawItems.length > 0) {
    try {
      ancestorLists = await enrichAncestorPlaceIds(rawItems, geoapifyKey)
    } catch {
      ancestorLists = rawItems.map(() => [])
    }
  }

  const suggestions = rawItems
    .map((item, index) => mapItemToSuggestion(item, index, ancestorLists[index] ?? []))
    .filter((s): s is LocationSuggestion => s !== null)

  return jsonResponse({ suggestions })
})
