import { supabase } from '@/lib/supabaseClient'
import type { SearchCard, SearchCardsInvokePayload } from '@/features/search/search.types'

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return null
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return null
}

function parseSearchCard(entry: unknown): SearchCard | null {
  if (typeof entry !== 'object' || entry === null) return null
  const row = entry as Record<string, unknown>
  if (typeof row.professionalId !== 'number') return null

  const specialtiesRaw = row.specialties
  const specialties = Array.isArray(specialtiesRaw)
    ? specialtiesRaw.filter((item): item is string => typeof item === 'string')
    : []

  return {
    professionalId: row.professionalId,
    firstName: asNullableString(row.firstName),
    lastName: asNullableString(row.lastName),
    profilePhotoUrl: asNullableString(row.profilePhotoUrl),
    countryCode: asNullableString(row.countryCode),
    locationLabel: asNullableString(row.locationLabel),
    locationInputText: asNullableString(row.locationInputText),
    mapboxId: asNullableString(row.mapboxId),
    latitude: asNullableNumber(row.latitude),
    longitude: asNullableNumber(row.longitude),
    serviceRadiusKm: asNullableNumber(row.serviceRadiusKm),
    specialties,
  }
}

function parseSearchCardsInvokePayload(data: unknown): SearchCard[] {
  if (typeof data !== 'object' || data === null || !('cards' in data)) {
    throw new Error('Invalid search response shape')
  }

  const { cards } = data as SearchCardsInvokePayload
  if (!Array.isArray(cards)) {
    throw new Error('Invalid search response shape')
  }

  const parsed = cards.map(parseSearchCard)
  if (parsed.some((card) => card === null)) {
    throw new Error('Invalid search card in response')
  }

  return parsed as SearchCard[]
}

export async function fetchSearchCards(): Promise<SearchCard[]> {
  const { data, error } = await supabase.functions.invoke<SearchCardsInvokePayload>('search-cards', {
    body: {},
  })

  if (error) {
    throw error
  }

  return parseSearchCardsInvokePayload(data)
}
