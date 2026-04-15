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
  specialty: unknown
  is_profile_complete: boolean | null
  is_searchable: boolean | null
}
