import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { CAPTCHA_REQUIRED_ERROR } from '@/features/captcha/captcha-config'
import { useCaptcha } from '@/features/captcha/use-captcha'

describe('useCaptcha', () => {
  it('allows submit when captcha is disabled', () => {
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'false')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', 'test-site-key')

    const { result } = renderHook(() => useCaptcha())

    expect(result.current.enabled).toBe(false)
    expect(result.current.canSubmit).toBe(true)
    expect(result.current.validateCaptchaToken()).toBeNull()

    vi.unstubAllEnvs()
  })

  it('blocks submit until a token is received when captcha is enabled', () => {
    vi.stubEnv('VITE_CAPTCHA_ENABLED', 'true')
    vi.stubEnv('VITE_CAPTCHA_SITE_KEY', 'test-site-key')

    const { result } = renderHook(() => useCaptcha())

    expect(result.current.enabled).toBe(true)
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.validateCaptchaToken()).toBe(CAPTCHA_REQUIRED_ERROR)

    act(() => {
      result.current.setCaptchaToken('token-123')
    })

    expect(result.current.canSubmit).toBe(true)
    expect(result.current.validateCaptchaToken()).toBeNull()

    vi.unstubAllEnvs()
  })
})
