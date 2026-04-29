export type ProfileCompletenessInput = {
  firstName: string
  lastName: string
  profilePhotoUrl: string
  bio: string
  specialtyIds: number[]
  locationLabel: string
  hasCredential: boolean
  visibilitySet: boolean
}

const CHECKS = [
  { key: 'name', label: 'Add your full name' },
  { key: 'photo', label: 'Upload a profile photo' },
  { key: 'bio', label: 'Add your bio/about section' },
  { key: 'specialty', label: 'Select at least one specialty' },
  { key: 'location', label: 'Set your location' },
  { key: 'credential', label: 'Add at least one credential' },
  { key: 'visibility', label: 'Set profile visibility' },
] as const

export type ProfileCompleteness = {
  percentage: number
  isComplete: boolean
  missingItems: string[]
}

export function calculateProfileCompleteness(input: ProfileCompletenessInput): ProfileCompleteness {
  const status = {
    name: input.firstName.trim().length > 0 && input.lastName.trim().length > 0,
    photo: input.profilePhotoUrl.trim().length > 0,
    bio: input.bio.trim().length > 0,
    specialty: input.specialtyIds.length > 0,
    location: input.locationLabel.trim().length > 0,
    credential: input.hasCredential,
    visibility: input.visibilitySet,
  }

  const doneCount = CHECKS.filter((check) => status[check.key]).length
  const percentage = Math.round((doneCount / CHECKS.length) * 100)

  return {
    percentage,
    isComplete: doneCount === CHECKS.length,
    missingItems: CHECKS.filter((check) => !status[check.key]).map((check) => check.label),
  }
}
