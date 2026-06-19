import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type IntakeKind = 'client' | 'professional'

type SubmitIntakeBody = {
  kind?: unknown
  captchaToken?: unknown
  payload?: unknown
}

type TurnstileVerifyResponse = {
  success?: boolean
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseKind(raw: unknown): IntakeKind | null {
  if (raw === 'client' || raw === 'professional') return raw
  return null
}

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')?.trim()
  if (!secret) {
    return true
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  })

  let response: Response
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
  } catch {
    return false
  }

  if (!response.ok) return false

  let data: TurnstileVerifyResponse
  try {
    data = (await response.json()) as TurnstileVerifyResponse
  } catch {
    return false
  }

  return data.success === true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  let body: SubmitIntakeBody = {}
  try {
    body = (await req.json()) as SubmitIntakeBody
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400)
  }

  const kind = parseKind(body.kind)
  if (!kind) {
    return jsonResponse({ ok: false, error: 'Invalid intake kind.' }, 400)
  }

  const payload = parsePayload(body.payload)
  if (!payload) {
    return jsonResponse({ ok: false, error: 'Invalid intake payload.' }, 400)
  }

  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')?.trim()
  if (turnstileSecret) {
    const captchaToken =
      typeof body.captchaToken === 'string' ? body.captchaToken.trim() : ''
    if (!captchaToken) {
      return jsonResponse({ ok: false, error: 'CAPTCHA verification is required.' }, 400)
    }

    const verified = await verifyTurnstileToken(captchaToken)
    if (!verified) {
      return jsonResponse({ ok: false, error: 'CAPTCHA verification failed. Please try again.' }, 400)
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: 'Server configuration error.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const rpcName =
    kind === 'client' ? 'submit_client_intake' : 'submit_professional_intake'

  const { data, error } = await supabase.rpc(rpcName, { payload })

  if (error) {
    return jsonResponse({ ok: false, error: error.message }, 400)
  }

  if (!data || typeof data !== 'object') {
    return jsonResponse({ ok: false, error: 'Unexpected response from server.' }, 500)
  }

  const record = data as { ok?: boolean; error?: string }
  if (record.ok === true) {
    return jsonResponse({ ok: true })
  }

  return jsonResponse({
    ok: false,
    error: typeof record.error === 'string' ? record.error : 'Unable to submit your details.',
  })
})
