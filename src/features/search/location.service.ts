import { supabase } from '@/lib/supabaseClient'
import type { LocationSuggestion, LocationSuggestionsPayload } from '@/features/search/location.types'

function parseLocationSuggestion(entry: unknown): LocationSuggestion | null {
  if (typeof entry !== 'object' || entry === null) return null
  const row = entry as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.label !== 'string') return null
  return { id: row.id, label: row.label }
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

export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  const { data, error } = await supabase.functions.invoke<LocationSuggestionsPayload>('location', {
    body: { query },
  })

  if (error) {
    throw error
  }

  return parseLocationSuggestionsPayload(data)
}
