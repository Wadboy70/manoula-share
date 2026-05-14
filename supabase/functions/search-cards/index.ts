// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50
const ANON_MAX_RESULTS = 3

const ALLOWED_DELIVERY_MODES = new Set(['remote', 'in_home', 'provider_location'])

type JwtRole = 'anon' | 'authenticated'

function jwtPayloadFromBearer(authHeader: string): Record<string, unknown> | null {
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function jwtRole(authHeader: string): JwtRole {
  const payload = jwtPayloadFromBearer(authHeader)
  const role = typeof payload?.role === 'string' ? payload.role : ''
  return role === 'authenticated' ? 'authenticated' : 'anon'
}

type SearchLocationFilter = {
  placeId: string
  latitude: number
  longitude: number
  countryCode: string
  ancestorPlaceIds: string[]
}

type SearchCursorWire = {
  sortScore: number
  professionalId: number
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function readJsonBody(req: Request): Promise<unknown> {
  const method = req.method.toUpperCase()
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return {}
  }
  const text = await req.text()
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    return {}
  }
}

type ParseLocationResult =
  | { ok: true; location: SearchLocationFilter | null }
  | { ok: false; message: string }

function parseLocationFilter(body: unknown): ParseLocationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: true, location: null }
  }
  if (!('location' in body)) {
    return { ok: true, location: null }
  }
  const loc = (body as { location: unknown }).location
  if (loc === undefined || loc === null) {
    return { ok: true, location: null }
  }
  if (typeof loc !== 'object' || loc === null) {
    return { ok: false, message: 'Invalid location payload' }
  }
  const o = loc as Record<string, unknown>
  const placeIdRaw = typeof o.placeId === 'string' ? o.placeId.trim() : ''
  if (!placeIdRaw) {
    return { ok: false, message: 'location.placeId is required' }
  }
  const lat = o.latitude
  const lng = o.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: 'location.latitude and location.longitude must be finite numbers' }
  }
  const countryCodeRaw = typeof o.countryCode === 'string' ? o.countryCode.trim().toUpperCase() : ''
  if (!countryCodeRaw || countryCodeRaw.length !== 2) {
    return { ok: false, message: 'location.countryCode is required and must be an ISO-2 code' }
  }

  let ancestorPlaceIds: string[] = []
  const anc = o.ancestorPlaceIds
  if (anc === undefined || anc === null) {
    ancestorPlaceIds = []
  } else if (!Array.isArray(anc)) {
    return { ok: false, message: 'location.ancestorPlaceIds must be an array of strings' }
  } else {
    for (const item of anc) {
      if (typeof item === 'string' && item.length > 0) {
        ancestorPlaceIds.push(item)
      }
    }
  }

  return {
    ok: true,
    location: {
      placeId: placeIdRaw,
      latitude: lat,
      longitude: lng,
      countryCode: countryCodeRaw,
      ancestorPlaceIds,
    },
  }
}

const MAX_SPECIALTY_LABEL_LEN = 200

type ParseSpecialtyLabelResult =
  | { ok: true; specialtyLabel: string | null }
  | { ok: false; message: string }

function parseSpecialtyLabel(body: unknown): ParseSpecialtyLabelResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: true, specialtyLabel: null }
  }
  if (!('specialtyLabel' in body)) {
    return { ok: true, specialtyLabel: null }
  }
  const raw = (body as { specialtyLabel: unknown }).specialtyLabel
  if (raw === undefined || raw === null) {
    return { ok: true, specialtyLabel: null }
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: 'specialtyLabel must be a string when provided' }
  }
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: true, specialtyLabel: null }
  }
  if (trimmed.length > MAX_SPECIALTY_LABEL_LEN) {
    return { ok: false, message: 'specialtyLabel is too long' }
  }
  return { ok: true, specialtyLabel: trimmed }
}

type ParseDeliveryModeResult =
  | { ok: true; deliveryMode: string | null }
  | { ok: false; message: string }

function parseDeliveryMode(body: unknown): ParseDeliveryModeResult {
  if (typeof body !== 'object' || body === null || !('deliveryMode' in body)) {
    return { ok: true, deliveryMode: null }
  }
  const raw = (body as { deliveryMode: unknown }).deliveryMode
  if (raw === undefined || raw === null) {
    return { ok: true, deliveryMode: null }
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: 'deliveryMode must be a string when provided' }
  }
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: true, deliveryMode: null }
  }
  if (!ALLOWED_DELIVERY_MODES.has(trimmed)) {
    return { ok: false, message: 'deliveryMode is invalid' }
  }
  return { ok: true, deliveryMode: trimmed }
}

type ParseCursorResult =
  | { ok: true; cursor: SearchCursorWire | null }
  | { ok: false; message: string }

function parseCursor(body: unknown): ParseCursorResult {
  if (typeof body !== 'object' || body === null || !('cursor' in body)) {
    return { ok: true, cursor: null }
  }
  const raw = (body as { cursor: unknown }).cursor
  if (raw === undefined || raw === null) {
    return { ok: true, cursor: null }
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'cursor must be an object when provided' }
  }
  const o = raw as Record<string, unknown>
  const sortScore = o.sortScore
  const professionalId = o.professionalId
  if (typeof sortScore !== 'number' || !Number.isFinite(sortScore)) {
    return { ok: false, message: 'cursor.sortScore must be a finite number' }
  }
  if (typeof professionalId !== 'number' || !Number.isFinite(professionalId) || professionalId <= 0) {
    return { ok: false, message: 'cursor.professionalId must be a positive finite number' }
  }
  return { ok: true, cursor: { sortScore, professionalId } }
}

function parseRequestedLimit(body: unknown): number {
  if (typeof body !== 'object' || body === null || !('limit' in body)) {
    return DEFAULT_PAGE_SIZE
  }
  const raw = (body as { limit: unknown }).limit
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_PAGE_SIZE
  }
  return Math.floor(raw)
}

type RpcPagePayload = {
  cards: unknown[]
  nextCursor: SearchCursorWire | null
  rowsRead: number
  error?: string
}

function asSearchCardsPayload(raw: unknown): RpcPagePayload | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.cards)) return null
  if (!('nextCursor' in o)) return null
  const rowsRaw = o.rowsRead
  const rowsRead =
    typeof rowsRaw === 'number' && Number.isFinite(rowsRaw) && rowsRaw >= 0 ? Math.floor(rowsRaw) : 0
  const nc = o.nextCursor
  let nextCursor: SearchCursorWire | null = null
  if (nc !== null && typeof nc === 'object' && nc !== null) {
    const c = nc as Record<string, unknown>
    if (
      typeof c.sortScore === 'number' &&
      Number.isFinite(c.sortScore) &&
      typeof c.professionalId === 'number' &&
      Number.isFinite(c.professionalId)
    ) {
      nextCursor = { sortScore: c.sortScore, professionalId: c.professionalId }
    }
  }
  return { cards: o.cards, nextCursor, rowsRead, error: typeof o.error === 'string' ? o.error : undefined }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const body = await readJsonBody(req)
  const parsedLoc = parseLocationFilter(body)
  if (!parsedLoc.ok) {
    return jsonResponse({ error: parsedLoc.message }, 400)
  }
  const location = parsedLoc.location

  const parsedSpecialty = parseSpecialtyLabel(body)
  if (!parsedSpecialty.ok) {
    return jsonResponse({ error: parsedSpecialty.message }, 400)
  }
  const specialtyLabel = parsedSpecialty.specialtyLabel

  const parsedDelivery = parseDeliveryMode(body)
  if (!parsedDelivery.ok) {
    return jsonResponse({ error: parsedDelivery.message }, 400)
  }
  const deliveryMode = parsedDelivery.deliveryMode

  const parsedCursor = parseCursor(body)
  if (!parsedCursor.ok) {
    return jsonResponse({ error: parsedCursor.message }, 400)
  }
  let cursor = parsedCursor.cursor

  const role = jwtRole(authHeader)
  if (role === 'anon' && cursor !== null) {
    return jsonResponse({ error: 'Signed-out search does not support pagination cursors' }, 400)
  }

  const requestedLimit = Math.min(Math.max(parseRequestedLimit(body), 1), MAX_PAGE_SIZE)

  let rpcReturnCap: number
  let rpcProbeRows: number
  if (role === 'anon') {
    rpcReturnCap = ANON_MAX_RESULTS
    rpcProbeRows = 1
    cursor = null
  } else {
    rpcReturnCap = requestedLimit
    rpcProbeRows = 1
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const pLocation =
    location === null
      ? null
      : {
          placeId: location.placeId,
          latitude: location.latitude,
          longitude: location.longitude,
          countryCode: location.countryCode,
          ancestorPlaceIds: location.ancestorPlaceIds,
        }

  const { data, error } = await supabase.rpc('search_professional_cards_page', {
    p_return_cap: rpcReturnCap,
    p_probe_rows: rpcProbeRows,
    p_after_sort_score: cursor?.sortScore ?? null,
    p_after_professional_id: cursor?.professionalId ?? null,
    p_specialty_label: specialtyLabel,
    p_delivery_mode: deliveryMode,
    p_location: pLocation,
  })

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const payload = asSearchCardsPayload(data)
  if (!payload) {
    return jsonResponse({ error: 'Invalid search RPC response' }, 500)
  }
  if (payload.error === 'invalid_location' || payload.error === 'invalid_delivery_mode') {
    return jsonResponse({ error: payload.error === 'invalid_location' ? 'Invalid location' : 'Invalid delivery mode' }, 400)
  }

  const cards = payload.cards as unknown[]
  let nextCursor: SearchCursorWire | null = payload.nextCursor
  const truncated = role === 'anon' && payload.rowsRead > ANON_MAX_RESULTS

  if (role === 'anon') {
    nextCursor = null
  }

  return jsonResponse({
    cards,
    nextCursor,
    truncated,
  })
})
