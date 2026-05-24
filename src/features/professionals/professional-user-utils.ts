import type { AppUser } from '@/types/auth'

/** True when the signed-in user is a professional with a fully complete profile. */
export function isProfessionalProfileComplete(appUser: AppUser | null): boolean {
  if (!appUser?.is_professional) return false
  return appUser.professionalSearchProfile?.is_profile_complete === true
}

/** Nav label + destination for the professional CTA in auth chrome. */
export function getProfessionalNavCta(appUser: AppUser | null): {
  label: string
  href: string
} | null {
  if (!appUser) return null
  if (!appUser.is_professional) {
    return { label: 'Join as a professional', href: '/professional/onboarding' }
  }
  if (!isProfessionalProfileComplete(appUser)) {
    return { label: 'Continue setup', href: '/professional/onboarding' }
  }
  return { label: 'Dashboard', href: '/dashboard' }
}
