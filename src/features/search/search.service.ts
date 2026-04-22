import { supabase } from '@/lib/supabaseClient'
import type {
  SearchCard,
  SearchCardService,
  SearchCardsInvokePayload,
} from '@/features/search/search.types'

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

function asBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value
  return defaultValue
}

function parseSearchCardService(entry: unknown): SearchCardService | null {
  if (typeof entry !== 'object' || entry === null) return null
  const o = entry as Record<string, unknown>
  const idRaw = o.id
  const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN
  if (!Number.isFinite(id)) return null
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  if (!title) return null
  const deliveryRaw = o.deliveryMode ?? o.delivery_mode
  const deliveryMode = typeof deliveryRaw === 'string' ? deliveryRaw : 'unknown'
  const priceRaw = o.priceCents ?? o.price_cents
  const priceCents =
    typeof priceRaw === 'number' && Number.isFinite(priceRaw)
      ? priceRaw
      : null
  const currencyRaw = o.currencyCode ?? o.currency_code
  const currencyCode =
    typeof currencyRaw === 'string' && currencyRaw.trim() !== '' ? currencyRaw : 'GBP'
  const specRaw = o.specialtyLabel ?? o.specialty_label
  const specialtyLabel =
    typeof specRaw === 'string' && specRaw.trim() !== '' ? specRaw.trim() : null
  return { id, title, deliveryMode, priceCents, currencyCode, specialtyLabel }
}

function parseSearchCardServices(raw: unknown): SearchCardService[] {
  if (!Array.isArray(raw)) return []
  const out: SearchCardService[] = []
  for (const item of raw) {
    const parsed = parseSearchCardService(item)
    if (parsed) out.push(parsed)
  }
  return out
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
    mapboxId: asNullableString(row.mapboxId),
    latitude: asNullableNumber(row.latitude),
    longitude: asNullableNumber(row.longitude),
    offersRemote: asBoolean(row.offersRemote, false),
    offersInHome: asBoolean(row.offersInHome, false),
    offersProviderLocation: asBoolean(row.offersProviderLocation, false),
    specialties,
    services: parseSearchCardServices(row.services),
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
