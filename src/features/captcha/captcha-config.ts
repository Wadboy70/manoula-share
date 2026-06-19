/** Site key for Cloudflare Turnstile (public; safe in frontend env). */
export function getCaptchaSiteKey(): string | undefined {
  const key = import.meta.env.VITE_CAPTCHA_SITE_KEY
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : undefined
}

/** When false, intake forms skip the widget and the Edge Function skips verification if no secret is set. */
export function isCaptchaExplicitlyDisabled(): boolean {
  return import.meta.env.VITE_CAPTCHA_ENABLED === 'false'
}

export function isCaptchaEnabled(): boolean {
  if (isCaptchaExplicitlyDisabled()) return false
  return getCaptchaSiteKey() !== undefined
}

export const CAPTCHA_REQUIRED_ERROR =
  'Please complete the CAPTCHA verification before submitting.'
