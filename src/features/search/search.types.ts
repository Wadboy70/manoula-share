import type { Database } from '@/types/database'

type SearchCardRow = Database['public']['Views']['professional_search_cards_enriched']['Row']
type SearchCardSelectRow = Pick<
  SearchCardRow,
  | 'professional_id'
  | 'first_name'
  | 'last_name'
  | 'profile_photo_url'
  | 'country_code'
  | 'location_label'
  | 'place_id'
  | 'latitude'
  | 'longitude'
  | 'specialties'
  | 'services'
  | 'rating_avg'
  | 'rating_count'
>

/** One active service on a search card (subset of `public.services`). UI uses `specialtyLabel` only for now. */
export type SearchCardService = {
  id: number
  title: string
  deliveryMode: string
  priceCents: number | null
  currencyCode: string
  specialtyLabel: string | null
}

/** Delivery lozenge labels from active services on a card (stable order). */
export function deliveryModalityLabelsFromServices(services: SearchCardService[]): string[] {
  let remote = false
  let inHome = false
  let providerLocation = false
  for (const s of services) {
    if (s.deliveryMode === 'remote') remote = true
    else if (s.deliveryMode === 'in_home') inHome = true
    else if (s.deliveryMode === 'provider_location') providerLocation = true
  }
  const labels: string[] = []
  if (remote) labels.push('Remote')
  if (inHome) labels.push('In-home')
  if (providerLocation) labels.push('At provider location')
  return labels
}

function parseServicesFromViewJson(value: unknown): SearchCardService[] {
  if (!Array.isArray(value)) return []

  const out: SearchCardService[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const o = entry as Record<string, unknown>
    const idRaw = o.id
    const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN
    if (!Number.isFinite(id)) continue

    const title = typeof o.title === 'string' ? o.title : null
    if (!title || title.trim() === '') continue

    const deliveryRaw = o.delivery_mode ?? o.deliveryMode
    const deliveryMode = typeof deliveryRaw === 'string' ? deliveryRaw : 'unknown'

    const priceRaw = o.price_cents ?? o.priceCents
    const priceCents =
      typeof priceRaw === 'number' && Number.isFinite(priceRaw) ? priceRaw : null

    const currencyRaw = o.currency_code ?? o.currencyCode
    const currencyCode = typeof currencyRaw === 'string' && currencyRaw.trim() !== '' ? currencyRaw : 'GBP'

    const specRaw = o.specialty_label ?? o.specialtyLabel
    const specialtyLabel =
      typeof specRaw === 'string' && specRaw.trim() !== '' ? specRaw.trim() : null

    out.push({ id, title, deliveryMode, priceCents, currencyCode, specialtyLabel })
  }
  return out
}

/** User-selected place from autocomplete, sent to `search-cards` for geo filtering. */
export type SearchLocationFilter = {
  placeId: string
  latitude: number
  longitude: number
  countryCode: string
  ancestorPlaceIds: string[]
  /** Client-only: display string for the location field; not sent to the edge function. */
  label?: string
}

/** POST body for `search-cards` (fields the SPA sends). */
export type SearchCardsInvokeRequestBody = {
  location?: {
    placeId: string
    latitude: number
    longitude: number
    countryCode: string
    ancestorPlaceIds: string[]
  }
  specialtyLabel?: string
  deliveryMode?: string
  limit?: number
  cursor?: SearchPageCursor | null
}

export type SearchPageCursor = {
  sortScore: number
  professionalId: number
}

/** JSON body from the `search-cards` Edge Function (camelCase cards). */
export type SearchCardsInvokePayload = {
  cards: SearchCard[]
  nextCursor: SearchPageCursor | null
  truncated: boolean
}

export type SearchCard = {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  countryCode: string | null
  locationLabel: string | null
  placeId: string | null
  latitude: number | null
  longitude: number | null
  /** Denormalized from profile when returned by search RPC (optional for older mocks). */
  ratingAvg?: number | null
  ratingCount?: number | null
  specialties: string[]
  services: SearchCardService[]
}

export function toSearchCard(row: SearchCardSelectRow): SearchCard | null {
  if (row.professional_id === null) return null

  return {
    professionalId: row.professional_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    countryCode: row.country_code,
    locationLabel: row.location_label,
    placeId: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    ratingAvg: row.rating_avg ?? null,
    ratingCount: row.rating_count ?? 0,
    specialties: row.specialties ?? [],
    services: parseServicesFromViewJson(row.services),
  }
}
