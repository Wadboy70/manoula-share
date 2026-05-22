type AuthErrorLike = {
  message?: string
  status?: number
} | null | undefined

/**
 * Maps Supabase auth errors to user-facing copy for the sign-in form.
 */
export function getSignInErrorMessage(error: AuthErrorLike): string {
  const raw = error?.message?.trim() ?? ''
  const normalized = raw.toLowerCase()

  if (
    normalized === 'failed to fetch' ||
    normalized.includes('network') ||
    normalized.includes('load failed')
  ) {
    return "We couldn't connect. Check your internet connection and try again."
  }

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials')
  ) {
    return 'Incorrect email or password.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Please verify your email before signing in.'
  }

  if (error?.status === 429 || normalized.includes('rate limit')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.'
  }

  return raw || 'Unable to sign in right now. Please try again.'
}
