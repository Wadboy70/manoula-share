import { describe, expect, it } from 'vitest'

import { getSignInErrorMessage } from '@/features/auth/auth-errors'

describe('getSignInErrorMessage', () => {
  it('maps network failures away from "Failed to fetch"', () => {
    expect(getSignInErrorMessage({ message: 'Failed to fetch' })).toBe(
      "We couldn't connect. Check your internet connection and try again.",
    )
  })

  it('maps invalid credentials to a friendly message', () => {
    expect(
      getSignInErrorMessage({ message: 'Invalid login credentials' }),
    ).toBe('Incorrect email or password.')
  })

  it('maps unconfirmed email', () => {
    expect(getSignInErrorMessage({ message: 'Email not confirmed' })).toBe(
      'Please verify your email before signing in.',
    )
  })

  it('maps rate limits', () => {
    expect(getSignInErrorMessage({ message: 'Rate limited', status: 429 })).toBe(
      'Too many sign-in attempts. Please wait a moment and try again.',
    )
  })

  it('falls back for unknown errors', () => {
    expect(getSignInErrorMessage({ message: 'Something unexpected' })).toBe(
      'Something unexpected',
    )
    expect(getSignInErrorMessage(null)).toBe(
      'Unable to sign in right now. Please try again.',
    )
  })
})
