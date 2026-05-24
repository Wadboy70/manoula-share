import { describe, expect, it } from 'vitest'

import {
  ONBOARDING_STEP_COUNT,
  resolveOnboardingStep,
  type OnboardingProfileState,
} from './professional-onboarding-steps'

function baseState(overrides: Partial<OnboardingProfileState> = {}): OnboardingProfileState {
  return {
    firstName: '',
    lastName: '',
    profilePhotoUrl: '',
    bio: '',
    specialtyIds: [],
    locationLabel: '',
    hasCredential: false,
    ...overrides,
  }
}

describe('resolveOnboardingStep', () => {
  it('returns name for an empty profile', () => {
    expect(resolveOnboardingStep(baseState())).toBe('name')
  })

  it('skips completed steps and resumes at the first gap', () => {
    expect(
      resolveOnboardingStep(
        baseState({
          firstName: 'Jane',
          lastName: 'Doe',
          profilePhotoUrl: 'https://example.com/p.jpg',
          bio: 'Bio',
        }),
      ),
    ).toBe('specialty')
  })

  it('starts at name for non-professionals even when names are already set', () => {
    expect(
      resolveOnboardingStep(
        baseState({
          firstName: 'Jane',
          lastName: 'Doe',
        }),
        { isProfessional: false },
      ),
    ).toBe('name')
  })

  it('returns complete when all checks pass', () => {
    expect(
      resolveOnboardingStep(
        baseState({
          firstName: 'Jane',
          lastName: 'Doe',
          profilePhotoUrl: 'https://example.com/p.jpg',
          bio: 'Bio',
          specialtyIds: [1],
          locationLabel: 'London',
          hasCredential: true,
        }),
      ),
    ).toBe('complete')
  })

  it('exposes six onboarding steps', () => {
    expect(ONBOARDING_STEP_COUNT).toBe(6)
  })
})
