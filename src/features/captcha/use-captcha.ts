import { useCallback, useRef, useState } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'

import {
  CAPTCHA_REQUIRED_ERROR,
  isCaptchaEnabled,
} from '@/features/captcha/captcha-config'

export function useCaptcha() {
  const enabled = isCaptchaEnabled()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null)
    turnstileRef.current?.reset()
  }, [])

  const validateCaptchaToken = useCallback((): string | null => {
    if (!enabled) return null
    if (!captchaToken) return CAPTCHA_REQUIRED_ERROR
    return null
  }, [captchaToken, enabled])

  const canSubmit = !enabled || captchaToken !== null

  return {
    enabled,
    captchaToken,
    setCaptchaToken,
    turnstileRef,
    resetCaptcha,
    validateCaptchaToken,
    canSubmit,
  }
}
