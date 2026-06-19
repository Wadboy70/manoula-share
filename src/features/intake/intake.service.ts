import { CAPTCHA_REQUIRED_ERROR, isCaptchaEnabled } from '@/features/captcha/captcha-config'
import { supabase } from '@/lib/supabaseClient'

import {
  normalizeClientIntakePayload,
  normalizeProfessionalIntakePayload,
  validateClientIntakeForm,
  validateProfessionalIntakeForm,
  type ClientIntakeFormValues,
  type ProfessionalIntakeFormValues,
} from './intake-validation'

type IntakeResult = { ok: true } | { ok: false; error: string }

type SubmitIntakeInvokeResponse = {
  ok?: boolean
  error?: string
}

function parseInvokeResponse(data: unknown): IntakeResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Unexpected response from server.' }
  }

  const record = data as SubmitIntakeInvokeResponse
  if (record.ok === true) {
    return { ok: true }
  }

  return {
    ok: false,
    error: typeof record.error === 'string' ? record.error : 'Unable to submit your details.',
  }
}

async function submitIntake(
  kind: 'client' | 'professional',
  payload: Record<string, unknown>,
  captchaToken: string | null,
): Promise<IntakeResult> {
  if (isCaptchaEnabled() && !captchaToken) {
    return { ok: false, error: CAPTCHA_REQUIRED_ERROR }
  }

  const body: {
    kind: 'client' | 'professional'
    payload: Record<string, unknown>
    captchaToken?: string
  } = {
    kind,
    payload,
  }

  if (captchaToken) {
    body.captchaToken = captchaToken
  }

  const { data, error } = await supabase.functions.invoke<SubmitIntakeInvokeResponse>(
    'submit-intake',
    { body },
  )

  if (error) {
    return { ok: false, error: error.message }
  }

  return parseInvokeResponse(data)
}

export async function submitClientIntake(
  values: ClientIntakeFormValues,
  captchaToken: string | null = null,
): Promise<IntakeResult> {
  const validationError = validateClientIntakeForm(values)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  return submitIntake('client', normalizeClientIntakePayload(values), captchaToken)
}

export async function submitProfessionalIntake(
  values: ProfessionalIntakeFormValues,
  captchaToken: string | null = null,
): Promise<IntakeResult> {
  const validationError = validateProfessionalIntakeForm(values)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  return submitIntake('professional', normalizeProfessionalIntakePayload(values), captchaToken)
}
