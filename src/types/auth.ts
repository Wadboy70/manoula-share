export interface AppUser {
  id: number
  created_at: string
  auth_user_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  is_professional: boolean | null
  profile_photo_url: string | null
  bio: string | null
  is_profile_complete: boolean | null
  is_searchable: boolean | null
  is_public_searchable: boolean
  country_code: string
  location_locality: string | null
  location_region: string | null
  postal_code: string | null
  service_area: string | null
  rating_avg: number
  rating_count: number
}
