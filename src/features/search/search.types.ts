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
  | 'mapbox_id'
  | 'latitude'
  | 'longitude'
  | 'offers_remote'
  | 'offers_in_home'
  | 'offers_provider_location'
  | 'specialties'
  | 'services'
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
  mapboxId: string
  latitude: number
  longitude: number
  ancestorMapboxIds: string[]
  /** Client-only: display string for the location field; not sent to the edge function. */
  label?: string
}

/** JSON body from the `search-cards` Edge Function (camelCase cards). */
export type SearchCardsInvokePayload = {
  cards: SearchCard[]
}

export type SearchCard = {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  countryCode: string | null
  locationLabel: string | null
  mapboxId: string | null
  latitude: number | null
  longitude: number | null
  offersRemote: boolean
  offersInHome: boolean
  offersProviderLocation: boolean
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
    mapboxId: row.mapbox_id,
    latitude: row.latitude,
    longitude: row.longitude,
    offersRemote: row.offers_remote ?? false,
    offersInHome: row.offers_in_home ?? false,
    offersProviderLocation: row.offers_provider_location ?? false,
    specialties: row.specialties ?? [],
    services: parseServicesFromViewJson(row.services),
  }
}
