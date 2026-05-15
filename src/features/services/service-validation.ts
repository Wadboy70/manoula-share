import type { ServiceAreaPlaceInput, ServiceDraft, ServiceProviderLocationInput } from './service.types'

export const SERVICE_LIMITS = {
  titleMax: 120,
  descriptionMax: 1200,
  currencyCodeLen: 3,
  remoteScopeMax: 32,
  serviceAreaTextMax: 300,
  locationLabelMax: 160,
  placeIdMax: 2048,
  locationNameMax: 160,
  maxLocationsPerService: 25,
  /** Max Geoapify ancestor ids stored per location row (defensive cap). */
  maxAncestorPlaceIdsPerRow: 48,
} as const

const GBP_PRICE_REGEX = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

export function normalizePlainText(value: string, maxLength: number): string {
  const stripped = stripHtmlTags(value).split('\0').join('')
  return collapseWhitespace(stripped).slice(0, maxLength)
}

function normalizeAncestorPlaceIdList(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const id = normalizePlainText(item, SERVICE_LIMITS.placeIdMax)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= SERVICE_LIMITS.maxAncestorPlaceIdsPerRow) break
  }
  return out
}

function normalizeLocation(input: ServiceProviderLocationInput): ServiceProviderLocationInput {
  return {
    ...input,
    locationName: normalizePlainText(input.locationName, SERVICE_LIMITS.locationNameMax),
    locationLabel: normalizePlainText(input.locationLabel, SERVICE_LIMITS.locationLabelMax),
    placeId: normalizePlainText(input.placeId, SERVICE_LIMITS.placeIdMax),
    ancestorPlaceIds: normalizeAncestorPlaceIdList(input.ancestorPlaceIds),
    countryCode: normalizePlainText(input.countryCode, SERVICE_LIMITS.currencyCodeLen).toUpperCase(),
  }
}

function normalizeAreaPlace(input: ServiceAreaPlaceInput): ServiceAreaPlaceInput {
  return {
    ...input,
    locationLabel: normalizePlainText(input.locationLabel, SERVICE_LIMITS.locationLabelMax),
    placeId: normalizePlainText(input.placeId, SERVICE_LIMITS.placeIdMax),
    ancestorPlaceIds: normalizeAncestorPlaceIdList(input.ancestorPlaceIds),
    countryCode: normalizePlainText(input.countryCode, SERVICE_LIMITS.currencyCodeLen).toUpperCase(),
  }
}

export function sanitizeServiceDraft(raw: ServiceDraft): ServiceDraft {
  return {
    ...raw,
    title: normalizePlainText(raw.title, SERVICE_LIMITS.titleMax),
    description: normalizePlainText(raw.description, SERVICE_LIMITS.descriptionMax),
    currencyCode: normalizePlainText(raw.currencyCode, SERVICE_LIMITS.currencyCodeLen).toUpperCase(),
    serviceAreaText: normalizePlainText(raw.serviceAreaText, SERVICE_LIMITS.serviceAreaTextMax),
    providerLocations: raw.providerLocations
      .slice(0, SERVICE_LIMITS.maxLocationsPerService)
      .map(normalizeLocation),
    serviceAreaPlaces: raw.serviceAreaPlaces
      .slice(0, SERVICE_LIMITS.maxLocationsPerService)
      .map(normalizeAreaPlace),
  }
}

export function lengthOverLimitMessage(label: string, currentLength: number, max: number): string {
  return `${label} must be ${max} characters or fewer (you have ${currentLength}).`
}

export function normalizePriceInput(value: string): string {
  return value.trim().replace(/^£\s*/, '').replace(/,/g, '')
}

export function isValidGbpPriceInput(value: string): boolean {
  const normalized = normalizePriceInput(value)
  if (normalized.length === 0) return true
  return GBP_PRICE_REGEX.test(normalized)
}

export function parseGbpPriceInputToCents(value: string): number | null {
  const normalized = normalizePriceInput(value)
  if (normalized.length === 0) return null
  if (!GBP_PRICE_REGEX.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}

export function formatCentsToGbpPriceInput(cents: number | null): string {
  if (cents === null) return ''
  if (!Number.isFinite(cents)) return ''
  const pounds = cents / 100
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2)
}
