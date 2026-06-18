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

function parseRpcResponse(data: unknown): IntakeResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Unexpected response from server.' }
  }

  const record = data as { ok?: boolean; error?: string }
  if (record.ok === true) {
    return { ok: true }
  }

  return {
    ok: false,
    error: typeof record.error === 'string' ? record.error : 'Unable to submit your details.',
  }
}

export async function submitClientIntake(
  values: ClientIntakeFormValues,
): Promise<IntakeResult> {
  const validationError = validateClientIntakeForm(values)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const { data, error } = await supabase.rpc('submit_client_intake', {
    payload: normalizeClientIntakePayload(values),
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return parseRpcResponse(data)
}

export async function submitProfessionalIntake(
  values: ProfessionalIntakeFormValues,
): Promise<IntakeResult> {
  const validationError = validateProfessionalIntakeForm(values)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const { data, error } = await supabase.rpc('submit_professional_intake', {
    payload: normalizeProfessionalIntakePayload(values),
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return parseRpcResponse(data)
}
