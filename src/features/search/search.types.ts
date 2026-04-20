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
  | 'location_input_text'
  | 'mapbox_id'
  | 'latitude'
  | 'longitude'
  | 'service_radius_km'
  | 'specialties'
>

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
  locationInputText: string | null
  mapboxId: string | null
  latitude: number | null
  longitude: number | null
  serviceRadiusKm: number | null
  specialties: string[]
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
    locationInputText: row.location_input_text,
    mapboxId: row.mapbox_id,
    latitude: row.latitude,
    longitude: row.longitude,
    serviceRadiusKm: row.service_radius_km,
    specialties: row.specialties ?? [],
  }
}
