import type { Database } from '@/types/database'

export type ProfessionalSearchProfile =
  Database['public']['Tables']['professional_search_profiles']['Row']

/** Core `users` row plus optional professional search profile (null for non-professionals). */
export type AppUser = Database['public']['Tables']['users']['Row'] & {
  professionalSearchProfile: ProfessionalSearchProfile | null
}
