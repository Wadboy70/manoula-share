import { supabase } from '@/lib/supabaseClient'
import type { LocationSuggestion, LocationSuggestionsPayload } from '@/features/search/location.types'

export type LocationLookupMode = 'search' | 'profile'

function parseAncestorPlaceIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.length > 0) out.push(item)
  }
  return out
}

function parseLocationSuggestion(entry: unknown): LocationSuggestion | null {
  if (typeof entry !== 'object' || entry === null) return null
  const row = entry as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.label !== 'string') return null
  const placeId = typeof row.placeId === 'string' ? row.placeId.trim() : ''
  if (!placeId) return null
  const lat = row.latitude
  const lng = row.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  const ancestorPlaceIds = parseAncestorPlaceIds(row.ancestorPlaceIds)
  const countryCode = typeof row.countryCode === 'string' ? row.countryCode.trim().toUpperCase() : ''
  if (!countryCode || countryCode.length !== 2) return null
  return {
    id: row.id,
    label: row.label,
    placeId,
    latitude: lat,
    longitude: lng,
    countryCode,
    ancestorPlaceIds,
  }
}

function parseLocationSuggestionsPayload(data: unknown): LocationSuggestion[] {
  if (typeof data !== 'object' || data === null || !('suggestions' in data)) {
    throw new Error('Invalid location response shape')
  }

  const { suggestions } = data as LocationSuggestionsPayload
  if (!Array.isArray(suggestions)) {
    throw new Error('Invalid location response shape')
  }

  const parsed = suggestions.map(parseLocationSuggestion)
  if (parsed.some((item) => item === null)) {
    throw new Error('Invalid location suggestion in response')
  }

  return parsed as LocationSuggestion[]
}

export async function fetchLocationSuggestions(
  query: string,
  mode: LocationLookupMode = 'search',
): Promise<LocationSuggestion[]> {
  const { data, error } = await supabase.functions.invoke<LocationSuggestionsPayload>('location', {
    body: { query, mode },
  })

  if (error) {
    throw error
  }

  return parseLocationSuggestionsPayload(data)
}
