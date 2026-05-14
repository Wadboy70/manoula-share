import { supabase } from '@/lib/supabaseClient'
import type {
  SearchCard,
  SearchCardService,
  SearchCardsInvokePayload,
  SearchCardsInvokeRequestBody,
  SearchLocationFilter,
  SearchPageCursor,
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

  const ratingAvgRaw = row.ratingAvg ?? row.rating_avg
  const ratingCountRaw = row.ratingCount ?? row.rating_count

  return {
    professionalId: row.professionalId,
    firstName: asNullableString(row.firstName),
    lastName: asNullableString(row.lastName),
    profilePhotoUrl: asNullableString(row.profilePhotoUrl),
    countryCode: asNullableString(row.countryCode),
    locationLabel: asNullableString(row.locationLabel),
    placeId: asNullableString(row.placeId),
    latitude: asNullableNumber(row.latitude),
    longitude: asNullableNumber(row.longitude),
    ratingAvg:
      typeof ratingAvgRaw === 'number' && Number.isFinite(ratingAvgRaw) ? ratingAvgRaw : null,
    ratingCount:
      typeof ratingCountRaw === 'number' && Number.isFinite(ratingCountRaw)
        ? Math.floor(ratingCountRaw)
        : 0,
    specialties,
    services: parseSearchCardServices(row.services),
  }
}

function parseSearchPageCursor(raw: unknown): SearchPageCursor | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const sortScore = o.sortScore
  const professionalId = o.professionalId
  if (typeof sortScore !== 'number' || !Number.isFinite(sortScore)) return null
  if (typeof professionalId !== 'number' || !Number.isFinite(professionalId)) return null
  return { sortScore, professionalId }
}

function parseSearchCardsInvokePayload(data: unknown): {
  cards: SearchCard[]
  nextCursor: SearchPageCursor | null
  truncated: boolean
} {
  if (typeof data !== 'object' || data === null || !('cards' in data)) {
    throw new Error('Invalid search response shape')
  }

  const { cards, nextCursor: nextRaw, truncated } = data as SearchCardsInvokePayload
  if (!Array.isArray(cards)) {
    throw new Error('Invalid search response shape')
  }

  const parsed = cards.map(parseSearchCard)
  if (parsed.some((card) => card === null)) {
    throw new Error('Invalid search card in response')
  }

  return {
    cards: parsed as SearchCard[],
    nextCursor: parseSearchPageCursor(nextRaw),
    truncated: typeof truncated === 'boolean' ? truncated : false,
  }
}

export type FetchSearchCardsOptions = {
  location?: SearchLocationFilter | null
  specialtyLabel?: string | null
  deliveryMode?: string | null
  limit?: number
  cursor?: SearchPageCursor | null
}

export type FetchSearchCardsResult = {
  cards: SearchCard[]
  nextCursor: SearchPageCursor | null
  truncated: boolean
}

export async function fetchSearchCards(options?: FetchSearchCardsOptions): Promise<FetchSearchCardsResult> {
  const location = options?.location ?? null
  const rawSpecialty = options?.specialtyLabel ?? null
  const specialtyTrimmed =
    typeof rawSpecialty === 'string' && rawSpecialty.trim() !== '' ? rawSpecialty.trim() : null

  const rawDelivery = options?.deliveryMode ?? null
  const deliveryTrimmed =
    typeof rawDelivery === 'string' && rawDelivery.trim() !== '' ? rawDelivery.trim() : null

  const body: SearchCardsInvokeRequestBody = {}
  if (location !== null) {
    body.location = {
      placeId: location.placeId,
      latitude: location.latitude,
      longitude: location.longitude,
      countryCode: location.countryCode,
      ancestorPlaceIds: location.ancestorPlaceIds,
    }
  }
  if (specialtyTrimmed !== null) {
    body.specialtyLabel = specialtyTrimmed
  }
  if (deliveryTrimmed !== null) {
    body.deliveryMode = deliveryTrimmed
  }
  if (typeof options?.limit === 'number' && Number.isFinite(options.limit)) {
    body.limit = Math.floor(options.limit)
  }
  if (options?.cursor !== undefined && options.cursor !== null) {
    body.cursor = options.cursor
  }

  const { data, error } = await supabase.functions.invoke<SearchCardsInvokePayload>('search-cards', {
    body: Object.keys(body).length > 0 ? body : {},
  })

  if (error) {
    throw error
  }

  return parseSearchCardsInvokePayload(data)
}
