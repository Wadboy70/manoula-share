export const PROFILE_LIMITS = {
  firstNameMax: 80,
  lastNameMax: 80,
  bioMax: 300,
  specialtyMax: 120,
  locationMax: 160,
  mapboxIdMax: 255,
  credentialTypeMax: 120,
  issuingBodyMax: 160,
  registrationNumberMax: 80,
  profilePhotoUrlMax: 2048,
  maxPhotoBytes: 3 * 1024 * 1024,
} as const

export const ALLOWED_PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

export function normalizePlainText(
  value: string,
  maxLength: number,
  options?: { collapse?: boolean },
): string {
  const stripped = stripHtmlTags(value).split('\0').join('')
  const normalized = options?.collapse === false ? stripped.trim() : collapseWhitespace(stripped)
  return normalized.slice(0, maxLength)
}

export function lengthOverLimitMessage(label: string, currentLength: number, max: number): string {
  return `${label} must be ${max} characters or fewer (you have ${currentLength}).`
}

const LEGAL_NAME_REGEX = /^[\p{L}\p{M}.' -]+$/u

export function legalNameCharacterMessage(label: string, value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (LEGAL_NAME_REGEX.test(trimmed)) return null
  return `${label} can only include letters, spaces, apostrophes, hyphens, and periods.`
}

export function isPhotoFileAllowed(file: File): { ok: boolean; message?: string } {
  if (!ALLOWED_PHOTO_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      message: 'Only JPG, PNG, and WebP images are supported.',
    }
  }
  if (file.size > PROFILE_LIMITS.maxPhotoBytes) {
    return {
      ok: false,
      message: 'Image must be 3 MB or smaller.',
    }
  }
  return { ok: true }
}
