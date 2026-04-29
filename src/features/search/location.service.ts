import { supabase } from '@/lib/supabaseClient'
import type { LocationSuggestion, LocationSuggestionsPayload } from '@/features/search/location.types'

export type LocationLookupMode = 'search' | 'profile'

function parseAncestorMapboxIds(raw: unknown): string[] {
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
  const mapboxId = typeof row.mapboxId === 'string' ? row.mapboxId.trim() : ''
  if (!mapboxId) return null
  const lat = row.latitude
  const lng = row.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  const ancestorMapboxIds = parseAncestorMapboxIds(row.ancestorMapboxIds)
  return {
    id: row.id,
    label: row.label,
    mapboxId,
    latitude: lat,
    longitude: lng,
    ancestorMapboxIds,
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
