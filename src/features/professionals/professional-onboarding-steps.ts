import {
  getProfileCompletenessStatus,
  PROFILE_COMPLETENESS_CHECKS,
  type ProfileCompletenessCheckKey,
} from './profile-completeness'

export const ONBOARDING_STEP_IDS = [
  'name',
  'photo',
  'bio',
  'specialty',
  'location',
  'credential',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number]

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_IDS.length

export type OnboardingProfileState = {
  firstName: string
  lastName: string
  profilePhotoUrl: string
  bio: string
  specialtyIds: number[]
  locationLabel: string
  hasCredential: boolean
}

export type OnboardingStepDefinition = {
  id: OnboardingStepId
  title: string
  description: string
  completenessKey: ProfileCompletenessCheckKey
}

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'name',
    title: 'Your name',
    description: 'Use your legal first and last name so clients know who they are booking.',
    completenessKey: 'name',
  },
  {
    id: 'photo',
    title: 'Profile photo',
    description: 'Add a clear photo clients will see on your profile card.',
    completenessKey: 'photo',
  },
  {
    id: 'bio',
    title: 'About you',
    description: 'Tell clients about your approach and experience.',
    completenessKey: 'bio',
  },
  {
    id: 'specialty',
    title: 'Specialties',
    description: 'Select at least one specialty that describes your practice.',
    completenessKey: 'specialty',
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Where are you based? Pick a suggestion so we can place you on the map.',
    completenessKey: 'location',
  },
  {
    id: 'credential',
    title: 'Credentials',
    description: 'Add a credential clients should trust. Type and issuing body are required.',
    completenessKey: 'credential',
  },
]

export function resolveOnboardingStep(
  state: OnboardingProfileState,
  options?: { isProfessional?: boolean },
): OnboardingStepId | 'complete' {
  if (options?.isProfessional === false) {
    return 'name'
  }

  const status = getProfileCompletenessStatus(state)
  for (const step of ONBOARDING_STEPS) {
    if (!status[step.completenessKey]) {
      return step.id
    }
  }
  return 'complete'
}

export function getOnboardingStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEP_IDS.indexOf(stepId)
}

export function getOnboardingStepDefinition(stepId: OnboardingStepId): OnboardingStepDefinition {
  const step = ONBOARDING_STEPS.find((item) => item.id === stepId)
  if (!step) {
    throw new Error(`Unknown onboarding step: ${stepId}`)
  }
  return step
}

/** Labels for progress UI — re-export completeness check labels in step order. */
export function getOnboardingStepLabels(): string[] {
  return ONBOARDING_STEP_IDS.map(
    (id) => PROFILE_COMPLETENESS_CHECKS.find((check) => check.key === id)?.label ?? id,
  )
}
