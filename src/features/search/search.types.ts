import type { Database } from '@/types/database'

type SearchCardRow =
  Database['public']['Views']['professional_search_cards_enriched']['Row']
type SearchCardSelectRow = Pick<
  SearchCardRow,
  | 'professional_id'
  | 'first_name'
  | 'last_name'
  | 'profile_photo_url'
  | 'location_locality'
  | 'location_region'
  | 'country_code'
  | 'specialties'
  | 'rating_avg'
  | 'rating_count'
>

export type SearchCard = {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  locationLocality: string | null
  locationRegion: string | null
  countryCode: string | null
  specialties: string[]
  ratingAvg: number | null
  ratingCount: number | null
}

export function toSearchCard(row: SearchCardSelectRow): SearchCard | null {
  if (row.professional_id === null) return null

  return {
    professionalId: row.professional_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    locationLocality: row.location_locality,
    locationRegion: row.location_region,
    countryCode: row.country_code,
    specialties: row.specialties ?? [],
    ratingAvg: row.rating_avg,
    ratingCount: row.rating_count,
  }
}
