import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import type { RefObject } from 'react'

import { getCaptchaSiteKey, isCaptchaEnabled } from '@/features/captcha/captcha-config'

type CaptchaWidgetProps = {
  turnstileRef: RefObject<TurnstileInstance | null>
  onTokenChange: (token: string | null) => void
}

export function CaptchaWidget({ turnstileRef, onTokenChange }: CaptchaWidgetProps) {
  const siteKey = getCaptchaSiteKey()

  if (!isCaptchaEnabled() || !siteKey) {
    return null
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{ theme: 'dark', size: 'normal' }}
        onSuccess={(token) => onTokenChange(token)}
        onExpire={() => onTokenChange(null)}
        onError={() => onTokenChange(null)}
      />
    </div>
  )
}
