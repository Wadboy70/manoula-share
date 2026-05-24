import { describe, expect, it } from 'vitest'

import { makeProfessionalProfileRow, makeUsersRow } from '@/test/integration/fixtures'

import { getProfessionalNavCta, isProfessionalProfileComplete } from './professional-user-utils'

describe('professional-user-utils', () => {
  it('returns join CTA for clients', () => {
    expect(getProfessionalNavCta(makeUsersRow({ is_professional: false }) as never)).toEqual({
      label: 'Join as a professional',
      href: '/professional/onboarding',
    })
  })

  it('returns continue setup for incomplete professionals', () => {
    const appUser = {
      ...makeUsersRow({ is_professional: true }),
      professionalSearchProfile: makeProfessionalProfileRow({ is_profile_complete: false }),
    }
    expect(getProfessionalNavCta(appUser)).toEqual({
      label: 'Continue setup',
      href: '/professional/onboarding',
    })
  })

  it('returns dashboard for complete professionals', () => {
    const appUser = {
      ...makeUsersRow({ is_professional: true }),
      professionalSearchProfile: makeProfessionalProfileRow({ is_profile_complete: true }),
    }
    expect(getProfessionalNavCta(appUser)).toEqual({
      label: 'Dashboard',
      href: '/dashboard',
    })
    expect(isProfessionalProfileComplete(appUser)).toBe(true)
  })
})
