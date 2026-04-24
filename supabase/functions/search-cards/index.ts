// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ServiceWire = {
  id: number
  title: string
  deliveryMode: string
  priceCents: number | null
  currencyCode: string
  specialtyLabel: string | null
}

/** Request filter: user-selected place from Mapbox forward geocode (incl. context ancestors). */
type SearchLocationFilter = {
  mapboxId: string
  latitude: number
  longitude: number
  ancestorMapboxIds: string[]
}

type GeoPlaceRow = {
  mapbox_id: string | null
  latitude: number | null
  longitude: number | null
}

/** Service row as returned by `professional_search_cards_enriched.services` JSON (includes geo for filtering). */
type ServiceFromView = {
  id: number
  title: string
  deliveryMode: string
  priceCents: number | null
  currencyCode: string
  specialtyLabel: string | null
  service_area_type: string | null
  service_radius_km: number | null
  provider_locations: GeoPlaceRow[]
  service_area_places: GeoPlaceRow[]
}

/** View row shape (snake_case) — keep in sync with `professional_search_cards_enriched` select list. */
interface ProfessionalSearchCardRow {
  professional_id: number | null
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
  country_code: string | null
  location_label: string | null
  mapbox_id: string | null
  latitude: number | null
  longitude: number | null
  offers_remote: boolean | null
  offers_in_home: boolean | null
  offers_provider_location: boolean | null
  specialties: string[] | null
  services: unknown
}

/** Wire format returned to the SPA (camelCase) — keep in sync with `SearchCard` in the app. */
interface SearchCard {
  professionalId: number
  firstName: string | null
  lastName: string | null
  profilePhotoUrl: string | null
  countryCode: string | null
  locationLabel: string | null
  mapboxId: string | null
  latitude: number | null
  longitude: number | null
  offersRemote: boolean
  offersInHome: boolean
  offersProviderLocation: boolean
  specialties: string[]
  services: ServiceWire[]
}

function toServiceWire(s: ServiceFromView): ServiceWire {
  return {
    id: s.id,
    title: s.title,
    deliveryMode: s.deliveryMode,
    priceCents: s.priceCents,
    currencyCode: s.currencyCode,
    specialtyLabel: s.specialtyLabel,
  }
}

function parseGeoPlaces(raw: unknown): GeoPlaceRow[] {
  if (!Array.isArray(raw)) return []
  const out: GeoPlaceRow[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const mapbox_id = typeof o.mapbox_id === 'string' ? o.mapbox_id : null
    const lat = typeof o.latitude === 'number' && Number.isFinite(o.latitude) ? o.latitude : null
    const lon = typeof o.longitude === 'number' && Number.isFinite(o.longitude) ? o.longitude : null
    out.push({ mapbox_id, latitude: lat, longitude: lon })
  }
  return out
}

function parseServiceFromView(entry: unknown): ServiceFromView | null {
  if (typeof entry !== 'object' || entry === null) return null
  const o = entry as Record<string, unknown>
  const idRaw = o.id
  const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN
  if (!Number.isFinite(id)) return null
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  if (!title) return null
  const deliveryRaw = o.delivery_mode ?? o.deliveryMode
  const deliveryMode = typeof deliveryRaw === 'string' ? deliveryRaw : 'unknown'
  const priceRaw = o.price_cents ?? o.priceCents
  const priceCents =
    typeof priceRaw === 'number' && Number.isFinite(priceRaw)
      ? priceRaw
      : null
  const currencyRaw = o.currency_code ?? o.currencyCode
  const currencyCode =
    typeof currencyRaw === 'string' && currencyRaw.trim() !== '' ? currencyRaw : 'GBP'
  const specRaw = o.specialty_label ?? o.specialtyLabel
  const specialtyLabel =
    typeof specRaw === 'string' && specRaw.trim() !== '' ? specRaw.trim() : null

  const satRaw = o.service_area_type ?? o.serviceAreaType
  const service_area_type = typeof satRaw === 'string' ? satRaw : null

  const srRaw = o.service_radius_km ?? o.serviceRadiusKm
  let service_radius_km: number | null = null
  if (typeof srRaw === 'number' && Number.isFinite(srRaw)) {
    service_radius_km = srRaw
  } else if (typeof srRaw === 'string' && srRaw.trim() !== '') {
    const n = Number(srRaw)
    service_radius_km = Number.isFinite(n) ? n : null
  }

  const provider_locations = parseGeoPlaces(o.provider_locations ?? o.providerLocations)
  const service_area_places = parseGeoPlaces(o.service_area_places ?? o.serviceAreaPlaces)

  return {
    id,
    title,
    deliveryMode,
    priceCents,
    currencyCode,
    specialtyLabel,
    service_area_type,
    service_radius_km,
    provider_locations,
    service_area_places,
  }
}

function parseServicesFromRow(raw: unknown): ServiceFromView[] {
  if (!Array.isArray(raw)) return []
  const out: ServiceFromView[] = []
  for (const item of raw) {
    const parsed = parseServiceFromView(item)
    if (parsed) out.push(parsed)
  }
  return out
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function buildUserPlaceIdSet(location: SearchLocationFilter): Set<string> {
  const set = new Set<string>()
  set.add(location.mapboxId)
  for (const id of location.ancestorMapboxIds) {
    if (typeof id === 'string' && id.length > 0) set.add(id)
  }
  return set
}

function anyStoredPlaceMatchesUserPlaces(places: GeoPlaceRow[], userIds: Set<string>): boolean {
  for (const p of places) {
    if (typeof p.mapbox_id === 'string' && p.mapbox_id.length > 0 && userIds.has(p.mapbox_id)) {
      return true
    }
  }
  return false
}

function radiusMatches(
  service: ServiceFromView,
  profileLat: number | null,
  profileLng: number | null,
  userLat: number,
  userLng: number,
): boolean {
  const km = service.service_radius_km
  if (km === null || km <= 0) return false
  if (profileLat === null || profileLng === null) return false
  if (!Number.isFinite(profileLat) || !Number.isFinite(profileLng)) return false
  const dist = haversineKm(userLat, userLng, profileLat, profileLng)
  return dist <= km
}

/**
 * Hybrid (MVP): if the service has no usable geo footprint, treat as remote-like (include when location filter on).
 * Otherwise match if any geographic arm (place_list / radius / provider_location) matches.
 */
function hybridMatchesLocation(
  service: ServiceFromView,
  profileLat: number | null,
  profileLng: number | null,
  userIds: Set<string>,
  userLat: number,
  userLng: number,
): boolean {
  const hasProvider = service.provider_locations.length > 0
  const hasPlaceList = service.service_area_type === 'place_list' && service.service_area_places.length > 0
  const hasRadius =
    service.service_area_type === 'radius' &&
    service.service_radius_km !== null &&
    service.service_radius_km > 0

  if (!hasProvider && !hasPlaceList && !hasRadius) {
    return true
  }

  if (hasProvider && anyStoredPlaceMatchesUserPlaces(service.provider_locations, userIds)) {
    return true
  }
  if (hasPlaceList && anyStoredPlaceMatchesUserPlaces(service.service_area_places, userIds)) {
    return true
  }
  if (hasRadius && radiusMatches(service, profileLat, profileLng, userLat, userLng)) {
    return true
  }
  return false
}

function inHomeMatchesLocation(
  service: ServiceFromView,
  profileLat: number | null,
  profileLng: number | null,
  userIds: Set<string>,
  userLat: number,
  userLng: number,
): boolean {
  const sat = service.service_area_type

  if (sat === 'place_list') {
    if (service.service_area_places.length === 0) return false
    return anyStoredPlaceMatchesUserPlaces(service.service_area_places, userIds)
  }

  if (sat === 'radius') {
    return radiusMatches(service, profileLat, profileLng, userLat, userLng)
  }

  // null, custom_text, or unknown — no reliable geometry when filtering by location
  return false
}

function serviceMatchesLocation(
  service: ServiceFromView,
  profileLat: number | null,
  profileLng: number | null,
  location: SearchLocationFilter,
): boolean {
  const mode = service.deliveryMode
  const userIds = buildUserPlaceIdSet(location)
  const { latitude: userLat, longitude: userLng } = location

  if (mode === 'remote') {
    return true
  }

  if (mode === 'provider_location') {
    if (service.provider_locations.length === 0) return false
    return anyStoredPlaceMatchesUserPlaces(service.provider_locations, userIds)
  }

  if (mode === 'in_home') {
    return inHomeMatchesLocation(service, profileLat, profileLng, userIds, userLat, userLng)
  }

  if (mode === 'hybrid') {
    return hybridMatchesLocation(service, profileLat, profileLng, userIds, userLat, userLng)
  }

  return false
}

function filterServicesForLocation(
  services: ServiceFromView[],
  profileLat: number | null,
  profileLng: number | null,
  location: SearchLocationFilter,
): ServiceWire[] {
  const out: ServiceWire[] = []
  for (const s of services) {
    if (serviceMatchesLocation(s, profileLat, profileLng, location)) {
      out.push(toServiceWire(s))
    }
  }
  return out
}

function toSearchCard(
  row: ProfessionalSearchCardRow,
  location: SearchLocationFilter | null,
  specialtyLabel: string | null,
): SearchCard | null {
  if (row.professional_id === null) return null

  const parsedServices = parseServicesFromRow(row.services)
  let servicesForGeo = parsedServices
  if (specialtyLabel !== null) {
    servicesForGeo = parsedServices.filter((s) => s.specialtyLabel === specialtyLabel)
    if (servicesForGeo.length === 0) return null
  }

  const services =
    location !== null
      ? filterServicesForLocation(servicesForGeo, row.latitude, row.longitude, location)
      : servicesForGeo.map(toServiceWire)

  return {
    professionalId: row.professional_id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url,
    countryCode: row.country_code,
    locationLabel: row.location_label,
    mapboxId: row.mapbox_id,
    latitude: row.latitude,
    longitude: row.longitude,
    offersRemote: row.offers_remote ?? false,
    offersInHome: row.offers_in_home ?? false,
    offersProviderLocation: row.offers_provider_location ?? false,
    specialties: row.specialties ?? [],
    services,
  }
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
  const mapboxId = typeof o.mapboxId === 'string' ? o.mapboxId.trim() : ''
  if (!mapboxId) {
    return { ok: false, message: 'location.mapboxId is required' }
  }
  const lat = o.latitude
  const lng = o.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: 'location.latitude and location.longitude must be finite numbers' }
  }

  let ancestorMapboxIds: string[] = []
  const anc = o.ancestorMapboxIds
  if (anc === undefined || anc === null) {
    ancestorMapboxIds = []
  } else if (!Array.isArray(anc)) {
    return { ok: false, message: 'location.ancestorMapboxIds must be an array of strings' }
  } else {
    for (const item of anc) {
      if (typeof item === 'string' && item.length > 0) {
        ancestorMapboxIds.push(item)
      }
    }
  }

  return {
    ok: true,
    location: {
      mapboxId,
      latitude: lat,
      longitude: lng,
      ancestorMapboxIds,
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await supabase
    .from('professional_search_cards_enriched')
    .select(
      'professional_id,first_name,last_name,profile_photo_url,country_code,location_label,mapbox_id,latitude,longitude,offers_remote,offers_in_home,offers_provider_location,specialties,services',
    )

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const rows = (data ?? []) as ProfessionalSearchCardRow[]
  const cards = rows
    .map((row) => toSearchCard(row, location, specialtyLabel))
    .filter((card): card is SearchCard => {
      if (card === null) return false
      if (location !== null && card.services.length === 0) return false
      return true
    })

  return jsonResponse({ cards })
})
